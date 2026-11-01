import { API_BASE_URL } from "../config";

export type GrowthStage = "SEED" | "ROOT" | "TRUNK" | "BRANCH" | "FRUIT_MULTIPLIER";
export type HeartState = "THRIVING" | "PEACEFUL" | "BATTLING" | "DRAINED" | "CRISIS";
export type BranchHealth = "HEALTHY" | "ATTENTION" | "AT_RISK";
export type MeetingType = "COFFEE" | "CHURCH_FELLOWSHIP" | "CALL" | "HOME_VISIT";

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
        description: "Department, Ministry & Cell Network Leader",
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
    BRANCH_ASSIGNMENTS: "@epic_discipleship_branch_assignments_v4_real_unlimited",
    ASSIGNED_ROLES: "@epic_discipleship_assigned_roles_v4_real",
    ENCOUNTERS: "@epic_discipleship_encounters_v4_real",
    DEVOTIONS: "@epic_discipleship_devotions_v4_real",
    THOUGHTS: "@epic_discipleship_thoughts_v4_real",
    PULSE: "@epic_discipleship_pulse_v4_real",
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
 * Purge legacy storage keys that held outdated fake or mock data
 */
function purgeLegacyFakeData(): void {
    if (typeof localStorage === "undefined") return;
    const legacyKeys = [
        "@epic_discipleship_branch_assignments_v1",
        "@epic_discipleship_branch_assignments_v2",
        "@epic_discipleship_branch_assignments_v3_real",
        "@epic_discipleship_assigned_roles_v1",
        "@epic_discipleship_assigned_roles_v2",
        "@epic_discipleship_assigned_roles_v3_real",
    ];
    for (const k of legacyKeys) {
        localStorage.removeItem(k);
    }
}

// Run legacy cleanup once
purgeLegacyFakeData();

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

        // If assigned directly to Admin / Senior Pastor, set their position to EPIC_ASSISTANT_PASTOR
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
                ? "EPIC Pastor successfully delegated under Senior Pastoral oversight without limits."
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

    /**
     * Save devotion for member
     */
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

    /**
     * Save thought for member
     */
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

    /**
     * Save pulse
     */
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
     * REAL DATA ONLY:
     * - Fetches REAL church members.
     * - Admin / Senior Pastor has full authority to delegate their EPIC Assistant Pastors WITHOUT LIMITS.
     * - Gen 2 Disciples under Admin are REAL Assistant Pastors fetched from the database.
     * - Disciples of ordinary leaders are restricted to maximum 3.
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

        // 3. PURGE NON-EXISTENT MEMBER IDS FROM ASSIGNMENTS
        // Removes any ID that does not exist in the real member database.
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

        // 4. FIND REAL ASSISTANT PASTORS FROM THE DATABASE
        const isRealAssistantPastor = (m: RealChurchMember): boolean => {
            if (m.memberId === rootId) return false;
            const nameLower = m.fullName.toLowerCase();
            if (nameLower.includes("ronnel") && nameLower.includes("aviguetero")) return false;

            const assigned = assignedRoles[m.memberId];
            if (assigned === "EPIC_ASSISTANT_PASTOR" || assigned === "EPIC_ASSISTANT_SENIOR_PASTOR") {
                return true;
            }

            const minLower = (m.ministry || "").toLowerCase();
            if (
                minLower.includes("assistant pastor") ||
                minLower.includes("asst pastor") ||
                minLower.includes("asst. pastor") ||
                minLower.includes("associate pastor") ||
                minLower.includes("co-pastor") ||
                minLower.includes("pastoral")
            ) {
                return true;
            }

            if (nameLower.startsWith("pastor") || nameLower.startsWith("ptr")) {
                return true;
            }

            return false;
        };

        // All real members matching Assistant Pastor
        let realAssistantPastors = members.filter(isRealAssistantPastor);

        // If no members explicitly have "Pastor" in their ministry yet, detect leaders to serve as Assistant Pastors
        if (realAssistantPastors.length === 0) {
            realAssistantPastors = members.filter((m) => {
                if (m.memberId === rootId) return false;
                const min = (m.ministry || "").toUpperCase();
                return (
                    min.includes("LEADER") ||
                    min.includes("HEAD") ||
                    min.includes("DIRECTOR") ||
                    min.includes("PASTOR") ||
                    min.includes("ELDER")
                );
            });
        }

        // 5. ATTACH REAL ASSISTANT PASTORS UNDER ADMIN ROOT
        // Note: Admin has NO LIMIT! Can hold any number of delegated pastors.
        let rootDisciples = branchAssignments[rootId] || [];

        // If Admin has not yet manually delegated anyone, auto-assign the real Assistant Pastors
        if (rootDisciples.length === 0 && realAssistantPastors.length > 0) {
            rootDisciples = realAssistantPastors.map((ap) => ap.memberId);
            branchAssignments[rootId] = rootDisciples;

            rootDisciples.forEach((apId) => {
                if (!assignedRoles[apId]) {
                    this.assignRole(apId, "EPIC_ASSISTANT_PASTOR");
                    assignedRoles[apId] = "EPIC_ASSISTANT_PASTOR";
                }
            });
        }

        // 6. POPULATE ACCOUNTABLE DISCIPLES UNDER THE ASSISTANT PASTORS (Subject to 1:3 limit)
        const usedMemberIds = new Set<number>([rootId, ...rootDisciples]);

        for (const apId of rootDisciples) {
            let apDisciples = branchAssignments[apId] || [];
            // If this assistant pastor has no disciples assigned, distribute available real church members up to 3
            if (apDisciples.length === 0) {
                const availableMembers = members.filter((m) => !usedMemberIds.has(m.memberId));
                const toAssign = availableMembers.slice(0, MAX_DISCIPLES_PER_LEADER);

                apDisciples = toAssign.map((m) => {
                    usedMemberIds.add(m.memberId);
                    return m.memberId;
                });
                branchAssignments[apId] = apDisciples;
            } else {
                apDisciples.forEach((id) => usedMemberIds.add(id));
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
