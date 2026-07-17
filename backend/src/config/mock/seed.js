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
  testAttempts: [],
  gigs: [],
  gigApplicants: [],
  gigMessages: [],
  gigSubmissions: [],
  gigReviews: []
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
  desiredExperience: "2 Years",
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
  desiredExperience: "3+ Years",
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
  desiredExperience: "1 Year",
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
  regNo: "CAN001",
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

// Seed initial gigs
mockDb.gigs.push({
  id: "gig_react_modal",
  title: "Build Responsive Neumorphic Modal",
  description: "Create a reusable React modal component matching the workspace chassis design language. It must support accessibility overlay close states, smooth CSS transition entries, and custom titles.",
  skills: ["React", "CSS"],
  budget: 150.0,
  deliveryTime: "3 Days",
  attachments: [],
  ownerId: "student_leo",
  selectedCandidateId: null,
  status: "OPEN",
  typingUserId: null,
  createdAt: new Date()
});

mockDb.gigs.push({
  id: "gig_python_script",
  title: "Write CSV Data Normalizer Script",
  description: "Develop a Python command line utility that reads arbitrary applicant data from CSV formats, maps target headers, validates formatting structures, and dumps output to normalized JSON structures.",
  skills: ["Python", "SQL"],
  budget: 200.0,
  deliveryTime: "5 Days",
  attachments: [],
  ownerId: "company_vertex",
  selectedCandidateId: null,
  status: "OPEN",
  typingUserId: null,
  createdAt: new Date()
});

module.exports = { mockDb };
