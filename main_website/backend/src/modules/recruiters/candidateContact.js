// What a recruiter may see about a candidate. Contact and personal details (phone, date of birth,
// email, nationality, gender) are shown only for candidates who applied to one of that company's
// jobs. Everyone else is listed without them (ISSUES A3).

const CONTACT_FIELDS = ['phone', 'dob', 'email', 'nationality', 'gender'];

/** The profile with contact and personal fields removed unless the candidate applied to this company. */
function redactCandidateContact(profile, applicantProfileIds) {
  if (!profile || typeof profile !== 'object') return profile;
  if (applicantProfileIds && applicantProfileIds.has(profile.id)) return profile;
  const shown = { ...profile };
  for (const field of CONTACT_FIELDS) delete shown[field];
  return shown;
}

module.exports = { CONTACT_FIELDS, redactCandidateContact };
