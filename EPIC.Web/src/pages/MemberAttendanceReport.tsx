
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
    useRef,
} from "react";

import axios from "axios";
import { API_BASE_URL } from "../config";
import "./MemberAttendanceReport.css";
import {
    Calendar,
    ChevronDown,
    Search,
    Check,
    X,
    Filter
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

type AttendanceStatus =
    | "PRESENT"
    | "LATE"
    | "EARLY"
    | "ABSENT"
    | "EXCUSED";

interface AttendanceRecord {
    attendanceId: number;
    memberId: number;

    memberCode?: string | null;
    memberName?: string | null;

    churchServiceId?: number | null;
    eventId?: number | null;

    serviceName?: string | null;
    service?: string | null;

    attendanceDate: string;
    status: AttendanceStatus;

    recordedBy?: string | null;
    recordedDate?: string | null;
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

interface ChurchServiceItem {
    churchServiceId: number;
    serviceName: string;
    serviceDate: string;
    startTime?: string;
    endTime?: string;
    status?: string;
}

interface MemberAttendanceReportProps {
    onBack?: () => void;
}

const getServiceCategory = (
    service: ChurchServiceItem
): "COMPLETED" | "UPCOMING" | "TODAY" | "CANCELLED" => {
    const rawStatus = (service.status || "").toUpperCase();
    if (rawStatus === "CANCELLED" || rawStatus === "CANCELED") return "CANCELLED";
    if (rawStatus === "COMPLETED" || rawStatus === "ENDED" || rawStatus === "FINISHED") return "COMPLETED";

    if (service.serviceDate) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const sDateStr = service.serviceDate.slice(0, 10);
        if (sDateStr === todayStr) return "TODAY";
        if (sDateStr < todayStr) return "COMPLETED";
        return "UPCOMING";
    }

    if (rawStatus === "UPCOMING" || rawStatus === "SCHEDULED") return "UPCOMING";
    return "COMPLETED";
};

const formatDropdownDate = (dateStr?: string): string => {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
        if (Number.isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
        return dateStr;
    }
};

const getRelativeDropdownLabel = (dateStr?: string): string | null => {
    if (!dateStr) return null;
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
        target.setHours(0, 0, 0, 0);
        const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Tomorrow";
        if (diffDays === -1) return "Yesterday";
        if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
        if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
        return null;
    } catch {
        return null;
    }
};

// ============================================================
// AUTH
// ============================================================

const getToken = (): string | null => {
    const keys = [
        "token",
        "accessToken",
        "jwt",
        "authToken",
        "epicToken",
    ];

    for (const key of keys) {
        const token = localStorage.getItem(key);

        if (token?.trim()) {
            return token;
        }
    }

    return null;
};

const getAuthConfig = () => {
    const token = getToken();

    if (!token) {
        return {};
    }

    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

// ============================================================
// HELPERS
// ============================================================

const getMemberName = (
    record: AttendanceRecord
): string => {
    return (
        record.memberName?.trim() ||
        `Member #${record.memberId}`
    );
};

const getMemberCode = (
    record: AttendanceRecord
): string => {
    return (
        record.memberCode?.trim() ||
        `MEM-${record.memberId}`
    );
};

const getServiceName = (
    record: AttendanceRecord
): string => {
    return (
        record.serviceName?.trim() ||
        record.service?.trim() ||
        "Church Service"
    );
};

const normalizeStatus = (
    value: unknown
): AttendanceStatus => {
    switch (
        String(value ?? "")
            .trim()
            .toUpperCase()
    ) {
        case "PRESENT":
            return "PRESENT";

        case "LATE":
            return "LATE";

        case "EARLY":
            return "EARLY";

        case "EXCUSED":
            return "EXCUSED";

        case "ABSENT":
        default:
            return "ABSENT";
    }
};

const normalizeAttendanceRecord = (
    record: AttendanceRecord
): AttendanceRecord => {
    return {
        ...record,
        attendanceId: Number(record.attendanceId),
        memberId: Number(record.memberId),
        status: normalizeStatus(record.status),
    };
};

const getClassification = (
    percentage: number
): string => {
    if (percentage >= 90) {
        return "EXCELLENT";
    }

    if (percentage >= 75) {
        return "GOOD";
    }

    if (percentage >= 60) {
        return "NEEDS FOLLOW-UP";
    }

    return "PASTORAL FOLLOW-UP";
};

const getClassificationClass = (
    percentage: number
): string => {
    if (percentage >= 90) {
        return "excellent";
    }

    if (percentage >= 75) {
        return "good";
    }

    if (percentage >= 60) {
        return "needs-follow-up";
    }

    return "pastoral-follow-up";
};

const formatDate = (
    value?: string | null
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
            year: "numeric",
            month: "long",
            day: "numeric",
        }
    );
};

const escapeHtml = (
    value: unknown
): string => {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const getStatusLabel = (
    status: AttendanceStatus
): string => {
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
            return status;
    }
};

// ============================================================
// COMPONENT
// ============================================================

const MemberAttendanceReport: React.FC<
    MemberAttendanceReportProps
> = ({ onBack }) => {

    // ========================================================
    // STATE
    // ========================================================

    const [records, setRecords] =
        useState<AttendanceRecord[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [serviceFilter, setServiceFilter] =
        useState("ALL");

    const [dateFrom, setDateFrom] =
        useState("");

    const [dateTo, setDateTo] =
        useState("");

    // Custom church service dropdown & classification filter states
    const [churchServicesList, setChurchServicesList] =
        useState<ChurchServiceItem[]>([]);

    const [isServiceDropdownOpen, setIsServiceDropdownOpen] =
        useState(false);

    const [serviceSearchQuery, setServiceSearchQuery] =
        useState("");

    const [serviceCategoryFilter, setServiceCategoryFilter] =
        useState<"ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED">("ALL");

    const [classificationFilter, setClassificationFilter] =
        useState<"ALL" | "EXCELLENT" | "GOOD" | "NEEDS_FOLLOW_UP" | "PASTORAL_FOLLOW_UP">("ALL");

    const serviceDropdownRef =
        useRef<HTMLDivElement | null>(null);

    // ========================================================
    // VIEW-ONLY MEMBER STATE
    // ========================================================

    const [selectedMemberId, setSelectedMemberId] =
        useState<number | null>(null);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                serviceDropdownRef.current &&
                !serviceDropdownRef.current.contains(event.target as Node)
            ) {
                setIsServiceDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Load Church Services catalog
    useEffect(() => {
        const controller = new AbortController();
        const fetchChurchServices = async () => {
            try {
                const response = await axios.get(
                    `${API_BASE_URL}/ChurchServices`,
                    {
                        ...getAuthConfig(),
                        signal: controller.signal
                    }
                );
                const data = Array.isArray(response.data)
                    ? response.data
                    : Array.isArray(response.data?.services)
                        ? response.data.services
                        : Array.isArray(response.data?.data)
                            ? response.data.data
                            : [];
                setChurchServicesList(data);
            } catch {
                // Silently fallback to services extracted from attendance records
            }
        };
        void fetchChurchServices();
        return () => controller.abort();
    }, []);

    // ========================================================
    // LOAD ATTENDANCE
    // ========================================================

    const loadAttendance =
        useCallback(async () => {

            try {

                setLoading(true);

                setError("");

                if (!getToken()) {
                    throw new Error(
                        "You are not logged in. Please login again."
                    );
                }

                const response =
                    await axios.get(
                        `${API_BASE_URL}/Attendance`,
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

                const normalized =
                    data.map(
                        (
                            item: AttendanceRecord
                        ) =>
                            normalizeAttendanceRecord(
                                item
                            )
                    );

                setRecords(normalized);

            } catch (err: any) {

                console.error(
                    "Member attendance error:",
                    err
                );

                if (
                    err?.response?.status === 401
                ) {

                    setError(
                        "Your session has expired. Please login again."
                    );

                } else if (
                    err?.response?.status === 403
                ) {

                    setError(
                        "You do not have permission to view attendance reports."
                    );

                } else {

                    setError(
                        err?.response?.data?.message ||
                        err?.message ||
                        "Unable to load attendance records."
                    );
                }

            } finally {

                setLoading(false);

            }

        }, []);

    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {
        void loadAttendance();
    }, [loadAttendance]);

    // ========================================================
    // ALL CHURCH SERVICES (METADATA + ATTENDANCE RECORDS)
    // ========================================================

    const allServices = useMemo(() => {
        const map = new Map<string, ChurchServiceItem>();

        churchServicesList.forEach(s => {
            if (s.serviceName) {
                map.set(s.serviceName.trim().toLowerCase(), s);
            }
        });

        records.forEach(record => {
            const sName = getServiceName(record);
            const key = sName.trim().toLowerCase();
            if (!map.has(key) && sName !== "Church Service") {
                map.set(key, {
                    churchServiceId: record.churchServiceId || 0,
                    serviceName: sName,
                    serviceDate: record.attendanceDate?.slice(0, 10) || "",
                    status: "Completed"
                });
            }
        });

        return Array.from(map.values()).sort((a, b) => {
            if (a.serviceDate && b.serviceDate) {
                return b.serviceDate.localeCompare(a.serviceDate);
            }
            return a.serviceName.localeCompare(b.serviceName);
        });
    }, [churchServicesList, records]);

    const selectedServiceObj = useMemo(() => {
        if (serviceFilter === "ALL") return null;
        return (
            allServices.find(
                s =>
                    s.serviceName.toLowerCase() ===
                    serviceFilter.toLowerCase()
            ) || null
        );
    }, [allServices, serviceFilter]);

    const upcomingServicesCount = useMemo(
        () =>
            allServices.filter(s =>
                ["UPCOMING", "TODAY"].includes(getServiceCategory(s))
            ).length,
        [allServices]
    );

    const completedServicesCount = useMemo(
        () =>
            allServices.filter(
                s => getServiceCategory(s) === "COMPLETED"
            ).length,
        [allServices]
    );

    const cancelledServicesCount = useMemo(
        () =>
            allServices.filter(
                s => getServiceCategory(s) === "CANCELLED"
            ).length,
        [allServices]
    );

    const filteredDropdownServices = useMemo(() => {
        return allServices.filter(s => {
            const cat = getServiceCategory(s);
            if (
                serviceCategoryFilter === "UPCOMING" &&
                cat !== "UPCOMING" &&
                cat !== "TODAY"
            ) {
                return false;
            }
            if (
                serviceCategoryFilter === "COMPLETED" &&
                cat !== "COMPLETED"
            ) {
                return false;
            }
            if (
                serviceCategoryFilter === "CANCELLED" &&
                cat !== "CANCELLED"
            ) {
                return false;
            }

            if (serviceSearchQuery.trim()) {
                const q = serviceSearchQuery.toLowerCase();
                const text = `${s.serviceName} ${s.serviceDate || ""} ${s.status || ""}`.toLowerCase();
                return text.includes(q);
            }
            return true;
        });
    }, [allServices, serviceCategoryFilter, serviceSearchQuery]);

    // ========================================================
    // FILTER RECORDS
    // ========================================================

    const filteredRecords =
        useMemo(() => {

            const keyword =
                search
                    .trim()
                    .toLowerCase();

            return records.filter(
                record => {

                    const memberName =
                        getMemberName(
                            record
                        ).toLowerCase();

                    const memberCode =
                        getMemberCode(
                            record
                        ).toLowerCase();

                    const service =
                        getServiceName(
                            record
                        );

                    const recordDate =
                        record.attendanceDate
                            ?.substring(0, 10) ||
                        "";

                    const matchesSearch =
                        !keyword ||
                        memberName.includes(
                            keyword
                        ) ||
                        memberCode.includes(
                            keyword
                        );

                    const matchesService =
                        serviceFilter ===
                            "ALL" ||
                        service.toLowerCase() ===
                            serviceFilter.toLowerCase() ||
                        (selectedServiceObj &&
                            record.churchServiceId &&
                            record.churchServiceId ===
                                selectedServiceObj.churchServiceId);

                    const matchesFrom =
                        !dateFrom ||
                        recordDate >=
                            dateFrom;

                    const matchesTo =
                        !dateTo ||
                        recordDate <=
                            dateTo;

                    return (
                        matchesSearch &&
                        matchesService &&
                        matchesFrom &&
                        matchesTo
                    );
                }
            );

        }, [
            records,
            search,
            serviceFilter,
            selectedServiceObj,
            dateFrom,
            dateTo,
        ]);

    // ========================================================
    // MEMBER SUMMARIES
    // ========================================================

    const memberSummaries =
        useMemo(() => {

            const map =
                new Map<
                    number,
                    MemberSummary
                >();

            filteredRecords.forEach(
                record => {

                    if (
                        !map.has(
                            record.memberId
                        )
                    ) {

                        map.set(
                            record.memberId,
                            {
                                memberId:
                                    record.memberId,

                                memberCode:
                                    getMemberCode(
                                        record
                                    ),

                                name:
                                    getMemberName(
                                        record
                                    ),

                                total: 0,

                                present: 0,

                                late: 0,

                                early: 0,

                                absent: 0,

                                excused: 0,

                                percentage: 0,

                                classification:
                                    "PASTORAL FOLLOW-UP",
                            }
                        );
                    }

                    const member =
                        map.get(
                            record.memberId
                        );

                    if (!member) {
                        return;
                    }

                    member.total++;

                    switch (
                        record.status
                    ) {

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
                }
            );

            return Array.from(
                map.values()
            )
                .map(member => {

                    const attended =
                        member.present +
                        member.late +
                        member.early;

                    const percentage =
                        member.total > 0
                            ? Math.round(
                                (
                                    attended /
                                    member.total
                                ) * 100
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
                .sort(
                    (a, b) =>
                        a.name.localeCompare(
                            b.name
                        )
                );

        }, [filteredRecords]);

    // Filtered by performance classification tab
    const displayedMemberSummaries = useMemo(() => {
        return memberSummaries.filter(m => {
            if (classificationFilter === "EXCELLENT") {
                return m.percentage >= 90;
            }
            if (classificationFilter === "GOOD") {
                return m.percentage >= 75 && m.percentage < 90;
            }
            if (classificationFilter === "NEEDS_FOLLOW_UP") {
                return m.percentage >= 60 && m.percentage < 75;
            }
            if (classificationFilter === "PASTORAL_FOLLOW_UP") {
                return m.percentage < 60;
            }
            return true;
        });
    }, [memberSummaries, classificationFilter]);

    const excellentCount = useMemo(
        () => memberSummaries.filter(m => m.percentage >= 90).length,
        [memberSummaries]
    );

    const goodCount = useMemo(
        () => memberSummaries.filter(m => m.percentage >= 75 && m.percentage < 90).length,
        [memberSummaries]
    );

    const needsFollowUpCount = useMemo(
        () => memberSummaries.filter(m => m.percentage >= 60 && m.percentage < 75).length,
        [memberSummaries]
    );

    const pastoralCount = useMemo(
        () => memberSummaries.filter(m => m.percentage < 60).length,
        [memberSummaries]
    );

    // ========================================================
    // SELECTED MEMBER
    // ========================================================

    const selectedMember =
        useMemo(
            () =>
                selectedMemberId === null
                    ? null
                    : memberSummaries.find(
                        member =>
                            member.memberId ===
                            selectedMemberId
                    ) || null,
            [
                memberSummaries,
                selectedMemberId,
            ]
        );

    // ========================================================
    // SELECTED MEMBER RECORDS
    // ========================================================

    const selectedMemberRecords =
        useMemo(() => {

            if (!selectedMemberId) {
                return [];
            }

            return records
                .filter(
                    record =>
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
            records,
            selectedMemberId,
        ]);

    // ========================================================
    // OVERALL STATISTICS
    // ========================================================

    const statistics =
        useMemo(() => {

            const result = {
                total: filteredRecords.length,
                present: 0,
                late: 0,
                early: 0,
                absent: 0,
                excused: 0,
                attended: 0,
                percentage: 0,
            };

            filteredRecords.forEach(
                record => {

                    switch (
                        record.status
                    ) {

                        case "PRESENT":
                            result.present++;
                            result.attended++;
                            break;

                        case "LATE":
                            result.late++;
                            result.attended++;
                            break;

                        case "EARLY":
                            result.early++;
                            result.attended++;
                            break;

                        case "ABSENT":
                            result.absent++;
                            break;

                        case "EXCUSED":
                            result.excused++;
                            break;
                    }
                }
            );

            result.percentage =
                result.total > 0
                    ? Math.round(
                        (
                            result.attended /
                            result.total
                        ) * 100
                    )
                    : 0;

            return result;

        }, [filteredRecords]);

    // ========================================================
    // ATTENDANCE DISTRIBUTION
    // ========================================================

    const attendanceDistribution =
        useMemo(() => {

            const total =
                statistics.total;

            const getPercentage =
                (value: number) =>
                    total > 0
                        ? Math.round(
                            (
                                value /
                                total
                            ) * 100
                        )
                        : 0;

            return {
                present:
                    getPercentage(
                        statistics.present
                    ),

                late:
                    getPercentage(
                        statistics.late
                    ),

                early:
                    getPercentage(
                        statistics.early
                    ),

                absent:
                    getPercentage(
                        statistics.absent
                    ),

                excused:
                    getPercentage(
                        statistics.excused
                    ),
            };

        }, [statistics]);

    // ========================================================
    // PASTORAL FOLLOW-UP
    // ========================================================

    const pastoralAttentionCount =
        useMemo(
            () =>
                memberSummaries.filter(
                    member =>
                        member.percentage <
                        60
                ).length,
            [memberSummaries]
        );

    // ========================================================
    // HIGH PERFORMANCE MEMBERS
    // ========================================================

    const excellentMembers =
        useMemo(
            () =>
                memberSummaries.filter(
                    member =>
                        member.percentage >=
                        90
                ).length,
            [memberSummaries]
        );

  
 
    // ========================================================
    // PRINT PERIOD
    // ========================================================

    const printPeriod =
        useMemo(() => {

            if (
                dateFrom &&
                dateTo
            ) {

                return `${formatDate(
                    dateFrom
                )} — ${formatDate(
                    dateTo
                )}`;

            }

            if (dateFrom) {

                return `${formatDate(
                    dateFrom
                )} — Present`;

            }

            if (dateTo) {

                return `Beginning — ${formatDate(
                    dateTo
                )}`;

            }

            return "All Dates";

        }, [
            dateFrom,
            dateTo,
        ]);

    // ========================================================
    // RESET FILTERS
    // ========================================================

    const resetFilters = () => {

        setSearch("");

        setServiceFilter("ALL");

        setDateFrom("");

        setDateTo("");

        setClassificationFilter("ALL");

    };

    // ========================================================
    // PRINT REPORT
    // ========================================================

    const handlePrint = () => {

        if (
            memberSummaries.length === 0
        ) {

            alert(
                "There are no member attendance records to print."
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

        const generated =
            new Date().toLocaleString(
                "en-US",
                {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                }
            );

        const serviceLabel =
            serviceFilter === "ALL"
                ? "All Church Services"
                : serviceFilter;

        const rows =
            memberSummaries
                .map(
                    (
                        member,
                        index
                    ) => {

                        const classificationClass =
                            getClassificationClass(
                                member.percentage
                            );

                        return `
                            <tr>
                                <td class="number">
                                    ${index + 1}
                                </td>

                                <td>
                                    <strong>
                                        ${escapeHtml(
                                            member.memberCode
                                        )}
                                    </strong>
                                </td>

                                <td>
                                    <strong class="member-name">
                                        ${escapeHtml(
                                            member.name
                                        )}
                                    </strong>
                                </td>

                                <td class="center percentage">
                                    ${member.percentage}%
                                </td>

                                <td class="center present">
                                    ${member.present}
                                </td>

                                <td class="center late">
                                    ${member.late}
                                </td>

                                <td class="center early">
                                    ${member.early}
                                </td>

                                <td class="center absent">
                                    ${member.absent}
                                </td>

                                <td class="center excused">
                                    ${member.excused}
                                </td>

                                <td>
                                    <span class="classification ${classificationClass}">
                                        ${escapeHtml(
                                            member.classification
                                        )}
                                    </span>
                                </td>
                            </tr>
                        `;
                    }
                )
                .join("");

        printWindow.document.write(`
            <!DOCTYPE html>

            <html lang="en">

            <head>

                <meta charset="UTF-8" />

                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />

                <title>
                    EPIC Member Attendance Report
                </title>

                <style>

                    * {
                        box-sizing: border-box;
                    }

                    html,
                    body {
                        margin: 0;
                        padding: 0;
                    }

                    body {
                        font-family:
                            "Segoe UI",
                            Arial,
                            Helvetica,
                            sans-serif;

                        color: #172033;
                        background: #ffffff;
                        font-size: 11px;
                        line-height: 1.45;
                    }

                    @page {
                        size: A4 portrait;
                        margin: 14mm 12mm 16mm 12mm;
                    }

                    .document {
                        width: 100%;
                        max-width: 100%;
                        margin: 0 auto;
                    }

                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        padding-bottom: 18px;
                        border-bottom: 2px solid #172033;
                        margin-bottom: 22px;
                    }

                    .brand-area {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }

                    .brand-mark {
                        width: 42px;
                        height: 42px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 9px;
                        background: #172033;
                        color: white;
                        font-size: 13px;
                        font-weight: 900;
                        letter-spacing: 1px;
                    }

                    .brand-name {
                        font-size: 10px;
                        font-weight: 900;
                        letter-spacing: 1.8px;
                        color: #172033;
                    }

                    .brand-subtitle {
                        margin-top: 3px;
                        font-size: 8px;
                        letter-spacing: 1.3px;
                        color: #788396;
                    }

                    .document-type {
                        text-align: right;
                        font-size: 8px;
                        font-weight: 900;
                        letter-spacing: 1.8px;
                        color: #788396;
                    }

                    .document-type strong {
                        display: block;
                        margin-top: 4px;
                        color: #172033;
                        font-size: 11px;
                        letter-spacing: 0.5px;
                    }

                    .title-area {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        margin-bottom: 20px;
                    }

                    .eyebrow {
                        font-size: 8px;
                        font-weight: 900;
                        letter-spacing: 2px;
                        color: #64748b;
                        margin-bottom: 5px;
                    }

                    h1 {
                        margin: 0;
                        font-size: 25px;
                        line-height: 1.15;
                        letter-spacing: -0.6px;
                        color: #111827;
                    }

                    .description {
                        margin: 6px 0 0;
                        max-width: 600px;
                        color: #64748b;
                        font-size: 10px;
                    }

                    .generated {
                        text-align: right;
                        min-width: 150px;
                    }

                    .generated span {
                        display: block;
                        font-size: 7px;
                        font-weight: 900;
                        letter-spacing: 1.5px;
                        color: #94a3b8;
                    }

                    .generated strong {
                        display: block;
                        margin-top: 3px;
                        font-size: 9px;
                        color: #334155;
                    }

                    .meta {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 10px;
                        margin-bottom: 22px;
                    }

                    .meta-card {
                        border: 1px solid #dfe5ec;
                        border-radius: 7px;
                        padding: 10px 12px;
                        background: #f8fafc;
                    }

                    .meta-card span {
                        display: block;
                        font-size: 7px;
                        font-weight: 900;
                        letter-spacing: 1.3px;
                        color: #8490a3;
                        margin-bottom: 4px;
                    }

                    .meta-card strong {
                        display: block;
                        font-size: 10px;
                        color: #172033;
                    }

                    .section {
                        margin-top: 23px;
                        page-break-inside: auto;
                    }

                    .section-title {
                        display: flex;
                        align-items: center;
                        gap: 9px;
                        margin-bottom: 11px;
                        padding-bottom: 7px;
                        border-bottom: 1px solid #dfe5ec;
                    }

                    .section-number {
                        width: 24px;
                        height: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 6px;
                        background: #172033;
                        color: white;
                        font-size: 8px;
                        font-weight: 900;
                    }

                    .section-title h2 {
                        margin: 0;
                        font-size: 13px;
                        color: #172033;
                    }

                    .section-title p {
                        margin: 2px 0 0;
                        color: #7a8698;
                        font-size: 8px;
                    }

                    .summary {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 9px;
                    }

                    .summary-card {
                        border: 1px solid #dfe5ec;
                        border-radius: 7px;
                        padding: 12px;
                        min-height: 78px;
                        background: white;
                    }

                    .summary-card span {
                        display: block;
                        font-size: 7px;
                        font-weight: 900;
                        letter-spacing: 1.2px;
                        color: #7c8798;
                    }

                    .summary-card strong {
                        display: block;
                        margin-top: 5px;
                        font-size: 22px;
                        line-height: 1;
                        color: #172033;
                    }

                    .summary-card small {
                        display: block;
                        margin-top: 5px;
                        color: #8a94a4;
                        font-size: 7px;
                    }

                    .breakdown {
                        display: grid;
                        grid-template-columns: repeat(5, 1fr);
                        gap: 8px;
                    }

                    .breakdown-card {
                        padding: 10px;
                        border: 1px solid #dfe5ec;
                        border-radius: 7px;
                        text-align: center;
                    }

                    .breakdown-card span {
                        display: block;
                        font-size: 7px;
                        font-weight: 900;
                        letter-spacing: 1px;
                        color: #7b8797;
                    }

                    .breakdown-card strong {
                        display: block;
                        margin-top: 4px;
                        font-size: 17px;
                        color: #172033;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        table-layout: fixed;
                        font-size: 8px;
                    }

                    thead {
                        display: table-header-group;
                    }

                    th {
                        background: #172033;
                        color: white;
                        padding: 8px 6px;
                        text-align: left;
                        font-size: 7px;
                        font-weight: 900;
                        letter-spacing: 0.7px;
                        border: 1px solid #172033;
                    }

                    td {
                        padding: 7px 6px;
                        border-bottom: 1px solid #e5e9ef;
                        color: #344054;
                        vertical-align: middle;
                        word-wrap: break-word;
                    }

                    tbody tr:nth-child(even) {
                        background: #f8fafc;
                    }

                    tr {
                        page-break-inside: avoid;
                    }

                    th:nth-child(1) {
                        width: 4%;
                    }

                    th:nth-child(2) {
                        width: 11%;
                    }

                    th:nth-child(3) {
                        width: 20%;
                    }

                    th:nth-child(4) {
                        width: 9%;
                    }

                    th:nth-child(5),
                    th:nth-child(6),
                    th:nth-child(7),
                    th:nth-child(8),
                    th:nth-child(9) {
                        width: 6.5%;
                    }

                    th:nth-child(10) {
                        width: 15%;
                    }

                    .number {
                        color: #94a3b8;
                        text-align: center;
                    }

                    .member-name {
                        color: #172033;
                    }

                    .center {
                        text-align: center;
                    }

                    .percentage {
                        font-weight: 900;
                        color: #172033;
                    }

                    .classification {
                        display: inline-block;
                        padding: 3px 6px;
                        border-radius: 4px;
                        font-size: 6.5px;
                        font-weight: 900;
                        letter-spacing: 0.5px;
                        white-space: nowrap;
                    }

                    .classification.excellent {
                        background: #ecfdf5;
                        color: #047857;
                    }

                    .classification.good {
                        background: #eff6ff;
                        color: #1d4ed8;
                    }

                    .classification.needs-follow-up {
                        background: #fffbeb;
                        color: #b45309;
                    }

                    .classification.pastoral-follow-up {
                        background: #fef2f2;
                        color: #b91c1c;
                    }

                    .legend {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 8px;
                    }

                    .legend-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 9px 10px;
                        border: 1px solid #dfe5ec;
                        border-radius: 6px;
                    }

                    .legend-item strong {
                        font-size: 7px;
                        letter-spacing: 0.6px;
                    }

                    .legend-item span {
                        font-size: 8px;
                        color: #64748b;
                    }

                    .footer {
                        margin-top: 28px;
                        padding-top: 12px;
                        border-top: 1px solid #cfd6df;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        color: #7b8797;
                        font-size: 7.5px;
                        page-break-inside: avoid;
                    }

                    .footer strong {
                        display: block;
                        color: #344054;
                        font-size: 8px;
                    }

                    .footer span {
                        display: block;
                        margin-top: 2px;
                    }

                    .footer-right {
                        text-align: right;
                    }

                    @media print {
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }

                        .document {
                            width: 100%;
                        }
                    }

                </style>

            </head>

            <body>

                <main class="document">

                    <header class="header">

                        <div class="brand-area">

                            <div class="brand-mark">
                                EPIC
                            </div>

                            <div>

                                <div class="brand-name">
                                    LUKE 4:18 MINISTRIES
                                </div>

                                <div class="brand-subtitle">
                                    EPIC CHURCH MANAGEMENT SYSTEM
                                    • ENGAGING PEOPLE INTO CHRIST
                                </div>

                            </div>

                        </div>

                        <div class="document-type">

                            MEMBER ANALYTICS

                            <strong>
                                ATTENDANCE REPORT
                            </strong>

                        </div>

                    </header>

                    <section class="title-area">

                        <div>

                            <div class="eyebrow">
                                EPIC REPORTING CENTER
                            </div>

                            <h1>
                                Member Attendance Report
                            </h1>

                            <p class="description">
                                Attendance participation,
                                member engagement, and
                                pastoral monitoring report.
                            </p>

                        </div>

                        <div class="generated">

                            <span>
                                GENERATED
                            </span>

                            <strong>
                                ${escapeHtml(generated)}
                            </strong>

                        </div>

                    </section>

                    <section class="meta">

                        <div class="meta-card">
                            <span>REPORT PERIOD</span>
                            <strong>
                                ${escapeHtml(printPeriod)}
                            </strong>
                        </div>

                        <div class="meta-card">
                            <span>SERVICE</span>
                            <strong>
                                ${escapeHtml(serviceLabel)}
                            </strong>
                        </div>

                        <div class="meta-card">
                            <span>MEMBER FILTER</span>
                            <strong>
                                ${
                                    search.trim()
                                        ? escapeHtml(search)
                                        : "All Members"
                                }
                            </strong>
                        </div>

                    </section>

                    <section class="section">

                        <div class="section-title">

                            <div class="section-number">
                                01
                            </div>

                            <div>

                                <h2>
                                    Attendance Overview
                                </h2>

                                <p>
                                    Executive summary of the
                                    selected attendance records.
                                </p>

                            </div>

                        </div>

                        <div class="summary">

                            <div class="summary-card">
                                <span>MEMBERS</span>
                                <strong>
                                    ${memberSummaries.length}
                                </strong>
                                <small>
                                    Members tracked
                                </small>
                            </div>

                            <div class="summary-card">
                                <span>RECORDS</span>
                                <strong>
                                    ${statistics.total}
                                </strong>
                                <small>
                                    Attendance records
                                </small>
                            </div>

                            <div class="summary-card">
                                <span>ATTENDANCE RATE</span>
                                <strong>
                                    ${statistics.percentage}%
                                </strong>
                                <small>
                                    Present + Late + Early
                                </small>
                            </div>

                            <div class="summary-card">
                                <span>PASTORAL FOLLOW-UP</span>
                                <strong>
                                    ${pastoralAttentionCount}
                                </strong>
                                <small>
                                    Below 60% attendance
                                </small>
                            </div>

                        </div>

                    </section>

                    <section class="section">

                        <div class="section-title">

                            <div class="section-number">
                                02
                            </div>

                            <div>

                                <h2>
                                    Attendance Breakdown
                                </h2>

                                <p>
                                    Distribution by attendance status.
                                </p>

                            </div>

                        </div>

                        <div class="breakdown">

                            <div class="breakdown-card">
                                <span>PRESENT</span>
                                <strong>
                                    ${statistics.present}
                                </strong>
                            </div>

                            <div class="breakdown-card">
                                <span>LATE</span>
                                <strong>
                                    ${statistics.late}
                                </strong>
                            </div>

                            <div class="breakdown-card">
                                <span>EARLY</span>
                                <strong>
                                    ${statistics.early}
                                </strong>
                            </div>

                            <div class="breakdown-card">
                                <span>ABSENT</span>
                                <strong>
                                    ${statistics.absent}
                                </strong>
                            </div>

                            <div class="breakdown-card">
                                <span>EXCUSED</span>
                                <strong>
                                    ${statistics.excused}
                                </strong>
                            </div>

                        </div>

                    </section>

                    <section class="section">

                        <div class="section-title">

                            <div class="section-number">
                                03
                            </div>

                            <div>

                                <h2>
                                    Member Attendance Performance
                                </h2>

                                <p>
                                    Individual attendance records
                                    and classification.
                                </p>

                            </div>

                        </div>

                        <div class="table-wrapper">

                            <table>

                                <thead>

                                    <tr>
                                        <th>#</th>
                                        <th>MEMBER CODE</th>
                                        <th>MEMBER NAME</th>
                                        <th>RATE</th>
                                        <th>PRESENT</th>
                                        <th>LATE</th>
                                        <th>EARLY</th>
                                        <th>ABSENT</th>
                                        <th>EXCUSED</th>
                                        <th>CLASSIFICATION</th>
                                    </tr>

                                </thead>

                                <tbody>

                                    ${rows}

                                </tbody>

                            </table>

                        </div>

                    </section>

                    <section class="section">

                        <div class="section-title">

                            <div class="section-number">
                                04
                            </div>

                            <div>

                                <h2>
                                    Attendance Classification
                                </h2>

                                <p>
                                    Standard used for attendance
                                    and pastoral monitoring.
                                </p>

                            </div>

                        </div>

                        <div class="legend">

                            <div class="legend-item">
                                <strong>EXCELLENT</strong>
                                <span>90–100%</span>
                            </div>

                            <div class="legend-item">
                                <strong>GOOD</strong>
                                <span>75–89%</span>
                            </div>

                            <div class="legend-item">
                                <strong>NEEDS FOLLOW-UP</strong>
                                <span>60–74%</span>
                            </div>

                            <div class="legend-item">
                                <strong>PASTORAL FOLLOW-UP</strong>
                                <span>Below 60%</span>
                            </div>

                        </div>

                    </section>

                    <footer class="footer">

                        <div>
                            <strong>
                                EPIC CHURCH MANAGEMENT SYSTEM
                            </strong>

                            <span>
                                Engaging People Into Christ
                            </span>
                        </div>

                        <div class="footer-right">

                            <strong>
                                MEMBER ATTENDANCE REPORT
                            </strong>

                            <span>
                                Records displayed:
                                ${memberSummaries.length}
                            </span>

                        </div>

                    </footer>

                </main>

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

    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {

        return (
            <div className="mar-loading-page">

                <div className="mar-loading-spinner" />

                <h2>
                    Loading Member Attendance
                </h2>

                <p>
                    Retrieving attendance records
                    from EPIC CMS...
                </p>

            </div>
        );
    }

    // ========================================================
    // ERROR
    // ========================================================

    if (error) {

        return (
            <div className="mar-error-page">

                <div className="mar-error-icon">
                    !
                </div>

                <h2>
                    Unable to Load Attendance
                </h2>

                <p>
                    {error}
                </p>

                <div className="mar-error-actions">

                    {onBack && (
                        <button
                            type="button"
                            className="mar-button secondary"
                            onClick={onBack}
                        >
                            ← Back to Reports
                        </button>
                    )}

                    <button
                        type="button"
                        className="mar-button primary"
                        onClick={() => {
                            void loadAttendance();
                        }}
                    >
                        ↻ Try Again
                    </button>

                </div>

            </div>
        );
    }

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div className="member-attendance-report">

            {/* ==================================================
                SCREEN HEADER
            ================================================== */}

            <header className="mar-header">

                <div>

                    <span className="mar-eyebrow">
                        EPIC REPORTS CENTER
                    </span>

                    <h1>
                        Member Attendance Report
                    </h1>

                    <p>
                        Monitor member participation,
                        attendance performance, and
                        pastoral follow-up.
                    </p>

                </div>

                <div className="mar-header-actions">

                    {onBack && (
                        <button
                            type="button"
                            className="mar-button secondary"
                            onClick={onBack}
                        >
                            ← Back to Reports
                        </button>
                    )}

                    <button
                        type="button"
                        className="mar-button secondary"
                        onClick={resetFilters}
                    >
                        Reset Filters
                    </button>

                    <button
                        type="button"
                        className="mar-button primary"
                        onClick={handlePrint}
                    >
                        🖨 Print / Save PDF
                    </button>

                </div>

            </header>

            {/* ==================================================
                TOP SUMMARY
            ================================================== */}

            <section className="mar-summary-grid">

                <div className="mar-summary-card">
                    <span>MEMBERS</span>

                    <strong>
                        {memberSummaries.length}
                    </strong>

                    <small>
                        Members tracked
                    </small>
                </div>

                <div className="mar-summary-card">
                    <span>RECORDS</span>

                    <strong>
                        {statistics.total}
                    </strong>

                    <small>
                        Attendance records
                    </small>
                </div>

                <div className="mar-summary-card">
                    <span>ATTENDANCE</span>

                    <strong>
                        {statistics.percentage}%
                    </strong>

                    <small>
                        Overall attendance
                    </small>
                </div>

                <div className="mar-summary-card">
                    <span>FOLLOW-UP</span>

                    <strong>
                        {pastoralAttentionCount}
                    </strong>

                    <small>
                        Below 60%
                    </small>
                </div>

            </section>

            {/* ==================================================
                DETAILED ATTENDANCE OVERVIEW
            ================================================== */}

            <section className="mar-card">

                <div className="mar-card-header">

                    <div>

                        <span>
                            ATTENDANCE ANALYTICS
                        </span>

                        <h2>
                            Attendance Overview
                        </h2>

                        <p>
                            Detailed breakdown of member
                            attendance performance for the
                            selected report period.
                        </p>

                    </div>

                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(5, minmax(0, 1fr))",
                        gap: "12px",
                        padding:
                            "20px 25px 10px",
                    }}
                >

                    {/* PRESENT */}

                    <div
                        style={{
                            padding: "18px",
                            border:
                                "1px solid #a7f3d0",
                            borderRadius: "14px",
                            background:
                                "linear-gradient(135deg, #ffffff, #ecfdf5)",
                            boxShadow:
                                "0 5px 15px rgba(16,185,129,.06)",
                        }}
                    >

                        <div
                            style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                letterSpacing: "1px",
                                color: "#047857",
                            }}
                        >
                            PRESENT
                        </div>

                        <div
                            style={{
                                marginTop: "8px",
                                fontSize: "30px",
                                fontWeight: 850,
                                color: "#10b981",
                                lineHeight: 1,
                            }}
                        >
                            {statistics.present}
                        </div>

                        <div
                            style={{
                                marginTop: "7px",
                                fontSize: "11px",
                                color: "#64748b",
                            }}
                        >
                            {attendanceDistribution.present}%
                            of records
                        </div>

                    </div>

                    {/* LATE */}

                    <div
                        style={{
                            padding: "18px",
                            border:
                                "1px solid #fde68a",
                            borderRadius: "14px",
                            background:
                                "linear-gradient(135deg, #ffffff, #fffbeb)",
                            boxShadow:
                                "0 5px 15px rgba(245,158,11,.06)",
                        }}
                    >

                        <div
                            style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                letterSpacing: "1px",
                                color: "#b45309",
                            }}
                        >
                            LATE
                        </div>

                        <div
                            style={{
                                marginTop: "8px",
                                fontSize: "30px",
                                fontWeight: 850,
                                color: "#f59e0b",
                                lineHeight: 1,
                            }}
                        >
                            {statistics.late}
                        </div>

                        <div
                            style={{
                                marginTop: "7px",
                                fontSize: "11px",
                                color: "#64748b",
                            }}
                        >
                            {attendanceDistribution.late}%
                            of records
                        </div>

                    </div>

                    {/* EARLY */}

                    <div
                        style={{
                            padding: "18px",
                            border:
                                "1px solid #a5f3fc",
                            borderRadius: "14px",
                            background:
                                "linear-gradient(135deg, #ffffff, #ecfeff)",
                            boxShadow:
                                "0 5px 15px rgba(6,182,212,.06)",
                        }}
                    >

                        <div
                            style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                letterSpacing: "1px",
                                color: "#0e7490",
                            }}
                        >
                            EARLY
                        </div>

                        <div
                            style={{
                                marginTop: "8px",
                                fontSize: "30px",
                                fontWeight: 850,
                                color: "#06b6d4",
                                lineHeight: 1,
                            }}
                        >
                            {statistics.early}
                        </div>

                        <div
                            style={{
                                marginTop: "7px",
                                fontSize: "11px",
                                color: "#64748b",
                            }}
                        >
                            {attendanceDistribution.early}%
                            of records
                        </div>

                    </div>

                    {/* ABSENT */}

                    <div
                        style={{
                            padding: "18px",
                            border:
                                "1px solid #fecaca",
                            borderRadius: "14px",
                            background:
                                "linear-gradient(135deg, #ffffff, #fef2f2)",
                            boxShadow:
                                "0 5px 15px rgba(239,68,68,.06)",
                        }}
                    >

                        <div
                            style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                letterSpacing: "1px",
                                color: "#b91c1c",
                            }}
                        >
                            ABSENT
                        </div>

                        <div
                            style={{
                                marginTop: "8px",
                                fontSize: "30px",
                                fontWeight: 850,
                                color: "#ef4444",
                                lineHeight: 1,
                            }}
                        >
                            {statistics.absent}
                        </div>

                        <div
                            style={{
                                marginTop: "7px",
                                fontSize: "11px",
                                color: "#64748b",
                            }}
                        >
                            {attendanceDistribution.absent}%
                            of records
                        </div>

                    </div>

                    {/* EXCUSED */}

                    <div
                        style={{
                            padding: "18px",
                            border:
                                "1px solid #ddd6fe",
                            borderRadius: "14px",
                            background:
                                "linear-gradient(135deg, #ffffff, #f5f3ff)",
                            boxShadow:
                                "0 5px 15px rgba(139,92,246,.06)",
                        }}
                    >

                        <div
                            style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                letterSpacing: "1px",
                                color: "#6d28d9",
                            }}
                        >
                            EXCUSED
                        </div>

                        <div
                            style={{
                                marginTop: "8px",
                                fontSize: "30px",
                                fontWeight: 850,
                                color: "#8b5cf6",
                                lineHeight: 1,
                            }}
                        >
                            {statistics.excused}
                        </div>

                        <div
                            style={{
                                marginTop: "7px",
                                fontSize: "11px",
                                color: "#64748b",
                            }}
                        >
                            {attendanceDistribution.excused}%
                            of records
                        </div>

                    </div>

                </div>

                {/* OVERVIEW METRICS */}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(3, minmax(0, 1fr))",
                        gap: "14px",
                        padding:
                            "10px 25px 20px",
                    }}
                >

                    <div
                        style={{
                            padding: "18px",
                            border:
                                "1px solid #dbeafe",
                            borderRadius: "14px",
                            background:
                                "#f8fbff",
                        }}
                    >

                        <div
                            style={{
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                alignItems: "center",
                            }}
                        >

                            <span
                                style={{
                                    color: "#64748b",
                                    fontSize: "10px",
                                    fontWeight: 800,
                                    letterSpacing: "1px",
                                }}
                            >
                                OVERALL ATTENDANCE
                            </span>

                            <strong
                                style={{
                                    color: "#2563eb",
                                    fontSize: "22px",
                                }}
                            >
                                {statistics.percentage}%
                            </strong>

                        </div>

                        <div
                            style={{
                                marginTop: "12px",
                                height: "8px",
                                overflow: "hidden",
                                borderRadius: "99px",
                                background:
                                    "#e2e8f0",
                            }}
                        >

                            <div
                                style={{
                                    width:
                                        `${statistics.percentage}%`,
                                    height: "100%",
                                    borderRadius:
                                        "99px",
                                    background:
                                        "linear-gradient(90deg, #3b82f6, #10b981)",
                                    transition:
                                        "width .4s ease",
                                }}
                            />

                        </div>

                        <p
                            style={{
                                margin:
                                    "9px 0 0",
                                color:
                                    "#64748b",
                                fontSize:
                                    "11px",
                            }}
                        >
                            {statistics.attended}
                            {" "}
                            attended records out of{" "}
                            {statistics.total}
                        </p>

                    </div>

                    <div
                        style={{
                            padding: "18px",
                            border:
                                "1px solid #a7f3d0",
                            borderRadius: "14px",
                            background:
                                "#f7fffb",
                        }}
                    >

                        <div
                            style={{
                                color: "#64748b",
                                fontSize: "10px",
                                fontWeight: 800,
                                letterSpacing: "1px",
                            }}
                        >
                            EXCELLENT MEMBERS
                        </div>

                        <strong
                            style={{
                                display: "block",
                                marginTop: "9px",
                                color: "#10b981",
                                fontSize: "27px",
                                fontWeight: 850,
                            }}
                        >
                            {excellentMembers}
                        </strong>

                        <p
                            style={{
                                margin: "5px 0 0",
                                color: "#64748b",
                                fontSize: "11px",
                            }}
                        >
                            Members with 90%+
                            attendance
                        </p>

                    </div>

                    <div
                        style={{
                            padding: "18px",
                            border:
                                "1px solid #fecaca",
                            borderRadius: "14px",
                            background:
                                "#fffafa",
                        }}
                    >

                        <div
                            style={{
                                color: "#64748b",
                                fontSize: "10px",
                                fontWeight: 800,
                                letterSpacing: "1px",
                            }}
                        >
                            PASTORAL ATTENTION
                        </div>

                        <strong
                            style={{
                                display: "block",
                                marginTop: "9px",
                                color: "#ef4444",
                                fontSize: "27px",
                                fontWeight: 850,
                            }}
                        >
                            {pastoralAttentionCount}
                        </strong>

                        <p
                            style={{
                                margin: "5px 0 0",
                                color: "#64748b",
                                fontSize: "11px",
                            }}
                        >
                            Members below 60%
                            attendance
                        </p>

                    </div>

                </div>

                {/* STATUS DISTRIBUTION */}

                <div
                    style={{
                        padding:
                            "4px 25px 25px",
                    }}
                >

                    <div
                        style={{
                            marginBottom:
                                "12px",
                            color:
                                "#475569",
                            fontSize:
                                "11px",
                            fontWeight:
                                800,
                            letterSpacing:
                                "0.6px",
                        }}
                    >
                        ATTENDANCE DISTRIBUTION
                    </div>

                    {[
                        {
                            label: "Present",
                            percentage:
                                attendanceDistribution.present,
                            text: "#047857",
                            background: "#ecfdf5",
                            bar: "#10b981",
                        },
                        {
                            label: "Late",
                            percentage:
                                attendanceDistribution.late,
                            text: "#b45309",
                            background: "#fffbeb",
                            bar: "#f59e0b",
                        },
                        {
                            label: "Early",
                            percentage:
                                attendanceDistribution.early,
                            text: "#0e7490",
                            background: "#ecfeff",
                            bar: "#06b6d4",
                        },
                        {
                            label: "Absent",
                            percentage:
                                attendanceDistribution.absent,
                            text: "#b91c1c",
                            background: "#fef2f2",
                            bar: "#ef4444",
                        },
                        {
                            label: "Excused",
                            percentage:
                                attendanceDistribution.excused,
                            text: "#6d28d9",
                            background: "#f5f3ff",
                            bar: "#8b5cf6",
                        },
                    ].map(item => (

                        <div
                            key={item.label}
                            style={{
                                marginBottom:
                                    "10px",
                            }}
                        >

                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "space-between",
                                    marginBottom:
                                        "5px",
                                }}
                            >

                                <span
                                    style={{
                                        color:
                                            item.text,
                                        fontSize:
                                            "11px",
                                        fontWeight:
                                            700,
                                    }}
                                >
                                    {item.label}
                                </span>

                                <span
                                    style={{
                                        color:
                                            "#64748b",
                                        fontSize:
                                            "11px",
                                    }}
                                >
                                    {item.percentage}%
                                </span>

                            </div>

                            <div
                                style={{
                                    height:
                                        "7px",
                                    borderRadius:
                                        "99px",
                                    background:
                                        item.background,
                                    overflow:
                                        "hidden",
                                }}
                            >

                                <div
                                    style={{
                                        width:
                                            `${item.percentage}%`,
                                        height:
                                            "100%",
                                        background:
                                            item.bar,
                                        borderRadius:
                                            "99px",
                                    }}
                                />

                            </div>

                        </div>

                    ))}

                </div>

            </section>

            {/* ==================================================
                FILTERS
            ================================================== */}

            <section className="mar-card">

                <div className="mar-card-header">

                    <div>

                        <span>
                            REPORT BUILDER
                        </span>

                        <h2>
                            Attendance Filters
                        </h2>

                        <p>
                            Adjust the report before
                            printing.
                        </p>

                    </div>

                </div>

                <div className="mar-filters">

                    <div className="mar-field search">

                        <label>
                            Search Member
                        </label>

                        <input
                            type="text"
                            value={search}
                            onChange={event =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            placeholder="Search member name or code..."
                        />

                    </div>

                    <div className="mar-field" style={{ position: "relative" }}>

                        <label>
                            Church Service
                        </label>

                        <div className="mar-service-dropdown-container" ref={serviceDropdownRef}>
                            <div
                                className={`mar-service-dropdown-trigger ${isServiceDropdownOpen ? "open" : ""}`}
                                onClick={() => setIsServiceDropdownOpen(prev => !prev)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setIsServiceDropdownOpen(prev => !prev); }}
                            >
                                {selectedServiceObj ? (
                                    <div className="mar-service-trigger-content">
                                        <span className={`mar-service-pill ${getServiceCategory(selectedServiceObj).toLowerCase()}`}>
                                            {getServiceCategory(selectedServiceObj) === "COMPLETED" && <Check size={12} strokeWidth={2.5} />}
                                            {getServiceCategory(selectedServiceObj) === "UPCOMING" && <Calendar size={12} strokeWidth={2.5} />}
                                            {getServiceCategory(selectedServiceObj) === "TODAY" && <span className="pulse-dot"></span>}
                                            {getServiceCategory(selectedServiceObj) === "CANCELLED" && <X size={12} strokeWidth={2.5} />}
                                            {getServiceCategory(selectedServiceObj) === "TODAY" ? "Today" : (selectedServiceObj.status || "Completed")}
                                        </span>
                                        {selectedServiceObj.serviceDate && (
                                            <span className="mar-trigger-date">{formatDropdownDate(selectedServiceObj.serviceDate)}</span>
                                        )}
                                        {selectedServiceObj.serviceDate && <span style={{ color: "#94a3b8" }}>—</span>}
                                        <span className="mar-trigger-title">{selectedServiceObj.serviceName}</span>
                                    </div>
                                ) : (
                                    <div className="mar-service-trigger-placeholder">
                                        <Calendar size={15} style={{ color: "#64748b" }} />
                                        <span>All Services ({allServices.length})</span>
                                    </div>
                                )}

                                <div className="mar-service-trigger-actions">
                                    {serviceFilter !== "ALL" && (
                                        <button
                                            type="button"
                                            className="mar-trigger-clear-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setServiceFilter("ALL");
                                            }}
                                            title="Reset to All Services"
                                        >
                                            ✕
                                        </button>
                                    )}
                                    <ChevronDown size={16} className={`mar-trigger-chevron ${isServiceDropdownOpen ? "open" : ""}`} />
                                </div>
                            </div>

                            {isServiceDropdownOpen && (
                                <div className="mar-service-dropdown-popover">
                                    {/* Search Box */}
                                    <div className="mar-service-dropdown-search-box">
                                        <Search size={14} style={{ color: "#64748b", flexShrink: 0 }} />
                                        <input
                                            type="text"
                                            placeholder="Search service name, week, or date..."
                                            value={serviceSearchQuery}
                                            onChange={e => setServiceSearchQuery(e.target.value)}
                                            autoFocus
                                        />
                                        {serviceSearchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setServiceSearchQuery("")}
                                                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>

                                    {/* Category Filter Tabs */}
                                    <div className="mar-service-dropdown-filter-tabs">
                                        <button
                                            type="button"
                                            className={`mar-service-filter-tab ${serviceCategoryFilter === "ALL" ? "active" : ""}`}
                                            onClick={() => setServiceCategoryFilter("ALL")}
                                        >
                                            All ({allServices.length})
                                        </button>
                                        <button
                                            type="button"
                                            className={`mar-service-filter-tab tab-upcoming ${serviceCategoryFilter === "UPCOMING" ? "active" : ""}`}
                                            onClick={() => setServiceCategoryFilter("UPCOMING")}
                                        >
                                            📅 Upcoming ({upcomingServicesCount})
                                        </button>
                                        <button
                                            type="button"
                                            className={`mar-service-filter-tab tab-completed ${serviceCategoryFilter === "COMPLETED" ? "active" : ""}`}
                                            onClick={() => setServiceCategoryFilter("COMPLETED")}
                                        >
                                            ✓ Completed ({completedServicesCount})
                                        </button>
                                        {cancelledServicesCount > 0 && (
                                            <button
                                                type="button"
                                                className={`mar-service-filter-tab tab-cancelled ${serviceCategoryFilter === "CANCELLED" ? "active" : ""}`}
                                                onClick={() => setServiceCategoryFilter("CANCELLED")}
                                            >
                                                ✕ Cancelled ({cancelledServicesCount})
                                            </button>
                                        )}
                                    </div>

                                    {/* Dropdown List */}
                                    <div className="mar-service-dropdown-list">
                                        {/* Option for All Services */}
                                        <div
                                            className={`mar-service-dropdown-item item-all ${serviceFilter === "ALL" ? "selected" : ""}`}
                                            onClick={() => {
                                                setServiceFilter("ALL");
                                                setIsServiceDropdownOpen(false);
                                            }}
                                        >
                                            <div className="mar-service-item-main">
                                                <span className="mar-service-item-title" style={{ fontWeight: 700 }}>
                                                    All Services ({allServices.length})
                                                </span>
                                                <span style={{ fontSize: 11, color: "#64748b" }}>
                                                    View attendance aggregated across all church services
                                                </span>
                                            </div>
                                            {serviceFilter === "ALL" && <Check size={16} color="#2563eb" strokeWidth={3} />}
                                        </div>

                                        {filteredDropdownServices.length === 0 ? (
                                            <div className="mar-service-dropdown-empty">
                                                No church services match your filter.
                                            </div>
                                        ) : (
                                            filteredDropdownServices.map(s => {
                                                const category = getServiceCategory(s);
                                                const isSelected = serviceFilter.toLowerCase() === s.serviceName.toLowerCase();
                                                const relLabel = getRelativeDropdownLabel(s.serviceDate);

                                                return (
                                                    <div
                                                        key={s.churchServiceId || s.serviceName}
                                                        className={`mar-service-dropdown-item item-${category.toLowerCase()} ${isSelected ? "selected" : ""}`}
                                                        onClick={() => {
                                                            setServiceFilter(s.serviceName);
                                                            setIsServiceDropdownOpen(false);
                                                        }}
                                                    >
                                                        <div className="mar-service-item-main">
                                                            <div className="mar-service-item-top">
                                                                {s.serviceDate && (
                                                                    <span className="mar-service-item-date">
                                                                        <Calendar size={13} style={{ color: "#64748b" }} />
                                                                        {formatDropdownDate(s.serviceDate)}
                                                                    </span>
                                                                )}
                                                                {relLabel && (
                                                                    <span className={`mar-service-item-relative ${category === "TODAY" ? "rel-today" : category === "UPCOMING" ? "rel-upcoming" : ""}`}>
                                                                        {relLabel}
                                                                    </span>
                                                                )}
                                                                {s.startTime && (
                                                                    <span className="mar-service-item-time">
                                                                        {s.startTime}{s.endTime ? ` – ${s.endTime}` : ""}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="mar-service-item-title">{s.serviceName}</span>
                                                        </div>

                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <span className={`mar-service-pill ${category.toLowerCase()}`}>
                                                                {category === "COMPLETED" && <Check size={12} strokeWidth={2.5} />}
                                                                {category === "UPCOMING" && <Calendar size={12} strokeWidth={2.5} />}
                                                                {category === "TODAY" && <span className="pulse-dot"></span>}
                                                                {category === "CANCELLED" && <X size={12} strokeWidth={2.5} />}
                                                                {category === "TODAY" ? "Today" : (s.status || "Completed")}
                                                            </span>
                                                            {isSelected && <Check size={16} color="#2563eb" strokeWidth={3} />}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    <div className="mar-field">

                        <label>
                            Date From
                        </label>

                        <input
                            type="date"
                            value={dateFrom}
                            onChange={event =>
                                setDateFrom(
                                    event.target.value
                                )
                            }
                        />

                    </div>

                    <div className="mar-field">

                        <label>
                            Date To
                        </label>

                        <input
                            type="date"
                            value={dateTo}
                            onChange={event =>
                                setDateTo(
                                    event.target.value
                                )
                            }
                        />

                    </div>

                </div>

            </section>

            {/* ==================================================
                MEMBER REPORT
            ================================================== */}

            <section className="mar-card">

                <div className="mar-report-toolbar">

                    <div>

                        <span>
                            REPORT PREVIEW
                        </span>

                        <h2>
                            Member Attendance
                        </h2>

                        <p>
                            Showing{" "}
                            <strong>
                                {memberSummaries.length}
                            </strong>{" "}
                            members from{" "}
                            <strong>
                                {filteredRecords.length}
                            </strong>{" "}
                            attendance records.
                        </p>

                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {classificationFilter !== "ALL" && (
                            <button
                                type="button"
                                className="mar-button secondary"
                                style={{ padding: "6px 12px", fontSize: 11 }}
                                onClick={() => setClassificationFilter("ALL")}
                            >
                                Clear Filter (Showing {classificationFilter.replace(/_/g, " ")})
                            </button>
                        )}
                        <button
                            type="button"
                            className="mar-button primary"
                            onClick={handlePrint}
                        >
                            🖨 Print Report
                        </button>
                    </div>

                </div>

                {/* CLASSIFICATION PERFORMANCE FILTER BAR */}
                <div className="mar-classification-filter-bar">
                    <span className="mar-filter-bar-label">
                        <Filter size={13} /> Performance:
                    </span>
                    <button
                        type="button"
                        className={`mar-class-tab ${classificationFilter === "ALL" ? "active" : ""}`}
                        onClick={() => setClassificationFilter("ALL")}
                    >
                        All Members <span className="tab-count">{memberSummaries.length}</span>
                    </button>
                    <button
                        type="button"
                        className={`mar-class-tab tab-excellent ${classificationFilter === "EXCELLENT" ? "active" : ""}`}
                        onClick={() => setClassificationFilter(prev => prev === "EXCELLENT" ? "ALL" : "EXCELLENT")}
                    >
                        🌟 Excellent (90%+) <span className="tab-count">{excellentCount}</span>
                    </button>
                    <button
                        type="button"
                        className={`mar-class-tab tab-good ${classificationFilter === "GOOD" ? "active" : ""}`}
                        onClick={() => setClassificationFilter(prev => prev === "GOOD" ? "ALL" : "GOOD")}
                    >
                        👍 Good (75–89%) <span className="tab-count">{goodCount}</span>
                    </button>
                    <button
                        type="button"
                        className={`mar-class-tab tab-needs-follow-up ${classificationFilter === "NEEDS_FOLLOW_UP" ? "active" : ""}`}
                        onClick={() => setClassificationFilter(prev => prev === "NEEDS_FOLLOW_UP" ? "ALL" : "NEEDS_FOLLOW_UP")}
                    >
                        ⚠️ Needs Follow-up (60–74%) <span className="tab-count">{needsFollowUpCount}</span>
                    </button>
                    <button
                        type="button"
                        className={`mar-class-tab tab-pastoral-follow-up ${classificationFilter === "PASTORAL_FOLLOW_UP" ? "active" : ""}`}
                        onClick={() => setClassificationFilter(prev => prev === "PASTORAL_FOLLOW_UP" ? "ALL" : "PASTORAL_FOLLOW_UP")}
                    >
                        🚨 Pastoral Follow-up (&lt;60%) <span className="tab-count">{pastoralCount}</span>
                    </button>
                </div>

                <div className="mar-table-wrapper">

                    <table className="mar-screen-table">

                        <thead>

                            <tr>

                                <th>
                                    #
                                </th>

                                <th>
                                    MEMBER
                                </th>

                                <th>
                                    CODE
                                </th>

                                <th>
                                    RATE
                                </th>

                                <th>
                                    PRESENT
                                </th>

                                <th>
                                    LATE
                                </th>

                                <th>
                                    EARLY
                                </th>

                                <th>
                                    ABSENT
                                </th>

                                <th>
                                    EXCUSED
                                </th>

                                <th>
                                    CLASSIFICATION
                                </th>

                                {/* NEW */}

                                <th>
                                    ACTION
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {displayedMemberSummaries.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan={11}
                                        className="mar-empty"
                                    >
                                        No attendance
                                        records found{classificationFilter !== "ALL" ? ` with classification "${classificationFilter.replace(/_/g, " ")}"` : ""}.
                                    </td>

                                </tr>

                            ) : (

                                displayedMemberSummaries.map(
                                    (
                                        member,
                                        index
                                    ) => {
                                        const classType = getClassificationClass(member.percentage);
                                        return (

                                        <tr
                                            key={
                                                member.memberId
                                            }
                                            className={`mar-row status-${classType}`}
                                        >

                                            <td>
                                                {index + 1}
                                            </td>

                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div className={`mar-avatar status-${classType}`}>
                                                        {member.name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("")}
                                                    </div>
                                                    <strong>
                                                        {
                                                            member.name
                                                        }
                                                    </strong>
                                                </div>
                                            </td>

                                            <td>
                                                {
                                                    member.memberCode
                                                }
                                            </td>

                                            <td>

                                                <strong className={`mar-percentage rate-${classType}`}>
                                                    {
                                                        member.percentage
                                                    }%
                                                </strong>

                                            </td>

                                            <td>
                                                <span className={`mar-num-badge ${member.present > 0 ? "num-present" : "num-zero"}`}>
                                                    {member.present > 0 ? `• ${member.present}` : "0"}
                                                </span>
                                            </td>

                                            <td>
                                                <span className={`mar-num-badge ${member.late > 0 ? "num-late" : "num-zero"}`}>
                                                    {member.late > 0 ? `• ${member.late}` : "0"}
                                                </span>
                                            </td>

                                            <td>
                                                <span className={`mar-num-badge ${member.early > 0 ? "num-early" : "num-zero"}`}>
                                                    {member.early > 0 ? `• ${member.early}` : "0"}
                                                </span>
                                            </td>

                                            <td>
                                                <span className={`mar-num-badge ${member.absent > 0 ? "num-absent" : "num-zero"}`}>
                                                    {member.absent > 0 ? `• ${member.absent}` : "0"}
                                                </span>
                                            </td>

                                            <td>
                                                <span className={`mar-num-badge ${member.excused > 0 ? "num-excused" : "num-zero"}`}>
                                                    {member.excused > 0 ? `• ${member.excused}` : "0"}
                                                </span>
                                            </td>

                                            <td>

                                                <span
                                                    className={`mar-classification ${classType}`}
                                                >
                                                    {
                                                        member.classification
                                                    }
                                                </span>

                                            </td>

                                            {/* ==================================================
                                                VIEW ONLY BUTTON
                                            ================================================== */}

                                            <td>

                                                <button
                                                    type="button"
                                                    className="mar-button secondary"
                                                    style={{
                                                        padding:
                                                            "7px 13px",
                                                        minWidth:
                                                            "70px",
                                                        fontSize:
                                                            "11px",
                                                        fontWeight:
                                                            800,
                                                    }}
                                                    onClick={() =>
                                                        setSelectedMemberId(
                                                            member.memberId
                                                        )
                                                    }
                                                >
                                                    👁 View
                                                </button>

                                            </td>

                                        </tr>

                                    ); }
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </section>

            {/* ==================================================
                SCREEN FOOTER
            ================================================== */}

            <footer className="mar-screen-footer">

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
                        Report Period:
                    </span>

                    <strong>
                        {printPeriod}
                    </strong>

                </div>

            </footer>

            {/* ==================================================
                VIEW MEMBER ATTENDANCE MODAL
                READ ONLY — NO EDITING
            ================================================== */}

            {selectedMember && (

                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="member-attendance-view-title"
                    onClick={() =>
                        setSelectedMemberId(null)
                    }
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "24px",
                        background:
                            "rgba(15, 23, 42, 0.58)",
                        backdropFilter:
                            "blur(5px)",
                    }}
                >

                    <div
                        onClick={event =>
                            event.stopPropagation()
                        }
                        style={{
                            width:
                                "min(920px, 100%)",
                            maxHeight:
                                "calc(100vh - 48px)",
                            overflow:
                                "hidden",
                            display:
                                "flex",
                            flexDirection:
                                "column",
                            background:
                                "#ffffff",
                            borderRadius:
                                "20px",
                            boxShadow:
                                "0 25px 70px rgba(15,23,42,.25)",
                        }}
                    >

                        {/* MODAL HEADER */}

                        <div
                            style={{
                                padding:
                                    "22px 25px",
                                borderBottom:
                                    "1px solid #e2e8f0",
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "space-between",
                                gap: "20px",
                            }}
                        >

                            <div>

                                <span
                                    style={{
                                        display:
                                            "block",
                                        marginBottom:
                                            "5px",
                                        fontSize:
                                            "10px",
                                        fontWeight:
                                            850,
                                        letterSpacing:
                                            "1.2px",
                                        color:
                                            "#64748b",
                                    }}
                                >
                                    MEMBER ATTENDANCE
                                </span>

                                <h2
                                    id="member-attendance-view-title"
                                    style={{
                                        margin:
                                            0,
                                        fontSize:
                                            "22px",
                                        fontWeight:
                                            800,
                                        color:
                                            "#172033",
                                    }}
                                >
                                    {selectedMember.name}
                                </h2>

                                <p
                                    style={{
                                        margin:
                                            "5px 0 0",
                                        fontSize:
                                            "12px",
                                        color:
                                            "#64748b",
                                    }}
                                >
                                    {selectedMember.memberCode}
                                    {" • "}
                                    Read-only attendance history
                                </p>

                            </div>

                            <button
                                type="button"
                                aria-label="Close member attendance"
                                onClick={() =>
                                    setSelectedMemberId(
                                        null
                                    )
                                }
                                style={{
                                    width:
                                        "38px",
                                    height:
                                        "38px",
                                    border:
                                        "1px solid #e2e8f0",
                                    borderRadius:
                                        "10px",
                                    background:
                                        "#f8fafc",
                                    color:
                                        "#475569",
                                    fontSize:
                                        "20px",
                                    cursor:
                                        "pointer",
                                }}
                            >
                                ×
                            </button>

                        </div>

                        {/* MEMBER SUMMARY */}

                        <div
                            style={{
                                display:
                                    "grid",
                                gridTemplateColumns:
                                    "repeat(5, minmax(0, 1fr))",
                                gap: "10px",
                                padding:
                                    "18px 25px",
                                background:
                                    "#f8fafc",
                                borderBottom:
                                    "1px solid #e2e8f0",
                            }}
                        >

                            <div
                                style={{
                                    padding:
                                        "12px",
                                    border:
                                        "1px solid #e2e8f0",
                                    borderRadius:
                                        "12px",
                                    background:
                                        "#ffffff",
                                }}
                            >

                                <span
                                    style={{
                                        display:
                                            "block",
                                        fontSize:
                                            "9px",
                                        fontWeight:
                                            800,
                                        color:
                                            "#64748b",
                                    }}
                                >
                                    ATTENDANCE RATE
                                </span>

                                <strong
                                    style={{
                                        display:
                                            "block",
                                        marginTop:
                                            "5px",
                                        fontSize:
                                            "20px",
                                        color:
                                            "#2563eb",
                                    }}
                                >
                                    {selectedMember.percentage}%
                                </strong>

                            </div>

                            <div
                                style={{
                                    padding:
                                        "12px",
                                    border:
                                        "1px solid #d1fae5",
                                    borderRadius:
                                        "12px",
                                    background:
                                        "#ecfdf5",
                                }}
                            >

                                <span
                                    style={{
                                        display:
                                            "block",
                                        fontSize:
                                            "9px",
                                        fontWeight:
                                            800,
                                        color:
                                            "#047857",
                                    }}
                                >
                                    PRESENT
                                </span>

                                <strong
                                    style={{
                                        display:
                                            "block",
                                        marginTop:
                                            "5px",
                                        fontSize:
                                            "20px",
                                        color:
                                            "#10b981",
                                    }}
                                >
                                    {selectedMember.present}
                                </strong>

                            </div>

                            <div
                                style={{
                                    padding:
                                        "12px",
                                    border:
                                        "1px solid #fde68a",
                                    borderRadius:
                                        "12px",
                                    background:
                                        "#fffbeb",
                                }}
                            >

                                <span
                                    style={{
                                        display:
                                            "block",
                                        fontSize:
                                            "9px",
                                        fontWeight:
                                            800,
                                        color:
                                            "#b45309",
                                    }}
                                >
                                    LATE
                                </span>

                                <strong
                                    style={{
                                        display:
                                            "block",
                                        marginTop:
                                            "5px",
                                        fontSize:
                                            "20px",
                                        color:
                                            "#f59e0b",
                                    }}
                                >
                                    {selectedMember.late}
                                </strong>

                            </div>

                            <div
                                style={{
                                    padding:
                                        "12px",
                                    border:
                                        "1px solid #fecaca",
                                    borderRadius:
                                        "12px",
                                    background:
                                        "#fef2f2",
                                }}
                            >

                                <span
                                    style={{
                                        display:
                                            "block",
                                        fontSize:
                                            "9px",
                                        fontWeight:
                                            800,
                                        color:
                                            "#b91c1c",
                                    }}
                                >
                                    ABSENT
                                </span>

                                <strong
                                    style={{
                                        display:
                                            "block",
                                        marginTop:
                                            "5px",
                                        fontSize:
                                            "20px",
                                        color:
                                            "#ef4444",
                                    }}
                                >
                                    {selectedMember.absent}
                                </strong>

                            </div>

                            <div
                                style={{
                                    padding:
                                        "12px",
                                    border:
                                        "1px solid #ddd6fe",
                                    borderRadius:
                                        "12px",
                                    background:
                                        "#f5f3ff",
                                }}
                            >

                                <span
                                    style={{
                                        display:
                                            "block",
                                        fontSize:
                                            "9px",
                                        fontWeight:
                                            800,
                                        color:
                                            "#6d28d9",
                                    }}
                                >
                                    STATUS
                                </span>

                                <strong
                                    style={{
                                        display:
                                            "block",
                                        marginTop:
                                            "5px",
                                        fontSize:
                                            "11px",
                                        color:
                                            "#6d28d9",
                                    }}
                                >
                                    {selectedMember.classification}
                                </strong>

                            </div>

                        </div>

                        {/* ATTENDANCE HISTORY */}

                        <div
                            style={{
                                overflowY:
                                    "auto",
                                padding:
                                    "20px 25px",
                            }}
                        >

                            <div
                                style={{
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "space-between",
                                    marginBottom:
                                        "12px",
                                }}
                            >

                                <div>

                                    <h3
                                        style={{
                                            margin:
                                                0,
                                            fontSize:
                                                "15px",
                                            color:
                                                "#172033",
                                        }}
                                    >
                                        Attendance History
                                    </h3>

                                    <p
                                        style={{
                                            margin:
                                                "4px 0 0",
                                            fontSize:
                                                "11px",
                                            color:
                                                "#64748b",
                                        }}
                                    >
                                        {selectedMemberRecords.length}
                                        {" "}
                                        attendance records
                                    </p>

                                </div>

                                <span
                                    style={{
                                        padding:
                                            "6px 10px",
                                        borderRadius:
                                            "999px",
                                        background:
                                            "#eff6ff",
                                        color:
                                            "#1d4ed8",
                                        fontSize:
                                            "10px",
                                        fontWeight:
                                            800,
                                    }}
                                >
                                    VIEW ONLY
                                </span>

                            </div>

                            {selectedMemberRecords.length === 0 ? (

                                <div
                                    style={{
                                        padding:
                                            "35px",
                                        textAlign:
                                            "center",
                                        border:
                                            "1px dashed #cbd5e1",
                                        borderRadius:
                                            "14px",
                                        color:
                                            "#64748b",
                                        fontSize:
                                            "13px",
                                    }}
                                >
                                    No attendance records found
                                    for this member.
                                </div>

                            ) : (

                                <div
                                    style={{
                                        border:
                                            "1px solid #e2e8f0",
                                        borderRadius:
                                            "14px",
                                        overflow:
                                            "hidden",
                                    }}
                                >

                                    <table
                                        style={{
                                            width:
                                                "100%",
                                            borderCollapse:
                                                "collapse",
                                        }}
                                    >

                                        <thead>

                                            <tr
                                                style={{
                                                    background:
                                                        "#f8fafc",
                                                }}
                                            >

                                                <th
                                                    style={{
                                                        padding:
                                                            "12px 14px",
                                                        textAlign:
                                                            "left",
                                                        fontSize:
                                                            "10px",
                                                        fontWeight:
                                                            800,
                                                        color:
                                                            "#64748b",
                                                        borderBottom:
                                                            "1px solid #e2e8f0",
                                                    }}
                                                >
                                                    DATE
                                                </th>

                                                <th
                                                    style={{
                                                        padding:
                                                            "12px 14px",
                                                        textAlign:
                                                            "left",
                                                        fontSize:
                                                            "10px",
                                                        fontWeight:
                                                            800,
                                                        color:
                                                            "#64748b",
                                                        borderBottom:
                                                            "1px solid #e2e8f0",
                                                    }}
                                                >
                                                    CHURCH SERVICE
                                                </th>

                                                <th
                                                    style={{
                                                        padding:
                                                            "12px 14px",
                                                        textAlign:
                                                            "center",
                                                        fontSize:
                                                            "10px",
                                                        fontWeight:
                                                            800,
                                                        color:
                                                            "#64748b",
                                                        borderBottom:
                                                            "1px solid #e2e8f0",
                                                    }}
                                                >
                                                    STATUS
                                                </th>

                                                <th
                                                    style={{
                                                        padding:
                                                            "12px 14px",
                                                        textAlign:
                                                            "left",
                                                        fontSize:
                                                            "10px",
                                                        fontWeight:
                                                            800,
                                                        color:
                                                            "#64748b",
                                                        borderBottom:
                                                            "1px solid #e2e8f0",
                                                    }}
                                                >
                                                    RECORDED BY
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {selectedMemberRecords.map(
                                                record => {

                                                    const status =
                                                        record.status;

                                                    const statusStyles =
                                                        status ===
                                                        "PRESENT"
                                                            ? {
                                                                background:
                                                                    "#ecfdf5",
                                                                color:
                                                                    "#047857",
                                                            }
                                                            : status ===
                                                                "LATE"
                                                                ? {
                                                                    background:
                                                                        "#fffbeb",
                                                                    color:
                                                                        "#b45309",
                                                                }
                                                                : status ===
                                                                    "EARLY"
                                                                    ? {
                                                                        background:
                                                                            "#ecfeff",
                                                                        color:
                                                                            "#0e7490",
                                                                    }
                                                                    : status ===
                                                                        "ABSENT"
                                                                        ? {
                                                                            background:
                                                                                "#fef2f2",
                                                                            color:
                                                                                "#b91c1c",
                                                                        }
                                                                        : {
                                                                            background:
                                                                                "#f5f3ff",
                                                                            color:
                                                                                "#6d28d9",
                                                                        };

                                                    return (
                                                        <tr
                                                            key={
                                                                record.attendanceId
                                                            }
                                                        >

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "13px 14px",
                                                                    borderBottom:
                                                                        "1px solid #f1f5f9",
                                                                    fontSize:
                                                                        "12px",
                                                                    color:
                                                                        "#334155",
                                                                }}
                                                            >
                                                                {formatDate(
                                                                    record.attendanceDate
                                                                )}
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "13px 14px",
                                                                    borderBottom:
                                                                        "1px solid #f1f5f9",
                                                                    fontSize:
                                                                        "12px",
                                                                    color:
                                                                        "#172033",
                                                                    fontWeight:
                                                                        600,
                                                                }}
                                                            >
                                                                {getServiceName(
                                                                    record
                                                                )}
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "13px 14px",
                                                                    textAlign:
                                                                        "center",
                                                                    borderBottom:
                                                                        "1px solid #f1f5f9",
                                                                }}
                                                            >

                                                                <span
                                                                    style={{
                                                                        display:
                                                                            "inline-block",
                                                                        padding:
                                                                            "5px 10px",
                                                                        borderRadius:
                                                                            "999px",
                                                                        fontSize:
                                                                            "10px",
                                                                        fontWeight:
                                                                            800,
                                                                        ...statusStyles,
                                                                    }}
                                                                >
                                                                    {getStatusLabel(
                                                                        status
                                                                    )}
                                                                </span>

                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "13px 14px",
                                                                    borderBottom:
                                                                        "1px solid #f1f5f9",
                                                                    fontSize:
                                                                        "12px",
                                                                    color:
                                                                        "#64748b",
                                                                }}
                                                            >
                                                                {
                                                                    record.recordedBy?.trim() ||
                                                                    "—"
                                                                }
                                                            </td>

                                                        </tr>
                                                    );
                                                }
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            )}

                        </div>

                        {/* MODAL FOOTER */}

                        <div
                            style={{
                                padding:
                                    "15px 25px",
                                borderTop:
                                    "1px solid #e2e8f0",
                                display:
                                    "flex",
                                justifyContent:
                                    "flex-end",
                                background:
                                    "#f8fafc",
                            }}
                        >

                            <button
                                type="button"
                                className="mar-button secondary"
                                onClick={() =>
                                    setSelectedMemberId(
                                        null
                                    )
                                }
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};

export default MemberAttendanceReport;

