const { z } = require('zod');
const env = require('../../config/env');

const { SCREENING_TYPES, QUESTION_MAX, getQuestionProblem } = require('../jobs/screeningQuestions');

const idRegex = /^[0-9a-fA-F]{24}$/;
const idSchema = z.string().regex(idRegex, 'Invalid ID format');

// Job screening questions: MCQ, short/long answer, checkboxes, date, time.
// Per-type rules live in modules/jobs/screeningQuestions.js.
const screeningQuestionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(SCREENING_TYPES),
  question: z.string().min(1, 'Question text is required').max(QUESTION_MAX, `Questions can be at most ${QUESTION_MAX} characters`),
  options: z.array(z.string().max(200, 'Options can be at most 200 characters')).optional().default([]),
  correctAnswer: z.string().optional().nullable(),
  required: z.boolean().optional().default(true)
}).superRefine((question, ctx) => {
  const problem = getQuestionProblem(question);
  if (problem) ctx.addIssue({ code: 'custom', message: problem, path: ['options'] });
});

const verifyCompanySchema = {
  body: z.object({
    docUrl: z.string().url('Invalid document S3 URL').optional(),
    verificationDocs: z.array(
      z.object({
        docType: z.string().min(1, 'Document type is required'),
        docUrl: z.string().url('Invalid document URL'),
        fileName: z.string().optional()
      })
    ).optional()
  }).refine(data => data.docUrl || (data.verificationDocs && data.verificationDocs.length > 0), {
    message: 'Either docUrl or verificationDocs must be provided'
  })
};

const postJobSchema = {
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long'),
    description: z.string().min(10, 'Description must be at least 10 characters long'),
    opportunityType: z.string().optional().nullable(),
    workMode: z.string().optional().nullable(),
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
    // How many days the listing stays live: 1 to JOB_MAX_ACTIVE_DAYS (server setting, default 90).
    activeDays: z
      .union([z.number(), z.string().regex(/^\d+$/, 'Listing length must be a whole number of days').transform((val) => parseInt(val, 10))])
      .pipe(z.number().int().min(1, 'Keep the listing open for at least 1 day').max(env.JOB_MAX_ACTIVE_DAYS, `A listing can stay open for at most ${env.JOB_MAX_ACTIVE_DAYS} days`))
      .optional()
      .nullable(),
    joiningMonth: z.string().optional().nullable(),
    openings: z.number().int().min(1).optional().nullable().or(z.string().regex(/^\d+$/).transform(val => parseInt(val, 10))),
    requirements: z.array(z.object({
      skillName: z.string().trim().min(1, 'Skill name is required').max(100),
      minRating: z.number().int().min(1).max(10)
    })).min(1, 'At least one requirement is required'),
    selectionProcess: z.array(z.object({
      roundNumber: z.number().int().min(1),
      name: z.string().min(1, 'Round name is required'),
      description: z.string().min(1, 'Round description is required')
    })).optional().nullable(),
    screeningQuestions: z.array(screeningQuestionSchema).max(20, 'A job can have at most 20 screening questions').optional().nullable().default([]),
    status: z.string().optional().nullable(),
    isPaused: z.boolean().optional().nullable(),
    showSalary: z.boolean().optional().nullable()
  })
};

const updateJobSchema = {
  params: z.object({
    jobId: idSchema
  }),
  body: postJobSchema.body
};

const toggleJobStatusSchema = {
  params: z.object({
    jobId: idSchema
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'PAUSED', 'CLOSED']).optional().nullable(),
    isPaused: z.boolean().optional().nullable()
  }).optional()
};

const deleteJobSchema = {
  params: z.object({
    jobId: idSchema
  })
};

const updateApplicationRoundsSchema = {
  params: z.object({
    applicationId: idSchema
  }),
  // Applications made before rounds were stored have none, so a status alone is
  // enough; otherwise at least one round must be sent.
  body: z.object({
    status: z.enum(['APPLIED', 'SHORTLISTED', 'IN_PROGRESS', 'SCHEDULED', 'INTERVIEW', 'SELECTED', 'HIRED', 'REJECTED']).optional(),
    roundStatuses: z.array(z.object({
      roundNumber: z.number().int().min(1),
      name: z.string().min(1, 'Round name is required'),
      status: z.enum(['PENDING', 'IN_PROGRESS', 'SCHEDULED', 'CLEARED', 'QUALIFIED', 'REJECTED']),
      feedback: z.string().max(2000, 'Feedback can be at most 2000 characters').optional().nullable()
    })).max(20).optional().default([])
  }).refine((body) => body.status || body.roundStatuses.length > 0, { error: 'Choose a status or update at least one round' })
};

// Draft skill bars from the post-a-job form (same shape as postJobSchema.requirements).
const eligibleCountSchema = {
  body: z.object({
    requirements: z.array(z.object({
      skillName: z.string().trim().min(1, 'Skill name is required').max(100),
      minRating: z.number().int().min(1).max(10)
    })).max(30, 'A job can have at most 30 skills'),
    // The post-a-gig form counts with the gig rule (jobs/eligiblePool.js gigSkillGaps).
    forGig: z.boolean().optional()
  })
};

module.exports = {
  verifyCompanySchema,
  postJobSchema,
  eligibleCountSchema,
  updateJobSchema,
  toggleJobStatusSchema,
  deleteJobSchema,
  updateApplicationRoundsSchema
};
