import { API_BASE_URL } from "../config";
import React, { useEffect, useMemo, useState } from "react";
import "./EventAttendance.css";


const ATTENDANCE_STATUSES = [
    "PRESENT",
    "LATE",
    "EARLY",
    "ABSENT",
    "EXCUSED",
] as const;

type AttendanceStatus =
    typeof ATTENDANCE_STATUSES[number];

interface ChurchService {
    churchServiceId: number;
    serviceName: string;
    serviceType?: string | null;
    serviceDate: string;
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
    serviceLeader?: string | null;
    speaker?: string | null;
    description?: string | null;
    status: string;
}

interface Member {
    memberId: number;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    name?: string | null;
}

interface AttendanceRow {
    memberId: number;
    member: Member;
    attendanceId?: number;
    status: AttendanceStatus | string;
    attendanceDate: string;
}

interface EventAttendanceResponse {
    service: ChurchService;
    summary?: {
        total: number;
        present: number;
        late: number;
        early: number;
        absent: number;
        excused: number;
    };
    attendance: AttendanceRow[];
}

async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("epicToken") ||
        "";

    const headers = new Headers(options.headers);

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`
        );
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers,
        }
    );

    if (!response.ok) {
        let message =
            `Request failed (${response.status})`;

        try {
            const text = await response.text();

            if (text) {
                try {
                    const data = JSON.parse(text);

                    message =
                        data?.message ||
                        data?.title ||
                        data?.error ||
                        message;
                } catch {
                    message = text;
                }
            }
        } catch {
            // Ignore
        }

        if (response.status === 401) {
            message =
                "Your session has expired. Please login again.";
        }

        if (response.status === 403) {
            message =
                "You do not have permission to perform this action.";
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return {} as T;
    }

    const text = await response.text();

    if (!text) {
        return {} as T;
    }

    try {
        return JSON.parse(text) as T;
    } catch {
        return text as T;
    }
}

const getMemberName = (
    member: Member
): string => {
    if (member.fullName?.trim()) {
        return member.fullName.trim();
    }

    if (member.name?.trim()) {
        return member.name.trim();
    }

    return [
        member.firstName,
        member.middleName,
        member.lastName,
    ]
        .filter(Boolean)
        .join(" ")
        .trim() || "Unknown Member";
};

const formatDate = (
    value?: string | null
): string => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString(
        "en-PH",
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        }
    );
};

const formatShortDate = (
    value?: string | null
): string => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString(
        "en-PH",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        }
    );
};

const formatTime = (
    value?: string | null
): string => {
    if (!value) return "";

    const parts = value.split(":");

    if (parts.length < 2) {
        return value;
    }

    const hour = Number(parts[0]);
    const minute = Number(parts[1]);

    if (
        Number.isNaN(hour) ||
        Number.isNaN(minute)
    ) {
        return value;
    }

    const date = new Date();

    date.setHours(
        hour,
        minute,
        0,
        0
    );

    return date.toLocaleTimeString(
        "en-PH",
        {
            hour: "numeric",
            minute: "2-digit",
        }
    );
};

const statusClass = (
    status?: string | null
): string => {
    return (
        status || "unknown"
    )
        .toLowerCase()
        .replace(/\s+/g, "-");
};

const EventAttendance: React.FC = () => {
    const [services, setServices] =
        useState<ChurchService[]>([]);

    const [selectedServiceId, setSelectedServiceId] =
        useState<number | "">("");

    const [selectedService, setSelectedService] =
        useState<ChurchService | null>(null);

    const [rows, setRows] =
        useState<AttendanceRow[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [servicesLoading, setServicesLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [search, setSearch] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const loadServices = async () => {
        try {
            setServicesLoading(true);
            setError("");

            const data =
                await apiFetch<ChurchService[]>(
                    "/ChurchService"
                );

            setServices(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load church services."
            );
        } finally {
            setServicesLoading(false);
        }
    };

    const loadAttendance = async (
        serviceId: number
    ) => {
        try {
            setLoading(true);
            setError("");
            setMessage("");

            const data =
                await apiFetch<EventAttendanceResponse>(
                    `/Attendance/event/${serviceId}`
                );

            setSelectedService(
                data.service
            );

            setRows(
                Array.isArray(data.attendance)
                    ? data.attendance
                    : []
            );
        } catch (err) {
            console.error(err);

            setSelectedService(null);
            setRows([]);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load attendance."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadServices();
    }, []);

    const handleServiceChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const value =
            event.target.value;

        if (!value) {
            setSelectedServiceId("");
            setSelectedService(null);
            setRows([]);
            setSearch("");
            setError("");
            setMessage("");
            return;
        }

        const serviceId =
            Number(value);

        if (!Number.isFinite(serviceId)) {
            return;
        }

        setSelectedServiceId(serviceId);
        setSearch("");

        void loadAttendance(serviceId);
    };

    const updateStatus = (
        memberId: number,
        status: string
    ) => {
        setRows(current =>
            current.map(row =>
                row.memberId === memberId
                    ? {
                        ...row,
                        status,
                    }
                    : row
            )
        );
    };

    const markAllPresent = () => {
        setRows(current =>
            current.map(row => ({
                ...row,
                status: "PRESENT",
            }))
        );
    };

    const markAllAbsent = () => {
        setRows(current =>
            current.map(row => ({
                ...row,
                status: "ABSENT",
            }))
        );
    };

    const saveAttendance = async () => {
        if (!selectedServiceId) {
            setError(
                "Please select a church service."
            );
            return;
        }

        if (rows.length === 0) {
            setError(
                "There are no active members to record."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setMessage("");

            await apiFetch(
                `/Attendance/event/${selectedServiceId}`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        attendance:
                            rows.map(row => ({
                                memberId:
                                    row.memberId,
                                status:
                                    row.status,
                            })),
                    }),
                }
            );

            setMessage(
                "Attendance saved successfully."
            );

            await loadAttendance(
                Number(selectedServiceId)
            );
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save attendance."
            );
        } finally {
            setSaving(false);
        }
    };

    const filteredRows =
        useMemo(() => {
            const keyword =
                search
                    .trim()
                    .toLowerCase();

            if (!keyword) {
                return rows;
            }

            return rows.filter(row =>
                getMemberName(
                    row.member
                )
                    .toLowerCase()
                    .includes(keyword)
            );
        }, [rows, search]);

    const summary = useMemo(() => {
        return {
            total: rows.length,

            present: rows.filter(
                row =>
                    row.status.toUpperCase() ===
                    "PRESENT"
            ).length,

            late: rows.filter(
                row =>
                    row.status.toUpperCase() ===
                    "LATE"
            ).length,

            early: rows.filter(
                row =>
                    row.status.toUpperCase() ===
                    "EARLY"
            ).length,

            absent: rows.filter(
                row =>
                    row.status.toUpperCase() ===
                    "ABSENT"
            ).length,

            excused: rows.filter(
                row =>
                    row.status.toUpperCase() ===
                    "EXCUSED"
            ).length,
        };
    }, [rows]);

    return (
        <div className="event-attendance-page">

            <div className="event-attendance-header">

                <div>
                    <div className="event-eyebrow">
                        EPIC ATTENDANCE
                    </div>

                    <h1>
                        Event Attendance
                    </h1>

                    <p>
                        Record and manage member
                        attendance for every church
                        service and event.
                    </p>
                </div>

                <div className="event-header-icon">
                    ✓
                </div>

            </div>

            <div className="event-selector-card">

                <div className="selector-label">
                    SELECT CHURCH EVENT
                </div>

                <select
                    value={selectedServiceId}
                    onChange={
                        handleServiceChange
                    }
                    disabled={
                        servicesLoading
                    }
                >
                    <option value="">
                        {servicesLoading
                            ? "Loading services..."
                            : "Select a church service..."}
                    </option>

                    {services.map(
                        service => (
                            <option
                                key={
                                    service.churchServiceId
                                }
                                value={
                                    service.churchServiceId
                                }
                            >
                                {
                                    service.serviceName
                                }
                                {" — "}
                                {formatShortDate(
                                    service.serviceDate
                                )}
                                {service.startTime
                                    ? ` • ${formatTime(
                                        service.startTime
                                    )}`
                                    : ""}
                            </option>
                        )
                    )}

                </select>

            </div>

            {error && (
                <div className="event-alert error">
                    <strong>!</strong>
                    <span>{error}</span>

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

            {message && (
                <div className="event-alert success">
                    <strong>✓</strong>
                    <span>{message}</span>

                    <button
                        type="button"
                        onClick={() =>
                            setMessage("")
                        }
                    >
                        ×
                    </button>
                </div>
            )}

            {selectedService && (
                <div className="service-info-card">

                    <div className="service-main-info">

                        <div className="service-icon">
                            ⛪
                        </div>

                        <div>

                            <h2>
                                {
                                    selectedService.serviceName
                                }
                            </h2>

                            <div className="service-meta">

                                <span>
                                    📅{" "}
                                    {
                                        formatDate(
                                            selectedService.serviceDate
                                        )
                                    }
                                </span>

                                {(selectedService.startTime ||
                                    selectedService.endTime) && (
                                        <span>
                                            🕐{" "}
                                            {
                                                formatTime(
                                                    selectedService.startTime
                                                )
                                            }
                                            {selectedService.endTime
                                                ? ` - ${formatTime(
                                                    selectedService.endTime
                                                )}`
                                                : ""}
                                        </span>
                                    )}

                                {selectedService.location && (
                                    <span>
                                        📍{" "}
                                        {
                                            selectedService.location
                                        }
                                    </span>
                                )}

                            </div>

                        </div>

                    </div>

                    <div
                        className={`service-status ${statusClass(
                            selectedService.status
                        )}`}
                    >
                        {
                            selectedService.status
                        }
                    </div>

                </div>
            )}

            {selectedService && (
                <div className="attendance-summary">

                    <div className="summary-card total">
                        <span>Total</span>
                        <strong>
                            {summary.total}
                        </strong>
                    </div>

                    <div className="summary-card present">
                        <span>Present</span>
                        <strong>
                            {summary.present}
                        </strong>
                    </div>

                    <div className="summary-card late">
                        <span>Late</span>
                        <strong>
                            {summary.late}
                        </strong>
                    </div>

                    <div className="summary-card early">
                        <span>Early</span>
                        <strong>
                            {summary.early}
                        </strong>
                    </div>

                    <div className="summary-card absent">
                        <span>Absent</span>
                        <strong>
                            {summary.absent}
                        </strong>
                    </div>

                    <div className="summary-card excused">
                        <span>Excused</span>
                        <strong>
                            {summary.excused}
                        </strong>
                    </div>

                </div>
            )}

            {selectedService && (
                <div className="attendance-panel">

                    <div className="attendance-panel-header">

                        <div>
                            <h2>
                                Member Attendance
                            </h2>

                            <p>
                                Mark each member's
                                attendance for this
                                event.
                            </p>
                        </div>

                        <div className="attendance-actions">

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={
                                    markAllPresent
                                }
                                disabled={
                                    saving ||
                                    rows.length === 0
                                }
                            >
                                ✓ Mark All Present
                            </button>

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={
                                    markAllAbsent
                                }
                                disabled={
                                    saving ||
                                    rows.length === 0
                                }
                            >
                                Mark All Absent
                            </button>

                            <button
                                type="button"
                                className="primary-button"
                                onClick={
                                    saveAttendance
                                }
                                disabled={
                                    saving ||
                                    rows.length === 0
                                }
                            >
                                {saving
                                    ? "Saving..."
                                    : "Save Attendance"}
                            </button>

                        </div>

                    </div>

                    <div className="attendance-toolbar">

                        <div className="search-box">

                            <span>
                                🔎
                            </span>

                            <input
                                type="text"
                                placeholder="Search member..."
                                value={search}
                                onChange={e =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch("")
                                    }
                                >
                                    ×
                                </button>
                            )}

                        </div>

                        <span>
                            {filteredRows.length} of{" "}
                            {rows.length} members
                        </span>

                    </div>

                    {loading ? (
                        <div className="attendance-loading">
                            <div className="spinner" />
                            <span>
                                Loading attendance...
                            </span>
                        </div>
                    ) : (
                        <div className="attendance-table-wrapper">

                            <table className="attendance-table">

                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>
                                            MEMBER
                                        </th>
                                        <th>
                                            STATUS
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {filteredRows.map(
                                        (
                                            row,
                                            index
                                        ) => {

                                            const name =
                                                getMemberName(
                                                    row.member
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        row.memberId
                                                    }
                                                >

                                                    <td>
                                                        {
                                                            index +
                                                            1
                                                        }
                                                    </td>

                                                    <td>

                                                        <div className="member-cell">

                                                            <div className="member-avatar">
                                                                {name
                                                                    .charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase()}
                                                            </div>

                                                            <div>
                                                                <strong>
                                                                    {
                                                                        name
                                                                    }
                                                                </strong>

                                                                <span>
                                                                    Member
                                                                    ID:{" "}
                                                                    {
                                                                        row.memberId
                                                                    }
                                                                </span>
                                                            </div>

                                                        </div>

                                                    </td>

                                                    <td>

                                                        <select
                                                            className={`attendance-status ${statusClass(
                                                                row.status
                                                            )}`}
                                                            value={
                                                                row.status
                                                            }
                                                            onChange={e =>
                                                                updateStatus(
                                                                    row.memberId,
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            disabled={
                                                                saving
                                                            }
                                                        >

                                                            {ATTENDANCE_STATUSES.map(
                                                                status => (
                                                                    <option
                                                                        key={
                                                                            status
                                                                        }
                                                                        value={
                                                                            status
                                                                        }
                                                                    >
                                                                        {
                                                                            status
                                                                        }
                                                                    </option>
                                                                )
                                                            )}

                                                        </select>

                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )}

                                    {filteredRows.length ===
                                        0 && (
                                            <tr>
                                                <td
                                                    colSpan={
                                                        3
                                                    }
                                                    className="empty-row"
                                                >
                                                    No members
                                                    found.
                                                </td>
                                            </tr>
                                        )}

                                </tbody>

                            </table>

                        </div>
                    )}

                </div>
            )}

            {!selectedService && (
                <div className="event-empty">

                    <div className="event-empty-icon">
                        ⛪
                    </div>

                    <h2>
                        Select a Church Event
                    </h2>

                    <p>
                        Choose a church service above
                        to begin recording attendance.
                    </p>

                </div>
            )}

        </div>
    );
};

export default EventAttendance;