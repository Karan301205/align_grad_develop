const courseService = require('./course.service');

// Answers { success: true, ...result }. Errors with a 4xx `status` (course or lesson
// not found, quiz not fully answered) are answered here; anything else goes to errorHandler.
const handle = (run) => async (req, res, next) => {
  try {
    res.json({ success: true, ...(await run(req)) });
  } catch (err) {
    if (err.status >= 400 && err.status < 500) return res.status(err.status).json({ success: false, error: err.message });
    next(err);
  }
};

module.exports = {
  listCourses: handle(async () => ({ courses: await courseService.listCourses() })),
  getCourse: handle(async (req) => ({ course: await courseService.getCourseById(req.params.id, req.user.id) })),
  getLessonStream: handle((req) => courseService.getLessonStreamUrl(req.params.id, req.params.lessonId)),
  markProgress: handle(async (req) => ({ enrollment: await courseService.markLessonProgress(req.user.id, req.params.id, req.params.lessonId) })),
  submitQuiz: handle((req) => courseService.scoreQuiz(req.user.id, req.params.id, req.params.lessonId, req.body?.answers))
};
