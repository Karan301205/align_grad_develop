const { z } = require('zod');

const requestUploadUrlSchema = {
  body: z.object({
    fileType: z.enum(['resume', 'doc', 'image']),
    fileName: z.string().min(1, 'fileName is required'),
    contentType: z.string().min(1, 'contentType is required')
  })
};

// A video the browser just put in S3 (see directUpload.js).
const verifyUploadSchema = {
  body: z.object({
    key: z.string().trim().min(1).max(300),
    fileType: z.enum(['video', 'projectVideo'])
  })
};

module.exports = {
  requestUploadUrlSchema,
  verifyUploadSchema
};
