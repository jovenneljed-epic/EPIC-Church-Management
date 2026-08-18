
import React, { useEffect, useState } from "react";
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

import LandingPage from "./pages/LandingPage";
import DemoRequests from "./pages/DemoRequests";

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
    | "demo-requests"
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
    | "settings";

// =========================================================
// AUTH HELPERS
// =========================================================

const AUTH_KEYS = [
    "token",
    "accessToken",
    "jwt",
    "authToken",
    "epicToken"
];

const USER_KEYS = [
    "currentUser",
    "currentFullName",
    "currentRole",
    "currentRoleId",
    "roleId",
    "userId",
    "permissions",
    "epicPermissions"
];

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

// =========================================================
// NORMALIZE PATH
// =========================================================

const normalizePath = (path: string): string => {

    if (!path) {
        return "/";
    }

    const normalized =
        path.replace(/\/+$/, "");

    return normalized || "/";
};

// =========================================================
// APP
// =========================================================

const App: React.FC = () => {

    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const [isAuthenticated, setIsAuthenticated] =
        useState<boolean>(() => isLoggedIn());

    // =====================================================
    // URL
    // =====================================================

    const [currentPath, setCurrentPath] =
        useState<string>(() =>
            normalizePath(window.location.pathname)
        );

    // =====================================================
    // NAVIGATION
    // =====================================================

    const [activePage, setActivePage] =
        useState<Page>("dashboard");

    const [sidebarOpen, setSidebarOpen] =
        useState<boolean>(true);

    // =====================================================
    // EPIC LEARNING
    // =====================================================

    const [selectedCourseId, setSelectedCourseId] =
        useState<number | null>(null);

    const [selectedLessonId, setSelectedLessonId] =
        useState<number | null>(null);

    // =====================================================
    // USER INFORMATION
    // =====================================================

    const fullName =
        localStorage.getItem("currentFullName") ||
        localStorage.getItem("currentUser") ||
        "Administrator";

    const role =
        localStorage.getItem("currentRole") ||
        "Church Admin";

    const normalizedRole =
        role.trim().toLowerCase();

    const avatarLetter =
        fullName.charAt(0).toUpperCase();

    // =====================================================
    // ROLE HELPERS
    // =====================================================

    const isMember =
        normalizedRole === "member";

    // =====================================================
    // ROUTE FLAGS
    // =====================================================

    const normalizedPath =
        normalizePath(currentPath);

    const isLandingPage =
        normalizedPath === "/";

    const isLoginPage =
        normalizedPath === "/login";

    const isDashboardPath =
        normalizedPath === "/dashboard";

    // =====================================================
    // NAVIGATE URL
    // =====================================================

    const navigateToUrl = (path: string) => {

        const normalized =
            normalizePath(path);

        if (
            normalizePath(window.location.pathname) !==
            normalized
        ) {

            window.history.pushState(
                {},
                "",
                normalized
            );
        }

        setCurrentPath(normalized);
    };

    // =====================================================
    // BROWSER BACK / FORWARD
    // =====================================================

    useEffect(() => {

        const handlePopState = () => {

            setCurrentPath(
                normalizePath(
                    window.location.pathname
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
    // AUTHENTICATION CHECK
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
    // LANDING → LOGIN
    // =====================================================

    const handleLandingLogin = () => {

        navigateToUrl("/login");

    };

    // =====================================================
    // LOGIN SUCCESS
    // =====================================================

    const handleLoginSuccess = () => {

        const token =
            getAuthToken();

        if (!token) {

            console.warn(
                "APP: Login reported success, but no authentication token was found."
            );

            return;
        }

        setIsAuthenticated(true);

        setSelectedCourseId(null);
        setSelectedLessonId(null);

        setActivePage("dashboard");

        navigateToUrl("/dashboard");

        PermissionService.debugPermissions();

    };

    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = () => {

        AUTH_KEYS
            .concat(USER_KEYS)
            .forEach((key) => {

                localStorage.removeItem(key);

            });

        setSelectedCourseId(null);
        setSelectedLessonId(null);

        setActivePage("dashboard");

        setIsAuthenticated(false);

        navigateToUrl("/");

    };

    // =====================================================
    // PROTECT DASHBOARD
    // =====================================================

    useEffect(() => {

        if (
            isDashboardPath &&
            !isAuthenticated
        ) {

            navigateToUrl("/login");

        }

    }, [
        isDashboardPath,
        isAuthenticated
    ]);

    // =====================================================
    // LOGIN ROUTE FOR AUTHENTICATED USER
    // =====================================================

    useEffect(() => {

        if (
            isLoginPage &&
            isAuthenticated
        ) {

            navigateToUrl("/dashboard");

        }

    }, [
        isLoginPage,
        isAuthenticated
    ]);

    // =====================================================
    // GLOBAL COURSE / LESSON EVENTS
    // =====================================================

    useEffect(() => {

        const handleOpenCourse = (
            event: Event
        ) => {

            const customEvent =
                event as CustomEvent<{
                    courseId: number;
                }>;

            const courseId =
                customEvent.detail?.courseId;

            if (!courseId) {

                console.warn(
                    "APP: Course ID missing."
                );

                return;
            }

            setSelectedCourseId(courseId);
            setSelectedLessonId(null);
            setActivePage("view-course");

        };

        const handleOpenLesson = (
            event: Event
        ) => {

            const customEvent =
                event as CustomEvent<{
                    courseId?: number;
                    lessonId: number;
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

            if (courseId) {

                setSelectedCourseId(
                    courseId
                );

            }

            setSelectedLessonId(
                lessonId
            );

            setActivePage(
                "lesson"
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

    }, []);

    // =====================================================
    // GENERIC NAVIGATION
    // =====================================================

    const navigate = (page: Page) => {

        setActivePage(page);

        if (window.innerWidth <= 900) {

            setSidebarOpen(false);

        }

    };

    // =====================================================
    // OPEN LEARNING
    // =====================================================

    const handleOpenLearning = () => {

        if (isMember) {

            return;

        }

        setSelectedCourseId(null);
        setSelectedLessonId(null);

        setActivePage(
            "learning"
        );

        if (
            window.innerWidth <= 900
        ) {

            setSidebarOpen(false);

        }

    };

    // =====================================================
    // OPEN COURSE
    // =====================================================

    const handleViewCourse = (
        courseId: number
    ) => {

        setSelectedCourseId(
            courseId
        );

        setSelectedLessonId(
            null
        );

        setActivePage(
            "view-course"
        );

    };

    // =====================================================
    // OPEN LESSON
    // =====================================================

    const handleViewLesson = (
        courseId: number,
        lessonId: number
    ) => {

        setSelectedCourseId(
            courseId
        );

        setSelectedLessonId(
            lessonId
        );

        setActivePage(
            "lesson"
        );

    };

    // =====================================================
    // BACK TO COURSE
    // =====================================================

    const handleBackToCourse = () => {

        setSelectedLessonId(
            null
        );

        setActivePage(
            "view-course"
        );

    };

    // =====================================================
    // BACK TO LEARNING
    // =====================================================

    const handleBackToLearning = () => {

        setSelectedCourseId(
            null
        );

        setSelectedLessonId(
            null
        );

        setActivePage(
            "learning"
        );

    };

    // =====================================================
    // PAGE TITLES
    // =====================================================

    const pageTitles: Record<Page, string> = {

        dashboard:
            "Dashboard",

        "demo-requests":
            "Demo Requests",

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

    // =====================================================
    // PAGE SUBTITLES
    // =====================================================

    const pageSubtitles: Record<Page, string> = {

        dashboard:
            "Church management overview",

        "demo-requests":
            "Manage churches requesting an EPIC system demonstration",

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

    // =====================================================
    // RENDER PAGE
    // =====================================================

    const renderPage = () => {

        switch (activePage) {

            case "dashboard":

                return (
                    <Dashboard />
                );

            case "demo-requests":

                /*
                 * Extra protection:
                 *
                 * A MEMBER should never be able to open
                 * Demo Requests even if activePage is changed
                 * accidentally from another component.
                 */

                if (isMember) {

                    return (
                        <Dashboard />
                    );

                }

                if (
                    !PermissionService.canView(
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

            case "services":

                return (
                    <ChurchServicesPage />
                );

            case "member-attendance-report":

                return (
                    <MemberAttendanceReport />
                );

            case "members":

                return (
                    <Members />
                );

            case "attendance":

                return (
                    <Attendance />
                );

            case "ministries":

                return (
                    <Ministries />
                );

            case "visitors":

                return (
                    <Visitors />
                );

            case "giving":

                return (
                    <Giving />
                );

            case "income":

                return (
                    <Income />
                );

            case "expenses":

                return (
                    <Expenses />
                );

            case "learning":

                if (isMember) {

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

            case "view-course":

                if (isMember) {

                    return (
                        <Dashboard />
                    );

                }

                if (!selectedCourseId) {

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
                            (lessonId: number) =>
                                handleViewLesson(
                                    selectedCourseId,
                                    lessonId
                                )
                        }
                    />
                );

            case "lesson":

                if (isMember) {

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

            case "settings":

                return (
                    <Settings />
                );

            default:

                return (
                    <Dashboard />
                );

        }

    };

    // =====================================================
    // PUBLIC LANDING PAGE
    // =====================================================

    if (isLandingPage) {

        return (
            <LandingPage
                onLogin={
                    handleLandingLogin
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
    // UNAUTHENTICATED USER
    // =====================================================

    if (!isAuthenticated) {

        if (
            normalizedPath !== "/"
        ) {

            return (
                <Login
                    onLoginSuccess={
                        handleLoginSuccess
                    }
                />
            );

        }

        return (
            <LandingPage
                onLogin={
                    handleLandingLogin
                }
            />
        );

    }

    // =====================================================
    // AUTHENTICATED CMS
    // =====================================================

    return (

        <div
            className={
                `epic-app ${
                    sidebarOpen
                        ? "sidebar-open"
                        : "sidebar-closed"
                }`
            }
        >

            {/* =================================================
                MOBILE OVERLAY
            ================================================= */}

            {sidebarOpen && (

                <div
                    className="epic-mobile-overlay"
                    onClick={() =>
                        setSidebarOpen(false)
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
                            className={
                                `epic-nav-item ${
                                    activePage ===
                                    "dashboard"
                                        ? "active"
                                        : ""
                                }`
                            }
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
                            className={
                                `epic-nav-item ${
                                    activePage ===
                                    "services"
                                        ? "active"
                                        : ""
                                }`
                            }
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
                        ATTENDANCE REPORT
                    ================================================= */}

                    <PermissionFilter
                        module="Attendance"
                        action="view"
                    >

                        <button
                            type="button"
                            className={
                                `epic-nav-item ${
                                    activePage ===
                                    "member-attendance-report"
                                        ? "active"
                                        : ""
                                }`
                            }
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
                            className={
                                `epic-nav-item ${
                                    activePage ===
                                    "members"
                                        ? "active"
                                        : ""
                                }`
                            }
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
                            className={
                                `epic-nav-item ${
                                    activePage ===
                                    "attendance"
                                        ? "active"
                                        : ""
                                }`
                            }
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
                            className={
                                `epic-nav-item ${
                                    activePage ===
                                    "ministries"
                                        ? "active"
                                        : ""
                                }`
                            }
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
                            className={
                                `epic-nav-item ${
                                    activePage ===
                                    "visitors"
                                        ? "active"
                                        : ""
                                }`
                            }
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
                            className={
                                `epic-nav-item ${
                                    activePage ===
                                    "giving"
                                        ? "active"
                                        : ""
                                }`
                            }
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
                            className={
                                `epic-nav-item ${
                                    activePage ===
                                    "income"
                                        ? "active"
                                        : ""
                                }`
                            }
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
                            className={
                                `epic-nav-item ${
                                    activePage ===
                                    "expenses"
                                        ? "active"
                                        : ""
                                }`
                            }
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

                    {!isMember && (

                        <>

                            <div className="epic-nav-section epic-nav-section-space">
                                EPIC LEARNING
                            </div>

                            <PermissionFilter
                                module="EPIC Learning"
                                action="view"
                            >

                                <button
                                    type="button"
                                    className={
                                        `epic-nav-item ${
                                            activePage ===
                                                "learning" ||
                                            activePage ===
                                                "view-course" ||
                                            activePage ===
                                                "lesson"
                                                ? "active"
                                                : ""
                                        }`
                                    }
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

                        </>

                    )}

                    {/* =================================================
                        BUSINESS / SALES
                    ================================================= */}

                    <PermissionFilter
                        module="Demo Requests"
                        action="view"
                    >

                        <>

                            <div className="epic-nav-section epic-nav-section-space">
                                BUSINESS / SALES
                            </div>

                            <button
                                type="button"
                                className={
                                    `epic-nav-item ${
                                        activePage ===
                                        "demo-requests"
                                            ? "active"
                                            : ""
                                    }`
                                }
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

                        </>

                    </PermissionFilter>

                    {/* =================================================
                        SYSTEM
                    ================================================= */}

                    <div className="epic-nav-section epic-nav-section-space">
                        SYSTEM
                    </div>

                    <PermissionFilter
                        module="Church Settings"
                        action="view"
                    >

                        <button
                            type="button"
                            className={
                                `epic-nav-item ${
                                    activePage ===
                                    "settings"
                                        ? "active"
                                        : ""
                                }`
                            }
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
                                    pageTitles[
                                        activePage
                                    ]
                                }
                            </strong>

                            <span>
                                {
                                    pageSubtitles[
                                        activePage
                                    ]
                                }
                            </span>

                        </div>

                    </div>

                    <div className="epic-topbar-right">

                        <div className="epic-date">

                            {
                                new Date().toLocaleDateString(
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
                                )
                            }

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
                        {
                            new Date()
                                .getFullYear()
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

