// Pure MCQ scoring — no I/O. Used by submitSkillTest to score server-side against
// the TestSession answer key, so the client never computes or supplies a score.
// answerKey[i] and answers[i] are option indices (0-3) for served question i.
function scoreAnswers(answerKey, answers) {
  const total = Array.isArray(answerKey) ? answerKey.length : 0;
  const given = Array.isArray(answers) ? answers : [];
  let correct = 0;
  for (let i = 0; i < total; i++) {
    if (Number(given[i]) === answerKey[i]) correct++;
  }
  const score = total > 0 ? Math.round((correct / total) * 100) : 0; // percentage 0-100
  const passed = score >= 70;                                        // 70% pass threshold
  const rating = Math.max(1, Math.round(score / 10));               // 1-10
  return { correct, total, score, passed, rating };
}

module.exports = { scoreAnswers };
