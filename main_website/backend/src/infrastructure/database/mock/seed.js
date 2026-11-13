// Empty in-memory tables for automated tests (see ../index.js). Tests create the
// rows they need; there is no sample data.

const mockDb = {
  users: [],
  profiles: [],
  companies: [],
  jobs: [],
  applications: [],
  testAttempts: [],
  gigs: [],
  gigApplicants: [],
  gigMessages: [],
  gigSubmissions: [],
  gigReviews: [],
  skillDefinitions: [],
  questions: [],
  testSessions: [],
  assessmentRecords: [],
  skillRoadmaps: [],
  communities: [],
  communityMembers: [],
  communityInvites: [],
  posts: [],
  medias: [],
  postReactions: [],
  postComments: [],
  savedPosts: [],
  postViews: [],
  paymentTransactions: [],
  courses: [],
  courseEnrollments: []
};

module.exports = { mockDb };
