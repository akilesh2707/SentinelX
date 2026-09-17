import { prisma } from "../src/lib/prisma";

async function runBackfill() {
    console.log("Starting Candidate Isolation Backfill...");

    // 1. Fetch all candidates
    const candidates = await prisma.candidate.findMany({
        include: {
            attempts: {
                include: {
                    assessment: {
                        select: {
                            organizerId: true
                        }
                    }
                },
                orderBy: [
                    { createdAt: "asc" },
                    { id: "asc" }
                ]
            }
        }
    });

    console.log(`Found ${candidates.length} total candidates.`);

    // 2. State tracking
    const zeroAttemptCandidates: { id: string, name: string, email: string }[] = [];
    const desiredState = new Map<string, {
        originalCandidateId: string,
        email: string,
        targetOrganizerIds: string[],
        oldestOrganizerId: string | null
    }>();

    for (const candidate of candidates) {
        if (candidate.attempts.length === 0) {
            zeroAttemptCandidates.push({
                id: candidate.id,
                name: candidate.name,
                email: candidate.email
            });
            continue;
        }

        // Determine unique organizers in order of first attempt
        const organizerSet = new Set<string>();
        const targetOrganizerIds: string[] = [];

        for (const attempt of candidate.attempts) {
            const orgId = attempt.assessment.organizerId;
            if (!organizerSet.has(orgId)) {
                organizerSet.add(orgId);
                targetOrganizerIds.push(orgId);
            }
        }

        desiredState.set(candidate.id, {
            originalCandidateId: candidate.id,
            email: candidate.email.toLowerCase().trim(),
            targetOrganizerIds,
            oldestOrganizerId: targetOrganizerIds[0] // The first one based on createdAt asc
        });
    }

    if (zeroAttemptCandidates.length > 0) {
        console.error("CRITICAL: Found Zero-Attempt Candidates. These are migration blockers.");
        console.error("Count:", zeroAttemptCandidates.length);
        console.error("Candidates:");
        zeroAttemptCandidates.forEach(c => {
            console.error(`- ID: ${c.id}, Email: ${c.email}`);
        });
        console.error("Aborting backfill.");
        process.exit(1);
    }

    // 3. Duplicate Email Preflight
    const emailOrganizerToCandidateIds = new Map<string, string[]>();
    for (const [candidateId, state] of desiredState.entries()) {
        for (const orgId of state.targetOrganizerIds) {
            const key = `${orgId}:${state.email}`;
            const existing = emailOrganizerToCandidateIds.get(key) || [];
            existing.push(candidateId);
            emailOrganizerToCandidateIds.set(key, existing);
        }
    }

    const conflicts: { key: string, candidateIds: string[] }[] = [];
    for (const [key, candidateIds] of emailOrganizerToCandidateIds.entries()) {
        if (candidateIds.length > 1) {
            conflicts.push({ key, candidateIds });
        }
    }

    if (conflicts.length > 0) {
        console.error("CRITICAL: Duplicate email conflicts detected for the same organizer.");
        conflicts.forEach(c => {
            const [orgId, email] = c.key.split(":");
            console.error(`- Organizer: ${orgId}, Email: ${email}`);
            console.error(`  Conflicting Candidate IDs: ${c.candidateIds.join(", ")}`);
        });
        console.error("Aborting backfill.");
        process.exit(1);
    }

    console.log("Preflight checks passed. Proceeding with database modifications...");

    // 4. Execute modifications
    for (const candidate of candidates) {
        const state = desiredState.get(candidate.id);
        if (!state) continue; // Should not happen

        if (state.targetOrganizerIds.length === 1) {
            // Scenario A: Exactly one organizer
            const orgId = state.targetOrganizerIds[0];
            await prisma.candidate.update({
                where: { id: candidate.id },
                data: { organizerId: orgId }
            });
            console.log(`Updated Candidate ${candidate.id} to Organizer ${orgId}`);
        } else {
            // Scenario B: Multiple organizers
            const oldestOrgId = state.oldestOrganizerId!;
            
            // Execute in transaction
            await prisma.$transaction(async (tx) => {
                // Update the original candidate to belong to the oldest org
                await tx.candidate.update({
                    where: { id: candidate.id },
                    data: { organizerId: oldestOrgId }
                });

                // For all other organizers, clone and rewire
                const otherOrgs = state.targetOrganizerIds.filter(id => id !== oldestOrgId);
                for (const orgId of otherOrgs) {
                    const clone = await tx.candidate.create({
                        data: {
                            organizerId: orgId,
                            name: candidate.name,
                            email: candidate.email,
                            phone: candidate.phone,
                            createdAt: candidate.createdAt
                        }
                    });

                    // Rewire attempts for this org
                    const attemptsForOrg = candidate.attempts.filter(a => a.assessment.organizerId === orgId);
                    for (const attempt of attemptsForOrg) {
                        await tx.assessmentAttempt.update({
                            where: { id: attempt.id },
                            data: { candidateId: clone.id }
                        });
                    }
                    console.log(`Cloned Candidate ${candidate.id} -> ${clone.id} for Organizer ${orgId}`);
                }
            });
        }
    }

    console.log("Backfill complete.");
    process.exit(0);
}

runBackfill().catch(err => {
    console.error("Backfill failed:", err);
    process.exit(1);
});
