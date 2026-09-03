const { prisma } = require('../config/db');

// Get all open gigs in the marketplace
exports.getGigs = async (req, res) => {
  try {
    const { q, skills, category } = req.query;
    
    let whereClause = { status: "OPEN" };
    
    const gigs = await prisma.gig.findMany({
      where: whereClause
    });
    
    // Perform manual filters if needed to support both MongoDB & Mock client seamlessly
    let filteredGigs = gigs;
    
    if (q) {
      const search = q.toLowerCase();
      filteredGigs = filteredGigs.filter(g => 
        (g.title && g.title.toLowerCase().includes(search)) || 
        (g.description && g.description.toLowerCase().includes(search)) ||
        (g.category && g.category.toLowerCase().includes(search)) ||
        (g.categories && g.categories.some(c => c.toLowerCase().includes(search))) ||
        (g.skills && g.skills.some(s => s.toLowerCase().includes(search)))
      );
    }

    if (category) {
      const catSearch = category.toLowerCase();
      filteredGigs = filteredGigs.filter(g =>
        (g.category && g.category.toLowerCase().includes(catSearch)) ||
        (g.categories && g.categories.some(c => c.toLowerCase().includes(catSearch)))
      );
    }
    
    if (skills) {
      const skillFilter = Array.isArray(skills) 
        ? skills.map(s => s.toLowerCase()) 
        : skills.split(',').map(s => s.trim().toLowerCase());
        
      filteredGigs = filteredGigs.filter(g => 
        g.skills.some(skill => skillFilter.includes(skill.toLowerCase()))
      );
    }

    const companies = await prisma.company.findMany();
    const gigsWithCompany = filteredGigs.map(g => {
      const company = companies.find(c => c.userId === g.ownerId || c.id === g.ownerId) || null;
      return { ...g, company };
    });
    res.status(200).json(gigsWithCompany);
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
    const { title, description, category, categories, skills, requirements, budget, deliveryTime, minRating, attachments } = req.body;
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
        requirements: {
          set: reqs.map(r => ({
            skillName: r.skillName,
            minRating: parseInt(r.minRating, 10) || 1
          }))
        },
        budget: parseFloat(budget),
        deliveryTime,
        minRating: calculatedMinRating,
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
exports.getMyGigs = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await prisma.profile.findFirst({
      where: { OR: [{ userId }, { id: userId }] }
    });

    const candidateIds = [userId];
    if (profile) {
      if (profile.id) candidateIds.push(profile.id);
      if (profile.userId) candidateIds.push(profile.userId);
    }

    const gigs = await prisma.gig.findMany({
      where: {
        OR: [
          { ownerId: { in: candidateIds } },
          { selectedCandidateId: { in: candidateIds } },
          { hiredCandidateIds: { hasSome: candidateIds } },
          { applicants: { some: { candidateId: { in: candidateIds } } } }
        ]
      },
      include: {
        applicants: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const companies = await prisma.company.findMany();
    const gigsWithCompany = gigs.map(g => {
      const company = companies.find(c => c.userId === g.ownerId || c.id === g.ownerId) || null;
      const hasApplied = (g.applicants || []).some(a => candidateIds.includes(a.candidateId?.toString()));
      return { ...g, company, hasApplied };
    });
    res.status(200).json(gigsWithCompany);
  } catch (err) {
    console.error('Error fetching user gigs:', err);
    res.status(500).json({ error: 'Failed to fetch your gigs list' });
  }
};

// Get detailed view of a gig (for owner / selected candidate / applicants)
exports.getGigDetails = async (req, res) => {
  try {
    const { gigId } = req.params;
    const userId = req.user.id;

    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      include: {
        applicants: true,
        messages: true,
        submissions: true,
        reviews: true
      }
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

    const allHiredIds = Array.from(new Set([...(gig.hiredCandidateIds || []), gig.selectedCandidateId].filter(Boolean)));

    // Check access permission
    const isOwner = candidateIds.includes(gig.ownerId);
    const isCandidate = candidateIds.some(cId => allHiredIds.includes(cId));
    const isApplicant = gig.applicants.some(a => candidateIds.includes(a.candidateId));

    if (!isOwner && !isCandidate && !isApplicant && req.user.role !== 'RECRUITER') {
      // Allow general browsing of details but mask sensitive sections like applications/messages
      const company = await prisma.company.findFirst({
        where: { OR: [{ userId: gig.ownerId }, { id: gig.ownerId }] }
      });
      return res.status(200).json({
        id: gig.id,
        title: gig.title,
        description: gig.description,
        category: gig.category,
        categories: gig.categories,
        skills: gig.skills,
        requirements: gig.requirements,
        minRating: gig.minRating,
        attachments: gig.attachments,
        budget: gig.budget,
        deliveryTime: gig.deliveryTime,
        status: gig.status,
        createdAt: gig.createdAt,
        ownerId: gig.ownerId,
        ownerName: gig.ownerName,
        ownerRole: gig.ownerRole,
        company,
        hasApplied: isApplicant
      });
    }

    const company = await prisma.company.findFirst({
      where: { OR: [{ userId: gig.ownerId }, { id: gig.ownerId }] }
    });

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
      hiredCandidateIds: allHiredIds,
      hiredCandidates: enrichedHired,
      applicants: enrichedApplicants,
      company,
      hasApplied: isApplicant
    });
  } catch (err) {
    console.error('Error fetching gig details:', err);
    res.status(500).json({ error: 'Failed to fetch gig details' });
  }
};

// Apply to a Gig
exports.applyToGig = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { message, attachments } = req.body;
    const candidateId = req.user.id;

    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only candidates can apply to gigs' });
    }

    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      include: { applicants: true }
    });

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    if (gig.status === 'CLOSED') {
      return res.status(400).json({ error: 'This gig is closed for applications' });
    }

    if (gig.status === 'PAUSED') {
      return res.status(400).json({ error: 'This gig is currently paused for applications' });
    }

    if (gig.ownerId === candidateId) {
      return res.status(400).json({ error: 'You cannot apply to your own gig' });
    }

    const alreadyApplied = gig.applicants.some(a => a.candidateId === candidateId);
    if (alreadyApplied) {
      return res.status(400).json({ error: 'You have already applied to this gig' });
    }

    // Check per-skill minimum rating requirements
    const gigReqs = (gig.requirements && gig.requirements.length > 0)
      ? gig.requirements
      : (gig.skills || []).map(s => ({ skillName: s, minRating: gig.minRating || 1 }));

    const activeReqs = gigReqs.filter(r => r.minRating && r.minRating > 1);

    if (activeReqs.length > 0) {
      const candidateProfile = await prisma.profile.findUnique({
        where: { userId: candidateId }
      });

      if (!candidateProfile) {
        return res.status(400).json({ error: 'Candidate profile not found' });
      }

      const candidateSkills = candidateProfile.skills || [];

      for (const reqSkill of activeReqs) {
        const matchingUserSkill = candidateSkills.find(
          s => s.name.toLowerCase() === reqSkill.skillName.toLowerCase()
        );

        const currentRating = matchingUserSkill
          ? ((matchingUserSkill.verifiedRating && matchingUserSkill.verifiedRating > 0) ? matchingUserSkill.verifiedRating : (matchingUserSkill.rating || 0))
          : 0;

        if (currentRating < reqSkill.minRating) {
          return res.status(400).json({
            error: `Your rating for ${reqSkill.skillName} (Level ${currentRating}/10) does not meet the minimum required threshold (Level ${reqSkill.minRating}/10). Take a Skill Test to upgrade your rating and unlock this opportunity.`
          });
        }
      }
    }

    const applicant = await prisma.gigApplicant.create({
      data: {
        gigId,
        candidateId,
        message,
        attachments: attachments || []
      }
    });
    
    res.status(201).json(applicant);
  } catch (err) {
    console.error('Error applying to gig:', err);
    res.status(500).json({ error: 'Failed to submit application to gig' });
  }
};

// Hire a candidate for a Gig
exports.hireCandidate = async (req, res) => {
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
      return res.status(403).json({ error: 'Only the gig owner can hire candidates' });
    }
    
    if (gig.status === 'CLOSED') {
      return res.status(400).json({ error: 'Cannot hire candidate for a closed gig' });
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

// Send message in private communication channel
exports.sendMessage = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { text, fileUrl, receiverId } = req.body;
    const senderId = req.user.id;
    
    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      include: { applicants: true }
    });
    
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }
    
    const isOwner = gig.ownerId === senderId;
    const allHiredIds = Array.from(new Set([...(gig.hiredCandidateIds || []), gig.selectedCandidateId].filter(Boolean)));
    const isHiredCandidate = allHiredIds.includes(senderId);

    if (!isOwner && !isHiredCandidate) {
      return res.status(403).json({ error: 'Direct messaging unlocks once you are hired for this gig' });
    }
    
    // Set sender as typing
    await prisma.gig.update({
      where: { id: gigId },
      data: { typingUserId: senderId }
    });
    
    let message;
    try {
      // Artificially delay message creation to let the receiver observe the typing indicator smoothly
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const targetReceiverId = receiverId || (isOwner ? (gig.selectedCandidateId || gig.hiredCandidateIds?.[0] || null) : gig.ownerId);

      message = await prisma.gigMessage.create({
        data: {
          gigId,
          senderId,
          receiverId: targetReceiverId,
          text,
          fileUrl
        }
      });
    } finally {
      // Reset typing status to null
      await prisma.gig.update({
        where: { id: gigId },
        data: { typingUserId: null }
      });
    }
    
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
    
    if (gig.ownerId !== reviewerId && gig.selectedCandidateId !== reviewerId) {
      return res.status(403).json({ error: 'You are not a participant in this gig' });
    }
    
    const revieweeId = gig.ownerId === reviewerId ? gig.selectedCandidateId : gig.ownerId;
    
    const alreadyReviewed = gig.reviews.some(r => r.reviewerId === reviewerId);
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
    if (reviewerId === gig.ownerId) {
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
    const { title, description, category, categories, skills, requirements, budget, deliveryTime, minRating, attachments } = req.body;
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
      title: title !== undefined ? title : gig.title,
      description: description !== undefined ? description : gig.description,
      budget: budget !== undefined ? budget : gig.budget,
      deliveryTime: deliveryTime !== undefined ? deliveryTime : gig.deliveryTime,
      attachments: attachments !== undefined ? attachments : gig.attachments
    };

    if (category !== undefined) {
      updatedData.category = category;
    }
    if (categories !== undefined && Array.isArray(categories)) {
      updatedData.categories = categories;
      if (!updatedData.category && categories.length > 0) {
        updatedData.category = categories[0];
      }
    }

    if (requirements && Array.isArray(requirements) && requirements.length > 0) {
      const cleanReqs = requirements.map(r => ({
        skillName: r.skillName,
        minRating: parseInt(r.minRating, 10) || 1
      }));
      updatedData.requirements = { set: cleanReqs };
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
