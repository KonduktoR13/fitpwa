export const COACH_ACTIONS = Object.freeze({
  HOLD: "hold",
  INCREASE: "increase",
  DECREASE: "decrease",
  BACK_OFF: "back_off",
  FINISH: "finish",
  INSUFFICIENT: "insufficient_data"
});

export const DEFAULT_COACH_CONFIG = Object.freeze({
  repMin: 8,
  repMax: 12,
  targetRir: 2,
  historyLimit: 5,
  personalRetentionMinSamples: 3,
  longGapDays: 21,
  backoffDeviation: 0.07,
  severeRetention: 0.8
});

const DAY_MS = 86_400_000;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function median(values) {
  const sorted = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function validSet(set) {
  return Number(set?.weight) > 0 && Number(set?.reps) > 0 && Number.isFinite(Number(set?.rir));
}

export function coachPerformance(set) {
  if (!validSet(set)) return null;
  const rirCredit = 0.5 * clamp(Number(set.rir), 0, 4);
  return Number(set.weight) * (1 + (Number(set.reps) + rirCredit) / 30);
}

function primaryWeight(sets) {
  const counts = new Map();
  sets.forEach((set) => counts.set(Number(set.weight), (counts.get(Number(set.weight)) || 0) + 1));
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || right[0] - left[0])[0]?.[0] ?? null;
}

function summarizeSession(session, config) {
  const sets = (session.sets || session).filter(validSet);
  const primary = primaryWeight(sets);
  const primarySets = sets.filter((set) => Number(set.weight) === primary);
  const typicalReps = median(primarySets.map((set) => Number(set.reps)));
  const typicalRir = median(primarySets.map((set) => Number(set.rir)));
  const targetEquivalent = median(primarySets.map((set) => Number(set.reps) + clamp(Number(set.rir) - config.targetRir, -2, 2)));
  const supportsIncrease = primarySets.length >= 2 && targetEquivalent >= config.repMax - 0.5 && typicalRir >= config.targetRir - 1;
  const tooHeavy = primarySets.length >= 1 && typicalReps < config.repMin && typicalRir <= 1;
  return {
    date: Number(session.date || sets[0]?.createdAt || 0),
    sets,
    primaryWeight: primary,
    typicalReps,
    typicalRir,
    supportsIncrease,
    tooHeavy
  };
}

function personalRetention(sessions, nextSetIndex, config) {
  const ratios = [];
  sessions.forEach((session) => {
    const sets = session.sets;
    if (sets.length <= nextSetIndex) return;
    const first = coachPerformance(sets[0]);
    const target = coachPerformance(sets[nextSetIndex]);
    if (first > 0 && target > 0) ratios.push(target / first);
  });
  if (ratios.length >= config.personalRetentionMinSamples) {
    return { value: clamp(median(ratios), 0.78, 1.05), personalized: true, samples: ratios.length };
  }
  // Submaximal straight sets generally decline less than repeated sets to failure.
  // These conservative defaults allow a modest decline until personal data exists.
  const defaults = [1, 0.97, 0.94, 0.91, 0.89, 0.87];
  return {
    value: defaults[Math.min(nextSetIndex, defaults.length - 1)],
    personalized: false,
    samples: ratios.length
  };
}

function historicalConsistency(sessions) {
  if (sessions.length < 2) return false;
  const recentWeights = sessions.slice(-3).map((session) => session.primaryWeight).filter(Number.isFinite);
  if (recentWeights.length < 2) return false;
  const max = Math.max(...recentWeights);
  const min = Math.min(...recentWeights);
  return max === min || max / Math.max(min, 1) <= 1.1;
}

function confidenceFor(sessions, currentSets, now, flags = {}) {
  let score = 0.2 + Math.min(4, sessions.length) * 0.12 + Math.min(3, currentSets.length) * 0.08;
  if (historicalConsistency(sessions)) score += 0.08;
  if (flags.conflicting) score -= 0.12;
  if (flags.outlierRir) score -= 0.1;
  const lastDate = sessions.at(-1)?.date;
  if (lastDate && now - lastDate > DEFAULT_COACH_CONFIG.longGapDays * DAY_MS) score -= 0.1;
  score = clamp(score, 0.15, 0.92);
  return {
    score: Math.round(score * 100) / 100,
    level: score < 0.45 ? "low" : score < 0.72 ? "medium" : "high"
  };
}

function repTarget(latest, config, fatigueStep = 0) {
  const effortAdjustment = 0.5 * clamp(Number(latest.rir) - config.targetRir, -2, 2);
  const center = clamp(Math.round(Number(latest.reps) + effortAdjustment - fatigueStep), config.repMin, config.repMax);
  return {
    min: clamp(center - 1, config.repMin, config.repMax),
    max: clamp(center + 1, config.repMin, config.repMax)
  };
}

function result(action, confidence, values = {}) {
  return {
    status: action === COACH_ACTIONS.INSUFFICIENT ? "insufficient" : "recommendation",
    action,
    weight: values.weight ?? null,
    reps: values.reps ?? null,
    targetRir: values.targetRir ?? null,
    confidence,
    reasonCodes: values.reasonCodes || [],
    signals: values.signals || {}
  };
}

function startingRecommendation({ sessions, draftWeight, increment, config, confidence, now, conflicting }) {
  if (!sessions.length) {
    if (!(Number(draftWeight) > 0)) {
      return result(COACH_ACTIONS.INSUFFICIENT, confidence, {
        reasonCodes: ["no_history", "enter_starting_weight"]
      });
    }
    return result(COACH_ACTIONS.HOLD, confidence, {
      weight: Number(draftWeight),
      reps: { min: config.repMin, max: config.repMax },
      targetRir: config.targetRir,
      reasonCodes: ["no_history", "use_user_starting_weight"]
    });
  }

  const latest = sessions.at(-1);
  const anchor = latest.primaryWeight;
  const recentSameWeight = sessions.slice(-3).filter((session) => session.primaryWeight === anchor);
  const supporting = recentSameWeight.filter((session) => session.supportsIncrease).length;
  const tooHeavy = sessions.slice(-3).filter((session) => session.tooHeavy).length;
  const longGap = latest.date > 0 && now - latest.date > config.longGapDays * DAY_MS;
  const newlyAdopted = sessions.length >= 2 && latest.primaryWeight > sessions.at(-2).primaryWeight && recentSameWeight.length === 1;

  if (tooHeavy >= 2) {
    return result(COACH_ACTIONS.DECREASE, confidence, {
      weight: Math.max(increment, anchor - increment),
      reps: { min: config.repMin, max: config.repMax },
      targetRir: config.targetRir,
      reasonCodes: ["repeated_too_heavy"]
    });
  }

  if (supporting >= 2 && confidence.level !== "low" && !longGap && !newlyAdopted && !conflicting) {
    return result(COACH_ACTIONS.INCREASE, confidence, {
      weight: anchor + increment,
      reps: { min: config.repMin, max: Math.max(config.repMin, config.repMax - 2) },
      targetRir: config.targetRir,
      reasonCodes: ["rolling_progress_confirmed"]
    });
  }

  return result(COACH_ACTIONS.HOLD, confidence, {
    weight: anchor,
    reps: { min: config.repMin, max: config.repMax },
    targetRir: config.targetRir,
    reasonCodes: [
      newlyAdopted ? "consolidate_new_weight" : longGap ? "long_gap_hold" : sessions.length === 1 ? "limited_history_hold" : "history_hold"
    ]
  });
}

export function recommendNextSet(input) {
  const config = { ...DEFAULT_COACH_CONFIG, ...(input.config || {}) };
  config.repMin = Math.max(1, Math.round(Number(config.repMin) || DEFAULT_COACH_CONFIG.repMin));
  config.repMax = Math.max(config.repMin, Math.round(Number(config.repMax) || DEFAULT_COACH_CONFIG.repMax));
  const increment = Math.max(0.25, Number(input.increment) || 1);
  const now = Number(input.now) || Date.now();
  const sessions = (input.historicalSessions || [])
    .map((session) => summarizeSession(session, config))
    .filter((session) => session.sets.length && session.primaryWeight > 0)
    .slice(-config.historyLimit);
  const currentSets = (input.currentSets || []).filter(validSet);
  const conflicting = sessions.slice(-3).some((session) => session.supportsIncrease) && sessions.slice(-3).some((session) => session.tooHeavy);
  const outlierRir = currentSets.some((set) => Number(set.rir) >= 6 && Number(set.reps) < config.repMax - 1);
  const confidence = confidenceFor(sessions, currentSets, now, { conflicting, outlierRir });

  if (!currentSets.length) {
    return startingRecommendation({ sessions, draftWeight: input.draftWeight, increment, config, confidence, now, conflicting });
  }

  const latest = currentSets.at(-1);
  const first = currentSets[0];
  const bestPerformance = Math.max(...currentSets.map(coachPerformance));
  const latestPerformance = coachPerformance(latest);
  const actualRetention = latestPerformance / bestPerformance;
  const sameWeightPerformances = currentSets
    .filter((set) => Number(set.weight) === Number(latest.weight))
    .map(coachPerformance);
  const sameWeightRetention = latestPerformance / Math.max(...sameWeightPerformances);
  const nextIndex = currentSets.length;
  const expected = personalRetention(sessions, nextIndex - 1, config);
  const typicalSetCount = median(sessions.map((session) => session.sets.length));
  const atTypicalVolume = typicalSetCount != null && currentSets.length >= typicalSetCount;
  const consecutiveZero = currentSets.length >= 2 && currentSets.slice(-2).every((set) => Number(set.rir) === 0);
  const severeDrop = currentSets.length >= 2 && actualRetention <= config.severeRetention && Number(latest.rir) <= 1;
  const fatigueVsExpected = actualRetention < expected.value - config.backoffDeviation;
  const fatigueAtTypicalVolume = atTypicalVolume && Number(latest.rir) <= 1 && (
    actualRetention < expected.value - 0.03 ||
    (Number(latest.reps) <= config.repMin && sameWeightRetention < 0.95)
  );

  const commonSignals = {
    actualRetention: Math.round(actualRetention * 1000) / 1000,
    sameWeightRetention: Math.round(sameWeightRetention * 1000) / 1000,
    expectedRetention: Math.round(expected.value * 1000) / 1000,
    personalizedRetention: expected.personalized,
    retentionSamples: expected.samples,
    typicalSetCount
  };

  if (consecutiveZero || severeDrop || fatigueAtTypicalVolume) {
    return result(COACH_ACTIONS.FINISH, confidence, {
      reasonCodes: [consecutiveZero ? "repeated_zero_rir" : severeDrop ? "severe_performance_drop" : "fatigue_at_typical_volume"],
      signals: commonSignals
    });
  }

  if (currentSets.length === 1 && Number(latest.reps) < config.repMin && Number(latest.rir) <= 1) {
    return result(COACH_ACTIONS.DECREASE, confidence, {
      weight: Math.max(increment, Number(latest.weight) - increment),
      reps: { min: config.repMin, max: Math.max(config.repMin, config.repMax - 2) },
      targetRir: config.targetRir,
      reasonCodes: ["early_set_too_heavy"],
      signals: commonSignals
    });
  }

  if (currentSets.length >= 2 && (Number(latest.rir) === 0 || (Number(latest.rir) <= 1 && (Number(latest.reps) < config.repMin || fatigueVsExpected)))) {
    return result(COACH_ACTIONS.BACK_OFF, confidence, {
      weight: Math.max(increment, Number(latest.weight) - increment),
      reps: { min: config.repMin, max: Math.max(config.repMin, config.repMax - 1) },
      targetRir: { min: 2, max: 3 },
      reasonCodes: [Number(latest.rir) === 0 ? "zero_rir_backoff" : "performance_below_expected"],
      signals: commonSignals
    });
  }

  const alreadyIncreasedToday = currentSets.some((set) => Number(set.weight) > Number(first.weight));
  const clearlyEasy = Number(latest.reps) >= config.repMax - 1 && Number(latest.rir) >= 4;
  const highRepOnly = Number(latest.reps) + Number(latest.rir) > 15 && sessions.length < 3;
  if (currentSets.length <= 2 && !alreadyIncreasedToday && clearlyEasy && !highRepOnly && confidence.level !== "low" && !outlierRir) {
    return result(COACH_ACTIONS.INCREASE, confidence, {
      weight: Number(latest.weight) + increment,
      reps: { min: config.repMin, max: Math.max(config.repMin, config.repMax - 2) },
      targetRir: config.targetRir,
      reasonCodes: ["clearly_easy_today", "same_day_adjustment"],
      signals: commonSignals
    });
  }

  const projectedFatigue = actualRetention < expected.value ? 1 : 0;
  return result(COACH_ACTIONS.HOLD, confidence, {
    weight: Number(latest.weight),
    reps: repTarget(latest, config, projectedFatigue),
    targetRir: config.targetRir,
    reasonCodes: [fatigueVsExpected ? "fatigue_but_hold" : currentSets.length > 1 ? "normal_set_fatigue" : "today_in_target"],
    signals: commonSignals
  });
}
