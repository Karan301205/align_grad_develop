const { jobPay, jobPlace, jobType } = require('../../utils/jobDisplay');

/**
 * One posting as the admin job list shows it. `company` is the posting's Company row, if there is one.
 * `postedAt` is when the recruiter posted it (Job.createdAt), which the list sorts on.
 */
function summarizeJob(job, company) {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    companyName: company?.name || job.companyName || 'Not specified',
    location: jobPlace(job),
    salaryRange: jobPay(job),
    jobType: jobType(job),
    requirements: job.requirements || [],
    postedAt: job.createdAt || null
  };
}

module.exports = { summarizeJob };
