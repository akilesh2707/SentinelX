-- CreateIndex
CREATE UNIQUE INDEX "Candidate_organizerId_email_key" ON "Candidate"("organizerId", "email");
