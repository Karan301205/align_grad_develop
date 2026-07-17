const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ID format');

const verifyCompanySchema = {
  body: z.object({
    docUrl: z.string().url('Invalid document S3 URL')
  })
};

const postJobSchema = {
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long'),
    description: z.string().min(10, 'Description must be at least 10 characters long'),
    opportunityType: z.string().optional().nullable(),
    companyName: z.string().optional().nullable(),
    officialWebsite: z.string().url().or(z.literal('')).optional().nullable(),
    preferredEducation: z.string().optional().nullable(),
    desiredExperience: z.string().optional().nullable(),
    designation: z.string().optional().nullable(),
    stipendPartTime: z.string().optional().nullable(),
    stipendFullTime: z.string().optional().nullable(),
    duration: z.string().optional().nullable(),
    roleResponsibilities: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    locationUrl: z.string().url().or(z.literal('')).optional().nullable(),
    activeDays: z.number().int().min(1).optional().nullable().or(z.string().regex(/^\d+$/).transform(val => parseInt(val, 10))),
    joiningMonth: z.string().optional().nullable(),
    openings: z.number().int().min(1).optional().nullable().or(z.string().regex(/^\d+$/).transform(val => parseInt(val, 10))),
    requirements: z.array(z.object({
      skillName: z.string().min(1, 'Skill name is required'),
      minRating: z.number().int().min(1).max(10)
    })).min(1, 'At least one requirement is required'),
    selectionProcess: z.array(z.object({
      roundNumber: z.number().int().min(1),
      name: z.string().min(1, 'Round name is required'),
      description: z.string().min(1, 'Round description is required')
    })).optional().nullable()
  })
};

const updateJobSchema = {
  params: z.object({
    jobId: objectIdSchema
  }),
  body: postJobSchema.body
};

const deleteJobSchema = {
  params: z.object({
    jobId: objectIdSchema
  })
};

const updateApplicationRoundsSchema = {
  params: z.object({
    applicationId: objectIdSchema
  }),
  body: z.object({
    roundStatuses: z.array(z.object({
      roundNumber: z.number().int().min(1),
      name: z.string().min(1, 'Round name is required'),
      status: z.enum(['PENDING', 'CLEARED', 'QUALIFIED', 'REJECTED']),
      feedback: z.string().optional().nullable()
    })).min(1, 'At least one round status is required')
  })
};

module.exports = {
  verifyCompanySchema,
  postJobSchema,
  updateJobSchema,
  deleteJobSchema,
  updateApplicationRoundsSchema
};
