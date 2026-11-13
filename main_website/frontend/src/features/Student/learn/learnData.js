// Rules for the candidate Learn page (design: candidate_course_design/Web — learn) and
// the course player. Courses are written in the admin portal. GET /courses lists the
// published ones (with lessonCount); GET /courses/:id gives modules → lessons (no quiz
// answers; `hasVideo`, `quiz.questions[].options`) and the candidate's enrollment.

import { apiFetch, userMessage } from '../../../services/apiClient';

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** True when a course teaches the skill: its name in the title, category or tags. */
export function teaches(course, skillName) {
  if (!skillName) return false;
  const pattern = new RegExp(`(^|[^a-z0-9+#.])${escape(skillName.toLowerCase())}($|[^a-z0-9+#])`);
  return pattern.test([course.title, course.category, ...(course.tags || [])].join(' | ').toLowerCase());
}

/** Every lesson in order, with its module and position ("Lesson 3 of 8"). */
export function flatLessons(course) {
  return (course?.modules || []).flatMap((mod) => (mod.lessons || []).map((lesson) => ({ ...lesson, moduleId: mod.id, moduleTitle: mod.title }))).map((lesson, i) => ({ ...lesson, number: i + 1 }));
}

/** The lesson to open: the last one watched, else the first. */
export function startLesson(course) {
  const lessons = flatLessons(course);
  return lessons.find((lesson) => lesson.id === course.enrollment?.lastAccessedLessonId) || lessons[0] || null;
}

/** "3 of 8 done" (lessons deleted after they were completed don't count). */
export function progressOf(course) {
  const lessons = flatLessons(course);
  const done = new Set(course?.enrollment?.completedLessonIds || []);
  const count = lessons.filter((lesson) => done.has(lesson.id)).length;
  return { done, count, total: lessons.length, percent: lessons.length ? Math.round((count / lessons.length) * 100) : 0 };
}

/** A YouTube link's embed URL (lessons from before uploads were required), else ''. */
export function youTubeEmbed(url) {
  const match = String(url || '').match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([A-Za-z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : '';
}

/** Saves the lesson notes as a .txt file. */
export function downloadNotes(course, lesson) {
  const text = `${course.title}\n${lesson.title}${lesson.subTopic ? ` · ${lesson.subTopic}` : ''}\n\n${lesson.notes}\n`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${lesson.title.replace(/[^a-zA-Z0-9_-]+/g, '_')}_notes.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Calls the course API; resolves to { data } or { error } (details go to the console). */
export async function request(path, { token, method, json } = {}, fallback) {
  try {
    const res = await apiFetch(path, { token, method, json });
    const body = await res.json().catch(() => null);
    if (res.ok && body?.success) return { data: body };
    return { error: res.status < 500 && body?.error ? body.error : fallback };
  } catch (err) {
    return { error: userMessage(err, fallback) };
  }
}
