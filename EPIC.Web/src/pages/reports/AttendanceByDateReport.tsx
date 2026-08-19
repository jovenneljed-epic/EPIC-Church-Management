import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import axios from "axios";
import "./AttendanceByDateReport.css";

import { API_BASE_URL } from "../../config";

// ============================================================
// TYPES
// ============================================================

interface AttendanceRecord {
    attendanceId?: number;

    memberId?: number;
    memberCode?: string;

    firstName?: string;
    middleName?: string;
    lastName?: string;

    memberName?: string;
    fullName?: string;

    churchServiceId?: number;
    serviceId?: number;

    serviceName?: string;

    attendanceDate?: string;
    date?: string;

    status?: string;

    present?: boolean;
    isPresent?: boolean;

    remarks?: string;
    note?: string;
}

interface Summary {
    total: number;
    present: number;
    late: number;
    early: number;
    absent: number;
    excused: number;
    attendanceRate: number;
}

// ============================================================
// TOKEN
// ============================================================

const getToken = (): string | null => {
    const keys = [
        "token",
        "accessToken",
        "jwt",
        "authToken",
        "epicToken"
    ];

    for (const key of keys) {
        const value = localStorage.getItem(key);

        if (value) {
            const cleaned = value
                .replace(/^Bearer\s+/i, "")
                .trim();

            if (cleaned) {
                return cleaned;
            }
        }
    }

    return null;
};

// ============================================================
// API
// ============================================================

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        Accept: "application/json"
    }
});

api.interceptors.request.use(
    config => {
        const token = getToken();

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    }
);

// ============================================================
// HELPERS
// ============================================================

const getFullName = (
    record: AttendanceRecord
): string => {
    if (record.fullName?.trim()) {
        return record.fullName.trim();
    }

    if (record.memberName?.trim()) {
        return record.memberName.trim();
    }

    return [
        record.firstName,
        record.middleName,
        record.lastName
    ]
        .filter(Boolean)
        .join(" ")
        .trim() || "Unknown Member";
};

const getStatus = (
    record: AttendanceRecord
): string => {
    if (record.status) {
        return record.status
            .trim()
            .toUpperCase();
    }

    if (
        record.present === true ||
        record.isPresent === true
    ) {
        return "PRESENT";
    }

    return "ABSENT";
};

const getStatusIcon = (
    status: string
): string => {
    switch (status) {
        case "PRESENT":
            return "✓";

        case "LATE":
            return "◷";

        case "EARLY":
            return "↗";

        case "ABSENT":
            return "×";

        case "EXCUSED":
            return "−";

        default:
            return "•";
    }
};

const formatDate = (
    value?: string
): string => {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
};

const formatDateInput = (
    value?: string
): string => {
    if (!value) {
        return "";
    }

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return value;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const today = (): string => {
    const date = new Date();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const getInitials = (
    name: string
): string => {
    const parts =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (!parts.length) {
        return "?";
    }

    if (parts.length === 1) {
        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
};

const statusClass = (
    status: string
): string => {
    return (
        `attendance-report-status status-${status
            .toLowerCase()
            .replace(/\s+/g, "-")}`
    );
};

// ============================================================
// COMPONENT
// ============================================================

const AttendanceByDateReport: React.FC = () => {

    const [fromDate, setFromDate] =
        useState(today());

    const [toDate, setToDate] =
        useState(today());

    const [records, setRecords] =
        useState<AttendanceRecord[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [hasSearched, setHasSearched] =
        useState(false);

    // ========================================================
    // LOAD ATTENDANCE
    // ========================================================

    const loadAttendance = useCallback(
        async () => {

            setLoading(true);
            setError("");

            try {

                const token = getToken();

                if (!token) {
                    throw new Error(
                        "Your session has expired. Please log in again."
                    );
                }

                console.log(
                    "EPIC REPORTS → Attendance API:",
                    `${API_BASE_URL}/Attendance`
                );

                const response =
                    await api.get(
                        "/Attendance"
                    );

                const data =
                    response.data;

                let list: AttendanceRecord[] = [];

                if (
                    Array.isArray(data)
                ) {
                    list = data;
                } else if (
                    Array.isArray(data?.data)
                ) {
                    list = data.data;
                } else if (
                    Array.isArray(data?.items)
                ) {
                    list = data.items;
                } else if (
                    Array.isArray(data?.attendance)
                ) {
                    list = data.attendance;
                } else if (
                    Array.isArray(data?.records)
                ) {
                    list = data.records;
                }

                console.log(
                    "EPIC REPORTS → Attendance records:",
                    list.length
                );

                setRecords(list);
                setHasSearched(true);

            } catch (err: any) {

                console.error(
                    "AttendanceByDateReport:",
                    err
                );

                if (
                    err?.response?.status === 401
                ) {
                    setError(
                        "Your session has expired. Please log in again."
                    );
                } else if (
                    err?.response?.status === 403
                ) {
                    setError(
                        "You do not have permission to view attendance reports."
                    );
                } else if (
                    err?.response?.data?.message
                ) {
                    setError(
                        err.response.data.message
                    );
                } else if (
                    err?.response?.data?.title
                ) {
                    setError(
                        err.response.data.title
                    );
                } else if (
                    err?.message
                ) {
                    setError(
                        err.message
                    );
                } else {
                    setError(
                        "Unable to load attendance records. Please check the Attendance API."
                    );
                }

                setRecords([]);

            } finally {
                setLoading(false);
            }

        },
        []
    );

    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {
        loadAttendance();
    }, [loadAttendance]);

    // ========================================================
    // FILTER
    // ========================================================

    const filteredRecords =
        useMemo(() => {

            const keyword =
                search
                    .trim()
                    .toLowerCase();

            return records.filter(
                record => {

                    const rawDate =
                        record.attendanceDate ||
                        record.date;

                    const recordDate =
                        formatDateInput(
                            rawDate
                        );

                    if (
                        fromDate &&
                        recordDate &&
                        recordDate < fromDate
                    ) {
                        return false;
                    }

                    if (
                        toDate &&
                        recordDate &&
                        recordDate > toDate
                    ) {
                        return false;
                    }

                    if (!keyword) {
                        return true;
                    }

                    const name =
                        getFullName(
                            record
                        ).toLowerCase();

                    const code =
                        (
                            record.memberCode ||
                            ""
                        ).toLowerCase();

                    const service =
                        (
                            record.serviceName ||
                            ""
                        ).toLowerCase();

                    const status =
                        getStatus(
                            record
                        ).toLowerCase();

                    const remarks =
                        (
                            record.remarks ||
                            record.note ||
                            ""
                        ).toLowerCase();

                    return (
                        name.includes(keyword) ||
                        code.includes(keyword) ||
                        service.includes(keyword) ||
                        status.includes(keyword) ||
                        remarks.includes(keyword)
                    );
                }
            );

        }, [
            records,
            fromDate,
            toDate,
            search
        ]);

    // ========================================================
    // SUMMARY
    // ========================================================

    const summary =
        useMemo<Summary>(() => {

            const result: Summary = {
                total: filteredRecords.length,
                present: 0,
                late: 0,
                early: 0,
                absent: 0,
                excused: 0,
                attendanceRate: 0
            };

            filteredRecords.forEach(
                record => {

                    const status =
                        getStatus(
                            record
                        );

                    switch (status) {

                        case "PRESENT":
                            result.present++;
                            break;

                        case "LATE":
                            result.late++;
                            break;

                        case "EARLY":
                            result.early++;
                            break;

                        case "EXCUSED":
                            result.excused++;
                            break;

                        case "ABSENT":
                        default:
                            result.absent++;
                            break;
                    }
                }
            );

            const attended =
                result.present +
                result.late +
                result.early;

            result.attendanceRate =
                result.total > 0
                    ? Math.round(
                        (
                            attended /
                            result.total
                        ) * 100
                    )
                    : 0;

            return result;

        }, [
            filteredRecords
        ]);

    // ========================================================
    // VIEW REPORT
    // ========================================================

    const handleViewReport = (
        event: React.FormEvent
    ) => {

        event.preventDefault();

        if (
            fromDate &&
            toDate &&
            fromDate > toDate
        ) {
            setError(
                "The From Date cannot be later than the To Date."
            );

            return;
        }

        setError("");
        setHasSearched(true);
    };

    // ========================================================
    // RESET
    // ========================================================

    const handleReset = () => {

        const currentDate =
            today();

        setFromDate(
            currentDate
        );

        setToDate(
            currentDate
        );

        setSearch("");

        setError("");

        setHasSearched(false);
    };

    // ========================================================
    // PRINT
    // ========================================================

  const handlePrint = async () => {

    if (filteredRecords.length === 0) {
        alert(
            "There are no attendance records to print for the selected date range."
        );
        return;
    }

    try {

        const printWindow = window.open(
            "",
            "_blank",
            "width=1200,height=900"
        );

        if (!printWindow) {

            alert(
                "Unable to open the print document. Please allow pop-ups for EPIC Church Management System."
            );

            return;
        }

        const { default: AttendanceByDateReportPrint } =
            await import(
                "./AttendanceByDateReportPrint"
            );

        const { renderToStaticMarkup } =
            await import(
                "react-dom/server"
            );

        const printStyles =
            await import(
                "./AttendanceByDateReportPrint.css?inline"
            );

        const markup =
            renderToStaticMarkup(
                <AttendanceByDateReportPrint
                    records={filteredRecords}
                    summary={summary}
                    fromDate={fromDate}
                    toDate={toDate}
                />
            );

        printWindow.document.open();

        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>

    <meta charset="UTF-8" />

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    />

    <title>
        EPIC Attendance By Date Report
    </title>

    <style>
        ${printStyles.default || ""}
    </style>

</head>

<body>

    ${markup}

</body>
</html>
        `);

        printWindow.document.close();

        printWindow.focus();

        setTimeout(() => {

            printWindow.print();

        }, 700);

        printWindow.onafterprint = () => {

            setTimeout(() => {

                printWindow.close();

            }, 300);

        };

    } catch (error) {

        console.error(
            "EPIC Attendance By Date PRINT ERROR:",
            error
        );

        alert(
            "Unable to generate the attendance report document."
        );
    }
};
    // ========================================================
    // RANGE LABEL
    // ========================================================

    const rangeLabel =
        fromDate === toDate
            ? formatDate(fromDate)
            : `${formatDate(fromDate)} — ${formatDate(toDate)}`;

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div className="attendance-report-page">

            {/* =================================================
                FUTURISTIC HEADER
            ================================================= */}

            <section className="attendance-report-hero">

                <div className="hero-glow hero-glow-one" />
                <div className="hero-glow hero-glow-two" />

                <div className="hero-content">

                    <div className="hero-icon">
                        <span>✓</span>
                    </div>

                    <div>

                        <div className="attendance-report-eyebrow">
                            EPIC REPORTS
                        </div>

                        <h1>
                            Attendance
                            <span> by Date</span>
                        </h1>

                        <p>
                            Analyze church attendance,
                            engagement and participation
                            across selected dates.
                        </p>

                    </div>

                </div>

                <button
                    type="button"
                    className="hero-print-btn"
                    onClick={
                        handlePrint
                    }
                    disabled={
                        loading
                    }
                >
                    <span className="print-icon">
                        ⎙
                    </span>

                    Print Report
                </button>

            </section>

            {/* =================================================
                CONTROL PANEL
            ================================================= */}

            <section className="report-command-card">

                <div className="command-header">

                    <div>

                        <span className="command-kicker">
                            REPORT FILTER
                        </span>

                        <h2>
                            Select Reporting Period
                        </h2>

                        <p>
                            Choose a date range to
                            analyze attendance records.
                        </p>

                    </div>

                    <div className="command-status">
                        <span className="status-dot" />
                        REPORT READY
                    </div>

                </div>

                <form
                    className="report-command-form"
                    onSubmit={
                        handleViewReport
                    }
                >

                    <div className="date-field">

                        <label>
                            FROM DATE
                        </label>

                        <div className="date-input-shell">

                            <span className="field-icon">
                                ◷
                            </span>

                            <input
                                type="date"
                                value={
                                    fromDate
                                }
                                onChange={
                                    e =>
                                        setFromDate(
                                            e.target.value
                                        )
                                }
                            />

                        </div>

                    </div>

                    <div className="date-separator">
                        <span />
                        <b>TO</b>
                        <span />
                    </div>

                    <div className="date-field">

                        <label>
                            TO DATE
                        </label>

                        <div className="date-input-shell">

                            <span className="field-icon">
                                ◷
                            </span>

                            <input
                                type="date"
                                value={
                                    toDate
                                }
                                onChange={
                                    e =>
                                        setToDate(
                                            e.target.value
                                        )
                                }
                            />

                        </div>

                    </div>

                    <div className="command-actions">

                        <button
                            type="submit"
                            className="command-view-btn"
                            disabled={
                                loading
                            }
                        >
                            <span>
                                ⌕
                            </span>

                            {loading
                                ? "Loading..."
                                : "View Report"}
                        </button>

                        <button
                            type="button"
                            className="command-reset-btn"
                            onClick={
                                handleReset
                            }
                        >
                            Reset
                        </button>

                    </div>

                </form>

            </section>

            {/* =================================================
                SEARCH BAR
            ================================================= */}

            <section className="report-search-panel">

                <div className="search-wrapper">

                    <span className="search-icon">
                        ⌕
                    </span>

                    <input
                        type="text"
                        placeholder="Search member, code, service, status or remarks..."
                        value={
                            search
                        }
                        onChange={
                            e =>
                                setSearch(
                                    e.target.value
                                )
                        }
                    />

                    {search && (
                        <button
                            type="button"
                            className="clear-search"
                            onClick={() =>
                                setSearch("")
                            }
                        >
                            ×
                        </button>
                    )}

                </div>

                <button
                    type="button"
                    className="refresh-report-btn"
                    onClick={
                        loadAttendance
                    }
                    disabled={
                        loading
                    }
                >
                    <span className={
                        loading
                            ? "refresh-spin"
                            : ""
                    }>
                        ↻
                    </span>

                    Refresh
                </button>

            </section>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <section className="report-error-card">

                    <div className="error-symbol">
                        !
                    </div>

                    <div className="error-content">

                        <strong>
                            Unable to load attendance records
                        </strong>

                        <span>
                            {error}
                        </span>

                    </div>

                    <button
                        type="button"
                        onClick={
                            loadAttendance
                        }
                    >
                        Retry
                    </button>

                </section>

            )}

            {/* =================================================
                KPI AREA
            ================================================= */}

            {!error && hasSearched && (

                <section className="report-dashboard">

                    <div className="dashboard-heading">

                        <div>

                            <span>
                                ATTENDANCE OVERVIEW
                            </span>

                            <h2>
                                {rangeLabel}
                            </h2>

                        </div>

                        <div className="dashboard-record-count">
                            <strong>
                                {summary.total}
                            </strong>

                            <span>
                                Records
                            </span>
                        </div>

                    </div>

                    <div className="kpi-grid">

                        <KpiCard
                            icon="◈"
                            label="TOTAL RECORDS"
                            value={
                                summary.total
                            }
                            className="kpi-total"
                        />

                        <KpiCard
                            icon="✓"
                            label="PRESENT"
                            value={
                                summary.present
                            }
                            className="kpi-present"
                        />

                        <KpiCard
                            icon="◷"
                            label="LATE"
                            value={
                                summary.late
                            }
                            className="kpi-late"
                        />

                        <KpiCard
                            icon="↗"
                            label="EARLY"
                            value={
                                summary.early
                            }
                            className="kpi-early"
                        />

                        <KpiCard
                            icon="×"
                            label="ABSENT"
                            value={
                                summary.absent
                            }
                            className="kpi-absent"
                        />

                        <KpiCard
                            icon="−"
                            label="EXCUSED"
                            value={
                                summary.excused
                            }
                            className="kpi-excused"
                        />

                        {/* RATE CARD */}

                        <div className="attendance-rate-panel">

                            <div className="rate-panel-top">

                                <div>

                                    <span>
                                        ATTENDANCE RATE
                                    </span>

                                    <strong>
                                        {summary.attendanceRate}%
                                    </strong>

                                </div>

                                <div className="rate-ring">
                                    <svg
                                        viewBox="0 0 42 42"
                                    >
                                        <circle
                                            className="rate-ring-bg"
                                            cx="21"
                                            cy="21"
                                            r="16"
                                        />

                                        <circle
                                            className="rate-ring-progress"
                                            cx="21"
                                            cy="21"
                                            r="16"
                                            strokeDasharray={`${summary.attendanceRate} 100`}
                                        />
                                    </svg>

                                    <span>
                                        {summary.attendanceRate}%
                                    </span>

                                </div>

                            </div>

                            <div className="rate-track">

                                <div
                                    className="rate-fill"
                                    style={{
                                        width:
                                            `${Math.min(
                                                summary.attendanceRate,
                                                100
                                            )}%`
                                    }}
                                />

                            </div>

                            <p>
                                Present, late and early
                                attendance combined.
                            </p>

                        </div>

                    </div>

                </section>

            )}

            {/* =================================================
                TABLE
            ================================================= */}

            <section className="report-data-card">

                <div className="data-card-header">

                    <div className="data-title">

                        <div className="data-title-icon">
                            ☑
                        </div>

                        <div>

                            <span>
                                ATTENDANCE DATA
                            </span>

                            <h2>
                                Attendance Records
                            </h2>

                            <p>
                                {rangeLabel}
                            </p>

                        </div>

                    </div>

                    <div className="data-meta">

                        <div>
                            <strong>
                                {filteredRecords.length}
                            </strong>

                            <span>
                                records
                            </span>
                        </div>

                    </div>

                </div>

                {loading ? (

                    <div className="report-loading">

                        <div className="loading-orbit">
                            <span />
                        </div>

                        <strong>
                            Loading attendance records
                        </strong>

                        <span>
                            Connecting to EPIC Attendance API...
                        </span>

                    </div>

                ) : (

                    <div className="report-table-scroll">

                        <table className="attendance-report-table">

                            <thead>

                                <tr>

                                    <th className="column-number">
                                        #
                                    </th>

                                    <th>
                                        MEMBER
                                    </th>

                                    <th>
                                        MEMBER CODE
                                    </th>

                                    <th>
                                        CHURCH SERVICE
                                    </th>

                                    <th>
                                        DATE
                                    </th>

                                    <th>
                                        STATUS
                                    </th>

                                    <th>
                                        REMARKS
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredRecords.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan={7}
                                            className="report-empty"
                                        >

                                            <div className="empty-state">

                                                <div className="empty-icon">
                                                    ◌
                                                </div>

                                                <strong>
                                                    No attendance records
                                                </strong>

                                                <span>
                                                    {hasSearched
                                                        ? "No records match the selected date range or search criteria."
                                                        : "Select a date range and click View Report."}
                                                </span>

                                            </div>

                                        </td>

                                    </tr>

                                ) : (

                                    filteredRecords.map(
                                        (
                                            record,
                                            index
                                        ) => {

                                            const name =
                                                getFullName(
                                                    record
                                                );

                                            const status =
                                                getStatus(
                                                    record
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        record.attendanceId ??
                                                        `${record.memberId}-${record.churchServiceId}-${index}`
                                                    }
                                                >

                                                    <td className="column-number">
                                                        <span>
                                                            {String(
                                                                index + 1
                                                            ).padStart(
                                                                2,
                                                                "0"
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td>

                                                        <div className="member-cell">

                                                            <div className="member-avatar">
                                                                {
                                                                    getInitials(
                                                                        name
                                                                    )
                                                                }
                                                            </div>

                                                            <div className="member-details">

                                                                <strong>
                                                                    {name}
                                                                </strong>

                                                                <span>
                                                                    Member
                                                                </span>

                                                            </div>

                                                        </div>

                                                    </td>

                                                    <td>

                                                        <span className="member-code-pill">
                                                            {
                                                                record.memberCode ||
                                                                "—"
                                                            }
                                                        </span>

                                                    </td>

                                                    <td>

                                                        <div className="service-cell">

                                                            <span className="service-dot" />

                                                            {
                                                                record.serviceName ||
                                                                "—"
                                                            }

                                                        </div>

                                                    </td>

                                                    <td>

                                                        <span className="date-cell">
                                                            {
                                                                formatDate(
                                                                    record.attendanceDate ||
                                                                    record.date
                                                                )
                                                            }
                                                        </span>

                                                    </td>

                                                    <td>

                                                        <span
                                                            className={
                                                                statusClass(
                                                                    status
                                                                )
                                                            }
                                                        >

                                                            <b>
                                                                {
                                                                    getStatusIcon(
                                                                        status
                                                                    )
                                                                }
                                                            </b>

                                                            {status}

                                                        </span>

                                                    </td>

                                                    <td>

                                                        <span className="remarks-cell">
                                                            {
                                                                record.remarks ||
                                                                record.note ||
                                                                "No remarks"
                                                            }
                                                        </span>

                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>

            {/* =================================================
                FOOTER
            ================================================= */}

            <footer className="attendance-report-footer">

                <div className="footer-brand">

                    <div className="footer-logo">
                        E
                    </div>

                    <div>

                        <strong>
                            EPIC
                        </strong>

                        <span>
                            Engaging People Into Christ
                        </span>

                    </div>

                </div>

                <div className="footer-system">
                    CHURCH MANAGEMENT SYSTEM
                </div>

            </footer>

        </div>
    );
};

// ============================================================
// KPI CARD
// ============================================================

interface KpiCardProps {
    icon: string;
    label: string;
    value: number;
    className?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
    icon,
    label,
    value,
    className = ""
}) => {

    return (
        <div
            className={
                `attendance-kpi-card ${className}`
            }
        >

            <div className="kpi-card-top">

                <div className="kpi-icon">
                    {icon}
                </div>

                <span className="kpi-label">
                    {label}
                </span>

            </div>

            <strong className="kpi-value">
                {value}
            </strong>

            <div className="kpi-line" />

        </div>
    );
};

export default AttendanceByDateReport;