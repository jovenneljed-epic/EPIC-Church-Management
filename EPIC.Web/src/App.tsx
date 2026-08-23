import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import "./App.css";

// =========================================================
// PUBLIC PAGES
// =========================================================

import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/public/AboutPage";
import ContactPage from "./pages/public/ContactPage";

// =========================================================
// MAIN CMS PAGES
// =========================================================

import Login from "./Login";
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
// BUSINESS / SALES
// =========================================================

import SubscriptionDashboard from "./pages/SubscriptionDashboard";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import DemoRequests from "./pages/DemoRequests";
import Reports from "./pages/Reports";
import WebsiteAnalyticsDashboard from "./pages/WebsiteAnalyticsDashboard";

// =========================================================
// REPORT BUILDERS
// =========================================================

import AttendanceReportBuilder from "./pages/reports/AttendanceReportBuilder";
import AttendanceByDateReport from "./pages/reports/AttendanceByDateReport";

// =========================================================
// EPIC LEARNING
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
    dashboard:
        "Church management overview",

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
// AUTHENTICATION KEYS
// =========================================================

const AUTH_KEYS = [
    "token",
    "accessToken",
    "jwt",
    "authToken",
    "epicToken",
] as const;

const USER_KEYS = [
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
// AUTHENTICATION HELPERS
// =========================================================

const getAuthToken = (): string | null => {
    for (const key of AUTH_KEYS) {
        const value = localStorage.getItem(key);

        if (value) {
            return value;
        }
    }

    return null;
};

const isLoggedIn = (): boolean => {
    return Boolean(getAuthToken());
};

const clearAuthentication = (): void => {
    [
        ...AUTH_KEYS,
        ...USER_KEYS,
    ].forEach((key) => {
        localStorage.removeItem(key);
    });
};

// =========================================================
// PATH HELPERS
// =========================================================

const normalizePath = (path: string): string => {
    if (!path) {
        return "/";
    }

    const normalized = path.replace(/\/+$/, "");

    return normalized || "/";
};

// =========================================================
// ROUTE LOOKUP
// =========================================================

const PAGE_BY_ROUTE: Record<string, Page> = Object.entries(
    PAGE_ROUTES
).reduce(
    (result, [page, route]) => {
        result[normalizePath(route)] = page as Page;

        return result;
    },
    {} as Record<string, Page>
);

const getPageFromPath = (path: string): Page => {
    const normalized = normalizePath(path);

    return PAGE_BY_ROUTE[normalized] ?? "dashboard";
};

// =========================================================
// PUBLIC ROUTE CHECK
// =========================================================

const isPublicPath = (path: string): boolean => {
    const normalized = normalizePath(path);

    return (
        normalized === PUBLIC_ROUTES.landing ||
        normalized === PUBLIC_ROUTES.about ||
        normalized === PUBLIC_ROUTES.contact
    );
};

// =========================================================
// SIDEBAR NAVIGATION
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

const NAVIGATION_SECTIONS: NavigationSection[] = [
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
                permission: "Church Services",
            },

            {
                page: "events",
                label: "Event Management",
                icon: "🎯",
                permission: "Event Management",
            },

            {
                page: "reports",
                label: "Reports & Documents",
                icon: "📊",
                permission: "Reports",
            },

            {
                page: "member-attendance-report",
                label: "Member Attendance Report",
                icon: "📊",
                permission: "Attendance",
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
                permission: "Attendance",
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
                permission: "Ministries",
            },

            {
                page: "visitors",
                label: "Visitors",
                icon: "👤",
                permission: "Visitors",
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
                permission: "Expenses",
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
                permission: "EPIC Learning",
            },
        ],
    },

    {
        title: "BUSINESS / SALES",

        items: [
            {
                page: "subscription-dashboard",
                label: "Subscription Dashboard",
                icon: "📈",
                permission: "Subscriptions",
            },

            {
                page: "subscriptions",
                label: "Subscriptions",
                icon: "💳",
                permission: "Subscriptions",
            },

            {
                page: "demo-requests",
                label: "Demo Requests",
                icon: "🎯",
                permission: "Demo Requests",
            },

            {
                page: "website-analytics",
                label: "Website Analytics",
                icon: "📊",
                permission: "Website Analytics",
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
                permission: "Settings",
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
    if (itemPage === "learning") {
        return (
            activePage === "learning" ||
            activePage === "view-course" ||
            activePage === "lesson"
        );
    }

    return itemPage === activePage;
};

// =========================================================
// USER INFORMATION
// =========================================================

interface UserInfo {
    fullName: string;
    role: string;
    normalizedRole: string;
    avatarLetter: string;
    isMember: boolean;
}

// =========================================================
// APP
// =========================================================

const App: React.FC = () => {
    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const [
        isAuthenticated,
        setIsAuthenticated,
    ] = useState<boolean>(() =>
        isLoggedIn()
    );

    // =====================================================
    // ROUTING
    // =====================================================

    const [
        currentPath,
        setCurrentPath,
    ] = useState<string>(() =>
        normalizePath(
            window.location.pathname
        )
    );

    const [
        activePage,
        setActivePage,
    ] = useState<Page>(() =>
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
    ] = useState<boolean>(true);

    // =====================================================
    // LMS
    // =====================================================

    const [
        selectedCourseId,
        setSelectedCourseId,
    ] = useState<number | null>(null);

    const [
        selectedLessonId,
        setSelectedLessonId,
    ] = useState<number | null>(null);

    // =====================================================
    // USER
    // =====================================================

    const userInfo = useMemo<UserInfo>(() => {
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

        const normalizedRole =
            role.trim().toLowerCase();

        const avatarLetter =
            fullName
                .trim()
                .charAt(0)
                .toUpperCase() ||
            "A";

        return {
            fullName,
            role,
            normalizedRole,
            avatarLetter,
            isMember:
                normalizedRole ===
                "member",
        };
    }, [isAuthenticated]);

    const {
        fullName,
        role,
        avatarLetter,
    } = userInfo;

    // =====================================================
    // CURRENT ROUTE FLAGS
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

    const isLoginPage =
        normalizedPath === "/login";

    // =====================================================
    // NAVIGATE TO URL
    // =====================================================

    const navigateToUrl = useCallback(
        (path: string): void => {
            const normalized =
                normalizePath(path);

            const current =
                normalizePath(
                    window.location.pathname
                );

            if (current !== normalized) {
                window.history.pushState(
                    {},
                    "",
                    normalized
                );
            }

            setCurrentPath(
                normalized
            );

            setActivePage(
                getPageFromPath(
                    normalized
                )
            );
        },
        []
    );

    // =====================================================
    // NAVIGATE CMS PAGE
    // =====================================================

    const navigate = useCallback(
        (page: Page): void => {
            navigateToUrl(
                PAGE_ROUTES[page]
            );

            if (
                window.innerWidth <= 900
            ) {
                setSidebarOpen(false);
            }
        },
        [navigateToUrl]
    );

    // =====================================================
    // NAVIGATE PUBLIC PAGE
    // =====================================================

    const navigatePublic = useCallback(
        (
            page: PublicPage
        ): void => {
            navigateToUrl(
                PUBLIC_ROUTES[page]
            );
        },
        [navigateToUrl]
    );

    // =====================================================
    // BROWSER BACK / FORWARD
    // =====================================================

    useEffect(() => {
        const handlePopState =
            (): void => {
                const path =
                    normalizePath(
                        window.location.pathname
                    );

                setCurrentPath(path);

                setActivePage(
                    getPageFromPath(path)
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
    }, []);

    // =====================================================
    // AUTH INITIALIZATION
    // =====================================================

    useEffect(() => {
        const authenticated =
            isLoggedIn();

        setIsAuthenticated(
            authenticated
        );

        if (authenticated) {
            PermissionService.debugPermissions();
        }
    }, []);

    // =====================================================
    // AUTH ROUTE GUARD
    // =====================================================

    useEffect(() => {
        // Public pages are accessible without login.
        if (
            isPublicPath(
                normalizedPath
            )
        ) {
            return;
        }

        // Authenticated users should not stay on login.
        if (
            isLoginPage &&
            isAuthenticated
        ) {
            navigateToUrl(
                "/dashboard"
            );

            return;
        }

        // Guests must login for protected routes.
        if (
            !isAuthenticated &&
            !isLoginPage
        ) {
            navigateToUrl(
                "/login"
            );
        }
    }, [
        isAuthenticated,
        isLoginPage,
        normalizedPath,
        navigateToUrl,
    ]);

    // =====================================================
    // LANDING → LOGIN
    // =====================================================

    const handleLandingLogin =
        useCallback((): void => {
            navigateToUrl(
                "/login"
            );
        }, [
            navigateToUrl,
        ]);

    // =====================================================
    // LANDING → ABOUT
    // =====================================================

 

    // =====================================================
    // PUBLIC PAGE NAVIGATION
    // =====================================================

    const handlePublicNavigate =
        useCallback(
            (
                page: string
            ): void => {
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
                        navigateToUrl(
                            "/login"
                        );
                        break;

                    case "ministries":
                    case "events":
                    case "system":
                    case "learning":
                    case "pricing":
                        navigatePublic(
                            "landing"
                        );
                        break;

                    default:
                        navigatePublic(
                            "landing"
                        );
                        break;
                }
            },
            [
                navigatePublic,
                navigateToUrl,
            ]
        );

    // =====================================================
    // LOGIN SUCCESS
    // =====================================================

    const handleLoginSuccess =
        useCallback((): void => {
            const token =
                getAuthToken();

            if (!token) {
                console.warn(
                    "APP: Login reported success, but no authentication token was found."
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

            window.dispatchEvent(
                new Event(
                    "epic:auth-changed"
                )
            );

            navigateToUrl(
                "/dashboard"
            );

            PermissionService.debugPermissions();
        }, [
            navigateToUrl,
        ]);

    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout =
        useCallback((): void => {
            clearAuthentication();

            setSelectedCourseId(
                null
            );

            setSelectedLessonId(
                null
            );

            setIsAuthenticated(
                false
            );

            window.dispatchEvent(
                new Event(
                    "epic:auth-changed"
                )
            );

            navigateToUrl(
                "/"
            );
        }, [
            navigateToUrl,
        ]);

    // =====================================================
    // OPEN COURSE
    // =====================================================

    const handleViewCourse =
        useCallback(
            (
                courseId: number
            ): void => {
                if (!courseId) {
                    console.warn(
                        "APP: Course ID missing."
                    );

                    return;
                }

                setSelectedCourseId(
                    courseId
                );

                setSelectedLessonId(
                    null
                );

                navigateToUrl(
                    PAGE_ROUTES[
                        "view-course"
                    ]
                );
            },
            [
                navigateToUrl,
            ]
        );

    // =====================================================
    // OPEN LESSON
    // =====================================================

    const handleViewLesson =
        useCallback(
            (
                courseId: number,
                lessonId: number
            ): void => {
                if (!courseId) {
                    console.warn(
                        "APP: Course ID missing."
                    );

                    return;
                }

                if (!lessonId) {
                    console.warn(
                        "APP: Lesson ID missing."
                    );

                    return;
                }

                setSelectedCourseId(
                    courseId
                );

                setSelectedLessonId(
                    lessonId
                );

                navigateToUrl(
                    PAGE_ROUTES.lesson
                );
            },
            [
                navigateToUrl,
            ]
        );

    // =====================================================
    // OPEN LEARNING
    // =====================================================

    const handleOpenLearning =
        useCallback((): void => {
            if (
                !PermissionService.canView(
                    "EPIC Learning"
                )
            ) {
                return;
            }

            setSelectedCourseId(
                null
            );

            setSelectedLessonId(
                null
            );

            navigate(
                "learning"
            );
        }, [
            navigate,
        ]);

    // =====================================================
    // BACK TO COURSE
    // =====================================================

    const handleBackToCourse =
        useCallback((): void => {
            setSelectedLessonId(
                null
            );

            navigateToUrl(
                PAGE_ROUTES[
                    "view-course"
                ]
            );
        }, [
            navigateToUrl,
        ]);

    // =====================================================
    // BACK TO LEARNING
    // =====================================================

    const handleBackToLearning =
        useCallback((): void => {
            setSelectedCourseId(
                null
            );

            setSelectedLessonId(
                null
            );

            navigateToUrl(
                PAGE_ROUTES.learning
            );
        }, [
            navigateToUrl,
        ]);

    // =====================================================
    // LMS CUSTOM EVENTS
    // =====================================================

    useEffect(() => {
        const handleOpenCourse =
            (
                event: Event
            ): void => {
                const customEvent =
                    event as CustomEvent<{
                        courseId?: number;
                    }>;

                const courseId =
                    customEvent.detail
                        ?.courseId;

                if (!courseId) {
                    console.warn(
                        "APP: Course ID missing."
                    );

                    return;
                }

                handleViewCourse(
                    courseId
                );
            };

        const handleOpenLesson =
            (
                event: Event
            ): void => {
                const customEvent =
                    event as CustomEvent<{
                        courseId?: number;
                        lessonId?: number;
                    }>;

                const courseId =
                    customEvent.detail
                        ?.courseId;

                const lessonId =
                    customEvent.detail
                        ?.lessonId;

                if (!courseId) {
                    console.warn(
                        "APP: Course ID missing for lesson."
                    );

                    return;
                }

                if (!lessonId) {
                    console.warn(
                        "APP: Lesson ID missing."
                    );

                    return;
                }

                handleViewLesson(
                    courseId,
                    lessonId
                );
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
    // PERMISSION HELPER
    // =====================================================

    const canView =
        useCallback(
            (
                module: string
            ): boolean => {
                return PermissionService.canView(
                    module
                );
            },
            []
        );

    // =====================================================
    // PROTECTED PAGE WRAPPER
    // =====================================================

    const renderProtectedPage =
        useCallback(
            (
                permission: string,
                component: React.ReactNode
            ): React.ReactNode => {
                if (
                    !canView(
                        permission
                    )
                ) {
                    return (
                        <Dashboard />
                    );
                }

                return component;
            },
            [
                canView,
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
            ): React.ReactNode => {
                return (
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
                );
            },
            [
                handleBackToLearning,
            ]
        );

    // =====================================================
    // PAGE RENDERER
    // =====================================================

    const renderPage =
        useCallback(
            (): React.ReactNode => {
                switch (activePage) {
                    // =========================================
                    // DASHBOARD
                    // =========================================

                    case "dashboard":
                        return (
                            <Dashboard />
                        );

                    // =========================================
                    // REPORTS
                    // =========================================

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

                    // =========================================
                    // ATTENDANCE REPORT
                    // =========================================

                    case "attendance-report":
                        return renderProtectedPage(
                            "Attendance",
                            <AttendanceReportBuilder />
                        );

                    // =========================================
                    // ATTENDANCE BY DATE
                    // =========================================

                    case "attendance-by-date-report":
                        return renderProtectedPage(
                            "Attendance",
                            <AttendanceByDateReport />
                        );

                    // =========================================
                    // DEMO REQUESTS
                    // =========================================

                    case "demo-requests":
                        return renderProtectedPage(
                            "Demo Requests",
                            <DemoRequests />
                        );

                    // =========================================
                    // SUBSCRIPTION DASHBOARD
                    // =========================================

                    case "subscription-dashboard":
                        return renderProtectedPage(
                            "Subscriptions",
                            <SubscriptionDashboard />
                        );

                    // =========================================
                    // SUBSCRIPTIONS
                    // =========================================

                    case "subscriptions":
                        return renderProtectedPage(
                            "Subscriptions",
                            <SubscriptionManagement />
                        );

                    // =========================================
                    // WEBSITE ANALYTICS
                    // =========================================

                    case "website-analytics":
                        return renderProtectedPage(
                            "Website Analytics",
                            <WebsiteAnalyticsDashboard />
                        );

                    // =========================================
                    // CHURCH SERVICES
                    // =========================================

                    case "services":
                        return renderProtectedPage(
                            "Church Services",
                            <ChurchServicesPage />
                        );

                    // =========================================
                    // EVENTS
                    // =========================================

                    case "events":
                        return renderProtectedPage(
                            "Event Management",
                            <EventManagementPage />
                        );

                    // =========================================
                    // MEMBER ATTENDANCE REPORT
                    // =========================================

                    case "member-attendance-report":
                        return renderProtectedPage(
                            "Attendance",
                            <MemberAttendanceReport />
                        );

                    // =========================================
                    // MEMBERS
                    // =========================================

                    case "members":
                        return renderProtectedPage(
                            "Members",
                            <Members />
                        );

                    // =========================================
                    // ATTENDANCE
                    // =========================================

                    case "attendance":
                        return renderProtectedPage(
                            "Attendance",
                            <Attendance />
                        );

                    // =========================================
                    // MINISTRIES
                    // =========================================

                    case "ministries":
                        return renderProtectedPage(
                            "Ministries",
                            <Ministries />
                        );

                    // =========================================
                    // VISITORS
                    // =========================================

                    case "visitors":
                        return renderProtectedPage(
                            "Visitors",
                            <Visitors />
                        );

                    // =========================================
                    // GIVING
                    // =========================================

                    case "giving":
                        return renderProtectedPage(
                            "Giving",
                            <Giving />
                        );

                    // =========================================
                    // INCOME
                    // =========================================

                    case "income":
                        return renderProtectedPage(
                            "Income",
                            <Income />
                        );

                    // =========================================
                    // EXPENSES
                    // =========================================

                    case "expenses":
                        return renderProtectedPage(
                            "Expenses",
                            <Expenses />
                        );

                    // =========================================
                    // EPIC LEARNING
                    // =========================================

                    case "learning":
                        return renderProtectedPage(
                            "EPIC Learning",
                            <LearningPage
                                onViewCourse={
                                    handleViewCourse
                                }
                            />
                        );

                    // =========================================
                    // COURSE
                    // =========================================

                    case "view-course":

                        if (
                            !canView(
                                "EPIC Learning"
                            )
                        ) {
                            return (
                                <Dashboard />
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
                                    lessonId: number
                                ) =>
                                    handleViewLesson(
                                        selectedCourseId,
                                        lessonId
                                    )
                                }
                            />
                        );

                    // =========================================
                    // LESSON
                    // =========================================

                    case "lesson":

                        if (
                            !canView(
                                "EPIC Learning"
                            )
                        ) {
                            return (
                                <Dashboard />
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

                    // =========================================
                    // SETTINGS
                    // =========================================

                    case "settings":
                        return renderProtectedPage(
                            "Settings",
                            <Settings />
                        );

                    // =========================================
                    // FALLBACK
                    // =========================================

                    default:
                        return (
                            <Dashboard />
                        );
                }
            },
            [
                activePage,
                navigate,
                renderProtectedPage,
                selectedCourseId,
                selectedLessonId,
                handleViewCourse,
                handleViewLesson,
                handleBackToCourse,
                handleBackToLearning,
                canView,
                renderLearningEmptyState,
            ]
        );

    // =====================================================
    // PUBLIC LANDING PAGE
    // =====================================================

    if (isLandingPage) {
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
    // PUBLIC ABOUT PAGE
    // =====================================================

    if (isAboutPage) {
        return (
            <AboutPage
                onNavigate={
                    handlePublicNavigate
                }
            />
        );
    }

    // =====================================================
    // PUBLIC CONTACT PAGE
    // =====================================================

    if (isContactPage) {
        return (
            <ContactPage
                onNavigate={
                    handlePublicNavigate
                }
            />
        );
    }

    // =====================================================
    // LOGIN PAGE
    // =====================================================

    if (isLoginPage) {
        if (isAuthenticated) {
            return null;
        }

        return (
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
    // UNAUTHENTICATED FALLBACK
    // =====================================================

    if (!isAuthenticated) {
        return (
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
            {/* =================================================
                MOBILE OVERLAY
            ================================================= */}

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

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="epic-sidebar">

                {/* BRAND */}

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

                {/* CHURCH */}

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

                {/* NAVIGATION */}

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
                                    (item) => {
                                        const isActive =
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
                                                        isActive
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

                {/* SIDEBAR FOOTER */}

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

            {/* =================================================
                MAIN
            ================================================= */}

            <main className="epic-main">

                {/* TOPBAR */}

                <header className="epic-topbar">

                    <div className="epic-topbar-left">

                        <button
                            type="button"
                            className="epic-menu-button"
                            onClick={() =>
                                setSidebarOpen(
                                    (
                                        previous
                                    ) =>
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

                {/* CONTENT */}

                <section className="epic-content">
                    {
                        renderPage()
                    }
                </section>

                {/* FOOTER */}

                <footer className="epic-footer">

                    <span>
                        ©{" "}
                        {
                            new Date().getFullYear()
                        }{" "}
                        EPIC Church Management System
                    </span>

                    <span>
                        Engaging People Into Christ
                    </span>

                </footer>

            </main>
        </div>
    );
};

export default App;