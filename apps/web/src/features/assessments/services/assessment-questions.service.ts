import { prisma } from "../../../lib/prisma";

export class AssessmentQuestionsError extends Error {
    constructor(public message: string, public status: number) {
        super(message);
    }
}

export const AssessmentQuestionsService = {
    async verifyAssessmentOwnership(id: string, organizerId: string) {
        const assessment = await prisma.assessment.findUnique({
            where: { id },
            include: { questions: { include: { question: true } } }
        });
        
        if (!assessment) throw new AssessmentQuestionsError("Assessment not found", 404);
        if (assessment.organizerId !== organizerId) throw new AssessmentQuestionsError("Forbidden", 403);
        
        return assessment;
    },

    async getQuestions(assessmentId: string, organizerId: string) {
        const assessment = await this.verifyAssessmentOwnership(assessmentId, organizerId);

        const sortedQuestions = assessment.questions.sort((a, b) => a.order - b.order);
        return sortedQuestions.map((aq) => {
            const q = aq.question;
            return {
                id: aq.id, // AssessmentQuestion ID
                questionId: q.id,
                title: q.title,
                type: q.type,
                difficulty: q.difficulty,
                marks: aq.marks,
                order: aq.order,
                description: q.description,
            };
        });
    },

    async addQuestions(assessmentId: string, organizerId: string, questionIds: string[]) {
        if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
            throw new AssessmentQuestionsError("questionIds array is required", 400);
        }

        const assessment = await this.verifyAssessmentOwnership(assessmentId, organizerId);

        if (assessment.status !== "DRAFT") {
            throw new AssessmentQuestionsError("Cannot modify questions of a published or closed assessment", 409);
        }

        const uniqueQuestionIds = Array.from(new Set(questionIds));
        
        const questionsToAdd = await prisma.question.findMany({
            where: {
                id: { in: uniqueQuestionIds },
                organizerId: organizerId
            }
        });

        if (questionsToAdd.length !== uniqueQuestionIds.length) {
            throw new AssessmentQuestionsError("One or more questions are invalid or do not belong to you", 400);
        }

        const assessmentType = assessment.type;
        for (const q of questionsToAdd) {
            if (assessmentType === "MCQ" && q.type !== "MCQ") {
                throw new AssessmentQuestionsError("Cannot add coding questions to an MCQ assessment", 400);
            }
            if (assessmentType === "CODING" && q.type !== "CODING") {
                throw new AssessmentQuestionsError("Cannot add MCQ questions to a CODING assessment", 400);
            }
        }

        const existingQuestionIds = new Set(assessment.questions.map(aq => aq.questionId));
        for (const q of questionsToAdd) {
            if (existingQuestionIds.has(q.id)) {
                throw new AssessmentQuestionsError(`Question ${q.title} is already attached`, 400);
            }
        }

        let nextOrder = assessment.questions.length > 0 
            ? Math.max(...assessment.questions.map(aq => aq.order)) + 1 
            : 1;

        await prisma.$transaction(async (tx) => {
            for (const q of questionsToAdd) {
                await tx.assessmentQuestion.create({
                    data: {
                        assessmentId,
                        questionId: q.id,
                        marks: q.defaultMarks,
                        order: nextOrder++
                    }
                });
            }

            const updatedAQs = await tx.assessmentQuestion.findMany({
                where: { assessmentId },
                include: { question: true }
            });

            const totalMarks = updatedAQs.reduce((sum, aq) => sum + aq.marks, 0);
            const mcqCount = updatedAQs.filter(aq => aq.question.type === "MCQ").length;
            const codingCount = updatedAQs.filter(aq => aq.question.type === "CODING").length;

            await tx.assessment.update({
                where: { id: assessmentId },
                data: { totalMarks, mcqCount, codingCount }
            });
        });
    },

    async updateMarks(assessmentId: string, organizerId: string, questionId: string, marks: number) {
        if (!Number.isFinite(marks) || !Number.isInteger(marks) || marks < 1) {
            throw new AssessmentQuestionsError("marks must be a finite integer >= 1", 400);
        }

        const assessment = await this.verifyAssessmentOwnership(assessmentId, organizerId);

        if (assessment.status !== "DRAFT") {
            throw new AssessmentQuestionsError("Cannot modify questions of a published or closed assessment", 409);
        }

        const assessmentQuestion = assessment.questions.find(aq => aq.questionId === questionId);
        if (!assessmentQuestion) {
            throw new AssessmentQuestionsError("Question not found in this assessment", 404);
        }

        await prisma.$transaction(async (tx) => {
            await tx.assessmentQuestion.update({
                where: {
                    assessmentId_questionId: {
                        assessmentId,
                        questionId
                    }
                },
                data: { marks }
            });

            const updatedAQs = await tx.assessmentQuestion.findMany({
                where: { assessmentId }
            });

            const totalMarks = updatedAQs.reduce((sum, aq) => sum + aq.marks, 0);

            await tx.assessment.update({
                where: { id: assessmentId },
                data: { totalMarks }
            });
        });
    },

    async removeQuestion(assessmentId: string, organizerId: string, questionId: string) {
        const assessment = await this.verifyAssessmentOwnership(assessmentId, organizerId);

        if (assessment.status !== "DRAFT") {
            throw new AssessmentQuestionsError("Cannot modify questions of a published or closed assessment", 409);
        }

        const assessmentQuestion = assessment.questions.find(aq => aq.questionId === questionId);
        if (!assessmentQuestion) {
            throw new AssessmentQuestionsError("Question not found in this assessment", 404);
        }

        await prisma.$transaction(async (tx) => {
            await tx.assessmentQuestion.delete({
                where: {
                    assessmentId_questionId: {
                        assessmentId,
                        questionId
                    }
                }
            });

            const updatedAQs = await tx.assessmentQuestion.findMany({
                where: { assessmentId },
                include: { question: true }
            });

            const totalMarks = updatedAQs.reduce((sum, aq) => sum + aq.marks, 0);
            const mcqCount = updatedAQs.filter(aq => aq.question.type === "MCQ").length;
            const codingCount = updatedAQs.filter(aq => aq.question.type === "CODING").length;

            await tx.assessment.update({
                where: { id: assessmentId },
                data: { totalMarks, mcqCount, codingCount }
            });
        });
    },

    async atomicReorder(assessmentId: string, organizerId: string, questionIds: string[]) {
        if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
            throw new AssessmentQuestionsError("questionIds array is required", 400);
        }

        const assessment = await this.verifyAssessmentOwnership(assessmentId, organizerId);

        if (assessment.status !== "DRAFT") {
            throw new AssessmentQuestionsError("Cannot modify questions of a published or closed assessment", 409);
        }

        // Validate duplicates
        const uniqueQuestionIds = new Set(questionIds);
        if (uniqueQuestionIds.size !== questionIds.length) {
            throw new AssessmentQuestionsError("Duplicate question IDs provided", 400);
        }

        // Validate complete set matches
        const existingQuestionIds = new Set(assessment.questions.map(aq => aq.questionId));
        
        if (existingQuestionIds.size !== questionIds.length) {
            throw new AssessmentQuestionsError("Supplied question IDs do not match the current assessment questions count", 400);
        }

        for (const id of questionIds) {
            if (!existingQuestionIds.has(id)) {
                throw new AssessmentQuestionsError(`Question ${id} is not attached to this assessment`, 400);
            }
        }

        await prisma.$transaction(async (tx) => {
            // Assign sequential orders
            for (let i = 0; i < questionIds.length; i++) {
                await tx.assessmentQuestion.update({
                    where: {
                        assessmentId_questionId: {
                            assessmentId,
                            questionId: questionIds[i]
                        }
                    },
                    data: { order: i + 1 }
                });
            }
        });
        
        return this.getQuestions(assessmentId, organizerId);
    }
};
