const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
dotenv.config();

let prismaInstance;
let useMock = false;
let activeClient;

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

const mockClient = {
  user: {
    findUnique: async ({ where }) => {
      const field = Object.keys(where)[0];
      return mockDb.users.find(u => u[field] === where[field]) || null;
    },
    create: async ({ data }) => {
      const newUser = { id: `u_${Date.now()}`, ...data, createdAt: new Date() };
      mockDb.users.push(newUser);
      return newUser;
    },
    count: async () => {
      return mockDb.users.length;
    }
  },
  profile: {
    findUnique: async ({ where }) => {
      const field = Object.keys(where)[0];
      let profile = mockDb.profiles.find(p => p[field] === where[field]);
      if (profile) {
        const user = mockDb.users.find(u => u.id === profile.userId);
        return { ...profile, user };
      }
      return null;
    },
    findMany: async (args = {}) => {
      return mockDb.profiles;
    },
    create: async ({ data }) => {
      const newProfile = { id: `p_${Date.now()}`, skills: [], tests: [], ...data };
      mockDb.profiles.push(newProfile);
      return newProfile;
    },
    update: async ({ where, data }) => {
      const idx = mockDb.profiles.findIndex(p => p.userId === where.userId || p.id === where.id);
      if (idx !== -1) {
        if (data.skills) {
          if (data.skills.set) {
            mockDb.profiles[idx].skills = data.skills.set;
          } else {
            mockDb.profiles[idx].skills = data.skills;
          }
        }
        if (data.resumeUrl !== undefined) mockDb.profiles[idx].resumeUrl = data.resumeUrl;
        if (data.name !== undefined) mockDb.profiles[idx].name = data.name;
        if (data.bio !== undefined) mockDb.profiles[idx].bio = data.bio;
        if (data.nationality !== undefined) mockDb.profiles[idx].nationality = data.nationality;
        if (data.gender !== undefined) mockDb.profiles[idx].gender = data.gender;
        if (data.email !== undefined) mockDb.profiles[idx].email = data.email;
        if (data.dob !== undefined) mockDb.profiles[idx].dob = data.dob;
        if (data.phone !== undefined) mockDb.profiles[idx].phone = data.phone;
        if (data.socialLinks !== undefined) mockDb.profiles[idx].socialLinks = data.socialLinks;
        if (data.education !== undefined) mockDb.profiles[idx].education = data.education;
        if (data.experience !== undefined) mockDb.profiles[idx].experience = data.experience;
        if (data.certificates !== undefined) mockDb.profiles[idx].certificates = data.certificates;
        if (data.projects !== undefined) mockDb.profiles[idx].projects = data.projects;
        if (data.cocurricular !== undefined) mockDb.profiles[idx].cocurricular = data.cocurricular;
        if (data.introVideoUrl !== undefined) mockDb.profiles[idx].introVideoUrl = data.introVideoUrl;
        return mockDb.profiles[idx];
      }
      throw new Error("Profile not found");
    }
  },
  company: {
    findUnique: async ({ where }) => {
      const field = Object.keys(where)[0];
      const company = mockDb.companies.find(c => c[field] === where[field]);
      if (company) {
        const user = mockDb.users.find(u => u.id === company.userId);
        return { ...company, user };
      }
      return null;
    },
    create: async ({ data }) => {
      const newCompany = { id: `c_${Date.now()}`, verified: false, jobs: [], ...data };
      mockDb.companies.push(newCompany);
      return newCompany;
    },
    update: async ({ where, data }) => {
      const idx = mockDb.companies.findIndex(c => c.userId === where.userId || c.id === where.id);
      if (idx !== -1) {
        if (data.docUrl) mockDb.companies[idx].docUrl = data.docUrl;
        if (data.verified !== undefined) mockDb.companies[idx].verified = data.verified;
        if (data.name) mockDb.companies[idx].name = data.name;
        return mockDb.companies[idx];
      }
      throw new Error("Company not found");
    }
  },
  job: {
    findMany: async (args = {}) => {
      return mockDb.jobs.map(j => {
        const company = mockDb.companies.find(c => c.id === j.companyId) || j.company || { name: "Mock Company", verified: true };
        return { ...j, company };
      });
    },
    create: async ({ data }) => {
      const newJob = { id: `j_${Date.now()}`, createdAt: new Date(), ...data };
      if (newJob.requirements && newJob.requirements.set) {
        newJob.requirements = newJob.requirements.set;
      }
      if (newJob.selectionProcess && newJob.selectionProcess.set) {
        newJob.selectionProcess = newJob.selectionProcess.set;
      }
      mockDb.jobs.push(newJob);
      return newJob;
    },
    findUnique: async ({ where }) => {
      const job = mockDb.jobs.find(j => j.id === where.id);
      if (job) {
        const company = mockDb.companies.find(c => c.id === job.companyId) || job.company || { name: "Mock Company", verified: true };
        return { ...job, company };
      }
      return null;
    },
    update: async ({ where, data }) => {
      const idx = mockDb.jobs.findIndex(j => j.id === where.id);
      if (idx !== -1) {
        const fields = [
          'title', 'description', 'companyName', 'officialWebsite', 
          'preferredEducation', 'desiredExperience', 'designation', 
          'stipendPartTime', 'stipendFullTime', 'duration', 
          'roleResponsibilities', 'location', 'locationUrl', 'joiningMonth', 
          'openings', 'edited', 'activeDays'
        ];
        fields.forEach(field => {
          if (data[field] !== undefined) {
            mockDb.jobs[idx][field] = data[field];
          }
        });
        if (data.requirements) {
          mockDb.jobs[idx].requirements = data.requirements.set || data.requirements;
        }
        if (data.selectionProcess) {
          mockDb.jobs[idx].selectionProcess = data.selectionProcess.set || data.selectionProcess;
        }
        return mockDb.jobs[idx];
      }
      throw new Error("Job not found");
    },
    delete: async ({ where }) => {
      const idx = mockDb.jobs.findIndex(j => j.id === where.id);
      if (idx !== -1) {
        return mockDb.jobs.splice(idx, 1)[0];
      }
      throw new Error("Job not found");
    }
  },
  application: {
    create: async ({ data }) => {
      const newApp = { id: `a_${Date.now()}`, status: "APPLIED", createdAt: new Date(), ...data };
      mockDb.applications.push(newApp);
      return newApp;
    },
    findMany: async ({ where }) => {
      let filtered = mockDb.applications;
      if (where.studentId) filtered = filtered.filter(a => a.studentId === where.studentId);
      if (where.jobId) filtered = filtered.filter(a => a.jobId === where.jobId);
      return filtered.map(a => {
        const job = mockDb.jobs.find(j => j.id === a.jobId);
        return { ...a, job };
      });
    },
    deleteMany: async ({ where }) => {
      const initialCount = mockDb.applications.length;
      if (where && where.jobId) {
        mockDb.applications = mockDb.applications.filter(a => a.jobId !== where.jobId);
      }
      return { count: initialCount - mockDb.applications.length };
    }
  },
  testAttempt: {
    create: async ({ data }) => {
      const newAttempt = { id: `t_${Date.now()}`, createdAt: new Date(), ...data };
      mockDb.testAttempts.push(newAttempt);
      return newAttempt;
    },
    findMany: async ({ where }) => {
      let filtered = mockDb.testAttempts;
      if (where.profileId) filtered = filtered.filter(t => t.profileId === where.profileId);
      return filtered;
    }
  }
};


try {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost")) {
    prismaInstance = new PrismaClient();
    activeClient = prismaInstance;
    console.log('Prisma Client initialized.');
  } else {
    console.warn('DATABASE_URL is default/local. Using mock client fallback.');
    useMock = true;
    activeClient = mockClient;
  }
} catch (e) {
  console.error('Failed to initialize Prisma client. Using mock fallback:', e.message);
  useMock = true;
  activeClient = mockClient;
}

// Proxy wrapper so we can dynamically swap out the active client if connection fails
const prismaProxy = new Proxy({}, {
  get(target, prop) {
    const val = activeClient[prop];
    if (typeof val === 'function') {
      return val.bind(activeClient);
    }
    return val;
  }
});

// Perform async connection check on startup if not already using mock
if (!useMock && prismaInstance) {
  const connectionCheck = prismaInstance.user.count();
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Database connection timed out')), 10000)
  );

  Promise.race([connectionCheck, timeout])
    .then((count) => {
      console.log(`Successfully connected to MongoDB database. Seed count: ${count}`);
    })
    .catch((err) => {
      console.warn(`[DATABASE CONNECT FAIL] ${err.message}. Falling back to mock datastore.`);
      useMock = true;
      activeClient = mockClient;
    });
}

module.exports = {
  prisma: prismaProxy,
  isMock: () => useMock
};

