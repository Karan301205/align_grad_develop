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

// Recruiter candidate search (candidateSearch.service.js). Every field is optional; empty
// strings mean "any". One page of at most 50 cards per request.
const text = (max) => z.string().trim().max(max).optional().default('');
const candidateSearchSchema = {
  body: z.object({
    q: text(100),
    skills: z.array(z.object({
      name: z.string().trim().min(1).max(100),
      minRating: z.number().int().min(0).max(10).optional().default(0),
      verifiedOnly: z.boolean().optional().default(false)
    })).max(10).optional().default([]),
    workMode: text(50),
    workType: text(50),
    location: text(100),
    college: text(200),
    degree: text(200),
    year: z.string().trim().regex(/^(\d{4})?$/, 'Year must be four digits').optional().default(''),
    credential: z.enum(['', 'verified_skills', 'has_video', 'has_resume']).optional().default(''),
    experience: z.enum(['', 'experienced', 'fresher']).optional().default(''),
    match: z.enum(['', '70', '50', 'any']).optional().default(''),
    sort: z.enum(['recommended', 'verified_desc', 'skills_count', 'name_asc', 'newest']).optional().default('recommended'),
    onlyMeets: z.boolean().optional().default(false),
    // One of the recruiter's own jobs to compare candidates with ('' = none).
    compareJobId: z.union([idSchema, z.literal('')]).optional().default(''),
    // Just these candidates (profile or user ids), e.g. the dashboard's recently viewed.
    ids: z.array(z.string().trim().min(1).max(64)).max(50).optional(),
    // Leave out people who already applied to one of the recruiter's jobs.
    excludeApplicants: z.boolean().optional().default(false),
    // false: skip counting every match (a short list such as the dashboard's top 5).
    countTotal: z.boolean().optional().default(true),
    page: z.number().int().min(1).max(10000).optional().default(1),
    pageSize: z.number().int().min(1).max(50).optional().default(20)
  })
};

// One candidate's full profile: a profile id or that candidate's user id.
const candidateIdSchema = {
  params: z.object({ candidateId: z.string().trim().min(1).max(64) })
};

module.exports = {
  candidateSearchSchema,
  candidateIdSchema,
  verifyCompanySchema,
  postJobSchema,
  eligibleCountSchema,
  updateJobSchema,
  toggleJobStatusSchema,
  deleteJobSchema,
  updateApplicationRoundsSchema
};
