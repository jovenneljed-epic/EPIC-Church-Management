import React, { useEffect, useMemo, useState } from "react";
import "./ChurchServices.css";
import PermissionService from "./PermissionService";

import { API_BASE_URL } from "./config";

interface ChurchService {
    churchServiceId: number;
    serviceName: string;
    serviceType: string;
    serviceDate: string;
    startTime: string;
    endTime: string;
    location: string;
    serviceLeader: string;
    speaker: string;
    description: string;
    status: string;
    createdDate?: string;
    updatedDate?: string | null;
}

interface ServiceForm {
    serviceName: string;
    serviceType: string;
    serviceDate: string;
    startTime: string;
    endTime: string;
    location: string;
    serviceLeader: string;
    speaker: string;
    description: string;
    status: string;
}

const emptyForm: ServiceForm = {
    serviceName: "",
    serviceType: "WORSHIP",
    serviceDate: "",
    startTime: "",
    endTime: "",
    location: "",
    serviceLeader: "",
    speaker: "",
    description: "",
    status: "SCHEDULED",
};

const getToken = (): string | null => {
    const keys = [
        "token",
        "accessToken",
        "jwt",
        "authToken",
        "epicToken",
    ];

    for (const key of keys) {
        const value = localStorage.getItem(key);

        if (value) {
            return value.replace(/^Bearer\s+/i, "").trim();
        }
    }

    return null;
};

const apiFetch = async (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {
    const token = getToken();

    const headers = new Headers(options.headers || {});

    headers.set("Accept", "application/json");

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(url, {
        ...options,
        headers,
    });
};

const formatDate = (date: string) => {
    if (!date) return "No date";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const formatTime = (time: string) => {
    if (!time) return "";

    const parts = time.split(":");

    if (parts.length < 2) return time;

    const hour = Number(parts[0]);
    const minute = Number(parts[1]);

    if (Number.isNaN(hour)) return time;

    const date = new Date();

    date.setHours(hour, minute || 0, 0, 0);

    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
};

const ChurchServices: React.FC = () => {
    console.log("🔥🔥🔥 CHURCH SERVICES COMPONENT LOADED 🔥🔥🔥");

    console.log(
        "Church Services permission:",
        PermissionService.getModulePermission("Church Services")
    );

    console.log(
        "Church Services VIEW:",
        PermissionService.canView("Church Services")
    );
    /*
    ============================================================
    PERMISSIONS
    ============================================================
    */

    const canView = PermissionService.canView("Church Services");
    console.log("========== CHURCH SERVICES PERMISSION ==========");
    console.log(
        "MODULE:",
        PermissionService.getModulePermission("Church Services")
    );
    console.log(
        "VIEW:",
        PermissionService.canView("Church Services")
    );
    console.log(
        "CREATE:",
        PermissionService.canCreate("Church Services")
    );
    console.log(
        "EDIT:",
        PermissionService.canEdit("Church Services")
    );
    console.log(
        "DELETE:",
        PermissionService.canDelete("Church Services")
    );
    console.log(
        "ROLE:",
        PermissionService.getCurrentRole()
    );
    console.log(
        "ROLE ID:",
        PermissionService.getCurrentRoleId()
    );
    console.log("===============================================");
    const canCreate = PermissionService.canCreate("Church Services");
    const canEdit = PermissionService.canEdit("Church Services");
    const canDelete = PermissionService.canDelete("Church Services");
  
    console.log("🔐 CHURCH SERVICES PERMISSION:", {
        user: PermissionService.getCurrentUser(),
        role: PermissionService.getCurrentRole(),
        roleId: PermissionService.getCurrentRoleId(),

        module: PermissionService.getModulePermission("Church Services"),

        view: PermissionService.canView("Church Services"),
        create: PermissionService.canCreate("Church Services"),
        edit: PermissionService.canEdit("Church Services"),
        delete: PermissionService.canDelete("Church Services"),
        export: PermissionService.canExport("Church Services"),
    });
    /*
    ============================================================
    STATE
    ============================================================
    */

    const [services, setServices] = useState<ChurchService[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [form, setForm] = useState<ServiceForm>(emptyForm);

    /*
    ============================================================
    LOAD
    ============================================================
    */

    useEffect(() => {
        if (!canView) {
            setLoading(false);
            return;
        }

        loadServices();
    }, [canView]);

    const loadServices = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await apiFetch(
                `${API_BASE_URL}/ChurchService`
            );

            if (response.status === 401) {
                throw new Error(
                    "Your session has expired. Please login again."
                );
            }

            if (!response.ok) {
                throw new Error(
                    "Unable to load church services."
                );
            }

            const data = await response.json();

            setServices(
                Array.isArray(data) ? data : []
            );

        } catch (err) {

            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load church services."
            );

        } finally {
            setLoading(false);
        }
    };

    /*
    ============================================================
    CREATE
    ============================================================
    */

    const openCreateModal = () => {

        if (!canCreate) {
            setError(
                "You do not have permission to create Church Services."
            );
            return;
        }

        setEditingId(null);

        setForm({
            ...emptyForm,
            serviceDate: new Date()
                .toISOString()
                .split("T")[0],
        });

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    /*
    ============================================================
    EDIT
    ============================================================
    */

    const openEditModal = (service: ChurchService) => {

        if (!canEdit) {
            setError(
                "You do not have permission to edit Church Services."
            );
            return;
        }

        setEditingId(service.churchServiceId);

        setForm({
            serviceName: service.serviceName || "",
            serviceType: service.serviceType || "WORSHIP",
            serviceDate: service.serviceDate
                ? service.serviceDate.substring(0, 10)
                : "",
            startTime: service.startTime || "",
            endTime: service.endTime || "",
            location: service.location || "",
            serviceLeader: service.serviceLeader || "",
            speaker: service.speaker || "",
            description: service.description || "",
            status: service.status || "SCHEDULED",
        });

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    /*
    ============================================================
    CLOSE MODAL
    ============================================================
    */

    const closeModal = () => {

        if (saving) return;

        setShowModal(false);
        setEditingId(null);
        setForm(emptyForm);
    };

    /*
    ============================================================
    FORM
    ============================================================
    */

    const updateForm = (
        field: keyof ServiceForm,
        value: string
    ) => {
        setForm(current => ({
            ...current,
            [field]: value,
        }));
    };

    /*
    ============================================================
    SAVE
    ============================================================
    */

    const saveService = async (
        event: React.FormEvent
    ) => {

        event.preventDefault();

        if (editingId !== null && !canEdit) {
            setError(
                "You do not have permission to edit Church Services."
            );
            return;
        }

        if (editingId === null && !canCreate) {
            setError(
                "You do not have permission to create Church Services."
            );
            return;
        }

        if (!form.serviceName.trim()) {
            setError("Service name is required.");
            return;
        }

        if (!form.serviceDate) {
            setError("Service date is required.");
            return;
        }

        try {

            setSaving(true);
            setError("");
            setSuccess("");

            const payload = {
                serviceName: form.serviceName.trim(),
                serviceType: form.serviceType,
                serviceDate: `${form.serviceDate}T00:00:00`,
                startTime: form.startTime,
                endTime: form.endTime,
                location: form.location.trim(),
                serviceLeader: form.serviceLeader.trim(),
                speaker: form.speaker.trim(),
                description: form.description.trim(),
                status: form.status,
            };

            const url = editingId
                ? `${API_BASE_URL}/ChurchService/${editingId}`
                : `${API_BASE_URL}/ChurchService`;

            const response = await apiFetch(url, {
                method: editingId ? "PUT" : "POST",
                body: JSON.stringify(payload),
            });

            if (!response.ok) {

                const message = await response.text();

                throw new Error(
                    message ||
                    "Unable to save church service."
                );
            }

            setSuccess(
                editingId
                    ? "Church service updated successfully."
                    : "Church service created successfully."
            );

            setShowModal(false);
            setEditingId(null);
            setForm(emptyForm);

            await loadServices();

        } catch (err) {

            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save church service."
            );

        } finally {
            setSaving(false);
        }
    };

    /*
    ============================================================
    COMPLETE
    ============================================================
    */

    const completeService = async (
        service: ChurchService
    ) => {

        if (!canEdit) {
            setError(
                "You do not have permission to edit Church Services."
            );
            return;
        }

        if (
            !window.confirm(
                `Mark "${service.serviceName}" as completed?`
            )
        ) {
            return;
        }

        try {

            setError("");
            setSuccess("");

            const response = await apiFetch(
                `${API_BASE_URL}/ChurchService/${service.churchServiceId}/complete`,
                {
                    method: "POST",
                }
            );

            if (!response.ok) {

                const message = await response.text();

                throw new Error(
                    message ||
                    "Unable to complete service."
                );
            }

            setSuccess(
                "Church service marked as completed."
            );

            await loadServices();

        } catch (err) {

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to complete service."
            );
        }
    };

    /*
    ============================================================
    DELETE / CANCEL
    ============================================================
    */

    const cancelService = async (
        service: ChurchService
    ) => {

        if (!canDelete) {
            setError(
                "You do not have permission to delete Church Services."
            );
            return;
        }

        if (
            !window.confirm(
                `Cancel "${service.serviceName}"?`
            )
        ) {
            return;
        }

        try {

            setError("");
            setSuccess("");

            const response = await apiFetch(
                `${API_BASE_URL}/ChurchService/${service.churchServiceId}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {

                const message = await response.text();

                throw new Error(
                    message ||
                    "Unable to cancel service."
                );
            }

            setSuccess(
                "Church service cancelled."
            );

            await loadServices();

        } catch (err) {

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to cancel service."
            );
        }
    };

    /*
    ============================================================
    ATTENDANCE
    ============================================================
    */

    const openAttendance = (
        service: ChurchService
    ) => {

        window.dispatchEvent(
            new CustomEvent(
                "epic:open-attendance",
                {
                    detail: {
                        churchServiceId:
                            service.churchServiceId,
                        serviceName:
                            service.serviceName,
                        serviceDate:
                            service.serviceDate,
                    },
                }
            )
        );
    };

    /*
    ============================================================
    FILTERS
    ============================================================
    */

    const types = useMemo(() => {

        const unique = new Set(
            services
                .map(service =>
                    service.serviceType?.trim()
                )
                .filter(Boolean)
        );

        return Array.from(unique).sort();

    }, [services]);

    const filteredServices = useMemo(() => {

        const keyword =
            search.trim().toLowerCase();

        return services.filter(service => {

            const matchesSearch =
                !keyword ||
                service.serviceName
                    ?.toLowerCase()
                    .includes(keyword) ||
                service.serviceType
                    ?.toLowerCase()
                    .includes(keyword) ||
                service.location
                    ?.toLowerCase()
                    .includes(keyword) ||
                service.serviceLeader
                    ?.toLowerCase()
                    .includes(keyword) ||
                service.speaker
                    ?.toLowerCase()
                    .includes(keyword);

            const matchesStatus =
                statusFilter === "ALL" ||
                service.status === statusFilter;

            const matchesType =
                typeFilter === "ALL" ||
                service.serviceType === typeFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesType
            );
        });

    }, [
        services,
        search,
        statusFilter,
        typeFilter,
    ]);

    const total = services.length;

    const scheduled = services.filter(
        s => s.status === "SCHEDULED"
    ).length;

    const completed = services.filter(
        s => s.status === "COMPLETED"
    ).length;

    const cancelled = services.filter(
        s => s.status === "CANCELLED"
    ).length;

    /*
    ============================================================
    NO VIEW PERMISSION
    ============================================================
    */

    if (!canView) {

        return (
            <div className="services-page">

                <div className="empty-state">

                    <div className="empty-icon">
                        🔒
                    </div>

                    <h3>
                        Access Restricted
                    </h3>

                    <p>
                        You do not have permission to view Church Services.
                    </p>

                </div>

            </div>
        );
    }

    /*
    ============================================================
    UI
    ============================================================
    */

    return (
        <div className="services-page">

            {/* HEADER */}

            <div className="services-header">

                <div className="services-title-area">

                    <div className="services-icon">
                        📅
                    </div>

                    <div>

                        <div className="eyebrow">
                            EPIC CHURCH MANAGEMENT
                        </div>

                        <h1>
                            Church Events & Services
                        </h1>

                        <p>
                            Plan, manage and monitor church gatherings and events.
                        </p>

                    </div>

                </div>

                <div className="services-actions">

                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={loadServices}
                        disabled={loading}
                    >
                        ↻ Refresh
                    </button>

                    {/* CREATE PERMISSION */}

                    <button
                        type="button"
                        className="btn-primary"
                        onClick={openCreateModal}
                        disabled={!canCreate}
                        title={
                            !canCreate
                                ? "You do not have permission to create Church Services."
                                : "Create Church Service"
                        }
                    >
                        + Create Event
                    </button>

                </div>

            </div>

            {/* ALERTS */}

            {error && (
                <div className="alert alert-error">
                    <span>⚠</span>
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    <span>✓</span>
                    <span>{success}</span>
                </div>
            )}

            {/* SUMMARY */}

            <div className="summary-grid">

                <SummaryCard
                    label="Total Events"
                    value={total}
                    icon="◈"
                    className="blue"
                />

                <SummaryCard
                    label="Scheduled"
                    value={scheduled}
                    icon="◷"
                    className="purple"
                />

                <SummaryCard
                    label="Completed"
                    value={completed}
                    icon="✓"
                    className="green"
                />

                <SummaryCard
                    label="Cancelled"
                    value={cancelled}
                    icon="×"
                    className="red"
                />

            </div>

            {/* FILTERS */}

            <div className="filter-panel">

                <div className="search-box">

                    <span>⌕</span>

                    <input
                        type="text"
                        placeholder="Search events, leaders, speakers..."
                        value={search}
                        onChange={e =>
                            setSearch(e.target.value)
                        }
                    />

                    {search && (
                        <button
                            type="button"
                            onClick={() =>
                                setSearch("")
                            }
                            className="clear-search"
                        >
                            ×
                        </button>
                    )}

                </div>

                <select
                    value={typeFilter}
                    onChange={e =>
                        setTypeFilter(e.target.value)
                    }
                >
                    <option value="ALL">
                        All Event Types
                    </option>

                    {types.map(type => (
                        <option
                            key={type}
                            value={type}
                        >
                            {type}
                        </option>
                    ))}

                </select>

                <select
                    value={statusFilter}
                    onChange={e =>
                        setStatusFilter(e.target.value)
                    }
                >
                    <option value="ALL">
                        All Status
                    </option>

                    <option value="SCHEDULED">
                        Scheduled
                    </option>

                    <option value="COMPLETED">
                        Completed
                    </option>

                    <option value="CANCELLED">
                        Cancelled
                    </option>

                </select>

            </div>

            {/* EVENTS HEADER */}

            <div className="events-heading">

                <div>

                    <h2>
                        Church Events
                    </h2>

                    <span>
                        {filteredServices.length} event
                        {filteredServices.length !== 1
                            ? "s"
                            : ""}{" "}
                        found
                    </span>

                </div>

                {/* CREATE PERMISSION */}

                <button
                    type="button"
                    className="small-create"
                    onClick={openCreateModal}
                    disabled={!canCreate}
                    title={
                        !canCreate
                            ? "You do not have permission to create Church Services."
                            : "Create new event"
                    }
                >
                    + New Event
                </button>

            </div>

            {/* CONTENT */}

            {loading ? (

                <div className="empty-state">

                    <div className="spinner" />

                    <h3>
                        Loading church events...
                    </h3>

                    <p>
                        Please wait while we retrieve your events.
                    </p>

                </div>

            ) : filteredServices.length === 0 ? (

                <div className="empty-state">

                    <div className="empty-icon">
                        📅
                    </div>

                    <h3>
                        No church events found
                    </h3>

                    <p>
                        Create your first church service or event to get started.
                    </p>

                    {/* CREATE PERMISSION */}

                    <button
                        type="button"
                        className="btn-primary"
                        onClick={openCreateModal}
                        disabled={!canCreate}
                        title={
                            !canCreate
                                ? "You do not have permission to create Church Services."
                                : "Create first event"
                        }
                    >
                        + Create First Event
                    </button>

                </div>

            ) : (

                <div className="events-grid">

                    {filteredServices.map(service => (

                        <div
                            className="event-card"
                            key={service.churchServiceId}
                        >

                            <div className="event-card-top">

                                <div className="event-calendar">

                                    <span>
                                        {new Date(
                                            service.serviceDate
                                        )
                                            .toLocaleDateString(
                                                "en-US",
                                                {
                                                    month: "short",
                                                }
                                            )
                                            .toUpperCase()}
                                    </span>

                                    <strong>
                                        {new Date(
                                            service.serviceDate
                                        ).getDate()}
                                    </strong>

                                </div>

                                <div className="event-heading">

                                    <div className="event-type">
                                        {service.serviceType ||
                                            "CHURCH EVENT"}
                                    </div>

                                    <h3>
                                        {service.serviceName}
                                    </h3>

                                </div>

                                <StatusBadge
                                    status={service.status}
                                />

                            </div>

                            <div className="event-details">

                                <div>

                                    <span className="detail-icon">
                                        ◷
                                    </span>

                                    <span>

                                        {formatDate(
                                            service.serviceDate
                                        )}

                                        {service.startTime && (
                                            <>
                                                {" • "}
                                                {formatTime(
                                                    service.startTime
                                                )}

                                                {service.endTime &&
                                                    ` - ${formatTime(
                                                        service.endTime
                                                    )}`}
                                            </>
                                        )}

                                    </span>

                                </div>

                                {service.location && (
                                    <div>

                                        <span className="detail-icon">
                                            ⌖
                                        </span>

                                        <span>
                                            {service.location}
                                        </span>

                                    </div>
                                )}

                                {service.serviceLeader && (
                                    <div>

                                        <span className="detail-icon">
                                            ◉
                                        </span>

                                        <span>
                                            Leader:{" "}
                                            <strong>
                                                {
                                                    service.serviceLeader
                                                }
                                            </strong>
                                        </span>

                                    </div>
                                )}

                                {service.speaker && (
                                    <div>

                                        <span className="detail-icon">
                                            ✦
                                        </span>

                                        <span>
                                            Speaker:{" "}
                                            <strong>
                                                {
                                                    service.speaker
                                                }
                                            </strong>
                                        </span>

                                    </div>
                                )}

                            </div>

                            {service.description && (
                                <p className="event-description">
                                    {service.description}
                                </p>
                            )}

                            <div className="event-actions">

                                {/* ATTENDANCE */}

                                <button
                                    type="button"
                                    className="attendance-btn"
                                    onClick={() =>
                                        openAttendance(service)
                                    }
                                    disabled={
                                        !PermissionService.canView(
                                            "Attendance"
                                        )
                                    }
                                >
                                    ✓ Attendance
                                </button>

                                {/* EDIT */}

                                <button
                                    type="button"
                                    className="icon-btn"
                                    title={
                                        !canEdit
                                            ? "You do not have permission to edit Church Services."
                                            : "Edit event"
                                    }
                                    onClick={() =>
                                        openEditModal(service)
                                    }
                                    disabled={!canEdit}
                                >
                                    ✎
                                </button>

                                {/* COMPLETE */}

                                {service.status === "SCHEDULED" && (
                                    <button
                                        type="button"
                                        className="icon-btn complete"
                                        title={
                                            !canEdit
                                                ? "You do not have permission to edit Church Services."
                                                : "Mark completed"
                                        }
                                        onClick={() =>
                                            completeService(service)
                                        }
                                        disabled={!canEdit}
                                    >
                                        ✓
                                    </button>
                                )}

                                {/* DELETE / CANCEL */}

                                {service.status === "SCHEDULED" && (
                                    <button
                                        type="button"
                                        className="icon-btn cancel"
                                        title={
                                            !canDelete
                                                ? "You do not have permission to delete Church Services."
                                                : "Cancel event"
                                        }
                                        onClick={() =>
                                            cancelService(service)
                                        }
                                        disabled={!canDelete}
                                    >
                                        ×
                                    </button>
                                )}

                            </div>

                        </div>

                    ))}

                </div>
            )}

            {/* MODAL */}

            {showModal && (

                <div
                    className="modal-overlay"
                    onMouseDown={e => {

                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            closeModal();
                        }

                    }}
                >

                    <div className="service-modal">

                        <div className="modal-header">

                            <div>

                                <div className="eyebrow">
                                    EVENT MANAGEMENT
                                </div>

                                <h2>
                                    {editingId
                                        ? "Edit Church Event"
                                        : "Create Church Event"}
                                </h2>

                                <p>
                                    Enter the details for this church gathering.
                                </p>

                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeModal}
                            >
                                ×
                            </button>

                        </div>

                        <form
                            onSubmit={saveService}
                            className="service-form"
                        >

                            <div className="form-grid">

                                <div className="form-field full">

                                    <label>
                                        Event / Service Name *
                                    </label>

                                    <input
                                        value={form.serviceName}
                                        onChange={e =>
                                            updateForm(
                                                "serviceName",
                                                e.target.value
                                            )
                                        }
                                        placeholder="e.g. Sunday Worship Service"
                                        required
                                    />

                                </div>

                                <div className="form-field">

                                    <label>
                                        Event Type
                                    </label>

                                    <select
                                        value={form.serviceType}
                                        onChange={e =>
                                            updateForm(
                                                "serviceType",
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="WORSHIP">
                                            Worship
                                        </option>

                                        <option value="PRAYER">
                                            Prayer Meeting
                                        </option>

                                        <option value="YOUTH">
                                            Youth Fellowship
                                        </option>

                                        <option value="VBS">
                                            Vacation Bible School
                                        </option>

                                        <option value="SPECIAL">
                                            Special Event
                                        </option>

                                        <option value="OUTREACH">
                                            Outreach
                                        </option>

                                        <option value="MEETING">
                                            Church Meeting
                                        </option>

                                        <option value="OTHER">
                                            Other
                                        </option>

                                    </select>

                                </div>

                                <div className="form-field">

                                    <label>
                                        Status
                                    </label>

                                    <select
                                        value={form.status}
                                        onChange={e =>
                                            updateForm(
                                                "status",
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="SCHEDULED">
                                            Scheduled
                                        </option>

                                        <option value="COMPLETED">
                                            Completed
                                        </option>

                                        <option value="CANCELLED">
                                            Cancelled
                                        </option>

                                    </select>

                                </div>

                                <div className="form-field">

                                    <label>
                                        Date *
                                    </label>

                                    <input
                                        type="date"
                                        value={form.serviceDate}
                                        onChange={e =>
                                            updateForm(
                                                "serviceDate",
                                                e.target.value
                                            )
                                        }
                                        required
                                    />

                                </div>

                                <div className="form-field">

                                    <label>
                                        Location
                                    </label>

                                    <input
                                        value={form.location}
                                        onChange={e =>
                                            updateForm(
                                                "location",
                                                e.target.value
                                            )
                                        }
                                        placeholder="e.g. Main Church"
                                    />

                                </div>

                                <div className="form-field">

                                    <label>
                                        Start Time
                                    </label>

                                    <input
                                        type="time"
                                        value={form.startTime}
                                        onChange={e =>
                                            updateForm(
                                                "startTime",
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                                <div className="form-field">

                                    <label>
                                        End Time
                                    </label>

                                    <input
                                        type="time"
                                        value={form.endTime}
                                        onChange={e =>
                                            updateForm(
                                                "endTime",
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                                <div className="form-field">

                                    <label>
                                        Service Leader
                                    </label>

                                    <input
                                        value={form.serviceLeader}
                                        onChange={e =>
                                            updateForm(
                                                "serviceLeader",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Leader"
                                    />

                                </div>

                                <div className="form-field">

                                    <label>
                                        Speaker
                                    </label>

                                    <input
                                        value={form.speaker}
                                        onChange={e =>
                                            updateForm(
                                                "speaker",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Speaker / Preacher"
                                    />

                                </div>

                                <div className="form-field full">

                                    <label>
                                        Description
                                    </label>

                                    <textarea
                                        value={form.description}
                                        onChange={e =>
                                            updateForm(
                                                "description",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Add notes or additional information..."
                                        rows={4}
                                    />

                                </div>

                            </div>

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                {/* SAVE PERMISSION */}

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={
                                        saving ||
                                        (editingId !== null
                                            ? !canEdit
                                            : !canCreate)
                                    }
                                    title={
                                        editingId !== null
                                            ? !canEdit
                                                ? "You do not have permission to edit Church Services."
                                                : "Save changes"
                                            : !canCreate
                                                ? "You do not have permission to create Church Services."
                                                : "Create event"
                                    }
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Save Changes"
                                            : "Create Event"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
};

interface SummaryCardProps {
    label: string;
    value: number;
    icon: string;
    className: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
    label,
    value,
    icon,
    className,
}) => (
    <div className={`summary-card ${className}`}>

        <div className="summary-icon">
            {icon}
        </div>

        <div>
            <span>{label}</span>
            <strong>{value}</strong>
        </div>

    </div>
);

const StatusBadge: React.FC<{
    status: string;
}> = ({ status }) => {

    const normalized =
        status?.toUpperCase() || "SCHEDULED";

    return (
        <span
            className={`status-badge ${normalized.toLowerCase()}`}
        >
            <i />
            {normalized}
        </span>
    );
};

export default ChurchServices;