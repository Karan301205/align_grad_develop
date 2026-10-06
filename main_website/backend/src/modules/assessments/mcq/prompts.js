// Prompt builders for MCQ generation. Kept identical to the original inline
// prompt strings so generated content is unchanged.
function buildSystemPrompt(skillName) {
  return `You are a technical evaluation engine. Generate exactly 10 multiple choice questions (MCQs) for the skill: '${skillName}'. Each question must have 4 options and exactly one correct answer. Return a JSON object with a key 'questions' containing an array of objects. Each object must have fields: 'id' (number 1 to 10), 'question' (string), 'options' (array of 4 strings), and 'answer' (string, either 'A', 'B', 'C', or 'D'). Include both theory and coding/syntax analysis questions.`;
}

function buildUserPrompt(skillName) {
  return `Generate 10 MCQs for '${skillName}'.`;
}

module.exports = { buildSystemPrompt, buildUserPrompt };
