const { prisma } = require('../src/config/db');

async function clearAllGigData() {
  console.log('Starting Gig Data Cleanup...');

  try {
    // 1. Delete all GigReviews
    const deletedReviews = await prisma.gigReview.deleteMany({});
    console.log(`Deleted ${deletedReviews.count || 0} GigReviews.`);

    // 2. Delete all GigSubmissions
    const deletedSubmissions = await prisma.gigSubmission.deleteMany({});
    console.log(`Deleted ${deletedSubmissions.count || 0} GigSubmissions.`);

    // 3. Delete all GigMessages
    const deletedMessages = await prisma.gigMessage.deleteMany({});
    console.log(`Deleted ${deletedMessages.count || 0} GigMessages.`);

    // 4. Delete all GigApplicants
    const deletedApplicants = await prisma.gigApplicant.deleteMany({});
    console.log(`Deleted ${deletedApplicants.count || 0} GigApplicants.`);

    // 5. Delete all Gigs
    const deletedGigs = await prisma.gig.deleteMany({});
    console.log(`Deleted ${deletedGigs.count || 0} Gigs.`);

    // 6. Clean up profile experience entries tagged as Gig
    const profiles = await prisma.profile.findMany();
    let cleanedProfilesCount = 0;

    for (const prof of profiles) {
      if (Array.isArray(prof.experience) && prof.experience.some(exp => exp.expType === 'Gig')) {
        const filteredExp = prof.experience.filter(exp => exp.expType !== 'Gig');
        await prisma.profile.update({
          where: { id: prof.id },
          data: { experience: filteredExp }
        });
        cleanedProfilesCount++;
      }
    }
    console.log(`Cleaned Gig experiences from ${cleanedProfilesCount} Candidate Profiles.`);

    console.log('Gig data cleanup completed successfully!');
  } catch (err) {
    console.error('Error clearing Gig data:', err);
  } finally {
    process.exit(0);
  }
}

clearAllGigData();
