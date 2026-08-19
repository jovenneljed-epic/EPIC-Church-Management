import React from "react";

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

interface Props {
    records: AttendanceRecord[];
    summary: Summary;
    fromDate: string;
    toDate: string;
}

const getFullName = (record: AttendanceRecord): string => {
    if (record.fullName?.trim()) return record.fullName.trim();

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

const getStatus = (record: AttendanceRecord): string => {
    if (record.status) {
        return record.status.trim().toUpperCase();
    }

    if (
        record.present === true ||
        record.isPresent === true
    ) {
        return "PRESENT";
    }

    return "ABSENT";
};

const getInitials = (name: string): string => {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!parts.length) return "?";

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

const formatDate = (value?: string): string => {
    if (!value) return "—";

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

const formatLongDate = (value?: string): string => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(
        "en-US",
        {
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );
};

const getStatusLabel = (status: string): string => {
    switch (status) {
        case "PRESENT":
            return "Present";

        case "LATE":
            return "Late";

        case "EARLY":
            return "Early";

        case "ABSENT":
            return "Absent";

        case "EXCUSED":
            return "Excused";

        default:
            return status || "Unknown";
    }
};

const getStatusIcon = (status: string): string => {
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

const AttendanceByDateReportPrint: React.FC<Props> = ({
    records,
    summary,
    fromDate,
    toDate
}) => {

    const rangeText =
        fromDate === toDate
            ? formatLongDate(fromDate)
            : `${formatLongDate(fromDate)} — ${formatLongDate(toDate)}`;

    const generatedAt =
        new Date().toLocaleString(
            "en-US",
            {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit"
            }
        );

    return (
        <main className="attendance-print-document">

            {/* =====================================================
                TOP ACCENT
            ===================================================== */}

            <div className="print-top-accent">
                <span />
                <span />
                <span />
            </div>

            {/* =====================================================
                HEADER
            ===================================================== */}

            <header className="print-header">

                <div className="print-brand">

                    <div className="print-logo">
                        <span>E</span>
                    </div>

                    <div className="print-brand-text">

                        <div className="print-eyebrow">
                            EPIC CHURCH MANAGEMENT SYSTEM
                        </div>

                        <div className="print-brand-name">
                            EPIC
                        </div>

                        <div className="print-tagline">
                            Engaging People Into Christ
                        </div>

                    </div>

                </div>

                <div className="print-document-meta">

                    <span className="meta-label">
                        OFFICIAL REPORT
                    </span>

                    <strong>
                        ATTENDANCE
                    </strong>

                    <span>
                        Generated {generatedAt}
                    </span>

                </div>

            </header>

            {/* =====================================================
                HERO
            ===================================================== */}

            <section className="print-hero">

                <div className="hero-grid-pattern" />

                <div className="hero-content">

                    <span className="hero-kicker">
                        ATTENDANCE ANALYTICS
                    </span>

                    <h1>
                        Attendance
                        <span> by Date</span>
                    </h1>

                    <p>
                        Church attendance participation
                        and engagement report
                    </p>

                    <div className="hero-period">

                        <span className="period-icon">
                            ◷
                        </span>

                        <div>

                            <small>
                                REPORTING PERIOD
                            </small>

                            <strong>
                                {rangeText}
                            </strong>

                        </div>

                    </div>

                </div>

                <div className="hero-orbit">

                    <div className="orbit-ring ring-one" />
                    <div className="orbit-ring ring-two" />

                    <div className="orbit-core">
                        <span>
                            {summary.attendanceRate}%
                        </span>

                        <small>
                            RATE
                        </small>
                    </div>

                </div>

            </section>

            {/* =====================================================
                KPI SECTION
            ===================================================== */}

            <section className="print-kpi-section">

                <div className="section-heading">

                    <div>
                        <span>
                            ATTENDANCE OVERVIEW
                        </span>

                        <h2>
                            Performance Snapshot
                        </h2>
                    </div>

                    <div className="section-line" />

                </div>

                <div className="print-kpi-grid">

                    <div className="print-kpi total">

                        <div className="kpi-icon">
                            ◈
                        </div>

                        <div className="kpi-info">
                            <span>
                                TOTAL RECORDS
                            </span>

                            <strong>
                                {summary.total}
                            </strong>
                        </div>

                    </div>

                    <div className="print-kpi present">

                        <div className="kpi-icon">
                            ✓
                        </div>

                        <div className="kpi-info">
                            <span>
                                PRESENT
                            </span>

                            <strong>
                                {summary.present}
                            </strong>
                        </div>

                    </div>

                    <div className="print-kpi late">

                        <div className="kpi-icon">
                            ◷
                        </div>

                        <div className="kpi-info">
                            <span>
                                LATE
                            </span>

                            <strong>
                                {summary.late}
                            </strong>
                        </div>

                    </div>

                    <div className="print-kpi early">

                        <div className="kpi-icon">
                            ↗
                        </div>

                        <div className="kpi-info">
                            <span>
                                EARLY
                            </span>

                            <strong>
                                {summary.early}
                            </strong>
                        </div>

                    </div>

                    <div className="print-kpi absent">

                        <div className="kpi-icon">
                            ×
                        </div>

                        <div className="kpi-info">
                            <span>
                                ABSENT
                            </span>

                            <strong>
                                {summary.absent}
                            </strong>
                        </div>

                    </div>

                    <div className="print-kpi excused">

                        <div className="kpi-icon">
                            −
                        </div>

                        <div className="kpi-info">
                            <span>
                                EXCUSED
                            </span>

                            <strong>
                                {summary.excused}
                            </strong>
                        </div>

                    </div>

                </div>

                {/* =================================================
                    RATE BAR
                ================================================= */}

                <div className="print-rate-card">

                    <div className="rate-card-heading">

                        <div>

                            <span>
                                OVERALL ATTENDANCE RATE
                            </span>

                            <strong>
                                {summary.attendanceRate}%
                            </strong>

                        </div>

                        <div className="rate-description">
                            Present + Late + Early
                        </div>

                    </div>

                    <div className="rate-progress">

                        <div
                            className="rate-progress-fill"
                            style={{
                                width: `${Math.min(
                                    Math.max(
                                        summary.attendanceRate,
                                        0
                                    ),
                                    100
                                )}%`
                            }}
                        />

                    </div>

                </div>

            </section>

            {/* =====================================================
                RECORDS HEADER
            ===================================================== */}

            <section className="records-section">

                <div className="records-heading">

                    <div>

                        <span>
                            DETAILED ATTENDANCE
                        </span>

                        <h2>
                            Attendance Records
                        </h2>

                    </div>

                    <div className="records-count">

                        <strong>
                            {records.length}
                        </strong>

                        <span>
                            RECORDS
                        </span>

                    </div>

                </div>

                {/* =================================================
                    TABLE
                ================================================= */}

                <div className="print-table-container">

                    <table className="print-attendance-table">

                        <thead>

                            <tr>

                                <th className="number-column">
                                    #
                                </th>

                                <th>
                                    MEMBER
                                </th>

                                <th>
                                    CODE
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

                            {records.map(
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

                                            <td className="number-column">

                                                <span className="row-number">
                                                    {String(
                                                        index + 1
                                                    ).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                </span>

                                            </td>

                                            <td>

                                                <div className="print-member">

                                                    <div className="member-avatar">
                                                        {getInitials(
                                                            name
                                                        )}
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {name}
                                                        </strong>

                                                        <span>
                                                            Church Member
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>

                                            <td>

                                                <span className="print-code">
                                                    {
                                                        record.memberCode ||
                                                        "—"
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                <div className="print-service">

                                                    <span className="service-indicator" />

                                                    <span>
                                                        {
                                                            record.serviceName ||
                                                            "Church Service"
                                                        }
                                                    </span>

                                                </div>

                                            </td>

                                            <td>
                                                <span className="print-date">
                                                    {formatDate(
                                                        record.attendanceDate ||
                                                        record.date
                                                    )}
                                                </span>
                                            </td>

                                            <td>

                                                <span
                                                    className={`print-status status-${status.toLowerCase()}`}
                                                >

                                                    <b>
                                                        {getStatusIcon(
                                                            status
                                                        )}
                                                    </b>

                                                    {getStatusLabel(
                                                        status
                                                    )}

                                                </span>

                                            </td>

                                            <td>

                                                <span className="print-remarks">

                                                    {
                                                        record.remarks ||
                                                        record.note ||
                                                        "—"
                                                    }

                                                </span>

                                            </td>

                                        </tr>
                                    );
                                }
                            )}

                        </tbody>

                    </table>

                </div>

                {records.length === 0 && (

                    <div className="print-empty">
                        No attendance records found
                        for the selected reporting period.
                    </div>

                )}

            </section>

            {/* =====================================================
                SIGNATURE / VERIFICATION
            ===================================================== */}

            <section className="verification-section">

                <div className="verification-card">

                    <div className="verification-icon">
                        ✓
                    </div>

                    <div>

                        <span>
                            REPORT VERIFICATION
                        </span>

                        <strong>
                            Generated from EPIC Attendance Records
                        </strong>

                        <p>
                            This document reflects the attendance
                            records available in the EPIC Church
                            Management System at the time of generation.
                        </p>

                    </div>

                </div>

                <div className="signature-area">

                    <div className="signature-line">

                        <span />

                        <strong>
                            Prepared / Verified By
                        </strong>

                    </div>

                    <div className="signature-line">

                        <span />

                        <strong>
                            Church Administrator
                        </strong>

                    </div>

                </div>

            </section>

            {/* =====================================================
                FOOTER
            ===================================================== */}

            <footer className="print-footer">

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

                <div className="footer-center">
                    CHURCH MANAGEMENT SYSTEM
                </div>

                <div className="footer-right">

                    <strong>
                        ATTENDANCE REPORT
                    </strong>

                    <span>
                        Confidential Church Record
                    </span>

                </div>

            </footer>

        </main>
    );
};

export default AttendanceByDateReportPrint;