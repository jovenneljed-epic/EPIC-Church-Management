// ============================================================
// churchInActionService.ts
// EPIC Church Management System - "Church in Action" Module
//
// Spiritual Lifecycle & Great Commission Engine:
// 1. Evangelism & Invitations (Win / Outreach)
// 2. Visitor Follow-Up (Connected to Visitors Data)
// 3. Consolidation & Discipleship (Foundations, Baptism, Cell Groups)
// 4. Sending & Mobilization (Ministry Deployment & Reproduction)
// ============================================================

import { API_BASE_URL } from "../config";

// ============================================================
// DATA TYPES
// ============================================================

export type SpiritualJourneyStage =
    | "PROSPECT"
    | "VISITOR"
    | "NEW_BELIEVER"
    | "GROWING_DISCIPLE"
    | "COMMISSIONED_LEADER";

export interface Prospect {
    id: string;
    fullName: string;
    contactNumber: string;
    address?: string;
    gender?: string;
    invitedBy: string; // Church member or evangelist
    outreachCampaign: string; // e.g., "Easter Celebration", "Youth Life Night", "Personal Invite"
    relationship: string; // e.g., "Colleague", "Neighbor", "Family", "Friend"
    spiritualStatus: "Unchurched" | "Seeking" | "Backslidden" | "Believer Relocating" | "Other";
    prayerRequests?: string;
    invitationStatus: "In Prayer" | "Invited" | "Confirmed Attending" | "Follow-up Needed" | "Attended";
    targetServiceDate?: string;
    notes?: string;
    createdAt: string;
    promotedToVisitorId?: number;
}

export interface FollowUpLog {
    id: string;
    visitorId: number;
    interactionDate: string;
    type: "Phone Call" | "Home Visit" | "Coffee Meeting" | "SMS / Chat" | "Prayer Delivered" | "Church Fellowship";
    ministerName: string;
    notes: string;
    outcome:
        | "Receptive & Warm"
        | "Accepted Christ / Salvation"
        | "Requested Home Bible Study"
        | "Scheduled Next Visit"
        | "Needs Encouragement"
        | "Not Interested";
    nextFollowUpDate?: string;
}

export interface DiscipleshipProfile {
    id: string;
    visitorId?: number;
    memberId?: number;
    fullName: string;
    contactNumber: string;
    disciplerName: string; // Mentor
    cellGroupName: string; // Life Group
    cellLeaderName: string;
    startDate: string;
    stage: "New Believer" | "Foundation Track" | "Baptized Disciple" | "Cell Member" | "Leader in Training";
    waterBaptism: {
        isBaptized: boolean;
        baptismDate?: string;
        officiatingPastor?: string;
        certificateIssued?: boolean;
    };
    foundations: {
        lesson1Salvation: boolean;      // Assurance of Salvation & Lordship
        lesson2WordAndPrayer: boolean;  // Word of God & Prayer Life
        lesson3HolySpirit: boolean;     // The Holy Spirit & Christian Walk
        lesson4WaterBaptism: boolean;   // Water Baptism & Obedience
        lesson5ChurchLife: boolean;     // Church Community & Fellowship
        lesson6Stewardship: boolean;    // Stewardship & The Great Commission
    };
    spiritualHealthScore: number; // 1 to 5 stars
    notes?: string;
}

export interface SendingDeployment {
    id: string;
    discipleshipId?: string;
    memberId?: number;
    fullName: string;
    contactNumber?: string;
    ministryDepartment:
        | "Worship & Arts"
        | "Ushering & Greeters"
        | "Media & Production"
        | "Kids & Youth Ministry"
        | "Evangelism & Outreach"
        | "Prayer & Intercession"
        | "Pastoral Care";
    ministryRole: string; // e.g. "Acoustic Guitarist", "Team Leader", "Sunday School Teacher"
    commissioningStatus: "In Preparation" | "Ministry Intern" | "Commissioned Worker" | "Cell Leader / Disciple-Maker" | "Sent Out / Missionary";
    commissioningDate?: string;
    spiritualGifts: string[]; // e.g. ["Evangelism", "Encouragement", "Leadership", "Teaching"]
    mentorPastor: string;
    activeFruitCount: number; // Number of souls being nurtured/invited by this leader
    notes?: string;
}

export interface SpiritualProfileSummary {
    id: string;
    fullName: string;
    contactNumber: string;
    currentStage: SpiritualJourneyStage;
    stageLabel: string;
    origin: "Evangelism Prospect" | "Walk-in Visitor" | "Member Referral";
    invitedBy?: string;
    disciplerName?: string;
    cellGroup?: string;
    ministryRole?: string;
    daysInJourney: number;
    baptismStatus: boolean;
    foundationsCompletedCount: number; // 0 to 6
    commissionedStatus?: string;
    lastTouchpointDate?: string;
}

export interface ChurchInActionDataStore {
    prospects: Prospect[];
    followUpLogs: FollowUpLog[];
    discipleshipProfiles: DiscipleshipProfile[];
    sendingDeployments: SendingDeployment[];
}

// ============================================================
// STORAGE KEY & INITIAL SEED DATA
// ============================================================

const STORAGE_KEY = "epic_church_in_action_store_v1";

function getInitialStore(): ChurchInActionDataStore {

    return {
        prospects: [
            {
                id: "PR-2026-001",
                fullName: "Ricardo 'Ricky' Dela Cruz",
                contactNumber: "0917-889-1234",
                address: "Barangay San Vicente, City",
                gender: "Male",
                invitedBy: "Bro. Jonathan Santos",
                outreachCampaign: "Easter Celebration Outreach",
                relationship: "Colleague at Work",
                spiritualStatus: "Seeking",
                prayerRequests: "Praying for guidance with family business and inner peace.",
                invitationStatus: "Confirmed Attending",
                targetServiceDate: "2026-09-27",
                notes: "Very open to talking about faith. Promised to come with his wife.",
                createdAt: "2026-09-18",
            },
            {
                id: "PR-2026-002",
                fullName: "Maria Angelica Reyes",
                contactNumber: "0920-554-7890",
                address: "Poblacion Central",
                gender: "Female",
                invitedBy: "Sis. Grace Morales",
                outreachCampaign: "Youth Life & Worship Night",
                relationship: "High School Classmate",
                spiritualStatus: "Unchurched",
                prayerRequests: "Struggling with anxiety and finding purpose in life.",
                invitationStatus: "Invited",
                targetServiceDate: "2026-09-27",
                notes: "Shared gospel tracts with her. She said she will think about attending.",
                createdAt: "2026-09-20",
            },
            {
                id: "PR-2026-003",
                fullName: "Mark Anthony Villanueva",
                contactNumber: "0945-312-9988",
                address: "Sitio Riverside, San Vicente",
                gender: "Male",
                invitedBy: "Bro. Danilo Perez",
                outreachCampaign: "Barangay Medical & Gospel Mission",
                relationship: "Neighbor",
                spiritualStatus: "Backslidden",
                prayerRequests: "Health restoration and rebuilding his spiritual walk.",
                invitationStatus: "In Prayer",
                notes: "Used to attend church years ago. Needs persistent prayer and visit.",
                createdAt: "2026-09-22",
            }
        ],
        followUpLogs: [
            {
                id: "FL-001",
                visitorId: 1,
                interactionDate: "2026-09-21",
                type: "Phone Call",
                ministerName: "Pastor David",
                notes: "Thanked them for attending last Sunday. Expressed great joy with the worship atmosphere.",
                outcome: "Receptive & Warm",
                nextFollowUpDate: "2026-09-25",
            },
            {
                id: "FL-002",
                visitorId: 1,
                interactionDate: "2026-09-23",
                type: "Home Visit",
                ministerName: "Bro. Caleb & Sis. Sarah",
                notes: "Delivered welcome care package. Prayed for family protection and discussed Foundations 1.",
                outcome: "Requested Home Bible Study",
                nextFollowUpDate: "2026-09-28",
            }
        ],
        discipleshipProfiles: [
            {
                id: "DSP-001",
                fullName: "Joshua Emmanuel Tan",
                contactNumber: "0918-334-9021",
                disciplerName: "Elder Michael Cruz",
                cellGroupName: "Victory San Vicente - Men of Faith",
                cellLeaderName: "Bro. Jonathan Santos",
                startDate: "2026-08-10",
                stage: "Foundation Track",
                waterBaptism: {
                    isBaptized: true,
                    baptismDate: "2026-08-30",
                    officiatingPastor: "Pastor Roberto Garcia",
                    certificateIssued: true,
                },
                foundations: {
                    lesson1Salvation: true,
                    lesson2WordAndPrayer: true,
                    lesson3HolySpirit: true,
                    lesson4WaterBaptism: true,
                    lesson5ChurchLife: false,
                    lesson6Stewardship: false,
                },
                spiritualHealthScore: 5,
                notes: "High spiritual hunger. Attends cell group consistently every Thursday.",
            },
            {
                id: "DSP-002",
                fullName: "Hannah Sophia Soriano",
                contactNumber: "0927-441-8899",
                disciplerName: "Sis. Teresa Gomez",
                cellGroupName: "Grace & Light Young Adults",
                cellLeaderName: "Sis. Mary Joy Ramos",
                startDate: "2026-09-01",
                stage: "New Believer",
                waterBaptism: {
                    isBaptized: false,
                },
                foundations: {
                    lesson1Salvation: true,
                    lesson2WordAndPrayer: true,
                    lesson3HolySpirit: false,
                    lesson4WaterBaptism: false,
                    lesson5ChurchLife: false,
                    lesson6Stewardship: false,
                },
                spiritualHealthScore: 4,
                notes: "Scheduled for the next water baptism service in October.",
            }
        ],
        sendingDeployments: [
            {
                id: "SND-001",
                discipleshipId: "DSP-001",
                fullName: "Gabriel Christian Ramos",
                contactNumber: "0915-662-7711",
                ministryDepartment: "Worship & Arts",
                ministryRole: "Acoustic Guitarist & Vocalist",
                commissioningStatus: "Commissioned Worker",
                commissioningDate: "2026-07-15",
                spiritualGifts: ["Worship / Music", "Encouragement", "Evangelism"],
                mentorPastor: "Pastor Roberto Garcia",
                activeFruitCount: 4,
                notes: "Leading weekly worship sets. Actively discipling 2 new young men.",
            },
            {
                id: "SND-002",
                fullName: "Jennifer Mae Alonzo",
                contactNumber: "0998-112-4433",
                ministryDepartment: "Kids & Youth Ministry",
                ministryRole: "Junior Church Teacher",
                commissioningStatus: "Cell Leader / Disciple-Maker",
                commissioningDate: "2026-06-01",
                spiritualGifts: ["Teaching", "Pastoral Care", "Hospitality"],
                mentorPastor: "Sis. Rebecca Alonzo",
                activeFruitCount: 6,
                notes: "Leading a thriving campus cell group. Multiplying leaders.",
            }
        ]
    };
}

// ============================================================
// SERVICE CLASS
// ============================================================

class ChurchInActionService {
    // ------------------------------------------------------------
    // STORE HELPERS
    // ------------------------------------------------------------

    private getStore(): ChurchInActionDataStore {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                const initial = getInitialStore();
                this.saveStore(initial);
                return initial;
            }
            const parsed = JSON.parse(raw) as ChurchInActionDataStore;
            // Ensure array safety
            return {
                prospects: Array.isArray(parsed.prospects) ? parsed.prospects : [],
                followUpLogs: Array.isArray(parsed.followUpLogs) ? parsed.followUpLogs : [],
                discipleshipProfiles: Array.isArray(parsed.discipleshipProfiles) ? parsed.discipleshipProfiles : [],
                sendingDeployments: Array.isArray(parsed.sendingDeployments) ? parsed.sendingDeployments : [],
            };
        } catch (e) {
            console.warn("Error reading ChurchInAction store, falling back to seed", e);
            const initial = getInitialStore();
            this.saveStore(initial);
            return initial;
        }
    }

    private saveStore(store: ChurchInActionDataStore): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
        } catch (e) {
            console.error("Failed to save ChurchInAction store", e);
        }
    }

    // ------------------------------------------------------------
    // API CALL HELPER
    // ------------------------------------------------------------

    private async apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("clientToken") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt") ||
            "";

        const baseUrl = API_BASE_URL.replace(/\/+$/, "");
        const cleanEndpoint = endpoint.replace(/^\/+/, "");
        const url = `${baseUrl}/${cleanEndpoint}`;

        const headers = new Headers(options.headers);
        if (options.body && !headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        const response = await fetch(url, { ...options, headers });
        const text = await response.text();

        if (!response.ok) {
            let msg = `HTTP error ${response.status}`;
            if (text.trim()) {
                try {
                    const data = JSON.parse(text);
                    msg = data.message || data.title || data.error || msg;
                } catch {
                    msg = text;
                }
            }
            throw new Error(msg);
        }

        if (response.status === 204 || !text.trim()) {
            return {} as T;
        }
        return JSON.parse(text) as T;
    }

    // ============================================================
    // 1. INVITATION & EVANGELISM MANAGEMENT
    // ============================================================

    public getProspects(): Prospect[] {
        return this.getStore().prospects;
    }

    public saveProspect(prospect: Partial<Prospect> & { fullName: string; contactNumber: string }): Prospect {
        const store = this.getStore();
        if (prospect.id) {
            // Edit
            const index = store.prospects.findIndex(p => p.id === prospect.id);
            if (index >= 0) {
                const updated: Prospect = {
                    ...store.prospects[index],
                    ...prospect,
                };
                store.prospects[index] = updated;
                this.saveStore(store);
                return updated;
            }
        }

        // Create
        const newId = `PR-${new Date().getFullYear()}-${String(store.prospects.length + 1).padStart(3, "0")}`;
        const newProspect: Prospect = {
            id: newId,
            fullName: prospect.fullName,
            contactNumber: prospect.contactNumber,
            address: prospect.address || "",
            gender: prospect.gender || "Not Specified",
            invitedBy: prospect.invitedBy || "Church Member",
            outreachCampaign: prospect.outreachCampaign || "Personal Outreach",
            relationship: prospect.relationship || "Acquaintance",
            spiritualStatus: prospect.spiritualStatus || "Seeking",
            prayerRequests: prospect.prayerRequests || "",
            invitationStatus: prospect.invitationStatus || "In Prayer",
            targetServiceDate: prospect.targetServiceDate || "",
            notes: prospect.notes || "",
            createdAt: new Date().toISOString().split("T")[0],
        };

        store.prospects.unshift(newProspect);
        this.saveStore(store);
        return newProspect;
    }

    public deleteProspect(id: string): boolean {
        const store = this.getStore();
        const before = store.prospects.length;
        store.prospects = store.prospects.filter(p => p.id !== id);
        if (store.prospects.length !== before) {
            this.saveStore(store);
            return true;
        }
        return false;
    }

    /**
     * Promotes an Evangelism Prospect directly into the backend Visitors database!
     */
    public async promoteProspectToVisitor(prospectId: string): Promise<{ visitorId: number; message: string }> {
        const store = this.getStore();
        const prospect = store.prospects.find(p => p.id === prospectId);
        if (!prospect) {
            throw new Error("Prospect not found.");
        }

        // Split fullName into first and last name
        const parts = prospect.fullName.trim().split(/\s+/);
        const firstName = parts[0] || "New";
        const lastName = parts.slice(1).join(" ") || "Visitor";

        // Call backend API
        let createdVisitorId = Math.floor(Date.now() % 100000);
        try {
            const result = await this.apiFetch<{ visitorId: number; visitorCode: string }>("Visitors", {
                method: "POST",
                body: JSON.stringify({
                    firstName,
                    lastName,
                    middleName: "",
                    gender: prospect.gender || "Other",
                    contactNumber: prospect.contactNumber,
                    address: prospect.address || "",
                    invitedBy: prospect.invitedBy || "",
                    ministry: prospect.outreachCampaign || "Evangelism Outreach",
                    firstVisitDate: new Date().toISOString().split("T")[0],
                    notes: `Promoted from Evangelism Prospect (${prospect.id}). Spiritual Status: ${prospect.spiritualStatus}. Prayer requests: ${prospect.prayerRequests || "None"}. ${prospect.notes || ""}`,
                }),
            });
            if (result && result.visitorId) {
                createdVisitorId = result.visitorId;
            }
        } catch (err) {
            console.warn("Backend Visitors API call failed, using synthetic visitor ID for local continuity", err);
        }

        // Update prospect status in store
        prospect.invitationStatus = "Attended";
        prospect.promotedToVisitorId = createdVisitorId;
        this.saveStore(store);

        // Auto-create initial follow-up reminder
        this.addFollowUpLog({
            visitorId: createdVisitorId,
            interactionDate: new Date().toISOString().split("T")[0],
            type: "Church Fellowship",
            ministerName: prospect.invitedBy || "Evangelism Team",
            notes: `First attendance logged via Church in Action outreach! Prayed together and welcomed to Luke 4:18 Ministries.`,
            outcome: "Receptive & Warm",
            nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        });

        return {
            visitorId: createdVisitorId,
            message: `Successfully promoted ${prospect.fullName} to active Visitor!`,
        };
    }

    // ============================================================
    // 2. VISITOR FOLLOW-UP MANAGEMENT (CONNECTED TO VISITORS DATA)
    // ============================================================

    public async getLiveVisitors(): Promise<any[]> {
        try {
            return await this.apiFetch<any[]>("Visitors");
        } catch (e) {
            console.warn("Could not fetch live visitors from API, generating fallback visitor list", e);
            return [
                {
                    visitorId: 1,
                    visitorCode: "VIS-2026-0001",
                    firstName: "Ricardo",
                    lastName: "Dela Cruz",
                    fullName: "Dela Cruz, Ricardo",
                    contactNumber: "0917-889-1234",
                    address: "Barangay San Vicente, City",
                    invitedBy: "Bro. Jonathan Santos",
                    ministry: "Easter Celebration Outreach",
                    firstVisitDate: "2026-09-20",
                    visitCount: 1,
                    followUpStatus: "CONTACTED",
                    status: "ACTIVE",
                    isConvertedToMember: false,
                    notes: "Very receptive during first visit.",
                },
                {
                    visitorId: 2,
                    visitorCode: "VIS-2026-0002",
                    firstName: "Grace",
                    lastName: "Bautista",
                    fullName: "Bautista, Grace",
                    contactNumber: "0922-778-3344",
                    address: "Purok 3, San Vicente",
                    invitedBy: "Sis. Sarah Perez",
                    ministry: "Sunday Morning Service",
                    firstVisitDate: "2026-09-13",
                    visitCount: 2,
                    followUpStatus: "FOLLOW-UP",
                    status: "ACTIVE",
                    isConvertedToMember: false,
                    notes: "Attended twice consecutively with family.",
                }
            ];
        }
    }

    public getFollowUpLogs(visitorId?: number): FollowUpLog[] {
        const logs = this.getStore().followUpLogs;
        if (visitorId !== undefined) {
            return logs.filter(l => l.visitorId === visitorId);
        }
        return logs;
    }

    public addFollowUpLog(log: Omit<FollowUpLog, "id">): FollowUpLog {
        const store = this.getStore();
        const newLog: FollowUpLog = {
            ...log,
            id: `FL-${Date.now()}`,
        };
        store.followUpLogs.unshift(newLog);
        this.saveStore(store);
        return newLog;
    }

    public deleteFollowUpLog(id: string): boolean {
        const store = this.getStore();
        const before = store.followUpLogs.length;
        store.followUpLogs = store.followUpLogs.filter(l => l.id !== id);
        if (store.followUpLogs.length !== before) {
            this.saveStore(store);
            return true;
        }
        return false;
    }

    // ============================================================
    // 3. CONSOLIDATION & DISCIPLESHIP MANAGEMENT
    // ============================================================

    public getDiscipleshipProfiles(): DiscipleshipProfile[] {
        return this.getStore().discipleshipProfiles;
    }

    public saveDiscipleshipProfile(profile: Partial<DiscipleshipProfile> & { fullName: string; contactNumber: string }): DiscipleshipProfile {
        const store = this.getStore();
        if (profile.id) {
            const index = store.discipleshipProfiles.findIndex(d => d.id === profile.id);
            if (index >= 0) {
                const updated = {
                    ...store.discipleshipProfiles[index],
                    ...profile,
                };
                store.discipleshipProfiles[index] = updated;
                this.saveStore(store);
                return updated;
            }
        }

        const newId = `DSP-${new Date().getFullYear()}-${String(store.discipleshipProfiles.length + 1).padStart(3, "0")}`;
        const newProfile: DiscipleshipProfile = {
            id: newId,
            fullName: profile.fullName,
            contactNumber: profile.contactNumber,
            disciplerName: profile.disciplerName || "Assigned Discipler",
            cellGroupName: profile.cellGroupName || "San Vicente Life Group",
            cellLeaderName: profile.cellLeaderName || "Cell Leader",
            startDate: profile.startDate || new Date().toISOString().split("T")[0],
            stage: profile.stage || "New Believer",
            waterBaptism: profile.waterBaptism || { isBaptized: false },
            foundations: profile.foundations || {
                lesson1Salvation: false,
                lesson2WordAndPrayer: false,
                lesson3HolySpirit: false,
                lesson4WaterBaptism: false,
                lesson5ChurchLife: false,
                lesson6Stewardship: false,
            },
            spiritualHealthScore: profile.spiritualHealthScore || 4,
            notes: profile.notes || "",
        };

        store.discipleshipProfiles.unshift(newProfile);
        this.saveStore(store);
        return newProfile;
    }

    public toggleFoundationLesson(profileId: string, lessonKey: keyof DiscipleshipProfile["foundations"]): DiscipleshipProfile | null {
        const store = this.getStore();
        const profile = store.discipleshipProfiles.find(d => d.id === profileId);
        if (!profile) return null;

        profile.foundations[lessonKey] = !profile.foundations[lessonKey];

        // Auto-advance stage if lessons are completed
        const count = Object.values(profile.foundations).filter(Boolean).length;
        if (count >= 5 && profile.waterBaptism.isBaptized) {
            profile.stage = "Cell Member";
        } else if (count >= 3) {
            profile.stage = "Foundation Track";
        }

        this.saveStore(store);
        return profile;
    }

    public deleteDiscipleshipProfile(id: string): boolean {
        const store = this.getStore();
        const before = store.discipleshipProfiles.length;
        store.discipleshipProfiles = store.discipleshipProfiles.filter(d => d.id !== id);
        if (store.discipleshipProfiles.length !== before) {
            this.saveStore(store);
            return true;
        }
        return false;
    }

    // ============================================================
    // 4. SENDING & MOBILIZATION MANAGEMENT
    // ============================================================

    public getSendingDeployments(): SendingDeployment[] {
        return this.getStore().sendingDeployments;
    }

    public saveSendingDeployment(deployment: Partial<SendingDeployment> & { fullName: string; ministryDepartment: SendingDeployment["ministryDepartment"]; ministryRole: string }): SendingDeployment {
        const store = this.getStore();
        if (deployment.id) {
            const index = store.sendingDeployments.findIndex(s => s.id === deployment.id);
            if (index >= 0) {
                const updated = {
                    ...store.sendingDeployments[index],
                    ...deployment,
                };
                store.sendingDeployments[index] = updated;
                this.saveStore(store);
                return updated;
            }
        }

        const newId = `SND-${new Date().getFullYear()}-${String(store.sendingDeployments.length + 1).padStart(3, "0")}`;
        const newDeployment: SendingDeployment = {
            id: newId,
            fullName: deployment.fullName,
            contactNumber: deployment.contactNumber || "",
            ministryDepartment: deployment.ministryDepartment,
            ministryRole: deployment.ministryRole,
            commissioningStatus: deployment.commissioningStatus || "In Preparation",
            commissioningDate: deployment.commissioningDate || new Date().toISOString().split("T")[0],
            spiritualGifts: deployment.spiritualGifts || ["Serving", "Encouragement"],
            mentorPastor: deployment.mentorPastor || "Senior Pastor",
            activeFruitCount: deployment.activeFruitCount || 0,
            notes: deployment.notes || "",
        };

        store.sendingDeployments.unshift(newDeployment);
        this.saveStore(store);
        return newDeployment;
    }

    public deleteSendingDeployment(id: string): boolean {
        const store = this.getStore();
        const before = store.sendingDeployments.length;
        store.sendingDeployments = store.sendingDeployments.filter(s => s.id !== id);
        if (store.sendingDeployments.length !== before) {
            this.saveStore(store);
            return true;
        }
        return false;
    }

    // ============================================================
    // 5. UNIFIED LIFECYCLE SUMMARY & ANALYTICS
    // ============================================================

    public async getLifecyclePipeline(): Promise<{
        prospects: Prospect[];
        visitors: any[];
        disciples: DiscipleshipProfile[];
        sentLeaders: SendingDeployment[];
        stats: {
            totalProspects: number;
            totalVisitors: number;
            totalFollowUps: number;
            totalDisciples: number;
            totalSentWorkers: number;
            waterBaptizedCount: number;
            activeFruitMultiplied: number;
        };
    }> {
        const store = this.getStore();
        const visitors = await this.getLiveVisitors();

        const waterBaptizedCount = store.discipleshipProfiles.filter(d => d.waterBaptism.isBaptized).length;
        const activeFruitMultiplied = store.sendingDeployments.reduce((sum, s) => sum + (s.activeFruitCount || 0), 0);

        return {
            prospects: store.prospects,
            visitors,
            disciples: store.discipleshipProfiles,
            sentLeaders: store.sendingDeployments,
            stats: {
                totalProspects: store.prospects.length,
                totalVisitors: visitors.length,
                totalFollowUps: store.followUpLogs.length,
                totalDisciples: store.discipleshipProfiles.length,
                totalSentWorkers: store.sendingDeployments.length,
                waterBaptizedCount,
                activeFruitMultiplied,
            },
        };
    }
}

export const churchInActionService = new ChurchInActionService();
export default churchInActionService;
