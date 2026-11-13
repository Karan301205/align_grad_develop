const { prisma } = require('../../infrastructure/database');
const { buildStudentSkillMap, getRequirementStatuses } = require('../skills');
const { toCandidateQuestions } = require('../jobs/screeningQuestions');

// Skills that have an active test. Gig pages are polled while open, so the set is
// cached for a minute instead of scanning the question bank on every poll.
const QUIZ_SKILLS_TTL_MS = 60 * 1000;
let quizSkillsCache = { at: 0, skills: null };
async function quizSkills() {
  if (quizSkillsCache.skills && Date.now() - quizSkillsCache.at < QUIZ_SKILLS_TTL_MS) return quizSkillsCache.skills;
  const activeQuestions = await prisma.question.findMany({
    where: { status: 'ACTIVE' },
    select: { skillName: true },
    distinct: ['skillName']
  });
  quizSkillsCache = { at: Date.now(), skills: new Set(activeQuestions.map(q => q.skillName.toLowerCase())) };
  return quizSkillsCache.skills;
}

// The skill bars of a gig (older gigs only list skill names, all at gig.minRating).
const gigRequirements = (gig) => ((gig.requirements && gig.requirements.length > 0)
  ? gig.requirements
  : (gig.skills || []).map(s => ({ skillName: s, minRating: gig.minRating || 1 })));

// Per-requirement status for a candidate (same shape as jobs' requirementStatuses):
// `hasQuiz: false` / `isTech: false` tells the client the question bank has no
// test for that skill, so it can offer "add without a test" instead of a test.
async function buildGigRequirementStatuses(gig, candidateProfile) {
  const gigReqs = gigRequirements(gig);
  if (gigReqs.length === 0) return [];
  return getRequirementStatuses({ requirements: gigReqs }, buildStudentSkillMap(candidateProfile), await quizSkills());
}

/**
 * The skill bars a candidate is below, by the rule applyToGig enforces: every bar
 * above level 1, against the verified rating (or the rating when there is none).
 * With `statuses` (buildGigRequirementStatuses), each one says whether the question
 * bank has a test that can raise it.
 */
function gigShortfalls(gig, profile, statuses = []) {
  const skills = (profile && profile.skills) || [];
  return gigRequirements(gig)
    .filter(r => r && r.skillName && r.minRating > 1)
    .map(r => {
      const mine = skills.find(s => s && s.name && s.name.toLowerCase() === r.skillName.toLowerCase());
      const currentRating = mine ? (mine.verifiedRating > 0 ? mine.verifiedRating : (mine.rating || 0)) : 0;
      const status = statuses.find(st => String(st.skillName || '').toLowerCase() === r.skillName.toLowerCase());
      return {
        skillName: r.skillName,
        requiredRating: r.minRating,
        currentRating,
        onProfile: Boolean(mine),
        hasTest: Boolean(status && status.isTech !== false && status.hasQuiz !== false)
      };
    })
    .filter(r => r.currentRating < r.requiredRating);
}

// Company fields a candidate sees with a gig: never the verification docs, official
// email, owner id or posting quota (ISSUES G3).
const publicCompany = (company) => (company
  ? { id: company.id, name: company.name, logoUrl: company.logoUrl || null, verified: company.verified === true }
  : null);

// Only the companies that own these gigs (not the whole table; ISSUES G7).
async function companiesFor(gigs) {
  const owners = Array.from(new Set(gigs.map(g => g.ownerId).filter(Boolean)));
  if (owners.length === 0) return [];
  return prisma.company.findMany({ where: { OR: [{ userId: { in: owners } }, { id: { in: owners } }] } });
}
const companyOf = (gig, companies) => companies.find(c => c.userId === gig.ownerId || c.id === gig.ownerId) || null;

// A gig as candidates see it: no applicants, hires, messages or answer keys (ISSUES G1).
const PUBLIC_GIG_FIELDS = ['id', 'title', 'description', 'category', 'categories', 'skills', 'requirements', 'minRating', 'budget', 'currency', 'deliveryTime', 'logo', 'attachments', 'status', 'createdAt'];
function publicGig(gig, company) {
  const out = {};
  PUBLIC_GIG_FIELDS.forEach(key => {
    if (gig[key] !== undefined) out[key] = gig[key];
  });
  return { ...out, screeningQuestions: toCandidateQuestions(gig.screeningQuestions), company: publicCompany(company) };
}

// A candidate's own pitch and work, without the server's MCQ right/wrong mark.
const ownPitch = (applicant) => (applicant
  ? {
      message: applicant.message || '',
      attachments: applicant.attachments || [],
      answers: (Array.isArray(applicant.answers) ? applicant.answers : []).map(({ isCorrect: _mark, ...answer }) => answer),
      createdAt: applicant.createdAt
    }
  : null);
const ownSubmission = (submission) => (submission
  ? { status: submission.status, text: submission.text || '', fileUrl: submission.fileUrl || null, createdAt: submission.createdAt }
  : null);
const newestFirst = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);

// A candidate's User id plus their Profile id (older gig rows used either).
async function studentIdentity(userId) {
  const profile = await prisma.profile.findFirst({ where: { OR: [{ userId }, { id: userId }] } });
  return { profile, ids: Array.from(new Set([userId, profile && profile.id, profile && profile.userId].filter(Boolean))) };
}

// Everyone hired for the gig (older rows keep the first hire in selectedCandidateId).
const hiredIdsOf = (gig) => Array.from(new Set([...(gig.hiredCandidateIds || []), gig.selectedCandidateId].filter(Boolean)));

// The ids a user can appear under on gig rows: their User id, plus their Profile id
// (students) or Company id (recruiters) for rows written before ids were unified.
async function identityIds(user) {
  const ids = [user.id];
  if (user.role === 'STUDENT') {
    const profile = await prisma.profile.findFirst({ where: { OR: [{ userId: user.id }, { id: user.id }] } });
    if (profile) ids.push(profile.id, profile.userId);
  } else if (user.role === 'RECRUITER') {
    const company = await prisma.company.findFirst({ where: { OR: [{ userId: user.id }, { id: user.id }] } });
    if (company) ids.push(company.id, company.userId);
  }
  return Array.from(new Set(ids.filter(Boolean)));
}

/**
 * Who may use a gig's chat. The owner talks privately with each hired freelancer
 * (messages carry senderId/receiverId); a hired freelancer sees only their own
 * conversation with the owner. Everyone else has no access.
 */
function chatRole(gig, ids) {
  if (ids.includes(gig.ownerId)) return { role: 'owner' };
  const hiredAs = hiredIdsOf(gig).filter(id => ids.includes(id));
  return hiredAs.length > 0 ? { role: 'freelancer', hiredAs } : null;
}

const byCreatedAt = (a, b) => new Date(a.createdAt) - new Date(b.createdAt) || String(a.id).localeCompare(String(b.id));

// GET /gigs/:gigId/messages?with=&after=&before=&limit=
// Only the messages the caller may see, newest page first load, then incremental:
//   after  = ISO time of the newest message the client has (inclusive; the client
//            de-duplicates by id, so messages written in the same millisecond aren't lost)
//   before = ISO time of the oldest message the client has (older history; inclusive too)
//   with   = (owner only) the hired freelancer whose conversation to load
exports.getMessages = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { with: partnerId, after, before } = req.query;
    const limit = req.query.limit || 50;

    const gig = await prisma.gig.findUnique({ where: { id: gigId } });
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    const ids = await identityIds(req.user);
    const access = chatRole(gig, ids);
    if (!access) {
      return res.status(403).json({ error: 'Messages unlock once you are hired for this gig' });
    }

    let party = null; // ids whose messages (sent or received) are in the conversation
    if (access.role === 'owner') {
      if (partnerId) {
        if (!hiredIdsOf(gig).includes(partnerId)) {
          return res.status(400).json({ error: 'You can only chat with freelancers you have hired for this gig' });
        }
        party = [partnerId];
      }
    } else {
      party = ids;
    }

    const where = {
      gigId,
      ...(party ? { OR: [{ senderId: { in: party } }, { receiverId: { in: party } }] } : {})
    };

    let messages;
    let hasMore = false;
    if (after) {
      messages = await prisma.gigMessage.findMany({
        where: { ...where, createdAt: { gte: new Date(after) } },
        orderBy: { createdAt: 'asc' },
        take: 200
      });
      hasMore = messages.length === 200;
    } else {
      const page = await prisma.gigMessage.findMany({
        where: before ? { ...where, createdAt: { lte: new Date(before) } } : where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1
      });
      hasMore = page.length > limit;
      messages = page.slice(0, limit).reverse();
    }

    res.status(200).json({ messages: messages.sort(byCreatedAt), hasMore, serverTime: new Date().toISOString() });
  } catch (err) {
    console.error('Error fetching gig messages:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
};

/**
 * GET /gigs: the open gigs. Candidates get each gig as public data plus their own
 * standing: how many pitches it has, whether they pitched, and the skill bars they
 * are below (`missingRequirements`, the rule applyToGig enforces). Search, filters
 * and sorting happen in the browser on this list. Recruiters get their own open gigs.
 */
exports.getGigs = async (req, res) => {
  try {
    if (req.user.role === 'RECRUITER') {
      const ownerIds = await identityIds(req.user);
      const gigs = await prisma.gig.findMany({ where: { status: 'OPEN', ownerId: { in: ownerIds } } });
      const companies = await companiesFor(gigs);
      return res.status(200).json(gigs.map(g => ({ ...g, company: companyOf(g, companies) })).sort(newestFirst));
    }

    const { profile, ids } = await studentIdentity(req.user.id);
    const gigs = await prisma.gig.findMany({
      where: { status: 'OPEN' },
      include: { applicants: { select: { candidateId: true } } }
    });
    const companies = await companiesFor(gigs);
    const list = await Promise.all(gigs.map(async gig => {
      const applicants = gig.applicants || [];
      const statuses = await buildGigRequirementStatuses(gig, profile);
      return {
        ...publicGig(gig, companyOf(gig, companies)),
        pitchCount: applicants.length,
        hasApplied: applicants.some(a => ids.includes(a.candidateId)),
        missingRequirements: gigShortfalls(gig, profile, statuses)
      };
    }));
    res.status(200).json(list.sort(newestFirst));
  } catch (err) {
    console.error('Error fetching gigs:', err);
    res.status(500).json({ error: 'Failed to fetch gigs from marketplace' });
  }
};

// Create a new Gig
exports.createGig = async (req, res) => {
  try {
    if (req.user.role !== 'RECRUITER') {
      return res.status(403).json({ error: 'Only recruiters can create gigs' });
    }
    const { title, description, category, categories, skills, requirements, screeningQuestions, budget, currency, deliveryTime, minRating, attachments, logo } = req.body;
    const parsedMinRating = minRating !== undefined ? (parseInt(minRating, 10) || 1) : 1;
    
    // Normalize requirements array if provided, else build from skills
    let reqs = requirements;
    if (!reqs || !Array.isArray(reqs) || reqs.length === 0) {
      reqs = (skills || []).map(s => ({ skillName: s, minRating: parsedMinRating }));
    }

    const calculatedMinRating = reqs.length > 0 ? Math.max(...reqs.map(r => r.minRating || 1)) : parsedMinRating;

    // Normalize category & categories
    let finalCategories = Array.isArray(categories) ? categories.filter(Boolean) : [];
    const mainCategory = (category && typeof category === 'string' && category.trim()) 
      ? category.trim() 
      : (finalCategories.length > 0 ? finalCategories[0] : 'General');
    if (mainCategory && !finalCategories.includes(mainCategory)) {
      finalCategories.unshift(mainCategory);
    }

    // Create new gig model
    const gig = await prisma.gig.create({
      data: {
        title,
        description,
        category: mainCategory,
        categories: finalCategories,
        skills: reqs.map(r => r.skillName),
        requirements: reqs.map(r => ({
          skillName: r.skillName,
          minRating: parseInt(r.minRating, 10) || 1
        })),
        screeningQuestions: Array.isArray(screeningQuestions) && screeningQuestions.length > 0
          ? screeningQuestions.map(q => ({
            id: q.id || require('crypto').randomUUID(),
            type: q.type || 'MCQ',
            question: q.question,
            options: Array.isArray(q.options) ? q.options : [],
            correctAnswer: q.type === 'MCQ' ? (q.correctAnswer || null) : null,
            required: q.required !== undefined ? Boolean(q.required) : true
          }))
          : undefined,
        budget: parseFloat(budget),
        currency: currency ? currency.toUpperCase() : 'INR',
        deliveryTime,
        minRating: calculatedMinRating,
        logo: logo || null,
        attachments: attachments || [],
        ownerId: req.user.id,
        status: "OPEN"
      }
    });
    
    res.status(201).json(gig);
  } catch (err) {
    console.error('Error creating gig:', err);
    res.status(500).json({ error: 'Failed to create gig' });
  }
};

// Get current user's gigs (both owned and hired)
/**
 * GET /gigs/my-gigs. Recruiters: the gigs they own, with applicants. Candidates: the
 * gigs they pitched for or were hired on, with only their own pitch and submission
 * (never other candidates' pitches; ISSUES G2) and how many pitches the gig has.
 */
exports.getMyGigs = async (req, res) => {
  try {
    if (req.user.role === 'RECRUITER') {
      const ownerIds = await identityIds(req.user);
      const gigs = await prisma.gig.findMany({
        where: { OR: [{ ownerId: { in: ownerIds } }] },
        include: { applicants: true },
        orderBy: { createdAt: 'desc' }
      });
      const companies = await companiesFor(gigs);
      return res.status(200).json(gigs.map(g => ({ ...g, company: companyOf(g, companies) })));
    }

    const { ids } = await studentIdentity(req.user.id);
    const gigs = await prisma.gig.findMany({
      where: {
        OR: [
          { selectedCandidateId: { in: ids } },
          { hiredCandidateIds: { hasSome: ids } },
          { applicants: { some: { candidateId: { in: ids } } } }
        ]
      },
      include: { applicants: true },
      orderBy: { createdAt: 'desc' }
    });
    const gigIds = gigs.map(g => g.id);
    const [companies, submissions] = await Promise.all([
      companiesFor(gigs),
      gigIds.length ? prisma.gigSubmission.findMany({ where: { gigId: { in: gigIds }, candidateId: { in: ids } } }) : []
    ]);

    res.status(200).json(gigs.map(gig => {
      const applicants = gig.applicants || [];
      const mine = applicants.find(a => ids.includes(a.candidateId));
      const submission = submissions.filter(sub => sub.gigId === gig.id).sort(newestFirst)[0];
      return {
        ...publicGig(gig, companyOf(gig, companies)),
        pitchCount: applicants.length,
        hasApplied: Boolean(mine),
        isHired: hiredIdsOf(gig).some(id => ids.includes(id)),
        myPitch: ownPitch(mine),
        mySubmission: ownSubmission(submission)
      };
    }).sort(newestFirst));
  } catch (err) {
    console.error('Error fetching user gigs:', err);
    res.status(500).json({ error: 'Failed to fetch your gigs list' });
  }
};

// Get detailed view of a gig (for owner / selected candidate / applicants)
exports.getGigDetails = async (req, res) => {
  try {
    const { gigId } = req.params;

    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      include: {
        applicants: true,
        submissions: true,
        reviews: true
      }
    });

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    const ids = await identityIds(req.user);
    const allHiredIds = hiredIdsOf(gig);
    const isOwner = ids.includes(gig.ownerId);

    if (req.user.role === 'RECRUITER' && !isOwner) {
      return res.status(403).json({ error: 'You do not have permission to view this gig' });
    }

    const company = await prisma.company.findFirst({
      where: { OR: [{ userId: gig.ownerId }, { id: gig.ownerId }] }
    });

    // Candidates: the public gig and their own standing. Chat comes from
    // GET /gigs/:id/messages, so this (polled) read never loads the conversation.
    if (!isOwner) {
      const { profile } = await studentIdentity(req.user.id);
      const mine = (gig.applicants || []).find(a => ids.includes(a.candidateId));
      const submission = (gig.submissions || []).filter(sub => ids.includes(sub.candidateId)).sort(newestFirst)[0];
      const statuses = await buildGigRequirementStatuses(gig, profile);
      return res.status(200).json({
        ...publicGig(gig, company),
        pitchCount: (gig.applicants || []).length,
        hasApplied: Boolean(mine),
        isHired: allHiredIds.some(id => ids.includes(id)),
        myPitch: ownPitch(mine),
        mySubmission: ownSubmission(submission),
        myReview: (gig.reviews || []).find(r => ids.includes(r.reviewerId)) || null,
        requirementStatuses: statuses,
        missingRequirements: gigShortfalls(gig, profile, statuses)
      });
    }

    const messages = await prisma.gigMessage.findMany({ where: { gigId } });
    const candidateUserIds = Array.from(new Set([...allHiredIds, ...(gig.applicants || []).map(a => a.candidateId).filter(Boolean)]));
    const candidateProfiles = candidateUserIds.length > 0
      ? await prisma.profile.findMany({
          where: {
            OR: [
              { userId: { in: candidateUserIds } },
              { id: { in: candidateUserIds } }
            ]
          },
          select: { id: true, userId: true, name: true, username: true, profilePic: true, bio: true }
        })
      : [];

    const enrichedHired = allHiredIds.map(hId => {
      const p = candidateProfiles.find(cp => cp.userId === hId || cp.id === hId);
      return {
        candidateId: hId,
        candidate: p
          ? { id: hId, name: p.name, username: p.username, avatar: p.profilePic, bio: p.bio }
          : { id: hId, name: 'Hired Candidate' }
      };
    });

    const enrichedApplicants = (gig.applicants || []).map(a => {
      const p = candidateProfiles.find(cp => cp.userId === a.candidateId || cp.id === a.candidateId);
      return {
        ...a,
        isHired: allHiredIds.includes(a.candidateId),
        candidate: p
          ? { id: a.candidateId, name: p.name, username: p.username, avatar: p.profilePic, bio: p.bio }
          : { id: a.candidateId, name: 'Candidate' }
      };
    });

    res.status(200).json({
      ...gig,
      messages,
      hiredCandidateIds: allHiredIds,
      hiredCandidates: enrichedHired,
      applicants: enrichedApplicants,
      company
    });
  } catch (err) {
    console.error('Error fetching gig details:', err);
    res.status(500).json({ error: 'Failed to fetch gig details' });
  }
};

// Pitches being saved right now (gig:candidate). A second request for the same pair
// (a double click, a retry while the first is in flight) is refused instead of
// creating a duplicate pitch (ISSUES G8).
const pitchesInFlight = new Set();

// Apply to a Gig
exports.applyToGig = async (req, res) => {
  const { gigId } = req.params;
  const candidateId = req.user.id;
  const lockKey = `${gigId}:${candidateId}`;
  if (req.user.role !== 'STUDENT') {
    return res.status(403).json({ error: 'Only candidates can apply to gigs' });
  }
  if (pitchesInFlight.has(lockKey)) {
    return res.status(409).json({ error: 'Your pitch is already being sent' });
  }
  pitchesInFlight.add(lockKey);
  try {
    const { message, attachments, answers } = req.body;

    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      include: { applicants: true }
    });

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    if (gig.status === 'CLOSED' || gig.status === 'COMPLETED') {
      return res.status(400).json({ error: 'This gig is closed for applications' });
    }

    if (gig.status === 'PAUSED') {
      return res.status(400).json({ error: 'This gig is currently paused for applications' });
    }

    if (gig.ownerId === candidateId) {
      return res.status(400).json({ error: 'You cannot apply to your own gig' });
    }

    const { ids } = await studentIdentity(candidateId);
    if (gig.applicants.some(a => ids.includes(a.candidateId))) {
      return res.status(400).json({ error: 'You have already applied to this gig' });
    }

    const candidateProfile = await prisma.profile.findUnique({
      where: { userId: candidateId }
    });

    if (!candidateProfile) {
      return res.status(400).json({ error: 'Candidate profile not found' });
    }

    const isGeneralComplete = Boolean(
      candidateProfile.name && candidateProfile.name.trim() &&
      candidateProfile.username && candidateProfile.username.trim() &&
      candidateProfile.bio && candidateProfile.bio.trim() &&
      candidateProfile.gender && candidateProfile.gender.trim() &&
      candidateProfile.email && candidateProfile.email.trim() &&
      candidateProfile.dob && candidateProfile.dob.trim() &&
      candidateProfile.phone && candidateProfile.phone.trim()
    );

    if (!isGeneralComplete) {
      return res.status(400).json({ error: 'Please complete all required fields in your profile General tab before applying to gigs.' });
    }

    if (!candidateProfile.introVideoUrl || !candidateProfile.introVideoUrl.trim()) {
      return res.status(400).json({ error: 'Please upload an introduction video in your profile before applying to gigs.' });
    }

    // Per-skill minimum ratings (the same rule GET /gigs uses for missingRequirements).
    const [short] = gigShortfalls(gig, candidateProfile);
    if (short) {
      return res.status(400).json({
        error: `Your ${short.skillName} score is ${short.currentRating}; this gig needs ${short.requiredRating}. Raise it to pitch.`
      });
    }

    // Process & validate Screening Questions
    let evaluatedAnswers = [];
    if (gig.screeningQuestions && Array.isArray(gig.screeningQuestions) && gig.screeningQuestions.length > 0) {
      const incomingAnswers = Array.isArray(answers) ? answers : [];

      for (const sq of gig.screeningQuestions) {
        const userAns = incomingAnswers.find(a => 
          (a.questionId && a.questionId === sq.id) || 
          (a.questionText && a.questionText.trim().toLowerCase() === sq.question.trim().toLowerCase())
        );
        const answerText = userAns ? String(userAns.answer || '').trim() : '';

        if (sq.required && !answerText) {
          return res.status(400).json({
            error: `Please answer the required screening question: "${sq.question}"`
          });
        }

        let isCorrect = null;
        if (sq.type === 'MCQ' && sq.correctAnswer) {
          isCorrect = answerText.toLowerCase() === sq.correctAnswer.trim().toLowerCase();
        }

        if (answerText) {
          evaluatedAnswers.push({
            questionId: sq.id || null,
            questionText: sq.question,
            type: sq.type || 'LONG_ANSWER',
            answer: answerText,
            isCorrect
          });
        }
      }
    }

    const applicant = await prisma.gigApplicant.create({
      data: {
        gigId,
        candidateId,
        message,
        attachments: attachments || [],
        answers: evaluatedAnswers.length > 0 ? evaluatedAnswers : undefined
      }
    });
    
    res.status(201).json(ownPitch(applicant));
  } catch (err) {
    console.error('Error applying to gig:', err);
    res.status(500).json({ error: 'Failed to submit application to gig' });
  } finally {
    pitchesInFlight.delete(lockKey);
  }
};

// Hire a candidate for a Gig
exports.hireCandidate = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { candidateId } = req.body;
    const userId = req.user.id;
    
    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      include: { applicants: true }
    });

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    if (gig.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the gig owner can hire candidates' });
    }

    if (gig.status === 'CLOSED' || gig.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot hire candidate for a closed gig' });
    }

    if (!(gig.applicants || []).some(a => a.candidateId === candidateId)) {
      return res.status(400).json({ error: 'This person has not pitched for the gig' });
    }

    if (hiredIdsOf(gig).includes(candidateId)) {
      return res.status(400).json({ error: 'This freelancer is already hired for the gig' });
    }

    const currentHired = Array.isArray(gig.hiredCandidateIds) ? [...gig.hiredCandidateIds] : [];
    if (gig.selectedCandidateId && !currentHired.includes(gig.selectedCandidateId)) {
      currentHired.push(gig.selectedCandidateId);
    }
    if (candidateId && !currentHired.includes(candidateId)) {
      currentHired.push(candidateId);
    }

    const updatedGig = await prisma.gig.update({
      where: { id: gigId },
      data: {
        status: gig.status === 'CLOSED' ? 'CLOSED' : 'IN_PROGRESS',
        selectedCandidateId: candidateId,
        hiredCandidateIds: currentHired
      }
    });
    
    // Seed initial message in the private channel
    await prisma.gigMessage.create({
      data: {
        gigId,
        senderId: userId,
        receiverId: candidateId,
        text: `Hello! I have selected you for this gig. Let's work together to complete the tasks!`
      }
    });
    
    res.status(200).json(updatedGig);
  } catch (err) {
    console.error('Error hiring candidate:', err);
    res.status(500).json({ error: 'Failed to hire candidate' });
  }
};

// Reject a candidate application for a Gig
exports.rejectCandidate = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { candidateId } = req.body;
    const userId = req.user.id;
    
    const gig = await prisma.gig.findUnique({
      where: { id: gigId }
    });
    
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }
    
    if (gig.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the gig owner can reject candidates' });
    }

    if (hiredIdsOf(gig).includes(candidateId)) {
      return res.status(400).json({ error: 'This freelancer is already hired, so their pitch can’t be passed on' });
    }

    await prisma.gigApplicant.deleteMany({
      where: {
        gigId,
        candidateId
      }
    });

    res.status(200).json({ message: 'Candidate application rejected successfully' });
  } catch (err) {
    console.error('Error rejecting candidate:', err);
    res.status(500).json({ error: 'Failed to reject candidate' });
  }
};

// Send a message in a private conversation. One insert, no waiting: the owner
// writes to a hired freelancer (receiverId, or the only one hired), a freelancer
// always writes to the owner. (The old version paused 0.8 s and wrote a "typing"
// flag on the gig row around every message, which serialised busy chats.)
exports.sendMessage = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { fileUrl, receiverId } = req.body;
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    const senderId = req.user.id;

    if (!text && !fileUrl) {
      return res.status(400).json({ error: 'Write a message or attach a file' });
    }

    const gig = await prisma.gig.findUnique({ where: { id: gigId } });
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    const ids = await identityIds(req.user);
    const access = chatRole(gig, ids);
    if (!access) {
      return res.status(403).json({ error: 'Direct messaging unlocks once you are hired for this gig' });
    }

    let targetReceiverId;
    if (access.role === 'owner') {
      const hired = hiredIdsOf(gig);
      targetReceiverId = receiverId || (hired.length === 1 ? hired[0] : null);
      if (!targetReceiverId) {
        return res.status(400).json({ error: hired.length ? 'Choose which freelancer to message' : 'Hire a freelancer before sending messages' });
      }
      if (!hired.includes(targetReceiverId)) {
        return res.status(400).json({ error: 'You can only message freelancers you have hired for this gig' });
      }
    } else {
      targetReceiverId = gig.ownerId;
    }

    const message = await prisma.gigMessage.create({
      data: {
        gigId,
        senderId,
        receiverId: targetReceiverId,
        text: text || null,
        fileUrl: fileUrl || null
      }
    });

    res.status(201).json(message);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Submit work deliverables
exports.submitWork = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { text, fileUrl } = req.body;
    const userId = req.user.id;
    
    const gig = await prisma.gig.findUnique({
      where: { id: gigId }
    });
    
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    const candidateIds = [userId];
    const userProfile = await prisma.profile.findFirst({
      where: { OR: [{ userId }, { id: userId }] }
    });
    if (userProfile) {
      if (userProfile.id) candidateIds.push(userProfile.id);
      if (userProfile.userId) candidateIds.push(userProfile.userId);
    }
    
    const allHired = Array.from(new Set([...(gig.hiredCandidateIds || []), gig.selectedCandidateId].filter(Boolean)));
    const isHiredCandidate = candidateIds.some(cId => allHired.includes(cId));
    if (!isHiredCandidate) {
      return res.status(403).json({ error: 'Only a hired freelancer can submit work' });
    }
    
    if (gig.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Work can only be submitted for active gigs' });
    }
    
    // Check if submission already exists for this candidate
    const existingSubmission = await prisma.gigSubmission.findFirst({
      where: {
        gigId,
        candidateId: { in: candidateIds }
      }
    });
    
    let submission;
    if (existingSubmission) {
      submission = await prisma.gigSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          text,
          fileUrl,
          status: "PENDING",
          createdAt: new Date()
        }
      });
    } else {
      submission = await prisma.gigSubmission.create({
        data: {
          gigId,
          candidateId: userId,
          text,
          fileUrl,
          status: "PENDING"
        }
      });
    }
    
    // Post notification to channel
    await prisma.gigMessage.create({
      data: {
        gigId,
        senderId: userId,
        receiverId: gig.ownerId,
        text: `I have submitted the final work deliverables for your review. Description: ${text || 'No description provided.'}`
      }
    });
    
    res.status(200).json(submission);
  } catch (err) {
    console.error('Error submitting work:', err);
    res.status(500).json({ error: 'Failed to submit deliverables' });
  }
};

// Accept submission or request revisions
exports.completeGig = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { action, candidateId } = req.body; // "ACCEPT" or "REVISION"
    const userId = req.user.id;
    
    const gig = await prisma.gig.findUnique({
      where: { id: gigId }
    });
    
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    const ownerIds = [userId];
    const userProfile = await prisma.profile.findFirst({
      where: { OR: [{ userId }, { id: userId }] }
    });
    if (userProfile) {
      if (userProfile.id) ownerIds.push(userProfile.id);
      if (userProfile.userId) ownerIds.push(userProfile.userId);
    }
    
    if (!ownerIds.includes(gig.ownerId)) {
      return res.status(403).json({ error: 'Only the gig owner can complete the gig or request revisions' });
    }
    
    let submission;
    if (candidateId) {
      submission = await prisma.gigSubmission.findFirst({
        where: { gigId, candidateId }
      });
    } else {
      submission = await prisma.gigSubmission.findFirst({
        where: { gigId }
      });
    }
    
    if (!submission) {
      return res.status(400).json({ error: 'No deliverables have been submitted yet' });
    }
    
    if (action === 'ACCEPT') {
      await prisma.gigSubmission.update({
        where: { id: submission.id },
        data: { status: "ACCEPTED" }
      });

      await prisma.gigMessage.create({
        data: {
          gigId,
          senderId: userId,
          receiverId: submission.candidateId,
          text: `The deliverables have been reviewed and accepted! Thank you for your work.`
        }
      });

      // The gig is complete once every hired freelancer's work is accepted. Nothing
      // set COMPLETED before, so the review step (which needs it) could never run.
      const hired = hiredIdsOf(gig);
      const submissions = await prisma.gigSubmission.findMany({ where: { gigId } });
      const accepted = new Set(submissions.filter(s => s.status === 'ACCEPTED').map(s => s.candidateId));
      if (hired.length > 0 && hired.every(id => accepted.has(id))) {
        await prisma.gig.update({ where: { id: gigId }, data: { status: 'COMPLETED' } });
      }
    } else {
      await prisma.gigSubmission.update({
        where: { id: submission.id },
        data: { status: "REJECTED" }
      });
      
      await prisma.gigMessage.create({
        data: {
          gigId,
          senderId: userId,
          receiverId: submission.candidateId,
          text: `Revisions requested on the submitted work. Please check requirements and update your submission.`
        }
      });
    }
    
    res.status(200).json({ message: 'Success' });
  } catch (err) {
    console.error('Error finalizing gig:', err);
    res.status(500).json({ error: 'Failed to update gig completion status' });
  }
};

// Leave review and ratings
exports.reviewGig = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { rating, review } = req.body;
    const reviewerId = req.user.id;
    
    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      include: { reviews: true }
    });
    
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }
    
    if (gig.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Reviews can only be left for completed gigs' });
    }
    
    // The owner reviews the freelancer; any freelancer hired on the gig (not only the
    // last one) reviews the owner.
    const ids = await identityIds(req.user);
    const isOwner = ids.includes(gig.ownerId);
    if (!isOwner && !hiredIdsOf(gig).some(id => ids.includes(id))) {
      return res.status(403).json({ error: 'You are not a participant in this gig' });
    }

    const revieweeId = isOwner ? gig.selectedCandidateId : gig.ownerId;

    const alreadyReviewed = gig.reviews.some(r => ids.includes(r.reviewerId));
    if (alreadyReviewed) {
      return res.status(400).json({ error: 'You have already reviewed this gig' });
    }
    
    const gigReview = await prisma.gigReview.create({
      data: {
        gigId,
        reviewerId,
        revieweeId,
        rating,
        review
      }
    });
    
    // IF the reviewer is the client (owner), add the completed gig to the candidate's profile as verified work experience!
    if (isOwner) {
      const candidateProfile = await prisma.profile.findUnique({
        where: { userId: gig.selectedCandidateId }
      });
      
      if (candidateProfile) {
        // Build new experience item
        const newExperienceItem = {
          expType: "Gig",
          designation: "Independent Contractor / Freelancer",
          involvesTech: true,
          companyName: `Gig: ${gig.title}`,
          domain: gig.skills[0] || "Software Engineering",
          startDate: new Date(gig.createdAt).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          currentlyWorking: false,
          location: "Remote",
          description: `Deliverables: ${gig.description.substring(0, 150)}...\nClient Review: "${review}" (Rating: ${rating}/5)`
        };
        
        const currentExperience = candidateProfile.experience || [];
        const updatedExperience = [...currentExperience, newExperienceItem];
        
        await prisma.profile.update({
          where: { id: candidateProfile.id },
          data: { experience: updatedExperience }
        });
      }
    }
    
    res.status(201).json(gigReview);
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
};

// Update an existing Gig (Recruiter owner only)
exports.updateGig = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { title, description, category, categories, skills, requirements, screeningQuestions, budget, currency, deliveryTime, minRating, attachments, logo } = req.body;
    const userId = req.user.id;

    if (req.user.role !== 'RECRUITER') {
      return res.status(403).json({ error: 'Only recruiters can update gigs' });
    }

    const gig = await prisma.gig.findUnique({ where: { id: gigId } });
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    if (gig.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the gig owner can edit this gig' });
    }

    if (gig.status !== 'OPEN' && gig.status !== 'PAUSED') {
      return res.status(400).json({ error: 'You can only edit gigs that are open or paused' });
    }

    let updatedData = {
      // Title and Category of Field are immutable after publication
      title: gig.title,
      category: gig.category,
      categories: gig.categories,
      description: description !== undefined ? description : gig.description,
      budget: budget !== undefined ? budget : gig.budget,
      deliveryTime: deliveryTime !== undefined ? deliveryTime : gig.deliveryTime,
      attachments: attachments !== undefined ? attachments : gig.attachments
    };

    if (currency !== undefined) {
      updatedData.currency = currency.toUpperCase();
    }

    if (logo !== undefined) {
      updatedData.logo = logo;
    }

    if (screeningQuestions !== undefined) {
      updatedData.screeningQuestions = (Array.isArray(screeningQuestions) ? screeningQuestions : []).map(q => ({
        id: q.id || require('crypto').randomUUID(),
        type: q.type || 'MCQ',
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswer: q.type === 'MCQ' ? (q.correctAnswer || null) : null,
        required: q.required !== undefined ? Boolean(q.required) : true
      }));
    }

    if (requirements && Array.isArray(requirements) && requirements.length > 0) {
      const cleanReqs = requirements.map(r => ({
        skillName: r.skillName,
        minRating: parseInt(r.minRating, 10) || 1
      }));
      updatedData.requirements = cleanReqs;
      updatedData.skills = cleanReqs.map(r => r.skillName);
      updatedData.minRating = Math.max(...cleanReqs.map(r => r.minRating || 1));
    } else if (skills !== undefined) {
      updatedData.skills = skills;
    }

    if (minRating !== undefined && (!requirements || requirements.length === 0)) {
      updatedData.minRating = parseInt(minRating, 10) || 1;
    }

    const updatedGig = await prisma.gig.update({
      where: { id: gigId },
      data: updatedData
    });

    res.status(200).json(updatedGig);
  } catch (err) {
    console.error('Error updating gig:', err);
    res.status(500).json({ error: 'Failed to update gig' });
  }
};

// Pause or Resume a Gig (Recruiter owner only)
exports.updateGigStatus = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { status } = req.body; // "OPEN" or "PAUSED"
    const userId = req.user.id;

    if (req.user.role !== 'RECRUITER') {
      return res.status(403).json({ error: 'Only recruiters can change gig status' });
    }

    const gig = await prisma.gig.findUnique({ where: { id: gigId } });
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    if (gig.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the gig owner can update its status' });
    }

    const validStatuses = ['OPEN', 'PAUSED', 'CLOSED', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updatedGig = await prisma.gig.update({
      where: { id: gigId },
      data: { status }
    });

    res.status(200).json(updatedGig);
  } catch (err) {
    console.error('Error toggling gig status:', err);
    res.status(500).json({ error: 'Failed to toggle gig status' });
  }
};

// Delete a Gig (Recruiter owner only)
exports.deleteGig = async (req, res) => {
  try {
    const { gigId } = req.params;
    const userId = req.user.id;

    if (req.user.role !== 'RECRUITER') {
      return res.status(403).json({ error: 'Only recruiters can delete gigs' });
    }

    const gig = await prisma.gig.findUnique({ where: { id: gigId } });
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    if (gig.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the gig owner can delete this gig' });
    }

    if (gig.status !== 'OPEN' && gig.status !== 'PAUSED') {
      return res.status(400).json({ error: 'You cannot delete a gig that is in progress or completed' });
    }

    await prisma.gig.delete({ where: { id: gigId } });

    res.status(200).json({ message: 'Gig deleted successfully' });
  } catch (err) {
    console.error('Error deleting gig:', err);
    res.status(500).json({ error: 'Failed to delete gig' });
  }
};
