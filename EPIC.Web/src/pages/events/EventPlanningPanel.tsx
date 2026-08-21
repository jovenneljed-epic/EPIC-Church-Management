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

type PlanningTab = "needs" | "checklist";

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
): string => {
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
            return "completed";

        case "in_progress":
        case "progress":
            return "in_progress";

        case "ready":
            return "ready";

        case "cancelled":
        case "canceled":
            return "cancelled";

        case "skipped":
            return "skipped";

        default:
            return "pending";
    }
};

const toBackendStatus = (
    value?: string | null
): string => {
    const status = normalizeStatus(value);

    switch (status) {
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
   PRIORITY
   ========================================================= */

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

    const status = normalizeStatus(
        need.status
    );

    return {
        id,
        title:
            need.needName?.trim() ||
            "Untitled Event Need",

        description:
            need.description?.trim() ||
            "No description provided.",

        priority:
            need.priority?.trim().toLowerCase() ||
            "normal",

        status,

        dueDate:
            need.neededBy || null,

        assignedTo:
            need.responsiblePerson?.trim() ||
            "Unassigned",

        completed:
            status === "ready" ||
            status === "completed",

        original: need,
    };
};

/* =========================================================
   EXTRACT API RESPONSE
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

    if (Array.isArray(response.items)) {
        return response.items as EventNeed[];
    }

    if (Array.isArray(response.data)) {
        return response.data as EventNeed[];
    }

    if (
        Array.isArray(response.eventNeeds)
    ) {
        return response.eventNeeds as EventNeed[];
    }

    if (Array.isArray(response.needs)) {
        return response.needs as EventNeed[];
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
        useState<boolean>(true);

    const [saving, setSaving] =
        useState<boolean>(false);

    const [error, setError] =
        useState<string>("");

    const [success, setSuccess] =
        useState<string>("");

    const [activeTab, setActiveTab] =
        useState<PlanningTab>("needs");

    const [showModal, setShowModal] =
        useState<boolean>(false);

    const [form, setForm] =
        useState<EventNeedForm>(
            DEFAULT_FORM
        );

    /* =====================================================
       AUTH
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

        if (err.message === "Network Error") {
            return (
                "Unable to connect to the server. " +
                "Please check the API connection."
            );
        }

        const data = err.response?.data;

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

                const url =
                    `${API_BASE_URL}/EventNeeds/event/${eventId}`;

                console.log(
                    "Loading Event Needs:",
                    url
                );

                const response =
                    await axios.get(
                        url,
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
                            (
                                task: PlanningTask
                            ) =>
                                task.id > 0
                        );

                setNeeds(normalized);
            } catch (err: unknown) {
                console.error(
                    "Unable to load event planning data:",
                    err
                );

                if (
                    axios.isAxiosError(err)
                ) {
                    console.error(
                        "HTTP Status:",
                        err.response?.status
                    );

                    console.error(
                        "Server Response:",
                        err.response?.data
                    );
                }

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

    /* =====================================================
       INITIAL LOAD
       ===================================================== */

    useEffect(() => {
        void loadPlanningData();
    }, [loadPlanningData]);

    /* =====================================================
       SUCCESS AUTO HIDE
       ===================================================== */

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

    /* =====================================================
       STATISTICS
       ===================================================== */

    const totalNeeds =
        needs.length;

    const completedNeeds =
        useMemo(
            () =>
                needs.filter(
                    (
                        task: PlanningTask
                    ) => task.completed
                ).length,
            [needs]
        );

    const readyNeeds =
        useMemo(
            () =>
                needs.filter(
                    (
                        task: PlanningTask
                    ) =>
                        task.status ===
                            "ready" ||
                        task.status ===
                            "completed"
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
        }, []);

    const updateFormField = <
        K extends keyof EventNeedForm
    >(
        field: K,
        value: EventNeedForm[K]
    ): void => {
        setForm(
            (
                current: EventNeedForm
            ) => ({
                ...current,
                [field]: value,
            })
        );
    };

    const openAddModal = (): void => {
        setError("");
        setSuccess("");
        resetForm();
        setShowModal(true);
    };

    const closeModal = (): void => {
        if (saving) {
            return;
        }

        resetForm();
        setShowModal(false);
    };

    /* =====================================================
       CREATE EVENT NEED
       ===================================================== */

    const handleAddNeed = async (
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

            const quantity =
                Number(form.quantity);

            const payload = {
                eventId: Number(eventId),

                needName,

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
                "Event Need created:",
                response.data
            );

            const responseNeeds =
                extractNeeds(
                    response.data
                );

            if (
                responseNeeds.length > 0
            ) {
                const created =
                    normalizeNeed(
                        responseNeeds[0]
                    );

                if (created.id > 0) {
                    setNeeds(
                        (
                            current: PlanningTask[]
                        ) => [
                            created,
                            ...current,
                        ]
                    );
                } else {
                    await loadPlanningData();
                }
            } else {
                await loadPlanningData();
            }

            resetForm();
            setShowModal(false);

            setSuccess(
                `"${needName}" was successfully added to the event planning list.`
            );
        } catch (err: unknown) {
            console.error(
                "Unable to create event need:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    "Unable to create event need."
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
                        Number.isFinite(
                            quantity
                        ) &&
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
                        original.responsibleMemberId ??
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
                    (
                        current: PlanningTask[]
                    ) =>
                        current.map(
                            (
                                item: PlanningTask
                            ) => {
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
            } catch (err: unknown) {
                console.error(
                    "Unable to update event need:",
                    err
                );

                setError(
                    getErrorMessage(
                        err,
                        "Unable to update event need."
                    )
                );
            }
        };

    /* =====================================================
       CHECKLIST
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

                setNeeds(
                    (
                        current: PlanningTask[]
                    ) =>
                        current.filter(
                            (
                                item: PlanningTask
                            ) =>
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
       DATE
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
       RENDER
       ===================================================== */

    return (
        <section className="event-planning-panel">

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

                    {onClose && (
                        <button
                            type="button"
                            className="planning-refresh-btn"
                            onClick={onClose}
                        >
                            ← Close
                        </button>
                    )}

                    <button
                        type="button"
                        className="planning-refresh-btn"
                        onClick={() =>
                            void loadPlanningData()
                        }
                        disabled={loading}
                    >
                        ↻ Refresh
                    </button>

                    <button
                        type="button"
                        className="planning-primary-btn"
                        onClick={openAddModal}
                    >
                        + Add Event Need
                    </button>

                </div>
            </div>

            {error && (
                <div className="planning-error">
                    <span>⚠</span>

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                        title="Close"
                    >
                        ×
                    </button>
                </div>
            )}

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

            <div className="planning-tabs">

                <button
                    type="button"
                    className={`planning-tab ${
                        activeTab === "needs"
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        setActiveTab("needs")
                    }
                >
                    <span>📦</span>

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
                    <span>☑</span>

                    Checklist

                    <b>
                        {completedNeeds}/
                        {totalNeeds}
                    </b>
                </button>

            </div>

            <div className="planning-content">

                {loading ? (
                    <div className="planning-loading">
                        Loading event planning...
                    </div>
                ) : activeTab === "needs" ? (
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

                            {needs.map(
                                (
                                    task: PlanningTask
                                ) => (
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
                                                    e: React.ChangeEvent<HTMLSelectElement>
                                                ) =>
                                                    void updateTaskStatus(
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
                                                    void deleteNeed(
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
                ) : needs.length === 0 ? (
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
                            (
                                task: PlanningTask
                            ) => (
                                <div
                                    key={task.id}
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
                                            void toggleComplete(
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

                                            {
                                                formatDate(
                                                    task.dueDate
                                                )
                                            }
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
                )}

            </div>

            {showModal && (
                <div
                    className="planning-modal-overlay"
                    onMouseDown={(
                        e: React.MouseEvent<HTMLDivElement>
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
                                onClick={closeModal}
                                disabled={saving}
                                title="Close"
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

                                    <label htmlFor="needName">
                                        Event Need
                                    </label>

                                    <input
                                        id="needName"
                                        type="text"
                                        value={
                                            form.needName
                                        }
                                        onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>
                                        ) =>
                                            updateFormField(
                                                "needName",
                                                e.target.value
                                            )
                                        }
                                        placeholder="e.g. Sound System"
                                        required
                                    />

                                </div>

                                <div className="form-group full">

                                    <label htmlFor="description">
                                        Description
                                    </label>

                                    <textarea
                                        id="description"
                                        value={
                                            form.description
                                        }
                                        onChange={(
                                            e: React.ChangeEvent<HTMLTextAreaElement>
                                        ) =>
                                            updateFormField(
                                                "description",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Describe what needs to be prepared..."
                                    />

                                </div>

                                <div className="form-group full">

                                    <label htmlFor="category">
                                        Category
                                    </label>

                                    <select
                                        id="category"
                                        value={
                                            form.category
                                        }
                                        onChange={(
                                            e: React.ChangeEvent<HTMLSelectElement>
                                        ) =>
                                            updateFormField(
                                                "category",
                                                e.target.value
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
                                            onChange={(
                                                e: React.ChangeEvent<HTMLInputElement>
                                            ) =>
                                                updateFormField(
                                                    "quantity",
                                                    e.target.value
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
                                            onChange={(
                                                e: React.ChangeEvent<HTMLInputElement>
                                            ) =>
                                                updateFormField(
                                                    "unit",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="pcs, sets, boxes..."
                                        />

                                    </div>

                                </div>

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
                                            onChange={(
                                                e: React.ChangeEvent<HTMLSelectElement>
                                            ) =>
                                                updateFormField(
                                                    "priority",
                                                    e.target.value
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
                                            onChange={(
                                                e: React.ChangeEvent<HTMLSelectElement>
                                            ) =>
                                                updateFormField(
                                                    "status",
                                                    e.target.value
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

                                        <label htmlFor="responsiblePerson">
                                            Responsible Person
                                        </label>

                                        <input
                                            id="responsiblePerson"
                                            type="text"
                                            value={
                                                form.responsiblePerson
                                            }
                                            onChange={(
                                                e: React.ChangeEvent<HTMLInputElement>
                                            ) =>
                                                updateFormField(
                                                    "responsiblePerson",
                                                    e.target.value
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
                                            onChange={(
                                                e: React.ChangeEvent<HTMLInputElement>
                                            ) =>
                                                updateFormField(
                                                    "neededBy",
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </div>

                                </div>

                                <div className="form-group full">

                                    <label htmlFor="notes">
                                        Notes
                                    </label>

                                    <textarea
                                        id="notes"
                                        value={
                                            form.notes
                                        }
                                        onChange={(
                                            e: React.ChangeEvent<HTMLTextAreaElement>
                                        ) =>
                                            updateFormField(
                                                "notes",
                                                e.target.value
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
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="planning-primary-btn"
                                    disabled={saving}
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