const { prisma } = require('../src/config/db');
const { deleteS3ObjectFromUrl } = require('../src/services/fileCleanup.service');
const { mockDb } = require('../src/config/mock/mockClient');

async function clearGigData() {
  console.log('--- Starting Complete Gig Data Purge ---');
  
  let s3Urls = [];

  try {
    // 1. Collect S3 Attachment URLs from Gig
    const gigs = await prisma.gig.findMany({ select: { attachments: true } });
    for (const g of gigs) {
      if (Array.isArray(g.attachments)) {
        s3Urls.push(...g.attachments);
      }
    }

    // 2. Collect S3 Attachment URLs from GigApplicant
    const applicants = await prisma.gigApplicant.findMany({ select: { attachments: true } });
    for (const a of applicants) {
      if (Array.isArray(a.attachments)) {
        s3Urls.push(...a.attachments);
      }
    }

    // 3. Collect S3 Attachment URLs from GigMessage
    const messages = await prisma.gigMessage.findMany({ select: { fileUrl: true } });
    for (const m of messages) {
      if (m.fileUrl) {
        s3Urls.push(m.fileUrl);
      }
    }

    // 4. Collect S3 Attachment URLs from GigSubmission
    const submissions = await prisma.gigSubmission.findMany({ select: { fileUrl: true } });
    for (const s of submissions) {
      if (s.fileUrl) {
        s3Urls.push(s.fileUrl);
      }
    }

    // Deduplicate URLs
    s3Urls = Array.from(new Set(s3Urls.filter(Boolean)));
    console.log(`Found ${s3Urls.length} unique S3 gig files to purge...`);

    // Delete all S3 files
    for (const url of s3Urls) {
      try {
        await deleteS3ObjectFromUrl(url, 'gig attachment');
      } catch (err) {
        console.warn(`Failed to delete S3 file (${url}):`, err.message);
      }
    }

    // 5. Delete all Mongo DB Collections via Prisma
    console.log('Purging MongoDB collections...');
    const deletedSubmissions = await prisma.gigSubmission.deleteMany();
    console.log(`Deleted ${deletedSubmissions.count} GigSubmissions from MongoDB.`);

    const deletedMessages = await prisma.gigMessage.deleteMany();
    console.log(`Deleted ${deletedMessages.count} GigMessages from MongoDB.`);

    const deletedApplicants = await prisma.gigApplicant.deleteMany();
    console.log(`Deleted ${deletedApplicants.count} GigApplicants from MongoDB.`);

    const deletedReviews = await prisma.gigReview.deleteMany();
    console.log(`Deleted ${deletedReviews.count} GigReviews from MongoDB.`);

    const deletedGigs = await prisma.gig.deleteMany();
    console.log(`Deleted ${deletedGigs.count} Gigs from MongoDB.`);

    // 6. Reset in-memory mock collections if present
    if (mockDb) {
      mockDb.gigs = [];
      mockDb.gigApplicants = [];
      mockDb.gigMessages = [];
      mockDb.gigSubmissions = [];
      mockDb.gigReviews = [];
      console.log('Reset mockDb memory collections.');
    }

    console.log('--- Gig Data Purge Complete Successfully! ---');
  } catch (err) {
    console.error('Error during Gig Data Purge:', err);
  } finally {
    await prisma.$disconnect();
  }
}

clearGigData();
