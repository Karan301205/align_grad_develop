const { z } = require('zod');
const { SCREENING_TYPES } = require('../jobs/screeningQuestions');

const idRegex = /^[0-9a-fA-F]{24}$/;
const idSchema = z.string().regex(idRegex, 'Invalid ID format');

// Web links only: z.string().url() on its own also accepts javascript:, data: and
// other schemes, which would be unsafe to render as a link for recruiters.
const isWebUrl = (value) => /^https?:\/\/[^\s]+$/i.test(value);
const webUrl = (message) => z.string().max(2048, message).url(message).refine(isWebUrl, message);
const optionalWebUrl = (message) => webUrl(message).or(z.literal('')).optional().nullable();
const text = (max) => z.string().max(max, `Must not exceed ${max} characters`).optional().nullable();
const dateText = text(40);

// Limits match (and are looser than) the profile form in the candidate portal,
// so older profiles still save; they stop oversized or malformed payloads.
const updateProfileSchema = {
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters').optional(),
    username: z.string().regex(/^[a-zA-Z0-9_]{3,15}$/, 'Invalid username format. 3-15 characters, alphanumeric/underscores only.').or(z.literal('')).optional().nullable(),
    profilePic: optionalWebUrl('Invalid profile picture URL'),
    resumeUrl: z.string().url('Invalid resume URL').refine(val => {
      if (!val || val === '') return true;
      try {
        const parsed = new URL(val);
        return (
          /^https?:$/.test(parsed.protocol) &&
          (parsed.hostname === 'drive.google.com' ||
            parsed.hostname === 'docs.google.com' ||
            parsed.hostname.endsWith('.drive.google.com') ||
            parsed.hostname.endsWith('.docs.google.com'))
        );
      } catch (e) {
        return false;
      }
    }, 'Resume URL must be a valid Google Drive link').or(z.literal('')).optional().nullable(),
    bio: z.string().max(500, 'Bio must not exceed 500 characters').optional().nullable(),
    nationality: z.string().max(100).optional().nullable(),
    gender: z.string().max(50).optional().nullable(),
    email: z.string().max(254, 'Invalid email format').email('Invalid email format').or(z.literal('')).optional().nullable(),
    dob: z.string().max(40).refine(val => {
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
    introVideoUrl: optionalWebUrl('Invalid intro video URL'),
    skills: z.array(z.object({
      name: z.string().min(1, 'Skill name is required').max(60, 'Skill name is too long'),
      rating: z.number().int().min(0).max(100),
      verifiedRating: z.number().int().min(0).max(100).optional().nullable()
    })).max(100, 'Too many skills').optional().nullable(),
    socialLinks: z.object({
      linkedin: optionalWebUrl('Invalid LinkedIn link'),
      github: optionalWebUrl('Invalid GitHub link'),
      hackerEarth: optionalWebUrl('Invalid HackerEarth link'),
      hackerRank: optionalWebUrl('Invalid HackerRank link'),
      codechef: optionalWebUrl('Invalid CodeChef link'),
      leetcode: optionalWebUrl('Invalid LeetCode link'),
      codeforces: optionalWebUrl('Invalid Codeforces link'),
      kaggle: optionalWebUrl('Invalid Kaggle link'),
      portfolio: optionalWebUrl('Invalid portfolio link'),
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
      eduType: text(40),
      institute: text(200),
      degree: text(200),
      fieldOfStudy: text(200),
      startDate: dateText,
      endDate: dateText,
      gradeType: text(20),
      gradeValue: text(20)
    })).max(20, 'Too many education entries').optional().nullable(),
    experience: z.array(z.object({
      expType: text(40),
      designation: text(150),
      involvesTech: z.boolean().optional().nullable(),
      companyName: text(150),
      domain: text(100),
      startDate: dateText,
      endDate: dateText,
      currentlyWorking: z.boolean().optional().nullable(),
      location: z.string().max(120).regex(/^[^0-9]*$/, 'Location cannot contain numbers').or(z.literal('')).optional().nullable(),
      description: text(5000)
    })).max(50, 'Too many experience entries').optional().nullable(),
    certificates: z.array(z.object({
      title: text(200),
      org: text(200),
      startDate: dateText,
      link: optionalWebUrl('Invalid certificate URL'),
      certNumber: z.string().max(50).regex(/^[0-9]*$/, 'Certification Number must contain only digits').or(z.literal('')).optional().nullable(),
      description: text(2000),
      // A file read in the browser (data: URL, ~100 KB) or a web link.
      attachment: z.string().max(200000, 'Certificate file is too large').refine((val) => val === '' || val.startsWith('data:') || isWebUrl(val), 'Invalid certificate file').optional().nullable()
    })).max(100, 'Too many certificates').optional().nullable(),
    projects: z.array(z.object({
      title: text(200),
      role: text(150),
      codeUrl: optionalWebUrl('Invalid code URL'),
      hostedUrl: optionalWebUrl('Invalid hosted URL'),
      startDate: dateText,
      endDate: dateText,
      currentlyWorking: z.boolean().optional().nullable(),
      description: text(5000),
      skills: z.array(z.string().trim().max(50)).max(30, 'Too many skills on one project').optional().nullable().default([]),
      videoUrl: optionalWebUrl('Invalid video URL')
    })).max(50, 'Too many projects').optional().nullable(),
    cocurricular: z.array(z.object({
      activity: text(200),
      link: optionalWebUrl('Invalid activity URL'),
      description: text(2000)
    })).max(50, 'Too many activities').optional().nullable(),
    isOnboarded: z.boolean().optional().nullable(),
    preferredWorkModes: z.array(z.string().max(40)).max(10).optional().nullable(),
    preferredWorkTypes: z.array(z.string().max(40)).max(10).optional().nullable(),
    preferredLocations: z.array(z.string().max(100)).max(30, 'Too many locations').optional().nullable(),
    openToAnyLocation: z.boolean().optional().nullable()
  })
};

const applyJobSchema = {
  params: z.object({
    jobId: idSchema
  }),
  body: z.object({
    // Answers are matched to the job's questions and checked per type in
    // modules/jobs/screeningQuestions.js; blank answers to optional questions are allowed.
    answers: z.array(z.object({
      questionId: z.string().optional().nullable(),
      questionText: z.string().optional().default(''),
      type: z.enum(SCREENING_TYPES).optional(),
      answer: z.union([
        z.string().max(6000, 'Answer is too long'),
        z.array(z.string().max(200)).max(10)
      ]).optional().default('')
    })).max(20).optional().default([])
  }).optional()
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

// Server-side scoring (Decision 1 / Plan 2): the client submits the session id and
// its selected option indices — never a score. The backend scores against the
// TestSession answer key.
const submitSkillTestSchema = {
  body: z.object({
    sessionId: z.string().min(1, 'sessionId is required'),
    answers: z.array(z.number().int().min(0).max(3)).min(1, 'answers are required')
  })
};

const saveIntroVideoSchema = {
  body: z.object({
    introVideoUrl: optionalWebUrl('Invalid intro video URL')
  })
};

module.exports = {
  updateProfileSchema,
  applyJobSchema,
  submitTestSchema,
  generateTestSchema,
  submitSkillTestSchema,
  saveIntroVideoSchema
};
