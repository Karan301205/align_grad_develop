// Seed fixtures for the in-memory mock datastore. Pre-populates a few jobs and a
// demo student so the backend is instantly usable offline (no MongoDB required).
// Extracted verbatim from config/db.js.

// Mock database store
const mockDb = {
  users: [],
  profiles: [],
  companies: [],
  jobs: [],
  applications: [],
  testAttempts: []
};

// Seed initial jobs in mock db to make it instantly usable
mockDb.jobs.push({
  id: "job_react_developer",
  companyId: "company_aether",
  title: "Frontend Engineer (React)",
  description: "We are looking for a skilled Frontend Engineer proficient in React. You will be building responsive components matching our design system.",
  requirements: [
    { skillName: "React", minRating: 8 },
    { skillName: "Tailwind CSS", minRating: 6 }
  ],
  location: "San Francisco, CA",
  locationUrl: "https://maps.google.com/?q=San+Francisco",
  activeDays: 30,
  company: { name: "Aether Corp", verified: true },
  createdAt: new Date()
});

mockDb.jobs.push({
  id: "job_rust_engineer",
  companyId: "company_nebula",
  title: "Backend Architect (Rust)",
  description: "Join our platform team to build secure and fast systems using Rust and WebAssembly.",
  requirements: [
    { skillName: "Rust", minRating: 9 },
    { skillName: "Kubernetes", minRating: 8 }
  ],
  location: "Seattle, WA",
  locationUrl: "https://maps.google.com/?q=Seattle",
  activeDays: 30,
  company: { name: "Nebula Systems", verified: true },
  createdAt: new Date()
});

mockDb.jobs.push({
  id: "job_python_developer",
  companyId: "company_vertex",
  title: "ML Integration Engineer",
  description: "Responsible for deploying machine learning pipelines, writing APIs in Python and SQL.",
  requirements: [
    { skillName: "Python", minRating: 7 },
    { skillName: "SQL", minRating: 6 }
  ],
  location: "Austin, TX (Remote)",
  locationUrl: "",
  activeDays: 30,
  company: { name: "Vertex AI", verified: false },
  createdAt: new Date()
});

// Seed initial student candidate to make recruiter searches instantly testable
const seedStudentId = "student_leo";
mockDb.users.push({
  id: seedStudentId,
  email: "leo@domain.com",
  role: "STUDENT",
  createdAt: new Date()
});
mockDb.profiles.push({
  id: "profile_leo",
  userId: seedStudentId,
  name: "Leo Carter",
  username: "leo_carter",
  profilePic: null,
  bio: "Frontend Specialist with 3+ years of experience in React.",
  skills: [
    { name: "React", rating: 9, verifiedRating: 8 },
    { name: "CSS", rating: 8, verifiedRating: null }
  ],
  education: [],
  experience: [],
  certificates: [],
  projects: []
});

module.exports = { mockDb };
