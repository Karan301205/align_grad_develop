// Pure MCQ scoring — no I/O. Used by submitSkillTest to score server-side against
// the TestSession answer key, so the client never computes or supplies a score.
// answerKey[i] and answers[i] are option indices (0-3) for served question i.
const PASS_PERCENT = 70;

function scoreAnswers(answerKey, answers) {
  const total = Array.isArray(answerKey) ? answerKey.length : 0;
  const given = Array.isArray(answers) ? answers : [];
  let correct = 0;
  for (let i = 0; i < total; i++) {
    if (Number(given[i]) === answerKey[i]) correct++;
  }
  const score = total > 0 ? Math.round((correct / total) * 100) : 0; // percentage 0-100
  const passed = score >= PASS_PERCENT;                              // 70% pass threshold
  const rating = Math.max(1, Math.round(score / 10));               // 1-10
  return { correct, total, score, passed, rating };
}

// Fewest correct answers out of `total` that scoreAnswers counts as a pass
// (7 for a 10-question test). 0 when there are no questions.
function passMark(total) {
  for (let correct = 0; correct <= total; correct++) {
    if (total > 0 && Math.round((correct / total) * 100) >= PASS_PERCENT) return correct;
  }
  return 0;
}

// Served questions without a valid option index (0-3) in `answers`. Submissions
// must answer every question, so the controller rejects anything above 0.
function countUnanswered(answerKey, answers) {
  const total = Array.isArray(answerKey) ? answerKey.length : 0;
  const given = Array.isArray(answers) ? answers : [];
  let missing = 0;
  for (let i = 0; i < total; i++) {
    const a = given[i];
    if (!Number.isInteger(a) || a < 0 || a > 3) missing++;
  }
  return missing;
}

module.exports = { scoreAnswers, passMark, countUnanswered, PASS_PERCENT };
