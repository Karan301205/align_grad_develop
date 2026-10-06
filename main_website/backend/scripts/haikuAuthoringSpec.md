# Haiku MCQ Authoring Spec (Phase 3 — strict bar)

You WRITE the questions yourself. Do NOT call any API, run a generator, or use fetch/curl.

## Token-efficient method
Write ONE file per subtopic (a JSON array of exactly 10 questions), with a single Write call
each. NEVER rewrite a growing combined array. Do NOT re-read or re-verify after writing.

## Question style — every question must be ONE of:
1. Code-output — "what does this print/return/evaluate to?" with a real snippet.
2. Debugging — "this code has a bug / unexpected behavior — what's wrong / the fix?"
3. Scenario — a concrete production situation asking for cause/fix/best choice.
4. Best-practice trade-off — "which approach is correct/safest/most performant here?"

## Banned
- Definitional "What is X?" questions.
- Throwaway distractors ("it doesn't exist", "cannot be done", "none of the above").
- Trivia (history, version numbers, syntax memorization).

## Rules
- Medium to Hard. Exactly ONE correct option; 3 plausible distractors (real misconceptions).
- Exactly 4 options, all DISTINCT after lowercasing + stripping ALL punctuation (so options
  differing only in symbols/brackets/quotes count as duplicates — vary the WORDS).
- correctIndex integer 0-3. Non-empty ONE-sentence explanation.
- difficulty EXACTLY one of: Medium | Medium-Hard | Hard.
- No near-duplicate wording across the file. Exactly 10 questions per subtopic.

## Per-question shape
{"skillName":"<skill>","subtopic":"<exact>","question":"<text w/ snippet>","options":["a","b","c","d"],"correctIndex":<0-3>,"explanation":"<1 sentence>","difficulty":"Medium|Medium-Hard|Hard","tags":["t1","t2"]}
