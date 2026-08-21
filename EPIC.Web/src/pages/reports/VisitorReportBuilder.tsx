import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import axios from "axios";
import "./VisitorReportBuilder.css";

import { API_BASE_URL } from "../../config";

// =========================================================
// TYPES
// =========================================================

type FollowUpStatus =
    | "NEW"
    | "CONTACTED"
    | "FOLLOW-UP"
    | "CONNECTED"
    | "CONVERTED";

type VisitorStatus =
    | "ACTIVE"
    | "INACTIVE";

interface Visitor {
    visitorId: number;
    visitorCode?: string | null;

    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    fullName?: string | null;

    gender?: string | null;
    birthDate?: string | null;

    contactNumber?: string | null;
    address?: string | null;
    invitedBy?: string | null;
    ministry?: string | null;

    firstVisitDate?: string | null;

    visitCount: number;

    followUpStatus: FollowUpStatus;

    status: VisitorStatus;

    notes?: string | null;

    isConvertedToMember: boolean;
    convertedMemberId?: number | null;
    conversionDate?: string | null;

    createdDate?: string | null;
    updatedDate?: string | null;
}

interface VisitorDashboard {
    totalVisitors: number;
    activeVisitors: number;
    inactiveVisitors: number;

    newVisitors: number;
    contactedVisitors: number;
    followUpVisitors: number;
    connectedVisitors: number;
    convertedMembers: number;

    firstTimeVisitors: number;
    returningVisitors: number;
}

interface VisitorAttendance {
    visitorAttendanceId: number;
    visitorId: number;
    churchServiceId: number;

    serviceName: string;

    attendanceDate: string;

    status:
        | "PRESENT"
        | "LATE"
        | "EARLY"
        | "ABSENT"
        | "EXCUSED";

    recordedBy?: string | null;
    recordedDate?: string | null;
}

// =========================================================
// FILTER TYPES
// =========================================================

type FollowUpFilter =
    | "ALL"
    | FollowUpStatus;

type StatusFilter =
    | "ALL"
    | VisitorStatus;

// =========================================================
// COMPONENT
// =========================================================

const VisitorReportBuilder: React.FC = () => {

    // =====================================================
    // STATE
    // =====================================================

    const [visitors, setVisitors] =
        useState<Visitor[]>([]);

    const [, setDashboard] =
        useState<VisitorDashboard | null>(null);

    const [selectedVisitor, setSelectedVisitor] =
        useState<Visitor | null>(null);

    const [visitorAttendance, setVisitorAttendance] =
        useState<VisitorAttendance[]>([]);

    const [searchText, setSearchText] =
        useState("");

    const [followUpFilter, setFollowUpFilter] =
        useState<FollowUpFilter>("ALL");

    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("ALL");

    const [loading, setLoading] =
        useState(false);

    const [loadingDashboard, setLoadingDashboard] =
        useState(false);

    const [loadingAttendance, setLoadingAttendance] =
        useState(false);

    const [error, setError] =
        useState("");

    

    // =====================================================
    // AUTH
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
                Authorization:
                    `Bearer ${token}`,
            },
        };
    }, []);

    // =====================================================
    // LOAD VISITORS
    // =====================================================

    const loadVisitors =
        useCallback(async () => {

            try {

                setLoading(true);
                setError("");

                const response =
                    await axios.get(
                        `${API_BASE_URL}/Visitors`,
                        getAuthConfig()
                    );

                const data =
                    Array.isArray(response.data)
                        ? response.data
                        : Array.isArray(
                            response.data?.data
                        )
                            ? response.data.data
                            : [];

                setVisitors(data);

            } catch (err: any) {

                console.error(
                    "Failed to load visitors:",
                    err
                );

                const status =
                    err?.response?.status;

                if (status === 401) {

                    setError(
                        "Your session has expired. Please log in again."
                    );

                } else if (status === 403) {

                    setError(
                        "You do not have permission to view visitor reports."
                    );

                } else {

                    setError(
                        err?.response?.data?.message ||
                        "Unable to load visitor records."
                    );
                }

            } finally {

                setLoading(false);

            }

        }, [getAuthConfig]);

    // =====================================================
    // LOAD DASHBOARD
    // =====================================================

    const loadDashboard =
        useCallback(async () => {

            try {

                setLoadingDashboard(true);

                const response =
                    await axios.get(
                        `${API_BASE_URL}/Visitors/dashboard`,
                        getAuthConfig()
                    );

                setDashboard(
                    response.data
                );

            } catch (err: any) {

                console.error(
                    "Failed to load visitor dashboard:",
                    err
                );

            } finally {

                setLoadingDashboard(false);

            }

        }, [getAuthConfig]);

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadVisitors();
        loadDashboard();

    }, [
        loadVisitors,
        loadDashboard,
    ]);

    // =====================================================
    // LOAD VISITOR ATTENDANCE
    // =====================================================

    const loadVisitorAttendance =
        useCallback(
            async (visitor: Visitor) => {

                try {

                    setLoadingAttendance(true);
                    setError("");

                    const response =
                        await axios.get(
                            `${API_BASE_URL}/Visitors/${visitor.visitorId}/attendance`,
                            getAuthConfig()
                        );

                    setSelectedVisitor(
                        visitor
                    );

                    setVisitorAttendance(
                        response.data?.attendance || []
                    );

                } catch (err: any) {

                    console.error(
                        "Failed to load visitor attendance:",
                        err
                    );

                    setError(
                        err?.response?.data?.message ||
                        "Unable to load visitor attendance."
                    );

                } finally {

                    setLoadingAttendance(false);

                }

            },
            [getAuthConfig]
        );

    // =====================================================
    // MEMBER NAME
    // =====================================================

    const getVisitorName = (
        visitor: Visitor
    ) => {

        if (
            visitor.fullName &&
            visitor.fullName.trim()
        ) {
            return visitor.fullName;
        }

        const parts = [
            visitor.firstName,
            visitor.middleName,
            visitor.lastName,
        ]
            .map(value =>
                value?.trim()
            )
            .filter(Boolean);

        if (parts.length > 0) {
            return parts.join(" ");
        }

        return (
            visitor.visitorCode ||
            `Visitor #${visitor.visitorId}`
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
    // FOLLOW-UP LABEL
    // =====================================================

    const getFollowUpLabel = (
        status: string
    ) => {

        switch (
            status
                .toUpperCase()
                .trim()
        ) {

            case "NEW":
                return "New";

            case "CONTACTED":
                return "Contacted";

            case "FOLLOW-UP":
                return "Follow-Up";

            case "CONNECTED":
                return "Connected";

            case "CONVERTED":
                return "Converted";

            default:
                return status;

        }
    };

    // =====================================================
    // FOLLOW-UP CLASS
    // =====================================================

    const getFollowUpClass = (
        status: string
    ) => {

        switch (
            status
                .toUpperCase()
                .trim()
        ) {

            case "NEW":
                return "visitor-status-new";

            case "CONTACTED":
                return "visitor-status-contacted";

            case "FOLLOW-UP":
                return "visitor-status-followup";

            case "CONNECTED":
                return "visitor-status-connected";

            case "CONVERTED":
                return "visitor-status-converted";

            default:
                return "";

        }

    };

    // =====================================================
    // FOLLOW-UP ICON
    // =====================================================

    const getFollowUpIcon = (
        status: string
    ) => {

        switch (
            status
                .toUpperCase()
                .trim()
        ) {

            case "NEW":
                return "N";

            case "CONTACTED":
                return "C";

            case "FOLLOW-UP":
                return "F";

            case "CONNECTED":
                return "✓";

            case "CONVERTED":
                return "★";

            default:
                return "?";

        }

    };

    // =====================================================
    // VISITOR STATUS CLASS
    // =====================================================

    const getStatusClass = (
        status: string
    ) => {

        return status
            .toUpperCase()
            .trim() === "ACTIVE"
            ? "visitor-active"
            : "visitor-inactive";

    };

    // =====================================================
    // FILTER VISITORS
    // =====================================================

    const filteredVisitors =
        useMemo(() => {

            const search =
                searchText
                    .trim()
                    .toLowerCase();

            return visitors.filter(
                visitor => {

                    const name =
                        getVisitorName(
                            visitor
                        ).toLowerCase();

                    const code =
                        (
                            visitor.visitorCode ||
                            ""
                        )
                            .toLowerCase();

                    const contact =
                        (
                            visitor.contactNumber ||
                            ""
                        )
                            .toLowerCase();

                    const ministry =
                        (
                            visitor.ministry ||
                            ""
                        )
                            .toLowerCase();

                    const invitedBy =
                        (
                            visitor.invitedBy ||
                            ""
                        )
                            .toLowerCase();

                    const matchesSearch =
                        !search ||
                        name.includes(search) ||
                        code.includes(search) ||
                        contact.includes(search) ||
                        ministry.includes(search) ||
                        invitedBy.includes(search);

                    const matchesFollowUp =
                        followUpFilter === "ALL" ||
                        visitor.followUpStatus ===
                            followUpFilter;

                    const matchesStatus =
                        statusFilter === "ALL" ||
                        visitor.status ===
                            statusFilter;

                    return (
                        matchesSearch &&
                        matchesFollowUp &&
                        matchesStatus
                    );
                }
            );

        }, [
            visitors,
            searchText,
            followUpFilter,
            statusFilter,
        ]);

    // =====================================================
    // LOCAL SUMMARY
    // =====================================================

    const summary = useMemo(() => {

        return {

            total:
                visitors.length,

            active:
                visitors.filter(
                    v =>
                        v.status === "ACTIVE"
                ).length,

            inactive:
                visitors.filter(
                    v =>
                        v.status === "INACTIVE"
                ).length,

            newVisitors:
                visitors.filter(
                    v =>
                        v.followUpStatus === "NEW"
                ).length,

            contacted:
                visitors.filter(
                    v =>
                        v.followUpStatus === "CONTACTED"
                ).length,

            followUp:
                visitors.filter(
                    v =>
                        v.followUpStatus === "FOLLOW-UP"
                ).length,

            connected:
                visitors.filter(
                    v =>
                        v.followUpStatus === "CONNECTED"
                ).length,

            converted:
                visitors.filter(
                    v =>
                        v.followUpStatus === "CONVERTED"
                ).length,

            firstTime:
                visitors.filter(
                    v =>
                        v.visitCount <= 1
                ).length,

            returning:
                visitors.filter(
                    v =>
                        v.visitCount > 1
                ).length,

        };

    }, [visitors]);

    // =====================================================
    // CONVERSION RATE
    // =====================================================

    const conversionRate =
        summary.total > 0
            ? Math.round(
                (
                    summary.converted /
                    summary.total
                ) * 100
            )
            : 0;

    // =====================================================
    // CLEAR FILTERS
    // =====================================================

    const resetFilters = () => {

        setSearchText("");

        setFollowUpFilter(
            "ALL"
        );

        setStatusFilter(
            "ALL"
        );

    };

    // =====================================================
    // CLOSE VISITOR DETAILS
    // =====================================================

    const closeVisitorDetails = () => {

        setSelectedVisitor(null);

        setVisitorAttendance([]);

    };

    // =====================================================
    // PRINT REPORT
    // =====================================================

    const handlePrint = () => {

        if (
            filteredVisitors.length === 0
        ) {

            alert(
                "There are no visitor records to print."
            );

            return;
        }

        const printWindow =
            window.open(
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

        const rows =
            filteredVisitors
                .map(
                    (
                        visitor,
                        index
                    ) => `
                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                <strong>
                                    ${visitor.visitorCode || "—"}
                                </strong>
                            </td>

                            <td>
                                <strong>
                                    ${getVisitorName(visitor)}
                                </strong>
                            </td>

                            <td>
                                ${visitor.contactNumber || "—"}
                            </td>

                            <td>
                                ${visitor.visitCount}
                            </td>

                            <td>
                                ${getFollowUpLabel(
                                    visitor.followUpStatus
                                )}
                            </td>

                            <td>
                                ${visitor.status}
                            </td>

                            <td>
                                ${formatDate(
                                    visitor.firstVisitDate
                                )}
                            </td>

                        </tr>
                    `
                )
                .join("");

        printWindow.document.write(`
            <!DOCTYPE html>

            <html>

            <head>

                <meta charset="UTF-8" />

                <title>
                    EPIC Visitor Report
                </title>

                <style>

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        font-family:
                            Arial,
                            Helvetica,
                            sans-serif;

                        color: #182230;

                        padding: 35px;
                    }

                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;

                        border-bottom:
                            2px solid #182230;

                        padding-bottom: 20px;

                        margin-bottom: 25px;
                    }

                    .brand {
                        font-size: 12px;
                        font-weight: 800;
                        letter-spacing: 2px;
                    }

                    h1 {
                        margin: 5px 0;
                        font-size: 28px;
                    }

                    .subtitle {
                        color: #6b7280;
                    }

                    .generated {
                        text-align: right;
                        font-size: 12px;
                        color: #6b7280;
                    }

                    .summary {
                        display: grid;
                        grid-template-columns:
                            repeat(5, 1fr);

                        gap: 12px;

                        margin-bottom: 25px;
                    }

                    .card {
                        border:
                            1px solid #e5e7eb;

                        border-radius: 10px;

                        padding: 15px;
                    }

                    .card span {
                        display: block;

                        font-size: 10px;

                        font-weight: 800;

                        letter-spacing: 1px;

                        color: #6b7280;
                    }

                    .card strong {
                        display: block;

                        font-size: 25px;

                        margin-top: 5px;
                    }

                    table {
                        width: 100%;

                        border-collapse:
                            collapse;

                        font-size: 11px;
                    }

                    th {
                        text-align: left;

                        background: #182230;

                        color: white;

                        padding: 10px;
                    }

                    td {
                        border-bottom:
                            1px solid #e5e7eb;

                        padding: 9px;
                    }

                    .footer {
                        margin-top: 30px;

                        padding-top: 15px;

                        border-top:
                            1px solid #ddd;

                        font-size: 11px;

                        color: #6b7280;
                    }

                    @media print {

                        body {
                            padding: 15px;
                        }

                        table {
                            page-break-inside: auto;
                        }

                        tr {
                            page-break-inside: avoid;
                        }

                    }

                </style>

            </head>

            <body>

                <div class="header">

                    <div>

                        <div class="brand">
                            LUKE 4:18 MINISTRIES
                        </div>

                        <h1>
                            Visitor Report
                        </h1>

                        <div class="subtitle">
                            Engaging People Into Christ
                        </div>

                    </div>

                    <div class="generated">

                        GENERATED<br />

                        <strong>
                            ${new Date().toLocaleString()}
                        </strong>

                    </div>

                </div>

                <div class="summary">

                    <div class="card">
                        <span>
                            TOTAL VISITORS
                        </span>

                        <strong>
                            ${summary.total}
                        </strong>
                    </div>

                    <div class="card">
                        <span>
                            ACTIVE
                        </span>

                        <strong>
                            ${summary.active}
                        </strong>
                    </div>

                    <div class="card">
                        <span>
                            RETURNING
                        </span>

                        <strong>
                            ${summary.returning}
                        </strong>
                    </div>

                    <div class="card">
                        <span>
                            CONNECTED
                        </span>

                        <strong>
                            ${summary.connected}
                        </strong>
                    </div>

                    <div class="card">
                        <span>
                            CONVERTED
                        </span>

                        <strong>
                            ${summary.converted}
                        </strong>
                    </div>

                </div>

                <table>

                    <thead>

                        <tr>

                            <th>#</th>

                            <th>
                                VISITOR CODE
                            </th>

                            <th>
                                VISITOR NAME
                            </th>

                            <th>
                                CONTACT
                            </th>

                            <th>
                                VISITS
                            </th>

                            <th>
                                FOLLOW-UP
                            </th>

                            <th>
                                STATUS
                            </th>

                            <th>
                                FIRST VISIT
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${rows}

                    </tbody>

                </table>

                <div class="footer">

                    EPIC Church Management System
                    • Visitor Report

                    <br />

                    Records displayed:
                    ${filteredVisitors.length}

                    /
                    ${summary.total}

                </div>

            </body>

            </html>
        `);

        printWindow.document.close();

        setTimeout(() => {

            printWindow.focus();

            printWindow.print();

        }, 500);

        printWindow.onafterprint = () => {

            setTimeout(() => {

                printWindow.close();

            }, 300);

        };

    };

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="epic-visitor-report-builder">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="epic-visitor-report-header">

                <div>

                    <span className="epic-visitor-report-eyebrow">
                        EPIC REPORTS CENTER
                    </span>

                    <h1>
                        Visitor Report Builder
                    </h1>

                    <p>
                        Generate visitor reports
                        directly from your EPIC CMS
                        visitor records and follow-up
                        lifecycle.
                    </p>

                </div>

                <div className="epic-visitor-report-header-actions">

                    <button
                        type="button"
                        className="visitor-report-btn secondary"
                        onClick={resetFilters}
                    >
                        Reset Filters
                    </button>

                    <button
                        type="button"
                        className="visitor-report-btn primary"
                        onClick={handlePrint}
                    >
                        Print / Save PDF
                    </button>

                </div>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="visitor-report-alert error">

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
                    >
                        ×
                    </button>

                </div>

            )}

            {/* =================================================
                DASHBOARD
            ================================================= */}

            <div className="visitor-report-summary-grid">

                <div className="visitor-summary-card total">

                    <span>
                        TOTAL VISITORS
                    </span>

                    <strong>
                        {loadingDashboard
                            ? "—"
                            : summary.total}
                    </strong>

                    <small>
                        All visitor records
                    </small>

                </div>

                <div className="visitor-summary-card active">

                    <span>
                        ACTIVE
                    </span>

                    <strong>
                        {summary.active}
                    </strong>

                    <small>
                        Active visitors
                    </small>

                </div>

                <div className="visitor-summary-card new">

                    <span>
                        NEW
                    </span>

                    <strong>
                        {summary.newVisitors}
                    </strong>

                    <small>
                        No recorded visit
                    </small>

                </div>

                <div className="visitor-summary-card followup">

                    <span>
                        FOLLOW-UP
                    </span>

                    <strong>
                        {summary.followUp}
                    </strong>

                    <small>
                        Second visit
                    </small>

                </div>

                <div className="visitor-summary-card connected">

                    <span>
                        CONNECTED
                    </span>

                    <strong>
                        {summary.connected}
                    </strong>

                    <small>
                        3+ visits
                    </small>

                </div>

                <div className="visitor-summary-card converted">

                    <span>
                        CONVERTED
                    </span>

                    <strong>
                        {summary.converted}
                    </strong>

                    <small>
                        Became members
                    </small>

                </div>

                <div className="visitor-summary-card rate">

                    <span>
                        CONVERSION RATE
                    </span>

                    <strong>
                        {conversionRate}%
                    </strong>

                    <small>
                        Visitors → Members
                    </small>

                </div>

            </div>

            {/* =================================================
                REPORT BUILDER
            ================================================= */}

            <div className="epic-visitor-report-card">

                <div className="epic-visitor-report-card-header">

                    <div>

                        <span>
                            STEP 1
                        </span>

                        <h2>
                            Build Visitor Report
                        </h2>

                        <p>
                            Search and filter actual
                            visitor records from EPIC CMS.
                        </p>

                    </div>

                    <div className="visitor-report-step">
                        1
                    </div>

                </div>

                {/* =================================================
                    FILTER TOOLBAR
                ================================================= */}

                <div className="visitor-report-controls">

                    <div className="visitor-report-field search">

                        <label>
                            Search Visitors
                        </label>

                        <input
                            type="text"
                            value={searchText}
                            onChange={event =>
                                setSearchText(
                                    event.target.value
                                )
                            }
                            placeholder="Search name, visitor code, contact, ministry..."
                        />

                    </div>

                    <div className="visitor-report-field">

                        <label>
                            Follow-Up Lifecycle
                        </label>

                        <select
                            value={
                                followUpFilter
                            }
                            onChange={event =>
                                setFollowUpFilter(
                                    event.target.value as FollowUpFilter
                                )
                            }
                        >

                            <option value="ALL">
                                All Lifecycle Statuses
                            </option>

                            <option value="NEW">
                                New
                            </option>

                            <option value="CONTACTED">
                                Contacted
                            </option>

                            <option value="FOLLOW-UP">
                                Follow-Up
                            </option>

                            <option value="CONNECTED">
                                Connected
                            </option>

                            <option value="CONVERTED">
                                Converted
                            </option>

                        </select>

                    </div>

                    <div className="visitor-report-field">

                        <label>
                            Visitor Status
                        </label>

                        <select
                            value={
                                statusFilter
                            }
                            onChange={event =>
                                setStatusFilter(
                                    event.target.value as StatusFilter
                                )
                            }
                        >

                            <option value="ALL">
                                All Statuses
                            </option>

                            <option value="ACTIVE">
                                Active
                            </option>

                            <option value="INACTIVE">
                                Inactive
                            </option>

                        </select>

                    </div>

                </div>

            </div>

            {/* =================================================
                REPORT PREVIEW
            ================================================= */}

            <div className="epic-visitor-report-preview">

                {/* =================================================
                    REPORT HEADER
                ================================================= */}

                <div className="epic-visitor-report-preview-header">

                    <div>

                        <div className="visitor-report-logo">
                            EPIC
                        </div>

                        <div>

                            <span>
                                LUKE 4:18 MINISTRIES
                            </span>

                            <h2>
                                Visitor Report
                            </h2>

                            <p>
                                Engaging People Into Christ
                            </p>

                        </div>

                    </div>

                    <div className="visitor-report-generated">

                        <span>
                            GENERATED
                        </span>

                        <strong>
                            {new Date().toLocaleString()}
                        </strong>

                    </div>

                </div>

                {/* =================================================
                    LIFECYCLE
                ================================================= */}

                <div className="visitor-lifecycle">

                    <div className="visitor-lifecycle-title">

                        <span>
                            VISITOR JOURNEY
                        </span>

                        <strong>
                            Automatic Follow-Up Lifecycle
                        </strong>

                    </div>

                    <div className="visitor-lifecycle-flow">

                        <div className="lifecycle-node new">
                            <strong>NEW</strong>
                            <span>
                                {summary.newVisitors}
                            </span>
                        </div>

                        <div className="lifecycle-arrow">
                            →
                        </div>

                        <div className="lifecycle-node contacted">
                            <strong>CONTACTED</strong>
                            <span>
                                {summary.contacted}
                            </span>
                        </div>

                        <div className="lifecycle-arrow">
                            →
                        </div>

                        <div className="lifecycle-node followup">
                            <strong>FOLLOW-UP</strong>
                            <span>
                                {summary.followUp}
                            </span>
                        </div>

                        <div className="lifecycle-arrow">
                            →
                        </div>

                        <div className="lifecycle-node connected">
                            <strong>CONNECTED</strong>
                            <span>
                                {summary.connected}
                            </span>
                        </div>

                        <div className="lifecycle-arrow">
                            →
                        </div>

                        <div className="lifecycle-node converted">
                            <strong>CONVERTED</strong>
                            <span>
                                {summary.converted}
                            </span>
                        </div>

                    </div>

                </div>

                {/* =================================================
                    TABLE TOOLBAR
                ================================================= */}

                <div className="visitor-report-toolbar">

                    <div>

                        <strong>
                            Visitor Records
                        </strong>

                        <span>
                            Showing{" "}
                            {filteredVisitors.length}
                            {" "}of{" "}
                            {visitors.length}
                        </span>

                    </div>

                    <div>

                        <button
                            type="button"
                            className="visitor-report-btn secondary"
                            onClick={resetFilters}
                        >
                            Reset
                        </button>

                        <button
                            type="button"
                            className="visitor-report-btn primary"
                            onClick={handlePrint}
                        >
                            Print Report
                        </button>

                    </div>

                </div>

                {/* =================================================
                    TABLE
                ================================================= */}

                <div className="visitor-report-table-wrapper">

                    {loading ? (

                        <div className="visitor-report-loading">

                            <div className="visitor-report-spinner" />

                            <h3>
                                Loading visitor records...
                            </h3>

                            <p>
                                Retrieving actual visitor
                                data from EPIC CMS.
                            </p>

                        </div>

                    ) : filteredVisitors.length > 0 ? (

                        <table className="visitor-report-table">

                            <thead>

                                <tr>

                                    <th>
                                        #
                                    </th>

                                    <th>
                                        VISITOR CODE
                                    </th>

                                    <th>
                                        VISITOR NAME
                                    </th>

                                    <th>
                                        CONTACT
                                    </th>

                                    <th>
                                        MINISTRY
                                    </th>

                                    <th>
                                        VISITS
                                    </th>

                                    <th>
                                        FOLLOW-UP
                                    </th>

                                    <th>
                                        STATUS
                                    </th>

                                    <th>
                                        FIRST VISIT
                                    </th>

                                    <th>
                                        VIEW
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredVisitors.map(
                                    (
                                        visitor,
                                        index
                                    ) => (

                                        <tr
                                            key={
                                                visitor.visitorId
                                            }
                                        >

                                            <td>
                                                {index + 1}
                                            </td>

                                            <td>

                                                <strong>
                                                    {
                                                        visitor.visitorCode ||
                                                        "—"
                                                    }
                                                </strong>

                                            </td>

                                            <td>

                                                <strong>
                                                    {
                                                        getVisitorName(
                                                            visitor
                                                        )
                                                    }
                                                </strong>

                                            </td>

                                            <td>
                                                {
                                                    visitor.contactNumber ||
                                                    "—"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    visitor.ministry ||
                                                    "—"
                                                }
                                            </td>

                                            <td>

                                                <span className="visitor-visit-count">
                                                    {
                                                        visitor.visitCount
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                <span
                                                    className={`visitor-followup-badge ${getFollowUpClass(
                                                        visitor.followUpStatus
                                                    )}`}
                                                >

                                                    <span>
                                                        {
                                                            getFollowUpIcon(
                                                                visitor.followUpStatus
                                                            )
                                                        }
                                                    </span>

                                                    {
                                                        getFollowUpLabel(
                                                            visitor.followUpStatus
                                                        )
                                                    }

                                                </span>

                                            </td>

                                            <td>

                                                <span
                                                    className={`visitor-status-badge ${getStatusClass(
                                                        visitor.status
                                                    )}`}
                                                >
                                                    {
                                                        visitor.status
                                                    }
                                                </span>

                                            </td>

                                            <td>
                                                {
                                                    formatDate(
                                                        visitor.firstVisitDate
                                                    )
                                                }
                                            </td>

                                            <td>

                                                <button
                                                    type="button"
                                                    className="visitor-view-btn"
                                                    onClick={() =>
                                                        loadVisitorAttendance(
                                                            visitor
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    ) : (

                        <div className="visitor-report-empty">

                            <div>
                                👥
                            </div>

                            <h3>
                                No visitor records found
                            </h3>

                            <p>
                                No visitors match your
                                current search and filters.
                            </p>

                        </div>

                    )}

                </div>

                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="visitor-report-footer">

                    <div>

                        <strong>
                            EPIC Church Management System
                        </strong>

                        <span>
                            Visitor Report Builder
                        </span>

                    </div>

                    <div>

                        <strong>
                            Records displayed:{" "}
                            {
                                filteredVisitors.length
                            }
                        </strong>

                        <span>
                            Conversion rate:{" "}
                            {conversionRate}%
                        </span>

                    </div>

                </div>

            </div>

            {/* =================================================
                VISITOR DETAIL MODAL
            ================================================= */}

            {selectedVisitor && (

                <div
                    className="visitor-detail-overlay"
                    onClick={
                        closeVisitorDetails
                    }
                >

                    <div
                        className="visitor-detail-modal"
                        onClick={event =>
                            event.stopPropagation()
                        }
                    >

                        <div className="visitor-detail-header">

                            <div>

                                <span>
                                    VISITOR PROFILE
                                </span>

                                <h2>
                                    {
                                        getVisitorName(
                                            selectedVisitor
                                        )
                                    }
                                </h2>

                                <p>
                                    {
                                        selectedVisitor.visitorCode ||
                                        "—"
                                    }
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeVisitorDetails
                                }
                            >
                                ×
                            </button>

                        </div>

                        <div className="visitor-detail-grid">

                            <div>
                                <span>
                                    CONTACT
                                </span>

                                <strong>
                                    {
                                        selectedVisitor.contactNumber ||
                                        "—"
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>
                                    MINISTRY
                                </span>

                                <strong>
                                    {
                                        selectedVisitor.ministry ||
                                        "—"
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>
                                    VISITS
                                </span>

                                <strong>
                                    {
                                        selectedVisitor.visitCount
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>
                                    FOLLOW-UP
                                </span>

                                <strong>
                                    {
                                        getFollowUpLabel(
                                            selectedVisitor.followUpStatus
                                        )
                                    }
                                </strong>
                            </div>

                        </div>

                        <div className="visitor-detail-section">

                            <div className="visitor-detail-section-title">

                                <span>
                                    ATTENDANCE HISTORY
                                </span>

                                <strong>
                                    {
                                        visitorAttendance.length
                                    }{" "}
                                    records
                                </strong>

                            </div>

                            {loadingAttendance ? (

                                <div className="visitor-detail-loading">
                                    Loading attendance...
                                </div>

                            ) : visitorAttendance.length > 0 ? (

                                <div className="visitor-attendance-list">

                                    {visitorAttendance.map(
                                        attendance => (

                                            <div
                                                className="visitor-attendance-row"
                                                key={
                                                    attendance.visitorAttendanceId
                                                }
                                            >

                                                <div>

                                                    <strong>
                                                        {
                                                            attendance.serviceName
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            formatDate(
                                                                attendance.attendanceDate
                                                            )
                                                        }
                                                    </span>

                                                </div>

                                                <span
                                                    className={`visitor-attendance-status ${attendance.status.toLowerCase()}`}
                                                >
                                                    {
                                                        attendance.status
                                                    }
                                                </span>

                                            </div>

                                        )
                                    )}

                                </div>

                            ) : (

                                <div className="visitor-detail-empty">

                                    No attendance history
                                    recorded.

                                </div>

                            )}

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};

export default VisitorReportBuilder;