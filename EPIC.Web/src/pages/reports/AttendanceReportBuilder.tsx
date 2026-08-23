import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import axios from "axios";
import "./AttendanceReportBuilder.css";
import printStyles from "./AttendanceReportPrint.css?inline";
import AttendanceReportPrint from "./AttendanceReportPrint";

import { API_BASE_URL } from "../../config";

// =========================================================
// TYPES
// =========================================================

interface ChurchService {
    churchServiceId: number;
    serviceName: string;
    serviceDate: string;
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
    status?: string | null;
}

type AttendanceStatus =
    | "PRESENT"
    | "LATE"
    | "EARLY"
    | "ABSENT"
    | "EXCUSED";

interface AttendanceRecord {
    memberId: number;
    memberCode?: string | null;

    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;

    // Additional possible API name fields
    memberName?: string | null;
    fullName?: string | null;
    name?: string | null;

    member?: {
        memberId?: number | null;
        memberCode?: string | null;

        firstName?: string | null;
        middleName?: string | null;
        lastName?: string | null;

        memberName?: string | null;
        fullName?: string | null;
        name?: string | null;
    } | null;

    status: AttendanceStatus;

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

interface AttendanceReportResponse {
    churchServiceId: number;

    serviceName: string;

    serviceDate: string;

    startTime?: string | null;

    endTime?: string | null;

    location?: string | null;

    status: string;

    canRecordAttendance: boolean;

    attendanceStarted: boolean;

    message?: string | null;

    summary: AttendanceSummary;

    attendance: AttendanceRecord[];
}

// =========================================================
// STATUS FILTER
// =========================================================

type StatusFilter =
    | "ALL"
    | "PRESENT"
    | "LATE"
    | "EARLY"
    | "ABSENT"
    | "EXCUSED";

// =========================================================
// COMPONENT
// =========================================================

const AttendanceReportBuilder: React.FC = () => {
    // =====================================================
    // STATE
    // =====================================================

    const [services, setServices] =
        useState<ChurchService[]>([]);

    const [selectedServiceId, setSelectedServiceId] =
        useState<number | "">("");

    const [report, setReport] =
        useState<AttendanceReportResponse | null>(null);

    const [attendance, setAttendance] =
        useState<AttendanceRecord[]>([]);

    const [searchText, setSearchText] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("ALL");

    const [loadingServices, setLoadingServices] =
        useState(false);

    const [loadingAttendance, setLoadingAttendance] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    // =====================================================
    // AUTH CONFIG
    // =====================================================

    const getAuthConfig = useCallback(() => {
        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt");

        if (!token) {
            return {};
        }

        return {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
    }, []);

    // =====================================================
    // NORMALIZE STATUS
    // =====================================================

    const normalizeStatus = (
        value: unknown
    ): AttendanceStatus => {
        const status =
            String(value ?? "")
                .trim()
                .toUpperCase();

        switch (status) {
            case "PRESENT":
                return "PRESENT";

            case "LATE":
                return "LATE";

            case "EARLY":
                return "EARLY";

            case "ABSENT":
                return "ABSENT";

            case "EXCUSED":
                return "EXCUSED";

            default:
                return "ABSENT";
        }
    };

    // =====================================================
    // GET VALUE FROM POSSIBLE OBJECT PROPERTIES
    // =====================================================

    const getStringValue = (
        ...values: unknown[]
    ): string | null => {
        for (const value of values) {
            if (
                typeof value === "string" &&
                value.trim().length > 0
            ) {
                return value.trim();
            }
        }

        return null;
    };

    // =====================================================
    // NORMALIZE ATTENDANCE RECORD
    // =====================================================

    const normalizeAttendanceRecord = (
        record: any
    ): AttendanceRecord => {

        const member =
            record?.member ??
            record?.Member ??
            null;

        return {
            memberId:
                Number(
                    record?.memberId ??
                    record?.MemberId ??
                    member?.memberId ??
                    member?.MemberId
                ) || 0,

            memberCode:
                getStringValue(
                    record?.memberCode,
                    record?.MemberCode,
                    member?.memberCode,
                    member?.MemberCode
                ),

            firstName:
                getStringValue(
                    record?.firstName,
                    record?.FirstName,
                    member?.firstName,
                    member?.FirstName
                ),

            middleName:
                getStringValue(
                    record?.middleName,
                    record?.MiddleName,
                    member?.middleName,
                    member?.MiddleName
                ),

            lastName:
                getStringValue(
                    record?.lastName,
                    record?.LastName,
                    member?.lastName,
                    member?.LastName
                ),

            // =================================================
            // IMPORTANT:
            // Some API responses may already return a name
            // instead of separate first/middle/last names.
            // =================================================

            memberName:
                getStringValue(
                    record?.memberName,
                    record?.MemberName,
                    member?.memberName,
                    member?.MemberName
                ),

            fullName:
                getStringValue(
                    record?.fullName,
                    record?.FullName,
                    member?.fullName,
                    member?.FullName
                ),

            name:
                getStringValue(
                    record?.name,
                    record?.Name,
                    member?.name,
                    member?.Name
                ),

            member: member
                ? {
                      memberId:
                          Number(
                              member?.memberId ??
                              member?.MemberId
                          ) || null,

                      memberCode:
                          getStringValue(
                              member?.memberCode,
                              member?.MemberCode
                          ),

                      firstName:
                          getStringValue(
                              member?.firstName,
                              member?.FirstName
                          ),

                      middleName:
                          getStringValue(
                              member?.middleName,
                              member?.MiddleName
                          ),

                      lastName:
                          getStringValue(
                              member?.lastName,
                              member?.LastName
                          ),

                      memberName:
                          getStringValue(
                              member?.memberName,
                              member?.MemberName
                          ),

                      fullName:
                          getStringValue(
                              member?.fullName,
                              member?.FullName
                          ),

                      name:
                          getStringValue(
                              member?.name,
                              member?.Name
                          ),
                  }
                : null,

            status:
                normalizeStatus(
                    record?.status ??
                    record?.Status
                ),

            attendanceId:
                record?.attendanceId ??
                record?.AttendanceId ??
                record?.id ??
                record?.Id ??
                null,

            attendanceDate:
                record?.attendanceDate ??
                record?.AttendanceDate ??
                record?.date ??
                record?.Date ??
                null,
        };
    };

    // =====================================================
    // NORMALIZE REPORT RESPONSE
    // =====================================================

    const normalizeReportResponse = (
        data: any
    ): AttendanceReportResponse => {

        const rawAttendance =
            Array.isArray(data?.attendance)
                ? data.attendance
                : Array.isArray(data?.Attendance)
                ? data.Attendance
                : [];

        const normalizedAttendance =
            rawAttendance.map(
                normalizeAttendanceRecord
            );

        const rawSummary =
            data?.summary ??
            data?.Summary ??
            {};

        return {
            churchServiceId:
                Number(
                    data?.churchServiceId ??
                    data?.ChurchServiceId
                ) || 0,

            serviceName:
                data?.serviceName ??
                data?.ServiceName ??
                "Church Service",

            serviceDate:
                data?.serviceDate ??
                data?.ServiceDate ??
                "",

            startTime:
                data?.startTime ??
                data?.StartTime ??
                null,

            endTime:
                data?.endTime ??
                data?.EndTime ??
                null,

            location:
                data?.location ??
                data?.Location ??
                null,

            status:
                String(
                    data?.status ??
                    data?.Status ??
                    ""
                ).toUpperCase(),

            canRecordAttendance:
                Boolean(
                    data?.canRecordAttendance ??
                    data?.CanRecordAttendance
                ),

            attendanceStarted:
                Boolean(
                    data?.attendanceStarted ??
                    data?.AttendanceStarted
                ),

            message:
                data?.message ??
                data?.Message ??
                null,

            summary: {
                total:
                    Number(
                        rawSummary?.total ??
                        rawSummary?.Total
                    ) || 0,

                present:
                    Number(
                        rawSummary?.present ??
                        rawSummary?.Present
                    ) || 0,

                late:
                    Number(
                        rawSummary?.late ??
                        rawSummary?.Late
                    ) || 0,

                early:
                    Number(
                        rawSummary?.early ??
                        rawSummary?.Early
                    ) || 0,

                absent:
                    Number(
                        rawSummary?.absent ??
                        rawSummary?.Absent
                    ) || 0,

                excused:
                    Number(
                        rawSummary?.excused ??
                        rawSummary?.Excused
                    ) || 0,
            },

            attendance:
                normalizedAttendance,
        };
    };

    // =====================================================
    // LOAD CHURCH SERVICES
    // =====================================================

    const loadChurchServices =
        useCallback(async () => {
            try {
                setLoadingServices(true);
                setError("");

                const response =
                    await axios.get(
                        `${API_BASE_URL}/ChurchServices`,
                        getAuthConfig()
                    );

                const responseData =
                    response.data;

                let data: ChurchService[] = [];

                if (
                    Array.isArray(
                        responseData
                    )
                ) {
                    data =
                        responseData;
                } else if (
                    Array.isArray(
                        responseData?.data
                    )
                ) {
                    data =
                        responseData.data;
                } else if (
                    Array.isArray(
                        responseData?.items
                    )
                ) {
                    data =
                        responseData.items;
                }

                setServices(data);

            } catch (err: any) {
                console.error(
                    "Failed to load church services:",
                    err
                );

                if (
                    err?.response?.status ===
                    401
                ) {
                    setError(
                        "Your session has expired. Please log in again."
                    );
                } else if (
                    err?.response?.status ===
                    403
                ) {
                    setError(
                        "You do not have permission to view church services."
                    );
                } else {
                    setError(
                        err?.response?.data
                            ?.message ||
                        "Unable to load church services."
                    );
                }

            } finally {
                setLoadingServices(false);
            }
        }, [getAuthConfig]);

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        loadChurchServices();
    }, [loadChurchServices]);

    // =====================================================
    // LOAD ATTENDANCE REPORT
    // =====================================================

    const loadAttendance =
        useCallback(
            async (
                serviceId: number
            ) => {
                try {
                    setLoadingAttendance(
                        true
                    );

                    setError("");
                    setSuccess("");

                    const response =
                        await axios.get(
                            `${API_BASE_URL}/Attendance/church-service/${serviceId}`,
                            getAuthConfig()
                        );

                    console.log(
                        "Attendance Report API Response:",
                        response.data
                    );

                    const normalizedReport =
                        normalizeReportResponse(
                            response.data
                        );

                    console.log(
                        "Normalized Attendance:",
                        normalizedReport.attendance
                    );

                    setReport(
                        normalizedReport
                    );

                    setAttendance(
                        normalizedReport.attendance
                    );

                    setSearchText("");
                    setStatusFilter(
                        "ALL"
                    );

                    if (
                        normalizedReport.status !==
                        "COMPLETED"
                    ) {
                        setSuccess(
                            normalizedReport.message ||
                            "Attendance is not yet available for this service."
                        );
                    } else {
                        setSuccess(
                            `Attendance report loaded successfully. ${normalizedReport.summary.total} member records found.`
                        );
                    }

                } catch (err: any) {
                    console.error(
                        "Failed to load attendance report:",
                        err
                    );

                    setReport(null);
                    setAttendance([]);

                    const status =
                        err?.response?.status;

                    if (
                        status === 404
                    ) {
                        setError(
                            "The selected church service was not found."
                        );
                    } else if (
                        status === 401
                    ) {
                        setError(
                            "Your session has expired. Please log in again."
                        );
                    } else if (
                        status === 403
                    ) {
                        setError(
                            "You do not have permission to view attendance reports."
                        );
                    } else {
                        setError(
                            err?.response?.data
                                ?.message ||
                            "Unable to load attendance records."
                        );
                    }

                } finally {
                    setLoadingAttendance(
                        false
                    );
                }
            },
            [getAuthConfig]
        );

    // =====================================================
    // SERVICE CHANGE
    // =====================================================

    const handleServiceChange =
        (
            event: React.ChangeEvent<HTMLSelectElement>
        ) => {

            const value =
                event.target.value;

            if (!value) {
                setSelectedServiceId(
                    ""
                );

                setReport(null);
                setAttendance([]);

                setSearchText("");
                setStatusFilter(
                    "ALL"
                );

                setError("");
                setSuccess("");

                return;
            }

            const serviceId =
                Number(value);

            if (
                Number.isNaN(
                    serviceId
                )
            ) {
                return;
            }

            setSelectedServiceId(
                serviceId
            );

            loadAttendance(
                serviceId
            );
        };

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (
        value?: string | null
    ) => {

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
            undefined,
            {
                year: "numeric",
                month: "long",
                day: "numeric",
            }
        );
    };

    // =====================================================
    // FORMAT TIME
    // =====================================================

    const formatTime = (
        value?: string | null
    ) => {

        if (!value) {
            return "—";
        }

        let time =
            String(value)
                .trim();

        if (
            time.includes("T")
        ) {
            time =
                time.split("T")[1];
        }

        if (
            time.includes("Z")
        ) {
            time =
                time.replace(
                    "Z",
                    ""
                );
        }

        const parts =
            time.split(":");

        if (
            parts.length < 2
        ) {
            return time;
        }

        const hour =
            Number(
                parts[0]
            );

        const minute =
            parts[1];

        if (
            Number.isNaN(
                hour
            )
        ) {
            return time;
        }

        const suffix =
            hour >= 12
                ? "PM"
                : "AM";

        const displayHour =
            hour % 12 || 12;

        return `${displayHour}:${minute} ${suffix}`;
    };

    // =====================================================
    // MEMBER NAME
    // =====================================================

    const getMemberName = (
        record: AttendanceRecord
    ) => {

        // =================================================
        // FIRST PRIORITY:
        // Explicit full/member name from API
        // =================================================

        const directName =
            getStringValue(
                record.memberName,
                record.fullName,
                record.name,
                record.member?.memberName,
                record.member?.fullName,
                record.member?.name
            );

        if (directName) {
            return directName;
        }

        // =================================================
        // SECOND PRIORITY:
        // First + Middle + Last
        // =================================================

        const parts = [
            record.firstName,
            record.middleName,
            record.lastName,
        ]
            .map(
                value =>
                    value?.trim()
            )
            .filter(
                (
                    value
                ): value is string =>
                    Boolean(value)
            );

        if (
            parts.length > 0
        ) {
            return parts.join(
                " "
            );
        }

        // =================================================
        // THIRD PRIORITY:
        // MEMBER OBJECT
        // =================================================

        const memberParts = [
            record.member?.firstName,
            record.member?.middleName,
            record.member?.lastName,
        ]
            .map(
                value =>
                    value?.trim()
            )
            .filter(
                (
                    value
                ): value is string =>
                    Boolean(value)
            );

        if (
            memberParts.length > 0
        ) {
            return memberParts.join(
                " "
            );
        }

        // =================================================
        // FOURTH PRIORITY:
        // MEMBER CODE
        // =================================================

        if (
            record.memberCode
        ) {
            return record.memberCode;
        }

        // =================================================
        // FINAL FALLBACK
        // =================================================

        return `Member #${record.memberId}`;
    };

    // =====================================================
    // STATUS LABEL
    // =====================================================

    const getStatusLabel = (
        status: string
    ) => {

        switch (
            status
                .toUpperCase()
                .trim()
        ) {
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
                return status;
        }
    };

    // =====================================================
    // STATUS CSS
    // =====================================================

    const getStatusClass = (
        status: string
    ) => {

        switch (
            status
                .toUpperCase()
                .trim()
        ) {
            case "PRESENT":
                return "report-status-present";

            case "LATE":
                return "report-status-late";

            case "EARLY":
                return "report-status-early";

            case "ABSENT":
                return "report-status-absent";

            case "EXCUSED":
                return "report-status-excused";

            default:
                return "";
        }
    };

    // =====================================================
    // STATUS ICON
    // =====================================================

    const getStatusIcon = (
        status: string
    ) => {

        switch (
            status
                .toUpperCase()
                .trim()
        ) {
            case "PRESENT":
                return "✓";

            case "LATE":
                return "L";

            case "EARLY":
                return "E";

            case "ABSENT":
                return "A";

            case "EXCUSED":
                return "X";

            default:
                return "?";
        }
    };

    // =====================================================
    // FILTER ATTENDANCE
    // =====================================================

    const filteredAttendance =
        useMemo(() => {

            const search =
                searchText
                    .trim()
                    .toLowerCase();

            return attendance.filter(
                record => {

                    const name =
                        getMemberName(
                            record
                        ).toLowerCase();

                    const code =
                        (
                            record.memberCode ||
                            ""
                        )
                            .toLowerCase();

                    const status =
                        String(
                            record.status
                        )
                            .toUpperCase();

                    const matchesSearch =
                        !search ||
                        name.includes(
                            search
                        ) ||
                        code.includes(
                            search
                        );

                    const matchesStatus =
                        statusFilter ===
                            "ALL" ||
                        status ===
                            statusFilter;

                    return (
                        matchesSearch &&
                        matchesStatus
                    );
                }
            );

        }, [
            attendance,
            searchText,
            statusFilter,
        ]);

    // =====================================================
    // SUMMARY
    // =====================================================

    const summary: AttendanceSummary =
        report?.summary ?? {

            total:
                attendance.length,

            present:
                attendance.filter(
                    record =>
                        record.status ===
                        "PRESENT"
                ).length,

            late:
                attendance.filter(
                    record =>
                        record.status ===
                        "LATE"
                ).length,

            early:
                attendance.filter(
                    record =>
                        record.status ===
                        "EARLY"
                ).length,

            absent:
                attendance.filter(
                    record =>
                        record.status ===
                        "ABSENT"
                ).length,

            excused:
                attendance.filter(
                    record =>
                        record.status ===
                        "EXCUSED"
                ).length,
        };

    // =====================================================
    // ATTENDANCE RATE
    // =====================================================

    const attendanceRate =
        summary.total > 0
            ? Math.round(
                  (
                      (
                          summary.present +
                          summary.late +
                          summary.early
                      ) /
                      summary.total
                  ) *
                      100
              )
            : 0;

    // =====================================================
    // PRINT
    // =====================================================

    const handlePrint = () => {

        if (!report) {
            alert(
                "Please select a completed church service first."
            );
            return;
        }

        if (
            filteredAttendance.length ===
            0
        ) {
            alert(
                "There are no attendance records to print."
            );
            return;
        }

        const printWindow =
            window.open(
                "",
                "_blank",
                "width=1000,height=800"
            );

        if (!printWindow) {
            alert(
                "Unable to open the print document. Please allow pop-ups for EPIC Church Management System."
            );
            return;
        }

        import("react-dom/server")
            .then(
                ({
                    renderToStaticMarkup,
                }) => {

                    const printMarkup =
                        renderToStaticMarkup(
                            <AttendanceReportPrint
                                report={
                                    report
                                }
                                rows={
                                    filteredAttendance
                                }
                                summary={
                                    summary
                                }
                                attendanceRate={
                                    attendanceRate
                                }
                                formatDate={
                                    formatDate
                                }
                                formatTime={
                                    formatTime
                                }
                                getStatusLabel={
                                    getStatusLabel
                                }
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
                                ${
                                    report.serviceName ||
                                    "Attendance Report"
                                }
                            </title>

                            <style>
                                ${printStyles}
                            </style>

                        </head>

                        <body>

                            ${printMarkup}

                        </body>

                        </html>
                    `);

                    printWindow.document.close();

                    setTimeout(() => {

                        printWindow.focus();

                        printWindow.print();

                    }, 700);

                    printWindow.onafterprint =
                        () => {

                            setTimeout(() => {

                                printWindow.close();

                            }, 300);

                        };
                }
            )
            .catch(
                error => {

                    console.error(
                        "EPIC PRINT DOCUMENT ERROR:",
                        error
                    );

                    printWindow.close();

                    alert(
                        "Unable to generate the attendance print document."
                    );
                }
            );
    };

    // =====================================================
    // CLEAR REPORT
    // =====================================================

    const handleClear = () => {

        setSelectedServiceId(
            ""
        );

        setReport(null);

        setAttendance([]);

        setSearchText("");

        setStatusFilter(
            "ALL"
        );

        setError("");

        setSuccess("");
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="epic-report-builder">

            {/* HEADER */}

            <div className="epic-report-builder-header">

                <div>

                    <span className="epic-report-builder-eyebrow">
                        EPIC REPORTS CENTER
                    </span>

                    <h1>
                        Attendance Report Builder
                    </h1>

                    <p>
                        Generate attendance
                        reports directly from
                        your EPIC CMS attendance
                        records.
                    </p>

                </div>

                <div className="epic-report-builder-header-actions">

                    {report && (
                        <button
                            type="button"
                            className="epic-report-builder-btn secondary"
                            onClick={
                                handleClear
                            }
                        >
                            Clear Report
                        </button>
                    )}

                    {report && (
                        <button
                            type="button"
                            className="epic-report-builder-btn primary"
                            onClick={
                                handlePrint
                            }
                        >
                            Print / Save PDF
                        </button>
                    )}

                </div>

            </div>

            {/* ERROR */}

            {error && (
                <div className="epic-report-alert error">

                    <span>
                        !
                    </span>

                    <div>

                        <strong>
                            Report Error
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
                        aria-label="Close error"
                    >
                        ×
                    </button>

                </div>
            )}

            {/* SUCCESS */}

            {success && (
                <div className="epic-report-alert success">

                    <span>
                        ✓
                    </span>

                    <div>

                        <strong>
                            Report Information
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
                        aria-label="Close message"
                    >
                        ×
                    </button>

                </div>
            )}

            {/* BUILDER CARD */}

            <div className="epic-report-builder-card">

                <div className="epic-report-builder-card-header">

                    <div>

                        <span>
                            STEP 1
                        </span>

                        <h2>
                            Select Church Service
                        </h2>

                        <p>
                            Choose a church service
                            to generate its actual
                            attendance report.
                        </p>

                    </div>

                    <div className="epic-report-builder-step">
                        1
                    </div>

                </div>

                <div className="epic-report-builder-controls">

                    {/* SERVICE */}

                    <div className="epic-report-field service-field">

                        <label>
                            Church Service
                        </label>

                        <select
                            value={
                                selectedServiceId
                            }
                            onChange={
                                handleServiceChange
                            }
                            disabled={
                                loadingServices ||
                                loadingAttendance
                            }
                        >

                            <option value="">
                                {loadingServices
                                    ? "Loading church services..."
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
                                        }{" "}
                                        —{" "}
                                        {
                                            formatDate(
                                                service.serviceDate
                                            )
                                        }
                                    </option>
                                )
                            )}

                        </select>

                    </div>

                    {/* DATE */}

                    <div className="epic-report-field">

                        <label>
                            Service Date
                        </label>

                        <div className="epic-report-readonly-field">

                            {report
                                ? formatDate(
                                      report.serviceDate
                                  )
                                : "Select a service"}

                        </div>

                    </div>

                    {/* LOCATION */}

                    <div className="epic-report-field">

                        <label>
                            Location
                        </label>

                        <div className="epic-report-readonly-field">

                            {report?.location ||
                                "—"}

                        </div>

                    </div>

                </div>

                {/* SELECTED SERVICE INFO */}

                {report && (
                    <div className="epic-selected-service-info">

                        <div>

                            <span>
                                SERVICE
                            </span>

                            <strong>
                                {
                                    report.serviceName
                                }
                            </strong>

                        </div>

                        <div>

                            <span>
                                DATE
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
                                )}{" "}
                                —
                                {" "}
                                {formatTime(
                                    report.endTime
                                )}
                            </strong>

                        </div>

                        <div>

                            <span>
                                STATUS
                            </span>

                            <strong>
                                {
                                    report.status
                                }
                            </strong>

                        </div>

                    </div>
                )}

                {/* SERVICE WARNING */}

                {report &&
                    report.status !==
                        "COMPLETED" && (
                        <div className="epic-report-service-warning">

                            <span>
                                !
                            </span>

                            <div>

                                <strong>
                                    Attendance
                                    unavailable
                                </strong>

                                <p>
                                    {
                                        report.message ||
                                        "Attendance is only available after the church service has been completed."
                                    }
                                </p>

                            </div>

                        </div>
                    )}

            </div>

            {/* LOADING */}

            {loadingAttendance && (
                <div className="epic-report-preview">

                    <div className="epic-report-loading">

                        <div className="epic-report-spinner" />

                        <h3>
                            Loading attendance...
                        </h3>

                        <p>
                            Retrieving actual
                            attendance records
                            from EPIC CMS.
                        </p>

                    </div>

                </div>
            )}

            {/* REPORT */}

            {!loadingAttendance &&
                report &&
                report.status ===
                    "COMPLETED" && (
                    <div className="epic-report-preview">

                        {/* REPORT HEADER */}

                        <div className="epic-report-preview-header">

                            <div>

                                <div className="epic-report-logo-mark">
                                    EPIC
                                </div>

                                <div>

                                    <span className="epic-report-preview-eyebrow">
                                        LUKE 4:18
                                        MINISTRIES
                                    </span>

                                    <h2>
                                        Attendance Report
                                    </h2>

                                    <p>
                                        Engaging People
                                        Into Christ
                                    </p>

                                </div>

                            </div>

                            <div className="epic-report-preview-date">

                                <span>
                                    GENERATED
                                </span>

                                <strong>
                                    {new Date().toLocaleString()}
                                </strong>

                            </div>

                        </div>

                        {/* SERVICE DETAILS */}

                        <div className="epic-report-service-header">

                            <div>

                                <span>
                                    CHURCH SERVICE
                                </span>

                                <strong>
                                    {
                                        report.serviceName
                                    }
                                </strong>

                            </div>

                            <div>

                                <span>
                                    DATE
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
                                    )}{" "}
                                    —
                                    {" "}
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
                                    {
                                        report.location ||
                                        "—"
                                    }
                                </strong>

                            </div>

                        </div>

                        {/* SUMMARY */}

                        <div className="epic-report-summary-grid">

                            <div className="epic-report-summary-card total">

                                <span>
                                    TOTAL MEMBERS
                                </span>

                                <strong>
                                    {
                                        summary.total
                                    }
                                </strong>

                                <small>
                                    Attendance records
                                </small>

                            </div>

                            <div className="epic-report-summary-card present">

                                <span>
                                    PRESENT
                                </span>

                                <strong>
                                    {
                                        summary.present
                                    }
                                </strong>

                                <small>
                                    On time
                                </small>

                            </div>

                            <div className="epic-report-summary-card late">

                                <span>
                                    LATE
                                </span>

                                <strong>
                                    {
                                        summary.late
                                    }
                                </strong>

                                <small>
                                    Arrived late
                                </small>

                            </div>

                            <div className="epic-report-summary-card early">

                                <span>
                                    EARLY
                                </span>

                                <strong>
                                    {
                                        summary.early
                                    }
                                </strong>

                                <small>
                                    Early attendance
                                </small>

                            </div>

                            <div className="epic-report-summary-card absent">

                                <span>
                                    ABSENT
                                </span>

                                <strong>
                                    {
                                        summary.absent
                                    }
                                </strong>

                                <small>
                                    Not present
                                </small>

                            </div>

                            <div className="epic-report-summary-card excused">

                                <span>
                                    EXCUSED
                                </span>

                                <strong>
                                    {
                                        summary.excused
                                    }
                                </strong>

                                <small>
                                    Excused absence
                                </small>

                            </div>

                            <div className="epic-report-summary-card rate">

                                <span>
                                    ATTENDANCE RATE
                                </span>

                                <strong>
                                    {
                                        attendanceRate
                                    }%
                                </strong>

                                <small>
                                    Present + Late +
                                    Early
                                </small>

                            </div>

                        </div>

                        {/* TOOLBAR */}

                        <div className="epic-report-preview-toolbar no-print">

                            <div className="epic-report-filter-group">

                                <input
                                    type="text"
                                    value={
                                        searchText
                                    }
                                    onChange={event =>
                                        setSearchText(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Search member name or code..."
                                />

                                <select
                                    value={
                                        statusFilter
                                    }
                                    onChange={event =>
                                        setStatusFilter(
                                            event.target
                                                .value as StatusFilter
                                        )
                                    }
                                >

                                    <option value="ALL">
                                        All Statuses
                                    </option>

                                    <option value="PRESENT">
                                        Present
                                    </option>

                                    <option value="LATE">
                                        Late
                                    </option>

                                    <option value="EARLY">
                                        Early
                                    </option>

                                    <option value="ABSENT">
                                        Absent
                                    </option>

                                    <option value="EXCUSED">
                                        Excused
                                    </option>

                                </select>

                            </div>

                            <div className="epic-report-preview-actions">

                                <button
                                    type="button"
                                    className="epic-report-builder-btn secondary"
                                    onClick={() => {
                                        setSearchText(
                                            ""
                                        );

                                        setStatusFilter(
                                            "ALL"
                                        );
                                    }}
                                >
                                    Reset Filters
                                </button>

                                <button
                                    type="button"
                                    className="epic-report-builder-btn primary"
                                    onClick={
                                        handlePrint
                                    }
                                >
                                    Print / Save PDF
                                </button>

                            </div>

                        </div>

                        {/* LEGEND */}

                        <div className="epic-report-status-legend">

                            <span>
                                STATUS LEGEND
                            </span>

                            <span className="epic-report-legend-item">

                                <span className="epic-report-status-dot report-status-present" />

                                Present

                            </span>

                            <span className="epic-report-legend-item">

                                <span className="epic-report-status-dot report-status-late" />

                                Late

                            </span>

                            <span className="epic-report-legend-item">

                                <span className="epic-report-status-dot report-status-early" />

                                Early

                            </span>

                            <span className="epic-report-legend-item">

                                <span className="epic-report-status-dot report-status-absent" />

                                Absent

                            </span>

                            <span className="epic-report-legend-item">

                                <span className="epic-report-status-dot report-status-excused" />

                                Excused

                            </span>

                        </div>

                        {/* TABLE */}

                        <div className="epic-report-table-wrapper">

                            {filteredAttendance.length >
                            0 ? (

                                <table className="epic-report-table">

                                    <thead>

                                        <tr>

                                            <th>
                                                #
                                            </th>

                                            <th>
                                                MEMBER CODE
                                            </th>

                                            <th>
                                                MEMBER NAME
                                            </th>

                                            <th>
                                                STATUS
                                            </th>

                                            <th>
                                                ATTENDANCE DATE
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {filteredAttendance.map(
                                            (
                                                record,
                                                index
                                            ) => (

                                                <tr
                                                    key={`${record.memberId}-${record.attendanceId ?? index}`}
                                                >

                                                    <td>
                                                        {
                                                            index +
                                                            1
                                                        }
                                                    </td>

                                                    <td>

                                                        <strong>
                                                            {
                                                                record.memberCode ||
                                                                "—"
                                                            }
                                                        </strong>

                                                    </td>

                                                    <td>

                                                        <strong>
                                                            {
                                                                getMemberName(
                                                                    record
                                                                )
                                                            }
                                                        </strong>

                                                    </td>

                                                    <td>

                                                        <span
                                                            className={`epic-report-status-badge ${getStatusClass(
                                                                record.status
                                                            )}`}
                                                        >

                                                            <span>
                                                                {
                                                                    getStatusIcon(
                                                                        record.status
                                                                    )
                                                                }
                                                            </span>

                                                            {
                                                                getStatusLabel(
                                                                    record.status
                                                                )
                                                            }

                                                        </span>

                                                    </td>

                                                    <td>
                                                        {formatDate(
                                                            record.attendanceDate
                                                        )}
                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            ) : (

                                <div className="epic-report-empty">

                                    <div>
                                        🔎
                                    </div>

                                    <h3>
                                        No attendance
                                        records found
                                    </h3>

                                    <p>
                                        No members match
                                        the current search
                                        and status filters.
                                    </p>

                                </div>

                            )}

                        </div>

                        {/* FOOTER */}

                        <div className="epic-report-footer">

                            <div>

                                <strong>
                                    EPIC Church
                                    Management System
                                </strong>

                                <span>
                                    Attendance Report
                                </span>

                            </div>

                            <div>

                                <strong>
                                    Records displayed:{" "}
                                    {
                                        filteredAttendance.length
                                    }
                                </strong>

                                <span>
                                    Total records:{" "}
                                    {
                                        summary.total
                                    }
                                </span>

                            </div>

                        </div>

                    </div>
                )}

            {/* NO REPORT SELECTED */}

            {!loadingAttendance &&
                !report && (

                    <div className="epic-report-preview">

                        <div className="epic-report-empty">

                            <div>
                                📊
                            </div>

                            <h3>
                                Attendance Report
                            </h3>

                            <p>
                                Select a completed
                                church service above
                                to load its actual
                                attendance records.
                            </p>

                        </div>

                    </div>

                )}

        </div>
    );
};

export default AttendanceReportBuilder;