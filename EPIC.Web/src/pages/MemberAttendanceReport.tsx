import { API_BASE_URL } from "../config";
import React, { useEffect, useMemo, useState } from "react";
import "./MemberAttendanceReport.css";


type AttendanceStatus =
    | "PRESENT"
    | "LATE"
    | "EARLY"
    | "ABSENT"
    | "EXCUSED";

interface AttendanceRecord {
    attendanceId: number;
    memberId: number;
    churchServiceId?: number;
    attendanceDate: string;
    status: AttendanceStatus;
    service?: string;

    member?: {
        memberId?: number;
        memberCode?: string;
        firstName?: string;
        middleName?: string;
        lastName?: string;
        status?: string;
    };

    churchService?: {
        churchServiceId?: number;
        serviceName?: string;
        serviceDate?: string;
    };
}

interface MemberSummary {
    memberId: number;
    memberCode: string;
    name: string;
    total: number;
    present: number;
    late: number;
    early: number;
    absent: number;
    excused: number;
    percentage: number;
    classification: string;
}

const getToken = (): string | null =>
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("epicToken");

const getHeaders = (): HeadersInit => {
    const token = getToken();

    return {
        Accept: "application/json",
        ...(token
            ? { Authorization: `Bearer ${token}` }
            : {}),
    };
};

const getMemberName = (record: AttendanceRecord): string => {
    const member = record.member;

    if (!member) {
        return `Member #${record.memberId}`;
    }

    return (
        [
            member.firstName,
            member.middleName,
            member.lastName,
        ]
            .filter(Boolean)
            .join(" ")
            .trim() || `Member #${record.memberId}`
    );
};

const getServiceName = (record: AttendanceRecord): string =>
    record.churchService?.serviceName ||
    record.service ||
    "Church Service";

const getClassification = (percentage: number): string => {
    if (percentage >= 90) return "EXCELLENT";
    if (percentage >= 75) return "GOOD";
    if (percentage >= 60) return "NEEDS FOLLOW-UP";
    return "PASTORAL FOLLOW-UP";
};

const getClassificationClass = (
    percentage: number
): string => {
    if (percentage >= 90) return "excellent";
    if (percentage >= 75) return "good";
    if (percentage >= 60) return "needs-follow-up";
    return "pastoral-follow-up";
};

const formatDate = (value: string): string => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const MemberAttendanceReport: React.FC = () => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [serviceFilter, setServiceFilter] = useState("ALL");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [selectedMemberId, setSelectedMemberId] =
        useState<number | null>(null);

    const loadAttendance = async () => {
        try {
            setLoading(true);
            setError("");

            const token = getToken();

            if (!token) {
                throw new Error(
                    "You are not logged in. Please login again."
                );
            }

            const response = await fetch(
                `${API_BASE_URL}/Attendance`,
                {
                    method: "GET",
                    headers: getHeaders(),
                }
            );

            if (response.status === 401) {
                throw new Error(
                    "Your session has expired. Please login again."
                );
            }

            if (!response.ok) {
                const text = await response.text();

                throw new Error(
                    text ||
                    `Failed to load attendance. HTTP ${response.status}`
                );
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error(
                    "The attendance API returned an unexpected response."
                );
            }

            setRecords(data);
        } catch (err) {
            console.error(
                "MEMBER ATTENDANCE ERROR:",
                err
            );

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
        loadAttendance();
    }, []);

    const services = useMemo(() => {
        return Array.from(
            new Set(
                records.map(getServiceName)
            )
        ).sort((a, b) =>
            a.localeCompare(b)
        );
    }, [records]);

    const filteredRecords = useMemo(() => {
        const keyword = search
            .trim()
            .toLowerCase();

        return records.filter((record) => {
            const memberName =
                getMemberName(record).toLowerCase();

            const memberCode =
                record.member?.memberCode
                    ?.toLowerCase() || "";

            const serviceName =
                getServiceName(record);

            const recordDate =
                record.attendanceDate?.substring(
                    0,
                    10
                ) || "";

            const matchesSearch =
                !keyword ||
                memberName.includes(keyword) ||
                memberCode.includes(keyword);

            const matchesService =
                serviceFilter === "ALL" ||
                serviceName === serviceFilter;

            const matchesFrom =
                !dateFrom ||
                recordDate >= dateFrom;

            const matchesTo =
                !dateTo ||
                recordDate <= dateTo;

            return (
                matchesSearch &&
                matchesService &&
                matchesFrom &&
                matchesTo
            );
        });
    }, [
        records,
        search,
        serviceFilter,
        dateFrom,
        dateTo,
    ]);

    const memberSummaries = useMemo(() => {
        const map =
            new Map<number, MemberSummary>();

        filteredRecords.forEach((record) => {
            const memberId = record.memberId;

            if (!map.has(memberId)) {
                map.set(memberId, {
                    memberId,
                    memberCode:
                        record.member?.memberCode ||
                        `MEM-${memberId}`,
                    name: getMemberName(record),
                    total: 0,
                    present: 0,
                    late: 0,
                    early: 0,
                    absent: 0,
                    excused: 0,
                    percentage: 0,
                    classification:
                        "PASTORAL FOLLOW-UP",
                });
            }

            const member = map.get(memberId)!;

            member.total++;

            switch (record.status) {
                case "PRESENT":
                    member.present++;
                    break;

                case "LATE":
                    member.late++;
                    break;

                case "EARLY":
                    member.early++;
                    break;

                case "ABSENT":
                    member.absent++;
                    break;

                case "EXCUSED":
                    member.excused++;
                    break;
            }
        });

        return Array.from(map.values())
            .map((member) => {
                const attended =
                    member.present +
                    member.late +
                    member.early;

                const percentage =
                    member.total > 0
                        ? Math.round(
                            (attended /
                                member.total) *
                            100
                        )
                        : 0;

                return {
                    ...member,
                    percentage,
                    classification:
                        getClassification(
                            percentage
                        ),
                };
            })
            .sort((a, b) =>
                a.name.localeCompare(b.name)
            );
    }, [filteredRecords]);

    const statistics = useMemo(() => {
        const total = filteredRecords.length;

        const present = filteredRecords.filter(
            (r) => r.status === "PRESENT"
        ).length;

        const late = filteredRecords.filter(
            (r) => r.status === "LATE"
        ).length;

        const early = filteredRecords.filter(
            (r) => r.status === "EARLY"
        ).length;

        const absent = filteredRecords.filter(
            (r) => r.status === "ABSENT"
        ).length;

        const excused = filteredRecords.filter(
            (r) => r.status === "EXCUSED"
        ).length;

        const attended =
            present + late + early;

        const percentage =
            total > 0
                ? Math.round(
                    (attended / total) * 100
                )
                : 0;

        return {
            total,
            present,
            late,
            early,
            absent,
            excused,
            attended,
            percentage,
        };
    }, [filteredRecords]);

    const selectedMember =
        selectedMemberId === null
            ? null
            : memberSummaries.find(
                (member) =>
                    member.memberId ===
                    selectedMemberId
            ) || null;

    const selectedMemberHistory = useMemo(() => {
        if (selectedMemberId === null) {
            return [];
        }

        return filteredRecords
            .filter(
                (record) =>
                    record.memberId ===
                    selectedMemberId
            )
            .sort(
                (a, b) =>
                    new Date(
                        b.attendanceDate
                    ).getTime() -
                    new Date(
                        a.attendanceDate
                    ).getTime()
            );
    }, [
        filteredRecords,
        selectedMemberId,
    ]);

    const clearFilters = () => {
        setSearch("");
        setServiceFilter("ALL");
        setDateFrom("");
        setDateTo("");
    };

    const printReport = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="mar-loading-page">
                <div className="mar-loading-spinner" />

                <h2>
                    Loading Member Attendance
                </h2>

                <p>
                    Retrieving real attendance
                    records from EPIC database...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mar-error-page">
                <div className="mar-error-icon">
                    !
                </div>

                <h2>
                    Unable to Load Attendance
                </h2>

                <p>{error}</p>

                <button
                    className="mar-primary-button"
                    onClick={loadAttendance}
                >
                    ↻ Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="member-attendance-report">
            <div className="mar-page-header">
                <div>
                    <div className="mar-eyebrow">
                        EPIC PASTORAL ANALYTICS
                    </div>

                    <h1>
                        Member Attendance
                    </h1>

                    <p>
                        Monitor member participation,
                        identify attendance trends,
                        and provide pastoral follow-up.
                    </p>
                </div>

                <div className="mar-header-actions">
                    <button
                        className="mar-secondary-button"
                        onClick={loadAttendance}
                    >
                        ↻ Refresh
                    </button>

                    <button
                        className="mar-primary-button"
                        onClick={printReport}
                    >
                        🖨 Print Report
                    </button>
                </div>
            </div>

            <div className="mar-filter-panel">
                <div className="mar-filter-title">
                    <span>⌕</span>
                    Attendance Filters
                </div>

                <div className="mar-filter-grid">
                    <div className="mar-field">
                        <label>
                            Search Member
                        </label>

                        <div className="mar-input-icon">
                            <span>🔎</span>

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search member name or code..."
                            />
                        </div>
                    </div>

                    <div className="mar-field">
                        <label>
                            Service
                        </label>

                        <select
                            value={serviceFilter}
                            onChange={(e) =>
                                setServiceFilter(
                                    e.target.value
                                )
                            }
                        >
                            <option value="ALL">
                                All Services
                            </option>

                            {services.map(
                                (service) => (
                                    <option
                                        key={service}
                                        value={service}
                                    >
                                        {service}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div className="mar-field">
                        <label>
                            From Date
                        </label>

                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) =>
                                setDateFrom(
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <div className="mar-field">
                        <label>
                            To Date
                        </label>

                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) =>
                                setDateTo(
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <div className="mar-filter-button">
                        <button
                            type="button"
                            onClick={clearFilters}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            <div className="mar-stat-grid">
                <div className="mar-stat-card total">
                    <div className="mar-stat-icon">
                        👥
                    </div>

                    <div>
                        <span>
                            Attendance Records
                        </span>

                        <strong>
                            {statistics.total}
                        </strong>
                    </div>
                </div>

                <div className="mar-stat-card present">
                    <div className="mar-stat-icon">
                        ✓
                    </div>

                    <div>
                        <span>Present</span>
                        <strong>
                            {statistics.present}
                        </strong>
                    </div>
                </div>

                <div className="mar-stat-card late">
                    <div className="mar-stat-icon">
                        ⏱
                    </div>

                    <div>
                        <span>Late</span>
                        <strong>
                            {statistics.late}
                        </strong>
                    </div>
                </div>

                <div className="mar-stat-card early">
                    <div className="mar-stat-icon">
                        ↗
                    </div>

                    <div>
                        <span>Early</span>
                        <strong>
                            {statistics.early}
                        </strong>
                    </div>
                </div>

                <div className="mar-stat-card absent">
                    <div className="mar-stat-icon">
                        !
                    </div>

                    <div>
                        <span>Absent</span>
                        <strong>
                            {statistics.absent}
                        </strong>
                    </div>
                </div>

                <div className="mar-stat-card excused">
                    <div className="mar-stat-icon">
                        ✓
                    </div>

                    <div>
                        <span>Excused</span>
                        <strong>
                            {statistics.excused}
                        </strong>
                    </div>
                </div>
            </div>

            <div className="mar-overview-grid">
                <div className="mar-overview-card">
                    <div className="mar-overview-label">
                        Overall Attendance
                    </div>

                    <div className="mar-overview-value">
                        {statistics.percentage}%
                    </div>

                    <div className="mar-progress">
                        <div
                            style={{
                                width: `${statistics.percentage}%`,
                            }}
                        />
                    </div>

                    <div className="mar-overview-note">
                        {statistics.attended} attended
                        records out of{" "}
                        {statistics.total}
                    </div>
                </div>

                <div className="mar-overview-card">
                    <div className="mar-overview-label">
                        Members Tracked
                    </div>

                    <div className="mar-overview-value">
                        {memberSummaries.length}
                    </div>

                    <div className="mar-overview-note">
                        Members with attendance
                        records in the selected period.
                    </div>
                </div>

                <div className="mar-overview-card">
                    <div className="mar-overview-label">
                        Pastoral Attention
                    </div>

                    <div className="mar-overview-value pastoral">
                        {
                            memberSummaries.filter(
                                (member) =>
                                    member.percentage <
                                    60
                            ).length
                        }
                    </div>

                    <div className="mar-overview-note">
                        Members below 60%
                        attendance.
                    </div>
                </div>
            </div>

            <div className="mar-panel">
                <div className="mar-panel-header">
                    <div>
                        <h2>
                            Member Attendance Overview
                        </h2>

                        <p>
                            Real attendance records
                            retrieved from EPIC.
                        </p>
                    </div>

                    <div className="mar-record-count">
                        {memberSummaries.length} members
                    </div>
                </div>

                <div className="mar-table-wrapper">
                    <table className="mar-table">
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>
                                    Attendance %
                                </th>
                                <th>Present</th>
                                <th>Late</th>
                                <th>Early</th>
                                <th>Absent</th>
                                <th>Excused</th>
                                <th>
                                    Pastoral Status
                                </th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {memberSummaries.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="mar-empty"
                                    >
                                        No attendance
                                        records found
                                        for the selected
                                        filters.
                                    </td>
                                </tr>
                            ) : (
                                memberSummaries.map(
                                    (member) => (
                                        <tr
                                            key={
                                                member.memberId
                                            }
                                        >
                                            <td>
                                                <div className="mar-member">
                                                    <div className="mar-avatar">
                                                        {member.name
                                                            .charAt(
                                                                0
                                                            )
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {
                                                                member.name
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                member.memberCode
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="mar-percentage">
                                                    <strong>
                                                        {
                                                            member.percentage
                                                        }
                                                        %
                                                    </strong>

                                                    <div className="mar-mini-progress">
                                                        <div
                                                            className={getClassificationClass(
                                                                member.percentage
                                                            )}
                                                            style={{
                                                                width: `${member.percentage}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="mar-number present">
                                                    {
                                                        member.present
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span className="mar-number late">
                                                    {
                                                        member.late
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span className="mar-number early">
                                                    {
                                                        member.early
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span className="mar-number absent">
                                                    {
                                                        member.absent
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span className="mar-number excused">
                                                    {
                                                        member.excused
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`mar-status ${getClassificationClass(
                                                        member.percentage
                                                    )}`}
                                                >
                                                    {
                                                        member.classification
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="mar-view-button"
                                                    onClick={() =>
                                                        setSelectedMemberId(
                                                            member.memberId
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedMember && (
                <div className="mar-panel mar-history-panel">
                    <div className="mar-panel-header">
                        <div>
                            <h2>
                                {selectedMember.name}
                            </h2>

                            <p>
                                Individual attendance
                                history
                            </p>
                        </div>

                        <button
                            type="button"
                            className="mar-close-button"
                            onClick={() =>
                                setSelectedMemberId(
                                    null
                                )
                            }
                        >
                            ×
                        </button>
                    </div>

                    <div className="mar-member-summary">
                        <div>
                            <span>Attendance</span>
                            <strong>
                                {
                                    selectedMember.percentage
                                }
                                %
                            </strong>
                        </div>

                        <div>
                            <span>Present</span>
                            <strong>
                                {
                                    selectedMember.present
                                }
                            </strong>
                        </div>

                        <div>
                            <span>Late</span>
                            <strong>
                                {
                                    selectedMember.late
                                }
                            </strong>
                        </div>

                        <div>
                            <span>Early</span>
                            <strong>
                                {
                                    selectedMember.early
                                }
                            </strong>
                        </div>

                        <div>
                            <span>Absent</span>
                            <strong>
                                {
                                    selectedMember.absent
                                }
                            </strong>
                        </div>

                        <div>
                            <span>Excused</span>
                            <strong>
                                {
                                    selectedMember.excused
                                }
                            </strong>
                        </div>
                    </div>

                    <div className="mar-table-wrapper">
                        <table className="mar-table history">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>
                                        Church Service
                                    </th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {selectedMemberHistory.length ===
                                    0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="mar-empty"
                                        >
                                            No attendance
                                            history found.
                                        </td>
                                    </tr>
                                ) : (
                                    selectedMemberHistory.map(
                                        (record) => (
                                            <tr
                                                key={
                                                    record.attendanceId
                                                }
                                            >
                                                <td>
                                                    {formatDate(
                                                        record.attendanceDate
                                                    )}
                                                </td>

                                                <td>
                                                    {getServiceName(
                                                        record
                                                    )}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`mar-status status-${record.status.toLowerCase()}`}
                                                    >
                                                        {
                                                            record.status
                                                        }
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="mar-panel">
                <div className="mar-panel-header">
                    <div>
                        <h2>
                            Pastoral Attendance
                            Classification
                        </h2>

                        <p>
                            Use attendance trends as a
                            guide for pastoral care and
                            member follow-up.
                        </p>
                    </div>
                </div>

                <div className="mar-classification-grid">
                    <div className="mar-classification excellent">
                        <div className="mar-classification-icon">
                            🟢
                        </div>

                        <div>
                            <strong>
                                EXCELLENT
                            </strong>

                            <span>
                                90–100%
                            </span>
                        </div>
                    </div>

                    <div className="mar-classification good">
                        <div className="mar-classification-icon">
                            🔵
                        </div>

                        <div>
                            <strong>GOOD</strong>
                            <span>
                                75–89%
                            </span>
                        </div>
                    </div>

                    <div className="mar-classification needs-follow-up">
                        <div className="mar-classification-icon">
                            🟡
                        </div>

                        <div>
                            <strong>
                                NEEDS FOLLOW-UP
                            </strong>

                            <span>
                                60–74%
                            </span>
                        </div>
                    </div>

                    <div className="mar-classification pastoral-follow-up">
                        <div className="mar-classification-icon">
                            🔴
                        </div>

                        <div>
                            <strong>
                                PASTORAL FOLLOW-UP
                            </strong>

                            <span>
                                Below 60%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mar-footer-note">
                <span>
                    EPIC Church Management System
                </span>

                <span>
                    Engaging People Into Christ
                </span>
            </div>
        </div>
    );
};

export default MemberAttendanceReport;