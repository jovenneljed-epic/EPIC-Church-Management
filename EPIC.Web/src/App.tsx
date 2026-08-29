import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import "./App.css";

// =========================================================
// PUBLIC
// =========================================================

import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/public/AboutPage";
import ContactPage from "./pages/public/ContactPage";

// =========================================================
// ADMIN AUTH
// =========================================================

import Login from "./Login";

// =========================================================
// CLIENT AUTH / PORTAL
// =========================================================

import ClientLogin from "./pages/ClientLogin";
import ClientPortal from "./pages/ClientPortal";
import ClientPayment from "./pages/ClientPayment";

// =========================================================
// CMS
// =========================================================

import Dashboard from "./Dashboard";
import Members from "./Members";
import Attendance from "./Attendance";

import ChurchServicesPage from "./pages/ChurchServicesPage";
import EventManagementPage from "./pages/EventManagementPage";
import MemberAttendanceReport from "./pages/MemberAttendanceReport";

import Visitors from "./pages/Visitors";
import Giving from "./pages/Giving";
import Income from "./pages/Income";
import Ministries from "./pages/Ministries";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";
// =========================================================
// BUSINESS
// =========================================================

import SubscriptionDashboard from "./pages/SubscriptionDashboard";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import DemoRequests from "./pages/DemoRequests";
import Reports from "./pages/Reports";
import WebsiteAnalyticsDashboard from "./pages/WebsiteAnalyticsDashboard";

// =========================================================
// REPORTS
// =========================================================

import AttendanceReportBuilder from "./pages/reports/AttendanceReportBuilder";
import AttendanceByDateReport from "./pages/reports/AttendanceByDateReport";

// =========================================================
// LEARNING
// =========================================================

import LearningPage from "./pages/learning/LearningPage";
import ViewCourse from "./pages/learning/ViewCourse";
import LessonPage from "./pages/learning/LessonPage";

// =========================================================
// PERMISSIONS
// =========================================================

import PermissionService from "./PermissionService";
import PermissionFilter from "./PermissionFilter";

// =========================================================
// PAGE TYPES
// =========================================================

type Page =
    | "dashboard"
    | "reports"
    | "attendance-report"
    | "attendance-by-date-report"
    | "demo-requests"
    | "subscription-dashboard"
    | "subscriptions"
    | "client-payment"
    | "website-analytics"
    | "learning"
    | "view-course"
    | "lesson"
    | "members"
    | "attendance"
    | "member-attendance-report"
    | "services"
    | "events"
    | "ministries"
    | "visitors"
    | "giving"
    | "income"
    | "expenses"
    | "settings";

type PublicPage =
    | "landing"
    | "about"
    | "contact";

// =========================================================
// ROUTES
// =========================================================

const PAGE_ROUTES: Record<Page, string> = {
    dashboard: "/dashboard",

    reports: "/reports",
    "attendance-report": "/reports/attendance",
    "attendance-by-date-report": "/reports/attendance-date",

    "demo-requests": "/demo-requests",
    "subscription-dashboard": "/subscription-dashboard",
    subscriptions: "/subscriptions",
    "client-payment": "/client-payment",
    "website-analytics": "/website-analytics",

    learning: "/learning",
    "view-course": "/learning/course",
    lesson: "/learning/lesson",

    members: "/members",
    attendance: "/attendance",
    "member-attendance-report": "/member-attendance-report",

    services: "/services",
    events: "/events",
    ministries: "/ministries",
    visitors: "/visitors",
    giving: "/giving",
    income: "/income",
    expenses: "/expenses",
    settings: "/settings",
};

const PUBLIC_ROUTES: Record<PublicPage, string> = {
    landing: "/",
    about: "/about",
    contact: "/contact",
};

const ADMIN_LOGIN_ROUTE = "/login";
const CLIENT_LOGIN_ROUTE = "/client-login";
const CLIENT_PORTAL_ROUTE = "/client-portal";

// =========================================================
// PAGE TITLES
// =========================================================

const PAGE_TITLES: Record<Page, string> = {
    dashboard: "Dashboard",
    reports: "Reports & Documents",
    "attendance-report": "Attendance Summary Report",
    "attendance-by-date-report": "Attendance by Date",

    "demo-requests": "Demo Requests",
    "subscription-dashboard": "Subscription Dashboard",
    subscriptions: "Subscription Management",
    "client-payment": "EPIC CMS Payment",
    "website-analytics": "Website Analytics",

    services: "Church Services",
    events: "Event Management",
    "member-attendance-report": "Member Attendance Report",

    members: "Members Management",
    attendance: "Attendance Management",
    ministries: "Ministries Management",
    visitors: "Visitors Management",
    giving: "Giving Management",
    income: "Income Management",
    expenses: "Expenses Management",

    learning: "EPIC Learning",
    "view-course": "Course Details",
    lesson: "Lesson",

    settings: "System Settings",
};

// =========================================================
// PAGE SUBTITLES
// =========================================================

const PAGE_SUBTITLES: Record<Page, string> = {
    dashboard: "Church management overview",

    reports:
        "Generate reports, forms and printable church documents",

    "attendance-report":
        "Attendance summary, service records and member attendance data",

    "attendance-by-date-report":
        "View attendance records by selected date or date range",

    "demo-requests":
        "Manage churches requesting an EPIC system demonstration",

    "subscription-dashboard":
        "Monitor subscriptions, revenue, trials and billing performance",

    subscriptions:
        "Manage EPIC plans, subscriptions and billing",

    "client-payment":
        "Securely complete your EPIC CMS subscription payment",

    "website-analytics":
        "Monitor website visitors, traffic sources and engagement",

    services:
        "Schedule and manage church services and events",

    events:
        "Plan programs, teams, assignments and activities for every event",

    "member-attendance-report":
        "Attendance performance, member history and pastoral follow-up",

    members:
        "Manage church members and member information",

    attendance:
        "Monitor and record church attendance",

    ministries:
        "Manage ministries and ministry assignments",

    visitors:
        "Manage visitors, follow-ups, attendance and connections",

    giving:
        "Monitor tithes, offerings and church giving",

    income:
        "Manage church income records",

    expenses:
        "Manage church expenses",

    learning:
        "Grow in faith, develop leaders and strengthen discipleship",

    "view-course":
        "Explore course modules and lessons",

    lesson:
        "Study the lesson and track your progress",

    settings:
        "Manage system configuration",
};

// =========================================================
// AUTH STORAGE
// =========================================================

const ADMIN_AUTH_KEYS = [
    "token",
    "accessToken",
    "jwt",
    "authToken",
"epicToken",
] as const;

const ADMIN_USER_KEYS = [
    "currentUser",
    "currentFullName",
    "currentRole",
    "currentRoleId",
    "roleId",
    "userId",
    "permissions",
    "epicPermissions",
] as const;

// =========================================================
// CLIENT AUTH
//
// IMPORTANT
//
// ClientMemberId = individual client login account
// CustomerId     = church/customer
// MemberId       = church member
// ClientRoleId   = client permission role
// =========================================================

const CLIENT_AUTH_KEYS = [
    "clientToken",
    "clientAccessToken",
    "clientAuthToken",
    "epicClientToken",
] as const;

const CLIENT_USER_KEYS = [
    "clientUser",

    // Individual client account
    "clientMemberId",

    // Church/customer
    "customerId",
    "clientId",

    // Church member
    "memberId",
    "memberCode",

    // Client role
    "clientRoleId",
    "clientRoleName",

    // Profile
    "clientName",
    "clientEmail",
    "clientChurchName",
] as const;

// =========================================================
// AUTH HELPERS
// =========================================================

const getStoredValue = (
    keys: readonly string[]
): string | null => {
    for (const key of keys) {
        const value = localStorage.getItem(key);

        if (value && value.trim()) {
            return value.trim();
        }
    }

    return null;
};

const getAuthToken = (): string | null =>
    getStoredValue(ADMIN_AUTH_KEYS);

const getClientAuthToken = (): string | null =>
    getStoredValue(CLIENT_AUTH_KEYS);

const isLoggedIn = (): boolean =>
    Boolean(getAuthToken());

const isClientLoggedIn = (): boolean =>
    Boolean(getClientAuthToken());

const clearAuthentication = (): void => {
    [
        ...ADMIN_AUTH_KEYS,
        ...ADMIN_USER_KEYS,
    ].forEach((key) => {
        localStorage.removeItem(key);
    });
};

const clearClientAuthentication = (): void => {
    [
        ...CLIENT_AUTH_KEYS,
        ...CLIENT_USER_KEYS,
    ].forEach((key) => {
        localStorage.removeItem(key);
    });
};

// =========================================================
// CLIENT JWT
//
// Reads the claims already generated by
// ClientAuthController.GenerateJwtToken()
//
// Claims include:
//
// clientMemberId
// customerId
// memberId
// clientRoleId
// clientRoleName
// memberCode
// role
// accountType
// =========================================================

interface ClientTokenIdentity {
    clientMemberId: number | null;
    customerId: number | null;
    memberId: number | null;
    clientRoleId: number | null;
    clientRoleName: string | null;
    memberCode: string | null;
    username: string | null;
    role: string | null;
    accountType: string | null;
}

const EMPTY_CLIENT_IDENTITY: ClientTokenIdentity = {
    clientMemberId: null,
    customerId: null,
    memberId: null,
    clientRoleId: null,
    clientRoleName: null,
    memberCode: null,
    username: null,
    role: null,
    accountType: null,
};

const parseJwtPayload = (
    token: string
): Record<string, unknown> | null => {
    try {
        const parts = token.split(".");

        if (parts.length !== 3) {
            return null;
        }

        const base64Url = parts[1];

        const base64 = base64Url
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const padded =
            base64 +
            "=".repeat(
                (4 - (base64.length % 4)) % 4
            );

        const json = decodeURIComponent(
            Array.prototype.map
                .call(
                    atob(padded),
                    (character: string) =>
                        "%" +
                        (
                            "00" +
                            character
                                .charCodeAt(0)
                                .toString(16)
                        ).slice(-2)
                )
                .join("")
        );

        return JSON.parse(json);
    } catch {
        return null;
    }
};

const getJwtStringClaim = (
    payload: Record<string, unknown>,
    key: string
): string | null => {
    const value = payload[key];

    if (
        typeof value === "string" &&
        value.trim()
    ) {
        return value.trim();
    }

    if (
        typeof value === "number" &&
        Number.isFinite(value)
    ) {
        return String(value);
    }

    return null;
};

const getJwtIntegerClaim = (
    payload: Record<string, unknown>,
    key: string
): number | null => {
    const value =
        getJwtStringClaim(
            payload,
            key
        );

    if (!value) {
        return null;
    }

    const number = Number(value);

    return Number.isInteger(number) &&
        number > 0
        ? number
        : null;
};

const getClientTokenIdentity = (): ClientTokenIdentity => {
    const token =
        getClientAuthToken();

    if (!token) {
        return EMPTY_CLIENT_IDENTITY;
    }

    const payload =
        parseJwtPayload(token);

    if (!payload) {
        return EMPTY_CLIENT_IDENTITY;
    }

    return {
        clientMemberId:
            getJwtIntegerClaim(
                payload,
                "clientMemberId"
            ),

        customerId:
            getJwtIntegerClaim(
                payload,
                "customerId"
            ),

        memberId:
            getJwtIntegerClaim(
                payload,
                "memberId"
            ) ??
            getJwtIntegerClaim(
                payload,
                "MemberId"
            ),

        clientRoleId:
            getJwtIntegerClaim(
                payload,
                "clientRoleId"
            ),

        clientRoleName:
            getJwtStringClaim(
                payload,
                "clientRoleName"
            ),

        memberCode:
            getJwtStringClaim(
                payload,
                "memberCode"
            ),

        username:
            getJwtStringClaim(
                payload,
                "unique_name"
            ) ??
            getJwtStringClaim(
                payload,
                "name"
            ),

        role:
            getJwtStringClaim(
                payload,
                "role"
            ) ??
            getJwtStringClaim(
                payload,
                "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
            ),

        accountType:
            getJwtStringClaim(
                payload,
                "accountType"
            ),
    };
};

// =========================================================
// PATH HELPERS
// =========================================================

const normalizePath = (
    path: string
): string => {
    if (!path) {
        return "/";
    }

    const pathname = path
        .split("?")[0]
        .split("#")[0];

    return pathname.replace(/\/+$/, "") || "/";
};

const getCurrentPath = (): string =>
    normalizePath(
        window.location.pathname
    );

// =========================================================
// NUMBER
// =========================================================

const parsePositiveInteger = (
    value: string | null
): number | null => {
    if (!value?.trim()) {
        return null;
    }

    const number = Number(value);

    return Number.isInteger(number) &&
        number > 0
        ? number
        : null;
};

// =========================================================
// LMS ROUTING
// =========================================================

interface LMSRouteState {
    page: Page;
    courseId: number | null;
    lessonId: number | null;
}

const EMPTY_LMS_ROUTE: LMSRouteState = {
    page: "learning",
    courseId: null,
    lessonId: null,
};

const getLMSRouteState = (
    pathname: string
): LMSRouteState => {
    const path =
        normalizePath(pathname);

    const lessonMatch =
        path.match(
            /^\/learning\/course\/(\d+)\/lesson\/(\d+)$/
        );

    if (lessonMatch) {
        return {
            page: "lesson",

            courseId:
                parsePositiveInteger(
                    lessonMatch[1]
                ),

            lessonId:
                parsePositiveInteger(
                    lessonMatch[2]
                ),
        };
    }

    const courseMatch =
        path.match(
            /^\/learning\/course\/(\d+)$/
        );

    if (courseMatch) {
        return {
            page: "view-course",

            courseId:
                parsePositiveInteger(
                    courseMatch[1]
                ),

            lessonId: null,
        };
    }

    if (
        path ===
        "/learning/course"
    ) {
        return {
            page: "view-course",
            courseId: null,
            lessonId: null,
        };
    }

    if (
        path ===
        "/learning/lesson"
    ) {
        return {
            page: "lesson",
            courseId: null,
            lessonId: null,
        };
    }

    return EMPTY_LMS_ROUTE;
};

// =========================================================
// PAGE LOOKUP
// =========================================================

const PAGE_BY_ROUTE: Record<
    string,
    Page
> =
    Object.entries(
        PAGE_ROUTES
    ).reduce(
        (
            result,
            [page, route]
        ) => {
            result[
                normalizePath(route)
            ] =
                page as Page;

            return result;
        },
        {} as Record<
            string,
            Page
        >
    );

const getPageFromPath = (
    path: string
): Page => {
    const normalized =
        normalizePath(path);

    if (
        normalized.startsWith(
            "/learning"
        )
    ) {
        return getLMSRouteState(
            normalized
        ).page;
    }

    return (
        PAGE_BY_ROUTE[
            normalized
        ] ??
        "dashboard"
    );
};

// =========================================================
// PUBLIC ROUTES
// =========================================================

const isPublicPath = (
    path: string
): boolean => {
    const normalized =
        normalizePath(path);

    return (
        normalized ===
            PUBLIC_ROUTES.landing ||
        normalized ===
            PUBLIC_ROUTES.about ||
        normalized ===
            PUBLIC_ROUTES.contact ||
        normalized ===
            PAGE_ROUTES[
                "client-payment"
            ]
    );
};

// =========================================================
// PAYMENT
// =========================================================

const getPaymentSubscriptionId =
    (): number | null => {
        const params =
            new URLSearchParams(
                window.location.search
            );

        const queryId =
            parsePositiveInteger(
                params.get(
                    "subscriptionId"
                )
            );

        if (queryId) {
            return queryId;
        }

        return parsePositiveInteger(
            localStorage.getItem(
                "subscriptionId"
            )
        );
    };

// =========================================================
// NAVIGATION TYPES
// =========================================================

interface NavigationItem {
    page: Page;
    label: string;
    icon: string;
    permission: string;
}

interface NavigationSection {
    title?: string;
    items: NavigationItem[];
}

// =========================================================
// NAVIGATION
// =========================================================

const NAVIGATION_SECTIONS:
    NavigationSection[] = [
    {
        title: "MAIN MENU",

        items: [
            {
                page: "dashboard",
                label: "Dashboard",
                icon: "▦",
                permission: "Dashboard",
            },
            {
                page: "services",
                label: "Church Services",
                icon: "⛪",
                permission:
                    "Church Services",
            },
            {
                page: "events",
                label: "Event Management",
                icon: "🎯",
                permission:
                    "Event Management",
            },
            {
                page: "reports",
                label: "Reports & Documents",
                icon: "📊",
                permission: "Reports",
            },
            {
                page:
                    "member-attendance-report",
                label:
                    "Member Attendance Report",
                icon: "📊",
                permission:
                    "Attendance",
            },
            {
                page: "members",
                label: "Members",
                icon: "♟",
                permission: "Members",
            },
            {
                page: "attendance",
                label: "Attendance",
                icon: "✓",
                permission:
                    "Attendance",
            },
        ],
    },

    {
        title: "MANAGEMENT",

        items: [
            {
                page: "ministries",
                label: "Ministries",
                icon: "♫",
                permission:
                    "Ministries",
            },
            {
                page: "visitors",
                label: "Visitors",
                icon: "👤",
                permission:
                    "Visitors",
            },
            {
                page: "giving",
                label: "Giving",
                icon: "₱",
                permission: "Giving",
            },
            {
                page: "income",
                label: "Income",
                icon: "↗",
                permission: "Income",
            },
            {
                page: "expenses",
                label: "Expenses",
                icon: "−",
                permission:
                    "Expenses",
            },
        ],
    },

    {
        title: "EPIC LEARNING",

        items: [
            {
                page: "learning",
                label: "EPIC Learning",
                icon: "📚",
                permission:
                    "EPIC Learning",
            },
        ],
    },

    {
        title: "BUSINESS / SALES",

        items: [
            {
                page:
                    "subscription-dashboard",
                label:
                    "Subscription Dashboard",
                icon: "📈",
                permission:
                    "Subscriptions",
            },
            {
                page: "subscriptions",
                label: "Subscriptions",
                icon: "💳",
                permission:
                    "Subscriptions",
            },
            {
                page:
                    "demo-requests",
                label:
                    "Demo Requests",
                icon: "🎯",
                permission:
                    "Demo Requests",
            },
            {
                page:
                    "website-analytics",
                label:
                    "Website Analytics",
                icon: "📊",
                permission:
                    "Website Analytics",
            },
        ],
    },

    {
        title: "SYSTEM",

        items: [
            {
                page: "settings",
                label: "Settings",
                icon: "⚙",
                permission:
                    "Settings",
            },
        ],
    },
];

// =========================================================
// ACTIVE NAVIGATION
// =========================================================

const isNavigationItemActive = (
    itemPage: Page,
    activePage: Page
): boolean => {
    if (
        itemPage ===
        "learning"
    ) {
        return [
            "learning",
            "view-course",
            "lesson",
        ].includes(
            activePage
        );
    }

    return (
        itemPage ===
        activePage
    );
};

// =========================================================
// USER
// =========================================================

interface UserInfo {
    fullName: string;
    role: string;
    avatarLetter: string;
}

// =========================================================
// APP
// =========================================================

const App: React.FC = () => {
    // =====================================================
    // AUTH
    // =====================================================

    const [
        authInitialized,
        setAuthInitialized,
    ] = useState(false);

    const [
        isAuthenticated,
        setIsAuthenticated,
    ] = useState(false);

    const [
        clientAuthenticated,
        setClientAuthenticated,
    ] = useState(false);

    // =====================================================
    // CLIENT IDENTITY
    //
    // This is separate from admin authentication.
    // =====================================================

    // =====================================================
    // CLIENT IDENTITY
    //
    // This is separate from admin authentication.
    // =====================================================

    const [, setClientIdentity] =
        useState<ClientTokenIdentity>(
            EMPTY_CLIENT_IDENTITY
        );
    // =====================================================
    // ROUTING
    // =====================================================

    const [
        currentPath,
        setCurrentPath,
    ] =
        useState(
            getCurrentPath
        );

    const [
        activePage,
        setActivePage,
    ] =
        useState<Page>(
            () =>
                getPageFromPath(
                    window.location.pathname
                )
        );

    // =====================================================
    // SIDEBAR
    // =====================================================

    const [
        sidebarOpen,
        setSidebarOpen,
    ] =
        useState(true);

    // =====================================================
    // LMS
    // =====================================================

    const initialLMSState =
        useMemo(
            () =>
                getLMSRouteState(
                    window.location.pathname
                ),
            []
        );

    const [
        selectedCourseId,
        setSelectedCourseId,
    ] =
        useState<number | null>(
            initialLMSState.courseId
        );

    const [
        selectedLessonId,
        setSelectedLessonId,
    ] =
        useState<number | null>(
            initialLMSState.lessonId
        );

    // =====================================================
    // PAYMENT
    // =====================================================

    const [
        paymentSubscriptionId,
        setPaymentSubscriptionId,
    ] =
        useState<number | null>(
            getPaymentSubscriptionId()
        );

    // =====================================================
    // USER
    // =====================================================

    const userInfo =
        useMemo<UserInfo>(
            () => {
                const fullName =
                    localStorage.getItem(
                        "currentFullName"
                    ) ||
                    localStorage.getItem(
                        "currentUser"
                    ) ||
                    "Administrator";

                const role =
                    localStorage.getItem(
                        "currentRole"
                    ) ||
                    "Church Admin";

                return {
                    fullName,

                    role,

                    avatarLetter:
                        fullName
                            .trim()
                            .charAt(0)
                            .toUpperCase() ||
                        "A",
                };
            },
            [isAuthenticated]
        );

    const {
        fullName,
        role,
        avatarLetter,
    } = userInfo;

    // =====================================================
    // PATH FLAGS
    // =====================================================

    const normalizedPath =
        normalizePath(
            currentPath
        );

    const isLandingPage =
        normalizedPath ===
        PUBLIC_ROUTES.landing;

    const isAboutPage =
        normalizedPath ===
        PUBLIC_ROUTES.about;

    const isContactPage =
        normalizedPath ===
        PUBLIC_ROUTES.contact;

    const isClientPaymentPage =
        normalizedPath ===
        PAGE_ROUTES[
            "client-payment"
        ];

    const isLoginPage =
        normalizedPath ===
        ADMIN_LOGIN_ROUTE;

    const isClientLoginPage =
        normalizedPath ===
        CLIENT_LOGIN_ROUTE;

    const isClientPortalPage =
        normalizedPath ===
        CLIENT_PORTAL_ROUTE;

    // =====================================================
    // ROUTE SYNC
    // =====================================================

    const syncRouteState =
        useCallback(
            (pathname: string) => {
                const normalized =
                    normalizePath(
                        pathname
                    );

                setCurrentPath(
                    normalized
                );

                setActivePage(
                    getPageFromPath(
                        normalized
                    )
                );

                const lms =
                    getLMSRouteState(
                        normalized
                    );

                setSelectedCourseId(
                    lms.courseId
                );

                setSelectedLessonId(
                    lms.lessonId
                );

                if (
                    normalized ===
                    PAGE_ROUTES[
                        "client-payment"
                    ]
                ) {
                    setPaymentSubscriptionId(
                        getPaymentSubscriptionId()
                    );
                }
            },
            []
        );

    // =====================================================
    // NAVIGATION
    // =====================================================

    const navigateToUrl =
        useCallback(
            (url: string) => {
                if (!url) {
                    return;
                }

                const target =
                    new URL(
                        url,
                        window.location.origin
                    );

                const pathname =
                    normalizePath(
                        target.pathname
                    );

                const finalUrl =
                    `${pathname}${target.search}${target.hash}`;

                const currentUrl =
                    `${window.location.pathname}${window.location.search}${window.location.hash}`;

                if (
                    currentUrl !==
                    finalUrl
                ) {
                    window.history.pushState(
                        {},
                        "",
                        finalUrl
                    );
                }

                syncRouteState(
                    pathname
                );

                if (
                    pathname ===
                    PAGE_ROUTES[
                        "client-payment"
                    ]
                ) {
                    const id =
                        parsePositiveInteger(
                            new URLSearchParams(
                                target.search
                            ).get(
                                "subscriptionId"
                            )
                        );

                    if (id) {
                        setPaymentSubscriptionId(
                            id
                        );

                        localStorage.setItem(
                            "subscriptionId",
                            String(id)
                        );
                    }
                }
            },
            [syncRouteState]
        );

    const navigate =
        useCallback(
            (page: Page) => {
                navigateToUrl(
                    PAGE_ROUTES[
                        page
                    ]
                );

                if (
                    window.innerWidth <=
                    900
                ) {
                    setSidebarOpen(
                        false
                    );
                }
            },
            [navigateToUrl]
        );

    const navigatePublic =
        useCallback(
            (page: PublicPage) => {
                navigateToUrl(
                    PUBLIC_ROUTES[
                        page
                    ]
                );
            },
            [navigateToUrl]
        );

    // =====================================================
    // INITIAL AUTH CHECK
    // =====================================================

    useEffect(() => {
        const adminAuthenticated =
            isLoggedIn();

        const clientIsAuthenticated =
            isClientLoggedIn();

        setIsAuthenticated(
            adminAuthenticated
        );

        setClientAuthenticated(
            clientIsAuthenticated
        );

        // -------------------------------------------------
        // LOAD CLIENT JWT IDENTITY
        // -------------------------------------------------

        if (
            clientIsAuthenticated
        ) {
            const identity =
                getClientTokenIdentity();

            setClientIdentity(
                identity
            );

            // Keep the important client identifiers
            // available to the application.

            if (
                identity.clientMemberId
            ) {
                localStorage.setItem(
                    "clientMemberId",
                    String(
                        identity.clientMemberId
                    )
                );
            }

            if (
                identity.customerId
            ) {
                localStorage.setItem(
                    "customerId",
                    String(
                        identity.customerId
                    )
                );

                // Backward compatibility
                // with existing client code.

                localStorage.setItem(
                    "clientId",
                    String(
                        identity.customerId
                    )
                );
            }

            if (
                identity.memberId
            ) {
                localStorage.setItem(
                    "memberId",
                    String(
                        identity.memberId
                    )
                );
            }

            if (
                identity.clientRoleId
            ) {
                localStorage.setItem(
                    "clientRoleId",
                    String(
                        identity.clientRoleId
                    )
                );
            }

            if (
                identity.clientRoleName
            ) {
                localStorage.setItem(
                    "clientRoleName",
                    identity.clientRoleName
                );
            }

            if (
                identity.memberCode
            ) {
                localStorage.setItem(
                    "memberCode",
                    identity.memberCode
                );
            }
        }

        if (
            adminAuthenticated
        ) {
            PermissionService.debugPermissions();
        }

        setAuthInitialized(
            true
        );
    }, []);

    // =====================================================
    // BROWSER HISTORY
    // =====================================================

    useEffect(() => {
        const handlePopState =
            () => {
                syncRouteState(
                    window.location.pathname
                );
            };

        window.addEventListener(
            "popstate",
            handlePopState
        );

        return () => {
            window.removeEventListener(
                "popstate",
                handlePopState
            );
        };
    }, [
        syncRouteState,
    ]);

    // =====================================================
    // ADMIN AUTH EVENTS
    // =====================================================

    useEffect(() => {
        const handleAuthChanged =
            () => {
                const authenticated =
                    isLoggedIn();

                setIsAuthenticated(
                    authenticated
                );

                if (
                    authenticated
                ) {
                    PermissionService.debugPermissions();
                }
            };

        window.addEventListener(
            "epic:auth-changed",
            handleAuthChanged
        );

        return () => {
            window.removeEventListener(
                "epic:auth-changed",
                handleAuthChanged
            );
        };
    }, []);

    // =====================================================
    // CLIENT AUTH EVENTS
    // =====================================================

    useEffect(() => {
        const handleClientAuthChanged =
            () => {
                const authenticated =
                    isClientLoggedIn();

                setClientAuthenticated(
                    authenticated
                );

                if (
                    authenticated
                ) {
                    setClientIdentity(
                        getClientTokenIdentity()
                    );
                } else {
                    setClientIdentity(
                        EMPTY_CLIENT_IDENTITY
                    );
                }
            };

        window.addEventListener(
            "epic:client-auth-changed",
            handleClientAuthChanged
        );

        return () => {
            window.removeEventListener(
                "epic:client-auth-changed",
                handleClientAuthChanged
            );
        };
    }, []);

    // =====================================================
    // ADMIN ROUTE GUARD
    // =====================================================

    useEffect(() => {
        if (
            !authInitialized
        ) {
            return;
        }

        // Public pages never require
        // admin authentication.

        if (
            isPublicPath(
                normalizedPath
            )
        ) {
            return;
        }

        // Client routes use their
        // own authentication.

        if (
            isClientLoginPage ||
            isClientPortalPage
        ) {
            return;
        }

        // Already authenticated:
        // /login -> /dashboard

        if (
            isLoginPage &&
            isAuthenticated
        ) {
            navigateToUrl(
                PAGE_ROUTES.dashboard
            );

            return;
        }

        // Not authenticated:
        // any CMS route -> /login

        if (
            !isAuthenticated &&
            !isLoginPage
        ) {
            navigateToUrl(
                ADMIN_LOGIN_ROUTE
            );
        }
    }, [
        authInitialized,
        normalizedPath,
        isAuthenticated,
        isLoginPage,
        isClientLoginPage,
        isClientPortalPage,
        navigateToUrl,
    ]);

    // =====================================================
    // CLIENT LOGIN GUARD
    // =====================================================

    useEffect(() => {
        if (
            !authInitialized
        ) {
            return;
        }

        if (
            isClientLoginPage &&
            clientAuthenticated
        ) {
            navigateToUrl(
                CLIENT_PORTAL_ROUTE
            );
        }
    }, [
        authInitialized,
        isClientLoginPage,
        clientAuthenticated,
        navigateToUrl,
    ]);

    // =====================================================
    // CLIENT PORTAL GUARD
    // =====================================================

    useEffect(() => {
        if (
            !authInitialized
        ) {
            return;
        }

        if (
            isClientPortalPage &&
            !clientAuthenticated
        ) {
            navigateToUrl(
                CLIENT_LOGIN_ROUTE
            );
        }
    }, [
        authInitialized,
        isClientPortalPage,
        clientAuthenticated,
        navigateToUrl,
    ]);

    // =====================================================
    // LANDING LOGIN
    // =====================================================

    const handleLandingLogin =
        useCallback(() => {
            navigateToUrl(
                ADMIN_LOGIN_ROUTE
            );
        }, [
            navigateToUrl,
        ]);

    // =====================================================
    // PUBLIC NAVIGATION
    // =====================================================

    const handlePublicNavigate =
        useCallback(
            (page: string) => {
                switch (page) {
                    case "landing":
                    case "home":
                        navigatePublic(
                            "landing"
                        );
                        break;

                    case "about":
                        navigatePublic(
                            "about"
                        );
                        break;

                    case "contact":
                        navigatePublic(
                            "contact"
                        );
                        break;

                    case "login":
                    case "admin-login":
                        navigateToUrl(
                            ADMIN_LOGIN_ROUTE
                        );
                        break;

                    case "client-login":
                        navigateToUrl(
                            CLIENT_LOGIN_ROUTE
                        );
                        break;

                    case "payment": {
                        const subscriptionId =
                            getPaymentSubscriptionId();

                        const url =
                            subscriptionId
                                ? `${PAGE_ROUTES[
                                      "client-payment"
                                  ]}?subscriptionId=${subscriptionId}`
                                : PAGE_ROUTES[
                                      "client-payment"
                                  ];

                        navigateToUrl(
                            url
                        );

                        break;
                    }

                    default:
                        navigatePublic(
                            "landing"
                        );
                }
            },
            [
                navigatePublic,
                navigateToUrl,
            ]
        );

    // =====================================================
    // ADMIN LOGIN SUCCESS
    // =====================================================

    const handleLoginSuccess =
        useCallback(() => {
            const token =
                getAuthToken();

            if (!token) {
                console.warn(
                    "APP: Login succeeded but no admin token was found."
                );

                setIsAuthenticated(
                    false
                );

                return;
            }

            setIsAuthenticated(
                true
            );

            setSelectedCourseId(
                null
            );

            setSelectedLessonId(
                null
            );

            PermissionService.debugPermissions();

            window.dispatchEvent(
                new Event(
                    "epic:auth-changed"
                )
            );

            navigateToUrl(
                PAGE_ROUTES.dashboard
            );
        }, [
            navigateToUrl,
        ]);

    // =====================================================
    // CLIENT LOGIN SUCCESS
    // =====================================================

    const handleClientLoginSuccess =
        useCallback(() => {
            const token =
                getClientAuthToken();

            if (!token) {
                setClientAuthenticated(
                    false
                );

                return;
            }

            // ---------------------------------------------
            // Read the exact identity issued by
            // ClientAuthController
            // ---------------------------------------------

            const identity =
                getClientTokenIdentity();

            setClientIdentity(
                identity
            );

            // ---------------------------------------------
            // Persist client identity
            // ---------------------------------------------

            if (
                identity.clientMemberId
            ) {
                localStorage.setItem(
                    "clientMemberId",
                    String(
                        identity.clientMemberId
                    )
                );
            }

            if (
                identity.customerId
            ) {
                localStorage.setItem(
                    "customerId",
                    String(
                        identity.customerId
                    )
                );

                // clientId remains an alias
                // for CustomerId for compatibility
                // with existing ClientPortal code.

                localStorage.setItem(
                    "clientId",
                    String(
                        identity.customerId
                    )
                );
            }

            if (
                identity.memberId
            ) {
                localStorage.setItem(
                    "memberId",
                    String(
                        identity.memberId
                    )
                );
            }

            if (
                identity.clientRoleId
            ) {
                localStorage.setItem(
                    "clientRoleId",
                    String(
                        identity.clientRoleId
                    )
                );
            }

            if (
                identity.clientRoleName
            ) {
                localStorage.setItem(
                    "clientRoleName",
                    identity.clientRoleName
                );
            }

            if (
                identity.memberCode
            ) {
                localStorage.setItem(
                    "memberCode",
                    identity.memberCode
                );
            }

            // ---------------------------------------------
            // Make sure this is really a CLIENT token
            // ---------------------------------------------

            if (
                identity.role &&
                identity.role
                    .toUpperCase() !==
                    "CLIENT"
            ) {
                console.error(
                    "APP: Client token does not contain CLIENT role."
                );

                setClientAuthenticated(
                    false
                );

                clearClientAuthentication();

                return;
            }

            setClientAuthenticated(
                true
            );

            window.dispatchEvent(
                new Event(
                    "epic:client-auth-changed"
                )
            );

            navigateToUrl(
                CLIENT_PORTAL_ROUTE
            );
        }, [
            navigateToUrl,
        ]);

    // =====================================================
    // ADMIN LOGOUT
    // =====================================================

    const handleLogout =
        useCallback(() => {
            clearAuthentication();

            setIsAuthenticated(
                false
            );

            setSelectedCourseId(
                null
            );

            setSelectedLessonId(
                null
            );

            setPaymentSubscriptionId(
                null
            );

            window.dispatchEvent(
                new Event(
                    "epic:auth-changed"
                )
            );

            navigateToUrl(
                PUBLIC_ROUTES.landing
            );
        }, [
            navigateToUrl,
        ]);

    // =====================================================
    // CLIENT LOGOUT
    // =====================================================

    const handleClientLogout =
        useCallback(() => {
            clearClientAuthentication();

            setClientAuthenticated(
                false
            );

            setClientIdentity(
                EMPTY_CLIENT_IDENTITY
            );

            window.dispatchEvent(
                new Event(
                    "epic:client-auth-changed"
                )
            );

            navigateToUrl(
                PUBLIC_ROUTES.landing
            );
        }, [
            navigateToUrl,
        ]);

    // =====================================================
    // LMS NAVIGATION
    // =====================================================

    const handleViewCourse =
        useCallback(
            (
                courseId: number
            ) => {
                if (
                    !courseId ||
                    !PermissionService.canView(
                        "EPIC Learning"
                    )
                ) {
                    return;
                }

                navigateToUrl(
                    `/learning/course/${courseId}`
                );
            },
            [
                navigateToUrl,
            ]
        );

    const handleViewLesson =
        useCallback(
            (
                courseId: number,
                lessonId: number
            ) => {
                if (
                    !courseId ||
                    !lessonId ||
                    !PermissionService.canView(
                        "EPIC Learning"
                    )
                ) {
                    return;
                }

                navigateToUrl(
                    `/learning/course/${courseId}/lesson/${lessonId}`
                );
            },
            [
                navigateToUrl,
            ]
        );

    const handleOpenLearning =
        useCallback(() => {
            if (
                PermissionService.canView(
                    "EPIC Learning"
                )
            ) {
                navigate(
                    "learning"
                );
            }
        }, [
            navigate,
        ]);

    const handleBackToCourse =
        useCallback(() => {
            if (
                selectedCourseId
            ) {
                navigateToUrl(
                    `/learning/course/${selectedCourseId}`
                );
            } else {
                navigateToUrl(
                    PAGE_ROUTES.learning
                );
            }
        }, [
            selectedCourseId,
            navigateToUrl,
        ]);

    const handleBackToLearning =
        useCallback(() => {
            navigateToUrl(
                PAGE_ROUTES.learning
            );
        }, [
            navigateToUrl,
        ]);

    // =====================================================
    // LMS EVENTS
    // =====================================================

    useEffect(() => {
        const handleOpenCourse =
            (
                event: Event
            ) => {
                const customEvent =
                    event as CustomEvent<{
                        courseId?: number;
                    }>;

                const courseId =
                    customEvent
                        .detail
                        ?.courseId;

                if (
                    courseId
                ) {
                    handleViewCourse(
                        courseId
                    );
                }
            };

        const handleOpenLesson =
            (
                event: Event
            ) => {
                const customEvent =
                    event as CustomEvent<{
                        courseId?: number;
                        lessonId?: number;
                    }>;

                const {
                    courseId,
                    lessonId,
                } =
                    customEvent
                        .detail ??
                    {};

                if (
                    courseId &&
                    lessonId
                ) {
                    handleViewLesson(
                        courseId,
                        lessonId
                    );
                }
            };

        window.addEventListener(
            "epic-open-course",
            handleOpenCourse
        );

        window.addEventListener(
            "epic-open-lesson",
            handleOpenLesson
        );

        return () => {
            window.removeEventListener(
                "epic-open-course",
                handleOpenCourse
            );

            window.removeEventListener(
                "epic-open-lesson",
                handleOpenLesson
            );
        };
    }, [
        handleViewCourse,
        handleViewLesson,
    ]);

    // =====================================================
    // PERMISSIONS
    // =====================================================

    const canView =
        useCallback(
            (
                module: string
            ): boolean =>
                PermissionService.canView(
                    module
                ),
            []
        );

    // =====================================================
    // ACCESS DENIED
    // =====================================================

    const renderAccessDenied =
        useCallback(
            (
                module: string
            ) => (
                <div className="epic-empty-state">
                    <h2>
                        Access Denied
                    </h2>

                    <p>
                        You do not have
                        permission to view{" "}
                        <strong>
                            {module}
                        </strong>
                        .
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "dashboard"
                            )
                        }
                    >
                        Back to Dashboard
                    </button>
                </div>
            ),
            [
                navigate,
            ]
        );

    // =====================================================
    // PROTECTED PAGE
    // =====================================================

    const renderProtectedPage =
        useCallback(
            (
                permission: string,
                component: React.ReactNode
            ) => {
                if (
                    !canView(
                        permission
                    )
                ) {
                    return renderAccessDenied(
                        permission
                    );
                }

                return component;
            },
            [
                canView,
                renderAccessDenied,
            ]
        );

    // =====================================================
    // LMS EMPTY STATE
    // =====================================================

    const renderLearningEmptyState =
        useCallback(
            (
                title: string,
                message: string
            ) => (
                <div className="epic-empty-state">
                    <h2>
                        {title}
                    </h2>

                    <p>
                        {message}
                    </p>

                    <button
                        type="button"
                        onClick={
                            handleBackToLearning
                        }
                    >
                        Back to EPIC Learning
                    </button>
                </div>
            ),
            [
                handleBackToLearning,
            ]
        );

    // =====================================================
    // PAGE RENDERER
    // =====================================================

    const renderPage =
        useCallback(() => {
            switch (
                activePage
            ) {
                case "dashboard":
                    return renderProtectedPage(
                        "Dashboard",
                        <Dashboard />
                    );

                case "reports":
                    return renderProtectedPage(
                        "Reports",
                        <Reports
                            onOpenAttendanceReport={() =>
                                navigate(
                                    "attendance-report"
                                )
                            }
                            onOpenAttendanceByDate={() =>
                                navigate(
                                    "attendance-by-date-report"
                                )
                            }
                        />
                    );

                case "attendance-report":
                    return renderProtectedPage(
                        "Attendance",
                        <AttendanceReportBuilder />
                    );

                case "attendance-by-date-report":
                    return renderProtectedPage(
                        "Attendance",
                        <AttendanceByDateReport />
                    );

                case "demo-requests":
                    return renderProtectedPage(
                        "Demo Requests",
                        <DemoRequests />
                    );

                case "subscription-dashboard":
                    return renderProtectedPage(
                        "Subscriptions",
                        <SubscriptionDashboard />
                    );

                case "subscriptions":
                    return renderProtectedPage(
                        "Subscriptions",
                        <SubscriptionManagement />
                    );

                case "website-analytics":
                    return renderProtectedPage(
                        "Website Analytics",
                        <WebsiteAnalyticsDashboard />
                    );

                case "client-payment":
                    return (
                        <ClientPayment
                            subscriptionId={
                                paymentSubscriptionId ??
                                undefined
                            }
                        />
                    );

                case "services":
                    return renderProtectedPage(
                        "Church Services",
                        <ChurchServicesPage />
                    );

                case "events":
                    return renderProtectedPage(
                        "Event Management",
                        <EventManagementPage />
                    );

                case "members":
                    return renderProtectedPage(
                        "Members",
                        <Members />
                    );

                case "attendance":
                    return renderProtectedPage(
                        "Attendance",
                        <Attendance />
                    );

                case "member-attendance-report":
                    return renderProtectedPage(
                        "Attendance",
                        <MemberAttendanceReport />
                    );

                case "ministries":
                    return renderProtectedPage(
                        "Ministries",
                        <Ministries />
                    );

                case "visitors":
                    return renderProtectedPage(
                        "Visitors",
                        <Visitors />
                    );

                case "giving":
                    return renderProtectedPage(
                        "Giving",
                        <Giving />
                    );

                case "income":
                    return renderProtectedPage(
                        "Income",
                        <Income />
                    );

                case "expenses":
                    return renderProtectedPage(
                        "Expenses",
                        <Expenses />
                    );

                case "learning":
                    return renderProtectedPage(
                        "EPIC Learning",
                        <LearningPage
                            onViewCourse={
                                handleViewCourse
                            }
                        />
                    );

                case "view-course":
                    if (
                        !canView(
                            "EPIC Learning"
                        )
                    ) {
                        return renderAccessDenied(
                            "EPIC Learning"
                        );
                    }

                    if (
                        !selectedCourseId
                    ) {
                        return renderLearningEmptyState(
                            "Course Not Selected",
                            "Please select a course from EPIC Learning."
                        );
                    }

                    return (
                        <ViewCourse
                            courseId={
                                selectedCourseId
                            }
                            onBack={
                                handleBackToLearning
                            }
                            onLessonSelect={(
                                lessonId
                            ) =>
                                handleViewLesson(
                                    selectedCourseId,
                                    lessonId
                                )
                            }
                        />
                    );

                case "lesson":
                    if (
                        !canView(
                            "EPIC Learning"
                        )
                    ) {
                        return renderAccessDenied(
                            "EPIC Learning"
                        );
                    }

                    if (
                        !selectedCourseId ||
                        !selectedLessonId
                    ) {
                        return renderLearningEmptyState(
                            "Lesson Not Selected",
                            "Please select a lesson from the course."
                        );
                    }

                    return (
                        <LessonPage
                            courseId={
                                selectedCourseId
                            }
                            lessonId={
                                selectedLessonId
                            }
                            onBack={
                                handleBackToCourse
                            }
                        />
                    );

                case "settings":
                    return renderProtectedPage(
                        "Settings",
                        <Settings />
                    );

                default:
                    return renderProtectedPage(
                        "Dashboard",
                        <Dashboard />
                    );
            }
        }, [
            activePage,
            navigate,
            renderProtectedPage,
            paymentSubscriptionId,
            selectedCourseId,
            selectedLessonId,
            handleViewCourse,
            handleViewLesson,
            handleBackToCourse,
            handleBackToLearning,
            canView,
            renderAccessDenied,
            renderLearningEmptyState,
        ]);

    // =====================================================
    // AUTH INITIALIZATION SCREEN
    // =====================================================

    if (
        !authInitialized
    ) {
        return null;
    }

    // =====================================================
    // PUBLIC LANDING
    // =====================================================

    if (
        isLandingPage
    ) {
        return (
            <LandingPage
                onLogin={
                    handleLandingLogin
                }
                onNavigate={
                    handlePublicNavigate
                }
            />
        );
    }

    // =====================================================
    // PUBLIC ABOUT
    // =====================================================

    if (
        isAboutPage
    ) {
        return (
            <AboutPage
                onNavigate={
                    handlePublicNavigate
                }
            />
        );
    }

    // =====================================================
    // PUBLIC CONTACT
    // =====================================================

    if (
        isContactPage
    ) {
        return (
            <ContactPage
                onNavigate={
                    handlePublicNavigate
                }
            />
        );
    }

    // =====================================================
    // CLIENT LOGIN
    // =====================================================

    if (
        isClientLoginPage
    ) {
        return (
            <ClientLogin
                onLoginSuccess={
                    handleClientLoginSuccess
                }
                onBackToLanding={() =>
                    navigateToUrl(
                        PUBLIC_ROUTES.landing
                    )
                }
            />
        );
    }

    // =====================================================
    // CLIENT PORTAL
    // =====================================================

    if (
        isClientPortalPage
    ) {
        return clientAuthenticated ? (
            <ClientPortal
                onLogout={
                    handleClientLogout
                }
                onBackToLanding={() =>
                    navigateToUrl(
                        PUBLIC_ROUTES.landing
                    )
                }
            />
        ) : null;
    }

    // =====================================================
    // PUBLIC PAYMENT
    // =====================================================

    if (
        isClientPaymentPage
    ) {
        return (
            <ClientPayment
                subscriptionId={
                    paymentSubscriptionId ??
                    undefined
                }
            />
        );
    }

    // =====================================================
    // ADMIN LOGIN
    // =====================================================

    if (
        isLoginPage
    ) {
        return isAuthenticated ? (
            null
        ) : (
            <div className="epic-login-container">
                <Login
                    onLoginSuccess={
                        handleLoginSuccess
                    }
                />
            </div>
        );
    }

    // =====================================================
    // ADMIN PROTECTION
    // =====================================================

    if (
        !isAuthenticated
    ) {
        return null;
    }

    // =====================================================
    // AUTHENTICATED CMS
    // =====================================================

    return (
        <div
            className={`epic-app ${
                sidebarOpen
                    ? "sidebar-open"
                    : "sidebar-closed"
            }`}
        >
            {/* MOBILE OVERLAY */}

            {sidebarOpen && (
                <div
                    className="epic-mobile-overlay"
                    onClick={() =>
                        setSidebarOpen(
                            false
                        )
                    }
                />
            )}

            {/* SIDEBAR */}

            <aside className="epic-sidebar">
                <div className="epic-brand">
                    <div className="epic-logo">
                        EPIC
                    </div>

                    <div className="epic-brand-text">
                        <div className="epic-brand-title">
                            EPIC CHURCH
                        </div>

                        <div className="epic-brand-subtitle">
                            MANAGEMENT SYSTEM
                        </div>
                    </div>
                </div>

                <div className="epic-church-name">
                    <div className="epic-church-icon">
                        ✦
                    </div>

                    <div>
                        <strong>
                            Luke 4:18 Ministries
                        </strong>

                        <span>
                            San Vicente Church
                        </span>
                    </div>
                </div>

                <nav className="epic-navigation">
                    {NAVIGATION_SECTIONS.map(
                        (
                            section,
                            sectionIndex
                        ) => (
                            <React.Fragment
                                key={
                                    section.title ??
                                    `section-${sectionIndex}`
                                }
                            >
                                {section.title && (
                                    <div
                                        className={`epic-nav-section ${
                                            sectionIndex >
                                            0
                                                ? "epic-nav-section-space"
                                                : ""
                                        }`}
                                    >
                                        {
                                            section.title
                                        }
                                    </div>
                                )}

                                {section.items.map(
                                    (
                                        item
                                    ) => {
                                        const active =
                                            isNavigationItemActive(
                                                item.page,
                                                activePage
                                            );

                                        return (
                                            <PermissionFilter
                                                key={
                                                    item.page
                                                }
                                                module={
                                                    item.permission
                                                }
                                                action="view"
                                            >
                                                <button
                                                    type="button"
                                                    className={`epic-nav-item ${
                                                        active
                                                            ? "active"
                                                            : ""
                                                    }`}
                                                    onClick={() => {
                                                        if (
                                                            item.page ===
                                                            "learning"
                                                        ) {
                                                            handleOpenLearning();
                                                        } else {
                                                            navigate(
                                                                item.page
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <span className="epic-nav-icon">
                                                        {
                                                            item.icon
                                                        }
                                                    </span>

                                                    <span>
                                                        {
                                                            item.label
                                                        }
                                                    </span>
                                                </button>
                                            </PermissionFilter>
                                        );
                                    }
                                )}
                            </React.Fragment>
                        )
                    )}
                </nav>

                <div className="epic-sidebar-footer">
                    <div className="epic-user-card">
                        <div className="epic-user-avatar">
                            {
                                avatarLetter
                            }
                        </div>

                        <div className="epic-user-info">
                            <strong>
                                {
                                    fullName
                                }
                            </strong>

                            <span>
                                {
                                    role
                                }
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="epic-logout-button"
                        onClick={
                            handleLogout
                        }
                    >
                        <span>
                            ⇥
                        </span>

                        Logout
                    </button>
                </div>
            </aside>

            {/* MAIN */}

            <main className="epic-main">
                <header className="epic-topbar">
                    <div className="epic-topbar-left">
                        <button
                            type="button"
                            className="epic-menu-button"
                            onClick={() =>
                                setSidebarOpen(
                                    previous =>
                                        !previous
                                )
                            }
                            aria-label="Toggle menu"
                        >
                            ☰
                        </button>

                        <div className="epic-topbar-title">
                            <strong>
                                {
                                    PAGE_TITLES[
                                        activePage
                                    ]
                                }
                            </strong>

                            <span>
                                {
                                    PAGE_SUBTITLES[
                                        activePage
                                    ]
                                }
                            </span>
                        </div>
                    </div>

                    <div className="epic-topbar-right">
                        <div className="epic-date">
                            {new Date().toLocaleDateString(
                                "en-US",
                                {
                                    weekday:
                                        "short",
                                    month:
                                        "short",
                                    day:
                                        "numeric",
                                    year:
                                        "numeric",
                                }
                            )}
                        </div>

                        <div className="epic-top-user">
                            <div className="epic-top-avatar">
                                {
                                    avatarLetter
                                }
                            </div>

                            <div className="epic-top-user-info">
                                <strong>
                                    {
                                        fullName
                                    }
                                </strong>

                                <span>
                                    {
                                        role
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <section className="epic-content">
                    {
                        renderPage()
                    }
                </section>

                <footer className="epic-footer">
                    <span>
                        ©{" "}
                        {new Date().getFullYear()}{" "}
                        EPIC Church Management
                        System
                    </span>

                    <span>
                        Engaging People Into
                        Christ
                    </span>
                </footer>
            </main>
        </div>
    );
};

export default App;