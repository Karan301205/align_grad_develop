const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const authController = require('../controllers/auth.controller');
const studentController = require('../controllers/student.controller');
const recruiterController = require('../controllers/recruiter.controller');
const uploadController = require('../controllers/upload.controller');

// Public Auth routes
router.post('/auth/signup', authController.signup);
router.post('/auth/login', authController.login);

// Student routes (protected)
router.get('/student/profile', authMiddleware, studentController.getProfile);
router.put('/student/profile', authMiddleware, studentController.updateProfile);
router.get('/student/jobs', authMiddleware, studentController.getJobs);
router.post('/student/jobs/:jobId/apply', authMiddleware, studentController.applyJob);
router.post('/student/tests', authMiddleware, studentController.submitTest);
router.get('/student/tests/skills', authMiddleware, studentController.getTechnicalSkills);
router.post('/student/tests/generate', authMiddleware, studentController.generateSkillTest);
router.post('/student/tests/submit', authMiddleware, studentController.submitSkillTest);
router.get('/student/applications', authMiddleware, studentController.getStudentApplications);
router.post('/student/intro-video', authMiddleware, studentController.saveIntroVideo);
router.post('/student/video-upload-url', authMiddleware, studentController.requestVideoUploadUrl);

// Upload routes (protected)
router.post('/upload/request-url', authMiddleware, uploadController.requestUploadUrl);

// Recruiter routes (protected)
router.get('/recruiter/company', authMiddleware, recruiterController.getCompany);
router.post('/recruiter/verify', authMiddleware, recruiterController.verifyCompany);
router.post('/recruiter/jobs', authMiddleware, recruiterController.postJob);
router.put('/recruiter/jobs/:jobId', authMiddleware, recruiterController.updateJob);
router.delete('/recruiter/jobs/:jobId', authMiddleware, recruiterController.deleteJob);
router.get('/recruiter/jobs', authMiddleware, recruiterController.getCompanyJobs);
router.get('/recruiter/candidates', authMiddleware, recruiterController.getCandidates);
router.put('/recruiter/applications/:applicationId/rounds', authMiddleware, recruiterController.updateApplicationRounds);

module.exports = router;
