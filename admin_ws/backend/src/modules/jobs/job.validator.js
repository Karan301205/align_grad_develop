const { z } = require('zod');

const idRegex = /^[0-9a-fA-F]{24}$/;
const idSchema = z.string().regex(idRegex, 'Invalid ID format');

const getJobApplicantsSchema = {
  params: z.object({
    jobId: idSchema
  })
};

module.exports = {
  getJobApplicantsSchema
};
