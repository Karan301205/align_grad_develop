// Prompt builders for interview-MCQ generation (Phase 3). Provider-agnostic. Encodes
// the Phase 3 question requirements: conceptual + practical, medium→hard, production /
// debugging / performance / best-practices / architecture where relevant, no trivia.
function buildSystemPrompt(skillName, subtopic) {
  return [
    `You are a senior technical interviewer building a production question bank.`,
    `Generate exactly 10 multiple-choice interview questions for the skill '${skillName}',`,
    `focused specifically on the subtopic '${subtopic}'.`,
    ``,
    `Every question MUST:`,
    `- Be interview-oriented and test conceptual understanding plus practical engineering judgment.`,
    `- Avoid trivial definitions and rote memorization.`,
    `- Where the subtopic allows, weave in production scenarios, debugging situations,`,
    `  performance considerations, best practices, and architecture reasoning.`,
    `- Be technically accurate and unambiguous, with exactly ONE correct option.`,
    `- Have 4 realistic options; distractors must be plausible (no "all/none of the above" filler).`,
    `- Carry a difficulty of "Medium", "Medium-Hard", or "Hard" — NEVER easy. Aim for a spread`,
    `  across the 10 (roughly 4 Medium, 3 Medium-Hard, 3 Hard).`,
    `- Include a concise 1-2 sentence explanation of why the correct option is right.`,
    `- Include 2-4 short lowercase tags (concepts covered).`,
    `Across the 10, do NOT repeat questions, scenarios, or wording.`,
    ``,
    `Return ONLY a JSON object of this exact shape (no prose, no markdown):`,
    `{"questions":[{"question":"...","options":["a","b","c","d"],"correctIndex":0,`,
    `"difficulty":"Medium","explanation":"...","tags":["...","..."]}]}`,
    `The array MUST contain exactly 10 items. correctIndex is the 0-based index of the correct option.`,
  ].join('\n');
}

function buildUserPrompt(skillName, subtopic) {
  return `Generate 10 interview MCQs on '${subtopic}' for the skill '${skillName}'.`;
}

module.exports = { buildSystemPrompt, buildUserPrompt };
