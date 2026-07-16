const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ID format');

const updateProfileSchema = {
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters').optional(),
    username: z.string().regex(/^[a-zA-Z0-9_]{3,15}$/, 'Invalid username format. 3-15 characters, alphanumeric/underscores only.').or(z.literal('')).optional().nullable(),
    profilePic: z.string().url('Invalid profile picture URL').or(z.literal('')).optional().nullable(),
    resumeUrl: z.string().url('Invalid resume S3 URL').or(z.literal('')).optional().nullable(),
    bio: z.string().max(500, 'Bio must not exceed 500 characters').optional().nullable(),
    nationality: z.string().max(100).optional().nullable(),
    gender: z.string().max(50).optional().nullable(),
    email: z.string().email('Invalid email format').or(z.literal('')).optional().nullable(),
    dob: z.string().refine(val => {
      if (val === '') return true;
      const birthDate = new Date(val);
      if (isNaN(birthDate.getTime())) return false;
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 17;
    }, 'You must be at least 17 years old to access this platform.').optional().nullable(),
    phone: z.string().regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number format').or(z.literal('')).optional().nullable(),
    introVideoUrl: z.string().url('Invalid intro video URL').or(z.literal('')).optional().nullable(),
    skills: z.array(z.object({
      name: z.string().min(1, 'Skill name is required'),
      rating: z.number().int().min(0).max(100),
      verifiedRating: z.number().int().min(0).max(100).optional().nullable()
    })).optional().nullable(),
    socialLinks: z.object({
      linkedin: z.string().url().or(z.literal('')).optional().nullable(),
      github: z.string().url().or(z.literal('')).optional().nullable(),
      hackerEarth: z.string().url().or(z.literal('')).optional().nullable(),
      hackerRank: z.string().url().or(z.literal('')).optional().nullable(),
      codechef: z.string().url().or(z.literal('')).optional().nullable(),
      leetcode: z.string().url().or(z.literal('')).optional().nullable(),
      codeforces: z.string().url().or(z.literal('')).optional().nullable(),
      kaggle: z.string().url().or(z.literal('')).optional().nullable(),
      portfolio: z.string().url().or(z.literal('')).optional().nullable(),
      showLinkedin: z.boolean().optional().nullable(),
      showGithub: z.boolean().optional().nullable(),
      showHackerEarth: z.boolean().optional().nullable(),
      showHackerRank: z.boolean().optional().nullable(),
      showCodechef: z.boolean().optional().nullable(),
      showLeetcode: z.boolean().optional().nullable(),
      showCodeforces: z.boolean().optional().nullable(),
      showKaggle: z.boolean().optional().nullable(),
      showPortfolio: z.boolean().optional().nullable()
    }).optional().nullable(),
    education: z.array(z.object({
      eduType: z.string().optional().nullable(),
      institute: z.string().optional().nullable(),
      degree: z.string().optional().nullable(),
      fieldOfStudy: z.string().optional().nullable(),
      startDate: z.string().optional().nullable(),
      endDate: z.string().optional().nullable(),
      gradeType: z.string().optional().nullable(),
      gradeValue: z.string().optional().nullable()
    })).optional().nullable(),
    experience: z.array(z.object({
      expType: z.string().optional().nullable(),
      designation: z.string().optional().nullable(),
      involvesTech: z.boolean().optional().nullable(),
      companyName: z.string().optional().nullable(),
      domain: z.string().optional().nullable(),
      startDate: z.string().optional().nullable(),
      endDate: z.string().optional().nullable(),
      currentlyWorking: z.boolean().optional().nullable(),
      location: z.string().optional().nullable(),
      description: z.string().optional().nullable()
    })).optional().nullable(),
    certificates: z.array(z.object({
      title: z.string().optional().nullable(),
      org: z.string().optional().nullable(),
      startDate: z.string().optional().nullable(),
      link: z.string().url().or(z.literal('')).optional().nullable(),
      certNumber: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      attachment: z.string().optional().nullable()
    })).optional().nullable(),
    projects: z.array(z.object({
      title: z.string().optional().nullable(),
      role: z.string().optional().nullable(),
      codeUrl: z.string().url().or(z.literal('')).optional().nullable(),
      hostedUrl: z.string().url().or(z.literal('')).optional().nullable(),
      startDate: z.string().optional().nullable(),
      endDate: z.string().optional().nullable(),
      currentlyWorking: z.boolean().optional().nullable(),
      description: z.string().optional().nullable()
    })).optional().nullable(),
    cocurricular: z.array(z.object({
      activity: z.string().optional().nullable(),
      link: z.string().url().or(z.literal('')).optional().nullable(),
      description: z.string().optional().nullable()
    })).optional().nullable(),
    isOnboarded: z.boolean().optional().nullable()
  })
};

const applyJobSchema = {
  params: z.object({
    jobId: objectIdSchema
  })
};

const submitTestSchema = {
  body: z.object({
    skillName: z.string().min(1, 'Skill name is required'),
    score: z.number().int().min(0, 'Score must be at least 0').max(100, 'Score must not exceed 100'),
    targetRating: z.number().int().min(1).max(5)
  })
};

const generateTestSchema = {
  body: z.object({
    skillName: z.string().min(1, 'Skill name is required')
  })
};

const submitSkillTestSchema = {
  body: z.object({
    skillName: z.string().min(1, 'Skill name is required'),
    score: z.number().int().min(0).max(100)
  })
};

const saveIntroVideoSchema = {
  body: z.object({
    introVideoUrl: z.string().url('Invalid intro video URL').or(z.literal('')).optional().nullable()
  })
};

const parseResumeSchema = {
  body: z.object({
    resumeUrl: z.string().url('Invalid resume URL')
  })
};

module.exports = {
  updateProfileSchema,
  applyJobSchema,
  submitTestSchema,
  generateTestSchema,
  submitSkillTestSchema,
  saveIntroVideoSchema,
  parseResumeSchema
};
