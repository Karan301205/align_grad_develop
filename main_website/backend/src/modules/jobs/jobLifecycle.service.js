// Job lifecycle rules shared by the student and recruiter controllers.
// Extracted verbatim from the previously duplicated "auto-delete expired jobs"
// blocks so the expiry policy lives in one place.

// Deletes jobs whose active window (createdAt + activeDays, default 30) has
// elapsed, along with their applications. Errors are swallowed and logged so a
// cleanup failure never blocks the calling request (original behavior).
async function purgeExpiredJobs(prisma) {
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
}

module.exports = { purgeExpiredJobs };
