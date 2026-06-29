import "./styles.css";

const STORAGE_KEY = "training-log-pwa-state-v1";
const DATA_VERSION = 5;
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
  ["Face pull", "pull", "cable", "🎯"],
  ["Гребля", "cardio", "cardio", "🚣"]
];

let state = loadState();
let route = { name: "home" };
let draftSet = { weight: "", reps: "8", reserve: 2, warmup: false };
let draftCardio = { minutes: "", seconds: "", distanceM: "", setting: "" };
let exerciseFormOpen = false;
let chartRefs = [];
let activeSetField = "weight";
let nativeKeyboard = false;
let editingSetId = null;
let editingReturnRoute = null;
let editingExerciseId = null;
let lastTouchedSetId = null;
let waitingServiceWorker = null;
let serviceWorkerRegistration = null;
let historyCursor = new Date();
let activeHistoryDay = dayKey(Date.now());
let expandedHistoryExercises = new Set();
let chartTooltip = null;

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return migrateState(parsed);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  const now = Date.now();
  return migrateState({
    schemaVersion: DATA_VERSION,
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
  });
}

function migrateState(input) {
  const migrated = {
    schemaVersion: DATA_VERSION,
    exercises: [],
    sets: [],
    settings: { unit: "кг", autoUpdateCheck: true },
    ...input
  };
  migrated.settings = { unit: "кг", autoUpdateCheck: true, ...(input.settings || {}) };
  migrated.exercises = (input.exercises || []).map((exercise) => ({
    id: exercise.id || uid(),
    name: exercise.name === "Гребля 3000 м" ? "Гребля" : exercise.name || "Упражнение",
    category: exercise.category || "other",
    equipmentType: exercise.equipmentType || "other",
    icon: exercise.icon || "🏋️",
    image: exercise.image || "",
    createdAt: exercise.createdAt || Date.now()
  }));
  if (!migrated.exercises.some((exercise) => isRowingExercise(exercise))) {
    migrated.exercises.push({
      id: uid(),
      name: "Гребля",
      category: "cardio",
      equipmentType: "cardio",
      icon: "🚣",
      image: "",
      createdAt: Date.now()
    });
  }
  migrated.sets = (input.sets || [])
    .filter((set) => {
      const cardio = set.type === "cardio" || set.durationSec != null || set.distanceM != null || set.durationMin != null || set.distanceKm != null;
      const strength = Number.isFinite(Number(set.weight)) && Number.isFinite(Number(set.reps));
      return set.exerciseId && (cardio || strength);
    })
    .map((set) => {
      if (set.type === "cardio" || set.durationSec != null || set.distanceM != null || set.durationMin != null || set.distanceKm != null) {
        const durationSec = set.durationSec != null
          ? Number(set.durationSec)
          : (Number(set.durationMin) || 0) * 60;
        const distanceM = set.distanceM != null
          ? Number(set.distanceM)
          : (Number(set.distanceKm) || 0) * 1000;
        const next = {
          id: set.id || uid(),
          type: "cardio",
          exerciseId: set.exerciseId,
          durationSec: Math.max(0, Math.round(Number.isFinite(durationSec) ? durationSec : 0)),
          distanceM: Math.max(0, Math.round(Number.isFinite(distanceM) ? distanceM : 0)),
          setting: set.setting != null ? String(set.setting) : "",
          createdAt: set.createdAt || Date.now()
        };
        if (set.updatedAt) next.updatedAt = set.updatedAt;
        return next;
      }
      const reserve = set.reserve != null ? Number(set.reserve) : reserveValue(set);
      const next = {
        id: set.id || uid(),
        type: "strength",
        exerciseId: set.exerciseId,
        weight: Number(set.weight),
        reps: Number(set.reps),
        reserve: Math.max(0, Math.min(10, Number.isFinite(reserve) ? reserve : 0)),
        warmup: Boolean(set.warmup),
        createdAt: set.createdAt || Date.now()
      };
      if (set.updatedAt) next.updatedAt = set.updatedAt;
      return next;
    });
  return migrated;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setRoute(next) {
  route = next;
  if (next.name !== "exercise") {
    editingSetId = null;
    editingReturnRoute = null;
  }
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

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthTitle(date) {
  return new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(date);
}

function shiftMonth(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function e1rm(set) {
  return set.weight * (1 + set.reps / 30);
}

function isCardioExercise(exercise) {
  return exercise?.category === "cardio" || exercise?.equipmentType === "cardio";
}

function isCardioSet(set) {
  return set?.type === "cardio" || set?.durationSec != null || set?.distanceM != null || set?.durationMin != null || set?.distanceKm != null;
}

function isRowingExercise(exercise) {
  return /греб|гребл|row/i.test(exercise?.name || "");
}

function isEllipticalExercise(exercise) {
  return /эллип|ellipt/i.test(exercise?.name || "");
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
  if (isCardioSet(set)) return cardioScore(set);
  const base = e1rm(set);
  const reserveBonus = 1 + Math.min(6, Math.max(0, reserveValue(set))) * 0.012;
  const warmupPenalty = set.warmup ? 0.72 : 1;
  return base * reserveBonus * warmupPenalty;
}

function cardioDurationSec(set) {
  if (set?.durationSec != null) return Number(set.durationSec) || 0;
  return (Number(set?.durationMin) || 0) * 60;
}

function cardioDistanceM(set) {
  if (set?.distanceM != null) return Number(set.distanceM) || 0;
  return (Number(set?.distanceKm) || 0) * 1000;
}

function cardioDistanceKm(set) {
  return cardioDistanceM(set) / 1000;
}

function cardioSpeed(set) {
  const durationSec = cardioDurationSec(set);
  const distanceKm = cardioDistanceKm(set);
  return durationSec > 0 ? distanceKm / durationSec * 3600 : 0;
}

function cardioPace(set) {
  const distanceKm = cardioDistanceKm(set);
  const durationSec = cardioDurationSec(set);
  return distanceKm > 0 ? durationSec / distanceKm : null;
}

function cardioScore(set) {
  const distance = cardioDistanceKm(set);
  const durationSec = cardioDurationSec(set);
  const speed = cardioSpeed(set);
  return distance > 0 ? distance * 100 + speed * 6 : durationSec / 60 * 4;
}

function formatDuration(seconds) {
  if (seconds == null || !Number.isFinite(Number(seconds))) return "—";
  const safe = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${minutes}:${String(sec).padStart(2, "0")}`;
}

function formatDistanceMeters(value) {
  const meters = Math.max(0, Math.round(Number(value) || 0));
  return meters >= 1000 && meters % 1000 === 0 ? `${meters / 1000} км` : `${meters} м`;
}

function formatDistanceKm(value) {
  return `${formatWeight(Number(value) || 0)} км`;
}

function formatPace(secondsPerKm) {
  if (secondsPerKm == null || !Number.isFinite(secondsPerKm)) return "—";
  const safe = Math.max(0, Math.round(secondsPerKm));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")} /км`;
}

function rowingSplit500(setOrSession) {
  const durationSec = cardioDurationSec(setOrSession);
  const distanceM = cardioDistanceM(setOrSession);
  return durationSec > 0 && distanceM > 0 ? durationSec * 500 / distanceM : null;
}

function row3000Equivalent(setOrSession) {
  const durationSec = cardioDurationSec(setOrSession);
  const distanceM = cardioDistanceM(setOrSession);
  return durationSec > 0 && distanceM > 0 ? durationSec * 3000 / distanceM : null;
}

function rowing3000Label(setOrSession) {
  const distanceM = cardioDistanceM(setOrSession);
  const equivalent = row3000Equivalent(setOrSession);
  if (equivalent == null) return "3000 м: —";
  const exact = Math.abs(distanceM - 3000) < 1;
  return `${exact ? "3000 м" : "3000 м расч."}: ${formatDuration(equivalent)}`;
}

function rowNormsText() {
  return "Нормы из Android: муж. 18-29 13:30, 30-39 14:00, 40-49 14:30, 50+ 15:00; жен. 15:00.";
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
  if (items.some(isCardioSet)) {
    const cardio = items.filter(isCardioSet);
    const durationSec = cardio.reduce((sum, set) => sum + cardioDurationSec(set), 0);
    const distanceM = cardio.reduce((sum, set) => sum + cardioDistanceM(set), 0);
    const distanceKm = distanceM / 1000;
    const speedKmh = durationSec > 0 ? distanceKm / durationSec * 3600 : 0;
    const pace = distanceKm > 0 ? durationSec / distanceKm : null;
    const score = distanceKm > 0 ? distanceKm * 100 + speedKmh * 6 : durationSec / 60 * 4;
    return {
      type: "cardio",
      date: items[0]?.createdAt || Date.now(),
      count: cardio.length,
      workCount: cardio.length,
      warmupCount: 0,
      durationSec,
      durationMin: durationSec / 60,
      distanceM,
      distanceKm,
      speedKmh,
      pace,
      score,
      tonnage: 0,
      pureE1rm: 0,
      avgReserve: 0,
      fatigue: null,
      top: cardio.reduce((best, set) => (cardioScore(set) > cardioScore(best || set) ? set : best), cardio[0])
    };
  }
  const work = items.filter((set) => !set.warmup);
  const source = work.length ? work : items;
  const top = work.length
    ? work.reduce((best, set) => (adjustedScore(set) > adjustedScore(best || set) ? set : best), work[0])
    : null;
  const workScores = work.map(adjustedScore).sort((a, b) => b - a);
  const stableScores = workScores.slice(0, Math.min(3, workScores.length));
  const tonnage = work.reduce((sum, set) => sum + set.weight * set.reps, 0);
  const pureE1rm = work.length ? Math.max(...work.map(e1rm)) : 0;
  const score = stableScores.length ? stableScores.reduce((sum, value) => sum + value, 0) / stableScores.length : 0;
  const avgReserve = source.reduce((sum, set) => sum + reserveValue(set), 0) / Math.max(1, source.length);
  const fatigue = work.length >= 2 ? Math.max(0, adjustedScore(work[0]) - adjustedScore(work[work.length - 1])) : null;
  const start = items.at(0)?.createdAt || Date.now();
  const end = items.at(-1)?.createdAt || start;
  const minutes = Math.max(1, (end - start) / 60000);
  const density = tonnage / minutes;
  const firstWork = work.at(0) || null;
  const lastWork = work.at(-1) || null;
  return {
    date: start,
    count: items.length,
    workCount: work.length,
    warmupCount: items.length - work.length,
    top,
    tonnage,
    pureE1rm,
    score,
    avgReserve,
    fatigue,
    density,
    firstWork,
    lastWork
  };
}

function progressForExercise(exerciseId) {
  return groupSetsByWorkout(setsForExercise(exerciseId))
    .map(sessionMetrics)
    .filter((session) => session.type === "cardio" || session.workCount > 0);
}

function latestExerciseStats(exerciseId) {
  const sessions = progressForExercise(exerciseId);
  const last = sessions.at(-1);
  const prev = sessions.at(-2);
  const best = sessions.reduce((acc, item) => (item.score > (acc?.score || 0) ? item : acc), null);
  return { sessions, last, prev, best };
}

function trackedExercises() {
  return state.exercises
    .map((exercise) => ({ exercise, sessions: progressForExercise(exercise.id), sets: setsForExercise(exercise.id) }))
    .filter((item) => item.sets.length > 0)
    .sort((a, b) => (b.sessions.at(-1)?.date || 0) - (a.sessions.at(-1)?.date || 0));
}

function overallProgressSeries() {
  const byDay = new Map();
  trackedExercises().forEach(({ exercise, sessions }) => {
    const baseline = sessions.find((session) => session.score > 0)?.score || 0;
    if (!baseline) return;
    sessions.forEach((session) => {
      const key = dayKey(session.date);
      if (!byDay.has(key)) byDay.set(key, { date: session.date, normalized: [], volume: 0, exercises: new Set() });
      const day = byDay.get(key);
      day.normalized.push((session.score / baseline) * 100);
      day.volume += session.tonnage;
      day.exercises.add(exercise.id);
    });
  });
  return [...byDay.values()]
    .map((item) => ({
      date: item.date,
      score: item.normalized.reduce((sum, value) => sum + value, 0) / Math.max(1, item.normalized.length),
      volume: item.volume,
      exerciseCount: item.exercises.size
    }))
    .sort((a, b) => a.date - b.date);
}

function setsByDay() {
  const grouped = new Map();
  state.sets
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
    .forEach((set) => {
      const key = dayKey(set.createdAt);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(set);
    });
  return grouped;
}

function daySummary(items) {
  const work = items.filter((set) => !isCardioSet(set) && !set.warmup);
  const cardio = items.filter(isCardioSet);
  const exerciseIds = new Set(items.map((set) => set.exerciseId));
  const tonnage = work.reduce((sum, set) => sum + set.weight * set.reps, 0);
  const distanceM = cardio.reduce((sum, set) => sum + cardioDistanceM(set), 0);
  const durationSec = cardio.reduce((sum, set) => sum + cardioDurationSec(set), 0);
  const top = work.reduce((best, set) => (adjustedScore(set) > adjustedScore(best || set) ? set : best), work[0] || null);
  return {
    exerciseCount: exerciseIds.size,
    setCount: items.length,
    workCount: work.length,
    cardioCount: cardio.length,
    distanceM,
    distanceKm: distanceM / 1000,
    durationSec,
    durationMin: durationSec / 60,
    tonnage,
    top
  };
}

function exerciseGroupsForDay(items) {
  const groups = new Map();
  items.forEach((set) => {
    if (!groups.has(set.exerciseId)) groups.set(set.exerciseId, []);
    groups.get(set.exerciseId).push(set);
  });
  return [...groups.entries()].map(([exerciseId, sets]) => ({
    exerciseId,
    exercise: state.exercises.find((item) => item.id === exerciseId),
    sets: sets.sort((a, b) => a.createdAt - b.createdAt),
    metrics: sessionMetrics(sets)
  }));
}

function previousWorkoutSets(exerciseId, beforeTs = Date.now()) {
  return groupSetsByWorkout(setsForExercise(exerciseId).filter((set) => set.createdAt < beforeTs))
    .filter((items) => dayKey(items[0].createdAt) !== dayKey(Date.now()))
    .at(-1) || [];
}

function todayStrengthIndex(exerciseId, warmup) {
  return state.sets.filter((set) => set.exerciseId === exerciseId && !isCardioSet(set) && Boolean(set.warmup) === warmup && dayKey(set.createdAt) === dayKey(Date.now())).length;
}

function previousStrengthSets(exerciseId, warmup) {
  return previousWorkoutSets(exerciseId)
    .filter((set) => !isCardioSet(set) && Boolean(set.warmup) === warmup)
    .sort((a, b) => a.createdAt - b.createdAt);
}

function previousStrengthTarget(exerciseId, warmup, index = todayStrengthIndex(exerciseId, warmup)) {
  const previous = previousStrengthSets(exerciseId, warmup);
  return previous[index] || null;
}

function suggestedDraftSet(exerciseId, fallback = {}) {
  const warmup = fallback.warmup ?? true;
  const target = previousStrengthTarget(exerciseId, warmup);
  return {
    weight: target ? String(target.weight) : fallback.weight || "",
    reps: target ? String(target.reps) : fallback.reps || "8",
    reserve: target ? reserveValue(target) : fallback.reserve ?? (warmup ? 6 : 2),
    warmup
  };
}

function currentDraftScore() {
  const weight = Number(String(draftSet.weight || 0).replace(",", "."));
  const reps = Number(draftSet.reps || 0);
  if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(reps) || reps <= 0) return null;
  return adjustedScore({
    weight,
    reps,
    reserve: Number(draftSet.reserve || 0),
    warmup: Boolean(draftSet.warmup)
  });
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
      ${editingExerciseId ? renderExerciseEditor() : ""}
      <nav class="bottom-nav">
        <button class="${route.name === "home" ? "active" : ""}" data-action="home">Упр.</button>
        <button class="${route.name === "progress" ? "active" : ""}" data-action="progress">Прогресс</button>
        <button class="${route.name === "history" ? "active" : ""}" data-action="history">История</button>
        <button class="${route.name === "settings" ? "active" : ""}" data-action="settings">Ещё</button>
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
  if (route.name === "settings") return renderSettings();
  return renderHome();
}

function renderHome() {
  const totalSets = state.sets.length;
  const trainedToday = state.sets.filter((set) => dayKey(set.createdAt) === dayKey(Date.now())).length;
  const todayItems = setsByDay().get(dayKey(Date.now())) || [];
  const todaySummary = daySummary(todayItems);
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
    ${todayItems.length ? `
      <section class="panel compact-day">
        <div class="section-head">
          <h2>Сегодня</h2>
          <button data-action="history-day" data-day="${dayKey(Date.now())}">Открыть день</button>
        </div>
        <div class="mini-metrics">
          <span>${todaySummary.exerciseCount} упр.</span>
          <span>${todaySummary.workCount} рабочих</span>
          <span>${formatWeight(todaySummary.tonnage)} кг×повт</span>
          ${todaySummary.cardioCount ? `<span>${formatDistanceKm(todaySummary.distanceKm)} кардио</span>` : ""}
        </div>
      </section>
    ` : ""}
    <section class="toolbar">
      <input type="search" id="search" placeholder="Найти упражнение" autocomplete="off" />
      <button class="primary" data-action="toggle-form">Новое</button>
    </section>
    ${exerciseFormOpen ? renderExerciseForm() : ""}
    <section class="exercise-groups">
      ${grouped
        .filter(([, , items]) => items.length)
        .map(([key, title, items]) => `
          <div class="group ${key === "cardio" ? "cardio-group" : ""}">
            <div class="group-title"><h2>${title}</h2><span>${items.length}</span></div>
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
    <form class="panel exercise-form" data-form="exercise" ${exercise ? `data-id="${exercise.id}"` : ""}>
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

function renderExerciseEditor() {
  const exercise = state.exercises.find((item) => item.id === editingExerciseId);
  if (!exercise) return "";
  return `
    <div class="modal-backdrop" data-action="close-exercise-editor">
      <div class="modal-sheet" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
        ${renderExerciseForm(exercise)}
        <button class="danger-zone" data-action="delete-exercise" data-id="${exercise.id}">Удалить упражнение</button>
      </div>
    </div>
  `;
}

function renderExercise(exerciseId) {
  const exercise = state.exercises.find((item) => item.id === exerciseId);
  if (!exercise) return `<section class="panel"><h1>Упражнение не найдено</h1></section>`;
  const isCardio = isCardioExercise(exercise);
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
      <div><span>${isCardio ? "Всего сегодня" : "Лучший индекс"}</span><strong>${isCardio ? formatDuration(todaySets.reduce((sum, set) => sum + cardioDurationSec(set), 0)) : last ? formatWeight(Math.max(...sessions.map((s) => s.score))) : "—"}</strong></div>
      <div><span>Динамика</span><strong>${last && previous ? trendText(last.score, previous.score) : "—"}</strong></div>
    </section>
    ${isCardio ? renderCardioEntry(exercise, editingSet) : renderStrengthEntry(exercise, editingSet, formValues, allSets, previous)}
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

function renderStrengthEntry(exercise, editingSet, formValues, allSets, previous) {
  return `
    <form class="set-entry ${editingSet ? "editing" : ""}" data-form="set" data-id="${exercise.id}" data-kind="strength">
      ${editingSet ? `<div class="edit-banner"><strong>Редактирование подхода</strong><button type="button" data-action="cancel-edit">Отмена</button></div>` : ""}
      <div class="quick-row">
        ${allSets.at(-1) && !isCardioSet(allSets.at(-1)) ? `<button type="button" data-action="repeat-last" data-weight="${allSets.at(-1).weight}" data-reps="${allSets.at(-1).reps}" data-reserve="${reserveValue(allSets.at(-1))}">Повторить последний: ${formatWeight(allSets.at(-1).weight)} × ${allSets.at(-1).reps}</button>` : ""}
        ${previous?.top && !isCardioSet(previous.top) ? `<button type="button" data-action="repeat-best" data-weight="${previous.top.weight}" data-reps="${previous.top.reps}" data-reserve="${reserveValue(previous.top)}">Лучший прошлый: ${formatWeight(previous.top.weight)} × ${previous.top.reps}</button>` : ""}
        <button type="button" data-action="set-reserve" data-reserve="2">Рабочий запас 2</button>
        <button type="button" data-action="set-reserve" data-reserve="6">Разминка запас 6</button>
      </div>
      <div class="input-pair">
        <label class="number-control"><span>Вес вместе со штангой</span><div><button type="button" data-step-field="weight" data-delta="-2.5">−</button><input inputmode="none" name="weight" min="1" required value="${formValues.weight}" placeholder="80" ${nativeKeyboard ? "" : "readonly"} data-set-field="weight" class="${activeSetField === "weight" ? "active" : ""}" /><button type="button" data-step-field="weight" data-delta="2.5">+</button></div></label>
        <label class="number-control"><span>Повторы</span><div><button type="button" data-step-field="reps" data-delta="-1">−</button><input inputmode="none" name="reps" min="1" required value="${formValues.reps}" placeholder="8" ${nativeKeyboard ? "" : "readonly"} data-set-field="reps" class="${activeSetField === "reps" ? "active" : ""}" /><button type="button" data-step-field="reps" data-delta="1">+</button></div></label>
      </div>
      ${renderKeypad()}
      <label class="effort-label"><span>Запас повторов: <strong id="reserveText">${reserveName(formValues.reserve)}</strong></span><input class="effort-slider" type="range" name="reserve" min="0" max="10" value="${formValues.reserve}" /></label>
      <label class="warmup-toggle"><input type="checkbox" name="warmup" ${formValues.warmup ? "checked" : ""} /> Разминка</label>
      ${renderSetComparison(exercise.id, formValues)}
      <button class="primary save-set" type="submit">${editingSet ? "Сохранить изменения" : "Записать подход"}</button>
    </form>
  `;
}

function renderCardioEntry(exercise, editingSet) {
  const values = editingSet && isCardioSet(editingSet)
    ? {
        minutes: String(Math.floor(cardioDurationSec(editingSet) / 60) || ""),
        seconds: String(cardioDurationSec(editingSet) % 60 || ""),
        distanceM: String(Math.round(cardioDistanceM(editingSet)) || ""),
        setting: String(editingSet.setting || "")
      }
    : draftCardio;
  const rowing = isRowingExercise(exercise);
  const elliptical = isEllipticalExercise(exercise);
  return `
    <form class="set-entry ${editingSet ? "editing" : ""}" data-form="set" data-id="${exercise.id}" data-kind="cardio">
      ${editingSet ? `<div class="edit-banner"><strong>Редактирование кардио</strong><button type="button" data-action="cancel-edit">Отмена</button></div>` : ""}
      <div class="quick-row">
        ${rowing ? `<button type="button" data-action="cardio-distance" data-distance="3000">3000 м тест</button><button type="button" data-action="cardio-setting" data-setting="9">Заслонка 9</button>` : ""}
        ${elliptical ? `<button type="button" data-action="cardio-duration" data-minutes="8" data-seconds="0">8 мин разогрев</button>` : ""}
        <button type="button" data-action="cardio-duration" data-minutes="10" data-seconds="0">10 мин</button>
        <button type="button" data-action="cardio-duration" data-minutes="20" data-seconds="0">20 мин</button>
      </div>
      <div class="input-pair cardio-pair">
        <label class="number-control"><span>Минуты</span><input inputmode="numeric" name="minutes" min="0" required value="${values.minutes}" placeholder="13" /></label>
        <label class="number-control"><span>Секунды</span><input inputmode="numeric" name="seconds" min="0" max="59" value="${values.seconds}" placeholder="30" /></label>
      </div>
      <div class="input-pair cardio-pair">
        <label class="number-control"><span>Дистанция, м</span><input inputmode="numeric" name="distanceM" min="1" required value="${values.distanceM}" placeholder="${rowing ? "3000" : "1500"}" /></label>
        <label class="number-control cardio-setting"><span>Настройка тренажёра</span><input inputmode="decimal" name="setting" value="${values.setting || ""}" placeholder="например 9" /></label>
      </div>
      <div class="cardio-context">
        ${rowing ? `<strong>Гребля</strong><span>3000 м - быстрый пресет для рабочего фит-теста, обычные тренировки можно писать с любой дистанцией.</span><span>${rowNormsText()}</span><span>Заслонка/настройка сохраняется как контекст и не влияет на индекс.</span>` : ""}
        ${elliptical ? `<strong>Эллипс: спокойное кардио</strong><span>Здесь важны время, дистанция и ровная привычка разогрева, без оценки тяжести.</span>` : ""}
        ${!rowing && !elliptical ? `<span>Настройка сохраняется как контекст. Она не считается сложностью и не влияет на прогресс.</span>` : ""}
      </div>
      <button class="primary save-set" type="submit">${editingSet ? "Сохранить изменения" : "Записать кардио"}</button>
    </form>
  `;
}

function renderSetComparison(exerciseId, formValues) {
  const warmup = Boolean(formValues.warmup);
  const index = todayStrengthIndex(exerciseId, warmup);
  const previous = previousStrengthSets(exerciseId, warmup);
  const target = previous[index] || null;
  if (formValues.warmup) {
    if (!target) {
      return previous.length
        ? `<div class="comparison muted">В прошлой тренировке было только ${previous.length} разм. подх. Разминка №${index + 1} новая и не влияет на прогресс.</div>`
        : `<div class="comparison muted">Прошлых разминочных подходов пока нет. Разминка не влияет на прогресс.</div>`;
    }
    return `
      <div class="comparison muted">
        <span>Прошлая разминка №${index + 1}: ${formatWeight(target.weight)} кг × ${target.reps}, ${reserveName(reserveValue(target))}</span>
        <strong>Не влияет на прогресс</strong>
      </div>
    `;
  }
  if (!target) {
    return previous.length
      ? `<div class="comparison muted">В прошлой тренировке было только ${previous.length} раб. подх. Рабочий №${index + 1} новый, сравнение не строю.</div>`
      : `<div class="comparison muted">Прошлых рабочих подходов пока нет.</div>`;
  }
  const weight = Number(String(formValues.weight || 0).replace(",", "."));
  const reps = Number(formValues.reps || 0);
  const canCompare = Number.isFinite(weight) && weight > 0 && Number.isFinite(reps) && reps > 0;
  const current = canCompare ? adjustedScore({ weight, reps, reserve: Number(formValues.reserve || 0), warmup: false }) : null;
  const previousScore = adjustedScore(target);
  const delta = current == null ? null : current - previousScore;
  const direction = delta == null ? "" : delta >= 0 ? "good" : "bad";
  return `
    <div class="comparison ${direction}">
      <span>Прошлый рабочий №${index + 1}: ${formatWeight(target.weight)} кг × ${target.reps}, ${reserveName(reserveValue(target))}</span>
      <strong>${delta == null ? "Введите вес и повторы" : trendText(current, previousScore)}</strong>
    </div>
  `;
}

function strengthFormValues(form) {
  return {
    weight: form.elements.weight?.value || "",
    reps: form.elements.reps?.value || "",
    reserve: Number(form.elements.reserve?.value || 0),
    warmup: Boolean(form.elements.warmup?.checked)
  };
}

function updateStrengthComparison(root) {
  const form = root.querySelector("[data-form='set'][data-kind='strength']");
  const comparison = form?.querySelector(".comparison");
  if (!form || !comparison) return;
  comparison.outerHTML = renderSetComparison(form.dataset.id, strengthFormValues(form));
}

function finishSetEditing() {
  const returnRoute = editingReturnRoute;
  editingSetId = null;
  editingReturnRoute = null;
  if (returnRoute?.name === "history") {
    activeHistoryDay = returnRoute.activeHistoryDay || activeHistoryDay;
    historyCursor = returnRoute.historyCursor ? new Date(returnRoute.historyCursor) : historyCursor;
    route = { name: "history" };
    return;
  }
}

function applySuggestedStrengthValues(root) {
  const form = root.querySelector("[data-form='set'][data-kind='strength']");
  if (!form) return;
  const warmup = Boolean(form.elements.warmup?.checked);
  const currentReserve = Number(form.elements.reserve?.value || 0);
  const reserve = warmup
    ? Math.max(6, currentReserve || 6)
    : currentReserve >= 6 ? 2 : currentReserve || 2;
  const suggestion = suggestedDraftSet(form.dataset.id, {
    weight: form.elements.weight?.value || "",
    reps: form.elements.reps?.value || "8",
    reserve,
    warmup
  });
  form.elements.weight.value = suggestion.weight;
  form.elements.reps.value = suggestion.reps;
  form.elements.reserve.value = suggestion.reserve;
  if (!editingSetId) {
    draftSet = { ...draftSet, ...suggestion };
  }
  root.querySelector("#reserveText").textContent = reserveName(suggestion.reserve);
  updateStrengthComparison(root);
}

function renderSetRow(set) {
  if (isCardioSet(set)) {
    const pace = cardioPace(set);
    const exercise = state.exercises.find((item) => item.id === set.exerciseId);
    const rowing = isRowingExercise(exercise);
    return `
      <div class="set-row cardio-row ${set.id === lastTouchedSetId ? "just-saved" : ""}" data-action="edit-set" data-id="${set.id}">
        <strong>${formatDuration(cardioDurationSec(set))} · ${formatDistanceMeters(cardioDistanceM(set))}</strong>
        <span>${rowing ? `ave/500 м ${formatDuration(rowingSplit500(set))} · ${rowing3000Label(set)}` : `${formatWeight(cardioSpeed(set))} км/ч · ${formatPace(pace)}`}${set.setting ? ` · настройка ${set.setting}` : ""} · ${formatDateTime(set.createdAt)}</span>
        <div class="set-actions">
          <button data-action="edit-set" data-id="${set.id}" aria-label="Редактировать кардио">✎</button>
          <button data-action="delete-set" data-id="${set.id}" aria-label="Удалить запись">×</button>
        </div>
      </div>
    `;
  }
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
  const cardio = sessions.some((s) => s.type === "cardio");
  const id = `chart-${chartRefs.length}`;
  chartRefs.push({
    id,
    values: sessions.map((s) => s.score),
    labels: sessions.map((s) => formatDate(s.date)),
    type: "line",
    pointValues: cardio ? null : sessions.map((s) => s.avgReserve),
    details: sessions.map((s) => cardio
      ? `${formatDate(s.date)} · ${formatWeight(s.score)} индекс · ${formatDistanceKm(s.distanceKm)}`
      : `${formatDate(s.date)} · ${formatWeight(s.score)} индекс · ${formatWeight(s.avgReserve)} запас`)
  });
  return `<canvas class="chart" id="${id}" height="190"></canvas>`;
}

function renderProgress(selectedId) {
  const tracked = trackedExercises();
  const selected = tracked.find((item) => item.exercise.id === selectedId)?.exercise || tracked[0]?.exercise;
  if (!selected) {
    return `
      <section class="progress-hero empty-progress">
        <div>
          <p class="eyebrow">Прогресс</p>
          <h1>Здесь появится динамика после первых подходов</h1>
        </div>
        <button class="primary" data-action="home">Записать упражнение</button>
      </section>
    `;
  }
  const selectedIsCardio = isCardioExercise(selected);
  const selectedIsRowing = isRowingExercise(selected);
  const sessions = progressForExercise(selected.id);
  const overall = overallProgressSeries();
  const last = sessions.at(-1);
  const previous = sessions.at(-2);
  const scoreChart = `chart-${chartRefs.length}`;
  chartRefs.push({
    id: scoreChart,
    values: sessions.map((s) => s.score),
    labels: sessions.map((s) => formatDate(s.date)),
    type: "line",
    pointValues: selectedIsCardio ? null : sessions.map((s) => s.avgReserve),
    details: sessions.map((s) => selectedIsCardio
      ? `${formatDate(s.date)} · ${formatWeight(s.score)} индекс · ${formatDuration(s.durationSec)}`
      : `${formatDate(s.date)} · ${formatWeight(s.score)} индекс серии · пик ${formatWeight(s.pureE1rm)} кг 1ПМ · ${s.workCount} рабочих`)
  });
  const volumeChart = `chart-${chartRefs.length}`;
  chartRefs.push({
    id: volumeChart,
    values: sessions.map((s) => selectedIsCardio ? s.distanceKm : s.tonnage),
    labels: sessions.map((s) => formatDate(s.date)),
    type: "bar",
    details: sessions.map((s) => selectedIsCardio
      ? `${formatDate(s.date)} · ${formatDistanceKm(s.distanceKm)} · ${formatDuration(s.durationSec)}`
      : `${formatDate(s.date)} · ${formatWeight(s.tonnage)} кг×повт · ${s.workCount} рабочих`)
  });
  const reserveChart = `chart-${chartRefs.length}`;
  chartRefs.push({
    id: reserveChart,
    values: sessions.map((s) => selectedIsCardio ? selectedIsRowing ? rowingSplit500(s) : s.speedKmh : s.avgReserve),
    labels: sessions.map((s) => formatDate(s.date)),
    type: "line",
    invert: selectedIsRowing,
    details: sessions.map((s) => selectedIsCardio
      ? selectedIsRowing
        ? `${formatDate(s.date)} · ave/500 м ${formatDuration(rowingSplit500(s))} · ${rowing3000Label(s)}`
        : `${formatDate(s.date)} · ${formatWeight(s.speedKmh)} км/ч · темп ${formatPace(s.pace)}`
      : `${formatDate(s.date)} · запас ${formatWeight(s.avgReserve)} · ${s.workCount} рабочих`)
  });
  const fatigueValues = sessions.map((s) => s.fatigue).filter((v) => v != null);
  const fatigueChart = `chart-${chartRefs.length}`;
  const fatigueSessions = sessions.filter((s) => s.fatigue != null);
  chartRefs.push({
    id: fatigueChart,
    values: fatigueValues,
    labels: fatigueSessions.map((s) => formatDate(s.date)),
    type: "line",
    invert: true,
    details: fatigueSessions.map((s) => `${formatDate(s.date)} · падение ${formatWeight(s.fatigue)} · меньше лучше`)
  });
  const overallChart = `chart-${chartRefs.length}`;
  chartRefs.push({
    id: overallChart,
    values: overall.map((item) => item.score),
    labels: overall.map((item) => formatDate(item.date)),
    type: "line",
    details: overall.map((item) => `${formatDate(item.date)} · ${formatWeight(item.score)} общий индекс · ${item.exerciseCount} упр.`)
  });
  return `
    <section class="progress-hero">
      <div>
        <p class="eyebrow">Прогресс</p>
        <h1>${selected.name}</h1>
        <div class="progress-subline">
          <span>${sessions.length} трен.</span>
          <span>${setsForExercise(selected.id).length} ${selectedIsCardio ? "зап." : "подх."}</span>
          <span>${label(equipment, selected.equipmentType)}</span>
        </div>
      </div>
      <div class="progress-score">
        <span>Индекс формы</span>
        <strong>${last ? formatWeight(last.score) : "—"}</strong>
        <small>${last && previous ? trendText(last.score, previous.score) : "Нужна ещё одна точка"}</small>
      </div>
    </section>
    <section class="progress-picker-shell">
      <div class="section-head"><h2>Выбор упражнения</h2><span class="legend-dot">${tracked.length} с историей</span></div>
      <div class="progress-picker">
        ${tracked.map(({ exercise, sessions: itemSessions }) => {
          const itemLast = itemSessions.at(-1);
          const itemPrev = itemSessions.at(-2);
          const delta = itemLast && itemPrev ? itemLast.score - itemPrev.score : null;
          return `
            <button class="${exercise.id === selected.id ? "active" : ""}" data-action="select-progress-card" data-id="${exercise.id}">
              <span>${exercise.name}</span>
              <strong>${itemLast ? formatWeight(itemLast.score) : "—"}</strong>
              <small>${delta == null ? `${itemSessions.length} трен.` : trendText(itemLast.score, itemPrev.score)}</small>
            </button>
          `;
        }).join("")}
      </div>
    </section>
    <section class="progress-mosaic">
      <div class="metric-tile strength"><span>${selectedIsCardio ? "Дистанция" : "Пик силы"}</span><strong>${last ? selectedIsCardio ? formatDistanceKm(last.distanceKm) : `${formatWeight(last.pureE1rm)} кг` : "—"}</strong><p>${selectedIsCardio ? "за последнюю сессию" : "лучший чистый 1ПМ"}</p></div>
      <div class="metric-tile volume"><span>${selectedIsCardio ? "Время" : "Объём"}</span><strong>${last ? selectedIsCardio ? formatDuration(last.durationSec) : formatWeight(last.tonnage) : "—"}</strong><p>${selectedIsCardio ? "мин:сек работы" : "рабочие кг×повт"}</p></div>
      <div class="metric-tile reserve"><span>${selectedIsCardio ? selectedIsRowing ? "ave/500 м" : "Скорость" : "Запас"}</span><strong>${last ? selectedIsCardio ? selectedIsRowing ? formatDuration(rowingSplit500(last)) : `${formatWeight(last.speedKmh)} км/ч` : formatWeight(last.avgReserve) : "—"}</strong><p>${selectedIsCardio ? selectedIsRowing ? "средний split" : "средняя" : "средний RIR 0-10"}</p></div>
      <div class="metric-tile stability"><span>${selectedIsCardio ? selectedIsRowing ? "3000 м" : "Темп" : "Серия"}</span><strong>${last ? selectedIsCardio ? selectedIsRowing ? formatDuration(row3000Equivalent(last)) : formatPace(last.pace) : last.fatigue != null ? formatWeight(last.fatigue) : "—" : "—"}</strong><p>${selectedIsCardio ? selectedIsRowing ? "эквивалент по темпу" : "мин/км" : "падение меньше = лучше"}</p></div>
    </section>
    ${last ? `<section class="panel progress-note">${renderProgressNote(last, previous, selected)}</section>` : ""}
    <section class="chart-grid">
      <div class="chart-panel primary-chart"><div class="section-head"><h2>${selectedIsCardio ? "Кардио индекс" : "Форма"}</h2><span class="legend-dot">${selectedIsCardio ? "дистанция + скорость" : "лучшие рабочие"}</span></div>${sessions.length ? `<canvas class="chart" id="${scoreChart}" height="250"></canvas><p class="muted">${selectedIsCardio ? "Индекс растёт от большей дистанции и скорости. Настройка тренажёра только сохраняется в истории." : "Главная линия: среднее из лучших рабочих подходов с поправкой на запас. Разминка не раздувает показатель."}</p>` : `<p class="muted">Нет данных.</p>`}</div>
      <div class="chart-panel"><div class="section-head"><h2>${selectedIsCardio ? "Дистанция" : "Объём"}</h2><span class="legend-dot">${selectedIsCardio ? "км" : "рабочие подходы"}</span></div>${sessions.length ? `<canvas class="chart" id="${volumeChart}" height="210"></canvas><p class="muted">${selectedIsCardio ? "Сколько километров набрано за сессию." : "Сколько работы сделано за день."}</p>` : `<p class="muted">Нет данных.</p>`}</div>
      <div class="chart-panel"><div class="section-head"><h2>${selectedIsCardio ? selectedIsRowing ? "ave/500 м" : "Скорость" : "Запас"}</h2><span class="legend-dot">${selectedIsCardio ? selectedIsRowing ? "ниже лучше" : "км/ч" : "0 отказ · 10 легко"}</span></div>${sessions.length ? `<canvas class="chart" id="${reserveChart}" height="210"></canvas><p class="muted">${selectedIsCardio ? selectedIsRowing ? "Средний split на 500 м. Для гребли это обычно понятнее скорости." : "Средняя скорость по времени и дистанции." : "Та же работа с большим запасом = прогресс."}</p>` : `<p class="muted">Нет данных.</p>`}</div>
      ${selectedIsCardio ? "" : `<div class="chart-panel"><div class="section-head"><h2>Устойчивость</h2><span class="legend-dot">ниже лучше</span></div>${fatigueValues.length ? `<canvas class="chart" id="${fatigueChart}" height="210"></canvas><p class="muted">Насколько проседает серия от первого рабочего подхода к последнему.</p>` : `<p class="muted">Нужны хотя бы два рабочих подхода в тренировке.</p>`}</div>`}
    </section>
    <section class="panel">
      <h2>Последние тренировки</h2>
      ${sessions.length ? `<div class="session-list">${sessions.slice(-6).reverse().map(renderSessionSummary).join("")}</div>` : `<p class="muted">Нет данных.</p>`}
    </section>
    <section class="chart-panel overall-panel">
      <div class="section-head"><h2>Общий тренд</h2><span class="legend-dot">100 = первая тренировка каждого упражнения</span></div>
      ${overall.length ? `<canvas class="chart" id="${overallChart}" height="230"></canvas><p class="muted">Упражнения нормализуются отдельно, поэтому жим, тяги и ноги можно свести в один общий индекс без смешивания килограммов.</p>` : `<p class="muted">Появится после первых тренировок.</p>`}
    </section>
  `;
}

function renderProgressNote(last, previous, exercise) {
  if (last.type === "cardio") {
    const rowEquivalent = isRowingExercise(exercise) ? row3000Equivalent(last) : null;
    const split500 = isRowingExercise(exercise) ? rowingSplit500(last) : null;
    if (!previous) {
      return `
        <h2>Вывод</h2>
        <p class="muted">${rowEquivalent ? `Первая точка по гребле: ave/500 м ${formatDuration(split500)}, ${rowing3000Label(last)}. ${rowNormsText()}` : "Есть первая кардио-точка. Следующая тренировка даст сравнение скорости, дистанции и времени."}</p>
      `;
    }
    const speedDelta = last.speedKmh - previous.speedKmh;
    const distanceDelta = last.distanceKm - previous.distanceKm;
    const durationDelta = last.durationSec - previous.durationSec;
    return `
      <h2>Вывод</h2>
      <p>${speedDelta >= 0 ? "средняя скорость выше" : "средняя скорость ниже"}, ${distanceDelta >= 0 ? "дистанция выше" : "дистанция ниже"}, ${durationDelta >= 0 ? "времени больше" : "времени меньше"}.</p>
      ${rowEquivalent ? `<p class="muted">Гребля: ave/500 м ${formatDuration(split500)}, ${rowing3000Label(last)}. ${rowNormsText()}</p>` : ""}
      <div class="mini-metrics">
        <span>${trendText(last.speedKmh, previous.speedKmh, " км/ч")}</span>
        <span>${trendText(last.distanceKm, previous.distanceKm, " км")}</span>
        <span>${trendText(last.durationSec, previous.durationSec, " сек")}</span>
      </div>
    `;
  }
  if (!previous) {
    return `<h2>Вывод</h2><p class="muted">Есть первая точка. Следующая тренировка даст сравнение.</p>`;
  }
  const scoreDelta = last.score - previous.score;
  const volumeDelta = last.tonnage - previous.tonnage;
  const reserveDelta = last.avgReserve - previous.avgReserve;
  const parts = [
    scoreDelta >= 0 ? "индекс формы вырос" : "индекс формы снизился",
    volumeDelta >= 0 ? "объём выше" : "объём ниже",
    reserveDelta >= 0 ? "запаса больше" : "запаса меньше"
  ];
  return `
    <h2>Вывод</h2>
    <p>${parts.join(", ")}.</p>
    <div class="mini-metrics">
      <span>${trendText(last.score, previous.score)}</span>
      <span>${trendText(last.tonnage, previous.tonnage, " объём")}</span>
      <span>${trendText(last.avgReserve, previous.avgReserve, " запас")}</span>
    </div>
  `;
}

function renderSessionSummary(session) {
  const pr = session.score === Math.max(...progressForExercise(session.top.exerciseId).map((item) => item.score));
  if (session.type === "cardio") {
    const exercise = state.exercises.find((item) => item.id === session.top.exerciseId);
    const rowing = isRowingExercise(exercise);
    return `
      <article class="session-summary">
        <div>
          <strong>${formatDate(session.date)}${pr ? " · лучший" : ""}</strong>
          <span>${session.count} зап. · ${formatDuration(session.durationSec)}</span>
        </div>
        <div>
          <strong>${formatDistanceKm(session.distanceKm)} · ${rowing ? `ave/500 м ${formatDuration(rowingSplit500(session))}` : `${formatWeight(session.speedKmh)} км/ч`}</strong>
          <span>${rowing ? rowing3000Label(session) : `${formatWeight(session.score)} индекс · темп ${formatPace(session.pace)}`}</span>
        </div>
      </article>
    `;
  }
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
  const byDate = setsByDay();
  const visibleDays = [...byDate.entries()]
    .filter(([key]) => key.startsWith(monthKey(historyCursor)))
    .sort((a, b) => b[0].localeCompare(a[0]));
  return `
    <section class="progress-top history-top">
      <h1>История</h1>
      <div class="month-controls">
        <button data-action="history-month" data-delta="-1">←</button>
        <strong>${monthTitle(historyCursor)}</strong>
        <button data-action="history-month" data-delta="1">→</button>
      </div>
    </section>
    <section class="panel">
      ${renderCalendar(byDate)}
    </section>
    ${state.sets.length
      ? (visibleDays.length ? visibleDays.map(([key, items]) => renderHistoryDay(key, items)).join("") : `<section class="panel"><p class="muted">В этом месяце тренировок нет.</p></section>`)
      : `<section class="panel"><p class="muted">История пока пустая.</p></section>`}
  `;
}

function renderCalendar(byDate) {
  const first = new Date(historyCursor.getFullYear(), historyCursor.getMonth(), 1);
  const last = new Date(historyCursor.getFullYear(), historyCursor.getMonth() + 1, 0);
  const startOffset = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= last.getDate(); day += 1) {
    cells.push(new Date(historyCursor.getFullYear(), historyCursor.getMonth(), day));
  }
  const week = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  return `
    <div class="calendar">
      ${week.map((item) => `<span class="weekday">${item}</span>`).join("")}
      ${cells.map((date) => {
        if (!date) return `<span></span>`;
        const key = dayKey(date.getTime());
        const items = byDate.get(key) || [];
        const summary = daySummary(items);
        return `
          <button class="calendar-day ${items.length ? "has-training" : ""} ${activeHistoryDay === key ? "selected" : ""}" data-action="history-day" data-day="${key}">
            <strong>${date.getDate()}</strong>
            ${items.length ? `<small>${summary.exerciseCount} упр.</small>` : ""}
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderHistoryDay(key, items) {
  const expanded = activeHistoryDay === key;
  const title = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", weekday: "long" }).format(new Date(items[0].createdAt));
  const summary = daySummary(items);
  const groups = groupSetsByWorkout(items);
  return `
    <section class="panel history-day">
      <button class="day-toggle" data-action="history-day" data-day="${key}">
        <span><strong>${title}</strong><small>${summary.exerciseCount} упр. · ${summary.workCount} рабочих · ${formatWeight(summary.tonnage)} кг×повт${summary.cardioCount ? ` · ${formatDistanceKm(summary.distanceKm)}` : ""}</small></span>
        <span>${expanded ? "Свернуть" : "Открыть"}</span>
      </button>
      ${expanded ? exerciseGroupsForDay(items).map(({ exerciseId, exercise, sets, metrics }) => {
        const exerciseKey = `${key}:${exerciseId}`;
        const exerciseExpanded = expandedHistoryExercises.has(exerciseKey);
        const cardio = metrics.type === "cardio";
        return `
          <article class="history-exercise">
            <button class="exercise-toggle" data-action="history-exercise" data-key="${exerciseKey}">
              <span>${exercise?.name || "Удалённое упражнение"}</span>
              <small>${cardio ? `${metrics.count} зап. · ${formatDuration(metrics.durationSec)} · ${formatDistanceKm(metrics.distanceKm)}` : `${metrics.workCount} раб. · ${formatWeight(metrics.tonnage)} объём · ${metrics.top ? `${formatWeight(metrics.top.weight)} × ${metrics.top.reps}` : "нет рабочих"}`}</small>
            </button>
            ${exerciseExpanded ? `<div class="sets-list">${sets.map(renderSetRow).join("")}</div>` : ""}
          </article>
        `;
      }).join("") : ""}
    </section>
  `;
}

function renderSettings() {
  const days = setsByDay().size;
  const storageKb = Math.round(new Blob([JSON.stringify(state)]).size / 1024);
  return `
    <section class="progress-top">
      <h1>Данные</h1>
      <button data-action="check-update">Проверить обновления</button>
    </section>
    <section class="insight-grid">
      <div class="insight"><span>Версия данных</span><strong>${state.schemaVersion || DATA_VERSION}</strong><p>Миграции применяются автоматически</p></div>
      <div class="insight"><span>Дней</span><strong>${days}</strong><p>Дни с записанными подходами</p></div>
      <div class="insight"><span>Подходов</span><strong>${state.sets.length}</strong><p>Все записи хранятся локально</p></div>
      <div class="insight"><span>Размер</span><strong>${storageKb} КБ</strong><p>Примерно в памяти браузера</p></div>
    </section>
    <section class="panel">
      <h2>Резервная копия</h2>
      <p class="muted">Экспорт сохраняет упражнения, подходы, картинки и настройки в один JSON-файл.</p>
      <div class="actions settings-actions">
        <button class="primary" data-action="export">Скачать JSON</button>
        <label class="file-action">
          <span>Импорт JSON</span>
          <input type="file" accept="application/json,.json" data-action="import-file" />
        </label>
      </div>
    </section>
    <section class="panel">
      <h2>PWA</h2>
      <div class="settings-list">
        <div><strong>Установка</strong><span>Кнопка установки появляется, когда браузер разрешает установку.</span></div>
        <div><strong>Обновления</strong><span>Приложение проверяет новый service worker при запуске и раз в минуту.</span></div>
        <div><strong>Оффлайн</strong><span>Последняя загруженная версия открывается без сети, данные остаются на устройстве.</span></div>
      </div>
    </section>
  `;
}

function bindEvents(root) {
  root.querySelectorAll("[data-action='home']").forEach((button) => button.addEventListener("click", () => setRoute({ name: "home" })));
  root.querySelectorAll("[data-action='progress']").forEach((button) => button.addEventListener("click", () => setRoute({ name: "progress" })));
  root.querySelectorAll("[data-action='history']").forEach((button) => button.addEventListener("click", () => setRoute({ name: "history" })));
  root.querySelectorAll("[data-action='settings']").forEach((button) => button.addEventListener("click", () => setRoute({ name: "settings" })));
  root.querySelector("[data-action='toggle-form']")?.addEventListener("click", () => {
    exerciseFormOpen = !exerciseFormOpen;
    render();
  });
  root.querySelectorAll("[data-action='history-day']").forEach((button) => button.addEventListener("click", () => {
    const key = button.dataset.day;
    activeHistoryDay = key;
    if (route.name !== "history") route = { name: "history" };
    const [year, month] = key.split("-").map(Number);
    historyCursor = new Date(year, month - 1, 1);
    render();
  }));
  root.querySelectorAll("[data-action='history-exercise']").forEach((button) => button.addEventListener("click", () => {
    const key = button.dataset.key;
    expandedHistoryExercises.has(key) ? expandedHistoryExercises.delete(key) : expandedHistoryExercises.add(key);
    render();
  }));
  root.querySelectorAll("[data-action='history-month']").forEach((button) => button.addEventListener("click", () => {
    historyCursor = shiftMonth(historyCursor, Number(button.dataset.delta));
    render();
  }));
  root.querySelectorAll("[data-open-exercise]").forEach((card) => card.addEventListener("click", () => {
    const exercise = state.exercises.find((item) => item.id === card.dataset.openExercise);
    draftSet = exercise && !isCardioExercise(exercise)
      ? suggestedDraftSet(exercise.id, { warmup: true })
      : { weight: "", reps: "8", reserve: 2, warmup: false };
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
    updateStrengthComparison(root);
  });
  root.querySelector("[name='warmup']")?.addEventListener("change", (event) => {
    if (!editingSetId) draftSet.warmup = event.target.checked;
    applySuggestedStrengthValues(root);
    updateStrengthComparison(root);
  });
  root.querySelectorAll("[data-set-field]").forEach((input) => {
    input.addEventListener("focus", () => {
      activeSetField = input.dataset.setField;
      root.querySelectorAll("[data-set-field]").forEach((item) => item.classList.toggle("active", item === input));
    });
    input.addEventListener("click", () => {
      activeSetField = input.dataset.setField;
      root.querySelectorAll("[data-set-field]").forEach((item) => item.classList.toggle("active", item === input));
    });
    input.addEventListener("input", () => {
      if (!editingSetId) draftSet[input.dataset.setField] = input.value;
      updateStrengthComparison(root);
    });
  });
  root.querySelectorAll("[data-step-field]").forEach((button) => button.addEventListener("click", () => {
    const input = root.querySelector(`[name='${button.dataset.stepField}']`);
    const current = Number(String(input.value || 0).replace(",", "."));
    const next = Math.max(button.dataset.stepField === "weight" ? 1 : 1, current + Number(button.dataset.delta));
    input.value = button.dataset.stepField === "weight" ? formatWeight(next).replace(",", ".") : String(Math.round(next));
    if (!editingSetId) draftSet[button.dataset.stepField] = input.value;
    updateStrengthComparison(root);
  }));
  root.querySelectorAll("[data-key]").forEach((button) => button.addEventListener("click", () => {
    handleKeypad(button.dataset.key);
    updateStrengthComparison(root);
  }));
  root.querySelector("[data-action='toggle-keyboard']")?.addEventListener("click", () => {
    nativeKeyboard = !nativeKeyboard;
    render();
  });
  root.querySelectorAll("[data-action='set-reserve']").forEach((button) => button.addEventListener("click", () => {
    const form = root.querySelector("[data-form='set']");
    const reserve = Number(button.dataset.reserve);
    if (!form) return;
    form.elements.reserve.value = reserve;
    form.elements.warmup.checked = reserve >= 6;
    if (!editingSetId) {
      draftSet.reserve = reserve;
      draftSet.warmup = reserve >= 6;
    }
    root.querySelector("#reserveText").textContent = reserveName(reserve);
    applySuggestedStrengthValues(root);
    updateStrengthComparison(root);
  }));
  root.querySelectorAll("[data-action='cardio-duration']").forEach((button) => button.addEventListener("click", () => {
    const form = root.querySelector("[data-form='set'][data-kind='cardio']");
    if (!form) return;
    form.elements.minutes.value = button.dataset.minutes || "0";
    form.elements.seconds.value = button.dataset.seconds || "0";
    if (!editingSetId) {
      draftCardio.minutes = form.elements.minutes.value;
      draftCardio.seconds = form.elements.seconds.value;
    }
  }));
  root.querySelectorAll("[data-action='cardio-distance']").forEach((button) => button.addEventListener("click", () => {
    const form = root.querySelector("[data-form='set'][data-kind='cardio']");
    if (!form) return;
    form.elements.distanceM.value = button.dataset.distance;
    if (!editingSetId) draftCardio.distanceM = button.dataset.distance;
  }));
  root.querySelectorAll("[data-action='cardio-setting']").forEach((button) => button.addEventListener("click", () => {
    const form = root.querySelector("[data-form='set'][data-kind='cardio']");
    if (!form) return;
    form.elements.setting.value = button.dataset.setting;
    if (!editingSetId) draftCardio.setting = button.dataset.setting;
  }));
  root.querySelectorAll("[name='minutes'], [name='seconds'], [name='distanceM'], [name='setting']").forEach((input) => input.addEventListener("input", () => {
    const form = input.closest("[data-form='set'][data-kind='cardio']");
    if (!form || editingSetId) return;
    draftCardio[input.name] = input.value;
  }));
  root.querySelectorAll("[data-action='repeat-last'], [data-action='repeat-best']").forEach((button) => button.addEventListener("click", () => {
    const form = root.querySelector("[data-form='set']");
    form.elements.weight.value = button.dataset.weight;
    form.elements.reps.value = button.dataset.reps;
    form.elements.reserve.value = button.dataset.reserve;
    draftSet = { ...draftSet, weight: button.dataset.weight, reps: button.dataset.reps, reserve: Number(button.dataset.reserve) };
    root.querySelector("#reserveText").textContent = reserveName(draftSet.reserve);
    updateStrengthComparison(root);
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
    finishSetEditing();
    render();
  });
  root.querySelectorAll("[data-action='progress-exercise']").forEach((button) => button.addEventListener("click", () => setRoute({ name: "progress", id: button.dataset.id })));
  root.querySelectorAll("[data-action='select-progress-card']").forEach((button) => button.addEventListener("click", () => setRoute({ name: "progress", id: button.dataset.id })));
  root.querySelector("[data-action='edit-exercise']")?.addEventListener("click", (event) => openEditDialog(event.currentTarget.dataset.id));
  root.querySelector("[data-action='close-exercise-editor']")?.addEventListener("click", () => {
    editingExerciseId = null;
    render();
  });
  root.querySelector("[data-action='delete-exercise']")?.addEventListener("click", (event) => deleteExercise(event.currentTarget.dataset.id));
  root.querySelector("[data-action='export']")?.addEventListener("click", exportJson);
  root.querySelector("[data-action='import-file']")?.addEventListener("change", importJson);
  root.querySelector("[data-action='check-update']")?.addEventListener("click", checkForUpdates);
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
  const existing = form.dataset.id ? state.exercises.find((exercise) => exercise.id === form.dataset.id) : null;
  if (existing) {
    existing.name = String(data.get("name")).trim() || existing.name;
    existing.icon = String(data.get("icon")).trim() || existing.icon || "🏋️";
    existing.category = data.get("category");
    existing.equipmentType = data.get("equipmentType");
    if (image) existing.image = image;
    editingExerciseId = null;
  } else {
    state.exercises.push({
      id: uid(),
      name: String(data.get("name")).trim(),
      icon: String(data.get("icon")).trim() || "🏋️",
      image,
      category: data.get("category"),
      equipmentType: data.get("equipmentType"),
      createdAt: Date.now()
    });
  }
  exerciseFormOpen = false;
  saveState();
  render();
}

function saveSet(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const existing = state.sets.find((set) => set.id === editingSetId);
  if (form.dataset.kind === "cardio") {
    const minutes = Number(data.get("minutes"));
    const seconds = Number(data.get("seconds") || 0);
    const distanceM = Number(data.get("distanceM"));
    const durationSec = minutes * 60 + seconds;
    const setting = String(data.get("setting") || "").trim();
    if (
      !Number.isInteger(minutes) ||
      !Number.isInteger(seconds) ||
      minutes < 0 ||
      seconds < 0 ||
      seconds > 59 ||
      durationSec <= 0 ||
      !Number.isFinite(distanceM) ||
      distanceM <= 0
    ) return;
    if (existing) {
      existing.type = "cardio";
      existing.durationSec = durationSec;
      existing.distanceM = Math.round(distanceM);
      existing.setting = setting;
      delete existing.durationMin;
      delete existing.distanceKm;
      delete existing.weight;
      delete existing.reps;
      delete existing.reserve;
      delete existing.effort;
      delete existing.warmup;
      existing.updatedAt = Date.now();
      lastTouchedSetId = existing.id;
      finishSetEditing();
    } else {
      const id = uid();
      state.sets.push({
        id,
        type: "cardio",
        exerciseId: form.dataset.id,
        durationSec,
        distanceM: Math.round(distanceM),
        setting,
        createdAt: Date.now()
      });
      lastTouchedSetId = id;
      draftCardio = { minutes: String(minutes), seconds: String(seconds), distanceM: String(Math.round(distanceM)), setting };
    }
    saveState();
    render();
    return;
  }
  const weight = Number(String(data.get("weight")).replace(",", "."));
  const reps = Number(data.get("reps"));
  if (!Number.isFinite(weight) || weight <= 0 || !Number.isInteger(reps) || reps <= 0) return;
  const reserve = Number(data.get("reserve"));
  const warmup = data.get("warmup") === "on";
  if (existing) {
    existing.type = "strength";
    existing.weight = weight;
    existing.reps = reps;
    existing.reserve = reserve;
    delete existing.durationSec;
    delete existing.distanceM;
    delete existing.durationMin;
    delete existing.distanceKm;
    delete existing.setting;
    delete existing.effort;
    existing.warmup = warmup;
    existing.updatedAt = Date.now();
    lastTouchedSetId = existing.id;
    finishSetEditing();
  } else {
    const id = uid();
    state.sets.push({
      id,
      type: "strength",
      exerciseId: form.dataset.id,
      weight,
      reps,
      reserve,
      warmup,
      createdAt: Date.now()
    });
    lastTouchedSetId = id;
    draftSet = suggestedDraftSet(form.dataset.id, { weight: String(weight), reps: String(reps), reserve, warmup });
  }
  saveState();
  render();
}

function deleteSet(id) {
  state.sets = state.sets.filter((set) => set.id !== id);
  if (editingSetId === id) finishSetEditing();
  saveState();
  render();
}

function startEditSet(id) {
  const set = state.sets.find((item) => item.id === id);
  if (!set) return;
  editingReturnRoute = route.name === "history"
    ? {
        name: "history",
        activeHistoryDay,
        historyCursor: historyCursor.toISOString()
      }
    : null;
  editingSetId = id;
  activeSetField = "weight";
  lastTouchedSetId = id;
  route = { name: "exercise", id: set.exerciseId };
  window.scrollTo({ top: 0, behavior: "instant" });
  render();
}

function openEditDialog(id) {
  editingExerciseId = id;
  render();
}

function deleteExercise(id) {
  const hasSets = state.sets.some((set) => set.exerciseId === id);
  if (hasSets && !confirm("У упражнения есть история. Удалить упражнение и все его подходы?")) return;
  state.exercises = state.exercises.filter((exercise) => exercise.id !== id);
  state.sets = state.sets.filter((set) => set.exerciseId !== id);
  editingExerciseId = null;
  if (route.name === "exercise" && route.id === id) route = { name: "home" };
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
  const payload = { ...state, schemaVersion: DATA_VERSION, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `training-log-${dayKey(Date.now())}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const imported = migrateState(parsed);
    const replace = confirm("Заменить текущие локальные данные импортированным файлом?");
    if (!replace) return;
    state = imported;
    saveState();
    route = { name: "settings" };
    render();
  } catch {
    alert("Не удалось прочитать JSON-файл.");
  } finally {
    event.target.value = "";
  }
}

async function checkForUpdates() {
  if (!serviceWorkerRegistration) {
    alert("Service worker ещё не зарегистрирован.");
    return;
  }
  await serviceWorkerRegistration.update();
  if (serviceWorkerRegistration.waiting) {
    showUpdatePrompt(serviceWorkerRegistration.waiting);
  } else {
    alert("Новая версия пока не найдена.");
  }
}

function drawCharts() {
  chartRefs.forEach((chart) => {
    const { id, values, labels, type, invert, pointValues } = chart;
    const canvas = document.getElementById(id);
    if (!canvas || !values.length) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(320, rect.width || canvas.clientWidth || 0);
    const height = Number(canvas.getAttribute("height"));
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    drawChart(ctx, width, height, values, labels, type, invert, pointValues);
    bindChartTooltip(canvas, chart);
  });
}

function chartGeometry(width, height, values, type) {
  const pad = { l: 54, r: 38, t: 26, b: 36 };
  const chartW = Math.max(80, width - pad.l - pad.r);
  const chartH = Math.max(80, height - pad.t - pad.b);
  const max = Math.max(...values, 1);
  const min = type === "bar" ? 0 : Math.min(...values);
  const range = max - min || 1;
  return { pad, chartW, chartH, max, min, range };
}

function clampChartPoint(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function drawChart(ctx, width, height, values, labels, type, invert = false, pointValues = null) {
  const { pad, chartW, chartH, max, min, range } = chartGeometry(width, height, values, type);
  ctx.clearRect(0, 0, width, height);
  ctx.font = "12px system-ui";
  ctx.strokeStyle = "rgba(105, 115, 108, 0.18)";
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
      const radius = 7;
      ctx.fillStyle = index === values.length - 1 ? "#d99a32" : "#315d4f";
      roundRect(ctx, x, y, slot * 0.64, barH, radius);
      ctx.fill();
    });
  } else {
    const gradient = ctx.createLinearGradient(0, pad.t, 0, pad.t + chartH);
    gradient.addColorStop(0, `${color}2b`);
    gradient.addColorStop(1, `${color}00`);
    const area = new Path2D();
    values.forEach((value, index) => {
      const x = clampChartPoint(pad.l + (chartW * index) / Math.max(1, values.length - 1), pad.l + 7, pad.l + chartW - 7);
      const y = clampChartPoint(pad.t + chartH - ((value - min) / range) * chartH, pad.t + 8, pad.t + chartH - 8);
      if (index === 0) area.moveTo(x, pad.t + chartH);
      area.lineTo(x, y);
      if (index === values.length - 1) area.lineTo(x, pad.t + chartH);
    });
    area.closePath();
    ctx.fillStyle = gradient;
    ctx.fill(area);

    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    values.forEach((value, index) => {
      const x = clampChartPoint(pad.l + (chartW * index) / Math.max(1, values.length - 1), pad.l + 7, pad.l + chartW - 7);
      const y = clampChartPoint(pad.t + chartH - ((value - min) / range) * chartH, pad.t + 8, pad.t + chartH - 8);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    values.forEach((value, index) => {
      const x = clampChartPoint(pad.l + (chartW * index) / Math.max(1, values.length - 1), pad.l + 7, pad.l + chartW - 7);
      const y = clampChartPoint(pad.t + chartH - ((value - min) / range) * chartH, pad.t + 8, pad.t + chartH - 8);
      ctx.fillStyle = pointValues ? reserveColor(pointValues[index]) : index === values.length - 1 ? "#f4f7f2" : color;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, index === values.length - 1 ? 6.5 : 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }
  ctx.fillStyle = "#69736c";
  labels.forEach((label, index) => {
    if (index !== 0 && index !== labels.length - 1 && index % Math.ceil(labels.length / 4) !== 0) return;
    const x = pad.l + (chartW * index) / Math.max(1, labels.length - 1);
    ctx.textAlign = index === 0 ? "left" : index === labels.length - 1 ? "right" : "center";
    ctx.fillText(label, clampChartPoint(x, pad.l, pad.l + chartW), height - 10);
  });
  ctx.textAlign = "left";
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, Math.abs(height) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function bindChartTooltip(canvas, chart) {
  canvas.onclick = (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const index = nearestChartIndex(x, rect.width, chart.values, chart.type);
    if (index == null) return;
    showChartTooltip(canvas, chart.details?.[index] || `${chart.labels[index]} · ${formatWeight(chart.values[index])}`);
  };
}

function nearestChartIndex(x, width, values, type) {
  if (!values.length) return null;
  const { pad, chartW } = chartGeometry(width, 220, values, type);
  if (type === "bar") {
    const slot = chartW / values.length;
    return Math.max(0, Math.min(values.length - 1, Math.floor((x - pad.l) / slot)));
  }
  const ratio = (x - pad.l) / Math.max(1, chartW);
  return Math.max(0, Math.min(values.length - 1, Math.round(ratio * (values.length - 1))));
}

function showChartTooltip(canvas, text) {
  chartTooltip?.remove();
  const rect = canvas.getBoundingClientRect();
  chartTooltip = document.createElement("div");
  chartTooltip.className = "chart-tooltip";
  chartTooltip.textContent = text;
  chartTooltip.style.left = `${Math.min(window.innerWidth - 18, Math.max(8, rect.left + 12))}px`;
  chartTooltip.style.top = `${Math.max(8, rect.top + window.scrollY + 12)}px`;
  document.body.append(chartTooltip);
  window.setTimeout(() => chartTooltip?.remove(), 3200);
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
  serviceWorkerRegistration = registration;

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
