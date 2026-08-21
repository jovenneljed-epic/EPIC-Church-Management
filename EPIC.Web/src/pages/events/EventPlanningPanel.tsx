
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import axios from "axios";

import "./EventPlanningPanel.css";

/* =========================================================
   API CONFIGURATION
   ========================================================= */

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5109/api";

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
    quantity?: number;
    unit?: string | null;
    responsiblePerson?: string | null;
    responsibleMemberId?: number | null;
    status?: string;
    priority?: string;
    notes?: string | null;
    neededBy?: string | null;
    createdAt?: string;
    updatedAt?: string | null;
}

interface PlanningTask {
    id: number;
    title: string;
    description: string;
    priority: string;
    status: string;
    dueDate: string | null;
    assignedTo: string;
    completed: boolean;
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

const normalizeStatus = (value?: string): string => {
    if (!value) {
        return "pending";
    }

    const status = value
        .toLowerCase()
        .trim()
        .replace(/-/g, "_")
        .replace(/ /g, "_");

    if (
        status === "complete" ||
        status === "completed" ||
        status === "done"
    ) {
        return "completed";
    }

    if (status === "in_progress") {
        return "in_progress";
    }

    if (status === "ready") {
        return "ready";
    }

    if (
        status === "cancelled" ||
        status === "canceled"
    ) {
        return "cancelled";
    }

    if (status === "skipped") {
        return "skipped";
    }

    return "pending";
};

const toBackendStatus = (value: string): string => {
    const normalized = normalizeStatus(value);

    switch (normalized) {
        case "in_progress":
            return "IN_PROGRESS";

        case "ready":
        case "completed":
            return "READY";

        case "cancelled":
        case "skipped":
            return "CANCELLED";

        default:
            return "PENDING";
    }
};

/* =========================================================
   PRIORITY HELPER
   ========================================================= */

const toBackendPriority = (value?: string): string => {
    const priority =
        value?.trim().toUpperCase() || "NORMAL";

    const validPriorities = [
        "LOW",
        "NORMAL",
        "HIGH",
        "URGENT",
    ];

    if (validPriorities.includes(priority)) {
        return priority;
    }

    return "NORMAL";
};

/* =========================================================
   NORMALIZE EVENT NEED
   ========================================================= */

const normalizeNeed = (
    need: EventNeed
): PlanningTask => {
    const id =
        Number(need.eventNeedId) ||
        Number(need.id) ||
        0;

    const status = normalizeStatus(
        need.status
    );

    return {
        id,

        title:
            need.needName ||
            "Untitled Event Need",

        description:
            need.description ||
            "No description provided.",

        priority:
            need.priority?.toLowerCase() ||
            "normal",

        status,

        dueDate:
            need.neededBy ||
            null,

        assignedTo:
            need.responsiblePerson ||
            "Unassigned",

        completed:
            status === "ready" ||
            status === "completed",

        original: need,
    };
};

/* =========================================================
   EXTRACT API DATA
   ========================================================= */

const extractNeeds = (
    data: any
): EventNeed[] => {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.items)) {
        return data.items;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    if (Array.isArray(data?.eventNeeds)) {
        return data.eventNeeds;
    }

    if (Array.isArray(data?.needs)) {
        return data.needs;
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
}) => {
    const [needs, setNeeds] =
        useState<PlanningTask[]>([]);

    const [loading, setLoading] =
        useState<boolean>(true);

    const [error, setError] =
        useState<string>("");

    const [success, setSuccess] =
        useState<string>("");

    const [activeTab, setActiveTab] =
        useState<
            "needs" | "checklist"
        >("needs");

    const [showModal, setShowModal] =
        useState<boolean>(false);

    const [saving, setSaving] =
        useState<boolean>(false);

    const [form, setForm] =
        useState<EventNeedForm>(
            DEFAULT_FORM
        );

    /* =========================================================
       AUTH CONFIG
       ========================================================= */

    const getAuthConfig =
        useCallback(() => {
            const token =
                localStorage.getItem("token") ||
                localStorage.getItem(
                    "accessToken"
                );

            if (!token) {
                return {
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                };
            }

            return {
                headers: {
                    Authorization:
                        "Bearer " + token,
                    "Content-Type":
                        "application/json",
                },
            };
        }, []);

    /* =========================================================
       LOAD PLANNING DATA
       ========================================================= */

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

                setNeeds(
                    rawNeeds.map(
                        normalizeNeed
                    )
                );
            } catch (err: any) {
                console.error(
                    "Unable to load event planning data:",
                    err
                );

                console.error(
                    "Server response:",
                    err?.response?.data
                );

                setError(
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Unable to load event planning data."
                );

                setNeeds([]);
            } finally {
                setLoading(false);
            }
        }, [
            eventId,
            getAuthConfig,
        ]);

    /* =========================================================
       INITIAL LOAD
       ========================================================= */

    useEffect(() => {
        loadPlanningData();
    }, [loadPlanningData]);

    /* =========================================================
       AUTO HIDE SUCCESS
       ========================================================= */

    useEffect(() => {
        if (!success) {
            return;
        }

        const timer =
            window.setTimeout(() => {
                setSuccess("");
            }, 4000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [success]);

    /* =========================================================
       STATISTICS
       ========================================================= */

    const totalNeeds = needs.length;

    const completedNeeds =
        useMemo(() => {
            return needs.filter(
                (need) =>
                    need.completed
            ).length;
        }, [needs]);

    const readyNeeds =
        useMemo(() => {
            return needs.filter(
                (need) =>
                    need.status ===
                        "ready" ||
                    need.status ===
                        "completed"
            ).length;
        }, [needs]);

    const preparationPercentage =
        totalNeeds === 0
            ? 0
            : Math.round(
                  (completedNeeds /
                      totalNeeds) *
                      100
              );

    /* =========================================================
       FORM
       ========================================================= */

    const resetForm =
        useCallback(() => {
            setForm({
                ...DEFAULT_FORM,
            });
        }, []);

    const closeModal = () => {
        if (saving) {
            return;
        }

        resetForm();
        setShowModal(false);
    };

    const openAddModal = () => {
        setError("");
        setSuccess("");
        resetForm();
        setShowModal(true);
    };

    /* =========================================================
       CREATE EVENT NEED
       ========================================================= */

    const handleAddNeed =
        async (
            e: React.FormEvent<HTMLFormElement>
        ) => {
            e.preventDefault();

            if (!form.needName.trim()) {
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

                const quantity =
                    Number(
                        form.quantity
                    );

                const payload = {
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

                console.log(
                    "Creating Event Need:",
                    payload
                );

                const response =
                    await axios.post(
                        `${API_BASE_URL}/EventNeeds`,
                        payload,
                        getAuthConfig()
                    );

                console.log(
                    "Event Need created successfully:",
                    response.data
                );

                const createdName =
                    form.needName.trim();

                const createdNeed =
                    response.data?.eventNeed;

                if (createdNeed) {
                    const normalized =
                        normalizeNeed(
                            createdNeed
                        );

                    setNeeds(
                        (current) => [
                            normalized,
                            ...current,
                        ]
                    );
                } else {
                    await loadPlanningData();
                }

                resetForm();
                setShowModal(false);

                setSuccess(
                    `"${createdName}" was successfully added to the event planning list.`
                );
            } catch (err: any) {
                console.error(
                    "Unable to create event need:",
                    err
                );

                console.error(
                    "HTTP status:",
                    err?.response?.status
                );

                console.error(
                    "Server response:",
                    err?.response?.data
                );

                setError(
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Unable to create event need."
                );
            } finally {
                setSaving(false);
            }
        };

    /* =========================================================
       UPDATE STATUS
       ========================================================= */

    const updateTaskStatus =
        async (
            task: PlanningTask,
            newStatus: string
        ) => {
            try {
                setError("");
                setSuccess("");

                const original =
                    task.original;

                const quantity =
                    Number(
                        original.quantity
                    );

                const payload = {
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
                        quantity > 0
                            ? quantity
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
                        original.responsibleMemberId ||
                        null,

                    status:
                        toBackendStatus(
                            newStatus
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

                const normalizedStatus =
                    normalizeStatus(
                        newStatus
                    );

                setNeeds(
                    (current) =>
                        current.map(
                            (item) => {
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
                                            "ready" ||
                                        normalizedStatus ===
                                            "completed",

                                    original: {
                                        ...item.original,

                                        status:
                                            toBackendStatus(
                                                newStatus
                                            ),
                                    },
                                };
                            }
                        )
                );

                setSuccess(
                    `"${task.title}" was successfully updated.`
                );
            } catch (err: any) {
                console.error(
                    "Unable to update event need:",
                    err
                );

                setError(
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Unable to update event need."
                );
            }
        };

    /* =========================================================
       TOGGLE CHECKLIST
       ========================================================= */

    const toggleComplete =
        async (
            task: PlanningTask
        ) => {
            const newStatus =
                task.completed
                    ? "PENDING"
                    : "READY";

            await updateTaskStatus(
                task,
                newStatus
            );
        };

    /* =========================================================
       DELETE
       ========================================================= */

    const deleteNeed =
        async (
            task: PlanningTask
        ) => {
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

                setNeeds(
                    (current) =>
                        current.filter(
                            (item) =>
                                item.id !==
                                task.id
                        )
                );

                setSuccess(
                    `"${task.title}" was successfully deleted.`
                );
            } catch (err: any) {
                console.error(
                    "Unable to delete event need:",
                    err
                );

                setError(
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Unable to delete event need."
                );
            }
        };

    /* =========================================================
       DATE FORMAT
       ========================================================= */

    const formatDate = (
        value: string | null
    ) => {
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

    /* =========================================================
       RENDER
       ========================================================= */

    return (
        <section className="event-planning-panel">

            {/* =================================================
                SUCCESS MESSAGE
            ================================================= */}

            {success && (
                <div className="planning-success">
                    <span>✓</span>

                    <div>
                        <strong>
                            Success!
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
                        title="Close"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="planning-header">

                <div>
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

                    <button
                        type="button"
                        className="planning-refresh-btn"
                        onClick={
                            loadPlanningData
                        }
                        disabled={loading}
                    >
                        ↻ Refresh
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
                    {error}
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

                    <div>
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

                    <div>
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
                        ☑
                    </div>

                    <div>
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
                                {preparationPercentage}%
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
                TABS
            ================================================= */}

            <div className="planning-tabs">

                <button
                    type="button"
                    className={`planning-tab ${
                        activeTab ===
                        "needs"
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

                    Event Needs

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

                    Checklist

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

                {loading ? (

                    <div className="planning-loading">
                        Loading event planning...
                    </div>

                ) : activeTab ===
                  "needs" ? (

                    needs.length ===
                    0 ? (

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

                            {needs.map(
                                (task) => (

                                    <div
                                        className="planning-item"
                                        key={
                                            task.id
                                        }
                                    >

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

                                            <p>
                                                {
                                                    task.description
                                                }
                                            </p>

                                            <div className="item-meta">

                                                <span>
                                                    👤{" "}
                                                    {
                                                        task.assignedTo
                                                    }
                                                </span>

                                                <span>
                                                    📅{" "}
                                                    {
                                                        formatDate(
                                                            task.dueDate
                                                        )
                                                    }
                                                </span>

                                            </div>

                                        </div>

                                        <div className="item-actions">

                                            <select
                                                className={`status-select ${task.status}`}
                                                value={
                                                    task.status ===
                                                    "completed"
                                                        ? "ready"
                                                        : task.status
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    updateTaskStatus(
                                                        task,
                                                        e.target.value
                                                    )
                                                }
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
                                                className="icon-action danger"
                                                title="Delete"
                                                onClick={() =>
                                                    deleteNeed(
                                                        task
                                                    )
                                                }
                                            >
                                                🗑
                                            </button>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    )

                ) : (

                    needs.length ===
                    0 ? (

                        <div className="planning-empty">

                            <div className="empty-icon">
                                ☑
                            </div>

                            <h3>
                                No Checklist Tasks
                            </h3>

                            <p>
                                Add event needs to
                                create your event
                                preparation checklist.
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

                        <div className="planning-checklist">

                            {needs.map(
                                (task) => (

                                    <div
                                        key={
                                            task.id
                                        }
                                        className={`checklist-item ${
                                            task.completed
                                                ? "completed"
                                                : ""
                                        }`}
                                    >

                                        <button
                                            type="button"
                                            className="check-button"
                                            onClick={() =>
                                                toggleComplete(
                                                    task
                                                )
                                            }
                                            title={
                                                task.completed
                                                    ? "Mark as pending"
                                                    : "Mark as complete"
                                            }
                                        >
                                            {task.completed
                                                ? "✓"
                                                : ""}
                                        </button>

                                        <div className="checklist-main">

                                            <h3>
                                                {
                                                    task.title
                                                }
                                            </h3>

                                            <p>
                                                {
                                                    task.description
                                                }

                                                {" • "}

                                                {formatDate(
                                                    task.dueDate
                                                )}
                                            </p>

                                        </div>

                                        <span
                                            className={`priority-badge ${task.priority}`}
                                        >
                                            {
                                                task.priority
                                            }
                                        </span>

                                    </div>

                                )
                            )}

                        </div>

                    )

                )}

            </div>

            {/* =================================================
                MODAL
            ================================================= */}

            {showModal && (

                <div
                    className="planning-modal-overlay"
                    onMouseDown={(
                        e
                    ) => {
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

                        <div className="modal-header">

                            <div>

                                <span>
                                    EVENT MANAGEMENT
                                </span>

                                <h2>
                                    Add Event Need
                                </h2>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
                                }
                            >
                                ×
                            </button>

                        </div>

                        <form
                            onSubmit={
                                handleAddNeed
                            }
                        >

                            <div className="modal-body">

                                <div className="form-group full">

                                    <label>
                                        Event Need
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            form.needName
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setForm(
                                                (
                                                    current
                                                ) => ({
                                                    ...current,
                                                    needName:
                                                        e.target.value,
                                                })
                                            )
                                        }
                                        placeholder="e.g. Sound System"
                                        required
                                    />

                                </div>

                                <div className="form-group full">

                                    <label>
                                        Description
                                    </label>

                                    <textarea
                                        value={
                                            form.description
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setForm(
                                                (
                                                    current
                                                ) => ({
                                                    ...current,
                                                    description:
                                                        e.target.value,
                                                })
                                            )
                                        }
                                        placeholder="Describe what needs to be prepared..."
                                    />

                                </div>

                                <div className="form-group full">

                                    <label>
                                        Category
                                    </label>

                                    <select
                                        value={
                                            form.category
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setForm(
                                                (
                                                    current
                                                ) => ({
                                                    ...current,
                                                    category:
                                                        e.target.value,
                                                })
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

                                        <option value="Others">
                                            Others
                                        </option>

                                    </select>

                                </div>

                                <div className="form-row">

                                    <div className="form-group">

                                        <label>
                                            Quantity
                                        </label>

                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={
                                                form.quantity
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setForm(
                                                    (
                                                        current
                                                    ) => ({
                                                        ...current,
                                                        quantity:
                                                            e.target.value,
                                                    })
                                                )
                                            }
                                        />

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Unit
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                form.unit
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setForm(
                                                    (
                                                        current
                                                    ) => ({
                                                        ...current,
                                                        unit:
                                                            e.target.value,
                                                    })
                                                )
                                            }
                                            placeholder="pcs, sets, boxes..."
                                        />

                                    </div>

                                </div>

                                <div className="form-row">

                                    <div className="form-group">

                                        <label>
                                            Priority
                                        </label>

                                        <select
                                            value={
                                                form.priority
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setForm(
                                                    (
                                                        current
                                                    ) => ({
                                                        ...current,
                                                        priority:
                                                            e.target.value,
                                                    })
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

                                        <label>
                                            Status
                                        </label>

                                        <select
                                            value={
                                                form.status
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setForm(
                                                    (
                                                        current
                                                    ) => ({
                                                        ...current,
                                                        status:
                                                            e.target.value,
                                                    })
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

                                <div className="form-row">

                                    <div className="form-group">

                                        <label>
                                            Responsible Person
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                form.responsiblePerson
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setForm(
                                                    (
                                                        current
                                                    ) => ({
                                                        ...current,
                                                        responsiblePerson:
                                                            e.target.value,
                                                    })
                                                )
                                            }
                                            placeholder="Person or team"
                                        />

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Needed By
                                        </label>

                                        <input
                                            type="date"
                                            value={
                                                form.neededBy
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setForm(
                                                    (
                                                        current
                                                    ) => ({
                                                        ...current,
                                                        neededBy:
                                                            e.target.value,
                                                    })
                                                )
                                            }
                                        />

                                    </div>

                                </div>

                                <div className="form-group full">

                                    <label>
                                        Notes
                                    </label>

                                    <textarea
                                        value={
                                            form.notes
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setForm(
                                                (
                                                    current
                                                ) => ({
                                                    ...current,
                                                    notes:
                                                        e.target.value,
                                                })
                                            )
                                        }
                                        placeholder="Additional notes..."
                                    />

                                </div>

                            </div>

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
