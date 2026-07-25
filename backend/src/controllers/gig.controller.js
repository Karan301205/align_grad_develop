const { prisma } = require('../config/db');

// Get all open gigs in the marketplace
exports.getGigs = async (req, res) => {
  try {
    const { q, skills } = req.query;
    
    let whereClause = { status: "OPEN" };
    
    const gigs = await prisma.gig.findMany({
      where: whereClause
    });
    
    // Perform manual filters if needed to support both MongoDB & Mock client seamlessly
    let filteredGigs = gigs;
    
    if (q) {
      const search = q.toLowerCase();
      filteredGigs = filteredGigs.filter(g => 
        g.title.toLowerCase().includes(search) || 
        g.description.toLowerCase().includes(search)
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
    const { title, description, skills, budget, deliveryTime, attachments } = req.body;
    
    // Create new gig model
    const gig = await prisma.gig.create({
      data: {
        title,
        description,
        skills,
        budget,
        deliveryTime,
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
    
    const gigs = await prisma.gig.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { selectedCandidateId: userId }
        ]
      }
    });
    
    const companies = await prisma.company.findMany();
    const gigsWithCompany = gigs.map(g => {
      const company = companies.find(c => c.userId === g.ownerId || c.id === g.ownerId) || null;
      return { ...g, company };
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
    
    // Check access permission
    const isOwner = gig.ownerId === userId;
    const isCandidate = gig.selectedCandidateId === userId;
    const isApplicant = gig.applicants.some(a => a.candidateId === userId);
    
    if (!isOwner && !isCandidate && !isApplicant && req.user.role !== 'RECRUITER') {
      // Allow general browsing of details but mask sensitive sections like applications/messages
      const company = await prisma.company.findFirst({
        where: { OR: [{ userId: gig.ownerId }, { id: gig.ownerId }] }
      });
      return res.status(200).json({
        id: gig.id,
        title: gig.title,
        description: gig.description,
        skills: gig.skills,
        budget: gig.budget,
        deliveryTime: gig.deliveryTime,
        status: gig.status,
        createdAt: gig.createdAt,
        ownerId: gig.ownerId,
        ownerName: gig.ownerName,
        ownerRole: gig.ownerRole,
        company
      });
    }
    
    const company = await prisma.company.findFirst({
      where: { OR: [{ userId: gig.ownerId }, { id: gig.ownerId }] }
    });
    res.status(200).json({ ...gig, company });
  } catch (err) {
    console.error('Error fetching gig details:', err);
    res.status(500).json({ error: 'Failed to fetch gig details' });
  }
};

// Apply to a Gig
exports.applyToGig = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { message } = req.body;
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
    
    if (gig.status !== 'OPEN') {
      return res.status(400).json({ error: 'Gig is no longer open for applications' });
    }
    
    if (gig.ownerId === candidateId) {
      return res.status(400).json({ error: 'You cannot apply to your own gig' });
    }
    
    const alreadyApplied = gig.applicants.some(a => a.candidateId === candidateId);
    if (alreadyApplied) {
      return res.status(400).json({ error: 'You have already applied to this gig' });
    }
    
    const applicant = await prisma.gigApplicant.create({
      data: {
        gigId,
        candidateId,
        message
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
    
    if (gig.status !== 'OPEN') {
      return res.status(400).json({ error: 'Candidate can only be selected for open gigs' });
    }
    
    const updatedGig = await prisma.gig.update({
      where: { id: gigId },
      data: {
        status: "IN_PROGRESS",
        selectedCandidateId: candidateId
      }
    });
    
    // Clean up applications
    await prisma.gigApplicant.deleteMany({
      where: { gigId }
    });
    
    // Seed initial message in the private channel
    await prisma.gigMessage.create({
      data: {
        gigId,
        senderId: userId,
        text: `Hello! I have selected you for this gig. Let's work together to complete the tasks!`
      }
    });
    
    res.status(200).json(updatedGig);
  } catch (err) {
    console.error('Error hiring candidate:', err);
    res.status(500).json({ error: 'Failed to hire candidate' });
  }
};

// Send message in private communication channel
exports.sendMessage = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { text, fileUrl } = req.body;
    const senderId = req.user.id;
    
    const gig = await prisma.gig.findUnique({
      where: { id: gigId }
    });
    
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }
    
    if (gig.ownerId !== senderId && gig.selectedCandidateId !== senderId) {
      return res.status(403).json({ error: 'You are not active on this communication channel' });
    }
    
    // Set sender as typing
    await prisma.gig.update({
      where: { id: gigId },
      data: { typingUserId: senderId }
    });
    
    let message;
    try {
      // Artificially delay message creation to let the receiver observe the typing indicator smoothly
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      message = await prisma.gigMessage.create({
        data: {
          gigId,
          senderId,
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
    const candidateId = req.user.id;
    
    const gig = await prisma.gig.findUnique({
      where: { id: gigId }
    });
    
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }
    
    if (gig.selectedCandidateId !== candidateId) {
      return res.status(403).json({ error: 'Only the selected freelancer can submit work' });
    }
    
    if (gig.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Work can only be submitted for active gigs' });
    }
    
    // Check if submission already exists
    const existingSubmission = await prisma.gigSubmission.findUnique({
      where: { gigId }
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
          candidateId,
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
        senderId: candidateId,
        text: `[SYSTEM: WORK SUBMITTED] I have submitted the final work deliverables for your review. Description: ${text || 'No description provided.'}`
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
    const { action } = req.body; // "ACCEPT" or "REVISION"
    const userId = req.user.id;
    
    const gig = await prisma.gig.findUnique({
      where: { id: gigId }
    });
    
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }
    
    if (gig.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the gig owner can complete the gig or request revisions' });
    }
    
    const submission = await prisma.gigSubmission.findUnique({
      where: { gigId }
    });
    
    if (!submission) {
      return res.status(400).json({ error: 'No deliverables have been submitted yet' });
    }
    
    if (action === 'ACCEPT') {
      await prisma.gig.update({
        where: { id: gigId },
        data: { status: "COMPLETED" }
      });
      
      await prisma.gigSubmission.update({
        where: { id: submission.id },
        data: { status: "ACCEPTED" }
      });
      
      await prisma.gigMessage.create({
        data: {
          gigId,
          senderId: userId,
          text: `[SYSTEM: GIG COMPLETED] The deliverables have been reviewed and accepted! The project has been marked as Completed.`
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
          text: `[SYSTEM: REVISIONS REQUESTED] Revisions requested on the submitted work. Please check requirements and update your submission.`
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
    const { title, description, skills, budget, deliveryTime, attachments } = req.body;
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

    const updatedGig = await prisma.gig.update({
      where: { id: gigId },
      data: {
        title: title !== undefined ? title : gig.title,
        description: description !== undefined ? description : gig.description,
        skills: skills !== undefined ? skills : gig.skills,
        budget: budget !== undefined ? budget : gig.budget,
        deliveryTime: deliveryTime !== undefined ? deliveryTime : gig.deliveryTime,
        attachments: attachments !== undefined ? attachments : gig.attachments
      }
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

    if (gig.status !== 'OPEN' && gig.status !== 'PAUSED') {
      return res.status(400).json({ error: 'Status can only be toggled for open or paused gigs' });
    }

    if (status !== 'OPEN' && status !== 'PAUSED') {
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
