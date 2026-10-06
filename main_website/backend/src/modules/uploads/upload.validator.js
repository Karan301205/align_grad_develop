const { z } = require('zod');

const requestUploadUrlSchema = {
  body: z.object({
    fileType: z.enum(['resume', 'video', 'doc', 'image']),
    fileName: z.string().min(1, 'fileName is required'),
    contentType: z.string().min(1, 'contentType is required')
  })
};

module.exports = {
  requestUploadUrlSchema
};
