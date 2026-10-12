const courseService = require('./course.service');

const courseController = {
  // Public / Student endpoints
  async listCourses(req, res, next) {
    try {
      const courses = await courseService.listCourses(req.query);
      res.json({ success: true, courses });
    } catch (err) {
      next(err);
    }
  },

  async getCourse(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const course = await courseService.getCourseById(req.params.id, userId);
      if (!course) {
        return res.status(404).json({ success: false, error: 'Course not found' });
      }
      res.json({ success: true, course });
    } catch (err) {
      next(err);
    }
  },

  async getLessonStream(req, res, next) {
    try {
      const { id, lessonId } = req.params;
      const result = await courseService.getLessonStreamUrl(id, lessonId);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async markProgress(req, res, next) {
    try {
      const userId = req.user.id;
      const { id, lessonId } = req.params;
      const enrollment = await courseService.markLessonProgress(userId, id, lessonId);
      res.json({ success: true, enrollment });
    } catch (err) {
      next(err);
    }
  },

  // Admin endpoints
  async listAdminCourses(req, res, next) {
    try {
      const courses = await courseService.listAdminCourses();
      res.json({ success: true, courses });
    } catch (err) {
      next(err);
    }
  },

  async getUploadPresignedUrl(req, res, next) {
    try {
      const { fileName, contentType, folder } = req.body;
      if (!fileName || !contentType) {
        return res.status(400).json({ success: false, error: 'fileName and contentType are required' });
      }
      const data = await courseService.getUploadPresignedUrl(fileName, contentType, folder || 'courses');
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  },

  async createCourse(req, res, next) {
    try {
      const course = await courseService.createCourse(req.body);
      res.status(201).json({ success: true, course });
    } catch (err) {
      next(err);
    }
  },

  async updateCourse(req, res, next) {
    try {
      const course = await courseService.updateCourse(req.params.id, req.body);
      res.json({ success: true, course });
    } catch (err) {
      next(err);
    }
  },

  async deleteCourse(req, res, next) {
    try {
      await courseService.deleteCourse(req.params.id);
      res.json({ success: true, message: 'Course deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  async addModule(req, res, next) {
    try {
      const course = await courseService.addModule(req.params.id, req.body);
      res.status(201).json({ success: true, course });
    } catch (err) {
      next(err);
    }
  },

  async updateModule(req, res, next) {
    try {
      const course = await courseService.updateModule(req.params.id, req.params.moduleId, req.body);
      res.json({ success: true, course });
    } catch (err) {
      next(err);
    }
  },

  async deleteModule(req, res, next) {
    try {
      const course = await courseService.deleteModule(req.params.id, req.params.moduleId);
      res.json({ success: true, course });
    } catch (err) {
      next(err);
    }
  },

  async addLesson(req, res, next) {
    try {
      const course = await courseService.addLesson(req.params.id, req.params.moduleId, req.body);
      res.status(201).json({ success: true, course });
    } catch (err) {
      next(err);
    }
  },

  async updateLesson(req, res, next) {
    try {
      const course = await courseService.updateLesson(req.params.id, req.params.moduleId, req.params.lessonId, req.body);
      res.json({ success: true, course });
    } catch (err) {
      next(err);
    }
  },

  async deleteLesson(req, res, next) {
    try {
      const course = await courseService.deleteLesson(req.params.id, req.params.moduleId, req.params.lessonId);
      res.json({ success: true, course });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = courseController;
