import fs from "node:fs";
import path from "node:path";
import { recommendNextSet } from "../src/coach/engine.js";
import { buildCoachContext, coachSupported } from "../src/coach/context.js";
import { formatCoachRecommendation } from "../src/coach/messages.js";

const sourcePath = path.resolve(process.argv[2] || "training-log-2026-08-11.json");
const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const date = (timestamp) => new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Tallinn",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
}).format(new Date(timestamp));
const value = (recommendation) => {
  if (recommendation.weight == null) return "—";
  const reps = recommendation.reps.min === recommendation.reps.max
    ? recommendation.reps.min
    : `${recommendation.reps.min}-${recommendation.reps.max}`;
  return `${recommendation.weight} kg × ${reps}`;
};

const exerciseSets = new Map();
for (const set of source.sets || []) {
  if (set.type === "cardio" || set.warmup) continue;
  if (!exerciseSets.has(set.exerciseId)) exerciseSets.set(set.exerciseId, []);
  exerciseSets.get(set.exerciseId).push(set);
}
console.log(`Read-only Coach replay: ${sourcePath}`);
for (const exercise of source.exercises || []) {
  if (!coachSupported(exercise)) continue;
  const sets = (exerciseSets.get(exercise.id) || []).sort((a, b) => a.createdAt - b.createdAt);
  const days = [...new Set(sets.map((set) => date(set.createdAt)))];
  if (days.length < 2) continue;
  console.log(`\n${exercise.name} (${days.length} sessions)`);
  for (const day of days) {
    const current = sets.filter((set) => date(set.createdAt) === day);
    const before = buildCoachContext(source, exercise.id, current[0].createdAt - 1);
    const beforeRecommendation = recommendNextSet(before);
    const beforeView = formatCoachRecommendation(beforeRecommendation, "ru");
    console.log(`  ${day} before: ${beforeRecommendation.action} | ${value(beforeRecommendation)} | ${beforeView.explanation}`);
    current.forEach((set, index) => {
      const context = buildCoachContext(source, exercise.id, set.createdAt);
      const recommendation = recommendNextSet(context);
      const view = formatCoachRecommendation(recommendation, "ru");
      console.log(`    after ${index + 1}: actual ${set.weight}×${set.reps} @${set.reserve} | ${recommendation.action} | ${value(recommendation)} | ${view.explanation}`);
    });
  }
}
