// In-memory mock implementation of the Prisma client surface used by the
// controllers. Only the query shapes the controllers actually use are emulated.
// Extracted verbatim from config/db.js; operates on the seeded `mockDb` store.
const { mockDb } = require('./seed');

// Apply a Prisma-style `data` object to a mock row in place, emulating atomic
// `{ increment: n }` operators (used by Question counter updates in Phase 4).
function applyData(row, data = {}) {
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === 'object' && 'increment' in v) row[k] = (row[k] || 0) + v.increment;
    else row[k] = v;
  }
  row.updatedAt = new Date();
  return row;
}

const mockClient = {
  user: {
    findUnique: async ({ where }) => {
      const field = Object.keys(where)[0];
      return mockDb.users.find(u => u[field] === where[field]) || null;
    },
    findFirst: async ({ where = {} } = {}) => {
      if (!where || Object.keys(where).length === 0) return mockDb.users[0] || null;
      return mockDb.users.find(u => {
        for (const k of Object.keys(where)) {
          if (u[k] !== where[k]) return false;
        }
        return true;
      }) || null;
    },
    findMany: async ({ where = {} } = {}) => {
      if (!where || Object.keys(where).length === 0) return mockDb.users;
      return mockDb.users.filter(u => {
        for (const k of Object.keys(where)) {
          if (u[k] !== where[k]) return false;
        }
        return true;
      });
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
  company: {
    findFirst: async (args = {}) => {
      let result = mockDb.companies || [];
      if (args && args.where) {
        if (args.where.userId) {
          result = result.filter(c => c.userId === args.where.userId);
        }
        if (args.where.OR) {
          result = result.filter(c => args.where.OR.some(clause => (clause.userId && c.userId === clause.userId) || (clause.id && c.id === clause.id)));
        }
      }
      return result[0] || (mockDb.companies && mockDb.companies[0]) || null;
    },
    findUnique: async ({ where }) => {
      const comp = (mockDb.companies || []).find(c => (where.id && c.id === where.id) || (where.userId && c.userId === where.userId));
      return comp || (mockDb.companies && mockDb.companies[0]) || null;
    },
    findMany: async () => {
      return mockDb.companies || [];
    },
    create: async ({ data }) => {
      const newComp = { id: `comp_${Date.now()}`, verified: false, ...data };
      if (!mockDb.companies) mockDb.companies = [];
      mockDb.companies.push(newComp);
      return newComp;
    },
    update: async ({ where, data }) => {
      const idx = (mockDb.companies || []).findIndex(c => (where.id && c.id === where.id) || (where.userId && c.userId === where.userId));
      if (idx !== -1) {
        Object.assign(mockDb.companies[idx], data);
        return mockDb.companies[idx];
      }
      return { id: where.id || "c_mock", ...data };
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
        mockDb.companies[idx] = {
          ...mockDb.companies[idx],
          ...data
        };
        return mockDb.companies[idx];
      }
      throw new Error("Company not found");
    }
  },
  job: {
    count: async (args = {}) => {
      let filtered = mockDb.jobs;
      if (args && args.where) {
        const { companyId, OR } = args.where;
        if (companyId) {
          filtered = filtered.filter(j => j.companyId === companyId);
        }
        if (OR) {
          filtered = filtered.filter(j => {
            return OR.some(clause => {
              if (clause.opportunityType === null) return j.opportunityType === null || j.opportunityType === undefined;
              if (clause.opportunityType && clause.opportunityType.not === 'GIG') return j.opportunityType !== 'GIG';
              return false;
            });
          });
        }
      }
      return filtered.length;
    },
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
          'openings', 'edited', 'activeDays', 'opportunityType', 'showSalary'
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
            return where.OR.some(cond => {
              if (cond.ownerId?.in) return cond.ownerId.in.includes(g.ownerId);
              if (cond.ownerId) return cond.ownerId === g.ownerId;
              if (cond.selectedCandidateId?.in) return cond.selectedCandidateId.in.includes(g.selectedCandidateId);
              if (cond.selectedCandidateId) return cond.selectedCandidateId === g.selectedCandidateId;
              if (cond.hiredCandidateIds?.hasSome) return cond.hiredCandidateIds.hasSome.some(id => (g.hiredCandidateIds || []).includes(id));
              if (cond.applicants?.some?.candidateId?.in) {
                const candApps = mockDb.gigApplicants.filter(a => a.gigId === g.id);
                return candApps.some(a => cond.applicants.some.candidateId.in.includes(a.candidateId));
              }
              return false;
            });
          });
        }
      }
      return result.map(g => {
        // Resolve owner details
        const ownerProfile = mockDb.profiles.find(p => p.userId === g.ownerId) || mockDb.profiles.find(p => p.id === g.ownerId);
        const ownerCompany = mockDb.companies.find(c => c.userId === g.ownerId) || mockDb.companies.find(c => c.id === g.ownerId);
        const ownerName = ownerProfile ? ownerProfile.name : (ownerCompany ? ownerCompany.name : "System User");
        const applicants = mockDb.gigApplicants.filter(a => a.gigId === g.id);
        return {
          ...g,
          applicants,
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
        const fields = ["status", "selectedCandidateId", "hiredCandidateIds", "title", "description", "budget", "currency", "deliveryTime", "attachments", "category", "categories", "skills", "requirements", "minRating", "logo"];
        fields.forEach(field => {
          if (data[field] !== undefined) {
            mockDb.gigs[idx][field] = data[field];
          }
        });
        return mockDb.gigs[idx];
      }
      throw new Error("Gig not found");
    },
    delete: async ({ where }) => {
      const idx = mockDb.gigs.findIndex(g => g.id === where.id);
      if (idx !== -1) {
        const deleted = mockDb.gigs[idx];
        mockDb.gigs.splice(idx, 1);
        mockDb.gigApplicants = mockDb.gigApplicants.filter(a => a.gigId !== where.id);
        mockDb.gigMessages = mockDb.gigMessages.filter(m => m.gigId !== where.id);
        mockDb.gigSubmissions = mockDb.gigSubmissions.filter(s => s.gigId !== where.id);
        mockDb.gigReviews = mockDb.gigReviews.filter(r => r.gigId !== where.id);
        return deleted;
      }
      throw new Error("Gig not found");
    },
    count: async (args = {}) => {
      let filtered = mockDb.gigs;
      if (args && args.where) {
        const { ownerId, status } = args.where;
        if (ownerId) {
          filtered = filtered.filter(g => g.ownerId === ownerId);
        }
        if (status) {
          filtered = filtered.filter(g => g.status === status);
        }
      }
      return filtered.length;
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
      if (where) {
        mockDb.gigApplicants = mockDb.gigApplicants.filter(a => {
          if (where.gigId && a.gigId !== where.gigId) return true;
          if (where.candidateId && a.candidateId !== where.candidateId) return true;
          return false;
        });
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
    findFirst: async ({ where }) => {
      return mockDb.gigSubmissions.find(s => s.gigId === where.gigId || s.id === where.id) || null;
    },
    findUnique: async ({ where }) => {
      return mockDb.gigSubmissions.find(s => s.gigId === where.gigId || s.id === where.id) || null;
    },
    update: async ({ where, data }) => {
      const idx = mockDb.gigSubmissions.findIndex(s => s.gigId === where.gigId || s.id === where.id);
      if (idx !== -1) {
        Object.assign(mockDb.gigSubmissions[idx], data);
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
  },
  skillDefinition: {
    findMany: async (args = {}) => {
      let rows = mockDb.skillDefinitions.filter(s => !s.deletedAt);
      if (args.orderBy && args.orderBy.canonicalName) {
        const dir = args.orderBy.canonicalName === 'desc' ? -1 : 1;
        rows = [...rows].sort((a, b) => a.canonicalName.localeCompare(b.canonicalName) * dir);
      }
      return rows;
    },
    findUnique: async ({ where }) => {
      const field = Object.keys(where)[0];
      return mockDb.skillDefinitions.find(s => s[field] === where[field]) || null;
    },
    count: async () => mockDb.skillDefinitions.length,
    create: async ({ data }) => {
      const row = {
        id: `sd_${Date.now()}_${mockDb.skillDefinitions.length}`,
        status: 'WAITING',
        aliases: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        ...data,
      };
      mockDb.skillDefinitions.push(row);
      return row;
    },
    update: async ({ where, data }) => {
      const idx = mockDb.skillDefinitions.findIndex(
        s => s.slug === where.slug || s.id === where.id
      );
      if (idx === -1) return null;
      mockDb.skillDefinitions[idx] = {
        ...mockDb.skillDefinitions[idx],
        ...data,
        updatedAt: new Date(),
      };
      return mockDb.skillDefinitions[idx];
    },
  },
  question: {
    // Supports where.skillName as a plain string or { equals, mode:'insensitive' }.
    findMany: async (args = {}) => {
      const where = args.where || {};
      let rows = mockDb.questions;
      if (where.skillName !== undefined) {
        const spec = where.skillName;
        if (spec && typeof spec === 'object') {
          const target = spec.equals;
          rows = spec.mode === 'insensitive'
            ? rows.filter(q => q.skillName.toLowerCase() === String(target).toLowerCase())
            : rows.filter(q => q.skillName === target);
        } else {
          rows = rows.filter(q => q.skillName === spec);
        }
      }
      if (where.status !== undefined) {
        const spec = where.status;
        if (spec && typeof spec === 'object' && 'not' in spec) rows = rows.filter(q => q.status !== spec.not);
        else rows = rows.filter(q => q.status === spec);
      }
      if (where.reviewState !== undefined) {
        rows = rows.filter(q => q.reviewState === where.reviewState);
      }
      return rows;
    },
    findUnique: async ({ where }) => mockDb.questions.find(q => q.id === where.id) || null,
    count: async (args = {}) => (await mockClient.question.findMany(args)).length,
    create: async ({ data }) => {
      const row = {
        id: `q_${Date.now()}_${mockDb.questions.length}`,
        difficulty: 'Medium', explanation: '', tags: [], version: 1, status: 'ACTIVE', reviewState: 'NONE',
        source: 'temp-bank-groq', usageCount: 0, correctCount: 0, wrongCount: 0, skipCount: 0,
        lastUsed: null, lastReviewed: null, lastRegenerated: null,
        createdAt: new Date(), updatedAt: new Date(),
        ...data,
      };
      mockDb.questions.push(row);
      return row;
    },
    createMany: async ({ data }) => {
      const rows = Array.isArray(data) ? data : [data];
      for (const d of rows) await mockClient.question.create({ data: d });
      return { count: rows.length };
    },
    update: async ({ where, data }) => {
      const row = mockDb.questions.find(q => q.id === where.id);
      if (!row) return null;
      return applyData(row, data);
    },
    updateMany: async ({ where = {}, data = {} }) => {
      const idIn = where.id && Array.isArray(where.id.in) ? new Set(where.id.in) : null;
      let count = 0;
      for (const q of mockDb.questions) {
        if (idIn && !idIn.has(q.id)) continue;
        if (where.skillName !== undefined && q.skillName !== where.skillName) continue;
        if (where.status !== undefined && q.status !== where.status) continue;
        applyData(q, data);
        count++;
      }
      return { count };
    },
    deleteMany: async (args = {}) => {
      const before = mockDb.questions.length;
      const where = args.where || {};
      if (where.skillName !== undefined) {
        mockDb.questions = mockDb.questions.filter(q => q.skillName !== where.skillName);
      } else {
        mockDb.questions = [];
      }
      return { count: before - mockDb.questions.length };
    },
  },
  testSession: {
    create: async ({ data }) => {
      const row = { id: `ts_${Date.now()}_${mockDb.testSessions.length}`, used: false, score: null, passed: null, createdAt: new Date(), ...data };
      mockDb.testSessions.push(row);
      return row;
    },
    findUnique: async ({ where }) => mockDb.testSessions.find(t => t.id === where.id) || null,
    update: async ({ where, data }) => {
      const idx = mockDb.testSessions.findIndex(t => t.id === where.id);
      if (idx === -1) return null;
      mockDb.testSessions[idx] = { ...mockDb.testSessions[idx], ...data };
      return mockDb.testSessions[idx];
    },
  },
  assessmentRecord: {
    create: async ({ data }) => {
      const row = { id: `ar_${Date.now()}_${mockDb.assessmentRecords.length}`, createdAt: new Date(), ...data };
      mockDb.assessmentRecords.push(row);
      return row;
    },
    findMany: async ({ where = {} } = {}) => {
      let rows = mockDb.assessmentRecords;
      if (where.candidateId !== undefined) rows = rows.filter(r => r.candidateId === where.candidateId);
      if (where.skill !== undefined) rows = rows.filter(r => r.skill === where.skill);
      return rows;
    },
    count: async (args = {}) => (await mockClient.assessmentRecord.findMany(args)).length,
  },
  skillRoadmap: {
    findMany: async (args = {}) => {
      let rows = mockDb.skillRoadmaps;
      const where = args.where || {};
      if (where.skillName !== undefined) rows = rows.filter(r => r.skillName === where.skillName);
      if (args.orderBy && args.orderBy.popularityRank) {
        const dir = args.orderBy.popularityRank === 'desc' ? -1 : 1;
        rows = [...rows].sort((a, b) => (a.popularityRank - b.popularityRank) * dir);
      }
      return rows;
    },
    findUnique: async ({ where }) => {
      const field = Object.keys(where)[0];
      return mockDb.skillRoadmaps.find(r => r[field] === where[field]) || null;
    },
    count: async (args = {}) => (await mockClient.skillRoadmap.findMany(args)).length,
    create: async ({ data }) => {
      const row = { id: `sr_${Date.now()}_${mockDb.skillRoadmaps.length}`, createdAt: new Date(), updatedAt: new Date(), ...data };
      mockDb.skillRoadmaps.push(row);
      return row;
    },
    upsert: async ({ where, create, update }) => {
      const idx = mockDb.skillRoadmaps.findIndex(r => r.skillName === where.skillName || r.id === where.id);
      if (idx === -1) return mockClient.skillRoadmap.create({ data: create });
      mockDb.skillRoadmaps[idx] = { ...mockDb.skillRoadmaps[idx], ...update, updatedAt: new Date() };
      return mockDb.skillRoadmaps[idx];
    },
    deleteMany: async (args = {}) => {
      const before = mockDb.skillRoadmaps.length;
      const where = args.where || {};
      if (where.skillName !== undefined) {
        mockDb.skillRoadmaps = mockDb.skillRoadmaps.filter(r => r.skillName !== where.skillName);
      } else {
        mockDb.skillRoadmaps = [];
      }
      return { count: before - mockDb.skillRoadmaps.length };
    },
  },
  community: {
    findFirst: async ({ where = {} }) => {
      return mockDb.communities.find(c => {
        if (where.type && c.type !== where.type) return false;
        if (where.deleted !== undefined && c.deleted !== where.deleted) return false;
        return true;
      }) || null;
    },
    findUnique: async ({ where }) => mockDb.communities.find(c => c.id === where.id) || null,
    findMany: async (args = {}) => {
      let items = mockDb.communities;
      const where = args.where || {};
      if (where.deleted !== undefined) items = items.filter(c => c.deleted === where.deleted);
      if (where.id && where.id.in) items = items.filter(c => where.id.in.includes(c.id));
      if (where.type) items = items.filter(c => c.type === where.type);
      if (where.OR) {
        items = items.filter(c => {
          return where.OR.some(cond => {
            if (cond.name && cond.name.contains) {
              return (c.name || '').toLowerCase().includes(cond.name.contains.toLowerCase());
            }
            if (cond.description && cond.description.contains) {
              return (c.description || '').toLowerCase().includes(cond.description.contains.toLowerCase());
            }
            return false;
          });
        });
      }
      if (args.skip !== undefined || args.take !== undefined) {
        const start = args.skip || 0;
        const end = args.take ? start + args.take : items.length;
        items = items.slice(start, end);
      }
      return items;
    },
    count: async (args = {}) => (await mockClient.community.findMany(args)).length,
    create: async ({ data }) => {
      const comm = { id: data.id || `comm_${Date.now()}_${mockDb.communities.length}`, createdAt: new Date(), updatedAt: new Date(), deleted: false, ...data };
      mockDb.communities.push(comm);
      return comm;
    },
    update: async ({ where, data }) => {
      const idx = mockDb.communities.findIndex(c => c.id === where.id);
      if (idx === -1) return null;
      mockDb.communities[idx] = { ...mockDb.communities[idx], ...data, updatedAt: new Date() };
      return mockDb.communities[idx];
    }
  },
  communityMember: {
    findUnique: async ({ where }) => {
      if (where.communityId_userId) {
        const { communityId, userId } = where.communityId_userId;
        return mockDb.communityMembers.find(m => m.communityId === communityId && m.userId === userId) || null;
      }
      return mockDb.communityMembers.find(m => m.id === where.id) || null;
    },
    findMany: async ({ where = {} }) => {
      let items = mockDb.communityMembers;
      if (where.userId) items = items.filter(m => m.userId === where.userId);
      if (where.communityId) items = items.filter(m => m.communityId === where.communityId);
      return items;
    },
    create: async ({ data }) => {
      const mem = { id: `cm_${Date.now()}_${mockDb.communityMembers.length}`, joinedAt: new Date(), updatedAt: new Date(), ...data };
      mockDb.communityMembers.push(mem);
      return mem;
    }
  },
  communityInvite: {
    findUnique: async ({ where }) => mockDb.communityInvites.find(i => i.token === where.token || i.id === where.id) || null,
    create: async ({ data }) => {
      const inv = { id: `ci_${Date.now()}_${mockDb.communityInvites.length}`, createdAt: new Date(), ...data };
      mockDb.communityInvites.push(inv);
      return inv;
    },
    update: async ({ where, data }) => {
      const idx = mockDb.communityInvites.findIndex(i => i.id === where.id);
      if (idx === -1) return null;
      mockDb.communityInvites[idx] = { ...mockDb.communityInvites[idx], ...data };
      return mockDb.communityInvites[idx];
    }
  },
  post: {
    findUnique: async ({ where }) => mockDb.posts.find(p => p.id === where.id) || null,
    findMany: async (args = {}) => {
      let items = mockDb.posts;
      const where = args.where || {};
      if (where.deleted !== undefined) items = items.filter(p => p.deleted === where.deleted);
      if (where.communityId) items = items.filter(p => p.communityId === where.communityId);
      if (where.id && where.id.in) items = items.filter(p => where.id.in.includes(p.id));
      if (where.authorId) items = items.filter(p => p.authorId === where.authorId);
      if (args.orderBy && args.orderBy.createdAt === 'desc') {
        items = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      if (args.skip !== undefined || args.take !== undefined) {
        const start = args.skip || 0;
        const end = args.take ? start + args.take : items.length;
        items = items.slice(start, end);
      }
      return items;
    },
    count: async (args = {}) => (await mockClient.post.findMany(args)).length,
    create: async ({ data }) => {
      const post = { id: `post_${Date.now()}_${mockDb.posts.length}`, edited: false, deleted: false, createdAt: new Date(), updatedAt: new Date(), ...data };
      mockDb.posts.push(post);
      return post;
    },
    update: async ({ where, data }) => {
      const idx = mockDb.posts.findIndex(p => p.id === where.id);
      if (idx === -1) return null;
      mockDb.posts[idx] = { ...mockDb.posts[idx], ...data, updatedAt: new Date() };
      return mockDb.posts[idx];
    }
  },
  media: {
    findMany: async ({ where = {} }) => {
      let items = mockDb.medias;
      if (where.postId && where.postId.in) items = items.filter(m => where.postId.in.includes(m.postId));
      else if (where.postId) items = items.filter(m => m.postId === where.postId);
      return items;
    },
    create: async ({ data }) => {
      const item = { id: `med_${Date.now()}_${mockDb.medias.length}`, createdAt: new Date(), ...data };
      mockDb.medias.push(item);
      return item;
    }
  },
  postReaction: {
    findUnique: async ({ where }) => {
      if (where.postId_userId) {
        const { postId, userId } = where.postId_userId;
        return mockDb.postReactions.find(r => r.postId === postId && r.userId === userId) || null;
      }
      return mockDb.postReactions.find(r => r.id === where.id) || null;
    },
    findMany: async ({ where = {} }) => {
      let items = mockDb.postReactions;
      if (where.postId && where.postId.in) items = items.filter(r => where.postId.in.includes(r.postId));
      else if (where.postId) items = items.filter(r => r.postId === where.postId);
      return items;
    },
    create: async ({ data }) => {
      const r = { id: `react_${Date.now()}_${mockDb.postReactions.length}`, createdAt: new Date(), ...data };
      mockDb.postReactions.push(r);
      return r;
    },
    update: async ({ where, data }) => {
      const idx = mockDb.postReactions.findIndex(r => r.id === where.id);
      if (idx === -1) return null;
      mockDb.postReactions[idx] = { ...mockDb.postReactions[idx], ...data };
      return mockDb.postReactions[idx];
    },
    delete: async ({ where }) => {
      const idx = mockDb.postReactions.findIndex(r => r.id === where.id);
      if (idx !== -1) mockDb.postReactions.splice(idx, 1);
      return { count: 1 };
    }
  },
  postComment: {
    findUnique: async ({ where }) => mockDb.postComments.find(c => c.id === where.id) || null,
    findMany: async ({ where = {}, orderBy }) => {
      let items = mockDb.postComments;
      if (where.deleted !== undefined) items = items.filter(c => c.deleted === where.deleted);
      if (where.postId && where.postId.in) items = items.filter(c => where.postId.in.includes(c.postId));
      else if (where.postId) items = items.filter(c => c.postId === where.postId);
      if (orderBy && orderBy.createdAt === 'asc') {
        items = [...items].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }
      return items;
    },
    count: async ({ where = {} }) => (await mockClient.postComment.findMany({ where })).length,
    create: async ({ data }) => {
      const comm = { id: `cmt_${Date.now()}_${mockDb.postComments.length}`, deleted: false, createdAt: new Date(), ...data };
      mockDb.postComments.push(comm);
      return comm;
    },
    update: async ({ where, data }) => {
      const idx = mockDb.postComments.findIndex(c => c.id === where.id);
      if (idx === -1) return null;
      mockDb.postComments[idx] = { ...mockDb.postComments[idx], ...data };
      return mockDb.postComments[idx];
    }
  },
  savedPost: {
    findUnique: async ({ where }) => {
      if (where.userId_postId) {
        const { userId, postId } = where.userId_postId;
        return mockDb.savedPosts.find(s => s.userId === userId && s.postId === postId) || null;
      }
      return mockDb.savedPosts.find(s => s.id === where.id) || null;
    },
    findMany: async (args = {}) => {
      let items = mockDb.savedPosts;
      const where = args.where || {};
      if (where.userId) items = items.filter(s => s.userId === where.userId);
      if (where.postId && where.postId.in) items = items.filter(s => where.postId.in.includes(s.postId));
      if (args.skip !== undefined || args.take !== undefined) {
        const start = args.skip || 0;
        const end = args.take ? start + args.take : items.length;
        items = items.slice(start, end);
      }
      return items;
    },
    count: async (args = {}) => (await mockClient.savedPost.findMany(args)).length,
    create: async ({ data }) => {
      const sp = { id: `sp_${Date.now()}_${mockDb.savedPosts.length}`, createdAt: new Date(), ...data };
      mockDb.savedPosts.push(sp);
      return sp;
    },
    delete: async ({ where }) => {
      const idx = mockDb.savedPosts.findIndex(s => s.id === where.id);
      if (idx !== -1) mockDb.savedPosts.splice(idx, 1);
      return { count: 1 };
    }
  },
  postView: {
    findUnique: async ({ where }) => {
      if (where.postId_userId) {
        const { postId, userId } = where.postId_userId;
        return mockDb.postViews.find(v => v.postId === postId && v.userId === userId) || null;
      }
      return mockDb.postViews.find(v => v.id === where.id) || null;
    },
    findMany: async ({ where = {} }) => {
      let items = mockDb.postViews;
      if (where.postId && where.postId.in) items = items.filter(v => where.postId.in.includes(v.postId));
      else if (where.postId) items = items.filter(v => v.postId === where.postId);
      return items;
    },
    create: async ({ data }) => {
      const pv = { id: `pv_${Date.now()}_${mockDb.postViews.length}`, createdAt: new Date(), ...data };
      mockDb.postViews.push(pv);
      return pv;
    }
  }
};

module.exports = { mockClient };
