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
  gigReviews: [],
  skillDefinitions: []
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

// Seed initial companies matching jobs
mockDb.companies.push({
  id: "company_aether",
  userId: "recruiter_aether",
  name: "Aether Corp",
  logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
  description: "Aether Corp builds state of the art aerospace guidance software and premium web portals.",
  industry: "Aerospace & Software",
  companySize: "51-200 employees",
  website: "https://aether.example.com",
  location: "San Francisco, CA",
  foundedYear: "2018",
  officialEmail: "hr@aether.example.com",
  recruiterName: "Sarah Jenkins",
  recruiterDesignation: "Lead Talent Partner",
  socialLinks: { linkedin: "https://linkedin.com/company/aether", twitter: "https://twitter.com/aether" },
  photos: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80"
  ],
  verified: true
});

mockDb.companies.push({
  id: "company_nebula",
  userId: "recruiter_nebula",
  name: "Nebula Systems",
  logoUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=150&auto=format&fit=crop&q=80",
  description: "Nebula Systems develops decentralized and secure storage solutions using WebAssembly.",
  industry: "Decentralized Infrastructure",
  companySize: "11-50 employees",
  website: "https://nebula.example.com",
  location: "Seattle, WA",
  foundedYear: "2021",
  officialEmail: "careers@nebula.example.com",
  recruiterName: "David Miller",
  recruiterDesignation: "Chief Technical Recruiter",
  socialLinks: { linkedin: "https://linkedin.com/company/nebula" },
  photos: [
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&auto=format&fit=crop&q=80"
  ],
  verified: true
});

mockDb.companies.push({
  id: "company_vertex",
  userId: "recruiter_vertex",
  name: "Vertex AI",
  logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
  description: "Vertex AI focuses on deploying optimized machine learning models for low latency applications.",
  industry: "Artificial Intelligence",
  companySize: "1-10 employees",
  website: "https://vertex.example.com",
  location: "Austin, TX (Remote)",
  foundedYear: "2024",
  officialEmail: "jobs@vertex.example.com",
  recruiterName: "Elena Rostova",
  recruiterDesignation: "Co-Founder",
  socialLinks: { linkedin: "https://linkedin.com/company/vertex" },
  photos: [],
  verified: false
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
