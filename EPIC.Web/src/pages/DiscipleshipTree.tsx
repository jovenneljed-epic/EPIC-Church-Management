import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
    Workflow,
    Users,
    ShieldCheck,
    Shield,
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
    Send,
    ZoomIn,
    ZoomOut,
    Maximize2,
    RotateCcw,
    LayoutGrid,
    MoveHorizontal,
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
    const [viewMode, setViewMode] = useState<"FLOW" | "TREE" | "MATRIX" | "RADAR">("FLOW");

    // Canvas Zoom, Layout Mode & Drag-to-Pan Controls
    const [zoomLevel, setZoomLevel] = useState<number>(0.9);
    const [selectedCategory, setSelectedCategory] = useState<"ALL" | "PASTOR" | "ADULT" | "YOUTH">("ALL");
    const [treeLayoutMode, setTreeLayoutMode] = useState<"FIT_GRID" | "LINEAR">("FIT_GRID");
    const [cardDensity, setCardDensity] = useState<"NORMAL" | "COMPACT">("NORMAL");
    const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const treeContainerRef = useRef<HTMLDivElement>(null);
    const treeWrapperRef = useRef<HTMLDivElement>(null);

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

    // Force fresh sync with live church database
    const handleFreshSync = async () => {
        setLoading(true);
        try {
            if (typeof window !== "undefined") {
                delete (window as any).__epicMembersCache;
            }
            localStorage.removeItem("@epic_discipleship_branch_assignments_v1");
            localStorage.removeItem("@epic_discipleship_branch_assignments_v2");
            localStorage.removeItem("@epic_discipleship_branch_assignments_v3_real");
            localStorage.removeItem("@epic_discipleship_branch_assignments_v4_real_unlimited");
            localStorage.removeItem("@epic_discipleship_branch_assignments_v5_leaders");
            localStorage.removeItem("@epic_discipleship_branch_assignments_v6_manual");
            await loadLineage();
        } finally {
            setLoading(false);
        }
    };

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

    // Group Gen 2 leaders by department
    const { asstPastors, adultLeaders, youthLeaders } = useMemo(() => {
        const asst: DiscipleshipMemberNode[] = [];
        const adult: DiscipleshipMemberNode[] = [];
        const youth: DiscipleshipMemberNode[] = [];
        const other: DiscipleshipMemberNode[] = [];

        (treeRoot?.disciples || []).forEach((node) => {
            const cat = node.leaderCategory || "OTHER";
            if (cat === "PASTOR") asst.push(node);
            else if (cat === "ADULT") adult.push(node);
            else if (cat === "YOUTH") youth.push(node);
            else other.push(node);
        });

        // Distribute any other church leaders into their matching department
        other.forEach((n) => {
            const min = (n.ministry || "").toUpperCase();
            if (min.includes("ADULT")) adult.push(n);
            else if (min.includes("YOUTH") || min.includes("YOUNG ADULT")) youth.push(n);
            else asst.push(n);
        });
        return { asstPastors: asst, adultLeaders: adult, youthLeaders: youth };
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

    // Toggle collapse for individual node
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

    // Toggle collapse/expand all disciples
    const areAllDisciplesCollapsed = useMemo(() => {
        if (!treeRoot || treeRoot.disciples.length === 0) return false;
        return treeRoot.disciples.every((d) => collapsedIds.has(d.memberId));
    }, [treeRoot, collapsedIds]);

    const toggleCollapseAllDisciples = () => {
        if (!treeRoot) return;
        if (areAllDisciplesCollapsed) {
            setCollapsedIds(new Set());
        } else {
            const newSet = new Set<number>();
            treeRoot.disciples.forEach((d) => newSet.add(d.memberId));
            setCollapsedIds(newSet);
        }
    };

    // True Dynamic Fit Screen: Measures actual visible container width and content width
    const handleFitScreen = useCallback(() => {
        setPanPosition({ x: 0, y: 0 });
        if (!treeContainerRef.current || !treeWrapperRef.current) {
            setZoomLevel(treeLayoutMode === "FIT_GRID" ? 0.95 : 0.25);
            return;
        }
        const container = treeContainerRef.current;
        const wrapper = treeWrapperRef.current;

        // Container client width minus padding
        const containerWidth = container.clientWidth - 48;

        // Calculate unscaled content width
        const currentScale = zoomLevel > 0 ? zoomLevel : 1;
        const unscaledWidth = wrapper.scrollWidth / currentScale;

        if (containerWidth > 0 && unscaledWidth > 0) {
            const calculatedScale = Math.min(1.0, Math.max(0.18, Number((containerWidth / unscaledWidth).toFixed(2))));
            setZoomLevel(calculatedScale);
        } else {
            setZoomLevel(treeLayoutMode === "FIT_GRID" ? 0.95 : 0.25);
        }
    }, [zoomLevel, treeLayoutMode]);

    // Auto-fit on department filter, layout mode, or density change
    useEffect(() => {
        if (viewMode === "TREE" && treeRoot) {
            const t = setTimeout(() => {
                handleFitScreen();
            }, 120);
            return () => clearTimeout(t);
        }
    }, [viewMode, selectedCategory, treeLayoutMode, cardDensity, areAllDisciplesCollapsed]);

    // Canvas Drag-to-Pan Handlers
    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (
            target.closest(".dt-node-card") ||
            target.closest("button") ||
            target.closest("a") ||
            target.closest("input") ||
            target.closest(".dt-canvas-toolbar")
        ) {
            return;
        }
        setIsPanning(true);
        panStartRef.current = {
            x: e.clientX - panPosition.x,
            y: e.clientY - panPosition.y,
        };
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (!isPanning) return;
        setPanPosition({
            x: e.clientX - panStartRef.current.x,
            y: e.clientY - panStartRef.current.y,
        });
    };

    const handleCanvasMouseUp = () => {
        setIsPanning(false);
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
        if (targetLeaderId === null || !selectedDiscipleId) return;
        const res = discipleshipWebService.assignDiscipleToLeader(targetLeaderId, selectedDiscipleId, treeRoot?.memberId || 0);
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
            leaderId: selectedMember.parentLeaderId !== null ? selectedMember.parentLeaderId : 0,
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
        setSelectedMember((prev) => (prev ? { ...prev, encounters: [encounter, ...prev.encounters] } : null));
    };

    // =========================================================
    // RECURSIVE TREE NODE COMPONENT
    // =========================================================
    const renderTreeNode = (node: DiscipleshipMemberNode): React.ReactNode => {
        const isCollapsed = collapsedIds.has(node.memberId);
        const hasChildren = node.disciples && node.disciples.length > 0;
        const posInfo = POSITION_DETAILS[node.position] || POSITION_DETAILS.DISCIPLE;
        const isSeniorPastor = node.position === "EPIC_SENIOR_PASTOR" || node.generation === 1;
        const isAssistantPastor = node.generation === 2 && (node.leaderCategory === "PASTOR" || node.position === "EPIC_ASSISTANT_PASTOR");
        const isAdultLeader = node.generation === 2 && node.leaderCategory === "ADULT";
        const isYouthLeader = node.generation === 2 && node.leaderCategory === "YOUTH";
        const isSelected = selectedMember?.memberId === node.memberId;

        // Filter check
        const matchesSearch =
            !searchQuery ||
            node.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            posInfo.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (node.ministry || "").toLowerCase().includes(searchQuery.toLowerCase());

        const matchesHealth = healthFilter === "ALL" || node.health === healthFilter;

        // Determine displayed children for Gen 1 (Senior Pastor) based on selectedCategory
        let displayedChildren = node.disciples;
        if (isSeniorPastor && selectedCategory !== "ALL") {
            displayedChildren = node.disciples.filter((d) => (d.leaderCategory || "OTHER") === selectedCategory);
        }

        const hasDisplayedChildren = displayedChildren && displayedChildren.length > 0;

        return (
            <div key={node.memberId} className="dt-tree-node">
                {/* Node Card */}
                <div
                    className={`dt-node-card ${cardDensity === "COMPACT" ? "compact" : ""} health-${node.health} ${isSelected ? "selected" : ""} ${
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
                            {isSeniorPastor
                                ? "GEN 1 · OVERSEER"
                                : isAssistantPastor
                                ? "GEN 2 · ASST. PASTOR"
                                : isAdultLeader
                                ? "GEN 2 · ADULT LEADER"
                                : isYouthLeader
                                ? "GEN 2 · YOUTH LEADER"
                                : `GEN ${node.generation}`}
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
                                    : isAssistantPastor
                                    ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                                    : isAdultLeader
                                    ? "linear-gradient(135deg, #7e22ce, #a855f7)"
                                    : isYouthLeader
                                    ? "linear-gradient(135deg, #ea580c, #f97316)"
                                    : undefined,
                            }}
                        >
                            {isSeniorPastor ? "👑" : isAssistantPastor ? "⭐" : isAdultLeader ? "🌟" : isYouthLeader ? "🔥" : node.fullName.charAt(0)}
                        </div>

                        <div className="dt-node-info">
                            <div className="dt-node-name" title={node.fullName}>
                                {node.fullName}
                            </div>
                            <span
                                className="dt-node-role-badge"
                                style={{
                                    backgroundColor: isAssistantPastor
                                        ? "#EFF6FF"
                                        : isAdultLeader
                                        ? "#FAF5FF"
                                        : isYouthLeader
                                        ? "#FFF7ED"
                                        : posInfo.bgSoft,
                                    color: isAssistantPastor
                                        ? "#2563EB"
                                        : isAdultLeader
                                        ? "#7E22CE"
                                        : isYouthLeader
                                        ? "#C2410C"
                                        : posInfo.badgeColor,
                                    border: `1px solid ${posInfo.badgeColor}33`,
                                }}
                            >
                                {node.leaderCategoryLabel || posInfo.label}
                            </span>
                        </div>
                    </div>

                    {/* Footer Metrics */}
                    <div className="dt-node-footer">
                        {isSeniorPastor ? (
                            <div className="dt-capacity-meter admin-unlimited">
                                <Users size={12} />
                                <span>
                                    👑 {node.disciples.length} Leaders Delegated (Admin · Unlimited)
                                </span>
                            </div>
                        ) : (
                            <div className={`dt-capacity-meter ${node.disciples.length >= MAX_DISCIPLES_PER_LEADER ? "full" : ""}`}>
                                <Users size={12} />
                                <span>
                                    {node.disciples.length}/{MAX_DISCIPLES_PER_LEADER} Disciples
                                </span>
                            </div>
                        )}

                        <div className="dt-spiritual-stat">
                            <span>📖 {node.pulse?.wordDaysWeekly || 5}d</span>
                            <span>🙏 {node.pulse?.prayerDaysWeekly || 6}d</span>
                        </div>
                    </div>

                    {/* Quick Delegate / Adopt Action Button */}
                    <div style={{ marginTop: 8, display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                        {isSeniorPastor ? (
                            <button
                                type="button"
                                style={{
                                    flex: 1,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: "5px 8px",
                                    borderRadius: 6,
                                    border: "1px solid #7c3aed",
                                    background: "#7c3aed",
                                    color: "#ffffff",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 4,
                                }}
                                onClick={(e) => handleOpenAdoptModal(node, e)}
                            >
                                <Plus size={12} /> Delegate EPIC Leader (Unlimited)
                            </button>
                        ) : node.disciples.length < MAX_DISCIPLES_PER_LEADER ? (
                            <button
                                type="button"
                                style={{
                                    flex: 1,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    padding: "4px 6px",
                                    borderRadius: 6,
                                    border: "1px solid #cbd5e1",
                                    background: "#ffffff",
                                    color: "#334155",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 4,
                                }}
                                onClick={(e) => handleOpenAdoptModal(node, e)}
                            >
                                <Plus size={11} /> Adopt Disciple ({node.disciples.length}/3)
                            </button>
                        ) : (
                            <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center", width: "100%", padding: "2px 0" }}>
                                Full Capacity (3/3 Disciples)
                            </div>
                        )}
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
                {hasDisplayedChildren && !isCollapsed && (
                    <>
                        <div className="dt-branch-connector-down" />
                        <div
                            className={`dt-children-container ${
                                isSeniorPastor && treeLayoutMode === "FIT_GRID" ? "fit-grid-mode" : ""
                            } ${displayedChildren.length === 1 ? "single-child" : ""}`}
                        >
                            {displayedChildren.map((child) => (
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

    // Helper for Flow View: Leader Card with 3-Slot Discipleship Grid
    const renderFlowLeaderCard = (leader: DiscipleshipMemberNode) => {
        const isSelected = selectedMember?.memberId === leader.memberId;
        const cat = leader.leaderCategory || "OTHER";
        const avatarGradient =
            cat === "PASTOR"
                ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                : cat === "ADULT"
                ? "linear-gradient(135deg, #7e22ce, #9333ea)"
                : "linear-gradient(135deg, #ea580c, #c2410c)";
        const icon = cat === "PASTOR" ? "⭐" : cat === "ADULT" ? "🌟" : "🔥";
        const roleClass = cat === "PASTOR" ? "pastor" : cat === "ADULT" ? "adult" : cat === "YOUTH" ? "youth" : "other";

        // Filter check
        const matchesSearch =
            !searchQuery ||
            leader.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (leader.ministry || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            leader.disciples.some((d) => d.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesHealth = healthFilter === "ALL" || leader.health === healthFilter;
        if (!matchesSearch || !matchesHealth) return null;

        // Build array of 3 slots (1 leader for 3 persons only)
        const slots = [0, 1, 2];

        return (
            <div key={leader.memberId} className={`dt-flow-leader-card health-${leader.health} ${isSelected ? "selected" : ""}`}>
                {/* Top row: Leader profile & actions */}
                <div className="dt-flow-leader-top">
                    <div
                        className="dt-flow-leader-profile"
                        onClick={() => {
                            setSelectedMember(leader);
                            setDrawerTab("PULSE");
                        }}
                    >
                        <div className="dt-flow-leader-avatar" style={{ background: avatarGradient }}>
                            {icon}
                        </div>
                        <div className="dt-flow-leader-name-wrap">
                            <h4>{leader.fullName}</h4>
                            <div className="dt-flow-leader-tags">
                                <span className={`dt-flow-role-pill ${roleClass}`}>
                                    {leader.leaderCategoryLabel || POSITION_DETAILS[leader.position]?.label}
                                </span>
                                <span className="dt-gen-badge">GEN 2 · LEADER</span>
                                <span className={`dt-health-badge ${leader.health}`}>
                                    {leader.health === "HEALTHY" ? "🟢 Healthy" : leader.health === "ATTENTION" ? "🟡 Attention" : "🔴 At-Risk"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats & Pastoral Controls */}
                    <div className="dt-flow-leader-stats">
                        <div className={`dt-capacity-meter ${leader.disciples.length >= MAX_DISCIPLES_PER_LEADER ? "full" : ""}`}>
                            <Users size={12} />
                            <span>{leader.disciples.length}/{MAX_DISCIPLES_PER_LEADER} Disciples</span>
                        </div>
                        <div className="dt-spiritual-stat">
                            <span>📖 {leader.pulse?.wordDaysWeekly || 5}d Word</span>
                            <span>🙏 {leader.pulse?.prayerDaysWeekly || 6}d Prayer</span>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#047857", background: "#d1fae5", padding: "4px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}>
                            <span>🟢 {leader.attendanceRate || 95}% Attendance</span>
                            <span style={{ color: "#94a3b8" }}>·</span>
                            <span>{leader.attendedSundaysCount || 11} Sundays</span>
                        </div>

                        <div className="dt-flow-leader-actions" onClick={(e) => e.stopPropagation()}>
                            {leader.phone && (
                                <a href={`tel:${leader.phone}`} className="dt-flow-btn secondary" title={`Call ${leader.fullName}`}>
                                    <Phone size={12} /> Call
                                </a>
                            )}
                            <a
                                href="https://m.me/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="dt-flow-btn primary"
                                title="Chat via Facebook Messenger"
                            >
                                <MessageCircle size={12} /> Messenger
                            </a>
                            <button
                                type="button"
                                className="dt-flow-btn secondary"
                                onClick={() => {
                                    setSelectedMember(leader);
                                    setEncounterModalOpen(true);
                                }}
                                title="Log 1-on-1 Discipleship Encounter"
                            >
                                <Calendar size={12} /> Log Meeting
                            </button>
                            {leader.disciples.length < MAX_DISCIPLES_PER_LEADER && (
                                <button
                                    type="button"
                                    className="dt-flow-btn purple"
                                    onClick={(e) => handleOpenAdoptModal(leader, e)}
                                >
                                    <Plus size={12} /> Adopt Disciple
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Accountable Disciples Box (Strict 1:3 model) */}
                <div className="dt-flow-disciples-box">
                    <div className="dt-flow-disciples-header">
                        <span>
                            <Users size={12} /> Accountable Disciples ({leader.disciples.length}/{MAX_DISCIPLES_PER_LEADER} Limit · No Duplication)
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: leader.disciples.length === 3 ? "#059669" : "#64748b" }}>
                            {leader.disciples.length === 3 ? "✅ Full 1:3 Multiplication Capacity" : `🌱 ${3 - leader.disciples.length} Available Discipleship Slot(s)`}
                        </span>
                    </div>

                    <div className="dt-flow-disciples-grid">
                        {slots.map((idx) => {
                            const disciple = leader.disciples[idx];
                            if (disciple) {
                                return (
                                    <div
                                        key={disciple.memberId}
                                        className={`dt-flow-disciple-card health-${disciple.health}`}
                                        onClick={() => {
                                            setSelectedMember(disciple);
                                            setDrawerTab("PULSE");
                                        }}
                                        title="Click to view disciple pulse & devotions"
                                    >
                                        <div className="dt-flow-disciple-top">
                                            <div className="dt-flow-disciple-avatar">
                                                {disciple.fullName.charAt(0)}
                                            </div>
                                            <div className="dt-flow-disciple-meta">
                                                <strong title={disciple.fullName}>{disciple.fullName}</strong>
                                                <small>{disciple.ministryRole || disciple.ministry || "General Ministry"} · Gen {disciple.generation}</small>
                                            </div>
                                        </div>
                                        <div className="dt-flow-disciple-footer">
                                            <span>📖 {disciple.pulse?.wordDaysWeekly || 5}d · 🙏 {disciple.pulse?.prayerDaysWeekly || 6}d</span>
                                            <span style={{ fontSize: 10, color: "#047857", fontWeight: 700, background: "#ecfdf5", padding: "1px 5px", borderRadius: 4 }}>
                                                🟢 {disciple.attendanceRate || 92}% Att.
                                            </span>
                                            <span className={`dt-health-badge ${disciple.health}`} style={{ fontSize: 10, padding: "2px 6px" }}>
                                                {disciple.health === "HEALTHY" ? "🟢 Healthy" : disciple.health === "ATTENTION" ? "🟡 Attention" : "🔴 At-Risk"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            } else {
                                return (
                                    <div
                                        key={`slot-${idx}`}
                                        className="dt-flow-disciple-empty clickable"
                                        onClick={(e) => handleOpenAdoptModal(leader, e)}
                                        title="Assign real church member to this disciple slot"
                                    >
                                        <Plus size={16} />
                                        <span>+ Assign Disciple (Slot {idx + 1}/3)</span>
                                    </div>
                                );
                            }
                        })}
                    </div>
                </div>
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
                            Full Lineage Growth, Pastoral Shepherding & Intentional Multiplication Control
                        </div>
                    </div>
                </div>

                <div className="dt-header-actions">
                    <button type="button" className="dt-btn dt-btn-secondary" onClick={handleFreshSync} title="Sync real church database">
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        Sync Real Data
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
                        Delegate EPIC Leader (Admin)
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
                        <strong>Admin Apostolic Oversight</strong>
                        <span>Delegates All Pastors & Leaders Without Limits</span>
                    </div>
                    <div className="dt-pill-rule">
                        <strong>All Leaders Under Overseer</strong>
                        <span>Assistant Pastors, Adult Leaders & Youth Leaders</span>
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
                        placeholder="Search real leader or disciple name..."
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
                        className={`dt-toggle-btn ${viewMode === "FLOW" ? "active" : ""}`}
                        onClick={() => setViewMode("FLOW")}
                        title="Vertical Discipleship Lineage Flow (Recommended - Natural vertical scrolling)"
                    >
                        <Workflow size={14} />
                        Discipleship Flow
                    </button>
                    <button
                        type="button"
                        className={`dt-toggle-btn ${viewMode === "TREE" ? "active" : ""}`}
                        onClick={() => setViewMode("TREE")}
                        title="Interactive visual branch tree with full zoom & pan"
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
                <div
                    ref={treeContainerRef}
                    className={`dt-tree-container ${isPanning ? "is-panning" : ""}`}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                >
                    {/* Canvas Toolbar: Department Pills & Zoom Controls */}
                    {treeRoot && (
                        <div className="dt-canvas-toolbar" onClick={(e) => e.stopPropagation()}>
                            <div className="dt-canvas-pills">
                                <button
                                    type="button"
                                    className={`dt-cat-pill ${selectedCategory === "ALL" ? "active" : ""}`}
                                    onClick={() => setSelectedCategory("ALL")}
                                >
                                    🌟 All Branch Leaders ({treeRoot.disciples.length})
                                </button>
                                <button
                                    type="button"
                                    className={`dt-cat-pill pastor ${selectedCategory === "PASTOR" ? "active" : ""}`}
                                    onClick={() => setSelectedCategory("PASTOR")}
                                >
                                    ⭐ Assistant Pastors ({asstPastors.length})
                                </button>
                                <button
                                    type="button"
                                    className={`dt-cat-pill adult ${selectedCategory === "ADULT" ? "active" : ""}`}
                                    onClick={() => setSelectedCategory("ADULT")}
                                >
                                    🌟 Adult Leaders ({adultLeaders.length})
                                </button>
                                <button
                                    type="button"
                                    className={`dt-cat-pill youth ${selectedCategory === "YOUTH" ? "active" : ""}`}
                                    onClick={() => setSelectedCategory("YOUTH")}
                                >
                                    🔥 Youth Leaders ({youthLeaders.length})
                                </button>
                            </div>

                            <div className="dt-zoom-controls">
                                {/* Layout Switcher */}
                                <div className="dt-layout-mode-group">
                                    <button
                                        type="button"
                                        className={`dt-layout-btn ${treeLayoutMode === "FIT_GRID" ? "active" : ""}`}
                                        onClick={() => {
                                            setTreeLayoutMode("FIT_GRID");
                                            setPanPosition({ x: 0, y: 0 });
                                            setZoomLevel(0.95);
                                        }}
                                        title="Fit to View All: Multi-row responsive layout so all 17 leaders fit on your screen"
                                    >
                                        <LayoutGrid size={13} /> Fit All (Multi-Row)
                                    </button>
                                    <button
                                        type="button"
                                        className={`dt-layout-btn ${treeLayoutMode === "LINEAR" ? "active" : ""}`}
                                        onClick={() => {
                                            setTreeLayoutMode("LINEAR");
                                            setPanPosition({ x: 0, y: 0 });
                                            setTimeout(handleFitScreen, 60);
                                        }}
                                        title="Linear Branch: Single horizontal branch line with pan and zoom"
                                    >
                                        <MoveHorizontal size={13} /> Linear Branch
                                    </button>
                                </div>

                                {/* Compact Toggle */}
                                <button
                                    type="button"
                                    className={`dt-zoom-btn ${cardDensity === "COMPACT" ? "active" : ""}`}
                                    onClick={() => setCardDensity((d) => (d === "NORMAL" ? "COMPACT" : "NORMAL"))}
                                    title={cardDensity === "NORMAL" ? "Switch to Compact Cards (230px)" : "Switch to Full Cards (280px)"}
                                >
                                    {cardDensity === "NORMAL" ? "🗜 Compact" : "🗖 Full Size"}
                                </button>

                                {/* Zoom Controls */}
                                <button
                                    type="button"
                                    className="dt-zoom-btn"
                                    onClick={() => setZoomLevel((z) => Math.max(0.18, Number((z - 0.1).toFixed(2))))}
                                    title="Zoom Out"
                                >
                                    <ZoomOut size={14} />
                                </button>
                                <span className="dt-zoom-level-text">{Math.round(zoomLevel * 100)}%</span>
                                <button
                                    type="button"
                                    className="dt-zoom-btn"
                                    onClick={() => setZoomLevel((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
                                    title="Zoom In"
                                >
                                    <ZoomIn size={14} />
                                </button>
                                <button
                                    type="button"
                                    className="dt-zoom-btn dt-zoom-fit"
                                    onClick={handleFitScreen}
                                    title="Auto-calculate zoom scale so all leaders fit on screen with 0 clipping"
                                >
                                    <Maximize2 size={13} /> Fit Screen
                                </button>
                                <button
                                    type="button"
                                    className="dt-zoom-btn"
                                    onClick={() => {
                                        setZoomLevel(1);
                                        setPanPosition({ x: 0, y: 0 });
                                    }}
                                    title="Reset 100%"
                                >
                                    <RotateCcw size={13} />
                                </button>
                                <button
                                    type="button"
                                    className={`dt-zoom-btn dt-collapse-all-btn ${areAllDisciplesCollapsed ? "active" : ""}`}
                                    onClick={toggleCollapseAllDisciples}
                                    title="Collapse all Gen 3 disciples into Gen 2 leaders for full overview"
                                >
                                    {areAllDisciplesCollapsed ? "📂 Expand Disciples" : "📁 Collapse Disciples (Leaders Only)"}
                                </button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "80px 0", color: "#64748b" }}>
                            <RefreshCw size={32} className="animate-spin" style={{ margin: "0 auto 12px" }} />
                            <div>Fetching real Leaders & Lineage Tree from church database...</div>
                        </div>
                    ) : treeRoot ? (
                        <div
                            ref={treeWrapperRef}
                            className={`dt-tree-wrapper ${cardDensity === "COMPACT" ? "compact-density" : ""}`}
                            style={{
                                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
                                transformOrigin: "top center",
                                transition: isPanning ? "none" : "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                            }}
                        >
                            {renderTreeNode(treeRoot)}
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
                            No discipleship lineage records found.
                        </div>
                    )}
                </div>
            )}

            {/* VIEW MODE: VERTICAL DISCIPLESHIP FLOW PIPELINE */}
            {viewMode === "FLOW" && treeRoot && (
                <div className="dt-flow-container">
                    {/* Overseer Hero Card */}
                    <div className="dt-flow-overseer-card">
                        <div className="dt-flow-overseer-top">
                            <div className="dt-flow-overseer-profile">
                                <div className="dt-flow-overseer-avatar">👑</div>
                                <div className="dt-flow-overseer-info">
                                    <span className="dt-flow-overseer-badge">GEN 1 · APOSTOLIC OVERSEER</span>
                                    <h2>{treeRoot.fullName}</h2>
                                    <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 600 }}>
                                        EPIC Senior Pastor & Head of Lineage
                                    </div>
                                </div>
                            </div>

                            <div className="dt-flow-overseer-actions">
                                <button
                                    type="button"
                                    className="dt-flow-btn-gold"
                                    onClick={(e) => handleOpenAdoptModal(treeRoot, e)}
                                    title="Senior Pastor / Admin can delegate any leader without 1:3 limit"
                                >
                                    <Plus size={15} />
                                    + Delegate Real EPIC Leader (Admin · Unlimited)
                                </button>
                                <button
                                    type="button"
                                    className="dt-flow-btn-trans"
                                    onClick={() => {
                                        setSelectedMember(treeRoot);
                                        setDrawerTab("PULSE");
                                    }}
                                >
                                    <ShieldCheck size={14} />
                                    Overseer Profile
                                </button>
                                <button
                                    type="button"
                                    className="dt-flow-btn-trans"
                                    onClick={handleFreshSync}
                                >
                                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                                    Pastoral Sync
                                </button>
                            </div>
                        </div>

                        <div className="dt-flow-overseer-metrics">
                            <div className="dt-flow-metric-item">
                                <div className="dt-flow-metric-label">Delegated Branch Leaders</div>
                                <div className="dt-flow-metric-val">👑 {treeRoot.disciples.length} Active Leaders</div>
                            </div>
                            <div className="dt-flow-metric-item">
                                <div className="dt-flow-metric-label">Assistant Pastors Stream</div>
                                <div className="dt-flow-metric-val">⭐ {asstPastors.length} Pastors</div>
                            </div>
                            <div className="dt-flow-metric-item">
                                <div className="dt-flow-metric-label">Adult Leaders Stream</div>
                                <div className="dt-flow-metric-val">🌟 {adultLeaders.length} Leaders</div>
                            </div>
                            <div className="dt-flow-metric-item">
                                <div className="dt-flow-metric-label">Youth Leaders Stream</div>
                                <div className="dt-flow-metric-val">🔥 {youthLeaders.length} Leaders</div>
                            </div>
                            <div className="dt-flow-metric-item">
                                <div className="dt-flow-metric-label">Discipleship Lineage Health</div>
                                <div className="dt-flow-metric-val">
                                    🟢 {stats.total > 0 ? Math.round((stats.healthy / stats.total) * 100) : 100}% Active
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Downward Flow Connector Pipe */}
                    <div className="dt-flow-pipe">
                        <div className="dt-flow-pipe-line" />
                        <div className="dt-flow-pipe-pill">
                            <Workflow size={13} />
                            ↓ Lineage Discipleship Multiplication Stream (1 Leader : 3 Accountable Disciples)
                        </div>
                        <div className="dt-flow-pipe-line" />
                    </div>

                    {/* Stream Selector Bar */}
                    <div className="dt-flow-stream-bar">
                        <button
                            type="button"
                            className={`dt-flow-stream-pill ${selectedCategory === "ALL" ? "active" : ""}`}
                            onClick={() => setSelectedCategory("ALL")}
                        >
                            🌊 All Lineage Streams ({treeRoot.disciples.length} Leaders)
                        </button>
                        <button
                            type="button"
                            className={`dt-flow-stream-pill pastor ${selectedCategory === "PASTOR" ? "active" : ""}`}
                            onClick={() => setSelectedCategory("PASTOR")}
                        >
                            ⭐ EPIC Assistant Pastors ({asstPastors.length})
                        </button>
                        <button
                            type="button"
                            className={`dt-flow-stream-pill adult ${selectedCategory === "ADULT" ? "active" : ""}`}
                            onClick={() => setSelectedCategory("ADULT")}
                        >
                            🌟 EPIC Adult Leaders ({adultLeaders.length})
                        </button>
                        <button
                            type="button"
                            className={`dt-flow-stream-pill youth ${selectedCategory === "YOUTH" ? "active" : ""}`}
                            onClick={() => setSelectedCategory("YOUTH")}
                        >
                            🔥 EPIC Youth Leaders ({youthLeaders.length})
                        </button>
                    </div>

                    {/* Streams Rendering */}
                    {(selectedCategory === "ALL" || selectedCategory === "PASTOR") && asstPastors.length > 0 && (
                        <div className="dt-flow-stream-section">
                            <div className="dt-flow-stream-header pastor">
                                <div className="dt-flow-stream-title">
                                    <div className="dt-flow-stream-icon">⭐</div>
                                    <div>
                                        <h3>EPIC Assistant Pastors Stream ({asstPastors.length} Delegated Pastors)</h3>
                                        <span style={{ fontSize: 12, color: "#64748b" }}>
                                            Direct pastoral delegation under Senior Pastor Ronnel M. Aviguetero · Shepherding accountable disciples
                                        </span>
                                    </div>
                                </div>
                                <span className="dt-flow-role-pill pastor">1st Gen Pastoral Overseers</span>
                            </div>
                            <div className="dt-flow-leaders-list">
                                {asstPastors.map((leader) => renderFlowLeaderCard(leader))}
                            </div>
                        </div>
                    )}

                    {(selectedCategory === "ALL" || selectedCategory === "ADULT") && adultLeaders.length > 0 && (
                        <div className="dt-flow-stream-section">
                            <div className="dt-flow-stream-header adult">
                                <div className="dt-flow-stream-title">
                                    <div className="dt-flow-stream-icon">🌟</div>
                                    <div>
                                        <h3>EPIC Adult Leaders Stream ({adultLeaders.length} Delegated Leaders)</h3>
                                        <span style={{ fontSize: 12, color: "#64748b" }}>
                                            Adult cell group & family life discipleship streams · Intentional 1:3 multiplication
                                        </span>
                                    </div>
                                </div>
                                <span className="dt-flow-role-pill adult">Adult Ministries</span>
                            </div>
                            <div className="dt-flow-leaders-list">
                                {adultLeaders.map((leader) => renderFlowLeaderCard(leader))}
                            </div>
                        </div>
                    )}

                    {(selectedCategory === "ALL" || selectedCategory === "YOUTH") && youthLeaders.length > 0 && (
                        <div className="dt-flow-stream-section">
                            <div className="dt-flow-stream-header youth">
                                <div className="dt-flow-stream-title">
                                    <div className="dt-flow-stream-icon">🔥</div>
                                    <div>
                                        <h3>EPIC Youth Leaders Stream ({youthLeaders.length} Delegated Leaders)</h3>
                                        <span style={{ fontSize: 12, color: "#64748b" }}>
                                            Campus, youth & young adults generation discipleship movement
                                        </span>
                                    </div>
                                </div>
                                <span className="dt-flow-role-pill youth">Youth Ministries</span>
                            </div>
                            <div className="dt-flow-leaders-list">
                                {youthLeaders.map((leader) => renderFlowLeaderCard(leader))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* VIEW MODE 3: GENERATIONS MATRIX */}
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
                                        {gen === 2 && "⭐ Generation 2: Assistant Pastors, Adult Leaders & Youth Leaders"}
                                        {gen === 3 && "🏛️ Generation 3: Multiplying Cell Leaders & Accountable Disciples"}
                                        {gen === 4 && "🔥 Generation 4: EPIC Disciplers"}
                                        {gen >= 5 && `🌱 Generation ${gen}: Multiplying Disciples`}
                                    </h3>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                                        {genMembers.length} Real Members
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
                                                    <span className="dt-gen-badge">
                                                        {member.generation === 2 ? "GEN 2 · LEADER" : `GEN ${member.generation}`}
                                                    </span>
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
                                                            {member.leaderCategoryLabel || pos.label}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="dt-node-footer">
                                                    <span>Mentoring: {member.disciples.length}/3</span>
                                                    <span>Word: {member.pulse?.wordDaysWeekly || 5}d/wk</span>
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

            {/* VIEW MODE 4: SHEPHERD CARE RADAR */}
            {viewMode === "RADAR" && (
                <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
                    <div style={{ marginBottom: 18 }}>
                        <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                            Pastoral Shepherd Care Radar
                        </h2>
                        <div style={{ fontSize: 13, color: "#64748b" }}>
                            Real-time intervention radar for assistant pastors, adult leaders, youth leaders, and disciples.
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

                                    <div style={{ fontSize: 12, color: "#475569", marginBottom: 12 }}>
                                        <strong>Assigned Shepherd:</strong> {disciple.parentLeaderName || "Senior Pastoral Team"}
                                    </div>

                                    <div style={{ background: "#ffffff", borderRadius: 8, padding: 10, fontSize: 12, color: "#334155", marginBottom: 12 }}>
                                        <strong>Prayer Request:</strong> "{disciple.pulse?.prayerNeed || "Seeking breakthrough and spiritual replenishment."}"
                                    </div>

                                    <div style={{ display: "flex", gap: 8 }}>
                                        <a
                                            href={`tel:${disciple.phone}`}
                                            className="dt-btn dt-btn-secondary"
                                            style={{ flex: 1, textDecoration: "none", justifyContent: "center" }}
                                        >
                                            <Phone size={13} /> Call Disciple
                                        </a>
                                        <a
                                            href={disciple.messengerUrl || "#"}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="dt-btn dt-btn-primary"
                                            style={{ flex: 1, textDecoration: "none", justifyContent: "center" }}
                                        >
                                            <MessageCircle size={13} /> Messenger
                                        </a>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* =========================================================
                AUDIT DRAWER: MEMBER WALK & SHEPHERDING
               ========================================================= */}
            {selectedMember && (
                <div className="dt-modal-backdrop" onClick={() => setSelectedMember(null)}>
                    <div className="dt-drawer" onClick={(e) => e.stopPropagation()}>
                        {/* Drawer Header */}
                        <div className="dt-drawer-header">
                            <div className="dt-drawer-profile">
                                <div className="dt-drawer-avatar">
                                    {selectedMember.fullName.charAt(0)}
                                </div>
                                <div>
                                    <h2>{selectedMember.fullName}</h2>
                                    <div className="dt-drawer-subtitle">
                                        {selectedMember.leaderCategoryLabel || POSITION_DETAILS[selectedMember.position]?.label} · Gen {selectedMember.generation}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="dt-close-btn"
                                onClick={() => setSelectedMember(null)}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Pastoral Multi-Channel Direct Contact Bar */}
                        <div className="dt-drawer-contact-bar">
                            <a
                                href={`tel:${selectedMember.phone || "+639171234567"}`}
                                className="dt-contact-btn phone"
                                title="Call directly via Mobile"
                            >
                                <Phone size={14} /> Call Leader
                            </a>
                            <a
                                href={selectedMember.messengerUrl || "https://m.me"}
                                target="_blank"
                                rel="noreferrer"
                                className="dt-contact-btn messenger"
                                title="Open FB Messenger chat"
                            >
                                <MessageCircle size={14} /> FB Messenger
                            </a>
                        </div>

                        {/* Drawer Tabs */}
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
                                            "{selectedMember.pulse?.prayerNeed || "Trusting God for supernatural fruitfulness and intentional discipleship multiplication."}"
                                        </div>
                                    </div>

                                    <div className="dt-card-box">
                                        <h3>
                                            <CheckCircle2 size={16} color="#059669" />
                                            Sunday Service Attendance Consistency
                                        </h3>
                                        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
                                            <span style={{ fontSize: 24, fontWeight: 800, color: "#047857" }}>
                                                {selectedMember.attendanceRate || 95}%
                                            </span>
                                            <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
                                                Attendance Consistency
                                            </span>
                                        </div>
                                        <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
                                            <div
                                                style={{
                                                    height: "100%",
                                                    width: `${selectedMember.attendanceRate || 95}%`,
                                                    background: "#059669",
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, color: "#334155" }}>
                                            <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                                                <strong>Attended Services:</strong> {selectedMember.attendedSundaysCount || 11} Sundays
                                            </div>
                                            <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                                                <strong>Missed Sundays:</strong> {selectedMember.missedSundaysCount || 0}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="dt-card-box">
                                        <h3>
                                            <Shield size={16} color="#7c3aed" />
                                            Ministry Commitments & Faithfulness
                                        </h3>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                                            Department: {selectedMember.ministry || "Active Church Ministry"}
                                        </div>
                                        <div style={{ fontSize: 13, color: "#475569", marginBottom: 10 }}>
                                            Assigned Role: <strong>{selectedMember.ministryRole || "Core Ministry Leader / Servant"}</strong>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#faf5ff", padding: "8px 12px", borderRadius: 8, border: "1px solid #e9d5ff" }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: "#6b21a8" }}>
                                                Commitment Rating:
                                            </span>
                                            <span style={{ fontSize: 14, fontWeight: 800, color: "#7e22ce" }}>
                                                {"⭐".repeat(selectedMember.ministryCommitmentRating || 5)} ({selectedMember.ministryCommitmentRating || 5}/5.0)
                                            </span>
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
                                                <span>{selectedMember.pulse?.wordDaysWeekly || 5} of 7 days</span>
                                            </div>
                                            <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                                                <div
                                                    style={{
                                                        height: "100%",
                                                        width: `${((selectedMember.pulse?.wordDaysWeekly || 5) / 7) * 100}%`,
                                                        background: "#2563eb",
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: 14 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                                                <span>Personal Prayer Consistency</span>
                                                <span>{selectedMember.pulse?.prayerDaysWeekly || 6} of 7 days</span>
                                            </div>
                                            <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                                                <div
                                                    style={{
                                                        height: "100%",
                                                        width: `${((selectedMember.pulse?.prayerDaysWeekly || 6) / 7) * 100}%`,
                                                        background: "#10b981",
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ fontSize: 13, color: "#64748b" }}>
                                            <div>
                                                <strong>Sunday Service Attendance:</strong> Active · Faithful streak
                                            </div>
                                            <div style={{ marginTop: 4 }}>
                                                <strong>Last 1-on-1 Discipleship Meeting:</strong> {selectedMember.lastEncounterDaysAgo} days ago
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
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                                    <span className="dt-soap-verse">📖 {dev.passage}</span>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                        <span style={{ fontSize: 10, background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                                                            ☁️ EPIC Mobile
                                                        </span>
                                                        <span style={{ fontSize: 11, color: "#64748b" }}>{dev.date}</span>
                                                    </div>
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
                                <label>Select Real Church Member</label>
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
                MODAL 2: ADOPT / DELEGATE REAL LEADER OR DISCIPLE
               ========================================================= */}
            {adoptModalOpen && (
                <div className="dt-center-modal-backdrop" onClick={() => setAdoptModalOpen(false)}>
                    <div className="dt-center-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dt-cm-header">
                            <h2>
                                {targetLeaderId === 0 || (treeRoot && targetLeaderId === treeRoot.memberId)
                                    ? "👑 Delegate Real EPIC Leader (Admin Authority - Unlimited)"
                                    : "Adopt / Assign Accountable Disciple"}
                            </h2>
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

                            {targetLeaderId === 0 || (treeRoot && targetLeaderId === treeRoot.memberId) ? (
                                <div className="dt-alert-box" style={{ background: "#f5f3ff", borderColor: "#d8b4fe", color: "#581c87" }}>
                                    <ShieldCheck size={18} color="#7c3aed" />
                                    <div>
                                        <strong>👑 Apostolic Authority:</strong> As Church Overseer / Senior Pastor, you have full authority to delegate all Assistant Pastors, Adult Leaders, and Youth Leaders without limits. This rule applies to the Admin account only.
                                    </div>
                                </div>
                            ) : (
                                <div className="dt-alert-box">
                                    <Users size={18} color="#b45309" />
                                    <div>
                                        <strong>Strict 1:3 Multiplication Policy:</strong> Maximum 3 disciples per leader for deep intentional care and no duplicated members across branches.
                                    </div>
                                </div>
                            )}

                            <div className="dt-form-group">
                                <label>Assigned Spiritual Leader</label>
                                <select
                                    value={targetLeaderId !== null ? targetLeaderId : ""}
                                    onChange={(e) => {
                                        setTargetLeaderId(Number(e.target.value));
                                        setAdoptError(null);
                                    }}
                                >
                                    {flattenedNodes.map((leader) => (
                                        <option key={leader.memberId} value={leader.memberId}>
                                            {leader.memberId === (treeRoot?.memberId || 0)
                                                ? `👑 ${leader.fullName} (Senior Pastor Overseer · Unlimited Delegation)`
                                                : `${leader.fullName} (${leader.disciples.length}/${MAX_DISCIPLES_PER_LEADER} Disciples) · ${leader.leaderCategoryLabel || POSITION_DETAILS[leader.position]?.label}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="dt-form-group">
                                <label>
                                    {targetLeaderId === 0 || (treeRoot && targetLeaderId === treeRoot.memberId)
                                        ? "Choose Real Church Member to Delegate as Leader"
                                        : "Choose Real Disciple from Church Directory"}
                                </label>
                                <select
                                    value={selectedDiscipleId || ""}
                                    onChange={(e) => {
                                        setSelectedDiscipleId(Number(e.target.value));
                                        setAdoptError(null);
                                    }}
                                >
                                    <option value="">-- Select Member from Church Directory --</option>
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
                                className={`dt-btn ${targetLeaderId === 0 || (treeRoot && targetLeaderId === treeRoot.memberId) ? "dt-btn-purple" : "dt-btn-primary"}`}
                                onClick={handleSaveAdopt}
                                disabled={targetLeaderId === null || !selectedDiscipleId}
                            >
                                {targetLeaderId === 0 || (treeRoot && targetLeaderId === treeRoot.memberId)
                                    ? "Confirm & Delegate EPIC Leader"
                                    : "Adopt Disciple to Branch"}
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
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                <div className="dt-drawer-avatar">{selectedMember.fullName.charAt(0)}</div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{selectedMember.fullName}</h3>
                                    <div style={{ fontSize: 12, color: "#64748b" }}>
                                        {selectedMember.leaderCategoryLabel || POSITION_DETAILS[selectedMember.position]?.label}
                                    </div>
                                </div>
                            </div>

                            <div className="dt-form-group">
                                <label>Meeting Fellowship Type</label>
                                <select
                                    value={encounterMeetingType}
                                    onChange={(e) => setEncounterMeetingType(e.target.value as any)}
                                >
                                    <option value="COFFEE">☕ Coffee & Conversation</option>
                                    <option value="CHURCH_FELLOWSHIP">⛪ After Sunday Service Fellowship</option>
                                    <option value="CALL">📞 Voice / Video Call Shepherding</option>
                                    <option value="HOME_VISIT">🏡 Home Visit & Family Prayer</option>
                                </select>
                            </div>

                            <div className="dt-form-group">
                                <label>Scripture Focus Reference</label>
                                <input
                                    type="text"
                                    value={encounterScripture}
                                    onChange={(e) => setEncounterScripture(e.target.value)}
                                    placeholder="e.g. Proverbs 3:5-6, John 15:5"
                                />
                            </div>

                            <div className="dt-form-group">
                                <label>Action Step & Practical Commitment</label>
                                <input
                                    type="text"
                                    value={encounterCommitment}
                                    onChange={(e) => setEncounterCommitment(e.target.value)}
                                    placeholder="e.g. Commit to daily SOAP devotions and cell group attendance"
                                />
                            </div>

                            <div className="dt-form-group">
                                <label>Private Pastoral Note (Confidential)</label>
                                <textarea
                                    rows={3}
                                    value={encounterNote}
                                    onChange={(e) => setEncounterNote(e.target.value)}
                                    placeholder="Confidential notes on disciple's heart, breakthroughs, or counsel..."
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
                                Save Encounter Log
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
