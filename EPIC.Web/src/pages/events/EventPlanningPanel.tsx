import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import axios from "axios";

import { API_BASE_URL } from "../../config";
import "./EventPlanningPanel.css";

/* =========================================================
   TYPES
   ========================================================= */

interface EventNeed {
    eventNeedId?: number;
    id?: number;
    eventId: number;

    needName: string;
    description?: string | null;
    category?: string | null;

    quantity?: number | null;
    unit?: string | null;

    responsiblePerson?: string | null;
    responsibleMemberId?: number | null;

    status?: string | null;
    priority?: string | null;

    notes?: string | null;
    neededBy?: string | null;

    createdAt?: string | null;
    updatedAt?: string | null;
}

interface PlanningTask {
    id: number;
    title: string;
    description: string;
    category: string;
    quantity: number;
    unit: string;
    priority: string;
    status: StatusValue;
    dueDate: string | null;
    assignedTo: string;
    completed: boolean;
    notes: string;
    original: EventNeed;
}

interface EventPlanningPanelProps {
    eventId: number;
    eventName?: string;
    onClose?: () => void;
}

interface EventNeedForm {
    needName: string;
    description: string;
    category: string;
    quantity: string;
    unit: string;
    priority: string;
    status: string;
    responsiblePerson: string;
    neededBy: string;
    notes: string;
}

type PlanningTab = "needs" | "checklist";

type StatusValue =
    | "pending"
    | "in_progress"
    | "ready"
    | "cancelled";

/* =========================================================
   DEFAULT FORM
   ========================================================= */

const DEFAULT_FORM: EventNeedForm = {
    needName: "",
    description: "",
    category: "",
    quantity: "1",
    unit: "",
    priority: "NORMAL",
    status: "PENDING",
    responsiblePerson: "",
    neededBy: "",
    notes: "",
};

/* =========================================================
   STATUS HELPERS
   ========================================================= */

const normalizeStatus = (
    value?: string | null
): StatusValue => {
    if (!value) {
        return "pending";
    }

    const status = value
        .toLowerCase()
        .trim()
        .replace(/-/g, "_")
        .replace(/\s+/g, "_");

    switch (status) {
        case "complete":
        case "completed":
        case "done":
        case "ready":
            return "ready";

        case "in_progress":
        case "progress":
        case "ongoing":
            return "in_progress";

        case "cancelled":
        case "canceled":
            return "cancelled";

        default:
            return "pending";
    }
};

const toBackendStatus = (
    value?: string | null
): string => {
    switch (normalizeStatus(value)) {
        case "in_progress":
            return "IN_PROGRESS";

        case "ready":
            return "READY";

        case "cancelled":
            return "CANCELLED";

        default:
            return "PENDING";
    }
};

/* =========================================================
   PRIORITY HELPERS
   ========================================================= */

const normalizePriority = (
    value?: string | null
): string => {
    const priority =
        value?.trim().toUpperCase() || "NORMAL";

    const validPriorities = [
        "LOW",
        "NORMAL",
        "HIGH",
        "URGENT",
    ];

    return validPriorities.includes(priority)
        ? priority.toLowerCase()
        : "normal";
};

const toBackendPriority = (
    value?: string | null
): string => {
    const priority =
        value?.trim().toUpperCase() || "NORMAL";

    const validPriorities = [
        "LOW",
        "NORMAL",
        "HIGH",
        "URGENT",
    ];

    return validPriorities.includes(priority)
        ? priority
        : "NORMAL";
};

/* =========================================================
   NORMALIZE NEED
   ========================================================= */

const normalizeNeed = (
    need: EventNeed
): PlanningTask => {
    const id =
        Number(need.eventNeedId) ||
        Number(need.id) ||
        0;

    const status =
        normalizeStatus(need.status);

    const quantity =
        Number(need.quantity);

    return {
        id,

        title:
            need.needName?.trim() ||
            "Untitled Event Need",

        description:
            need.description?.trim() ||
            "No description provided.",

        category:
            need.category?.trim() ||
            "Other",

        quantity:
            Number.isFinite(quantity) &&
            quantity > 0
                ? quantity
                : 1,

        unit:
            need.unit?.trim() || "",

        priority:
            normalizePriority(
                need.priority
            ),

        status,

        dueDate:
            need.neededBy || null,

        assignedTo:
            need.responsiblePerson?.trim() ||
            "Unassigned",

        completed:
            status === "ready",

        notes:
            need.notes?.trim() || "",

        original: need,
    };
};

/* =========================================================
   API RESPONSE
   ========================================================= */

const extractNeeds = (
    data: unknown
): EventNeed[] => {
    if (Array.isArray(data)) {
        return data as EventNeed[];
    }

    if (
        typeof data !== "object" ||
        data === null
    ) {
        return [];
    }

    const response =
        data as Record<string, unknown>;

    const possibleArrays = [
        response.items,
        response.data,
        response.eventNeeds,
        response.needs,
    ];

    for (const value of possibleArrays) {
        if (Array.isArray(value)) {
            return value as EventNeed[];
        }
    }

    if (
        response.eventNeed &&
        typeof response.eventNeed === "object"
    ) {
        return [
            response.eventNeed as EventNeed,
        ];
    }

    return [];
};

/* =========================================================
   COMPONENT
   ========================================================= */

const EventPlanningPanel: React.FC<
    EventPlanningPanelProps
> = ({
    eventId,
    eventName,
    onClose,
}) => {
    /* =====================================================
       STATE
       ===================================================== */

    const [needs, setNeeds] =
        useState<PlanningTask[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [activeTab, setActiveTab] =
        useState<PlanningTab>("needs");

    const [showModal, setShowModal] =
        useState(false);

    const [editingTask, setEditingTask] =
        useState<PlanningTask | null>(null);

    const [form, setForm] =
        useState<EventNeedForm>(
            DEFAULT_FORM
        );

    /* =====================================================
       AUTH CONFIG
       ===================================================== */

    const getAuthConfig =
        useCallback(() => {
            const token =
                localStorage.getItem("token") ||
                localStorage.getItem(
                    "accessToken"
                );

            return {
                headers: {
                    "Content-Type":
                        "application/json",

                    ...(token
                        ? {
                              Authorization:
                                  `Bearer ${token}`,
                          }
                        : {}),
                },
            };
        }, []);

    /* =====================================================
       ERROR HANDLER
       ===================================================== */

    const getErrorMessage = (
        err: unknown,
        fallback: string
    ): string => {
        if (!axios.isAxiosError(err)) {
            return fallback;
        }

        if (
            err.code === "ERR_NETWORK"
        ) {
            return (
                "Unable to connect to the server. " +
                "Please check that the EPIC API is running."
            );
        }

        if (
            err.response?.status === 401
        ) {
            return (
                "Your session has expired. " +
                "Please log in again."
            );
        }

        if (
            err.response?.status === 403
        ) {
            return (
                "You do not have permission to perform this action."
            );
        }

        const data =
            err.response?.data;

        if (
            typeof data === "object" &&
            data !== null
        ) {
            const response =
                data as Record<
                    string,
                    unknown
                >;

            if (
                typeof response.message ===
                "string"
            ) {
                return response.message;
            }

            if (
                typeof response.error ===
                "string"
            ) {
                return response.error;
            }

            if (
                typeof response.title ===
                "string"
            ) {
                return response.title;
            }
        }

        return fallback;
    };

    /* =====================================================
       LOAD EVENT NEEDS
       ===================================================== */

    const loadPlanningData =
        useCallback(async () => {
            if (!eventId) {
                setNeeds([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const response =
                    await axios.get(
                        `${API_BASE_URL}/EventNeeds/event/${eventId}`,
                        getAuthConfig()
                    );

                const rawNeeds =
                    extractNeeds(
                        response.data
                    );

                const normalized =
                    rawNeeds
                        .map(normalizeNeed)
                        .filter(
                            task =>
                                task.id > 0
                        );

                setNeeds(normalized);
            } catch (err: unknown) {
                console.error(
                    "Unable to load event needs:",
                    err
                );

                setNeeds([]);

                setError(
                    getErrorMessage(
                        err,
                        "Unable to load event planning data."
                    )
                );
            } finally {
                setLoading(false);
            }
        }, [
            eventId,
            getAuthConfig,
        ]);

    useEffect(() => {
        void loadPlanningData();
    }, [loadPlanningData]);

    /* =====================================================
       SUCCESS MESSAGE AUTO CLEAR
       ===================================================== */

    useEffect(() => {
        if (!success) {
            return;
        }

        const timer =
            window.setTimeout(() => {
                setSuccess("");
            }, 4000);

        return () =>
            window.clearTimeout(timer);
    }, [success]);

    /* =====================================================
       STATISTICS
       ===================================================== */

    const totalNeeds =
        needs.length;

    const completedNeeds =
        useMemo(
            () =>
                needs.filter(
                    task =>
                        task.completed
                ).length,
            [needs]
        );

    const readyNeeds =
        completedNeeds;

    const pendingNeeds =
        useMemo(
            () =>
                needs.filter(
                    task =>
                        task.status ===
                        "pending"
                ).length,
            [needs]
        );

    const inProgressNeeds =
        useMemo(
            () =>
                needs.filter(
                    task =>
                        task.status ===
                        "in_progress"
                ).length,
            [needs]
        );

    const preparationPercentage =
        totalNeeds === 0
            ? 0
            : Math.round(
                  (completedNeeds /
                      totalNeeds) *
                      100
              );

    /* =====================================================
       FORM
       ===================================================== */

    const resetForm =
        useCallback(() => {
            setForm({
                ...DEFAULT_FORM,
            });

            setEditingTask(null);
        }, []);

    const updateFormField = <
        K extends keyof EventNeedForm
    >(
        field: K,
        value: EventNeedForm[K]
    ): void => {
        setForm(current => ({
            ...current,
            [field]: value,
        }));
    };

    /* =====================================================
       ADD MODAL
       ===================================================== */

    const openAddModal = (): void => {
        setError("");
        setSuccess("");
        resetForm();
        setShowModal(true);
    };

    /* =====================================================
       EDIT MODAL
       ===================================================== */

    const openEditModal = (
        task: PlanningTask
    ): void => {
        setError("");
        setSuccess("");

        setEditingTask(task);

        setForm({
            needName:
                task.title,

            description:
                task.original.description ||
                "",

            category:
                task.original.category ||
                "",

            quantity:
                String(
                    task.quantity || 1
                ),

            unit:
                task.unit || "",

            priority:
                toBackendPriority(
                    task.priority
                ),

            status:
                toBackendStatus(
                    task.status
                ),

            responsiblePerson:
                task.assignedTo ===
                "Unassigned"
                    ? ""
                    : task.assignedTo,

            neededBy:
                task.dueDate
                    ? task.dueDate.substring(
                          0,
                          10
                      )
                    : "",

            notes:
                task.notes || "",
        });

        setShowModal(true);
    };

    /* =====================================================
       CLOSE MODAL
       ===================================================== */

    const closeModal = (): void => {
        if (saving) {
            return;
        }

        resetForm();
        setShowModal(false);
    };

    /* =====================================================
       BUILD PAYLOAD
       ===================================================== */

    const buildPayload = (): EventNeed => {
        const quantity =
            Number(form.quantity);

        return {
            eventId:
                Number(eventId),

            needName:
                form.needName.trim(),

            description:
                form.description.trim() ||
                null,

            category:
                form.category.trim() ||
                null,

            quantity:
                Number.isFinite(quantity) &&
                quantity > 0
                    ? quantity
                    : 1,

            unit:
                form.unit.trim() ||
                null,

            responsiblePerson:
                form.responsiblePerson.trim() ||
                null,

            responsibleMemberId:
                editingTask
                    ?.original
                    .responsibleMemberId ??
                null,

            status:
                toBackendStatus(
                    form.status
                ),

            priority:
                toBackendPriority(
                    form.priority
                ),

            notes:
                form.notes.trim() ||
                null,

            neededBy:
                form.neededBy
                    ? `${form.neededBy}T00:00:00`
                    : null,
        };
    };

    /* =====================================================
       SAVE EVENT NEED
       ===================================================== */

    const handleSaveNeed = async (
        e: React.FormEvent<HTMLFormElement>
    ): Promise<void> => {
        e.preventDefault();

        const needName =
            form.needName.trim();

        if (!needName) {
            setError(
                "Please enter an event need."
            );
            return;
        }

        if (!eventId) {
            setError(
                "Invalid event ID."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const payload =
                buildPayload();

            if (editingTask) {
                await axios.put(
                    `${API_BASE_URL}/EventNeeds/${editingTask.id}`,
                    payload,
                    getAuthConfig()
                );

                setSuccess(
                    `"${needName}" was successfully updated.`
                );
            } else {
                await axios.post(
                    `${API_BASE_URL}/EventNeeds`,
                    payload,
                    getAuthConfig()
                );

                setSuccess(
                    `"${needName}" was successfully added.`
                );
            }

            await loadPlanningData();

            resetForm();
            setShowModal(false);
        } catch (err: unknown) {
            console.error(
                "Unable to save event need:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    editingTask
                        ? "Unable to update event need."
                        : "Unable to create event need."
                )
            );
        } finally {
            setSaving(false);
        }
    };

    /* =====================================================
       UPDATE STATUS
       ===================================================== */

    const updateTaskStatus =
        async (
            task: PlanningTask,
            newStatus: string
        ): Promise<void> => {
            if (!task.id) {
                setError(
                    "Invalid event need ID."
                );
                return;
            }

            try {
                setError("");
                setSuccess("");

                const original =
                    task.original;

                const normalizedStatus =
                    normalizeStatus(
                        newStatus
                    );

                const payload: EventNeed =
                    {
                        eventId:
                            Number(eventId),

                        needName:
                            task.title,

                        description:
                            original.description ||
                            null,

                        category:
                            original.category ||
                            null,

                        quantity:
                            Number(
                                original.quantity
                            ) > 0
                                ? Number(
                                      original.quantity
                                  )
                                : 1,

                        unit:
                            original.unit ||
                            null,

                        responsiblePerson:
                            task.assignedTo ===
                            "Unassigned"
                                ? null
                                : task.assignedTo,

                        responsibleMemberId:
                            original.responsibleMemberId ??
                            null,

                        status:
                            toBackendStatus(
                                normalizedStatus
                            ),

                        priority:
                            toBackendPriority(
                                task.priority
                            ),

                        notes:
                            original.notes ||
                            null,

                        neededBy:
                            task.dueDate
                                ? `${task.dueDate.substring(
                                      0,
                                      10
                                  )}T00:00:00`
                                : null,
                    };

                await axios.put(
                    `${API_BASE_URL}/EventNeeds/${task.id}`,
                    payload,
                    getAuthConfig()
                );

                setNeeds(current =>
                    current.map(item => {
                        if (
                            item.id !==
                            task.id
                        ) {
                            return item;
                        }

                        return {
                            ...item,

                            status:
                                normalizedStatus,

                            completed:
                                normalizedStatus ===
                                "ready",

                            original: {
                                ...item.original,

                                status:
                                    toBackendStatus(
                                        normalizedStatus
                                    ),
                            },
                        };
                    })
                );

                setSuccess(
                    `"${task.title}" status updated.`
                );
            } catch (err: unknown) {
                console.error(
                    "Unable to update status:",
                    err
                );

                setError(
                    getErrorMessage(
                        err,
                        "Unable to update event need status."
                    )
                );
            }
        };

    /* =====================================================
       TOGGLE COMPLETE
       ===================================================== */

    const toggleComplete =
        async (
            task: PlanningTask
        ): Promise<void> => {
            const newStatus =
                task.completed
                    ? "PENDING"
                    : "READY";

            await updateTaskStatus(
                task,
                newStatus
            );
        };

    /* =====================================================
       DELETE
       ===================================================== */

    const deleteNeed =
        async (
            task: PlanningTask
        ): Promise<void> => {
            const confirmed =
                window.confirm(
                    `Delete "${task.title}"?`
                );

            if (!confirmed) {
                return;
            }

            try {
                setError("");
                setSuccess("");

                await axios.delete(
                    `${API_BASE_URL}/EventNeeds/${task.id}`,
                    getAuthConfig()
                );

                setNeeds(current =>
                    current.filter(
                        item =>
                            item.id !==
                            task.id
                    )
                );

                setSuccess(
                    `"${task.title}" was successfully deleted.`
                );
            } catch (err: unknown) {
                console.error(
                    "Unable to delete event need:",
                    err
                );

                setError(
                    getErrorMessage(
                        err,
                        "Unable to delete event need."
                    )
                );
            }
        };

    /* =====================================================
       DATE FORMAT
       ===================================================== */

    const formatDate = (
        value: string | null
    ): string => {
        if (!value) {
            return "No due date";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return value;
        }

        return date.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric",
            }
        );
    };

    /* =====================================================
       STATUS LABEL
       ===================================================== */

    const getStatusLabel = (
        status: StatusValue
    ): string => {
        switch (status) {
            case "in_progress":
                return "In Progress";

            case "ready":
                return "Ready";

            case "cancelled":
                return "Cancelled";

            default:
                return "Pending";
        }
    };

    /* =====================================================
       RENDER
       ===================================================== */

    return (
        <section className="event-planning-panel">

            {/* =================================================
                SUCCESS MESSAGE
            ================================================= */}

            {success && (
                <div className="planning-success">

                    <div className="planning-message-icon">
                        ✓
                    </div>

                    <div>
                        <strong>
                            Success
                        </strong>

                        <p>
                            {success}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setSuccess("")
                        }
                    >
                        ×
                    </button>

                </div>
            )}

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="planning-header">

                <div className="planning-header-info">

                    <div className="planning-eyebrow">
                        EVENT MANAGEMENT
                    </div>

                    <h2>
                        Event Planning
                    </h2>

                    <p>
                        {eventName
                            ? `Organize ${eventName}, monitor preparation, and complete planning tasks.`
                            : "Organize event needs, monitor preparation, and complete planning tasks."}
                    </p>

                </div>

                <div className="planning-header-actions">

                    {onClose && (
                        <button
                            type="button"
                            className="planning-secondary-btn"
                            onClick={onClose}
                        >
                            ← Close
                        </button>
                    )}

                    <button
                        type="button"
                        className={`planning-refresh-btn ${
                            loading
                                ? "is-refreshing"
                                : ""
                        }`}
                        onClick={() =>
                            void loadPlanningData()
                        }
                        disabled={loading}
                        title="Refresh event planning data"
                    >
                        <span className="refresh-icon">
                            ↻
                        </span>

                        <span className="refresh-text">
                            {loading
                                ? "Refreshing..."
                                : "Refresh"}
                        </span>
                    </button>

                    <button
                        type="button"
                        className="planning-primary-btn"
                        onClick={
                            openAddModal
                        }
                    >
                        + Add Event Need
                    </button>

                </div>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="planning-error">

                    <span className="error-icon">
                        ⚠
                    </span>

                    <span>
                        {error}
                    </span>

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
                STATISTICS
            ================================================= */}

            <div className="planning-stat-grid">

                <div className="planning-stat-card">

                    <div className="stat-icon">
                        📦
                    </div>

                    <div className="stat-content">

                        <span className="stat-label">
                            Event Needs
                        </span>

                        <strong>
                            {totalNeeds}
                        </strong>

                    </div>

                </div>

                <div className="planning-stat-card">

                    <div className="stat-icon">
                        ✓
                    </div>

                    <div className="stat-content">

                        <span className="stat-label">
                            Ready
                        </span>

                        <strong>
                            {readyNeeds}
                        </strong>

                    </div>

                </div>

                <div className="planning-stat-card">

                    <div className="stat-icon">
                        ◷
                    </div>

                    <div className="stat-content">

                        <span className="stat-label">
                            In Progress
                        </span>

                        <strong>
                            {inProgressNeeds}
                        </strong>

                    </div>

                </div>

                <div className="planning-stat-card">

                    <div className="stat-icon">
                        ☑
                    </div>

                    <div className="stat-content">

                        <span className="stat-label">
                            Tasks Complete
                        </span>

                        <strong>
                            {completedNeeds}/
                            {totalNeeds}
                        </strong>

                    </div>

                </div>

                <div className="planning-stat-card progress-card">

                    <div className="progress-card-content">

                        <div className="progress-stat-header">

                            <span>
                                Preparation
                            </span>

                            <strong>
                                {
                                    preparationPercentage
                                }
                                %
                            </strong>

                        </div>

                        <div className="planning-progress">

                            <div
                                className="planning-progress-fill"
                                style={{
                                    width:
                                        `${preparationPercentage}%`,
                                }}
                            />

                        </div>

                    </div>

                </div>

            </div>

            {/* =================================================
                PREPARATION
            ================================================= */}

            <div className="planning-preparation-card">

                <div className="preparation-top">

                    <div>

                        <span>
                            EVENT PREPARATION
                        </span>

                        <h3>
                            {preparationPercentage ===
                            100
                                ? "Event is fully prepared"
                                : "Preparation progress"}
                        </h3>

                    </div>

                    <strong>
                        {
                            preparationPercentage
                        }%
                    </strong>

                </div>

                <div className="planning-progress">

                    <div
                        className="planning-progress-fill"
                        style={{
                            width:
                                `${preparationPercentage}%`,
                        }}
                    />

                </div>

                <div className="preparation-footer">

                    <span>
                        {completedNeeds} of{" "}
                        {totalNeeds} tasks
                        completed
                    </span>

                    <span>
                        {pendingNeeds} pending
                    </span>

                </div>

            </div>

            {/* =================================================
                TABS
            ================================================= */}

            <div className="planning-tabs">

                <button
                    type="button"
                    className={`planning-tab ${
                        activeTab === "needs"
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        setActiveTab(
                            "needs"
                        )
                    }
                >
                    <span>
                        📦
                    </span>

                    <span>
                        Event Needs
                    </span>

                    <b>
                        {totalNeeds}
                    </b>
                </button>

                <button
                    type="button"
                    className={`planning-tab ${
                        activeTab ===
                        "checklist"
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        setActiveTab(
                            "checklist"
                        )
                    }
                >
                    <span>
                        ☑
                    </span>

                    <span>
                        Checklist
                    </span>

                    <b>
                        {completedNeeds}/
                        {totalNeeds}
                    </b>
                </button>

            </div>

            {/* =================================================
                CONTENT
            ================================================= */}

            <div className="planning-content">

                {/* =================================================
                    LOADING
                ================================================= */}

                {loading ? (
                    <div className="planning-loading">

                        <div className="planning-spinner" />

                        <span>
                            Loading event
                            planning...
                        </span>

                    </div>

                ) : activeTab === "needs" ? (

                    /* =================================================
                       EVENT NEEDS TAB
                    ================================================= */

                    needs.length === 0 ? (

                        <div className="planning-empty">

                            <div className="empty-icon">
                                📦
                            </div>

                            <h3>
                                No Event Needs Yet
                            </h3>

                            <p>
                                Add the equipment,
                                materials, people,
                                services, and
                                preparation items
                                required for this
                                event.
                            </p>

                            <button
                                type="button"
                                className="planning-primary-btn"
                                onClick={
                                    openAddModal
                                }
                            >
                                + Add Event Need
                            </button>

                        </div>

                    ) : (

                        <div className="planning-list">

                            {needs.map(task => (

                                <article
                                    className={`planning-item ${
                                        task.completed
                                            ? "is-complete"
                                            : ""
                                    }`}
                                    key={task.id}
                                >

                                    {/* STATUS INDICATOR */}

                                    <div className="item-status-indicator" />

                                    {/* =================================================
                                        MAIN CONTENT
                                    ================================================= */}

                                    <div className="item-main">

                                        <div className="item-title-row">

                                            <h3>
                                                {
                                                    task.title
                                                }
                                            </h3>

                                            <span
                                                className={`priority-badge ${task.priority}`}
                                            >
                                                {
                                                    task.priority
                                                }
                                            </span>

                                        </div>

                                        <p className="item-description">
                                            {
                                                task.description
                                            }
                                        </p>

                                        <div className="item-details">

                                            <span>
                                                <b>
                                                    Category
                                                </b>

                                                <strong>
                                                    {
                                                        task.category
                                                    }
                                                </strong>
                                            </span>

                                            <span>
                                                <b>
                                                    Quantity
                                                </b>

                                                <strong>
                                                    {
                                                        task.quantity
                                                    }{" "}
                                                    {
                                                        task.unit
                                                    }
                                                </strong>
                                            </span>

                                            <span>
                                                <b>
                                                    Responsible
                                                </b>

                                                <strong>
                                                    {
                                                        task.assignedTo
                                                    }
                                                </strong>
                                            </span>

                                            <span>
                                                <b>
                                                    Needed By
                                                </b>

                                                <strong>
                                                    {formatDate(
                                                        task.dueDate
                                                    )}
                                                </strong>
                                            </span>

                                        </div>

                                        {task.notes && (
                                            <div className="item-notes">

                                                <span>
                                                    NOTE
                                                </span>

                                                <span>
                                                    {
                                                        task.notes
                                                    }
                                                </span>

                                            </div>
                                        )}

                                    </div>

                                    {/* =================================================
                                        ACTIONS
                                    ================================================= */}

                                    <div className="item-actions">

                                        <select
                                            className={`status-select ${task.status}`}
                                            value={
                                                task.status
                                            }
                                            onChange={e =>
                                                void updateTaskStatus(
                                                    task,
                                                    e.target
                                                        .value
                                                )
                                            }
                                            title={`Current status: ${getStatusLabel(
                                                task.status
                                            )}`}
                                        >
                                            <option value="pending">
                                                Pending
                                            </option>

                                            <option value="in_progress">
                                                In Progress
                                            </option>

                                            <option value="ready">
                                                Ready
                                            </option>

                                            <option value="cancelled">
                                                Cancelled
                                            </option>
                                        </select>

                                        <button
                                            type="button"
                                            className="icon-action edit"
                                            title="Edit event need"
                                            onClick={() =>
                                                openEditModal(
                                                    task
                                                )
                                            }
                                        >
                                            ✎
                                        </button>

                                        <button
                                            type="button"
                                            className="icon-action danger"
                                            title="Delete event need"
                                            onClick={() =>
                                                void deleteNeed(
                                                    task
                                                )
                                            }
                                        >
                                            🗑
                                        </button>

                                    </div>

                                </article>

                            ))}

                        </div>

                    )

                ) : (

                    /* =================================================
                       CHECKLIST TAB
                    ================================================= */

                    <div className="planning-list">

                        {needs.length === 0 ? (

                            <div className="planning-empty">

                                <div className="empty-icon">
                                    ☑
                                </div>

                                <h3>
                                    Checklist is Empty
                                </h3>

                                <p>
                                    Add event needs
                                    to create your
                                    preparation
                                    checklist.
                                </p>

                                <button
                                    type="button"
                                    className="planning-primary-btn"
                                    onClick={
                                        openAddModal
                                    }
                                >
                                    + Add Event Need
                                </button>

                            </div>

                        ) : (

                            needs.map(task => (

                                <article
                                    className={`planning-item checklist-item ${
                                        task.completed
                                            ? "is-complete"
                                            : ""
                                    }`}
                                    key={task.id}
                                >

                                    <div className="item-status-indicator" />

                                    <button
                                        type="button"
                                        className={`checklist-toggle ${
                                            task.completed
                                                ? "checked"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            void toggleComplete(
                                                task
                                            )
                                        }
                                        title={
                                            task.completed
                                                ? "Mark as pending"
                                                : "Mark as ready"
                                        }
                                    >
                                        {task.completed
                                            ? "✓"
                                            : ""}
                                    </button>

                                    <div className="item-main">

                                        <div className="item-title-row">

                                            <h3>
                                                {
                                                    task.title
                                                }
                                            </h3>

                                            <span
                                                className={`priority-badge ${task.priority}`}
                                            >
                                                {
                                                    task.priority
                                                }
                                            </span>

                                        </div>

                                        <p className="item-description">
                                            {
                                                task.description
                                            }
                                        </p>

                                        <div className="item-details">

                                            <span>
                                                <b>
                                                    Status
                                                </b>

                                                <strong>
                                                    {
                                                        getStatusLabel(
                                                            task.status
                                                        )
                                                    }
                                                </strong>
                                            </span>

                                            <span>
                                                <b>
                                                    Responsible
                                                </b>

                                                <strong>
                                                    {
                                                        task.assignedTo
                                                    }
                                                </strong>
                                            </span>

                                            <span>
                                                <b>
                                                    Needed By
                                                </b>

                                                <strong>
                                                    {formatDate(
                                                        task.dueDate
                                                    )}
                                                </strong>
                                            </span>

                                        </div>

                                    </div>

                                    <div className="item-actions">

                                        <button
                                            type="button"
                                            className="icon-action edit"
                                            title="Edit event need"
                                            onClick={() =>
                                                openEditModal(
                                                    task
                                                )
                                            }
                                        >
                                            ✎
                                        </button>

                                        <button
                                            type="button"
                                            className="icon-action danger"
                                            title="Delete event need"
                                            onClick={() =>
                                                void deleteNeed(
                                                    task
                                                )
                                            }
                                        >
                                            🗑
                                        </button>

                                    </div>

                                </article>

                            ))

                        )}

                    </div>

                )}

            </div>

            {/* =================================================
                ADD / EDIT MODAL
            ================================================= */}

            {showModal && (
                <div
                    className="planning-modal-overlay"
                    onMouseDown={e => {
                        if (
                            e.target ===
                                e.currentTarget &&
                            !saving
                        ) {
                            closeModal();
                        }
                    }}
                >

                    <div className="planning-modal">

                        {/* MODAL HEADER */}

                        <div className="modal-header">

                            <div>

                                <span>
                                    EVENT MANAGEMENT
                                </span>

                                <h2>
                                    {editingTask
                                        ? "Edit Event Need"
                                        : "Add Event Need"}
                                </h2>

                                <p>
                                    {editingTask
                                        ? "Update the event preparation requirement."
                                        : "Add a requirement to your event preparation plan."}
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
                                }
                                aria-label="Close modal"
                            >
                                ×
                            </button>

                        </div>

                        {/* FORM */}

                        <form
                            onSubmit={
                                handleSaveNeed
                            }
                        >

                            <div className="modal-body">

                                {/* EVENT NEED */}

                                <div className="form-group full">

                                    <label htmlFor="needName">
                                        Event Need
                                    </label>

                                    <input
                                        id="needName"
                                        type="text"
                                        value={
                                            form.needName
                                        }
                                        onChange={e =>
                                            updateFormField(
                                                "needName",
                                                e.target
                                                    .value
                                            )
                                        }
                                        placeholder="e.g. Water System"
                                        required
                                        autoFocus
                                    />

                                </div>

                                {/* DESCRIPTION */}

                                <div className="form-group full">

                                    <label htmlFor="description">
                                        Description
                                    </label>

                                    <textarea
                                        id="description"
                                        value={
                                            form.description
                                        }
                                        onChange={e =>
                                            updateFormField(
                                                "description",
                                                e.target
                                                    .value
                                            )
                                        }
                                        placeholder="Describe what needs to be prepared..."
                                    />

                                </div>

                                {/* CATEGORY */}

                                <div className="form-group full">

                                    <label htmlFor="category">
                                        Category
                                    </label>

                                    <select
                                        id="category"
                                        value={
                                            form.category
                                        }
                                        onChange={e =>
                                            updateFormField(
                                                "category",
                                                e.target
                                                    .value
                                            )
                                        }
                                    >
                                        <option value="">
                                            Select Category
                                        </option>

                                        <option value="Equipment">
                                            Equipment
                                        </option>

                                        <option value="Supplies">
                                            Supplies
                                        </option>

                                        <option value="Food">
                                            Food
                                        </option>

                                        <option value="Transportation">
                                            Transportation
                                        </option>

                                        <option value="Venue">
                                            Venue
                                        </option>

                                        <option value="Technical">
                                            Technical
                                        </option>

                                        <option value="Decoration">
                                            Decoration
                                        </option>

                                        <option value="People">
                                            People
                                        </option>

                                        <option value="Others">
                                            Others
                                        </option>
                                    </select>

                                </div>

                                {/* QUANTITY / UNIT */}

                                <div className="form-row">

                                    <div className="form-group">

                                        <label htmlFor="quantity">
                                            Quantity
                                        </label>

                                        <input
                                            id="quantity"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={
                                                form.quantity
                                            }
                                            onChange={e =>
                                                updateFormField(
                                                    "quantity",
                                                    e.target
                                                        .value
                                                )
                                            }
                                        />

                                    </div>

                                    <div className="form-group">

                                        <label htmlFor="unit">
                                            Unit
                                        </label>

                                        <input
                                            id="unit"
                                            type="text"
                                            value={
                                                form.unit
                                            }
                                            onChange={e =>
                                                updateFormField(
                                                    "unit",
                                                    e.target
                                                        .value
                                                )
                                            }
                                            placeholder="pcs, sets, boxes..."
                                        />

                                    </div>

                                </div>

                                {/* PRIORITY / STATUS */}

                                <div className="form-row">

                                    <div className="form-group">

                                        <label htmlFor="priority">
                                            Priority
                                        </label>

                                        <select
                                            id="priority"
                                            value={
                                                form.priority
                                            }
                                            onChange={e =>
                                                updateFormField(
                                                    "priority",
                                                    e.target
                                                        .value
                                                )
                                            }
                                        >
                                            <option value="LOW">
                                                Low
                                            </option>

                                            <option value="NORMAL">
                                                Normal
                                            </option>

                                            <option value="HIGH">
                                                High
                                            </option>

                                            <option value="URGENT">
                                                Urgent
                                            </option>
                                        </select>

                                    </div>

                                    <div className="form-group">

                                        <label htmlFor="status">
                                            Status
                                        </label>

                                        <select
                                            id="status"
                                            value={
                                                form.status
                                            }
                                            onChange={e =>
                                                updateFormField(
                                                    "status",
                                                    e.target
                                                        .value
                                                )
                                            }
                                        >
                                            <option value="PENDING">
                                                Pending
                                            </option>

                                            <option value="IN_PROGRESS">
                                                In Progress
                                            </option>

                                            <option value="READY">
                                                Ready
                                            </option>

                                            <option value="CANCELLED">
                                                Cancelled
                                            </option>
                                        </select>

                                    </div>

                                </div>

                                {/* RESPONSIBLE / NEEDED BY */}

                                <div className="form-row">

                                    <div className="form-group">

                                        <label htmlFor="responsiblePerson">
                                            Responsible Person
                                        </label>

                                        <input
                                            id="responsiblePerson"
                                            type="text"
                                            value={
                                                form.responsiblePerson
                                            }
                                            onChange={e =>
                                                updateFormField(
                                                    "responsiblePerson",
                                                    e.target
                                                        .value
                                                )
                                            }
                                            placeholder="Person or team"
                                        />

                                    </div>

                                    <div className="form-group">

                                        <label htmlFor="neededBy">
                                            Needed By
                                        </label>

                                        <input
                                            id="neededBy"
                                            type="date"
                                            value={
                                                form.neededBy
                                            }
                                            onChange={e =>
                                                updateFormField(
                                                    "neededBy",
                                                    e.target
                                                        .value
                                                )
                                            }
                                        />

                                    </div>

                                </div>

                                {/* NOTES */}

                                <div className="form-group full">

                                    <label htmlFor="notes">
                                        Notes
                                    </label>

                                    <textarea
                                        id="notes"
                                        value={
                                            form.notes
                                        }
                                        onChange={e =>
                                            updateFormField(
                                                "notes",
                                                e.target
                                                    .value
                                            )
                                        }
                                        placeholder="Additional notes..."
                                    />

                                </div>

                            </div>

                            {/* MODAL FOOTER */}

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="planning-primary-btn"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingTask
                                        ? "Update Event Need"
                                        : "Save Event Need"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </section>
    );
};

export default EventPlanningPanel;