import React, { useEffect, useState, useMemo, useCallback } from "react";
import "./DiscipleshipTree.css";
import {
    discipleshipWebService,
    POSITION_DETAILS,
    AVAILABLE_EPIC_POSITIONS,
    SENIOR_PASTOR_NAME,
    MAX_DISCIPLES_PER_LEADER,
} from "../services/discipleshipWebService";
import type {
    DiscipleshipMemberNode,
    RealChurchMember,
    ChurchPosition,
    DiscipleshipEncounter,
} from "../services/discipleshipWebService";
import {
    GitBranch,
    Users,
    ShieldCheck,
    Heart,
    BookOpen,
    Phone,
    MessageCircle,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    Calendar,
    Sparkles,
    Plus,
    Search,
    RefreshCw,
    Activity,
    Layers,
    UserPlus,
    Award,
    ExternalLink,
    Send,
} from "lucide-react";

export default function DiscipleshipTree() {
    // =========================================================
    // STATE
    // =========================================================
    const [treeRoot, setTreeRoot] = useState<DiscipleshipMemberNode | null>(null);
    const [allMembers, setAllMembers] = useState<RealChurchMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [healthFilter, setHealthFilter] = useState<string>("ALL");
    const [viewMode, setViewMode] = useState<"TREE" | "MATRIX" | "RADAR">("TREE");

    // Collapsed nodes state (Set of memberIds whose children are hidden)
    const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());

    // Modals & Drawers
    const [selectedMember, setSelectedMember] = useState<DiscipleshipMemberNode | null>(null);
    const [drawerTab, setDrawerTab] = useState<"PULSE" | "DEVOTIONS" | "THOUGHTS" | "ENCOUNTERS">("PULSE");

    // Pastoral Control: Assign Role Modal
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [targetMemberId, setTargetMemberId] = useState<number | null>(null);
    const [selectedRole, setSelectedRole] = useState<ChurchPosition>("DISCIPLE");

    // Pastoral Control: Adopt / Assign Disciple Modal
    const [adoptModalOpen, setAdoptModalOpen] = useState(false);
    const [targetLeaderId, setTargetLeaderId] = useState<number | null>(null);
    const [selectedDiscipleId, setSelectedDiscipleId] = useState<number | null>(null);
    const [adoptError, setAdoptError] = useState<string | null>(null);

    // Pastoral Control: Log 1-on-1 Encounter Modal
    const [encounterModalOpen, setEncounterModalOpen] = useState(false);
    const [encounterMeetingType, setEncounterMeetingType] = useState<any>("COFFEE");
    const [encounterScripture, setEncounterScripture] = useState("Proverbs 3:5-6");
    const [encounterCommitment, setEncounterCommitment] = useState("");
    const [encounterNote, setEncounterNote] = useState("");

    // Pastoral reply to disciple thought
    const [thoughtReplyText, setThoughtReplyText] = useState("");

    // =========================================================
    // LOAD LINEAGE DATA
    // =========================================================
    const loadLineage = useCallback(async () => {
        setLoading(true);
        try {
            const data = await discipleshipWebService.buildFullLineageTree();
            setTreeRoot(data.root);
            setAllMembers(data.allMembers);
        } catch (err) {
            console.error("Failed to load discipleship tree:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLineage();
    }, [loadLineage]);

    // Flatten tree to get all connected members for statistics & matrix view
    const flattenedNodes = useMemo(() => {
        if (!treeRoot) return [];
        const result: DiscipleshipMemberNode[] = [];
        const traverse = (node: DiscipleshipMemberNode) => {
            result.push(node);
            node.disciples.forEach(traverse);
        };
        traverse(treeRoot);
        return result;
    }, [treeRoot]);

    // Statistics calculations
    const stats = useMemo(() => {
        const total = flattenedNodes.length;
        const healthy = flattenedNodes.filter((n) => n.health === "HEALTHY").length;
        const attention = flattenedNodes.filter((n) => n.health === "ATTENTION").length;
        const atRisk = flattenedNodes.filter((n) => n.health === "AT_RISK").length;
        const maxGen = flattenedNodes.reduce((max, n) => Math.max(max, n.generation), 1);
        const totalDevotions = flattenedNodes.reduce((acc, n) => acc + (n.devotions?.length || 0), 0);

        return { total, healthy, attention, atRisk, maxGen, totalDevotions };
    }, [flattenedNodes]);

    // Toggle collapse
    const toggleCollapse = (memberId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setCollapsedIds((prev) => {
            const next = new Set(prev);
            if (next.has(memberId)) {
                next.delete(memberId);
            } else {
                next.add(memberId);
            }
            return next;
        });
    };

    // =========================================================
    // HANDLERS: PASTORAL CONTROL
    // =========================================================
    const handleOpenRoleModal = (node: DiscipleshipMemberNode, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setTargetMemberId(node.memberId);
        setSelectedRole(node.position);
        setRoleModalOpen(true);
    };

    const handleSaveRole = () => {
        if (!targetMemberId) return;
        discipleshipWebService.assignRole(targetMemberId, selectedRole);
        setRoleModalOpen(false);
        loadLineage();
    };

    const handleOpenAdoptModal = (leader: DiscipleshipMemberNode, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setTargetLeaderId(leader.memberId);
        setSelectedDiscipleId(null);
        setAdoptError(null);
        setAdoptModalOpen(true);
    };

    const handleSaveAdopt = () => {
        if (!targetLeaderId || !selectedDiscipleId) return;
        const res = discipleshipWebService.assignDiscipleToLeader(targetLeaderId, selectedDiscipleId);
        if (!res.success) {
            setAdoptError(res.message);
            return;
        }
        setAdoptModalOpen(false);
        loadLineage();
    };

    const handleSaveEncounter = () => {
        if (!selectedMember) return;
        const encounter: DiscipleshipEncounter = {
            encounterId: `enc-${Date.now()}`,
            leaderId: selectedMember.parentLeaderId || 101,
            discipleId: selectedMember.memberId,
            discipleName: selectedMember.fullName,
            meetingType: encounterMeetingType,
            topicsCovered: ["Spiritual Pulse Review", "Word & Prayer Alignment", "Personal Vision"],
            scriptureReference: encounterScripture,
            actionCommitment: encounterCommitment || "Consistently maintain daily SOAP devotions.",
            privatePastoralNote: encounterNote || "Encouraged and prayed for disciple's personal breakthrough.",
            nextMeetingScheduled: "Next Thursday at 6:00 PM",
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        };
        discipleshipWebService.logEncounter(encounter);
        setEncounterModalOpen(false);
        setEncounterCommitment("");
        setEncounterNote("");
        loadLineage();
        // Update selected member view
        setSelectedMember((prev) => (prev ? { ...prev, encounters: [encounter, ...prev.encounters] } : null));
    };

    // =========================================================
    // RECURSIVE TREE NODE COMPONENT
    // =========================================================
    const renderTreeNode = (node: DiscipleshipMemberNode): React.ReactNode => {
        const isCollapsed = collapsedIds.has(node.memberId);
        const hasChildren = node.disciples && node.disciples.length > 0;
        const posInfo = POSITION_DETAILS[node.position] || POSITION_DETAILS.DISCIPLE;
        const isSeniorPastor = node.position === "EPIC_SENIOR_PASTOR";
        const isSelected = selectedMember?.memberId === node.memberId;

        // Filter check
        const matchesSearch =
            !searchQuery ||
            node.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            posInfo.label.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesHealth = healthFilter === "ALL" || node.health === healthFilter;

        return (
            <div key={node.memberId} className="dt-tree-node">
                {/* Node Card */}
                <div
                    className={`dt-node-card health-${node.health} ${isSelected ? "selected" : ""} ${
                        !matchesSearch || !matchesHealth ? "opacity-40" : ""
                    }`}
                    onClick={() => {
                        setSelectedMember(node);
                        setDrawerTab("PULSE");
                    }}
                >
                    {/* Header */}
                    <div className="dt-node-header">
                        <span className="dt-gen-badge">
                            {isSeniorPastor ? "GEN 1 · OVERSEER" : `GEN ${node.generation}`}
                        </span>

                        <span className={`dt-health-badge ${node.health}`}>
                            {node.health === "HEALTHY" && "🟢 Healthy"}
                            {node.health === "ATTENTION" && "🟡 Attention"}
                            {node.health === "AT_RISK" && "🔴 At-Risk"}
                        </span>
                    </div>

                    {/* Body */}
                    <div className="dt-node-body">
                        <div
                            className="dt-node-avatar"
                            style={{
                                background: isSeniorPastor
                                    ? "linear-gradient(135deg, #7c3aed, #9333ea)"
                                    : undefined,
                            }}
                        >
                            {isSeniorPastor ? "👑" : node.fullName.charAt(0)}
                        </div>

                        <div className="dt-node-info">
                            <div className="dt-node-name" title={node.fullName}>
                                {node.fullName}
                            </div>
                            <span
                                className="dt-node-role-badge"
                                style={{
                                    backgroundColor: posInfo.bgSoft,
                                    color: posInfo.badgeColor,
                                    border: `1px solid ${posInfo.badgeColor}33`,
                                }}
                            >
                                {posInfo.label}
                            </span>
                        </div>
                    </div>

                    {/* Footer Metrics */}
                    <div className="dt-node-footer">
                        <div className={`dt-capacity-meter ${node.disciples.length >= MAX_DISCIPLES_PER_LEADER ? "full" : ""}`}>
                            <Users size={12} />
                            <span>
                                {node.disciples.length}/{MAX_DISCIPLES_PER_LEADER} Disciples
                            </span>
                        </div>

                        <div className="dt-spiritual-stat">
                            <span>📖 {node.pulse?.wordDaysWeekly || 4}d</span>
                            <span>🙏 {node.pulse?.prayerDaysWeekly || 5}d</span>
                        </div>
                    </div>

                    {/* Collapse Button if has children */}
                    {hasChildren && (
                        <button
                            type="button"
                            className="dt-collapse-toggle"
                            onClick={(e) => toggleCollapse(node.memberId, e)}
                            title={isCollapsed ? "Expand Branch" : "Collapse Branch"}
                        >
                            {isCollapsed ? "+" : "−"}
                        </button>
                    )}
                </div>

                {/* Branch Line Downward */}
                {hasChildren && !isCollapsed && (
                    <>
                        <div className="dt-branch-connector-down" />
                        <div
                            className={`dt-children-container ${
                                node.disciples.length === 1 ? "single-child" : ""
                            }`}
                        >
                            {node.disciples.map((child) => (
                                <div key={child.memberId} style={{ position: "relative" }}>
                                    <div className="dt-child-connector-up" />
                                    {renderTreeNode(child)}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    // =========================================================
    // MAIN RENDER
    // =========================================================
    return (
        <div className="discipleship-page">
            {/* Header */}
            <header className="dt-header">
                <div className="dt-header-left">
                    <div className="dt-header-icon">
                        <GitBranch size={30} />
                    </div>
                    <div>
                        <div className="dt-eyebrow">EPIC Church Management System</div>
                        <h1>EPIC Discipleship Tree</h1>
                        <div className="dt-subtitle">
                            Continuous Lineage Growth, Pastoral Monitoring & Accountability Control
                        </div>
                    </div>
                </div>

                <div className="dt-header-actions">
                    <button type="button" className="dt-btn dt-btn-secondary" onClick={loadLineage}>
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>

                    <button
                        type="button"
                        className="dt-btn dt-btn-purple"
                        onClick={() => {
                            if (treeRoot) handleOpenRoleModal(treeRoot);
                        }}
                    >
                        <Award size={14} />
                        Assign EPIC Role
                    </button>

                    <button
                        type="button"
                        className="dt-btn dt-btn-primary"
                        onClick={() => {
                            if (treeRoot) handleOpenAdoptModal(treeRoot);
                        }}
                    >
                        <UserPlus size={14} />
                        Adopt / Move Disciple
                    </button>
                </div>
            </header>

            {/* Overseer Banner & Scripture Anchor */}
            <section className="dt-banner">
                <div className="dt-banner-left">
                    <div className="dt-pastor-avatar">👑</div>
                    <div className="dt-banner-text">
                        <h2>
                            Ptr. {SENIOR_PASTOR_NAME}
                            <span className="dt-role-tag-gold">EPIC Senior Pastor</span>
                        </h2>
                        <div className="dt-banner-scripture">
                            "Trust in the Lord with all your heart, and do not lean on your own understanding;
                            in all your ways acknowledge Him, and He will make straight your paths."
                            <strong style={{ marginLeft: 6, color: "#60a5fa" }}>— Proverbs 3:5-6</strong>
                        </div>
                    </div>
                </div>

                <div className="dt-banner-right">
                    <div className="dt-pill-rule">
                        <strong>1 Leader : 3 Disciples Model</strong>
                        <span>Deep Intentional Multiplication</span>
                    </div>
                    <div className="dt-pill-rule">
                        <strong>Zero Auto-Assignment</strong>
                        <span>Pastoral & Manual Stewardship</span>
                    </div>
                </div>
            </section>

            {/* Pastoral Monitoring Metrics Cards */}
            <div className="dt-metrics-grid">
                <div className="dt-metric-card">
                    <div className="dt-metric-icon dt-icon-blue">
                        <Users size={22} />
                    </div>
                    <div>
                        <div className="dt-metric-val">{stats.total}</div>
                        <div className="dt-metric-label">Spiritual Lineage Total</div>
                    </div>
                </div>

                <div className="dt-metric-card">
                    <div className="dt-metric-icon dt-icon-purple">
                        <Layers size={22} />
                    </div>
                    <div>
                        <div className="dt-metric-val">{stats.maxGen} Active</div>
                        <div className="dt-metric-label">Generation Depth</div>
                    </div>
                </div>

                <div className="dt-metric-card">
                    <div className="dt-metric-icon dt-icon-green">
                        <CheckCircle2 size={22} />
                    </div>
                    <div>
                        <div className="dt-metric-val">{stats.healthy}</div>
                        <div className="dt-metric-label">Healthy Branches</div>
                    </div>
                </div>

                <div className="dt-metric-card">
                    <div className="dt-metric-icon dt-icon-amber">
                        <AlertTriangle size={22} />
                    </div>
                    <div>
                        <div className="dt-metric-val">{stats.attention}</div>
                        <div className="dt-metric-label">Needs Attention</div>
                    </div>
                </div>

                <div className="dt-metric-card">
                    <div className="dt-metric-icon dt-icon-rose">
                        <AlertCircle size={22} />
                    </div>
                    <div>
                        <div className="dt-metric-val">{stats.atRisk}</div>
                        <div className="dt-metric-label">At-Risk / Crisis</div>
                    </div>
                </div>

                <div className="dt-metric-card">
                    <div className="dt-metric-icon dt-icon-blue">
                        <BookOpen size={22} />
                    </div>
                    <div>
                        <div className="dt-metric-val">{stats.totalDevotions}</div>
                        <div className="dt-metric-label">Devotions Received</div>
                    </div>
                </div>
            </div>

            {/* Controls Bar: Search, Health Filter, View Toggle */}
            <div className="dt-controls-bar">
                <div className="dt-search-box">
                    <Search size={16} color="#94a3b8" />
                    <input
                        type="text"
                        placeholder="Search leader or disciple name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="dt-filters-group">
                    <button
                        type="button"
                        className={`dt-filter-pill ${healthFilter === "ALL" ? "active" : ""}`}
                        onClick={() => setHealthFilter("ALL")}
                    >
                        All ({stats.total})
                    </button>
                    <button
                        type="button"
                        className={`dt-filter-pill ${healthFilter === "HEALTHY" ? "active" : ""}`}
                        onClick={() => setHealthFilter("HEALTHY")}
                    >
                        🟢 Healthy ({stats.healthy})
                    </button>
                    <button
                        type="button"
                        className={`dt-filter-pill ${healthFilter === "ATTENTION" ? "active" : ""}`}
                        onClick={() => setHealthFilter("ATTENTION")}
                    >
                        🟡 Attention ({stats.attention})
                    </button>
                    <button
                        type="button"
                        className={`dt-filter-pill ${healthFilter === "AT_RISK" ? "active" : ""}`}
                        onClick={() => setHealthFilter("AT_RISK")}
                    >
                        🔴 At-Risk ({stats.atRisk})
                    </button>
                </div>

                <div className="dt-view-toggle">
                    <button
                        type="button"
                        className={`dt-toggle-btn ${viewMode === "TREE" ? "active" : ""}`}
                        onClick={() => setViewMode("TREE")}
                    >
                        <GitBranch size={14} />
                        Branch Tree
                    </button>
                    <button
                        type="button"
                        className={`dt-toggle-btn ${viewMode === "MATRIX" ? "active" : ""}`}
                        onClick={() => setViewMode("MATRIX")}
                    >
                        <Layers size={14} />
                        Generations
                    </button>
                    <button
                        type="button"
                        className={`dt-toggle-btn ${viewMode === "RADAR" ? "active" : ""}`}
                        onClick={() => setViewMode("RADAR")}
                    >
                        <Activity size={14} />
                        Shepherd Care
                    </button>
                </div>
            </div>

            {/* VIEW MODE 1: ORGANIC BRANCH TREE */}
            {viewMode === "TREE" && (
                <div className="dt-tree-container">
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "80px 0", color: "#64748b" }}>
                            <RefreshCw size={32} className="animate-spin" style={{ margin: "0 auto 12px" }} />
                            <div>Loading EPIC Discipleship Lineage Tree...</div>
                        </div>
                    ) : treeRoot ? (
                        <div className="dt-tree-wrapper">{renderTreeNode(treeRoot)}</div>
                    ) : (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
                            No discipleship lineage records found.
                        </div>
                    )}
                </div>
            )}

            {/* VIEW MODE 2: GENERATIONS MATRIX */}
            {viewMode === "MATRIX" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {[1, 2, 3, 4, 5].map((gen) => {
                        const genMembers = flattenedNodes.filter((n) => n.generation === gen);
                        if (genMembers.length === 0) return null;

                        return (
                            <div
                                key={gen}
                                style={{
                                    background: "#ffffff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: 16,
                                    padding: "20px 24px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: 16,
                                        borderBottom: "1px solid #f1f5f9",
                                        paddingBottom: 10,
                                    }}
                                >
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                                        {gen === 1 && "👑 Generation 1: EPIC Senior Pastoral Oversight"}
                                        {gen === 2 && "⭐ Generation 2: EPIC Assistant Pastors"}
                                        {gen === 3 && "🏛️ Generation 3: EPIC Leaders"}
                                        {gen === 4 && "🔥 Generation 4: EPIC Disciplers"}
                                        {gen >= 5 && `🌱 Generation ${gen}: Multiplying Fruit & Disciples`}
                                    </h3>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                                        {genMembers.length} Leaders & Disciples
                                    </span>
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                                        gap: 16,
                                    }}
                                >
                                    {genMembers.map((member) => {
                                        const pos = POSITION_DETAILS[member.position] || POSITION_DETAILS.DISCIPLE;
                                        return (
                                            <div
                                                key={member.memberId}
                                                className={`dt-node-card health-${member.health}`}
                                                style={{ width: "auto" }}
                                                onClick={() => {
                                                    setSelectedMember(member);
                                                    setDrawerTab("PULSE");
                                                }}
                                            >
                                                <div className="dt-node-header">
                                                    <span className="dt-gen-badge">GEN {member.generation}</span>
                                                    <span className={`dt-health-badge ${member.health}`}>
                                                        {member.health}
                                                    </span>
                                                </div>
                                                <div className="dt-node-body">
                                                    <div className="dt-node-avatar">{member.fullName.charAt(0)}</div>
                                                    <div className="dt-node-info">
                                                        <div className="dt-node-name">{member.fullName}</div>
                                                        <span
                                                            className="dt-node-role-badge"
                                                            style={{
                                                                backgroundColor: pos.bgSoft,
                                                                color: pos.badgeColor,
                                                            }}
                                                        >
                                                            {pos.label}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="dt-node-footer">
                                                    <span>Mentors: {member.disciples.length}/3</span>
                                                    <span>Word: {member.pulse?.wordDaysWeekly || 4}d/wk</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* VIEW MODE 3: SHEPHERD CARE RADAR */}
            {viewMode === "RADAR" && (
                <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
                    <div style={{ marginBottom: 18 }}>
                        <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                            Pastoral Shepherd Care Radar
                        </h2>
                        <div style={{ fontSize: 13, color: "#64748b" }}>
                            Immediate attention radar for disciples facing struggles, missed Sunday services, or lack of 1-on-1 contact.
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                        {flattenedNodes
                            .filter((n) => n.health !== "HEALTHY")
                            .map((disciple) => (
                                <div
                                    key={disciple.memberId}
                                    style={{
                                        border: `1px solid ${disciple.health === "AT_RISK" ? "#fecaca" : "#fef08a"}`,
                                        background: disciple.health === "AT_RISK" ? "#fff5f5" : "#fffbeb",
                                        borderRadius: 14,
                                        padding: 18,
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                        <strong style={{ fontSize: 15, color: "#0f172a" }}>{disciple.fullName}</strong>
                                        <span className={`dt-health-badge ${disciple.health}`}>
                                            {disciple.health === "AT_RISK" ? "🔴 At-Risk" : "🟡 Needs Attention"}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: 13, color: "#475569", marginBottom: 10 }}>
                                        <div><strong>Assigned Leader:</strong> {disciple.parentLeaderName || "Direct Pastoral Oversight"}</div>
                                        <div><strong>Heart State:</strong> {disciple.pulse?.heartState || "DRAINED"}</div>
                                        <div><strong>Last 1-on-1 Encounter:</strong> {disciple.lastEncounterDaysAgo} days ago</div>
                                        {disciple.missedSundaysCount > 0 && (
                                            <div style={{ color: "#dc2626", fontWeight: 700, marginTop: 4 }}>
                                                ⚠️ Missed {disciple.missedSundaysCount} consecutive Sunday service(s)
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: 10, fontSize: 12, marginBottom: 12, fontStyle: "italic", color: "#334155" }}>
                                        "{disciple.pulse?.prayerNeed || "Needs pastoral shepherding and encouragement."}"
                                    </div>

                                    <div style={{ display: "flex", gap: 8 }}>
                                        <a href={`tel:${disciple.phone}`} className="dt-contact-btn" style={{ flex: 1, justifyContent: "center" }}>
                                            <Phone size={13} />
                                            Call
                                        </a>
                                        <a href={`sms:${disciple.phone}`} className="dt-contact-btn" style={{ flex: 1, justifyContent: "center" }}>
                                            <MessageCircle size={13} />
                                            SMS
                                        </a>
                                        <button
                                            type="button"
                                            className="dt-contact-btn"
                                            style={{ flex: 1, justifyContent: "center", background: "#2563eb", color: "white", borderColor: "#2563eb" }}
                                            onClick={() => {
                                                setSelectedMember(disciple);
                                                setDrawerTab("ENCOUNTERS");
                                            }}
                                        >
                                            Log Care
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* =========================================================
                AUDIT DRAWER: INSPECT DISCIPLE'S WALK & DEVOTIONS
               ========================================================= */}
            {selectedMember && (
                <div className="dt-modal-backdrop" onClick={() => setSelectedMember(null)}>
                    <div className="dt-drawer" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="dt-drawer-header">
                            <div className="dt-drawer-title-row">
                                <div className="dt-drawer-avatar">{selectedMember.fullName.charAt(0)}</div>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800 }}>{selectedMember.fullName}</div>
                                    <div style={{ fontSize: 12, color: "#93c5fd", marginTop: 2 }}>
                                        {POSITION_DETAILS[selectedMember.position]?.label} · Gen {selectedMember.generation}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                                        Ministry: {selectedMember.ministry || "General Ministry"}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="dt-drawer-close"
                                onClick={() => setSelectedMember(null)}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Direct Pastoral Contact Channels */}
                        <div className="dt-drawer-contact-bar">
                            <a href={`tel:${selectedMember.phone}`} className="dt-contact-btn">
                                <Phone size={14} color="#16a34a" />
                                Call ({selectedMember.phone || "No Mobile"})
                            </a>
                            <a href={`sms:${selectedMember.phone}`} className="dt-contact-btn">
                                <MessageCircle size={14} color="#2563eb" />
                                SMS Text
                            </a>
                            <a
                                href={selectedMember.messengerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="dt-contact-btn messenger"
                            >
                                <ExternalLink size={14} />
                                FB Messenger
                            </a>
                            <button
                                type="button"
                                className="dt-contact-btn"
                                style={{ background: "#7c3aed", color: "white", borderColor: "#7c3aed" }}
                                onClick={() => handleOpenRoleModal(selectedMember)}
                            >
                                <Award size={14} />
                                Change Role
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="dt-drawer-tabs">
                            <button
                                type="button"
                                className={`dt-dtab-btn ${drawerTab === "PULSE" ? "active" : ""}`}
                                onClick={() => setDrawerTab("PULSE")}
                            >
                                <Heart size={14} style={{ display: "inline", marginRight: 6 }} />
                                Spiritual Pulse
                            </button>
                            <button
                                type="button"
                                className={`dt-dtab-btn ${drawerTab === "DEVOTIONS" ? "active" : ""}`}
                                onClick={() => setDrawerTab("DEVOTIONS")}
                            >
                                <BookOpen size={14} style={{ display: "inline", marginRight: 6 }} />
                                SOAP Devotions ({selectedMember.devotions.length})
                            </button>
                            <button
                                type="button"
                                className={`dt-dtab-btn ${drawerTab === "THOUGHTS" ? "active" : ""}`}
                                onClick={() => setDrawerTab("THOUGHTS")}
                            >
                                <Sparkles size={14} style={{ display: "inline", marginRight: 6 }} />
                                Thoughts ({selectedMember.thoughts.length})
                            </button>
                            <button
                                type="button"
                                className={`dt-dtab-btn ${drawerTab === "ENCOUNTERS" ? "active" : ""}`}
                                onClick={() => setDrawerTab("ENCOUNTERS")}
                            >
                                <Calendar size={14} style={{ display: "inline", marginRight: 6 }} />
                                1-on-1 Meetings
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="dt-drawer-content">
                            {/* TAB 1: SPIRITUAL PULSE */}
                            {drawerTab === "PULSE" && (
                                <>
                                    <div className="dt-card-box">
                                        <h3>
                                            <Heart size={16} color="#ef4444" />
                                            Weekly Spiritual Heart State
                                        </h3>
                                        <div
                                            style={{
                                                fontSize: 18,
                                                fontWeight: 800,
                                                color: selectedMember.health === "AT_RISK" ? "#b91c1c" : "#0f172a",
                                                marginBottom: 8,
                                            }}
                                        >
                                            State: {selectedMember.pulse?.heartState || "PEACEFUL"}
                                        </div>
                                        <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
                                            <strong>Struggle Category:</strong>{" "}
                                            {selectedMember.pulse?.struggleCategory || "None recorded"}
                                        </div>
                                        <div
                                            style={{
                                                marginTop: 10,
                                                padding: 12,
                                                background: "#f1f5f9",
                                                borderRadius: 8,
                                                fontSize: 13,
                                                fontStyle: "italic",
                                                color: "#1e293b",
                                            }}
                                        >
                                            "{selectedMember.pulse?.prayerNeed || "Trusting God for family breakthrough."}"
                                        </div>
                                    </div>

                                    <div className="dt-card-box">
                                        <h3>
                                            <BookOpen size={16} color="#2563eb" />
                                            Faithfulness & Spiritual Disciplines
                                        </h3>
                                        <div style={{ marginBottom: 12 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                                                <span>Word & Scripture Intake</span>
                                                <span>{selectedMember.pulse?.wordDaysWeekly || 4} of 7 days</span>
                                            </div>
                                            <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                                                <div
                                                    style={{
                                                        height: "100%",
                                                        width: `${((selectedMember.pulse?.wordDaysWeekly || 4) / 7) * 100}%`,
                                                        background: "#2563eb",
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: 14 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                                                <span>Personal Prayer Consistency</span>
                                                <span>{selectedMember.pulse?.prayerDaysWeekly || 5} of 7 days</span>
                                            </div>
                                            <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                                                <div
                                                    style={{
                                                        height: "100%",
                                                        width: `${((selectedMember.pulse?.prayerDaysWeekly || 5) / 7) * 100}%`,
                                                        background: "#10b981",
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ fontSize: 13, color: "#64748b" }}>
                                            <div>
                                                <strong>Sunday Service Attendance:</strong>{" "}
                                                {selectedMember.missedSundaysCount === 0
                                                    ? "Active · Faithful streak"
                                                    : `Missed ${selectedMember.missedSundaysCount} consecutive Sunday(s)`}
                                            </div>
                                            <div style={{ marginTop: 4 }}>
                                                <strong>Last 1-on-1 Discipleship Meeting:</strong>{" "}
                                                {selectedMember.lastEncounterDaysAgo} days ago
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* TAB 2: SOAP DEVOTIONS */}
                            {drawerTab === "DEVOTIONS" && (
                                <div>
                                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
                                        SOAP Devotions logged by disciple on the mobile app and transmitted to pastoral leadership:
                                    </div>

                                    {selectedMember.devotions.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                                            No devotions logged yet.
                                        </div>
                                    ) : (
                                        selectedMember.devotions.map((dev) => (
                                            <div key={dev.devotionId} className="dt-soap-item">
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                    <span className="dt-soap-verse">📖 {dev.passage}</span>
                                                    <span style={{ fontSize: 11, color: "#64748b" }}>{dev.date}</span>
                                                </div>
                                                <div className="dt-soap-rhema">"{dev.rhemaVerse}"</div>
                                                <div className="dt-soap-grid">
                                                    <div>
                                                        <span className="dt-soap-label">Observation:</span> {dev.observation}
                                                    </div>
                                                    <div>
                                                        <span className="dt-soap-label">Application:</span> {dev.application}
                                                    </div>
                                                    <div>
                                                        <span className="dt-soap-label">Prayer:</span> {dev.prayer}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* TAB 3: THOUGHTS & BURDENS */}
                            {drawerTab === "THOUGHTS" && (
                                <div>
                                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
                                        Spiritual questions, burdens, and testimonies sent by disciple:
                                    </div>

                                    {selectedMember.thoughts.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                                            No thoughts submitted.
                                        </div>
                                    ) : (
                                        selectedMember.thoughts.map((th) => (
                                            <div key={th.thoughtId} className="dt-card-box">
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 800, color: "#2563eb" }}>
                                                        {th.category}
                                                    </span>
                                                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{th.date}</span>
                                                </div>
                                                <div style={{ fontSize: 13, color: "#1e293b", marginBottom: 10, lineHeight: 1.4 }}>
                                                    {th.content}
                                                </div>
                                                {th.mentorResponse && (
                                                    <div style={{ background: "#eff6ff", borderRadius: 8, padding: 10, fontSize: 12, color: "#1e40af" }}>
                                                        <strong>Pastoral Reply:</strong> {th.mentorResponse}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}

                                    {/* Shepherd reply composer */}
                                    <div className="dt-card-box">
                                        <h3>
                                            <Send size={15} color="#2563eb" />
                                            Send Pastoral Shepherd Encouragement
                                        </h3>
                                        <textarea
                                            rows={3}
                                            placeholder="Write an encouraging shepherd message to disciple..."
                                            value={thoughtReplyText}
                                            onChange={(e) => setThoughtReplyText(e.target.value)}
                                            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                                        />
                                        <button
                                            type="button"
                                            className="dt-btn dt-btn-primary"
                                            style={{ marginTop: 10 }}
                                            onClick={() => {
                                                if (!thoughtReplyText) return;
                                                alert("Shepherd encouragement sent to disciple's mobile notification!");
                                                setThoughtReplyText("");
                                            }}
                                        >
                                            Send to Disciple
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: 1-ON-1 ENCOUNTERS */}
                            {drawerTab === "ENCOUNTERS" && (
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                                        <div style={{ fontSize: 13, color: "#64748b" }}>
                                            Record of intentional 1-on-1 discipleship encounters:
                                        </div>
                                        <button
                                            type="button"
                                            className="dt-btn dt-btn-primary"
                                            onClick={() => setEncounterModalOpen(true)}
                                        >
                                            <Plus size={14} />
                                            Log Meeting
                                        </button>
                                    </div>

                                    {selectedMember.encounters.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                                            No encounters logged yet. Click "Log Meeting" above.
                                        </div>
                                    ) : (
                                        selectedMember.encounters.map((enc) => (
                                            <div key={enc.encounterId} className="dt-card-box">
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                                    <span style={{ fontWeight: 800, fontSize: 13, color: "#0f172a" }}>
                                                        {enc.meetingType} Fellowship
                                                    </span>
                                                    <span style={{ fontSize: 11, color: "#64748b" }}>{enc.date}</span>
                                                </div>
                                                <div style={{ fontSize: 12, color: "#475569", marginBottom: 6 }}>
                                                    <strong>Scripture Focus:</strong> {enc.scriptureReference}
                                                </div>
                                                <div style={{ fontSize: 12, color: "#334155", marginBottom: 6 }}>
                                                    <strong>Action Commitment:</strong> {enc.actionCommitment}
                                                </div>
                                                <div style={{ background: "#f8fafc", padding: 8, borderRadius: 6, fontSize: 12, color: "#64748b" }}>
                                                    <strong>Private Pastoral Note:</strong> {enc.privatePastoralNote}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
                MODAL 1: ASSIGN OFFICIAL EPIC LEADERSHIP ROLE
               ========================================================= */}
            {roleModalOpen && (
                <div className="dt-center-modal-backdrop" onClick={() => setRoleModalOpen(false)}>
                    <div className="dt-center-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dt-cm-header">
                            <h2>Assign Official EPIC Role</h2>
                            <button
                                type="button"
                                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}
                                onClick={() => setRoleModalOpen(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="dt-cm-body">
                            <div className="dt-alert-box">
                                <ShieldCheck size={18} color="#b45309" />
                                <div>
                                    <strong>Pastoral Authority:</strong> Leadership roles are strictly designated by the Senior Pastor and Church Administration.
                                </div>
                            </div>

                            <div className="dt-form-group">
                                <label>Select Church Member</label>
                                <select
                                    value={targetMemberId || ""}
                                    onChange={(e) => setTargetMemberId(Number(e.target.value))}
                                >
                                    {allMembers.map((m) => (
                                        <option key={m.memberId} value={m.memberId}>
                                            {m.fullName} ({m.ministry || "Member"})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="dt-form-group">
                                <label>Assign Official EPIC Role</label>
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value as ChurchPosition)}
                                >
                                    {AVAILABLE_EPIC_POSITIONS.map((pos) => {
                                        const p = POSITION_DETAILS[pos];
                                        return (
                                            <option key={pos} value={pos}>
                                                {p.icon} {p.label} (Tier {p.tier})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div style={{ fontSize: 12, color: "#64748b", background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                                <strong>Role Description:</strong> {POSITION_DETAILS[selectedRole]?.description}
                            </div>
                        </div>

                        <div className="dt-cm-footer">
                            <button
                                type="button"
                                className="dt-btn dt-btn-secondary"
                                onClick={() => setRoleModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="dt-btn dt-btn-purple"
                                onClick={handleSaveRole}
                            >
                                Confirm Role Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
                MODAL 2: ADOPT / REASSIGN DISCIPLE (1:3 RULE ENFORCED)
               ========================================================= */}
            {adoptModalOpen && (
                <div className="dt-center-modal-backdrop" onClick={() => setAdoptModalOpen(false)}>
                    <div className="dt-center-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dt-cm-header">
                            <h2>Adopt / Assign Disciple to Branch</h2>
                            <button
                                type="button"
                                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}
                                onClick={() => setAdoptModalOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="dt-cm-body">
                            {adoptError && (
                                <div className="dt-alert-box" style={{ background: "#fee2e2", borderColor: "#fca5a5", color: "#991b1b" }}>
                                    <AlertCircle size={18} />
                                    <div>{adoptError}</div>
                                </div>
                            )}

                            <div className="dt-alert-box">
                                <Users size={18} color="#b45309" />
                                <div>
                                    <strong>Strict 1:3 Multiplication Policy:</strong> Exactly up to 3 disciples per leader for focused pastoral shepherding and no duplicated disciples across branches.
                                </div>
                            </div>

                            <div className="dt-form-group">
                                <label>Assigned Leader (Discipler)</label>
                                <select
                                    value={targetLeaderId || ""}
                                    onChange={(e) => {
                                        setTargetLeaderId(Number(e.target.value));
                                        setAdoptError(null);
                                    }}
                                >
                                    {flattenedNodes.map((leader) => (
                                        <option key={leader.memberId} value={leader.memberId}>
                                            {leader.fullName} ({leader.disciples.length}/{MAX_DISCIPLES_PER_LEADER} Disciples) · {POSITION_DETAILS[leader.position]?.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="dt-form-group">
                                <label>Accountable Disciple to Adopt</label>
                                <select
                                    value={selectedDiscipleId || ""}
                                    onChange={(e) => {
                                        setSelectedDiscipleId(Number(e.target.value));
                                        setAdoptError(null);
                                    }}
                                >
                                    <option value="">-- Choose Member from Church Directory --</option>
                                    {allMembers.map((m) => (
                                        <option key={m.memberId} value={m.memberId}>
                                            {m.fullName} ({m.ministry || "Member"})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="dt-cm-footer">
                            <button
                                type="button"
                                className="dt-btn dt-btn-secondary"
                                onClick={() => setAdoptModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="dt-btn dt-btn-primary"
                                onClick={handleSaveAdopt}
                                disabled={!targetLeaderId || !selectedDiscipleId}
                            >
                                Adopt Disciple to Branch
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
                MODAL 3: LOG 1-ON-1 ENCOUNTER
               ========================================================= */}
            {encounterModalOpen && selectedMember && (
                <div className="dt-center-modal-backdrop" onClick={() => setEncounterModalOpen(false)}>
                    <div className="dt-center-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dt-cm-header">
                            <h2>Log 1-on-1 Discipleship Encounter</h2>
                            <button
                                type="button"
                                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}
                                onClick={() => setEncounterModalOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="dt-cm-body">
                            <div style={{ marginBottom: 14, fontSize: 13, color: "#475569" }}>
                                Discipleship meeting with: <strong>{selectedMember.fullName}</strong>
                            </div>

                            <div className="dt-form-group">
                                <label>Meeting Format</label>
                                <select
                                    value={encounterMeetingType}
                                    onChange={(e) => setEncounterMeetingType(e.target.value)}
                                >
                                    <option value="COFFEE">☕ Coffee / Personal 1-on-1</option>
                                    <option value="CHURCH_FELLOWSHIP">⛪ Church Fellowship</option>
                                    <option value="CALL">📞 Phone / Video Shepherd Call</option>
                                    <option value="HOME_VISIT">🏡 Home Pastoral Visitation</option>
                                </select>
                            </div>

                            <div className="dt-form-group">
                                <label>Scripture Reference Focused</label>
                                <input
                                    type="text"
                                    value={encounterScripture}
                                    onChange={(e) => setEncounterScripture(e.target.value)}
                                    placeholder="e.g. Proverbs 3:5-6, John 15:5"
                                />
                            </div>

                            <div className="dt-form-group">
                                <label>Disciple's Action Commitment</label>
                                <input
                                    type="text"
                                    value={encounterCommitment}
                                    onChange={(e) => setEncounterCommitment(e.target.value)}
                                    placeholder="e.g. Read 1 chapter of Psalms daily before 8am"
                                />
                            </div>

                            <div className="dt-form-group">
                                <label>Private Pastoral Care Note</label>
                                <textarea
                                    rows={3}
                                    value={encounterNote}
                                    onChange={(e) => setEncounterNote(e.target.value)}
                                    placeholder="Confidential spiritual observations and prayer notes..."
                                />
                            </div>
                        </div>

                        <div className="dt-cm-footer">
                            <button
                                type="button"
                                className="dt-btn dt-btn-secondary"
                                onClick={() => setEncounterModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="dt-btn dt-btn-primary"
                                onClick={handleSaveEncounter}
                            >
                                Save Encounter
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
