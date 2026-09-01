import test from "node:test";
import assert from "node:assert/strict";
import { COACH_ACTIONS, recommendNextSet } from "../src/coach/engine.js";
import { buildCoachContext, coachSupported, defaultWeightIncrement, exerciseCoachDefaults } from "../src/coach/context.js";

const NOW = Date.UTC(2026, 7, 11, 12);
const DAY = 86_400_000;

function set(weight, reps, rir, createdAt = NOW) {
  return { weight, reps, rir, createdAt };
}

function session(daysAgo, sets) {
  return { date: NOW - daysAgo * DAY, sets };
}

function recommend(overrides = {}) {
  return recommendNextSet({
    historicalSessions: [],
    currentSets: [],
    increment: 2.5,
    config: { repMin: 8, repMax: 12, targetRir: 2 },
    now: NOW,
    ...overrides
  });
}

test("exercise without history does not invent a starting weight", () => {
  const result = recommend();
  assert.equal(result.action, COACH_ACTIONS.INSUFFICIENT);
  assert.equal(result.weight, null);
  assert.equal(result.confidence.level, "low");
});

test("one previous session is repeated conservatively", () => {
  const result = recommend({ historicalSessions: [session(7, [set(50, 10, 2), set(50, 9, 2)])] });
  assert.equal(result.action, COACH_ACTIONS.HOLD);
  assert.equal(result.weight, 50);
  assert.equal(result.confidence.level, "low");
});

test("little history does not trigger progression", () => {
  const result = recommend({ historicalSessions: [
    session(14, [set(50, 12, 2), set(50, 12, 2)]),
    session(7, [set(50, 9, 1), set(50, 8, 1)])
  ] });
  assert.equal(result.action, COACH_ACTIONS.HOLD);
});

test("stable work in target zone keeps weight", () => {
  const result = recommend({ historicalSessions: [
    session(21, [set(50, 10, 2), set(50, 9, 2)]),
    session(14, [set(50, 10, 2), set(50, 10, 1)]),
    session(7, [set(50, 11, 2), set(50, 10, 2)])
  ] });
  assert.equal(result.action, COACH_ACTIONS.HOLD);
  assert.equal(result.weight, 50);
});

test("sustained top-of-range performance increases next-session starting weight once", () => {
  const result = recommend({ historicalSessions: [
    session(21, [set(50, 11, 2), set(50, 11, 2)]),
    session(14, [set(50, 12, 2), set(50, 12, 1)]),
    session(7, [set(50, 12, 3), set(50, 12, 2)])
  ] });
  assert.equal(result.action, COACH_ACTIONS.INCREASE);
  assert.equal(result.weight, 52.5);
});

test("clearly easy early set can produce a bounded same-day increase", () => {
  const history = [28, 21, 14, 7].map((days) => session(days, [set(50, 10, 2), set(50, 9, 2)]));
  const result = recommend({ historicalSessions: history, currentSets: [set(50, 11, 5)] });
  assert.equal(result.action, COACH_ACTIONS.INCREASE);
  assert.equal(result.weight, 52.5);
  assert.ok(result.reasonCodes.includes("same_day_adjustment"));
});

test("too-heavy first set decreases by one increment", () => {
  const result = recommend({
    historicalSessions: [session(7, [set(50, 10, 2), set(50, 9, 2)])],
    currentSets: [set(55, 6, 0)]
  });
  assert.equal(result.action, COACH_ACTIONS.DECREASE);
  assert.equal(result.weight, 52.5);
});

test("early zero RIR never increases load", () => {
  const result = recommend({
    historicalSessions: [session(7, [set(50, 10, 2), set(50, 9, 2)])],
    currentSets: [set(50, 8, 0)]
  });
  assert.notEqual(result.action, COACH_ACTIONS.INCREASE);
  assert.equal(result.targetRir, 2);
});

test("normal set-to-set decline holds weight", () => {
  const history = [21, 14, 7].map((days) => session(days, [set(50, 11, 2), set(50, 10, 2), set(50, 9, 1)]));
  const result = recommend({ historicalSessions: history, currentSets: [set(50, 11, 2), set(50, 10, 2)] });
  assert.equal(result.action, COACH_ACTIONS.HOLD);
  assert.equal(result.weight, 50);
});

test("excessive drop with minimal reserve ends the exercise", () => {
  const result = recommend({ currentSets: [set(50, 12, 2), set(50, 2, 1)] });
  assert.equal(result.action, COACH_ACTIONS.FINISH);
});

test("unusually bad day reduces the early load", () => {
  const history = [21, 14, 7].map((days) => session(days, [set(60, 10, 2), set(60, 9, 2)]));
  const result = recommend({ historicalSessions: history, currentSets: [set(60, 7, 1)] });
  assert.equal(result.action, COACH_ACTIONS.DECREASE);
  assert.equal(result.weight, 57.5);
});

test("unusually good day changes only the next set today", () => {
  const history = [28, 21, 14, 7].map((days) => session(days, [set(50, 10, 2), set(50, 9, 2)]));
  const sameDay = recommend({ historicalSessions: history, currentSets: [set(50, 12, 4)] });
  const nextSession = recommend({ historicalSessions: history });
  assert.equal(sameDay.action, COACH_ACTIONS.INCREASE);
  assert.equal(nextSession.action, COACH_ACTIONS.HOLD);
});

test("single anomalously good historical session cannot progress starting weight", () => {
  const result = recommend({ historicalSessions: [
    session(21, [set(50, 9, 2), set(50, 9, 1)]),
    session(14, [set(50, 9, 2), set(50, 8, 2)]),
    session(7, [set(50, 12, 4), set(50, 12, 3)])
  ] });
  assert.equal(result.action, COACH_ACTIONS.HOLD);
});

test("a newly adopted higher weight is consolidated", () => {
  const result = recommend({ historicalSessions: [
    session(14, [set(50, 12, 2), set(50, 12, 2)]),
    session(7, [set(52.5, 10, 2), set(52.5, 9, 1)])
  ] });
  assert.equal(result.action, COACH_ACTIONS.HOLD);
  assert.equal(result.weight, 52.5);
  assert.ok(result.reasonCodes.includes("consolidate_new_weight"));
});

test("successful consolidation can progress on a later session", () => {
  const result = recommend({ historicalSessions: [
    session(21, [set(50, 12, 2), set(50, 12, 2)]),
    session(14, [set(52.5, 12, 2), set(52.5, 12, 2)]),
    session(7, [set(52.5, 12, 2), set(52.5, 12, 1)])
  ] });
  assert.equal(result.action, COACH_ACTIONS.INCREASE);
  assert.equal(result.weight, 55);
});

test("zero RIR after productive work recommends a back-off", () => {
  const result = recommend({ currentSets: [set(50, 11, 2), set(50, 10, 0)] });
  assert.equal(result.action, COACH_ACTIONS.BACK_OFF);
  assert.equal(result.weight, 47.5);
  assert.deepEqual(result.targetRir, { min: 2, max: 3 });
});

test("two consecutive zero-RIR sets recommend finish", () => {
  const result = recommend({ currentSets: [set(50, 10, 2), set(50, 9, 0), set(47.5, 9, 0)] });
  assert.equal(result.action, COACH_ACTIONS.FINISH);
  assert.equal(result.weight, null);
});

test("typical set count contributes to finish only with low RIR and a same-load drop", () => {
  const history = [21, 14, 7].map((days) => session(days, [set(50, 11, 2), set(50, 10, 2), set(50, 9, 1), set(50, 9, 1)]));
  const freshAtTypicalCount = recommend({ historicalSessions: history, currentSets: [set(50, 10, 2), set(50, 10, 2), set(50, 10, 2), set(50, 10, 2)] });
  const fatiguedAtTypicalCount = recommend({ historicalSessions: history, currentSets: [set(50, 11, 2), set(50, 10, 2), set(50, 9, 1), set(50, 8, 1)] });
  assert.equal(freshAtTypicalCount.action, COACH_ACTIONS.HOLD);
  assert.equal(fatiguedAtTypicalCount.action, COACH_ACTIONS.FINISH);
});

test("subjectively strange RIR does not authorize an increase", () => {
  const history = [28, 21, 14, 7].map((days) => session(days, [set(50, 10, 2), set(50, 9, 2)]));
  const result = recommend({ historicalSessions: history, currentSets: [set(50, 9, 8)] });
  assert.equal(result.action, COACH_ACTIONS.HOLD);
});

test("all load changes use the configured equipment increment", () => {
  const history = [21, 14, 7].map((days) => session(days, [set(42, 12, 2), set(42, 12, 2)]));
  const result = recommend({ historicalSessions: history, increment: 5 });
  assert.equal(result.action, COACH_ACTIONS.INCREASE);
  assert.equal(result.weight, 47);
});

test("a user-entered weight is retained when history is absent", () => {
  const result = recommend({ draftWeight: 35 });
  assert.equal(result.action, COACH_ACTIONS.HOLD);
  assert.equal(result.weight, 35);
  assert.equal(result.confidence.level, "low");
});

test("conflicting sessions resolve conservatively", () => {
  const result = recommend({ historicalSessions: [
    session(21, [set(50, 12, 3), set(50, 12, 2)]),
    session(14, [set(50, 6, 0), set(50, 7, 1)]),
    session(7, [set(50, 12, 3), set(50, 12, 2)])
  ] });
  assert.equal(result.action, COACH_ACTIONS.HOLD);
  assert.notEqual(result.confidence.level, "high");
});

test("history cannot inflate an equipment default increment", () => {
  assert.equal(defaultWeightIncrement("barbell"), 2.5);
  assert.equal(defaultWeightIncrement("smith"), 2.5);
  assert.equal(defaultWeightIncrement("dumbbell", 2), 4);
  assert.equal(defaultWeightIncrement("dumbbell", 1), 2);
  const defaults = exerciseCoachDefaults({ equipmentType: "barbell" });
  assert.equal(defaults.increment, 2.5);
});

test("paired dumbbell coach uses total load and the pair increment", () => {
  const result = recommend({
    increment: defaultWeightIncrement("dumbbell", 2),
    historicalSessions: [
      session(21, [set(44, 12, 2), set(44, 12, 2)]),
      session(14, [set(44, 12, 2), set(44, 12, 2)]),
      session(7, [set(44, 12, 2), set(44, 12, 2)])
    ]
  });
  assert.equal(result.action, COACH_ACTIONS.INCREASE);
  assert.equal(result.weight, 48);
});

test("cardio and bodyweight are explicitly unsupported in v1", () => {
  assert.equal(coachSupported({ equipmentType: "cardio", category: "cardio" }), false);
  assert.equal(coachSupported({ equipmentType: "bodyweight", category: "core" }), false);
  assert.equal(coachSupported({ equipmentType: "barbell", category: "push" }), true);
});

test("context excludes warm-ups, future sets and other exercises", () => {
  const exercise = { id: "bench", category: "push", equipmentType: "barbell", weightIncrement: 2.5, coachRepMin: 8, coachRepMax: 12 };
  const state = {
    exercises: [exercise],
    sets: [
      { type: "strength", exerciseId: "bench", weight: 20, reps: 10, reserve: 8, warmup: true, createdAt: NOW - DAY },
      { type: "strength", exerciseId: "bench", weight: 50, reps: 10, reserve: 2, warmup: false, createdAt: NOW - DAY },
      { type: "strength", exerciseId: "bench", weight: 60, reps: 10, reserve: 2, warmup: false, createdAt: NOW + DAY },
      { type: "strength", exerciseId: "other", weight: 80, reps: 10, reserve: 2, warmup: false, createdAt: NOW - DAY }
    ]
  };
  const context = buildCoachContext(state, "bench", NOW);
  assert.equal(context.historicalSessions.length, 1);
  assert.equal(context.historicalSessions[0].sets.length, 1);
  assert.equal(context.historicalSessions[0].sets[0].weight, 50);
});
