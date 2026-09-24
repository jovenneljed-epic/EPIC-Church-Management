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

type ActiveTab =
    | "delegation"
    | "members"
    | "visitors-lifecycle"
    | "members-lifecycle"
    | "pipeline"
    | "followup"
    | "discipleship"
    | "sending"
    | "evangelism";

interface ChurchInActionPageProps {
    onBack?: () => void;
    canManage?: boolean;
    onNavigate?: (page: string) => void;
}

// ------------------------------------------------------------
// LEADER ROLE DESIGNATION HELPER
// Separates ordained pastors and leaders from general members
// ------------------------------------------------------------
function getLeaderRoleTag(ministry: string = ""): { tag: "pastor" | "adult" | "youth" | "other" | "member"; label: string; icon: string } {
    const min = (ministry || "").toUpperCase().trim();
    if (min.includes("PASTOR")) {
        return { tag: "pastor", label: "Assistant Pastor", icon: "👑" };
    }
    if (min.includes("ADULT") && min.includes("LEADER")) {
        return { tag: "adult", label: "Adult Leader", icon: "🌟" };
    }
    if (min.includes("YOUTH") && min.includes("LEADER")) {
        return { tag: "youth", label: "Youth Leader", icon: "🔥" };
    }
    if (min.includes("FUTURE") && min.includes("LEADER")) {
        return { tag: "youth", label: "Youth Leader", icon: "🔥" };
    }
    if (min.includes("LEADER") || min.includes("MINISTER") || min.includes("COORDINATOR")) {
        return { tag: "other", label: "Church Leader", icon: "⚡" };
    }
    return { tag: "member", label: "Member", icon: "👤" };
}

// ------------------------------------------------------------
// MEMBER DEPARTMENT CLASSIFICATION HELPER
// Categorizes congregation into official church departments
// ------------------------------------------------------------
function getMemberDepartment(ministry: string = ""): {
    deptKey: "pastoral" | "adult" | "youth" | "children" | "worship" | "general";
    name: string;
    icon: string;
    badgeClass: string;
} {
    const min = (ministry || "").toUpperCase().trim();
    if (min.includes("PASTOR")) {
        return { deptKey: "pastoral", name: "Pastoral Staff", icon: "👑", badgeClass: "pastor" };
    }
    if (min.includes("ADULT")) {
        return { deptKey: "adult", name: "Adult Department", icon: "🌟", badgeClass: "adult" };
    }
    if (min.includes("YOUTH") || min.includes("FUTURE")) {
        return { deptKey: "youth", name: "Youth Department", icon: "🔥", badgeClass: "youth" };
    }
    if (min.includes("CHILDREN") || min.includes("KIDS") || min.includes("SUNDAY SCHOOL")) {
        return { deptKey: "children", name: "Children's Ministry", icon: "👶", badgeClass: "children" };
    }
    if (min.includes("WORSHIP") || min.includes("MUSIC") || min.includes("BAND")) {
        return { deptKey: "worship", name: "Worship & Music Team", icon: "🎵", badgeClass: "worship" };
    }
    return { deptKey: "general", name: ministry?.trim() || "General Congregation", icon: "👥", badgeClass: "general" };
}

const ChurchInActionPage: React.FC<ChurchInActionPageProps> = ({
    onBack,
    canManage = true,
    onNavigate,
}) => {
    // ============================================================
    // STATE
    // ============================================================

    const [activeTab, setActiveTab] = useState<ActiveTab>("delegation");
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [leaderFilter, setLeaderFilter] = useState<string>("ALL");
    const [leaderCategoryTab, setLeaderCategoryTab] = useState<"ALL" | "PASTOR" | "ADULT" | "YOUTH" | "OTHER">("ALL");

    // Church Members & Departments View State
    const [memberSearchTerm, setMemberSearchTerm] = useState<string>("");
    const [memberDeptFilter, setMemberDeptFilter] = useState<string>("ALL");
    const [memberRoleFilter, setMemberRoleFilter] = useState<"ALL" | "LEADERS" | "MEMBERS">("ALL");

    // Separate Lifecycle Monitoring State
    const [activeLifecycleTab, setActiveLifecycleTab] = useState<"visitors" | "members">("visitors");

    const handleNavigatePage = useCallback((page: string) => {
        if (onNavigate) {
            onNavigate(page);
        } else {
            const pageRouteMap: Record<string, string> = {
                members: "/members",
                visitors: "/visitors",
                attendance: "/attendance",
                dashboard: "/dashboard",
                services: "/services",
                ministries: "/cms/ministries",
                events: "/cms/events",
                giving: "/cms/giving",
                income: "/income",
                expenses: "/expenses",
                settings: "/settings",
            };
            const target = pageRouteMap[page] || (page.startsWith("/") ? page : `/${page}`);
            window.location.href = target;
        }
    }, [onNavigate]);

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
    // QUALIFIED DELEGABLE LEADERS ONLY
    // Separates ordained pastors and leaders from general members
    // ============================================================

    const realLeaders = useMemo(() => {
        return realMembers.filter((m) => {
            const minUpper = (m.ministry || "").toUpperCase().trim();
            const roleUpper = (m.role || "").toUpperCase().trim();
            const posUpper = (m.position || "").toUpperCase().trim();
            const combined = `${minUpper} ${roleUpper} ${posUpper}`;
            return (
                combined.includes("PASTOR") ||
                combined.includes("LEADER") ||
                combined.includes("MINISTER") ||
                combined.includes("COORDINATOR") ||
                combined.includes("DIRECTOR")
            );
        });
    }, [realMembers]);

    const assistantPastors = useMemo(() => {
        return realLeaders.filter((m) => {
            const minUpper = (m.ministry || "").toUpperCase().trim();
            return minUpper.includes("PASTOR");
        });
    }, [realLeaders]);

    const adultLeaders = useMemo(() => {
        return realLeaders.filter((m) => {
            const minUpper = (m.ministry || "").toUpperCase().trim();
            return !minUpper.includes("PASTOR") && (minUpper.includes("ADULT") || minUpper === "ADULT LEADER");
        });
    }, [realLeaders]);

    const youthLeaders = useMemo(() => {
        return realLeaders.filter((m) => {
            const minUpper = (m.ministry || "").toUpperCase().trim();
            return !minUpper.includes("PASTOR") && (minUpper.includes("YOUTH") || minUpper.includes("FUTURE"));
        });
    }, [realLeaders]);

    const otherLeaders = useMemo(() => {
        return realLeaders.filter((m) => {
            const minUpper = (m.ministry || "").toUpperCase().trim();
            return (
                !minUpper.includes("PASTOR") &&
                !minUpper.includes("ADULT") &&
                !minUpper.includes("YOUTH") &&
                !minUpper.includes("FUTURE")
            );
        });
    }, [realLeaders]);

    const displayedLeaders = useMemo(() => {
        if (leaderCategoryTab === "PASTOR") return assistantPastors;
        if (leaderCategoryTab === "ADULT") return adultLeaders;
        if (leaderCategoryTab === "YOUTH") return youthLeaders;
        if (leaderCategoryTab === "OTHER") return otherLeaders;
        return realLeaders;
    }, [leaderCategoryTab, realLeaders, assistantPastors, adultLeaders, youthLeaders, otherLeaders]);

    const selectedLeader = useMemo(() => {
        if (leaderFilter === "ALL") return null;
        return realLeaders.find((m) => m.memberId === Number(leaderFilter)) || realMembers.find((m) => m.memberId === Number(leaderFilter)) || null;
    }, [leaderFilter, realLeaders, realMembers]);

    // Department members count breakdown
    const departmentCounts = useMemo(() => {
        let pastoral = 0;
        let adult = 0;
        let youth = 0;
        let children = 0;
        let worship = 0;
        let general = 0;

        realMembers.forEach((m) => {
            const dept = getMemberDepartment(m.ministry);
            if (dept.deptKey === "pastoral") pastoral++;
            else if (dept.deptKey === "adult") adult++;
            else if (dept.deptKey === "youth") youth++;
            else if (dept.deptKey === "children") children++;
            else if (dept.deptKey === "worship") worship++;
            else general++;
        });

        return { pastoral, adult, youth, children, worship, general };
    }, [realMembers]);

    // Flock belonging to selected leader or selected category
    const selectedLeaderFlock = useMemo(() => {
        if (selectedLeader) {
            const dept = getMemberDepartment(selectedLeader.ministry);
            const flock = realMembers.filter((m) => getMemberDepartment(m.ministry).deptKey === dept.deptKey);
            return {
                title: `${dept.name} Flock (${flock.length} Total: Leaders & Members)`,
                roleTag: getLeaderRoleTag(selectedLeader.ministry),
                leaderName: selectedLeader.fullName,
                members: flock,
            };
        }

        if (leaderCategoryTab === "ADULT") {
            const flock = realMembers.filter((m) => getMemberDepartment(m.ministry).deptKey === "adult");
            return {
                title: `Adult Department Flock (${flock.length} Total: ${adultLeaders.length} Leaders, ${flock.length - adultLeaders.length} Members)`,
                roleTag: { tag: "adult" as const, label: "Adult Leader", icon: "🌟" },
                leaderName: "Adult Ministry",
                members: flock,
            };
        }

        if (leaderCategoryTab === "YOUTH") {
            const flock = realMembers.filter((m) => getMemberDepartment(m.ministry).deptKey === "youth");
            return {
                title: `Youth Department Flock (${flock.length} Total: ${youthLeaders.length} Leaders, ${flock.length - youthLeaders.length} Members)`,
                roleTag: { tag: "youth" as const, label: "Youth Leader", icon: "🔥" },
                leaderName: "Youth Ministry",
                members: flock,
            };
        }

        if (leaderCategoryTab === "PASTOR") {
            const flock = realMembers.filter((m) => getMemberDepartment(m.ministry).deptKey === "pastoral");
            return {
                title: `Pastoral Staff & Ordained Ministers (${flock.length} Assistant Pastors)`,
                roleTag: { tag: "pastor" as const, label: "Assistant Pastor", icon: "👑" },
                leaderName: "Pastoral Staff",
                members: flock,
            };
        }

        return null;
    }, [selectedLeader, leaderCategoryTab, realMembers, adultLeaders.length, youthLeaders.length]);

    // Filtered Church Members list for Tab 2
    const filteredMembersList = useMemo(() => {
        return realMembers.filter((m) => {
            const fullName = (m.fullName || `${m.firstName || ""} ${m.lastName || ""}`).toLowerCase();
            const code = (m.memberCode || "").toLowerCase();
            const contact = (m.contactNumber || "").toLowerCase();
            const address = (m.address || "").toLowerCase();
            const ministry = (m.ministry || "").toLowerCase();

            const search = memberSearchTerm.toLowerCase();
            const matchesSearch =
                !memberSearchTerm ||
                fullName.includes(search) ||
                code.includes(search) ||
                contact.includes(search) ||
                address.includes(search) ||
                ministry.includes(search);

            const dept = getMemberDepartment(m.ministry);
            let matchesDept = true;
            if (memberDeptFilter !== "ALL") {
                matchesDept = dept.deptKey.toUpperCase() === memberDeptFilter.toUpperCase();
            }

            const roleTag = getLeaderRoleTag(m.ministry);
            let matchesRole = true;
            if (memberRoleFilter === "LEADERS") {
                matchesRole = roleTag.tag !== "member";
            } else if (memberRoleFilter === "MEMBERS") {
                matchesRole = roleTag.tag === "member";
            }

            return matchesSearch && matchesDept && matchesRole;
        });
    }, [realMembers, memberSearchTerm, memberDeptFilter, memberRoleFilter]);

    // ============================================================
    // SEPARATED LIFECYCLE 1: VISITORS ONLY (100% Visitors Pipeline)
    // ============================================================
    const visitorsLifecycle = useMemo(() => {
        // Stage 4: Milestone Reached / Converted to Member (4+ visits or converted in DB)
        const stage4Converted = realVisitors.filter(
            (v) => v.isConvertedToMember || v.convertedMemberId || (v.visitCount || 1) >= 4
        );
        const stage4Ids = new Set(stage4Converted.map((v) => v.visitorId));

        // Stage 3: Connected & Returning (2-3 Visits)
        const stage3Returning = realVisitors.filter(
            (v) => !stage4Ids.has(v.visitorId) && (v.visitCount || 1) >= 2
        );
        const stage3Ids = new Set(stage3Returning.map((v) => v.visitorId));

        // Stage 2: In Follow-Up (Assigned to Pastoral Leader)
        const stage2FollowUp = realVisitors.filter(
            (v) => !stage4Ids.has(v.visitorId) && !stage3Ids.has(v.visitorId) && delegations.some((d) => d.visitorId === v.visitorId)
        );
        const stage2Ids = new Set(stage2FollowUp.map((v) => v.visitorId));

        // Stage 1: New Arrivals (Unassigned / Needs Leader)
        const stage1NewArrivals = realVisitors.filter(
            (v) => !stage4Ids.has(v.visitorId) && !stage3Ids.has(v.visitorId) && !stage2Ids.has(v.visitorId)
        );

        return {
            stage1NewArrivals,
            stage2FollowUp,
            stage3Returning,
            stage4Converted,
        };
    }, [realVisitors, delegations]);

    // ============================================================
    // SEPARATED LIFECYCLE 2: MEMBERS ONLY (100% Church Members Pipeline)
    // ============================================================
    const membersLifecycle = useMemo(() => {
        const sentLeaderIds = new Set(sentLeaders.map((s) => s.id));
        const sentLeaderNames = new Set(sentLeaders.map((s) => (s.fullName || "").toLowerCase().trim()));
        const discipleIds = new Set(disciples.map((d) => d.id));
        const discipleNames = new Set(disciples.map((d) => (d.fullName || "").toLowerCase().trim()));

        // Stage 4: Commissioned Leaders & Pastoral Staff (Pastors, Adult Leaders, Youth Leaders, Sent Ministers)
        const stage4Leaders = realMembers.filter((m) => {
            const roleTag = getLeaderRoleTag(m.ministry);
            const isOrdainedOrLeader = roleTag.tag !== "member";
            const mName = (m.fullName || `${m.firstName || ""} ${m.lastName || ""}`).toLowerCase().trim();
            const isSent = sentLeaderIds.has(m.memberId) || sentLeaderNames.has(mName);
            return isOrdainedOrLeader || isSent;
        });
        const stage4Ids = new Set(stage4Leaders.map((m) => m.memberId));

        // Stage 3: Ministry Department Workers (Music, Ushers, Youth, Children, Media, etc.)
        const stage3Workers = realMembers.filter((m) => {
            if (stage4Ids.has(m.memberId)) return false;
            const dept = getMemberDepartment(m.ministry);
            return dept.deptKey !== "general";
        });
        const stage3Ids = new Set(stage3Workers.map((m) => m.memberId));

        // Stage 2: Discipleship & Spiritual Growth (Life Class / Cell Group Disciples)
        const stage2Disciples = realMembers.filter((m) => {
            if (stage4Ids.has(m.memberId) || stage3Ids.has(m.memberId)) return false;
            const mName = (m.fullName || `${m.firstName || ""} ${m.lastName || ""}`).toLowerCase().trim();
            const isDisciple = discipleIds.has(m.memberId) || discipleNames.has(mName);
            const hasDiscipleshipNotes =
                (m.notes || "").toLowerCase().includes("disciple") ||
                (m.notes || "").toLowerCase().includes("life class") ||
                (m.notes || "").toLowerCase().includes("cell");
            return isDisciple || hasDiscipleshipNotes;
        });
        const stage2Ids = new Set(stage2Disciples.map((m) => m.memberId));

        // Stage 1: New Members & Onboarding (Orientation / Foundations / General Congregation)
        const stage1NewMembers = realMembers.filter((m) => {
            return !stage4Ids.has(m.memberId) && !stage3Ids.has(m.memberId) && !stage2Ids.has(m.memberId);
        });

        return {
            stage1NewMembers,
            stage2Disciples,
            stage3Workers,
            stage4Leaders,
        };
    }, [realMembers, sentLeaders, disciples]);

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
            // Default to first qualified leader (Assistant Pastor / Adult / Youth Leader)
            const defaultLeader = realLeaders[0] || realMembers[0];
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

        const leader = realLeaders.find((m) => m.memberId === Number(delegationForm.assignedLeaderId))
            || realMembers.find((m) => m.memberId === Number(delegationForm.assignedLeaderId));
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
                        onClick={() => handleNavigatePage("members")}
                        title="Open full Church Members module"
                    >
                        <Users size={15} />
                        <span>Members Module ({realMembers.length})</span>
                    </button>
                    <button
                        type="button"
                        className="cia-btn-outline"
                        onClick={() => handleNavigatePage("visitors")}
                        title="Open full Visitors module"
                    >
                        <UserCheck size={15} />
                        <span>Visitors Module ({realVisitors.length})</span>
                    </button>
                    <button
                        type="button"
                        className="cia-btn-outline"
                        onClick={loadRealData}
                        title="Sync with live database"
                    >
                        <RefreshCw size={15} className={loading ? "cia-spin" : ""} />
                        <span>Sync</span>
                    </button>
                    <button
                        type="button"
                        className="cia-btn-outline"
                        onClick={() => window.print()}
                        title="Print clean report"
                    >
                        <Printer size={15} />
                        <span>Print</span>
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
                <div
                    className="cia-metric-card clickable"
                    onClick={() => {
                        setActiveTab("visitors-lifecycle");
                        setActiveLifecycleTab("visitors");
                    }}
                    title="Click to view dedicated Visitors Lifecycle Funnel"
                >
                    <div className="cia-metric-icon-wrap cia-icon-blue">
                        <Users size={20} />
                    </div>
                    <div className="cia-metric-data">
                        <span className="cia-metric-label">Total Newcomers in DB</span>
                        <strong className="cia-metric-val">{metrics.totalNewcomers}</strong>
                        <span className="cia-metric-hint">Official Visitors Table</span>
                    </div>
                </div>

                <div
                    className={`cia-metric-card clickable ${metrics.unassignedCount > 0 ? "cia-metric-card-warn" : ""}`}
                    onClick={() => {
                        setActiveTab("visitors-lifecycle");
                        setActiveLifecycleTab("visitors");
                    }}
                    title="Click to view unassigned newcomers in Visitors Lifecycle"
                >
                    <div className="cia-metric-icon-wrap cia-icon-amber">
                        <AlertCircle size={20} />
                    </div>
                    <div className="cia-metric-data">
                        <span className="cia-metric-label">Unassigned (Need Leader)</span>
                        <strong className="cia-metric-val text-amber">{metrics.unassignedCount}</strong>
                        <span className="cia-metric-hint">Requires Delegation</span>
                    </div>
                </div>

                <div
                    className="cia-metric-card clickable"
                    onClick={() => {
                        setActiveTab("visitors-lifecycle");
                        setActiveLifecycleTab("visitors");
                    }}
                    title="Click to view newcomers assigned to leaders in Visitors Lifecycle"
                >
                    <div className="cia-metric-icon-wrap cia-icon-purple">
                        <UserCog size={20} />
                    </div>
                    <div className="cia-metric-data">
                        <span className="cia-metric-label">In Active Follow-Up</span>
                        <strong className="cia-metric-val">{metrics.activeDelegationsCount}</strong>
                        <span className="cia-metric-hint">Assigned to Leaders</span>
                    </div>
                </div>

                <div
                    className="cia-metric-card cia-highlight-metric clickable"
                    onClick={() => {
                        setActiveTab("members-lifecycle");
                        setActiveLifecycleTab("members");
                    }}
                    title="Click to view dedicated Members Lifecycle Pipeline"
                >
                    <div className="cia-metric-icon-wrap cia-icon-gold">
                        <Crown size={20} />
                    </div>
                    <div className="cia-metric-data">
                        <span className="cia-metric-label">Total Church Members</span>
                        <strong className="cia-metric-val text-gold">{realMembers.length}</strong>
                        <span className="cia-metric-hint">{realLeaders.length} Authorized Leaders • {realMembers.length - realLeaders.length} Members</span>
                    </div>
                </div>

                <div
                    className="cia-metric-card clickable"
                    onClick={() => setActiveTab("discipleship")}
                    title="Click to view Discipleship & Foundations"
                >
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
                    className={`cia-tab-btn ${activeTab === "members" ? "active" : ""}`}
                    onClick={() => setActiveTab("members")}
                >
                    <Users size={16} />
                    <span>2. Church Members & Departments</span>
                    <span className="cia-badge-pill">{realMembers.length}</span>
                </button>

                <button
                    type="button"
                    className={`cia-tab-btn ${activeTab === "visitors-lifecycle" || (activeTab === "pipeline" && activeLifecycleTab === "visitors") ? "active" : ""}`}
                    onClick={() => {
                        setActiveTab("visitors-lifecycle");
                        setActiveLifecycleTab("visitors");
                    }}
                >
                    <UserCheck size={16} />
                    <span>3. Visitors Lifecycle</span>
                    <span className="cia-badge-pill">{realVisitors.length}</span>
                </button>

                <button
                    type="button"
                    className={`cia-tab-btn ${activeTab === "members-lifecycle" || (activeTab === "pipeline" && activeLifecycleTab === "members") ? "active" : ""}`}
                    onClick={() => {
                        setActiveTab("members-lifecycle");
                        setActiveLifecycleTab("members");
                    }}
                >
                    <Crown size={16} />
                    <span>4. Members Lifecycle</span>
                    <span className="cia-badge-pill">{realMembers.length}</span>
                </button>

                <button
                    type="button"
                    className={`cia-tab-btn ${activeTab === "followup" ? "active" : ""}`}
                    onClick={() => setActiveTab("followup")}
                >
                    <HeartHandshake size={16} />
                    <span>5. Touchpoints & Logs</span>
                    <span className="cia-badge-pill">{followUpLogs.length}</span>
                </button>

                <button
                    type="button"
                    className={`cia-tab-btn ${activeTab === "discipleship" ? "active" : ""}`}
                    onClick={() => setActiveTab("discipleship")}
                >
                    <BookOpen size={16} />
                    <span>6. Discipleship & Foundations</span>
                    <span className="cia-badge-pill">{disciples.length}</span>
                </button>

                <button
                    type="button"
                    className={`cia-tab-btn ${activeTab === "sending" ? "active" : ""}`}
                    onClick={() => setActiveTab("sending")}
                >
                    <Send size={16} />
                    <span>7. Sending & Mobilization</span>
                    <span className="cia-badge-pill">{sentLeaders.length}</span>
                </button>

                <button
                    type="button"
                    className={`cia-tab-btn ${activeTab === "evangelism" ? "active" : ""}`}
                    onClick={() => setActiveTab("evangelism")}
                >
                    <Sparkles size={16} />
                    <span>8. Outreach & Prospects</span>
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
                                <h4>Delegated Pastoral Leaders & Workers ({realLeaders.length} Authorized Leaders)</h4>
                                <p>
                                    Only ordained <strong>Assistant Pastors</strong>, <strong>Adult Leaders</strong>, and <strong>Youth Leaders</strong> appear in delegated personnel. General members are excluded from delegation.
                                </p>
                            </div>
                            <div className="cia-lsp-badge cia-lsp-badge-gold">
                                <ShieldCheck size={16} />
                                <span>Authorized Delegated Personnel</span>
                            </div>
                        </div>

                        {/* CATEGORY SELECTOR PILLS */}
                        <div className="cia-leader-category-nav">
                            <button
                                type="button"
                                className={`cia-category-pill ${leaderCategoryTab === "ALL" ? "active" : ""}`}
                                onClick={() => {
                                    setLeaderCategoryTab("ALL");
                                    setLeaderFilter("ALL");
                                }}
                            >
                                All Leaders ({realLeaders.length})
                            </button>
                            <button
                                type="button"
                                className={`cia-category-pill pastor ${leaderCategoryTab === "PASTOR" ? "active" : ""}`}
                                onClick={() => {
                                    setLeaderCategoryTab("PASTOR");
                                    setLeaderFilter("ALL");
                                }}
                            >
                                👑 Assistant Pastors ({assistantPastors.length})
                            </button>
                            <button
                                type="button"
                                className={`cia-category-pill adult ${leaderCategoryTab === "ADULT" ? "active" : ""}`}
                                onClick={() => {
                                    setLeaderCategoryTab("ADULT");
                                    setLeaderFilter("ALL");
                                }}
                            >
                                🌟 Adult Leaders ({adultLeaders.length})
                            </button>
                            <button
                                type="button"
                                className={`cia-category-pill youth ${leaderCategoryTab === "YOUTH" ? "active" : ""}`}
                                onClick={() => {
                                    setLeaderCategoryTab("YOUTH");
                                    setLeaderFilter("ALL");
                                }}
                            >
                                🔥 Youth Leaders ({youthLeaders.length})
                            </button>
                            {otherLeaders.length > 0 && (
                                <button
                                    type="button"
                                    className={`cia-category-pill other ${leaderCategoryTab === "OTHER" ? "active" : ""}`}
                                    onClick={() => {
                                        setLeaderCategoryTab("OTHER");
                                        setLeaderFilter("ALL");
                                    }}
                                >
                                    ⚡ Other Leaders ({otherLeaders.length})
                                </button>
                            )}
                        </div>

                        {/* LEADER CHIPS */}
                        <div className="cia-leaders-chip-row">
                            <button
                                type="button"
                                className={`cia-leader-filter-chip ${leaderFilter === "ALL" && statusFilter !== "UNASSIGNED" ? "active" : ""}`}
                                onClick={() => {
                                    setLeaderFilter("ALL");
                                    setStatusFilter("ALL");
                                }}
                            >
                                <span>All ({realVisitors.length} Newcomers)</span>
                            </button>

                            <button
                                type="button"
                                className={`cia-leader-filter-chip warn-chip ${statusFilter === "UNASSIGNED" ? "active" : ""}`}
                                onClick={() => {
                                    setLeaderFilter("ALL");
                                    setStatusFilter(statusFilter === "UNASSIGNED" ? "ALL" : "UNASSIGNED");
                                }}
                            >
                                <span>⚠️ Needs Leader ({metrics.unassignedCount})</span>
                            </button>

                            {displayedLeaders.map((m) => {
                                const assignedCount = leaderWorkloadMap[m.memberId] || 0;
                                const roleTag = getLeaderRoleTag(m.ministry);
                                return (
                                    <button
                                        key={m.memberId}
                                        type="button"
                                        className={`cia-leader-filter-chip ${leaderFilter === String(m.memberId) ? "active" : ""}`}
                                        onClick={() => setLeaderFilter(String(m.memberId))}
                                        title={`${m.fullName} • ${roleTag.label}`}
                                    >
                                        <span className="leader-name">
                                            {roleTag.icon} {m.fullName}
                                        </span>
                                        <span className={`cia-chip-role-tag ${roleTag.tag}`}>
                                            {roleTag.label}
                                        </span>
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

                    {/* ACTIVE LEADER FILTER BANNER */}
                    {leaderFilter !== "ALL" && selectedLeader && (
                        <div className="cia-active-leader-banner">
                            <div className="cia-alb-info">
                                <span className="cia-alb-icon">{getLeaderRoleTag(selectedLeader.ministry).icon}</span>
                                <div>
                                    <strong>Showing Newcomers Assigned to: {selectedLeader.fullName}</strong>
                                    <span className="cia-alb-sub">
                                        {getLeaderRoleTag(selectedLeader.ministry).label} • {filteredDelegationList.length} Assigned Newcomer(s)
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="cia-btn-clear-filter"
                                onClick={() => setLeaderFilter("ALL")}
                            >
                                ✕ Show All {realVisitors.length} Newcomers
                            </button>
                        </div>
                    )}

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
                                                            {(() => {
                                                                const leader = realLeaders.find((l) => l.memberId === delegation.assignedLeaderId);
                                                                const roleTag = getLeaderRoleTag(leader?.ministry);
                                                                return (
                                                                    <span className={`cia-leader-role-tag ${roleTag.tag}`}>
                                                                        {roleTag.icon} {roleTag.label}
                                                                    </span>
                                                                );
                                                            })()}
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
                                        <td colSpan={7} className="cia-no-data-cell">
                                            {leaderFilter !== "ALL" && selectedLeader ? (
                                                <div className="cia-empty-leader-box">
                                                    <div className="cia-empty-leader-avatar">
                                                        {getLeaderRoleTag(selectedLeader.ministry).icon}
                                                    </div>
                                                    <h3>No Newcomers Currently Assigned to {selectedLeader.fullName}</h3>
                                                    <p>
                                                        <strong>{selectedLeader.fullName}</strong> is an authorized <strong>{getLeaderRoleTag(selectedLeader.ministry).label}</strong> ready to receive and follow up new souls. There are currently <span className="text-amber"><strong>{metrics.unassignedCount} unassigned newcomers</strong></span> in Luke 4:18 Ministries waiting for discipleship!
                                                    </p>
                                                    <div className="cia-empty-leader-actions">
                                                        {metrics.unassignedCount > 0 && (
                                                            <button
                                                                type="button"
                                                                className="cia-btn-primary"
                                                                onClick={() => {
                                                                    const firstUnassigned = realVisitors.find(
                                                                        (v) => !v.isConvertedToMember && !delegations.some((d) => d.visitorId === v.visitorId)
                                                                    );
                                                                    if (firstUnassigned) {
                                                                        setSelectedVisitorForDelegation(firstUnassigned);
                                                                        setDelegationForm({
                                                                            assignedLeaderId: selectedLeader.memberId,
                                                                            assignedLeaderName: selectedLeader.fullName,
                                                                            targetContactDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                                                                            priority: "High",
                                                                            delegationNotes: "",
                                                                        });
                                                                        setShowDelegateModal(true);
                                                                    }
                                                                }}
                                                            >
                                                                <UserPlus size={15} />
                                                                <span>Delegate an Unassigned Newcomer to {selectedLeader.fullName}</span>
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="cia-btn-outline"
                                                            onClick={() => {
                                                                setLeaderFilter("ALL");
                                                                setStatusFilter("ALL");
                                                            }}
                                                        >
                                                            <Users size={15} />
                                                            <span>Show All {realVisitors.length} Newcomers</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="cia-no-data-simple">
                                                    {realVisitors.length === 0
                                                        ? "No newcomers recorded in database yet. Click 'Register Newcomer' above to add your first visitor!"
                                                        : "No newcomers match the selected search or status filter."}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* DEPARTMENT CONGREGATION & FLOCK SECTION */}
                    {selectedLeaderFlock && (
                        <div className="cia-flock-section">
                            <div className="cia-flock-header">
                                <div className="cia-flock-title">
                                    <span className="cia-flock-icon">{selectedLeaderFlock.roleTag.icon}</span>
                                    <div>
                                        <h4>{selectedLeaderFlock.title}</h4>
                                        <p>
                                            Congregation members and leaders belonging to this department flock in Luke 4:18 Ministries.
                                        </p>
                                    </div>
                                </div>
                                <div className="cia-flock-actions">
                                    <button
                                        type="button"
                                        className="cia-btn-outline"
                                        onClick={() => {
                                            setActiveTab("members");
                                            if (leaderCategoryTab === "ADULT") setMemberDeptFilter("ADULT");
                                            else if (leaderCategoryTab === "YOUTH") setMemberDeptFilter("YOUTH");
                                            else if (leaderCategoryTab === "PASTOR") setMemberDeptFilter("PASTORAL");
                                            else setMemberDeptFilter("ALL");
                                        }}
                                    >
                                        <Users size={14} />
                                        <span>Open in Members Directory ({selectedLeaderFlock.members.length})</span>
                                    </button>
                                </div>
                            </div>

                            <div className="cia-flock-grid">
                                {selectedLeaderFlock.members.map((m) => {
                                    const roleTag = getLeaderRoleTag(m.ministry);
                                    const isLeader = roleTag.tag !== "member";
                                    return (
                                        <div key={m.memberId} className={`cia-flock-card ${isLeader ? "is-leader" : ""}`}>
                                            <div className="cia-flock-avatar">
                                                {roleTag.icon}
                                            </div>
                                            <div className="cia-flock-info">
                                                <div className="cia-flock-name-row">
                                                    <strong>{m.fullName || `${m.firstName || ""} ${m.lastName || ""}`}</strong>
                                                    <span className={`cia-chip-role-tag ${roleTag.tag}`}>
                                                        {roleTag.label}
                                                    </span>
                                                </div>
                                                <small className="cia-flock-meta">
                                                    {m.memberCode || `ID #${m.memberId}`} • {m.contactNumber || "No Phone"}
                                                </small>
                                                <span className="cia-flock-address">
                                                    {m.address || "San Vicente"}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 2: CHURCH MEMBERS & DEPARTMENTS DIRECTORY                */}
            {/* ============================================================ */}
            {activeTab === "members" && (
                <div className="cia-tab-content">
                    {/* MEMBERS BANNER */}
                    <div className="cia-section-banner blue-theme">
                        <div>
                            <div className="cia-mini-tag">LUKE 4:18 CONGREGATION DIRECTORY</div>
                            <h3>Church Members & Department Directory ({realMembers.length} Total Members)</h3>
                            <p>
                                Complete overview of church members, pastoral staff, and department flocks in Luke 4:18 Ministries.
                            </p>
                        </div>
                        <div className="cia-banner-btn-group">
                            <button
                                type="button"
                                className="cia-btn-action-banner"
                                onClick={() => handleNavigatePage("members")}
                            >
                                <Users size={15} />
                                <span>Manage in Members Module ↗</span>
                            </button>
                            <button
                                type="button"
                                className="cia-btn-action-banner secondary"
                                onClick={() => {
                                    setActiveTab("delegation");
                                    setLeaderFilter("ALL");
                                }}
                            >
                                <UserCog size={15} />
                                <span>Go to Delegation Center</span>
                            </button>
                        </div>
                    </div>

                    {/* DEPARTMENT CARDS GRID */}
                    <div className="cia-dept-grid">
                        <div
                            className={`cia-dept-card pastoral ${memberDeptFilter === "PASTORAL" ? "active" : ""}`}
                            onClick={() => setMemberDeptFilter(memberDeptFilter === "PASTORAL" ? "ALL" : "PASTORAL")}
                        >
                            <div className="cia-dept-card-icon">👑</div>
                            <div className="cia-dept-card-info">
                                <span className="cia-dept-name">Pastoral Staff</span>
                                <strong className="cia-dept-count">{departmentCounts.pastoral} Ministers</strong>
                                <small>Assistant Pastors & Ordained</small>
                            </div>
                        </div>

                        <div
                            className={`cia-dept-card adult ${memberDeptFilter === "ADULT" ? "active" : ""}`}
                            onClick={() => setMemberDeptFilter(memberDeptFilter === "ADULT" ? "ALL" : "ADULT")}
                        >
                            <div className="cia-dept-card-icon">🌟</div>
                            <div className="cia-dept-card-info">
                                <span className="cia-dept-name">Adult Department</span>
                                <strong className="cia-dept-count">{departmentCounts.adult} Members</strong>
                                <small>{adultLeaders.length} Leaders • {departmentCounts.adult - adultLeaders.length} Members</small>
                            </div>
                        </div>

                        <div
                            className={`cia-dept-card youth ${memberDeptFilter === "YOUTH" ? "active" : ""}`}
                            onClick={() => setMemberDeptFilter(memberDeptFilter === "YOUTH" ? "ALL" : "YOUTH")}
                        >
                            <div className="cia-dept-card-icon">🔥</div>
                            <div className="cia-dept-card-info">
                                <span className="cia-dept-name">Youth Department</span>
                                <strong className="cia-dept-count">{departmentCounts.youth} Members</strong>
                                <small>{youthLeaders.length} Leaders • {departmentCounts.youth - youthLeaders.length} Members</small>
                            </div>
                        </div>

                        <div
                            className={`cia-dept-card children ${memberDeptFilter === "CHILDREN" ? "active" : ""}`}
                            onClick={() => setMemberDeptFilter(memberDeptFilter === "CHILDREN" ? "ALL" : "CHILDREN")}
                        >
                            <div className="cia-dept-card-icon">👶</div>
                            <div className="cia-dept-card-info">
                                <span className="cia-dept-name">Children's Ministry</span>
                                <strong className="cia-dept-count">{departmentCounts.children} Children</strong>
                                <small>Sunday School & Kids Flock</small>
                            </div>
                        </div>

                        <div
                            className={`cia-dept-card worship ${memberDeptFilter === "WORSHIP" ? "active" : ""}`}
                            onClick={() => setMemberDeptFilter(memberDeptFilter === "WORSHIP" ? "ALL" : "WORSHIP")}
                        >
                            <div className="cia-dept-card-icon">🎵</div>
                            <div className="cia-dept-card-info">
                                <span className="cia-dept-name">Worship & Music</span>
                                <strong className="cia-dept-count">{departmentCounts.worship} Members</strong>
                                <small>Praise & Worship Team</small>
                            </div>
                        </div>

                        <div
                            className={`cia-dept-card general ${memberDeptFilter === "GENERAL" ? "active" : ""}`}
                            onClick={() => setMemberDeptFilter(memberDeptFilter === "GENERAL" ? "ALL" : "GENERAL")}
                        >
                            <div className="cia-dept-card-icon">👥</div>
                            <div className="cia-dept-card-info">
                                <span className="cia-dept-name">General Congregation</span>
                                <strong className="cia-dept-count">{departmentCounts.general} Members</strong>
                                <small>Fellowship & Life Groups</small>
                            </div>
                        </div>
                    </div>

                    {/* CONTROLS BAR */}
                    <div className="cia-controls-bar">
                        <div className="cia-search-box">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search members by name, code, contact, ministry..."
                                value={memberSearchTerm}
                                onChange={(e) => setMemberSearchTerm(e.target.value)}
                            />
                            {memberSearchTerm && (
                                <button type="button" className="cia-clear-btn" onClick={() => setMemberSearchTerm("")}>
                                    ×
                                </button>
                            )}
                        </div>

                        <div className="cia-filters">
                            <Filter size={15} />
                            <label>Department:</label>
                            <select value={memberDeptFilter} onChange={(e) => setMemberDeptFilter(e.target.value)}>
                                <option value="ALL">All Departments ({realMembers.length})</option>
                                <option value="PASTORAL">👑 Pastoral Staff ({departmentCounts.pastoral})</option>
                                <option value="ADULT">🌟 Adult Department ({departmentCounts.adult})</option>
                                <option value="YOUTH">🔥 Youth Department ({departmentCounts.youth})</option>
                                <option value="CHILDREN">👶 Children's Ministry ({departmentCounts.children})</option>
                                <option value="WORSHIP">🎵 Worship & Music ({departmentCounts.worship})</option>
                                <option value="GENERAL">👥 General Congregation ({departmentCounts.general})</option>
                            </select>

                            <label>Role:</label>
                            <select value={memberRoleFilter} onChange={(e) => setMemberRoleFilter(e.target.value as any)}>
                                <option value="ALL">All Roles ({realMembers.length})</option>
                                <option value="LEADERS">Authorized Leaders Only ({realLeaders.length})</option>
                                <option value="MEMBERS">Congregation Members Only ({realMembers.length - realLeaders.length})</option>
                            </select>
                        </div>
                    </div>

                    {/* MEMBERS DIRECTORY TABLE */}
                    <div className="cia-table-container">
                        <table className="cia-table">
                            <thead>
                                <tr>
                                    <th>Member Name</th>
                                    <th>Department</th>
                                    <th>Role / Designation</th>
                                    <th>Contact & Address</th>
                                    <th>Civil Status / Gender</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembersList.map((m) => {
                                    const mName = m.fullName || `${m.firstName || ""} ${m.lastName || ""}`;
                                    const dept = getMemberDepartment(m.ministry);
                                    const roleTag = getLeaderRoleTag(m.ministry);
                                    const isLeader = roleTag.tag !== "member";
                                    const assignedVisitorsCount = leaderWorkloadMap[m.memberId] || 0;

                                    return (
                                        <tr key={m.memberId} className={isLeader ? "row-leader" : ""}>
                                            <td>
                                                <div className="cia-table-primary-cell">
                                                    <div className="cia-member-row-header">
                                                        <div className={`cia-avatar-circle ${roleTag.tag}`}>
                                                            {roleTag.icon}
                                                        </div>
                                                        <div>
                                                            <strong>{mName}</strong>
                                                            <small className="d-block text-muted">
                                                                {m.memberCode || `MEM-${m.memberId}`}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`cia-dept-pill ${dept.badgeClass}`}>
                                                    {dept.icon} {dept.name}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`cia-chip-role-tag ${roleTag.tag}`}>
                                                    {roleTag.icon} {roleTag.label}
                                                </span>
                                                {isLeader && (
                                                    <small className="d-block mt-1 text-muted">
                                                        {assignedVisitorsCount} Newcomer(s) Assigned
                                                    </small>
                                                )}
                                            </td>
                                            <td>
                                                <div className="cia-contact-cell">
                                                    <div><Phone size={12} /> {m.contactNumber || "No Phone"}</div>
                                                    <small className="text-muted">{m.address || "San Vicente"}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <span>{m.civilStatus || "Single"} • {m.gender || "Other"}</span>
                                            </td>
                                            <td>
                                                <span className={`cia-status-chip ${m.status?.toLowerCase() === "active" ? "active" : "inactive"}`}>
                                                    {m.status || "Active"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="cia-table-actions">
                                                    {isLeader ? (
                                                        <button
                                                            type="button"
                                                            className="cia-btn-delegate"
                                                            onClick={() => {
                                                                setActiveTab("delegation");
                                                                setLeaderFilter(String(m.memberId));
                                                                if (roleTag.tag === "pastor") setLeaderCategoryTab("PASTOR");
                                                                else if (roleTag.tag === "adult") setLeaderCategoryTab("ADULT");
                                                                else if (roleTag.tag === "youth") setLeaderCategoryTab("YOUTH");
                                                                else setLeaderCategoryTab("ALL");
                                                            }}
                                                            title="View or assign newcomer follow-ups in Delegation Center"
                                                        >
                                                            <UserCog size={13} />
                                                            <span>Delegation Center</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="cia-btn-outline small"
                                                            onClick={() => {
                                                                setActiveTab("discipleship");
                                                                setDiscipleshipForm((prev) => ({
                                                                    ...prev,
                                                                    fullName: mName,
                                                                    contactNumber: m.contactNumber || "",
                                                                    memberId: m.memberId,
                                                                }));
                                                                setShowDiscipleshipModal(true);
                                                            }}
                                                            title="Enroll in Discipleship & Foundations track"
                                                        >
                                                            <BookOpen size={13} />
                                                            <span>Discipleship Track</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredMembersList.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="cia-no-data">
                                            No members match the selected search, department, or role filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 3: VISITORS LIFECYCLE MONITORING (100% VISITORS ONLY)  */}
            {/* ============================================================ */}
            {(activeTab === "visitors-lifecycle" || (activeTab === "pipeline" && activeLifecycleTab === "visitors")) && (
                <div className="cia-pipeline-view">
                    {/* SEPARATE LIFECYCLE SWITCHER BAR */}
                    <div className="cia-lifecycle-switcher-bar">
                        <button
                            type="button"
                            className="cia-lsb-btn active-visitors"
                            onClick={() => {
                                setActiveLifecycleTab("visitors");
                                setActiveTab("visitors-lifecycle");
                            }}
                        >
                            <UserCheck size={18} />
                            <span className="lsb-title">Visitors Lifecycle Funnel</span>
                            <span className="lsb-badge visitors">{realVisitors.length} Newcomers</span>
                        </button>
                        <button
                            type="button"
                            className="cia-lsb-btn"
                            onClick={() => {
                                setActiveLifecycleTab("members");
                                setActiveTab("members-lifecycle");
                            }}
                        >
                            <Crown size={18} />
                            <span className="lsb-title">Members Lifecycle Pipeline</span>
                            <span className="lsb-badge members">{realMembers.length} Members</span>
                        </button>
                    </div>

                    <div className="cia-pipeline-info-banner">
                        <div className="cia-pib-content">
                            <strong>100% Visitors Lifecycle Funnel: 1st Visit ➔ Pastoral Care ➔ Retained ➔ Church Member</strong>
                            <p>Tracking all {realVisitors.length} newcomers from arrival to church integration. Completely separated from member discipleship.</p>
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
                                <span className="cia-col-count">{visitorsLifecycle.stage1NewArrivals.length}</span>
                            </div>
                            <div className="cia-col-cards">
                                {visitorsLifecycle.stage1NewArrivals.map((v) => (
                                    <div key={v.visitorId} className="cia-kanban-card">
                                        <div className="cia-card-top">
                                            <span className="cia-id-tag">{v.visitorCode || `VIS-${v.visitorId}`}</span>
                                            <span className="cia-status-chip unassigned">Needs Leader</span>
                                        </div>
                                        <h5 className="cia-card-name">{v.fullName || `${v.firstName} ${v.lastName}`}</h5>
                                        <p className="cia-card-sub"><Phone size={12} /> {v.contactNumber || "No Phone"}</p>
                                        <p className="cia-card-sub"><Clock size={12} /> First Visit: {v.firstVisitDate || "Recent"}</p>
                                        {v.invitedBy && (
                                            <p className="cia-card-sub"><Users size={12} /> Invited by: {v.invitedBy}</p>
                                        )}
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
                                {visitorsLifecycle.stage1NewArrivals.length === 0 && (
                                    <div className="cia-col-empty">All new arrivals have been delegated to pastoral leaders!</div>
                                )}
                            </div>
                        </div>

                        {/* COLUMN 2: IN ACTIVE FOLLOW-UP */}
                        <div className="cia-kanban-col">
                            <div className="cia-col-header blue">
                                <div>
                                    <span className="cia-col-step">STAGE 2</span>
                                    <h4>In Follow-Up (Assigned)</h4>
                                </div>
                                <span className="cia-col-count">{visitorsLifecycle.stage2FollowUp.length}</span>
                            </div>
                            <div className="cia-col-cards">
                                {visitorsLifecycle.stage2FollowUp.map((v) => {
                                    const del = delegations.find((d) => d.visitorId === v.visitorId);
                                    return (
                                        <div key={v.visitorId} className="cia-kanban-card">
                                            <div className="cia-card-top">
                                                <span className="cia-id-tag">{v.visitorCode || `VIS-${v.visitorId}`}</span>
                                                <span className="cia-status-chip contacted">{del?.delegationStatus || "Assigned"}</span>
                                            </div>
                                            <h5 className="cia-card-name">{v.fullName || `${v.firstName} ${v.lastName}`}</h5>
                                            <p className="cia-card-sub"><UserCheck size={12} /> Leader: <strong>{del?.assignedLeaderName || "Pastoral Team"}</strong></p>
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
                                {visitorsLifecycle.stage2FollowUp.length === 0 && (
                                    <div className="cia-col-empty">No visitors currently in active follow-up stage.</div>
                                )}
                            </div>
                        </div>

                        {/* COLUMN 3: CONNECTED & RETURNING (2-3 VISITS) */}
                        <div className="cia-kanban-col">
                            <div className="cia-col-header emerald">
                                <div>
                                    <span className="cia-col-step">STAGE 3</span>
                                    <h4>Connected & Returning</h4>
                                </div>
                                <span className="cia-col-count">{visitorsLifecycle.stage3Returning.length}</span>
                            </div>
                            <div className="cia-col-cards">
                                {visitorsLifecycle.stage3Returning.map((v) => {
                                    const del = delegations.find((d) => d.visitorId === v.visitorId);
                                    return (
                                        <div key={v.visitorId} className="cia-kanban-card">
                                            <div className="cia-card-top">
                                                <span className="cia-id-tag">{v.visitorCode || `VIS-${v.visitorId}`}</span>
                                                <span className="cia-pill-success">⭐ {v.visitCount || 2} Visits</span>
                                            </div>
                                            <h5 className="cia-card-name">{v.fullName || `${v.firstName} ${v.lastName}`}</h5>
                                            <p className="cia-card-sub"><Phone size={12} /> {v.contactNumber || "No Phone"}</p>
                                            {del ? (
                                                <p className="cia-card-sub"><UserCheck size={12} /> Leader: <strong>{del.assignedLeaderName}</strong></p>
                                            ) : (
                                                <p className="cia-card-sub"><Clock size={12} /> Consistently Attending</p>
                                            )}
                                            <div className="cia-card-footer dual">
                                                <button
                                                    type="button"
                                                    className="cia-btn-sm-touchpoint"
                                                    onClick={() => handleOpenLogFollowUp(v)}
                                                >
                                                    <HeartHandshake size={12} />
                                                    <span>Touchpoint</span>
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
                                {visitorsLifecycle.stage3Returning.length === 0 && (
                                    <div className="cia-col-empty">No returning visitors in this stage yet.</div>
                                )}
                            </div>
                        </div>

                        {/* COLUMN 4: MILESTONE REACHED / CONVERTED TO MEMBER */}
                        <div className="cia-kanban-col">
                            <div className="cia-col-header purple">
                                <div>
                                    <span className="cia-col-step">STAGE 4</span>
                                    <h4>Milestone Reached / Member</h4>
                                </div>
                                <span className="cia-col-count">{visitorsLifecycle.stage4Converted.length}</span>
                            </div>
                            <div className="cia-col-cards">
                                {visitorsLifecycle.stage4Converted.map((v) => (
                                    <div key={v.visitorId} className="cia-kanban-card sent-card">
                                        <div className="cia-card-top">
                                            <span className="cia-id-tag">{v.visitorCode || `VIS-${v.visitorId}`}</span>
                                            <span className="cia-status-chip emerald">🎉 Converted</span>
                                        </div>
                                        <h5 className="cia-card-name">{v.fullName || `${v.firstName} ${v.lastName}`}</h5>
                                        <p className="cia-card-sub"><Phone size={12} /> {v.contactNumber || "No Phone"}</p>
                                        <p className="cia-card-sub"><CheckCircle2 size={12} /> Official Member Milestone</p>
                                        <div className="cia-card-footer dual">
                                            <button
                                                type="button"
                                                className="cia-btn-sm-touchpoint"
                                                onClick={() => handleNavigatePage("members")}
                                                title="View in Church Members module"
                                            >
                                                <Users size={12} />
                                                <span>Members</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="cia-btn-sm-action"
                                                onClick={() => {
                                                    setDiscipleshipForm((prev) => ({
                                                        ...prev,
                                                        fullName: v.fullName || `${v.firstName} ${v.lastName}`,
                                                        contactNumber: v.contactNumber,
                                                    }));
                                                    setShowDiscipleshipModal(true);
                                                }}
                                                title="Enroll in Discipleship & Foundations"
                                            >
                                                <BookOpen size={12} />
                                                <span>Discipleship</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {visitorsLifecycle.stage4Converted.length === 0 && (
                                    <div className="cia-col-empty">No visitors converted to members yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 4: MEMBERS LIFECYCLE MONITORING (100% MEMBERS ONLY)    */}
            {/* ============================================================ */}
            {(activeTab === "members-lifecycle" || (activeTab === "pipeline" && activeLifecycleTab === "members")) && (
                <div className="cia-pipeline-view">
                    {/* SEPARATE LIFECYCLE SWITCHER BAR */}
                    <div className="cia-lifecycle-switcher-bar">
                        <button
                            type="button"
                            className="cia-lsb-btn"
                            onClick={() => {
                                setActiveLifecycleTab("visitors");
                                setActiveTab("visitors-lifecycle");
                            }}
                        >
                            <UserCheck size={18} />
                            <span className="lsb-title">Visitors Lifecycle Funnel</span>
                            <span className="lsb-badge visitors">{realVisitors.length} Newcomers</span>
                        </button>
                        <button
                            type="button"
                            className="cia-lsb-btn active-members"
                            onClick={() => {
                                setActiveLifecycleTab("members");
                                setActiveTab("members-lifecycle");
                            }}
                        >
                            <Crown size={18} />
                            <span className="lsb-title">Members Lifecycle Pipeline</span>
                            <span className="lsb-badge members">{realMembers.length} Members</span>
                        </button>
                    </div>

                    <div className="cia-pipeline-info-banner">
                        <div className="cia-pib-content">
                            <strong>100% Church Members Lifecycle Pipeline: Onboarding ➔ Discipleship ➔ Ministry Workers ➔ Leaders</strong>
                            <p>Tracking all {realMembers.length} official church members through spiritual growth, ministry involvement, and leadership commissioning.</p>
                        </div>
                    </div>

                    <div className="cia-kanban-board">
                        {/* COLUMN 1: NEW MEMBERS & ONBOARDING */}
                        <div className="cia-kanban-col">
                            <div className="cia-col-header amber">
                                <div>
                                    <span className="cia-col-step">STAGE 1</span>
                                    <h4>New Members & Onboarding</h4>
                                </div>
                                <span className="cia-col-count">{membersLifecycle.stage1NewMembers.length}</span>
                            </div>
                            <div className="cia-col-cards">
                                {membersLifecycle.stage1NewMembers.map((m) => (
                                    <div key={m.memberId} className="cia-kanban-card">
                                        <div className="cia-card-top">
                                            <span className="cia-id-tag">{m.memberCode || `MEM-${m.memberId}`}</span>
                                            <span className="cia-status-chip unassigned">Onboarding</span>
                                        </div>
                                        <h5 className="cia-card-name">{m.fullName || `${m.firstName} ${m.lastName}`}</h5>
                                        <p className="cia-card-sub"><Phone size={12} /> {m.contactNumber || "No Phone"}</p>
                                        <p className="cia-card-sub"><Clock size={12} /> Joined: {m.joinedDate || "Active"}</p>
                                        <div className="cia-card-footer">
                                            <button
                                                type="button"
                                                className="cia-btn-sm-action"
                                                onClick={() => {
                                                    setDiscipleshipForm((prev) => ({
                                                        ...prev,
                                                        fullName: m.fullName || `${m.firstName} ${m.lastName}`,
                                                        contactNumber: m.contactNumber,
                                                        memberId: m.memberId,
                                                    }));
                                                    setShowDiscipleshipModal(true);
                                                }}
                                                title="Enroll in Discipleship & Foundations"
                                            >
                                                <BookOpen size={13} />
                                                <span>Enroll Discipleship</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {membersLifecycle.stage1NewMembers.length === 0 && (
                                    <div className="cia-col-empty">No members currently in onboarding stage.</div>
                                )}
                            </div>
                        </div>

                        {/* COLUMN 2: DISCIPLESHIP & SPIRITUAL GROWTH */}
                        <div className="cia-kanban-col">
                            <div className="cia-col-header blue">
                                <div>
                                    <span className="cia-col-step">STAGE 2</span>
                                    <h4>Discipleship & Growth</h4>
                                </div>
                                <span className="cia-col-count">{membersLifecycle.stage2Disciples.length}</span>
                            </div>
                            <div className="cia-col-cards">
                                {membersLifecycle.stage2Disciples.map((m) => {
                                    const disc = disciples.find(
                                        (d) => d.id === m.memberId || d.fullName.toLowerCase().trim() === (m.fullName || `${m.firstName} ${m.lastName}`).toLowerCase().trim()
                                    );
                                    return (
                                        <div key={m.memberId} className="cia-kanban-card">
                                            <div className="cia-card-top">
                                                <span className="cia-id-tag">{m.memberCode || `MEM-${m.memberId}`}</span>
                                                <span className="cia-status-chip contacted">{disc?.stage || "Disciple"}</span>
                                            </div>
                                            <h5 className="cia-card-name">{m.fullName || `${m.firstName} ${m.lastName}`}</h5>
                                            <p className="cia-card-sub"><Users size={12} /> Mentor: <strong>{disc?.disciplerName || "Assigned Discipler"}</strong></p>
                                            <p className="cia-card-sub"><ShieldCheck size={12} /> Cell: {disc?.cellGroupName || "San Vicente Life Group"}</p>
                                            <div className="cia-card-badge-row">
                                                {disc?.waterBaptism?.isBaptized ? (
                                                    <span className="cia-pill-success">🌊 Water Baptized</span>
                                                ) : (
                                                    <span className="cia-pill-pending">⏳ Baptism Pending</span>
                                                )}
                                            </div>
                                            <div className="cia-card-footer">
                                                <button
                                                    type="button"
                                                    className="cia-btn-sm-touchpoint"
                                                    onClick={() => setActiveTab("discipleship")}
                                                    title="View full discipleship profile"
                                                >
                                                    <BookOpen size={12} />
                                                    <span>View Foundations</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {membersLifecycle.stage2Disciples.length === 0 && (
                                    <div className="cia-col-empty">No members currently in discipleship stage.</div>
                                )}
                            </div>
                        </div>

                        {/* COLUMN 3: MINISTRY DEPARTMENT WORKERS */}
                        <div className="cia-kanban-col">
                            <div className="cia-col-header emerald">
                                <div>
                                    <span className="cia-col-step">STAGE 3</span>
                                    <h4>Ministry Workers</h4>
                                </div>
                                <span className="cia-col-count">{membersLifecycle.stage3Workers.length}</span>
                            </div>
                            <div className="cia-col-cards">
                                {membersLifecycle.stage3Workers.map((m) => {
                                    const dept = getMemberDepartment(m.ministry);
                                    return (
                                        <div key={m.memberId} className="cia-kanban-card">
                                            <div className="cia-card-top">
                                                <span className="cia-id-tag">{m.memberCode || `MEM-${m.memberId}`}</span>
                                                <span className={`cia-dept-chip ${dept.badgeClass}`}>
                                                    {dept.icon} {dept.name}
                                                </span>
                                            </div>
                                            <h5 className="cia-card-name">{m.fullName || `${m.firstName} ${m.lastName}`}</h5>
                                            <p className="cia-card-sub"><Award size={12} /> Role: {m.position || m.ministry || "Active Servant"}</p>
                                            <p className="cia-card-sub"><Phone size={12} /> {m.contactNumber || "No Phone"}</p>
                                            <div className="cia-card-footer">
                                                <button
                                                    type="button"
                                                    className="cia-btn-sm-action"
                                                    onClick={() => {
                                                        setSendingForm((prev) => ({
                                                            ...prev,
                                                            fullName: m.fullName || `${m.firstName} ${m.lastName}`,
                                                            contactNumber: m.contactNumber,
                                                            ministryDepartment: dept.name,
                                                            ministryRole: m.position || "Leader Candidate",
                                                        }));
                                                        setShowSendingModal(true);
                                                    }}
                                                    title="Commission to Leadership Track"
                                                >
                                                    <Sparkles size={12} />
                                                    <span>Commission Leader</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {membersLifecycle.stage3Workers.length === 0 && (
                                    <div className="cia-col-empty">No department workers in this stage.</div>
                                )}
                            </div>
                        </div>

                        {/* COLUMN 4: COMMISSIONED LEADERS & PASTORAL STAFF */}
                        <div className="cia-kanban-col">
                            <div className="cia-col-header purple">
                                <div>
                                    <span className="cia-col-step">STAGE 4</span>
                                    <h4>Commissioned Leaders</h4>
                                </div>
                                <span className="cia-col-count">{membersLifecycle.stage4Leaders.length}</span>
                            </div>
                            <div className="cia-col-cards">
                                {membersLifecycle.stage4Leaders.map((m) => {
                                    const roleTag = getLeaderRoleTag(m.ministry);
                                    const workload = leaderWorkloadMap[m.memberId] || 0;
                                    return (
                                        <div key={m.memberId} className="cia-kanban-card sent-card">
                                            <div className="cia-card-top">
                                                <span className="cia-id-tag">{m.memberCode || `MEM-${m.memberId}`}</span>
                                                <span className={`cia-role-chip ${roleTag.tag}`}>
                                                    {roleTag.icon} {roleTag.label}
                                                </span>
                                            </div>
                                            <h5 className="cia-card-name">{m.fullName || `${m.firstName} ${m.lastName}`}</h5>
                                            <p className="cia-card-sub"><Crown size={12} /> Ministry: <strong>{m.ministry || roleTag.label}</strong></p>
                                            <p className="cia-card-sub"><Phone size={12} /> {m.contactNumber || "No Phone"}</p>
                                            <div className="cia-card-fruit-box">
                                                <span className="fruit-count">👥 {workload} Assigned Newcomers</span>
                                                <small>Under pastoral care</small>
                                            </div>
                                            <div className="cia-card-footer">
                                                <button
                                                    type="button"
                                                    className="cia-btn-sm-action"
                                                    onClick={() => {
                                                        setLeaderFilter(String(m.memberId));
                                                        setActiveTab("delegation");
                                                    }}
                                                    title="View assigned newcomers in Delegation Center"
                                                >
                                                    <UserCog size={12} />
                                                    <span>View Assigned Flock</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {membersLifecycle.stage4Leaders.length === 0 && (
                                    <div className="cia-col-empty">No commissioned leaders recorded yet.</div>
                                )}
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
                                    <label>Select Delegated Leader (Assistant Pastors & Leaders Only) *</label>
                                    <div className="cia-delegation-notice">
                                        <span>🛡️</span>
                                        <div>
                                            <strong>Delegation Policy:</strong> Only Assistant Pastors, Adult Leaders, and Youth Leaders are authorized to receive delegated souls. General church members are excluded.
                                        </div>
                                    </div>
                                    <select
                                        required
                                        value={delegationForm.assignedLeaderId}
                                        onChange={(e) => {
                                            const leaderId = e.target.value;
                                            const member = realLeaders.find((m) => m.memberId === Number(leaderId))
                                                || realMembers.find((m) => m.memberId === Number(leaderId));
                                            setDelegationForm({
                                                ...delegationForm,
                                                assignedLeaderId: leaderId ? Number(leaderId) : "",
                                                assignedLeaderName: member ? member.fullName : "",
                                            });
                                        }}
                                    >
                                        <option value="">-- Choose Delegated Leader (Pastors & Leaders Only) --</option>
                                        
                                        {assistantPastors.length > 0 && (
                                            <optgroup label="👑 ASSISTANT PASTORS">
                                                {assistantPastors.map((m) => {
                                                    const count = leaderWorkloadMap[m.memberId] || 0;
                                                    return (
                                                        <option key={m.memberId} value={m.memberId}>
                                                            {m.fullName} ({m.memberCode || `ID #${m.memberId}`}) — Assistant Pastor [{count} active assigned]
                                                        </option>
                                                    );
                                                })}
                                            </optgroup>
                                        )}

                                        {adultLeaders.length > 0 && (
                                            <optgroup label="🌟 ADULT LEADERS">
                                                {adultLeaders.map((m) => {
                                                    const count = leaderWorkloadMap[m.memberId] || 0;
                                                    return (
                                                        <option key={m.memberId} value={m.memberId}>
                                                            {m.fullName} ({m.memberCode || `ID #${m.memberId}`}) — Adult Leader [{count} active assigned]
                                                        </option>
                                                    );
                                                })}
                                            </optgroup>
                                        )}

                                        {youthLeaders.length > 0 && (
                                            <optgroup label="🔥 YOUTH LEADERS">
                                                {youthLeaders.map((m) => {
                                                    const count = leaderWorkloadMap[m.memberId] || 0;
                                                    return (
                                                        <option key={m.memberId} value={m.memberId}>
                                                            {m.fullName} ({m.memberCode || `ID #${m.memberId}`}) — Youth Leader [{count} active assigned]
                                                        </option>
                                                    );
                                                })}
                                            </optgroup>
                                        )}

                                        {otherLeaders.length > 0 && (
                                            <optgroup label="⚡ OTHER CHURCH LEADERS">
                                                {otherLeaders.map((m) => {
                                                    const count = leaderWorkloadMap[m.memberId] || 0;
                                                    return (
                                                        <option key={m.memberId} value={m.memberId}>
                                                            {m.fullName} ({m.memberCode || `ID #${m.memberId}`}) — {m.ministry} [{count} active assigned]
                                                        </option>
                                                    );
                                                })}
                                            </optgroup>
                                        )}
                                    </select>
                                    <small className="form-hint">
                                        💡 Choose an ordained pastor or department leader who will disciple this newcomer.
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
                                            <option value="">-- Select Discipler / Mentor --</option>
                                            <optgroup label="👑 Ordained Pastors & Department Leaders">
                                                {realLeaders.map((m) => {
                                                    const roleTag = getLeaderRoleTag(m.ministry);
                                                    return (
                                                        <option key={m.memberId} value={m.fullName}>
                                                            {roleTag.icon} {m.fullName} — {roleTag.label} ({m.memberCode})
                                                        </option>
                                                    );
                                                })}
                                            </optgroup>
                                            <optgroup label="👥 General Congregation Members">
                                                {realMembers
                                                    .filter((m) => !realLeaders.some((l) => l.memberId === m.memberId))
                                                    .map((m) => (
                                                        <option key={m.memberId} value={m.fullName}>
                                                            {m.fullName} ({m.memberCode || `#${m.memberId}`})
                                                        </option>
                                                    ))}
                                            </optgroup>
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
