# Coach Engine v1: research and decisions

Status: approved phase 1 design; implemented in Coach Engine v1, 2026-08-11.

## Scope

Coach answers one optional question: “What is a reasonable next working set now?” It is a local, deterministic assistant, not a program generator. It never saves a set, changes a workout automatically, diagnoses readiness, or recommends cardio/bodyweight work in v1.

The only Coach entry point is one compact `Coach` button on the exercise execution screen, inside the main set-entry card, in its top row and to the **left** of the existing `Other options` button: `[ Coach ] … [ Other options ]`. There is no Coach FAB, dashboard, navigation item, home-screen action or second Coach button.

## Evidence used

- The 2026 ACSM position stand synthesizes 137 systematic reviews. Resistance training works across a broad range of prescriptions; higher load is more specific to maximal strength, volume matters for hypertrophy, and training to momentary failure did not consistently improve hypertrophy. This supports useful effort and progressive work without making 0 RIR the default. [Currier et al., 2026](https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/)
- Failure is not clearly superior to non-failure training for strength or hypertrophy, while it creates more acute fatigue. [Grgic et al., 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9068575/) and [Refalo et al., 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC9935748/)
- Subjective autoregulation (RPE/RIR) can be at least competitive with fixed loading, but the evidence base is small and heterogeneous. It is suitable as one signal, not ground truth. [Zhang et al., 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC7810043/)
- People estimate repetitions to failure imperfectly. Accuracy improves nearer failure, and lighter loads can produce errors greater than one repetition. [Halperin et al., 2022](https://pubmed.ncbi.nlm.nih.gov/34542869/) and [Hackett et al., 2020](https://pubmed.ncbi.nlm.nih.gov/33337690/)
- Performance normally falls across repeated fatiguing sets, with large variation caused by effort, load, rest and exercise. Repetition counts in sets to failure can fall sharply; this is not a suitable universal template for submaximal work. [Halperin et al., 2024](https://pubmed.ncbi.nlm.nih.gov/38781472/) and [Grgic et al., 2018](https://pubmed.ncbi.nlm.nih.gov/28933024/)
- Hypertrophy can occur across a broad loading range when effort is sufficient; heavier loads are more specific to 1RM strength. A single “best” repetition range is therefore not inferred from science. [Schoenfeld et al., 2017](https://pubmed.ncbi.nlm.nih.gov/28834797/)
- The older ACSM progression rule (increase load by 2–10% after exceeding the repetition target) is useful as an outer bound, but v1 adds repeated-session confirmation to avoid reacting to one outlier. [Kraemer et al., 2002](https://pubmed.ncbi.nlm.nih.gov/11828249/)

Confident conclusions: progressive overload is needed over time; load, repetitions and effort must be interpreted together; failure is not required as the normal target; set-to-set decline is normal; multiple observations are safer than one result.

Uncertain areas: the optimal proximity to failure for every person/exercise, a universal “too much” intra-session drop, exact RIR error, and an ideal progression threshold. Consequently, numerical thresholds below are documented conservative engineering guardrails, not biological laws.

## Data and normalization

Input is a structured context containing the exercise, recent completed sessions, today’s completed sets, current time and exercise preferences. Only strength working sets drive progression. Warm-ups remain visible to the journal but are excluded from Coach v1 because their load, repetitions and RIR are intentionally non-standardized. Notes, tonnage, other exercises, cardio, sleep, pain, technique and recovery are not used.

Defaults are a working range of 8–12 repetitions and target 2 RIR. Both repetition limits and the minimum usable weight increment are editable per exercise. Weight increment is initialized from a conservative equipment default (barbell 2.5 kg; dumbbell 2 kg; cable/machine/Smith 5 kg; other weighted equipment 1 kg). Observed differences such as 50 → 55 → 60 kg are **not** treated as the minimum available increment: they may reflect the user's chosen jumps while 2.5 kg is physically available. History may only flag that the configured/default increment deserves review; it may not raise the minimum automatically. Every proposed change is the current weight plus or minus whole configured increments.

RIR is clipped to 0–4 for performance comparisons and given only half the influence of an observed repetition:

`performance = weight × (1 + (reps + 0.5 × clippedRIR) / 30)`

This Epley-like value is a relative within-exercise signal, not a claimed 1RM. Raw repetitions and raw RIR are also checked separately. Sets above `reps + RIR > 15` may describe useful work but cannot alone trigger a weight increase because high-repetition e1RM estimates are less stable. Reported RIR is never silently rewritten.

## Historical model and first working set

The analyzer uses at most five recent sessions. It derives each session’s primary working weight, performance distribution, first-set performance, number of working sets and set-by-set retention. Medians are preferred to maxima. Personal retention is used only when at least three comparable observations exist; otherwise documented conservative defaults are used.

### Starting-weight progression between sessions

Before today’s first working set, progression requires stable historical confirmation:

1. No usable history and no positive user-entered working weight: return `insufficient_data`, low confidence and no invented weight.
2. One session or conflicting history: repeat its plausible primary weight; do not increase.
3. A newly increased weight seen in only one recent session: keep it and consolidate.
4. Increase by one increment only when at least two of the last three comparable sessions support the top of the chosen repetition range at approximately the target RIR, without repeated early 0 RIR or a recent severe drop.
5. Decrease by one increment when recent sessions repeatedly miss the lower repetition bound at 0–1 RIR.
6. A gap over 21 days lowers confidence and suppresses an increase. This is a conservative heuristic, not a claim that strength disappears on day 22.

This is double progression with rolling confirmation and autoregulation, rather than “12 reps once means add weight.” It controls the **starting weight of a future session** and must not be confused with a same-day adjustment.

## Recommendation inside today’s exercise

Today becomes the strongest signal after a working set. The engine estimates the next-set range from today’s repetitions, RIR, load and expected retention. It uses personal set-index retention when supported; otherwise it permits a modest normal decline and does not label that decline regression.

### Same-day load increase

A same-day increase answers a different question from between-session progression. If an early set is clearly underloaded (near the top of the repetition range with at least 4 RIR), Coach may propose exactly one configured increment for the **next set today**. This is a bounded autoregulation correction based on direct current readiness, not evidence that the higher load is established for future sessions. It requires supporting weight/repetition performance, cannot rely on a lone odd RIR value, cannot occur at low confidence, and cannot stack into repeated increases during the same exercise. Thus the replay case `50 × 11 @ 5 RIR → 52.5 kg today` is compatible with recommending a historically consolidated starting weight before the next session. With the corrected 2.5 kg barbell default, v1 does not jump from 50 directly to 55 kg unless the user explicitly configures a 5 kg increment.

Actions are evaluated in safety order:

- `finish`: two consecutive 0 RIR sets; or a severe performance loss (at least about 20% from today’s best) with 0–1 RIR after two or more working sets; or a combination of marked fatigue, low RIR and worse-than-expected performance. Typical historical set count is only a weak supporting signal in that combination and is never sufficient by itself. “Finish” means finish working sets for this exercise today, not end the workout, and the UI always remains dismissible so another set can still be entered.
- `back_off`: after at least two productive working sets, performance is worse than the personal expectation by roughly 7 percentage points and the latest set is at 0–1 RIR or below the repetition floor. Reduce by one usable increment and target 2–3 RIR.
- `decrease`: the first/early working set is below the repetition floor at 0–1 RIR, or is clearly worse than the recent baseline. Reduce one increment rather than forcing the planned load.
- `increase`: only early in the exercise, by one increment, when the set is at least near the top of the range with ≥4 reported RIR, is consistent with history/current performance, and confidence is not low. A single strange RIR value cannot authorize a larger jump.
- `hold`: the normal result when performance is within the target zone or the observed decline is consistent with accumulated fatigue. Repetition guidance can narrow or shift inside the configured range while weight stays fixed.

The 7- and 20-percentage-point checks are intentionally separated: the first detects a meaningful deviation from a personal expectation and suggests a recoverable back-off; the second catches an unambiguously large same-day decline. They will be covered by boundary tests and real-log replay. They are not shown to users as scores.

## Confidence

Confidence reports evidence quality, not safety. It starts from usable session count, rises with consistent recent sessions and current sets, and falls for conflicting trends, long gaps, outlier RIR, high-repetition-only evidence or a just-adopted load. Levels are `low`, `medium`, `high`; UI explains them as little/some/consistent evidence. Low confidence forbids progression and resolves conflicts toward holding or reducing.

## Safety guardrails

- Never add more than one configured increment per recommendation or reduce below zero.
- Never target 0 RIR; normal target is 2, with 2–3 on a back-off.
- Never increase from one anomalous set, low confidence, repeated 0 RIR, or high-repetition e1RM alone.
- Prefer hold over increase when signals conflict.
- Respond to pronounced same-day fatigue before historical progression.
- Recommend only a physically representable increment.
- Never save or execute the recommendation; “Apply” only fills the form.
- A `finish` result never disables, hides or blocks the set-entry form.
- Show a persistent concise caveat that pain, dizziness or technique breakdown are outside the data and are reasons to stop regardless of Coach.

## Architecture

- `src/coach/engine.js`: pure analysis and recommendation; no DOM, storage, dates from globals, or localized strings.
- `src/coach/context.js`: converts the existing state into historical sessions/current session and resolves per-exercise defaults.
- `src/coach/messages.js`: maps action/reason codes and structured values to RU/ET copy.
- `src/main.js`: one button, bottom-sheet state, render/bind, and explicit form fill only.
- `tests/coach-engine.test.js`: Node’s built-in test runner; no browser required.
- `scripts/replay-coach.mjs`: read-only replay of an export supplied by path.

Schema version 7 adds exercise fields `weightIncrement`, `coachRepMin`, and `coachRepMax`. Migration preserves old imports and supplies safe defaults; exports remain the complete state JSON. No global Coach setting or stored recommendation is needed.

Coach v1 is hidden for cardio exercises because weight/repetition/RIR strength logic does not apply. Bodyweight Coach is also out of scope in v1: the current model requires a positive numeric weight and has no representation for body mass, assistance or added load. A repetitions/RIR-only branch is feasible later, but adding it now would create a second progression model with ambiguous load semantics. Unsupported exercise screens keep their existing UI and show no disabled or explanatory Coach control.

## Real export observations

`training-log-2026-08-11.json` contains 61 records and 15 exercises, but usable strength history is concentrated in two exercises: six bench-press sessions and five lat-pulldown sessions. Bench sessions typically contain four working sets; lat pulldown contains three. Median RIR-adjusted retention in the final available set is about 95% for bench and 98% for pulldown, but sample sizes are too small to treat these as fixed truths.

Important replay expectations:

- Bench before 2026-08-03: hold 50 kg; after 50 × 11 @ 5 RIR, a same-day increase by the configured barbell step to 52.5 kg is reasonable. The actual 55 kg set is then evaluated from today's result rather than treated as an established historical progression; later successful 55 kg sets should be held, then the exercise should end after the final fatigued set.
- Bench before 2026-08-09: recommend consolidating 55 kg, not jumping from one 55 kg session to 60 kg. Once today’s 60 kg set succeeds, today’s evidence permits holding 60 kg; after 60 × 10 @ 0 followed by 60 × 7 @ 1, recommend finishing rather than another heavy set.
- Pulldown before the first 48 kg session: 42 kg is the conservative recommendation because only one preceding session clearly supports progression. After 48 kg succeeds, hold/consolidate it. On 2026-08-03, the first two sets remain plausible at 48 kg; after the third set reaches 0 RIR at the exercise’s typical set count, finish is reasonable.

These are acceptance examples, not hardcoded exercise rules.

## v1 limitations

The engine does not know the user’s program, goal priority, planned set count, rest actually taken, technique, pain, injury, sleep or whether a machine’s weight labels are comparable after equipment changes. A small history cannot estimate individual fatigue reliably. RIR and e1RM-like calculations remain noisy. The defaults target general strength/hypertrophy work and should not be presented as medical advice or powerlifting peaking guidance.
