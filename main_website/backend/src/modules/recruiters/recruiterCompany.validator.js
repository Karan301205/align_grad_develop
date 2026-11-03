const { z } = require('zod');

// Wrapped in { body } so middleware/validate.js actually applies it. z.object
// strips unknown keys, so only these profile fields can reach the update —
// verification/quota fields (verified, verificationStatus, jobPostingQuota)
// are never client-writable.
const updateCompanySchema = {
  body: z.object({
    name: z.string().min(1, "Company name cannot be empty").optional(),
    logoUrl: z.string().url("Invalid logo URL").nullable().optional(),
    description: z.string().max(1000, "Description cannot exceed 1000 characters").nullable().optional(),
    industry: z.string().nullable().optional(),
    companySize: z.string().nullable().optional(),
    website: z.union([z.string().url("Invalid website URL"), z.string().length(0)]).nullable().optional(),
    location: z.string().nullable().optional(),
    foundedYear: z.string().nullable().optional(),
    officialEmail: z.union([z.string().email("Invalid official email"), z.string().length(0)]).nullable().optional(),
    recruiterName: z.string().nullable().optional(),
    recruiterDesignation: z.string().nullable().optional(),
    socialLinks: z.object({
      linkedin: z.string().url("Invalid LinkedIn URL").or(z.string().length(0)).nullable().optional(),
      github: z.string().url("Invalid GitHub URL").or(z.string().length(0)).nullable().optional(),
      youtube: z.string().url("Invalid YouTube URL").or(z.string().length(0)).nullable().optional(),
      facebook: z.string().url("Invalid Facebook URL").or(z.string().length(0)).nullable().optional()
    }).optional(),
    photos: z.array(z.string().url("Invalid photo URL")).optional()
  })
};

module.exports = { updateCompanySchema };
