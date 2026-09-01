import { DEFAULT_COACH_CONFIG } from "./engine.js";

const EQUIPMENT_INCREMENTS = Object.freeze({
  barbell: 2.5,
  // Common commercial fixed dumbbells above 10 kg advance by 2 kg per hand.
  dumbbell: 2,
  cable: 5,
  machine: 5,
  smith: 2.5,
  other: 1
});

export function defaultWeightIncrement(equipmentType, dumbbellCount = 2) {
  const base = EQUIPMENT_INCREMENTS[equipmentType] || 1;
  return equipmentType === "dumbbell" ? base * Math.max(1, Math.min(2, Number(dumbbellCount) || 2)) : base;
}

export function coachSupported(exercise) {
  return Boolean(exercise) && !["cardio", "bodyweight"].includes(exercise.equipmentType) && exercise.category !== "cardio";
}

function localDayKey(timestamp) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function exerciseCoachDefaults(exercise) {
  const repMin = Math.max(1, Math.round(Number(exercise?.coachRepMin) || DEFAULT_COACH_CONFIG.repMin));
  return {
    increment: Math.max(0.25, Number(exercise?.weightIncrement) || defaultWeightIncrement(exercise?.equipmentType, exercise?.dumbbellCount)),
    repMin,
    repMax: Math.max(repMin, Math.round(Number(exercise?.coachRepMax) || DEFAULT_COACH_CONFIG.repMax)),
    targetRir: DEFAULT_COACH_CONFIG.targetRir
  };
}

export function buildCoachContext(state, exerciseId, now = Date.now(), draftWeight = null) {
  const exercise = state.exercises.find((item) => item.id === exerciseId);
  if (!coachSupported(exercise)) return { supported: false, exercise };
  const today = localDayKey(now);
  const grouped = new Map();
  (state.sets || [])
    .filter((set) => set.exerciseId === exerciseId && set.type !== "cardio" && !set.warmup && Number(set.createdAt) <= now)
    .sort((a, b) => a.createdAt - b.createdAt)
    .forEach((set) => {
      const key = localDayKey(set.createdAt);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push({
        weight: Number(set.weight),
        reps: Number(set.reps),
        rir: Number(set.reserve ?? Math.max(0, 10 - Number(set.effort || 10))),
        createdAt: Number(set.createdAt)
      });
    });
  const currentSets = grouped.get(today) || [];
  const historicalSessions = [...grouped.entries()]
    .filter(([key]) => key !== today)
    .map(([, sets]) => ({ date: sets[0]?.createdAt || 0, sets }));
  const defaults = exerciseCoachDefaults(exercise);
  return {
    supported: true,
    exercise,
    historicalSessions,
    currentSets,
    draftWeight: Number(draftWeight) || null,
    increment: defaults.increment,
    config: {
      repMin: defaults.repMin,
      repMax: defaults.repMax,
      targetRir: defaults.targetRir
    },
    now
  };
}
