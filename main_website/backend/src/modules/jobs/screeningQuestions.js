// Screening questions on job posts: question rules (recruiter side), what candidates
// may see, and server-side checking of candidate answers. Pure functions only.
// The frontend mirrors the types and limits in frontend/src/constants/screeningQuestions.js.

const SCREENING_TYPES = ['MCQ', 'SHORT_ANSWER', 'LONG_ANSWER', 'CHECKBOX', 'DATE', 'TIME'];
const OPTION_TYPES = ['MCQ', 'CHECKBOX'];
const OPTION_LIMITS = { MCQ: { min: 2, max: 6 }, CHECKBOX: { min: 1, max: 8 } };
const TEXT_LIMITS = { SHORT_ANSWER: 200, LONG_ANSWER: 5000 };
const QUESTION_MAX = 500;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const cleanOptions = (options) =>
  (Array.isArray(options) ? options : []).map((option) => String(option ?? '').trim()).filter(Boolean);

const isRealDate = (value) => {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

/**
 * What is wrong with a recruiter-defined question, or null when it is valid.
 * @param {{ type: string, question: string, options?: string[], correctAnswer?: string|null }} q
 */
function getQuestionProblem(q) {
  if (!SCREENING_TYPES.includes(q?.type)) return 'Unsupported question type.';
  if (!q.question || !q.question.trim()) return 'Question text is required.';
  if (!OPTION_TYPES.includes(q.type)) return null;

  const options = cleanOptions(q.options);
  const { min, max } = OPTION_LIMITS[q.type];
  const kind = q.type === 'MCQ' ? 'Multiple choice' : 'Checkbox';
  if (options.length < min) return `${kind} questions need at least ${min} option${min === 1 ? '' : 's'}.`;
  if (options.length > max) return `${kind} questions can have at most ${max} options.`;
  if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
    return 'Options must be different from each other.';
  }
  if (q.type === 'MCQ' && !options.includes(String(q.correctAnswer ?? '').trim())) {
    return 'Multiple choice questions need a correct answer chosen from the options.';
  }
  return null;
}

/** The stored shape of a job's questions. `makeId` supplies ids for new questions. */
function normalizeQuestions(list, makeId) {
  return (Array.isArray(list) ? list : []).map((q) => ({
    id: q.id || makeId(),
    type: q.type,
    question: String(q.question || '').trim(),
    options: OPTION_TYPES.includes(q.type) ? cleanOptions(q.options) : [],
    correctAnswer: q.type === 'MCQ' ? String(q.correctAnswer || '').trim() || null : null,
    required: q.required !== undefined ? Boolean(q.required) : true
  }));
}

/** Questions as candidates and the public may see them: never the answer key. */
function toCandidateQuestions(list) {
  return (Array.isArray(list) ? list : []).map(({ correctAnswer: _key, ...question }) => question);
}

const findAnswer = (incoming, sq) =>
  incoming.find(
    (a) =>
      (a.questionId && a.questionId === sq.id) ||
      (a.questionText && sq.question && a.questionText.trim().toLowerCase() === sq.question.trim().toLowerCase())
  );

// Maps a candidate's choice back to the recruiter's spelling of the option, or null.
const matchOption = (options, value) =>
  options.find((option) => option.toLowerCase() === String(value).trim().toLowerCase()) ?? null;

/**
 * Checks a candidate's answers against the job's questions.
 * @returns {{ error: string } | { answers: object[] }} answers in Application.answers shape
 */
function evaluateAnswers(questions, incoming) {
  const given = Array.isArray(incoming) ? incoming : [];
  const answers = [];

  for (const sq of Array.isArray(questions) ? questions : []) {
    const type = sq.type || 'LONG_ANSWER';
    const raw = findAnswer(given, sq)?.answer;
    const quoted = `"${sq.question}"`;

    if (type === 'CHECKBOX') {
      const picked = (Array.isArray(raw) ? raw : raw ? [raw] : []).map((v) => String(v).trim()).filter(Boolean);
      if (picked.length === 0) {
        if (sq.required !== false) return { error: `Please answer the required screening question: ${quoted}` };
        continue;
      }
      const options = cleanOptions(sq.options);
      const matched = picked.map((value) => matchOption(options, value));
      if (matched.includes(null)) return { error: `Choose from the listed options for ${quoted}.` };
      const selectedOptions = options.filter((option) => matched.includes(option));
      answers.push({ questionId: sq.id || null, questionText: sq.question, type, answer: selectedOptions.join(', '), selectedOptions, isCorrect: null });
      continue;
    }

    if (Array.isArray(raw)) return { error: `Please give a single text answer for ${quoted}.` };
    const value = String(raw ?? '').trim();
    if (!value) {
      if (sq.required !== false) return { error: `Please answer the required screening question: ${quoted}` };
      continue;
    }

    let stored = value;
    let isCorrect = null;
    if (type === 'MCQ') {
      stored = matchOption(cleanOptions(sq.options), value);
      if (stored === null) return { error: `Choose one of the listed options for ${quoted}.` };
      if (sq.correctAnswer) isCorrect = stored.toLowerCase() === String(sq.correctAnswer).trim().toLowerCase();
    } else if (type === 'DATE' && !isRealDate(value)) {
      return { error: `Please pick a valid date for ${quoted}.` };
    } else if (type === 'TIME' && !TIME_PATTERN.test(value)) {
      return { error: `Please pick a valid time for ${quoted}.` };
    } else if (TEXT_LIMITS[type] && value.length > TEXT_LIMITS[type]) {
      return { error: `Your answer to ${quoted} is too long (maximum ${TEXT_LIMITS[type]} characters).` };
    }

    answers.push({ questionId: sq.id || null, questionText: sq.question, type, answer: stored, isCorrect });
  }

  return { answers };
}

module.exports = {
  SCREENING_TYPES,
  OPTION_TYPES,
  OPTION_LIMITS,
  TEXT_LIMITS,
  QUESTION_MAX,
  getQuestionProblem,
  normalizeQuestions,
  toCandidateQuestions,
  evaluateAnswers
};
