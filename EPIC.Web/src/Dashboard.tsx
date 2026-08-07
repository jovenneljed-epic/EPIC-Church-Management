import React, { useCallback, useEffect, useState } from "react";
import "./Dashboard.css";

import { API_BASE_URL } from "./config";

// ============================================================
// TYPES
// ============================================================

interface ChurchEvent {
    churchServiceId: number;
    serviceName: string;
    serviceType: string;
    serviceDate: string;
    startTime: string;
    endTime: string;
    location: string;
    serviceLeader: string;
    speaker: string;
    description: string;
    status: string;
}

interface DashboardData {
    generatedAt?: string;

    members: {
        total: number;
        active: number;
        inactive: number;
    };

    visitors: {
        total: number;
    };

    ministries: {
        total: number;
        active: number;
        activeAssignments: number;
    };

    attendance: {
        date: string;
        total: number;
        present: number;
        late: number;
        early: number;
        absent: number;
        excused: number;
        attendanceRate: number;
    };

    finance: {
        totalGiving: number;
        totalExpenses: number;
        netChurchFunds: number;
    };

    events: {
        total: number;
        upcoming: number;
        scheduled: number;
        completed: number;
        items: ChurchEvent[];
    };
}

// ============================================================
// EMPTY DATA
// ============================================================

const EMPTY_DASHBOARD: DashboardData = {
    members: {
        total: 0,
        active: 0,
        inactive: 0,
    },

    visitors: {
        total: 0,
    },

    ministries: {
        total: 0,
        active: 0,
        activeAssignments: 0,
    },

    attendance: {
        date: "",
        total: 0,
        present: 0,
        late: 0,
        early: 0,
        absent: 0,
        excused: 0,
        attendanceRate: 0,
    },

    finance: {
        totalGiving: 0,
        totalExpenses: 0,
        netChurchFunds: 0,
    },

    events: {
        total: 0,
        upcoming: 0,
        scheduled: 0,
        completed: 0,
        items: [],
    },
};

// ============================================================
// TOKEN
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
        const value = localStorage.getItem(key);

        if (value) {
            return value
                .replace(/^Bearer\s+/i, "")
                .trim();
        }
    }

    return null;
};

// ============================================================
// API
// ============================================================

const apiFetch = async (
    url: string
): Promise<Response> => {
    const token = getToken();

    const headers = new Headers();

    headers.set(
        "Accept",
        "application/json"
    );

    headers.set(
        "Content-Type",
        "application/json"
    );

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`
        );
    }

    return fetch(url, {
        method: "GET",
        headers,
        cache: "no-store",
    });
};

// ============================================================
// HELPERS
// ============================================================

const number = (value: number) =>
    new Intl.NumberFormat("en-PH").format(
        Number(value) || 0
    );

const money = (value: number) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const formatDate = (date: string) => {
    if (!date) {
        return new Date().toLocaleDateString(
            "en-PH",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            }
        );
    }

    const parsed = new Date(
        `${date.substring(0, 10)}T00:00:00`
    );

    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleDateString(
        "en-PH",
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        }
    );
};

const formatEventDate = (date: string) => {
    if (!date) return "";

    const parsed = new Date(
        `${date.substring(0, 10)}T00:00:00`
    );

    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleDateString(
        "en-PH",
        {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        }
    );
};

const getEventStatusClass = (
    status: string
) => {
    switch (
    status?.toUpperCase()
    ) {
        case "COMPLETED":
            return "event-status completed";

        case "CANCELLED":
            return "event-status cancelled";

        default:
            return "event-status scheduled";
    }
};

const normalizeChurchService = (
    service: any
): ChurchEvent => ({
    churchServiceId:
        service.churchServiceId ??
        service.ChurchServiceId ??
        0,

    serviceName:
        service.serviceName ??
        service.ServiceName ??
        "",

    serviceType:
        service.serviceType ??
        service.ServiceType ??
        "",

    serviceDate:
        service.serviceDate ??
        service.ServiceDate ??
        "",

    startTime:
        service.startTime ??
        service.StartTime ??
        "",

    endTime:
        service.endTime ??
        service.EndTime ??
        "",

    location:
        service.location ??
        service.Location ??
        "",

    serviceLeader:
        service.serviceLeader ??
        service.ServiceLeader ??
        "",

    speaker:
        service.speaker ??
        service.Speaker ??
        "",

    description:
        service.description ??
        service.Description ??
        "",

    status:
        service.status ??
        service.Status ??
        "SCHEDULED",
});

// ============================================================
// DASHBOARD
// ============================================================

const Dashboard: React.FC = () => {
    const [data, setData] =
        useState<DashboardData>(
            EMPTY_DASHBOARD
        );

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const loadDashboard =
        useCallback(
            async (
                showLoading = false
            ) => {
                try {
                    if (showLoading) {
                        setLoading(true);
                    } else {
                        setRefreshing(true);
                    }

                    setError("");

                    const token =
                        getToken();

                    if (!token) {
                        setError(
                            "Your session has expired. Please login again."
                        );

                        return;
                    }

                    const response =
                        await apiFetch(
                            `${API_BASE_URL}/Dashboard`
                        );

                    if (
                        response.status ===
                        401
                    ) {
                        [
                            "token",
                            "accessToken",
                            "jwt",
                            "authToken",
                            "epicToken",
                        ].forEach(
                            (key) =>
                                localStorage.removeItem(
                                    key
                                )
                        );

                        setError(
                            "Your session has expired. Please login again."
                        );

                        return;
                    }

                    if (!response.ok) {
                        const errorText =
                            await response.text();

                        console.error(
                            "Dashboard API Error:",
                            errorText
                        );

                        throw new Error(
                            `Dashboard API returned ${response.status}.`
                        );
                    }

                    const result = await response.json();

                    console.log("=================================");
                    console.log("EPIC DASHBOARD RESPONSE");
                    console.log(JSON.stringify(result, null, 2));
                    console.log("=================================");

                    // ====================================================
                    // CHURCH SERVICES
                    // ====================================================

                    let services: ChurchEvent[] =
                        [];

                    try {
                        const servicesResponse =
                            await apiFetch(
                                `${API_BASE_URL}/ChurchServices`
                            );

                        if (
                            servicesResponse.ok
                        ) {
                            const servicesResult =
                                await servicesResponse.json();

                            const rawServices =
                                Array.isArray(
                                    servicesResult
                                )
                                    ? servicesResult
                                    : servicesResult?.items ??
                                    servicesResult?.data ??
                                    servicesResult?.services ??
                                    [];

                            services =
                                Array.isArray(
                                    rawServices
                                )
                                    ? rawServices.map(
                                        normalizeChurchService
                                    )
                                    : [];
                        }
                    } catch (
                    serviceError
                    ) {
                        console.error(
                            "Church Services API Error:",
                            serviceError
                        );

                        services = [];
                    }

                    // ====================================================
                    // EVENTS
                    // ====================================================

                    const today =
                        new Date();

                    today.setHours(
                        0,
                        0,
                        0,
                        0
                    );

                    services.sort(
                        (a, b) => {
                            const dateA =
                                a.serviceDate
                                    ? new Date(
                                        `${a.serviceDate.substring(
                                            0,
                                            10
                                        )}T00:00:00`
                                    ).getTime()
                                    : 0;

                            const dateB =
                                b.serviceDate
                                    ? new Date(
                                        `${b.serviceDate.substring(
                                            0,
                                            10
                                        )}T00:00:00`
                                    ).getTime()
                                    : 0;

                            return (
                                dateA -
                                dateB
                            );
                        }
                    );

                    const upcomingEvents =
                        services
                            .filter(
                                (
                                    service
                                ) => {
                                    if (
                                        !service.serviceDate
                                    ) {
                                        return false;
                                    }

                                    const serviceDate =
                                        new Date(
                                            `${service.serviceDate.substring(
                                                0,
                                                10
                                            )}T00:00:00`
                                        );

                                    const status =
                                        service.status?.toUpperCase();

                                    return (
                                        serviceDate >=
                                        today &&
                                        status !==
                                        "COMPLETED" &&
                                        status !==
                                        "CANCELLED"
                                    );
                                }
                            )
                            .slice(0, 5);

                    const scheduledCount =
                        services.filter(
                            (service) =>
                                service.status?.toUpperCase() ===
                                "SCHEDULED"
                        ).length;

                    const completedCount =
                        services.filter(
                            (service) =>
                                service.status?.toUpperCase() ===
                                "COMPLETED"
                        ).length;

                    // ====================================================
                    // SAFE DASHBOARD
                    // ====================================================

                    const safeData: DashboardData =
                    {
                        ...EMPTY_DASHBOARD,

                        ...result,

                        members: {
                            ...EMPTY_DASHBOARD.members,
                            ...(result?.members ??
                                {}),
                        },

                        visitors: {
                            ...EMPTY_DASHBOARD.visitors,
                            ...(result?.visitors ??
                                {}),
                        },

                        ministries: {
                            ...EMPTY_DASHBOARD.ministries,
                            ...(result?.ministries ??
                                {}),
                        },

                        attendance: {
                            ...EMPTY_DASHBOARD.attendance,
                            ...(result?.attendance ??
                                {}),
                        },

                        finance: {
                            ...EMPTY_DASHBOARD.finance,
                            ...(result?.finance ??
                                {}),
                        },

                        events: {
                            total:
                                services.length,

                            upcoming:
                                upcomingEvents.length,

                            scheduled:
                                scheduledCount,

                            completed:
                                completedCount,

                            items:
                                upcomingEvents,
                        },
                    };

                    setData(safeData);
                } catch (err) {
                    console.error(
                        "DASHBOARD ERROR:",
                        err
                    );

                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load dashboard."
                    );
                } finally {
                    setLoading(false);
                    setRefreshing(false);
                }
            },
            []
        );

    // ============================================================
    // AUTO REFRESH
    // ============================================================

    useEffect(() => {
        loadDashboard(true);

        const events = [
            "epic:attendance-updated",
            "epic:giving-updated",
            "epic:expense-updated",
            "epic:church-service-updated",
            "epic:member-updated",
            "epic:visitor-updated",
            "epic:ministry-updated",
            "epic:navigate",
        ];

        const refreshHandler =
            () => {
                loadDashboard(false);
            };

        events.forEach(
            (event) => {
                window.addEventListener(
                    event,
                    refreshHandler
                );
            }
        );

        const interval =
            window.setInterval(
                () =>
                    loadDashboard(
                        false
                    ),
                30000
            );

        const visibilityHandler =
            () => {
                if (
                    document.visibilityState ===
                    "visible"
                ) {
                    loadDashboard(
                        false
                    );
                }
            };

        document.addEventListener(
            "visibilitychange",
            visibilityHandler
        );

        return () => {
            events.forEach(
                (event) => {
                    window.removeEventListener(
                        event,
                        refreshHandler
                    );
                }
            );

            window.clearInterval(
                interval
            );

            document.removeEventListener(
                "visibilitychange",
                visibilityHandler
            );
        };
    }, [loadDashboard]);

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-loading">
                    <div className="loading-orbit">
                        <div />
                    </div>

                    <div className="loading-title">
                        EPIC
                    </div>

                    <div className="loading-text">
                        Connecting to church records...
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================
    // DATA
    // ============================================================

    const attendance =
        data.attendance;

    const attendanceRate =
        Math.min(
            Math.max(
                Number(
                    attendance.attendanceRate ||
                    0
                ),
                0
            ),
            100
        );

    const dashboardDate =
        formatDate(
            attendance.date
        );

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="dashboard-page">

            <div className="ambient ambient-one" />
            <div className="ambient ambient-two" />
            <div className="ambient ambient-three" />

            {/* HEADER */}

            <header className="epic-header">

                <div className="brand-block">

                    <div className="brand-mark">
                        E
                    </div>

                    <div>
                        <div className="brand-overline">
                            EPIC CHURCH MANAGEMENT SYSTEM
                        </div>

                        <h1>
                            EPIC{" "}
                            <span>
                                Dashboard
                            </span>
                        </h1>

                        <p>
                            Engaging People Into Christ
                        </p>
                    </div>

                </div>

                <div className="header-right">

                    <div className="live-indicator">
                        <i />
                        LIVE DATABASE
                    </div>

                    <button
                        className="refresh-button"
                        type="button"
                        onClick={() =>
                            loadDashboard(
                                false
                            )
                        }
                        disabled={
                            refreshing
                        }
                    >
                        <span
                            className={
                                refreshing
                                    ? "refresh-symbol spin"
                                    : "refresh-symbol"
                            }
                        >
                            ↻
                        </span>

                        {refreshing
                            ? "Syncing"
                            : "Refresh"}
                    </button>

                </div>

            </header>

            {/* ERROR */}

            {error && (
                <div className="dashboard-error">

                    <span>⚠</span>

                    <div>
                        <strong>
                            Dashboard Connection Issue
                        </strong>

                        <p>
                            {error}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            loadDashboard(
                                true
                            )
                        }
                    >
                        Retry
                    </button>

                </div>
            )}

            {/* VERSE */}

            <section className="verse-hero">

                <div className="verse-decoration">
                    ✦
                </div>

                <div className="verse-content">

                    <span className="section-tag">
                        TODAY'S WORD
                    </span>

                    <div className="verse-icon">
                        ✝
                    </div>

                    <blockquote>
                        “For I know the plans I
                        have for you,” declares
                        the Lord, “plans to
                        prosper you and not to
                        harm you, plans to give
                        you hope and a future.”
                    </blockquote>

                    <div className="verse-reference">
                        JEREMIAH 29:11
                    </div>

                </div>

                <div className="verse-line" />

            </section>

            {/* WELCOME */}

            <section className="welcome-strip">

                <div>
                    <span>
                        WELCOME TO
                    </span>

                    <h2>
                        Luke 4:18 Ministries
                    </h2>

                    <p>
                        San Vicente Church
                    </p>
                </div>

                <div className="today-display">

                    <small>
                        TODAY
                    </small>

                    <strong>
                        {dashboardDate}
                    </strong>

                </div>

            </section>

            {/* MAIN GRID */}

            <div className="dashboard-grid">

                {/* VISITORS */}

                <section className="glass-panel visitors-panel">

                    <PanelHeading
                        eyebrow="PEOPLE"
                        title="New Visitors"
                        icon="◉"
                    />

                    <div className="visitor-feature">

                        <div className="visitor-number">
                            {number(
                                data.visitors.total
                            )}
                        </div>

                        <div>
                            <strong>
                                Total Visitors
                            </strong>

                            <p>
                                Recorded in church records
                            </p>
                        </div>

                    </div>

                    <div className="visitor-line">
                        <span />
                    </div>

                    <div className="mini-message">
                        <span>✦</span>
                        Every person matters.
                    </div>

                </section>

                {/* ANNOUNCEMENTS */}

                <section className="glass-panel announcement-panel">

                    <PanelHeading
                        eyebrow="COMMUNICATION"
                        title="Latest Announcements"
                        icon="◈"
                    />

                    <div className="announcement-placeholder">

                        <div className="announcement-orb">
                            !
                        </div>

                        <div>
                            <strong>
                                Church Updates
                            </strong>

                            <p>
                                Your latest church
                                announcements can be
                                displayed here.
                            </p>
                        </div>

                    </div>

                </section>

                {/* MEMBERS */}

                <section className="glass-panel members-panel">

                    <PanelHeading
                        eyebrow="PEOPLE DATABASE"
                        title="Members Statistics"
                        icon="◎"
                    />

                    <div className="member-main">

                        <div className="member-total">

                            <span>
                                TOTAL MEMBERS
                            </span>

                            <strong>
                                {number(
                                    data.members.total
                                )}
                            </strong>

                        </div>

                        <div className="member-rings">

                            <div className="ring">

                                <div>

                                    <strong>
                                        {number(
                                            data.members.active
                                        )}
                                    </strong>

                                    <span>
                                        Active
                                    </span>

                                </div>

                            </div>

                        </div>

                    </div>

                    <div className="member-stats">

                        <StatLine
                            label="Active Members"
                            value={
                                data.members
                                    .active
                            }
                            total={
                                data.members
                                    .total
                            }
                        />

                        <StatLine
                            label="Inactive Members"
                            value={
                                data.members
                                    .inactive
                            }
                            total={
                                data.members
                                    .total
                            }
                        />

                    </div>

                </section>

                {/* ATTENDANCE */}

                <section className="glass-panel attendance-panel">

                    <PanelHeading
                        eyebrow="TODAY"
                        title="Attendance"
                        icon="◌"
                    />

                    <div className="attendance-main">

                        <div className="attendance-circle">

                            <svg viewBox="0 0 120 120">

                                <circle
                                    className="circle-bg"
                                    cx="60"
                                    cy="60"
                                    r="50"
                                />

                                <circle
                                    className="circle-progress"
                                    cx="60"
                                    cy="60"
                                    r="50"
                                    style={{
                                        strokeDashoffset:
                                            314 -
                                            (314 *
                                                attendanceRate) /
                                            100,
                                    }}
                                />

                            </svg>

                            <div>

                                <strong>
                                    {attendanceRate.toFixed(
                                        0
                                    )}
                                    %
                                </strong>

                                <span>
                                    ATTENDANCE
                                </span>

                            </div>

                        </div>

                        <div className="attendance-count">

                            <strong>
                                {number(
                                    attendance.total
                                )}
                            </strong>

                            <span>
                                Records Today
                            </span>

                        </div>

                    </div>

                    <div className="attendance-details">

                        <AttendanceItem
                            label="Present"
                            value={
                                attendance.present
                            }
                            className="present"
                        />

                        <AttendanceItem
                            label="Late"
                            value={
                                attendance.late
                            }
                            className="late"
                        />

                        <AttendanceItem
                            label="Early"
                            value={
                                attendance.early
                            }
                            className="early"
                        />

                        <AttendanceItem
                            label="Absent"
                            value={
                                attendance.absent
                            }
                            className="absent"
                        />

                        <AttendanceItem
                            label="Excused"
                            value={
                                attendance.excused
                            }
                            className="excused"
                        />

                    </div>

                </section>

                {/* MINISTRIES */}

                <section className="glass-panel ministries-panel">

                    <PanelHeading
                        eyebrow="SERVICE"
                        title="Ministries"
                        icon="◇"
                    />

                    <div className="ministry-hero">

                        <div className="ministry-number">
                            {number(
                                data.ministries
                                    .active
                            )}
                        </div>

                        <div>

                            <strong>
                                Active Ministries
                            </strong>

                            <p>
                                Serving the body of Christ
                            </p>

                        </div>

                    </div>

                    <div className="ministry-bottom">

                        <div>
                            <span>
                                ASSIGNMENTS
                            </span>

                            <strong>
                                {number(
                                    data.ministries
                                        .activeAssignments
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>
                                TOTAL
                            </span>

                            <strong>
                                {number(
                                    data.ministries
                                        .total
                                )}
                            </strong>
                        </div>

                    </div>

                </section>

                {/* EVENTS */}

                <section className="glass-panel events-panel">

                    <PanelHeading
                        eyebrow="CHURCH CALENDAR"
                        title="Upcoming Church Events"
                        icon="◇"
                    />

                    <div className="events-summary">

                        <div>
                            <strong>
                                {number(
                                    data.events
                                        .upcoming
                                )}
                            </strong>

                            <span>
                                Upcoming
                            </span>
                        </div>

                        <div>
                            <strong>
                                {number(
                                    data.events
                                        .scheduled
                                )}
                            </strong>

                            <span>
                                Scheduled
                            </span>
                        </div>

                        <div>
                            <strong>
                                {number(
                                    data.events
                                        .completed
                                )}
                            </strong>

                            <span>
                                Completed
                            </span>
                        </div>

                    </div>

                    {data.events.items.length ===
                        0 ? (
                        <div className="events-empty">

                            <span>◇</span>

                            <p>
                                No upcoming church events.
                            </p>

                        </div>
                    ) : (
                        <div className="event-list">

                            {data.events.items.map(
                                (event) => (
                                    <div
                                        className="event-item"
                                        key={
                                            event.churchServiceId
                                        }
                                    >

                                        <div className="event-date">

                                            <span>
                                                {new Date(
                                                    `${event.serviceDate.substring(
                                                        0,
                                                        10
                                                    )}T00:00:00`
                                                )
                                                    .toLocaleDateString(
                                                        "en-PH",
                                                        {
                                                            month: "short",
                                                        }
                                                    )
                                                    .toUpperCase()}
                                            </span>

                                            <strong>
                                                {new Date(
                                                    `${event.serviceDate.substring(
                                                        0,
                                                        10
                                                    )}T00:00:00`
                                                ).getDate()}
                                            </strong>

                                        </div>

                                        <div className="event-info">

                                            <div className="event-title">

                                                <strong>
                                                    {
                                                        event.serviceName
                                                    }
                                                </strong>

                                                <span
                                                    className={getEventStatusClass(
                                                        event.status
                                                    )}
                                                >
                                                    {event.status ||
                                                        "SCHEDULED"}
                                                </span>

                                            </div>

                                            <span className="event-type">
                                                {event.serviceType ||
                                                    "CHURCH EVENT"}
                                            </span>

                                            <div className="event-meta">

                                                <span>
                                                    📅{" "}
                                                    {formatEventDate(
                                                        event.serviceDate
                                                    )}
                                                </span>

                                                {event.startTime && (
                                                    <span>
                                                        ◷{" "}
                                                        {
                                                            event.startTime
                                                        }

                                                        {event.endTime &&
                                                            ` – ${event.endTime}`}
                                                    </span>
                                                )}

                                                {event.location && (
                                                    <span>
                                                        ⌖{" "}
                                                        {
                                                            event.location
                                                        }
                                                    </span>
                                                )}

                                            </div>

                                        </div>

                                    </div>
                                )
                            )}

                        </div>
                    )}

                </section>

                {/* SNAPSHOT */}

                <section className="glass-panel snapshot-panel">

                    <PanelHeading
                        eyebrow="CHURCH OVERVIEW"
                        title="Ministry Snapshot"
                        icon="✦"
                    />

                    <div className="snapshot-grid">

                        <Snapshot
                            label="Active Members"
                            value={
                                data.members
                                    .active
                            }
                            icon="◉"
                        />

                        <Snapshot
                            label="Inactive Members"
                            value={
                                data.members
                                    .inactive
                            }
                            icon="○"
                        />

                        <Snapshot
                            label="Active Ministries"
                            value={
                                data.ministries
                                    .active
                            }
                            icon="◇"
                        />

                        <Snapshot
                            label="Assignments"
                            value={
                                data.ministries
                                    .activeAssignments
                            }
                            icon="✦"
                        />

                        <Snapshot
                            label="Total Giving"
                            value={money(
                                data.finance
                                    .totalGiving
                            )}
                            icon="₱"
                        />

                        <Snapshot
                            label="Expenses"
                            value={money(
                                data.finance
                                    .totalExpenses
                            )}
                            icon="−"
                        />

                    </div>

                </section>

            </div>

            {/* FOOTER */}

            <footer className="dashboard-footer">

                <div>
                    <span className="footer-dot" />
                    EPIC DATABASE CONNECTED
                </div>

                <span>
                    Engaging People Into Christ
                </span>

                {data.generatedAt && (
                    <span>
                        Last synchronized{" "}
                        {new Date(
                            data.generatedAt
                        ).toLocaleTimeString(
                            "en-PH",
                            {
                                hour: "numeric",
                                minute: "2-digit",
                            }
                        )}
                    </span>
                )}

            </footer>

        </div>
    );
};

// ============================================================
// PANEL HEADING
// ============================================================

interface PanelHeadingProps {
    eyebrow: string;
    title: string;
    icon: string;
}

const PanelHeading: React.FC<
    PanelHeadingProps
> = ({
    eyebrow,
    title,
    icon,
}) => (
        <div className="panel-heading">

            <div>
                <span>
                    {eyebrow}
                </span>

                <h2>
                    {title}
                </h2>
            </div>

            <div className="panel-icon">
                {icon}
            </div>

        </div>
    );

// ============================================================
// STAT LINE
// ============================================================

interface StatLineProps {
    label: string;
    value: number;
    total: number;
}

const StatLine: React.FC<
    StatLineProps
> = ({
    label,
    value,
    total,
}) => {
        const percentage =
            total > 0
                ? Math.min(
                    (value / total) * 100,
                    100
                )
                : 0;

        return (
            <div className="stat-line">

                <div className="stat-line-label">

                    <span>
                        {label}
                    </span>

                    <strong>
                        {number(value)}
                    </strong>

                </div>

                <div className="stat-line-bar">

                    <span
                        style={{
                            width: `${percentage}%`,
                        }}
                    />

                </div>

            </div>
        );
    };

// ============================================================
// ATTENDANCE ITEM
// ============================================================

interface AttendanceItemProps {
    label: string;
    value: number;
    className: string;
}

const AttendanceItem: React.FC<
    AttendanceItemProps
> = ({
    label,
    value,
    className,
}) => (
        <div
            className={`attendance-item ${className}`}
        >

            <span className="attendance-marker" />

            <div>

                <span>
                    {label}
                </span>

                <strong>
                    {number(value)}
                </strong>

            </div>

        </div>
    );

// ============================================================
// SNAPSHOT
// ============================================================

interface SnapshotProps {
    label: string;
    value: number | string;
    icon: string;
}

const Snapshot: React.FC<
    SnapshotProps
> = ({
    label,
    value,
    icon,
}) => (
        <div className="snapshot-item">

            <div className="snapshot-icon">
                {icon}
            </div>

            <div>

                <span>
                    {label}
                </span>

                <strong>
                    {typeof value ===
                        "number"
                        ? number(value)
                        : value}
                </strong>

            </div>

        </div>
    );

export default Dashboard;