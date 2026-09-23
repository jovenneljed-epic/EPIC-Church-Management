// ============================================================
// ChurchInActionPage.tsx
// EPIC CHURCH MANAGEMENT SYSTEM - Luke 4:18 Ministries
// Module: Church in Action (Spiritual Lifecycle & Great Commission Engine)
// ============================================================

import React, { useState, useEffect, useMemo } from "react";
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
    ArrowRight,
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
} from "lucide-react";

import "./ChurchInAction.css";
import churchInActionService from "../../services/churchInActionService";
import type {
    Prospect,
    FollowUpLog,
    DiscipleshipProfile,
    SendingDeployment,
    SpiritualJourneyStage,
} from "../../services/churchInActionService";

type ActiveTab = "pipeline" | "evangelism" | "followup" | "discipleship" | "sending";

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

    const [activeTab, setActiveTab] = useState<ActiveTab>("pipeline");
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    // Core Data
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [visitors, setVisitors] = useState<any[]>([]);
    const [followUpLogs, setFollowUpLogs] = useState<FollowUpLog[]>([]);
    const [disciples, setDisciples] = useState<DiscipleshipProfile[]>([]);
    const [sentLeaders, setSentLeaders] = useState<SendingDeployment[]>([]);

    // Modals
    const [showProspectModal, setShowProspectModal] = useState<boolean>(false);
    const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);

    const [showFollowUpModal, setShowFollowUpModal] = useState<boolean>(false);
    const [selectedVisitorForFollowUp, setSelectedVisitorForFollowUp] = useState<any | null>(null);

    const [showDiscipleshipModal, setShowDiscipleshipModal] = useState<boolean>(false);
    const [editingDisciple, setEditingDisciple] = useState<DiscipleshipProfile | null>(null);

    const [showSendingModal, setShowSendingModal] = useState<boolean>(false);
    const [editingDeployment, setEditingDeployment] = useState<SendingDeployment | null>(null);

    const [viewingProfile, setViewingProfile] = useState<{
        name: string;
        contact: string;
        stage: SpiritualJourneyStage;
        details: any;
    } | null>(null);

    // Feedback message
    const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Form inputs state
    const [prospectForm, setProspectForm] = useState<Partial<Prospect>>({
        fullName: "",
        contactNumber: "",
        address: "",
        gender: "Not Specified",
        invitedBy: "",
        outreachCampaign: "Personal Outreach",
        relationship: "Friend",
        spiritualStatus: "Seeking",
        prayerRequests: "",
        invitationStatus: "In Prayer",
        targetServiceDate: "",
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
        cellGroupName: "Victory San Vicente",
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
        ministryDepartment: "Worship & Arts",
        ministryRole: "Ministry Worker",
        commissioningStatus: "In Preparation",
        commissioningDate: new Date().toISOString().split("T")[0],
        mentorPastor: "Pastor Roberto Garcia",
        activeFruitCount: 1,
        spiritualGifts: ["Serving", "Encouragement"],
        notes: "",
    });

    // ============================================================
    // LOAD DATA
    // ============================================================

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await churchInActionService.getLifecyclePipeline();
            setProspects(data.prospects);
            setVisitors(data.visitors);
            setFollowUpLogs(churchInActionService.getFollowUpLogs());
            setDisciples(data.disciples);
            setSentLeaders(data.sentLeaders);
        } catch (error) {
            console.error("Failed to load Church in Action data", error);
            showAlert("error", "Failed to sync some Church in Action data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const showAlert = (type: "success" | "error", text: string) => {
        setAlertMessage({ type, text });
        setTimeout(() => setAlertMessage(null), 4000);
    };

    // ============================================================
    // METRICS COMPUTATION
    // ============================================================

    const stats = useMemo(() => {
        const totalProspects = prospects.length;
        const totalVisitors = visitors.length;
        const activeFollowUps = followUpLogs.length;
        const totalDisciples = disciples.length;
        const totalSent = sentLeaders.length;
        const waterBaptized = disciples.filter((d) => d.waterBaptism?.isBaptized).length;
        const totalFruit = sentLeaders.reduce((sum, s) => sum + (s.activeFruitCount || 0), 0);

        return {
            totalProspects,
            totalVisitors,
            activeFollowUps,
            totalDisciples,
            totalSent,
            waterBaptized,
            totalFruit,
        };
    }, [prospects, visitors, followUpLogs, disciples, sentLeaders]);

    // ============================================================
    // EVANGELISM ACTIONS
    // ============================================================

    const handleOpenAddProspect = () => {
        setEditingProspect(null);
        setProspectForm({
            fullName: "",
            contactNumber: "",
            address: "",
            gender: "Not Specified",
            invitedBy: "",
            outreachCampaign: "Personal Outreach",
            relationship: "Friend",
            spiritualStatus: "Seeking",
            prayerRequests: "",
            invitationStatus: "In Prayer",
            targetServiceDate: "",
            notes: "",
        });
        setShowProspectModal(true);
    };

    const handleEditProspect = (prospect: Prospect) => {
        setEditingProspect(prospect);
        setProspectForm({ ...prospect });
        setShowProspectModal(true);
    };

    const handleSaveProspect = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prospectForm.fullName?.trim() || !prospectForm.contactNumber?.trim()) {
            showAlert("error", "Full name and contact number are required.");
            return;
        }

        churchInActionService.saveProspect({
            ...prospectForm,
            id: editingProspect?.id,
            fullName: prospectForm.fullName.trim(),
            contactNumber: prospectForm.contactNumber.trim(),
        });

        setShowProspectModal(false);
        showAlert("success", editingProspect ? "Prospect updated successfully." : "New soul added to Evangelism & Prayer list!");
        loadData();
    };

    const handleDeleteProspect = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to remove ${name} from the outreach list?`)) {
            churchInActionService.deleteProspect(id);
            showAlert("success", "Prospect removed.");
            loadData();
        }
    };

    const handlePromoteToVisitor = async (prospect: Prospect) => {
        try {
            const res = await churchInActionService.promoteProspectToVisitor(prospect.id);
            showAlert("success", res.message || `${prospect.fullName} is now an active visitor!`);
            loadData();
        } catch (error: any) {
            showAlert("error", error?.message || "Failed to promote prospect to visitor.");
        }
    };

    // ============================================================
    // FOLLOW-UP ACTIONS
    // ============================================================

    const handleOpenLogFollowUp = (visitor: any) => {
        setSelectedVisitorForFollowUp(visitor);
        setFollowUpForm({
            interactionDate: new Date().toISOString().split("T")[0],
            type: "Phone Call",
            ministerName: visitor.invitedBy || "Follow-up Worker",
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
            ministerName: followUpForm.ministerName.trim() || "Worker",
            notes: followUpForm.notes.trim(),
            outcome: followUpForm.outcome,
            nextFollowUpDate: followUpForm.nextFollowUpDate || undefined,
        });

        setShowFollowUpModal(false);
        showAlert("success", `Follow-up touchpoint recorded for ${selectedVisitorForFollowUp.firstName || selectedVisitorForFollowUp.fullName}!`);
        loadData();
    };

    const handleEnrollInDiscipleship = (visitor: any) => {
        const name = visitor.fullName || `${visitor.firstName} ${visitor.lastName}`;
        churchInActionService.saveDiscipleshipProfile({
            visitorId: visitor.visitorId,
            fullName: name,
            contactNumber: visitor.contactNumber || "0900-000-0000",
            disciplerName: visitor.invitedBy || "Spiritual Mentor",
            cellGroupName: "San Vicente Life Group",
            cellLeaderName: "Cell Leader",
            stage: "New Believer",
            startDate: new Date().toISOString().split("T")[0],
            spiritualHealthScore: 5,
            waterBaptism: { isBaptized: false },
            notes: `Enrolled from Visitor record (Code: ${visitor.visitorCode || visitor.visitorId}).`,
        });

        showAlert("success", `${name} enrolled in Consolidation & Discipleship journey!`);
        loadData();
        setActiveTab("discipleship");
    };

    // ============================================================
    // DISCIPLESHIP ACTIONS
    // ============================================================

    const handleOpenAddDisciple = () => {
        setEditingDisciple(null);
        setDiscipleshipForm({
            fullName: "",
            contactNumber: "",
            disciplerName: "",
            cellGroupName: "Victory San Vicente - Life Group",
            cellLeaderName: "",
            startDate: new Date().toISOString().split("T")[0],
            stage: "New Believer",
            spiritualHealthScore: 5,
            waterBaptism: { isBaptized: false },
            notes: "",
        });
        setShowDiscipleshipModal(true);
    };

    const handleEditDisciple = (disciple: DiscipleshipProfile) => {
        setEditingDisciple(disciple);
        setDiscipleshipForm({ ...disciple });
        setShowDiscipleshipModal(true);
    };

    const handleSaveDisciple = (e: React.FormEvent) => {
        e.preventDefault();
        if (!discipleshipForm.fullName?.trim() || !discipleshipForm.contactNumber?.trim()) {
            showAlert("error", "Name and contact number are required.");
            return;
        }

        churchInActionService.saveDiscipleshipProfile({
            ...discipleshipForm,
            id: editingDisciple?.id,
            fullName: discipleshipForm.fullName.trim(),
            contactNumber: discipleshipForm.contactNumber.trim(),
        });

        setShowDiscipleshipModal(false);
        showAlert("success", editingDisciple ? "Discipleship profile updated." : "New disciple registered!");
        loadData();
    };

    const handleToggleFoundation = (profileId: string, lessonKey: keyof DiscipleshipProfile["foundations"]) => {
        churchInActionService.toggleFoundationLesson(profileId, lessonKey);
        loadData();
    };

    const handleDeleteDisciple = (id: string, name: string) => {
        if (window.confirm(`Remove ${name} from discipleship tracking?`)) {
            churchInActionService.deleteDiscipleshipProfile(id);
            showAlert("success", "Disciple record removed.");
            loadData();
        }
    };

    const handleMobilizeToSending = (disciple: DiscipleshipProfile) => {
        churchInActionService.saveSendingDeployment({
            discipleshipId: disciple.id,
            fullName: disciple.fullName,
            contactNumber: disciple.contactNumber,
            ministryDepartment: "Evangelism & Outreach",
            ministryRole: "Soul Winning Worker",
            commissioningStatus: "In Preparation",
            commissioningDate: new Date().toISOString().split("T")[0],
            mentorPastor: disciple.disciplerName || "Senior Pastor",
            activeFruitCount: 1,
            spiritualGifts: ["Evangelism", "Serving"],
            notes: `Mobilized from discipleship track (${disciple.cellGroupName}).`,
        });

        showAlert("success", `${disciple.fullName} mobilized into Sending & Ministry preparation!`);
        loadData();
        setActiveTab("sending");
    };

    // ============================================================
    // SENDING ACTIONS
    // ============================================================

    const handleOpenAddSending = () => {
        setEditingDeployment(null);
        setSendingForm({
            fullName: "",
            contactNumber: "",
            ministryDepartment: "Worship & Arts",
            ministryRole: "Ministry Worker",
            commissioningStatus: "In Preparation",
            commissioningDate: new Date().toISOString().split("T")[0],
            mentorPastor: "Pastor Roberto Garcia",
            activeFruitCount: 1,
            spiritualGifts: ["Serving", "Encouragement"],
            notes: "",
        });
        setShowSendingModal(true);
    };

    const handleEditSending = (deployment: SendingDeployment) => {
        setEditingDeployment(deployment);
        setSendingForm({ ...deployment });
        setShowSendingModal(true);
    };

    const handleSaveSending = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sendingForm.fullName?.trim() || !sendingForm.ministryRole?.trim()) {
            showAlert("error", "Full name and ministry role are required.");
            return;
        }

        churchInActionService.saveSendingDeployment({
            ...sendingForm,
            id: editingDeployment?.id,
            fullName: sendingForm.fullName.trim(),
            ministryDepartment: sendingForm.ministryDepartment || "Worship & Arts",
            ministryRole: sendingForm.ministryRole.trim(),
        });

        setShowSendingModal(false);
        showAlert("success", editingDeployment ? "Ministry deployment updated." : "Servant-leader commissioned!");
        loadData();
    };

    const handleDeleteSending = (id: string, name: string) => {
        if (window.confirm(`Remove ${name} from sending deployments?`)) {
            churchInActionService.deleteSendingDeployment(id);
            showAlert("success", "Deployment removed.");
            loadData();
        }
    };

    // ============================================================
    // PRINT PREVIEW HELPER
    // ============================================================

    const handlePrintLifecycleReport = () => {
        window.print();
    };

    // Filter logic
    const filteredProspects = useMemo(() => {
        return prospects.filter((p) => {
            const matchesSearch =
                p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.invitedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.outreachCampaign.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "ALL" || p.invitationStatus === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [prospects, searchTerm, statusFilter]);

    const filteredVisitors = useMemo(() => {
        return visitors.filter((v) => {
            const name = (v.fullName || `${v.firstName || ""} ${v.lastName || ""}`).toLowerCase();
            const inv = (v.invitedBy || "").toLowerCase();
            const matchesSearch = name.includes(searchTerm.toLowerCase()) || inv.includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "ALL" || v.followUpStatus === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [visitors, searchTerm, statusFilter]);

    const filteredDisciples = useMemo(() => {
        return disciples.filter((d) => {
            const matchesSearch =
                d.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.disciplerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.cellGroupName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "ALL" || d.stage === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [disciples, searchTerm, statusFilter]);

    const filteredSentLeaders = useMemo(() => {
        return sentLeaders.filter((s) => {
            const matchesSearch =
                s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.ministryRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.ministryDepartment.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "ALL" || s.commissioningStatus === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [sentLeaders, searchTerm, statusFilter]);

    return (
        <div className="church-in-action-container">
            {/* ALERT NOTIFICATION */}
            {alertMessage && (
                <div className={`cia-alert-banner ${alertMessage.type}`}>
                    <span>{alertMessage.text}</span>
                    <button onClick={() => setAlertMessage(null)}>×</button>
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
                        <h1 className="cia-title">Church in Action</h1>
                        <p className="cia-subtitle">
                            Spiritual Lifecycle & Great Commission Engine: From Newcomer to Real Follower of Christ
                        </p>
                    </div>
                </div>

                <div className="cia-header-actions">
                    {onBack && (
                        <button
                            type="button"
                            className="cia-btn-outline"
                            onClick={onBack}
                            title="Back to previous screen"
                        >
                            ← Back
                        </button>
                    )}
                    <button
                        type="button"
                        className="cia-btn-outline"
                        onClick={loadData}
                        title="Refresh data from live API"
                    >
                        <RefreshCw size={16} className={loading ? "cia-spin" : ""} />
                        <span>Refresh</span>
                    </button>
                    <button
                        type="button"
                        className="cia-btn-outline"
                        onClick={handlePrintLifecycleReport}
                        title="Print clean summary document"
                    >
                        <Printer size={16} />
                        <span>Print Report</span>
                    </button>
                    {canManage && (
                        <button
                            type="button"
                            className="cia-btn-primary"
                        onClick={() => {
                            if (activeTab === "evangelism") handleOpenAddProspect();
                            else if (activeTab === "discipleship") handleOpenAddDisciple();
                            else if (activeTab === "sending") handleOpenAddSending();
                            else handleOpenAddProspect();
                        }}
                    >
                        <Plus size={18} />
                        <span>
                            {activeTab === "evangelism"
                                ? "Add Prospect"
                                : activeTab === "discipleship"
                                ? "Enroll Disciple"
                                : activeTab === "sending"
                                ? "Commission Leader"
                                : "Add New Person"}
                        </span>
                    </button>
                    )}
                </div>
            </header>

            {/* LIFECYCLE METRICS BAR */}
            <section className="cia-metrics-grid">
                <div className="cia-metric-card">
                    <div className="cia-metric-icon-wrap cia-icon-amber">
                        <UserPlus size={22} />
                    </div>
                    <div className="cia-metric-data">
                        <span className="cia-metric-label">1. Evangelism & Prospects</span>
                        <strong className="cia-metric-val">{stats.totalProspects}</strong>
                        <span className="cia-metric-hint">In Prayer & Outreach</span>
                    </div>
                </div>

                <div className="cia-metric-card">
                    <div className="cia-metric-icon-wrap cia-icon-blue">
                        <HeartHandshake size={22} />
                    </div>
                    <div className="cia-metric-data">
                        <span className="cia-metric-label">2. Visitors & Follow-Up</span>
                        <strong className="cia-metric-val">{stats.totalVisitors}</strong>
                        <span className="cia-metric-hint">{stats.activeFollowUps} Touchpoints Logged</span>
                    </div>
                </div>

                <div className="cia-metric-card">
                    <div className="cia-metric-icon-wrap cia-icon-emerald">
                        <BookOpen size={22} />
                    </div>
                    <div className="cia-metric-data">
                        <span className="cia-metric-label">3. Discipleship & Cell</span>
                        <strong className="cia-metric-val">{stats.totalDisciples}</strong>
                        <span className="cia-metric-hint">{stats.waterBaptized} Baptized in Water</span>
                    </div>
                </div>

                <div className="cia-metric-card">
                    <div className="cia-metric-icon-wrap cia-icon-purple">
                        <Send size={22} />
                    </div>
                    <div className="cia-metric-data">
                        <span className="cia-metric-label">4. Sending & Mobilization</span>
                        <strong className="cia-metric-val">{stats.totalSent}</strong>
                        <span className="cia-metric-hint">Commissioned Workers</span>
                    </div>
                </div>

                <div className="cia-metric-card cia-highlight-metric">
                    <div className="cia-metric-icon-wrap cia-icon-gold">
                        <Sparkles size={22} />
                    </div>
                    <div className="cia-metric-data">
                        <span className="cia-metric-label">Disciples Multiplied</span>
                        <strong className="cia-metric-val">{stats.totalFruit}</strong>
                        <span className="cia-metric-hint">Spiritual Fruit Bearing</span>
                    </div>
                </div>
            </section>

            {/* TAB NAVIGATION */}
            <nav className="cia-tabs-nav" aria-label="Church in Action Sub-systems">
                <button
                    type="button"
                    className={`cia-tab-btn ${activeTab === "pipeline" ? "active" : ""}`}
                    onClick={() => {
                        setActiveTab("pipeline");
                        setStatusFilter("ALL");
                    }}
                >
                    <Layers size={17} />
                    <span>Spiritual Lifecycle Pipeline</span>
                    <span className="cia-badge-pill">
                        {stats.totalProspects + stats.totalVisitors + stats.totalDisciples + stats.totalSent}
                    </span>
                </button>

                <button
                    type="button"
                    className={`cia-tab-btn ${activeTab === "evangelism" ? "active" : ""}`}
                    onClick={() => {
                        setActiveTab("evangelism");
                        setStatusFilter("ALL");
                    }}
                >
                    <UserPlus size={17} />
                    <span>1. Invitation / Evangelism</span>
                    <span className="cia-badge-pill">{stats.totalProspects}</span>
                </button>

                <button
                    type="button"
                    className={`cia-tab-btn ${activeTab === "followup" ? "active" : ""}`}
                    onClick={() => {
                        setActiveTab("followup");
                        setStatusFilter("ALL");
                    }}
                >
                    <HeartHandshake size={17} />
                    <span>2. Visitor Follow-Up</span>
                    <span className="cia-badge-pill">{stats.totalVisitors}</span>
                </button>

                <button
                    type="button"
                    className={`cia-tab-btn ${activeTab === "discipleship" ? "active" : ""}`}
                    onClick={() => {
                        setActiveTab("discipleship");
                        setStatusFilter("ALL");
                    }}
                >
                    <BookOpen size={17} />
                    <span>3. Consolidation / Discipleship</span>
                    <span className="cia-badge-pill">{stats.totalDisciples}</span>
                </button>

                <button
                    type="button"
                    className={`cia-tab-btn ${activeTab === "sending" ? "active" : ""}`}
                    onClick={() => {
                        setActiveTab("sending");
                        setStatusFilter("ALL");
                    }}
                >
                    <Send size={17} />
                    <span>4. Sending & Mobilization</span>
                    <span className="cia-badge-pill">{stats.totalSent}</span>
                </button>
            </nav>

            {/* SEARCH AND CONTROLS BAR (FOR NON-PIPELINE TABS) */}
            {activeTab !== "pipeline" && (
                <div className="cia-controls-bar">
                    <div className="cia-search-box">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, inviter, discipler, or campaign..."
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
                        <Filter size={16} />
                        <label>Filter:</label>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="ALL">All Statuses</option>
                            {activeTab === "evangelism" && (
                                <>
                                    <option value="In Prayer">In Prayer</option>
                                    <option value="Invited">Invited</option>
                                    <option value="Confirmed Attending">Confirmed Attending</option>
                                    <option value="Attended">Attended (Promoted)</option>
                                </>
                            )}
                            {activeTab === "followup" && (
                                <>
                                    <option value="NEW">New (1st Visit)</option>
                                    <option value="CONTACTED">Contacted</option>
                                    <option value="FOLLOW-UP">Follow-Up (2nd Visit)</option>
                                    <option value="CONNECTED">Connected (3+ Visits)</option>
                                    <option value="CONVERTED">Converted to Member</option>
                                </>
                            )}
                            {activeTab === "discipleship" && (
                                <>
                                    <option value="New Believer">New Believer</option>
                                    <option value="Foundation Track">Foundation Track</option>
                                    <option value="Baptized Disciple">Baptized Disciple</option>
                                    <option value="Cell Member">Cell Member</option>
                                    <option value="Leader in Training">Leader in Training</option>
                                </>
                            )}
                            {activeTab === "sending" && (
                                <>
                                    <option value="In Preparation">In Preparation</option>
                                    <option value="Ministry Intern">Ministry Intern</option>
                                    <option value="Commissioned Worker">Commissioned Worker</option>
                                    <option value="Cell Leader / Disciple-Maker">Cell Leader / Disciple-Maker</option>
                                </>
                            )}
                        </select>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 1: SPIRITUAL LIFECYCLE PIPELINE (KANBAN / FUNNEL)       */}
            {/* ============================================================ */}
            {activeTab === "pipeline" && (
                <div className="cia-pipeline-view">
                    <div className="cia-pipeline-info-banner">
                        <div className="cia-pib-content">
                            <strong>The Great Commission Pipeline (Matthew 28:19-20)</strong>
                            <p>
                                Monitor the complete journey from initial invitation, to visitor hospitality, into foundational discipleship, and finally sending them as multiplying leaders.
                            </p>
                        </div>
                        <div className="cia-pib-steps">
                            <span className="step-pill">1. Win</span>
                            <ArrowRight size={14} />
                            <span className="step-pill">2. Consolidate</span>
                            <ArrowRight size={14} />
                            <span className="step-pill">3. Disciple</span>
                            <ArrowRight size={14} />
                            <span className="step-pill">4. Send</span>
                        </div>
                    </div>

                    <div className="cia-kanban-board">
                        {/* COLUMN 1: PROSPECTS */}
                        <div className="cia-kanban-col">
                            <div className="cia-col-header amber">
                                <div>
                                    <span className="cia-col-step">STAGE 1</span>
                                    <h4>Outreach & Invites</h4>
                                </div>
                                <span className="cia-col-count">{prospects.length}</span>
                            </div>
                            <div className="cia-col-cards">
                                {prospects.map((p) => (
                                    <div key={p.id} className="cia-kanban-card">
                                        <div className="cia-card-top">
                                            <span className="cia-id-tag">{p.id}</span>
                                            <span className={`cia-status-chip ${p.invitationStatus.toLowerCase().replace(/\s+/g, "-")}`}>
                                                {p.invitationStatus}
                                            </span>
                                        </div>
                                        <h5 className="cia-card-name">{p.fullName}</h5>
                                        <p className="cia-card-sub">
                                            <Users size={12} /> Inviter: <strong>{p.invitedBy}</strong>
                                        </p>
                                        <p className="cia-card-sub">
                                            <Flame size={12} /> {p.outreachCampaign}
                                        </p>
                                        {p.prayerRequests && (
                                            <div className="cia-card-prayer">
                                                <span>🙏 {p.prayerRequests}</span>
                                            </div>
                                        )}
                                        <div className="cia-card-footer">
                                            {p.invitationStatus !== "Attended" ? (
                                                <button
                                                    type="button"
                                                    className="cia-btn-sm-action"
                                                    onClick={() => handlePromoteToVisitor(p)}
                                                    title="Mark as attended church and create Visitor profile"
                                                >
                                                    <UserCheck size={13} />
                                                    <span>Promote to Visitor</span>
                                                </button>
                                            ) : (
                                                <span className="cia-promoted-label">✓ Promoted to Visitor</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {prospects.length === 0 && (
                                    <div className="cia-col-empty">No active prospects in prayer list.</div>
                                )}
                            </div>
                        </div>

                        {/* COLUMN 2: VISITORS */}
                        <div className="cia-kanban-col">
                            <div className="cia-col-header blue">
                                <div>
                                    <span className="cia-col-step">STAGE 2</span>
                                    <h4>Guests & Follow-Up</h4>
                                </div>
                                <span className="cia-col-count">{visitors.length}</span>
                            </div>
                            <div className="cia-col-cards">
                                {visitors.map((v) => {
                                    const name = v.fullName || `${v.firstName || ""} ${v.lastName || ""}`;
                                    const logs = followUpLogs.filter((l) => l.visitorId === v.visitorId);
                                    return (
                                        <div key={v.visitorId} className="cia-kanban-card">
                                            <div className="cia-card-top">
                                                <span className="cia-id-tag">{v.visitorCode || `VIS-${v.visitorId}`}</span>
                                                <span className={`cia-status-chip ${v.followUpStatus?.toLowerCase() || "new"}`}>
                                                    {v.followUpStatus || "NEW"}
                                                </span>
                                            </div>
                                            <h5 className="cia-card-name">{name}</h5>
                                            <p className="cia-card-sub">
                                                <Clock size={12} /> Visits: <strong>{v.visitCount || 1} time(s)</strong>
                                            </p>
                                            <p className="cia-card-sub">
                                                <Phone size={12} /> {v.contactNumber || "No contact"}
                                            </p>
                                            <div className="cia-card-interaction-snippet">
                                                <small>{logs.length} follow-up touchpoint(s)</small>
                                            </div>
                                            <div className="cia-card-footer dual">
                                                <button
                                                    type="button"
                                                    className="cia-btn-sm-touchpoint"
                                                    onClick={() => handleOpenLogFollowUp(v)}
                                                >
                                                    <HeartHandshake size={13} />
                                                    <span>Log Contact</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="cia-btn-sm-action"
                                                    onClick={() => handleEnrollInDiscipleship(v)}
                                                    title="Transfer into Discipleship track"
                                                >
                                                    <BookOpen size={13} />
                                                    <span>Disciple</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {visitors.length === 0 && (
                                    <div className="cia-col-empty">No visitors recorded yet.</div>
                                )}
                            </div>
                        </div>

                        {/* COLUMN 3: FOUNDATIONS & NEW BELIEVER */}
                        <div className="cia-kanban-col">
                            <div className="cia-col-header emerald">
                                <div>
                                    <span className="cia-col-step">STAGE 3</span>
                                    <h4>Discipleship & Cell</h4>
                                </div>
                                <span className="cia-col-count">{disciples.length}</span>
                            </div>
                            <div className="cia-col-cards">
                                {disciples.map((d) => {
                                    const lessonsDone = Object.values(d.foundations || {}).filter(Boolean).length;
                                    return (
                                        <div key={d.id} className="cia-kanban-card">
                                            <div className="cia-card-top">
                                                <span className="cia-id-tag">{d.id}</span>
                                                <span className="cia-status-chip emerald">{d.stage}</span>
                                            </div>
                                            <h5 className="cia-card-name">{d.fullName}</h5>
                                            <p className="cia-card-sub">
                                                <Users size={12} /> Mentor: <strong>{d.disciplerName}</strong>
                                            </p>
                                            <p className="cia-card-sub">
                                                <ShieldCheck size={12} /> Cell: {d.cellGroupName}
                                            </p>
                                            {/* PROGRESS BAR */}
                                            <div className="cia-card-progress">
                                                <div className="cia-progress-label">
                                                    <span>Foundations Progress</span>
                                                    <strong>{lessonsDone}/6 Lessons</strong>
                                                </div>
                                                <div className="cia-progress-track">
                                                    <div
                                                        className="cia-progress-fill"
                                                        style={{ width: `${(lessonsDone / 6) * 100}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="cia-card-badge-row">
                                                {d.waterBaptism?.isBaptized ? (
                                                    <span className="cia-pill-success">🌊 Water Baptized</span>
                                                ) : (
                                                    <span className="cia-pill-pending">⏳ Baptism Pending</span>
                                                )}
                                            </div>

                                            <div className="cia-card-footer">
                                                <button
                                                    type="button"
                                                    className="cia-btn-sm-action"
                                                    onClick={() => handleMobilizeToSending(d)}
                                                    title="Mobilize into ministry service"
                                                >
                                                    <Send size={13} />
                                                    <span>Send / Mobilize</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {disciples.length === 0 && (
                                    <div className="cia-col-empty">No disciples currently registered.</div>
                                )}
                            </div>
                        </div>

                        {/* COLUMN 4: COMMISSIONED WORKERS */}
                        <div className="cia-kanban-col">
                            <div className="cia-col-header purple">
                                <div>
                                    <span className="cia-col-step">STAGE 4</span>
                                    <h4>Sent & Multiplying</h4>
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
                                        <p className="cia-card-sub">
                                            <Award size={12} /> Ministry: <strong>{s.ministryDepartment}</strong>
                                        </p>
                                        <p className="cia-card-sub">
                                            <Sparkles size={12} /> Role: {s.ministryRole}
                                        </p>

                                        <div className="cia-card-fruit-box">
                                            <span className="fruit-count">🌱 {s.activeFruitCount} Disciples</span>
                                            <small>Currently multiplying spiritual fruit</small>
                                        </div>

                                        <div className="cia-card-footer">
                                            <button
                                                type="button"
                                                className="cia-btn-sm-touchpoint"
                                                onClick={() => {
                                                    setViewingProfile({
                                                        name: s.fullName,
                                                        contact: s.contactNumber || "N/A",
                                                        stage: "COMMISSIONED_LEADER",
                                                        details: s,
                                                    });
                                                }}
                                            >
                                                <GraduationCap size={13} />
                                                <span>View Credentials</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {sentLeaders.length === 0 && (
                                    <div className="cia-col-empty">No sent workers commissioned yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 2: EVANGELISM & INVITATIONS SUB-SYSTEM                  */}
            {/* ============================================================ */}
            {activeTab === "evangelism" && (
                <div className="cia-tab-content">
                    <div className="cia-section-banner amber-theme">
                        <div>
                            <h3>Soul-Winning & Evangelism Invitation System</h3>
                            <p>
                                Manage church outreach campaigns, Operation Andrew / "My 3" personal prayer lists, and track prospects before they visit.
                            </p>
                        </div>
                        <button type="button" className="cia-btn-action-banner" onClick={handleOpenAddProspect}>
                            <UserPlus size={16} />
                            <span>Add Outreach Prospect</span>
                        </button>
                    </div>

                    <div className="cia-table-container">
                        <table className="cia-table">
                            <thead>
                                <tr>
                                    <th>Code / Name</th>
                                    <th>Invited By (Church Member)</th>
                                    <th>Outreach Campaign</th>
                                    <th>Spiritual Background</th>
                                    <th>Prayer Request / Notes</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProspects.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <div className="cia-table-primary-cell">
                                                <strong>{p.fullName}</strong>
                                                <small>{p.contactNumber} • {p.relationship}</small>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="cia-inviter-text">{p.invitedBy}</span>
                                        </td>
                                        <td>
                                            <span className="cia-campaign-badge">{p.outreachCampaign}</span>
                                        </td>
                                        <td>
                                            <span className="cia-spiritual-status">{p.spiritualStatus}</span>
                                        </td>
                                        <td className="cia-notes-cell">
                                            {p.prayerRequests && (
                                                <p className="cia-prayer-text">🙏 {p.prayerRequests}</p>
                                            )}
                                            {p.notes && <p className="cia-gen-notes">{p.notes}</p>}
                                        </td>
                                        <td>
                                            <span className={`cia-status-chip ${p.invitationStatus.toLowerCase().replace(/\s+/g, "-")}`}>
                                                {p.invitationStatus}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="cia-table-actions">
                                                {p.invitationStatus !== "Attended" && (
                                                    <button
                                                        type="button"
                                                        className="cia-btn-promote"
                                                        onClick={() => handlePromoteToVisitor(p)}
                                                        title="1-Click Promote to Visitors Data"
                                                    >
                                                        <UserCheck size={14} />
                                                        <span>Promote to Visitor</span>
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="cia-icon-btn"
                                                    onClick={() => handleEditProspect(p)}
                                                    title="Edit Prospect"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="cia-icon-btn danger"
                                                    onClick={() => handleDeleteProspect(p.id, p.fullName)}
                                                    title="Remove"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredProspects.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="cia-no-data">
                                            No prospects found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 3: VISITOR FOLLOW-UP SUB-SYSTEM                         */}
            {/* ============================================================ */}
            {activeTab === "followup" && (
                <div className="cia-tab-content">
                    <div className="cia-section-banner blue-theme">
                        <div>
                            <h3>Visitor Follow-Up Management (Connected to Live Visitors)</h3>
                            <p>
                                Direct real-time connection to church visitor records. Record contact history, phone calls, home visits, and prayer delivery.
                            </p>
                        </div>
                        <div className="cia-banner-stat">
                            <strong>{visitors.length}</strong>
                            <span>Total Visitors Linked</span>
                        </div>
                    </div>

                    <div className="cia-table-container">
                        <table className="cia-table">
                            <thead>
                                <tr>
                                    <th>Visitor</th>
                                    <th>First Visit Date</th>
                                    <th>Visit Count</th>
                                    <th>Invited By</th>
                                    <th>Follow-Up Status</th>
                                    <th>Touchpoints Logged</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVisitors.map((v) => {
                                    const name = v.fullName || `${v.firstName || ""} ${v.lastName || ""}`;
                                    const logs = followUpLogs.filter((l) => l.visitorId === v.visitorId);
                                    return (
                                        <tr key={v.visitorId}>
                                            <td>
                                                <div className="cia-table-primary-cell">
                                                    <strong>{name}</strong>
                                                    <small>{v.visitorCode || `ID #${v.visitorId}`} • {v.contactNumber || "No phone"}</small>
                                                </div>
                                            </td>
                                            <td>{v.firstVisitDate || "Recent"}</td>
                                            <td>
                                                <span className="cia-visit-badge">{v.visitCount || 1} Visit(s)</span>
                                            </td>
                                            <td>{v.invitedBy || "Walk-In"}</td>
                                            <td>
                                                <span className={`cia-status-chip ${v.followUpStatus?.toLowerCase() || "new"}`}>
                                                    {v.followUpStatus || "NEW"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="cia-logs-summary">
                                                    <strong>{logs.length} touchpoint(s)</strong>
                                                    {logs.length > 0 && (
                                                        <small>Last: {logs[0].type} ({logs[0].interactionDate})</small>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cia-table-actions">
                                                    <button
                                                        type="button"
                                                        className="cia-btn-promote"
                                                        onClick={() => handleOpenLogFollowUp(v)}
                                                        title="Record Call, Visit, or Message"
                                                    >
                                                        <HeartHandshake size={14} />
                                                        <span>Log Touchpoint</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="cia-btn-outline-sm"
                                                        onClick={() => handleEnrollInDiscipleship(v)}
                                                        title="Transfer to Consolidation & Discipleship"
                                                    >
                                                        <BookOpen size={14} />
                                                        <span>Enroll in Discipleship</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredVisitors.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="cia-no-data">
                                            No visitors found in the system.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 4: CONSOLIDATION & DISCIPLESHIP SUB-SYSTEM               */}
            {/* ============================================================ */}
            {activeTab === "discipleship" && (
                <div className="cia-tab-content">
                    <div className="cia-section-banner emerald-theme">
                        <div>
                            <h3>Consolidation & Discipleship Management</h3>
                            <p>
                                Ground new believers in faith: 6 foundational lessons, water baptism obedience, cell group integration, and spiritual mentorship.
                            </p>
                        </div>
                        <button type="button" className="cia-btn-action-banner" onClick={handleOpenAddDisciple}>
                            <Plus size={16} />
                            <span>Enroll New Disciple</span>
                        </button>
                    </div>

                    <div className="cia-disciples-grid">
                        {filteredDisciples.map((d) => {
                            const completedCount = Object.values(d.foundations || {}).filter(Boolean).length;
                            return (
                                <div key={d.id} className="cia-disciple-card">
                                    <div className="cia-dcard-header">
                                        <div>
                                            <span className="cia-id-tag">{d.id}</span>
                                            <h4>{d.fullName}</h4>
                                            <span className="cia-dcard-contact">{d.contactNumber}</span>
                                        </div>
                                        <span className="cia-status-chip emerald">{d.stage}</span>
                                    </div>

                                    <div className="cia-dcard-meta">
                                        <div className="cia-meta-item">
                                            <span>Spiritual Mentor:</span>
                                            <strong>{d.disciplerName}</strong>
                                        </div>
                                        <div className="cia-meta-item">
                                            <span>Cell Group:</span>
                                            <strong>{d.cellGroupName}</strong>
                                        </div>
                                    </div>

                                    {/* 6 FOUNDATIONAL MILESTONES CHECKLIST */}
                                    <div className="cia-foundations-box">
                                        <div className="cia-fbox-header">
                                            <strong>Foundations Track ({completedCount}/6)</strong>
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
                                                <span>3. Holy Spirit & Christian Walk</span>
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
                                                <span>5. Church Community & Fellowship</span>
                                            </label>

                                            <label className="cia-lesson-check">
                                                <input
                                                    type="checkbox"
                                                    checked={d.foundations.lesson6Stewardship}
                                                    onChange={() => handleToggleFoundation(d.id, "lesson6Stewardship")}
                                                />
                                                <span>6. Stewardship & The Great Commission</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* BAPTISM STATUS */}
                                    <div className="cia-baptism-strip">
                                        {d.waterBaptism?.isBaptized ? (
                                            <div className="cia-strip-baptized">
                                                <CheckCircle2 size={16} />
                                                <span>Water Baptized on {d.waterBaptism.baptismDate || "Recorded"}</span>
                                            </div>
                                        ) : (
                                            <div className="cia-strip-unbaptized">
                                                <Clock size={16} />
                                                <span>Water Baptism: Preparing</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="cia-dcard-footer">
                                        <button
                                            type="button"
                                            className="cia-btn-outline-sm"
                                            onClick={() => handleEditDisciple(d)}
                                        >
                                            <Edit size={13} />
                                            <span>Edit Profile</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="cia-btn-promote"
                                            onClick={() => handleMobilizeToSending(d)}
                                            title="Mobilize into active ministry service"
                                        >
                                            <Send size={13} />
                                            <span>Mobilize & Send</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="cia-icon-btn danger"
                                            onClick={() => handleDeleteDisciple(d.id, d.fullName)}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredDisciples.length === 0 && (
                            <div className="cia-no-data-card">No disciples found. Click "Enroll New Disciple" to add someone.</div>
                        )}
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 5: SENDING & MOBILIZATION SUB-SYSTEM                     */}
            {/* ============================================================ */}
            {activeTab === "sending" && (
                <div className="cia-tab-content">
                    <div className="cia-section-banner purple-theme">
                        <div>
                            <h3>Sending & Ministry Mobilization System</h3>
                            <p>
                                Commissioning disciples into faithful servants, ministry workers, cell leaders, and soul-winners who reproduce new believers.
                            </p>
                        </div>
                        <button type="button" className="cia-btn-action-banner" onClick={handleOpenAddSending}>
                            <Send size={16} />
                            <span>Commission Worker</span>
                        </button>
                    </div>

                    <div className="cia-table-container">
                        <table className="cia-table">
                            <thead>
                                <tr>
                                    <th>Commissioned Worker</th>
                                    <th>Ministry Department</th>
                                    <th>Assigned Role</th>
                                    <th>Spiritual Gifts</th>
                                    <th>Commissioning Status</th>
                                    <th>Disciples Multiplying (Fruit)</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSentLeaders.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <div className="cia-table-primary-cell">
                                                <strong>{s.fullName}</strong>
                                                <small>{s.contactNumber || "No contact"} • Mentor: {s.mentorPastor}</small>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="cia-dept-pill">{s.ministryDepartment}</span>
                                        </td>
                                        <td>
                                            <strong>{s.ministryRole}</strong>
                                        </td>
                                        <td>
                                            <div className="cia-gifts-wrap">
                                                {s.spiritualGifts?.map((gift, idx) => (
                                                    <span key={idx} className="cia-gift-tag">{gift}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="cia-status-chip purple">{s.commissioningStatus}</span>
                                        </td>
                                        <td>
                                            <div className="cia-fruit-cell">
                                                <span className="cia-fruit-number">{s.activeFruitCount}</span>
                                                <small>Spiritual Offspring</small>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="cia-table-actions">
                                                <button
                                                    type="button"
                                                    className="cia-icon-btn"
                                                    onClick={() => handleEditSending(s)}
                                                    title="Edit Commissioning"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="cia-icon-btn danger"
                                                    onClick={() => handleDeleteSending(s.id, s.fullName)}
                                                    title="Remove"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredSentLeaders.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="cia-no-data">
                                            No commissioned workers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* MODAL 1: ADD / EDIT PROSPECT MODAL                           */}
            {/* ============================================================ */}
            {showProspectModal && (
                <div className="cia-modal-overlay">
                    <div className="cia-modal-card">
                        <div className="cia-modal-header">
                            <h3>{editingProspect ? "Edit Outreach Prospect" : "Add Soul to Outreach & Prayer List"}</h3>
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
                                            placeholder="e.g. Juan Santos Dela Cruz"
                                            value={prospectForm.fullName}
                                            onChange={(e) => setProspectForm({ ...prospectForm, fullName: e.target.value })}
                                        />
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Contact Number *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. 0917-123-4567"
                                            value={prospectForm.contactNumber}
                                            onChange={(e) => setProspectForm({ ...prospectForm, contactNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Invited By (Church Member / Evangelist)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Bro. Jonathan Santos"
                                            value={prospectForm.invitedBy}
                                            onChange={(e) => setProspectForm({ ...prospectForm, invitedBy: e.target.value })}
                                        />
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Relationship</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Neighbor, Colleague, Family"
                                            value={prospectForm.relationship}
                                            onChange={(e) => setProspectForm({ ...prospectForm, relationship: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Outreach Campaign</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Easter Celebration, Youth Life Night, Sunday Service"
                                            value={prospectForm.outreachCampaign}
                                            onChange={(e) => setProspectForm({ ...prospectForm, outreachCampaign: e.target.value })}
                                        />
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Spiritual Background</label>
                                        <select
                                            value={prospectForm.spiritualStatus}
                                            onChange={(e) => setProspectForm({ ...prospectForm, spiritualStatus: e.target.value as any })}
                                        >
                                            <option value="Unchurched">Unchurched</option>
                                            <option value="Seeking">Seeking God</option>
                                            <option value="Backslidden">Backslidden (Needs Restoration)</option>
                                            <option value="Believer Relocating">Believer Relocating</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Invitation Status</label>
                                        <select
                                            value={prospectForm.invitationStatus}
                                            onChange={(e) => setProspectForm({ ...prospectForm, invitationStatus: e.target.value as any })}
                                        >
                                            <option value="In Prayer">In Prayer</option>
                                            <option value="Invited">Invited</option>
                                            <option value="Confirmed Attending">Confirmed Attending</option>
                                            <option value="Follow-up Needed">Follow-up Needed</option>
                                            <option value="Attended">Attended</option>
                                        </select>
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Target Service Date</label>
                                        <input
                                            type="date"
                                            value={prospectForm.targetServiceDate}
                                            onChange={(e) => setProspectForm({ ...prospectForm, targetServiceDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-group full">
                                    <label>Prayer Requests</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Specific prayers for their salvation, family, health, or career..."
                                        value={prospectForm.prayerRequests}
                                        onChange={(e) => setProspectForm({ ...prospectForm, prayerRequests: e.target.value })}
                                    />
                                </div>

                                <div className="cia-form-group full">
                                    <label>Outreach Notes</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Notes on discussions, receptivity, next steps..."
                                        value={prospectForm.notes}
                                        onChange={(e) => setProspectForm({ ...prospectForm, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="cia-modal-footer">
                                <button type="button" className="cia-btn-outline" onClick={() => setShowProspectModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="cia-btn-primary">
                                    {editingProspect ? "Update Prospect" : "Save Soul to Outreach List"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* MODAL 2: LOG FOLLOW-UP TOUCHPOINT MODAL                      */}
            {/* ============================================================ */}
            {showFollowUpModal && selectedVisitorForFollowUp && (
                <div className="cia-modal-overlay">
                    <div className="cia-modal-card">
                        <div className="cia-modal-header">
                            <h3>Record Follow-Up Touchpoint</h3>
                            <button type="button" onClick={() => setShowFollowUpModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSaveFollowUp}>
                            <div className="cia-modal-body">
                                <div className="cia-modal-info-bar">
                                    <strong>Visitor:</strong> {selectedVisitorForFollowUp.fullName || `${selectedVisitorForFollowUp.firstName} ${selectedVisitorForFollowUp.lastName}`}
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
                                        <label>Interaction Type</label>
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
                                        <label>Minister / Worker Name *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Who made this contact?"
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
                                    <label>Next Scheduled Follow-up Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={followUpForm.nextFollowUpDate}
                                        onChange={(e) => setFollowUpForm({ ...followUpForm, nextFollowUpDate: e.target.value })}
                                    />
                                </div>

                                <div className="cia-form-group full">
                                    <label>Notes & Feedback</label>
                                    <textarea
                                        rows={3}
                                        required
                                        placeholder="Summary of conversation, prayer needs, family updates..."
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
            {/* MODAL 3: ENROLL / EDIT DISCIPLE MODAL                        */}
            {/* ============================================================ */}
            {showDiscipleshipModal && (
                <div className="cia-modal-overlay">
                    <div className="cia-modal-card">
                        <div className="cia-modal-header">
                            <h3>{editingDisciple ? "Edit Discipleship Profile" : "Enroll Believer in Discipleship"}</h3>
                            <button type="button" onClick={() => setShowDiscipleshipModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSaveDisciple}>
                            <div className="cia-modal-body">
                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={discipleshipForm.fullName}
                                            onChange={(e) => setDiscipleshipForm({ ...discipleshipForm, fullName: e.target.value })}
                                        />
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Contact Number *</label>
                                        <input
                                            type="text"
                                            required
                                            value={discipleshipForm.contactNumber}
                                            onChange={(e) => setDiscipleshipForm({ ...discipleshipForm, contactNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Assigned Spiritual Mentor / Discipler</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Elder Michael Cruz"
                                            value={discipleshipForm.disciplerName}
                                            onChange={(e) => setDiscipleshipForm({ ...discipleshipForm, disciplerName: e.target.value })}
                                        />
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Cell / Life Group Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Victory San Vicente"
                                            value={discipleshipForm.cellGroupName}
                                            onChange={(e) => setDiscipleshipForm({ ...discipleshipForm, cellGroupName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Current Growth Stage</label>
                                        <select
                                            value={discipleshipForm.stage}
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
                                        <label>Water Baptism Status</label>
                                        <div className="cia-checkbox-inline">
                                            <input
                                                type="checkbox"
                                                id="chk-baptized"
                                                checked={discipleshipForm.waterBaptism?.isBaptized}
                                                onChange={(e) =>
                                                    setDiscipleshipForm({
                                                        ...discipleshipForm,
                                                        waterBaptism: {
                                                            ...discipleshipForm.waterBaptism,
                                                            isBaptized: e.target.checked,
                                                            baptismDate: e.target.checked
                                                                ? discipleshipForm.waterBaptism?.baptismDate || new Date().toISOString().split("T")[0]
                                                                : undefined,
                                                        },
                                                    })
                                                }
                                            />
                                            <label htmlFor="chk-baptized">Believer is Water Baptized</label>
                                        </div>
                                    </div>
                                </div>

                                {discipleshipForm.waterBaptism?.isBaptized && (
                                    <div className="cia-form-row">
                                        <div className="cia-form-group">
                                            <label>Baptism Date</label>
                                            <input
                                                type="date"
                                                value={discipleshipForm.waterBaptism.baptismDate || ""}
                                                onChange={(e) =>
                                                    setDiscipleshipForm({
                                                        ...discipleshipForm,
                                                        waterBaptism: {
                                                            ...discipleshipForm.waterBaptism!,
                                                            baptismDate: e.target.value,
                                                        },
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="cia-form-group">
                                            <label>Officiating Pastor</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Pastor Roberto Garcia"
                                                value={discipleshipForm.waterBaptism.officiatingPastor || ""}
                                                onChange={(e) =>
                                                    setDiscipleshipForm({
                                                        ...discipleshipForm,
                                                        waterBaptism: {
                                                            ...discipleshipForm.waterBaptism!,
                                                            officiatingPastor: e.target.value,
                                                        },
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="cia-form-group full">
                                    <label>Pastoral Notes</label>
                                    <textarea
                                        rows={2}
                                        value={discipleshipForm.notes}
                                        onChange={(e) => setDiscipleshipForm({ ...discipleshipForm, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="cia-modal-footer">
                                <button type="button" className="cia-btn-outline" onClick={() => setShowDiscipleshipModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="cia-btn-primary">
                                    Save Discipleship Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* MODAL 4: COMMISSION / SENDING MODAL                          */}
            {/* ============================================================ */}
            {showSendingModal && (
                <div className="cia-modal-overlay">
                    <div className="cia-modal-card">
                        <div className="cia-modal-header">
                            <h3>{editingDeployment ? "Edit Ministry Deployment" : "Commission Servant-Leader / Worker"}</h3>
                            <button type="button" onClick={() => setShowSendingModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSaveSending}>
                            <div className="cia-modal-body">
                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={sendingForm.fullName}
                                            onChange={(e) => setSendingForm({ ...sendingForm, fullName: e.target.value })}
                                        />
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Contact Number</label>
                                        <input
                                            type="text"
                                            value={sendingForm.contactNumber}
                                            onChange={(e) => setSendingForm({ ...sendingForm, contactNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Ministry Department *</label>
                                        <select
                                            value={sendingForm.ministryDepartment}
                                            onChange={(e) => setSendingForm({ ...sendingForm, ministryDepartment: e.target.value as any })}
                                        >
                                            <option value="Worship & Arts">Worship & Arts</option>
                                            <option value="Ushering & Greeters">Ushering & Greeters</option>
                                            <option value="Media & Production">Media & Production</option>
                                            <option value="Kids & Youth Ministry">Kids & Youth Ministry</option>
                                            <option value="Evangelism & Outreach">Evangelism & Outreach</option>
                                            <option value="Prayer & Intercession">Prayer & Intercession</option>
                                            <option value="Pastoral Care">Pastoral Care</option>
                                        </select>
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Assigned Ministry Role *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Lead Acoustic, Sunday School Teacher, Cell Leader"
                                            value={sendingForm.ministryRole}
                                            onChange={(e) => setSendingForm({ ...sendingForm, ministryRole: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Commissioning Status</label>
                                        <select
                                            value={sendingForm.commissioningStatus}
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
                                        <label>Disciples Being Multiplied (Count)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={sendingForm.activeFruitCount}
                                            onChange={(e) => setSendingForm({ ...sendingForm, activeFruitCount: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-row">
                                    <div className="cia-form-group">
                                        <label>Mentor Pastor</label>
                                        <input
                                            type="text"
                                            value={sendingForm.mentorPastor}
                                            onChange={(e) => setSendingForm({ ...sendingForm, mentorPastor: e.target.value })}
                                        />
                                    </div>
                                    <div className="cia-form-group">
                                        <label>Commissioning Date</label>
                                        <input
                                            type="date"
                                            value={sendingForm.commissioningDate}
                                            onChange={(e) => setSendingForm({ ...sendingForm, commissioningDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cia-form-group full">
                                    <label>Commissioning Notes & Credentials</label>
                                    <textarea
                                        rows={2}
                                        value={sendingForm.notes}
                                        onChange={(e) => setSendingForm({ ...sendingForm, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="cia-modal-footer">
                                <button type="button" className="cia-btn-outline" onClick={() => setShowSendingModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="cia-btn-primary">
                                    Save Commissioning
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* MODAL 5: SPIRITUAL CREDENTIALS MODAL                         */}
            {/* ============================================================ */}
            {viewingProfile && (
                <div className="cia-modal-overlay">
                    <div className="cia-modal-card cia-profile-card">
                        <div className="cia-modal-header">
                            <h3>Spiritual Journey & Commissioning Credentials</h3>
                            <button type="button" onClick={() => setViewingProfile(null)}>×</button>
                        </div>
                        <div className="cia-modal-body">
                            <div className="cia-credentials-box">
                                <div className="cia-cred-header">
                                    <Award size={36} className="cia-cred-seal" />
                                    <div>
                                        <h4>{viewingProfile.name}</h4>
                                        <p>Luke 4:18 Ministries • Commissioned Leader</p>
                                    </div>
                                </div>
                                <div className="cia-cred-grid">
                                    <div>
                                        <span>Ministry:</span>
                                        <strong>{viewingProfile.details.ministryDepartment}</strong>
                                    </div>
                                    <div>
                                        <span>Role:</span>
                                        <strong>{viewingProfile.details.ministryRole}</strong>
                                    </div>
                                    <div>
                                        <span>Commissioning Status:</span>
                                        <strong>{viewingProfile.details.commissioningStatus}</strong>
                                    </div>
                                    <div>
                                        <span>Disciples Multiplied:</span>
                                        <strong className="gold-text">🌱 {viewingProfile.details.activeFruitCount} Souls Nurtured</strong>
                                    </div>
                                </div>
                                {viewingProfile.details.notes && (
                                    <div className="cia-cred-notes">
                                        <span>Pastoral Endorsement:</span>
                                        <p>{viewingProfile.details.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="cia-modal-footer">
                            <button type="button" className="cia-btn-outline" onClick={() => window.print()}>
                                <Printer size={15} />
                                <span>Print Certificate</span>
                            </button>
                            <button type="button" className="cia-btn-primary" onClick={() => setViewingProfile(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* PRINT-ONLY DOCUMENT (DECUPLED FROM OVERLAYS)                 */}
            {/* ============================================================ */}
            <div className="cia-print-document" id="cia-printable-summary">
                <div className="cia-print-header">
                    <h2>LUKE 4:18 MINISTRIES • SAN VICENTE CHURCH</h2>
                    <h1>CHURCH IN ACTION — SPIRITUAL LIFECYCLE SUMMARY REPORT</h1>
                    <p>Report Date: {new Date().toLocaleDateString()} • Generated via EPIC Church Management System</p>
                </div>

                <div className="cia-print-summary-box">
                    <div>Outreach Prospects: <strong>{stats.totalProspects}</strong></div>
                    <div>Visitors in Follow-Up: <strong>{stats.totalVisitors}</strong></div>
                    <div>Disciples in Training: <strong>{stats.totalDisciples}</strong></div>
                    <div>Water Baptized: <strong>{stats.waterBaptized}</strong></div>
                    <div>Commissioned Leaders: <strong>{stats.totalSent}</strong></div>
                    <div>Spiritual Fruit Multiplied: <strong>{stats.totalFruit}</strong></div>
                </div>

                <h3>1. Active Evangelism & Prayer List</h3>
                <table className="cia-print-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>Invited By</th>
                            <th>Campaign</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {prospects.map((p) => (
                            <tr key={p.id}>
                                <td>{p.fullName}</td>
                                <td>{p.contactNumber}</td>
                                <td>{p.invitedBy}</td>
                                <td>{p.outreachCampaign}</td>
                                <td>{p.invitationStatus}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <h3 style={{ marginTop: "20px" }}>2. Consolidation & Discipleship Track</h3>
                <table className="cia-print-table">
                    <thead>
                        <tr>
                            <th>Disciple Name</th>
                            <th>Mentor</th>
                            <th>Cell Group</th>
                            <th>Stage</th>
                            <th>Water Baptism</th>
                        </tr>
                    </thead>
                    <tbody>
                        {disciples.map((d) => (
                            <tr key={d.id}>
                                <td>{d.fullName}</td>
                                <td>{d.disciplerName}</td>
                                <td>{d.cellGroupName}</td>
                                <td>{d.stage}</td>
                                <td>{d.waterBaptism?.isBaptized ? "Baptized" : "Pending"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <h3 style={{ marginTop: "20px" }}>3. Commissioned Workers & Leaders</h3>
                <table className="cia-print-table">
                    <thead>
                        <tr>
                            <th>Leader Name</th>
                            <th>Department</th>
                            <th>Role</th>
                            <th>Commissioning Status</th>
                            <th>Fruit Multiplied</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sentLeaders.map((s) => (
                            <tr key={s.id}>
                                <td>{s.fullName}</td>
                                <td>{s.ministryDepartment}</td>
                                <td>{s.ministryRole}</td>
                                <td>{s.commissioningStatus}</td>
                                <td>{s.activeFruitCount} Disciples</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ChurchInActionPage;
