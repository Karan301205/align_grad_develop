-- Per-lesson progress for a candidate's course: watch time counted by the server and whether the lesson
-- quiz was submitted (see modules/courses/course.service.js). Existing enrollments start with none.

-- AlterTable
ALTER TABLE "CourseEnrollment" ADD COLUMN "lessonProgress" JSONB NOT NULL DEFAULT '{}';
