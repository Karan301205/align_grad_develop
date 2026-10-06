const express = require('express');
const router = express.Router();

// Domain module routers
const authRoutes = require('../modules/auth/auth.routes');
const studentRoutes = require('../modules/students/student.routes');
const recruiterRoutes = require('../modules/recruiters/recruiter.routes');
const uploadRoutes = require('../modules/uploads/upload.routes');
const gigRoutes = require('../modules/gigs/gig.routes');
const communityRoutes = require('../modules/community/community.routes');
const paymentRoutes = require('../modules/payments/payment.routes');

// Mount domain routes under identical URI namespaces
router.use('/auth', authRoutes);
router.use('/student', studentRoutes);
router.use('/recruiter', recruiterRoutes);
router.use('/upload', uploadRoutes);
router.use('/gigs', gigRoutes);
router.use('/community', communityRoutes);
router.use('/payments', paymentRoutes);

module.exports = router;
