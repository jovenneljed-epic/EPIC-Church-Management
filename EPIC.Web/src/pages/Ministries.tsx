// ============================================================
// Ministries.tsx
// COMPLETE FIXED VERSION
// MEMBERONLY / MEMBERS CANNOT CREATE
// ============================================================

import React, {
    useCallback,
    useState
} from "react";

import "./Ministries.css";

import { ministryApi } from "./Ministries/services/ministryApi";
import { useMinistries } from "./Ministries/hooks/useMinistries";
import PermissionService from "../PermissionService";

import type {
    Ministry,
    MinistryForm,
    MinistryMember,
    PerformanceRating,
    MinistrySummaryMember
} from "./Ministries/types/ministry";

/* =========================================================
   TYPES
========================================================= */

type ActiveTab =
    | "overview"
    | "members"
    | "performance";

type MemberForm = {
    memberId: string;
    role: string;
    position: string;
    notes: string;
};

type RatingFieldKey =
    | "attendanceRating"
    | "commitmentRating"
    | "participationRating"
    | "teamworkRating"
    | "spiritualGrowthRating"
    | "leadershipRating"
    | "responsibilityRating";

/* =========================================================
   CONSTANTS
========================================================= */

const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

const RATING_FIELDS: Array<{
    label: string;
    key: RatingFieldKey;
}> = [
        {
            label: "Attendance",
            key: "attendanceRating"
        },
        {
            label: "Commitment",
            key: "commitmentRating"
        },
        {
            label: "Participation",
            key: "participationRating"
        },
        {
            label: "Teamwork",
            key: "teamworkRating"
        },
        {
            label: "Spiritual Growth",
            key: "spiritualGrowthRating"
        },
        {
            label: "Leadership",
            key: "leadershipRating"
        },
        {
            label: "Responsibility",
            key: "responsibilityRating"
        }
    ];

/* =========================================================
   DEFAULT VALUES
========================================================= */

const createEmptyMinistryForm = (): MinistryForm => ({
    name: "",
    ministryHead: "",
    description: "",
    status: "ACTIVE"
});

const createEmptyMemberForm = (): MemberForm => ({
    memberId: "",
    role: "",
    position: "",
    notes: ""
});

const getToday = (): string => {
    return new Date()
        .toISOString()
        .split("T")[0];
};

const createEmptyPerformance =
    (): PerformanceRating => ({
        ministryMemberId: 0,
        evaluationDate: getToday(),

        attendanceRating: 3,
        commitmentRating: 3,
        participationRating: 3,
        teamworkRating: 3,
        spiritualGrowthRating: 3,
        leadershipRating: 3,
        responsibilityRating: 3,

        overallRating: 3,

        strengths: "",
        areasForImprovement: "",
        recommendations: "",
        evaluator: "",
        notes: ""
    });

/* =========================================================
   UTILITIES
========================================================= */

const getMemberName = (
    member?: {
        firstName?: string;
        middleName?: string;
        lastName?: string;
        fullName?: string;
        name?: string;
    } | null
): string => {
    if (!member) {
        return "Unknown Member";
    }

    if (member.fullName?.trim()) {
        return member.fullName.trim();
    }

    if (member.name?.trim()) {
        return member.name.trim();
    }

    const fullName = [
        member.firstName,
        member.middleName,
        member.lastName
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    return fullName || "Unknown Member";
};

const formatDate = (
    value?: string | null
): string => {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
};

const getRatingLabel = (
    value: number
): string => {
    switch (value) {
        case 1:
            return "Unsatisfactory";

        case 2:
            return "Needs Improvement";

        case 3:
            return "Satisfactory";

        case 4:
            return "Very Good";

        case 5:
            return "Excellent";

        default:
            return "";
    }
};

const getRatingClass = (
    value: number
): string => {
    if (value >= 4.5) {
        return "excellent";
    }

    if (value >= 3.5) {
        return "very-good";
    }

    if (value >= 2.5) {
        return "satisfactory";
    }

    if (value >= 1.5) {
        return "needs-improvement";
    }

    return "unsatisfactory";
};

const getRatingValue = (
    rating: PerformanceRating,
    key: RatingFieldKey
): number => {
    const value = Number(rating[key]);

    if (Number.isNaN(value)) {
        return 0;
    }

    return value;
};

/* =========================================================
   COMPONENT
========================================================= */

const Ministries: React.FC = () => {

    const {
        ministries,
        members,

        selectedMinistryId,
        setSelectedMinistryId,

        selectedMinistry,

        summary,
        ministryMembers,

        loading,
        memberLoading,

        error,
        setError,

        loadMinistries,
        loadMinistryData
    } = useMinistries();

    /* =====================================================
       PERMISSIONS
    ===================================================== */

    const canCreateMinistry =
        PermissionService.canCreate(
            "Ministries"
        );

    const canEditMinistry =
        PermissionService.canEdit(
            "Ministries"
        );

    const canDeleteMinistry =
        PermissionService.canDelete(
            "Ministries"
        );

    const canCreatePerformance =
        PermissionService.canCreate(
            "Ministries"
        );

    const canEditPerformance =
        PermissionService.canEdit(
            "Ministries"
        );

    const canDeletePerformance =
        PermissionService.canDelete(
            "Ministries"
        );

    /* =====================================================
       UI STATE
    ===================================================== */

    const [activeTab, setActiveTab] =
        useState<ActiveTab>("overview");

    const [selectedMember, setSelectedMember] =
        useState<MinistryMember | null>(null);

    const [performanceHistory, setPerformanceHistory] =
        useState<PerformanceRating[]>([]);

    const [performanceLoading, setPerformanceLoading] =
        useState(false);

    const [success, setSuccess] =
        useState("");

    /* =====================================================
       MODAL STATE
    ===================================================== */

    const [showMinistryModal, setShowMinistryModal] =
        useState(false);

    const [showMemberModal, setShowMemberModal] =
        useState(false);

    const [showPerformanceModal, setShowPerformanceModal] =
        useState(false);

    /* =====================================================
       EDIT STATE
    ===================================================== */

    const [editingMinistry, setEditingMinistry] =
        useState<Ministry | null>(null);

    const [editingPerformance, setEditingPerformance] =
        useState<PerformanceRating | null>(null);

    /* =====================================================
       FORMS
    ===================================================== */

    const [ministryForm, setMinistryForm] =
        useState<MinistryForm>(
            createEmptyMinistryForm()
        );

    const [memberForm, setMemberForm] =
        useState<MemberForm>(
            createEmptyMemberForm()
        );

    const [performanceForm, setPerformanceForm] =
        useState<PerformanceRating>(
            createEmptyPerformance()
        );

    /* =====================================================
       NOTIFICATIONS
    ===================================================== */

    const clearMessages = useCallback(() => {
        setError("");
        setSuccess("");
    }, [setError]);

    const showSuccess = useCallback(
        (message: string) => {
            setError("");
            setSuccess(message);

            window.setTimeout(() => {
                setSuccess("");
            }, 3500);
        },
        [setError]
    );

    const showError = useCallback(
        (message: string) => {
            setSuccess("");
            setError(message);
        },
        [setError]
    );

    /* =====================================================
       PERFORMANCE HISTORY
    ===================================================== */

    const loadPerformanceHistory =
        useCallback(
            async (
                ministryMemberId: number
            ) => {
                try {
                    setPerformanceLoading(
                        true
                    );

                    setError("");

                    const data =
                        await ministryApi
                            .getPerformanceHistory(
                                ministryMemberId
                            );

                    setPerformanceHistory(
                        Array.isArray(data)
                            ? data
                            : []
                    );
                } catch (err) {
                    setPerformanceHistory([]);

                    showError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load performance history."
                    );
                } finally {
                    setPerformanceLoading(
                        false
                    );
                }
            },
            [setError, showError]
        );

    /* =====================================================
       CREATE MINISTRY
    ===================================================== */

    const openCreateMinistry =
        useCallback(() => {

            if (!canCreateMinistry) {
                showError(
                    "You do not have permission to create a ministry."
                );
                return;
            }

            clearMessages();

            setEditingMinistry(null);

            setMinistryForm(
                createEmptyMinistryForm()
            );

            setShowMinistryModal(true);

        }, [
            canCreateMinistry,
            clearMessages,
            showError
        ]);

    /* =====================================================
       EDIT MINISTRY
    ===================================================== */

    const openEditMinistry =
        useCallback(() => {

            if (!canEditMinistry) {
                showError(
                    "You do not have permission to edit ministries."
                );
                return;
            }

            if (!selectedMinistry) {
                showError(
                    "Please select a ministry first."
                );
                return;
            }

            clearMessages();

            setEditingMinistry(
                selectedMinistry
            );

            setMinistryForm({
                name:
                    selectedMinistry.name ||
                    "",
                ministryHead:
                    selectedMinistry.ministryHead ||
                    "",
                description:
                    selectedMinistry.description ||
                    "",
                status:
                    selectedMinistry.status ||
                    "ACTIVE"
            });

            setShowMinistryModal(true);

        }, [
            canEditMinistry,
            selectedMinistry,
            clearMessages,
            showError
        ]);

    /* =====================================================
       SAVE MINISTRY
    ===================================================== */

    const saveMinistry = async () => {

        const isEditing =
            Boolean(editingMinistry);

        if (
            isEditing
                ? !canEditMinistry
                : !canCreateMinistry
        ) {
            showError(
                "You do not have permission to perform this action."
            );
            return;
        }

        if (!ministryForm.name.trim()) {
            showError(
                "Ministry name is required."
            );
            return;
        }

        try {

            clearMessages();

            const payload = {
                name:
                    ministryForm.name.trim(),

                ministryHead:
                    ministryForm.ministryHead.trim(),

                description:
                    ministryForm.description.trim(),

                status:
                    ministryForm.status
            };

            let data: Ministry;

            if (isEditing) {

                data =
                    await ministryApi
                        .updateMinistry(
                            editingMinistry!.ministryId,
                            payload
                        );

            } else {

                data =
                    await ministryApi
                        .createMinistry(
                            payload
                        );
            }

            setShowMinistryModal(
                false
            );

            await loadMinistries();

            if (isEditing) {

                setSelectedMinistryId(
                    editingMinistry!.ministryId
                );

            } else if (data?.ministryId) {

                setSelectedMinistryId(
                    data.ministryId
                );
            }

            showSuccess(
                isEditing
                    ? "Ministry updated successfully."
                    : "Ministry created successfully."
            );

        } catch (err) {

            showError(
                err instanceof Error
                    ? err.message
                    : "Unable to save ministry."
            );
        }
    };

    /* =====================================================
       MINISTRY STATUS
    ===================================================== */

    const toggleMinistryStatus =
        async () => {

            if (!canEditMinistry) {
                showError(
                    "You do not have permission to modify ministries."
                );
                return;
            }

            if (!selectedMinistry) {
                showError(
                    "Please select a ministry first."
                );
                return;
            }

            const isActive =
                selectedMinistry.status ===
                "ACTIVE";

            if (isActive) {

                const confirmed =
                    window.confirm(
                        `Deactivate "${selectedMinistry.name}"?`
                    );

                if (!confirmed) {
                    return;
                }
            }

            try {

                clearMessages();

                if (isActive) {

                    await ministryApi
                        .deactivateMinistry(
                            selectedMinistry.ministryId
                        );

                } else {

                    await ministryApi
                        .updateMinistry(
                            selectedMinistry.ministryId,
                            {
                                name:
                                    selectedMinistry.name,

                                ministryHead:
                                    selectedMinistry.ministryHead ||
                                    "",

                                description:
                                    selectedMinistry.description ||
                                    "",

                                status:
                                    "ACTIVE"
                            }
                        );
                }

                await loadMinistries();

                showSuccess(
                    isActive
                        ? "Ministry deactivated successfully."
                        : "Ministry activated successfully."
                );

            } catch (err) {

                showError(
                    err instanceof Error
                        ? err.message
                        : "Unable to update ministry status."
                );
            }
        };

    /* =====================================================
       MEMBER MODAL
    ===================================================== */

    const openMemberModal = () => {

        if (!canCreateMinistry) {
            showError(
                "You do not have permission to assign ministry members."
            );
            return;
        }

        if (!selectedMinistry) {
            showError(
                "Please select a ministry first."
            );
            return;
        }

        clearMessages();

        setMemberForm(
            createEmptyMemberForm()
        );

        setShowMemberModal(true);
    };

    /* =====================================================
       ASSIGN MEMBER
    ===================================================== */

    const assignMember = async () => {

        if (!canCreateMinistry) {
            showError(
                "You do not have permission to assign ministry members."
            );
            return;
        }

        if (!selectedMinistry) {
            showError(
                "Please select a ministry first."
            );
            return;
        }

        if (!memberForm.memberId) {
            showError(
                "Please select a member."
            );
            return;
        }

        try {

            clearMessages();

            await ministryApi.assignMember({
                ministryId:
                    selectedMinistry.ministryId,

                memberId:
                    Number(
                        memberForm.memberId
                    ),

                role:
                    memberForm.role.trim(),

                position:
                    memberForm.position.trim(),

                status:
                    "ACTIVE",

                notes:
                    memberForm.notes.trim(),

                dateAssigned:
                    new Date().toISOString()
            });

            setShowMemberModal(false);

            await loadMinistryData(
                selectedMinistry.ministryId
            );

            showSuccess(
                "Member assigned to ministry successfully."
            );

        } catch (err) {

            showError(
                err instanceof Error
                    ? err.message
                    : "Unable to assign member."
            );
        }
    };

    /* =====================================================
       DEACTIVATE MEMBER
    ===================================================== */

    const deactivateMember =
        async (
            assignment: MinistryMember
        ) => {

            if (!canDeleteMinistry) {
                showError(
                    "You do not have permission to remove ministry members."
                );
                return;
            }

            if (!selectedMinistryId) {
                return;
            }

            const confirmed =
                window.confirm(
                    `Remove ${getMemberName(
                        assignment.member
                    )} from this ministry?`
                );

            if (!confirmed) {
                return;
            }

            try {

                clearMessages();

                await ministryApi
                    .deactivateMember(
                        assignment.ministryMemberId
                    );

                await loadMinistryData(
                    selectedMinistryId
                );

                showSuccess(
                    "Ministry member assignment deactivated."
                );

            } catch (err) {

                showError(
                    err instanceof Error
                        ? err.message
                        : "Unable to remove member."
                );
            }
        };

    /* =====================================================
       OPEN PERFORMANCE
    ===================================================== */

    const openPerformance =
        async (
            member:
                | MinistrySummaryMember
                | MinistryMember
        ) => {

            const ministryMember:
                MinistryMember = {

                ministryMemberId:
                    member.ministryMemberId,

                ministryId:
                    selectedMinistryId || 0,

                memberId:
                    member.memberId,

                member:
                    member.member,

                role:
                    member.role,

                position:
                    member.position,

                status:
                    member.status,

                notes:
                    "notes" in member
                        ? member.notes
                        : "",

                dateAssigned:
                    "dateAssigned" in member
                        ? member.dateAssigned
                        : ""
            };

            setSelectedMember(
                ministryMember
            );

            setActiveTab(
                "performance"
            );

            await loadPerformanceHistory(
                member.ministryMemberId
            );
        };

    /* =====================================================
       CREATE PERFORMANCE
    ===================================================== */

    const openCreatePerformance =
        () => {

            if (!canCreatePerformance) {
                showError(
                    "You do not have permission to create performance evaluations."
                );
                return;
            }

            if (!selectedMember) {
                showError(
                    "Please select a ministry member first."
                );
                return;
            }

            clearMessages();

            setEditingPerformance(null);

            setPerformanceForm({
                ...createEmptyPerformance(),

                ministryMemberId:
                    selectedMember
                        .ministryMemberId,

                evaluationDate:
                    getToday()
            });

            setShowPerformanceModal(
                true
            );
        };

    /* =====================================================
       EDIT PERFORMANCE
    ===================================================== */

    const openEditPerformance =
        (
            rating: PerformanceRating
        ) => {

            if (!canEditPerformance) {
                showError(
                    "You do not have permission to edit performance evaluations."
                );
                return;
            }

            clearMessages();

            setEditingPerformance(
                rating
            );

            setPerformanceForm({
                ...rating,

                evaluationDate:
                    rating.evaluationDate
                        ? rating.evaluationDate
                            .split("T")[0]
                        : getToday()
            });

            setShowPerformanceModal(
                true
            );
        };

    /* =====================================================
       SAVE PERFORMANCE
    ===================================================== */

    const savePerformance =
        async () => {

            const isEditing =
                Boolean(
                    editingPerformance
                );

            if (
                isEditing
                    ? !canEditPerformance
                    : !canCreatePerformance
            ) {
                showError(
                    "You do not have permission to perform this action."
                );
                return;
            }

            if (
                !performanceForm
                    .ministryMemberId
            ) {
                showError(
                    "Ministry member assignment is required."
                );
                return;
            }

            try {

                clearMessages();

                const payload:
                    PerformanceRating = {

                    ministryMemberId:
                        performanceForm
                            .ministryMemberId,

                    evaluationDate:
                        performanceForm
                            .evaluationDate,

                    attendanceRating:
                        Number(
                            performanceForm
                                .attendanceRating
                        ),

                    commitmentRating:
                        Number(
                            performanceForm
                                .commitmentRating
                        ),

                    participationRating:
                        Number(
                            performanceForm
                                .participationRating
                        ),

                    teamworkRating:
                        Number(
                            performanceForm
                                .teamworkRating
                        ),

                    spiritualGrowthRating:
                        Number(
                            performanceForm
                                .spiritualGrowthRating
                        ),

                    leadershipRating:
                        Number(
                            performanceForm
                                .leadershipRating
                        ),

                    responsibilityRating:
                        Number(
                            performanceForm
                                .responsibilityRating
                        ),

                    overallRating:
                        Number(
                            performanceForm
                                .overallRating
                        ),

                    strengths:
                        performanceForm
                            .strengths
                            ?.trim() || "",

                    areasForImprovement:
                        performanceForm
                            .areasForImprovement
                            ?.trim() || "",

                    recommendations:
                        performanceForm
                            .recommendations
                            ?.trim() || "",

                    evaluator:
                        performanceForm
                            .evaluator
                            ?.trim() || "",

                    notes:
                        performanceForm
                            .notes
                            ?.trim() || ""
                };

                if (isEditing) {

                    if (
                        !editingPerformance
                            ?.performanceRatingId
                    ) {
                        throw new Error(
                            "Performance evaluation ID is missing."
                        );
                    }

                    await ministryApi
                        .updatePerformance(
                            editingPerformance
                                .performanceRatingId,
                            payload
                        );

                } else {

                    await ministryApi
                        .createPerformance(
                            payload
                        );
                }

                setShowPerformanceModal(
                    false
                );

                await loadPerformanceHistory(
                    performanceForm
                        .ministryMemberId
                );

                if (selectedMinistryId) {

                    await loadMinistryData(
                        selectedMinistryId
                    );
                }

                showSuccess(
                    isEditing
                        ? "Performance rating updated successfully."
                        : "Performance rating saved successfully."
                );

            } catch (err) {

                showError(
                    err instanceof Error
                        ? err.message
                        : "Unable to save performance rating."
                );
            }
        };

    /* =====================================================
       DELETE PERFORMANCE
    ===================================================== */

    const deletePerformance =
        async (
            rating: PerformanceRating
        ) => {

            if (!canDeletePerformance) {
                showError(
                    "You do not have permission to delete performance evaluations."
                );
                return;
            }

            if (
                !rating.performanceRatingId
            ) {
                return;
            }

            const confirmed =
                window.confirm(
                    "Delete this performance evaluation?"
                );

            if (!confirmed) {
                return;
            }

            try {

                clearMessages();

                await ministryApi
                    .deletePerformance(
                        rating.performanceRatingId
                    );

                await loadPerformanceHistory(
                    rating.ministryMemberId
                );

                if (selectedMinistryId) {

                    await loadMinistryData(
                        selectedMinistryId
                    );
                }

                showSuccess(
                    "Performance evaluation deleted."
                );

            } catch (err) {

                showError(
                    err instanceof Error
                        ? err.message
                        : "Unable to delete performance rating."
                );
            }
        };

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="ministries-page">

            {/* =================================================
                NOTIFICATIONS
            ================================================= */}

            {success && (
                <div className="ministry-toast success">
                    <span>✓</span>
                    {success}
                </div>
            )}

            {error && (
                <div className="ministry-toast error">
                    <span>!</span>

                    {error}

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                    >
                        ×
                    </button>
                </div>
            )}

            {/* =================================================
                HERO
            ================================================= */}

            <section className="ministry-hero">

                <div className="hero-grid" />

                <div className="hero-content">

                    <div className="hero-kicker">
                        EPIC MINISTRY NETWORK
                    </div>

                    <h1>
                        Ministries
                        <span>
                            Management
                        </span>
                    </h1>

                    <p>
                        Develop people. Track service.
                        Strengthen ministry.
                    </p>

                </div>

                <div className="hero-actions">

                    <button
                        type="button"
                        className="hero-button secondary"
                        onClick={() =>
                            void loadMinistries()
                        }
                        disabled={loading}
                    >
                        ↻ Refresh Data
                    </button>

                    {/* CREATE PERMISSION */}
                    <button
                        type="button"
                        className="hero-button primary"
                        onClick={
                            openCreateMinistry
                        }
                        disabled={
                            !canCreateMinistry
                        }
                        title={
                            !canCreateMinistry
                                ? "You do not have permission to create ministries."
                                : "Create a new ministry"
                        }
                    >
                        ＋ New Ministry
                    </button>

                </div>

            </section>

            {/* =================================================
                MINISTRY SELECTOR
            ================================================= */}

            <section className="ministry-selector-card">

                <div className="selector-label">

                    <span>
                        ACTIVE MINISTRY
                    </span>

                    <strong>
                        Select department
                    </strong>

                </div>

                <select
                    value={
                        selectedMinistryId ??
                        ""
                    }
                    onChange={(e) => {

                        const value =
                            e.target.value;

                        setSelectedMinistryId(
                            value
                                ? Number(value)
                                : null
                        );

                    }}
                >

                    <option value="">
                        Select Ministry
                    </option>

                    {ministries.map(
                        (ministry) => (
                            <option
                                key={
                                    ministry.ministryId
                                }
                                value={
                                    ministry.ministryId
                                }
                            >
                                {ministry.name}
                                {" — "}
                                {ministry.status}
                            </option>
                        )
                    )}

                </select>

                {selectedMinistry && (
                    <div className="selector-actions">

                        <button
                            type="button"
                            className="small-action"
                            onClick={
                                openEditMinistry
                            }
                            disabled={
                                !canEditMinistry
                            }
                            title={
                                !canEditMinistry
                                    ? "You do not have permission to edit ministries."
                                    : undefined
                            }
                        >
                            ✎ Edit
                        </button>

                        <button
                            type="button"
                            className={`small-action ${selectedMinistry.status ===
                                    "ACTIVE"
                                    ? "danger"
                                    : "success-action"
                                }`}
                            onClick={
                                toggleMinistryStatus
                            }
                            disabled={
                                !canEditMinistry
                            }
                            title={
                                !canEditMinistry
                                    ? "You do not have permission to modify ministries."
                                    : undefined
                            }
                        >
                            {selectedMinistry.status ===
                                "ACTIVE"
                                ? "⏸ Deactivate"
                                : "▶ Activate"}
                        </button>

                    </div>
                )}

            </section>

            {/* =================================================
                STATISTICS
            ================================================= */}

            <section className="ministry-stat-grid">

                <div className="ministry-stat-card">

                    <div className="stat-icon blue">
                        ◈
                    </div>

                    <div>

                        <span>
                            ACTIVE MEMBERS
                        </span>

                        <strong>
                            {
                                summary
                                    ?.totalActiveMembers ??
                                0
                            }
                        </strong>

                    </div>

                </div>

                <div className="ministry-stat-card">

                    <div className="stat-icon green">
                        ✓
                    </div>

                    <div>

                        <span>
                            EVALUATED
                        </span>

                        <strong>
                            {
                                summary
                                    ?.evaluatedMembers ??
                                0
                            }
                        </strong>

                    </div>

                </div>

                <div className="ministry-stat-card">

                    <div className="stat-icon orange">
                        ○
                    </div>

                    <div>

                        <span>
                            NEEDS EVALUATION
                        </span>

                        <strong>
                            {
                                summary
                                    ?.membersWithoutEvaluation ??
                                0
                            }
                        </strong>

                    </div>

                </div>

                <div className="ministry-stat-card average-card">

                    <div
                        className={`average-ring ${getRatingClass(
                            summary
                                ?.averageOverallRating ||
                            0
                        )}`}
                    >
                        {(
                            summary
                                ?.averageOverallRating ||
                            0
                        ).toFixed(2)}
                    </div>

                    <div>

                        <span>
                            MINISTRY AVERAGE
                        </span>

                        <strong>
                            / 5.00
                        </strong>

                    </div>

                </div>

            </section>

            {/* =================================================
                TABS
            ================================================= */}

            <div className="ministry-tabs">

                <button
                    type="button"
                    className={
                        activeTab ===
                            "overview"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab(
                            "overview"
                        )
                    }
                >
                    ⌂ Overview
                </button>

                <button
                    type="button"
                    className={
                        activeTab ===
                            "members"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab(
                            "members"
                        )
                    }
                >
                    ♟ Ministry Members
                </button>

                <button
                    type="button"
                    className={
                        activeTab ===
                            "performance"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab(
                            "performance"
                        )
                    }
                    disabled={
                        !selectedMember
                    }
                >
                    ◈ Performance
                </button>

            </div>

            {/* =================================================
                OVERVIEW
            ================================================= */}

            {activeTab ===
                "overview" && (
                    <section className="overview-grid">

                        <div className="profile-card">

                            <div className="section-kicker">
                                MINISTRY PROFILE
                            </div>

                            {!selectedMinistry ? (
                                <>
                                    <h2>
                                        No Ministry Selected
                                    </h2>

                                    <p className="empty-description">
                                        Create a ministry or
                                        select one from the
                                        ministry selector above.
                                    </p>
                                </>
                            ) : (
                                <>

                                    <div className="profile-heading">

                                        <div>

                                            <h2>
                                                {
                                                    selectedMinistry.name
                                                }
                                            </h2>

                                            <p>
                                                {
                                                    selectedMinistry.description ||
                                                    "No ministry description provided."
                                                }
                                            </p>

                                        </div>

                                        <span
                                            className={`status-badge ${selectedMinistry.status ===
                                                    "ACTIVE"
                                                    ? "active"
                                                    : "inactive"
                                                }`}
                                        >
                                            {
                                                selectedMinistry.status
                                            }
                                        </span>

                                    </div>

                                    <div className="profile-details">

                                        <div>

                                            <span>
                                                MINISTRY CODE
                                            </span>

                                            <strong>
                                                {
                                                    selectedMinistry.ministryCode ||
                                                    "—"
                                                }
                                            </strong>

                                        </div>

                                        <div>

                                            <span>
                                                MINISTRY HEAD
                                            </span>

                                            <strong>
                                                {
                                                    selectedMinistry.ministryHead ||
                                                    "Not assigned"
                                                }
                                            </strong>

                                        </div>

                                        <div>

                                            <span>
                                                CREATED
                                            </span>

                                            <strong>
                                                {formatDate(
                                                    selectedMinistry.createdDate
                                                )}
                                            </strong>

                                        </div>

                                    </div>

                                </>
                            )}

                        </div>

                        <div className="performance-overview-card">

                            <div className="section-kicker">
                                PERFORMANCE HEALTH
                            </div>

                            <div className="large-score">

                                <div
                                    className={`score-circle ${getRatingClass(
                                        summary
                                            ?.averageOverallRating ||
                                        0
                                    )}`}
                                >

                                    <strong>
                                        {(
                                            summary
                                                ?.averageOverallRating ||
                                            0
                                        ).toFixed(2)}
                                    </strong>

                                    <span>
                                        / 5.00
                                    </span>

                                </div>

                            </div>

                            <p>
                                Current average based on
                                the latest evaluation for
                                each active ministry member.
                            </p>

                        </div>

                    </section>
                )}

            {/* =================================================
                MEMBERS
            ================================================= */}

            {activeTab ===
                "members" && (
                    <section className="module-card">

                        <div className="module-header">

                            <div>

                                <div className="section-kicker">
                                    MINISTRY PEOPLE
                                </div>

                                <h2>
                                    Ministry Members
                                </h2>

                                <p>
                                    Assign members, define
                                    responsibilities and track
                                    ministry participation.
                                </p>

                            </div>

                            {/* CREATE PERMISSION */}
                            <button
                                type="button"
                                className="primary-button"
                                onClick={
                                    openMemberModal
                                }
                                disabled={
                                    !canCreateMinistry ||
                                    !selectedMinistry ||
                                    selectedMinistry.status !==
                                    "ACTIVE"
                                }
                                title={
                                    !canCreateMinistry
                                        ? "You do not have permission to assign ministry members."
                                        : undefined
                                }
                            >
                                ＋ Assign Member
                            </button>

                        </div>

                        <div className="members-table-wrapper">

                            {memberLoading ? (

                                <div className="table-empty">
                                    Loading ministry members...
                                </div>

                            ) : ministryMembers.length ===
                                0 ? (

                                <div className="table-empty">

                                    <div className="empty-icon">
                                        ♟
                                    </div>

                                    <strong>
                                        No Ministry Members
                                    </strong>

                                    <span>
                                        Assign your first member
                                        to this ministry.
                                    </span>

                                </div>

                            ) : (

                                <table>

                                    <thead>

                                        <tr>

                                            <th>
                                                MEMBER
                                            </th>

                                            <th>
                                                ROLE
                                            </th>

                                            <th>
                                                POSITION
                                            </th>

                                            <th>
                                                ASSIGNED
                                            </th>

                                            <th>
                                                STATUS
                                            </th>

                                            <th>
                                                ACTION
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {ministryMembers.map(
                                            (member) => (

                                                <tr
                                                    key={
                                                        member.ministryMemberId
                                                    }
                                                >

                                                    <td>

                                                        <div className="member-cell">

                                                            <div className="member-avatar">

                                                                {getMemberName(
                                                                    member.member
                                                                )
                                                                    .charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase()}

                                                            </div>

                                                            <strong>
                                                                {
                                                                    getMemberName(
                                                                        member.member
                                                                    )
                                                                }
                                                            </strong>

                                                        </div>

                                                    </td>

                                                    <td>
                                                        {
                                                            member.role ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            member.position ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td>
                                                        {formatDate(
                                                            member.dateAssigned
                                                        )}
                                                    </td>

                                                    <td>

                                                        <span
                                                            className={`status-badge ${member.status ===
                                                                    "ACTIVE"
                                                                    ? "active"
                                                                    : "inactive"
                                                                }`}
                                                        >
                                                            {
                                                                member.status
                                                            }
                                                        </span>

                                                    </td>

                                                    <td>

                                                        <div className="row-actions">

                                                            <button
                                                                type="button"
                                                                className="row-button performance"
                                                                onClick={() =>
                                                                    void openPerformance(
                                                                        member
                                                                    )
                                                                }
                                                            >
                                                                ◈ Rate
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="row-button danger"
                                                                onClick={() =>
                                                                    void deactivateMember(
                                                                        member
                                                                    )
                                                                }
                                                                disabled={
                                                                    !canDeleteMinistry
                                                                }
                                                                title={
                                                                    !canDeleteMinistry
                                                                        ? "You do not have permission to remove ministry members."
                                                                        : undefined
                                                                }
                                                            >
                                                                ×
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            )}

                        </div>

                    </section>
                )}

            {/* =================================================
                PERFORMANCE
            ================================================= */}

            {activeTab ===
                "performance" && (
                    <section className="module-card">

                        <div className="module-header">

                            <div>

                                <div className="section-kicker">
                                    MEMBER DEVELOPMENT
                                </div>

                                <h2>
                                    Performance Tracking
                                </h2>

                                {selectedMember && (
                                    <p>

                                        {getMemberName(
                                            selectedMember.member
                                        )}

                                        {" • "}

                                        {
                                            selectedMember.position ||
                                            selectedMember.role ||
                                            "Ministry Member"
                                        }

                                    </p>
                                )}

                            </div>

                            {/* CREATE PERMISSION */}
                            <button
                                type="button"
                                className="primary-button"
                                onClick={
                                    openCreatePerformance
                                }
                                disabled={
                                    !canCreatePerformance ||
                                    !selectedMember
                                }
                                title={
                                    !canCreatePerformance
                                        ? "You do not have permission to create performance evaluations."
                                        : undefined
                                }
                            >
                                ＋ New Evaluation
                            </button>

                        </div>

                        {!selectedMember ? (

                            <div className="table-empty">

                                <div className="empty-icon">
                                    ◈
                                </div>

                                <strong>
                                    Select a Ministry Member
                                </strong>

                                <span>
                                    Choose a member from the
                                    Ministry Members tab to
                                    view performance history.
                                </span>

                            </div>

                        ) : performanceLoading ? (

                            <div className="table-empty">
                                Loading performance history...
                            </div>

                        ) : performanceHistory.length ===
                            0 ? (

                            <div className="table-empty">

                                <div className="empty-icon">
                                    ★
                                </div>

                                <strong>
                                    No Evaluations Yet
                                </strong>

                                <span>
                                    Start the first performance
                                    evaluation for this member.
                                </span>

                                {/* CREATE PERMISSION */}
                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={
                                        openCreatePerformance
                                    }
                                    disabled={
                                        !canCreatePerformance
                                    }
                                    title={
                                        !canCreatePerformance
                                            ? "You do not have permission to create performance evaluations."
                                            : undefined
                                    }
                                >
                                    ＋ Create Evaluation
                                </button>

                            </div>

                        ) : (

                            <div className="performance-history">

                                {performanceHistory.map(
                                    (rating) => (

                                        <article
                                            className="performance-record"
                                            key={
                                                rating.performanceRatingId
                                            }
                                        >

                                            <div className="performance-record-top">

                                                <div>

                                                    <span className="evaluation-date">
                                                        {formatDate(
                                                            rating.evaluationDate
                                                        )}
                                                    </span>

                                                    <h3>
                                                        Performance Evaluation
                                                    </h3>

                                                    <span>
                                                        Evaluator:{" "}
                                                        {
                                                            rating.evaluator ||
                                                            "Not specified"
                                                        }
                                                    </span>

                                                </div>

                                                <div
                                                    className={`overall-score ${getRatingClass(
                                                        Number(
                                                            rating.overallRating
                                                        )
                                                    )}`}
                                                >

                                                    <strong>
                                                        {Number(
                                                            rating.overallRating
                                                        ).toFixed(
                                                            2
                                                        )}
                                                    </strong>

                                                    <span>
                                                        / 5
                                                    </span>

                                                </div>

                                            </div>

                                            <div className="rating-grid">

                                                {RATING_FIELDS.map(
                                                    ({
                                                        label,
                                                        key
                                                    }) => {

                                                        const value =
                                                            getRatingValue(
                                                                rating,
                                                                key
                                                            );

                                                        return (

                                                            <div
                                                                className="rating-item"
                                                                key={
                                                                    key
                                                                }
                                                            >

                                                                <span>
                                                                    {
                                                                        label
                                                                    }
                                                                </span>

                                                                <strong>
                                                                    {value.toFixed(
                                                                        1
                                                                    )}
                                                                </strong>

                                                                <div className="rating-bar">

                                                                    <i
                                                                        style={{
                                                                            width: `${Math.min(
                                                                                value *
                                                                                20,
                                                                                100
                                                                            )}%`
                                                                        }}
                                                                    />

                                                                </div>

                                                            </div>

                                                        );
                                                    }
                                                )}

                                            </div>

                                            <div className="evaluation-notes">

                                                <div>

                                                    <span>
                                                        STRENGTHS
                                                    </span>

                                                    <p>
                                                        {
                                                            rating.strengths ||
                                                            "No comments recorded."
                                                        }
                                                    </p>

                                                </div>

                                                <div>

                                                    <span>
                                                        AREAS FOR IMPROVEMENT
                                                    </span>

                                                    <p>
                                                        {
                                                            rating.areasForImprovement ||
                                                            "No comments recorded."
                                                        }
                                                    </p>

                                                </div>

                                                <div>

                                                    <span>
                                                        RECOMMENDATIONS
                                                    </span>

                                                    <p>
                                                        {
                                                            rating.recommendations ||
                                                            "No recommendations recorded."
                                                        }
                                                    </p>

                                                </div>

                                            </div>

                                            <div className="performance-actions">

                                                <button
                                                    type="button"
                                                    className="row-button"
                                                    onClick={() =>
                                                        openEditPerformance(
                                                            rating
                                                        )
                                                    }
                                                    disabled={
                                                        !canEditPerformance
                                                    }
                                                >
                                                    ✎ Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="row-button danger"
                                                    onClick={() =>
                                                        void deletePerformance(
                                                            rating
                                                        )
                                                    }
                                                    disabled={
                                                        !canDeletePerformance
                                                    }
                                                >
                                                    × Delete
                                                </button>

                                            </div>

                                        </article>

                                    )
                                )}

                            </div>

                        )}

                    </section>
                )}

            {/* =================================================
                MINISTRY MODAL
            ================================================= */}

            {showMinistryModal && (

                <div
                    className="modal-backdrop"
                    onMouseDown={() =>
                        setShowMinistryModal(
                            false
                        )
                    }
                >

                    <div
                        className="epic-modal"
                        onMouseDown={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>

                                <span>
                                    EPIC MINISTRY NETWORK
                                </span>

                                <h2>
                                    {editingMinistry
                                        ? "Edit Ministry"
                                        : "Create Ministry"}
                                </h2>

                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={() =>
                                    setShowMinistryModal(
                                        false
                                    )
                                }
                            >
                                ×
                            </button>

                        </div>

                        <div className="modal-body">

                            <div className="form-group">

                                <label>
                                    Ministry Name *
                                </label>

                                <input
                                    value={
                                        ministryForm.name
                                    }
                                    onChange={(e) =>
                                        setMinistryForm(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,
                                                name:
                                                    e.target
                                                        .value
                                            })
                                        )
                                    }
                                    placeholder="e.g. Worship Ministry"
                                    disabled={
                                        editingMinistry
                                            ? !canEditMinistry
                                            : !canCreateMinistry
                                    }
                                />

                            </div>

                            <div className="form-two-column">

                                <div className="form-group">

                                    <label>
                                        Ministry Head
                                    </label>

                                    <input
                                        value={
                                            ministryForm.ministryHead
                                        }
                                        onChange={(e) =>
                                            setMinistryForm(
                                                (
                                                    previous
                                                ) => ({
                                                    ...previous,
                                                    ministryHead:
                                                        e.target
                                                            .value
                                                })
                                            )
                                        }
                                        placeholder="Ministry leader"
                                        disabled={
                                            editingMinistry
                                                ? !canEditMinistry
                                                : !canCreateMinistry
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Status
                                    </label>

                                    <select
                                        value={
                                            ministryForm.status
                                        }
                                        onChange={(e) =>
                                            setMinistryForm(
                                                (
                                                    previous
                                                ) => ({
                                                    ...previous,
                                                    status:
                                                        e.target
                                                            .value as MinistryForm["status"]
                                                })
                                            )
                                        }
                                        disabled={
                                            editingMinistry
                                                ? !canEditMinistry
                                                : !canCreateMinistry
                                        }
                                    >

                                        <option value="ACTIVE">
                                            ACTIVE
                                        </option>

                                        <option value="INACTIVE">
                                            INACTIVE
                                        </option>

                                    </select>

                                </div>

                            </div>

                            <div className="form-group">

                                <label>
                                    Description
                                </label>

                                <textarea
                                    value={
                                        ministryForm.description
                                    }
                                    onChange={(e) =>
                                        setMinistryForm(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,
                                                description:
                                                    e.target
                                                        .value
                                            })
                                        )
                                    }
                                    rows={4}
                                    placeholder="Describe the purpose and responsibilities of this ministry..."
                                    disabled={
                                        editingMinistry
                                            ? !canEditMinistry
                                            : !canCreateMinistry
                                    }
                                />

                            </div>

                        </div>

                        <div className="modal-footer">

                            <button
                                type="button"
                                className="cancel-button"
                                onClick={() =>
                                    setShowMinistryModal(
                                        false
                                    )
                                }
                            >
                                Cancel
                            </button>

                            {/* CREATE / EDIT PERMISSION */}
                            <button
                                type="button"
                                className="primary-button"
                                onClick={() =>
                                    void saveMinistry()
                                }
                                disabled={
                                    loading ||
                                    (
                                        editingMinistry
                                            ? !canEditMinistry
                                            : !canCreateMinistry
                                    )
                                }
                            >
                                {loading
                                    ? "Saving..."
                                    : editingMinistry
                                        ? "Save Changes"
                                        : "Create Ministry"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* =================================================
                MEMBER MODAL
            ================================================= */}

            {showMemberModal && (

                <div
                    className="modal-backdrop"
                    onMouseDown={() =>
                        setShowMemberModal(
                            false
                        )
                    }
                >

                    <div
                        className="epic-modal"
                        onMouseDown={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>

                                <span>
                                    {
                                        selectedMinistry?.name ||
                                        "Ministry"
                                    }
                                </span>

                                <h2>
                                    Assign Ministry Member
                                </h2>

                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={() =>
                                    setShowMemberModal(
                                        false
                                    )
                                }
                            >
                                ×
                            </button>

                        </div>

                        <div className="modal-body">

                            <div className="form-group">

                                <label>
                                    Member *
                                </label>

                                <select
                                    value={
                                        memberForm.memberId
                                    }
                                    onChange={(e) =>
                                        setMemberForm(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,
                                                memberId:
                                                    e.target
                                                        .value
                                            })
                                        )
                                    }
                                    disabled={
                                        !canCreateMinistry
                                    }
                                >

                                    <option value="">
                                        Select member
                                    </option>

                                    {members.map(
                                        (member) => (

                                            <option
                                                key={
                                                    member.memberId
                                                }
                                                value={
                                                    member.memberId
                                                }
                                            >
                                                {getMemberName(
                                                    member
                                                )}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>

                            <div className="form-two-column">

                                <div className="form-group">

                                    <label>
                                        Role
                                    </label>

                                    <input
                                        value={
                                            memberForm.role
                                        }
                                        onChange={(e) =>
                                            setMemberForm(
                                                (
                                                    previous
                                                ) => ({
                                                    ...previous,
                                                    role:
                                                        e.target
                                                            .value
                                                })
                                            )
                                        }
                                        placeholder="e.g. Volunteer"
                                        disabled={
                                            !canCreateMinistry
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Position
                                    </label>

                                    <input
                                        value={
                                            memberForm.position
                                        }
                                        onChange={(e) =>
                                            setMemberForm(
                                                (
                                                    previous
                                                ) => ({
                                                    ...previous,
                                                    position:
                                                        e.target
                                                            .value
                                                })
                                            )
                                        }
                                        placeholder="e.g. Worship Leader"
                                        disabled={
                                            !canCreateMinistry
                                        }
                                    />

                                </div>

                            </div>

                            <div className="form-group">

                                <label>
                                    Notes
                                </label>

                                <textarea
                                    value={
                                        memberForm.notes
                                    }
                                    onChange={(e) =>
                                        setMemberForm(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,
                                                notes:
                                                    e.target
                                                        .value
                                            })
                                        )
                                    }
                                    rows={4}
                                    placeholder="Assignment notes..."
                                    disabled={
                                        !canCreateMinistry
                                    }
                                />

                            </div>

                        </div>

                        <div className="modal-footer">

                            <button
                                type="button"
                                className="cancel-button"
                                onClick={() =>
                                    setShowMemberModal(
                                        false
                                    )
                                }
                            >
                                Cancel
                            </button>

                            {/* CREATE PERMISSION */}
                            <button
                                type="button"
                                className="primary-button"
                                onClick={() =>
                                    void assignMember()
                                }
                                disabled={
                                    memberLoading ||
                                    !canCreateMinistry
                                }
                            >
                                {memberLoading
                                    ? "Assigning..."
                                    : "Assign Member"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* =================================================
                PERFORMANCE MODAL
            ================================================= */}

            {showPerformanceModal && (

                <div
                    className="modal-backdrop"
                    onMouseDown={() =>
                        setShowPerformanceModal(
                            false
                        )
                    }
                >

                    <div
                        className="epic-modal performance-modal"
                        onMouseDown={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>

                                <span>
                                    MEMBER DEVELOPMENT
                                </span>

                                <h2>
                                    {editingPerformance
                                        ? "Edit Performance Evaluation"
                                        : "New Performance Evaluation"}
                                </h2>

                                {selectedMember && (
                                    <p>
                                        {getMemberName(
                                            selectedMember.member
                                        )}
                                    </p>
                                )}

                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={() =>
                                    setShowPerformanceModal(
                                        false
                                    )
                                }
                            >
                                ×
                            </button>

                        </div>

                        <div className="modal-body">

                            <div className="form-two-column">

                                <div className="form-group">

                                    <label>
                                        Evaluation Date
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            performanceForm.evaluationDate
                                        }
                                        onChange={(e) =>
                                            setPerformanceForm(
                                                (
                                                    previous
                                                ) => ({
                                                    ...previous,
                                                    evaluationDate:
                                                        e.target
                                                            .value
                                                })
                                            )
                                        }
                                        disabled={
                                            editingPerformance
                                                ? !canEditPerformance
                                                : !canCreatePerformance
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Evaluator
                                    </label>

                                    <input
                                        value={
                                            performanceForm.evaluator
                                        }
                                        onChange={(e) =>
                                            setPerformanceForm(
                                                (
                                                    previous
                                                ) => ({
                                                    ...previous,
                                                    evaluator:
                                                        e.target
                                                            .value
                                                })
                                            )
                                        }
                                        placeholder="Evaluator name"
                                        disabled={
                                            editingPerformance
                                                ? !canEditPerformance
                                                : !canCreatePerformance
                                        }
                                    />

                                </div>

                            </div>

                            <div className="rating-form-grid">

                                {RATING_FIELDS.map(
                                    ({
                                        label,
                                        key
                                    }) => {

                                        const value =
                                            Number(
                                                performanceForm[
                                                key
                                                ]
                                            ) || 0;

                                        return (

                                            <div
                                                className="rating-form-item"
                                                key={key}
                                            >

                                                <div className="rating-form-label">

                                                    <label>
                                                        {label}
                                                    </label>

                                                    <strong>
                                                        {value.toFixed(
                                                            1
                                                        )}
                                                    </strong>

                                                </div>

                                                <div className="rating-options">

                                                    {RATING_OPTIONS.map(
                                                        (
                                                            option
                                                        ) => (

                                                            <button
                                                                type="button"
                                                                key={
                                                                    option
                                                                }
                                                                className={
                                                                    option ===
                                                                        value
                                                                        ? "selected"
                                                                        : ""
                                                                }
                                                                onClick={() =>
                                                                    setPerformanceForm(
                                                                        (
                                                                            previous
                                                                        ) => ({
                                                                            ...previous,
                                                                            [key]:
                                                                                option
                                                                        })
                                                                    )
                                                                }
                                                                disabled={
                                                                    editingPerformance
                                                                        ? !canEditPerformance
                                                                        : !canCreatePerformance
                                                                }
                                                            >
                                                                {
                                                                    option
                                                                }
                                                            </button>

                                                        )
                                                    )}

                                                </div>

                                                <span className="rating-help">
                                                    {getRatingLabel(
                                                        value
                                                    )}
                                                </span>

                                            </div>

                                        );
                                    }
                                )}

                            </div>

                            <div className="form-group">

                                <label>
                                    Strengths
                                </label>

                                <textarea
                                    value={
                                        performanceForm.strengths
                                    }
                                    onChange={(e) =>
                                        setPerformanceForm(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,
                                                strengths:
                                                    e.target
                                                        .value
                                            })
                                        )
                                    }
                                    rows={3}
                                    placeholder="What is this member doing well?"
                                    disabled={
                                        editingPerformance
                                            ? !canEditPerformance
                                            : !canCreatePerformance
                                    }
                                />

                            </div>

                            <div className="form-group">

                                <label>
                                    Areas for Improvement
                                </label>

                                <textarea
                                    value={
                                        performanceForm.areasForImprovement
                                    }
                                    onChange={(e) =>
                                        setPerformanceForm(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,
                                                areasForImprovement:
                                                    e.target
                                                        .value
                                            })
                                        )
                                    }
                                    rows={3}
                                    placeholder="What areas require development?"
                                    disabled={
                                        editingPerformance
                                            ? !canEditPerformance
                                            : !canCreatePerformance
                                    }
                                />

                            </div>

                            <div className="form-group">

                                <label>
                                    Recommendations
                                </label>

                                <textarea
                                    value={
                                        performanceForm.recommendations
                                    }
                                    onChange={(e) =>
                                        setPerformanceForm(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,
                                                recommendations:
                                                    e.target
                                                        .value
                                            })
                                        )
                                    }
                                    rows={3}
                                    placeholder="Recommended next steps..."
                                    disabled={
                                        editingPerformance
                                            ? !canEditPerformance
                                            : !canCreatePerformance
                                    }
                                />

                            </div>

                            <div className="form-group">

                                <label>
                                    Notes
                                </label>

                                <textarea
                                    value={
                                        performanceForm.notes
                                    }
                                    onChange={(e) =>
                                        setPerformanceForm(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,
                                                notes:
                                                    e.target
                                                        .value
                                            })
                                        )
                                    }
                                    rows={3}
                                    placeholder="Additional evaluation notes..."
                                    disabled={
                                        editingPerformance
                                            ? !canEditPerformance
                                            : !canCreatePerformance
                                    }
                                />

                            </div>

                        </div>

                        <div className="modal-footer">

                            <button
                                type="button"
                                className="cancel-button"
                                onClick={() =>
                                    setShowPerformanceModal(
                                        false
                                    )
                                }
                            >
                                Cancel
                            </button>

                            {/* CREATE / EDIT PERMISSION */}
                            <button
                                type="button"
                                className="primary-button"
                                onClick={() =>
                                    void savePerformance()
                                }
                                disabled={
                                    performanceLoading ||
                                    (
                                        editingPerformance
                                            ? !canEditPerformance
                                            : !canCreatePerformance
                                    )
                                }
                            >
                                {performanceLoading
                                    ? "Saving..."
                                    : editingPerformance
                                        ? "Update Evaluation"
                                        : "Save Evaluation"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};

export default Ministries;