
import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import axios from "axios";

import { API_BASE_URL } from "../config";

import "./ClientAttendance.css";

// =========================================================
// TYPES
// =========================================================

interface ChurchService {
    churchServiceId: number;
    customerId?: number;

    serviceName: string;
    serviceType?: string;

    serviceDate: string;

    startTime?: string;
    endTime?: string;

    location?: string;

    status?: string;
}

interface AttendanceMember {
    memberId: number;
    memberCode?: string;

    firstName?: string;
    middleName?: string;
    lastName?: string;

    status: string;

    attendanceId?: number | null;
    attendanceDate?: string;
}

interface AttendanceSummary {
    total: number;
    present: number;
    late: number;
    early: number;
    absent: number;
    excused: number;
}

interface AttendanceResponse {
    churchServiceId: number;

    serviceName: string;

    serviceDate: string;

    startTime?: string;

    endTime?: string;

    location?: string;

    status: string;

    canRecordAttendance: boolean;

    attendanceStarted: boolean;

    message?: string;

    summary: AttendanceSummary;

    attendance: AttendanceMember[];
}

interface ClientAttendanceProps {
    onBack?: () => void;

    canCreate?: boolean;

    canEdit?: boolean;

    canDelete?: boolean;
}

// =========================================================
// CONSTANTS
// =========================================================

const ATTENDANCE_STATUSES = [
    "PRESENT",
    "LATE",
    "EARLY",
    "ABSENT",
    "EXCUSED",
];

const EMPTY_SUMMARY: AttendanceSummary = {
    total: 0,
    present: 0,
    late: 0,
    early: 0,
    absent: 0,
    excused: 0,
};

// =========================================================
// COMPONENT
// =========================================================

const ClientAttendance: React.FC<ClientAttendanceProps> = ({
    onBack,

    canCreate = false,

    canEdit = false,

    canDelete = false,
}) => {

    // =====================================================
    // STATE
    // =====================================================

    const [services, setServices] =
        useState<ChurchService[]>([]);

    const [selectedServiceId, setSelectedServiceId] =
        useState<number | null>(null);

    const [attendance, setAttendance] =
        useState<AttendanceMember[]>([]);

    const [summary, setSummary] =
        useState<AttendanceSummary>(
            EMPTY_SUMMARY
        );

    const [loadingServices, setLoadingServices] =
        useState<boolean>(true);

    const [loadingAttendance, setLoadingAttendance] =
        useState<boolean>(false);

    const [saving, setSaving] =
        useState<boolean>(false);

    const [deletingId, setDeletingId] =
        useState<number | null>(null);

    const [error, setError] =
        useState<string>("");

    const [message, setMessage] =
        useState<string>("");

    const [search, setSearch] =
        useState<string>("");

    // =====================================================
    // PERMISSIONS
    // =====================================================

    const canManageAttendance =
        canCreate ||
        canEdit ||
        canDelete;

    // =====================================================
    // TOKEN
    // =====================================================

    const getClientToken = (): string | null => {

        return (
            localStorage.getItem("clientToken") ||
            sessionStorage.getItem("clientToken") ||
            localStorage.getItem("clientAccessToken") ||
            sessionStorage.getItem("clientAccessToken")
        );
    };

    // =====================================================
    // AXIOS HEADERS
    // =====================================================

    const getHeaders = () => {

        const token =
            getClientToken();

        return {
            Authorization:
                token
                    ? `Bearer ${token}`
                    : "",
        };
    };

    // =====================================================
    // ERROR MESSAGE
    // =====================================================

  const getErrorMessage = (
    err: unknown,
    fallback: string
): string => {

    if (axios.isAxiosError(err)) {

        const responseData =
            err.response?.data;

        console.error(
            "ATTENDANCE API RESPONSE:",
            responseData
        );

        if (
            responseData &&
            typeof responseData === "object"
        ) {

            const data =
                responseData as {
                    message?: string;
                    title?: string;
                    error?: string;
                    detail?: string;
                    innerException?: string;
                    innerInnerException?: string;
                    exceptionType?: string;
                };

            // Prefer the actual exception details during development.
            if (data.error) {
                return (
                    data.message
                        ? `${data.message}: ${data.error}`
                        : data.error
                );
            }

            if (data.detail) {
                return (
                    data.message
                        ? `${data.message}: ${data.detail}`
                        : data.detail
                );
            }

            if (data.innerException) {
                return (
                    data.message
                        ? `${data.message}: ${data.innerException}`
                        : data.innerException
                );
            }

            if (data.message) {
                return data.message;
            }

            if (data.title) {
                return data.title;
            }
        }

        if (
            typeof responseData ===
            "string"
        ) {
            return responseData;
        }

        if (err.message) {
            return err.message;
        }
    }

    if (err instanceof Error) {
        return err.message;
    }

    return fallback;
};
    // =====================================================
    // LOAD CHURCH SERVICES
    // =====================================================

    const loadServices = async (): Promise<void> => {

        try {

            setLoadingServices(true);

            setError("");

            setMessage("");

            const response =
                await axios.get<ChurchService[]>(
                    `${API_BASE_URL}/ChurchServices`,
                    {
                        headers:
                            getHeaders(),
                    }
                );

            const completedServices =
                (response.data || [])
                    .filter(
                        service =>
                            String(
                                service.status ||
                                ""
                            )
                                .trim()
                                .toUpperCase() ===
                            "COMPLETED"
                    )
                    .sort(
                        (a, b) =>
                            new Date(
                                b.serviceDate
                            ).getTime() -
                            new Date(
                                a.serviceDate
                            ).getTime()
                    );

            setServices(
                completedServices
            );

            if (
                completedServices.length > 0
            ) {

                setSelectedServiceId(
                    completedServices[0]
                        .churchServiceId
                );

            } else {

                setSelectedServiceId(
                    null
                );

                setAttendance([]);

                setSummary(
                    EMPTY_SUMMARY
                );
            }

        } catch (err) {

            console.error(
                "CLIENT ATTENDANCE SERVICES ERROR:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    "Unable to load church services."
                )
            );

        } finally {

            setLoadingServices(false);
        }
    };

    // =====================================================
    // LOAD ATTENDANCE
    // =====================================================

    const loadAttendance = async (
        churchServiceId: number
    ): Promise<void> => {

        try {

            setLoadingAttendance(true);

            setError("");

            setMessage("");

            const response =
                await axios.get<AttendanceResponse>(
                    `${API_BASE_URL}/Attendance/church-service/${churchServiceId}`,
                    {
                        headers:
                            getHeaders(),
                    }
                );

            const data =
                response.data;

            setAttendance(
                data.attendance ||
                []
            );

            setSummary(
                data.summary ||
                EMPTY_SUMMARY
            );

            if (
                data.message
            ) {

                setMessage(
                    data.message
                );
            }

        } catch (err) {

            console.error(
                "CLIENT ATTENDANCE LOAD ERROR:",
                err
            );

            setAttendance([]);

            setSummary(
                EMPTY_SUMMARY
            );

            setError(
                getErrorMessage(
                    err,
                    "Unable to load attendance."
                )
            );

        } finally {

            setLoadingAttendance(false);
        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadServices();

    }, []);

    // =====================================================
    // SERVICE CHANGE
    // =====================================================

    useEffect(() => {

        if (
            selectedServiceId !== null
        ) {

            loadAttendance(
                selectedServiceId
            );

        } else {

            setAttendance([]);

            setSummary(
                EMPTY_SUMMARY
            );
        }

    }, [selectedServiceId]);

    // =====================================================
    // UPDATE STATUS
    // =====================================================

    const updateStatus = (
        memberId: number,
        status: string
    ): void => {

        const member =
            attendance.find(
                item =>
                    item.memberId ===
                    memberId
            );

        if (!member) {

            return;
        }

        const hasExistingRecord =
            Boolean(
                member.attendanceId
            );

        // Existing attendance requires EDIT.

        if (
            hasExistingRecord &&
            !canEdit
        ) {

            setError(
                "You do not have permission to edit this attendance record."
            );

            return;
        }

        // New attendance requires CREATE.

        if (
            !hasExistingRecord &&
            !canCreate
        ) {

            setError(
                "You do not have permission to create attendance records."
            );

            return;
        }

        const normalizedStatus =
            String(status || "")
                .trim()
                .toUpperCase();

        if (
            !ATTENDANCE_STATUSES.includes(
                normalizedStatus
            )
        ) {

            return;
        }

        setError("");

        setMessage("");

        setAttendance(
            previous =>
                previous.map(
                    item =>
                        item.memberId ===
                        memberId
                            ? {
                                ...item,
                                status:
                                    normalizedStatus,
                            }
                            : item
                )
        );
    };

    // =====================================================
    // RECALCULATE SUMMARY
    // =====================================================

    useEffect(() => {

        const normalized =
            attendance.map(
                member =>
                    String(
                        member.status ||
                        ""
                    )
                        .trim()
                        .toUpperCase()
            );

        setSummary({
            total:
                attendance.length,

            present:
                normalized.filter(
                    x =>
                        x === "PRESENT"
                ).length,

            late:
                normalized.filter(
                    x =>
                        x === "LATE"
                ).length,

            early:
                normalized.filter(
                    x =>
                        x === "EARLY"
                ).length,

            absent:
                normalized.filter(
                    x =>
                        x === "ABSENT"
                ).length,

            excused:
                normalized.filter(
                    x =>
                        x === "EXCUSED"
                ).length,
        });

    }, [attendance]);

    // =====================================================
    // SAVE ATTENDANCE
    // =====================================================

    const saveAttendance = async (): Promise<void> => {

        if (
            selectedServiceId === null
        ) {

            setError(
                "Please select a church service."
            );

            return;
        }

        if (
            attendance.length === 0
        ) {

            setError(
                "There are no members to save."
            );

            return;
        }

        if (
            !canCreate &&
            !canEdit
        ) {

            setError(
                "You do not have permission to save attendance."
            );

            return;
        }

        try {

            setSaving(true);

            setError("");

            setMessage("");

            const payload = {
                attendance:
                    attendance.map(
                        member => ({
                            memberId:
                                member.memberId,

                            status:
                                String(
                                    member.status ||
                                    "PRESENT"
                                )
                                    .trim()
                                    .toUpperCase(),
                        })
                    ),
            };

            const response =
                await axios.post(
                    `${API_BASE_URL}/Attendance/church-service/${selectedServiceId}`,
                    payload,
                    {
                        headers:
                            getHeaders(),
                    }
                );

            setMessage(
                response.data?.message ||
                "Attendance saved successfully."
            );

            await loadAttendance(
                selectedServiceId
            );

        } catch (err) {

            console.error(
                "CLIENT ATTENDANCE SAVE ERROR:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    "Unable to save attendance."
                )
            );

        } finally {

            setSaving(false);
        }
    };

    // =====================================================
    // DELETE ATTENDANCE
    // =====================================================

    const deleteAttendance = async (
        attendanceId: number
    ): Promise<void> => {

        if (!canDelete) {

            setError(
                "You do not have permission to delete attendance records."
            );

            return;
        }

        if (!attendanceId) {

            return;
        }

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this attendance record?"
            );

        if (!confirmed) {

            return;
        }

        try {

            setDeletingId(
                attendanceId
            );

            setError("");

            setMessage("");

            const response =
                await axios.delete(
                    `${API_BASE_URL}/Attendance/${attendanceId}`,
                    {
                        headers:
                            getHeaders(),
                    }
                );

            setMessage(
                response.data?.message ||
                "Attendance record deleted successfully."
            );

            if (
                selectedServiceId !== null
            ) {

                await loadAttendance(
                    selectedServiceId
                );
            }

        } catch (err) {

            console.error(
                "CLIENT ATTENDANCE DELETE ERROR:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    "Unable to delete attendance record."
                )
            );

        } finally {

            setDeletingId(null);
        }
    };

    // =====================================================
    // FILTER MEMBERS
    // =====================================================

    const filteredAttendance =
        useMemo(() => {

            const keyword =
                search
                    .trim()
                    .toLowerCase();

            if (!keyword) {

                return attendance;
            }

            return attendance.filter(
                member => {

                    const name =
                        [
                            member.firstName,
                            member.middleName,
                            member.lastName,
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();

                    const code =
                        String(
                            member.memberCode ||
                            ""
                        )
                            .toLowerCase();

                    return (
                        name.includes(
                            keyword
                        ) ||
                        code.includes(
                            keyword
                        )
                    );
                }
            );

        }, [
            attendance,
            search,
        ]);

    // =====================================================
    // SELECTED SERVICE
    // =====================================================

    const selectedService =
        services.find(
            service =>
                service.churchServiceId ===
                selectedServiceId
        );

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (
        value?: string
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
            undefined,
            {
                year: "numeric",
                month: "long",
                day: "numeric",
            }
        );
    };

    // =====================================================
    // FORMAT MEMBER NAME
    // =====================================================

    const getMemberName = (
        member: AttendanceMember
    ): string => {

        const first =
            member.firstName?.trim() ||
            "";

        const middle =
            member.middleName?.trim() ||
            "";

        const last =
            member.lastName?.trim() ||
            "";

        const given =
            [
                first,
                middle,
            ]
                .filter(Boolean)
                .join(" ");

        if (
            last &&
            given
        ) {

            return `${last}, ${given}`;
        }

        return (
            last ||
            given ||
            "Unknown Member"
        );
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <section className="client-attendance">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="client-attendance-header">

                <div>

                    <span className="client-attendance-eyebrow">
                        EPIC CHURCH MANAGEMENT SYSTEM
                    </span>

                    <h2>
                        Attendance
                    </h2>

                    <p>
                        Manage attendance records for completed
                        church services.
                    </p>

                </div>

                {onBack && (

                    <button
                        type="button"
                        className="client-attendance-back"
                        onClick={onBack}
                    >
                        ← Dashboard
                    </button>

                )}

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="client-attendance-alert error">

                    <strong>
                        Attention
                    </strong>

                    <span>
                        {error}
                    </span>

                </div>

            )}

            {/* =================================================
                SUCCESS
            ================================================= */}

            {message && !error && (

                <div className="client-attendance-alert success">

                    <strong>
                        ✓
                    </strong>

                    <span>
                        {message}
                    </span>

                </div>

            )}

            {/* =================================================
                SERVICE SELECTOR
            ================================================= */}

            <div className="client-attendance-service-card">

                <div className="client-attendance-service-heading">

                    <div>

                        <span>
                            ATTENDANCE SESSION
                        </span>

                        <h3>
                            Select Church Service
                        </h3>

                    </div>

                </div>

                {loadingServices ? (

                    <div className="client-attendance-loading">
                        Loading completed church services...
                    </div>

                ) : services.length === 0 ? (

                    <div className="client-attendance-empty">

                        <div className="client-attendance-empty-icon">
                            ◷
                        </div>

                        <h3>
                            No Completed Services
                        </h3>

                        <p>
                            Attendance becomes available after
                            a church service is marked as
                            <strong> COMPLETED</strong>.
                        </p>

                    </div>

                ) : (

                    <>

                        <select
                            value={
                                selectedServiceId ??
                                ""
                            }
                            onChange={event => {

                                const value =
                                    Number(
                                        event.target.value
                                    );

                                setSelectedServiceId(
                                    Number.isFinite(
                                        value
                                    ) &&
                                    value > 0
                                        ? value
                                        : null
                                );

                            }}
                            className="client-attendance-service-select"
                        >

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
                                            formatDate(
                                                service.serviceDate
                                            )
                                        }
                                        {" — "}
                                        {
                                            service.serviceName
                                        }
                                    </option>

                                )
                            )}

                        </select>

                        {selectedService && (

                            <div className="client-attendance-service-info">

                                <div>

                                    <span>
                                        SERVICE
                                    </span>

                                    <strong>
                                        {
                                            selectedService.serviceName
                                        }
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        DATE
                                    </span>

                                    <strong>
                                        {
                                            formatDate(
                                                selectedService.serviceDate
                                            )
                                        }
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        LOCATION
                                    </span>

                                    <strong>
                                        {
                                            selectedService.location ||
                                            "Not provided"
                                        }
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        STATUS
                                    </span>

                                    <strong className="completed">
                                        ✓ COMPLETED
                                    </strong>

                                </div>

                            </div>

                        )}

                    </>

                )}

            </div>

            {/* =================================================
                ATTENDANCE AREA
            ================================================= */}

            {selectedServiceId !== null &&
                services.length > 0 && (

                    <>

                        <div className="client-attendance-summary">

                            <article>

                                <span>
                                    TOTAL MEMBERS
                                </span>

                                <strong>
                                    {summary.total}
                                </strong>

                            </article>

                            <article>

                                <span>
                                    PRESENT
                                </span>

                                <strong>
                                    {summary.present}
                                </strong>

                            </article>

                            <article>

                                <span>
                                    LATE
                                </span>

                                <strong>
                                    {summary.late}
                                </strong>

                            </article>

                            <article>

                                <span>
                                    EARLY
                                </span>

                                <strong>
                                    {summary.early}
                                </strong>

                            </article>

                            <article>

                                <span>
                                    ABSENT
                                </span>

                                <strong>
                                    {summary.absent}
                                </strong>

                            </article>

                            <article>

                                <span>
                                    EXCUSED
                                </span>

                                <strong>
                                    {summary.excused}
                                </strong>

                            </article>

                        </div>

                        <div
                            className={`client-attendance-table-card ${
                                canManageAttendance
                                    ? "has-permissions"
                                    : "read-only"
                            }`}
                        >

                            <div className="client-attendance-table-header">

                                <div>

                                    <span>
                                        MEMBER ATTENDANCE
                                    </span>

                                    <h3>
                                        Attendance Records
                                    </h3>

                                </div>

                                <div className="client-attendance-actions">

                                    <input
                                        type="search"
                                        value={search}
                                        onChange={event =>
                                            setSearch(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Search member..."
                                        className="client-attendance-search"
                                        aria-label="Search members"
                                    />

                                    {(canCreate ||
                                        canEdit) && (

                                        <button
                                            type="button"
                                            className="client-attendance-save"
                                            onClick={
                                                saveAttendance
                                            }
                                            disabled={
                                                saving ||
                                                loadingAttendance ||
                                                attendance.length === 0
                                            }
                                        >
                                            {saving
                                                ? "Saving..."
                                                : "Save Attendance"}
                                        </button>

                                    )}

                                </div>

                            </div>

                            {loadingAttendance ? (

                                <div className="client-attendance-loading">
                                    Loading attendance records...
                                </div>

                            ) : filteredAttendance.length === 0 ? (

                                <div className="client-attendance-empty">

                                    <div className="client-attendance-empty-icon">
                                        ◉
                                    </div>

                                    <h3>
                                        No Members Found
                                    </h3>

                                    <p>
                                        No active members are currently
                                        available for this church account.
                                    </p>

                                </div>

                            ) : (

                                <div className="client-attendance-table-wrapper">

                                    <table>

                                        <thead>

                                            <tr>

                                                <th>
                                                    #
                                                </th>

                                                <th>
                                                    MEMBER
                                                </th>

                                                <th>
                                                    MEMBER CODE
                                                </th>

                                                <th>
                                                    STATUS
                                                </th>

                                                {canDelete && (

                                                    <th>
                                                        ACTION
                                                    </th>

                                                )}

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {filteredAttendance.map(
                                                (
                                                    member,
                                                    index
                                                ) => {

                                                    const hasExistingRecord =
                                                        Boolean(
                                                            member.attendanceId
                                                        );

                                                    const canChange =
                                                        hasExistingRecord
                                                            ? canEdit
                                                            : canCreate;

                                                    return (

                                                        <tr
                                                            key={
                                                                member.memberId
                                                            }
                                                        >

                                                            <td>
                                                                {index + 1}
                                                            </td>

                                                            <td>

                                                                <div className="client-attendance-member">

                                                                    <div className="client-attendance-avatar">

                                                                        {
                                                                            getMemberName(
                                                                                member
                                                                            )
                                                                                .charAt(
                                                                                    0
                                                                                )
                                                                                .toUpperCase()
                                                                        }

                                                                    </div>

                                                                    <strong>
                                                                        {
                                                                            getMemberName(
                                                                                member
                                                                            )
                                                                        }
                                                                    </strong>

                                                                </div>

                                                            </td>

                                                            <td>
                                                                {
                                                                    member.memberCode ||
                                                                    "—"
                                                                }
                                                            </td>

                                                            <td>

                                                                <select
                                                                    value={
                                                                        ATTENDANCE_STATUSES.includes(
                                                                            String(
                                                                                member.status ||
                                                                                ""
                                                                            )
                                                                                .trim()
                                                                                .toUpperCase()
                                                                        )
                                                                            ? String(
                                                                                member.status
                                                                            )
                                                                                .trim()
                                                                                .toUpperCase()
                                                                            : "PRESENT"
                                                                    }
                                                                    onChange={event =>
                                                                        updateStatus(
                                                                            member.memberId,
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !canChange ||
                                                                        saving ||
                                                                        deletingId !==
                                                                            null
                                                                    }
                                                                    className={`attendance-status-select status-${String(
                                                                        member.status ||
                                                                        "PRESENT"
                                                                    )
                                                                        .trim()
                                                                        .toLowerCase()}`}
                                                                    aria-label={`Attendance status for ${getMemberName(member)}`}
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

                                                            {canDelete && (

                                                                <td>

                                                                    {member.attendanceId ? (

                                                                        <button
                                                                            type="button"
                                                                            className="client-attendance-delete"
                                                                            onClick={() =>
                                                                                deleteAttendance(
                                                                                    member.attendanceId!
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                deletingId ===
                                                                                member.attendanceId
                                                                            }
                                                                        >
                                                                            {deletingId ===
                                                                            member.attendanceId
                                                                                ? "Deleting..."
                                                                                : "Delete"}
                                                                        </button>

                                                                    ) : (

                                                                        <span className="client-attendance-no-record">
                                                                            —
                                                                        </span>

                                                                    )}

                                                                </td>

                                                            )}

                                                        </tr>

                                                    );
                                                }
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            )}

                        </div>

                    </>

                )}

        </section>
    );
};

export default ClientAttendance;

