import { prisma } from '../../src/lib/prisma';
import { randomBytes } from 'crypto';

export async function createOrganizer(overrides = {}) {
    const id = randomBytes(4).toString('hex');
    return prisma.organizer.create({
        data: {
            name: `Test Org ${id}`,
            email: `org-${id}@test.com`,
            passwordHash: 'dummy',
            ...overrides
        }
    });
}

export async function createCandidate(overrides = {}) {
    const id = randomBytes(4).toString('hex');
    return prisma.candidate.create({
        data: {
            name: `Test Cand ${id}`,
            email: `cand-${id}@test.com`,
            ...overrides
        }
    });
}

export async function createAssessment(organizerId: string, overrides = {}) {
    const id = randomBytes(4).toString('hex');
    return prisma.assessment.create({
        data: {
            title: `Assessment ${id}`,
            type: 'EXAM',
            duration: 60,
            totalMarks: 100,
            passingScore: 50,
            difficulty: 'Medium',
            accessCode: `AC-${id}`,
            joinLink: `http://test/AC-${id}`,
            organizerId,
            ...overrides
        }
    });
}

export async function createAttempt(candidateId: string, assessmentId: string, overrides = {}) {
    return prisma.assessmentAttempt.create({
        data: {
            candidateId,
            assessmentId,
            status: 'NOT_STARTED',
            ...overrides
        }
    });
}
