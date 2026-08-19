import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import "./App.css";

// =========================================================
// MAIN PAGES
// =========================================================

import Login from "./Login";
import Dashboard from "./Dashboard";
import Members from "./Members";
import Attendance from "./Attendance";

import ChurchServicesPage from "./pages/ChurchServicesPage";
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
import LandingPage from "./pages/LandingPage";
import DemoRequests from "./pages/DemoRequests";
import Reports from "./pages/Reports";

// =========================================================
// REPORT BUILDERS
// =========================================================

import AttendanceReportBuilder
    from "./pages/reports/AttendanceReportBuilder";
import AttendanceByDateReport
    from "./pages/reports/AttendanceByDateReport";

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
// PAGE TYPE
// =========================================================

type Page =
    | "dashboard"
    | "reports"
    | "attendance-report"
    | "demo-requests"
    | "subscription-dashboard"
    | "subscriptions"
    | "learning"
    | "view-course"
    | "lesson"
    | "members"
    | "attendance"
    | "member-attendance-report"
    | "services"
    | "ministries"
    | "visitors"
    | "giving"
    | "income"
    | "expenses"
    | "settings"
    | "attendance-by-date-report";

// =========================================================
// ROUTE CONFIGURATION
// =========================================================

const PAGE_ROUTES: Record<Page, string> = {

    dashboard:
        "/dashboard",

    reports:
        "/reports",

    "attendance-report":
        "/reports/attendance",

    "attendance-by-date-report":
        "/reports/attendance-date",

    "demo-requests":
        "/demo-requests",

    "subscription-dashboard":
        "/subscription-dashboard",

    subscriptions:
        "/subscriptions",

    learning:
        "/learning",

    "view-course":
        "/learning/course",

    lesson:
        "/learning/lesson",

    members:
        "/members",

    attendance:
        "/attendance",

    "member-attendance-report":
        "/member-attendance-report",

    services:
        "/services",

    ministries:
        "/ministries",

    visitors:
        "/visitors",

    giving:
        "/giving",

    income:
        "/income",

    expenses:
        "/expenses",

    settings:
        "/settings"
};

// =========================================================
// PAGE TITLES
// =========================================================

const PAGE_TITLES: Record<Page, string> = {

    dashboard:
        "Dashboard",

    reports:
        "Reports & Documents",

    "attendance-report":
        "Attendance Summary Report",

    "attendance-by-date-report":
        "Attendance by Date",

    "demo-requests":
        "Demo Requests",

    "subscription-dashboard":
        "Subscription Dashboard",

    subscriptions:
        "Subscription Management",

    services:
        "Church Services",

    "member-attendance-report":
        "Member Attendance Report",

    members:
        "Members Management",

    attendance:
        "Attendance Management",

    ministries:
        "Ministries Management",

    visitors:
        "Visitors Management",

    giving:
        "Giving Management",

    income:
        "Income Management",

    expenses:
        "Expenses Management",

    learning:
        "EPIC Learning",

    "view-course":
        "Course Details",

    lesson:
        "Lesson",

    settings:
        "System Settings"
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

    services:
        "Schedule and manage church services and events",

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
        "Manage system configuration"
};

// =========================================================
// AUTHENTICATION KEYS
// =========================================================

const AUTH_KEYS = [
    "token",
    "accessToken",
    "jwt",
    "authToken",
    "epicToken"
] as const;

const USER_KEYS = [
    "currentUser",
    "currentFullName",
    "currentRole",
    "currentRoleId",
    "roleId",
    "userId",
    "permissions",
    "epicPermissions"
] as const;

// =========================================================
// AUTH HELPERS
// =========================================================

const getAuthToken = (): string | null => {

    for (const key of AUTH_KEYS) {

        const value =
            localStorage.getItem(key);

        if (value) {
            return value;
        }
    }

    return null;
};

const isLoggedIn = (): boolean => {

    return Boolean(
        getAuthToken()
    );
};

const clearAuthentication = (): void => {

    [
        ...AUTH_KEYS,
        ...USER_KEYS
    ].forEach((key) => {

        localStorage.removeItem(key);

    });
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

    const normalized =
        path.replace(/\/+$/, "");

    return normalized || "/";
};

// =========================================================
// PATH → PAGE
// =========================================================

const getPageFromPath = (
    path: string
): Page => {

    const normalized =
        normalizePath(path);

    switch (normalized) {

        case "/dashboard":
            return "dashboard";

        case "/reports":
            return "reports";

      case "/reports/attendance":
    return "attendance-report";

case "/reports/attendance-date":
    return "attendance-by-date-report";

case "/demo-requests":
    return "demo-requests";

        case "/demo-requests":
            return "demo-requests";

        case "/subscription-dashboard":
            return "subscription-dashboard";

        case "/subscriptions":
            return "subscriptions";

        case "/learning":
            return "learning";

        case "/learning/course":
            return "view-course";

        case "/learning/lesson":
            return "lesson";

        case "/members":
            return "members";

        case "/attendance":
            return "attendance";

        case "/member-attendance-report":
            return "member-attendance-report";

        case "/services":
            return "services";

        case "/ministries":
            return "ministries";

        case "/visitors":
            return "visitors";

        case "/giving":
            return "giving";

        case "/income":
            return "income";

        case "/expenses":
            return "expenses";

        case "/settings":
            return "settings";

        default:
            return "dashboard";
    }
};

// =========================================================
// APP
// =========================================================

const App: React.FC = () => {

    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const [
        isAuthenticated,
        setIsAuthenticated
    ] = useState<boolean>(
        isLoggedIn()
    );

    // =====================================================
    // URL
    // =====================================================

    const [
        currentPath,
        setCurrentPath
    ] = useState<string>(
        () =>
            normalizePath(
                window.location.pathname
            )
    );

    // =====================================================
    // PAGE
    // =====================================================

    const [
        activePage,
        setActivePage
    ] = useState<Page>(
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
        setSidebarOpen
    ] = useState<boolean>(true);

    // =====================================================
    // LMS STATE
    // =====================================================

    const [
        selectedCourseId,
        setSelectedCourseId
    ] = useState<number | null>(null);

    const [
        selectedLessonId,
        setSelectedLessonId
    ] = useState<number | null>(null);

    // =====================================================
    // USER INFORMATION
    // =====================================================

    const userInfo = useMemo(() => {

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
                .toUpperCase() || "A";

        return {

            fullName,

            role,

            normalizedRole,

            avatarLetter,

            isMember:
                normalizedRole === "member"
        };

    }, [
        isAuthenticated
    ]);

    const {
        fullName,
        role,
        avatarLetter,
        isMember
    } = userInfo;

    // =====================================================
    // ROUTE INFORMATION
    // =====================================================

    const normalizedPath =
        normalizePath(
            currentPath
        );

    const isLandingPage =
        normalizedPath === "/";

    const isLoginPage =
        normalizedPath === "/login";

    // =====================================================
    // NAVIGATION
    // =====================================================

    const navigateToUrl = useCallback(
        (
            path: string
        ): void => {

            const normalized =
                normalizePath(path);

            if (
                normalizePath(
                    window.location.pathname
                ) !== normalized
            ) {

                window.history.pushState(
                    {},
                    "",
                    normalized
                );
            }

            setCurrentPath(
                normalized
            );

            const page =
                getPageFromPath(
                    normalized
                );

            setActivePage(
                page
            );

        },
        []
    );

    // =====================================================
    // PAGE NAVIGATION
    // =====================================================

    const navigate = useCallback(
        (
            page: Page
        ): void => {

            setActivePage(
                page
            );

            navigateToUrl(
                PAGE_ROUTES[page]
            );

            if (
                window.innerWidth <= 900
            ) {

                setSidebarOpen(
                    false
                );

            }

        },
        [
            navigateToUrl
        ]
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

                setCurrentPath(
                    path
                );

                setActivePage(
                    getPageFromPath(
                        path
                    )
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
    // INITIAL AUTHENTICATION
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
    // AUTHENTICATION ROUTE GUARD
    // =====================================================

    useEffect(() => {

        if (
            isLandingPage
        ) {

            return;

        }

        if (
            isLoginPage &&
            isAuthenticated
        ) {

            navigateToUrl(
                "/dashboard"
            );

            return;

        }

        if (
            !isAuthenticated
        ) {

            if (
                normalizedPath !== "/login"
            ) {

                navigateToUrl(
                    "/login"
                );

            }

            return;

        }

    }, [
        isAuthenticated,
        isLandingPage,
        isLoginPage,
        normalizedPath,
        navigateToUrl
    ]);

    // =====================================================
    // LANDING → LOGIN
    // =====================================================

    const handleLandingLogin =
        useCallback(
            (): void => {

                navigateToUrl(
                    "/login"
                );

            },
            [
                navigateToUrl
            ]
        );

    // =====================================================
    // LOGIN SUCCESS
    // =====================================================

    const handleLoginSuccess =
        useCallback(
            (): void => {

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

                window.dispatchEvent(
                    new Event(
                        "epic:auth-changed"
                    )
                );

                setSelectedCourseId(
                    null
                );

                setSelectedLessonId(
                    null
                );

                setActivePage(
                    "dashboard"
                );

                navigateToUrl(
                    "/dashboard"
                );

                PermissionService.debugPermissions();

            },
            [
                navigateToUrl
            ]
        );

    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout =
        useCallback(
            (): void => {

                clearAuthentication();

                setSelectedCourseId(
                    null
                );

                setSelectedLessonId(
                    null
                );

                setActivePage(
                    "dashboard"
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

            },
            [
                navigateToUrl
            ]
        );

    // =====================================================
    // OPEN COURSE
    // =====================================================

    const handleViewCourse =
        useCallback(
            (
                courseId: number
            ): void => {

                if (!courseId) {
                    return;
                }

                setSelectedCourseId(
                    courseId
                );

                setSelectedLessonId(
                    null
                );

                setActivePage(
                    "view-course"
                );

                navigateToUrl(
                    "/learning/course"
                );

            },
            [
                navigateToUrl
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

                setActivePage(
                    "lesson"
                );

                navigateToUrl(
                    "/learning/lesson"
                );

            },
            [
                navigateToUrl
            ]
        );

    // =====================================================
    // OPEN LEARNING
    // =====================================================

    const handleOpenLearning =
        useCallback(
            (): void => {

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

            },
            [
                isMember,
                navigate
            ]
        );

    // =====================================================
    // BACK TO COURSE
    // =====================================================

    const handleBackToCourse =
        useCallback(
            (): void => {

                setSelectedLessonId(
                    null
                );

                setActivePage(
                    "view-course"
                );

                navigateToUrl(
                    "/learning/course"
                );

            },
            [
                navigateToUrl
            ]
        );

    // =====================================================
    // BACK TO LEARNING
    // =====================================================

    const handleBackToLearning =
        useCallback(
            (): void => {

                setSelectedCourseId(
                    null
                );

                setSelectedLessonId(
                    null
                );

                setActivePage(
                    "learning"
                );

                navigateToUrl(
                    "/learning"
                );

            },
            [
                navigateToUrl
            ]
        );

    // =====================================================
    // EPIC LEARNING CUSTOM EVENTS
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
                    customEvent.detail?.courseId;

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
                    customEvent.detail?.courseId;

                const lessonId =
                    customEvent.detail?.lessonId;

                if (!lessonId) {

                    console.warn(
                        "APP: Lesson ID missing."
                    );

                    return;

                }

                if (!courseId) {

                    console.warn(
                        "APP: Course ID missing for lesson."
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
        handleViewLesson
    ]);

    // =====================================================
    // PERMISSION HELPERS
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

                        if (
                            !canView(
                                "Reports"
                            )
                        ) {

                            return (
                                <Dashboard />
                            );

                        }
return (
    <Reports
        onOpenAttendanceReport={() =>
            navigate("attendance-report")
        }

        onOpenAttendanceByDate={() =>
            navigate("attendance-by-date-report")
        }
    />
);
// =========================================
// ATTENDANCE BY DATE
// =========================================

case "attendance-by-date-report":

    if (
        !canView(
            "Attendance"
        )
    ) {

        return (
            <Dashboard />
        );

    }

    return (
        <AttendanceByDateReport />
    );

                    // =========================================
                    // ATTENDANCE SUMMARY REPORT
                    // =========================================

                    case "attendance-report":

                        if (
                            !canView(
                                "Attendance"
                            )
                        ) {

                            return (
                                <Dashboard />
                            );

                        }

                        return (
                            <AttendanceReportBuilder />
                        );

                    // =========================================
                    // DEMO REQUESTS
                    // =========================================

                    case "demo-requests":

                        if (
                            !canView(
                                "Demo Requests"
                            )
                        ) {

                            return (
                                <Dashboard />
                            );

                        }

                        return (
                            <DemoRequests />
                        );

                    // =========================================
                    // SUBSCRIPTION DASHBOARD
                    // =========================================

                    case "subscription-dashboard":

                        if (
                            !canView(
                                "Subscriptions"
                            )
                        ) {

                            return (
                                <Dashboard />
                            );

                        }

                        return (
                            <SubscriptionDashboard />
                        );

                    // =========================================
                    // SUBSCRIPTIONS
                    // =========================================

                    case "subscriptions":

                        if (
                            !canView(
                                "Subscriptions"
                            )
                        ) {

                            return (
                                <Dashboard />
                            );

                        }

                        return (
                            <SubscriptionManagement />
                        );

                    // =========================================
                    // CHURCH SERVICES
                    // =========================================

                    case "services":

                        if (
                            !canView(
                                "Church Services"
                            )
                        ) {

                            return (
                                <Dashboard />
                            );

                        }

                        return (
                            <ChurchServicesPage />
                        );

                    // =========================================
                    // MEMBER ATTENDANCE REPORT
                    // =========================================

                    case "member-attendance-report":

                        if (
                            !canView(
                                "Attendance"
                            )
                        ) {

                            return (
                                <Dashboard />
                            );

                        }

                        return (
                            <MemberAttendanceReport />
                        );

                    // =========================================
                    // MEMBERS
                    // =========================================

                    case "members":

                        if (
                            !canView(
                                "Members"
                            )
                        ) {

                            return (
                                <Dashboard />
                            );

                        }

                        return (
                            <Members />
                        );

                    // =========================================
                    // ATTENDANCE
                    // =========================================

                    case "attendance":

                        if (
                            !canView(
                                "Attendance"
                            )
                        ) {

                            return (
                                <Dashboard />
                            );

                        }

                        return (
                            <Attendance />
                        );

                    // =========================================
                    // MINISTRIES
                    // =========================================

                    case "ministries":

                        if (
                            !canView(
                                "Ministries"
                            )
                        ) {

                            return (
                                <Dashboard />
                            );

                        }

                        return (
                            <Ministries />
                        );

                    // =========================================
                    // VISITORS
                    // =========================================

                    case "visitors":

                        if (
                            !canView(
                                "Visitors"
                            )
                        ) {

                            return (
                                <Dashboard />
                            );

                        }

                        return (
                            <Visitors />
                        );

                    // =========================================
                    // GIVING
                    // =========================================

                    case "giving":

                        if (
                            !canView(
                                "Giving"
                            )
                        ) {

                            return (
                                <Dashboard />
                            );

                        }

                        return (
                            <Giving />
                        );

                    // =========================================
                    // INCOME
                    // =========================================

                    case "income":

                        if (
                            !canView(
                                "Income"
                            )
                        ) {

                            return (
                                <Dashboard />
                            );

                        }

                        return (
                            <Income />
                        );

                    // =========================================
                    // EXPENSES
                    // =========================================

                    case "expenses":

                        if (
                            !canView(
                                "Expenses"
                            )
                        ) {

                            return (
                                <Dashboard />
                            );

                        }

                        return (
                            <Expenses />
                        );

                    // =========================================
                    // EPIC LEARNING
                    // =========================================

                    case "learning":

                        if (
                            !canView(
                                "EPIC Learning"
                            )
                        ) {

                            return (
                                <Dashboard />
                            );

                        }

                        return (
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

                            return (
                                <div className="epic-empty-state">

                                    <h2>
                                        Course Not Selected
                                    </h2>

                                    <p>
                                        Please select a course
                                        from EPIC Learning.
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
                        }

                        return (
                            <ViewCourse
                                courseId={
                                    selectedCourseId
                                }
                                onBack={
                                    handleBackToLearning
                                }
                                onLessonSelect={
                                    (
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

                            return (
                                <div className="epic-empty-state">

                                    <h2>
                                        Lesson Not Selected
                                    </h2>

                                    <p>
                                        Please select a lesson
                                        from the course.
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

                        if (
                            !canView(
                                "Settings"
                            )
                        ) {

                            return (
                                <Dashboard />
                            );

                        }

                        return (
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
                canView,
                selectedCourseId,
                selectedLessonId,
                handleViewCourse,
                handleViewLesson,
                handleBackToCourse,
                handleBackToLearning
            ]
        );

    // =========================================================
    // PUBLIC LANDING PAGE
    // =========================================================

    if (isLandingPage) {

        return (
            <LandingPage
                onLogin={
                    handleLandingLogin
                }
            />
        );
    }

    // =========================================================
    // LOGIN PAGE
    // =========================================================

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

    // =========================================================
    // UNAUTHENTICATED
    // =========================================================

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

    // =========================================================
    // AUTHENTICATED CMS
    // =========================================================

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

                {/* =================================================
                    BRAND
                ================================================= */}

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

                {/* =================================================
                    CHURCH
                ================================================= */}

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

                {/* =================================================
                    NAVIGATION
                ================================================= */}

                <nav className="epic-navigation">

                    <div className="epic-nav-section">
                        MAIN MENU
                    </div>

                    {/* =================================================
                        DASHBOARD
                    ================================================= */}

                    <PermissionFilter
                        module="Dashboard"
                        action="view"
                    >

                        <button
                            type="button"
                            className={`epic-nav-item ${
                                activePage ===
                                "dashboard"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                navigate(
                                    "dashboard"
                                )
                            }
                        >

                            <span className="epic-nav-icon">
                                ▦
                            </span>

                            <span>
                                Dashboard
                            </span>

                        </button>

                    </PermissionFilter>

                    {/* =================================================
                        CHURCH SERVICES
                    ================================================= */}

                    <PermissionFilter
                        module="Church Services"
                        action="view"
                    >

                        <button
                            type="button"
                            className={`epic-nav-item ${
                                activePage ===
                                "services"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                navigate(
                                    "services"
                                )
                            }
                        >

                            <span className="epic-nav-icon">
                                ⛪
                            </span>

                            <span>
                                Church Services
                            </span>

                        </button>

                    </PermissionFilter>

                    {/* =================================================
                        REPORTS
                    ================================================= */}

                    <PermissionFilter
                        module="Reports"
                        action="view"
                    >

                        <button
                            type="button"
                            className={`epic-nav-item ${
                                activePage ===
                                "reports"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                navigate(
                                    "reports"
                                )
                            }
                        >

                            <span className="epic-nav-icon">
                                📊
                            </span>

                            <span>
                                Reports & Documents
                            </span>

                        </button>

                    </PermissionFilter>

                    {/* =================================================
                        ATTENDANCE REPORT
                    ================================================= */}

                    <PermissionFilter
                        module="Attendance"
                        action="view"
                    >

                        <button
                            type="button"
                            className={`epic-nav-item ${
                                activePage ===
                                "member-attendance-report"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                navigate(
                                    "member-attendance-report"
                                )
                            }
                        >

                            <span className="epic-nav-icon">
                                📊
                            </span>

                            <span>
                                Member Attendance Report
                            </span>

                        </button>

                    </PermissionFilter>

                    {/* =================================================
                        MEMBERS
                    ================================================= */}

                    <PermissionFilter
                        module="Members"
                        action="view"
                    >

                        <button
                            type="button"
                            className={`epic-nav-item ${
                                activePage ===
                                "members"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                navigate(
                                    "members"
                                )
                            }
                        >

                            <span className="epic-nav-icon">
                                ♟
                            </span>

                            <span>
                                Members
                            </span>

                        </button>

                    </PermissionFilter>

                    {/* =================================================
                        ATTENDANCE
                    ================================================= */}

                    <PermissionFilter
                        module="Attendance"
                        action="view"
                    >

                        <button
                            type="button"
                            className={`epic-nav-item ${
                                activePage ===
                                "attendance"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                navigate(
                                    "attendance"
                                )
                            }
                        >

                            <span className="epic-nav-icon">
                                ✓
                            </span>

                            <span>
                                Attendance
                            </span>

                        </button>

                    </PermissionFilter>

                    {/* =================================================
                        MANAGEMENT
                    ================================================= */}

                    <div className="epic-nav-section epic-nav-section-space">
                        MANAGEMENT
                    </div>

                    {/* =================================================
                        MINISTRIES
                    ================================================= */}

                    <PermissionFilter
                        module="Ministries"
                        action="view"
                    >

                        <button
                            type="button"
                            className={`epic-nav-item ${
                                activePage ===
                                "ministries"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                navigate(
                                    "ministries"
                                )
                            }
                        >

                            <span className="epic-nav-icon">
                                ♫
                            </span>

                            <span>
                                Ministries
                            </span>

                        </button>

                    </PermissionFilter>

                    {/* =================================================
                        VISITORS
                    ================================================= */}

                    <PermissionFilter
                        module="Visitors"
                        action="view"
                    >

                        <button
                            type="button"
                            className={`epic-nav-item ${
                                activePage ===
                                "visitors"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                navigate(
                                    "visitors"
                                )
                            }
                        >

                            <span className="epic-nav-icon">
                                👤
                            </span>

                            <span>
                                Visitors
                            </span>

                        </button>

                    </PermissionFilter>

                    {/* =================================================
                        GIVING
                    ================================================= */}

                    <PermissionFilter
                        module="Giving"
                        action="view"
                    >

                        <button
                            type="button"
                            className={`epic-nav-item ${
                                activePage ===
                                "giving"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                navigate(
                                    "giving"
                                )
                            }
                        >

                            <span className="epic-nav-icon">
                                ₱
                            </span>

                            <span>
                                Giving
                            </span>

                        </button>

                    </PermissionFilter>

                    {/* =================================================
                        INCOME
                    ================================================= */}

                    <PermissionFilter
                        module="Income"
                        action="view"
                    >

                        <button
                            type="button"
                            className={`epic-nav-item ${
                                activePage ===
                                "income"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                navigate(
                                    "income"
                                )
                            }
                        >

                            <span className="epic-nav-icon">
                                ↗
                            </span>

                            <span>
                                Income
                            </span>

                        </button>

                    </PermissionFilter>

                    {/* =================================================
                        EXPENSES
                    ================================================= */}

                    <PermissionFilter
                        module="Expenses"
                        action="view"
                    >

                        <button
                            type="button"
                            className={`epic-nav-item ${
                                activePage ===
                                "expenses"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                navigate(
                                    "expenses"
                                )
                            }
                        >

                            <span className="epic-nav-icon">
                                −
                            </span>

                            <span>
                                Expenses
                            </span>

                        </button>

                    </PermissionFilter>

                    {/* =================================================
                        EPIC LEARNING
                    ================================================= */}

                    <div className="epic-nav-section epic-nav-section-space">
                        EPIC LEARNING
                    </div>

                    <PermissionFilter
                        module="EPIC Learning"
                        action="view"
                    >

                        <button
                            type="button"
                            className={`epic-nav-item ${
                                activePage ===
                                    "learning" ||
                                activePage ===
                                    "view-course" ||
                                activePage ===
                                    "lesson"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={
                                handleOpenLearning
                            }
                        >

                            <span className="epic-nav-icon">
                                📚
                            </span>

                            <span>
                                EPIC Learning
                            </span>

                        </button>

                    </PermissionFilter>

                    {/* =================================================
                        BUSINESS / SALES
                    ================================================= */}

                    <div className="epic-nav-section epic-nav-section-space">
                        BUSINESS / SALES
                    </div>

                    {/* =================================================
                        SUBSCRIPTION DASHBOARD
                    ================================================= */}

                    <PermissionFilter
                        module="Subscriptions"
                        action="view"
                    >

                        <button
                            type="button"
                            className={`epic-nav-item ${
                                activePage ===
                                "subscription-dashboard"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                navigate(
                                    "subscription-dashboard"
                                )
                            }
                        >

                            <span className="epic-nav-icon">
                                📈
                            </span>

                            <span>
                                Subscription Dashboard
                            </span>

                        </button>

                    </PermissionFilter>

                    {/* =================================================
                        SUBSCRIPTIONS
                    ================================================= */}

                    <PermissionFilter
                        module="Subscriptions"
                        action="view"
                    >

                        <button
                            type="button"
                            className={`epic-nav-item ${
                                activePage ===
                                "subscriptions"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                navigate(
                                    "subscriptions"
                                )
                            }
                        >

                            <span className="epic-nav-icon">
                                💳
                            </span>

                            <span>
                                Subscriptions
                            </span>

                        </button>

                    </PermissionFilter>

                    {/* =================================================
                        DEMO REQUESTS
                    ================================================= */}

                    <PermissionFilter
                        module="Demo Requests"
                        action="view"
                    >

                        <button
                            type="button"
                            className={`epic-nav-item ${
                                activePage ===
                                "demo-requests"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                navigate(
                                    "demo-requests"
                                )
                            }
                        >

                            <span className="epic-nav-icon">
                                🎯
                            </span>

                            <span>
                                Demo Requests
                            </span>

                        </button>

                    </PermissionFilter>

                    {/* =================================================
                        SYSTEM
                    ================================================= */}

                    <div className="epic-nav-section epic-nav-section-space">
                        SYSTEM
                    </div>

                    {/* =================================================
                        SETTINGS
                    ================================================= */}

                    <PermissionFilter
                        module="Settings"
                        action="view"
                    >

                        <button
                            type="button"
                            className={`epic-nav-item ${
                                activePage ===
                                "settings"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                navigate(
                                    "settings"
                                )
                            }
                        >

                            <span className="epic-nav-icon">
                                ⚙
                            </span>

                            <span>
                                Settings
                            </span>

                        </button>

                    </PermissionFilter>

                </nav>

                {/* =================================================
                    SIDEBAR FOOTER
                ================================================= */}

                <div className="epic-sidebar-footer">

                    <div className="epic-user-card">

                        <div className="epic-user-avatar">
                            {avatarLetter}
                        </div>

                        <div className="epic-user-info">

                            <strong>
                                {fullName}
                            </strong>

                            <span>
                                {role}
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

                {/* =================================================
                    TOPBAR
                ================================================= */}

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
                                        "numeric"
                                }
                            )}

                        </div>

                        <div className="epic-top-user">

                            <div className="epic-top-avatar">
                                {avatarLetter}
                            </div>

                            <div className="epic-top-user-info">

                                <strong>
                                    {fullName}
                                </strong>

                                <span>
                                    {role}
                                </span>

                            </div>

                        </div>

                    </div>

                </header>

                {/* =================================================
                    CONTENT
                ================================================= */}

                <section className="epic-content">

                    {renderPage()}

                </section>

                {/* =================================================
                    FOOTER
                ================================================= */}

                <footer className="epic-footer">

                    <span>
                        ©{" "}
                        {new Date().getFullYear()}{" "}
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