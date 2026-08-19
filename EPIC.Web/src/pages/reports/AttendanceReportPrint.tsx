import React from "react";
import "./AttendanceReportPrint.css";

// =========================================================
// TYPES
// =========================================================

interface AttendanceRecord {
    memberId: number;
    memberCode?: string | null;

    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;

    status: string;

    attendanceId?: number | null;
    attendanceDate?: string | null;
}

interface AttendanceSummary {
    total: number;
    present: number;
    late: number;
    early: number;
    absent: number;
    excused: number;
}

interface AttendanceReport {
    churchServiceId: number;
    serviceName: string;
    serviceDate: string;

    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;

    status: string;
}

interface AttendanceReportPrintProps {
    report: AttendanceReport;

    rows: AttendanceRecord[];

    summary: AttendanceSummary;

    attendanceRate: number;

    formatDate: (
        value?: string | null
    ) => string;

    formatTime: (
        value?: string | null
    ) => string;

    getStatusLabel: (
        status: string
    ) => string;
}

// =========================================================
// COMPONENT
// =========================================================

const AttendanceReportPrint: React.FC<
    AttendanceReportPrintProps
> = ({
    report,
    rows,
    summary,
    attendanceRate,
    formatDate,
    formatTime,
    getStatusLabel,
}) => {

        return (
            <div className="attendance-print-document">

                {/* =====================================================
                HEADER
            ===================================================== */}

                <header className="attendance-print-header">

                    <div className="attendance-print-brand">

                        <div className="attendance-print-logo">
                            EPIC
                        </div>

                        <div>

                            <div className="attendance-print-eyebrow">
                                LUKE 4:18 MINISTRIES
                            </div>

                            <h1>
                                Attendance Report
                            </h1>

                            <p>
                                Engaging People Into Christ
                            </p>

                        </div>

                    </div>

                    <div className="attendance-print-generated">

                        <span>
                            GENERATED
                        </span>

                        <strong>
                            {new Date().toLocaleString()}
                        </strong>

                    </div>

                </header>


                {/* =====================================================
                CHURCH SERVICE EVENT
            ===================================================== */}

                <section className="attendance-print-event">

                    <div className="attendance-print-event-title">

                        <span>
                            CHURCH SERVICE EVENT
                        </span>

                        <h2>
                            {report.serviceName}
                        </h2>

                    </div>

                    <div className="attendance-print-event-grid">

                        <div>

                            <span>
                                SERVICE DATE
                            </span>

                            <strong>
                                {formatDate(
                                    report.serviceDate
                                )}
                            </strong>

                        </div>

                        <div>

                            <span>
                                TIME
                            </span>

                            <strong>

                                {formatTime(
                                    report.startTime
                                )}

                                {" — "}

                                {formatTime(
                                    report.endTime
                                )}

                            </strong>

                        </div>

                        <div>

                            <span>
                                LOCATION
                            </span>

                            <strong>
                                {report.location || "—"}
                            </strong>

                        </div>

                        <div>

                            <span>
                                STATUS
                            </span>

                            <strong>
                                {report.status || "—"}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                SUMMARY
            ===================================================== */}

                <section className="attendance-print-summary">

                    <div>

                        <span>
                            TOTAL
                        </span>

                        <strong>
                            {summary.total}
                        </strong>

                    </div>

                    <div>

                        <span>
                            PRESENT
                        </span>

                        <strong>
                            {summary.present}
                        </strong>

                    </div>

                    <div>

                        <span>
                            LATE
                        </span>

                        <strong>
                            {summary.late}
                        </strong>

                    </div>

                    <div>

                        <span>
                            EARLY
                        </span>

                        <strong>
                            {summary.early}
                        </strong>

                    </div>

                    <div>

                        <span>
                            ABSENT
                        </span>

                        <strong>
                            {summary.absent}
                        </strong>

                    </div>

                    <div>

                        <span>
                            EXCUSED
                        </span>

                        <strong>
                            {summary.excused}
                        </strong>

                    </div>

                    <div>

                        <span>
                            ATTENDANCE RATE
                        </span>

                        <strong>
                            {attendanceRate}%
                        </strong>

                    </div>

                </section>


                {/* =====================================================
                MEMBER ATTENDANCE TABLE
            ===================================================== */}

                <section className="attendance-print-table-section">

                    <div className="attendance-print-section-heading">

                        <div>

                            <span>
                                ATTENDANCE RECORDS
                            </span>

                            <h3>
                                Member Attendance
                            </h3>

                        </div>

                        <strong>
                            {rows.length} Record
                            {rows.length !== 1 ? "s" : ""}
                        </strong>

                    </div>


                    <table className="attendance-print-table">

                        <thead>

                            <tr>

                                <th className="col-number">
                                    #
                                </th>

                                <th className="col-code">
                                    MEMBER CODE
                                </th>

                                <th>
                                    MEMBER NAME
                                </th>

                                <th className="col-status">
                                    STATUS
                                </th>

                                <th className="col-date">
                                    ATTENDANCE DATE
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {rows.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan={5}
                                        style={{
                                            textAlign: "center",
                                            padding: "30px"
                                        }}
                                    >
                                        No attendance records found.
                                    </td>

                                </tr>

                            ) : (

                                rows.map(
                                    (
                                        record,
                                        index
                                    ) => {

                                        const status =
                                            record.status
                                                ?.toString()
                                                .trim() ||
                                            "UNKNOWN";

                                        const statusClass =
                                            status
                                                .toLowerCase()
                                                .replace(
                                                    /\s+/g,
                                                    "-"
                                                );

                                        return (

                                            <tr
                                                key={
                                                    `${record.memberId}-${record.attendanceId ?? index}`
                                                }
                                            >

                                                {/* NUMBER */}

                                                <td className="text-center">

                                                    {index + 1}

                                                </td>


                                                {/* MEMBER CODE */}

                                                <td>

                                                    <strong>
                                                        {
                                                            record.memberCode ||
                                                            "—"
                                                        }
                                                    </strong>

                                                </td>


                                                {/* MEMBER NAME */}

                                                <td>

                                                    <strong className="member-name">

                                                        {
                                                            getFullName(
                                                                record
                                                            )
                                                        }

                                                    </strong>

                                                </td>


                                                {/* STATUS */}

                                                <td className="text-center">

                                                    <span
                                                        className={
                                                            `attendance-print-status status-${statusClass}`
                                                        }
                                                    >

                                                        {
                                                            getStatusLabel(
                                                                status
                                                            )
                                                        }

                                                    </span>

                                                </td>


                                                {/* ATTENDANCE DATE */}

                                                <td>

                                                    {
                                                        formatDate(
                                                            record.attendanceDate ||
                                                            report.serviceDate
                                                        )
                                                    }

                                                </td>

                                            </tr>

                                        );

                                    }
                                )

                            )}

                        </tbody>

                    </table>

                </section>


                {/* =====================================================
                SIGNATURE AREA
            ===================================================== */}

                <section className="attendance-print-signatures">

                    <div>

                        <div className="signature-line" />

                        <strong>
                            Attendance Recorder
                        </strong>

                        <span>
                            Signature over Printed Name
                        </span>

                    </div>

                    <div>

                        <div className="signature-line" />

                        <strong>
                            Church Administrator
                        </strong>

                        <span>
                            Signature over Printed Name
                        </span>

                    </div>

                    <div>

                        <div className="signature-line" />

                        <strong>
                            Pastor / Authorized Representative
                        </strong>

                        <span>
                            Signature over Printed Name
                        </span>

                    </div>

                </section>


                {/* =====================================================
                FOOTER
            ===================================================== */}

                <footer className="attendance-print-footer">

                    <div>

                        <strong>
                            EPIC Church Management System
                        </strong>

                        <span>
                            Engaging People Into Christ
                        </span>

                    </div>

                    <div>

                        <span>
                            Church Service ID:
                        </span>

                        <strong>
                            #{report.churchServiceId}
                        </strong>

                    </div>

                </footer>

            </div>
        );
    };


// =========================================================
// HELPERS
// =========================================================

const getFullName = (
    record: AttendanceRecord
): string => {

    const parts = [
        record.firstName,
        record.middleName,
        record.lastName
    ]
        .filter(
            value =>
                value &&
                value.trim()
        )
        .map(
            value =>
                value!.trim()
        );

    return (
        parts.join(" ") ||
        record.memberCode ||
        "Unnamed Member"
    );
};


// =========================================================
// EXPORT
// =========================================================

export default AttendanceReportPrint;