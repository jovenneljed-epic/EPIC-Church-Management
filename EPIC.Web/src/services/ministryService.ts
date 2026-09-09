import { API_BASE_URL } from "../config";

// ======================================
// AUTH HEADERS
// ======================================

function getAuthHeaders(): HeadersInit {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
}

// ======================================
// TYPES
// ======================================

export interface MinistryMember {
    memberId: number;
    ministryMemberId: number;
    name: string;
    role: string;
    position: string;
    photoPath: string;
    isHead?: boolean;
    overallRating?: number;
    attendanceRating?: number;
    commitmentRating?: number;
    teamworkRating?: number;
    spiritualGrowthRating?: number;
    leadershipRating?: number;
    responsibilityRating?: number;
    evaluator?: string;
    evaluationDate?: string;
    encouragementPoints?: number;
    honorTitle?: string;
}

export interface MinistryEvaluation {
    ministryId: number;
    ministryCode: string;
    ministryName: string;
    ministryHead: string;
    contactNumber?: string;
    description: string;
    meetingDay: string;
    meetingTime: string;
    meetingLocation: string;
    category: string;
    totalMembers: number;
    activeMembers: number;
    totalMinistryPoints: number;
    averageRating: number;
    healthPercentage: number;
    healthTier: "EXEMPLARY" | "EXCELLENT" | "DISTINGUISHED" | "GROWING" | string;
    encouragementVerse?: string;
    members: MinistryMember[];
}

export interface MinistryActivity {
    serviceName: string;
    date: string;
}

export interface MinistryAttendance {
    totalAttendance: number;
    averageAttendance: number;
}

export interface MinistryPerformance {
    leadership: number;
    teamwork: number;
    commitment: number;
}

export interface MinistryEvaluationDetail extends MinistryEvaluation {
    activities?: MinistryActivity[];
    attendance?: MinistryAttendance;
    performance?: MinistryPerformance;
}

// ======================================
// GET ALL MINISTRY CARDS
// GET /api/public/ministries/evaluation
// ======================================

export async function getMinistryEvaluations(): Promise<MinistryEvaluation[]> {
    const primaryUrl = `${API_BASE_URL}/public/ministries/evaluation`;

    try {
        const response = await fetch(primaryUrl, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("MINISTRY LIST ERROR:", response.status, error);
            throw new Error(`Failed to load ministry evaluations (${response.status})`);
        }

        return await response.json();
    } catch (err) {
        console.warn("Primary ministry endpoint failed, attempting fallback:", err);
        const fallbackUrl = `http://localhost:5109/api/public/ministries/evaluation`;
        if (primaryUrl !== fallbackUrl) {
            const fallbackRes = await fetch(fallbackUrl, {
                method: "GET",
                headers: getAuthHeaders()
            });
            if (fallbackRes.ok) {
                return await fallbackRes.json();
            }
        }
        throw err;
    }
}

// ======================================
// GET SINGLE MINISTRY EVALUATION
// GET /api/public/ministries/{id}/evaluation
// ======================================

export async function getMinistryEvaluationDetail(ministryId: number): Promise<MinistryEvaluationDetail> {
    const primaryUrl = `${API_BASE_URL}/public/ministries/${ministryId}/evaluation`;

    try {
        const response = await fetch(primaryUrl, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("MINISTRY DETAIL ERROR:", response.status, error);
            throw new Error(`Failed to load ministry evaluation detail (${response.status})`);
        }

        return await response.json();
    } catch (err) {
        console.warn("Primary ministry detail endpoint failed, attempting fallback:", err);
        const fallbackUrl = `http://localhost:5109/api/public/ministries/${ministryId}/evaluation`;
        if (primaryUrl !== fallbackUrl) {
            const fallbackRes = await fetch(fallbackUrl, {
                method: "GET",
                headers: getAuthHeaders()
            });
            if (fallbackRes.ok) {
                return await fallbackRes.json();
            }
        }
        throw err;
    }
}