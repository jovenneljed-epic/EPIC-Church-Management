import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import "./Attendance.css";
import { API_BASE_URL } from "./config";

// =============================================================
// TYPES
// =============================================================

type AttendanceStatus =
    | "PRESENT"
    | "LATE"
    | "EARLY"
    | "ABSENT"
    | "EXCUSED";

interface Member {
    memberId: number;
    memberCode?: string;

    firstName?: string;
    middleName?: string;
    lastName?: string;

    fullName?: string;
    name?: string;

    // Possible backend naming variants
    FirstName?: string;
    MiddleName?: string;
    LastName?: string;
    FullName?: string;
    Name?: string;
    MemberCode?: string;

    gender?: string;
    birthDate?: string;
    contactNumber?: string;
    address?: string;
    civilStatus?: string;
    ministry?: string;
    dateJoined?: string;
    status?: string;
}

interface ChurchService {
    churchServiceId: number;
    serviceName: string;
    serviceDate: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    status?: string;
}

interface AttendanceApiRecord {
    memberId: number;

    memberCode?: string;

    firstName?: string;
    middleName?: string;
    lastName?: string;

    fullName?: string;
    name?: string;

    // Possible backend naming variants
    FirstName?: string;
    MiddleName?: string;
    LastName?: string;
    FullName?: string;
    Name?: string;
    MemberCode?: string;

    status?: string;
    attendanceId?: number;
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

interface AttendanceApiResponse {
    churchServiceId?: number;
    serviceName?: string;
    serviceDate?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    status?: string;

    canRecordAttendance?: boolean;
    attendanceStarted?: boolean;

    message?: string;

    summary?: AttendanceSummary;

    attendance?: AttendanceApiRecord[];
}

interface AttendanceRow {
    memberId: number;
    memberCode: string;
    fullName: string;
    ministry: string;
    status: AttendanceStatus;
    attendanceId?: number;
}

interface DashboardData {
    totalRecords: number;
    present: number;
    late: number;
    early: number;
    absent: number;
    excused: number;
    attendanceRate: number;
}

// =============================================================
// TOKEN
// =============================================================

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
            return value
                .replace(/^Bearer\s+/i, "")
                .trim();
        }
    }

    return null;
};

// =============================================================
// API ERROR
// =============================================================

class ApiError extends Error {
    status: number;

    constructor(
        message: string,
        status: number
    ) {
        super(message);

        this.name = "ApiError";
        this.status = status;
    }
}

// =============================================================
// RESPONSE MESSAGE
// =============================================================

const readResponseMessage = async (
    response: Response
): Promise<string> => {
    try {
        const text =
            await response.text();

        if (!text) {
            return "";
        }

        try {
            const json =
                JSON.parse(text);

            return (
                json?.message ||
                json?.title ||
                json?.error ||
                text
            );
        } catch {
            return text;
        }
    } catch {
        return "";
    }
};

// =============================================================
// API FETCH
// =============================================================

const apiFetch = async (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {

    const token =
        getToken();

    const headers =
        new Headers(
            options.headers || {}
        );

    headers.set(
        "Accept",
        "application/json"
    );

    if (
        options.body &&
        !headers.has(
            "Content-Type"
        )
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

    console.log(
        "EPIC API REQUEST:",
        options.method || "GET",
        url
    );

    let response: Response;

    try {

        response =
            await fetch(
                url,
                {
                    ...options,
                    headers
                }
            );

    } catch (error) {

        console.error(
            "EPIC API NETWORK ERROR:",
            error
        );

        throw new ApiError(
            `Cannot connect to EPIC API at ${API_BASE_URL}. Make sure the API is running and accessible from this device.`,
            0
        );
    }

    console.log(
        "EPIC API RESPONSE:",
        response.status,
        response.statusText,
        url
    );

    if (
        response.status === 401
    ) {
        throw new ApiError(
            "Your session has expired. Please log in again.",
            401
        );
    }

    if (
        response.status === 403
    ) {
        throw new ApiError(
            "You do not have permission to access this EPIC module.",
            403
        );
    }

    if (!response.ok) {

        const message =
            await readResponseMessage(
                response
            );

        throw new ApiError(
            message ||
            `EPIC API returned ${response.status}.`,
            response.status
        );
    }

    return response;
};

// =============================================================
// SAFE STRING
// =============================================================

const safeString = (
    value: unknown
): string => {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
};

// =============================================================
// GET MEMBER NAME
// =============================================================

const getMemberName = (
    member: Member |
        AttendanceApiRecord
): string => {

    const data =
        member as any;

    // ---------------------------------------------------------
    // 1. FULL NAME
    // ---------------------------------------------------------

    const fullName =
        safeString(
            data.fullName
        ) ||
        safeString(
            data.FullName
        );

    if (fullName) {
        return fullName;
    }

    // ---------------------------------------------------------
    // 2. NAME
    // ---------------------------------------------------------

    const name =
        safeString(
            data.name
        ) ||
        safeString(
            data.Name
        );

    if (name) {
        return name;
    }

    // ---------------------------------------------------------
    // 3. FIRST + MIDDLE + LAST
    // ---------------------------------------------------------

    const firstName =
        safeString(
            data.firstName
        ) ||
        safeString(
            data.FirstName
        );

    const middleName =
        safeString(
            data.middleName
        ) ||
        safeString(
            data.MiddleName
        );

    const lastName =
        safeString(
            data.lastName
        ) ||
        safeString(
            data.LastName
        );

    const constructedName =
        [
            firstName,
            middleName,
            lastName
        ]
            .filter(Boolean)
            .join(" ")
            .trim();

    if (constructedName) {
        return constructedName;
    }

    // ---------------------------------------------------------
    // 4. MEMBER CODE
    // ---------------------------------------------------------

    const memberCode =
        safeString(
            data.memberCode
        ) ||
        safeString(
            data.MemberCode
        );

    if (memberCode) {
        return memberCode;
    }

    return "Unnamed Member";
};

// =============================================================
// GET MEMBER CODE
// =============================================================

const getMemberCode = (
    member: Member |
        AttendanceApiRecord
): string => {

    const data =
        member as any;

    return (
        safeString(
            data.memberCode
        ) ||
        safeString(
            data.MemberCode
        ) ||
        "—"
    );
};

// =============================================================
// GET MINISTRY
// =============================================================

const getMemberMinistry = (
    member: Member
): string => {

    const data =
        member as any;

    return (
        safeString(
            data.ministry
        ) ||
        safeString(
            data.Ministry
        ) ||
        "—"
    );
};

// =============================================================
// COMPONENT
// =============================================================

const Attendance: React.FC = () => {

    // =========================================================
    // STATE
    // =========================================================

    const [members, setMembers] =
        useState<Member[]>([]);

    const [services, setServices] =
        useState<ChurchService[]>([]);

    const [attendance, setAttendance] =
        useState<AttendanceRow[]>([]);

    const [selectedServiceId, setSelectedServiceId] =
        useState<number | "">("");

    const [selectedService, setSelectedService] =
        useState<ChurchService | null>(null);

    const [search, setSearch] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [attendanceAvailable, setAttendanceAvailable] =
        useState(false);

    const [dashboard, setDashboard] =
        useState<DashboardData>({
            totalRecords: 0,
            present: 0,
            late: 0,
            early: 0,
            absent: 0,
            excused: 0,
            attendanceRate: 0
        });

    // =========================================================
    // RESET DASHBOARD
    // =========================================================

    const resetDashboard =
        useCallback(() => {

            setDashboard({
                totalRecords: 0,
                present: 0,
                late: 0,
                early: 0,
                absent: 0,
                excused: 0,
                attendanceRate: 0
            });

        }, []);

    // =========================================================
    // DASHBOARD CALCULATION
    // =========================================================

    const calculateDashboard =
        useCallback(
            (
                rows: AttendanceRow[]
            ) => {

                const total =
                    rows.length;

                const present =
                    rows.filter(
                        x =>
                            x.status ===
                            "PRESENT"
                    ).length;

                const late =
                    rows.filter(
                        x =>
                            x.status ===
                            "LATE"
                    ).length;

                const early =
                    rows.filter(
                        x =>
                            x.status ===
                            "EARLY"
                    ).length;

                const absent =
                    rows.filter(
                        x =>
                            x.status ===
                            "ABSENT"
                    ).length;

                const excused =
                    rows.filter(
                        x =>
                            x.status ===
                            "EXCUSED"
                    ).length;

                const attended =
                    present +
                    late +
                    early;

                const rate =
                    total === 0
                        ? 0
                        : Math.round(
                            (
                                attended /
                                total
                            ) *
                            10000
                        ) / 100;

                setDashboard({
                    totalRecords:
                        total,

                    present,
                    late,
                    early,
                    absent,
                    excused,

                    attendanceRate:
                        rate
                });
            },
            []
        );

    // =========================================================
    // LOAD MEMBERS
    // =========================================================

    const loadMembers =
        useCallback(
            async (): Promise<Member[]> => {

                const url =
                    `${API_BASE_URL}/Members`;

                console.log(
                    "ATTENDANCE: Loading members:",
                    url
                );

                const response =
                    await apiFetch(url);

                const data =
                    await response.json();

                console.log(
                    "ATTENDANCE MEMBERS RAW DATA:",
                    data
                );

                const list: Member[] =
                    Array.isArray(data)
                        ? data
                        : Array.isArray(
                            data?.members
                        )
                            ? data.members
                            : Array.isArray(
                                data?.data
                            )
                                ? data.data
                                : [];

                console.log(
                    "ATTENDANCE MEMBER SAMPLE:",
                    list[0]
                );

                const active =
                    list.filter(
                        member => {

                            const status =
                                (
                                    member.status ||
                                    (member as any).Status ||
                                    "ACTIVE"
                                )
                                    .trim()
                                    .toUpperCase();

                            return (
                                status ===
                                "ACTIVE"
                            );
                        }
                    );

                console.log(
                    "ATTENDANCE: Members loaded:",
                    active.length
                );

                console.log(
                    "ATTENDANCE: FIRST MEMBER NAME:",
                    active.length
                        ? getMemberName(
                            active[0]
                        )
                        : "NONE"
                );

                setMembers(
                    active
                );

                return active;
            },
            []
        );

    // =========================================================
    // LOAD CHURCH SERVICES
    // =========================================================

    const loadChurchServices =
        useCallback(
            async (): Promise<
                ChurchService[]
            > => {

                const endpoints = [
                    `${API_BASE_URL}/ChurchServices`,
                    `${API_BASE_URL}/ChurchService`
                ];

                let lastError:
                    unknown = null;

                for (
                    const url
                    of endpoints
                ) {

                    try {

                        console.log(
                            "ATTENDANCE: Trying services endpoint:",
                            url
                        );

                        const response =
                            await apiFetch(
                                url
                            );

                        const data =
                            await response.json();

                        const list:
                            ChurchService[] =
                            Array.isArray(
                                data
                            )
                                ? data
                                : Array.isArray(
                                    data?.services
                                )
                                    ? data.services
                                    : Array.isArray(
                                        data?.churchServices
                                    )
                                        ? data.churchServices
                                        : Array.isArray(
                                            data?.data
                                        )
                                            ? data.data
                                            : [];

                        console.log(
                            "ATTENDANCE: Services loaded:",
                            list.length,
                            list
                        );

                        setServices(
                            list
                        );

                        return list;

                    } catch (
                        error
                    ) {

                        console.warn(
                            "ATTENDANCE: Service endpoint failed:",
                            url,
                            error
                        );

                        lastError =
                            error;
                    }
                }

                throw (
                    lastError instanceof Error
                        ? lastError
                        : new Error(
                            "Unable to load church services."
                        )
                );
            },
            []
        );

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    const loadInitialData =
        useCallback(
            async () => {

                setLoading(true);
                setError("");
                setMessage("");

                try {

                    if (!getToken()) {

                        throw new ApiError(
                            "Unauthorized. Please login again.",
                            401
                        );
                    }

                    const results =
                        await Promise.allSettled([
                            loadMembers(),
                            loadChurchServices()
                        ]);

                    const memberResult =
                        results[0];

                    const serviceResult =
                        results[1];

                    if (
                        memberResult.status ===
                        "rejected"
                    ) {

                        console.error(
                            "ATTENDANCE MEMBERS LOAD ERROR:",
                            memberResult.reason
                        );
                    }

                    if (
                        serviceResult.status ===
                        "rejected"
                    ) {

                        console.error(
                            "ATTENDANCE SERVICES LOAD ERROR:",
                            serviceResult.reason
                        );

                        setError(
                            serviceResult.reason instanceof Error
                                ? serviceResult.reason.message
                                : "Unable to load church services."
                        );
                    }

                    if (
                        memberResult.status ===
                        "rejected" &&
                        serviceResult.status ===
                        "rejected"
                    ) {

                        throw new Error(
                            "Unable to load attendance data."
                        );
                    }

                } catch (err) {

                    console.error(
                        "ATTENDANCE INITIAL LOAD ERROR:",
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

            },
            [
                loadMembers,
                loadChurchServices
            ]
        );

    // =========================================================
    // INITIAL EFFECT
    // =========================================================

    useEffect(() => {

        void loadInitialData();

    }, [loadInitialData]);

    // =========================================================
    // LOAD ATTENDANCE FOR SERVICE
    // =========================================================

    const loadAttendanceForService =
        useCallback(
            async (
                serviceId: number,
                suppliedServices?: ChurchService[],
                suppliedMembers?: Member[]
            ) => {

                setLoading(true);
                setError("");
                setMessage("");

                try {

                    const currentServices =
                        suppliedServices ||
                        services;

                    const currentMembers =
                        suppliedMembers ||
                        members;

                    let service =
                        currentServices.find(
                            item =>
                                Number(
                                    item.churchServiceId
                                ) ===
                                Number(
                                    serviceId
                                )
                        );

                    if (!service) {

                        const freshServices =
                            await loadChurchServices();

                        service =
                            freshServices.find(
                                item =>
                                    Number(
                                        item.churchServiceId
                                    ) ===
                                    Number(
                                        serviceId
                                    )
                            );
                    }

                    if (!service) {

                        throw new Error(
                            "The selected church service was not found."
                        );
                    }

                    setSelectedService(
                        service
                    );

                    const serviceStatus =
                        (
                            service.status ||
                            "SCHEDULED"
                        )
                            .trim()
                            .toUpperCase();

                    // -------------------------------------------------
                    // ONLY COMPLETED SERVICES
                    // -------------------------------------------------

                    if (
                        serviceStatus !==
                        "COMPLETED"
                    ) {

                        setAttendance(
                            []
                        );

                        resetDashboard();

                        setAttendanceAvailable(
                            false
                        );

                        if (
                            serviceStatus ===
                            "CANCELLED"
                        ) {

                            setMessage(
                                "This church service was cancelled. Attendance cannot be recorded."
                            );

                        } else {

                            setMessage(
                                "This church service has not been completed yet. Attendance will become available after the service is completed."
                            );
                        }

                        return;
                    }

                    // -------------------------------------------------
                    // GET ATTENDANCE
                    // -------------------------------------------------

                    const url =
                        `${API_BASE_URL}/Attendance/church-service/${serviceId}`;

                    console.log(
                        "ATTENDANCE: Loading attendance:",
                        url
                    );

                    const response =
                        await apiFetch(
                            url
                        );

                    const text =
                        await response.text();

                    let data:
                        AttendanceApiResponse |
                        null = null;

                    try {

                        data =
                            text
                                ? JSON.parse(
                                    text
                                )
                                : null;

                    } catch {

                        console.error(
                            "ATTENDANCE INVALID JSON:",
                            text
                        );

                        throw new Error(
                            "The attendance API returned an invalid response."
                        );
                    }

                    if (!data) {

                        throw new Error(
                            "The attendance API returned an empty response."
                        );
                    }

                    console.log(
                        "ATTENDANCE API DATA:",
                        data
                    );

                    // -------------------------------------------------
                    // API AVAILABILITY
                    // -------------------------------------------------

                    if (
                        data.canRecordAttendance ===
                        false
                    ) {

                        setAttendance(
                            []
                        );

                        resetDashboard();

                        setAttendanceAvailable(
                            false
                        );

                        setMessage(
                            data.message ||
                            "Attendance is not available for this church service."
                        );

                        return;
                    }

                    // -------------------------------------------------
                    // EXISTING RECORDS
                    // -------------------------------------------------

                    const existing =
                        Array.isArray(
                            data.attendance
                        )
                            ? data.attendance
                            : [];

                    console.log(
                        "ATTENDANCE EXISTING RECORDS:",
                        existing
                    );

                    // -------------------------------------------------
                    // BUILD MEMBER ROWS
                    // -------------------------------------------------

                    const rows:
                        AttendanceRow[] =
                        currentMembers.map(
                            member => {

                                const record =
                                    existing.find(
                                        item =>
                                            Number(
                                                item.memberId
                                            ) ===
                                            Number(
                                                member.memberId
                                            )
                                    );

                                // -------------------------------------------------
                                // IMPORTANT:
                                // Combine MEMBER API + ATTENDANCE API
                                // so names are not lost.
                                // -------------------------------------------------

                                const mergedMember:
                                    Member = {

                                    ...member,

                                    memberCode:
                                        getMemberCode(
                                            member
                                        ) !== "—"
                                            ? getMemberCode(
                                                member
                                            )
                                            : getMemberCode(
                                                record ||
                                                member
                                            ),

                                    firstName:
                                        member.firstName ||
                                        member.FirstName ||
                                        record?.firstName ||
                                        record?.FirstName,

                                    middleName:
                                        member.middleName ||
                                        member.MiddleName ||
                                        record?.middleName ||
                                        record?.MiddleName,

                                    lastName:
                                        member.lastName ||
                                        member.LastName ||
                                        record?.lastName ||
                                        record?.LastName,

                                    fullName:
                                        member.fullName ||
                                        member.FullName ||
                                        record?.fullName ||
                                        record?.FullName,

                                    name:
                                        member.name ||
                                        member.Name ||
                                        record?.name ||
                                        record?.Name
                                };

                                const resolvedName =
                                    getMemberName(
                                        mergedMember
                                    );

                                console.log(
                                    "ATTENDANCE MEMBER ROW:",
                                    {
                                        memberId:
                                            member.memberId,

                                        memberCode:
                                            getMemberCode(
                                                mergedMember
                                            ),

                                        name:
                                            resolvedName,

                                        member,
                                        record
                                    }
                                );

                                return {

                                    memberId:
                                        member.memberId,

                                    memberCode:
                                        getMemberCode(
                                            mergedMember
                                        ),

                                    fullName:
                                        resolvedName,

                                    ministry:
                                        getMemberMinistry(
                                            member
                                        ),

                                    status:
                                        normalizeStatus(
                                            record?.status
                                        ),

                                    attendanceId:
                                        record?.attendanceId
                                };
                            }
                        );

                    console.log(
                        "ATTENDANCE FINAL ROWS:",
                        rows
                    );

                    setAttendance(
                        rows
                    );

                    setAttendanceAvailable(
                        true
                    );

                    calculateDashboard(
                        rows
                    );

                    setMessage(
                        data.message ||
                        "Attendance is available for this completed church service."
                    );

                } catch (err) {

                    console.error(
                        "LOAD ATTENDANCE ERROR:",
                        err
                    );

                    setAttendance(
                        []
                    );

                    resetDashboard();

                    setAttendanceAvailable(
                        false
                    );

                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load attendance."
                    );

                } finally {

                    setLoading(false);
                }

            },
            [
                services,
                members,
                loadChurchServices,
                resetDashboard,
                calculateDashboard
            ]
        );

    // =========================================================
    // SERVICE CHANGE
    // =========================================================

    const handleServiceChange =
        async (
            value: string
        ) => {

            setError("");
            setMessage("");
            setSearch("");

            if (!value) {

                setSelectedServiceId(
                    ""
                );

                setSelectedService(
                    null
                );

                setAttendance(
                    []
                );

                setAttendanceAvailable(
                    false
                );

                resetDashboard();

                return;
            }

            const id =
                Number(value);

            if (
                !Number.isFinite(id) ||
                id <= 0
            ) {

                setError(
                    "Invalid church service selected."
                );

                return;
            }

            setSelectedServiceId(
                id
            );

            await loadAttendanceForService(
                id
            );
        };

    // =========================================================
    // UPDATE STATUS
    // =========================================================

    const updateStatus = (
        memberId: number,
        status: AttendanceStatus
    ) => {

        if (!attendanceAvailable) {
            return;
        }

        const updated =
            attendance.map(
                row =>
                    row.memberId ===
                    memberId
                        ? {
                            ...row,
                            status
                        }
                        : row
            );

        setAttendance(
            updated
        );

        calculateDashboard(
            updated
        );
    };

    // =========================================================
    // SAVE ATTENDANCE
    // =========================================================

    const saveAttendance =
        async () => {

            if (!selectedServiceId) {

                setError(
                    "Please select a church service."
                );

                return;
            }

            if (!selectedService) {

                setError(
                    "Church service information is unavailable."
                );

                return;
            }

            const status =
                (
                    selectedService.status ||
                    ""
                )
                    .trim()
                    .toUpperCase();

            if (
                status !==
                "COMPLETED"
            ) {

                setError(
                    "Attendance cannot be saved until the church service is completed."
                );

                return;
            }

            if (
                attendance.length ===
                0
            ) {

                setError(
                    "There are no active members to record."
                );

                return;
            }

            try {

                setSaving(
                    true
                );

                setError("");
                setMessage("");

                const payload = {
                    attendance:
                        attendance.map(
                            row => ({
                                memberId:
                                    row.memberId,

                                status:
                                    row.status
                            })
                        )
                };

                console.log(
                    "SAVE ATTENDANCE PAYLOAD:",
                    payload
                );

                const url =
                    `${API_BASE_URL}/Attendance/church-service/${selectedServiceId}`;

                const response =
                    await apiFetch(
                        url,
                        {
                            method:
                                "POST",

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );

                const text =
                    await response.text();

                let data:
                    any = {};

                try {

                    data =
                        text
                            ? JSON.parse(
                                text
                            )
                            : {};

                } catch {

                    data = {
                        message:
                            text
                    };
                }

                console.log(
                    "SAVE ATTENDANCE RESPONSE:",
                    response.status,
                    data
                );

                if (!response.ok) {

                    throw new ApiError(
                        data?.message ||
                        text ||
                        `Unable to save attendance. Server returned ${response.status}.`,
                        response.status
                    );
                }

                setMessage(
                    `Attendance saved successfully. ${
                        data?.savedRecords ??
                        attendance.length
                    } record(s) saved.`
                );

                await loadAttendanceForService(
                    Number(
                        selectedServiceId
                    )
                );

            } catch (err) {

                console.error(
                    "SAVE ATTENDANCE ERROR:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to save attendance."
                );

            } finally {

                setSaving(
                    false
                );
            }
        };

    // =========================================================
    // REFRESH
    // =========================================================

    const handleRefresh =
        async () => {

            setError("");
            setMessage("");

            try {

                setLoading(
                    true
                );

                const [
                    freshMembers,
                    freshServices
                ] =
                    await Promise.all([
                        loadMembers(),
                        loadChurchServices()
                    ]);

                if (
                    selectedServiceId
                ) {

                    const service =
                        freshServices.find(
                            item =>
                                Number(
                                    item.churchServiceId
                                ) ===
                                Number(
                                    selectedServiceId
                                )
                        );

                    if (!service) {

                        setSelectedService(
                            null
                        );

                        setAttendance(
                            []
                        );

                        setAttendanceAvailable(
                            false
                        );

                        resetDashboard();

                        setError(
                            "The selected church service was not found."
                        );

                        return;
                    }

                    setSelectedService(
                        service
                    );

                    await loadAttendanceForService(
                        Number(
                            selectedServiceId
                        ),
                        freshServices,
                        freshMembers
                    );

                } else {

                    setMessage(
                        "Attendance module refreshed successfully."
                    );
                }

            } catch (err) {

                console.error(
                    "ATTENDANCE REFRESH ERROR:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to refresh attendance."
                );

            } finally {

                setLoading(
                    false
                );
            }
        };

    // =========================================================
    // FILTER
    // =========================================================

   // =============================================================
// FILTER + ALPHABETICAL SORT
// =============================================================

const filteredAttendance =
    useMemo(() => {

        const keyword =
            search
                .trim()
                .toLowerCase();

        const filtered =
            !keyword
                ? [...attendance]
                : attendance.filter(
                    row =>
                        row.fullName
                            .toLowerCase()
                            .includes(
                                keyword
                            ) ||

                        row.memberCode
                            .toLowerCase()
                            .includes(
                                keyword
                            ) ||

                        row.ministry
                            .toLowerCase()
                            .includes(
                                keyword
                            )
                );

        // ---------------------------------------------------------
        // SORT MEMBERS ALPHABETICALLY BY FULL NAME (A-Z)
        // ---------------------------------------------------------

        return filtered.sort(
            (a, b) =>
                a.fullName.localeCompare(
                    b.fullName,
                    undefined,
                    {
                        sensitivity: "base"
                    }
                )
        );

    }, [
        attendance,
        search
    ]);
    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div className="attendance-page">

            {/* HEADER */}

            <div className="attendance-header">

                <div className="attendance-title-row">

                    <div className="attendance-icon">
                        ✓
                    </div>

                    <div>

                        <h1>
                            EPIC ATTENDANCE
                        </h1>

                        <p>
                            Church Attendance Management
                        </p>

                    </div>

                </div>

                <button
                    type="button"
                    className="attendance-refresh-btn"
                    onClick={
                        handleRefresh
                    }
                    disabled={
                        loading ||
                        saving
                    }
                >
                    ↻ Refresh
                </button>

            </div>

            {/* ALERTS */}

            {message && (

                <div className="attendance-success">

                    ✓ {message}

                </div>
            )}

            {error && (

                <div className="attendance-error">

                    ⚠ {error}

                </div>
            )}

            {/* CONTROLS */}

            <div className="attendance-control-card">

                <div className="control-group">

                    <label>
                        CHURCH SERVICE
                    </label>

                    <select
                        value={
                            selectedServiceId
                        }
                        onChange={
                            e =>
                                void handleServiceChange(
                                    e.target.value
                                )
                        }
                        disabled={
                            loading ||
                            saving
                        }
                    >

                        <option value="">
                            Select Church Service
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

                                    {
                                        formatDate(
                                            service.serviceDate
                                        )
                                    }

                                    {" — "}

                                    {
                                        service.status ||
                                        "SCHEDULED"
                                    }

                                </option>
                            )
                        )}

                    </select>

                </div>

                <div className="control-group">

                    <label>
                        SERVICE DATE
                    </label>

                    <input
                        type="text"
                        readOnly
                        value={
                            selectedService
                                ? formatDate(
                                    selectedService.serviceDate
                                )
                                : ""
                        }
                        placeholder="Select a church service"
                    />

                </div>

                <div className="control-group search-group">

                    <label>
                        SEARCH MEMBER
                    </label>

                    <input
                        type="text"
                        placeholder="Search name, code, ministry..."
                        value={
                            search
                        }
                        onChange={
                            e =>
                                setSearch(
                                    e.target.value
                                )
                        }
                        disabled={
                            !attendanceAvailable
                        }
                    />

                </div>

            </div>

            {/* SERVICE STATUS */}

            {selectedService && (

                <div
                    className={
                        `attendance-service-banner ${(
                            selectedService.status ||
                            "scheduled"
                        ).toLowerCase()}`
                    }
                >

                    <strong>
                        {
                            selectedService.serviceName
                        }
                    </strong>

                    <span>
                        {" • "}
                        {
                            formatDate(
                                selectedService.serviceDate
                            )
                        }
                    </span>

                    {selectedService.startTime && (

                        <span>

                            {" • "}

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

                    <span>

                        {" • "}

                        {
                            selectedService.status ||
                            "SCHEDULED"
                        }

                    </span>

                    {!attendanceAvailable && (

                        <span>
                            {" — Attendance not yet available"}
                        </span>
                    )}

                </div>
            )}

            {/* DASHBOARD */}

            <div className="attendance-stat-grid">

                <StatCard
                    label="TOTAL MEMBERS"
                    value={
                        dashboard.totalRecords
                    }
                    className="stat-total"
                />

                <StatCard
                    label="PRESENT"
                    value={
                        dashboard.present
                    }
                    className="stat-present"
                />

                <StatCard
                    label="LATE"
                    value={
                        dashboard.late
                    }
                    className="stat-late"
                />

                <StatCard
                    label="EARLY"
                    value={
                        dashboard.early
                    }
                    className="stat-early"
                />

                <StatCard
                    label="ABSENT"
                    value={
                        dashboard.absent
                    }
                    className="stat-absent"
                />

                <StatCard
                    label="EXCUSED"
                    value={
                        dashboard.excused
                    }
                    className="stat-excused"
                />

                <div className="attendance-rate-card">

                    <div className="rate-label">
                        ATTENDANCE RATE
                    </div>

                    <div className="rate-value">

                        {
                            dashboard.attendanceRate
                        }%

                    </div>

                    <div className="rate-bar">

                        <div
                            className="rate-progress"
                            style={{
                                width:
                                    `${Math.min(
                                        dashboard.attendanceRate,
                                        100
                                    )}%`
                            }}
                        />

                    </div>

                </div>

            </div>

            {/* TABLE */}

            <div className="attendance-table-card">

                <div className="table-card-header">

                    <div>

                        <h2>
                            Attendance List
                        </h2>

                        <p>

                            {attendanceAvailable
                                ? "Mark the attendance status of each active member."
                                : "Attendance becomes available after the church service is completed."}

                        </p>

                    </div>

                    <button
                        type="button"
                        className="save-attendance-btn"
                        onClick={
                            saveAttendance
                        }
                        disabled={
                            saving ||
                            loading ||
                            !attendanceAvailable ||
                            attendance.length === 0
                        }
                    >

                        {saving
                            ? "Saving..."
                            : "✓ Save All Attendance"}

                    </button>

                </div>

                {/* LOADING */}

                {loading ? (

                    <div className="attendance-loading">

                        <div className="loading-spinner" />

                        <span>
                            Loading attendance...
                        </span>

                    </div>

                ) : !selectedServiceId ? (

                    <div className="empty-attendance">

                        Select a church service to begin.

                    </div>

                ) : !attendanceAvailable ? (

                    <div className="attendance-not-ready">

                        <div className="not-ready-icon">
                            ◷
                        </div>

                        <h3>
                            Attendance Not Yet Available
                        </h3>

                        <p>

                            {(
                                selectedService?.status ||
                                ""
                            ).toUpperCase() ===
                            "CANCELLED"

                                ? "This church service was cancelled. Attendance cannot be recorded."

                                : "This church service is still scheduled. Once the service is completed, attendance recording will become available."}

                        </p>

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
                                        CODE
                                    </th>

                                    <th>
                                        MINISTRY
                                    </th>

                                    <th>
                                        ATTENDANCE STATUS
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredAttendance.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan={
                                                5
                                            }
                                            className="empty-attendance"
                                        >

                                            No members found.

                                        </td>

                                    </tr>

                                ) : (

                                    filteredAttendance.map(
                                        (
                                            row,
                                            index
                                        ) => (

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

                                                    <div className="member-name-cell">

                                                        <div className="member-avatar">

                                                            {
                                                                getInitials(
                                                                    row.fullName
                                                                )
                                                            }

                                                        </div>

                                                        <strong>

                                                            {
                                                                row.fullName
                                                            }

                                                        </strong>

                                                    </div>

                                                </td>

                                                <td>

                                                    <span className="member-code">

                                                        {
                                                            row.memberCode
                                                        }

                                                    </span>

                                                </td>

                                                <td>

                                                    {
                                                        row.ministry
                                                    }

                                                </td>

                                                <td>

                                                    <div className="status-buttons">

                                                        {[
                                                            "PRESENT",
                                                            "LATE",
                                                            "EARLY",
                                                            "ABSENT",
                                                            "EXCUSED"
                                                        ].map(
                                                            status => (

                                                                <button
                                                                    type="button"
                                                                    key={
                                                                        status
                                                                    }
                                                                    className={
                                                                        `${statusClass(
                                                                            status as AttendanceStatus
                                                                        )} ${
                                                                            row.status ===
                                                                            status
                                                                                ? "selected"
                                                                                : ""
                                                                        }`
                                                                    }
                                                                    onClick={() =>
                                                                        updateStatus(
                                                                            row.memberId,
                                                                            status as AttendanceStatus
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !attendanceAvailable ||
                                                                        saving
                                                                    }
                                                                >

                                                                    {
                                                                        statusIcon(
                                                                            status as AttendanceStatus
                                                                        )
                                                                    }

                                                                    {" "}

                                                                    {
                                                                        statusLabel(
                                                                            status as AttendanceStatus
                                                                        )
                                                                    }

                                                                </button>

                                                            )
                                                        )}

                                                    </div>

                                                </td>

                                            </tr>

                                        )
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

        </div>
    );
};

// =============================================================
// STAT CARD
// =============================================================

interface StatCardProps {
    label: string;
    value: number;
    className: string;
}

const StatCard: React.FC<
    StatCardProps
> = ({
    label,
    value,
    className
}) => {

    return (

        <div
            className={
                `attendance-stat-card ${className}`
            }
        >

            <div className="stat-label">

                {label}

            </div>

            <div className="stat-number">

                {value}

            </div>

        </div>
    );
};

// =============================================================
// STATUS NORMALIZATION
// =============================================================

const normalizeStatus = (
    status?: string
): AttendanceStatus => {

    switch (
        status
            ?.trim()
            .toUpperCase()
    ) {

        case "LATE":
            return "LATE";

        case "EARLY":
            return "EARLY";

        case "ABSENT":
            return "ABSENT";

        case "EXCUSED":
            return "EXCUSED";

        case "PRESENT":
        default:
            return "PRESENT";
    }
};

// =============================================================
// STATUS LABEL
// =============================================================

const statusLabel = (
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
    }
};

// =============================================================
// STATUS CLASS
// =============================================================

const statusClass = (
    status: AttendanceStatus
): string => {

    return (
        `attendance-status status-${status.toLowerCase()}`
    );
};

// =============================================================
// STATUS ICON
// =============================================================

const statusIcon = (
    status: AttendanceStatus
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
    }
};

// =============================================================
// INITIALS
// =============================================================

const getInitials = (
    name: string
): string => {

    const cleanName =
        name
            .trim()
            .replace(/\s+/g, " ");

    if (!cleanName) {
        return "?";
    }

    const parts =
        cleanName
            .split(" ")
            .filter(Boolean);

    if (
        parts.length ===
        1
    ) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[
            parts.length - 1
        ][0]
    ).toUpperCase();
};

// =============================================================
// DATE FORMAT
// =============================================================

const formatDate = (
    dateString?: string
): string => {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(
            dateString
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;
    }

    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
};

// =============================================================
// TIME FORMAT
// =============================================================

const formatTime = (
    time?: string
): string => {

    if (!time) {
        return "";
    }

    const parts =
        time.split(":");

    if (
        parts.length < 2
    ) {
        return time;
    }

    const hours =
        Number(
            parts[0]
        );

    const minutes =
        Number(
            parts[1]
        );

    if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
    ) {

        return time;
    }

    const date =
        new Date();

    date.setHours(
        hours,
        minutes,
        0,
        0
    );

    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
};

// =============================================================
// EXPORT
// =============================================================

export default Attendance;