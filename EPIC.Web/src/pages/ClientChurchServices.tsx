import React, {
useCallback,
useEffect,
useMemo,
useState,
} from "react";

import axios from "axios";

import { API_BASE_URL } from "../config";

import "./ClientChurchServices.css";

// =========================================================
// TYPES
// =========================================================

interface ChurchService {
churchServiceId: number;


serviceName: string;
serviceType?: string;

serviceDate: string;

startTime?: string;
endTime?: string;

location?: string;

serviceLeader?: string;
speaker?: string;

description?: string;

status?: string;

createdDate?: string;
updatedDate?: string;


}

interface ClientPermission {
clientPermissionId?: number;


moduleName: string;

canView: boolean;
canCreate: boolean;
canEdit: boolean;
canDelete: boolean;
canManage: boolean;


}

interface ClientChurchServicesProps {
permissions?: ClientPermission[];
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

// =========================================================
// CONSTANTS
// =========================================================

const EMPTY_FORM: ServiceForm = {
serviceName: "",
serviceType: "",
serviceDate: "",
startTime: "",
endTime: "",
location: "",
serviceLeader: "",
speaker: "",
description: "",
status: "SCHEDULED",
};

const STATUS_OPTIONS = [
"SCHEDULED",
"ONGOING",
"COMPLETED",
"CANCELLED",
];

// =========================================================
// COMPONENT
// =========================================================

const ClientChurchServices:
React.FC<ClientChurchServicesProps> = ({
permissions = [],
}) => {


// =====================================================
// STATE
// =====================================================

const [services, setServices] =
    useState<ChurchService[]>([]);

const [loading, setLoading] =
    useState<boolean>(true);

const [saving, setSaving] =
    useState<boolean>(false);

const [error, setError] =
    useState<string>("");

const [success, setSuccess] =
    useState<string>("");

const [showForm, setShowForm] =
    useState<boolean>(false);

const [editingService, setEditingService] =
    useState<ChurchService | null>(null);

const [formData, setFormData] =
    useState<ServiceForm>(
        EMPTY_FORM
    );

const [searchTerm, setSearchTerm] =
    useState<string>("");

const [statusFilter, setStatusFilter] =
    useState<string>("ALL");

// =====================================================
// AUTH TOKEN
// =====================================================

const getToken = (): string | null => {

    return (
        localStorage.getItem(
            "clientToken"
        )
        ??
        localStorage.getItem(
            "token"
        )
    );
};

// =====================================================
// AXIOS CONFIG
// =====================================================

const getConfig = () => {

    const token =
        getToken();

    return {
        headers: token
            ? {
                Authorization:
                    `Bearer ${token}`,
            }
            : {},
    };
};

// =====================================================
// PERMISSION
// =====================================================

const churchServicesPermission =
    useMemo(() => {

        return permissions.find(
            (permission) =>
                permission.moduleName
                    ?.trim()
                    .toLowerCase() ===
                  "services"
        );

    }, [permissions]);

const canView =
    churchServicesPermission?.canView ===
    true;

const canCreate =
    churchServicesPermission?.canCreate ===
    true;

const canEdit =
    churchServicesPermission?.canEdit ===
    true;

const canDelete =
    churchServicesPermission?.canDelete ===
    true;

const canManage =
    churchServicesPermission?.canManage ===
    true;

// =====================================================
// LOAD SERVICES
// =====================================================

const loadServices =
    useCallback(
        async (): Promise<void> => {

            try {

                setLoading(true);
                setError("");

                const response =
                    await axios.get<
                        ChurchService[]
                    >(
                        `${API_BASE_URL}/ChurchServices`,
                        getConfig()
                    );

                setServices(
                    Array.isArray(
                        response.data
                    )
                        ? response.data
                        : []
                );

            } catch (err) {

                console.error(
                    "Unable to load church services:",
                    err
                );

                if (
                    axios.isAxiosError(
                        err
                    )
                ) {

                    setError(
                        err.response?.data
                            ?.message
                        ??
                        "Unable to load church services."
                    );

                } else {

                    setError(
                        "Unable to load church services."
                    );
                }

                setServices([]);

            } finally {

                setLoading(false);

            }
        },
        []
    );

// =====================================================
// INITIAL LOAD
// =====================================================

useEffect(() => {

    if (!canView) {

        setLoading(false);

        return;
    }

    void loadServices();

}, [
    canView,
    loadServices,
]);

// =====================================================
// CLEAR ALERTS
// =====================================================

const clearMessages =
    (): void => {

        setError("");
        setSuccess("");

    };

// =====================================================
// OPEN CREATE FORM
// =====================================================

const handleCreate =
    (): void => {

        clearMessages();

        setEditingService(
            null
        );

        setFormData(
            EMPTY_FORM
        );

        setShowForm(
            true
        );
    };

// =====================================================
// OPEN EDIT FORM
// =====================================================

const handleEdit =
    (
        service: ChurchService
    ): void => {

        clearMessages();

        setEditingService(
            service
        );

        setFormData({
            serviceName:
                service.serviceName
                ?? "",

            serviceType:
                service.serviceType
                ?? "",

            serviceDate:
                service.serviceDate
                    ? service
                        .serviceDate
                        .split("T")[0]
                    : "",

            startTime:
                service.startTime
                ?? "",

            endTime:
                service.endTime
                ?? "",

            location:
                service.location
                ?? "",

            serviceLeader:
                service.serviceLeader
                ?? "",

            speaker:
                service.speaker
                ?? "",

            description:
                service.description
                ?? "",

            status:
                service.status
                ?.toUpperCase()
                ?? "SCHEDULED",
        });

        setShowForm(
            true
        );
    };

// =====================================================
// CLOSE FORM
// =====================================================

const closeForm =
    (): void => {

        if (saving) {
            return;
        }

        setShowForm(
            false
        );

        setEditingService(
            null
        );

        setFormData(
            EMPTY_FORM
        );
    };

// =====================================================
// INPUT CHANGE
// =====================================================

const handleChange =
    (
        event:
            React.ChangeEvent<
                HTMLInputElement |
                HTMLTextAreaElement |
                HTMLSelectElement
            >
    ): void => {

        const {
            name,
            value,
        } = event.target;

        setFormData(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );
    };

// =====================================================
// SAVE SERVICE
// =====================================================

const handleSubmit =
    async (
        event:
            React.FormEvent<HTMLFormElement>
    ): Promise<void> => {

        event.preventDefault();

        clearMessages();

        if (
            !formData.serviceName
                .trim()
        ) {

            setError(
                "Service name is required."
            );

            return;
        }

        if (
            !formData.serviceDate
        ) {

            setError(
                "Service date is required."
            );

            return;
        }

        try {

            setSaving(
                true
            );

            const payload = {
                serviceName:
                    formData.serviceName
                        .trim(),

                serviceType:
                    formData.serviceType
                        .trim(),

                serviceDate:
                    formData.serviceDate,

                startTime:
                    formData.startTime
                        .trim(),

                endTime:
                    formData.endTime
                        .trim(),

                location:
                    formData.location
                        .trim(),

                serviceLeader:
                    formData.serviceLeader
                        .trim(),

                speaker:
                    formData.speaker
                        .trim(),

                description:
                    formData.description
                        .trim(),

                status:
                    formData.status
                        .toUpperCase(),
            };

            // =============================================
            // UPDATE
            // =============================================

            if (
                editingService
            ) {

                await axios.put(
                    `${API_BASE_URL}/ChurchServices/${editingService.churchServiceId}`,
                    payload,
                    getConfig()
                );

                setSuccess(
                    "Church service updated successfully."
                );

            }

            // =============================================
            // CREATE
            // =============================================

            else {

                await axios.post(
                    `${API_BASE_URL}/ChurchServices`,
                    payload,
                    getConfig()
                );

                setSuccess(
                    "Church service created successfully."
                );
            }

            await loadServices();

            setShowForm(
                false
            );

            setEditingService(
                null
            );

            setFormData(
                EMPTY_FORM
            );

        } catch (err) {

            console.error(
                "Unable to save church service:",
                err
            );

            if (
                axios.isAxiosError(
                    err
                )
            ) {

                setError(
                    err.response?.data
                        ?.message
                    ??
                    "Unable to save church service."
                );

            } else {

                setError(
                    "Unable to save church service."
                );
            }

        } finally {

            setSaving(
                false
            );
        }
    };

// =====================================================
// UPDATE STATUS
// =====================================================

const handleStatusChange =
    async (
        service: ChurchService,
        status: string
    ): Promise<void> => {

        clearMessages();

        try {

            await axios.patch(
                `${API_BASE_URL}/ChurchServices/${service.churchServiceId}/status`,
                {
                    status,
                },
                getConfig()
            );

            setSuccess(
                `Service status changed to ${status}.`
            );

            await loadServices();

        } catch (err) {

            console.error(
                "Unable to update status:",
                err
            );

            if (
                axios.isAxiosError(
                    err
                )
            ) {

                setError(
                    err.response?.data
                        ?.message
                    ??
                    "Unable to update service status."
                );

            } else {

                setError(
                    "Unable to update service status."
                );
            }
        }
    };

// =====================================================
// DELETE
// =====================================================

const handleDelete =
    async (
        service: ChurchService
    ): Promise<void> => {

        const confirmed =
            window.confirm(
                `Delete "${service.serviceName}"?\n\nThis action cannot be undone.`
            );

        if (!confirmed) {
            return;
        }

        clearMessages();

        try {

            await axios.delete(
                `${API_BASE_URL}/ChurchServices/${service.churchServiceId}`,
                getConfig()
            );

            setSuccess(
                "Church service deleted successfully."
            );

            await loadServices();

        } catch (err) {

            console.error(
                "Unable to delete church service:",
                err
            );

            if (
                axios.isAxiosError(
                    err
                )
            ) {

                setError(
                    err.response?.data
                        ?.message
                    ??
                    "Unable to delete church service."
                );

            } else {

                setError(
                    "Unable to delete church service."
                );
            }
        }
    };

// =====================================================
// FILTERED SERVICES
// =====================================================

const filteredServices =
    useMemo(() => {

        const search =
            searchTerm
                .trim()
                .toLowerCase();

        return services.filter(
            (service) => {

                const matchesSearch =
                    !search ||
                    service.serviceName
                        ?.toLowerCase()
                        .includes(
                            search
                        ) ||
                    service.serviceType
                        ?.toLowerCase()
                        .includes(
                            search
                        ) ||
                    service.location
                        ?.toLowerCase()
                        .includes(
                            search
                        );

                const normalizedStatus =
                    service.status
                        ?.trim()
                        .toUpperCase()
                    ?? "SCHEDULED";

                const matchesStatus =
                    statusFilter ===
                        "ALL"
                    ||
                    normalizedStatus ===
                        statusFilter;

                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );

    }, [
        services,
        searchTerm,
        statusFilter,
    ]);

// =====================================================
// STATISTICS
// =====================================================

const statistics =
    useMemo(() => {

        const total =
            services.length;

        const scheduled =
            services.filter(
                (service) =>
                    service.status
                        ?.toUpperCase() ===
                    "SCHEDULED"
            ).length;

        const ongoing =
            services.filter(
                (service) =>
                    service.status
                        ?.toUpperCase() ===
                    "ONGOING"
            ).length;

        const completed =
            services.filter(
                (service) =>
                    service.status
                        ?.toUpperCase() ===
                    "COMPLETED"
            ).length;

        return {
            total,
            scheduled,
            ongoing,
            completed,
        };

    }, [
        services,
    ]);

// =====================================================
// DATE FORMAT
// =====================================================

const formatDate =
    (
        value?: string
    ): string => {

        if (!value) {
            return "—";
        }

        const date =
            new Date(
                `${value.split("T")[0]}T00:00:00`
            );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return value;
        }

        return new Intl.DateTimeFormat(
            "en-US",
            {
                year: "numeric",
                month: "long",
                day: "numeric",
            }
        ).format(date);
    };

// =====================================================
// ACCESS DENIED
// =====================================================

if (!canView) {

    return (

        <div className="client-church-services">

            <div className="client-services-access-denied">

                <div className="client-services-access-icon">
                    🔒
                </div>

                <h2>
                    Access Restricted
                </h2>

                <p>
                    You do not have permission
                    to access Church Services.
                </p>

            </div>

        </div>
    );
}

// =====================================================
// RENDER
// =====================================================

return (

    <div className="client-church-services">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="client-services-header">

            <div>

                <span className="client-services-eyebrow">
                    CHURCH MANAGEMENT
                </span>

                <h1>
                    Church Services
                </h1>

                <p>
                    Create and manage your church
                    services and events.
                </p>

            </div>

            {canCreate && (

                <button
                    type="button"
                    className="client-services-create-button"
                    onClick={
                        handleCreate
                    }
                >

                    <span>
                        ＋
                    </span>

                    Create Service

                </button>

            )}

        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (

            <div className="client-services-alert error">

                <span>
                    !
                </span>

                <div>

                    <strong>
                        Attention
                    </strong>

                    <p>
                        {error}
                    </p>

                </div>

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

        {success && (

            <div className="client-services-alert success">

                <span>
                    ✓
                </span>

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
            STATISTICS
        ================================================= */}

        <div className="client-services-stat-grid">

            <div className="client-services-stat-card">

                <span>
                    TOTAL SERVICES
                </span>

                <strong>
                    {statistics.total}
                </strong>

            </div>

            <div className="client-services-stat-card">

                <span>
                    SCHEDULED
                </span>

                <strong>
                    {statistics.scheduled}
                </strong>

            </div>

            <div className="client-services-stat-card">

                <span>
                    ONGOING
                </span>

                <strong>
                    {statistics.ongoing}
                </strong>

            </div>

            <div className="client-services-stat-card">

                <span>
                    COMPLETED
                </span>

                <strong>
                    {statistics.completed}
                </strong>

            </div>

        </div>

        {/* =================================================
            SERVICES PANEL
        ================================================= */}

        <div className="client-services-panel">

            <div className="client-services-panel-header">

                <div>

                    <h2>
                        Service Records
                    </h2>

                    <p>
                        Manage your church
                        service schedule.
                    </p>

                </div>

                <div className="client-services-filters">

                    <input
                        type="text"
                        placeholder="Search services..."
                        value={
                            searchTerm
                        }
                        onChange={
                            (event) =>
                                setSearchTerm(
                                    event
                                        .target
                                        .value
                                )
                        }
                    />

                    <select
                        value={
                            statusFilter
                        }
                        onChange={
                            (event) =>
                                setStatusFilter(
                                    event
                                        .target
                                        .value
                                )
                        }
                    >

                        <option value="ALL">
                            All Status
                        </option>

                        {STATUS_OPTIONS.map(
                            (status) => (

                                <option
                                    key={status}
                                    value={status}
                                >
                                    {status}
                                </option>

                            )
                        )}

                    </select>

                </div>

            </div>

            {/* LOADING */}

            {loading && (

                <div className="client-services-loading">

                    <div className="client-services-spinner" />

                    <p>
                        Loading church services...
                    </p>

                </div>

            )}

            {/* EMPTY */}

            {!loading &&
                filteredServices.length ===
                0 && (

                <div className="client-services-empty">

                    <div>
                        ◷
                    </div>

                    <h3>
                        {services.length === 0
                            ? "No Church Services Yet"
                            : "No Services Found"}
                    </h3>

                    <p>
                        {services.length === 0
                            ? "Create your first church service to begin managing attendance and ministry activities."
                            : "Try changing your search or filter."}
                    </p>

                    {services.length === 0 &&
                        canCreate && (

                        <button
                            type="button"
                            onClick={
                                handleCreate
                            }
                        >
                            Create First Service
                        </button>

                    )}

                </div>

            )}

            {/* SERVICE LIST */}

            {!loading &&
                filteredServices.length >
                0 && (

                <div className="client-services-list">

                    {filteredServices.map(
                        (service) => {

                            const status =
                                service.status
                                    ?.toUpperCase()
                                ?? "SCHEDULED";

                            return (

                                <div
                                    className="client-service-card"
                                    key={
                                        service.churchServiceId
                                    }
                                >

                                    <div className="client-service-main">

                                        <div className="client-service-date">

                                            <span>
                                                {service.serviceDate
                                                    ? new Date(
                                                        `${service.serviceDate.split("T")[0]}T00:00:00`
                                                    )
                                                        .toLocaleDateString(
                                                            "en-US",
                                                            {
                                                                month: "short",
                                                            }
                                                        )
                                                        .toUpperCase()
                                                    : "—"}
                                            </span>

                                            <strong>
                                                {service.serviceDate
                                                    ? new Date(
                                                        `${service.serviceDate.split("T")[0]}T00:00:00`
                                                    ).getDate()
                                                    : "—"}
                                            </strong>

                                        </div>

                                        <div className="client-service-info">

                                            <div className="client-service-title-row">

                                                <h3>
                                                    {service.serviceName}
                                                </h3>

                                                <span
                                                    className={
                                                        `client-service-status ${status.toLowerCase()}`
                                                    }
                                                >
                                                    {status}
                                                </span>

                                            </div>

                                            <div className="client-service-meta">

                                                <span>
                                                    📅 {formatDate(
                                                        service.serviceDate
                                                    )}
                                                </span>

                                                {service.startTime && (

                                                    <span>
                                                        ◷ {service.startTime}
                                                        {service.endTime
                                                            ? ` – ${service.endTime}`
                                                            : ""}
                                                    </span>

                                                )}

                                                {service.location && (

                                                    <span>
                                                        ◉ {service.location}
                                                    </span>

                                                )}

                                            </div>

                                            {service.serviceType && (

                                                <span className="client-service-type">

                                                    {service.serviceType}

                                                </span>

                                            )}

                                        </div>

                                    </div>

                                    <div className="client-service-actions">

                                        {(canManage ||
                                            canEdit) && (

                                            <button
                                                type="button"
                                                className="client-service-edit"
                                                onClick={() =>
                                                    handleEdit(
                                                        service
                                                    )
                                                }
                                            >
                                                Edit
                                            </button>

                                        )}

                                        {canManage && (

                                            <select
                                                className="client-service-status-select"
                                                value={
                                                    status
                                                }
                                                onChange={
                                                    (event) =>
                                                        void handleStatusChange(
                                                            service,
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                }
                                            >

                                                {STATUS_OPTIONS.map(
                                                    (
                                                        statusOption
                                                    ) => (

                                                        <option
                                                            key={
                                                                statusOption
                                                            }
                                                            value={
                                                                statusOption
                                                            }
                                                        >
                                                            {statusOption}
                                                        </option>

                                                    )
                                                )}

                                            </select>

                                        )}

                                        {(canManage ||
                                            canDelete) && (

                                            <button
                                                type="button"
                                                className="client-service-delete"
                                                onClick={() =>
                                                    void handleDelete(
                                                        service
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>

                                        )}

                                    </div>

                                </div>

                            );
                        }
                    )}

                </div>

            )}

        </div>

        {/* =================================================
            MODAL
        ================================================= */}

        {showForm && (

            <div className="client-services-modal-backdrop">

                <div className="client-services-modal">

                    <div className="client-services-modal-header">

                        <div>

                            <span>
                                CHURCH SERVICE
                            </span>

                            <h2>
                                {editingService
                                    ? "Edit Church Service"
                                    : "Create Church Service"}
                            </h2>

                        </div>

                        <button
                            type="button"
                            onClick={
                                closeForm
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
                            handleSubmit
                        }
                    >

                        <div className="client-services-form-grid">

                            <label className="full">

                                <span>
                                    Service Name *
                                </span>

                                <input
                                    type="text"
                                    name="serviceName"
                                    value={
                                        formData.serviceName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. Sunday Worship Celebration"
                                    required
                                />

                            </label>

                            <label>

                                <span>
                                    Service Type
                                </span>

                                <input
                                    type="text"
                                    name="serviceType"
                                    value={
                                        formData.serviceType
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. SUNDAY WORSHIP"
                                />

                            </label>

                            <label>

                                <span>
                                    Status
                                </span>

                                <select
                                    name="status"
                                    value={
                                        formData.status
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >

                                    {STATUS_OPTIONS.map(
                                        (
                                            status
                                        ) => (

                                            <option
                                                key={
                                                    status
                                                }
                                                value={
                                                    status
                                                }
                                            >
                                                {status}
                                            </option>

                                        )
                                    )}

                                </select>

                            </label>

                            <label>

                                <span>
                                    Service Date *
                                </span>

                                <input
                                    type="date"
                                    name="serviceDate"
                                    value={
                                        formData.serviceDate
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </label>

                            <label>

                                <span>
                                    Start Time
                                </span>

                                <input
                                    type="time"
                                    name="startTime"
                                    value={
                                        formData.startTime
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                            </label>

                            <label>

                                <span>
                                    End Time
                                </span>

                                <input
                                    type="time"
                                    name="endTime"
                                    value={
                                        formData.endTime
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                            </label>

                            <label className="full">

                                <span>
                                    Location
                                </span>

                                <input
                                    type="text"
                                    name="location"
                                    value={
                                        formData.location
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Church location"
                                />

                            </label>

                            <label>

                                <span>
                                    Service Leader
                                </span>

                                <input
                                    type="text"
                                    name="serviceLeader"
                                    value={
                                        formData.serviceLeader
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Service leader"
                                />

                            </label>

                            <label>

                                <span>
                                    Speaker
                                </span>

                                <input
                                    type="text"
                                    name="speaker"
                                    value={
                                        formData.speaker
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Speaker or preacher"
                                />

                            </label>

                            <label className="full">

                                <span>
                                    Description
                                </span>

                                <textarea
                                    name="description"
                                    value={
                                        formData.description
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Optional service description..."
                                    rows={4}
                                />

                            </label>

                        </div>

                        <div className="client-services-form-actions">

                            <button
                                type="button"
                                className="cancel"
                                onClick={
                                    closeForm
                                }
                                disabled={
                                    saving
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="save"
                                disabled={
                                    saving
                                }
                            >

                                {saving
                                    ? "Saving..."
                                    : editingService
                                        ? "Save Changes"
                                        : "Create Service"}

                            </button>

                        </div>

                    </form>

                </div>

            </div>

        )}

    </div>
);


};

export default ClientChurchServices;
