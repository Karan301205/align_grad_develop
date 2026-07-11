/**
 * Centralized File Upload Limits and MIME Type Constraints
 */
module.exports = {
  // Max file size limits in bytes
  limits: {
    resume: parseInt(process.env.UPLOAD_LIMIT_RESUME) || 10 * 1024 * 1024, // 10MB
    image: parseInt(process.env.UPLOAD_LIMIT_IMAGE) || 2 * 1024 * 1024, // 2MB
    doc: parseInt(process.env.UPLOAD_LIMIT_DOC) || 10 * 1024 * 1024, // 10MB
    video: parseInt(process.env.UPLOAD_LIMIT_VIDEO) || 50 * 1024 * 1024 // 50MB
  },
  // Allowed MIME types
  allowedMimeTypes: {
    resume: ['application/pdf'],
    image: ['image/jpeg', 'image/png'],
    video: ['video/mp4', 'video/webm', 'video/x-matroska'],
    doc: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]
  }
};
