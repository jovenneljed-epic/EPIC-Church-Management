import { apiClient } from "../api/apiClient";

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
 * Disciples are MANUALLY SELECTED, NEVER automatically assigned.
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
    BRANCH_ASSIGNMENTS: "@epic_discipleship_branch_assignments_v1",
    ASSIGNED_ROLES: "@epic_discipleship_assigned_roles_v1",
    ENCOUNTERS: "@epic_discipleship_encounters_v1",
    DEVOTIONS: "@epic_discipleship_devotions_v1",
    THOUGHTS: "@epic_discipleship_thoughts_v1",
    PULSE: "@epic_discipleship_pulse_v1",
};

// ============================================================
// SERVICE IMPLEMENTATION
// ============================================================

export const discipleshipWebService = {
    /**
     * Fetch all church members from the database API
     */
    async getChurchMembers(): Promise<RealChurchMember[]> {
        try {
            const res = await apiClient("/Members");
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    return data.map((m: any) => ({
                        memberId: Number(m.memberId || m.id || 0),
                        memberCode: m.memberCode || "",
                        firstName: m.firstName || "",
                        middleName: m.middleName || "",
                        lastName: m.lastName || "",
                        fullName: m.fullName || `${m.firstName || ""} ${m.lastName || ""}`.trim() || `Member #${m.memberId}`,
                        gender: m.gender || "",
                        contactNumber: m.contactNumber || m.phone || "",
                        ministry: m.ministry || "General Ministry",
                        status: m.status || "ACTIVE",
                        photoPath: m.photoPath || "",
                        dateJoined: m.dateJoined || "",
                    }));
                }
            }
        } catch (err) {
            console.warn("DiscipleshipWebService: Failed to load /Members, using fallback seed", err);
        }

        // Realistic seed members if offline or initial setup
        return [
            {
                memberId: 101,
                memberCode: "MEM-001",
                firstName: "Ronnel",
                lastName: "Aviguetero",
                fullName: "Ptr. Ronnel M. Aviguetero",
                gender: "Male",
                contactNumber: "+639171234567",
                ministry: "Senior Pastoral Oversight",
                status: "ACTIVE",
                dateJoined: "2018-01-01",
            },
            {
                memberId: 102,
                memberCode: "MEM-002",
                firstName: "David",
                lastName: "Santos",
                fullName: "Pastor David Santos",
                gender: "Male",
                contactNumber: "+639185551234",
                ministry: "Pastoral Care & Discipleship",
                status: "ACTIVE",
                dateJoined: "2019-03-15",
            },
            {
                memberId: 103,
                memberCode: "MEM-003",
                firstName: "Michael",
                lastName: "Reyes",
                fullName: "Pastor Michael Reyes",
                gender: "Male",
                contactNumber: "+639198889999",
                ministry: "Evangelism & Missions",
                status: "ACTIVE",
                dateJoined: "2020-02-10",
            },
            {
                memberId: 104,
                memberCode: "MEM-004",
                firstName: "Grace",
                lastName: "Villanueva",
                fullName: "Sister Grace Villanueva",
                gender: "Female",
                contactNumber: "+639203334444",
                ministry: "Worship Department",
                status: "ACTIVE",
                dateJoined: "2021-06-20",
            },
            {
                memberId: 105,
                memberCode: "MEM-005",
                firstName: "Joshua",
                lastName: "Lim",
                fullName: "Brother Joshua Lim",
                gender: "Male",
                contactNumber: "+639227778888",
                ministry: "Youth Ministry",
                status: "ACTIVE",
                dateJoined: "2022-01-14",
            },
            {
                memberId: 106,
                memberCode: "MEM-006",
                firstName: "April Jhoy",
                lastName: "Aboc",
                fullName: "April Jhoy A. Aboc",
                gender: "Female",
                contactNumber: "+639251112233",
                ministry: "Youth Department",
                status: "ACTIVE",
                dateJoined: "2023-04-10",
            },
            {
                memberId: 107,
                memberCode: "MEM-007",
                firstName: "Jerose Ann Marie",
                lastName: "Alcantara",
                fullName: "Jerose Ann Marie B. Alcantara",
                gender: "Female",
                contactNumber: "+639274445566",
                ministry: "Youth Department",
                status: "ACTIVE",
                dateJoined: "2023-08-05",
            },
            {
                memberId: 108,
                memberCode: "MEM-008",
                firstName: "Caleb",
                lastName: "Mercado",
                fullName: "Caleb Mercado",
                gender: "Male",
                contactNumber: "+639289991122",
                ministry: "Ushering & Logistics",
                status: "ACTIVE",
                dateJoined: "2023-09-12",
            },
        ];
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
     * Roles are strictly assigned by Admin or Senior Pastor.
     */
    assignRole(memberId: number, position: ChurchPosition): void {
        const roles = this.getAssignedRoles();
        roles[memberId] = position;
        localStorage.setItem(STORAGE_KEYS.ASSIGNED_ROLES, JSON.stringify(roles));
    },

    /**
     * Get branch assignments (Mapping of leaderId -> Array of discipleIds)
     * Strictly enforces maximum 3 disciples per leader and zero duplicates.
     */
    getBranchAssignments(): Record<number, number[]> {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.BRANCH_ASSIGNMENTS);
            if (raw) return JSON.parse(raw);
        } catch {}

        // Default initial hierarchy if not yet configured
        // Senior Pastor (101) mentors Asst Pastors (102, 103)
        // Pastor David (102) mentors Joshua Lim (105), Grace Villanueva (104), Caleb Mercado (108)
        // Brother Joshua Lim (105) mentors April Jhoy Aboc (106), Jerose Ann Marie (107)
        const defaultMap: Record<number, number[]> = {
            101: [102, 103],
            102: [105, 104, 108],
            105: [106, 107],
        };
        localStorage.setItem(STORAGE_KEYS.BRANCH_ASSIGNMENTS, JSON.stringify(defaultMap));
        return defaultMap;
    },

    /**
     * Pastoral Control: Reassign or adopt an accountable disciple to a leader.
     * Enforces strict limit: Max 3 disciples per leader.
     * Enforces zero duplicates: A disciple can only belong to one leader at a time.
     */
    assignDiscipleToLeader(leaderId: number, discipleId: number): { success: boolean; message: string } {
        if (leaderId === discipleId) {
            return { success: false, message: "A leader cannot mentor themselves." };
        }

        const assignments = this.getBranchAssignments();
        const currentList = assignments[leaderId] || [];

        // Check if already in this leader's list
        if (currentList.includes(discipleId)) {
            return { success: false, message: "Member is already an accountable disciple of this leader." };
        }

        // Strict 1:3 Limit Check
        if (currentList.length >= MAX_DISCIPLES_PER_LEADER) {
            return {
                success: false,
                message: `Capacity limit reached! 1 Leader is restricted to maximum ${MAX_DISCIPLES_PER_LEADER} disciples for deep, intentional multiplication.`,
            };
        }

        // Zero duplicate rule: Remove disciple from any existing leader
        for (const lId in assignments) {
            assignments[lId] = assignments[lId].filter((id) => id !== discipleId);
        }

        // Add to new leader
        if (!assignments[leaderId]) {
            assignments[leaderId] = [];
        }
        assignments[leaderId].push(discipleId);

        localStorage.setItem(STORAGE_KEYS.BRANCH_ASSIGNMENTS, JSON.stringify(assignments));
        return { success: true, message: "Disciple successfully assigned to leader's branch." };
    },

    /**
     * Remove a disciple from a leader's branch
     */
    removeDiscipleFromLeader(leaderId: number, discipleId: number): void {
        const assignments = this.getBranchAssignments();
        if (assignments[leaderId]) {
            assignments[leaderId] = assignments[leaderId].filter((id) => id !== discipleId);
            localStorage.setItem(STORAGE_KEYS.BRANCH_ASSIGNMENTS, JSON.stringify(assignments));
        }
    },

    /**
     * Get or seed realistic devotions for spiritual monitoring
     */
    getMemberDevotions(memberId: number): DailyDevotion[] {
        try {
            const raw = localStorage.getItem(`${STORAGE_KEYS.DEVOTIONS}_${memberId}`);
            if (raw) return JSON.parse(raw);
        } catch {}

        const sampleDevotions: DailyDevotion[] = [
            {
                devotionId: `dev-${memberId}-1`,
                date: new Date(Date.now() - 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                passage: "Proverbs 3:5-6",
                rhemaVerse: "Trust in the Lord with all your heart, and do not lean on your own understanding.",
                observation: "Solomon emphasizes full dependence on God's wisdom over our limited human intellect and pride.",
                application: "I will surrender my anxiety regarding family finances today and seek pastoral counsel before making major decisions.",
                prayer: "Lord, align my heart to trust Your timing. Remove self-reliance and guide my steps. Amen.",
                sharedWithPastor: true,
                createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
            {
                devotionId: `dev-${memberId}-2`,
                date: new Date(Date.now() - 86400000 * 2).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                passage: "John 15:4-5",
                rhemaVerse: "Abide in me, and I in you. As the branch cannot bear fruit by itself, unless it abides in the vine, neither can you, unless you abide in me.",
                observation: "Fruitfulness is a byproduct of intimate abiding in Christ, not mere striving or church busyness.",
                application: "Spend 20 quiet minutes before looking at my smartphone or starting work tasks.",
                prayer: "Jesus, help me cling to You as my true source of life and ministry strength. Amen.",
                sharedWithPastor: true,
                createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            },
        ];
        return sampleDevotions;
    },

    /**
     * Get or seed realistic spiritual thoughts / burdens
     */
    getMemberThoughts(memberId: number): DiscipleThought[] {
        try {
            const raw = localStorage.getItem(`${STORAGE_KEYS.THOUGHTS}_${memberId}`);
            if (raw) return JSON.parse(raw);
        } catch {}

        return [
            {
                thoughtId: `th-${memberId}-1`,
                date: new Date(Date.now() - 86400000 * 3).toLocaleDateString(),
                category: "SPIRITUAL_QUESTION",
                content: "Pastor, how do I practically balance ministry leadership responsibilities with demanding overtime shifts at work without burning out spiritually?",
                status: "SENT",
                createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            },
            {
                thoughtId: `th-${memberId}-2`,
                date: new Date(Date.now() - 86400000 * 7).toLocaleDateString(),
                category: "TESTIMONY",
                content: "Praise God! My mother was discharged from the hospital after 10 days of prayer. Thank you for standing with our family in intercession!",
                status: "REVIEWED",
                createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
                mentorResponse: "Hallelujah! God is our Great Healer. Continued blessings and strength to your family.",
            },
        ];
    },

    /**
     * Get member spiritual pulse
     */
    getMemberPulse(memberId: number): SpiritualPulse {
        try {
            const raw = localStorage.getItem(`${STORAGE_KEYS.PULSE}_${memberId}`);
            if (raw) return JSON.parse(raw);
        } catch {}

        // Mock pulse based on memberId for realistic testing
        if (memberId === 108) {
            return {
                heartState: "CRISIS",
                wordDaysWeekly: 1,
                prayerDaysWeekly: 1,
                struggleCategory: "Work Stress & Discouragement",
                prayerNeed: "Feeling overwhelmed by debt and struggling with consistent quiet time.",
                submittedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
            };
        } else if (memberId === 104) {
            return {
                heartState: "DRAINED",
                wordDaysWeekly: 2,
                prayerDaysWeekly: 2,
                struggleCategory: "Family Health Sickness",
                prayerNeed: "Healing for my mother hospitalized with pneumonia.",
                submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            };
        } else {
            return {
                heartState: "PEACEFUL",
                wordDaysWeekly: 5,
                prayerDaysWeekly: 6,
                struggleCategory: "Ministry Fruitfulness",
                prayerNeed: "Wisdom and bold boldness to invite 3 new classmates to our youth cell group.",
                submittedAt: new Date(Date.now() - 86400000).toISOString(),
            };
        }
    },

    /**
     * Calculate health status
     */
    calculateHealth(pulse: SpiritualPulse, lastEncounterDays: number, missedSundays: number): BranchHealth {
        if (pulse.heartState === "CRISIS" || missedSundays >= 2 || lastEncounterDays > 18) {
            return "AT_RISK";
        }
        if (pulse.heartState === "DRAINED" || pulse.heartState === "BATTLING" || missedSundays === 1 || lastEncounterDays >= 10 || pulse.wordDaysWeekly < 3) {
            return "ATTENTION";
        }
        return "HEALTHY";
    },

    /**
     * Log a 1-on-1 discipleship encounter
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
     * Rooted at Senior Pastor (Ptr. Ronnel M. Aviguetero)
     */
    async buildFullLineageTree(): Promise<{ root: DiscipleshipMemberNode; allMembers: RealChurchMember[] }> {
        const members = await this.getChurchMembers();
        const assignedRoles = this.getAssignedRoles();
        const branchAssignments = this.getBranchAssignments();

        // 1. Locate or create Senior Pastor Ronnel M. Aviguetero
        let seniorPastorMember = members.find(
            (m) =>
                m.fullName.toLowerCase().includes("ronnel") &&
                m.fullName.toLowerCase().includes("aviguetero")
        );

        if (!seniorPastorMember) {
            // Find any member marked as Senior Pastor or create virtual anchor
            seniorPastorMember = {
                memberId: 101,
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
        }

        const memberMap = new Map<number, RealChurchMember>();
        members.forEach((m) => memberMap.set(m.memberId, m));
        memberMap.set(seniorPastorMember.memberId, seniorPastorMember);

        // Helper to determine position
        const getPositionForMember = (memberId: number, member: RealChurchMember): ChurchPosition => {
            if (memberId === seniorPastorMember!.memberId) {
                return "EPIC_SENIOR_PASTOR";
            }
            if (assignedRoles[memberId]) {
                return assignedRoles[memberId];
            }
            // Auto detect from ministry/name
            const nameLower = member.fullName.toLowerCase();
            const minLower = (member.ministry || "").toLowerCase();

            if (nameLower.includes("ronnel") && nameLower.includes("aviguetero")) {
                return "EPIC_SENIOR_PASTOR";
            }
            if (nameLower.includes("asst. senior pastor") || minLower.includes("assistant senior pastor")) {
                return "EPIC_ASSISTANT_SENIOR_PASTOR";
            }
            if (nameLower.includes("pastor") || minLower.includes("pastoral")) {
                return "EPIC_ASSISTANT_PASTOR";
            }
            if (minLower.includes("leader") || minLower.includes("department head") || minLower.includes("director")) {
                return "EPIC_LEADER";
            }
            if (minLower.includes("cell") || minLower.includes("discipler") || minLower.includes("youth")) {
                return "EPIC_DISCIPLER";
            }
            return "DISCIPLE";
        };

        // Recursive tree builder
        const buildNode = (memberId: number, gen: number, parentLeaderId: number | null, visited = new Set<number>()): DiscipleshipMemberNode => {
            visited.add(memberId);
            const m = memberMap.get(memberId) || {
                memberId,
                memberCode: `MEM-${memberId}`,
                firstName: "Church",
                lastName: "Member",
                fullName: `Member #${memberId}`,
                gender: "Male",
                contactNumber: "",
                ministry: "General",
                status: "ACTIVE",
            };

            const position = getPositionForMember(memberId, m);
            const pulse = this.getMemberPulse(memberId);
            const devotions = this.getMemberDevotions(memberId);
            const thoughts = this.getMemberThoughts(memberId);
            const encounters = this.getEncounters(memberId);

            // Metrics calculation
            const lastEncounterDays = memberId === 108 ? 19 : memberId === 104 ? 10 : 3;
            const missedSundays = memberId === 108 ? 2 : memberId === 104 ? 1 : 0;
            const health = this.calculateHealth(pulse, lastEncounterDays, missedSundays);

            // Determine growth stage
            let stage: GrowthStage = "BRANCH";
            if (gen === 1) stage = "FRUIT_MULTIPLIER";
            else if (gen === 2) stage = "FRUIT_MULTIPLIER";
            else if (gen === 3) stage = "BRANCH";
            else if (gen === 4) stage = "TRUNK";
            else if (gen >= 5) stage = "ROOT";

            const childIds = branchAssignments[memberId] || [];
            const children: DiscipleshipMemberNode[] = [];

            for (const cId of childIds) {
                if (!visited.has(cId)) {
                    children.push(buildNode(cId, gen + 1, memberId, new Set(visited)));
                }
            }

            const parentLeader = parentLeaderId ? memberMap.get(parentLeaderId) : undefined;

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

        const rootNode = buildNode(seniorPastorMember.memberId, 1, null);

        return {
            root: rootNode,
            allMembers: members,
        };
    },
};
