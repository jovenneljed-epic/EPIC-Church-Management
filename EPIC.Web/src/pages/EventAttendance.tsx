import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import { API_BASE_URL } from "../config";
import "./EventAttendance.css";

// =========================================================
// ATTENDANCE STATUSES
// =========================================================

const ATTENDANCE_STATUSES = [
    "PRESENT",
    "LATE",
    "EARLY",
    "ABSENT",
    "EXCUSED",
] as const;

type AttendanceStatus =
    typeof ATTENDANCE_STATUSES[number];

// =========================================================
// EVENT
// =========================================================

interface Event {
    eventId: number;
    title: string;
    eventType: string;
    eventDate: string;
    startTime?: string | null;
    endTime?: string | null;
    venue?: string | null;
    speaker?: string | null;
    ministry?: string | null;
    status: string;
    description?: string | null;
    notes?: string | null;
}

// =========================================================
// MEMBER
// =========================================================

interface Member {
    memberId: number;
    memberCode?: string | null;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    name?: string | null;
}

// =========================================================
// ATTENDANCE ROW
// =========================================================

interface AttendanceRow {
    memberId: number;
    member: Member;
    attendanceId?: number;
    status: AttendanceStatus | string;
    attendanceDate: string;
}

// =========================================================
// SUMMARY
// =========================================================

interface AttendanceSummary {
    total: number;
    present: number;
    late: number;
    early: number;
    absent: number;
    excused: number;
}

// =========================================================
// EVENT ATTENDANCE RESPONSE
// =========================================================

interface EventAttendanceResponse {
    eventId: number;
    title: string;
    eventType: string;
    eventDate: string;
    startTime?: string | null;
    endTime?: string | null;
    venue?: string | null;
    speaker?: string | null;
    ministry?: string | null;
    status: string;

    canRecordAttendance?: boolean;

    message?: string;

    summary?: AttendanceSummary;

    attendance: any[];
}

// =========================================================
// API FETCH
// =========================================================

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

    const headers =
        new Headers(options.headers);

    if (
        options.body &&
        !headers.has("Content-Type")
    ) {
        headers.set(
            "Content-Type",
            "application/json"
        );
    }

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`
        );
    }

    const response =
        await fetch(
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

            const text =
                await response.text();

            if (text) {

                try {

                    const data =
                        JSON.parse(text);

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

    const text =
        await response.text();

    if (!text) {

        return {} as T;

    }

    try {

        return JSON.parse(text) as T;

    } catch {

        return text as T;

    }
}

// =========================================================
// MEMBER NAME
// =========================================================

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

// =========================================================
// DATE FORMAT
// =========================================================

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

// =========================================================
// SHORT DATE
// =========================================================

const formatShortDate = (
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

// =========================================================
// TIME FORMAT
// =========================================================

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
        Number(parts[1]);

    if (
        Number.isNaN(hour) ||
        Number.isNaN(minute)
    ) {

        return value;

    }

    const date =
        new Date();

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

// =========================================================
// STATUS CLASS
// =========================================================

const statusClass = (
    status?: string | null
): string => {

    return (
        status || "unknown"
    )
        .toLowerCase()
        .replace(/\s+/g, "-");
};

// =========================================================
// EVENT ATTENDANCE COMPONENT
// =========================================================

const EventAttendance: React.FC = () => {

    // =====================================================
    // STATE
    // =====================================================

    const [events, setEvents] =
        useState<Event[]>([]);

    const [selectedEventId, setSelectedEventId] =
        useState<number | "">("");

    const [selectedEvent, setSelectedEvent] =
        useState<Event | null>(null);

    const [rows, setRows] =
        useState<AttendanceRow[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [eventsLoading, setEventsLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [search, setSearch] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    // =====================================================
    // LOAD EVENTS
    // =====================================================

    const loadEvents = async () => {

        try {

            setEventsLoading(true);

            setError("");

            const data =
                await apiFetch<Event[]>(
                    "/Events"
                );

            setEvents(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (err) {

            console.error(
                "EVENT LOAD ERROR:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load events."
            );

        } finally {

            setEventsLoading(false);

        }
    };

    // =====================================================
    // LOAD EVENT ATTENDANCE
    // =====================================================

    const loadAttendance = async (
        eventId: number
    ) => {

        try {

            setLoading(true);

            setError("");

            setMessage("");

            const data =
                await apiFetch<EventAttendanceResponse>(
                    `/Attendance/Event/${eventId}`
                );

            // =================================================
            // FIND EVENT FROM EVENT LIST
            // =================================================

            const eventFromList =
                events.find(
                    event =>
                        event.eventId ===
                        eventId
                );

            // =================================================
            // BUILD EVENT
            // =================================================

            const event: Event = {

                eventId:
                    data.eventId ??
                    eventFromList?.eventId ??
                    eventId,

                title:
                    data.title ??
                    eventFromList?.title ??
                    "Event",

                eventType:
                    data.eventType ??
                    eventFromList?.eventType ??
                    "EVENT",

                eventDate:
                    data.eventDate ??
                    eventFromList?.eventDate ??
                    "",

                startTime:
                    data.startTime ??
                    eventFromList?.startTime ??
                    null,

                endTime:
                    data.endTime ??
                    eventFromList?.endTime ??
                    null,

                venue:
                    data.venue ??
                    eventFromList?.venue ??
                    null,

                speaker:
                    data.speaker ??
                    eventFromList?.speaker ??
                    null,

                ministry:
                    data.ministry ??
                    eventFromList?.ministry ??
                    null,

                status:
                    data.status ??
                    eventFromList?.status ??
                    "SCHEDULED",

                description:
                    eventFromList?.description ??
                    null,

                notes:
                    eventFromList?.notes ??
                    null,
            };

            setSelectedEvent(event);

            // =================================================
            // CONVERT BACKEND RECORDS
            // =================================================

            const attendanceRows: AttendanceRow[] =
                Array.isArray(data.attendance)
                    ? data.attendance.map(
                        (item: any) => {

                            const member: Member = {

                                memberId:
                                    item.memberId,

                                memberCode:
                                    item.memberCode,

                                firstName:
                                    item.firstName,

                                middleName:
                                    item.middleName,

                                lastName:
                                    item.lastName,

                                fullName:
                                    item.fullName ??
                                    [
                                        item.firstName,
                                        item.middleName,
                                        item.lastName,
                                    ]
                                        .filter(Boolean)
                                        .join(" ")
                                        .trim(),

                                name:
                                    item.name ??
                                    [
                                        item.firstName,
                                        item.middleName,
                                        item.lastName,
                                    ]
                                        .filter(Boolean)
                                        .join(" ")
                                        .trim(),
                            };

                            return {

                                memberId:
                                    item.memberId,

                                member,

                                attendanceId:
                                    item.attendanceId,

                                status:
                                    item.status ||
                                    "PRESENT",

                                attendanceDate:
                                    item.attendanceDate ??
                                    event.eventDate,
                            };
                        }
                    )
                    : [];

            setRows(
                attendanceRows
            );

        } catch (err) {

            console.error(
                "EVENT ATTENDANCE LOAD ERROR:",
                err
            );

            setSelectedEvent(null);

            setRows([]);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load event attendance."
            );

        } finally {

            setLoading(false);

        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        void loadEvents();

    }, []);

    // =====================================================
    // EVENT CHANGE
    // =====================================================

    const handleEventChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {

        const value =
            event.target.value;

        if (!value) {

            setSelectedEventId("");

            setSelectedEvent(null);

            setRows([]);

            setSearch("");

            setError("");

            setMessage("");

            return;
        }

        const eventId =
            Number(value);

        if (!Number.isFinite(eventId)) {

            return;

        }

        setSelectedEventId(
            eventId
        );

        setSearch("");

        void loadAttendance(
            eventId
        );
    };

    // =====================================================
    // UPDATE STATUS
    // =====================================================

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

    // =====================================================
    // MARK ALL PRESENT
    // =====================================================

    const markAllPresent = () => {

        setRows(current =>
            current.map(row => ({
                ...row,
                status: "PRESENT",
            }))
        );

    };

    // =====================================================
    // MARK ALL ABSENT
    // =====================================================

    const markAllAbsent = () => {

        setRows(current =>
            current.map(row => ({
                ...row,
                status: "ABSENT",
            }))
        );

    };

    // =====================================================
    // SAVE ATTENDANCE
    // =====================================================

    const saveAttendance = async () => {

        if (!selectedEventId) {

            setError(
                "Please select an event."
            );

            return;
        }

        if (rows.length === 0) {

            setError(
                "There are no members to record."
            );

            return;
        }

        try {

            setSaving(true);

            setError("");

            setMessage("");

            await apiFetch(
                `/Attendance/Event/${selectedEventId}`,
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
                "Event attendance saved successfully."
            );

            // =================================================
            // RELOAD DATABASE DATA
            // =================================================

            await loadAttendance(
                Number(selectedEventId)
            );

        } catch (err) {

            console.error(
                "EVENT ATTENDANCE SAVE ERROR:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save attendance."
            );

        } finally {

            setSaving(false);

        }
    };

    // =====================================================
    // FILTER
    // =====================================================

    const filteredRows =
        useMemo(() => {

            const keyword =
                search
                    .trim()
                    .toLowerCase();

            if (!keyword) {

                return rows;

            }

            return rows.filter(row => {

                const name =
                    getMemberName(
                        row.member
                    )
                        .toLowerCase();

                const code =
                    row.member.memberCode
                        ?.toLowerCase() || "";

                return (
                    name.includes(keyword) ||
                    code.includes(keyword) ||
                    String(
                        row.memberId
                    ).includes(keyword)
                );

            });

        }, [rows, search]);

    // =====================================================
    // SUMMARY
    // =====================================================

    const summary =
        useMemo(() => {

            return {

                total:
                    rows.length,

                present:
                    rows.filter(
                        row =>
                            row.status
                                .toUpperCase() ===
                            "PRESENT"
                    ).length,

                late:
                    rows.filter(
                        row =>
                            row.status
                                .toUpperCase() ===
                            "LATE"
                    ).length,

                early:
                    rows.filter(
                        row =>
                            row.status
                                .toUpperCase() ===
                            "EARLY"
                    ).length,

                absent:
                    rows.filter(
                        row =>
                            row.status
                                .toUpperCase() ===
                            "ABSENT"
                    ).length,

                excused:
                    rows.filter(
                        row =>
                            row.status
                                .toUpperCase() ===
                            "EXCUSED"
                    ).length,

            };

        }, [rows]);

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="event-attendance-page">

            {/* =================================================
                HEADER
            ================================================= */}

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
                        attendance for church
                        events and special activities.
                    </p>

                </div>

                <div className="event-header-icon">
                    ✓
                </div>

            </div>

            {/* =================================================
                EVENT SELECTOR
            ================================================= */}

            <div className="event-selector-card">

                <div className="selector-label">
                    SELECT EVENT
                </div>

                <select
                    value={
                        selectedEventId
                    }
                    onChange={
                        handleEventChange
                    }
                    disabled={
                        eventsLoading
                    }
                >

                    <option value="">

                        {eventsLoading
                            ? "Loading events..."
                            : "Select an event..."}

                    </option>

                    {events.map(
                        event => (

                            <option
                                key={
                                    event.eventId
                                }
                                value={
                                    event.eventId
                                }
                            >

                                {event.title}

                                {" — "}

                                {
                                    formatShortDate(
                                        event.eventDate
                                    )
                                }

                                {event.startTime
                                    ? ` • ${formatTime(
                                        event.startTime
                                    )}`
                                    : ""}

                            </option>

                        )
                    )}

                </select>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="event-alert error">

                    <strong>
                        !
                    </strong>

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
                SUCCESS
            ================================================= */}

            {message && (

                <div className="event-alert success">

                    <strong>
                        ✓
                    </strong>

                    <span>
                        {message}
                    </span>

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

            {/* =================================================
                EVENT INFORMATION
            ================================================= */}

            {selectedEvent && (

                <div className="service-info-card">

                    <div className="service-main-info">

                        <div className="service-icon">
                            ⛪
                        </div>

                        <div>

                            <div className="event-type-label">

                                {
                                    selectedEvent.eventType
                                }

                            </div>

                            <h2>

                                {
                                    selectedEvent.title
                                }

                            </h2>

                            <div className="service-meta">

                                <span>

                                    📅{" "}

                                    {
                                        formatDate(
                                            selectedEvent.eventDate
                                        )
                                    }

                                </span>

                                {(selectedEvent.startTime ||
                                    selectedEvent.endTime) && (

                                    <span>

                                        🕐{" "}

                                        {
                                            formatTime(
                                                selectedEvent.startTime
                                            )
                                        }

                                        {selectedEvent.endTime
                                            ? ` - ${formatTime(
                                                selectedEvent.endTime
                                            )}`
                                            : ""}

                                    </span>

                                )}

                                {selectedEvent.venue && (

                                    <span>

                                        📍{" "}

                                        {
                                            selectedEvent.venue
                                        }

                                    </span>

                                )}

                            </div>

                            {(selectedEvent.speaker ||
                                selectedEvent.ministry) && (

                                <div className="event-extra-info">

                                    {selectedEvent.speaker && (

                                        <span>

                                            🎤{" "}
                                            {
                                                selectedEvent.speaker
                                            }

                                        </span>

                                    )}

                                    {selectedEvent.ministry && (

                                        <span>

                                            ◈{" "}
                                            {
                                                selectedEvent.ministry
                                            }

                                        </span>

                                    )}

                                </div>

                            )}

                        </div>

                    </div>

                    <div
                        className={`service-status ${statusClass(
                            selectedEvent.status
                        )}`}
                    >

                        {
                            selectedEvent.status
                        }

                    </div>

                </div>

            )}

            {/* =================================================
                SUMMARY
            ================================================= */}

            {selectedEvent && (

                <div className="attendance-summary">

                    <div className="summary-card total">

                        <span>
                            Total
                        </span>

                        <strong>
                            {summary.total}
                        </strong>

                    </div>

                    <div className="summary-card present">

                        <span>
                            Present
                        </span>

                        <strong>
                            {summary.present}
                        </strong>

                    </div>

                    <div className="summary-card late">

                        <span>
                            Late
                        </span>

                        <strong>
                            {summary.late}
                        </strong>

                    </div>

                    <div className="summary-card early">

                        <span>
                            Early
                        </span>

                        <strong>
                            {summary.early}
                        </strong>

                    </div>

                    <div className="summary-card absent">

                        <span>
                            Absent
                        </span>

                        <strong>
                            {summary.absent}
                        </strong>

                    </div>

                    <div className="summary-card excused">

                        <span>
                            Excused
                        </span>

                        <strong>
                            {summary.excused}
                        </strong>

                    </div>

                </div>

            )}

            {/* =================================================
                ATTENDANCE PANEL
            ================================================= */}

            {selectedEvent && (

                <div className="attendance-panel">

                    <div className="attendance-panel-header">

                        <div>

                            <h2>
                                Member Attendance
                            </h2>

                            <p>
                                Mark each member's
                                attendance for this event.
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
                                    loading ||
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
                                    loading ||
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
                                    loading ||
                                    rows.length === 0
                                }
                            >

                                {saving
                                    ? "Saving..."
                                    : "Save Attendance"}

                            </button>

                        </div>

                    </div>

                    {/* =================================================
                        TOOLBAR
                    ================================================= */}

                    <div className="attendance-toolbar">

                        <div className="search-box">

                            <span>
                                🔎
                            </span>

                            <input
                                type="text"
                                placeholder="Search member..."
                                value={
                                    search
                                }
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

                            {filteredRows.length}
                            {" of "}
                            {rows.length}
                            {" members"}

                        </span>

                    </div>

                    {/* =================================================
                        TABLE
                    ================================================= */}

                    {loading ? (

                        <div className="attendance-loading">

                            <div className="spinner" />

                            <span>
                                Loading event attendance...
                            </span>

                        </div>

                    ) : (

                        <div className="attendance-table-wrapper">

                            <table className="attendance-table">

                                <thead>

                                    <tr>

                                        <th>
                                            #
                                        </th>

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

                                                                    {row.member.memberCode
                                                                        ? `Member Code: ${row.member.memberCode}`
                                                                        : `Member ID: ${row.memberId}`}

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
                                                                    e.target.value
                                                                )
                                                            }
                                                            disabled={
                                                                saving ||
                                                                loading
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

                                                    {search
                                                        ? "No members match your search."
                                                        : "No members found."}

                                                </td>

                                            </tr>

                                        )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            )}

            {/* =================================================
                EMPTY STATE
            ================================================= */}

            {!selectedEvent && (

                <div className="event-empty">

                    <div className="event-empty-icon">
                        ⛪
                    </div>

                    <h2>
                        Select an Event
                    </h2>

                    <p>
                        Choose an event above to begin
                        recording attendance.
                    </p>

                </div>

            )}

        </div>

    );
};

export default EventAttendance;