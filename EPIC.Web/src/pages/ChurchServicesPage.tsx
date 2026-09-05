
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";

import "./ChurchServicesPage.css";

import { API_BASE_URL } from "../config";

// =========================================================
// TYPES
// =========================================================

interface ChurchService {
    churchServiceId: number;

    serviceName: string;
    serviceType: string;

    serviceDate: string;

    startTime?: string | null;
    endTime?: string | null;

    location?: string | null;
    serviceLeader?: string | null;
    speaker?: string | null;
    description?: string | null;

    status: string;

    createdDate?: string;
    updatedDate?: string | null;
}

interface ChurchServiceForm {
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

type ServiceFilter =
    | "ALL"
    | "UPCOMING"
    | "PAST";

// =========================================================
// API
// =========================================================

const API_BASE =
    `${API_BASE_URL}/ChurchServices`;

// =========================================================
// CONSTANTS
// =========================================================

const MAX_DESCRIPTION_LENGTH = 500;

const EMPTY_FORM: ChurchServiceForm = {
    serviceName: "",
    serviceType: "SUNDAY WORSHIP",
    serviceDate: "",
    startTime: "",
    endTime: "",
    location:
        "Luke 4:18 Ministries – San Vicente Church",
    serviceLeader: "",
    speaker: "",
    description: "",
    status: "SCHEDULED",
};

const SERVICE_TYPES: [string, string][] = [
    ["SUNDAY WORSHIP", "Sunday Worship"],
    ["MIDWEEK SERVICE", "Midweek Service"],
    ["PRAYER MEETING", "Prayer Meeting"],
    ["YOUTH FELLOWSHIP", "Youth Fellowship"],
    ["BIBLE STUDY", "Bible Study"],
    ["SPECIAL SERVICE", "Special Service"],
    ["OUTREACH", "Outreach"],
    ["OTHER", "Other"],
];

const SERVICE_STATUSES: [string, string][] = [
    ["SCHEDULED", "Scheduled"],
    ["COMPLETED", "Completed"],
    ["POSTPONED", "Postponed"],
    ["CANCELLED", "Cancelled"],
];

// =========================================================
// AUTH
// =========================================================

const getToken = (): string => {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("epicToken") ||
        ""
    );
};

const getHeaders = (): HeadersInit => {
    const token = getToken();

    return {
        "Content-Type": "application/json",
        Accept: "application/json",

        ...(token
            ? {
                Authorization: `Bearer ${token}`,
            }
            : {}),
    };
};

// =========================================================
// HELPERS
// =========================================================

const normalizeString = (
    value?: string | null
): string => {
    return value?.trim() || "";
};

const normalizeTimeForInput = (
    value?: string | null
): string => {
    if (!value) {
        return "";
    }

    /*
     * API may return:
     *
     * 09:00
     * 09:00:00
     * 09:00:00.0000000
     *
     * HTML input[type=time] expects HH:mm.
     */

    const match = value.match(
        /^(\d{2}):(\d{2})/
    );

    if (!match) {
        return "";
    }

    return `${match[1]}:${match[2]}`;
};

const normalizeTimeForApi = (
    value?: string
): string | null => {
    if (!value?.trim()) {
        return null;
    }

    const cleanValue =
        value.trim();

    /*
     * Convert:
     *
     * 09:00
     *
     * into:
     *
     * 09:00:00
     */

    if (
        /^\d{2}:\d{2}$/.test(
            cleanValue
        )
    ) {
        return `${cleanValue}:00`;
    }

    /*
     * Already HH:mm:ss
     */

    if (
        /^\d{2}:\d{2}:\d{2}$/.test(
            cleanValue
        )
    ) {
        return cleanValue;
    }

    return null;
};

const formatDate = (
    value?: string | null
): string => {
    if (!value) {
        return "—";
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
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        }
    );
};

const formatTime = (
    value?: string | null
): string => {
    if (!value) {
        return "";
    }

    const parts =
        value.split(":");

    if (parts.length < 2) {
        return value;
    }

    const hour =
        Number(parts[0]);

    const minute =
        parts[1];

    if (
        Number.isNaN(hour)
    ) {
        return value;
    }

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    const displayHour =
        hour % 12 || 12;

    return `${displayHour}:${minute} ${suffix}`;
};

const isUpcoming = (
    service: ChurchService
): boolean => {
    if (
        !service.serviceDate
    ) {
        return false;
    }

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    const serviceDate =
        new Date(
            service.serviceDate
        );

    if (
        Number.isNaN(
            serviceDate.getTime()
        )
    ) {
        return false;
    }

    serviceDate.setHours(
        0,
        0,
        0,
        0
    );

    return (
        serviceDate >= today
    );
};

const statusClass = (
    status?: string | null
): string => {
    switch (
        status?.toUpperCase()
    ) {
        case "COMPLETED":
            return "epic-status-completed";

        case "CANCELLED":
            return "epic-status-cancelled";

        case "POSTPONED":
            return "epic-status-postponed";

        default:
            return "epic-status-scheduled";
    }
};

// =========================================================
// API ERROR HANDLER
// =========================================================

const getErrorMessage = async (
    response: Response,
    fallback: string
): Promise<string> => {
    const text =
        await response.text();

    if (!text) {
        return `${fallback} (${response.status})`;
    }

    try {
        const data =
            JSON.parse(text);

        console.error(
            "API ERROR RESPONSE:",
            data
        );

        /*
         * ASP.NET Core validation:
         *
         * {
         *   errors: {
         *      Description: [
         *          "The field Description must..."
         *      ]
         *   }
         * }
         */

        if (data?.errors) {
            const messages =
                Object.entries(
                    data.errors
                ).flatMap(
                    ([
                        field,
                        errors,
                    ]) => {
                        if (
                            Array.isArray(
                                errors
                            )
                        ) {
                            return errors.map(
                                (message) =>
                                    `${field}: ${String(message)}`
                            );
                        }

                        return [
                            `${field}: ${String(errors)}`,
                        ];
                    }
                );

            if (
                messages.length > 0
            ) {
                return messages.join(
                    " | "
                );
            }
        }

        return (
            data?.message ||
            data?.title ||
            data?.error ||
            fallback
        );
    } catch {
        return text;
    }
};

// =========================================================
// COMPONENT
// =========================================================

const ChurchServicesPage: React.FC =
    () => {
        // =====================================================
        // STATE
        // =====================================================

        const [
            services,
            setServices,
        ] = useState<
            ChurchService[]
        >([]);

        const [
            loading,
            setLoading,
        ] = useState(true);

        const [
            saving,
            setSaving,
        ] = useState(false);

        const [
            deleting,
            setDeleting,
        ] = useState(false);

        const [
            error,
            setError,
        ] = useState("");

        const [
            success,
            setSuccess,
        ] = useState("");

        const [
            search,
            setSearch,
        ] = useState("");

        const [
            filter,
            setFilter,
        ] = useState<ServiceFilter>(
            "ALL"
        );

        const [
            showModal,
            setShowModal,
        ] = useState(false);

        const [
            editingId,
            setEditingId,
        ] = useState<number | null>(
            null
        );

        const [
            deleteId,
            setDeleteId,
        ] = useState<number | null>(
            null
        );

        const [
            form,
            setForm,
        ] = useState<ChurchServiceForm>(
            EMPTY_FORM
        );

        // =====================================================
        // MESSAGES
        // =====================================================

        const clearMessages =
            useCallback(() => {
                setError("");
                setSuccess("");
            }, []);

        // =====================================================
        // LOAD SERVICES
        // =====================================================

        const loadServices =
            useCallback(
                async () => {
                    try {
                        setLoading(
                            true
                        );

                        setError("");

                        const response =
                            await fetch(
                                API_BASE,
                                {
                                    method:
                                        "GET",
                                    headers:
                                        getHeaders(),
                                }
                            );

                        if (
                            !response.ok
                        ) {
                            throw new Error(
                                await getErrorMessage(
                                    response,
                                    "Unable to load church services."
                                )
                            );
                        }

                        const data =
                            await response.json();

                        if (
                            Array.isArray(
                                data
                            )
                        ) {
                            setServices(
                                data
                            );
                        } else {
                            setServices(
                                []
                            );
                        }
                    } catch (
                        err
                    ) {
                        console.error(
                            "LOAD CHURCH SERVICES ERROR:",
                            err
                        );

                        setError(
                            err instanceof
                                Error
                                ? err.message
                                : "Unable to load church services."
                        );
                    } finally {
                        setLoading(
                            false
                        );
                    }
                },
                []
            );

        // =====================================================
        // INITIAL LOAD
        // =====================================================

        useEffect(() => {
            loadServices();
        }, [
            loadServices,
        ]);

        // =====================================================
        // FORM CHANGE
        // =====================================================

        const handleChange = (
            event: ChangeEvent<
                HTMLInputElement |
                HTMLSelectElement |
                HTMLTextAreaElement
            >
        ) => {
            const {
                name,
                value,
            } = event.target;

            setForm(
                (
                    current
                ) => ({
                    ...current,
                    [name]: value,
                })
            );
        };

        // =====================================================
        // OPEN ADD
        // =====================================================

        const openAddModal =
            () => {
                clearMessages();

                setEditingId(
                    null
                );

                const today =
                    new Date()
                        .toISOString()
                        .slice(
                            0,
                            10
                        );

                setForm({
                    ...EMPTY_FORM,
                    serviceDate:
                        today,
                });

                setShowModal(
                    true
                );
            };

        // =====================================================
        // OPEN EDIT
        // =====================================================

        const openEditModal =
            (
                service: ChurchService
            ) => {
                clearMessages();

                setEditingId(
                    service.churchServiceId
                );

                setForm({
                    serviceName:
                        normalizeString(
                            service.serviceName
                        ),

                    serviceType:
                        normalizeString(
                            service.serviceType
                        ) ||
                        "SUNDAY WORSHIP",

                    serviceDate:
                        service.serviceDate
                            ? service.serviceDate.slice(
                                0,
                                10
                            )
                            : "",

                    startTime:
                        normalizeTimeForInput(
                            service.startTime
                        ),

                    endTime:
                        normalizeTimeForInput(
                            service.endTime
                        ),

                    location:
                        normalizeString(
                            service.location
                        ),

                    serviceLeader:
                        normalizeString(
                            service.serviceLeader
                        ),

                    speaker:
                        normalizeString(
                            service.speaker
                        ),

                    description:
                        normalizeString(
                            service.description
                        ).slice(
                            0,
                            MAX_DESCRIPTION_LENGTH
                        ),

                    status:
                        normalizeString(
                            service.status
                        ) ||
                        "SCHEDULED",
                });

                setShowModal(
                    true
                );
            };

        // =====================================================
        // CLOSE MODAL
        // =====================================================

        const closeModal =
            () => {
                if (saving) {
                    return;
                }

                setShowModal(
                    false
                );

                setEditingId(
                    null
                );

                setForm({
                    ...EMPTY_FORM,
                });
            };

        // =====================================================
        // SUBMIT
        // =====================================================

        const handleSubmit =
            async (
                event: FormEvent<HTMLFormElement>
            ) => {
                event.preventDefault();

                if (saving) {
                    return;
                }

                clearMessages();

                const serviceName =
                    form.serviceName.trim();

                const serviceDate =
                    form.serviceDate.trim();

                const description =
                    form.description.trim();

                // ---------------------------------------------
                // VALIDATION
                // ---------------------------------------------

                if (!serviceName) {
                    setError(
                        "Service name is required."
                    );
                    return;
                }

                if (!serviceDate) {
                    setError(
                        "Service date is required."
                    );
                    return;
                }

                if (
                    description.length >
                    MAX_DESCRIPTION_LENGTH
                ) {
                    setError(
                        `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`
                    );
                    return;
                }

                // Validate time range
                if (
                    form.startTime &&
                    form.endTime &&
                    form.endTime <
                    form.startTime
                ) {
                    setError(
                        "End time cannot be earlier than start time."
                    );
                    return;
                }

                try {
                    setSaving(
                        true
                    );

                    // -----------------------------------------
                    // PAYLOAD
                    // -----------------------------------------

                    const payload = {
                        serviceName,

                        serviceType:
                            form.serviceType.trim() ||
                            "SUNDAY WORSHIP",

                        serviceDate,

                        startTime:
                            normalizeTimeForApi(
                                form.startTime
                            ),

                        endTime:
                            normalizeTimeForApi(
                                form.endTime
                            ),

                        location:
                            form.location.trim() ||
                            null,

                        serviceLeader:
                            form.serviceLeader.trim() ||
                            null,

                        speaker:
                            form.speaker.trim() ||
                            null,

                        description:
                            description ||
                            null,

                        status:
                            form.status.trim() ||
                            "SCHEDULED",
                    };

                    console.log(
                        "CHURCH SERVICE PAYLOAD:",
                        payload
                    );

                    const editing =
                        editingId !==
                        null;

                    const url =
                        editing
                            ? `${API_BASE}/${editingId}`
                            : API_BASE;

                    const response =
                        await fetch(
                            url,
                            {
                                method:
                                    editing
                                        ? "PUT"
                                        : "POST",

                                headers:
                                    getHeaders(),

                                body:
                                    JSON.stringify(
                                        payload
                                    ),
                            }
                        );

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            await getErrorMessage(
                                response,
                                editing
                                    ? "Unable to update church service."
                                    : "Unable to create church service."
                            )
                        );
                    }

                    // -----------------------------------------
                    // SUCCESS
                    // -----------------------------------------

                    setShowModal(
                        false
                    );

                    setEditingId(
                        null
                    );

                    setForm({
                        ...EMPTY_FORM,
                    });

                    setSuccess(
                        editing
                            ? "Church service updated successfully."
                            : "Church service created successfully."
                    );

                    await loadServices();

                    window.setTimeout(
                        () => {
                            setSuccess(
                                ""
                            );
                        },
                        4000
                    );
                } catch (
                    err
                ) {
                    console.error(
                        "SAVE CHURCH SERVICE ERROR:",
                        err
                    );

                    setError(
                        err instanceof
                            Error
                            ? err.message
                            : "Unable to save church service."
                    );
                } finally {
                    setSaving(
                        false
                    );
                }
            };

        // =====================================================
        // DELETE
        // =====================================================

        const handleDelete =
            async (
                id: number
            ) => {
                if (deleting) {
                    return;
                }

                try {
                    setDeleting(
                        true
                    );

                    clearMessages();

                    const response =
                        await fetch(
                            `${API_BASE}/${id}`,
                            {
                                method:
                                    "DELETE",
                                headers:
                                    getHeaders(),
                            }
                        );

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            await getErrorMessage(
                                response,
                                "Unable to delete church service."
                            )
                        );
                    }

                    setDeleteId(
                        null
                    );

                    setSuccess(
                        "Church service deleted successfully."
                    );

                    await loadServices();

                    window.setTimeout(
                        () => {
                            setSuccess(
                                ""
                            );
                        },
                        4000
                    );
                } catch (
                    err
                ) {
                    console.error(
                        "DELETE CHURCH SERVICE ERROR:",
                        err
                    );

                    setError(
                        err instanceof
                            Error
                            ? err.message
                            : "Unable to delete church service."
                    );
                } finally {
                    setDeleting(
                        false
                    );
                }
            };

        // =====================================================
        // UPDATE STATUS
        // =====================================================

        const updateStatus =
            async (
                id: number,
                status: string
            ) => {
                try {
                    clearMessages();

                    const response =
                        await fetch(
                            `${API_BASE}/${id}/status`,
                            {
                                method:
                                    "PATCH",

                                headers:
                                    getHeaders(),

                                body:
                                    JSON.stringify(
                                        {
                                            status,
                                        }
                                    ),
                            }
                        );

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            await getErrorMessage(
                                response,
                                "Unable to update status."
                            )
                        );
                    }

                    setSuccess(
                        "Service status updated."
                    );

                    await loadServices();

                    window.setTimeout(
                        () => {
                            setSuccess(
                                ""
                            );
                        },
                        3000
                    );
                } catch (
                    err
                ) {
                    console.error(
                        "STATUS UPDATE ERROR:",
                        err
                    );

                    setError(
                        err instanceof
                            Error
                            ? err.message
                            : "Unable to update service status."
                    );
                }
            };

        // =====================================================
        // FILTERED SERVICES
        // =====================================================

        const filteredServices =
            useMemo(() => {
                const keyword =
                    search
                        .trim()
                        .toLowerCase();

                return services.filter(
                    (
                        service
                    ) => {
                        const matchesSearch =
                            !keyword ||
                            normalizeString(
                                service.serviceName
                            )
                                .toLowerCase()
                                .includes(
                                    keyword
                                ) ||
                            normalizeString(
                                service.serviceType
                            )
                                .toLowerCase()
                                .includes(
                                    keyword
                                ) ||
                            normalizeString(
                                service.location
                            )
                                .toLowerCase()
                                .includes(
                                    keyword
                                ) ||
                            normalizeString(
                                service.serviceLeader
                            )
                                .toLowerCase()
                                .includes(
                                    keyword
                                ) ||
                            normalizeString(
                                service.speaker
                            )
                                .toLowerCase()
                                .includes(
                                    keyword
                                );

                        const upcoming =
                            isUpcoming(
                                service
                            );

                        const matchesFilter =
                            filter ===
                            "ALL"
                                ? true
                                : filter ===
                                    "UPCOMING"
                                    ? upcoming
                                    : !upcoming;

                        return (
                            matchesSearch &&
                            matchesFilter
                        );
                    }
                );
            }, [
                services,
                search,
                filter,
            ]);

        // =====================================================
        // COUNTS
        // =====================================================

        const counts =
            useMemo(
                () => ({
                    total:
                        services.length,

                    upcoming:
                        services.filter(
                            isUpcoming
                        ).length,

                    scheduled:
                        services.filter(
                            (
                                service
                            ) =>
                                service.status
                                    ?.toUpperCase() ===
                                "SCHEDULED"
                        ).length,

                    completed:
                        services.filter(
                            (
                                service
                            ) =>
                                service.status
                                    ?.toUpperCase() ===
                                "COMPLETED"
                        ).length,
                }),
                [services]
            );

        // =====================================================
        // RENDER
        // =====================================================

        return (
            <div className="epic-services-page">

                {/* ============================================
                    HEADER
                ============================================ */}

                <div className="epic-services-header">

                    <div>
                        <h1>
                            Church Services
                        </h1>

                        <p>
                            Schedule and manage
                            church worship
                            services,
                            fellowships and
                            special events.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="epic-primary-button"
                        onClick={
                            openAddModal
                        }
                    >
                        <span>
                            +
                        </span>

                        Add Church Service
                    </button>

                </div>

                {/* ============================================
                    ALERTS
                ============================================ */}

                {success && (
                    <div className="epic-alert epic-alert-success">
                        ✓ {success}
                    </div>
                )}

                {error && (
                    <div className="epic-alert epic-alert-error">

                        <span>
                            ⚠ {error}
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setError(
                                    ""
                                )
                            }
                        >
                            ×
                        </button>

                    </div>
                )}

                {/* ============================================
                    SUMMARY
                ============================================ */}

                <div className="epic-service-summary">

                    <div className="epic-summary-card">

                        <div className="epic-summary-icon">
                            📅
                        </div>

                        <div>
                            <span>
                                Total Services
                            </span>

                            <strong>
                                {
                                    counts.total
                                }
                            </strong>
                        </div>

                    </div>

                    <div className="epic-summary-card">

                        <div className="epic-summary-icon">
                            🗓
                        </div>

                        <div>
                            <span>
                                Upcoming
                            </span>

                            <strong>
                                {
                                    counts.upcoming
                                }
                            </strong>
                        </div>

                    </div>

                    <div className="epic-summary-card">

                        <div className="epic-summary-icon">
                            ✓
                        </div>

                        <div>
                            <span>
                                Scheduled
                            </span>

                            <strong>
                                {
                                    counts.scheduled
                                }
                            </strong>
                        </div>

                    </div>

                    <div className="epic-summary-card">

                        <div className="epic-summary-icon">
                            ✔
                        </div>

                        <div>
                            <span>
                                Completed
                            </span>

                            <strong>
                                {
                                    counts.completed
                                }
                            </strong>
                        </div>

                    </div>

                </div>

                {/* ============================================
                    TOOLBAR
                ============================================ */}

                <div className="epic-services-toolbar">

                    <div className="epic-search-box">

                        <span>
                            🔎
                        </span>

                        <input
                            type="text"
                            placeholder="Search services..."
                            value={
                                search
                            }
                            onChange={(
                                event
                            ) =>
                                setSearch(
                                    event
                                        .target
                                        .value
                                )
                            }
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() =>
                                    setSearch(
                                        ""
                                    )
                                }
                            >
                                ×
                            </button>
                        )}

                    </div>

                    <div className="epic-filter-buttons">

                        {(
                            [
                                [
                                    "ALL",
                                    "All",
                                ],
                                [
                                    "UPCOMING",
                                    "Upcoming",
                                ],
                                [
                                    "PAST",
                                    "Past",
                                ],
                            ] as const
                        ).map(
                            ([
                                value,
                                label,
                            ]) => (
                                <button
                                    key={
                                        value
                                    }
                                    type="button"
                                    className={
                                        filter ===
                                        value
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setFilter(
                                            value
                                        )
                                    }
                                >
                                    {label}
                                </button>
                            )
                        )}

                    </div>

                </div>

                {/* ============================================
                    SERVICES CARD
                ============================================ */}

                <div className="epic-services-card">

                    <div className="epic-card-header">

                        <div>
                            <h2>
                                Service Schedule
                            </h2>

                            <p>
                                {
                                    filteredServices.length
                                }{" "}
                                service
                                {filteredServices.length !==
                                1
                                    ? "s"
                                    : ""}{" "}
                                displayed
                            </p>
                        </div>

                        <button
                            type="button"
                            className="epic-refresh-button"
                            onClick={
                                loadServices
                            }
                            disabled={
                                loading
                            }
                        >
                            ↻ Refresh
                        </button>

                    </div>

                    {/* LOADING */}

                    {loading ? (
                        <div className="epic-empty-state">

                            <div className="epic-loading-spinner">
                                ⟳
                            </div>

                            <h3>
                                Loading
                                services...
                            </h3>

                        </div>
                    ) : filteredServices.length ===
                      0 ? (

                        /* EMPTY */

                        <div className="epic-empty-state">

                            <div className="epic-empty-icon">
                                📅
                            </div>

                            <h3>
                                No church
                                services
                                found
                            </h3>

                            <p>
                                Create your
                                first
                                church
                                service
                                schedule.
                            </p>

                            <button
                                type="button"
                                className="epic-primary-button"
                                onClick={
                                    openAddModal
                                }
                            >
                                +
                                Add Church
                                Service
                            </button>

                        </div>
                    ) : (

                        /* TABLE */

                        <div className="epic-table-wrapper">

                            <table className="epic-services-table">

                                <thead>

                                    <tr>
                                        <th>
                                            SERVICE
                                        </th>

                                        <th>
                                            DATE
                                        </th>

                                        <th>
                                            TIME
                                        </th>

                                        <th>
                                            LOCATION
                                        </th>

                                        <th>
                                            LEADER /
                                            SPEAKER
                                        </th>

                                        <th>
                                            STATUS
                                        </th>

                                        <th>
                                            ACTIONS
                                        </th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {filteredServices.map(
                                        (
                                            service
                                        ) => (
                                            <tr
                                                key={
                                                    service.churchServiceId
                                                }
                                            >

                                                <td>

                                                    <div className="epic-service-name">

                                                        <strong>
                                                            {
                                                                service.serviceName
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                service.serviceType ||
                                                                "Church Service"
                                                            }
                                                        </span>

                                                    </div>

                                                </td>

                                                <td>

                                                    <strong>
                                                        {formatDate(
                                                            service.serviceDate
                                                        )}
                                                    </strong>

                                                </td>

                                                <td>

                                                    <div className="epic-service-time">

                                                        {formatTime(
                                                            service.startTime
                                                        )}

                                                        {service.endTime && (
                                                            <>
                                                                {" – "}

                                                                {formatTime(
                                                                    service.endTime
                                                                )}
                                                            </>
                                                        )}

                                                    </div>

                                                </td>

                                                <td>
                                                    {
                                                        service.location ||
                                                        "—"
                                                    }
                                                </td>

                                                <td>

                                                    <div className="epic-leader-info">

                                                        {service.serviceLeader && (
                                                            <span>
                                                                <b>
                                                                    Leader:
                                                                </b>{" "}
                                                                {
                                                                    service.serviceLeader
                                                                }
                                                            </span>
                                                        )}

                                                        {service.speaker && (
                                                            <span>
                                                                <b>
                                                                    Speaker:
                                                                </b>{" "}
                                                                {
                                                                    service.speaker
                                                                }
                                                            </span>
                                                        )}

                                                        {!service.serviceLeader &&
                                                            !service.speaker && (
                                                                <span>
                                                                    —
                                                                </span>
                                                            )}

                                                    </div>

                                                </td>

                                                <td>

                                                    <select
                                                        className={`epic-status-select ${statusClass(
                                                            service.status
                                                        )}`}
                                                        value={
                                                            service.status ||
                                                            "SCHEDULED"
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateStatus(
                                                                service.churchServiceId,
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    >

                                                        {SERVICE_STATUSES.map(
                                                            ([
                                                                value,
                                                                label,
                                                            ]) => (
                                                                <option
                                                                    key={
                                                                        value
                                                                    }
                                                                    value={
                                                                        value
                                                                    }
                                                                >
                                                                    {label.toUpperCase()}
                                                                </option>
                                                            )
                                                        )}

                                                    </select>

                                                </td>

                                                <td>

                                                    <div className="epic-action-buttons">

                                                        <button
                                                            type="button"
                                                            className="epic-edit-button"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    service
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="epic-delete-button"
                                                            onClick={() =>
                                                                setDeleteId(
                                                                    service.churchServiceId
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

                </div>

                {/* ============================================
                    ADD / EDIT MODAL
                ============================================ */}

                {showModal && (
                    <div
                        className="epic-modal-overlay"
                        onMouseDown={(
                            event
                        ) => {
                            if (
                                event.target ===
                                    event.currentTarget &&
                                !saving
                            ) {
                                closeModal();
                            }
                        }}
                    >

                        <div className="epic-service-modal">

                            <div className="epic-modal-header">

                                <div>

                                    <h2>
                                        {editingId !==
                                        null
                                            ? "Edit Church Service"
                                            : "Add Church Service"}
                                    </h2>

                                    <p>
                                        Schedule a
                                        church
                                        service or
                                        event.
                                    </p>

                                </div>

                                <button
                                    type="button"
                                    className="epic-modal-close"
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
                                    handleSubmit
                                }
                            >

                                <div className="epic-form-grid">

                                    {/* SERVICE NAME */}

                                    <div className="epic-form-group epic-form-full">

                                        <label>
                                            Service
                                            Name
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <input
                                            name="serviceName"
                                            type="text"
                                            value={
                                                form.serviceName
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="e.g. Sunday Worship Service"
                                            required
                                            maxLength={
                                                200
                                            }
                                        />

                                    </div>

                                    {/* SERVICE TYPE */}

                                    <div className="epic-form-group">

                                        <label>
                                            Service
                                            Type
                                        </label>

                                        <select
                                            name="serviceType"
                                            value={
                                                form.serviceType
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        >
                                            {SERVICE_TYPES.map(
                                                ([
                                                    value,
                                                    label,
                                                ]) => (
                                                    <option
                                                        key={
                                                            value
                                                        }
                                                        value={
                                                            value
                                                        }
                                                    >
                                                        {
                                                            label
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>

                                    </div>

                                    {/* STATUS */}

                                    <div className="epic-form-group">

                                        <label>
                                            Status
                                        </label>

                                        <select
                                            name="status"
                                            value={
                                                form.status
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        >
                                            {SERVICE_STATUSES.map(
                                                ([
                                                    value,
                                                    label,
                                                ]) => (
                                                    <option
                                                        key={
                                                            value
                                                        }
                                                        value={
                                                            value
                                                        }
                                                    >
                                                        {
                                                            label
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>

                                    </div>

                                    {/* DATE */}

                                    <div className="epic-form-group">

                                        <label>
                                            Service
                                            Date
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <input
                                            name="serviceDate"
                                            type="date"
                                            value={
                                                form.serviceDate
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />

                                    </div>

                                    {/* START TIME */}

                                    <div className="epic-form-group">

                                        <label>
                                            Start Time
                                        </label>

                                        <input
                                            name="startTime"
                                            type="time"
                                            value={
                                                form.startTime
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                    </div>

                                    {/* END TIME */}

                                    <div className="epic-form-group">

                                        <label>
                                            End Time
                                        </label>

                                        <input
                                            name="endTime"
                                            type="time"
                                            value={
                                                form.endTime
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                    </div>

                                    {/* LOCATION */}

                                    <div className="epic-form-group epic-form-full">

                                        <label>
                                            Location
                                        </label>

                                        <input
                                            name="location"
                                            type="text"
                                            value={
                                                form.location
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Church location"
                                            maxLength={
                                                250
                                            }
                                        />

                                    </div>

                                    {/* LEADER */}

                                    <div className="epic-form-group">

                                        <label>
                                            Service
                                            Leader
                                        </label>

                                        <input
                                            name="serviceLeader"
                                            type="text"
                                            value={
                                                form.serviceLeader
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Worship / Service Leader"
                                            maxLength={
                                                200
                                            }
                                        />

                                    </div>

                                    {/* SPEAKER */}

                                    <div className="epic-form-group">

                                        <label>
                                            Speaker /
                                            Preacher
                                        </label>

                                        <input
                                            name="speaker"
                                            type="text"
                                            value={
                                                form.speaker
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Speaker / Preacher"
                                            maxLength={
                                                200
                                            }
                                        />

                                    </div>

                                    {/* DESCRIPTION */}

                                    <div className="epic-form-group epic-form-full">

                                        <label>
                                            Description /
                                            Notes
                                        </label>

                                        <textarea
                                            name="description"
                                            value={
                                                form.description
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Additional notes about this service..."
                                            rows={
                                                4
                                            }
                                            maxLength={
                                                MAX_DESCRIPTION_LENGTH
                                            }
                                        />

                                        <small
                                            style={{
                                                display:
                                                    "block",
                                                marginTop:
                                                    "6px",
                                                textAlign:
                                                    "right",
                                                opacity:
                                                    0.7,
                                            }}
                                        >
                                            {
                                                form
                                                    .description
                                                    .length
                                            }
                                            /
                                            {
                                                MAX_DESCRIPTION_LENGTH
                                            }
                                        </small>

                                    </div>

                                </div>

                                {/* MODAL FOOTER */}

                                <div className="epic-modal-footer">

                                    <button
                                        type="button"
                                        className="epic-secondary-button"
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
                                        className="epic-primary-button"
                                        disabled={
                                            saving
                                        }
                                    >
                                        {saving
                                            ? "Saving..."
                                            : editingId !==
                                                null
                                                ? "Update Service"
                                                : "Save Service"}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>
                )}

                {/* ============================================
                    DELETE MODAL
                ============================================ */}

                {deleteId !==
                    null && (
                    <div
                        className="epic-modal-overlay"
                        onMouseDown={(
                            event
                        ) => {
                            if (
                                event.target ===
                                    event.currentTarget &&
                                !deleting
                            ) {
                                setDeleteId(
                                    null
                                );
                            }
                        }}
                    >

                        <div className="epic-delete-modal">

                            <div className="epic-delete-icon">
                                ⚠
                            </div>

                            <h2>
                                Delete Church
                                Service?
                            </h2>

                            <p>
                                This action
                                cannot be
                                undone. The
                                service
                                schedule
                                will be
                                permanently
                                removed.
                            </p>

                            <div className="epic-modal-footer">

                                <button
                                    type="button"
                                    className="epic-secondary-button"
                                    onClick={() =>
                                        setDeleteId(
                                            null
                                        )
                                    }
                                    disabled={
                                        deleting
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="epic-danger-button"
                                    onClick={() =>
                                        handleDelete(
                                            deleteId
                                        )
                                    }
                                    disabled={
                                        deleting
                                    }
                                >
                                    {deleting
                                        ? "Deleting..."
                                        : "Delete Service"}
                                </button>

                            </div>

                        </div>

                    </div>
                )}

            </div>
        );
    };

export default ChurchServicesPage;

