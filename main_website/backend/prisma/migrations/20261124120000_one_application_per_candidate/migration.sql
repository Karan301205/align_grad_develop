-- One application per candidate per job and one pitch per candidate per gig.
-- The apply handlers already check first, but two requests at the same moment (a double-click,
-- or two server processes) could both pass that check. Fails if duplicates already exist; find
-- them with: SELECT "jobId","studentId",count(*) FROM "Application" GROUP BY 1,2 HAVING count(*)>1;
-- (and the same for "GigApplicant" on "gigId","candidateId").

-- CreateIndex
CREATE UNIQUE INDEX "Application_jobId_studentId_key" ON "Application"("jobId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "GigApplicant_gigId_candidateId_key" ON "GigApplicant"("gigId", "candidateId");

