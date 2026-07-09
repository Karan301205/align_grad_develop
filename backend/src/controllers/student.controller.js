const { prisma } = require('../config/db');

const TECHNICAL_SKILLS = new Set([
  "a2a", "amazon redshift", "analytics", "angularjs", "ansible", "apache airflow", "apache spark",
  "api", "api testing", "aws", "azure", "bash scripting", "bigquery", "bootstrap", "c", "c#", "c++",
  "celery", "chart.js", "claude code", "concurrency", "crew ai", "css", "cypress", "databricks",
  "data structure", "data warehousing", "dax", "deep learning (dl)", "distributed systems",
  "django", "docker", "docker compose", "elasticsearch", "elk stack", "eslint", "etl",
  "event-driven architecture", "express js", "fastapi", "firebase", "framer motion",
  "gemini api", "genai", "generative ai", "git and github", "github actions", "go",
  "google analytics", "google cloud platform", "hadoop hdfs", "haskell", "helm", "html",
  "hugging face", "j2ee", "jaeger", "java", "javascript", "jest", "jquery", "kafka", "keras",
  "kubernetes", "langchain", "langgraph", "langsmith", "lightgbm", "linux", "llm",
  "machine learning", "makefiles", "matplotlib", "matplotlib & seaborn", "mcp", "mlflow",
  "mongodb", "mysql", "n8n introduction", "natural language processing",
  "natural language toolkit (nltk)", ".net", "next.js", "next js", "nginx", "node.js",
  "nosql", "numpy", "oauth 2.0", "openai api", "opencv", "pandas", "perl", "php", "pinecone",
  "playwright", "postgresql", "postman", "power bi", "prisma orm", "prometheus", "pyspark",
  "python", "pytorch", "rabbitmq", "rag", "react", "react native", "react testing library",
  "redhat linux 7.5", "redux", "ruby", "rust", "scikit-learn", "scipy", "sentry", "servicenow",
  "snowflake", "sql", "storybook", "supabase", "swagger", "swift", "tableau", "tailwind",
  "tailwind css", "tensorflow", "terraform", "three.js", "transformers", "turborepo",
  "typescript", "unit testing", "unix", "vector embeddings", "virtualization", "vue.js",
  "windows", "yum", "zustand"
]);



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
    introVideoUrl
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

    let profile;
    if (existingProfile) {
      profile = await prisma.profile.update({
        where: { userId: req.user.id },
        data: {
          name,
          username,
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
          introVideoUrl
        }
      });
    } else {
      profile = await prisma.profile.create({
        data: {
          userId: req.user.id,
          name: name || 'Student',
          username,
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
          introVideoUrl
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
    try {
      const allJobs = await prisma.job.findMany();
      for (const job of allJobs) {
        const activeDays = job.activeDays || 30;
        const expiryTime = new Date(job.createdAt).getTime() + activeDays * 24 * 60 * 60 * 1000;
        if (Date.now() > expiryTime) {
          await prisma.application.deleteMany({ where: { jobId: job.id } });
          await prisma.job.delete({ where: { id: job.id } });
        }
      }
    } catch (cleanupErr) {
      console.error('Failed to auto-clean expired jobs:', cleanupErr.message);
    }

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

    const studentSkills = {};
    if (profile.skills) {
      profile.skills.forEach(s => {
        studentSkills[s.name.toLowerCase()] = s.rating;
      });
    }

    const matchedJobs = jobs.map(job => {
      const missingRequirements = [];
      if (job.requirements) {
        job.requirements.forEach(reqSkill => {
          const isTech = TECHNICAL_SKILLS.has(reqSkill.skillName.toLowerCase());
          if (isTech) {
            const studentRating = studentSkills[reqSkill.skillName.toLowerCase()] || 0;
            if (studentRating < reqSkill.minRating) {
              missingRequirements.push({
                skillName: reqSkill.skillName,
                requiredRating: reqSkill.minRating,
                currentRating: studentRating
              });
            }
          }
        });
      }

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

    const studentSkills = {};
    if (profile.skills) {
      profile.skills.forEach(s => {
        studentSkills[s.name.toLowerCase()] = s.rating;
      });
    }

    const hasMissing = job.requirements && job.requirements.some(reqSkill => {
      const isTech = TECHNICAL_SKILLS.has(reqSkill.skillName.toLowerCase());
      if (!isTech) return false;
      const studentRating = studentSkills[reqSkill.skillName.toLowerCase()] || 0;
      return studentRating < reqSkill.minRating;
    });

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

const generateMcqs = async (skillName) => {
  const systemPrompt = `You are a technical evaluation engine. Generate exactly 10 multiple choice questions (MCQs) for the skill: '${skillName}'. Each question must have 4 options and exactly one correct answer. Return a JSON object with a key 'questions' containing an array of objects. Each object must have fields: 'id' (number 1 to 10), 'question' (string), 'options' (array of 4 strings), and 'answer' (string, either 'A', 'B', 'C', or 'D'). Include both theory and coding/syntax analysis questions.`;
  const userPrompt = `Generate 10 MCQs for '${skillName}'.`;

  // 1. Try Claude on AWS Bedrock
  try {
    console.log(`Attempting to generate MCQs for ${skillName} using Claude (us-east-1)...`);
    const bedrockRes = await fetch("https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-haiku-20240307-v1:0/invoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CLAUDE_API_KEY}`
      },
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      })
    });

    if (bedrockRes.ok) {
      const data = await bedrockRes.json();
      const content = data.content[0]?.text;
      const parsed = JSON.parse(content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1));
      if (parsed.questions && parsed.questions.length === 10) {
        console.log("Successfully generated MCQs using Bedrock.");
        return parsed;
      }
    } else {
      console.warn(`Bedrock API responded with status ${bedrockRes.status}`);
    }
  } catch (err) {
    console.error("Bedrock invocation error:", err.message);
  }

  // 2. Fallback to Groq Llama 3.1 8b
  console.log(`Falling back to Groq for MCQ generation of ${skillName}...`);
  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!groqRes.ok) {
    throw new Error(`Groq API failed with status ${groqRes.status}`);
  }

  const groqData = await groqRes.json();
  const parsed = JSON.parse(groqData.choices[0].message.content);
  if (parsed.questions && parsed.questions.length === 10) {
    return parsed;
  }
  throw new Error("Failed to generate exactly 10 questions");
};

exports.generateSkillTest = async (req, res) => {
  const { skillName } = req.body;
  if (!skillName) {
    return res.status(400).json({ error: 'skillName is required' });
  }

  try {
    const testData = await generateMcqs(skillName);
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
        const parts = profile.introVideoUrl.split('.amazonaws.com/');
        if (parts.length > 1) {
          const oldKey = parts[1];
          const { deleteObject } = require('../config/s3');
          console.log(`Deleting old video file from S3: ${oldKey}`);
          await deleteObject(oldKey);
        }
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

    const { getUploadUrl, getPublicUrl } = require('../config/s3');
    const uploadUrl = await getUploadUrl(key, contentType);
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



