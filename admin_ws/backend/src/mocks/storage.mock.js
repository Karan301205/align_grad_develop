// Fallback fixtures for the storage explorer, used when AWS credentials or the
// MongoDB connection are unavailable. Extracted verbatim from
// storage.controller.js so the controller/services carry no inline mock data.
// Returned as functions because the S3 fixtures embed relative timestamps that
// must be computed at request time (matching the original behavior).

function getMockS3Files() {
  return [
    { key: 'resumes/student_1/resume_17835824.pdf', size: 1048576 * 1.2, lastModified: new Date(Date.now() - 3600000 * 24 * 3) },
    { key: 'resumes/student_2/resume_17835948.pdf', size: 1048576 * 0.85, lastModified: new Date(Date.now() - 3600000 * 24 * 5) },
    { key: 'videos/student_1/intro_17835849.mp4', size: 1024 * 1024 * 12.4, lastModified: new Date(Date.now() - 3600000 * 24 * 3) },
    { key: 'videos/student_3/intro_17836102.mp4', size: 1024 * 1024 * 9.8, lastModified: new Date(Date.now() - 3600000 * 24 * 1) },
    { key: 'docs/rec_1/google_verify.pdf', size: 1024 * 1024 * 2.3, lastModified: new Date(Date.now() - 3600000 * 24 * 10) },
    { key: 'docs/rec_2/ms_verify.pdf', size: 1024 * 1024 * 3.1, lastModified: new Date(Date.now() - 3600000 * 24 * 8) },
    { key: 'images/student_1/pic_17835812.jpg', size: 1024 * 84, lastModified: new Date(Date.now() - 3600000 * 24 * 3) },
    { key: 'images/student_2/pic_17835922.jpg', size: 1024 * 72, lastModified: new Date(Date.now() - 3600000 * 24 * 5) }
  ];
}

function getMockCollections() {
  return [
    { name: 'User', count: 12, size: 4320, storageSize: 16384, indexSize: 16384 },
    { name: 'Profile', count: 8, size: 13107, storageSize: 36864, indexSize: 20480 },
    { name: 'Company', count: 4, size: 2150, storageSize: 16384, indexSize: 16384 },
    { name: 'Job', count: 8, size: 18940, storageSize: 36864, indexSize: 20480 },
    { name: 'Application', count: 14, size: 4712, storageSize: 16384, indexSize: 16384 },
    { name: 'TestAttempt', count: 25, size: 8396, storageSize: 16384, indexSize: 16384 }
  ];
}

module.exports = { getMockS3Files, getMockCollections };
