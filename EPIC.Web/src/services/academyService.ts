import { API_BASE_URL } from "../config";

// ======================================
// TYPES
// ======================================

export interface AcademyLesson {
    lessonId: number;
    title: string;
    duration: string;
    durationMinutes: number;
    videoUrl?: string | null;
    resourceUrl?: string | null;
    isFreePreview: boolean;
    type: "video" | "reading" | "workshop";
}

export interface AcademyModule {
    moduleId: number;
    moduleNumber: string;
    title: string;
    description: string;
    sortOrder: number;
    lessonsCount: number;
    lessons: AcademyLesson[];
}

export interface AcademyCurriculumCourse {
    courseId: number;
    title: string;
    code: string;
    shortDescription: string;
    description: string;
    category: string;
    level: string;
    estimatedMinutes: number;
    estimatedHours: string;
    totalModules: number;
    totalLessons: number;
    instructor: string;
    outcomes: string[];
    modules: AcademyModule[];
}

export interface LeaderboardStudent {
    rank: number;
    rankTrophy: string;
    enrollmentId: number;
    studentName: string;
    username: string;
    courseTitle: string;
    courseTrack: string;
    progressPercentage: number;
    isCompleted: boolean;
    honorTier: string;
    honorBadge: string;
    honorColor: string;
    completedLessons: number;
    totalLessons: number;
    enrolledDate: string;
    completedDate?: string | null;
    status: "GRADUATED" | "IN_PROGRESS" | "ORIENTATION";
}

export interface AcademySummary {
    totalScholars: number;
    graduatesCount: number;
    activeLearnersCount: number;
    averageProgress: number;
    totalCompletedLessons: number;
    totalAvailableLessons: number;
    activeCohorts: number;
}

export interface LeaderboardResponse {
    leaderboard: LeaderboardStudent[];
    summary: AcademySummary;
}

export interface StudyPoint {
    point: string;
    verse: string;
    explanation: string;
}

export interface DownloadableResource {
    fileName: string;
    title: string;
    fileSize: string;
    availableFree: boolean;
}

export interface SampleLessonOutline {
    lessonId: number;
    title: string;
    moduleTitle: string;
    courseTitle: string;
    courseTrack: string;
    estimatedMinutes: number;
    videoUrl: string;
    isFreePreview: boolean;
    keyScripture: string;
    leadMagnetTitle: string;
    summary: string;
    studyPoints: StudyPoint[];
    discussionQuestions: string[];
    downloadableResource: DownloadableResource;
}

// ======================================
// API CALLS
// ======================================

const getAcademyApiBase = (): string => {
    const raw = API_BASE_URL || "http://localhost:5109/api";
    // Strip trailing /api or /api/ so we have a clean domain base
    const domainBase = raw.replace(/\/api\/?$/, "");
    return `${domainBase}/api/public/academy`;
};

export async function getPublicCurriculum(): Promise<AcademyCurriculumCourse[]> {
    const endpoint = `${getAcademyApiBase()}/curriculum`;
    try {
        const res = await fetch(endpoint, {
            headers: { Accept: "application/json" }
        });
        if (!res.ok) {
            throw new Error(`Failed to load curriculum (${res.status})`);
        }
        return await res.json();
    } catch (err) {
        console.error(`Error in getPublicCurriculum (${endpoint}):`, err);
        throw err;
    }
}

export async function getAcademyLeaderboard(): Promise<LeaderboardResponse> {
    const endpoint = `${getAcademyApiBase()}/leaderboard`;
    try {
        const res = await fetch(endpoint, {
            headers: { Accept: "application/json" }
        });
        if (!res.ok) {
            throw new Error(`Failed to load leaderboard (${res.status})`);
        }
        return await res.json();
    } catch (err) {
        console.error(`Error in getAcademyLeaderboard (${endpoint}):`, err);
        throw err;
    }
}

export async function getSampleLessonOutline(): Promise<SampleLessonOutline> {
    const endpoint = `${getAcademyApiBase()}/sample-lesson`;
    try {
        const res = await fetch(endpoint, {
            headers: { Accept: "application/json" }
        });
        if (!res.ok) {
            throw new Error(`Failed to load sample lesson outline (${res.status})`);
        }
        return await res.json();
    } catch (err) {
        console.error(`Error in getSampleLessonOutline (${endpoint}):`, err);
        throw err;
    }
}
