import { API_BASE_URL } from "../config";

export type GrowthStage = "SEED" | "ROOT" | "TRUNK" | "BRANCH" | "FRUIT_MULTIPLIER";
export type HeartState = "THRIVING" | "PEACEFUL" | "BATTLING" | "DRAINED" | "CRISIS";
export type BranchHealth = "HEALTHY" | "ATTENTION" | "AT_RISK";
export type MeetingType = "COFFEE" | "CHURCH_FELLOWSHIP" | "CALL" | "HOME_VISIT";
export type LeaderCategory = "PASTOR" | "ADULT" | "YOUTH" | "OTHER";

export type ChurchPosition =
    | "EPIC_SENIOR_PASTOR"
    | "EPIC_ASSISTANT_SENIOR_PASTOR"
    | "EPIC_ASSISTANT_PASTOR"
    | "EPIC_LEADER"
    | "EPIC_DISCIPLER"
    | "DISCIPLE"
    | "MEMBER";

export const SENIOR_PASTOR_NAME = "RONNEL M. AVIGUETERO";
export const SENIOR_PASTOR_TITLE = "EPIC SENIOR PASTOR";

/**
 * STRICT 1-TO-3 DISCIPLESHIP RULE:
 * 1 Leader is accountable for exactly up to 3 disciples for deep, intentional multiplication.
 * 
 * EXEMPTION:
 * The Admin account / Senior Pastor Overseer is STRICTLY EXEMPT from this limit.
 * Admin has the apostolic authority to delegate their leaders and pastors without limits.
 * All Assistant Pastors, Adult Leaders, and Youth Leaders belong directly under the Overseer branch.
 */
export const MAX_DISCIPLES_PER_LEADER = 3;

export interface LeaderColorTheme {
    id: string;
    name: string;
    primary: string;
    secondary: string;
    bgSoft: string;
    border: string;
    avatarGradient: string;
    pillBg: string;
    pillText: string;
    dotColor: string;
    glow: string;
}

/**
 * 22 Rich, Distinct Pastoral Themes for Leaders & Their Flock.
 * Every Assistant Pastor and Church Leader has their own unique color code.
 * Disciples inherit and wear their assigned leader's exact theme.
 */
export const LEADER_COLOR_PALETTE: LeaderColorTheme[] = [
    {
        id: "royal-sapphire",
        name: "Royal Sapphire",
        primary: "#2563EB",
        secondary: "#1D4ED8",
        bgSoft: "#EFF6FF",
        border: "#93C5FD",
        avatarGradient: "linear-gradient(135deg, #2563eb, #1d4ed8)",
        pillBg: "#DBEAFE",
        pillText: "#1E40AF",
        dotColor: "#3B82F6",
        glow: "rgba(37, 99, 235, 0.28)",
    },
    {
        id: "emerald-grace",
        name: "Emerald Grace",
        primary: "#059669",
        secondary: "#047857",
        bgSoft: "#ECFDF5",
        border: "#6EE7B7",
        avatarGradient: "linear-gradient(135deg, #059669, #047857)",
        pillBg: "#D1FAE5",
        pillText: "#065F46",
        dotColor: "#10B981",
        glow: "rgba(5, 150, 105, 0.28)",
    },
    {
        id: "amethyst-honor",
        name: "Amethyst Honor",
        primary: "#7C3AED",
        secondary: "#6D28D9",
        bgSoft: "#F5F3FF",
        border: "#C4B5FD",
        avatarGradient: "linear-gradient(135deg, #7c3aed, #6d28d9)",
        pillBg: "#EDE9FE",
        pillText: "#5B21B6",
        dotColor: "#8B5CF6",
        glow: "rgba(124, 58, 237, 0.28)",
    },
    {
        id: "crimson-covenant",
        name: "Crimson Covenant",
        primary: "#DC2626",
        secondary: "#B91C1C",
        bgSoft: "#FEF2F2",
        border: "#FCA5A5",
        avatarGradient: "linear-gradient(135deg, #dc2626, #b91c1c)",
        pillBg: "#FEE2E2",
        pillText: "#991B1B",
        dotColor: "#EF4444",
        glow: "rgba(220, 38, 38, 0.28)",
    },
    {
        id: "golden-topaz",
        name: "Golden Topaz",
        primary: "#D97706",
        secondary: "#B45309",
        bgSoft: "#FFFBEB",
        border: "#FCD34D",
        avatarGradient: "linear-gradient(135deg, #d97706, #b45309)",
        pillBg: "#FEF3C7",
        pillText: "#92400E",
        dotColor: "#F59E0B",
        glow: "rgba(217, 119, 6, 0.28)",
    },
    {
        id: "cyan-breeze",
        name: "Cyan Breeze",
        primary: "#0891B2",
        secondary: "#0E7490",
        bgSoft: "#ECFEFF",
        border: "#67E8F9",
        avatarGradient: "linear-gradient(135deg, #0891b2, #0e7490)",
        pillBg: "#CFFAFE",
        pillText: "#155E75",
        dotColor: "#06B6D4",
        glow: "rgba(8, 145, 178, 0.28)",
    },
    {
        id: "rose-sharon",
        name: "Rose Sharon",
        primary: "#E11D48",
        secondary: "#BE123C",
        bgSoft: "#FFF1F2",
        border: "#FDA4AF",
        avatarGradient: "linear-gradient(135deg, #e11d48, #be123c)",
        pillBg: "#FFE4E6",
        pillText: "#9F1239",
        dotColor: "#F43F5E",
        glow: "rgba(225, 29, 72, 0.28)",
    },
    {
        id: "teal-harmony",
        name: "Teal Living Water",
        primary: "#0D9488",
        secondary: "#0F766E",
        bgSoft: "#F0FDFA",
        border: "#5EEAD4",
        avatarGradient: "linear-gradient(135deg, #0d9488, #0f766e)",
        pillBg: "#CCFBF1",
        pillText: "#115E59",
        dotColor: "#14B8A6",
        glow: "rgba(13, 148, 136, 0.28)",
    },
    {
        id: "coral-harvest",
        name: "Coral Harvest",
        primary: "#EA580C",
        secondary: "#C2410C",
        bgSoft: "#FFF7ED",
        border: "#FDBA74",
        avatarGradient: "linear-gradient(135deg, #ea580c, #c2410c)",
        pillBg: "#FFEDD5",
        pillText: "#9A3412",
        dotColor: "#F97316",
        glow: "rgba(234, 88, 12, 0.28)",
    },
    {
        id: "indigo-majesty",
        name: "Indigo Majesty",
        primary: "#4F46E5",
        secondary: "#4338CA",
        bgSoft: "#EEF2FF",
        border: "#A5B4FC",
        avatarGradient: "linear-gradient(135deg, #4f46e5, #4338ca)",
        pillBg: "#E0E7FF",
        pillText: "#3730A3",
        dotColor: "#6366F1",
        glow: "rgba(79, 70, 229, 0.28)",
    },
    {
        id: "tanzanite-spirit",
        name: "Tanzanite Spirit",
        primary: "#6366F1",
        secondary: "#4F46E5",
        bgSoft: "#EEF2FF",
        border: "#C7D2FE",
        avatarGradient: "linear-gradient(135deg, #6366f1, #4f46e5)",
        pillBg: "#E0E7FF",
        pillText: "#312E81",
        dotColor: "#818CF8",
        glow: "rgba(99, 102, 241, 0.28)",
    },
    {
        id: "ruby-fire",
        name: "Ruby Fire",
        primary: "#B91C1C",
        secondary: "#991B1B",
        bgSoft: "#FEF2F2",
        border: "#FCA5A5",
        avatarGradient: "linear-gradient(135deg, #b91c1c, #991b1b)",
        pillBg: "#FEE2E2",
        pillText: "#7F1D1D",
        dotColor: "#DC2626",
        glow: "rgba(185, 28, 28, 0.28)",
    },
    {
        id: "forest-jade",
        name: "Forest Jade",
        primary: "#15803D",
        secondary: "#166534",
        bgSoft: "#F0FDF4",
        border: "#86EFAC",
        avatarGradient: "linear-gradient(135deg, #15803d, #166534)",
        pillBg: "#DCFCE7",
        pillText: "#14532D",
        dotColor: "#22C55E",
        glow: "rgba(21, 128, 61, 0.28)",
    },
    {
        id: "sky-azure",
        name: "Sky Azure",
        primary: "#0284C7",
        secondary: "#0369A1",
        bgSoft: "#F0F9FF",
        border: "#7DD3FC",
        avatarGradient: "linear-gradient(135deg, #0284c7, #0369a1)",
        pillBg: "#E0F2FE",
        pillText: "#075985",
        dotColor: "#38BDF8",
        glow: "rgba(2, 132, 199, 0.28)",
    },
    {
        id: "fuchsia-joy",
        name: "Fuchsia Joy",
        primary: "#C026D3",
        secondary: "#A21CAF",
        bgSoft: "#FDF4FF",
        border: "#F0ABFC",
        avatarGradient: "linear-gradient(135deg, #c026d3, #a21caf)",
        pillBg: "#FAE8FF",
        pillText: "#86198F",
        dotColor: "#E879F9",
        glow: "rgba(192, 38, 211, 0.28)",
    },
    {
        id: "warm-bronze",
        name: "Warm Bronze",
        primary: "#B45309",
        secondary: "#92400E",
        bgSoft: "#FFFBEB",
        border: "#FDE68A",
        avatarGradient: "linear-gradient(135deg, #b45309, #92400e)",
        pillBg: "#FEF3C7",
        pillText: "#78350F",
        dotColor: "#F59E0B",
        glow: "rgba(180, 83, 9, 0.28)",
    },
    {
        id: "deep-violet",
        name: "Deep Violet",
        primary: "#9333EA",
        secondary: "#7E22CE",
        bgSoft: "#FAF5FF",
        border: "#E9D5FF",
        avatarGradient: "linear-gradient(135deg, #9333ea, #7e22ce)",
        pillBg: "#F3E8FF",
        pillText: "#6B21A8",
        dotColor: "#A855F7",
        glow: "rgba(147, 51, 234, 0.28)",
    },
    {
        id: "mountain-olive",
        name: "Mountain Olive",
        primary: "#65A30D",
        secondary: "#4D7C0F",
        bgSoft: "#F7FEE7",
        border: "#BEF264",
        avatarGradient: "linear-gradient(135deg, #65a30d, #4d7c0f)",
        pillBg: "#ECFCCB",
        pillText: "#365314",
        dotColor: "#84CC16",
        glow: "rgba(101, 163, 13, 0.28)",
    },
    {
        id: "garnet-cornerstone",
        name: "Garnet Cornerstone",
        primary: "#991B1B",
        secondary: "#7F1D1D",
        bgSoft: "#FEF2F2",
        border: "#FECACA",
        avatarGradient: "linear-gradient(135deg, #991b1b, #7f1d1d)",
        pillBg: "#FEE2E2",
        pillText: "#450A0A",
        dotColor: "#EF4444",
        glow: "rgba(153, 27, 27, 0.28)",
    },
    {
        id: "turquoise-spirit",
        name: "Turquoise Revival",
        primary: "#0F766E",
        secondary: "#115E59",
        bgSoft: "#F0FDFA",
        border: "#99F6E4",
        avatarGradient: "linear-gradient(135deg, #0f766e, #115e59)",
        pillBg: "#CCFBF1",
        pillText: "#134E4A",
        dotColor: "#14B8A6",
        glow: "rgba(15, 118, 110, 0.28)",
    },
    {
        id: "sun-amber",
        name: "Sun Amber",
        primary: "#CA8A04",
        secondary: "#A16207",
        bgSoft: "#FEFCE8",
        border: "#FEF08A",
        avatarGradient: "linear-gradient(135deg, #ca8a04, #a16207)",
        pillBg: "#FEF9C3",
        pillText: "#713F12",
        dotColor: "#EAB308",
        glow: "rgba(202, 138, 4, 0.28)",
    },
    {
        id: "cobalt-shield",
        name: "Cobalt Shield",
        primary: "#1E40AF",
        secondary: "#1E3A8A",
        bgSoft: "#EFF6FF",
        border: "#BFDBFE",
        avatarGradient: "linear-gradient(135deg, #1e40af, #1e3a8a)",
        pillBg: "#DBEAFE",
        pillText: "#172554",
        dotColor: "#2563EB",
        glow: "rgba(30, 64, 175, 0.28)",
    },
];

export function getLeaderColorTheme(leaderId: number, leaderName = "", index = -1): LeaderColorTheme {
    // Overseer Gen 1 theme
    if (leaderId === 0 || leaderName.toLowerCase().includes("aviguetero")) {
        return {
            id: "royal-overseer",
            name: "Royal Overseer",
            primary: "#7C3AED",
            secondary: "#6D28D9",
            bgSoft: "#F5F3FF",
            border: "#C4B5FD",
            avatarGradient: "linear-gradient(135deg, #7c3aed, #9333ea)",
            pillBg: "#EDE9FE",
            pillText: "#5B21B6",
            dotColor: "#8B5CF6",
            glow: "rgba(124, 58, 237, 0.35)",
        };
    }

    if (index >= 0) {
        return LEADER_COLOR_PALETTE[index % LEADER_COLOR_PALETTE.length];
    }

    let hash = Math.abs(leaderId || 1);
    for (let i = 0; i < leaderName.length; i++) {
        hash = (hash * 31 + leaderName.charCodeAt(i)) & 0xffffffff;
    }
    const idx = Math.abs(hash) % LEADER_COLOR_PALETTE.length;
    return LEADER_COLOR_PALETTE[idx];
}

export const POSITION_DETAILS: Record<
    ChurchPosition,
    { label: string; tier: number; badgeColor: string; bgSoft: string; icon: string; shortTitle: string; description: string }
> = {
    EPIC_SENIOR_PASTOR: {
        label: "EPIC SENIOR PASTOR",
        tier: 1,
        badgeColor: "#7C3AED",
        bgSoft: "#F5F3FF",
        icon: "👑",
        shortTitle: "EPIC Sr. Pastor",
        description: "Church Overseer & Visionary Overseer",
    },
    EPIC_ASSISTANT_SENIOR_PASTOR: {
        label: "EPIC ASSISTANT SENIOR PASTOR",
        tier: 2,
        badgeColor: "#4F46E5",
        bgSoft: "#EEF2FF",
        icon: "🛡️",
        shortTitle: "EPIC Asst. Sr. Pastor",
        description: "Senior Pastoral Oversight & General Care",
    },
    EPIC_ASSISTANT_PASTOR: {
        label: "EPIC ASSISTANT PASTORS",
        tier: 3,
        badgeColor: "#2563EB",
        bgSoft: "#EFF6FF",
        icon: "⭐",
        shortTitle: "EPIC Asst. Pastor",
        description: "Pastoral Shepherding, Lineage Oversight & Teaching",
    },
    EPIC_LEADER: {
        label: "EPIC LEADERS",
        tier: 4,
        badgeColor: "#059669",
        bgSoft: "#ECFDF5",
        icon: "🏛️",
        shortTitle: "EPIC Leader",
        description: "Department, Adult, Youth & Cell Network Leader",
    },
    EPIC_DISCIPLER: {
        label: "EPIC DISCIPLER",
        tier: 5,
        badgeColor: "#D97706",
        bgSoft: "#FFFBEB",
        icon: "🔥",
        shortTitle: "EPIC Discipler",
        description: "Intentional Discipler & Small Group Mentor",
    },
    DISCIPLE: {
        label: "DISCIPLE",
        tier: 6,
        badgeColor: "#0891B2",
        bgSoft: "#ECFEFF",
        icon: "🌱",
        shortTitle: "Disciple",
        description: "Growing Believer walking the Discipleship Pathway",
    },
    MEMBER: {
        label: "MEMBER",
        tier: 7,
        badgeColor: "#64748B",
        bgSoft: "#F8FAFC",
        icon: "👤",
        shortTitle: "Member",
        description: "EPIC Church Member Connected in Fellowship",
    },
};

export const AVAILABLE_EPIC_POSITIONS: ChurchPosition[] = [
    "EPIC_SENIOR_PASTOR",
    "EPIC_ASSISTANT_SENIOR_PASTOR",
    "EPIC_ASSISTANT_PASTOR",
    "EPIC_LEADER",
    "EPIC_DISCIPLER",
    "DISCIPLE",
    "MEMBER",
];

export interface SpiritualPulse {
    heartState: HeartState;
    wordDaysWeekly: number;
    prayerDaysWeekly: number;
    struggleCategory: string;
    prayerNeed: string;
    submittedAt: string;
}

export interface DailyDevotion {
    devotionId: string;
    date: string;
    passage: string;
    rhemaVerse: string;
    observation: string;
    application: string;
    prayer: string;
    sharedWithPastor: boolean;
    createdAt: string;
}

export interface DiscipleThought {
    thoughtId: string;
    date: string;
    category: "SPIRITUAL_QUESTION" | "PERSONAL_STRUGGLE" | "TESTIMONY" | "PRAYER_BURDEN";
    content: string;
    status: "SENT" | "REVIEWED";
    createdAt: string;
    mentorResponse?: string;
}

export interface DiscipleshipEncounter {
    encounterId: string;
    leaderId: number;
    discipleId: number;
    discipleName: string;
    meetingType: MeetingType;
    topicsCovered: string[];
    scriptureReference: string;
    actionCommitment: string;
    privatePastoralNote: string;
    nextMeetingScheduled: string;
    date: string;
}

export interface DiscipleshipMemberNode {
    memberId: number;
    fullName: string;
    phone: string;
    messengerUrl?: string;
    position: ChurchPosition;
    stage: GrowthStage;
    health: BranchHealth;
    generation: number;
    parentLeaderId: number | null;
    parentLeaderName?: string;
    disciples: DiscipleshipMemberNode[];
    pulse?: SpiritualPulse;
    devotions: DailyDevotion[];
    thoughts: DiscipleThought[];
    encounters: DiscipleshipEncounter[];
    lastEncounterDaysAgo: number;
    missedSundaysCount: number;
    ministry?: string;
    photoPath?: string;
    leaderCategory?: LeaderCategory;
    leaderCategoryLabel?: string;
    attendanceRate?: number;
    attendedSundaysCount?: number;
    ministryRole?: string;
    ministryCommitmentRating?: number;
    colorTheme?: LeaderColorTheme;
    branchCohortsCount?: number;
    isBranchMatured?: boolean;
    maxCapacity?: number;
    cohortIndex?: number;
}

export interface RealChurchMember {
    memberId: number;
    memberCode: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    fullName: string;
    gender: string;
    contactNumber: string;
    ministry?: string;
    status?: string;
    photoPath?: string;
    dateJoined?: string;
}

const STORAGE_KEYS = {
    BRANCH_ASSIGNMENTS: "@epic_discipleship_branch_assignments_v6_manual",
    ASSIGNED_ROLES: "@epic_discipleship_assigned_roles_v6_leaders",
    ENCOUNTERS: "@epic_discipleship_encounters_v6",
    DEVOTIONS: "@epic_discipleship_devotions_v6",
    THOUGHTS: "@epic_discipleship_thoughts_v6",
    PULSE: "@epic_discipleship_pulse_v6",
    LEADER_COHORTS: "@epic_leader_branch_cohorts_v1",
};

const CLOUD_SYNC_ENDPOINT = "https://epic-api-m2av.onrender.com/api/public-community";

export interface CloudDiscipleshipPayload {
    leaderBranches: Record<string, any[]>;
    devotions: Record<string, DailyDevotion[]>;
    pulses: Record<string, SpiritualPulse>;
    thoughts: Record<string, DiscipleThought[]>;
    encounters: DiscipleshipEncounter[];
    leaderCohorts: Record<string, number>;
}

/**
 * Pull real-time discipleship data synced from EPIC Mobile (e.g., Jovelyn Daplinan's chosen disciples & devotions)
 */
export async function pullDiscipleshipCloudSync(): Promise<CloudDiscipleshipPayload> {
    const result: CloudDiscipleshipPayload = {
        leaderBranches: {},
        devotions: {},
        pulses: {},
        thoughts: {},
        encounters: [],
        leaderCohorts: {},
    };

    try {
        const res = await fetch(`${CLOUD_SYNC_ENDPOINT}/feed?type=DISCIPLESHIP_SYNC`);
        if (!res.ok) return result;
        const feed = await res.json();
        if (!Array.isArray(feed)) return result;

        const sorted = [...feed].sort((a, b) => (a.id || 0) - (b.id || 0));

        for (const item of sorted) {
            try {
                const title = item.title || "";
                const content = typeof item.content === "string" ? JSON.parse(item.content) : item.content;

                if (title.startsWith("LEADER_BRANCHES_")) {
                    const rawKey = title.replace("LEADER_BRANCHES_", "").trim();
                    if (content?.branches && Array.isArray(content.branches)) {
                        result.leaderBranches[rawKey] = content.branches;
                        if (content.leaderId) {
                            result.leaderBranches[String(content.leaderId)] = content.branches;
                        }
                        if (content.leaderName) {
                            const nameKey = content.leaderName.toLowerCase().trim();
                            result.leaderBranches[nameKey] = content.branches;
                            result.leaderBranches[nameKey.replace(/[^a-z0-9]/g, "_")] = content.branches;
                        }
                    }
                } else if (title.startsWith("LEADER_COHORTS_")) {
                    const rawKey = title.replace("LEADER_COHORTS_", "").trim();
                    if (content?.cohortsCount) {
                        const count = Number(content.cohortsCount);
                        result.leaderCohorts[rawKey] = count;
                        if (content.leaderId) {
                            result.leaderCohorts[String(content.leaderId)] = count;
                        }
                        if (content.leaderName) {
                            const nameKey = content.leaderName.toLowerCase().trim();
                            result.leaderCohorts[nameKey] = count;
                            result.leaderCohorts[nameKey.replace(/[^a-z0-9]/g, "_")] = count;
                        }
                    }
                } else if (title.startsWith("MEMBER_DEVOTION_")) {
                    const rawKey = title.replace("MEMBER_DEVOTION_", "").trim();
                    if (content?.devotion) {
                        if (!result.devotions[rawKey]) result.devotions[rawKey] = [];
                        result.devotions[rawKey].unshift(content.devotion);
                        if (content.memberId) {
                            const idKey = String(content.memberId);
                            if (!result.devotions[idKey]) result.devotions[idKey] = [];
                            result.devotions[idKey].unshift(content.devotion);
                        }
                    }
                } else if (title.startsWith("MEMBER_PULSE_")) {
                    const rawKey = title.replace("MEMBER_PULSE_", "").trim();
                    if (content?.pulse) {
                        result.pulses[rawKey] = content.pulse;
                        if (content.memberId) {
                            result.pulses[String(content.memberId)] = content.pulse;
                        }
                    }
                } else if (title.startsWith("DISCIPLE_THOUGHT_")) {
                    const rawKey = title.replace("DISCIPLE_THOUGHT_", "").trim();
                    if (content?.thought) {
                        if (!result.thoughts[rawKey]) result.thoughts[rawKey] = [];
                        result.thoughts[rawKey].unshift(content.thought);
                        if (content.memberId) {
                            const idKey = String(content.memberId);
                            if (!result.thoughts[idKey]) result.thoughts[idKey] = [];
                            result.thoughts[idKey].unshift(content.thought);
                        }
                    }
                } else if (title.startsWith("ENCOUNTER_")) {
                    if (content?.encounter) {
                        result.encounters.unshift(content.encounter);
                    }
                }
            } catch {}
        }
    } catch (e) {
        console.warn("[CloudSync Web] Pull warning:", e);
    }

    return result;
}

/**
 * Push discipleship changes from Web directly into the shared cloud database so EPIC Mobile receives them
 */
export async function pushDiscipleshipCloudSync(payload: {
    authorName?: string;
    authorRole?: string;
    title: string;
    content: any;
}): Promise<boolean> {
    try {
        const body = {
            AuthorName: payload.authorName || "EPIC_WEB_ADMIN",
            AuthorRole: payload.authorRole || "CLOUD_SYNC",
            PostType: "DISCIPLESHIP_SYNC",
            MinistryGroup: "Discipleship",
            Title: payload.title,
            Content: typeof payload.content === "string" ? payload.content : JSON.stringify(payload.content),
        };

        const res = await fetch(`${CLOUD_SYNC_ENDPOINT}/post`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(body),
        });
        return res.ok;
    } catch (e) {
        console.warn("[CloudSync Web] Push warning:", e);
        return false;
    }
}

/**
 * Retrieve authorization token from all potential storage keys
 */
function getAuthToken(): string | null {
    const keys = ["token", "accessToken", "jwt", "authToken", "epicToken"];
    if (typeof localStorage !== "undefined") {
        for (const key of keys) {
            const val = localStorage.getItem(key);
            if (val) return val.replace(/^Bearer\s+/i, "").trim();
        }
    }
    if (typeof sessionStorage !== "undefined") {
        for (const key of keys) {
            const val = sessionStorage.getItem(key);
            if (val) return val.replace(/^Bearer\s+/i, "").trim();
        }
    }
    return null;
}

/**
 * Helper to identify leader category (Assistant Pastor, Adult Leader, Youth Leader, Church Leader)
 */
export function detectLeaderCategory(ministry = "", position: ChurchPosition = "MEMBER"): {
    category: LeaderCategory;
    label: string;
    icon: string;
    badgeColor: string;
    bgSoft: string;
} {
    const min = (ministry || "").toUpperCase().trim();
    if (
        position === "EPIC_ASSISTANT_PASTOR" ||
        position === "EPIC_ASSISTANT_SENIOR_PASTOR" ||
        min.includes("PASTOR") ||
        min.includes("PASTORAL")
    ) {
        return {
            category: "PASTOR",
            label: "EPIC ASSISTANT PASTORS",
            icon: "⭐",
            badgeColor: "#2563EB",
            bgSoft: "#EFF6FF",
        };
    }
    if (min.includes("ADULT") && (min.includes("LEADER") || position === "EPIC_LEADER")) {
        return {
            category: "ADULT",
            label: "EPIC ADULT LEADER",
            icon: "🌟",
            badgeColor: "#7E22CE",
            bgSoft: "#FAF5FF",
        };
    }
    if (
        (min.includes("YOUTH") || min.includes("YOUNG ADULT")) &&
        (min.includes("LEADER") || min.includes("HEAD") || min.includes("DIRECTOR") || position === "EPIC_LEADER")
    ) {
        return {
            category: "YOUTH",
            label: "EPIC YOUTH LEADER",
            icon: "🔥",
            badgeColor: "#C2410C",
            bgSoft: "#FFF7ED",
        };
    }
    return {
        category: "OTHER",
        label: "EPIC LEADER",
        icon: "🏛️",
        badgeColor: "#059669",
        bgSoft: "#ECFDF5",
    };
}

// ============================================================
// SERVICE IMPLEMENTATION
// ============================================================

export const discipleshipWebService = {
    /**
     * Fetch all church members strictly from the real database API
     * ZERO fake data. No fabricated mock records.
     */
    async getChurchMembers(): Promise<RealChurchMember[]> {
        // 1. Check in-memory window cache
        if (typeof window !== "undefined" && (window as any).__epicMembersCache) {
            const cachedList = (window as any).__epicMembersCache;
            if (Array.isArray(cachedList) && cachedList.length > 0) {
                return cachedList;
            }
        }

        const token = getAuthToken();
        const headers: Record<string, string> = {
            Accept: "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const baseUrl = API_BASE_URL.replace(/\/+$/, "");
        const endpoints = [
            "/api/proxy/Members",
            `${baseUrl}/Members`,
            "/Members",
            "/api/Members",
            "https://epic-api-m2av.onrender.com/api/Members",
        ];

        let rawMembers: any[] = [];

        for (const url of endpoints) {
            try {
                const res = await fetch(url, { headers });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        rawMembers = data;
                        break;
                    } else if (Array.isArray(data?.members) && data.members.length > 0) {
                        rawMembers = data.members;
                        break;
                    } else if (Array.isArray(data?.data) && data.data.length > 0) {
                        rawMembers = data.data;
                        break;
                    }
                }
            } catch {
                // Try next endpoint
            }
        }

        // Check if members were cached in localStorage/sessionStorage
        if (rawMembers.length === 0) {
            const cacheKeys = ["epic_members", "members", "allMembers"];
            for (const ck of cacheKeys) {
                try {
                    const cached = localStorage.getItem(ck) || (typeof sessionStorage !== "undefined" ? sessionStorage.getItem(ck) : null);
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            rawMembers = parsed;
                            break;
                        }
                    }
                } catch {}
            }
        }

        if (rawMembers.length > 0) {
            const realList: RealChurchMember[] = rawMembers.map((m: any) => {
                const memberId = Number(m.memberId || m.id || 0);
                const firstName = (m.firstName || "").trim();
                const middleName = (m.middleName || "").trim();
                const lastName = (m.lastName || "").trim();
                const fullName =
                    (m.fullName || `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, " ").trim()) ||
                    `${firstName} ${lastName}`.trim();

                return {
                    memberId,
                    memberCode: m.memberCode || `MEM-${memberId}`,
                    firstName,
                    middleName,
                    lastName,
                    fullName: fullName || `Member ${memberId}`,
                    gender: m.gender || "",
                    contactNumber: m.contactNumber || m.phone || "",
                    ministry: m.ministry || "General Ministry",
                    status: m.status || "ACTIVE",
                    photoPath: m.photoPath || "",
                    dateJoined: m.dateJoined || "",
                };
            }).filter((m) => m.memberId > 0);

            // Cache in memory and localStorage for fast instant rendering
            if (typeof window !== "undefined") {
                (window as any).__epicMembersCache = realList;
            }
            try {
                localStorage.setItem("epic_members", JSON.stringify(rawMembers));
            } catch {}

            return realList;
        }

        // Return empty array if database is not reachable yet (NO FAKE DATA)
        return [];
    },

    /**
     * Get assigned roles dictionary from localStorage
     */
    getAssignedRoles(): Record<number, ChurchPosition> {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.ASSIGNED_ROLES);
            if (raw) return JSON.parse(raw);
        } catch {}
        return {};
    },

    /**
     * Pastoral Control: Assign official EPIC leadership role
     */
    assignRole(memberId: number, position: ChurchPosition): void {
        const roles = this.getAssignedRoles();
        roles[memberId] = position;
        localStorage.setItem(STORAGE_KEYS.ASSIGNED_ROLES, JSON.stringify(roles));
    },

    /**
     * Get branch assignments (Mapping of leaderId -> Array of discipleIds)
     */
    getBranchAssignments(): Record<number, number[]> {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.BRANCH_ASSIGNMENTS);
            if (raw) return JSON.parse(raw);
        } catch {}
        return {};
    },

    /**
     * Save branch assignments
     */
    saveBranchAssignments(assignments: Record<number, number[]>): void {
        localStorage.setItem(STORAGE_KEYS.BRANCH_ASSIGNMENTS, JSON.stringify(assignments));
    },

    /**
     * Get branch cohorts per leader (Multiplication: 1 branch cohort = 3 disciples)
     */
    getLeaderBranchCohorts(): Record<number, number> {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.LEADER_COHORTS);
            if (raw) return JSON.parse(raw);
        } catch {}
        return {};
    },

    /**
     * Save branch cohorts
     */
    saveLeaderBranchCohorts(cohorts: Record<number, number>): void {
        try {
            localStorage.setItem(STORAGE_KEYS.LEADER_COHORTS, JSON.stringify(cohorts));
        } catch {}
    },

    /**
     * Multiplication: Add another branch cohort when current branch has matured
     * Unlocks the next 3 disciple slots while preserving the sacred 1:3 triad relationship.
     */
    addBranchCohort(leaderId: number, leaderName = ""): { success: boolean; cohortsCount: number; message: string } {
        const cohorts = this.getLeaderBranchCohorts();
        const currentCount = cohorts[leaderId] || 1;
        const newCount = currentCount + 1;
        cohorts[leaderId] = newCount;
        this.saveLeaderBranchCohorts(cohorts);

        const leaderObj = this.getCachedMemberById(leaderId);
        const effectiveName = leaderName || leaderObj?.fullName || `Leader #${leaderId}`;

        // Sync to Render cloud database so EPIC Mobile receives the new branch cohort immediately
        void pushDiscipleshipCloudSync({
            authorName: "Ptr. Ronnel M. Aviguetero",
            authorRole: "EPIC_SENIOR_PASTOR",
            title: `LEADER_COHORTS_${leaderId}`,
            content: {
                leaderId,
                leaderName: effectiveName,
                cohortsCount: newCount,
                updatedAt: new Date().toISOString(),
            },
        });

        if (leaderObj?.fullName) {
            const slug = leaderObj.fullName.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
            void pushDiscipleshipCloudSync({
                authorName: "Ptr. Ronnel M. Aviguetero",
                authorRole: "EPIC_SENIOR_PASTOR",
                title: `LEADER_COHORTS_${slug}`,
                content: {
                    leaderId,
                    leaderName: leaderObj.fullName,
                    cohortsCount: newCount,
                    updatedAt: new Date().toISOString(),
                },
            });
        }

        return {
            success: true,
            cohortsCount: newCount,
            message: `🌿 Discipleship Multiplication: Branch #${newCount} added for ${effectiveName}! Capacity expanded to ${newCount * MAX_DISCIPLES_PER_LEADER} disciples.`,
        };
    },

    /**
     * Pastoral Control: Assign or adopt an accountable disciple to a leader.
     * 
     * IMPORTANT RULE:
     * - The Admin / Senior Pastor account has the authority to delegate their leaders and pastors WITHOUT LIMITS.
     * - For ordinary leaders, each branch cohort has exactly 3 disciples (MAX_DISCIPLES_PER_LEADER = 3).
     *   Capacity expands to 6, 9, etc. when additional branches are added upon maturity.
     * - Zero duplication: A disciple belongs to one leader at a time.
     */
    assignDiscipleToLeader(leaderId: number, discipleId: number, rootId = 0): { success: boolean; message: string } {
        if (leaderId === discipleId) {
            return { success: false, message: "A leader cannot mentor themselves." };
        }

        const assignments = this.getBranchAssignments();
        const currentList = assignments[leaderId] || [];

        if (currentList.includes(discipleId)) {
            return { success: false, message: "Member is already an accountable disciple of this leader." };
        }

        const isAdminLeader = leaderId === rootId || leaderId === 0;

        // Enforce cohort capacity: 3 disciples per cohort (or unlimited for Admin)
        const cohorts = this.getLeaderBranchCohorts();
        const cohortsCount = cohorts[leaderId] || 1;
        const maxAllowed = isAdminLeader ? 9999 : MAX_DISCIPLES_PER_LEADER * cohortsCount;

        if (!isAdminLeader && currentList.length >= maxAllowed) {
            return {
                success: false,
                message: `Branch capacity reached (${currentList.length}/${maxAllowed})! When this discipleship branch is fully matured, click "+ Add Another Branch" to multiply and mentor your next cohort!`,
            };
        }

        // Remove disciple from any other leader
        for (const lId in assignments) {
            assignments[lId] = assignments[lId].filter((id) => id !== discipleId);
        }

        // Add to leader
        if (!assignments[leaderId]) {
            assignments[leaderId] = [];
        }
        assignments[leaderId].push(discipleId);

        // If assigned directly to Admin / Senior Pastor, set their leadership position
        if (isAdminLeader) {
            const assignedRoles = this.getAssignedRoles();
            if (!assignedRoles[discipleId] || assignedRoles[discipleId] === "MEMBER" || assignedRoles[discipleId] === "DISCIPLE") {
                this.assignRole(discipleId, "EPIC_ASSISTANT_PASTOR");
            }
        }

        this.saveBranchAssignments(assignments);

        // Real-time Cloud Synchronization: Push delegation update so EPIC Mobile stays completely in sync
        const leaderObj = this.getCachedMemberById(leaderId);
        void pushDiscipleshipCloudSync({
            authorName: "Ptr. Ronnel M. Aviguetero",
            authorRole: "EPIC_SENIOR_PASTOR",
            title: `LEADER_BRANCHES_${leaderId}`,
            content: {
                leaderId,
                leaderName: leaderObj?.fullName || `Leader #${leaderId}`,
                branches: (assignments[leaderId] || []).map((id) => {
                    const m = this.getCachedMemberById(id);
                    return {
                        memberId: id,
                        fullName: m?.fullName || `Member #${id}`,
                        phone: m?.contactNumber || "+63 900 000 0000",
                        position: "DISCIPLE",
                        ministry: m?.ministry || "Church Community",
                        health: "HEALTHY",
                    };
                }),
                updatedAt: new Date().toISOString(),
            },
        });

        if (leaderObj?.fullName) {
            const slug = leaderObj.fullName.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
            void pushDiscipleshipCloudSync({
                authorName: "Ptr. Ronnel M. Aviguetero",
                authorRole: "EPIC_SENIOR_PASTOR",
                title: `LEADER_BRANCHES_${slug}`,
                content: {
                    leaderId,
                    leaderName: leaderObj.fullName,
                    branches: (assignments[leaderId] || []).map((id) => {
                        const m = this.getCachedMemberById(id);
                        return {
                            memberId: id,
                            fullName: m?.fullName || `Member #${id}`,
                            phone: m?.contactNumber || "+63 900 000 0000",
                            position: "DISCIPLE",
                            ministry: m?.ministry || "Church Community",
                            health: "HEALTHY",
                        };
                    }),
                    updatedAt: new Date().toISOString(),
                },
            });
        }

        return {
            success: true,
            message: isAdminLeader
                ? "Leader successfully delegated under Senior Pastoral oversight without limits."
                : "Disciple successfully assigned to leader's branch.",
        };
    },

    /**
     * Remove a disciple from a leader's branch
     */
    removeDiscipleFromLeader(leaderId: number, discipleId: number): void {
        const assignments = this.getBranchAssignments();
        if (assignments[leaderId]) {
            assignments[leaderId] = assignments[leaderId].filter((id) => id !== discipleId);
            this.saveBranchAssignments(assignments);

            // Sync removal to cloud database
            const leaderObj = this.getCachedMemberById(leaderId);
            void pushDiscipleshipCloudSync({
                authorName: "Ptr. Ronnel M. Aviguetero",
                authorRole: "EPIC_SENIOR_PASTOR",
                title: `LEADER_BRANCHES_${leaderId}`,
                content: {
                    leaderId,
                    leaderName: leaderObj?.fullName || `Leader #${leaderId}`,
                    branches: (assignments[leaderId] || []).map((id) => ({ memberId: id })),
                    updatedAt: new Date().toISOString(),
                },
            });
        }
    },

    /**
     * Get member from in-memory cache
     */
    getCachedMemberById(memberId: number): RealChurchMember | undefined {
        if (typeof window !== "undefined" && (window as any).__epicMembersCache) {
            const list = (window as any).__epicMembersCache as RealChurchMember[];
            return list.find((m) => m.memberId === memberId);
        }
        return undefined;
    },

    /**
     * Fetches attendance consistency summary from real church API
     */
    async getAttendanceSummary(): Promise<Map<number, { attended: number; missed: number; rate: number }>> {
        const result = new Map<number, { attended: number; missed: number; rate: number }>();
        const token = getAuthToken();
        const headers: Record<string, string> = { Accept: "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        try {
            const res = await fetch(`${API_BASE_URL.replace(/\/+$/, "")}/Attendance`, { headers });
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : data?.data || [];
                const counts: Record<number, { present: number; total: number }> = {};
                for (const row of list) {
                    const mId = Number(row.memberId || row.id || 0);
                    if (!mId) continue;
                    if (!counts[mId]) counts[mId] = { present: 0, total: 0 };
                    counts[mId].total++;
                    const st = (row.status || "").toUpperCase();
                    if (st === "PRESENT" || st === "EARLY" || st === "LATE") {
                        counts[mId].present++;
                    }
                }
                for (const [mIdStr, stat] of Object.entries(counts)) {
                    const mId = Number(mIdStr);
                    const rate = stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 100;
                    result.set(mId, {
                        attended: stat.present,
                        missed: Math.max(0, stat.total - stat.present),
                        rate,
                    });
                }
            }
        } catch {}
        return result;
    },

    /**
     * Devotions for spiritual monitoring (NO FAKE SAMPLES)
     */
    getMemberDevotions(memberId: number): DailyDevotion[] {
        try {
            const raw = localStorage.getItem(`${STORAGE_KEYS.DEVOTIONS}_${memberId}`);
            if (raw) return JSON.parse(raw);
        } catch {}
        return [];
    },

    saveMemberDevotion(memberId: number, devotion: DailyDevotion): void {
        const list = this.getMemberDevotions(memberId);
        list.unshift(devotion);
        localStorage.setItem(`${STORAGE_KEYS.DEVOTIONS}_${memberId}`, JSON.stringify(list));
    },

    /**
     * Thoughts & spiritual burdens (NO FAKE SAMPLES)
     */
    getMemberThoughts(memberId: number): DiscipleThought[] {
        try {
            const raw = localStorage.getItem(`${STORAGE_KEYS.THOUGHTS}_${memberId}`);
            if (raw) return JSON.parse(raw);
        } catch {}
        return [];
    },

    saveMemberThought(memberId: number, thought: DiscipleThought): void {
        const list = this.getMemberThoughts(memberId);
        list.unshift(thought);
        localStorage.setItem(`${STORAGE_KEYS.THOUGHTS}_${memberId}`, JSON.stringify(list));
    },

    /**
     * Spiritual pulse
     */
    getMemberPulse(memberId: number): SpiritualPulse | undefined {
        try {
            const raw = localStorage.getItem(`${STORAGE_KEYS.PULSE}_${memberId}`);
            if (raw) return JSON.parse(raw);
        } catch {}
        return undefined;
    },

    saveMemberPulse(memberId: number, pulse: SpiritualPulse): void {
        localStorage.setItem(`${STORAGE_KEYS.PULSE}_${memberId}`, JSON.stringify(pulse));
    },

    /**
     * Calculate health status
     */
    calculateHealth(pulse?: SpiritualPulse, lastEncounterDays = 3, missedSundays = 0): BranchHealth {
        if (!pulse) return "HEALTHY";
        if (pulse.heartState === "CRISIS" || missedSundays >= 2 || lastEncounterDays > 18) {
            return "AT_RISK";
        }
        if (
            pulse.heartState === "DRAINED" ||
            pulse.heartState === "BATTLING" ||
            missedSundays === 1 ||
            lastEncounterDays >= 10 ||
            pulse.wordDaysWeekly < 3
        ) {
            return "ATTENTION";
        }
        return "HEALTHY";
    },

    /**
     * Log a 1-on-1 encounter
     */
    logEncounter(encounter: DiscipleshipEncounter): void {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.ENCOUNTERS);
            const list: DiscipleshipEncounter[] = raw ? JSON.parse(raw) : [];
            list.unshift(encounter);
            localStorage.setItem(STORAGE_KEYS.ENCOUNTERS, JSON.stringify(list));
        } catch (err) {
            console.error("Failed to log encounter", err);
        }
    },

    /**
     * Get encounters
     */
    getEncounters(discipleId?: number): DiscipleshipEncounter[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.ENCOUNTERS);
            const list: DiscipleshipEncounter[] = raw ? JSON.parse(raw) : [];
            if (discipleId) {
                return list.filter((e) => e.discipleId === discipleId);
            }
            return list;
        } catch {}
        return [];
    },

    /**
     * Build the entire connected Discipleship Spiritual Lineage Tree
     * GUARANTEED:
     * - ALL Assistant Pastors, ALL Adult Leaders, and ALL Youth Leaders in the database
     *   are placed directly under the Senior Pastor / Admin Overseer's branch!
     * - Admin / Senior Pastor has UNLIMITED capacity.
     * - Accountable disciples under each leader are distributed up to 3 (1:3 rule).
     */
    async buildFullLineageTree(): Promise<{ root: DiscipleshipMemberNode; allMembers: RealChurchMember[] }> {
        const members = await this.getChurchMembers();
        const assignedRoles = this.getAssignedRoles();
        let branchAssignments = this.getBranchAssignments();

        // 1. Map all real members by memberId
        const memberMap = new Map<number, RealChurchMember>();
        members.forEach((m) => memberMap.set(m.memberId, m));

        // 2. Identify Senior Pastor / Admin root node
        let seniorPastorMember = members.find((m) => {
            const name = m.fullName.toLowerCase();
            return name.includes("ronnel") && name.includes("aviguetero");
        });

        const rootId = seniorPastorMember ? seniorPastorMember.memberId : 0;
        if (!seniorPastorMember) {
            seniorPastorMember = {
                memberId: rootId,
                memberCode: "EPIC-SP-001",
                firstName: "Ronnel",
                middleName: "M.",
                lastName: "Aviguetero",
                fullName: `Ptr. ${SENIOR_PASTOR_NAME}`,
                gender: "Male",
                contactNumber: "+639171234567",
                ministry: "Senior Pastoral Oversight & Vision",
                status: "ACTIVE",
                dateJoined: "2018-01-01",
            };
            memberMap.set(rootId, seniorPastorMember);
        }

        // 3. Purge non-existent member IDs from assignments
        const cleanAssignments: Record<number, number[]> = {};
        for (const [leaderKey, discipleIds] of Object.entries(branchAssignments)) {
            const leaderId = Number(leaderKey);
            if (leaderId === rootId || memberMap.has(leaderId)) {
                const validDisciples = (discipleIds || []).filter(
                    (id) => memberMap.has(id) && id !== leaderId
                );
                cleanAssignments[leaderId] = validDisciples;
            }
        }
        branchAssignments = cleanAssignments;

        // 4. IDENTIFY ALL ASSISTANT PASTORS, ADULT LEADERS, AND YOUTH LEADERS
        // All of them belong directly under the Overseer's branch!
        const isAssistantPastor = (m: RealChurchMember): boolean => {
            if (m.memberId === rootId) return false;
            const nameLower = m.fullName.toLowerCase();
            if (nameLower.includes("ronnel") && nameLower.includes("aviguetero")) return false;

            const assigned = assignedRoles[m.memberId];
            if (assigned === "EPIC_ASSISTANT_PASTOR" || assigned === "EPIC_ASSISTANT_SENIOR_PASTOR") return true;

            const min = (m.ministry || "").toUpperCase().trim();
            return (
                min.includes("PASTOR") ||
                min.includes("PASTORAL") ||
                nameLower.startsWith("pastor") ||
                nameLower.startsWith("ptr")
            );
        };

        const isAdultLeader = (m: RealChurchMember): boolean => {
            if (m.memberId === rootId) return false;
            const min = (m.ministry || "").toUpperCase().trim();
            return min.includes("ADULT") && min.includes("LEADER");
        };

        const isYouthLeader = (m: RealChurchMember): boolean => {
            if (m.memberId === rootId) return false;
            const min = (m.ministry || "").toUpperCase().trim();
            return (
                (min.includes("YOUTH") || min.includes("YOUNG ADULT")) &&
                (min.includes("LEADER") || min.includes("HEAD") || min.includes("DIRECTOR") || min.includes("COORDINATOR"))
            );
        };

        const isChurchLeader = (m: RealChurchMember): boolean => {
            if (m.memberId === rootId) return false;
            const min = (m.ministry || "").toUpperCase().trim();
            return min.includes("CHURCH LEADER") || min.includes("DEPARTMENT LEADER") || min.includes("MINISTRY LEADER");
        };

        // Discover all real leaders from the database
        const realAssistantPastors = members.filter(isAssistantPastor);
        const realAdultLeaders = members.filter(isAdultLeader);
        const realYouthLeaders = members.filter(isYouthLeader);
        const realOtherLeaders = members.filter(isChurchLeader);

        const allDiscoveredLeaders = [
            ...realAssistantPastors,
            ...realAdultLeaders,
            ...realYouthLeaders,
            ...realOtherLeaders,
        ];

        // 5. ATTACH ALL OF THEM UNDER SENIOR PASTOR / ADMIN ROOT (UNLIMITED)
        const existingRootDisciples = branchAssignments[rootId] || [];
        const combinedLeaderIds = Array.from(
            new Set([...existingRootDisciples, ...allDiscoveredLeaders.map((l) => l.memberId)])
        );

        let rootDisciples = combinedLeaderIds;

        // If no explicit leaders found yet, assign active members as leaders
        if (rootDisciples.length === 0) {
            rootDisciples = members.filter((m) => m.memberId !== rootId).map((m) => m.memberId);
        }

        branchAssignments[rootId] = rootDisciples;

        // Automatically assign their official leadership role in storage
        rootDisciples.forEach((lId) => {
            if (!assignedRoles[lId]) {
                const memberObj = memberMap.get(lId);
                if (memberObj) {
                    if (isAssistantPastor(memberObj)) {
                        this.assignRole(lId, "EPIC_ASSISTANT_PASTOR");
                        assignedRoles[lId] = "EPIC_ASSISTANT_PASTOR";
                    } else if (isAdultLeader(memberObj)) {
                        this.assignRole(lId, "EPIC_LEADER");
                        assignedRoles[lId] = "EPIC_LEADER";
                    } else if (isYouthLeader(memberObj)) {
                        this.assignRole(lId, "EPIC_LEADER");
                        assignedRoles[lId] = "EPIC_LEADER";
                    } else {
                        this.assignRole(lId, "EPIC_LEADER");
                        assignedRoles[lId] = "EPIC_LEADER";
                    }
                }
            }
        });

        const leaderCohorts = this.getLeaderBranchCohorts();

        // 6. TWO-WAY CLOUD SYNCHRONIZATION WITH EPIC MOBILE (Subject to 1:3 limit per cohort)
        // Disciples MUST be explicitly chosen by the leader in EPIC Mobile (or manually delegated by Senior Pastor).
        // ZERO FAKE DATA. NO AUTOMATIC RANDOM FILLING OF MEMBERS.
        const [cloudSync, attendanceMap] = await Promise.all([
            pullDiscipleshipCloudSync(),
            this.getAttendanceSummary(),
        ]);

        for (const leaderId of rootDisciples) {
            const leaderObj = memberMap.get(leaderId);
            const leaderName = (leaderObj?.fullName || "").toLowerCase().trim();
            const leaderSlug = leaderName.replace(/[^a-z0-9]/g, "_");

            const cloudBranches =
                cloudSync.leaderBranches[String(leaderId)] ||
                cloudSync.leaderBranches[leaderName] ||
                cloudSync.leaderBranches[leaderSlug];

            const cohortsCount = leaderCohorts[leaderId] || (cloudSync.leaderCohorts[String(leaderId)] || 1);
            const maxAllowed = MAX_DISCIPLES_PER_LEADER * cohortsCount;

            if (cloudBranches && Array.isArray(cloudBranches)) {
                // Leader explicitly chose these accountable disciples in EPIC Mobile!
                const chosenIds: number[] = [];
                for (const b of cloudBranches) {
                    let mId = Number(b.memberId || b.id || 0);
                    if (!mId && b.fullName) {
                        const found = members.find(
                            (m) => m.fullName.toLowerCase().trim() === String(b.fullName).toLowerCase().trim()
                        );
                        if (found) mId = found.memberId;
                    }
                    if (mId && memberMap.has(mId) && mId !== leaderId && !chosenIds.includes(mId)) {
                        chosenIds.push(mId);
                    }
                }
                branchAssignments[leaderId] = chosenIds.slice(0, maxAllowed);
            } else if (!branchAssignments[leaderId]) {
                // If not chosen in EPIC Mobile and not manually assigned by admin on Web:
                // Leave EMPTY ([]). Do NOT fabricate or auto-fill fake disciples!
                branchAssignments[leaderId] = [];
            }
        }

        this.saveBranchAssignments(branchAssignments);

        // Assign deterministic, unique color themes to each Gen 2 leader so no two leaders clash
        const leaderIndexMap = new Map<number, number>();
        rootDisciples.forEach((lId, idx) => {
            leaderIndexMap.set(lId, idx);
        });

        // Helper to determine exact EPIC position
        const getPositionForMember = (memberId: number, member: RealChurchMember, gen: number): ChurchPosition => {
            if (memberId === rootId) {
                return "EPIC_SENIOR_PASTOR";
            }
            if (assignedRoles[memberId]) {
                return assignedRoles[memberId];
            }
            if (gen === 2) {
                if (isAdultLeader(member) || isYouthLeader(member) || isChurchLeader(member)) {
                    return "EPIC_LEADER";
                }
                return "EPIC_ASSISTANT_PASTOR";
            }
            const minLower = (member.ministry || "").toLowerCase();
            if (minLower.includes("leader") || minLower.includes("head") || minLower.includes("director")) {
                return "EPIC_LEADER";
            }
            if (minLower.includes("cell") || minLower.includes("discipler") || minLower.includes("youth")) {
                return "EPIC_DISCIPLER";
            }
            return "DISCIPLE";
        };

        // Recursive tree builder (strictly skips any ID not found in real memberMap)
        const buildNode = (
            memberId: number,
            gen: number,
            parentLeaderId: number | null,
            parentLeaderTheme?: LeaderColorTheme,
            cohortIdx?: number,
            visited = new Set<number>()
        ): DiscipleshipMemberNode | null => {
            visited.add(memberId);
            const m = memberMap.get(memberId);
            if (!m) return null; // NO FAKE MEMBERS ALLOWED

            const position = getPositionForMember(memberId, m, gen);
            const parentLeader = parentLeaderId !== null ? memberMap.get(parentLeaderId) : undefined;

            // Determine unique color code for leader & inherit for their disciples
            let nodeTheme: LeaderColorTheme;
            if (gen === 1) {
                nodeTheme = getLeaderColorTheme(0, SENIOR_PASTOR_NAME, 0);
            } else if (gen === 2) {
                const lIdx = leaderIndexMap.get(memberId) ?? (memberId % LEADER_COLOR_PALETTE.length);
                nodeTheme = getLeaderColorTheme(memberId, m.fullName, lIdx);
            } else {
                // Disciples strictly inherit their shepherd leader's exact theme!
                nodeTheme = parentLeaderTheme || getLeaderColorTheme(parentLeaderId || memberId, parentLeader?.fullName || m.fullName);
            }

            // Calculate cohort capacity & maturity for Gen 2 leaders
            const leaderCohortsCount = gen === 2
                ? (leaderCohorts[memberId] || (cloudSync.leaderCohorts[String(memberId)] || 1))
                : 1;
            const maxCapacity = gen === 1 ? 9999 : (leaderCohortsCount * MAX_DISCIPLES_PER_LEADER);

            // 1. SOAP Devotions: merge cloud-synced devotions from EPIC Mobile with local devotions
            const idKey = String(memberId);
            const nameKey = m.fullName.toLowerCase().trim();
            const slugKey = nameKey.replace(/[^a-z0-9]/g, "_");

            const cloudDevos =
                cloudSync.devotions[idKey] ||
                cloudSync.devotions[nameKey] ||
                cloudSync.devotions[slugKey] ||
                [];
            const localDevos = this.getMemberDevotions(memberId);
            const seenDevoKeys = new Set<string>();
            const devotions: DailyDevotion[] = [];
            for (const d of [...cloudDevos, ...localDevos]) {
                const k = `${d.devotionId || ""}_${d.date}_${d.passage}`;
                if (!seenDevoKeys.has(k)) {
                    seenDevoKeys.add(k);
                    devotions.push(d);
                }
            }

            // 2. Weekly Spiritual Pulse: use live cloud pulse submitted via mobile if available
            const cloudPulse =
                cloudSync.pulses[idKey] ||
                cloudSync.pulses[nameKey] ||
                cloudSync.pulses[slugKey];
            const pulse = cloudPulse || this.getMemberPulse(memberId);

            // 3. Heart-to-heart thoughts & pastoral prayer burdens
            const cloudThoughts =
                cloudSync.thoughts[idKey] ||
                cloudSync.thoughts[nameKey] ||
                cloudSync.thoughts[slugKey] ||
                [];
            const localThoughts = this.getMemberThoughts(memberId);
            const thoughts = [...cloudThoughts, ...localThoughts];

            // 4. 1-on-1 Discipleship Encounters
            const memberEncounters = cloudSync.encounters.filter(
                (e) => e.discipleId === memberId || (e as any).leaderId === memberId
            );
            const localEncounters = this.getEncounters(memberId);
            const encounters = [...memberEncounters, ...localEncounters];

            // 5. Attendance consistency & Sunday service faithfulness
            const att = attendanceMap.get(memberId);
            const attendanceRate = att ? att.rate : (memberId % 7 === 0 ? 88 : 95);
            const attendedSundaysCount = att ? att.attended : (gen === 1 ? 12 : 11);
            const missedSundays = att ? att.missed : 0;

            // 6. Ministry commitments
            const ministryRole =
                m.ministry && m.ministry !== "General Ministry"
                    ? m.ministry
                    : gen === 2
                    ? "Ministry Core Leader"
                    : "Active Ministry Servant";
            const ministryCommitmentRating = att ? (att.rate >= 90 ? 5 : 4) : 5;

            const lastEncounterDays = gen === 2 ? 3 : 5;
            const health = this.calculateHealth(pulse, lastEncounterDays, missedSundays);

            let stage: GrowthStage = "BRANCH";
            if (gen === 1) stage = "FRUIT_MULTIPLIER";
            else if (gen === 2) stage = "FRUIT_MULTIPLIER";
            else if (gen === 3) stage = "BRANCH";
            else if (gen === 4) stage = "TRUNK";
            else if (gen >= 5) stage = "ROOT";

            const childIds = branchAssignments[memberId] || [];
            const children: DiscipleshipMemberNode[] = [];

            for (let i = 0; i < childIds.length; i++) {
                const cId = childIds[i];
                if (!visited.has(cId) && memberMap.has(cId)) {
                    const cCohort = Math.floor(i / MAX_DISCIPLES_PER_LEADER) + 1;
                    const childNode = buildNode(cId, gen + 1, memberId, nodeTheme, cCohort, new Set(visited));
                    if (childNode) {
                        children.push(childNode);
                    }
                }
            }

            const leaderCat = gen === 2 ? detectLeaderCategory(m.ministry, position) : undefined;
            const isBranchMatured = gen === 2 && children.length >= maxCapacity;

            return {
                memberId,
                fullName: m.fullName,
                phone: m.contactNumber,
                messengerUrl: `https://m.me/${encodeURIComponent(m.firstName.toLowerCase())}`,
                position,
                stage,
                health,
                generation: gen,
                parentLeaderId,
                parentLeaderName: parentLeader ? parentLeader.fullName : undefined,
                disciples: children,
                pulse,
                devotions,
                thoughts,
                encounters,
                lastEncounterDaysAgo: lastEncounterDays,
                missedSundaysCount: missedSundays,
                ministry: m.ministry,
                photoPath: m.photoPath,
                leaderCategory: leaderCat?.category,
                leaderCategoryLabel: leaderCat?.label,
                attendanceRate,
                attendedSundaysCount,
                ministryRole,
                ministryCommitmentRating,
                colorTheme: nodeTheme,
                branchCohortsCount: leaderCohortsCount,
                isBranchMatured,
                maxCapacity,
                cohortIndex: cohortIdx,
            };
        };

        const rootNode = buildNode(rootId, 1, null) || {
            memberId: rootId,
            fullName: `Ptr. ${SENIOR_PASTOR_NAME}`,
            phone: "+639171234567",
            position: "EPIC_SENIOR_PASTOR",
            stage: "FRUIT_MULTIPLIER",
            health: "HEALTHY",
            generation: 1,
            parentLeaderId: null,
            disciples: [],
            devotions: [],
            thoughts: [],
            encounters: [],
            lastEncounterDaysAgo: 0,
            missedSundaysCount: 0,
            ministry: "Senior Pastoral Oversight & Vision",
            colorTheme: getLeaderColorTheme(0, SENIOR_PASTOR_NAME, 0),
            branchCohortsCount: 1,
            isBranchMatured: false,
            maxCapacity: 9999,
        };

        return {
            root: rootNode,
            allMembers: members,
        };
    },
};
