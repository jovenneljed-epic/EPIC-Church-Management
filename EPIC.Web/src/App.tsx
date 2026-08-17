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
// APP
// =========================================================

const App: React.FC = () => {

    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const [isAuthenticated, setIsAuthenticated] =
        useState<boolean>(false);

    // =====================================================
    // NAVIGATION
    // =====================================================

    const [activePage, setActivePage] =
        useState<Page>("dashboard");

    const [sidebarOpen, setSidebarOpen] =
        useState<boolean>(true);

    // =====================================================
    // EPIC LEARNING STATE
    // =====================================================

    const [selectedCourseId, setSelectedCourseId] =
        useState<number | null>(null);

    const [selectedLessonId, setSelectedLessonId] =
        useState<number | null>(null);

    // =====================================================
    // AUTH CHECK
    // =====================================================

    useEffect(() => {

        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("epicToken");

        setIsAuthenticated(Boolean(token));

        if (token) {
            PermissionService.debugPermissions();
        }

    }, []);

    // =====================================================
    // GLOBAL COURSE / LESSON EVENTS
    // =====================================================

    useEffect(() => {

        // -------------------------------------------------
        // OPEN COURSE EVENT
        // -------------------------------------------------

        const handleOpenCourse = (event: Event) => {

            const customEvent =
                event as CustomEvent<{
                    courseId: number;
                }>;

            const courseId =
                customEvent.detail?.courseId;

            console.log(
                "APP: Opening course:",
                courseId
            );

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

        // -------------------------------------------------
        // OPEN LESSON EVENT
        // -------------------------------------------------

        const handleOpenLesson = (event: Event) => {

            const customEvent =
                event as CustomEvent<{
                    courseId?: number;
                    lessonId: number;
                }>;

            const courseId =
                customEvent.detail?.courseId;

            const lessonId =
                customEvent.detail?.lessonId;

            console.log(
                "APP: Opening lesson:",
                {
                    courseId,
                    lessonId
                }
            );

            if (!lessonId) {
                console.warn(
                    "APP: Lesson ID missing."
                );
                return;
            }

            if (courseId) {
                setSelectedCourseId(courseId);
            }

            setSelectedLessonId(lessonId);
            setActivePage("lesson");

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
    // LOGOUT
    // =====================================================

    const handleLogout = () => {

        const authKeys = [
            "token",
            "accessToken",
            "jwt",
            "authToken",
            "epicToken"
        ];

        const userKeys = [
            "currentUser",
            "currentFullName",
            "currentRole",
            "currentRoleId",
            "roleId",
            "userId",
            "permissions"
        ];

        [
            ...authKeys,
            ...userKeys
        ].forEach(key => {
            localStorage.removeItem(key);
        });

        setSelectedCourseId(null);
        setSelectedLessonId(null);

        setActivePage("dashboard");
        setIsAuthenticated(false);

    };

    // =====================================================
    // GENERIC NAVIGATION
    // =====================================================

    const navigate = (page: Page) => {

        console.log(
            "APP: Navigate:",
            page
        );

        setActivePage(page);

        if (window.innerWidth <= 900) {
            setSidebarOpen(false);
        }

    };

    // =====================================================
    // OPEN LEARNING HOME
    // =====================================================

    const handleOpenLearning = () => {

        console.log(
            "APP: Opening EPIC Learning home"
        );

        setSelectedCourseId(null);
        setSelectedLessonId(null);

        setActivePage("learning");

        if (window.innerWidth <= 900) {
            setSidebarOpen(false);
        }

    };

    // =====================================================
    // OPEN COURSE
    // =====================================================

    const handleViewCourse = (
        courseId: number
    ) => {

        console.log(
            "APP: Opening course:",
            courseId
        );

        setSelectedCourseId(courseId);
        setSelectedLessonId(null);
        setActivePage("view-course");

    };

    // =====================================================
    // OPEN LESSON
    // =====================================================

    const handleViewLesson = (
        courseId: number,
        lessonId: number
    ) => {

        console.log(
            "APP: Opening lesson:",
            {
                courseId,
                lessonId
            }
        );

        setSelectedCourseId(courseId);
        setSelectedLessonId(lessonId);
        setActivePage("lesson");

    };

    // =====================================================
    // BACK TO COURSE
    // =====================================================

    const handleBackToCourse = () => {

        setSelectedLessonId(null);
        setActivePage("view-course");

    };

    // =====================================================
    // BACK TO LEARNING
    // =====================================================

    const handleBackToLearning = () => {

        setSelectedCourseId(null);
        setSelectedLessonId(null);
        setActivePage("learning");

    };

    // =====================================================
    // PAGE TITLE
    // =====================================================

    const getPageTitle = (): string => {

        const titles: Record<Page, string> = {

            dashboard:
                "Dashboard",

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

        return titles[activePage];

    };

    // =====================================================
    // PAGE SUBTITLE
    // =====================================================

    const getPageSubtitle = (): string => {

        const subtitles: Record<Page, string> = {

            dashboard:
                "Church management overview",

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

        return subtitles[activePage];

    };

    // =====================================================
    // PAGE CONTENT
    // =====================================================

    const renderPage = () => {

        switch (activePage) {

            // =================================================
            // DASHBOARD
            // =================================================

            case "dashboard":
                return <Dashboard />;

            // =================================================
            // CHURCH SERVICES
            // =================================================

            case "services":
                return <ChurchServicesPage />;

            // =================================================
            // MEMBER ATTENDANCE REPORT
            // =================================================

            case "member-attendance-report":
                return <MemberAttendanceReport />;

            // =================================================
            // MEMBERS
            // =================================================

            case "members":
                return <Members />;

            // =================================================
            // ATTENDANCE
            // =================================================

            case "attendance":
                return <Attendance />;

            // =================================================
            // MINISTRIES
            // =================================================

            case "ministries":
                return <Ministries />;

            // =================================================
            // VISITORS
            // =================================================

            case "visitors":
                return <Visitors />;

            // =================================================
            // GIVING
            // =================================================

            case "giving":
                return <Giving />;

            // =================================================
            // INCOME
            // =================================================

            case "income":
                return <Income />;

            // =================================================
            // EXPENSES
            // =================================================

            case "expenses":
                return <Expenses />;

            // =================================================
            // EPIC LEARNING HOME
            // =================================================

            case "learning":

                return (
                    <LearningPage
                        onViewCourse={
                            handleViewCourse
                        }
                    />
                );

            // =================================================
            // COURSE DETAILS
            // =================================================

            case "view-course":

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
                            (lessonId: number) => {

                                handleViewLesson(
                                    selectedCourseId,
                                    lessonId
                                );

                            }
                        }
                    />
                );

            // =================================================
            // LESSON
            // =================================================

            case "lesson":

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

            // =================================================
            // SETTINGS
            // =================================================

            case "settings":
                return <Settings />;

            // =================================================
            // FALLBACK
            // =================================================

            default:
                return <Dashboard />;

        }

    };

    // =====================================================
    // LOGIN
    // =====================================================

    if (!isAuthenticated) {

        return (
            <div className="epic-login-container">
                <Login />
            </div>
        );

    }

    // =====================================================
    // USER INFORMATION
    // =====================================================

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

    const avatarLetter =
        fullName
            .charAt(0)
            .toUpperCase();

    // =====================================================
    // MAIN APPLICATION
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

                    {PermissionService.canView(
                        "Church Services"
                    ) && (

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

                    )}

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

                    <div className="epic-nav-section epic-nav-section-space">
                        EPIC LEARNING
                    </div>

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
                                {getPageTitle()}
                            </strong>

                            <span>
                                {getPageSubtitle()}
                            </span>

                        </div>

                    </div>

                    <div className="epic-topbar-right">

                        <div className="epic-date">

                            {new Date()
                                .toLocaleDateString(
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