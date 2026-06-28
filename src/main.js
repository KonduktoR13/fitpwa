import "./styles.css";

const STORAGE_KEY = "training-log-pwa-state-v1";
const categories = [
  ["push", "Жим"],
  ["pull", "Тяга"],
  ["legs", "Ноги"],
  ["core", "Кор"],
  ["cardio", "Кардио"],
  ["other", "Другое"]
];
const equipment = [
  ["barbell", "Штанга"],
  ["dumbbell", "Гантели"],
  ["machine", "Тренажер"],
  ["cable", "Блок"],
  ["smith", "Смит"],
  ["bodyweight", "Свой вес"],
  ["cardio", "Кардио"],
  ["other", "Другое"]
];
const seedExercises = [
  ["Жим лёжа", "push", "barbell", "🏋️"],
  ["Тяга горизонтального блока", "pull", "cable", "↔️"],
  ["Жим гантелей сидя", "push", "dumbbell", "💪"],
  ["Кроссовер", "push", "cable", "✳️"],
  ["Трицепс на блоке", "push", "cable", "⬇️"],
  ["Присед в смитте", "legs", "smith", "🦵"],
  ["Румынская тяга", "legs", "dumbbell", "〽️"],
  ["Выпады с гантелями", "legs", "dumbbell", "🚶"],
  ["Тяга вертикального блока", "pull", "cable", "⬇️"],
  ["Пресс", "core", "bodyweight", "◼️"],
  ["Тяга гантели в наклоне", "pull", "dumbbell", "↙️"],
  ["Разведения гантелей в стороны", "pull", "dumbbell", "↔️"],
  ["Бицепс с гантелями", "pull", "dumbbell", "💪"],
  ["Face pull", "pull", "cable", "🎯"]
];

let state = loadState();
let route = { name: "home" };
let draftSet = { weight: "", reps: "8", reserve: 2, warmup: false };
let exerciseFormOpen = false;
let chartRefs = [];
let activeSetField = "weight";
let nativeKeyboard = false;
let editingSetId = null;
let lastTouchedSetId = null;
let waitingServiceWorker = null;

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return { exercises: [], sets: [], ...parsed };
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  const now = Date.now();
  return {
    exercises: seedExercises.map(([name, category, equipmentType, icon], index) => ({
      id: uid(),
      name,
      category,
      equipmentType,
      icon,
      image: "",
      createdAt: now + index
    })),
    sets: [],
    settings: { unit: "кг" }
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setRoute(next) {
  route = next;
  window.scrollTo({ top: 0, behavior: "instant" });
  render();
}

function label(list, key) {
  return list.find(([value]) => value === key)?.[1] || "Другое";
}

function formatWeight(value) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1).replace(".", ",");
}

function formatDateTime(ts) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(ts));
}

function formatDate(ts) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" }).format(new Date(ts));
}

function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function e1rm(set) {
  return set.weight * (1 + set.reps / 30);
}

function reserveValue(set) {
  if (set.reserve != null) return set.reserve;
  if (set.effort == null) return 0;
  return Math.max(0, Math.min(10, 10 - set.effort));
}

function reserveName(value) {
  if (value <= 0) return "0, отказ";
  if (value <= 1) return "1 в запасе";
  if (value <= 3) return `${value} в запасе`;
  if (value <= 6) return "много запаса";
  return "очень легко";
}

function reserveColor(value) {
  const hue = 6 + Math.max(0, Math.min(10, value)) * 13;
  return `hsl(${hue} 63% 42%)`;
}

function adjustedScore(set) {
  const base = e1rm(set);
  const reserveBonus = 1 + Math.min(6, Math.max(0, reserveValue(set))) * 0.012;
  const warmupPenalty = set.warmup ? 0.72 : 1;
  return base * reserveBonus * warmupPenalty;
}

function setsForExercise(exerciseId) {
  return state.sets
    .filter((set) => set.exerciseId === exerciseId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

function groupSetsByWorkout(sets) {
  const groups = new Map();
  sets.forEach((set) => {
    const key = `${dayKey(set.createdAt)}-${set.exerciseId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(set);
  });
  return [...groups.values()].map((items) => items.sort((a, b) => a.createdAt - b.createdAt));
}

function sessionMetrics(items) {
  const work = items.filter((set) => !set.warmup);
  const source = work.length ? work : items;
  const top = source.reduce((best, set) => (adjustedScore(set) > adjustedScore(best || set) ? set : best), source[0]);
  const tonnage = work.reduce((sum, set) => sum + set.weight * set.reps, 0);
  const pureE1rm = top ? e1rm(top) : 0;
  const score = top ? adjustedScore(top) : 0;
  const avgReserve = source.reduce((sum, set) => sum + reserveValue(set), 0) / Math.max(1, source.length);
  const fatigue = work.length >= 2 ? Math.max(0, adjustedScore(work[0]) - adjustedScore(work[work.length - 1])) : null;
  return { date: items[0]?.createdAt || Date.now(), count: items.length, workCount: work.length, top, tonnage, pureE1rm, score, avgReserve, fatigue };
}

function progressForExercise(exerciseId) {
  return groupSetsByWorkout(setsForExercise(exerciseId)).map(sessionMetrics);
}

function latestExerciseStats(exerciseId) {
  const sessions = progressForExercise(exerciseId);
  const last = sessions.at(-1);
  const prev = sessions.at(-2);
  const best = sessions.reduce((acc, item) => (item.score > (acc?.score || 0) ? item : acc), null);
  return { sessions, last, prev, best };
}

function trendText(last, prev, suffix = "") {
  if (!last || !prev) return "Нужна ещё одна тренировка";
  const delta = last - prev;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${formatWeight(delta)}${suffix} к прошлому разу`;
}

function iconHtml(exercise) {
  if (exercise.image) return `<img src="${exercise.image}" alt="" />`;
  return `<span>${exercise.icon || "🏋️"}</span>`;
}

function render() {
  chartRefs = [];
  const app = document.querySelector("#app");
  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <button class="brand" data-action="home" aria-label="На главную">
          <span class="brand-mark">Ж</span>
          <span><strong>Силовой журнал</strong><small>локально на устройстве</small></span>
        </button>
        <button class="install-button" data-action="install" hidden>Установить</button>
      </header>
      <main>${renderRoute()}</main>
      <nav class="bottom-nav">
        <button class="${route.name === "home" ? "active" : ""}" data-action="home">Упражнения</button>
        <button class="${route.name === "progress" ? "active" : ""}" data-action="progress">Прогресс</button>
        <button class="${route.name === "history" ? "active" : ""}" data-action="history">История</button>
      </nav>
    </div>
  `;
  bindEvents(app);
  drawCharts();
}

function renderRoute() {
  if (route.name === "exercise") return renderExercise(route.id);
  if (route.name === "progress") return renderProgress(route.id);
  if (route.name === "history") return renderHistory();
  return renderHome();
}

function renderHome() {
  const totalSets = state.sets.length;
  const trainedToday = state.sets.filter((set) => dayKey(set.createdAt) === dayKey(Date.now())).length;
  const grouped = categories.map(([key, title]) => [key, title, state.exercises.filter((item) => item.category === key)]);
  return `
    <section class="hero">
      <div>
        <p class="eyebrow">Ручной режим</p>
        <h1>Выбери упражнение и записывай подходы по факту</h1>
      </div>
      <div class="hero-stats">
        <div><strong>${state.exercises.length}</strong><span>упражнений</span></div>
        <div><strong>${totalSets}</strong><span>подходов</span></div>
        <div><strong>${trainedToday}</strong><span>сегодня</span></div>
      </div>
    </section>
    <section class="toolbar">
      <input type="search" id="search" placeholder="Найти упражнение" autocomplete="off" />
      <button class="primary" data-action="toggle-form">Новое</button>
    </section>
    ${exerciseFormOpen ? renderExerciseForm() : ""}
    <section class="exercise-groups">
      ${grouped
        .filter(([, , items]) => items.length)
        .map(([, title, items]) => `
          <div class="group">
            <h2>${title}</h2>
            <div class="exercise-list">
              ${items.map(renderExerciseCard).join("")}
            </div>
          </div>
        `)
        .join("")}
    </section>
  `;
}

function renderExerciseCard(exercise) {
  const { last, prev, sessions } = latestExerciseStats(exercise.id);
  const setCount = setsForExercise(exercise.id).length;
  const delta = last && prev ? last.score - prev.score : null;
  const deltaClass = delta == null ? "" : delta >= 0 ? "good" : "bad";
  return `
    <article class="exercise-card" data-open-exercise="${exercise.id}">
      <div class="exercise-icon">${iconHtml(exercise)}</div>
      <div class="exercise-main">
        <h3>${exercise.name}</h3>
        <p>${label(equipment, exercise.equipmentType)} · ${sessions.length} трен. · ${setCount} подх.</p>
      </div>
      <div class="exercise-score ${deltaClass}">
        <strong>${last ? formatWeight(last.score) : "—"}</strong>
        <span>${delta == null ? "нет сравнения" : trendText(last.score, prev.score)}</span>
      </div>
    </article>
  `;
}

function renderExerciseForm(exercise = null) {
  return `
    <form class="panel exercise-form" data-form="exercise">
      <h2>${exercise ? "Редактировать упражнение" : "Новое упражнение"}</h2>
      <div class="form-grid">
        <label>Название<input name="name" required value="${exercise?.name || ""}" /></label>
        <label>Иконка<input name="icon" maxlength="4" value="${exercise?.icon || "🏋️"}" /></label>
        <label>Группа<select name="category">${categories.map(([k, v]) => `<option value="${k}" ${exercise?.category === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        <label>Оборудование<select name="equipmentType">${equipment.map(([k, v]) => `<option value="${k}" ${exercise?.equipmentType === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        <label class="wide">Своя картинка<input type="file" name="image" accept="image/*" /></label>
      </div>
      <div class="actions">
        <button class="primary" type="submit">${exercise ? "Сохранить" : "Добавить"}</button>
        <button type="button" data-action="toggle-form">Закрыть</button>
      </div>
    </form>
  `;
}

function renderExercise(exerciseId) {
  const exercise = state.exercises.find((item) => item.id === exerciseId);
  if (!exercise) return `<section class="panel"><h1>Упражнение не найдено</h1></section>`;
  const allSets = setsForExercise(exerciseId);
  const todaySets = allSets.filter((set) => dayKey(set.createdAt) === dayKey(Date.now()));
  const sessions = progressForExercise(exerciseId);
  const last = sessions.at(-1);
  const previous = sessions.at(-2);
  const editingSet = state.sets.find((set) => set.id === editingSetId && set.exerciseId === exerciseId);
  const formValues = editingSet
    ? {
        weight: String(editingSet.weight),
        reps: String(editingSet.reps),
        reserve: reserveValue(editingSet),
        warmup: editingSet.warmup
      }
    : draftSet;
  if (!draftSet.weight && allSets.at(-1)) {
    draftSet.weight = String(allSets.at(-1).weight);
    draftSet.reps = String(allSets.at(-1).reps);
    draftSet.reserve = reserveValue(allSets.at(-1));
  }
  return `
    <section class="exercise-header">
      <button data-action="home" class="ghost">← Назад</button>
      <div class="exercise-title">
        <div class="exercise-icon large">${iconHtml(exercise)}</div>
        <div><h1>${exercise.name}</h1><p>${label(categories, exercise.category)} · ${label(equipment, exercise.equipmentType)}</p></div>
      </div>
      <button data-action="edit-exercise" data-id="${exercise.id}">Править</button>
    </section>
    <section class="metrics-row">
      <div><span>Сегодня</span><strong>${todaySets.length}</strong></div>
      <div><span>Лучший индекс</span><strong>${last ? formatWeight(Math.max(...sessions.map((s) => s.score))) : "—"}</strong></div>
      <div><span>Динамика</span><strong>${last && previous ? trendText(last.score, previous.score) : "—"}</strong></div>
    </section>
    <form class="set-entry ${editingSet ? "editing" : ""}" data-form="set" data-id="${exercise.id}">
      ${editingSet ? `<div class="edit-banner"><strong>Редактирование подхода</strong><button type="button" data-action="cancel-edit">Отмена</button></div>` : ""}
      <div class="quick-row">
        ${allSets.at(-1) ? `<button type="button" data-action="repeat-last" data-weight="${allSets.at(-1).weight}" data-reps="${allSets.at(-1).reps}" data-reserve="${reserveValue(allSets.at(-1))}">Повторить последний: ${formatWeight(allSets.at(-1).weight)} × ${allSets.at(-1).reps}</button>` : ""}
        ${previous ? `<button type="button" data-action="repeat-best" data-weight="${previous.top.weight}" data-reps="${previous.top.reps}" data-reserve="${reserveValue(previous.top)}">Лучший прошлый: ${formatWeight(previous.top.weight)} × ${previous.top.reps}</button>` : ""}
      </div>
      <div class="input-pair">
        <label class="number-control">
          <span>Вес вместе со штангой</span>
          <div>
            <button type="button" data-step-field="weight" data-delta="-2.5">−</button>
            <input inputmode="none" name="weight" min="1" required value="${formValues.weight}" placeholder="80" ${nativeKeyboard ? "" : "readonly"} data-set-field="weight" class="${activeSetField === "weight" ? "active" : ""}" />
            <button type="button" data-step-field="weight" data-delta="2.5">+</button>
          </div>
        </label>
        <label class="number-control">
          <span>Повторы</span>
          <div>
            <button type="button" data-step-field="reps" data-delta="-1">−</button>
            <input inputmode="none" name="reps" min="1" required value="${formValues.reps}" placeholder="8" ${nativeKeyboard ? "" : "readonly"} data-set-field="reps" class="${activeSetField === "reps" ? "active" : ""}" />
            <button type="button" data-step-field="reps" data-delta="1">+</button>
          </div>
        </label>
      </div>
      ${renderKeypad()}
      <label class="effort-label">
        <span>Запас повторов: <strong id="reserveText">${reserveName(formValues.reserve)}</strong></span>
        <input class="effort-slider" type="range" name="reserve" min="0" max="10" value="${formValues.reserve}" />
      </label>
      <label class="warmup-toggle"><input type="checkbox" name="warmup" ${formValues.warmup ? "checked" : ""} /> Разминка</label>
      <button class="primary save-set" type="submit">${editingSet ? "Сохранить изменения" : "Записать подход"}</button>
    </form>
    <section class="panel">
      <div class="section-head"><h2>Подходы сегодня</h2><span>${formatDate(Date.now())}</span></div>
      ${todaySets.length ? `<div class="sets-list">${todaySets.map(renderSetRow).join("")}</div>` : `<p class="muted">Сегодня по этому упражнению ещё нет подходов.</p>`}
    </section>
    <section class="panel">
      <div class="section-head"><h2>Прогресс упражнения</h2><button data-action="progress-exercise" data-id="${exercise.id}">Подробнее</button></div>
      ${renderMiniProgress(exercise.id)}
    </section>
  `;
}

function renderSetRow(set) {
  return `
    <div class="set-row ${set.id === lastTouchedSetId ? "just-saved" : ""}" data-action="edit-set" data-id="${set.id}">
      <strong>${formatWeight(set.weight)} кг × ${set.reps}</strong>
      <span>${set.warmup ? "Разминка" : "Рабочий"} · ${reserveName(reserveValue(set))} · ${formatDateTime(set.createdAt)}</span>
      <div class="set-actions">
        <button data-action="edit-set" data-id="${set.id}" aria-label="Редактировать подход">✎</button>
        <button data-action="delete-set" data-id="${set.id}" aria-label="Удалить подход">×</button>
      </div>
    </div>
  `;
}

function renderKeypad() {
  const decimalDisabled = activeSetField === "reps" ? "disabled" : "";
  return `
    <div class="keypad" aria-label="Цифровой ввод">
      ${["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((key) => `<button type="button" data-key="${key}">${key}</button>`).join("")}
      <button type="button" data-key="clear">C</button>
      <button type="button" data-key="0">0</button>
      <button type="button" data-key="dot" ${decimalDisabled}>,</button>
      <button type="button" data-key="back" class="wide-key">⌫</button>
      <button type="button" data-action="toggle-keyboard" class="wide-key ${nativeKeyboard ? "active" : ""}">${nativeKeyboard ? "Скрыть клавиатуру" : "Клавиатура"}</button>
    </div>
  `;
}

function renderMiniProgress(exerciseId) {
  const sessions = progressForExercise(exerciseId);
  if (sessions.length < 1) return `<p class="muted">Запишите хотя бы один подход.</p>`;
  const id = `chart-${chartRefs.length}`;
  chartRefs.push({ id, values: sessions.map((s) => s.score), labels: sessions.map((s) => formatDate(s.date)), type: "line" });
  return `<canvas class="chart" id="${id}" height="190"></canvas>`;
}

function renderProgress(selectedId = state.exercises[0]?.id) {
  const selected = state.exercises.find((item) => item.id === selectedId) || state.exercises[0];
  if (!selected) return `<section class="panel"><h1>Нет упражнений</h1></section>`;
  const sessions = progressForExercise(selected.id);
  const last = sessions.at(-1);
  const previous = sessions.at(-2);
  const scoreChart = `chart-${chartRefs.length}`;
  chartRefs.push({ id: scoreChart, values: sessions.map((s) => s.score), labels: sessions.map((s) => formatDate(s.date)), type: "line" });
  const volumeChart = `chart-${chartRefs.length}`;
  chartRefs.push({ id: volumeChart, values: sessions.map((s) => s.tonnage), labels: sessions.map((s) => formatDate(s.date)), type: "bar" });
  const fatigueValues = sessions.map((s) => s.fatigue).filter((v) => v != null);
  const fatigueChart = `chart-${chartRefs.length}`;
  chartRefs.push({ id: fatigueChart, values: fatigueValues, labels: sessions.filter((s) => s.fatigue != null).map((s) => formatDate(s.date)), type: "line", invert: true });
  return `
    <section class="progress-top">
      <h1>Прогресс</h1>
      <select data-action="select-progress">
        ${state.exercises.map((item) => `<option value="${item.id}" ${item.id === selected.id ? "selected" : ""}>${item.name}</option>`).join("")}
      </select>
    </section>
    <section class="insight-grid">
      <div class="insight"><span>Индекс формы</span><strong>${last ? formatWeight(last.score) : "—"}</strong><p>${last && previous ? trendText(last.score, previous.score) : "Нужна история"}</p></div>
      <div class="insight"><span>Оценочный 1ПМ</span><strong>${last ? `${formatWeight(last.pureE1rm)} кг` : "—"}</strong><p>Сравнивает разные веса и повторы</p></div>
      <div class="insight"><span>Рабочий объём</span><strong>${last ? formatWeight(last.tonnage) : "—"}</strong><p>Килограммы × повторы за тренировку</p></div>
      <div class="insight"><span>Средний запас</span><strong>${last ? formatWeight(last.avgReserve) : "—"}</strong><p>Больше при той же работе = лучше</p></div>
    </section>
    <section class="panel"><h2>Индекс формы</h2>${sessions.length ? `<canvas class="chart" id="${scoreChart}" height="220"></canvas>` : `<p class="muted">Нет данных.</p>`}</section>
    <section class="panel"><h2>Рабочий объём</h2>${sessions.length ? `<canvas class="chart" id="${volumeChart}" height="220"></canvas>` : `<p class="muted">Нет данных.</p>`}</section>
    <section class="panel"><h2>Падение по подходам</h2>${fatigueValues.length ? `<canvas class="chart" id="${fatigueChart}" height="220"></canvas>` : `<p class="muted">Появится, когда в тренировке будет два рабочих подхода.</p>`}</section>
    <section class="panel">
      <h2>Последние тренировки</h2>
      ${sessions.length ? `<div class="session-list">${sessions.slice(-6).reverse().map(renderSessionSummary).join("")}</div>` : `<p class="muted">Нет данных.</p>`}
    </section>
  `;
}

function renderSessionSummary(session) {
  const pr = session.score === Math.max(...progressForExercise(session.top.exerciseId).map((item) => item.score));
  return `
    <article class="session-summary">
      <div>
        <strong>${formatDate(session.date)}${pr ? " · лучший" : ""}</strong>
        <span>${session.count} подх. · запас ${formatWeight(session.avgReserve)}</span>
      </div>
      <div>
        <strong>${formatWeight(session.top.weight)} кг × ${session.top.reps}</strong>
        <span>${formatWeight(session.score)} индекс · ${formatWeight(session.tonnage)} объём</span>
      </div>
    </article>
  `;
}

function renderHistory() {
  const byDate = new Map();
  state.sets
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach((set) => {
      const key = dayKey(set.createdAt);
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key).push(set);
    });
  return `
    <section class="progress-top"><h1>История</h1><button data-action="export">Экспорт JSON</button></section>
    ${state.sets.length ? [...byDate.entries()].map(([, items]) => renderHistoryDay(items)).join("") : `<section class="panel"><p class="muted">История пока пустая.</p></section>`}
  `;
}

function renderHistoryDay(items) {
  const title = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", weekday: "long" }).format(new Date(items[0].createdAt));
  const groups = groupSetsByWorkout(items);
  return `
    <section class="panel history-day">
      <h2>${title}</h2>
      ${groups.map((sets) => {
        const exercise = state.exercises.find((item) => item.id === sets[0].exerciseId);
        return `
          <article class="history-exercise">
            <div class="section-head"><h3>${exercise?.name || "Удалённое упражнение"}</h3><span>${sets.length} подх.</span></div>
            <div class="sets-list">${sets.map(renderSetRow).join("")}</div>
          </article>
        `;
      }).join("")}
    </section>
  `;
}

function bindEvents(root) {
  root.querySelectorAll("[data-action='home']").forEach((button) => button.addEventListener("click", () => setRoute({ name: "home" })));
  root.querySelectorAll("[data-action='progress']").forEach((button) => button.addEventListener("click", () => setRoute({ name: "progress" })));
  root.querySelectorAll("[data-action='history']").forEach((button) => button.addEventListener("click", () => setRoute({ name: "history" })));
  root.querySelector("[data-action='toggle-form']")?.addEventListener("click", () => {
    exerciseFormOpen = !exerciseFormOpen;
    render();
  });
  root.querySelectorAll("[data-open-exercise]").forEach((card) => card.addEventListener("click", () => {
    draftSet = { weight: "", reps: "8", reserve: 2, warmup: false };
    setRoute({ name: "exercise", id: card.dataset.openExercise });
  }));
  root.querySelector("#search")?.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    root.querySelectorAll(".exercise-card").forEach((card) => {
      card.hidden = query && !card.innerText.toLowerCase().includes(query);
    });
  });
  root.querySelector("[data-form='exercise']")?.addEventListener("submit", saveExercise);
  root.querySelector("[data-form='set']")?.addEventListener("submit", saveSet);
  root.querySelector("[name='reserve']")?.addEventListener("input", (event) => {
    if (!editingSetId) draftSet.reserve = Number(event.target.value);
    root.querySelector("#reserveText").textContent = reserveName(Number(event.target.value));
    event.target.style.setProperty("--thumb-color", reserveColor(Number(event.target.value)));
  });
  root.querySelectorAll("[data-set-field]").forEach((input) => {
    input.addEventListener("focus", () => {
      activeSetField = input.dataset.setField;
      render();
    });
    input.addEventListener("click", () => {
      activeSetField = input.dataset.setField;
      render();
    });
    input.addEventListener("input", () => {
      if (!editingSetId) draftSet[input.dataset.setField] = input.value;
    });
  });
  root.querySelectorAll("[data-step-field]").forEach((button) => button.addEventListener("click", () => {
    const input = root.querySelector(`[name='${button.dataset.stepField}']`);
    const current = Number(String(input.value || 0).replace(",", "."));
    const next = Math.max(button.dataset.stepField === "weight" ? 1 : 1, current + Number(button.dataset.delta));
    input.value = button.dataset.stepField === "weight" ? formatWeight(next).replace(",", ".") : String(Math.round(next));
    if (!editingSetId) draftSet[button.dataset.stepField] = input.value;
  }));
  root.querySelectorAll("[data-key]").forEach((button) => button.addEventListener("click", () => handleKeypad(button.dataset.key)));
  root.querySelector("[data-action='toggle-keyboard']")?.addEventListener("click", () => {
    nativeKeyboard = !nativeKeyboard;
    render();
  });
  root.querySelectorAll("[data-action='repeat-last'], [data-action='repeat-best']").forEach((button) => button.addEventListener("click", () => {
    const form = root.querySelector("[data-form='set']");
    form.elements.weight.value = button.dataset.weight;
    form.elements.reps.value = button.dataset.reps;
    form.elements.reserve.value = button.dataset.reserve;
    draftSet = { ...draftSet, weight: button.dataset.weight, reps: button.dataset.reps, reserve: Number(button.dataset.reserve) };
    root.querySelector("#reserveText").textContent = reserveName(draftSet.reserve);
  }));
  root.querySelectorAll("[data-action='delete-set']").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    deleteSet(button.dataset.id);
  }));
  root.querySelectorAll("[data-action='edit-set']").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    startEditSet(button.dataset.id);
  }));
  root.querySelector("[data-action='cancel-edit']")?.addEventListener("click", () => {
    editingSetId = null;
    render();
  });
  root.querySelectorAll("[data-action='progress-exercise']").forEach((button) => button.addEventListener("click", () => setRoute({ name: "progress", id: button.dataset.id })));
  root.querySelector("[data-action='select-progress']")?.addEventListener("change", (event) => setRoute({ name: "progress", id: event.target.value }));
  root.querySelector("[data-action='edit-exercise']")?.addEventListener("click", (event) => openEditDialog(event.currentTarget.dataset.id));
  root.querySelector("[data-action='export']")?.addEventListener("click", exportJson);
}

function handleKeypad(key) {
  const field = activeSetField === "reps" ? "reps" : "weight";
  const form = document.querySelector("[data-form='set']");
  let value = String(form?.elements[field]?.value || draftSet[field] || "");
  if (key === "clear") value = "";
  else if (key === "back") value = value.slice(0, -1);
  else if (key === "dot") {
    if (field === "weight" && !value.includes(".")) value = value ? `${value}.` : "0.";
  } else if (/^\d$/.test(key)) {
    if (field === "reps") {
      value = `${value}${key}`.replace(/^0+(?=\d)/, "").slice(0, 3);
    } else {
      const next = `${value}${key}`;
      const [whole, fraction = ""] = next.split(".");
      value = `${whole.slice(0, 3)}${next.includes(".") ? `.${fraction.slice(0, 1)}` : ""}`;
    }
  }
  if (form) {
    form.elements[field].value = value;
    if (!editingSetId) draftSet[field] = value;
  } else {
    draftSet[field] = value;
  }
}

async function saveExercise(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const file = data.get("image");
  const image = file && file.size ? await fileToDataUrl(file) : "";
  state.exercises.push({
    id: uid(),
    name: String(data.get("name")).trim(),
    icon: String(data.get("icon")).trim() || "🏋️",
    image,
    category: data.get("category"),
    equipmentType: data.get("equipmentType"),
    createdAt: Date.now()
  });
  exerciseFormOpen = false;
  saveState();
  render();
}

function saveSet(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const weight = Number(String(data.get("weight")).replace(",", "."));
  const reps = Number(data.get("reps"));
  if (!Number.isFinite(weight) || weight <= 0 || !Number.isInteger(reps) || reps <= 0) return;
  const reserve = Number(data.get("reserve"));
  const existing = state.sets.find((set) => set.id === editingSetId);
  if (existing) {
    existing.weight = weight;
    existing.reps = reps;
    existing.reserve = reserve;
    delete existing.effort;
    existing.warmup = data.get("warmup") === "on";
    existing.updatedAt = Date.now();
    lastTouchedSetId = existing.id;
    editingSetId = null;
  } else {
    const id = uid();
    state.sets.push({
      id,
      exerciseId: form.dataset.id,
      weight,
      reps,
      reserve,
      warmup: data.get("warmup") === "on",
      createdAt: Date.now()
    });
    lastTouchedSetId = id;
    draftSet = { weight: String(weight), reps: String(reps), reserve, warmup: false };
  }
  saveState();
  render();
}

function deleteSet(id) {
  state.sets = state.sets.filter((set) => set.id !== id);
  if (editingSetId === id) editingSetId = null;
  saveState();
  render();
}

function startEditSet(id) {
  const set = state.sets.find((item) => item.id === id);
  if (!set) return;
  editingSetId = id;
  activeSetField = "weight";
  lastTouchedSetId = id;
  render();
}

function openEditDialog(id) {
  const exercise = state.exercises.find((item) => item.id === id);
  if (!exercise) return;
  const name = prompt("Название упражнения", exercise.name);
  if (name == null) return;
  const icon = prompt("Иконка или символ", exercise.icon || "🏋️");
  exercise.name = name.trim() || exercise.name;
  exercise.icon = icon?.trim() || exercise.icon;
  saveState();
  render();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `training-log-${dayKey(Date.now())}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function drawCharts() {
  chartRefs.forEach(({ id, values, labels, type, invert }) => {
    const canvas = document.getElementById(id);
    if (!canvas || !values.length) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(320, rect.width) * dpr;
    canvas.height = Number(canvas.getAttribute("height")) * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    drawChart(ctx, rect.width, Number(canvas.getAttribute("height")), values, labels, type, invert);
  });
}

function drawChart(ctx, width, height, values, labels, type, invert = false) {
  const pad = { l: 48, r: 18, t: 18, b: 30 };
  const chartW = width - pad.l - pad.r;
  const chartH = height - pad.t - pad.b;
  const max = Math.max(...values, 1);
  const min = type === "bar" ? 0 : Math.min(...values);
  const range = max - min || 1;
  ctx.clearRect(0, 0, width, height);
  ctx.font = "12px system-ui";
  ctx.strokeStyle = "#d6ddd6";
  ctx.fillStyle = "#69736c";
  for (let i = 0; i < 5; i += 1) {
    const y = pad.t + (chartH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(width - pad.r, y);
    ctx.stroke();
    ctx.fillText(formatWeight(max - (range * i) / 4), 4, y + 4);
  }
  const good = values.length < 2 || (invert ? values.at(-1) <= values.at(-2) : values.at(-1) >= values.at(-2));
  const color = good ? "#1d775d" : "#c8543f";
  if (type === "bar") {
    const slot = chartW / values.length;
    values.forEach((value, index) => {
      const barH = ((value - min) / range) * chartH;
      const x = pad.l + slot * index + slot * 0.18;
      const y = pad.t + chartH - barH;
      ctx.fillStyle = index === values.length - 1 ? "#d99a32" : "#315d4f";
      ctx.fillRect(x, y, slot * 0.64, barH);
    });
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    values.forEach((value, index) => {
      const x = pad.l + (chartW * index) / Math.max(1, values.length - 1);
      const y = pad.t + chartH - ((value - min) / range) * chartH;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    values.forEach((value, index) => {
      const x = pad.l + (chartW * index) / Math.max(1, values.length - 1);
      const y = pad.t + chartH - ((value - min) / range) * chartH;
      ctx.fillStyle = index === values.length - 1 ? "#f4f7f2" : color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }
  ctx.fillStyle = "#69736c";
  labels.forEach((label, index) => {
    if (index !== 0 && index !== labels.length - 1 && index % Math.ceil(labels.length / 4) !== 0) return;
    const x = pad.l + (chartW * index) / Math.max(1, labels.length - 1);
    ctx.fillText(label, x - 14, height - 8);
  });
}

let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  document.querySelector(".install-button")?.removeAttribute("hidden");
});
document.addEventListener("click", async (event) => {
  if (!event.target.matches("[data-action='install']") || !deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt = null;
});
window.addEventListener("resize", drawCharts);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", registerServiceWorker);
}

render();

async function registerServiceWorker() {
  const registration = await navigator.serviceWorker.register("./sw.js");

  if (registration.waiting) {
    showUpdatePrompt(registration.waiting);
  }

  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        showUpdatePrompt(worker);
      }
    });
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  setInterval(() => registration.update(), 60_000);
}

function showUpdatePrompt(worker) {
  waitingServiceWorker = worker;
  let prompt = document.querySelector(".update-prompt");
  if (!prompt) {
    prompt = document.createElement("div");
    prompt.className = "update-prompt";
    prompt.innerHTML = `
      <span>Доступна новая версия</span>
      <button type="button">Обновить</button>
    `;
    document.body.append(prompt);
    prompt.querySelector("button").addEventListener("click", () => {
      waitingServiceWorker?.postMessage({ type: "SKIP_WAITING" });
    });
  }
  prompt.hidden = false;
}
