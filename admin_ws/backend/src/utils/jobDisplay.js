// Job summary fields for the admin portal, built from the columns the Job table
// really has (main_website/backend/prisma/schema.prisma). Missing values say
// "Not specified" instead of guessing (the portal used to show every job as
// "Remote" and "Full-time" from columns that don't exist).

const NOT_SPECIFIED = 'Not specified';

/** "₹15,000/month" from the stored pay (digits from the post-a-job form; older rows may hold text). */
function jobPay(job) {
  const raw = String(job.stipendFullTime || job.stipendPartTime || '').trim();
  if (!raw) return NOT_SPECIFIED;
  const amount = /^\d+$/.test(raw) ? `₹${Number(raw).toLocaleString('en-IN')}/month` : raw;
  return job.showSalary === false ? `${amount} (hidden from candidates)` : amount;
}

/** "Full-time job", "Part-time internship", "Gig": the type, with hours when a pay field says which. */
function jobType(job) {
  const noun = { JOB: 'job', INTERNSHIP: 'internship', GIG: 'gig' }[job.opportunityType];
  if (!noun) return NOT_SPECIFIED;
  const hours = job.stipendFullTime ? 'Full-time' : job.stipendPartTime ? 'Part-time' : '';
  return hours ? `${hours} ${noun}` : noun.charAt(0).toUpperCase() + noun.slice(1);
}

/** "Work from office · Hyderabad". */
function jobPlace(job) {
  return [job.workMode, job.location].filter(Boolean).join(' · ') || NOT_SPECIFIED;
}

module.exports = { jobPay, jobType, jobPlace };
