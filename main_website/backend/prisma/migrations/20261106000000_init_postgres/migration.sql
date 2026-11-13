-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "regNo" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMPTZ(3),
    "resetPasswordAttempts" INTEGER DEFAULT 0,
    "resetPasswordWindow" TIMESTAMPTZ(3),
    "emailVerified" BOOLEAN DEFAULT false,
    "verificationPinHash" TEXT,
    "verificationPinExpiry" TIMESTAMPTZ(3),
    "verificationAttempts" INTEGER DEFAULT 0,
    "verificationResends" INTEGER DEFAULT 0,
    "lastVerificationSent" TIMESTAMPTZ(3),
    "pendingName" TEXT,
    "pendingPasswordHash" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "planPurchasedAt" TIMESTAMPTZ(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT,
    "profilePic" TEXT,
    "resumeUrl" TEXT,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "bio" TEXT,
    "nationality" TEXT,
    "gender" TEXT,
    "email" TEXT,
    "dob" TEXT,
    "phone" TEXT,
    "socialLinks" JSONB,
    "education" JSONB NOT NULL DEFAULT '[]',
    "experience" JSONB NOT NULL DEFAULT '[]',
    "certificates" JSONB NOT NULL DEFAULT '[]',
    "projects" JSONB NOT NULL DEFAULT '[]',
    "cocurricular" JSONB NOT NULL DEFAULT '[]',
    "introVideoUrl" TEXT,
    "isOnboarded" BOOLEAN DEFAULT false,
    "preferredWorkModes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredWorkTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "openToAnyLocation" BOOLEAN DEFAULT false,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "industry" TEXT,
    "companySize" TEXT,
    "website" TEXT,
    "location" TEXT,
    "foundedYear" TEXT,
    "officialEmail" TEXT,
    "recruiterName" TEXT,
    "recruiterDesignation" TEXT,
    "socialLinks" JSONB,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "docUrl" TEXT,
    "verificationDocs" JSONB NOT NULL DEFAULT '[]',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT,
    "verificationNote" TEXT,
    "verificationSubmittedAt" TIMESTAMPTZ(3),
    "verificationReviewedAt" TIMESTAMPTZ(3),
    "verificationReviewedBy" TEXT,
    "jobPostingQuota" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "companyName" TEXT,
    "opportunityType" TEXT DEFAULT 'JOB',
    "workMode" TEXT DEFAULT 'Work from office',
    "status" TEXT DEFAULT 'ACTIVE',
    "isPaused" BOOLEAN DEFAULT false,
    "officialWebsite" TEXT,
    "preferredEducation" TEXT,
    "desiredExperience" TEXT,
    "designation" TEXT,
    "stipendPartTime" TEXT,
    "stipendFullTime" TEXT,
    "duration" TEXT,
    "roleResponsibilities" TEXT,
    "location" TEXT,
    "locationUrl" TEXT,
    "edited" BOOLEAN DEFAULT false,
    "activeDays" INTEGER DEFAULT 30,
    "joiningMonth" TEXT,
    "showSalary" BOOLEAN DEFAULT true,
    "openings" INTEGER,
    "selectionProcess" JSONB NOT NULL DEFAULT '[]',
    "requirements" JSONB NOT NULL DEFAULT '[]',
    "screeningQuestions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "jobId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "roundStatuses" JSONB NOT NULL DEFAULT '[]',
    "answers" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestAttempt" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "profileId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gig" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skills" TEXT[],
    "requirements" JSONB NOT NULL DEFAULT '[]',
    "screeningQuestions" JSONB NOT NULL DEFAULT '[]',
    "budget" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "deliveryTime" TEXT NOT NULL,
    "logo" TEXT,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ownerId" TEXT NOT NULL,
    "selectedCandidateId" TEXT,
    "hiredCandidateIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "minRating" INTEGER NOT NULL DEFAULT 1,
    "typingUserId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GigApplicant" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "gigId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "message" TEXT,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "answers" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GigApplicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GigMessage" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "gigId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT,
    "text" TEXT,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GigMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GigSubmission" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "gigId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "text" TEXT,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GigSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GigReview" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "gigId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GigReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillDefinition" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "canonicalName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "aliases" TEXT[],
    "category" TEXT NOT NULL DEFAULT 'technical',
    "tier" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "targetQuestionCount" INTEGER NOT NULL DEFAULT 300,
    "counters" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "SkillDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "skillName" TEXT NOT NULL,
    "subtopic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'Medium',
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "reviewState" TEXT NOT NULL DEFAULT 'NONE',
    "source" TEXT NOT NULL DEFAULT 'temp-bank-groq',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "skipCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMPTZ(3),
    "lastReviewed" TIMESTAMPTZ(3),
    "lastRegenerated" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestSession" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "userId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "answerKey" INTEGER[],
    "questionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "used" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER,
    "passed" BOOLEAN,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "TestSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentRecord" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "candidateId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "questionIds" TEXT[],
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "endedAt" TIMESTAMPTZ(3) NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "wrongAnswers" INTEGER NOT NULL,
    "skippedQuestions" INTEGER NOT NULL,
    "finalScore" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillRoadmap" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "skillName" TEXT NOT NULL,
    "popularityRank" INTEGER NOT NULL,
    "subtopics" TEXT[],
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillRoadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Community" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "banner" TEXT,
    "type" TEXT NOT NULL DEFAULT 'PRIVATE',
    "passwordHash" TEXT,
    "ownerId" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityMember" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityInvite" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "communityId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expirationDate" TIMESTAMPTZ(3),
    "maxUses" INTEGER,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "authorId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "postType" TEXT NOT NULL DEFAULT 'TEXT',
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "postId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "durationSeconds" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostReaction" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostComment" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "content" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPost" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostView" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT,
    "signature" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "planType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "instructor" TEXT DEFAULT 'AlignGrade Instructor',
    "thumbnailUrl" TEXT,
    "thumbnailKey" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "modules" JSONB NOT NULL DEFAULT '[]',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseEnrollment" (
    "id" TEXT NOT NULL DEFAULT lpad(to_hex(floor(extract(epoch from clock_timestamp()))::bigint), 8, '0') || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "completedLessonIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastAccessedLessonId" TEXT,
    "enrolledAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_regNo_key" ON "User"("regNo");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_userId_key" ON "Company"("userId");

-- CreateIndex
CREATE INDEX "Job_companyId_idx" ON "Job"("companyId");

-- CreateIndex
CREATE INDEX "Application_jobId_idx" ON "Application"("jobId");

-- CreateIndex
CREATE INDEX "Application_studentId_idx" ON "Application"("studentId");

-- CreateIndex
CREATE INDEX "TestAttempt_profileId_idx" ON "TestAttempt"("profileId");

-- CreateIndex
CREATE INDEX "Gig_ownerId_idx" ON "Gig"("ownerId");

-- CreateIndex
CREATE INDEX "Gig_status_idx" ON "Gig"("status");

-- CreateIndex
CREATE INDEX "GigApplicant_gigId_idx" ON "GigApplicant"("gigId");

-- CreateIndex
CREATE INDEX "GigApplicant_candidateId_idx" ON "GigApplicant"("candidateId");

-- CreateIndex
CREATE INDEX "GigMessage_gigId_idx" ON "GigMessage"("gigId");

-- CreateIndex
CREATE INDEX "GigSubmission_gigId_idx" ON "GigSubmission"("gigId");

-- CreateIndex
CREATE INDEX "GigReview_gigId_idx" ON "GigReview"("gigId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillDefinition_slug_key" ON "SkillDefinition"("slug");

-- CreateIndex
CREATE INDEX "SkillDefinition_tier_status_idx" ON "SkillDefinition"("tier", "status");

-- CreateIndex
CREATE INDEX "Question_skillName_idx" ON "Question"("skillName");

-- CreateIndex
CREATE INDEX "Question_skillName_subtopic_idx" ON "Question"("skillName", "subtopic");

-- CreateIndex
CREATE INDEX "Question_skillName_status_idx" ON "Question"("skillName", "status");

-- CreateIndex
CREATE INDEX "Question_status_idx" ON "Question"("status");

-- CreateIndex
CREATE INDEX "Question_reviewState_idx" ON "Question"("reviewState");

-- CreateIndex
CREATE INDEX "TestSession_userId_idx" ON "TestSession"("userId");

-- CreateIndex
CREATE INDEX "AssessmentRecord_candidateId_idx" ON "AssessmentRecord"("candidateId");

-- CreateIndex
CREATE INDEX "AssessmentRecord_skill_idx" ON "AssessmentRecord"("skill");

-- CreateIndex
CREATE UNIQUE INDEX "SkillRoadmap_skillName_key" ON "SkillRoadmap"("skillName");

-- CreateIndex
CREATE INDEX "SkillRoadmap_popularityRank_idx" ON "SkillRoadmap"("popularityRank");

-- CreateIndex
CREATE INDEX "Community_type_idx" ON "Community"("type");

-- CreateIndex
CREATE INDEX "Community_deleted_idx" ON "Community"("deleted");

-- CreateIndex
CREATE INDEX "CommunityMember_communityId_idx" ON "CommunityMember"("communityId");

-- CreateIndex
CREATE INDEX "CommunityMember_userId_idx" ON "CommunityMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityMember_communityId_userId_key" ON "CommunityMember"("communityId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityInvite_token_key" ON "CommunityInvite"("token");

-- CreateIndex
CREATE INDEX "CommunityInvite_communityId_idx" ON "CommunityInvite"("communityId");

-- CreateIndex
CREATE INDEX "Post_communityId_createdAt_idx" ON "Post"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");

-- CreateIndex
CREATE INDEX "Post_deleted_idx" ON "Post"("deleted");

-- CreateIndex
CREATE INDEX "Media_postId_idx" ON "Media"("postId");

-- CreateIndex
CREATE INDEX "PostReaction_postId_idx" ON "PostReaction"("postId");

-- CreateIndex
CREATE INDEX "PostReaction_userId_idx" ON "PostReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostReaction_postId_userId_key" ON "PostReaction"("postId", "userId");

-- CreateIndex
CREATE INDEX "PostComment_postId_createdAt_idx" ON "PostComment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "PostComment_parentCommentId_idx" ON "PostComment"("parentCommentId");

-- CreateIndex
CREATE INDEX "SavedPost_userId_idx" ON "SavedPost"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPost_userId_postId_key" ON "SavedPost"("userId", "postId");

-- CreateIndex
CREATE INDEX "PostView_postId_idx" ON "PostView"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostView_postId_userId_key" ON "PostView"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_orderId_key" ON "PaymentTransaction"("orderId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_userId_idx" ON "PaymentTransaction"("userId");

-- CreateIndex
CREATE INDEX "Course_isPublished_idx" ON "Course"("isPublished");

-- CreateIndex
CREATE INDEX "Course_category_idx" ON "Course"("category");

-- CreateIndex
CREATE INDEX "CourseEnrollment_userId_idx" ON "CourseEnrollment"("userId");

-- CreateIndex
CREATE INDEX "CourseEnrollment_courseId_idx" ON "CourseEnrollment"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_userId_courseId_key" ON "CourseEnrollment"("userId", "courseId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigApplicant" ADD CONSTRAINT "GigApplicant_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigMessage" ADD CONSTRAINT "GigMessage_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigSubmission" ADD CONSTRAINT "GigSubmission_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigReview" ADD CONSTRAINT "GigReview_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

