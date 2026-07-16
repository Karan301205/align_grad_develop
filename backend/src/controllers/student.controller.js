const { prisma } = require('../config/db');
const { TECHNICAL_SKILLS } = require('../constants/technicalSkills');
const { buildStudentSkillMap, getMissingRequirements } = require('../services/skillMatching.service');
const { purgeExpiredJobs } = require('../services/jobLifecycle.service');
const { deleteS3ObjectFromUrl } = require('../services/fileCleanup.service');
const mcqService = require('../services/mcq/mcqService');

exports.getProfile = async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id }
    });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

exports.updateProfile = async (req, res) => {
  const { 
    name, 
    username,
    profilePic,
    resumeUrl, 
    skills,
    bio,
    nationality,
    gender,
    email,
    dob,
    phone,
    socialLinks,
    education,
    experience,
    certificates,
    projects,
    cocurricular,
    introVideoUrl,
    isOnboarded
  } = req.body;
  try {
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: req.user.id }
    });

    if (username) {
      const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({ error: 'Invalid username format. 3-15 characters, alphanumeric/underscores only.' });
      }

      const existingUsernameProfile = await prisma.profile.findFirst({
        where: {
          username: {
            equals: username,
            mode: 'insensitive'
          }
        }
      });

      if (existingUsernameProfile && existingUsernameProfile.userId !== req.user.id) {
        return res.status(400).json({ error: 'Username is already taken by another student.' });
      }
    }

    if (dob) {
      const birthDate = new Date(dob);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 17) {
          return res.status(400).json({ error: 'You must be at least 17 years old to access this platform.' });
        }
      }
    }

    let profile;
    if (existingProfile) {
      profile = await prisma.profile.update({
        where: { userId: req.user.id },
        data: {
          name,
          username: username ? username : null,
          profilePic,
          resumeUrl,
          skills: skills ? {
            set: skills // Array of { name: "React", rating: 4 }
          } : undefined,
          bio,
          nationality,
          gender,
          email,
          dob,
          phone,
          socialLinks,
          education,
          experience,
          certificates,
          projects,
          cocurricular,
          introVideoUrl,
          isOnboarded: isOnboarded !== undefined ? isOnboarded : undefined
        }
      });
    } else {
      profile = await prisma.profile.create({
        data: {
          userId: req.user.id,
          name: name || 'Student',
          username: username ? username : null,
          profilePic,
          resumeUrl,
          skills: skills ? {
            set: skills
          } : undefined,
          bio,
          nationality,
          gender,
          email,
          dob,
          phone,
          socialLinks,
          education,
          experience,
          certificates,
          projects,
          cocurricular,
          introVideoUrl,
          isOnboarded: isOnboarded !== undefined ? isOnboarded : undefined
        }
      });
    }
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating profile' });
  }
};

exports.getJobs = async (req, res) => {
  try {
    // Auto-delete expired jobs
    await purgeExpiredJobs(prisma);

    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id }
    });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const jobs = await prisma.job.findMany();
    const applications = await prisma.application.findMany({
      where: { studentId: profile.id }
    });

    const studentSkills = buildStudentSkillMap(profile);

    const matchedJobs = jobs.map(job => {
      const missingRequirements = getMissingRequirements(job, studentSkills);

      const applied = applications.some(app => app.jobId === job.id);

      return {
        ...job,
        matched: missingRequirements.length === 0,
        missingRequirements,
        applied
      };
    });

    matchedJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(matchedJobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching jobs' });
  }
};

exports.applyJob = async (req, res) => {
  const { jobId } = req.params;
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id }
    });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const studentSkills = buildStudentSkillMap(profile);

    const hasMissing = getMissingRequirements(job, studentSkills).length > 0;

    if (hasMissing) {
      return res.status(400).json({ error: 'You do not meet the minimum rating requirements for this job.' });
    }

    const existingApps = await prisma.application.findMany({
      where: { studentId: profile.id, jobId: job.id }
    });
    if (existingApps.length > 0) {
      return res.status(400).json({ error: 'You have already applied to this job.' });
    }

    const roundStatuses = (job.selectionProcess && job.selectionProcess.length > 0)
      ? job.selectionProcess.map(round => ({
          roundNumber: round.roundNumber,
          name: round.name,
          status: 'PENDING',
          feedback: ''
        }))
      : [
          { roundNumber: 1, name: 'Resume Screening', status: 'PENDING', feedback: '' }
        ];

    const app = await prisma.application.create({
      data: {
        studentId: profile.id,
        jobId: job.id,
        status: 'APPLIED',
        roundStatuses: {
          set: roundStatuses
        }
      }
    });

    res.status(201).json(app);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error applying for job' });
  }
};

exports.submitTest = async (req, res) => {
  const { skillName, score, targetRating } = req.body;
  if (!skillName || score === undefined || !targetRating) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id }
    });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const passed = true;

    await prisma.testAttempt.create({
      data: {
        profileId: profile.id,
        skillName,
        score,
        passed
      }
    });

    const calculatedRating = Math.max(1, Math.round(score / 10));

    let updatedSkills = [...(profile.skills || [])];
    const skillIdx = updatedSkills.findIndex(s => s.name.toLowerCase() === skillName.toLowerCase());

    if (skillIdx !== -1) {
      updatedSkills[skillIdx].rating = Math.max(updatedSkills[skillIdx].rating, calculatedRating);
      updatedSkills[skillIdx].verifiedRating = Math.max(updatedSkills[skillIdx].verifiedRating || 0, calculatedRating);
    } else {
      updatedSkills.push({ name: skillName, rating: calculatedRating, verifiedRating: calculatedRating });
    }

    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        skills: {
          set: updatedSkills
        }
      }
    });

    res.json({
      passed,
      score,
      skillName,
      targetRating
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error submitting test' });
  }
};

exports.getTechnicalSkills = async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const skills = profile.skills || [];
    if (skills.length === 0) {
      return res.json({ technicalSkills: [] });
    }

    // Filter skills locally using TECHNICAL_SKILLS Set
    const technicalSkills = skills
      .filter(s => TECHNICAL_SKILLS.has(s.name.toLowerCase()))
      .map(s => ({
        name: s.name,
        rating: s.rating,
        verifiedRating: s.verifiedRating || null
      }));

    res.json({ technicalSkills });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving technical skills' });
  }
};

exports.generateSkillTest = async (req, res) => {
  const { skillName } = req.body;
  if (!skillName) {
    return res.status(400).json({ error: 'skillName is required' });
  }

  try {
    const testData = await mcqService.generate(skillName);
    res.json(testData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error generating skill test' });
  }
};

exports.submitSkillTest = async (req, res) => {
  const { skillName, score } = req.body;
  if (!skillName || score === undefined) {
    return res.status(400).json({ error: 'skillName and score are required' });
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const testScore = parseInt(score, 10);
    const passed = true;

    // Save test attempt
    const attempt = await prisma.testAttempt.create({
      data: {
        profileId: profile.id,
        skillName,
        score: testScore,
        passed: passed
      }
    });

    // Update Skill in candidate profile
    let updatedSkills = [...(profile.skills || [])];
    const skillIdx = updatedSkills.findIndex(s => s.name.toLowerCase() === skillName.toLowerCase());

    if (skillIdx !== -1) {
      updatedSkills[skillIdx].verifiedRating = testScore;
      updatedSkills[skillIdx].rating = Math.max(updatedSkills[skillIdx].rating, testScore);
    } else {
      updatedSkills.push({
        name: skillName,
        rating: testScore,
        verifiedRating: testScore
      });
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        skills: {
          set: updatedSkills
        }
      }
    });

    res.json({
      attempt,
      skills: updatedProfile.skills
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error submitting skill test' });
  }
};

exports.saveIntroVideo = async (req, res) => {
  const { introVideoUrl } = req.body;
  try {
    // 1. Get the current profile to check for an existing video file
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // 2. If there is an old video URL and it's different from the new one, delete the old file
    if (profile.introVideoUrl && profile.introVideoUrl !== introVideoUrl) {
      try {
        await deleteS3ObjectFromUrl(profile.introVideoUrl, 'video file');
      } catch (deleteErr) {
        console.error('Failed to parse and delete old video from S3:', deleteErr);
      }
    }

    // 3. Update the database
    const updatedProfile = await prisma.profile.update({
      where: { userId: req.user.id },
      data: { introVideoUrl }
    });

    res.json(updatedProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error saving intro video URL' });
  }
};

exports.requestVideoUploadUrl = async (req, res) => {
  const { fileName, contentType } = req.body;
  if (!fileName || !contentType) {
    return res.status(400).json({ error: 'fileName and contentType are required' });
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id }
    });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const fileExt = fileName.split('.').pop() || 'webm';
    const key = `videos/${profile.id}/showcase_${Date.now()}.${fileExt}`;

    const { getPublicUrl } = require('../config/s3');
    const uploadUrl = `${req.protocol}://${req.get('host')}/api/upload/secure-put?fileType=video&key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}`;
    const publicUrl = getPublicUrl(key);

    res.json({
      signedUrl: uploadUrl,
      publicUrl: publicUrl
    });

  } catch (err) {
    console.error('Error generating S3 pre-signed upload URL for video:', err);
    res.status(500).json({ error: 'Failed to generate S3 pre-signed upload URL for video' });
  }
};

exports.checkUsername = async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: 'Username query parameter is required' });
  }

  const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: 'Invalid username format. 3-15 characters, alphanumeric/underscores only.' });
  }

  try {
    const existingProfile = await prisma.profile.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive'
        }
      }
    });

    if (!existingProfile) {
      return res.json({ available: true });
    }

    if (existingProfile.userId === req.user.id) {
      return res.json({ available: true, isCurrent: true });
    }

    res.json({ available: false, reason: 'Username is already taken' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error checking username' });
  }
};

exports.getStudentApplications = async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id }
    });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const applications = await prisma.application.findMany({
      where: { studentId: profile.id }
    });

    const populatedApps = await Promise.all(applications.map(async app => {
      const job = app.job || await prisma.job.findUnique({
        where: { id: app.jobId }
      });
      if (!job) return null;
      const company = await prisma.company.findUnique({
        where: { id: job.companyId }
      });
      return {
        ...app,
        job: {
          ...job,
          companyName: company ? company.name : (job.companyName || 'Aether Corp'),
          company: company
        }
      };
    }));

    // Filter out nulls if any job was deleted
    res.json(populatedApps.filter(Boolean));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching student applications' });
  }
};

const https = require('https');
const http = require('http');

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download file: status code ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', (err) => reject(err));
    }).on('error', (err) => reject(err));
  });
}

exports.parseUploadedResume = async (req, res) => {
  const { resumeUrl } = req.body;
  if (!resumeUrl) {
    return res.status(400).json({ error: 'Resume URL is required.' });
  }

  try {
    const buffer = await downloadFile(resumeUrl);

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: 'The downloaded resume file is empty.' });
    }

    let rawText = '';
    const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    const isDocx = buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;

    if (isPdf) {
      const pdfParser = require('../services/resume-parser/extractors/pdfExtractor');
      rawText = await pdfParser.extractText(buffer);
    } else if (isDocx) {
      const docxParser = require('../services/resume-parser/extractors/docxExtractor');
      rawText = await docxParser.extractText(buffer);
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Please upload a valid PDF or DOCX resume.' });
    }

    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract any text from the resume.' });
    }

    const { parseResumeText } = require('../services/resume-parser/index');
    const parsedData = parseResumeText(rawText);

    res.json(parsedData);
  } catch (err) {
    console.error('Resume parsing endpoint error:', err);
    res.status(500).json({ error: err.message || 'Server error parsing the resume.' });
  }
};



