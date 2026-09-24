// ============================================================
// churchInActionService.ts
// EPIC Church Management System - "Church in Action" Module
//
// Pure Real Data Service:
// - Live Visitors from /api/Visitors
// - Live Members (Leaders & Disciplers) from /api/Members
// - Live Ministries from /api/Ministry
// - Direct SQL Conversion via /api/Visitors/{id}/convert-to-member
// - Leaders Delegation & Workload Tracking System
// ============================================================

import { API_BASE_URL } from "../config";

// ============================================================
// DATA TYPES
// ============================================================

export type SpiritualJourneyStage =
    | "NEW_VISITOR"
    | "ASSIGNED_LEADER"
    | "ACTIVE_FOLLOWUP"
    | "CONNECTED_CANDIDATE"
    | "CHURCH_MEMBER"
    | "DISCIPLE_IN_TRAINING"
    | "COMMISSIONED_LEADER";

export interface LeaderDelegation {
    visitorId: number;
    assignedLeaderId: number;       // MemberId from Members table
    assignedLeaderName: string;     // Member Full Name
    assignedLeaderContact?: string;
    delegatedBy: string;            // Pastor / Admin
    delegatedDate: string;
    targetContactDate?: string;
    priority: "Normal" | "High" | "Urgent";
    delegationStatus: "Assigned" | "Contact Initiated" | "In Follow-Up" | "Connected" | "Converted to Member";
    delegationNotes?: string;
    updatedAt: string;
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
    disciplerName: string; // Mentor/Leader
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
    ministryDepartment: string;
    ministryRole: string;
    commissioningStatus: "In Preparation" | "Ministry Intern" | "Commissioned Worker" | "Cell Leader / Disciple-Maker" | "Sent Out / Missionary";
    commissioningDate?: string;
    spiritualGifts: string[];
    mentorPastor: string;
    activeFruitCount: number;
    notes?: string;
}

export interface Prospect {
    id: string;
    fullName: string;
    contactNumber: string;
    address?: string;
    gender?: string;
    invitedBy: string;
    outreachCampaign: string;
    relationship: string;
    spiritualStatus: "Unchurched" | "Seeking" | "Backslidden" | "Believer Relocating" | "Other";
    prayerRequests?: string;
    invitationStatus: "In Prayer" | "Invited" | "Confirmed Attending" | "Follow-up Needed" | "Attended";
    targetServiceDate?: string;
    notes?: string;
    createdAt: string;
    promotedToVisitorId?: number;
}

export interface ChurchInActionDataStore {
    prospects: Prospect[];
    followUpLogs: FollowUpLog[];
    delegations: LeaderDelegation[];
    discipleshipProfiles: DiscipleshipProfile[];
    sendingDeployments: SendingDeployment[];
}

// ============================================================
// STORAGE KEY (v2 Clean - Zero Fake Seeds)
// ============================================================

const STORAGE_KEY = "epic_church_in_action_v2";

function getInitialStore(): ChurchInActionDataStore {
    return {
        prospects: [],
        followUpLogs: [],
        delegations: [],
        discipleshipProfiles: [],
        sendingDeployments: [],
    };
}

// ============================================================
// SERVICE CLASS
// ============================================================

class ChurchInActionService {
    // ------------------------------------------------------------
    // LOCAL DATA ACCESS
    // ------------------------------------------------------------

    private getStore(): ChurchInActionDataStore {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                const initial = getInitialStore();
                this.saveStore(initial);
                return initial;
            }
            const parsed = JSON.parse(raw) as Partial<ChurchInActionDataStore>;
            return {
                prospects: Array.isArray(parsed.prospects) ? parsed.prospects : [],
                followUpLogs: Array.isArray(parsed.followUpLogs) ? parsed.followUpLogs : [],
                delegations: Array.isArray(parsed.delegations) ? parsed.delegations : [],
                discipleshipProfiles: Array.isArray(parsed.discipleshipProfiles) ? parsed.discipleshipProfiles : [],
                sendingDeployments: Array.isArray(parsed.sendingDeployments) ? parsed.sendingDeployments : [],
            };
        } catch {
            const initial = getInitialStore();
            this.saveStore(initial);
            return initial;
        }
    }

    private saveStore(store: ChurchInActionDataStore): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
        } catch (e) {
            console.error("Failed to save ChurchInAction data", e);
        }
    }

    // ------------------------------------------------------------
    // REAL BACKEND API FETCH HELPER
    // ------------------------------------------------------------

    private async apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("clientToken") ||
            sessionStorage.getItem("clientToken") ||
            localStorage.getItem("clientAccessToken") ||
            sessionStorage.getItem("clientAccessToken") ||
            localStorage.getItem("jwt") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("epicToken") ||
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
    // 1. REAL LIVE DATA FETCHERS (NO FAKE / MOCK DATA)
    // ============================================================

    public async getLiveVisitors(): Promise<any[]> {
        try {
            const res = await this.apiFetch<any[]>("Visitors");
            return Array.isArray(res) ? res : [];
        } catch (err) {
            console.error("Error loading real visitors from database", err);
            return [];
        }
    }

    public async getLiveMembers(): Promise<any[]> {
        try {
            const res = await this.apiFetch<any[]>("Members");
            return Array.isArray(res) ? res : [];
        } catch (err) {
            console.error("Error loading real members from database", err);
            return [];
        }
    }

    public async getLiveMinistries(): Promise<any[]> {
        try {
            const res = await this.apiFetch<any[]>("Ministry");
            return Array.isArray(res) ? res : [];
        } catch (err) {
            console.error("Error loading ministries from database", err);
            return [];
        }
    }

    public async createLiveVisitor(data: {
        firstName: string;
        middleName?: string;
        lastName: string;
        gender?: string;
        contactNumber?: string;
        address?: string;
        invitedBy?: string;
        ministry?: string;
        notes?: string;
    }): Promise<any> {
        return await this.apiFetch<any>("Visitors", {
            method: "POST",
            body: JSON.stringify({
                firstName: data.firstName.trim(),
                middleName: (data.middleName || "").trim(),
                lastName: data.lastName.trim(),
                gender: data.gender || "Other",
                contactNumber: (data.contactNumber || "").trim(),
                address: (data.address || "").trim(),
                invitedBy: (data.invitedBy || "").trim(),
                ministry: (data.ministry || "").trim(),
                firstVisitDate: new Date().toISOString().split("T")[0],
                notes: (data.notes || "").trim(),
            }),
        });
    }

    /**
     * Executes real SQL database conversion of visitor to official Member!
     */
    public async convertVisitorToMember(visitorId: number): Promise<{
        message: string;
        visitorId: number;
        memberId?: number;
        memberCode?: string;
    }> {
        const result = await this.apiFetch<{
            message: string;
            visitorId: number;
            memberId?: number;
            memberCode?: string;
        }>(`Visitors/${visitorId}/convert-to-member`, {
            method: "POST",
        });

        // Update delegation status
        const store = this.getStore();
        const delegation = store.delegations.find(d => d.visitorId === visitorId);
        if (delegation) {
            delegation.delegationStatus = "Converted to Member";
            delegation.updatedAt = new Date().toISOString();
        }

        // Add follow-up conversion milestone
        store.followUpLogs.unshift({
            id: `FL-${Date.now()}`,
            visitorId,
            interactionDate: new Date().toISOString().split("T")[0],
            type: "Church Fellowship",
            ministerName: delegation?.assignedLeaderName || "Pastoral Team",
            notes: `Officially converted to full Church Member! Generated Member Code: ${result.memberCode || "MEM"}.`,
            outcome: "Accepted Christ / Salvation",
        });

        this.saveStore(store);
        return result;
    }

    // ============================================================
    // 2. LEADERS DELEGATION SYSTEM
    // ============================================================

    public getDelegations(): LeaderDelegation[] {
        return this.getStore().delegations;
    }

    public getDelegationForVisitor(visitorId: number): LeaderDelegation | undefined {
        return this.getStore().delegations.find(d => d.visitorId === visitorId);
    }

    public saveDelegation(delegation: Omit<LeaderDelegation, "updatedAt">): LeaderDelegation {
        const store = this.getStore();
        const index = store.delegations.findIndex(d => d.visitorId === delegation.visitorId);
        const updated: LeaderDelegation = {
            ...delegation,
            updatedAt: new Date().toISOString(),
        };

        if (index >= 0) {
            store.delegations[index] = updated;
        } else {
            store.delegations.unshift(updated);
        }

        // Auto log delegation touchpoint
        store.followUpLogs.unshift({
            id: `FL-${Date.now()}`,
            visitorId: delegation.visitorId,
            interactionDate: delegation.delegatedDate,
            type: "Church Fellowship",
            ministerName: delegation.assignedLeaderName,
            notes: `Follow-up delegated to Leader: ${delegation.assignedLeaderName} (Priority: ${delegation.priority}). Target touchpoint by: ${delegation.targetContactDate || "Within 48h"}. ${delegation.delegationNotes || ""}`,
            outcome: "Receptive & Warm",
            nextFollowUpDate: delegation.targetContactDate,
        });

        this.saveStore(store);
        return updated;
    }

    public updateDelegationStatus(visitorId: number, status: LeaderDelegation["delegationStatus"]): void {
        const store = this.getStore();
        const delegation = store.delegations.find(d => d.visitorId === visitorId);
        if (delegation) {
            delegation.delegationStatus = status;
            delegation.updatedAt = new Date().toISOString();
            this.saveStore(store);
        }
    }

    public removeDelegation(visitorId: number): void {
        const store = this.getStore();
        store.delegations = store.delegations.filter(d => d.visitorId !== visitorId);
        this.saveStore(store);
    }

    // ============================================================
    // 3. TOUCHPOINTS & FOLLOW-UP LOGS
    // ============================================================

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

        // Advance delegation status if assigned
        const delegation = store.delegations.find(d => d.visitorId === log.visitorId);
        if (delegation && delegation.delegationStatus === "Assigned") {
            delegation.delegationStatus = "Contact Initiated";
            delegation.updatedAt = new Date().toISOString();
        }

        this.saveStore(store);
        return newLog;
    }

    // ============================================================
    // 4. CONSOLIDATION & DISCIPLESHIP
    // ============================================================

    public getDiscipleshipProfiles(): DiscipleshipProfile[] {
        return this.getStore().discipleshipProfiles;
    }

    public saveDiscipleshipProfile(profile: Partial<DiscipleshipProfile> & { fullName: string; contactNumber: string }): DiscipleshipProfile {
        const store = this.getStore();
        if (profile.id) {
            const index = store.discipleshipProfiles.findIndex(d => d.id === profile.id);
            if (index >= 0) {
                const updated = { ...store.discipleshipProfiles[index], ...profile };
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
            disciplerName: profile.disciplerName || "Assigned Leader",
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
            spiritualHealthScore: profile.spiritualHealthScore || 5,
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
        const count = Object.values(profile.foundations).filter(Boolean).length;
        if (count >= 5 && profile.waterBaptism.isBaptized) {
            profile.stage = "Cell Member";
        } else if (count >= 3) {
            profile.stage = "Foundation Track";
        }

        this.saveStore(store);
        return profile;
    }

    public deleteDiscipleshipProfile(id: string): void {
        const store = this.getStore();
        store.discipleshipProfiles = store.discipleshipProfiles.filter(d => d.id !== id);
        this.saveStore(store);
    }

    // ============================================================
    // 5. SENDING & MOBILIZATION
    // ============================================================

    public getSendingDeployments(): SendingDeployment[] {
        return this.getStore().sendingDeployments;
    }

    public saveSendingDeployment(deployment: Partial<SendingDeployment> & { fullName: string; ministryDepartment: string; ministryRole: string }): SendingDeployment {
        const store = this.getStore();
        if (deployment.id) {
            const index = store.sendingDeployments.findIndex(s => s.id === deployment.id);
            if (index >= 0) {
                const updated = { ...store.sendingDeployments[index], ...deployment };
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

    public deleteSendingDeployment(id: string): void {
        const store = this.getStore();
        store.sendingDeployments = store.sendingDeployments.filter(s => s.id !== id);
        this.saveStore(store);
    }

    // ============================================================
    // 6. PROSPECTS & EVANGELISM
    // ============================================================

    public getProspects(): Prospect[] {
        return this.getStore().prospects;
    }

    public saveProspect(prospect: Partial<Prospect> & { fullName: string; contactNumber: string }): Prospect {
        const store = this.getStore();
        if (prospect.id) {
            const index = store.prospects.findIndex(p => p.id === prospect.id);
            if (index >= 0) {
                const updated: Prospect = { ...store.prospects[index], ...prospect };
                store.prospects[index] = updated;
                this.saveStore(store);
                return updated;
            }
        }

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

    public deleteProspect(id: string): void {
        const store = this.getStore();
        store.prospects = store.prospects.filter(p => p.id !== id);
        this.saveStore(store);
    }

    public async promoteProspectToVisitor(prospectId: string): Promise<any> {
        const store = this.getStore();
        const prospect = store.prospects.find(p => p.id === prospectId);
        if (!prospect) throw new Error("Prospect not found.");

        const parts = prospect.fullName.trim().split(/\s+/);
        const firstName = parts[0] || "New";
        const lastName = parts.slice(1).join(" ") || "Visitor";

        const res = await this.createLiveVisitor({
            firstName,
            lastName,
            gender: prospect.gender,
            contactNumber: prospect.contactNumber,
            address: prospect.address,
            invitedBy: prospect.invitedBy,
            ministry: prospect.outreachCampaign,
            notes: `Promoted from Outreach list (${prospect.id}). ${prospect.prayerRequests || ""}`,
        });

        prospect.invitationStatus = "Attended";
        prospect.promotedToVisitorId = res?.visitorId;
        this.saveStore(store);
        return res;
    }
}

export const churchInActionService = new ChurchInActionService();
export default churchInActionService;
