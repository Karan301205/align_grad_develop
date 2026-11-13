const crypto = require('crypto');
const { prisma } = require('../../infrastructure/database');
const { TECHNICAL_SKILLS } = require('../../constants/technicalSkills');
const {
  buildStudentSkillMap,
  getMissingRequirements,
  getRequirementStatuses,
  calculateCandidateJobRecommendation
} = require('../skills');
const { purgeExpiredJobs } = require('../jobs/jobLifecycle.service');
const { evaluateAnswers, toCandidateQuestions } = require('../jobs/screeningQuestions');
const { deleteS3ObjectFromUrl } = require('../../services/fileCleanup.service');
const testSessionRepo = require('../../services/questionBank/repositories/testSessionRepository');
const questionRepo = require('../../services/questionBank/repositories/questionRepository');
const assessmentRepo = require('../../services/questionBank/repositories/assessmentRepository');
const { selectQuestions } = require('../../services/questionBank/selection');
const { scoreAnswers, passMark, countUnanswered } = require('../../services/questionBank/scoring');

// A candidate must fill every General-tab field and upload an intro video before
// applying to jobs or taking skill tests (same rule as the frontend's
// utils/profileCompleteness.js isProfileComplete). Returns the error for the
// first missing piece, or null when the profile is complete.
const REQUIRED_GENERAL_FIELDS = ['name', 'username', 'bio', 'gender', 'email', 'dob', 'phone'];
function profileCompletionError(profile, action) {
  const filled = (value) => typeof value === 'string' && value.trim().length > 0;
  if (!REQUIRED_GENERAL_FIELDS.every((field) => filled(profile[field]))) {
    return `Please complete all required fields in your profile General tab before ${action}.`;
  }
  if (!filled(profile.introVideoUrl)) {
    return `Please upload an introduction video in your profile before ${action}.`;
  }
  return null;
}
exports._profileCompletionError = profileCompletionError;

// The company fields a candidate may see with a job. Never the verification docs,
// official email, owner id or posting quota (ISSUES S2).
function publicCompany(company) {
  if (!company) return null;
  return { id: company.id, name: company.name, logoUrl: company.logoUrl || null, verified: company.verified === true };
}

// A candidate's own screening answers, without the server's MCQ right/wrong mark.
const candidateAnswers = (answers) => (Array.isArray(answers) ? answers.map(({ isCorrect, ...answer }) => answer) : []);

exports.getProfile = async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id }
    });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { plan: true }
    });
    res.json({
      ...profile,
      plan: user?.plan || 'FREE'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

// Candidates cannot self-rate skills for which active MCQ tests exist (skillsWithMCQs).
// For those skills, the server controls the rating based on test performance (or defaults to 1).
// For untestable technical skills (no quiz in bank) and soft skills, candidates are allowed
// to self-rate from 1 to 10.
function reconcileSkills(incoming, existing, skillsWithMCQs = new Set()) {
  const byName = new Map((existing || []).map((s) => [String(s.name).toLowerCase(), s]));
  return (incoming || [])
    .filter((s) => s && s.name)
    .map((s) => {
      const canonicalName = String(s.name).toLowerCase();
      const prior = byName.get(canonicalName);
      const hasMcq = skillsWithMCQs.has(canonicalName);

      let rating;
      if (hasMcq) {
        // Skill with MCQ: Candidate cannot self-rate. Retain existing server test rating, or default to 1.
        rating = prior ? (prior.rating || 1) : 1;
      } else {
        // Untested technical skills or soft skills: candidate is allowed to self-rate (1-10)
        const incomingRating = parseInt(s.rating, 10);
        if (!isNaN(incomingRating) && incomingRating >= 1 && incomingRating <= 10) {
          rating = incomingRating;
        } else {
          rating = prior ? (prior.rating || 1) : 1;
        }
      }

      const skill = { name: prior ? prior.name : s.name, rating };
      const vr = prior ? prior.verifiedRating : undefined;
      if (vr !== undefined && vr !== null) skill.verifiedRating = vr;
      return skill;
    });
}
function sanitizeProjects(projects) {
  if (!Array.isArray(projects)) return projects;
  return projects.map(proj => {
    if (!proj || typeof proj !== 'object') return proj;
    let cleanSkills = [];
    if (Array.isArray(proj.skills)) {
      const seen = new Set();
      for (const skill of proj.skills) {
        if (typeof skill === 'string') {
          const trimmed = skill.trim();
          const lower = trimmed.toLowerCase();
          if (trimmed.length > 0 && !seen.has(lower)) {
            seen.add(lower);
            cleanSkills.push(trimmed);
          }
        }
      }
    }
    const cleanVideoUrl = typeof proj.videoUrl === 'string' && proj.videoUrl.trim().length > 0
      ? proj.videoUrl.trim()
      : null;
    return {
      ...proj,
      skills: cleanSkills,
      videoUrl: cleanVideoUrl
    };
  });
}
exports._sanitizeProjects = sanitizeProjects;

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
    isOnboarded,
    preferredWorkModes,
    preferredWorkTypes,
    preferredLocations,
    openToAnyLocation
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

    let skillsWithMCQs = new Set();
    if (skills) {
      const activeQuestions = await prisma.question.findMany({
        where: { status: 'ACTIVE' },
        select: { skillName: true },
        distinct: ['skillName']
      });
      skillsWithMCQs = new Set(activeQuestions.map(q => q.skillName.toLowerCase()));
    }

    let profile;
    if (existingProfile) {
      profile = await prisma.profile.update({
        where: { userId: req.user.id },
        data: {
          name,
          // Left out of the request → keep the saved username (an empty one clears it).
          username: username === undefined ? undefined : username || null,
          profilePic,
          resumeUrl,
          skills: skills ? reconcileSkills(skills, existingProfile.skills, skillsWithMCQs) : undefined,
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
          projects: projects !== undefined ? sanitizeProjects(projects) : undefined,
          cocurricular,
          introVideoUrl,
          isOnboarded: isOnboarded !== undefined ? isOnboarded : undefined,
          preferredWorkModes: preferredWorkModes !== undefined ? preferredWorkModes : undefined,
          preferredWorkTypes: preferredWorkTypes !== undefined ? preferredWorkTypes : undefined,
          preferredLocations: preferredLocations !== undefined ? preferredLocations : undefined,
          openToAnyLocation: openToAnyLocation !== undefined ? openToAnyLocation : undefined
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
          skills: skills ? reconcileSkills(skills, [], skillsWithMCQs) : undefined,
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
          projects: projects ? sanitizeProjects(projects) : [],
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

    const allJobs = await prisma.job.findMany({ include: { company: true } });
    const jobs = allJobs.filter(job => job.status !== 'PAUSED' && !job.isPaused && job.status !== 'CLOSED');
    const applications = await prisma.application.findMany({
      where: { studentId: profile.id }
    });

    const activeQuestions = await prisma.question.findMany({
      where: { status: 'ACTIVE' },
      select: { skillName: true },
      distinct: ['skillName']
    });
    const skillsWithQuestionsSet = new Set(activeQuestions.map(q => q.skillName.toLowerCase()));

    const studentSkills = buildStudentSkillMap(profile);

    const matchedJobs = jobs.map(job => {
      const missingRequirements = getMissingRequirements(job, studentSkills, skillsWithQuestionsSet);
      const requirementStatuses = getRequirementStatuses(job, studentSkills, skillsWithQuestionsSet);

      const applied = applications.some(app => app.jobId === job.id);
      const recommendation = calculateCandidateJobRecommendation(job, profile, studentSkills, applications);

      return {
        ...job,
        company: publicCompany(job.company),
        screeningQuestions: toCandidateQuestions(job.screeningQuestions),
        matched: missingRequirements.length === 0,
        missingRequirements,
        requirementStatuses,
        applied,
        recommendationScore: recommendation.recommendationScore,
        matchLabel: recommendation.matchLabel,
        matchBreakdown: recommendation.matchBreakdown
      };
    });

    // Default sort: Recommended Best Match desc, then newest
    matchedJobs.sort((a, b) => {
      if ((b.recommendationScore || 0) !== (a.recommendationScore || 0)) {
        return (b.recommendationScore || 0) - (a.recommendationScore || 0);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

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

    const incompleteError = profileCompletionError(profile, 'applying to opportunities');
    if (incompleteError) {
      return res.status(400).json({ error: incompleteError });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const activeQuestions = await prisma.question.findMany({
      where: { status: 'ACTIVE' },
      select: { skillName: true },
      distinct: ['skillName']
    });
    const skillsWithQuestionsSet = new Set(activeQuestions.map(q => q.skillName.toLowerCase()));

    const studentSkills = buildStudentSkillMap(profile);

    const hasMissing = getMissingRequirements(job, studentSkills, skillsWithQuestionsSet).length > 0;

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

    // Screening answers are checked per question type; MCQs are scored server-side.
    const screening = evaluateAnswers(job.screeningQuestions, (req.body || {}).answers);
    if (screening.error) {
      return res.status(400).json({ error: screening.error });
    }
    const evaluatedAnswers = screening.answers;

    const app = await prisma.application.create({
      data: {
        studentId: profile.id,
        jobId: job.id,
        status: 'APPLIED',
        roundStatuses,
        answers: evaluatedAnswers.length > 0 ? evaluatedAnswers : undefined
      }
    });

    res.status(201).json(app);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error applying for job' });
  }
};

// DISABLED (Decision 1). This legacy endpoint trusted a client-supplied score to
// raise a rating — the exact hole Decision 1 forbids. Skill ratings can now only
// change via the server-scored flow: POST /student/tests/generate then
// POST /student/tests/submit (submitSkillTest). Kept as a hard 410 so any stale
// client fails loudly instead of silently getting a self-assigned rating.
exports.submitTest = async (req, res) => {
  return res.status(410).json({
    error: 'This endpoint is disabled. Take the assessment via /student/tests/generate and submit answers to /student/tests/submit; scoring is server-side.',
  });
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

    const activeQuestions = await prisma.question.findMany({
      where: { status: 'ACTIVE' },
      select: { skillName: true },
      distinct: ['skillName']
    });
    const skillsWithMCQs = new Set(activeQuestions.map(q => q.skillName.toLowerCase()));

    // When each skill was last tested (newest attempt first).
    const attempts = await prisma.testAttempt.findMany({ where: { profileId: profile.id }, orderBy: { createdAt: 'desc' } });
    const testedAt = new Map();
    attempts.forEach(a => {
      const key = String(a.skillName || '').toLowerCase();
      if (!testedAt.has(key)) testedAt.set(key, a.createdAt);
    });

    // Filter skills locally using TECHNICAL_SKILLS Set
    const technicalSkills = skills
      .filter(s => s && s.name && TECHNICAL_SKILLS.has(s.name.toLowerCase()))
      .map(s => {
        const hasQuiz = skillsWithMCQs.has(s.name.toLowerCase());
        return {
          name: s.name,
          rating: s.rating,
          verifiedRating: s.verifiedRating || null,
          hasQuiz: hasQuiz,
          canTestNow: hasQuiz,
          autoVerifiedForNow: !hasQuiz,
          testedAt: testedAt.get(s.name.toLowerCase()) || null
        };
      });

    res.json({ technicalSkills });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving technical skills' });
  }
};

// Build a 10-question test STRICTLY from the pre-generated Question Bank (Phase 4).
// The selection engine draws ACTIVE questions spread across subtopics with a
// balanced difficulty mix and no repeats. No live/dynamic generation happens here.
//
// Returns three parallel arrays for the same 10 questions:
//   - questions: client-safe { id, question, options } only (id is a 1-based
//     ordinal, NOT the DB id — no internal identifier is exposed)
//   - answerKey: correct option index (0-3), stored only in the TestSession
//   - questionIds: DB Question ids, stored only in the TestSession, used to
//     attribute usage/outcome counters on serve and submit.
async function buildSkillTest(skillName, opts = {}) {
  const pool = await questionRepo.findActiveBySkill(skillName);
  const picked = selectQuestions(pool, { count: 10, seed: opts.seed });
  const shuffled = picked.map((q) => shuffleOptions(q.options || [], q.correctIndex));

  return {
    questions: picked.map((q, i) => ({ id: i + 1, question: q.question, options: shuffled[i].options })),
    answerKey: shuffled.map((q) => q.correctIndex),
    questionIds: picked.map((q) => q.id),
  };
}
exports._buildSkillTest = buildSkillTest;

// Options that only make sense where the author put them ("All of the above",
// "Both A and B") keep their place when a question's options are shuffled.
const PINNED_OPTION = /\b(all|none|both|neither) of the above\b|\bboth [a-d] and [a-d]\b/i;

/**
 * A fresh order of a question's options for one test, so the right answer can't be
 * guessed from its position (in the bank most right answers are option A or B).
 * Returns { options, correctIndex } with the key moved to the answer's new place.
 */
function shuffleOptions(options, correctIndex, randomInt = crypto.randomInt) {
  const free = options.map((_, i) => i).filter((i) => !PINNED_OPTION.test(String(options[i])));
  const order = [...free];
  for (let i = order.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  const source = options.map((_, i) => i); // new position -> original position
  free.forEach((slot, k) => {
    source[slot] = order[k];
  });
  return { options: source.map((i) => options[i]), correctIndex: source.indexOf(correctIndex) };
}
exports._shuffleOptions = shuffleOptions;

// Tests being scored right now (session ids), so a double click can't score twice.
const submitsInFlight = new Set();

exports.generateSkillTest = async (req, res) => {
  const { skillName } = req.body;
  if (!skillName) {
    return res.status(400).json({ error: 'skillName is required' });
  }

  try {
    // Skill tests unlock only once the General tab and intro video are done
    // (the "Your Tests" tab is locked in the UI until then).
    const profile = await prisma.profile.findUnique({ where: { userId: req.user.id } });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const incompleteError = profileCompletionError(profile, 'taking skill tests');
    if (incompleteError) {
      return res.status(403).json({ error: incompleteError });
    }

    const { questions, answerKey, questionIds } = await buildSkillTest(skillName);
    // Bank-only (Phase 4): if the bank cannot supply a full test, fail rather than
    // generate dynamically.
    if (questions.length < 10 || answerKey.some((i) => i < 0 || i > 3)) {
      console.warn('[assessment] insufficient bank questions', { skillName, available: questions.length });
      return res.status(502).json({ error: 'Not enough questions in the bank for this skill' });
    }

    // Store the answer key AND the served question ids server-side; neither is
    // ever sent to the client.
    const session = await testSessionRepo.create({
      userId: req.user.id,
      skillName,
      answerKey,
      questionIds,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    });

    // A question is "served" now: atomically bump usageCount + lastUsed. Best-effort
    // — a tracking failure must not break the candidate's assessment.
    questionRepo.recordServed(questionIds).catch((e) => console.error('recordServed failed:', e.message));

    // Only client-safe fields leave the server: id (ordinal), question, options.
    console.log('[assessment] generated', { skillName, sessionId: session.id, served: questions.length });
    res.json({ sessionId: session.id, skillName, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error generating skill test' });
  }
};

exports.submitSkillTest = async (req, res) => {
  const { sessionId, answers } = req.body;
  if (!sessionId || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'sessionId and answers[] are required' });
  }
  if (submitsInFlight.has(sessionId)) {
    return res.status(409).json({ error: 'This test is already being scored.' });
  }
  submitsInFlight.add(sessionId);

  try {
    // Single-use, expiring, owned-by-caller session. Rejects fabricated,
    // replayed, or expired sessions — the client cannot self-assign a score.
    const session = await testSessionRepo.findValidForUser(sessionId, req.user.id);
    if (!session) {
      return res.status(400).json({ error: 'Invalid, expired, or already-used test session' });
    }

    // Every served question must be answered. Checked before the session is
    // burned, so the candidate can go back, finish the test and resubmit.
    const unanswered = countUnanswered(session.answerKey, answers);
    if (unanswered > 0) {
      const total = (session.answerKey || []).length;
      return res.status(400).json({
        error: `Please answer all ${total} questions before submitting (${unanswered} unanswered).`,
      });
    }

    // Server-side scoring against the stored answer key.
    const { correct, total, score, passed, rating } = scoreAnswers(session.answerKey, answers);

    // Classify every served question from the SERVER-SIDE key (frontend values are
    // never trusted). A missing answer or the -1 sentinel counts as a skip.
    const key = session.answerKey || [];
    const ids = session.questionIds || [];
    const correctIds = [], wrongIds = [], skipIds = [], results = [];
    for (let i = 0; i < key.length; i++) {
      const given = answers[i];
      const isSkip = given == null || Number(given) === -1;
      const isCorrect = !isSkip && Number(given) === key[i];
      results.push({ correct: isCorrect }); // per-question result only — no answer key exposed
      if (!ids[i]) continue; // legacy session without question ids → cannot attribute
      if (isSkip) skipIds.push(ids[i]);
      else if (isCorrect) correctIds.push(ids[i]);
      else wrongIds.push(ids[i]);
    }

    // Burn the session before mutating anything so it can never be replayed.
    await testSessionRepo.markUsed(session.id, { score, passed });

    // Right answers per subtopic, for the candidate's summary ("what to focus on").
    // Best-effort: without it the result still shows the score.
    const subtopicOf = new Map(
      (await questionRepo.findSubtopics(ids).catch((e) => {
        console.error('subtopic lookup failed:', e.message);
        return [];
      })).map((q) => [q.id, q.subtopic])
    );
    const byTopic = new Map();
    results.forEach((r, i) => {
      const name = subtopicOf.get(ids[i]);
      if (!name) return;
      const topic = byTopic.get(name) || { name, correct: 0, total: 0 };
      topic.total += 1;
      if (r.correct) topic.correct += 1;
      byTopic.set(name, topic);
    });

    // Atomically fold this attempt into the per-question counters. Best-effort:
    // a tracking failure must not fail the candidate's submission.
    questionRepo.recordOutcomes({ correctIds, wrongIds, skipIds })
      .catch((e) => console.error('recordOutcomes failed:', e.message));

    // Phase 5 analytics: append an immutable assessment-level record for future
    // reporting. Best-effort — never blocks or fails the submission. `startedAt`
    // is when the session (assessment) was created; `endedAt` is now.
    assessmentRepo.record({
      candidateId: req.user.id,
      skill: session.skillName,
      questionIds: ids,
      startedAt: session.createdAt || new Date(),
      endedAt: new Date(),
      totalQuestions: key.length,
      correctAnswers: correctIds.length,
      wrongAnswers: wrongIds.length,
      skippedQuestions: skipIds.length,
      finalScore: score,
      passed,
    }).catch((e) => console.error('assessment analytics record failed:', e.message));

    const profile = await prisma.profile.findUnique({ where: { userId: req.user.id } });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    await prisma.testAttempt.create({
      data: { profileId: profile.id, skillName: session.skillName, score, passed },
    });

    // Score evaluation:
    // 70% threshold required to earn verified rating (passed).
    // Regardless of passing, the candidate's current rating is updated to reflect their test score!
    let updatedSkills = [...(profile.skills || [])];
    const skillIdx = updatedSkills.findIndex(
      (s) => s.name.toLowerCase() === session.skillName.toLowerCase()
    );
    const newVerifiedRating = passed ? rating : null;

    if (skillIdx !== -1) {
      updatedSkills[skillIdx].rating = rating;
      updatedSkills[skillIdx].verifiedRating = newVerifiedRating;
    } else {
      updatedSkills.push({
        name: session.skillName,
        rating,
        verifiedRating: newVerifiedRating,
      });
    }

    await prisma.profile.update({
      where: { id: profile.id },
      data: { skills: updatedSkills },
    });

    console.log('[assessment] submitted', {
      skillName: session.skillName, candidateId: req.user.id, score, passed,
      correct: correctIds.length, wrong: wrongIds.length, skip: skipIds.length,
    });

    // Phase 4 integrity: never expose the answer key, explanations, or metadata.
    // `results` is only per-question correctness so the candidate sees their outcome.
    res.json({
      score,                 // percentage 0-100
      rating,                // 1-10 level (only applied to the profile when passed)
      correct,               // number of correctly answered questions
      total,                 // number of questions served
      passMark: passMark(total), // correct answers needed to pass (7 of 10)
      passed,
      skillName: session.skillName,
      results,               // [{ correct: boolean }] aligned to served question order
      topics: [...byTopic.values()], // [{ name, correct, total }] per subtopic served
      skills: updatedSkills,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error submitting skill test' });
  } finally {
    submitsInFlight.delete(sessionId);
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
  const { fileName, contentType, category } = req.body;
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
    const isProjectVideo = category === 'project';
    const prefix = isProjectVideo ? 'proj' : 'showcase';
    // Project walkthroughs get a larger size limit (see config/upload.config.js).
    const fileType = isProjectVideo ? 'projectVideo' : 'video';
    const key = `videos/${profile.id}/${prefix}_${Date.now()}.${fileExt}`;

    const { getPublicUrl } = require('../../infrastructure/storage/s3');
    const uploadUrl = `${req.protocol}://${req.get('host')}/api/upload/secure-put?fileType=${fileType}&key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}`;
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
        answers: candidateAnswers(app.answers),
        job: {
          ...job,
          screeningQuestions: toCandidateQuestions(job.screeningQuestions),
          companyName: company?.name || job.companyName || '',
          company: publicCompany(company)
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

exports.getPublicJobBrief = async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!jobId || !/^[0-9a-fA-F]{24}$/.test(jobId)) {
      return res.status(404).json({ error: 'Job not found or expired' });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: true }
    });

    if (!job || job.status === 'CLOSED') {
      return res.status(404).json({ error: 'Job not found or expired' });
    }

    res.json({ ...job, company: publicCompany(job.company), screeningQuestions: toCandidateQuestions(job.screeningQuestions) });
  } catch (err) {
    console.error('Error fetching public job brief:', err);
    res.status(500).json({ error: 'Server error fetching job brief' });
  }
};
