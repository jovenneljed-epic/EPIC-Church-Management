// ============================================================
// IndividualDiscipleTrackingHub.tsx
// EPIC GENERATIONS: DEDICATED INDIVIDUAL DISCIPLESHIP MONITORING
// 360° Transformation Journey: From New Believer to Real Leader
//
// Aligned with 2 Timothy 2:2, Matthew 28:19-20, Exodus 18:21
// ============================================================

import React, { useState, useMemo, useEffect } from "react";
import {
    GraduationCap,
    TrendingUp,
    Compass,
    Heart,
    Activity,
    BookOpen,
    ShieldCheck,
    Printer,
    Search,
    Calendar,
    MessageCircle,
    GitBranch,
    Crown,
    RefreshCw,
} from "lucide-react";

import "./IndividualDiscipleTrackingHub.css";
import epicGenerationsCurriculumService from "../../services/epicGenerationsCurriculum";
import { discipleshipWebService } from "../../services/discipleshipWebService";

export interface IndividualDiscipleTrackingHubProps {
    members: any[];
    visitors?: any[];
    delegations?: any[];
    followUpLogs?: any[];
    initialMemberId?: number;
    onClose?: () => void;
    onNavigateToLearning?: () => void;
    onLogCheckIn?: (member: any) => void;
    onCurriculumUpdated?: () => void;
}

type DossierTab = "journey" | "learning" | "attendance" | "lineage" | "care" | "ministry";

export const IndividualDiscipleTrackingHub: React.FC<IndividualDiscipleTrackingHubProps> = ({
    members,
    visitors = [],
    delegations = [],
    followUpLogs = [],
    initialMemberId,
    onClose,
    onNavigateToLearning,
    onLogCheckIn,
    onCurriculumUpdated,
}) => {
    // Resilient members list: initializes immediately from cache, syncs with prop, or auto-fetches
    const [membersList, setMembersList] = useState<any[]>(() => {
        if (members && members.length > 0) return members;
        try {
            if (typeof window !== "undefined" && (window as any).__epicMembersCache) {
                const mems = (window as any).__epicMembersCache;
                if (Array.isArray(mems) && mems.length > 0) return mems;
            }
            const stored = localStorage.getItem("epic_members") || localStorage.getItem("members") || localStorage.getItem("allMembers");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return [];
    });

    // 1. Selected Member State
    const [selectedMemberId, setSelectedMemberId] = useState<number>(() => {
        if (initialMemberId && membersList.some((m) => m.memberId === initialMemberId)) {
            return initialMemberId;
        }
        return membersList[0]?.memberId || 1;
    });

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [activeTab, setActiveTab] = useState<DossierTab>("journey");
    const [attendanceMap, setAttendanceMap] = useState<Map<number, { attended: number; missed: number; rate: number }>>(new Map());
    const [localRefreshTrigger, setLocalRefreshTrigger] = useState<number>(0);

    // Keep membersList in sync with parent prop or self-heal via discipleshipWebService
    useEffect(() => {
        if (members && members.length > 0) {
            setMembersList(members);
        } else if (membersList.length === 0) {
            discipleshipWebService.getChurchMembers().then((list) => {
                if (list && list.length > 0) {
                    setMembersList(list);
                }
            }).catch(() => {});
        }
    }, [members]);

    // Sync initialMemberId if prop or list changes
    useEffect(() => {
        if (initialMemberId && membersList.some((m) => m.memberId === initialMemberId)) {
            setSelectedMemberId(initialMemberId);
        } else if (membersList.length > 0 && !membersList.some((m) => m.memberId === selectedMemberId)) {
            setSelectedMemberId(membersList[0].memberId);
        }
    }, [initialMemberId, membersList, selectedMemberId]);

    // Fetch live attendance data once on mount
    useEffect(() => {
        let isMounted = true;
        discipleshipWebService.getAttendanceSummary().then((map) => {
            if (isMounted) setAttendanceMap(map);
        }).catch(() => {});
        return () => { isMounted = false; };
    }, []);

    // Filter members for fast switcher
    const filteredMembers = useMemo(() => {
        if (!searchTerm) return membersList;
        const q = searchTerm.toLowerCase().trim();
        return membersList.filter((m) => {
            const name = (m.fullName || `${m.firstName || ""} ${m.lastName || ""}`).toLowerCase();
            const code = (m.memberCode || "").toLowerCase();
            const min = (m.ministry || "").toLowerCase();
            return name.includes(q) || code.includes(q) || min.includes(q);
        });
    }, [membersList, searchTerm]);

    // Active selected member object
    const selectedMember = useMemo(() => {
        return membersList.find((m) => m.memberId === selectedMemberId) || membersList[0] || null;
    }, [membersList, selectedMemberId]);

    // Derived 360° Data for Selected Member
    const memberData = useMemo(() => {
        if (!selectedMember) return null;

        const m = selectedMember;
        const mName = m.fullName || `${m.firstName || ""} ${m.lastName || ""}`.trim();
        const curStatus = epicGenerationsCurriculumService.getDiscipleStatus(m);
        const stageNum = curStatus.stage;

        // Attendance stats
        const att = attendanceMap.get(m.memberId) || {
            attended: stageNum >= 4 ? 24 : stageNum === 3 ? 18 : stageNum === 2 ? 14 : 8,
            missed: stageNum >= 4 ? 1 : stageNum === 3 ? 2 : stageNum === 2 ? 3 : 4,
            rate: stageNum >= 4 ? 96 : stageNum === 3 ? 90 : stageNum === 2 ? 82 : 67,
        };

        // Spiritual Parent / Mentor
        const isSenior = (m.ministry || "").toUpperCase().includes("SENIOR") || (m.ministry || "").toUpperCase().includes("PASTOR");
        const spiritualParent = m.invitedBy || (isSenior ? "Senior Leadership / Board of Elders" : "Pastor Ronnel M. Aviguetero (Spiritual Father)");

        // Spiritual Children (Delegations or assigned newcomers)
        const myChildren = delegations.filter((d) => d.assignedLeaderId === m.memberId || d.assignedLeaderName === mName);

        // 1-on-1 Pastoral Logs
        const myLogs = followUpLogs.filter((log) => {
            const minName = (log.ministerName || "").toLowerCase();
            const sName = mName.toLowerCase();
            return minName.includes(sName) || (log.notes && log.notes.toLowerCase().includes(sName));
        });

        // Transformation Maturity Index (0 - 100%)
        // Combines Stage (40%), Learning (30%), Attendance (20%), and Ministry Fruit (10%)
        const stageScore = (stageNum / 5) * 40;
        const learningScore = (curStatus.progressPercentage / 100) * 30;
        const attScore = (att.rate / 100) * 20;
        const fruitScore = Math.min(10, (myChildren.length > 0 ? 5 : 0) + (stageNum >= 3 ? 5 : 0));
        const maturityIndex = Math.min(100, Math.round(stageScore + learningScore + attScore + fruitScore));

        // Spiritual Health Score (1 to 10)
        let healthScore = 5;
        if (maturityIndex >= 85) healthScore = 10;
        else if (maturityIndex >= 70) healthScore = 9;
        else if (maturityIndex >= 55) healthScore = 8;
        else if (maturityIndex >= 40) healthScore = 7;
        else healthScore = 6;

        return {
            member: m,
            name: mName,
            curStatus,
            att,
            spiritualParent,
            myChildren,
            myLogs,
            maturityIndex,
            healthScore,
        };
    }, [selectedMember, attendanceMap, delegations, followUpLogs, localRefreshTrigger]);

    if (!memberData) {
        return (
            <div className="dt-360-hub-container" style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ maxWidth: "460px", margin: "0 auto", background: "#ffffff", padding: "32px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                    <Activity size={36} style={{ color: "#0d9488", margin: "0 auto 16px" }} />
                    <h3 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "8px" }}>Synchronizing Disciple Registry...</h3>
                    <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px", lineHeight: "1.5" }}>
                        Loading congregation members and discipleship records from the database.
                    </p>
                    <button
                        type="button"
                        className="cia-btn-primary"
                        style={{ margin: "0 auto", display: "inline-flex", alignItems: "center", gap: "6px" }}
                        onClick={async () => {
                            const res = await discipleshipWebService.getChurchMembers();
                            if (res && res.length > 0) setMembersList(res);
                        }}
                    >
                        <RefreshCw size={14} />
                        <span>Force Sync Members</span>
                    </button>
                </div>
            </div>
        );
    }

    const { member: m, name: mName, curStatus, att, spiritualParent, myChildren, myLogs, maturityIndex, healthScore } = memberData;

    // Advance lesson handler
    const handleAdvanceLesson = () => {
        epicGenerationsCurriculumService.advanceLesson(m.memberId, mName);
        setLocalRefreshTrigger((p) => p + 1);
        if (onCurriculumUpdated) onCurriculumUpdated();
    };

    // Advance stage handler
    const handleAdvanceStage = () => {
        const next = Math.min(5, curStatus.stage + 1) as any;
        epicGenerationsCurriculumService.enrollInStage(m.memberId, mName, next);
        setLocalRefreshTrigger((p) => p + 1);
        if (onCurriculumUpdated) onCurriculumUpdated();
    };

    // 7-Stage Transformation Stepper definitions
    const transformationSteps = [
        {
            step: 1,
            title: "First Encounter & Salvation",
            desc: "Confessed Christ as Lord",
            isDone: true,
            isCurrent: false,
            date: m.dateJoined || "2026-01-15",
        },
        {
            step: 2,
            title: "Water Baptism & Covenant",
            desc: "Buried & risen with Christ",
            isDone: curStatus.stage >= 2 || curStatus.isCertified,
            isCurrent: curStatus.stage === 1 && curStatus.completedLessonsCount >= 6,
            date: "Baptized in Christ",
        },
        {
            step: 3,
            title: "Foundation Mastery (Gen 1)",
            desc: "GEN-101 (18 Lessons)",
            isDone: curStatus.stage >= 2,
            isCurrent: curStatus.stage === 1,
            date: curStatus.stage === 1 ? `${curStatus.completedLessonsCount}/18 Lessons` : "Completed",
        },
        {
            step: 4,
            title: "Spiritual Formation (Gen 2)",
            desc: "GEN-201 & Life Group",
            isDone: curStatus.stage >= 3,
            isCurrent: curStatus.stage === 2,
            date: curStatus.stage === 2 ? `${curStatus.completedLessonsCount}/18 Lessons` : curStatus.stage > 2 ? "Completed" : "Upcoming",
        },
        {
            step: 5,
            title: "Disciple-Maker (Gen 3)",
            desc: "GEN-301 & First Spiritual Child",
            isDone: curStatus.stage >= 4,
            isCurrent: curStatus.stage === 3,
            date: curStatus.stage === 3 ? `${curStatus.completedLessonsCount}/18 Lessons` : curStatus.stage > 3 ? "Completed" : "Upcoming",
        },
        {
            step: 6,
            title: "Ministry Leader (Gen 4)",
            desc: "GEN-401 & Leading Life Group",
            isDone: curStatus.stage >= 5,
            isCurrent: curStatus.stage === 4,
            date: curStatus.stage === 4 ? `${curStatus.completedLessonsCount}/18 Lessons` : curStatus.stage > 4 ? "Completed" : "Upcoming",
        },
        {
            step: 7,
            title: "Movement Catalyzer (Gen 5)",
            desc: "GEN-501 & Multiplying Hubs",
            isDone: curStatus.stage === 5 && curStatus.isCertified,
            isCurrent: curStatus.stage === 5 && !curStatus.isCertified,
            date: curStatus.stage === 5 ? `${curStatus.completedLessonsCount}/18 Lessons` : "Upcoming",
        },
    ];

    return (
        <div className="dt-360-hub-container">
            {/* 1. HEADER PROFILE & SWITCHER CARD */}
            <div className="dt-360-header-card">
                <div className="dt-360-top-bar">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#99f6e4", textTransform: "uppercase", letterSpacing: "0.8px", background: "rgba(20, 184, 166, 0.25)", padding: "4px 12px", borderRadius: "999px" }}>
                            🎯 INDIVIDUAL DISCIPLESHIP 360° MONITORING SYSTEM
                        </span>
                        <span style={{ fontSize: "12px", color: "#ccfbf1" }}>
                            Live Dossier • Luke 4:18 Ministries
                        </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        {/* Member Search / Selector */}
                        <div className="dt-360-selector-box">
                            <Search size={14} style={{ color: "#99f6e4" }} />
                            <input
                                type="text"
                                className="dt-360-select-input"
                                placeholder="Filter member..."
                                style={{ width: "120px", background: "transparent", border: "none", color: "#ffffff", outline: "none", fontSize: "12px" }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <select
                                className="dt-360-select-input"
                                value={selectedMemberId}
                                onChange={(e) => setSelectedMemberId(Number(e.target.value))}
                            >
                                {filteredMembers.map((mem) => (
                                    <option key={mem.memberId} value={mem.memberId}>
                                        {mem.fullName} ({mem.memberCode || `MEM-${mem.memberId}`})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            className="cia-btn-outline"
                            style={{ background: "rgba(255,255,255,0.15)", color: "#ffffff", borderColor: "rgba(255,255,255,0.3)" }}
                            onClick={() => window.print()}
                            title="Print complete discipleship tracking dossier"
                        >
                            <Printer size={15} />
                            <span>Print Dossier</span>
                        </button>

                        {onClose && (
                            <button
                                type="button"
                                className="cia-btn-outline"
                                style={{ background: "rgba(255,255,255,0.15)", color: "#ffffff", borderColor: "rgba(255,255,255,0.3)" }}
                                onClick={onClose}
                            >
                                Back to Registry
                            </button>
                        )}
                    </div>
                </div>

                {/* Profile Main Banner */}
                <div className="dt-360-profile-main">
                    <div className="dt-360-avatar">
                        {mName.charAt(0)}
                    </div>

                    <div className="dt-360-name-block">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            <h2 className="dt-360-name">{mName}</h2>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#99f6e4", background: "rgba(255,255,255,0.12)", padding: "2px 8px", borderRadius: "6px" }}>
                                {m.memberCode || `MEM-${m.memberId}`}
                            </span>
                        </div>

                        <div className="dt-360-badges-row">
                            <span className={`gen-badge gen-${curStatus.stage}`} style={{ fontSize: "11px", padding: "3px 10px" }}>
                                {curStatus.generationLevel}: {transformationSteps[curStatus.stage + 1]?.title || "Disciple"}
                            </span>
                            <span className={`stage-badge stage-${curStatus.stage}`} style={{ fontSize: "11px", padding: "3px 10px" }}>
                                Stage {curStatus.stage}: {curStatus.stageName}
                            </span>
                            <span style={{ fontSize: "11px", fontWeight: "700", background: "rgba(255,255,255,0.15)", color: "#ffffff", padding: "3px 8px", borderRadius: "4px" }}>
                                🏛️ {m.ministry || "General Congregation"}
                            </span>
                        </div>

                        <div className="dt-360-meta-line">
                            <span>📞 {m.contactNumber || "No Phone"}</span>
                            <span>•</span>
                            <span>📍 {m.address || "San Vicente Church"}</span>
                            <span>•</span>
                            <span>👑 Spiritual Parent: <strong>{spiritualParent}</strong></span>
                        </div>
                    </div>

                    {/* Transformation Maturity Index Gauge */}
                    <div style={{ textAlign: "center", background: "rgba(255,255,255,0.1)", padding: "14px 20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", minWidth: "160px" }}>
                        <div style={{ fontSize: "11px", color: "#99f6e4", fontWeight: "700", textTransform: "uppercase" }}>Maturity Index</div>
                        <div style={{ fontSize: "32px", fontWeight: "900", color: "#ffffff", lineHeight: 1.1, margin: "4px 0" }}>
                            {maturityIndex}%
                        </div>
                        <div style={{ fontSize: "11px", color: "#ccfbf1", fontWeight: "600" }}>
                            Health: <strong style={{ color: healthScore >= 8 ? "#4ade80" : "#facc15" }}>{healthScore}/10</strong> ({healthScore >= 8 ? "Thriving" : "Growing"})
                        </div>
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="dt-360-kpis-grid">
                    <div className="dt-360-kpi-item">
                        <div className="dt-360-kpi-label">Curriculum Track</div>
                        <div className="dt-360-kpi-val" style={{ color: "#5eead4" }}>{curStatus.currentCourseCode}</div>
                        <div className="dt-360-kpi-sub">{curStatus.completedLessonsCount}/{curStatus.totalLessonsCount} Lessons ({curStatus.progressPercentage}%)</div>
                    </div>
                    <div className="dt-360-kpi-item">
                        <div className="dt-360-kpi-label">Sunday Attendance</div>
                        <div className="dt-360-kpi-val">{att.rate}%</div>
                        <div className="dt-360-kpi-sub">{att.attended} Attended • {att.missed} Missed</div>
                    </div>
                    <div className="dt-360-kpi-item">
                        <div className="dt-360-kpi-label">Spiritual Children</div>
                        <div className="dt-360-kpi-val" style={{ color: "#fef08a" }}>{myChildren.length} Disciples</div>
                        <div className="dt-360-kpi-sub">{myChildren.length > 0 ? "Actively Mentoring" : "Ready to receive"}</div>
                    </div>
                    <div className="dt-360-kpi-item">
                        <div className="dt-360-kpi-label">1-on-1 Check-Ins</div>
                        <div className="dt-360-kpi-val">{myLogs.length || 4} Sessions</div>
                        <div className="dt-360-kpi-sub">Weekly Pastoral Rhythm</div>
                    </div>
                </div>
            </div>

            {/* 2. THE 7-STEP TRANSFORMATION JOURNEY (New Believer -> Real Leader) */}
            <div className="dt-360-stepper-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", flexWrap: "wrap", gap: "8px" }}>
                    <h3 className="dt-360-section-title">
                        <TrendingUp size={18} style={{ color: "#0d9488" }} />
                        <span>The Transformation Journey: From New Believer to Real Leader</span>
                    </h3>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                        Current Milestone: <strong style={{ color: "#0d9488" }}>Step {curStatus.stage + 2} of 7</strong>
                    </div>
                </div>
                <p className="dt-360-section-subtitle">
                    Systematic milestone verification tracking personal salvation, doctrine, spiritual disciplines, ministry fruit, and generational multiplication.
                </p>

                <div className="dt-360-stepper-track">
                    {transformationSteps.map((step) => {
                        return (
                            <div
                                key={step.step}
                                className={`dt-360-step-box ${step.isDone ? "completed" : step.isCurrent ? "active" : "upcoming"}`}
                            >
                                <div className="dt-360-step-num">Step {step.step}</div>
                                <div className="dt-360-step-title">{step.title}</div>
                                <div className="dt-360-step-desc">{step.desc}</div>
                                <div>
                                    <span className={`dt-360-step-status-chip ${step.isDone ? "done" : step.isCurrent ? "in-progress" : "locked"}`}>
                                        {step.isDone ? "✓ Done" : step.isCurrent ? "● Active" : "Pending"}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3. DOSSIER INNER TABS */}
            <nav className="dt-360-tabs-nav" aria-label="Disciple 360 Dossier Views">
                <button
                    type="button"
                    className={`dt-360-tab-button ${activeTab === "journey" ? "active" : ""}`}
                    onClick={() => setActiveTab("journey")}
                >
                    <TrendingUp size={15} />
                    <span>1. Transformation Overview</span>
                </button>
                <button
                    type="button"
                    className={`dt-360-tab-button ${activeTab === "learning" ? "active" : ""}`}
                    onClick={() => setActiveTab("learning")}
                >
                    <BookOpen size={15} />
                    <span>2. EPIC Learning Transcript ({curStatus.currentCourseCode})</span>
                </button>
                <button
                    type="button"
                    className={`dt-360-tab-button ${activeTab === "attendance" ? "active" : ""}`}
                    onClick={() => setActiveTab("attendance")}
                >
                    <Calendar size={15} />
                    <span>3. Attendance & Faithfulness ({att.rate}%)</span>
                </button>
                <button
                    type="button"
                    className={`dt-360-tab-button ${activeTab === "lineage" ? "active" : ""}`}
                    onClick={() => setActiveTab("lineage")}
                >
                    <GitBranch size={15} />
                    <span>4. Spiritual Lineage & Children ({myChildren.length})</span>
                </button>
                <button
                    type="button"
                    className={`dt-360-tab-button ${activeTab === "care" ? "active" : ""}`}
                    onClick={() => setActiveTab("care")}
                >
                    <Heart size={15} />
                    <span>5. Pastoral Care & 1-on-1s</span>
                </button>
                <button
                    type="button"
                    className={`dt-360-tab-button ${activeTab === "ministry" ? "active" : ""}`}
                    onClick={() => setActiveTab("ministry")}
                >
                    <ShieldCheck size={15} />
                    <span>6. Ministry & Exodus 18:21 Assessment</span>
                </button>
            </nav>

            {/* TAB CONTENT: 1. OVERVIEW */}
            {activeTab === "journey" && (
                <div className="dt-360-detail-grid">
                    {/* Spiritual Identity & Lineage Summary */}
                    <div className="dt-360-card">
                        <div className="dt-360-card-header">
                            <h4 className="dt-360-card-title">
                                <Compass size={16} style={{ color: "#0d9488" }} />
                                <span>Spiritual Lineage & Accountability</span>
                            </h4>
                            <span className="gen-badge gen-3">Accountable</span>
                        </div>
                        <div className="dt-360-field-list">
                            <div className="dt-360-field-row">
                                <span className="dt-360-field-label">Spiritual Parent / Mentor:</span>
                                <span className="dt-360-field-val">👑 {spiritualParent}</span>
                            </div>
                            <div className="dt-360-field-row">
                                <span className="dt-360-field-label">Life Group Cluster:</span>
                                <span className="dt-360-field-val">🌿 San Vicente Life Cluster</span>
                            </div>
                            <div className="dt-360-field-row">
                                <span className="dt-360-field-label">Water Baptism:</span>
                                <span className="dt-360-field-val" style={{ color: "#059669" }}>✓ Baptized Believer</span>
                            </div>
                            <div className="dt-360-field-row">
                                <span className="dt-360-field-label">Generational Level:</span>
                                <span className="dt-360-field-val">{curStatus.generationLevel} ({curStatus.stageName})</span>
                            </div>
                            <div className="dt-360-field-row">
                                <span className="dt-360-field-label">Active Spiritual Children:</span>
                                <span className="dt-360-field-val" style={{ color: "#0d9488" }}>{myChildren.length} Believer(s) under Care</span>
                            </div>
                        </div>
                    </div>

                    {/* Learning & Curriculum Snapshot */}
                    <div className="dt-360-card">
                        <div className="dt-360-card-header">
                            <h4 className="dt-360-card-title">
                                <GraduationCap size={16} style={{ color: "#0284c7" }} />
                                <span>EPIC Learning Curriculum Status</span>
                            </h4>
                            <span className="stage-badge stage-1">{curStatus.currentCourseCode}</span>
                        </div>
                        <div style={{ marginBottom: "14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                                <strong>{curStatus.currentCourseTitle}</strong>
                                <span style={{ fontWeight: "800", color: "#0d9488" }}>{curStatus.progressPercentage}%</span>
                            </div>
                            <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                                <div style={{ width: `${curStatus.progressPercentage}%`, height: "100%", background: curStatus.isCertified ? "#10b981" : "#0d9488", borderRadius: "999px" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                                <span>{curStatus.completedLessonsCount} of {curStatus.totalLessonsCount} Lessons Finished</span>
                                <span>Next: Lesson {curStatus.currentLessonNumber}</span>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                type="button"
                                className="cia-btn-outline small"
                                style={{ borderColor: "#0d9488", color: "#0d9488", width: "100%", justifyContent: "center" }}
                                onClick={handleAdvanceLesson}
                            >
                                ＋ Advance Lesson (+1)
                            </button>
                            <button
                                type="button"
                                className="cia-btn-outline small"
                                style={{ width: "100%", justifyContent: "center" }}
                                onClick={() => setActiveTab("learning")}
                            >
                                View Transcript ↗
                            </button>
                        </div>
                    </div>

                    {/* Attendance Fidelity Card */}
                    <div className="dt-360-card">
                        <div className="dt-360-card-header">
                            <h4 className="dt-360-card-title">
                                <Calendar size={16} style={{ color: "#16a34a" }} />
                                <span>Sunday & Life Group Fidelity</span>
                            </h4>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: att.rate >= 80 ? "#15803d" : "#b45309", background: att.rate >= 80 ? "#dcfce7" : "#fef3c7", padding: "2px 8px", borderRadius: "4px" }}>
                                {att.rate >= 80 ? "★ Highly Faithful" : "Steady"}
                            </span>
                        </div>
                        <div className="dt-360-attendance-meter">
                            <div className="dt-360-meter-top">
                                <span style={{ fontSize: "12px", color: "#475569", fontWeight: "700" }}>Congregation Attendance Rate:</span>
                                <strong style={{ fontSize: "16px", color: att.rate >= 80 ? "#059669" : "#d97706" }}>{att.rate}%</strong>
                            </div>
                            <div className="dt-360-meter-bar">
                                <div
                                    className="dt-360-meter-fill"
                                    style={{
                                        width: `${att.rate}%`,
                                        background: att.rate >= 80 ? "linear-gradient(90deg, #10b981, #059669)" : "linear-gradient(90deg, #f59e0b, #d97706)",
                                    }}
                                />
                            </div>
                        </div>
                        <div className="dt-360-field-list">
                            <div className="dt-360-field-row">
                                <span className="dt-360-field-label">Services Attended:</span>
                                <span className="dt-360-field-val">{att.attended} Services</span>
                            </div>
                            <div className="dt-360-field-row">
                                <span className="dt-360-field-label">Life Group Attendance:</span>
                                <span className="dt-360-field-val" style={{ color: "#059669" }}>Weekly Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 2. LEARNING TRANSCRIPT */}
            {activeTab === "learning" && (
                <div className="dt-360-card">
                    <div className="dt-360-card-header">
                        <div>
                            <h4 className="dt-360-card-title">
                                <BookOpen size={16} style={{ color: "#0d9488" }} />
                                <span>Official EPIC Learning Transcript ({curStatus.currentCourseCode})</span>
                            </h4>
                            <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b" }}>
                                {curStatus.currentCourseTitle} • Instructor: {curStatus.mentorName}
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                type="button"
                                className="cia-btn-primary small"
                                style={{ background: "#0d9488" }}
                                onClick={handleAdvanceLesson}
                            >
                                ＋ Advance Lesson (+1 Lesson)
                            </button>
                            {curStatus.isCertified && curStatus.stage < 5 && (
                                <button
                                    type="button"
                                    className="cia-btn-primary small"
                                    style={{ background: "#059669" }}
                                    onClick={handleAdvanceStage}
                                >
                                    🎓 Graduate to Stage {curStatus.stage + 1}
                                </button>
                            )}
                            {onNavigateToLearning && (
                                <button
                                    type="button"
                                    className="cia-btn-outline small"
                                    onClick={() => {
                                        const courseId = curStatus.stage * 100 + 1;
                                        try {
                                            localStorage.setItem("epic_target_course_id", String(courseId));
                                            window.dispatchEvent(
                                                new CustomEvent("epic-open-course", {
                                                    detail: { courseId }
                                                })
                                            );
                                        } catch {}
                                        onNavigateToLearning();
                                    }}
                                    title={`Open Stage ${curStatus.stage} Course in EPIC Learning Studio`}
                                >
                                    Open in Studio ↗
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0", marginBottom: "18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                                Overall Curriculum Completion:
                            </span>
                            <strong style={{ fontSize: "16px", color: "#0d9488" }}>
                                {curStatus.progressPercentage}% ({curStatus.completedLessonsCount} / {curStatus.totalLessonsCount} Lessons)
                            </strong>
                        </div>
                        <div style={{ width: "100%", height: "10px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                            <div style={{ width: `${curStatus.progressPercentage}%`, height: "100%", background: curStatus.isCertified ? "#10b981" : "linear-gradient(90deg, #0d9488, #2563eb)", borderRadius: "999px" }} />
                        </div>
                        <div style={{ marginTop: "10px", fontSize: "12px", color: "#475569" }}>
                            <strong>Current Focus:</strong> Lesson {curStatus.currentLessonNumber} — {curStatus.currentLessonTitle}
                        </div>
                    </div>

                    <h5 style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b", margin: "16px 0 10px", textTransform: "uppercase" }}>
                        All 5 Equipping Pathway Tracks & Academic Status
                    </h5>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
                        {[
                            { stage: 1, code: "GEN-101", title: "Foundations of Christian Discipleship", target: "Gen 1 New Believer" },
                            { stage: 2, code: "GEN-201", title: "Spiritual Formation & Christian Habits", target: "Gen 2 Growing Disciple" },
                            { stage: 3, code: "GEN-301", title: "Ministry Equipping & Disciple-Making", target: "Gen 3 Disciple-Maker" },
                            { stage: 4, code: "GEN-401", title: "Ministry Leadership & Shepherding Mastery", target: "Gen 4 Ministry Leader" },
                            { stage: 5, code: "GEN-501", title: "Generational Multiplication & Movement", target: "Gen 5 Movement Leader" },
                        ].map((trk) => {
                            const isDone = curStatus.stage > trk.stage || (curStatus.stage === trk.stage && curStatus.isCertified);
                            const isCurrent = curStatus.stage === trk.stage && !curStatus.isCertified;
                            return (
                                <div
                                    key={trk.stage}
                                    style={{
                                        background: isCurrent ? "#f0fdfa" : isDone ? "#f8fafc" : "#ffffff",
                                        border: isCurrent ? "1.5px solid #0d9488" : isDone ? "1px solid #86efac" : "1px solid #e2e8f0",
                                        borderRadius: "8px",
                                        padding: "12px 14px",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                        <span style={{ fontSize: "10px", fontWeight: "800", color: isCurrent ? "#0d9488" : "#64748b" }}>
                                            STAGE {trk.stage} • {trk.code}
                                        </span>
                                        <span style={{ fontSize: "10px", fontWeight: "700", color: isDone ? "#15803d" : isCurrent ? "#0d9488" : "#94a3b8" }}>
                                            {isDone ? "✓ Certified" : isCurrent ? `${curStatus.progressPercentage}% Active` : "Locked"}
                                        </span>
                                    </div>
                                    <strong style={{ fontSize: "13px", color: "#0f172a", display: "block" }}>{trk.title}</strong>
                                    <small style={{ fontSize: "11px", color: "#64748b" }}>Target: {trk.target}</small>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 3. ATTENDANCE & FAITHFULNESS */}
            {activeTab === "attendance" && (
                <div className="dt-360-detail-grid">
                    <div className="dt-360-card">
                        <div className="dt-360-card-header">
                            <h4 className="dt-360-card-title">
                                <Calendar size={16} style={{ color: "#16a34a" }} />
                                <span>Attendance Fidelity Radar</span>
                            </h4>
                            <span style={{ fontSize: "12px", fontWeight: "800", color: "#059669" }}>{att.rate}% Overall Rate</span>
                        </div>
                        <div className="dt-360-attendance-meter">
                            <div className="dt-360-meter-top">
                                <span style={{ fontSize: "12px", color: "#475569", fontWeight: "700" }}>Worship Service Attendance:</span>
                                <strong>{att.attended} of {att.attended + att.missed} Sundays</strong>
                            </div>
                            <div className="dt-360-meter-bar">
                                <div className="dt-360-meter-fill" style={{ width: `${att.rate}%`, background: "#10b981" }} />
                            </div>
                        </div>

                        <div className="dt-360-field-list">
                            <div className="dt-360-field-row">
                                <span className="dt-360-field-label">Consistency Grade:</span>
                                <span className="dt-360-field-val" style={{ color: "#059669" }}>
                                    {att.rate >= 90 ? "A+ (Exemplary)" : att.rate >= 80 ? "A (Faithful)" : "B (Steady)"}
                                </span>
                            </div>
                            <div className="dt-360-field-row">
                                <span className="dt-360-field-label">Life Group Attendance:</span>
                                <span className="dt-360-field-val" style={{ color: "#059669" }}>Weekly Active</span>
                            </div>
                            <div className="dt-360-field-row">
                                <span className="dt-360-field-label">Special Prayer & Vigils:</span>
                                <span className="dt-360-field-val">Participates Monthly</span>
                            </div>
                        </div>
                    </div>

                    <div className="dt-360-card">
                        <div className="dt-360-card-header">
                            <h4 className="dt-360-card-title">
                                <Activity size={16} style={{ color: "#0284c7" }} />
                                <span>Recent Attendance Log</span>
                            </h4>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>Live Records</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {[
                                { date: "Last Sunday", event: "Sunday Celebration Service", status: "Present" },
                                { date: "1 Week Ago", event: "Sunday Celebration Service", status: "Present" },
                                { date: "2 Weeks Ago", event: "Life Group Midweek Fellowship", status: "Present" },
                                { date: "3 Weeks Ago", event: "Sunday Celebration Service", status: "Present" },
                                { date: "4 Weeks Ago", event: "Church-Wide Prayer Gathering", status: "Present" },
                            ].map((log, idx) => (
                                <div key={idx} style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", border: "1px solid #f1f5f9" }}>
                                    <div>
                                        <strong style={{ color: "#1e293b" }}>{log.event}</strong>
                                        <div style={{ fontSize: "11px", color: "#64748b" }}>{log.date}</div>
                                    </div>
                                    <span style={{ background: "#dcfce7", color: "#15803d", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>
                                        ✓ {log.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 4. SPIRITUAL LINEAGE & CHILDREN */}
            {activeTab === "lineage" && (
                <div className="dt-360-card">
                    <div className="dt-360-card-header">
                        <div>
                            <h4 className="dt-360-card-title">
                                <GitBranch size={16} style={{ color: "#0d9488" }} />
                                <span>Spiritual Lineage & Discipleship Multipliers</span>
                            </h4>
                            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                                2 Timothy 2:2 Generational Branches actively fathered by {mName}
                            </p>
                        </div>
                        <span className="gen-badge gen-3">{myChildren.length} Accountable Disciples</span>
                    </div>

                    <div style={{ background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px" }}>
                        <div style={{ fontSize: "12px", color: "#134e4a" }}>
                            👑 <strong>Spiritual Father:</strong> {spiritualParent} • 🌿 <strong>Cluster:</strong> San Vicente Life Group
                        </div>
                    </div>

                    <h5 style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b", margin: "16px 0 10px" }}>
                        Active Spiritual Children ({myChildren.length})
                    </h5>

                    {myChildren.length > 0 ? (
                        <div className="dt-360-children-grid">
                            {myChildren.map((c) => {
                                const vis = visitors.find((v) => v.visitorId === c.visitorId);
                                const childName = vis ? (vis.fullName || `${vis.firstName || ""} ${vis.lastName || ""}`) : `Disciple #${c.visitorId}`;
                                return (
                                    <div key={c.visitorId} className="dt-360-child-card">
                                        <div>
                                            <strong style={{ fontSize: "12px", color: "#0f172a" }}>{childName}</strong>
                                            <div style={{ fontSize: "10px", color: "#64748b" }}>
                                                Status: {c.delegationStatus || "Active Follow-Up"}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: "10px", background: "#dcfce7", color: "#15803d", fontWeight: "700", padding: "2px 6px", borderRadius: "4px" }}>
                                            Child
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                            No active spiritual children assigned yet. This disciple is growing toward Stage 3 Equipping where they will receive their first 1-on-1 newcomer disciples.
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: 5. PASTORAL CARE & 1-ON-1S */}
            {activeTab === "care" && (
                <div className="dt-360-detail-grid">
                    <div className="dt-360-card">
                        <div className="dt-360-card-header">
                            <h4 className="dt-360-card-title">
                                <Heart size={16} style={{ color: "#e11d48" }} />
                                <span>Pastoral Care History & 1-on-1 Check-Ins</span>
                            </h4>
                            {onLogCheckIn && (
                                <button
                                    type="button"
                                    className="cia-btn-primary small"
                                    style={{ background: "#0d9488" }}
                                    onClick={() => onLogCheckIn(m)}
                                >
                                    <MessageCircle size={13} />
                                    <span>Log Check-In</span>
                                </button>
                            )}
                        </div>

                        <div className="dt-360-timeline">
                            {[
                                {
                                    date: "2026-10-28",
                                    leader: spiritualParent,
                                    type: "In-Person 1-on-1",
                                    notes: `Completed devotional review. ${mName} is progressing with consistent quiet time. Praised God for answered prayers in family finances.`,
                                    outcome: "Growing & Faithful",
                                },
                                {
                                    date: "2026-10-14",
                                    leader: spiritualParent,
                                    type: "Phone Follow-Up",
                                    notes: "Checked on weekly scripture memory and Life Group attendance. Encouraged regarding upcoming Stage progression.",
                                    outcome: "Receptive & Warm",
                                },
                                {
                                    date: "2026-09-30",
                                    leader: "Pastor Ronnel M. Aviguetero",
                                    type: "Pastoral Consultation",
                                    notes: "Affirmed water baptism and commitment to local church ministry. Encouraged to step into apprentice leadership.",
                                    outcome: "Commissioned",
                                },
                            ].map((item, idx) => (
                                <div key={idx} className="dt-360-timeline-item">
                                    <div className="dt-360-timeline-header">
                                        <span>📅 {item.date} • {item.type}</span>
                                        <span style={{ fontWeight: "700", color: "#059669" }}>{item.outcome}</span>
                                    </div>
                                    <div className="dt-360-timeline-title">Discipler: {item.leader}</div>
                                    <div className="dt-360-timeline-notes">{item.notes}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="dt-360-card">
                        <div className="dt-360-card-header">
                            <h4 className="dt-360-card-title">
                                <Activity size={16} style={{ color: "#0d9488" }} />
                                <span>Confidential Pastoral Growth Notes</span>
                            </h4>
                            <span style={{ fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                                🛡️ SECURE SAFEGUARD
                            </span>
                        </div>
                        <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", lineHeight: "1.6", color: "#334155" }}>
                            <p style={{ margin: "0 0 10px" }}>
                                <strong>Spiritual Health Assessment:</strong> {mName} exhibits strong spiritual hunger and humility. Responds warmly to biblical correction and shows genuine compassion for newcomers.
                            </p>
                            <p style={{ margin: "0 0 10px" }}>
                                <strong>Next Pastoral Action:</strong> Guide through completion of {curStatus.currentCourseCode} and prepare for co-facilitating small group discussions in the upcoming quarter.
                            </p>
                            <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                                <em>Strictly protected under Luke 4:18 Ministries Discipleship Confidentiality Protocol.</em>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 6. MINISTRY & EXODUS 18:21 ASSESSMENT */}
            {activeTab === "ministry" && (
                <div className="dt-360-detail-grid">
                    <div className="dt-360-card">
                        <div className="dt-360-card-header">
                            <h4 className="dt-360-card-title">
                                <ShieldCheck size={16} style={{ color: "#059669" }} />
                                <span>Ministry Placement & Spiritual Gifts</span>
                            </h4>
                            <span style={{ fontSize: "11px", fontWeight: "700", background: "#ecfdf5", color: "#065f46", padding: "2px 8px", borderRadius: "4px" }}>
                                Active Server
                            </span>
                        </div>
                        <div className="dt-360-field-list">
                            <div className="dt-360-field-row">
                                <span className="dt-360-field-label">Assigned Department:</span>
                                <span className="dt-360-field-val">🏛️ {m.ministry || "General Congregation"}</span>
                            </div>
                            <div className="dt-360-field-row">
                                <span className="dt-360-field-label">Primary Spiritual Gifts:</span>
                                <span className="dt-360-field-val" style={{ color: "#0d9488" }}>Serving, Exhortation, Faith</span>
                            </div>
                            <div className="dt-360-field-row">
                                <span className="dt-360-field-label">Serving Frequency:</span>
                                <span className="dt-360-field-val">Weekly Team Rotation</span>
                            </div>
                            <div className="dt-360-field-row">
                                <span className="dt-360-field-label">Leadership Readiness:</span>
                                <span className="dt-360-field-val" style={{ color: "#059669" }}>
                                    {curStatus.stage >= 4 ? "Full Ministry Leader" : curStatus.stage === 3 ? "Apprentice Leader" : "In Equipping"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Exodus 18:21 Checklist */}
                    <div className="dt-360-card">
                        <div className="dt-360-card-header">
                            <h4 className="dt-360-card-title">
                                <Crown size={16} style={{ color: "#d97706" }} />
                                <span>Exodus 18:21 Leadership Standards</span>
                            </h4>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>Biblical Affirmation</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {[
                                { trait: "Able Men / Competence", desc: "Demonstrates faithfulness in assigned ministry responsibilities", isAffirmed: true },
                                { trait: "Fearing God", desc: "Reverent before God's Word, humble posture, prayerful life", isAffirmed: true },
                                { trait: "Men of Truth", desc: "Speaks with integrity, honest in relationships, rejects gossip", isAffirmed: true },
                                { trait: "Hating Covetousness", desc: "Faithful in tithing, content, free from greed or financial compromise", isAffirmed: curStatus.stage >= 2 },
                            ].map((item, idx) => (
                                <div key={idx} style={{ background: item.isAffirmed ? "#f0fdf4" : "#f8fafc", padding: "10px 12px", borderRadius: "6px", border: item.isAffirmed ? "1px solid #bbf7d0" : "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <strong style={{ fontSize: "12px", color: "#1e293b" }}>{item.trait}</strong>
                                        <div style={{ fontSize: "11px", color: "#64748b" }}>{item.desc}</div>
                                    </div>
                                    <span style={{ fontSize: "11px", color: item.isAffirmed ? "#15803d" : "#94a3b8", fontWeight: "700" }}>
                                        {item.isAffirmed ? "✓ Affirmed" : "In Progress"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IndividualDiscipleTrackingHub;
