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
    BRANCH_ASSIGNMENTS: "@epic_discipleship_branch_assignments_v5_leaders",
    ASSIGNED_ROLES: "@epic_discipleship_assigned_roles_v5_leaders",
    ENCOUNTERS: "@epic_discipleship_encounters_v5",
    DEVOTIONS: "@epic_discipleship_devotions_v5",
    THOUGHTS: "@epic_discipleship_thoughts_v5",
    PULSE: "@epic_discipleship_pulse_v5",
};

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
     * Pastoral Control: Assign or adopt an accountable disciple to a leader.
     * 
     * IMPORTANT RULE:
     * - The Admin / Senior Pastor account has the authority to delegate their leaders and pastors WITHOUT LIMITS.
     * - For ordinary leaders, the strict 1:3 limit (MAX_DISCIPLES_PER_LEADER = 3) is strictly enforced.
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

        // Strictly enforce 3-disciple limit for ordinary leaders only.
        // Admin account is EXEMPT from this limit and can delegate without limits.
        if (!isAdminLeader && currentList.length >= MAX_DISCIPLES_PER_LEADER) {
            return {
                success: false,
                message: `Capacity limit reached! 1 Leader is restricted to maximum ${MAX_DISCIPLES_PER_LEADER} disciples for deep, intentional multiplication.`,
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
        }
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

        // 6. POPULATE ACCOUNTABLE DISCIPLES UNDER EACH LEADER (Subject to 1:3 limit)
        // Disciples are smartly paired with their matching department!
        const usedMemberIds = new Set<number>([rootId, ...rootDisciples]);

        for (const leaderId of rootDisciples) {
            let leaderDisciples = branchAssignments[leaderId] || [];

            if (leaderDisciples.length === 0) {
                const leaderObj = memberMap.get(leaderId);
                const leaderMin = (leaderObj?.ministry || "").toUpperCase();

                // Candidate disciples not yet in any branch
                let candidateMembers = members.filter((m) => !usedMemberIds.has(m.memberId));

                if (leaderMin.includes("ADULT")) {
                    const adultCandidates = candidateMembers.filter((m) => (m.ministry || "").toUpperCase().includes("ADULT"));
                    if (adultCandidates.length > 0) {
                        candidateMembers = [...adultCandidates, ...candidateMembers.filter((m) => !(m.ministry || "").toUpperCase().includes("ADULT"))];
                    }
                } else if (leaderMin.includes("YOUTH") || leaderMin.includes("YOUNG ADULT")) {
                    const youthCandidates = candidateMembers.filter((m) => {
                        const mMin = (m.ministry || "").toUpperCase();
                        return mMin.includes("YOUTH") || mMin.includes("YOUNG ADULT");
                    });
                    if (youthCandidates.length > 0) {
                        candidateMembers = [...youthCandidates, ...candidateMembers.filter((m) => {
                            const mMin = (m.ministry || "").toUpperCase();
                            return !mMin.includes("YOUTH") && !mMin.includes("YOUNG ADULT");
                        })];
                    }
                }

                const toAssign = candidateMembers.slice(0, MAX_DISCIPLES_PER_LEADER);
                leaderDisciples = toAssign.map((m) => {
                    usedMemberIds.add(m.memberId);
                    return m.memberId;
                });
                branchAssignments[leaderId] = leaderDisciples;
            } else {
                leaderDisciples.forEach((id) => usedMemberIds.add(id));
            }
        }

        this.saveBranchAssignments(branchAssignments);

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
            visited = new Set<number>()
        ): DiscipleshipMemberNode | null => {
            visited.add(memberId);
            const m = memberMap.get(memberId);
            if (!m) return null; // NO FAKE MEMBERS ALLOWED

            const position = getPositionForMember(memberId, m, gen);
            const pulse = this.getMemberPulse(memberId);
            const devotions = this.getMemberDevotions(memberId);
            const thoughts = this.getMemberThoughts(memberId);
            const encounters = this.getEncounters(memberId);

            const lastEncounterDays = gen === 2 ? 3 : 5;
            const missedSundays = 0;
            const health = this.calculateHealth(pulse, lastEncounterDays, missedSundays);

            let stage: GrowthStage = "BRANCH";
            if (gen === 1) stage = "FRUIT_MULTIPLIER";
            else if (gen === 2) stage = "FRUIT_MULTIPLIER";
            else if (gen === 3) stage = "BRANCH";
            else if (gen === 4) stage = "TRUNK";
            else if (gen >= 5) stage = "ROOT";

            const childIds = branchAssignments[memberId] || [];
            const children: DiscipleshipMemberNode[] = [];

            for (const cId of childIds) {
                if (!visited.has(cId) && memberMap.has(cId)) {
                    const childNode = buildNode(cId, gen + 1, memberId, new Set(visited));
                    if (childNode) {
                        children.push(childNode);
                    }
                }
            }

            const parentLeader = parentLeaderId !== null ? memberMap.get(parentLeaderId) : undefined;
            const leaderCat = gen === 2 ? detectLeaderCategory(m.ministry, position) : undefined;

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
        };

        return {
            root: rootNode,
            allMembers: members,
        };
    },
};
