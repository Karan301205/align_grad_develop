// Course management logic with no React in it: form defaults, turning saved data back
// into forms, quiz validation, and the list filters. Tested in courseModel.test.js.
import { matchesQuery } from '../../utils/collections.js';

/** The admin API answers with `success`; a failed answer becomes an Error with the server's plain message. */
export function unwrap(response, fallback) {
  if (!response || !response.success) throw new Error((response && response.error) || fallback);
  return response;
}

/* ---- courses ---- */

export const emptyCourseForm = () => ({
  title: '',
  description: '',
  category: 'Full Stack Development',
  instructor: 'AlignGrad Academy',
  thumbnailUrl: '',
  thumbnailKey: '',
  isPublished: true
});

export const courseToForm = (course) => ({
  title: course.title || '',
  description: course.description || '',
  category: course.category || '',
  instructor: course.instructor || '',
  thumbnailUrl: course.thumbnailUrl || '',
  thumbnailKey: course.thumbnailKey || '',
  isPublished: course.isPublished !== false
});

export const isPublished = (course) => course?.isPublished !== false;

/** Lectures in a course: the server's total when it sent one, else counted from the modules. */
export const lectureCount = (course) =>
  Number.isFinite(course?.totalLessons)
    ? course.totalLessons
    : (course?.modules || []).reduce((sum, module) => sum + (module.lessons?.length || 0), 0);

export const COURSE_TABS = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'published', label: 'Published', test: isPublished },
  { key: 'draft', label: 'Drafts', test: (course) => !isPublished(course) }
];

export function filterCourses(courses, { tab = 'all', query = '' } = {}) {
  const test = (COURSE_TABS.find((t) => t.key === tab) || COURSE_TABS[0]).test;
  return courses.filter((course) => test(course) && matchesQuery([course.title, course.category, course.instructor], query));
}

/* ---- lessons ---- */

export const emptyLessonForm = () => ({
  title: '',
  subTopic: '',
  description: '',
  duration: '15:00',
  videoKey: '',
  videoUrl: '',
  notes: '',
  documentUrl: '',
  documentKey: '',
  documentName: ''
});

export const lessonToForm = (lesson) => ({
  title: lesson.title || '',
  subTopic: lesson.subTopic || '',
  description: lesson.description || '',
  duration: lesson.duration || '15:00',
  videoKey: lesson.videoKey || '',
  videoUrl: lesson.videoUrl || '',
  notes: lesson.notes || '',
  documentUrl: lesson.documentUrl || '',
  documentKey: lesson.documentKey || '',
  documentName: lesson.documentName || ''
});

/* ---- quizzes ---- */

export const MIN_OPTIONS = 4;
export const optionLabel = (index) => String.fromCharCode(65 + index);

export const emptyQuestion = () => ({ question: '', options: Array(MIN_OPTIONS).fill(''), correctAnswer: 0, explanation: '' });
export const emptyQuizForm = () => ({ enabled: false, title: '', questions: [emptyQuestion()] });

/** A saved quiz as form state. Questions with more than four options keep them all. */
export function quizToForm(quiz) {
  const saved = Array.isArray(quiz?.questions) ? quiz.questions : [];
  if (saved.length === 0) return emptyQuizForm();
  return {
    enabled: true,
    title: quiz.title || '',
    questions: saved.map((q) => {
      const options = Array.isArray(q.options) ? q.options.map((o) => String(o ?? '')) : [];
      while (options.length < MIN_OPTIONS) options.push('');
      const correct = Number(q.correctAnswer);
      return {
        question: q.question || '',
        options,
        correctAnswer: Number.isInteger(correct) && correct >= 0 && correct < options.length ? correct : 0,
        explanation: q.explanation || ''
      };
    })
  };
}

/**
 * The quiz to save: { quiz } (null when the quiz is switched off) or { error }.
 * Completely blank questions are ignored; a half-filled one is an error, because
 * students would otherwise see made-up answer text (the old form wrote "Option").
 */
export function buildQuiz(form, lessonTitle = '') {
  if (!form.enabled) return { quiz: null };

  const questions = [];
  for (const [index, q] of form.questions.entries()) {
    const blank = !q.question.trim() && q.options.every((option) => !option.trim());
    if (blank) continue;
    if (!q.question.trim()) return { error: `Question ${index + 1}: enter the question text.` };
    if (q.options.some((option) => !option.trim())) return { error: `Question ${index + 1}: fill in every answer option.` };
    questions.push({
      question: q.question.trim(),
      options: q.options.map((option) => option.trim()),
      correctAnswer: Number(q.correctAnswer) || 0,
      explanation: q.explanation.trim()
    });
  }
  if (questions.length === 0) return { error: 'Add at least one question, or turn the quiz off.' };

  return { quiz: { title: form.title.trim() || `Quiz: ${lessonTitle.trim()}`, questions } };
}
