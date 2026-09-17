import { prisma } from "../src/lib/prisma";

async function runVerification() {
    console.log("Starting Candidate Isolation Verification...");

    let hasErrors = false;

    // 1. No Candidate has null organizerId
    const unmigratedCandidates = await prisma.$queryRaw`SELECT * FROM "Candidate" WHERE "organizerId" IS NULL`;
    if (Array.isArray(unmigratedCandidates) && unmigratedCandidates.length > 0) {
        console.error(`❌ Found ${unmigratedCandidates.length} Candidates with null organizerId.`);
        process.exit(1);
    }
    console.log("✅ No Candidates with null organizerId.");

    // 2. Every AssessmentAttempt's Candidate belongs to the same Organizer as the Attempt's Assessment
    const mismatchedAttempts = await prisma.assessmentAttempt.findMany({
        include: {
            candidate: true,
            assessment: true
        }
    });

    let mismatchCount = 0;
    for (const attempt of mismatchedAttempts) {
        if (attempt.candidate.organizerId !== attempt.assessment.organizerId) {
            console.error(`ERROR: Attempt ${attempt.id} candidate organizer (${attempt.candidate.organizerId}) does not match assessment organizer (${attempt.assessment.organizerId}).`);
            mismatchCount++;
        }
    }
    
    if (mismatchCount > 0) {
        console.error(`ERROR: Found ${mismatchCount} mismatched attempts.`);
        hasErrors = true;
    } else {
        console.log("✅ All AssessmentAttempts correctly match Candidate and Assessment organizers.");
    }

    // 3. No duplicate (organizerId, email)
    const candidates = await prisma.candidate.findMany({
        select: { organizerId: true, email: true }
    });
    
    const uniqueMap = new Map<string, number>();
    for (const c of candidates) {
        const key = `${c.organizerId}:${c.email.toLowerCase().trim()}`;
        uniqueMap.set(key, (uniqueMap.get(key) || 0) + 1);
    }
    
    let duplicateCount = 0;
    for (const [key, count] of uniqueMap.entries()) {
        if (count > 1) {
            console.error(`ERROR: Duplicate found for ${key} - count: ${count}`);
            duplicateCount++;
        }
    }

    if (duplicateCount > 0) {
        console.error(`ERROR: Found ${duplicateCount} duplicate (organizerId, email) pairs.`);
        hasErrors = true;
    } else {
        console.log("✅ No duplicate (organizerId, email) pairs found.");
    }

    if (hasErrors) {
        console.error("❌ Verification failed.");
        process.exit(1);
    } else {
        console.log("🎉 Verification passed successfully.");
        process.exit(0);
    }
}

runVerification().catch(err => {
    console.error("Verification failed with error:", err);
    process.exit(1);
});
