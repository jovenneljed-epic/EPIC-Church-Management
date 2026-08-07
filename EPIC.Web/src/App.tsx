import React, { useEffect, useState } from "react";
import "./App.css";

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

import PermissionService from "./PermissionService";
import PermissionFilter from "./PermissionFilter";


type Page =
    | "dashboard"
    | "members"
    | "attendance"
    | "member-attendance-report"
    | "services"
    | "event-attendance"
    | "ministries"
    | "visitors"
    | "giving"
    | "income"
    | "expenses"
    | "settings";

const App: React.FC = () => {

    // =========================================================
    // STATE
    // =========================================================

    const [isAuthenticated, setIsAuthenticated] =
        useState<boolean>(false);

    const [activePage, setActivePage] =
        useState<Page>("dashboard");

    const [sidebarOpen, setSidebarOpen] =
        useState<boolean>(true);

    // =========================================================
    // CHECK LOGIN
    // =========================================================

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

    // =========================================================
    // LOGOUT
    // =========================================================

    const handleLogout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("jwt");
        localStorage.removeItem("authToken");
        localStorage.removeItem("epicToken");

        localStorage.removeItem("currentUser");
        localStorage.removeItem("currentFullName");
        localStorage.removeItem("currentRole");
        localStorage.removeItem("currentRoleId");
        localStorage.removeItem("roleId");
        localStorage.removeItem("userId");

        localStorage.removeItem("permissions");

        setIsAuthenticated(false);
        setActivePage("dashboard");

    };

    // =========================================================
    // NAVIGATION
    // =========================================================

    const navigate = (page: Page) => {

        setActivePage(page);

        if (window.innerWidth <= 900) {
            setSidebarOpen(false);
        }

    };

    // =========================================================
    // PAGE TITLE
    // =========================================================

    const getPageTitle = (): string => {

        switch (activePage) {

            case "dashboard":
                return "Dashboard";

            case "services":
                return "Church Services";

            case "member-attendance-report":
                return "Member Attendance Report";

            case "members":
                return "Members Management";

            case "attendance":
                return "Attendance Management";

            case "ministries":
                return "Ministries Management";

            case "visitors":
                return "Visitors Management";

            case "giving":
                return "Giving Management";

            case "income":
                return "Income Management";

            case "expenses":
                return "Expenses Management";

            case "settings":
                return "System Settings";

            default:
                return "Dashboard";

        }

    };

    // =========================================================
    // PAGE SUBTITLE
    // =========================================================

    const getPageSubtitle = (): string => {

        switch (activePage) {

            case "dashboard":
                return "Church management overview";

            case "services":
                return "Schedule and manage church services and events";

            case "member-attendance-report":
                return "Attendance performance, member history and pastoral follow-up";

            case "members":
                return "Manage church members and member information";

            case "attendance":
                return "Monitor and record church attendance";

            case "ministries":
                return "Manage ministries and ministry assignments";

            case "visitors":
                return "Manage visitors, follow-ups, attendance and connections";

            case "giving":
                return "Monitor tithes, offerings and church giving";

            case "income":
                return "Manage church income records";

            case "expenses":
                return "Manage church expenses";

            case "settings":
                return "Manage system configuration";

            default:
                return "Church management overview";

        }

    };

    // =========================================================
    // PAGE CONTENT
    // =========================================================

    const renderPage = () => {

        switch (activePage) {

            case "dashboard":
                return <Dashboard />;

            case "services":
                return <ChurchServicesPage />;

            case "member-attendance-report":
                return <MemberAttendanceReport />;

            case "members":
                return <Members />;

            case "attendance":
                return <Attendance />;

            case "ministries":
                return <Ministries />;

            case "visitors":
                return <Visitors />;

            case "giving":
                return <Giving />;

            case "income":
                return <Income />;

            case "expenses":
                return <Expenses />;

            case "settings":
                return <Settings />;

            default:
                return <Dashboard />;

        }

    };

    // =========================================================
    // LOGIN SCREEN
    // =========================================================

    if (!isAuthenticated) {

        return (
            <div className="epic-login-container">
                <Login />
            </div>
        );

    }

    // =========================================================
    // MAIN APPLICATION
    // =========================================================

    return (

        <div
            className={
                `epic-app ${sidebarOpen
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
                    CHURCH NAME
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
                        Dashboard View
                    ================================================= */}

                    <PermissionFilter
                        module="Dashboard"
                        action="view"
                    >
                        <button
                            type="button"
                            className={
                                `epic-nav-item ${activePage === "dashboard"
                                    ? "active"
                                    : ""
                                }`
                            }
                            onClick={() =>
                                navigate("dashboard")
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
                        Church Services View
                    ================================================= */}

                    {PermissionService.canView("Church Services") && (
                        <button
                            type="button"
                            className={`epic-nav-item ${activePage === "services" ? "active" : ""
                                }`}
                            onClick={() => navigate("services")}
                        >
                            <span className="epic-nav-icon">⛪</span>
                            <span>Church Services</span>
                        </button>
                    )}
                    {/* =================================================
                        MEMBER ATTENDANCE REPORT
                        Uses Attendance View permission
                    ================================================= */}

                    <PermissionFilter
                        module="Attendance"
                        action="view"
                    >
                        <button
                            type="button"
                            className={
                                `epic-nav-item ${activePage ===
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

                    <PermissionFilter module="Members" action="view">
                        <button
                            type="button"
                            className={`epic-nav-item ${activePage === "members" ? "active" : ""
                                }`}
                            onClick={() => navigate("members")}
                        >
                            <span className="epic-nav-icon">♟</span>
                            <span>Members</span>
                        </button>
                    </PermissionFilter>
                    {/* =================================================
                        ATTENDANCE
                    ================================================= */}

                    <PermissionFilter module="Attendance" action="view">
                        <button
                            type="button"
                            className={`epic-nav-item ${activePage === "attendance" ? "active" : ""
                                }`}
                            onClick={() => navigate("attendance")}
                        >
                            <span className="epic-nav-icon">✓</span>
                            <span>Attendance</span>
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
                    <PermissionFilter module="Ministries" action="view">
                        <button
                            type="button"
                            className={`epic-nav-item ${activePage === "ministries" ? "active" : ""
                                }`}
                            onClick={() => navigate("ministries")}
                        >
                            <span className="epic-nav-icon">♫</span>
                            <span>Ministries</span>
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
                                `epic-nav-item ${activePage === "visitors"
                                    ? "active"
                                    : ""
                                }`
                            }
                            onClick={() =>
                                navigate("visitors")
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
                                `epic-nav-item ${activePage === "giving"
                                    ? "active"
                                    : ""
                                }`
                            }
                            onClick={() =>
                                navigate("giving")
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
                                `epic-nav-item ${activePage === "income"
                                    ? "active"
                                    : ""
                                }`
                            }
                            onClick={() =>
                                navigate("income")
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
                                `epic-nav-item ${activePage === "expenses"
                                    ? "active"
                                    : ""
                                }`
                            }
                            onClick={() =>
                                navigate("expenses")
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
                        SYSTEM
                    ================================================= */}

                    <div className="epic-nav-section epic-nav-section-space">
                        SYSTEM
                    </div>

                    {/* =================================================
                        SETTINGS
                    ================================================= */}

                    <PermissionFilter
                        module="Church Settings"
                        action="view"
                    >
                        <button
                            type="button"
                            className={
                                `epic-nav-item ${activePage === "settings"
                                    ? "active"
                                    : ""
                                }`
                            }
                            onClick={() =>
                                navigate("settings")
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

                    {/* USER */}

                    <div className="epic-user-card">

                        <div className="epic-user-avatar">

                            {(
                                localStorage.getItem(
                                    "currentFullName"
                                ) ||
                                localStorage.getItem(
                                    "currentUser"
                                ) ||
                                "A"
                            )
                                .charAt(0)
                                .toUpperCase()}

                        </div>

                        <div className="epic-user-info">

                            <strong>
                                {
                                    localStorage.getItem(
                                        "currentFullName"
                                    ) ||
                                    localStorage.getItem(
                                        "currentUser"
                                    ) ||
                                    "Administrator"
                                }
                            </strong>

                            <span>
                                {
                                    localStorage.getItem(
                                        "currentRole"
                                    ) ||
                                    "System Admin"
                                }
                            </span>

                        </div>

                    </div>

                    {/* LOGOUT */}

                    <button
                        type="button"
                        className="epic-logout-button"
                        onClick={handleLogout}
                    >

                        <span>
                            ⇥
                        </span>

                        Logout

                    </button>

                </div>

            </aside>

            {/* =================================================
                MAIN AREA
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
                                    !sidebarOpen
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

                    {/* =================================================
                        TOP RIGHT
                    ================================================= */}

                    <div className="epic-topbar-right">

                        <div className="epic-date">

                            {new Date().toLocaleDateString(
                                "en-US",
                                {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                }
                            )}

                        </div>

                        <div className="epic-top-user">

                            <div className="epic-top-avatar">

                                {(
                                    localStorage.getItem(
                                        "currentFullName"
                                    ) ||
                                    localStorage.getItem(
                                        "currentUser"
                                    ) ||
                                    "A"
                                )
                                    .charAt(0)
                                    .toUpperCase()}

                            </div>

                            <div className="epic-top-user-info">

                                <strong>
                                    {
                                        localStorage.getItem(
                                            "currentFullName"
                                        ) ||
                                        localStorage.getItem(
                                            "currentUser"
                                        ) ||
                                        "Administrator"
                                    }
                                </strong>

                                <span>
                                    {
                                        localStorage.getItem(
                                            "currentRole"
                                        ) ||
                                        "Church Admin"
                                    }
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
                        © {new Date().getFullYear()} EPIC Church Management System
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