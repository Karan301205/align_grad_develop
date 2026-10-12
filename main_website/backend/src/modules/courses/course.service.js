const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { prisma } = require('../../infrastructure/database');
const { s3Client } = require('../../infrastructure/storage/s3');
const env = require('../../config/env');

// CloudFront Configuration
const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN || 'd196khuol4mb2t.cloudfront.net';
const cloudfrontKeyId = process.env.CLOUDFRONT_KEY_ID || 'K78O8J06YP3GV';
const configuredPrivateKeyPath = process.env.CLOUDFRONT_PRIVATE_KEY_PATH || '../../cloudfront_private_key.pem';

let cachedPrivateKey = null;

function getPrivateKey() {
  if (cachedPrivateKey) return cachedPrivateKey;

  // Try configured path relative to project root or backend
  const candidates = [
    path.resolve(__dirname, '../../..', configuredPrivateKeyPath),
    path.resolve(__dirname, '../../../..', 'cloudfront_private_key.pem'),
    path.resolve(process.cwd(), 'cloudfront_private_key.pem'),
    path.resolve(process.cwd(), '../cloudfront_private_key.pem'),
    path.resolve(process.cwd(), '../../cloudfront_private_key.pem')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        cachedPrivateKey = fs.readFileSync(candidate, 'utf8');
        return cachedPrivateKey;
      } catch (e) {
        console.warn(`[CloudFront] Could not read private key from ${candidate}:`, e.message);
      }
    }
  }

  return null;
}

function toBase64Url(str) {
  return str.replace(/\+/g, '-').replace(/=/g, '_').replace(/\//g, '~');
}

/**
 * Generates a signed CloudFront playback URL for a given S3 video key.
 * @param {string} videoKey S3 object key
 * @param {number} expiresInSeconds Lifetime in seconds (default 4 hours)
 */
function getCloudFrontSignedUrl(videoKey, expiresInSeconds = 4 * 3600) {
  if (!videoKey) return null;

  // Clean key in case it includes leading slashes or full URL
  let cleanKey = videoKey.replace(/^https?:\/\/[^/]+\//, '').replace(/^\/+/, '');
  const targetUrl = `https://${cloudfrontDomain}/${cleanKey}`;
  const expiresEpoch = Math.floor((Date.now() + expiresInSeconds * 1000) / 1000);

  const privateKey = getPrivateKey();
  if (!privateKey || !cloudfrontKeyId) {
    console.warn('[CloudFront Warning] Private key or Key-Pair-Id missing, falling back to unsigned URL');
    return targetUrl;
  }

  try {
    const cannedPolicy = JSON.stringify({
      Statement: [
        {
          Resource: targetUrl,
          Condition: {
            DateLessThan: {
              'AWS:EpochTime': expiresEpoch
            }
          }
        }
      ]
    });

    const sign = crypto.createSign('RSA-SHA1');
    sign.update(cannedPolicy);
    const signature = toBase64Url(sign.sign(privateKey, 'base64'));

    return `${targetUrl}?Expires=${expiresEpoch}&Signature=${signature}&Key-Pair-Id=${cloudfrontKeyId}`;
  } catch (err) {
    console.error('[CloudFront Signer Error]:', err.message);
    return targetUrl;
  }
}

/**
 * Generates a presigned S3 PUT URL for uploading course videos or thumbnails.
 */
async function getUploadPresignedUrl(fileName, contentType, folder = 'courses') {
  const fileExt = path.extname(fileName) || '';
  const uniqueName = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${fileExt}`;
  const bucket = env.S3_BUCKET_NAME || 'aligngrade-storage-2026';

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: uniqueName,
    ContentType: contentType
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 }); // 10 minutes
  return {
    uploadUrl,
    key: uniqueName,
    bucket
  };
}

/**
 * Seed or normalize courses in the database
 */
async function ensureSampleCourse() {
  try {
    const raw = await prisma.$runCommandRaw({ find: 'Course', filter: {} });
    const docs = raw.cursor?.firstBatch || [];

    if (docs.length === 0) {
      await prisma.course.create({
        data: {
          title: "Entrepreneurship & Career Growth",
          description: "Master modern venture creation, procedure models, and enterprise problem-solving to fast-track your professional journey.",
          category: "Business & Career",
          instructor: "Dr. K. S. Sharma",
          thumbnailUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80",
          isPublished: true,
          tags: ["Entrepreneurship", "Strategy", "Leadership"],
          modules: [
            {
              id: "mod-0",
              title: "Week 0: Orientation & Course Prerequisites",
              order: 0,
              lessons: [
                {
                  id: "les-0",
                  title: "Course Overview & Learning Objectives",
                  subTopic: "Orientation & Methodology",
                  description: "Welcome to Entrepreneurship & Career Growth. Review the course syllabus, practical frameworks, and grading methodology.",
                  videoKey: "courses/sample-intro.mp4",
                  duration: "06:15",
                  notes: "Welcome to the course! In this introductory session, we outline the semester framework, key deliverables, and entrepreneurial mindset models.",
                  order: 1
                }
              ]
            },
            {
              id: "mod-1",
              title: "Week 1: Fundamentals of Venture Ideation",
              order: 1,
              lessons: [
                {
                  id: "les-1",
                  title: "Entrepreneurship: An overview (1)",
                  subTopic: "Entrepreneurship: An overview",
                  description: "Understanding the core tenets of modern venture initiation, founder resilience, and market opportunity recognition.",
                  videoKey: "courses/sample-intro.mp4",
                  duration: "12:45",
                  notes: `Core Lecture Notes — Entrepreneurship: An Overview (1)

1. Executive Summary:
   Entrepreneurship is defined as the process of designing, launching and managing a new business venture while navigating inherent market uncertainties.

2. Opportunity Recognition:
   - Identify authentic customer friction points.
   - Screen for structural market shifts, regulatory developments, and emerging technological capabilities.

3. Founder Mindset:
   - Calculated risk management over reckless speculation.
   - Rapid iteration cycles driven by continuous customer validation.`,
                  documentName: "Entrepreneurship_Foundations_Framework.pdf",
                  documentUrl: "https://aligngrade-storage-2026.s3.ap-south-1.amazonaws.com/course-documents/sample-guide.pdf",
                  quiz: {
                    title: "Quiz: Week 01: Assignment 01",
                    questions: [
                      {
                        question: "What is the primary objective of opportunity recognition in venture creation?",
                        options: [
                          "Copying existing competitors' pricing exactly",
                          "Discovering genuine unmet customer pain points and scalable market inefficiencies",
                          "Borrowing high-interest capital before market validation",
                          "Purchasing domain names without customer interviews"
                        ],
                        correctAnswer: 1,
                        explanation: "Opportunity recognition centers on discovering genuine unmet customer needs and scalable market inefficiencies before committing capital."
                      },
                      {
                        question: "How should an early-stage founder approach calculated risk?",
                        options: [
                          "Avoid making any strategic decisions until market conditions are 100% predictable",
                          "Limit downside exposure while structuring validated experiments for asymmetric upside",
                          "Invest all liquid assets into advertising prior to customer problem validation",
                          "Rely solely on secondary survey reports without speaking to buyers"
                        ],
                        correctAnswer: 1,
                        explanation: "Calculated risk involves limiting downside exposure while maintaining significant upside through staged, hypothesis-driven testing."
                      },
                      {
                        question: "What is the most crucial first step in the lean venture creation process?",
                        options: [
                          "Filing incorporation paperwork and signing commercial leases",
                          "Developing full-scale manufacturing before validating demand",
                          "Validating problem-solution hypotheses with real prospective customers",
                          "Hiring an agency for brand PR and social media buzz"
                        ],
                        correctAnswer: 2,
                        explanation: "Validating the core problem with prospective customers ensures founders do not waste resources building products nobody wants."
                      }
                    ]
                  },
                  order: 1
                },
                {
                  id: "les-2",
                  title: "Procedures and Models for Entrepreneurial Endevours (1)",
                  subTopic: "Procedures and Models for Entrepreneurial Endevours",
                  description: "Stage-gate frameworks for screening business opportunities and analyzing operational feasibility models.",
                  videoKey: "courses/sample-models-1.mp4",
                  duration: "18:20",
                  notes: `Lecture Notes — Procedures and Models (Part 1)

• Stage-Gate Analysis: Discovery Gate, Scoping Gate, Business Case Validation.
• The 5-Point Feasibility Matrix: Technical, Economic, Legal, Operational, Schedule.
• Structuring hypothesis tests for customer demand signals.`,
                  documentName: "Stage_Gate_Feasibility_Matrix.pdf",
                  documentUrl: "https://aligngrade-storage-2026.s3.ap-south-1.amazonaws.com/course-documents/sample-guide.pdf",
                  order: 2
                },
                {
                  id: "les-3",
                  title: "Procedures and Models for Entrepreneurial Endevours (2)",
                  subTopic: "Procedures and Models for Entrepreneurial Endevours",
                  description: "Advanced operational models, supply chain orchestration, and scaling risk mitigation.",
                  videoKey: "courses/sample-models-2.mp4",
                  duration: "15:30",
                  notes: `Lecture Notes — Procedures and Models (Part 2)

• Unit economics modeling: Contribution Margin, Gross Margin, and Variable Costs.
• Supply chain redundancy and working capital buffers.
• Key performance indicators (KPIs) for early traction.`,
                  order: 3
                },
                {
                  id: "les-4",
                  title: "Steps to start a small business (1)",
                  subTopic: "Steps to start a small business",
                  description: "Entity selection, legal compliance, early licensing, and founding team capitalization.",
                  videoKey: "courses/sample-steps.mp4",
                  duration: "21:10",
                  notes: `Lecture Notes — Steps to Start a Small Business (Part 1)

1. Choosing an entity structure (Proprietorship, LLP, Pvt Ltd / LLC).
2. Tax registration (GST, PAN, TAN) and regulatory filings.
3. Bank commercial accounts and authorized signatory protocols.`,
                  order: 4
                },
                {
                  id: "les-5",
                  title: "Steps to start a small business (2)",
                  subTopic: "Steps to start a small business",
                  description: "Operational setup, vendor contracting, early bookkeeping, and customer onboarding.",
                  videoKey: "courses/sample-steps.mp4",
                  duration: "19:40",
                  notes: `Lecture Notes — Steps to Start a Small Business (Part 2)

1. Vendor agreement checklists: Indemnity, SLAs, payment cycles.
2. Invoicing setup, receivables tracking, and baseline financial hygiene.
3. Onboarding your initial cohort of pilot customers.`,
                  order: 5
                }
              ]
            },
            {
              id: "mod-2",
              title: "Week 2: Customer Discovery & Market Validation",
              order: 2,
              lessons: [
                {
                  id: "les-6",
                  title: "Conducting Actionable Customer Interviews",
                  subTopic: "Customer Discovery Techniques",
                  description: "How to avoid confirmation bias and validate product-market fit with customer problem interviews.",
                  videoKey: "courses/sample-interviews.mp4",
                  duration: "14:50",
                  notes: "Key takeaways: Never ask would you buy this. Ask about their past actual expenditures and recent workarounds.",
                  order: 1
                },
                {
                  id: "les-7",
                  title: "Unit Economics and Financial Modeling",
                  subTopic: "Financial Modeling",
                  description: "CAC, LTV, Gross Margins and realistic cash runway forecasting.",
                  videoKey: "courses/sample-economics.mp4",
                  duration: "19:15",
                  notes: "LTV/CAC ratio benchmark: Minimum 3x for sustainable venture viability.",
                  order: 2
                }
              ]
            }
          ]
        }
      });
      console.log('[Courses] Seeded initial sample course successfully.');
    } else {
      // Normalize any courses missing modules or subTopics
      for (const doc of docs) {
        const id = doc._id?.$oid || doc.id;
        const currentModules = doc.modules && doc.modules.length > 0 ? doc.modules : [];
        let needsUpdate = false;

        if (currentModules.length === 0 && Array.isArray(doc.lessons) && doc.lessons.length > 0) {
          needsUpdate = true;
          const sectionMap = {};
          doc.lessons.forEach((les, idx) => {
            const sec = les.sectionTitle || 'Course Overview & Lectures';
            if (!sectionMap[sec]) sectionMap[sec] = [];
            
            let videoKey = les.storageKey || null;
            if (!videoKey && les.videoUrl && les.videoUrl.includes('aligngrade-storage')) {
              videoKey = les.videoUrl.split('.amazonaws.com/')[1] || null;
            }

            sectionMap[sec].push({
              id: les.id || `les_${idx}`,
              title: les.title || `Lesson ${idx + 1}`,
              subTopic: les.subTopic || les.title || '',
              description: les.description || '',
              videoKey: videoKey || '',
              videoUrl: les.videoUrl || null,
              duration: les.duration || '15:00',
              notes: les.notes || '',
              documentUrl: les.documentUrl || null,
              documentName: les.documentName || null,
              quiz: les.quiz || null,
              order: les.order || (idx + 1)
            });
          });

          let modOrder = 1;
          for (const [title, lessons] of Object.entries(sectionMap)) {
            currentModules.push({
              id: `mod_${modOrder}`,
              title,
              order: modOrder++,
              lessons
            });
          }
        } else if (currentModules.length > 0) {
          // Check if existing lessons lack subTopic or sample quiz
          currentModules.forEach(mod => {
            (mod.lessons || []).forEach(les => {
              if (!les.subTopic && les.title) {
                les.subTopic = les.title.replace(/\s*\(\d+\)$/, '');
                needsUpdate = true;
              }
              if (les.id === 'les-1' && !les.quiz) {
                les.quiz = {
                  title: "Quiz: Week 01: Assignment 01",
                  questions: [
                    {
                      question: "What is the primary objective of opportunity recognition in venture creation?",
                      options: [
                        "Copying existing competitors' pricing exactly",
                        "Discovering genuine unmet customer pain points and scalable market inefficiencies",
                        "Borrowing high-interest capital before market validation",
                        "Purchasing domain names without customer interviews"
                      ],
                      correctAnswer: 1,
                      explanation: "Opportunity recognition centers on discovering genuine unmet customer needs and scalable market inefficiencies before committing capital."
                    },
                    {
                      question: "How should an early-stage founder approach calculated risk?",
                      options: [
                        "Avoid making any strategic decisions until market conditions are 100% predictable",
                        "Limit downside exposure while structuring validated experiments for asymmetric upside",
                        "Invest all liquid assets into advertising prior to customer problem validation",
                        "Rely solely on secondary survey reports without speaking to buyers"
                      ],
                      correctAnswer: 1,
                      explanation: "Calculated risk involves limiting downside exposure while maintaining significant upside through staged, hypothesis-driven testing."
                    }
                  ]
                };
                if (!les.notes) {
                  les.notes = "Core Lecture Notes — Entrepreneurship: An Overview\n\n1. Venture Foundations: Defining entrepreneurial risk, market orientation, and opportunity capture.\n2. Customer Empathy: Identifying pain points before architecting features.\n3. Scalability: Unit economics that expand margins with transaction volume.";
                }
                if (!les.documentName) {
                  les.documentName = "Entrepreneurship_Foundations_Framework.pdf";
                  les.documentUrl = "https://aligngrade-storage-2026.s3.ap-south-1.amazonaws.com/course-documents/sample-guide.pdf";
                }
                needsUpdate = true;
              }
            });
          });
        }

        if (needsUpdate) {
          await prisma.course.update({
            where: { id },
            data: {
              isPublished: true,
              thumbnailUrl: doc.thumbnailUrl || doc.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
              modules: currentModules
            }
          });
        }
      }
    }
  } catch (e) {
    console.warn('[Courses] Notice in course normalization:', e.message);
  }
}

// Auto-run ensureSampleCourse on startup
setTimeout(ensureSampleCourse, 2000);

module.exports = {
  getCloudFrontSignedUrl,
  getUploadPresignedUrl,
  ensureSampleCourse,

  // Student methods
  async listCourses(filter = {}) {
    const where = {};
    if (filter.category && filter.category !== 'All') {
      where.category = filter.category;
    }
    const courses = await prisma.course.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    // Filter out unpublished if explicitly marked false
    return courses.filter(c => c.isPublished !== false);
  },

  async getCourseById(id, userId = null) {
    const course = await prisma.course.findUnique({
      where: { id }
    });
    if (!course) return null;

    let enrollment = null;
    if (userId) {
      enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: id
          }
        }
      });
    }

    return {
      ...course,
      enrollment: enrollment || { completedLessonIds: [], lastAccessedLessonId: null }
    };
  },

  async getLessonStreamUrl(courseId, lessonId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });
    if (!course) throw new Error('Course not found');

    let targetLesson = null;
    for (const mod of (course.modules || [])) {
      const match = (mod.lessons || []).find(l => l.id === lessonId);
      if (match) {
        targetLesson = match;
        break;
      }
    }

    if (!targetLesson) throw new Error('Lesson not found');

    let signedUrl = null;
    if (targetLesson.videoKey && targetLesson.videoKey.trim() !== '') {
      signedUrl = getCloudFrontSignedUrl(targetLesson.videoKey);
    } else if (targetLesson.videoUrl) {
      if (targetLesson.videoUrl.includes('aligngrade-storage')) {
        const key = targetLesson.videoUrl.split('.amazonaws.com/')[1];
        if (key) {
          signedUrl = getCloudFrontSignedUrl(key);
        } else {
          signedUrl = targetLesson.videoUrl;
        }
      } else {
        signedUrl = targetLesson.videoUrl;
      }
    }

    return {
      lesson: targetLesson,
      streamUrl: signedUrl,
      cloudfrontDomain
    };
  },

  async markLessonProgress(userId, courseId, lessonId) {
    const enrollment = await prisma.courseEnrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      create: {
        userId,
        courseId,
        completedLessonIds: [lessonId],
        lastAccessedLessonId: lessonId
      },
      update: {
        lastAccessedLessonId: lessonId
      }
    });

    const currentCompleted = enrollment.completedLessonIds || [];
    if (!currentCompleted.includes(lessonId)) {
      return prisma.courseEnrollment.update({
        where: { id: enrollment.id },
        data: {
          completedLessonIds: [...currentCompleted, lessonId],
          lastAccessedLessonId: lessonId
        }
      });
    }

    return enrollment;
  },

  // Admin methods
  async listAdminCourses() {
    return prisma.course.findMany({
      orderBy: { createdAt: 'desc' }
    });
  },

  async createCourse(data) {
    return prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category || 'General',
        instructor: data.instructor || 'AlignGrade Instructor',
        thumbnailUrl: data.thumbnailUrl || null,
        thumbnailKey: data.thumbnailKey || null,
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
        tags: data.tags || [],
        modules: data.modules || []
      }
    });
  },

  async updateCourse(id, data) {
    return prisma.course.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  },

  async deleteCourse(id) {
    return prisma.course.delete({
      where: { id }
    });
  },

  async addModule(courseId, { title, order }) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error('Course not found');

    const modules = course.modules || [];
    const newModule = {
      id: `mod-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      title: title || `Module ${modules.length + 1}`,
      order: order !== undefined ? order : modules.length + 1,
      lessons: []
    };

    modules.push(newModule);
    return prisma.course.update({
      where: { id: courseId },
      data: { modules }
    });
  },

  async updateModule(courseId, moduleId, { title, order }) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error('Course not found');

    const modules = (course.modules || []).map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          ...(title !== undefined && { title }),
          ...(order !== undefined && { order })
        };
      }
      return m;
    });

    return prisma.course.update({
      where: { id: courseId },
      data: { modules }
    });
  },

  async deleteModule(courseId, moduleId) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error('Course not found');

    const modules = (course.modules || []).filter(m => m.id !== moduleId);
    return prisma.course.update({
      where: { id: courseId },
      data: { modules }
    });
  },

  async addLesson(courseId, moduleId, lessonData) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error('Course not found');

    const modules = (course.modules || []).map(m => {
      if (m.id === moduleId) {
        const lessons = m.lessons || [];
        const newLesson = {
          id: `les-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          title: lessonData.title || `Lesson ${lessons.length + 1}`,
          description: lessonData.description || '',
          videoKey: lessonData.videoKey,
          videoUrl: lessonData.videoUrl || null,
          duration: lessonData.duration || '10:00',
          order: lessonData.order !== undefined ? lessonData.order : lessons.length + 1
        };
        return {
          ...m,
          lessons: [...lessons, newLesson]
        };
      }
      return m;
    });

    return prisma.course.update({
      where: { id: courseId },
      data: { modules }
    });
  },

  async updateLesson(courseId, moduleId, lessonId, lessonData) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error('Course not found');

    const modules = (course.modules || []).map(m => {
      if (m.id === moduleId) {
        const lessons = (m.lessons || []).map(l => {
          if (l.id === lessonId) {
            return {
              ...l,
              ...lessonData
            };
          }
          return l;
        });
        return {
          ...m,
          lessons
        };
      }
      return m;
    });

    return prisma.course.update({
      where: { id: courseId },
      data: { modules }
    });
  },

  async deleteLesson(courseId, moduleId, lessonId) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error('Course not found');

    const modules = (course.modules || []).map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: (m.lessons || []).filter(l => l.id !== lessonId)
        };
      }
      return m;
    });

    return prisma.course.update({
      where: { id: courseId },
      data: { modules }
    });
  }
};
