export type Member = {
    memberId: number;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    fullName?: string;
    name?: string;
};

export type Ministry = {
    ministryId: number;
    name: string;
    ministryCode: string;
    ministryHead?: string;
    description?: string;
    status: string;
    createdDate?: string;
    updatedDate?: string | null;
};

export type MinistryMember = {
    ministryMemberId: number;
    ministryId: number;
    memberId: number;
    member?: Member;
    role: string;
    position: string;
    status: string;
    notes: string;
    dateAssigned: string;
    dateEnded?: string | null;
};

export type PerformanceRating = {
    performanceRatingId?: number;
    ministryMemberId: number;
    evaluationDate: string;

    attendanceRating: number;
    commitmentRating: number;
    participationRating: number;
    teamworkRating: number;
    spiritualGrowthRating: number;
    leadershipRating: number;
    responsibilityRating: number;

    overallRating: number;

    strengths: string;
    areasForImprovement: string;
    recommendations: string;
    evaluator: string;
    notes: string;
};

export type MinistrySummaryMember = {
    ministryMemberId: number;
    memberId: number;
    member?: Member;
    role: string;
    position: string;
    status: string;
    latestEvaluationDate?: string;
    overallRating: number;
};

export type MinistrySummary = {
    ministryId: number;
    ministryCode: string;
    ministryName: string;

    totalActiveMembers: number;
    evaluatedMembers: number;
    membersWithoutEvaluation: number;

    averageOverallRating: number;

    members: MinistrySummaryMember[];
};

export type MinistryForm = {
    name: string;
    ministryHead: string;
    description: string;
    status: string;
};

export type MemberForm = {
    memberId: string;
    role: string;
    position: string;
    notes: string;
};

export const emptyPerformance: PerformanceRating = {
    ministryMemberId: 0,

    evaluationDate: new Date()
        .toISOString()
        .split("T")[0],

    attendanceRating: 3,
    commitmentRating: 3,
    participationRating: 3,
    teamworkRating: 3,
    spiritualGrowthRating: 3,
    leadershipRating: 3,
    responsibilityRating: 3,

    overallRating: 3,

    strengths: "",
    areasForImprovement: "",
    recommendations: "",
    evaluator: "",
    notes: ""
};