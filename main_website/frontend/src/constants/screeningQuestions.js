// Screening question types for job posts. Mirrors backend
// src/modules/jobs/screeningQuestions.js (types, limits and rules); keep them in sync.

export const SCREENING_TYPES = [
  { value: 'MCQ', label: 'Multiple choice', hint: 'Candidates pick one option. Mark the correct one and answers are scored automatically.' },
  { value: 'SHORT_ANSWER', label: 'Short answer', hint: 'Candidates type a one-line answer (up to 200 characters).' },
  { value: 'LONG_ANSWER', label: 'Long answer', hint: 'Candidates write a paragraph (up to 5,000 characters).' },
  { value: 'CHECKBOX', label: 'Checkboxes', hint: 'Candidates tick every option that applies. Use one option for a yes/confirm box.' },
  { value: 'DATE', label: 'Date', hint: 'Candidates pick a date from a calendar, e.g. their earliest joining date.' },
  { value: 'TIME', label: 'Time', hint: 'Candidates pick a time, e.g. a preferred interview slot.' }
];

export const ALL_SCREENING_TYPE_VALUES = SCREENING_TYPES.map((type) => type.value);
export const OPTION_TYPES = ['MCQ', 'CHECKBOX'];
export const OPTION_LIMITS = { MCQ: { min: 2, max: 6 }, CHECKBOX: { min: 1, max: 8 } };
export const TEXT_LIMITS = { SHORT_ANSWER: 200, LONG_ANSWER: 5000 };

export const typeLabel = (value) => SCREENING_TYPES.find((type) => type.value === value)?.label || 'Long answer';

const cleanOptions = (options) => (options || []).map((option) => String(option ?? '').trim()).filter(Boolean);

/** First problem with a recruiter's question (same rules as the server), or null. */
export function getQuestionProblem(q) {
  if (!q.question || !q.question.trim()) return 'needs a question.';
  if (!OPTION_TYPES.includes(q.type)) return null;
  const options = cleanOptions(q.options);
  const { min, max } = OPTION_LIMITS[q.type];
  if (options.length < min) return `needs at least ${min} filled-in option${min === 1 ? '' : 's'}.`;
  if (options.length > max) return `can have at most ${max} options.`;
  if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) return 'has two options with the same text.';
  if (q.type === 'MCQ' && !options.includes(String(q.correctAnswer ?? '').trim())) return 'needs a correct answer selected.';
  return null;
}

/** "Screening question #2 needs a question." for the first invalid question, or null. */
export function validateScreeningQuestions(questions) {
  for (let i = 0; i < (questions || []).length; i += 1) {
    const problem = getQuestionProblem(questions[i]);
    if (problem) return `Screening question #${i + 1} (${typeLabel(questions[i].type).toLowerCase()}) ${problem}`;
  }
  return null;
}

// ---- Candidate answers -------------------------------------------------------

const sameQuestion = (answer, sq) => (answer.questionId && answer.questionId === sq.id) || answer.questionText === sq.question;

export const getAnswer = (answers, sq) => answers.find((answer) => sameQuestion(answer, sq))?.answer ?? (sq.type === 'CHECKBOX' ? [] : '');

/** Returns a new answers array with `value` stored for question `sq`. */
export const setAnswer = (answers, sq, value) => [
  ...answers.filter((answer) => !sameQuestion(answer, sq)),
  { questionId: sq.id, questionText: sq.question, type: sq.type || 'LONG_ANSWER', answer: value }
];

export const isAnswerBlank = (value) => (Array.isArray(value) ? value.length === 0 : !String(value ?? '').trim());

/** First required question without an answer, or null. */
export const findUnansweredRequired = (questions, answers) =>
  (questions || []).find((sq) => sq.required !== false && isAnswerBlank(getAnswer(answers, sq))) || null;

/** Payload for POST /student/jobs/:id/apply: blank optional answers are left out. */
export const compactAnswers = (answers) => answers.filter((answer) => !isAnswerBlank(answer.answer));

// ---- Display -----------------------------------------------------------------

/** Human-readable answer for recruiters: dates and times formatted, ticked options listed. */
export function formatScreeningAnswer(answer) {
  if (answer.type === 'CHECKBOX' && Array.isArray(answer.selectedOptions)) return answer.selectedOptions.join(', ');
  if (answer.type === 'DATE' && /^\d{4}-\d{2}-\d{2}$/.test(answer.answer)) {
    const [y, m, d] = answer.answer.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (answer.type === 'TIME' && /^\d{2}:\d{2}$/.test(answer.answer)) {
    const [h, min] = answer.answer.split(':').map(Number);
    return new Date(2000, 0, 1, h, min).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }
  return answer.answer;
}
