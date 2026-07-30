require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { prisma } = require('../src/config/db');
const { deleteS3ObjectFromUrl } = require('../src/services/fileCleanup.service');
const { mockDb } = require('../src/config/mock/seed');

async function clearGigData() {
  console.log('--- STARTING GIG DATA CLEANUP ---');
  let deletedS3Count = 0;

  try {
    // 1. Fetch all Gig-related entities to collect S3 URLs
    console.log('Fetching gig attachments and files...');
    const gigs = await prisma.gig.findMany();
    const applicants = await prisma.gigApplicant.findMany();
    const messages = await prisma.gigMessage.findMany();
    const submissions = await prisma.gigSubmission.findMany();

    const urlsToDelete = new Set();

    gigs.forEach(g => {
      if (Array.isArray(g.attachments)) {
        g.attachments.forEach(url => url && urlsToDelete.add(url));
      }
    });

    applicants.forEach(a => {
      if (Array.isArray(a.attachments)) {
        a.attachments.forEach(url => url && urlsToDelete.add(url));
      }
    });

    messages.forEach(m => {
      if (m.fileUrl) urlsToDelete.add(m.fileUrl);
    });

    submissions.forEach(s => {
      if (s.fileUrl) urlsToDelete.add(s.fileUrl);
    });

    console.log(`Found ${urlsToDelete.size} S3 file references to delete.`);

    // 2. Delete S3 objects
    for (const url of urlsToDelete) {
      try {
        await deleteS3ObjectFromUrl(url, 'gig asset');
        deletedS3Count++;
      } catch (err) {
        console.warn(`Failed to delete S3 object at ${url}:`, err.message);
      }
    }

    // 3. Delete database records in child-to-parent order
    console.log('Deleting database records...');
    const reviewsDeleted = await prisma.gigReview.deleteMany({});
    console.log(`Deleted ${reviewsDeleted.count || 0} GigReview records.`);

    const submissionsDeleted = await prisma.gigSubmission.deleteMany({});
    console.log(`Deleted ${submissionsDeleted.count || 0} GigSubmission records.`);

    const messagesDeleted = await prisma.gigMessage.deleteMany({});
    console.log(`Deleted ${messagesDeleted.count || 0} GigMessage records.`);

    const applicantsDeleted = await prisma.gigApplicant.deleteMany({});
    console.log(`Deleted ${applicantsDeleted.count || 0} GigApplicant records.`);

    const gigsDeleted = await prisma.gig.deleteMany({});
    console.log(`Deleted ${gigsDeleted.count || 0} Gig records.`);

    // 4. Also clear mock memory store if running in mock mode
    if (mockDb && Array.isArray(mockDb.gigs)) {
      mockDb.gigs = [];
      console.log('Cleared mockDb.gigs array in memory store.');
    }

    console.log('--- GIG DATA CLEANUP COMPLETE ---');
    console.log(`Summary: ${deletedS3Count} S3 files deleted, ${gigsDeleted.count || 0} Gigs removed.`);
  } catch (err) {
    console.error('Error during gig data cleanup:', err);
  } finally {
    process.exit(0);
  }
}

clearGigData();
