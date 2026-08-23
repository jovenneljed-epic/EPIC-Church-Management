import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FC,
} from "react";

import axios from "axios";
import "./WebsiteAnalyticsDashboard.css";

import { API_BASE_URL } from "../config";

// =========================================================
// TYPES
// =========================================================

interface DashboardData {
    totalVisits: number;
    todayVisits: number;
    weekVisits: number;
    monthVisits: number;
    uniqueVisitors: number;
    returningVisitors: number;
    bounceVisits: number;
    bounceRate: number;
    recentVisits: WebsiteVisit[];
}

interface WebsiteVisit {
    websiteVisitId: number;
    visitorId?: string;
    sessionId?: string;
    pageUrl?: string;
    pagePath?: string;
    pageTitle?: string;
    referrer?: string;
    trafficSource?: string;
    trafficMedium?: string;
    trafficCampaign?: string;
    deviceType?: string;
    browser?: string;
    operatingSystem?: string;
    country?: string;
    region?: string;
    city?: string;
    timeOnPageSeconds?: number;
    visitedAt: string;
    lastActivityAt?: string;
    isReturningVisitor: boolean;
    isBounce: boolean;
}

interface VisitOverTime {
    date?: string;
    label?: string;
    visits?: number;
    uniqueVisitors?: number;
    count?: number;
    value?: number;
}

interface TopPage {
    pagePath?: string;
    path?: string;
    pageTitle?: string;
    title?: string;
    visits?: number;
    uniqueVisitors?: number;
    visitCount?: number;
    count?: number;
}

interface DeviceData {
    deviceType?: string;
    device?: string;
    visits?: number;
    visitCount?: number;
    count?: number;
}

interface BrowserData {
    browser?: string;
    visits?: number;
    visitCount?: number;
    count?: number;
}

interface HealthData {
    success?: boolean;
    service?: string;
    status?: string;
    timestamp?: string;
}

interface CountryData {
    country: string;
    visits: number;
    uniqueVisitors: number;
    percentage: number;
}

interface CityData {
    city: string;
    region?: string;
    country?: string;
    visits: number;
    uniqueVisitors: number;
    percentage: number;
}

interface NormalizedChartItem {
    label: string;
    visits: number;
    uniqueVisitors: number;
}

interface NormalizedPage {
    path: string;
    title: string;
    visits: number;
    uniqueVisitors: number;
}

interface NormalizedDevice {
    name: string;
    visits: number;
}

interface NormalizedBrowser {
    name: string;
    visits: number;
}

interface StatCard {
    icon: string;
    label: string;
    value: string;
    description: string;
    type: string;
}

// =========================================================
// HELPERS
// =========================================================

const getToken = (): string | null => {
    const keys: string[] = [
        "token",
        "accessToken",
        "jwt",
        "authToken",
        "epicToken",
    ];

    for (const key of keys) {
        const token = localStorage.getItem(key);

        if (token) {
            return token;
        }
    }

    return null;
};

const getHeaders = (): Record<string, string> => {
    const token = getToken();

    if (!token) {
        return {};
    }

    return {
        Authorization: `Bearer ${token}`,
    };
};

const normalizeArray = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) {
        return value as T[];
    }

    if (
        value !== null &&
        typeof value === "object"
    ) {
        const object = value as Record<string, unknown>;

        const keys: string[] = [
            "data",
            "items",
            "results",
            "visits",
            "pages",
            "devices",
            "browsers",
            "countries",
            "cities",
        ];

        for (const key of keys) {
            const possibleArray = object[key];

            if (Array.isArray(possibleArray)) {
                return possibleArray as T[];
            }
        }
    }

    return [];
};

const safeNumber = (value: unknown): number => {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
};

const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("en-US").format(
        safeNumber(value)
    );
};

const formatDateTime = (value?: string): string => {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const formatChartLabel = (value: string): string => {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    }

    return value;
};

const getDeviceIcon = (device?: string): string => {
    const value = (device || "").toLowerCase();

    if (
        value.includes("mobile") ||
        value.includes("phone") ||
        value.includes("android") ||
        value.includes("ios")
    ) {
        return "📱";
    }

    if (value.includes("tablet")) {
        return "▣";
    }

    return "▱";
};

const getBrowserInitial = (browser?: string): string => {
    const value = (browser || "").trim();

    return value
        ? value.charAt(0).toUpperCase()
        : "?";
};

// =========================================================
// COMPONENT
// =========================================================

const WebsiteAnalyticsDashboard: FC = () => {

    // =====================================================
    // STATE
    // =====================================================

    const [dashboard, setDashboard] =
        useState<DashboardData | null>(null);

    const [visitsOverTime, setVisitsOverTime] =
        useState<VisitOverTime[]>([]);

    const [topPages, setTopPages] =
        useState<TopPage[]>([]);

    const [devices, setDevices] =
        useState<DeviceData[]>([]);

    const [browsers, setBrowsers] =
        useState<BrowserData[]>([]);

    const [recentVisits, setRecentVisits] =
        useState<WebsiteVisit[]>([]);

    // These are retained because the API endpoints are part
    // of the analytics system and may be used by future
    // country/city sections.
    const [, setCountries] =
        useState<CountryData[]>([]);

    const [, setCities] =
        useState<CityData[]>([]);

    const [health, setHealth] =
        useState<HealthData | null>(null);

    const [loading, setLoading] =
        useState<boolean>(true);

    const [refreshing, setRefreshing] =
        useState<boolean>(false);

    const [error, setError] =
        useState<string | null>(null);

    const [lastUpdated, setLastUpdated] =
        useState<Date | null>(null);

    const [selectedDays, setSelectedDays] =
        useState<number>(30);

    // =====================================================
    // BASE URL
    // =====================================================

    const baseUrl = useMemo<string>(
        () => API_BASE_URL.replace(/\/$/, ""),
        []
    );

    // =====================================================
    // LOAD ANALYTICS
    // =====================================================

    const loadAnalytics = useCallback(
        async (
            showLoader: boolean = true,
            days: number = selectedDays
        ): Promise<void> => {

            try {

                if (showLoader) {
                    setLoading(true);
                }

                setError(null);

                const headers = getHeaders();

                const [
                    dashboardResponse,
                    visitsResponse,
                    pagesResponse,
                    devicesResponse,
                    browsersResponse,
                    recentResponse,
                    healthResponse,
                    countriesResponse,
                    citiesResponse,
                ] = await Promise.all([
                    axios.get(
                        `${baseUrl}/WebsiteAnalytics/dashboard`,
                        { headers }
                    ),

                    axios.get(
                        `${baseUrl}/WebsiteAnalytics/visits-over-time`,
                        {
                            headers,
                            params: { days },
                        }
                    ),

                    axios.get(
                        `${baseUrl}/WebsiteAnalytics/top-pages`,
                        { headers }
                    ),

                    axios.get(
                        `${baseUrl}/WebsiteAnalytics/devices`,
                        { headers }
                    ),

                    axios.get(
                        `${baseUrl}/WebsiteAnalytics/browsers`,
                        { headers }
                    ),

                    axios.get(
                        `${baseUrl}/WebsiteAnalytics/recent`,
                        { headers }
                    ),

                    axios.get(
                        `${baseUrl}/WebsiteAnalytics/health`
                    ),

                    axios.get(
                        `${baseUrl}/WebsiteAnalytics/countries`,
                        { headers }
                    ),

                    axios.get(
                        `${baseUrl}/WebsiteAnalytics/cities`,
                        { headers }
                    ),
                ]);

                // =================================================
                // DASHBOARD
                // =================================================

                const dashboardData =
                    dashboardResponse.data as DashboardData;

                setDashboard(dashboardData);

                // =================================================
                // VISITS OVER TIME
                // =================================================

                const visitsData =
                    normalizeArray<VisitOverTime>(
                        visitsResponse.data
                    );

                setVisitsOverTime(visitsData);

                // =================================================
                // TOP PAGES
                // =================================================

                const pagesData =
                    normalizeArray<TopPage>(
                        pagesResponse.data
                    );

                setTopPages(pagesData);

                // =================================================
                // DEVICES
                // =================================================

                const deviceData =
                    normalizeArray<DeviceData>(
                        devicesResponse.data
                    );

                setDevices(deviceData);

                // =================================================
                // BROWSERS
                // =================================================

                const browserData =
                    normalizeArray<BrowserData>(
                        browsersResponse.data
                    );

                setBrowsers(browserData);

                // =================================================
                // RECENT VISITS
                // =================================================

                const recentData =
                    normalizeArray<WebsiteVisit>(
                        recentResponse.data
                    );

                setRecentVisits(
                    recentData.length > 0
                        ? recentData
                        : dashboardData.recentVisits || []
                );

                // =================================================
                // HEALTH
                // =================================================

                setHealth(
                    healthResponse.data as HealthData
                );

                // =================================================
                // COUNTRIES
                // =================================================

                const countryData =
                    normalizeArray<CountryData>(
                        countriesResponse.data
                    );

                setCountries(countryData);

                // =================================================
                // CITIES
                // =================================================

                const cityData =
                    normalizeArray<CityData>(
                        citiesResponse.data
                    );

                setCities(cityData);

                // =================================================
                // UPDATED
                // =================================================

                setLastUpdated(new Date());

            } catch (err: unknown) {

                console.error(
                    "Website Analytics error:",
                    err
                );

                if (axios.isAxiosError(err)) {

                    if (err.response?.status === 401) {

                        setError(
                            "You are not authorized to view Website Analytics."
                        );

                    } else if (err.response?.status === 403) {

                        setError(
                            "You do not have permission to view Website Analytics."
                        );

                    } else {

                        const serverMessage =
                            err.response?.data?.message;

                        setError(
                            typeof serverMessage === "string"
                                ? serverMessage
                                : "Unable to load Website Analytics."
                        );
                    }

                } else {

                    setError(
                        "Unable to connect to the Website Analytics service."
                    );
                }

            } finally {

                setLoading(false);
                setRefreshing(false);
            }

        },
        [
            baseUrl,
            selectedDays,
        ]
    );

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        void loadAnalytics(
            true,
            selectedDays
        );

    }, [
        loadAnalytics,
        selectedDays,
    ]);

    // =====================================================
    // EVENTS
    // =====================================================

    const handlePeriodChange = (
        days: number
    ): void => {

        if (days === selectedDays) {
            return;
        }

        setSelectedDays(days);
    };

    const handleRefresh = async (): Promise<void> => {

        setRefreshing(true);

        await loadAnalytics(
            false,
            selectedDays
        );
    };

    // =====================================================
    // NORMALIZED CHART DATA
    // =====================================================

    const chartData = useMemo<
        NormalizedChartItem[]
    >(() => {

        return visitsOverTime.map(
            (
                item: VisitOverTime,
                index: number
            ): NormalizedChartItem => {

                const visits = safeNumber(
                    item.visits ??
                    item.count ??
                    item.value ??
                    0
                );

                const uniqueVisitors =
                    safeNumber(
                        item.uniqueVisitors ?? 0
                    );

                const rawLabel =
                    item.label ||
                    item.date ||
                    `Day ${index + 1}`;

                return {
                    label: formatChartLabel(rawLabel),
                    visits,
                    uniqueVisitors,
                };
            }
        );

    }, [visitsOverTime]);

    // =====================================================
    // CHART MAX
    // =====================================================

    const chartMax = useMemo<number>(() => {

        if (chartData.length === 0) {
            return 1;
        }

        return Math.max(
            ...chartData.map(
                (
                    item: NormalizedChartItem
                ): number =>
                    Math.max(
                        item.visits,
                        item.uniqueVisitors
                    )
            ),
            1
        );

    }, [chartData]);

    // =====================================================
    // TOP PAGES
    // =====================================================

    const normalizedTopPages = useMemo<
        NormalizedPage[]
    >(() => {

        return topPages.map(
            (
                item: TopPage
            ): NormalizedPage => ({

                path:
                    item.pagePath ||
                    item.path ||
                    "/",

                title:
                    item.pageTitle ||
                    item.title ||
                    "Untitled Page",

                visits:
                    safeNumber(
                        item.visits ??
                        item.visitCount ??
                        item.count ??
                        0
                    ),

                uniqueVisitors:
                    safeNumber(
                        item.uniqueVisitors ?? 0
                    ),
            })
        );

    }, [topPages]);

    // =====================================================
    // DEVICES
    // =====================================================

    const normalizedDevices = useMemo<
        NormalizedDevice[]
    >(() => {

        return devices.map(
            (
                item: DeviceData
            ): NormalizedDevice => ({

                name:
                    item.deviceType ||
                    item.device ||
                    "Unknown",

                visits:
                    safeNumber(
                        item.visits ??
                        item.visitCount ??
                        item.count ??
                        0
                    ),
            })
        );

    }, [devices]);

    // =====================================================
    // BROWSERS
    // =====================================================

    const normalizedBrowsers = useMemo<
        NormalizedBrowser[]
    >(() => {

        return browsers.map(
            (
                item: BrowserData
            ): NormalizedBrowser => ({

                name:
                    item.browser ||
                    "Unknown",

                visits:
                    safeNumber(
                        item.visits ??
                        item.visitCount ??
                        item.count ??
                        0
                    ),
            })
        );

    }, [browsers]);

    // =====================================================
    // SAFE DASHBOARD DATA
    // =====================================================

    const data: DashboardData =
        dashboard || {
            totalVisits: 0,
            todayVisits: 0,
            weekVisits: 0,
            monthVisits: 0,
            uniqueVisitors: 0,
            returningVisitors: 0,
            bounceVisits: 0,
            bounceRate: 0,
            recentVisits: [],
        };

    // =====================================================
    // TOTALS
    // =====================================================

    const totalDeviceVisits =
        normalizedDevices.reduce(
            (
                total: number,
                item: NormalizedDevice
            ): number =>
                total + safeNumber(item.visits),
            0
        );

    const totalBrowserVisits =
        normalizedBrowsers.reduce(
            (
                total: number,
                item: NormalizedBrowser
            ): number =>
                total + safeNumber(item.visits),
            0
        );

    // =====================================================
    // KPI CARDS
    // =====================================================

    const statCards: StatCard[] = [
        {
            icon: "◉",
            label: "Total Visits",
            value: formatNumber(data.totalVisits),
            description: "All recorded website visits",
            type: "primary",
        },
        {
            icon: "24",
            label: "Today",
            value: formatNumber(data.todayVisits),
            description: "Visits recorded today",
            type: "blue",
        },
        {
            icon: "7D",
            label: "This Week",
            value: formatNumber(data.weekVisits),
            description: "Current weekly traffic",
            type: "violet",
        },
        {
            icon: "30",
            label: "This Month",
            value: formatNumber(data.monthVisits),
            description: "Current monthly traffic",
            type: "purple",
        },
        {
            icon: "U",
            label: "Unique Visitors",
            value: formatNumber(data.uniqueVisitors),
            description: "Distinct people reached",
            type: "teal",
        },
        {
            icon: "R",
            label: "Returning",
            value: formatNumber(data.returningVisitors),
            description: "Returning visitor activity",
            type: "green",
        },
        {
            icon: "B",
            label: "Bounce Visits",
            value: formatNumber(data.bounceVisits),
            description: "Single-page visits",
            type: "orange",
        },
        {
            icon: "%",
            label: "Bounce Rate",
            value: `${safeNumber(
                data.bounceRate
            ).toFixed(1)}%`,
            description: "Overall bounce rate",
            type: "red",
        },
    ];

    // =====================================================
    // LOADING
    // =====================================================

    if (loading && !dashboard) {

        return (
            <div className="website-analytics-page">

                <div className="analytics-loading">

                    <div className="analytics-spinner" />

                    <strong>
                        Loading Website Analytics
                    </strong>

                    <span>
                        Preparing your traffic intelligence dashboard...
                    </span>

                </div>

            </div>
        );
    }

    // =====================================================
    // ERROR
    // =====================================================

    if (error && !dashboard) {

        return (
            <div className="website-analytics-page">

                <div className="analytics-error-state">

                    <div className="analytics-error-icon">
                        !
                    </div>

                    <h2>
                        Analytics Unavailable
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => {
                            void loadAnalytics(
                                true,
                                selectedDays
                            );
                        }}
                    >
                        Try Again
                    </button>

                </div>

            </div>
        );
    }

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="website-analytics-page">

            {/* =================================================
                HERO
            ================================================= */}

            <section className="analytics-hero">

                <div className="analytics-hero-content">

                    <span className="analytics-eyebrow">
                        EPIC INTELLIGENCE
                    </span>

                    <h1>
                        Website Analytics
                    </h1>

                    <p>
                        Understand your audience, monitor traffic,
                        and track how visitors interact with your website.
                    </p>

                </div>

                <div className="analytics-hero-actions">

                    <div className="analytics-service-status">

                        <span className="status-dot" />

                        <span>
                            {health?.status || "Online"}
                        </span>

                    </div>

                    <button
                        type="button"
                        className="analytics-refresh-button"
                        onClick={() => {
                            void handleRefresh();
                        }}
                        disabled={refreshing}
                    >

                        <span
                            className={
                                refreshing
                                    ? "refresh-icon rotating"
                                    : "refresh-icon"
                            }
                        >
                            ↻
                        </span>

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}

                    </button>

                </div>

            </section>

            {/* =================================================
                PERIOD BAR
            ================================================= */}

            <section className="analytics-toolbar">

                <div className="analytics-period-tabs">

                    {[7, 30, 90, 365].map(
                        (days: number) => (

                            <button
                                key={days}
                                type="button"
                                className={
                                    selectedDays === days
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    handlePeriodChange(days)
                                }
                            >
                                {days === 7 && "7 Days"}
                                {days === 30 && "30 Days"}
                                {days === 90 && "90 Days"}
                                {days === 365 && "1 Year"}
                            </button>

                        )
                    )}

                </div>

                <div className="analytics-updated">

                    <span className="analytics-updated-dot" />

                    Last updated:

                    <strong>
                        {lastUpdated
                            ? lastUpdated.toLocaleTimeString(
                                "en-US",
                                {
                                    hour: "numeric",
                                    minute: "2-digit",
                                }
                            )
                            : "—"}
                    </strong>

                </div>

            </section>

            {/* =================================================
                WARNING
            ================================================= */}

            {error && (

                <div className="analytics-warning">

                    <span>
                        !
                    </span>

                    {error}

                </div>

            )}

            {/* =================================================
                KPI GRID
            ================================================= */}

            <section className="analytics-stat-grid">

                {statCards.map(
                    (
                        card: StatCard
                    ) => (

                        <article
                            key={card.label}
                            className={
                                `analytics-stat-card ${card.type}`
                            }
                        >

                            <div className="analytics-stat-icon">
                                {card.icon}
                            </div>

                            <div className="analytics-stat-content">

                                <span className="analytics-stat-label">
                                    {card.label}
                                </span>

                                <strong className="analytics-stat-value">
                                    {card.value}
                                </strong>

                                <span className="analytics-stat-description">
                                    {card.description}
                                </span>

                            </div>

                        </article>

                    )
                )}

            </section>

            {/* =================================================
                TRAFFIC
            ================================================= */}

            <section className="analytics-panel analytics-traffic-panel">

                <div className="analytics-panel-header">

                    <div>

                        <span className="analytics-section-tag">
                            TRAFFIC OVERVIEW
                        </span>

                        <h2>
                            Visits Over Time
                        </h2>

                        <p>
                            Website visits and unique visitors
                            during the selected period.
                        </p>

                    </div>

                    <div className="analytics-chart-legend">

                        <span>
                            <i className="legend-visits" />
                            Visits
                        </span>

                        <span>
                            <i className="legend-unique" />
                            Unique Visitors
                        </span>

                    </div>

                </div>

                {chartData.length === 0 ? (

                    <div className="analytics-empty-state">

                        <strong>
                            No traffic data yet
                        </strong>

                        <span>
                            Visitor activity will appear here.
                        </span>

                    </div>

                ) : (

                    <div className="analytics-chart-container">

                        <div className="analytics-chart-grid">

                            <span />
                            <span />
                            <span />
                            <span />

                        </div>

                        <div className="analytics-chart-bars">

                            {chartData.map(
                                (
                                    item: NormalizedChartItem,
                                    index: number
                                ) => {

                                    const visitsHeight =
                                        item.visits > 0
                                            ? Math.max(
                                                (
                                                    item.visits /
                                                    chartMax
                                                ) * 100,
                                                5
                                            )
                                            : 0;

                                    const uniqueHeight =
                                        item.uniqueVisitors > 0
                                            ? Math.max(
                                                (
                                                    item.uniqueVisitors /
                                                    chartMax
                                                ) * 100,
                                                5
                                            )
                                            : 0;

                                    const labelInterval =
                                        Math.max(
                                            1,
                                            Math.ceil(
                                                chartData.length / 8
                                            )
                                        );

                                    const showLabel =
                                        chartData.length <= 14 ||
                                        index === 0 ||
                                        index ===
                                        chartData.length - 1 ||
                                        index %
                                        labelInterval === 0;

                                    return (

                                        <div
                                            className="analytics-chart-column"
                                            key={`${item.label}-${index}`}
                                        >

                                            <div className="chart-bar-group">

                                                <div
                                                    className="chart-bar visits"
                                                    style={{
                                                        height:
                                                            `${visitsHeight}%`,
                                                    }}
                                                    title={
                                                        `${item.visits} visits`
                                                    }
                                                />

                                                <div
                                                    className="chart-bar unique"
                                                    style={{
                                                        height:
                                                            `${uniqueHeight}%`,
                                                    }}
                                                    title={
                                                        `${item.uniqueVisitors} unique visitors`
                                                    }
                                                />

                                            </div>

                                            <span className="chart-label">

                                                {showLabel
                                                    ? item.label
                                                    : ""}

                                            </span>

                                        </div>
                                    );
                                }
                            )}

                        </div>

                    </div>
                )}

            </section>

            {/* =================================================
                CONTENT + DEVICES
            ================================================= */}

            <section className="analytics-main-grid">

                {/* TOP PAGES */}

                <section className="analytics-panel">

                    <div className="analytics-panel-header">

                        <div>

                            <span className="analytics-section-tag">
                                CONTENT PERFORMANCE
                            </span>

                            <h2>
                                Top Pages
                            </h2>

                            <p>
                                Your most visited website pages.
                            </p>

                        </div>

                    </div>

                    <div className="analytics-page-table">

                        <div className="analytics-page-table-head">

                            <span>
                                PAGE
                            </span>

                            <span>
                                VISITS
                            </span>

                            <span>
                                UNIQUE
                            </span>

                        </div>

                        {normalizedTopPages.length === 0 ? (

                            <div className="analytics-small-empty">
                                No page activity available.
                            </div>

                        ) : (

                            normalizedTopPages
                                .slice(0, 10)
                                .map(
                                    (
                                        page: NormalizedPage,
                                        index: number
                                    ) => (

                                        <div
                                            className="analytics-page-row"
                                            key={`${page.path}-${index}`}
                                        >

                                            <div className="analytics-page-name">

                                                <span className="page-rank">
                                                    {String(
                                                        index + 1
                                                    ).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                </span>

                                                <div>

                                                    <strong>
                                                        {page.title}
                                                    </strong>

                                                    <small>
                                                        {page.path}
                                                    </small>

                                                </div>

                                            </div>

                                            <strong>
                                                {formatNumber(
                                                    page.visits
                                                )}
                                            </strong>

                                            <strong>
                                                {formatNumber(
                                                    page.uniqueVisitors
                                                )}
                                            </strong>

                                        </div>
                                    )
                                )
                        )}

                    </div>

                </section>

                {/* DEVICES */}

                <section className="analytics-panel">

                    <div className="analytics-panel-header">

                        <div>

                            <span className="analytics-section-tag">
                                AUDIENCE
                            </span>

                            <h2>
                                Visitor Devices
                            </h2>

                            <p>
                                Devices used to access EPIC.
                            </p>

                        </div>

                    </div>

                    <div className="analytics-device-list">

                        {normalizedDevices.length === 0 ? (

                            <div className="analytics-small-empty">
                                No device data available.
                            </div>

                        ) : (

                            normalizedDevices.map(
                                (
                                    device: NormalizedDevice,
                                    index: number
                                ) => {

                                    const percentage =
                                        totalDeviceVisits > 0
                                            ? (
                                                device.visits /
                                                totalDeviceVisits
                                            ) * 100
                                            : 0;

                                    return (

                                        <div
                                            className="analytics-device-item"
                                            key={`${device.name}-${index}`}
                                        >

                                            <div className="device-icon">
                                                {getDeviceIcon(
                                                    device.name
                                                )}
                                            </div>

                                            <div className="device-details">

                                                <div className="device-title">

                                                    <span>
                                                        {device.name}
                                                    </span>

                                                    <strong>
                                                        {percentage.toFixed(
                                                            0
                                                        )}%
                                                    </strong>

                                                </div>

                                                <div className="device-bar">

                                                    <span
                                                        style={{
                                                            width:
                                                                `${Math.min(
                                                                    percentage,
                                                                    100
                                                                )}%`,
                                                        }}
                                                    />

                                                </div>

                                                <small>
                                                    {formatNumber(
                                                        device.visits
                                                    )}{" "}
                                                    visits
                                                </small>

                                            </div>

                                        </div>
                                    );
                                }
                            )
                        )}

                    </div>

                </section>

            </section>

            {/* =================================================
                BROWSERS
            ================================================= */}

            <section className="analytics-panel">

                <div className="analytics-panel-header">

                    <div>

                        <span className="analytics-section-tag">
                            TECHNOLOGY
                        </span>

                        <h2>
                            Browser Statistics
                        </h2>

                        <p>
                            Browsers used by your website visitors.
                        </p>

                    </div>

                </div>

                <div className="analytics-browser-grid">

                    {normalizedBrowsers.length === 0 ? (

                        <div className="analytics-small-empty">
                            No browser data available.
                        </div>

                    ) : (

                        normalizedBrowsers.map(
                            (
                                browser: NormalizedBrowser,
                                index: number
                            ) => {

                                const percentage =
                                    totalBrowserVisits > 0
                                        ? (
                                            browser.visits /
                                            totalBrowserVisits
                                        ) * 100
                                        : 0;

                                return (

                                    <div
                                        className="analytics-browser-card"
                                        key={`${browser.name}-${index}`}
                                    >

                                        <div className="browser-icon">
                                            {getBrowserInitial(
                                                browser.name
                                            )}
                                        </div>

                                        <div>

                                            <strong>
                                                {browser.name}
                                            </strong>

                                            <span>
                                                {formatNumber(
                                                    browser.visits
                                                )}{" "}
                                                visits
                                            </span>

                                        </div>

                                        <b>
                                            {percentage.toFixed(0)}%
                                        </b>

                                    </div>
                                );
                            }
                        )
                    )}

                </div>

            </section>

            {/* =================================================
                RECENT VISITS
            ================================================= */}

            <section className="analytics-panel">

                <div className="analytics-panel-header">

                    <div>

                        <span className="analytics-section-tag">
                            LIVE ACTIVITY
                        </span>

                        <h2>
                            Recent Website Visits
                        </h2>

                        <p>
                            Latest activity captured by EPIC Website Analytics.
                        </p>

                    </div>

                    <div className="analytics-live-badge">

                        <span />

                        LIVE

                    </div>

                </div>

                {recentVisits.length === 0 ? (

                    <div className="analytics-empty-state">

                        <strong>
                            No visitors recorded yet
                        </strong>

                        <span>
                            New visitor activity will appear here.
                        </span>

                    </div>

                ) : (

                    <div className="analytics-table-wrapper">

                        <table className="analytics-table">

                            <thead>

                                <tr>

                                    <th>
                                        PAGE
                                    </th>

                                    <th>
                                        VISITOR
                                    </th>

                                    <th>
                                        DEVICE
                                    </th>

                                    <th>
                                        SOURCE
                                    </th>

                                    <th>
                                        LOCATION
                                    </th>

                                    <th>
                                        STATUS
                                    </th>

                                    <th>
                                        TIME
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {recentVisits
                                    .slice(0, 20)
                                    .map(
                                        (
                                            visit: WebsiteVisit
                                        ) => {

                                            const visitorId =
                                                visit.visitorId
                                                    ? `${visit.visitorId.substring(
                                                        0,
                                                        8
                                                    )}...`
                                                    : "Unknown";

                                            const source =
                                                visit.trafficSource ||
                                                visit.referrer ||
                                                "Direct";

                                            return (

                                                <tr
                                                    key={
                                                        visit.websiteVisitId
                                                    }
                                                >

                                                    <td>

                                                        <div className="table-page">

                                                            <strong>
                                                                {visit.pageTitle ||
                                                                    "Untitled Page"}
                                                            </strong>

                                                            <small>
                                                                {visit.pagePath ||
                                                                    "/"}
                                                            </small>

                                                        </div>

                                                    </td>

                                                    <td>

                                                        <span className="visitor-id">
                                                            {visitorId}
                                                        </span>

                                                    </td>

                                                    <td>

                                                        <div className="table-device">

                                                            <span>
                                                                {getDeviceIcon(
                                                                    visit.deviceType
                                                                )}
                                                            </span>

                                                            <div>

                                                                <strong>
                                                                    {visit.deviceType ||
                                                                        "Unknown"}
                                                                </strong>

                                                                <small>
                                                                    {visit.browser ||
                                                                        "Unknown"}
                                                                </small>

                                                            </div>

                                                        </div>

                                                    </td>

                                                    <td>

                                                        <div className="table-stack">

                                                            <strong>
                                                                {source}
                                                            </strong>

                                                            <small>
                                                                {visit.trafficMedium ||
                                                                    "Direct"}
                                                            </small>

                                                        </div>

                                                    </td>

                                                    <td>

                                                        <div className="table-stack">

                                                            <strong>
                                                                {visit.country ||
                                                                    "Unknown"}
                                                            </strong>

                                                            <small>
                                                                {visit.city ||
                                                                    "Unknown"}
                                                            </small>

                                                        </div>

                                                    </td>

                                                    <td>

                                                        <div className="visit-statuses">

                                                            <span
                                                                className={
                                                                    visit.isReturningVisitor
                                                                        ? "status returning"
                                                                        : "status new"
                                                                }
                                                            >
                                                                {visit.isReturningVisitor
                                                                    ? "Returning"
                                                                    : "New"}
                                                            </span>

                                                            {visit.isBounce && (

                                                                <span className="status bounce">
                                                                    Bounce
                                                                </span>

                                                            )}

                                                        </div>

                                                    </td>

                                                    <td>

                                                        <span className="visit-time">
                                                            {formatDateTime(
                                                                visit.visitedAt
                                                            )}
                                                        </span>

                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )}

                            </tbody>

                        </table>

                    </div>
                )}

            </section>

            {/* =================================================
                FOOTER
            ================================================= */}

            <footer className="analytics-footer">

                <strong>
                    EPIC Website Analytics
                </strong>

                <span>
                    Visitor Intelligence & Traffic Monitoring
                </span>

                <span>
                    © 2026 EPIC Church Management System
                </span>

            </footer>

        </div>
    );
};

export default WebsiteAnalyticsDashboard;