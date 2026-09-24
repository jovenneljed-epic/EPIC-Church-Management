// ============================================================
// ChurchInActionPage.tsx
// EPIC CHURCH MANAGEMENT SYSTEM - Luke 4:18 Ministries
// Module: Church in Action (Newcomers Monitoring & Leaders Delegation System)
//
// 100% Real Database Connectivity (Visitors, Members, Ministries)
// Zero Mock Seeds
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Flame,
    Users,
    UserPlus,
    UserCheck,
    Send,
    HeartHandshake,
    BookOpen,
    Award,
    Sparkles,
    CheckCircle2,
    Clock,
    Filter,
    Search,
    Plus,
    Edit,
    Trash2,
    Printer,
    RefreshCw,
    Phone,
    GraduationCap,
    Layers,
    ShieldCheck,
    UserCog,
    AlertCircle,
    Calendar,
    Crown,
} from "lucide-react";

import "./ChurchInAction.css";
import churchInActionService from "../../services/churchInActionService";
import type {
    LeaderDelegation,
    FollowUpLog,
    DiscipleshipProfile,
    SendingDeployment,
    Prospect,
} from "../../services/churchInActionService";

type ActiveTab = "delegation" | "pipeline" | "followup" | "discipleship" | "sending" | "evangelism";

interface ChurchInActionPageProps {
    onBack?: () => void;
    canManage?: boolean;
}

const ChurchInActionPage: React.FC<ChurchInActionPageProps> = ({
    onBack,
    canManage = true,
}) => {
    // ============================================================
    // STATE
    // ============================================================

    const [activeTab, setActiveTab] = useState<ActiveTab>("delegation");
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [leaderFilter, setLeaderFilter] = useState<string>("ALL");

    // Real Database Collections
    const [realVisitors, setRealVisitors] = useState<any[]>([]);
    const [realMembers, setRealMembers] = useState<any[]>([]);
    const [realMinistries, setRealMinistries] = useState<any[]>([]);

    // Local Tracking Metadata
    const [delegations, setDelegations] = useState<LeaderDelegation[]>([]);
    const [followUpLogs, setFollowUpLogs] = useState<FollowUpLog[]>([]);
    const [disciples, setDisciples] = useState<DiscipleshipProfile[]>([]);
    const [sentLeaders, setSentLeaders] = useState<SendingDeployment[]>([]);
    const [prospects, setProspects] = useState<Prospect[]>([]);

    // Modals
    const [showDelegateModal, setShowDelegateModal] = useState<boolean>(false);
    const [selectedVisitorForDelegation, setSelectedVisitorForDelegation] = useState<any | null>(null);

    const [showRegisterVisitorModal, setShowRegisterVisitorModal] = useState<boolean>(false);
    const [showFollowUpModal, setShowFollowUpModal] = useState<boolean>(false);
    const [selectedVisitorForFollowUp, setSelectedVisitorForFollowUp] = useState<any | null>(null);

    const [showDiscipleshipModal, setShowDiscipleshipModal] = useState<boolean>(false);
    const [editingDisciple, setEditingDisciple] = useState<DiscipleshipProfile | null>(null);

    const [showSendingModal, setShowSendingModal] = useState<boolean>(false);
    const [editingDeployment, setEditingDeployment] = useState<SendingDeployment | null>(null);

    const [showProspectModal, setShowProspectModal] = useState<boolean>(false);

    // Feedback
    const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

    // Form States
    const [delegationForm, setDelegationForm] = useState<{
        assignedLeaderId: number | "";
        assignedLeaderName: string;
        targetContactDate: string;
        priority: "Normal" | "High" | "Urgent";
        delegationNotes: string;
    }>({
        assignedLeaderId: "",
        assignedLeaderName: "",
        targetContactDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: "High",
        delegationNotes: "",
    });

    const [newVisitorForm, setNewVisitorForm] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        gender: "Other",
        contactNumber: "",
        address: "",
        invitedBy: "",
        ministry: "",
        notes: "",
    });

    const [followUpForm, setFollowUpForm] = useState<{
        interactionDate: string;
        type: FollowUpLog["type"];
        ministerName: string;
        notes: string;
        outcome: FollowUpLog["outcome"];
        nextFollowUpDate: string;
    }>({
        interactionDate: new Date().toISOString().split("T")[0],
        type: "Phone Call",
        ministerName: "",
        notes: "",
        outcome: "Receptive & Warm",
        nextFollowUpDate: "",
    });

    const [discipleshipForm, setDiscipleshipForm] = useState<Partial<DiscipleshipProfile>>({
        fullName: "",
        contactNumber: "",
        disciplerName: "",
        cellGroupName: "San Vicente Life Group",
        cellLeaderName: "",
        startDate: new Date().toISOString().split("T")[0],
        stage: "New Believer",
        spiritualHealthScore: 5,
        waterBaptism: { isBaptized: false },
        notes: "",
    });

    const [sendingForm, setSendingForm] = useState<Partial<SendingDeployment>>({
        fullName: "",
        contactNumber: "",
        ministryDepartment: "",
        ministryRole: "",
        commissioningStatus: "In Preparation",
        commissioningDate: new Date().toISOString().split("T")[0],
        mentorPastor: "Pastor Roberto Garcia",
        activeFruitCount: 0,
        spiritualGifts: ["Serving"],
        notes: "",
    });

    const [prospectForm, setProspectForm] = useState<Partial<Prospect>>({
        fullName: "",
        contactNumber: "",
        address: "",
        gender: "Not Specified",
        invitedBy: "",
        outreachCampaign: "Church Outreach",
        relationship: "Friend",
        spiritualStatus: "Seeking",
        prayerRequests: "",
        invitationStatus: "In Prayer",
        notes: "",
    });

    // ============================================================
    // REAL DATABASE LOADER
    // ============================================================

    const loadRealData = useCallback(async () => {
        setLoading(true);
        try {
            const [visitorsData, membersData, ministriesData] = await Promise.all([
                churchInActionService.getLiveVisitors(),
                churchInActionService.getLiveMembers(),
                churchInActionService.getLiveMinistries(),
            ]);

            setRealVisitors(visitorsData);
            setRealMembers(membersData);
            setRealMinistries(ministriesData);

            setDelegations(churchInActionService.getDelegations());
            setFollowUpLogs(churchInActionService.getFollowUpLogs());
            setDisciples(churchInActionService.getDiscipleshipProfiles());
            setSentLeaders(churchInActionService.getSendingDeployments());
            setProspects(churchInActionService.getProspects());
        } catch (error) {
            console.error("Failed to load real database records", error);
            showAlert("error", "Error connecting to database. Please check authentication.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRealData();
    }, [loadRealData]);

    const showAlert = (type: "success" | "error" | "info", text: string) => {
        setAlertMessage({ type, text });
        setTimeout(() => setAlertMessage(null), 4500);
    };

    // ============================================================
    // METRICS COMPUTATION (FROM REAL DB)
    // ============================================================

    const metrics = useMemo(() => {
        const totalNewcomers = realVisitors.length;
        const assignedVisitorIds = new Set(delegations.map((d) => d.visitorId));
        
        const unassignedCount = realVisitors.filter(
            (v) => !v.isConvertedToMember && !assignedVisitorIds.has(v.visitorId)
        ).length;

        const activeDelegationsCount = delegations.filter(
            (d) => d.delegationStatus !== "Converted to Member"
        ).length;

        const connectedCount = realVisitors.filter(
            (v) => (v.visitCount || 1) >= 2 && !v.isConvertedToMember
        ).length;

        const convertedToMembersCount = realVisitors.filter(
            (v) => v.isConvertedToMember || v.convertedMemberId
        ).length;

        const totalDisciples = disciples.length;
        const totalSent = sentLeaders.length;

        return {
            totalNewcomers,
            unassignedCount,
            activeDelegationsCount,
            connectedCount,
            convertedToMembersCount,
            totalDisciples,
            totalSent,
        };
    }, [realVisitors, delegations, disciples, sentLeaders]);

    // Leader workload map: leaderId -> number of assigned newcomers
    const leaderWorkloadMap = useMemo(() => {
        const counts: Record<number, number> = {};
        delegations.forEach((d) => {
            if (d.delegationStatus !== "Converted to Member") {
                counts[d.assignedLeaderId] = (counts[d.assignedLeaderId] || 0) + 1;
            }
        });
        return counts;
    }, [delegations]);

    // ============================================================
    // DELEGATION ACTIONS
    // ============================================================

    const handleOpenDelegateModal = (visitor: any) => {
        setSelectedVisitorForDelegation(visitor);
        const existing = delegations.find((d) => d.visitorId === visitor.visitorId);

        if (existing) {
            setDelegationForm({
                assignedLeaderId: existing.assignedLeaderId,
                assignedLeaderName: existing.assignedLeaderName,
                targetContactDate: existing.targetContactDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                priority: existing.priority,
                delegationNotes: existing.delegationNotes || "",
            });
        } else {
            // Default to first member if available
            const defaultLeader = realMembers[0];
            setDelegationForm({
                assignedLeaderId: defaultLeader ? defaultLeader.memberId : "",
                assignedLeaderName: defaultLeader ? defaultLeader.fullName : "",
                targetContactDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                priority: "High",
                delegationNotes: "",
            });
        }
        setShowDelegateModal(true);
    };

    const handleSaveDelegation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVisitorForDelegation || !delegationForm.assignedLeaderId) {
            showAlert("error", "Please select a leader from the church database.");
            return;
        }

        const leader = realMembers.find((m) => m.memberId === Number(delegationForm.assignedLeaderId));
        const leaderName = leader ? leader.fullName : delegationForm.assignedLeaderName || "Church Leader";

        churchInActionService.saveDelegation({
            visitorId: selectedVisitorForDelegation.visitorId,
            assignedLeaderId: Number(delegationForm.assignedLeaderId),
            assignedLeaderName: leaderName,
            assignedLeaderContact: leader?.contactNumber || "",
            delegatedBy: "Pastoral Team",
            delegatedDate: new Date().toISOString().split("T")[0],
            targetContactDate: delegationForm.targetContactDate,
            priority: delegationForm.priority,
            delegationStatus: "Assigned",
            delegationNotes: delegationForm.delegationNotes,
        });

        setShowDelegateModal(false);
        const vName = selectedVisitorForDelegation.fullName || `${selectedVisitorForDelegation.firstName} ${selectedVisitorForDelegation.lastName}`;
        showAlert("success", `Delegated follow-up for ${vName} to ${leaderName}!`);
        loadRealData();
    };

    // ============================================================
    // REAL DATABASE CONVERSION (VISITOR -> MEMBER)
    // ============================================================

    const handleConvertToMember = async (visitor: any) => {
        const vName = visitor.fullName || `${visitor.firstName} ${visitor.lastName}`;
        const confirmMsg = `Are you ready to officially convert ${vName} into a church member in the database?\n\nThis will:\n1. Create their official Member record in the database.\n2. Assign them an official MEM code.\n3. Automatically graduate them into Discipleship & Foundations!`;
        
        if (!window.confirm(confirmMsg)) return;

        try {
            setLoading(true);
            const result = await churchInActionService.convertVisitorToMember(visitor.visitorId);
            
            // Check if there was an assigned leader to become their discipler
            const delegation = delegations.find((d) => d.visitorId === visitor.visitorId);
            const discipler = delegation?.assignedLeaderName || visitor.invitedBy || "Church Mentor";

            // Automatically register in Discipleship & Foundations
            churchInActionService.saveDiscipleshipProfile({
                visitorId: visitor.visitorId,
                memberId: result.memberId,
                fullName: vName,
                contactNumber: visitor.contactNumber || "",
                disciplerName: discipler,
                cellGroupName: visitor.ministry || "San Vicente Life Group",
                cellLeaderName: discipler,
                stage: "New Believer",
                startDate: new Date().toISOString().split("T")[0],
                spiritualHealthScore: 5,
                waterBaptism: { isBaptized: false },
                notes: `Promoted from Newcomer Visitor. Official Member Code: ${result.memberCode || "MEM"}.`,
            });

            showAlert("success", `Praise God! ${vName} is now an official Church Member (${result.memberCode || "MEM"}) and enrolled into Discipleship!`);
            await loadRealData();
        } catch (error: any) {
            showAlert("error", error?.message || "Failed to convert visitor to member in database.");
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // REGISTER REAL VISITOR MODAL
    // ============================================================

    const handleSaveNewVisitor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVisitorForm.firstName.trim() || !newVisitorForm.lastName.trim()) {
            showAlert("error", "First name and last name are required.");
            return;
        }

        try {
            setLoading(true);
            const created = await churchInActionService.createLiveVisitor(newVisitorForm);
            setShowRegisterVisitorModal(false);
            setNewVisitorForm({
                firstName: "",
                middleName: "",
                lastName: "",
                gender: "Other",
                contactNumber: "",
                address: "",
                invitedBy: "",
                ministry: "",
                notes: "",
            });
            showAlert("success", `Newcomer ${created?.firstName || newVisitorForm.firstName} registered in church database!`);
            await loadRealData();
        } catch (error: any) {
            showAlert("error", error?.message || "Failed to register visitor.");
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // FOLLOW-UP ACTIONS
    // ============================================================

    const handleOpenLogFollowUp = (visitor: any) => {
        setSelectedVisitorForFollowUp(visitor);
        const delegation = delegations.find((d) => d.visitorId === visitor.visitorId);
        setFollowUpForm({
            interactionDate: new Date().toISOString().split("T")[0],
            type: "Phone Call",
            ministerName: delegation?.assignedLeaderName || visitor.invitedBy || "",
            notes: "",
            outcome: "Receptive & Warm",
            nextFollowUpDate: "",
        });
        setShowFollowUpModal(true);
    };

    const handleSaveFollowUp = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVisitorForFollowUp) return;

        churchInActionService.addFollowUpLog({
            visitorId: selectedVisitorForFollowUp.visitorId,
            interactionDate: followUpForm.interactionDate,
            type: followUpForm.type,
            ministerName: followUpForm.ministerName.trim() || "Leader",
            notes: followUpForm.notes.trim(),
            outcome: followUpForm.outcome,
            nextFollowUpDate: followUpForm.nextFollowUpDate || undefined,
        });

        setShowFollowUpModal(false);
        showAlert("success", "Follow-up touchpoint recorded.");
        loadRealData();
    };

    // ============================================================
    // DISCIPLESHIP & SENDING
    // ============================================================

    const handleToggleFoundation = (profileId: string, lessonKey: keyof DiscipleshipProfile["foundations"]) => {
        churchInActionService.toggleFoundationLesson(profileId, lessonKey);
        loadRealData();
    };

    const handleOpenAddDisciple = () => {
        setEditingDisciple(null);
        setDiscipleshipForm({
            fullName: "",
            contactNumber: "",
            disciplerName: "",
            cellGroupName: "San Vicente Life Group",
            cellLeaderName: "",
            startDate: new Date().toISOString().split("T")[0],
            stage: "New Believer",
            spiritualHealthScore: 5,
            waterBaptism: { isBaptized: false },
            notes: "",
        });
        setShowDiscipleshipModal(true);
    };

    const handleOpenEditDisciple = (d: DiscipleshipProfile) => {
        setEditingDisciple(d);
        setDiscipleshipForm({ ...d });
        setShowDiscipleshipModal(true);
    };

    const handleDeleteDisciple = (id: string) => {
        if (window.confirm("Are you sure you want to remove this disciple profile?")) {
            churchInActionService.deleteDiscipleshipProfile(id);
            showAlert("info", "Discipleship profile removed.");
            loadRealData();
        }
    };

    const handleSaveDisciple = (e: React.FormEvent) => {
        e.preventDefault();
        if (!discipleshipForm.fullName?.trim() || !discipleshipForm.contactNumber?.trim()) {
            showAlert("error", "Name and contact are required.");
            return;
        }

        churchInActionService.saveDiscipleshipProfile({
            ...discipleshipForm,
            id: editingDisciple?.id,
            fullName: discipleshipForm.fullName.trim(),
            contactNumber: discipleshipForm.contactNumber.trim(),
        });

        setShowDiscipleshipModal(false);
        showAlert("success", "Discipleship profile saved.");
        loadRealData();
    };

    const handleOpenAddSending = () => {
        setEditingDeployment(null);
        setSendingForm({
            fullName: "",
            contactNumber: "",
            ministryDepartment: "",
            ministryRole: "",
            commissioningStatus: "In Preparation",
            commissioningDate: new Date().toISOString().split("T")[0],
            mentorPastor: "Pastor Roberto Garcia",
            activeFruitCount: 0,
            spiritualGifts: ["Serving"],
            notes: "",
        });
        setShowSendingModal(true);
    };

    const handleOpenEditSending = (s: SendingDeployment) => {
        setEditingDeployment(s);
        setSendingForm({ ...s });
        setShowSendingModal(true);
    };

    const handleDeleteSending = (id: string) => {
        if (window.confirm("Are you sure you want to remove this commissioned worker record?")) {
            churchInActionService.deleteSendingDeployment(id);
            showAlert("info", "Commissioning record removed.");
            loadRealData();
        }
    };

    const handleSaveSending = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sendingForm.fullName?.trim() || !sendingForm.ministryRole?.trim()) {
            showAlert("error", "Name and ministry role are required.");
            return;
        }

        churchInActionService.saveSendingDeployment({
            ...sendingForm,
            id: editingDeployment?.id,
            fullName: sendingForm.fullName.trim(),
            ministryDepartment: sendingForm.ministryDepartment || "General Ministry",
            ministryRole: sendingForm.ministryRole.trim(),
        });

        setShowSendingModal(false);
        showAlert("success", "Commissioned leader saved.");
        loadRealData();
    };

    const handleOpenAddProspect = () => {
        setProspectForm({
            fullName: "",
            contactNumber: "",
            address: "",
            gender: "Not Specified",
            invitedBy: "",
            outreachCampaign: "Church Outreach",
            relationship: "Friend",
            spiritualStatus: "Seeking",
            prayerRequests: "",
            invitationStatus: "In Prayer",
            notes: "",
        });
        setShowProspectModal(true);
    };

    const handleDeleteProspect = (id: string) => {
        if (window.confirm("Are you sure you want to remove this prospect from the prayer list?")) {
            churchInActionService.deleteProspect(id);
            showAlert("info", "Prospect removed.");
            loadRealData();
        }
    };

    const handleSaveProspect = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prospectForm.fullName?.trim() || !prospectForm.contactNumber?.trim()) {
            showAlert("error", "Name and contact number are required.");
            return;
        }

        churchInActionService.saveProspect({
            ...prospectForm,
            fullName: prospectForm.fullName.trim(),
            contactNumber: prospectForm.contactNumber.trim(),
        });

        setShowProspectModal(false);
        showAlert("success", "Outreach prospect added.");
        loadRealData();
    };

    const handlePromoteProspect = async (prospectId: string) => {
        try {
            await churchInActionService.promoteProspectToVisitor(prospectId);
            showAlert("success", "Prospect promoted to active database Visitor!");
            loadRealData();
        } catch (e: any) {
            showAlert("error", e?.message || "Failed to promote prospect.");
        }
    };

    // ============================================================
    // FILTERED VIEWS
    // ============================================================

    const filteredDelegationList = useMemo(() => {
        return realVisitors.filter((v) => {
            const vName = (v.fullName || `${v.firstName || ""} ${v.lastName || ""}`).toLowerCase();
            const delegation = delegations.find((d) => d.visitorId === v.visitorId);
            const leaderName = (delegation?.assignedLeaderName || "").toLowerCase();

            const matchesSearch = vName.includes(searchTerm.toLowerCase()) || leaderName.includes(searchTerm.toLowerCase());

            // Status filter
            let matchesStatus = true;
            if (statusFilter === "UNASSIGNED") {
                matchesStatus = !v.isConvertedToMember && !delegation;
            } else if (statusFilter === "ASSIGNED") {
                matchesStatus = Boolean(delegation && delegation.delegationStatus !== "Converted to Member");
            } else if (statusFilter === "CONVERTED") {
                matchesStatus = Boolean(v.isConvertedToMember || delegation?.delegationStatus === "Converted to Member");
            }

            // Leader filter
            let matchesLeader = true;
            if (leaderFilter !== "ALL") {
                matchesLeader = delegation?.assignedLeaderId === Number(leaderFilter);
            }

            return matchesSearch && matchesStatus && matchesLeader;
        });
    }, [realVisitors, delegations, searchTerm, statusFilter, leaderFilter]);

    return (
        <div className="church-in-action-container">
            {/* ALERT NOTIFICATION */}
            {alertMessage && (
                <div className={`cia-alert-banner ${alertMessage.type}`}>
                    <span>{alertMessage.text}</span>
                    <button type="button" onClick={() => setAlertMessage(null)}>×</button>
                </div>
            )}

            {/* HEADER SECTION */}
            <header className="cia-header">
                <div className="cia-header-brand">
                    <div className="cia-header-icon-box">
                        <Flame className="cia-flame-icon" />
                    </div>
                    <div>
                        <div className="cia-ministry-badge">
                            <span>LUKE 4:18 MINISTRIES • SAN VICENTE CHURCH</span>
                        </div>
                        <h1 className="cia-title">Church in Action: Monitoring & Delegation System</h1>
                        <p className="cia-subtitle">
                            Empowering leaders to follow up newcomers and nurture them into real church members and disciples of Christ.
                        </p>
                    </div>
                </div>

                <div className="cia-header-actions">
                    {onBack && (
                        <button
                            type="button"
                            className="cia-btn-outline"
                            onClick={onBack}
                            title="Back to dashboard"
                        >
                            ← Back
                        </button>
                    )}
                    <button
                        type="button"
                        className="cia-btn-outline"
                        onClick={loadRealData}
                        title="Sync with live database"
                    >
                        <RefreshCw size={15} className={loading ? "cia-spin" : ""} />
                        <span>Sync Database</span>
                    </button>
                    <button
                        type="button"
                        className="cia-btn-outline"
                        onClick={() => window.print()}
                        title="Print clean report"
                    >
                        <Printer size={15} />
                        <span>Print Report</span>
                    </button>
                    {canManage && (
                        <button
                            type="button"
                            className="cia-btn-primary"
                            onClick={() => setShowRegisterVisitorModal(true)}
                        >
                            <UserPlus size={16} />
                            <span>Register Newcomer</span>
                        </button>
                    )}
                </div>
            </header>

            {/* MONITORING METRICS BAR (FROM REAL DATABASE) */}
            <section className="cia-metrics-grid">
                <div className="cia-metric-card">
                    <div className="cia-metric-icon-wrap cia-icon-blue">
                        <Users size={20} />
                    </div>
                    <div className="cia-metric-data">
                        <span className="cia-metric-label">Total Newcomers in DB</span>
                        <strong className="cia-metric-val">{metrics.totalNewcomers}</strong>
                        <span className="cia-metric-hint">Official Visitors Table</span>
                    </div>
                </div>

                <div className={`cia-metric-card ${metrics.unassignedCount > 0 ? "cia-metric-card-warn" : ""}`}>
                    <div className="cia-metric-icon-wrap cia-icon-amber">
                        <AlertCircle size={20} />
                    </div>
                    <div className="cia-metric-data">
                        <span className="cia-metric-label">Unassigned (Need Leader)</span>
                        <strong className="cia-metric-val text-amber">{metrics.unassignedCount}</strong>
                        <span className="cia-metric-hint">Requires Delegation</span>
                    </div>
                </div>

                <div className="cia-metric-card">
                    <div className="cia-metric-icon-wrap cia-icon-purple">
                        <UserCog size={20} />
                    </div>
                    <div className="cia-metric-data">
                        <span className="cia-metric-label">In Active Follow-Up</span>
                        <strong className="cia-metric-val">{metrics.activeDelegationsCount}</strong>
                        <span className="cia-metric-hint">Assigned to Leaders</span>
                    </div>
                </div>

                <div className="cia-metric-card cia-highlight-metric">
                    <div className="cia-metric-icon-wrap cia-icon-gold">
                        <Crown size={20} />
                    </div>
                    <div className="cia-metric-data">
                        <span className="cia-metric-label">Turned to Members</span>
                        <strong className="cia-metric-val text-gold">{metrics.convertedToMembersCount}</strong>
                        <span className="cia-metric-hint">Converted & Baptized</span>
                    </div>
                </div>

                <div className="cia-metric-card">
                    <div className="cia-metric-icon-wrap cia-icon-emerald">
                        <BookOpen size={20} />
                    </div>
                    <div className="cia-metric-data">
                        <span className="cia-metric-label">Disciples & Sent</span>
                        <strong className="cia-metric-val">{metrics.totalDisciples + metrics.totalSent}</strong>
                        <span className="cia-metric-hint">Foundations & Workers</span>
                    </div>
                </div>
            </section>

            {/* TAB NAVIGATION */}
            <nav className="cia-tabs-nav" aria-label="Monitoring Subsystems">
                <button
                    type="button"
                    className={`cia-tab-btn ${activeTab === "delegation" ? "active" : ""}`}
                    onClick={() => {
                        setActiveTab("delegation");
                        setStatusFilter("ALL");
                    }}
                >
                    <UserCog size={16} />
                    <span>1. Leaders Delegation Center</span>
                    <span className="cia-badge-pill">{metrics.totalNewcomers}</span>
                </button>

                <button
                    type="button"
                    className={`cia-tab-btn ${activeTab === "pipeline" ? "active" : ""}`}
                    onClick={() => setActiveTab("pipeline")}
                >
                    <Layers size={16} />
                    <span>2. Lifecycle Pipeline (Kanban)</span>
                </button>

                <button
                    type="button"
                    className={`cia-tab-btn ${activeTab === "followup" ? "active" : ""}`}
                    onClick={() => setActiveTab("followup")}
                >
                    <HeartHandshake size={16} />
                    <span>3. Touchpoints & Logs</span>
                    <span className="cia-badge-pill">{followUpLogs.length}</span>
                </button>

                <button
                    type="button"
                    className={`cia-tab-btn ${activeTab === "discipleship" ? "active" : ""}`}
                    onClick={() => setActiveTab("discipleship")}
                >
                    <BookOpen size={16} />
                    <span>4. Discipleship & Foundations</span>
                    <span className="cia-badge-pill">{disciples.length}</span>
                </button>

                <button
                    type="button"
                    className={`cia-tab-btn ${activeTab === "sending" ? "active" : ""}`}
                    onClick={() => setActiveTab("sending")}
                >
                    <Send size={16} />
                    <span>5. Sending & Mobilization</span>
                    <span className="cia-badge-pill">{sentLeaders.length}</span>
                </button>

                <button
                    type="button"
                    className={`cia-tab-btn ${activeTab === "evangelism" ? "active" : ""}`}
                    onClick={() => setActiveTab("evangelism")}
                >
                    <Sparkles size={16} />
                    <span>Outreach & Prospects</span>
                    <span className="cia-badge-pill">{prospects.length}</span>
                </button>
            </nav>

            {/* ============================================================ */}
            {/* VIEW 1: LEADERS DELEGATION CENTER                            */}
            {/* ============================================================ */}
            {activeTab === "delegation" && (
                <div className="cia-tab-content">
                    {/* LEADER WORKLOAD MATRIX BANNER */}
                    <div className="cia-leaders-summary-panel">
                        <div className="cia-lsp-header">
                            <div>
                                <h4>Available Leaders & Workers ({realMembers.length} Members in Database)</h4>
                                <p>Select a leader to view their assigned newcomer caseload, or assign leaders to newcomers below.</p>
                            </div>
                            <div className="cia-lsp-badge">
                                <ShieldCheck size={16} />
                                <span>Real Database Members</span>
                            </div>
                        </div>

                        <div className="cia-leaders-chip-row">
                            <button
                                type="button"
                                className={`cia-leader-filter-chip ${leaderFilter === "ALL" ? "active" : ""}`}
                                onClick={() => setLeaderFilter("ALL")}
                            >
                                <span>All Leaders</span>
                                <span className="chip-cnt">{realVisitors.length}</span>
                            </button>

                            {realMembers.slice(0, 10).map((m) => {
                                const assignedCount = leaderWorkloadMap[m.memberId] || 0;
                                return (
                                    <button
                                        key={m.memberId}
                                        type="button"
                                        className={`cia-leader-filter-chip ${leaderFilter === String(m.memberId) ? "active" : ""}`}
                                        onClick={() => setLeaderFilter(String(m.memberId))}
                                        title={`${m.fullName} (${m.ministry || "Member"})`}
                                    >
                                        <span className="leader-name">{m.fullName}</span>
                                        <span className={`chip-cnt ${assignedCount > 0 ? "active" : ""}`}>
                                            {assignedCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* CONTROLS BAR */}
                    <div className="cia-controls-bar">
                        <div className="cia-search-box">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search newcomers or assigned leaders..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button type="button" className="cia-clear-btn" onClick={() => setSearchTerm("")}>
                                    ×
                                </button>
                            )}
                        </div>

                        <div className="cia-filters">
                            <Filter size={15} />
                            <label>Filter By Status:</label>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="ALL">All Newcomers</option>
                                <option value="UNASSIGNED">⚠️ Unassigned (Need Leader)</option>
                                <option value="ASSIGNED">🔄 In Follow-Up (Assigned)</option>
                                <option value="CONVERTED">👑 Converted to Members</option>
                            </select>
                        </div>
                    </div>

                    {/* DELEGATION MONITORING TABLE */}
                    <div className="cia-table-container">
                        <table className="cia-table">
                            <thead>
                                <tr>
                                    <th>Newcomer / Visitor</th>
                                    <th>First Visit Date</th>
                                    <th>Visit Count</th>
                                    <th>Assigned Leader</th>
                                    <th>Target Contact Date</th>
                                    <th>Delegation Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDelegationList.map((v) => {
                                    const vName = v.fullName || `${v.firstName || ""} ${v.lastName || ""}`;
                                    const delegation = delegations.find((d) => d.visitorId === v.visitorId);
                                    const isConverted = v.isConvertedToMember || delegation?.delegationStatus === "Converted to Member";

                                    return (
                                        <tr key={v.visitorId} className={!delegation && !isConverted ? "row-warn" : ""}>
                                            <td>
                                                <div className="cia-table-primary-cell">
                                                    <strong>{vName}</strong>
                                                    <small>
                                                        {v.visitorCode || `ID #${v.visitorId}`} • {v.contactNumber || "No Phone"} • {v.address || "San Vicente"}
                                                    </small>
                                                </div>
                                            </td>
                                            <td>{v.firstVisitDate || "Recent"}</td>
                                            <td>
                                                <span className="cia-visit-badge">{v.visitCount || 1} Time(s)</span>
                                            </td>
                                            <td>
                                                {delegation ? (
                                                    <div className="cia-leader-assigned-cell">
                                                        <div className="leader-pill">
                                                            <UserCheck size={13} />
                                                            <strong>{delegation.assignedLeaderName}</strong>
                                                        </div>
                                                        <small>Priority: <strong>{delegation.priority}</strong></small>
                                                    </div>
                                                ) : isConverted ? (
                                                    <span className="cia-status-chip converted">
                                                        <Crown size={12} /> Member
                                                    </span>
                                                ) : (
                                                    <span className="cia-status-chip unassigned">
                                                        ⚠️ Needs Leader
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {delegation?.targetContactDate ? (
                                                    <div className="cia-target-date">
                                                        <Calendar size={12} />
                                                        <span>{delegation.targetContactDate}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">—</span>
                                                )}
                                            </td>
                                            <td>
                                                {isConverted ? (
                                                    <span className="cia-status-chip converted">
                                                        👑 Church Member
                                                    </span>
                                                ) : delegation ? (
                                                    <span className={`cia-status-chip ${delegation.delegationStatus.toLowerCase().replace(/\s+/g, "-")}`}>
                                                        {delegation.delegationStatus}
                                                    </span>
                                                ) : (
                                                    <span className="cia-status-chip unassigned">
                                                        Unassigned
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="cia-table-actions">
                                                    {!isConverted && (
                                                        <button
                                                            type="button"
                                                            className="cia-btn-delegate"
                                                            onClick={() => handleOpenDelegateModal(v)}
                                                            title={delegation ? "Reassign to another leader" : "Assign follow-up leader"}
                                                        >
                                                            <UserCog size={13} />
                                                            <span>{delegation ? "Reassign" : "Delegate Leader"}</span>
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        className="cia-icon-btn"
                                                        onClick={() => handleOpenLogFollowUp(v)}
                                                        title="Log Contact Touchpoint"
                                                    >
                                                        <HeartHandshake size={14} />
                                                    </button>

                                                    {!isConverted && (
                                                        <button
                                                            type="button"
                                                            className="cia-btn-convert"
                                                            onClick={() => handleConvertToMember(v)}
                                                            title="Convert Newcomer to Official Church Member in SQL Database"
                                                        >
                                                            <Crown size={13} />
                                                            <span>Convert to Member</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredDelegationList.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="cia-no-data">
                                            {realVisitors.length === 0
                                                ? "No newcomers recorded in database yet. Click 'Register Newcomer' above to add your first visitor!"
                                                : "No newcomers match the selected search or leader filter."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 2: LIFECYCLE PIPELINE (KANBAN BOARD)                    */}
            {/* ============================================================ */}
            {activeTab === "pipeline" && (
                <div className="cia-pipeline-view">
                    <div className="cia-pipeline-info-banner">
                        <div className="cia-pib-content">
                            <strong>Live Spiritual Growth Funnel: Newcomer ➔ Church Member ➔ Disciple ➔ Leader</strong>
                            <p>Real-time lifecycle monitoring derived directly from your live church database records.</p>
                        </div>
                    </div>

                    <div className="cia-kanban-board">
                        {/* COLUMN 1: NEW ARRIVALS (UNASSIGNED) */}
                        <div className="cia-kanban-col">
                            <div className="cia-col-header amber">
                                <div>
                                    <span className="cia-col-step">STAGE 1</span>
                                    <h4>New Arrivals (Unassigned)</h4>
                                </div>
                                <span className="cia-col-count">
                                    {realVisitors.filter((v) => !v.isConvertedToMember && !delegations.some((d) => d.visitorId === v.visitorId)).length}
                                </span>
                            </div>
                            <div className="cia-col-cards">
                                {realVisitors
                                    .filter((v) => !v.isConvertedToMember && !delegations.some((d) => d.visitorId === v.visitorId))
                                    .map((v) => (
                                        <div key={v.visitorId} className="cia-kanban-card">
                                            <div className="cia-card-top">
                                                <span className="cia-id-tag">{v.visitorCode || `VIS-${v.visitorId}`}</span>
                                                <span className="cia-status-chip unassigned">Needs Leader</span>
                                            </div>
                                            <h5 className="cia-card-name">{v.fullName || `${v.firstName} ${v.lastName}`}</h5>
                                            <p className="cia-card-sub"><Phone size={12} /> {v.contactNumber || "No Phone"}</p>
                                            <p className="cia-card-sub"><Clock size={12} /> First Visit: {v.firstVisitDate || "Recent"}</p>
                                            <div className="cia-card-footer">
                                                <button
                                                    type="button"
                                                    className="cia-btn-sm-action"
                                                    onClick={() => handleOpenDelegateModal(v)}
                                                >
                                                    <UserCog size={13} />
                                                    <span>Delegate Leader</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* COLUMN 2: IN ACTIVE FOLLOW-UP */}
                        <div className="cia-kanban-col">
                            <div className="cia-col-header blue">
                                <div>
                                    <span className="cia-col-step">STAGE 2</span>
                                    <h4>In Follow-Up (Assigned)</h4>
                                </div>
                                <span className="cia-col-count">
                                    {realVisitors.filter((v) => !v.isConvertedToMember && delegations.some((d) => d.visitorId === v.visitorId)).length}
                                </span>
                            </div>
                            <div className="cia-col-cards">
                                {realVisitors
                                    .filter((v) => !v.isConvertedToMember && delegations.some((d) => d.visitorId === v.visitorId))
                                    .map((v) => {
                                        const del = delegations.find((d) => d.visitorId === v.visitorId);
                                        return (
                                            <div key={v.visitorId} className="cia-kanban-card">
                                                <div className="cia-card-top">
                                                    <span className="cia-id-tag">{v.visitorCode || `VIS-${v.visitorId}`}</span>
                                                    <span className="cia-status-chip contacted">{del?.delegationStatus}</span>
                                                </div>
                                                <h5 className="cia-card-name">{v.fullName || `${v.firstName} ${v.lastName}`}</h5>
                                                <p className="cia-card-sub"><UserCheck size={12} /> Leader: <strong>{del?.assignedLeaderName}</strong></p>
                                                <p className="cia-card-sub"><Clock size={12} /> Target: {del?.targetContactDate || "Soon"}</p>
                                                <div className="cia-card-footer dual">
                                                    <button
                                                        type="button"
                                                        className="cia-btn-sm-touchpoint"
                                                        onClick={() => handleOpenLogFollowUp(v)}
                                                    >
                                                        <HeartHandshake size={12} />
                                                        <span>Log Contact</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="cia-btn-sm-action"
                                                        onClick={() => handleConvertToMember(v)}
                                                    >
                                                        <Crown size={12} />
                                                        <span>To Member</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* COLUMN 3: CONVERTED CHURCH MEMBERS */}
                        <div className="cia-kanban-col">
                            <div className="cia-col-header emerald">
                                <div>
                                    <span className="cia-col-step">STAGE 3</span>
                                    <h4>Church Members & Disciples</h4>
                                </div>
                                <span className="cia-col-count">
                                    {realVisitors.filter((v) => v.isConvertedToMember).length + disciples.length}
                                </span>
                            </div>
                            <div className="cia-col-cards">
                                {disciples.map((d) => (
                                    <div key={d.id} className="cia-kanban-card">
                                        <div className="cia-card-top">
                                            <span className="cia-id-tag">{d.id}</span>
                                            <span className="cia-status-chip emerald">{d.stage}</span>
                                        </div>
                                        <h5 className="cia-card-name">{d.fullName}</h5>
                                        <p className="cia-card-sub"><Users size={12} /> Mentor: {d.disciplerName}</p>
                                        <p className="cia-card-sub"><ShieldCheck size={12} /> Cell: {d.cellGroupName}</p>
                                        <div className="cia-card-badge-row">
                                            {d.waterBaptism?.isBaptized ? (
                                                <span className="cia-pill-success">🌊 Water Baptized</span>
                                            ) : (
                                                <span className="cia-pill-pending">⏳ Baptism Pending</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* COLUMN 4: COMMISSIONED WORKERS */}
                        <div className="cia-kanban-col">
                            <div className="cia-col-header purple">
                                <div>
                                    <span className="cia-col-step">STAGE 4</span>
                                    <h4>Sent & Commissioned</h4>
                                </div>
                                <span className="cia-col-count">{sentLeaders.length}</span>
                            </div>
                            <div className="cia-col-cards">
                                {sentLeaders.map((s) => (
                                    <div key={s.id} className="cia-kanban-card sent-card">
                                        <div className="cia-card-top">
                                            <span className="cia-id-tag">{s.id}</span>
                                            <span className="cia-status-chip purple">{s.commissioningStatus}</span>
                                        </div>
                                        <h5 className="cia-card-name">{s.fullName}</h5>
                                        <p className="cia-card-sub"><Award size={12} /> Dept: {s.ministryDepartment}</p>
                                        <p className="cia-card-sub"><Sparkles size={12} /> Role: {s.ministryRole}</p>
                                        <div className="cia-card-fruit-box">
                                            <span className="fruit-count">🌱 {s.activeFruitCount} Disciples</span>
                                            <small>Reproducing spiritual fruit</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 3: TOUCHPOINTS & INTERACTION LOGS                       */}
            {/* ============================================================ */}
            {activeTab === "followup" && (
                <div className="cia-tab-content">
                    <div className="cia-section-banner blue-theme">
                        <div>
                            <h3>Follow-Up Touchpoints Log</h3>
                            <p>History of personal calls, visits, messages, and prayers delivered by assigned leaders.</p>
                        </div>
                    </div>

                    <div className="cia-table-container">
                        <table className="cia-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Visitor</th>
                                    <th>Interaction Type</th>
                                    <th>Leader / Worker</th>
                                    <th>Spiritual Response / Outcome</th>
                                    <th>Next Follow-up</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {followUpLogs.map((log) => {
                                    const visitor = realVisitors.find((v) => v.visitorId === log.visitorId);
                                    const vName = visitor ? (visitor.fullName || `${visitor.firstName} ${visitor.lastName}`) : `Visitor #${log.visitorId}`;
                                    return (
                                        <tr key={log.id}>
                                            <td><strong>{log.interactionDate}</strong></td>
                                            <td>{vName}</td>
                                            <td><span className="cia-dept-pill">{log.type}</span></td>
                                            <td><strong>{log.ministerName}</strong></td>
                                            <td><span className="cia-status-chip contacted">{log.outcome}</span></td>
                                            <td>{log.nextFollowUpDate || "—"}</td>
                                            <td className="cia-notes-cell"><small>{log.notes}</small></td>
                                        </tr>
                                    );
                                })}
                                {followUpLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="cia-no-data">
                                            No touchpoints recorded yet. Click the heart icon on any newcomer to log a contact!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 4: CONSOLIDATION & DISCIPLESHIP                         */}
            {/* ============================================================ */}
            {activeTab === "discipleship" && (
                <div className="cia-tab-content">
                    <div className="cia-section-banner emerald-theme">
                        <div>
                            <h3>Consolidation & Discipleship Foundations</h3>
                            <p>Grounding new believers into the body of Christ with the 6 Foundations track and water baptism.</p>
                        </div>
                        <button type="button" className="cia-btn-action-banner" onClick={handleOpenAddDisciple}>
                            <Plus size={15} />
                            <span>Enroll Disciple</span>
                        </button>
                    </div>

                    <div className="cia-disciples-grid">
                        {disciples.map((d) => {
                            const completedCount = Object.values(d.foundations || {}).filter(Boolean).length;
                            return (
                                <div key={d.id} className="cia-disciple-card">
                                    <div className="cia-dcard-header">
                                        <div>
                                            <span className="cia-id-tag">{d.id}</span>
                                            <h4>{d.fullName}</h4>
                                            <span className="cia-dcard-contact">{d.contactNumber}</span>
                                        </div>
                                        <div className="cia-dcard-header-actions">
                                            <span className="cia-status-chip emerald">
                                                <GraduationCap size={12} /> {d.stage}
                                            </span>
                                            <div className="cia-table-actions">
                                                <button
                                                    type="button"
                                                    className="cia-icon-btn"
                                                    onClick={() => handleOpenEditDisciple(d)}
                                                    title="Edit Disciple Profile"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="cia-icon-btn danger"
                                                    onClick={() => handleDeleteDisciple(d.id)}
                                                    title="Remove Disciple Record"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="cia-dcard-meta">
                                        <div className="cia-meta-item">
                                            <span>Discipler / Leader:</span>
                                            <strong>{d.disciplerName}</strong>
                                        </div>
                                        <div className="cia-meta-item">
                                            <span>Cell Group:</span>
                                            <strong>{d.cellGroupName}</strong>
                                        </div>
                                    </div>

                                    <div className="cia-foundations-box">
                                        <div className="cia-fbox-header">
                                            <strong>Foundations Progress ({completedCount}/6)</strong>
                                            <span className="cia-pct">{Math.round((completedCount / 6) * 100)}%</span>
                                        </div>
                                        <div className="cia-lessons-list">
                                            <label className="cia-lesson-check">
                                                <input
                                                    type="checkbox"
                                                    checked={d.foundations.lesson1Salvation}
                                                    onChange={() => handleToggleFoundation(d.id, "lesson1Salvation")}
                                                />
                                                <span>1. Assurance of Salvation</span>
                                            </label>
                                            <label className="cia-lesson-check">
                                                <input
                                                    type="checkbox"
                                                    checked={d.foundations.lesson2WordAndPrayer}
                                                    onChange={() => handleToggleFoundation(d.id, "lesson2WordAndPrayer")}
                                                />
                                                <span>2. Word of God & Prayer Life</span>
                                            </label>
                                            <label className="cia-lesson-check">
                                                <input
                                                    type="checkbox"
                                                    checked={d.foundations.lesson3HolySpirit}
                                                    onChange={() => handleToggleFoundation(d.id, "lesson3HolySpirit")}
                                                />
                                                <span>3. Holy Spirit & Power</span>
                                            </label>
                                            <label className="cia-lesson-check">
                                                <input
                                                    type="checkbox"
                                                    checked={d.foundations.lesson4WaterBaptism}
                                                    onChange={() => handleToggleFoundation(d.id, "lesson4WaterBaptism")}
                                                />
                                                <span>4. Water Baptism & Obedience</span>
                                            </label>
                                            <label className="cia-lesson-check">
                                                <input
                                                    type="checkbox"
                                                    checked={d.foundations.lesson5ChurchLife}
                                                    onChange={() => handleToggleFoundation(d.id, "lesson5ChurchLife")}
                                                />
                                                <span>5. Church Community & Life</span>
                                            </label>
                                            <label className="cia-lesson-check">
                                                <input
                                                    type="checkbox"
                                                    checked={d.foundations.lesson6Stewardship}
                                                    onChange={() => handleToggleFoundation(d.id, "lesson6Stewardship")}
                                                />
                                                <span>6. Stewardship & Great Commission</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="cia-baptism-strip">
                                        {d.waterBaptism?.isBaptized ? (
                                            <div className="cia-strip-baptized">
                                                <CheckCircle2 size={16} />
                                                <span>Water Baptized ({d.waterBaptism.baptismDate || "Recorded"})</span>
                                            </div>
                                        ) : (
                                            <div className="cia-strip-unbaptized">
                                                <Clock size={16} />
                                                <span>Water Baptism: Preparing</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {disciples.length === 0 && (
                            <div className="cia-no-data-card">
                                No disciples currently enrolled. When newcomers are converted to members, they automatically graduate into Discipleship!
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 5: SENDING & MOBILIZATION                               */}
            {/* ============================================================ */}
            {activeTab === "sending" && (
                <div className="cia-tab-content">
                    <div className="cia-section-banner purple-theme">
                        <div>
                            <h3>Sending & Ministry Mobilization</h3>
                            <p>Commissioning mature believers into active church departments and disciple-making leaders.</p>
                        </div>
                        <button type="button" className="cia-btn-action-banner" onClick={handleOpenAddSending}>
                            <Send size={15} />
                            <span>Commission Worker</span>
                        </button>
                    </div>

                    <div className="cia-table-container">
                        <table className="cia-table">
                            <thead>
                                <tr>
                                    <th>Commissioned Leader</th>
                                    <th>Department</th>
                                    <th>Assigned Role</th>
                                    <th>Commissioning Status</th>
                                    <th>Fruit Multiplied</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sentLeaders.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <strong>{s.fullName}</strong>
                                            <small className="d-block">{s.contactNumber || "No phone"}</small>
                                        </td>
                                        <td><span className="cia-dept-pill">{s.ministryDepartment}</span></td>
                                        <td><strong>{s.ministryRole}</strong></td>
                                        <td><span className="cia-status-chip purple">{s.commissioningStatus}</span></td>
                                        <td><strong className="text-emerald">🌱 {s.activeFruitCount} Disciples</strong></td>
                                        <td>
                                            <div className="cia-table-actions">
                                                <button
                                                    type="button"
                                                    className="cia-icon-btn"
                                                    onClick={() => handleOpenEditSending(s)}
                                                    title="Edit Commissioned Leader"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="cia-icon-btn danger"
                                                    onClick={() => handleDeleteSending(s.id)}
                                                    title="Remove Leader Record"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {sentLeaders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="cia-no-data">No commissioned leaders registered yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 6: OUTREACH & PROSPECTS (PRE-VISITOR)                    */}
            {/* ============================================================ */}
            {activeTab === "evangelism" && (
                <div className="cia-tab-content">
                    <div className="cia-section-banner amber-theme">
                        <div>
                            <h3>Outreach & Soul-Winning Prayer List</h3>
                            <p>Track friends, family, and prospects being prayed for before their first Sunday church visit.</p>
                        </div>
                        <button type="button" className="cia-btn-action-banner" onClick={handleOpenAddProspect}>
                            <Plus size={15} />
                            <span>Add Outreach Prospect</span>
                        </button>
                    </div>

                    <div className="cia-table-container">
                        <table className="cia-table">
                            <thead>
                                <tr>
                                    <th>Prospect Name</th>
                                    <th>Invited By</th>
                                    <th>Campaign</th>
                                    <th>Spiritual Status</th>
                                    <th>Prayer Requests</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prospects.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <strong>{p.fullName}</strong>
                                            <small className="d-block">{p.contactNumber}</small>
                                        </td>
                                        <td>{p.invitedBy}</td>
                                        <td><span className="cia-campaign-badge">{p.outreachCampaign}</span></td>
                                        <td>{p.spiritualStatus}</td>
                                        <td><small className="cia-prayer-text">{p.prayerRequests || "General salvation"}</small></td>
                                        <td><span className={`cia-status-chip ${p.invitationStatus.toLowerCase().replace(/\s+/g, "-")}`}>{p.invitationStatus}</span></td>
                                        <td>
                                            <div className="cia-table-actions">
                                                {p.invitationStatus !== "Attended" ? (
                                                    <button
                                                        type="button"
                                                        className="cia-btn-promote"
                                                        onClick={() => handlePromoteProspect(p.id)}
                                                        title="Create real Visitor in database"
                                                    >
                                                        <UserCheck size={13} />
                                                        <span>Mark Attended</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-emerald">✓ In Database</span>
                                                )}
                                                <button
                                                    type="button"
                                                    className="cia-icon-btn danger"
                                                    onClick={() => handleDeleteProspect(p.id)}
                                                    title="Remove Prospect"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {prospects.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="cia-no-data">No prospects on prayer list. Click 'Add Outreach Prospect' to begin.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* MODAL: DELEGATE LEADER MODAL (CONNECTED TO REAL MEMBERS)     */}
            {/* ============================================================ */}
            {showDelegateModal && selectedVisitorForDelegation && (
                <div className="cia-modal-overlay">
                    <div className="cia-modal-card">
                        <div className="cia-modal-header">
                            <h3>Delegate Follow-Up Leader</h3>
                            <button type="button" onClick={() => setShowDelegateModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSaveDelegation}>
                            <div className="cia-modal-body">
                                <div className="cia-modal-info-bar">
                                    <strong>Newcomer:</strong> {selectedVisitorForDelegation.fullName || `${selectedVisitorForDelegation.firstName} ${selectedVisitorForDelegation.lastName}`}
                                    <span> • Phone: {selectedVisitorForDelegation.contactNumber || "N/A"}</span>
                                    <span> • Visit Count: {selectedVisitorForDelegation.visitCount || 1} time(s)</span>
                                </div>

                                <div className="cia-form-group full">
                                    <label>Select Leader / Worker (From Real Church Members) *</label>
                                    <select
                                        required
                                        value={delegationForm.assignedLeaderId}
                                        onChange={(e) => {
                                            const leaderId = e.target.value;
                                            const member = realMembers.find((m) => m.memberId === Number(leaderId));
                                            setDelegationForm({
                                                ...delegationForm,
                                                assignedLeaderId: leaderId ? Number(leaderId) : "",
                                                assignedLeaderName: member ? member.fullName : "",
                                            });
                                        }}
                                    >
                                        <option value="">-- Choose Church Leader / Discipler --</option>
                                        {realMembers.map((m) => {
                                            const count = leaderWorkloadMap[m.memberId] || 0;
                                            return (
                                                <option key={m.memberId} value={m.memberId}>
                                                    {m.fullName} ({m.memberCode || `ID #${m.memberId}`}) — {m.ministry || "Member"} [{count} active assigned]
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <small className="form-hint">
                                        💡 Choose a leader who can build relationship and disciple this newcomer.
                                    </small>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Follow-Up Priority</label>
                                        <select
                                            value={delegationForm.priority}
                                            onChange={(e) => setDelegationForm({ ...delegationForm, priority: e.target.value as any })}
                                        >
                                            <option value="Urgent">🚨 Urgent (Within 24 Hours)</option>
                                            <option value="High">⭐ High (Within 48 Hours)</option>
                                            <option value="Normal">Normal (This Week)</option>
                                        </select>
                                    </div>

                                    <div className="cia-form-group">
                                        <label>Target Contact Date</label>
                                        <input
                                            type="date"
                                            value={delegationForm.targetContactDate}
                                            onChange={(e) => setDelegationForm({ ...delegationForm, targetContactDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-group full">
                                    <label>Pastoral Instructions / Notes for Leader</label>
                                    <textarea
                                        rows={3}
                                        placeholder="e.g. Please call brother to welcome him, pray for his family, and invite him to Thursday cell group..."
                                        value={delegationForm.delegationNotes}
                                        onChange={(e) => setDelegationForm({ ...delegationForm, delegationNotes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="cia-modal-footer">
                                <button type="button" className="cia-btn-outline" onClick={() => setShowDelegateModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="cia-btn-primary">
                                    Confirm Leader Delegation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* MODAL: REGISTER REAL VISITOR MODAL                           */}
            {/* ============================================================ */}
            {showRegisterVisitorModal && (
                <div className="cia-modal-overlay">
                    <div className="cia-modal-card">
                        <div className="cia-modal-header">
                            <h3>Register Newcomer / Visitor (Saved to Live Database)</h3>
                            <button type="button" onClick={() => setShowRegisterVisitorModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSaveNewVisitor}>
                            <div className="cia-modal-body">
                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>First Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={newVisitorForm.firstName}
                                            onChange={(e) => setNewVisitorForm({ ...newVisitorForm, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Last Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={newVisitorForm.lastName}
                                            onChange={(e) => setNewVisitorForm({ ...newVisitorForm, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Contact Number</label>
                                        <input
                                            type="text"
                                            placeholder="0917-000-0000"
                                            value={newVisitorForm.contactNumber}
                                            onChange={(e) => setNewVisitorForm({ ...newVisitorForm, contactNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Invited By (Church Member)</label>
                                        <input
                                            type="text"
                                            placeholder="Member or evangelist name"
                                            value={newVisitorForm.invitedBy}
                                            onChange={(e) => setNewVisitorForm({ ...newVisitorForm, invitedBy: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Address / Barangay</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Barangay San Vicente"
                                            value={newVisitorForm.address}
                                            onChange={(e) => setNewVisitorForm({ ...newVisitorForm, address: e.target.value })}
                                        />
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Church Ministry Interest</label>
                                        <select
                                            value={newVisitorForm.ministry}
                                            onChange={(e) => setNewVisitorForm({ ...newVisitorForm, ministry: e.target.value })}
                                        >
                                            <option value="">-- General Congregation --</option>
                                            {realMinistries.map((m) => (
                                                <option key={m.ministryId} value={m.name}>
                                                    {m.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="cia-form-group full">
                                    <label>First Visit Notes & Prayer Requests</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Notes on spiritual background or prayer needs..."
                                        value={newVisitorForm.notes}
                                        onChange={(e) => setNewVisitorForm({ ...newVisitorForm, notes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="cia-modal-footer">
                                <button type="button" className="cia-btn-outline" onClick={() => setShowRegisterVisitorModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="cia-btn-primary">
                                    Save Newcomer to Database
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* MODAL: LOG FOLLOW-UP TOUCHPOINT                              */}
            {/* ============================================================ */}
            {showFollowUpModal && selectedVisitorForFollowUp && (
                <div className="cia-modal-overlay">
                    <div className="cia-modal-card">
                        <div className="cia-modal-header">
                            <h3>Record Follow-Up Contact</h3>
                            <button type="button" onClick={() => setShowFollowUpModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSaveFollowUp}>
                            <div className="cia-modal-body">
                                <div className="cia-modal-info-bar">
                                    <strong>Newcomer:</strong> {selectedVisitorForFollowUp.fullName || `${selectedVisitorForFollowUp.firstName} ${selectedVisitorForFollowUp.lastName}`}
                                    <span> • Phone: {selectedVisitorForFollowUp.contactNumber || "N/A"}</span>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Interaction Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={followUpForm.interactionDate}
                                            onChange={(e) => setFollowUpForm({ ...followUpForm, interactionDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Channel / Type</label>
                                        <select
                                            value={followUpForm.type}
                                            onChange={(e) => setFollowUpForm({ ...followUpForm, type: e.target.value as any })}
                                        >
                                            <option value="Phone Call">Phone Call</option>
                                            <option value="Home Visit">Home Visit</option>
                                            <option value="Coffee Meeting">Coffee Meeting</option>
                                            <option value="SMS / Chat">SMS / Chat</option>
                                            <option value="Prayer Delivered">Prayer Delivered</option>
                                            <option value="Church Fellowship">Church Fellowship</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Leader / Worker Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={followUpForm.ministerName}
                                            onChange={(e) => setFollowUpForm({ ...followUpForm, ministerName: e.target.value })}
                                        />
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Spiritual Response / Outcome</label>
                                        <select
                                            value={followUpForm.outcome}
                                            onChange={(e) => setFollowUpForm({ ...followUpForm, outcome: e.target.value as any })}
                                        >
                                            <option value="Receptive & Warm">Receptive & Warm</option>
                                            <option value="Accepted Christ / Salvation">Accepted Christ / Salvation Decision</option>
                                            <option value="Requested Home Bible Study">Requested Home Bible Study</option>
                                            <option value="Scheduled Next Visit">Scheduled Next Visit</option>
                                            <option value="Needs Encouragement">Needs Encouragement</option>
                                            <option value="Not Interested">Not Interested at this time</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="cia-form-group full">
                                    <label>Next Follow-Up Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={followUpForm.nextFollowUpDate}
                                        onChange={(e) => setFollowUpForm({ ...followUpForm, nextFollowUpDate: e.target.value })}
                                    />
                                </div>

                                <div className="cia-form-group full">
                                    <label>Follow-Up Notes & Discussion Summary</label>
                                    <textarea
                                        rows={3}
                                        required
                                        placeholder="What was discussed? How is their spiritual hunger? Specific prayer points..."
                                        value={followUpForm.notes}
                                        onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="cia-modal-footer">
                                <button type="button" className="cia-btn-outline" onClick={() => setShowFollowUpModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="cia-btn-primary">
                                    Save Follow-Up Touchpoint
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* MODAL: CONSOLIDATION & DISCIPLESHIP MODAL                    */}
            {/* ============================================================ */}
            {showDiscipleshipModal && (
                <div className="cia-modal-overlay">
                    <div className="cia-modal-card">
                        <div className="cia-modal-header">
                            <h3>{editingDisciple ? "Edit Discipleship Profile" : "Enroll New Disciple"}</h3>
                            <button type="button" onClick={() => setShowDiscipleshipModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSaveDisciple}>
                            <div className="cia-modal-body">
                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Disciple Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={discipleshipForm.fullName || ""}
                                            onChange={(e) => setDiscipleshipForm({ ...discipleshipForm, fullName: e.target.value })}
                                        />
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Contact Number *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="0917-000-0000"
                                            value={discipleshipForm.contactNumber || ""}
                                            onChange={(e) => setDiscipleshipForm({ ...discipleshipForm, contactNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Discipler / Mentor</label>
                                        <select
                                            value={discipleshipForm.disciplerName || ""}
                                            onChange={(e) => setDiscipleshipForm({ ...discipleshipForm, disciplerName: e.target.value })}
                                        >
                                            <option value="">-- Select Member / Leader --</option>
                                            {realMembers.map((m) => (
                                                <option key={m.memberId} value={m.fullName}>
                                                    {m.fullName} ({m.memberCode || `#${m.memberId}`})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Cell / Life Group Name</label>
                                        <input
                                            type="text"
                                            value={discipleshipForm.cellGroupName || ""}
                                            onChange={(e) => setDiscipleshipForm({ ...discipleshipForm, cellGroupName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Discipleship Stage</label>
                                        <select
                                            value={discipleshipForm.stage || "New Believer"}
                                            onChange={(e) => setDiscipleshipForm({ ...discipleshipForm, stage: e.target.value as any })}
                                        >
                                            <option value="New Believer">New Believer</option>
                                            <option value="Foundation Track">Foundation Track</option>
                                            <option value="Baptized Disciple">Baptized Disciple</option>
                                            <option value="Cell Member">Cell Member</option>
                                            <option value="Leader in Training">Leader in Training</option>
                                        </select>
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Start Date</label>
                                        <input
                                            type="date"
                                            value={discipleshipForm.startDate || ""}
                                            onChange={(e) => setDiscipleshipForm({ ...discipleshipForm, startDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-group full">
                                    <label className="cia-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={discipleshipForm.waterBaptism?.isBaptized || false}
                                            onChange={(e) =>
                                                setDiscipleshipForm({
                                                    ...discipleshipForm,
                                                    waterBaptism: {
                                                        ...(discipleshipForm.waterBaptism || {}),
                                                        isBaptized: e.target.checked,
                                                        baptismDate: e.target.checked
                                                            ? (discipleshipForm.waterBaptism?.baptismDate || new Date().toISOString().split("T")[0])
                                                            : undefined,
                                                    },
                                                })
                                            }
                                        />
                                        <span> Water Baptized in the Name of Jesus Christ</span>
                                    </label>
                                </div>

                                {discipleshipForm.waterBaptism?.isBaptized && (
                                    <div className="cia-form-row">
                                        <div className="cia-form-group">
                                            <label>Baptism Date</label>
                                            <input
                                                type="date"
                                                value={discipleshipForm.waterBaptism?.baptismDate || ""}
                                                onChange={(e) =>
                                                    setDiscipleshipForm({
                                                        ...discipleshipForm,
                                                        waterBaptism: {
                                                            ...(discipleshipForm.waterBaptism || { isBaptized: true }),
                                                            baptismDate: e.target.value,
                                                        },
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="cia-form-group">
                                            <label>Officiating Minister</label>
                                            <input
                                                type="text"
                                                placeholder="Pastor or Minister name"
                                                value={discipleshipForm.waterBaptism?.officiatingPastor || ""}
                                                onChange={(e) =>
                                                    setDiscipleshipForm({
                                                        ...discipleshipForm,
                                                        waterBaptism: {
                                                            ...(discipleshipForm.waterBaptism || { isBaptized: true }),
                                                            officiatingPastor: e.target.value,
                                                        },
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="cia-form-group full">
                                    <label>Notes & Pastoral Comments</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Spiritual growth notes, life stage, testimony..."
                                        value={discipleshipForm.notes || ""}
                                        onChange={(e) => setDiscipleshipForm({ ...discipleshipForm, notes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="cia-modal-footer">
                                <button type="button" className="cia-btn-outline" onClick={() => setShowDiscipleshipModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="cia-btn-primary">
                                    {editingDisciple ? "Update Discipleship Profile" : "Save Disciple Profile"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* MODAL: COMMISSIONING & SENDING MODAL                         */}
            {/* ============================================================ */}
            {showSendingModal && (
                <div className="cia-modal-overlay">
                    <div className="cia-modal-card">
                        <div className="cia-modal-header">
                            <h3>{editingDeployment ? "Edit Commissioned Leader" : "Commission Worker / Leader"}</h3>
                            <button type="button" onClick={() => setShowSendingModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSaveSending}>
                            <div className="cia-modal-body">
                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Leader Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={sendingForm.fullName || ""}
                                            onChange={(e) => setSendingForm({ ...sendingForm, fullName: e.target.value })}
                                        />
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Contact Number</label>
                                        <input
                                            type="text"
                                            placeholder="0917-000-0000"
                                            value={sendingForm.contactNumber || ""}
                                            onChange={(e) => setSendingForm({ ...sendingForm, contactNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Ministry Department *</label>
                                        <select
                                            value={sendingForm.ministryDepartment || ""}
                                            onChange={(e) => setSendingForm({ ...sendingForm, ministryDepartment: e.target.value })}
                                        >
                                            <option value="">-- Select Church Ministry --</option>
                                            {realMinistries.map((m) => (
                                                <option key={m.ministryId} value={m.name}>
                                                    {m.name}
                                                </option>
                                            ))}
                                            <option value="Cell Ministry">Cell Ministry & Life Groups</option>
                                            <option value="Evangelism & Outreach">Evangelism & Outreach</option>
                                            <option value="Discipleship & Follow-up">Discipleship & Follow-up</option>
                                        </select>
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Assigned Ministry Role *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Life Group Leader, Worship Director"
                                            value={sendingForm.ministryRole || ""}
                                            onChange={(e) => setSendingForm({ ...sendingForm, ministryRole: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Commissioning Status</label>
                                        <select
                                            value={sendingForm.commissioningStatus || "In Preparation"}
                                            onChange={(e) => setSendingForm({ ...sendingForm, commissioningStatus: e.target.value as any })}
                                        >
                                            <option value="In Preparation">In Preparation</option>
                                            <option value="Ministry Intern">Ministry Intern</option>
                                            <option value="Commissioned Worker">Commissioned Worker</option>
                                            <option value="Cell Leader / Disciple-Maker">Cell Leader / Disciple-Maker</option>
                                            <option value="Sent Out / Missionary">Sent Out / Missionary</option>
                                        </select>
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Commissioning Date</label>
                                        <input
                                            type="date"
                                            value={sendingForm.commissioningDate || ""}
                                            onChange={(e) => setSendingForm({ ...sendingForm, commissioningDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Active Spiritual Fruit (Disciples Count)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={sendingForm.activeFruitCount || 0}
                                            onChange={(e) => setSendingForm({ ...sendingForm, activeFruitCount: Number(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Overseeing / Mentor Pastor</label>
                                        <input
                                            type="text"
                                            placeholder="Senior Pastor / Overseer"
                                            value={sendingForm.mentorPastor || ""}
                                            onChange={(e) => setSendingForm({ ...sendingForm, mentorPastor: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-group full">
                                    <label>Commissioning Notes & Field Assignment</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Ministry calling, field area, goals..."
                                        value={sendingForm.notes || ""}
                                        onChange={(e) => setSendingForm({ ...sendingForm, notes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="cia-modal-footer">
                                <button type="button" className="cia-btn-outline" onClick={() => setShowSendingModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="cia-btn-primary">
                                    {editingDeployment ? "Update Commissioning" : "Commission Leader"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* MODAL: ADD OUTREACH PROSPECT MODAL                           */}
            {/* ============================================================ */}
            {showProspectModal && (
                <div className="cia-modal-overlay">
                    <div className="cia-modal-card">
                        <div className="cia-modal-header">
                            <h3>Add Outreach & Evangelism Prospect</h3>
                            <button type="button" onClick={() => setShowProspectModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSaveProspect}>
                            <div className="cia-modal-body">
                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Prospect / Soul to win"
                                            value={prospectForm.fullName || ""}
                                            onChange={(e) => setProspectForm({ ...prospectForm, fullName: e.target.value })}
                                        />
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Contact Number *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="0917-000-0000"
                                            value={prospectForm.contactNumber || ""}
                                            onChange={(e) => setProspectForm({ ...prospectForm, contactNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Invited By (Church Member)</label>
                                        <select
                                            value={prospectForm.invitedBy || ""}
                                            onChange={(e) => setProspectForm({ ...prospectForm, invitedBy: e.target.value })}
                                        >
                                            <option value="">-- Select Member / Believer --</option>
                                            {realMembers.map((m) => (
                                                <option key={m.memberId} value={m.fullName}>
                                                    {m.fullName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Outreach Campaign / Event</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Easter Sunday, Youth Night, Cell Harvest"
                                            value={prospectForm.outreachCampaign || ""}
                                            onChange={(e) => setProspectForm({ ...prospectForm, outreachCampaign: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Relationship</label>
                                        <select
                                            value={prospectForm.relationship || "Friend"}
                                            onChange={(e) => setProspectForm({ ...prospectForm, relationship: e.target.value })}
                                        >
                                            <option value="Friend">Friend</option>
                                            <option value="Family Member">Family Member</option>
                                            <option value="Work Colleague">Work Colleague</option>
                                            <option value="Neighbor">Neighbor</option>
                                            <option value="Street Outreach">Street Outreach</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Spiritual Status</label>
                                        <select
                                            value={prospectForm.spiritualStatus || "Seeking"}
                                            onChange={(e) => setProspectForm({ ...prospectForm, spiritualStatus: e.target.value as any })}
                                        >
                                            <option value="Seeking">Seeking God</option>
                                            <option value="Unchurched">Unchurched</option>
                                            <option value="Backslidden">Backslidden (Needs Restoration)</option>
                                            <option value="Believer Relocating">Believer Relocating</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="cia-form-group full">
                                    <label>Address / Community</label>
                                    <input
                                        type="text"
                                        placeholder="Barangay or address"
                                        value={prospectForm.address || ""}
                                        onChange={(e) => setProspectForm({ ...prospectForm, address: e.target.value })}
                                    />
                                </div>

                                <div className="cia-form-group full">
                                    <label>Prayer Requests / Needs</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Specific salvation, healing, or family prayer requests..."
                                        value={prospectForm.prayerRequests || ""}
                                        onChange={(e) => setProspectForm({ ...prospectForm, prayerRequests: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="cia-modal-footer">
                                <button type="button" className="cia-btn-outline" onClick={() => setShowProspectModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="cia-btn-primary">
                                    Add to Soul-Winning Prayer List
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* PRINT-ONLY SECTION (ZERO BLANK/GRAY OVERLAYS)                */}
            {/* ============================================================ */}
            <div className="cia-print-document" id="cia-printable-summary">
                <div className="cia-print-header">
                    <h2>LUKE 4:18 MINISTRIES • SAN VICENTE CHURCH</h2>
                    <h1>CHURCH IN ACTION — NEWCOMERS MONITORING & DELEGATION REPORT</h1>
                    <p>Report Date: {new Date().toLocaleDateString()} • Generated via EPIC Church Management System</p>
                </div>

                <div className="cia-print-summary-box">
                    <div>Total Newcomers in DB: <strong>{metrics.totalNewcomers}</strong></div>
                    <div>Unassigned (Need Leader): <strong>{metrics.unassignedCount}</strong></div>
                    <div>In Follow-Up (Assigned): <strong>{metrics.activeDelegationsCount}</strong></div>
                    <div>Turned to Church Members: <strong>{metrics.convertedToMembersCount}</strong></div>
                    <div>Disciples & Leaders: <strong>{metrics.totalDisciples + metrics.totalSent}</strong></div>
                </div>

                <h3>Active Newcomer Follow-Up Caseload</h3>
                <table className="cia-print-table">
                    <thead>
                        <tr>
                            <th>Newcomer Name</th>
                            <th>Contact</th>
                            <th>Visit Count</th>
                            <th>Assigned Leader</th>
                            <th>Target Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {realVisitors.map((v) => {
                            const vName = v.fullName || `${v.firstName || ""} ${v.lastName || ""}`;
                            const del = delegations.find((d) => d.visitorId === v.visitorId);
                            return (
                                <tr key={v.visitorId}>
                                    <td>{vName}</td>
                                    <td>{v.contactNumber || "—"}</td>
                                    <td>{v.visitCount || 1}</td>
                                    <td>{del?.assignedLeaderName || "⚠️ Unassigned"}</td>
                                    <td>{del?.targetContactDate || "—"}</td>
                                    <td>{v.isConvertedToMember ? "👑 Church Member" : (del?.delegationStatus || "New")}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ChurchInActionPage;
