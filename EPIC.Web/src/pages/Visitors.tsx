// ============================================================
// ADD THIS AT THE VERY TOP OF Visitors.tsx
// ============================================================

import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import "./Visitors.css";

// ============================================================
// API CONFIGURATION
// ============================================================

import { API_BASE_URL } from "../config.ts";

// ============================================================
// TYPES
// ============================================================

type Visitor = {
    visitorId: number;
    visitorCode: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    fullName?: string | null;
    gender?: string | null;
    birthDate?: string | null;
    contactNumber?: string | null;
    address?: string | null;
    invitedBy?: string | null;
    ministry?: string | null;
    firstVisitDate?: string | null;
    visitCount: number;
    followUpStatus: string;
    status: string;
    notes?: string | null;
    isConvertedToMember: boolean;
    convertedMemberId?: number | null;
    conversionDate?: string | null;
    createdDate?: string | null;
    updatedDate?: string | null;
};

type DashboardData = {
    totalVisitors: number;
    activeVisitors: number;
    newVisitors: number;
    contactedVisitors?: number;
    followUpVisitors?: number;
    followUps?: number;
    connectedVisitors: number;
    convertedMembers: number;
    firstTimeVisitors: number;
    returningVisitors: number;
};

type ChurchService = {
    churchServiceId: number;
    serviceName: string;
    serviceDate: string;
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
    status: string;
};

type AttendanceRecord = {
    visitorAttendanceId: number;
    visitorId: number;
    churchServiceId: number;
    serviceName: string;
    attendanceDate: string;
    status: string;
    recordedBy?: string | null;
    recordedDate?: string | null;
};

type VisitorAttendanceResponse = {
    visitor: {
        visitorId: number;
        visitorCode: string;
        fullName: string;
        visitCount: number;
        followUpStatus: string;
        isConvertedToMember: boolean;
    };
    attendance: AttendanceRecord[];
};

type VisitorForm = {
    firstName: string;
    middleName: string;
    lastName: string;
    gender: string;
    birthDate: string;
    contactNumber: string;
    address: string;
    invitedBy: string;
    ministry: string;
    firstVisitDate: string;
    notes: string;
};

type ViewMode = "table" | "cards";

type FollowUpStatus =
    | "NEW"
    | "CONTACTED"
    | "FOLLOW-UP"
    | "CONNECTED"
    | "CONVERTED";

const ATTENDANCE_STATUSES = [
    "PRESENT",
    "LATE",
    "EARLY",
    "ABSENT",
    "EXCUSED",
] as const;

const FOLLOW_UP_STATUSES: FollowUpStatus[] = [
    "NEW",
    "CONTACTED",
    "FOLLOW-UP",
    "CONNECTED",
    "CONVERTED",
];

const getToday = () =>
    new Date().toISOString().split("T")[0];

const EMPTY_FORM: VisitorForm = {
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    birthDate: "",
    contactNumber: "",
    address: "",
    invitedBy: "",
    ministry: "",
    firstVisitDate: getToday(),
    notes: "",
};

// ============================================================
// API
// ============================================================

async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {

    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt") ||
        "";

    const headers = new Headers(options.headers);

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

    const url =
        `${API_BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

    const response = await fetch(url, {
        ...options,
        headers,
    });

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
                        text;
                } catch {
                    message = text;
                }
            }
        } catch {
            // ignore
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return {} as T;
    }

    const text =
        await response.text();

    if (!text.trim()) {
        return {} as T;
    }

    return JSON.parse(text) as T;
}

// ============================================================
// HELPERS
// ============================================================

function getFullName(
    visitor: Visitor
): string {

    if (visitor.fullName?.trim()) {
        return visitor.fullName.trim();
    }

    return [
        visitor.firstName,
        visitor.middleName,
        visitor.lastName,
    ]
        .filter(
            value => value?.trim()
        )
        .join(" ");
}

function formatDate(
    value?: string | null
): string {

    if (!value) return "—";

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
}

function formatTime(
    value?: string | null
): string {

    if (!value) return "";

    const parts =
        value.split(":");

    const hour =
        Number(parts[0]);

    const minute =
        Number(parts[1] || 0);

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
}

function getVisitLabel(
    count: number
): string {

    if (count <= 0)
        return "No visits";

    if (count === 1)
        return "1st Visit";

    if (count === 2)
        return "2nd Visit";

    if (count === 3)
        return "3rd Visit";

    return `${count}th Visit`;
}

function getNextVisitLabel(
    count: number
): string {

    const next =
        count + 1;

    if (next === 1)
        return "1st Visit";

    if (next === 2)
        return "2nd Visit";

    if (next === 3)
        return "3rd Visit";

    return `${next}th Visit`;
}

function statusClass(
    status?: string | null
): string {

    return (
        status || "unknown"
    )
        .toLowerCase()
        .replace(
            /\s+/g,
            "-"
        );
}

// ============================================================
// COMPONENT
// ============================================================

export default function Visitor() {

    const [visitors, setVisitors] =
        useState<Visitor[]>([]);

    const [dashboard, setDashboard] =
        useState<DashboardData | null>(null);

    const [services, setServices] =
        useState<ChurchService[]>([]);

    const [attendanceHistory, setAttendanceHistory] =
        useState<AttendanceRecord[]>([]);

    const [selectedVisitor, setSelectedVisitor] =
        useState<Visitor | null>(null);

    const [selectedServiceId, setSelectedServiceId] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [filter, setFilter] =
        useState("ALL");

    const [visitFilter, setVisitFilter] =
        useState("ALL");

    const [viewMode, setViewMode] =
        useState<ViewMode>("table");

    const [form, setForm] =
        useState<VisitorForm>(EMPTY_FORM);

    const [attendanceStatus, setAttendanceStatus] =
        useState("PRESENT");

    const [showAddModal, setShowAddModal] =
        useState(false);

    const [showVisitModal, setShowVisitModal] =
        useState(false);

    const [showHistoryModal, setShowHistoryModal] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [historyLoading, setHistoryLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    // ========================================================
    // LOAD VISITORS
    // ========================================================

    const loadVisitors =
        useCallback(async () => {

            const data =
                await apiFetch<Visitor[]>(
                    "/Visitor"
                );

            setVisitors(
                Array.isArray(data)
                    ? data
                    : []
            );

        }, []);

    // ========================================================
    // LOAD DASHBOARD
    // ========================================================

    const loadDashboard =
        useCallback(async () => {

            const data =
                await apiFetch<DashboardData>(
                    "/Visitor/dashboard"
                );

            setDashboard(data);

        }, []);

    // ========================================================
    // LOAD SERVICES
    // ========================================================

    const loadServices =
        useCallback(async () => {

            const data =
                await apiFetch<ChurchService[]>(
                    "/ChurchServices"
                );

            const list =
                Array.isArray(data)
                    ? data
                    : [];

            const completed =
                list
                    .filter(
                        service =>
                            service.status
                                ?.toUpperCase() ===
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

            setServices(completed);

        }, []);

    // ========================================================
    // LOAD EVERYTHING
    // ========================================================

    const loadAll =
        useCallback(async () => {

            try {

                setLoading(true);
                setError("");

                await Promise.all([
                    loadVisitors(),
                    loadDashboard(),
                    loadServices(),
                ]);

            } catch (err) {

                console.error(
                    "Visitor load error:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load visitor data."
                );

            } finally {

                setLoading(false);
            }

        }, [
            loadVisitors,
            loadDashboard,
            loadServices,
        ]);

    useEffect(() => {
        void loadAll();
    }, [loadAll]);

    // ========================================================
    // FILTER
    // ========================================================

    const filteredVisitors =
        useMemo(() => {

            const query =
                search
                    .trim()
                    .toLowerCase();

            return visitors.filter(
                visitor => {

                    const name =
                        getFullName(
                            visitor
                        ).toLowerCase();

                    const matchesSearch =
                        !query ||
                        name.includes(query) ||
                        visitor.visitorCode
                            ?.toLowerCase()
                            .includes(query) ||
                        visitor.contactNumber
                            ?.toLowerCase()
                            .includes(query) ||
                        visitor.invitedBy
                            ?.toLowerCase()
                            .includes(query);

                    const matchesFollowUp =
                        filter === "ALL" ||
                        visitor.followUpStatus
                            ?.toUpperCase() ===
                        filter;

                    const matchesVisit =
                        visitFilter === "ALL" ||
                        (
                            visitFilter === "FIRST" &&
                            visitor.visitCount <= 1
                        ) ||
                        (
                            visitFilter === "RETURNING" &&
                            visitor.visitCount > 1
                        );

                    return (
                        matchesSearch &&
                        matchesFollowUp &&
                        matchesVisit
                    );
                }
            );

        }, [
            visitors,
            search,
            filter,
            visitFilter,
        ]);

    // ========================================================
    // FORM
    // ========================================================

    const updateForm = (
        field: keyof VisitorForm,
        value: string
    ) => {

        setForm(current => ({
            ...current,
            [field]: value,
        }));
    };

    // ========================================================
    // CREATE VISITOR
    // ========================================================

    const handleCreateVisitor =
        async (
            event: React.FormEvent
        ) => {

            event.preventDefault();

            if (
                !form.firstName.trim() ||
                !form.lastName.trim()
            ) {

                setError(
                    "First name and last name are required."
                );

                return;
            }

            try {

                setSaving(true);
                setError("");
                setSuccess("");

                await apiFetch(
                    "/Visitor",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            firstName:
                                form.firstName.trim(),

                            middleName:
                                form.middleName.trim() ||
                                null,

                            lastName:
                                form.lastName.trim(),

                            gender:
                                form.gender ||
                                null,

                            birthDate:
                                form.birthDate ||
                                null,

                            contactNumber:
                                form.contactNumber.trim() ||
                                null,

                            address:
                                form.address.trim() ||
                                null,

                            invitedBy:
                                form.invitedBy.trim() ||
                                null,

                            ministry:
                                form.ministry.trim() ||
                                null,

                            firstVisitDate:
                                form.firstVisitDate ||
                                null,

                            notes:
                                form.notes.trim() ||
                                null,
                        }),
                    }
                );

                setSuccess(
                    "Visitor successfully registered."
                );

                setShowAddModal(false);

                setForm({
                    ...EMPTY_FORM,
                    firstVisitDate:
                        getToday(),
                });

                await Promise.all([
                    loadVisitors(),
                    loadDashboard(),
                ]);

            } catch (err) {

                console.error(
                    "Create visitor error:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to create visitor."
                );

            } finally {

                setSaving(false);
            }
        };

    // ========================================================
    // RECORD VISIT
    // ========================================================

    const openVisitModal =
        (visitor: Visitor) => {

            setSelectedVisitor(visitor);
            setSelectedServiceId("");
            setAttendanceStatus("PRESENT");
            setError("");
            setSuccess("");
            setShowVisitModal(true);
        };

    const recordVisit =
        async (
            event: React.FormEvent
        ) => {

            event.preventDefault();

            if (!selectedVisitor) {
                setError(
                    "Please select a visitor."
                );
                return;
            }

            if (!selectedServiceId) {
                setError(
                    "Please select a completed church service."
                );
                return;
            }

            try {

                setSaving(true);
                setError("");
                setSuccess("");

                const result =
                    await apiFetch<{
                        message: string;
                        visitorId: number;
                        visitorCode: string;
                        visitCount: number;
                        attendanceId: number;
                        status: string;
                    }>(
                        `/Visitor/${selectedVisitor.visitorId}/attendance`,
                        {
                            method: "POST",
                            body: JSON.stringify({
                                churchServiceId:
                                    Number(
                                        selectedServiceId
                                    ),
                                status:
                                    attendanceStatus,
                            }),
                        }
                    );

                setShowVisitModal(false);

                setSuccess(
                    `${getFullName(
                        selectedVisitor
                    )} successfully recorded as ${getVisitLabel(
                        result.visitCount
                    )}.`
                );

                await Promise.all([
                    loadVisitors(),
                    loadDashboard(),
                ]);

            } catch (err) {

                console.error(
                    "Record visitor attendance error:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to record attendance."
                );

            } finally {

                setSaving(false);
            }
        };

    // ========================================================
    // HISTORY
    // ========================================================

    const openHistory =
        async (
            visitor: Visitor
        ) => {

            setSelectedVisitor(visitor);
            setAttendanceHistory([]);
            setShowHistoryModal(true);
            setHistoryLoading(true);
            setError("");

            try {

                const data =
                    await apiFetch<VisitorAttendanceResponse>(
                        `/Visitor/${visitor.visitorId}/attendance`
                    );

                setAttendanceHistory(
                    Array.isArray(
                        data.attendance
                    )
                        ? data.attendance
                        : []
                );

            } catch (err) {

                console.error(
                    "History error:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load attendance history."
                );

            } finally {

                setHistoryLoading(false);
            }
        };

    // ========================================================
    // FOLLOW UP
    // ========================================================

    const updateFollowUp =
        async (
            visitor: Visitor,
            status: string
        ) => {

            try {

                setError("");
                setSuccess("");

                await apiFetch(
                    `/Visitor/${visitor.visitorId}/follow-up`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            status,
                        }),
                    }
                );

                setSuccess(
                    "Follow-up status updated."
                );

                await Promise.all([
                    loadVisitors(),
                    loadDashboard(),
                ]);

            } catch (err) {

                console.error(
                    "Follow-up error:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to update follow-up status."
                );
            }
        };

    // ========================================================
    // MODALS
    // ========================================================

    const openAddModal = () => {

        setForm({
            ...EMPTY_FORM,
            firstVisitDate:
                getToday(),
        });

        setError("");
        setSuccess("");
        setShowAddModal(true);
    };

    const closeModals = () => {

        if (saving) return;

        setShowAddModal(false);
        setShowVisitModal(false);
        setShowHistoryModal(false);
    };

    const refreshData = async () => {

        setError("");
        setSuccess("");

        await loadAll();

        setSuccess(
            "Visitor data refreshed successfully."
        );
    };

    // ========================================================
    // STATS
    // ========================================================

    const stats =
        dashboard ?? {
            totalVisitors:
                visitors.length,

            activeVisitors:
                visitors.filter(
                    x =>
                        x.status
                            ?.toUpperCase() ===
                        "ACTIVE"
                ).length,

            newVisitors:
                visitors.filter(
                    x =>
                        x.followUpStatus
                            ?.toUpperCase() ===
                        "NEW"
                ).length,

            contactedVisitors: 0,

            followUpVisitors:
                visitors.filter(
                    x =>
                        ["FOLLOW-UP", "CONTACTED"]
                            .includes(
                                x.followUpStatus
                                    ?.toUpperCase()
                            )
                ).length,

            connectedVisitors:
                visitors.filter(
                    x =>
                        x.followUpStatus
                            ?.toUpperCase() ===
                        "CONNECTED"
                ).length,

            convertedMembers:
                visitors.filter(
                    x =>
                        x.isConvertedToMember
                ).length,

            firstTimeVisitors:
                visitors.filter(
                    x =>
                        x.visitCount <= 1
                ).length,

            returningVisitors:
                visitors.filter(
                    x =>
                        x.visitCount > 1
                ).length,
        };

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div className="visitors-page">

            <div className="visitors-shell">

                <header className="visitors-header">

                    <div>
                        <div className="eyebrow">
                            EPIC CHURCH MANAGEMENT SYSTEM
                        </div>

                        <h1>
                            Visitors Management
                        </h1>

                        <p>
                            Track visitors,
                            attendance,
                            follow-ups and
                            connection progress.
                        </p>
                    </div>

                    <div className="header-actions">

                        <button
                            className="btn btn-secondary"
                            onClick={() =>
                                void refreshData()
                            }
                            disabled={loading}
                        >
                            ↻
                            <span>
                                Refresh
                            </span>
                        </button>

                        <button
                            className="btn btn-primary"
                            onClick={openAddModal}
                        >
                            +
                            <span>
                                Add Visitor
                            </span>
                        </button>

                    </div>

                </header>

                {error && (
                    <div className="alert alert-error">
                        <span className="alert-icon">
                            !
                        </span>

                        <div>
                            <strong>
                                Unable to complete request
                            </strong>

                            <p>{error}</p>
                        </div>

                        <button
                            onClick={() =>
                                setError("")
                            }
                        >
                            ×
                        </button>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <span className="alert-icon">
                            ✓
                        </span>

                        <div>
                            <strong>
                                Success
                            </strong>

                            <p>{success}</p>
                        </div>

                        <button
                            onClick={() =>
                                setSuccess("")
                            }
                        >
                            ×
                        </button>
                    </div>
                )}

                <section className="stats-grid">

                    <div className="stat-card stat-blue">
                        <div className="stat-icon">
                            👥
                        </div>

                        <div>
                            <span>Total Visitors</span>
                            <strong>
                                {stats.totalVisitors}
                            </strong>
                            <small>
                                All registered visitors
                            </small>
                        </div>
                    </div>

                    <div className="stat-card stat-green">
                        <div className="stat-icon">
                            ✓
                        </div>

                        <div>
                            <span>Active Visitors</span>
                            <strong>
                                {stats.activeVisitors}
                            </strong>
                            <small>
                                Currently active
                            </small>
                        </div>
                    </div>

                    <div className="stat-card stat-orange">
                        <div className="stat-icon">
                            ✦
                        </div>

                        <div>
                            <span>New Visitors</span>
                            <strong>
                                {stats.newVisitors}
                            </strong>
                            <small>
                                Need first follow-up
                            </small>
                        </div>
                    </div>

                    <div className="stat-card stat-purple">
                        <div className="stat-icon">
                            ↗
                        </div>

                        <div>
                            <span>Follow-Ups</span>
                            <strong>
                                {stats.followUpVisitors ??
                                    stats.followUps ??
                                    0}
                            </strong>
                            <small>
                                Contacted / follow-up
                            </small>
                        </div>
                    </div>

                    <div className="stat-card stat-teal">
                        <div className="stat-icon">
                            ♥
                        </div>

                        <div>
                            <span>Connected</span>
                            <strong>
                                {stats.connectedVisitors}
                            </strong>
                            <small>
                                Connected to church
                            </small>
                        </div>
                    </div>

                    <div className="stat-card stat-gold">
                        <div className="stat-icon">
                            ★
                        </div>

                        <div>
                            <span>Converted</span>
                            <strong>
                                {stats.convertedMembers}
                            </strong>
                            <small>
                                Became members
                            </small>
                        </div>
                    </div>

                </section>

                <section className="journey-card">

                    <div className="journey-header">

                        <div>
                            <span className="section-kicker">
                                VISITOR JOURNEY
                            </span>

                            <h2>
                                Connection Progress
                            </h2>
                        </div>

                        <div className="journey-summary">

                            <span>
                                First-time:
                                <strong>
                                    {" "}
                                    {stats.firstTimeVisitors}
                                </strong>
                            </span>

                            <span>
                                Returning:
                                <strong>
                                    {" "}
                                    {stats.returningVisitors}
                                </strong>
                            </span>

                        </div>

                    </div>

                    <div className="journey-track">

                        {[
                            [
                                "1",
                                "First Visit",
                                stats.firstTimeVisitors,
                            ],
                            [
                                "2",
                                "Returning",
                                stats.returningVisitors,
                            ],
                            [
                                "3",
                                "Connected",
                                stats.connectedVisitors,
                            ],
                            [
                                "4",
                                "Member",
                                stats.convertedMembers,
                            ],
                        ].map(
                            (
                                item,
                                index
                            ) => (
                                <React.Fragment
                                    key={item[1]}
                                >

                                    <div className="journey-step">

                                        <div className="journey-number">
                                            {item[0]}
                                        </div>

                                        <strong>
                                            {item[1]}
                                        </strong>

                                        <span>
                                            {item[2]}
                                        </span>

                                    </div>

                                    {index < 3 && (
                                        <div className="journey-line" />
                                    )}

                                </React.Fragment>
                            )
                        )}

                    </div>

                </section>

                <section className="visitor-content">

                    <div className="content-toolbar">

                        <div className="search-box">

                            <span>⌕</span>

                            <input
                                type="text"
                                placeholder="Search name, visitor code, contact..."
                                value={search}
                                onChange={e =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                            />

                            {search && (
                                <button
                                    onClick={() =>
                                        setSearch("")
                                    }
                                >
                                    ×
                                </button>
                            )}

                        </div>

                        <select
                            className="filter-select"
                            value={filter}
                            onChange={e =>
                                setFilter(
                                    e.target.value
                                )
                            }
                        >

                            <option value="ALL">
                                All Follow-Up
                            </option>

                            {FOLLOW_UP_STATUSES.map(
                                status => (
                                    <option
                                        key={status}
                                        value={status}
                                    >
                                        {status}
                                    </option>
                                )
                            )}

                        </select>

                        <select
                            className="filter-select"
                            value={visitFilter}
                            onChange={e =>
                                setVisitFilter(
                                    e.target.value
                                )
                            }
                        >

                            <option value="ALL">
                                All Visits
                            </option>

                            <option value="FIRST">
                                First-Time Visitors
                            </option>

                            <option value="RETURNING">
                                Returning Visitors
                            </option>

                        </select>

                        <div className="view-toggle">

                            <button
                                className={
                                    viewMode === "table"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setViewMode("table")
                                }
                            >
                                ☷
                            </button>

                            <button
                                className={
                                    viewMode === "cards"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setViewMode("cards")
                                }
                            >
                                ▦
                            </button>

                        </div>

                    </div>

                    <div className="results-header">

                        <div>
                            <strong>
                                Visitor Records
                            </strong>

                            <span>
                                {" "}
                                {filteredVisitors.length}{" "}
                                record
                                {filteredVisitors.length !==
                                    1
                                    ? "s"
                                    : ""}
                            </span>
                        </div>

                        <span>
                            Real-time database data
                        </span>

                    </div>

                    {loading ? (

                        <div className="loading-state">
                            <div className="spinner" />

                            <strong>
                                Loading visitor records...
                            </strong>

                            <span>
                                Connecting to EPIC database
                            </span>
                        </div>

                    ) : filteredVisitors.length === 0 ? (

                        <div className="empty-state">

                            <div className="empty-icon">
                                👥
                            </div>

                            <h3>
                                No visitors found
                            </h3>

                            <p>
                                Add your first visitor
                                or change your filters.
                            </p>

                            <button
                                className="btn btn-primary"
                                onClick={
                                    openAddModal
                                }
                            >
                                + Add Visitor
                            </button>

                        </div>

                    ) : viewMode === "table" ? (

                        <div className="table-wrapper">

                            <table className="visitors-table">

                                <thead>
                                    <tr>
                                        <th>Visitor</th>
                                        <th>Visits</th>
                                        <th>First Visit</th>
                                        <th>Follow-Up</th>
                                        <th>Status</th>
                                        <th>Invited By</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {filteredVisitors.map(
                                        visitor => (

                                            <tr
                                                key={
                                                    visitor.visitorId
                                                }
                                            >

                                                <td>
                                                    <div className="visitor-cell">

                                                        <div className="avatar">
                                                            {visitor.firstName
                                                                ?.charAt(0)
                                                                .toUpperCase()}
                                                        </div>

                                                        <div>
                                                            <strong>
                                                                {getFullName(
                                                                    visitor
                                                                )}
                                                            </strong>

                                                            <span>
                                                                {
                                                                    visitor.visitorCode
                                                                }
                                                            </span>
                                                        </div>

                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="visit-count-cell">
                                                        <strong>
                                                            {
                                                                visitor.visitCount
                                                            }
                                                        </strong>

                                                        <span>
                                                            {getVisitLabel(
                                                                visitor.visitCount
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="date-cell">
                                                        <strong>
                                                            {formatDate(
                                                                visitor.firstVisitDate
                                                            )}
                                                        </strong>

                                                        <span>
                                                            First visit
                                                        </span>
                                                    </div>
                                                </td>

                                                <td>

                                                    <select
                                                        className={`status-select ${statusClass(
                                                            visitor.followUpStatus
                                                        )}`}
                                                        value={
                                                            visitor.followUpStatus ||
                                                            "NEW"
                                                        }
                                                        onChange={e =>
                                                            void updateFollowUp(
                                                                visitor,
                                                                e.target.value
                                                            )
                                                        }
                                                    >

                                                        {FOLLOW_UP_STATUSES.map(
                                                            status => (
                                                                <option
                                                                    key={status}
                                                                    value={status}
                                                                >
                                                                    {status}
                                                                </option>
                                                            )
                                                        )}

                                                    </select>

                                                </td>

                                                <td>

                                                    {visitor.isConvertedToMember ? (

                                                        <span className="badge badge-converted">
                                                            ✓ Member
                                                        </span>

                                                    ) : (

                                                        <span
                                                            className={`badge ${visitor.status?.toUpperCase() ===
                                                                    "ACTIVE"
                                                                    ? "badge-active"
                                                                    : "badge-inactive"
                                                                }`}
                                                        >
                                                            {
                                                                visitor.status ||
                                                                "INACTIVE"
                                                            }
                                                        </span>

                                                    )}

                                                </td>

                                                <td>
                                                    <span className="invited-by">
                                                        {
                                                            visitor.invitedBy ||
                                                            "—"
                                                        }
                                                    </span>
                                                </td>

                                                <td>

                                                    <div className="action-buttons">

                                                        <button
                                                            className="action-primary"
                                                            onClick={() =>
                                                                openVisitModal(
                                                                    visitor
                                                                )
                                                            }
                                                        >
                                                            + Visit
                                                        </button>

                                                        <button
                                                            className="action-secondary"
                                                            onClick={() =>
                                                                void openHistory(
                                                                    visitor
                                                                )
                                                            }
                                                        >
                                                            History
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    ) : (

                        <div className="visitor-card-grid">

                            {filteredVisitors.map(
                                visitor => (

                                    <article
                                        className="visitor-card"
                                        key={
                                            visitor.visitorId
                                        }
                                    >

                                        <div className="visitor-card-top">

                                            <div className="avatar avatar-large">
                                                {visitor.firstName
                                                    ?.charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div>

                                                <span className="visitor-code">
                                                    {
                                                        visitor.visitorCode
                                                    }
                                                </span>

                                                <h3>
                                                    {getFullName(
                                                        visitor
                                                    )}
                                                </h3>

                                                <span>
                                                    {
                                                        visitor.contactNumber ||
                                                        "No contact number"
                                                    }
                                                </span>

                                            </div>

                                        </div>

                                        <div className="card-visit-highlight">

                                            <div>
                                                <span>
                                                    Current Journey
                                                </span>

                                                <strong>
                                                    {getVisitLabel(
                                                        visitor.visitCount
                                                    )}
                                                </strong>
                                            </div>

                                            <div className="next-visit">

                                                <span>
                                                    Next
                                                </span>

                                                <strong>
                                                    {getNextVisitLabel(
                                                        visitor.visitCount
                                                    )}
                                                </strong>

                                            </div>

                                        </div>

                                        <div className="card-details">

                                            <div>
                                                <span>
                                                    First Visit
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        visitor.firstVisitDate
                                                    )}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Invited By
                                                </span>

                                                <strong>
                                                    {
                                                        visitor.invitedBy ||
                                                        "—"
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Ministry
                                                </span>

                                                <strong>
                                                    {
                                                        visitor.ministry ||
                                                        "—"
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Follow-Up
                                                </span>

                                                <strong>
                                                    {
                                                        visitor.followUpStatus ||
                                                        "NEW"
                                                    }
                                                </strong>
                                            </div>

                                        </div>

                                        <div className="card-actions">

                                            <button
                                                className="btn btn-primary"
                                                onClick={() =>
                                                    openVisitModal(
                                                        visitor
                                                    )
                                                }
                                            >
                                                + Record Visit
                                            </button>

                                            <button
                                                className="btn btn-secondary"
                                                onClick={() =>
                                                    void openHistory(
                                                        visitor
                                                    )
                                                }
                                            >
                                                View History
                                            </button>

                                        </div>

                                    </article>
                                )
                            )}

                        </div>
                    )}

                </section>

            </div>

            {/* =====================================================
                ADD VISITOR
            ===================================================== */}

            {showAddModal && (

                <div
                    className="modal-backdrop"
                    onMouseDown={e => {

                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            closeModals();
                        }

                    }}
                >

                    <div className="modal modal-large">

                        <div className="modal-header">

                            <div>
                                <span className="section-kicker">
                                    NEW RECORD
                                </span>

                                <h2>
                                    Register Visitor
                                </h2>

                                <p>
                                    Add a new visitor to
                                    the EPIC database.
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={closeModals}
                            >
                                ×
                            </button>

                        </div>

                        <form
                            onSubmit={
                                handleCreateVisitor
                            }
                        >

                            <div className="form-section">

                                <h3>
                                    Personal Information
                                </h3>

                                <div className="form-grid">

                                    <label>
                                        First Name *

                                        <input
                                            value={
                                                form.firstName
                                            }
                                            onChange={e =>
                                                updateForm(
                                                    "firstName",
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />
                                    </label>

                                    <label>
                                        Middle Name

                                        <input
                                            value={
                                                form.middleName
                                            }
                                            onChange={e =>
                                                updateForm(
                                                    "middleName",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        Last Name *

                                        <input
                                            value={
                                                form.lastName
                                            }
                                            onChange={e =>
                                                updateForm(
                                                    "lastName",
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />
                                    </label>

                                    <label>
                                        Gender

                                        <select
                                            value={
                                                form.gender
                                            }
                                            onChange={e =>
                                                updateForm(
                                                    "gender",
                                                    e.target.value
                                                )
                                            }
                                        >

                                            <option value="">
                                                Select
                                            </option>

                                            <option value="MALE">
                                                Male
                                            </option>

                                            <option value="FEMALE">
                                                Female
                                            </option>

                                        </select>
                                    </label>

                                    <label>
                                        Birth Date

                                        <input
                                            type="date"
                                            value={
                                                form.birthDate
                                            }
                                            onChange={e =>
                                                updateForm(
                                                    "birthDate",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        Contact Number

                                        <input
                                            value={
                                                form.contactNumber
                                            }
                                            onChange={e =>
                                                updateForm(
                                                    "contactNumber",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <label className="form-full">
                                        Address

                                        <input
                                            value={
                                                form.address
                                            }
                                            onChange={e =>
                                                updateForm(
                                                    "address",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </label>

                                </div>

                            </div>

                            <div className="form-section">

                                <h3>
                                    Visit Information
                                </h3>

                                <div className="form-grid">

                                    <label>
                                        Invited By

                                        <input
                                            value={
                                                form.invitedBy
                                            }
                                            onChange={e =>
                                                updateForm(
                                                    "invitedBy",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        Ministry

                                        <input
                                            value={
                                                form.ministry
                                            }
                                            onChange={e =>
                                                updateForm(
                                                    "ministry",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        First Visit Date

                                        <input
                                            type="date"
                                            value={
                                                form.firstVisitDate
                                            }
                                            onChange={e =>
                                                updateForm(
                                                    "firstVisitDate",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <label className="form-full">
                                        Notes

                                        <textarea
                                            rows={4}
                                            value={
                                                form.notes
                                            }
                                            onChange={e =>
                                                updateForm(
                                                    "notes",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </label>

                                </div>

                            </div>

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={closeModals}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : "Register Visitor"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* =====================================================
                RECORD VISIT
            ===================================================== */}

            {showVisitModal &&
                selectedVisitor && (

                    <div
                        className="modal-backdrop"
                        onMouseDown={e => {

                            if (
                                e.target ===
                                e.currentTarget
                            ) {
                                closeModals();
                            }

                        }}
                    >

                        <div className="modal modal-medium">

                            <div className="modal-header">

                                <div>

                                    <span className="section-kicker">
                                        VISITOR ATTENDANCE
                                    </span>

                                    <h2>
                                        Record{" "}
                                        {getNextVisitLabel(
                                            selectedVisitor.visitCount
                                        )}
                                    </h2>

                                    <p>
                                        Record this visitor
                                        against a completed
                                        church service.
                                    </p>

                                </div>

                                <button
                                    className="modal-close"
                                    onClick={closeModals}
                                >
                                    ×
                                </button>

                            </div>

                            <div className="visit-profile">

                                <div className="avatar avatar-large">
                                    {selectedVisitor.firstName
                                        ?.charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div>

                                    <span>
                                        {
                                            selectedVisitor.visitorCode
                                        }
                                    </span>

                                    <h3>
                                        {getFullName(
                                            selectedVisitor
                                        )}
                                    </h3>

                                    <strong>
                                        Current:{" "}
                                        {getVisitLabel(
                                            selectedVisitor.visitCount
                                        )}
                                    </strong>

                                </div>

                            </div>

                            <div className="visit-progress">

                                {[
                                    "First",
                                    "Second",
                                    "Third",
                                    "Fourth",
                                    "More",
                                ].map(
                                    (
                                        label,
                                        index
                                    ) => (

                                        <React.Fragment
                                            key={label}
                                        >

                                            <div
                                                className={
                                                    selectedVisitor.visitCount >=
                                                        index + 1
                                                        ? "completed"
                                                        : ""
                                                }
                                            >

                                                <span>
                                                    {index < 4
                                                        ? index + 1
                                                        : "+"}
                                                </span>

                                                <small>
                                                    {label}
                                                </small>

                                            </div>

                                            {index < 4 && (
                                                <i />
                                            )}

                                        </React.Fragment>
                                    )
                                )}

                            </div>

                            <form
                                onSubmit={
                                    recordVisit
                                }
                            >

                                <div className="form-section">

                                    <label>
                                        Completed Church Service *

                                        <select
                                            value={
                                                selectedServiceId
                                            }
                                            onChange={e =>
                                                setSelectedServiceId(
                                                    e.target.value
                                                )
                                            }
                                            required
                                        >

                                            <option value="">
                                                Select completed service
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

                                                        {formatDate(
                                                            service.serviceDate
                                                        )}

                                                        {service.startTime
                                                            ? ` • ${formatTime(
                                                                service.startTime
                                                            )}`
                                                            : ""}

                                                    </option>
                                                )
                                            )}

                                        </select>
                                    </label>

                                    {services.length === 0 && (
                                        <div className="inline-warning">
                                            No completed church
                                            services are available.
                                        </div>
                                    )}

                                    <label>
                                        Attendance Status *

                                        <select
                                            value={
                                                attendanceStatus
                                            }
                                            onChange={e =>
                                                setAttendanceStatus(
                                                    e.target.value
                                                )
                                            }
                                        >

                                            {ATTENDANCE_STATUSES.map(
                                                status => (
                                                    <option
                                                        key={status}
                                                        value={status}
                                                    >
                                                        {status}
                                                    </option>
                                                )
                                            )}

                                        </select>

                                    </label>

                                </div>

                                <div className="next-visit-box">

                                    <span>
                                        After saving
                                    </span>

                                    <strong>
                                        {getFullName(
                                            selectedVisitor
                                        )}
                                    </strong>

                                    <p>
                                        will be recorded as{" "}
                                        <b>
                                            {getNextVisitLabel(
                                                selectedVisitor.visitCount
                                            )}
                                        </b>
                                        .
                                    </p>

                                </div>

                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={closeModals}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={
                                            saving ||
                                            services.length === 0
                                        }
                                    >
                                        {saving
                                            ? "Recording..."
                                            : `Record ${getNextVisitLabel(
                                                selectedVisitor.visitCount
                                            )}`}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>
                )}

            {/* =====================================================
                HISTORY
            ===================================================== */}

            {showHistoryModal &&
                selectedVisitor && (

                    <div
                        className="modal-backdrop"
                        onMouseDown={e => {

                            if (
                                e.target ===
                                e.currentTarget
                            ) {
                                closeModals();
                            }

                        }}
                    >

                        <div className="modal modal-large">

                            <div className="modal-header">

                                <div>

                                    <span className="section-kicker">
                                        ATTENDANCE HISTORY
                                    </span>

                                    <h2>
                                        {getFullName(
                                            selectedVisitor
                                        )}
                                    </h2>

                                    <p>
                                        {
                                            selectedVisitor.visitorCode
                                        }{" "}
                                        •{" "}
                                        {
                                            selectedVisitor.visitCount
                                        }{" "}
                                        recorded visit
                                        {selectedVisitor.visitCount !==
                                            1
                                            ? "s"
                                            : ""}
                                    </p>

                                </div>

                                <button
                                    className="modal-close"
                                    onClick={closeModals}
                                >
                                    ×
                                </button>

                            </div>

                            {historyLoading ? (

                                <div className="history-loading">
                                    <div className="spinner" />
                                    <span>
                                        Loading attendance
                                        history...
                                    </span>
                                </div>

                            ) : attendanceHistory.length === 0 ? (

                                <div className="empty-history">

                                    <div>—</div>

                                    <h3>
                                        No attendance records
                                    </h3>

                                    <p>
                                        This visitor has
                                        no recorded church
                                        service attendance.
                                    </p>

                                </div>

                            ) : (

                                <div className="history-list">

                                    {attendanceHistory.map(
                                        (
                                            record,
                                            index
                                        ) => (

                                            <div
                                                className="history-item"
                                                key={
                                                    record.visitorAttendanceId
                                                }
                                            >

                                                <div className="history-number">
                                                    {
                                                        attendanceHistory.length -
                                                        index
                                                    }
                                                </div>

                                                <div className="history-main">

                                                    <div>

                                                        <strong>
                                                            {
                                                                record.serviceName
                                                            }
                                                        </strong>

                                                        <span>
                                                            {formatDate(
                                                                record.attendanceDate
                                                            )}
                                                        </span>

                                                    </div>

                                                    <span
                                                        className={`attendance-badge ${statusClass(
                                                            record.status
                                                        )}`}
                                                    >
                                                        {
                                                            record.status
                                                        }
                                                    </span>

                                                </div>

                                                <div className="history-meta">

                                                    <span>
                                                        Recorded by
                                                    </span>

                                                    <strong>
                                                        {
                                                            record.recordedBy ||
                                                            "SYSTEM"
                                                        }
                                                    </strong>

                                                </div>

                                            </div>
                                        )
                                    )}

                                </div>
                            )}

                            <div className="modal-footer">

                                <button
                                    className="btn btn-secondary"
                                    onClick={closeModals}
                                >
                                    Close
                                </button>

                                <button
                                    className="btn btn-primary"
                                    onClick={() => {

                                        setShowHistoryModal(
                                            false
                                        );

                                        openVisitModal(
                                            selectedVisitor
                                        );

                                    }}
                                >
                                    + Record Next Visit
                                </button>

                            </div>

                        </div>

                    </div>
                )}

        </div>
    );
}