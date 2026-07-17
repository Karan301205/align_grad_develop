// In-memory mock implementation of the Prisma client surface used by the
// controllers. Only the query shapes the controllers actually use are emulated.
// Extracted verbatim from config/db.js; operates on the seeded `mockDb` store.
const { mockDb } = require('./seed');

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
    count: async (args = {}) => {
      if (args && args.where && args.where.role) {
        return mockDb.users.filter(u => u.role === args.where.role).length;
      }
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
    findFirst: async ({ where }) => {
      if (!where) return mockDb.profiles[0] || null;
      if (where.username) {
        const usernameQuery = where.username;
        const qVal = typeof usernameQuery === 'string' ? usernameQuery : (usernameQuery.equals || '');
        return mockDb.profiles.find(p => (p.username || '').toLowerCase() === qVal.toLowerCase()) || null;
      }
      const field = Object.keys(where)[0];
      return mockDb.profiles.find(p => p[field] === where[field]) || null;
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
        if (data.username !== undefined) mockDb.profiles[idx].username = data.username;
        if (data.profilePic !== undefined) mockDb.profiles[idx].profilePic = data.profilePic;
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
  },
  gig: {
    findMany: async (args = {}) => {
      let result = [...mockDb.gigs];
      if (args && args.where) {
        const { where } = args;
        if (where.status) {
          result = result.filter(g => g.status === where.status);
        }
        if (where.ownerId) {
          result = result.filter(g => g.ownerId === where.ownerId);
        }
        if (where.selectedCandidateId) {
          result = result.filter(g => g.selectedCandidateId === where.selectedCandidateId);
        }
        if (where.OR) {
          // Used for my-gigs tabs
          result = result.filter(g => {
            return g.ownerId === where.OR[0].ownerId || g.selectedCandidateId === where.OR[1].selectedCandidateId;
          });
        }
      }
      return result.map(g => {
        // Resolve owner details
        const ownerProfile = mockDb.profiles.find(p => p.userId === g.ownerId) || mockDb.profiles.find(p => p.id === g.ownerId);
        const ownerCompany = mockDb.companies.find(c => c.userId === g.ownerId) || mockDb.companies.find(c => c.id === g.ownerId);
        const ownerName = ownerProfile ? ownerProfile.name : (ownerCompany ? ownerCompany.name : "System User");
        return {
          ...g,
          ownerName,
          ownerRole: ownerProfile ? "STUDENT" : "RECRUITER"
        };
      });
    },
    findUnique: async ({ where, include }) => {
      const gig = mockDb.gigs.find(g => g.id === where.id);
      if (!gig) return null;
      
      const ownerProfile = mockDb.profiles.find(p => p.userId === gig.ownerId) || mockDb.profiles.find(p => p.id === gig.ownerId);
      const ownerCompany = mockDb.companies.find(c => c.userId === gig.ownerId) || mockDb.companies.find(c => c.id === gig.ownerId);
      const ownerName = ownerProfile ? ownerProfile.name : (ownerCompany ? ownerCompany.name : "System User");
      
      const res = {
        ...gig,
        ownerName,
        ownerRole: ownerProfile ? "STUDENT" : "RECRUITER"
      };

      if (include) {
        if (include.applicants) {
          res.applicants = mockDb.gigApplicants
            .filter(a => a.gigId === gig.id)
            .map(a => {
              const candidateProfile = mockDb.profiles.find(p => p.userId === a.candidateId) || mockDb.profiles.find(p => p.id === a.candidateId);
              return { ...a, candidate: candidateProfile };
            });
        }
        if (include.messages) {
          res.messages = mockDb.gigMessages.filter(m => m.gigId === gig.id);
        }
        if (include.submissions) {
          res.submissions = mockDb.gigSubmissions.filter(s => s.gigId === gig.id);
        }
        if (include.reviews) {
          res.reviews = mockDb.gigReviews.filter(r => r.gigId === gig.id);
        }
      }
      return res;
    },
    create: async ({ data }) => {
      const newGig = {
        id: `gig_${Date.now()}`,
        status: "OPEN",
        attachments: [],
        createdAt: new Date(),
        ...data
      };
      mockDb.gigs.push(newGig);
      return newGig;
    },
    update: async ({ where, data }) => {
      const idx = mockDb.gigs.findIndex(g => g.id === where.id);
      if (idx !== -1) {
        const fields = ["status", "selectedCandidateId", "title", "description", "budget", "deliveryTime", "attachments"];
        fields.forEach(field => {
          if (data[field] !== undefined) {
            mockDb.gigs[idx][field] = data[field];
          }
        });
        return mockDb.gigs[idx];
      }
      throw new Error("Gig not found");
    }
  },
  gigApplicant: {
    create: async ({ data }) => {
      const newApplicant = {
        id: `applicant_${Date.now()}`,
        createdAt: new Date(),
        ...data
      };
      mockDb.gigApplicants.push(newApplicant);
      return newApplicant;
    },
    findMany: async ({ where }) => {
      let filtered = mockDb.gigApplicants;
      if (where.gigId) filtered = filtered.filter(a => a.gigId === where.gigId);
      if (where.candidateId) filtered = filtered.filter(a => a.candidateId === where.candidateId);
      return filtered;
    },
    deleteMany: async ({ where }) => {
      const initialCount = mockDb.gigApplicants.length;
      if (where && where.gigId) {
        mockDb.gigApplicants = mockDb.gigApplicants.filter(a => a.gigId !== where.gigId);
      }
      return { count: initialCount - mockDb.gigApplicants.length };
    }
  },
  gigMessage: {
    create: async ({ data }) => {
      const newMessage = {
        id: `msg_${Date.now()}`,
        createdAt: new Date(),
        ...data
      };
      mockDb.gigMessages.push(newMessage);
      return newMessage;
    },
    findMany: async ({ where }) => {
      return mockDb.gigMessages.filter(m => m.gigId === where.gigId);
    }
  },
  gigSubmission: {
    create: async ({ data }) => {
      const newSubmission = {
        id: `sub_${Date.now()}`,
        status: "PENDING",
        createdAt: new Date(),
        ...data
      };
      mockDb.gigSubmissions.push(newSubmission);
      return newSubmission;
    },
    findUnique: async ({ where }) => {
      return mockDb.gigSubmissions.find(s => s.gigId === where.gigId) || null;
    },
    update: async ({ where, data }) => {
      const idx = mockDb.gigSubmissions.findIndex(s => s.gigId === where.gigId || s.id === where.id);
      if (idx !== -1) {
        if (data.status) mockDb.gigSubmissions[idx].status = data.status;
        return mockDb.gigSubmissions[idx];
      }
      throw new Error("Submission not found");
    }
  },
  gigReview: {
    create: async ({ data }) => {
      const newReview = {
        id: `rev_${Date.now()}`,
        createdAt: new Date(),
        ...data
      };
      mockDb.gigReviews.push(newReview);
      return newReview;
    },
    findMany: async ({ where }) => {
      let filtered = mockDb.gigReviews;
      if (where.revieweeId) filtered = filtered.filter(r => r.revieweeId === where.revieweeId);
      if (where.gigId) filtered = filtered.filter(r => r.gigId === where.gigId);
      return filtered;
    }
  }
};

module.exports = { mockClient };
