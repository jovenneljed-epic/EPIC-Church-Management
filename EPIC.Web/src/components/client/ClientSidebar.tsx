import React from "react";

import "./ClientSidebar.css";

// =========================================================
// TYPES
// =========================================================

interface ClientSidebarProps {
    activePage: string;
    onNavigate: (page: string) => void;
    onLogout: () => void;
    clientName?: string;
}

interface NavigationItem {
    id: string;
    label: string;
    icon: string;
}

// =========================================================
// NAVIGATION
// =========================================================

const navigationItems: NavigationItem[] = [
    {
        id: "dashboard",
        label: "Dashboard",
        icon: "⌂",
    },
    {
        id: "church-profile",
        label: "Church Profile",
        icon: "◈",
    },
    {
        id: "members",
        label: "Members",
        icon: "♙",
    },
    {
        id: "attendance",
        label: "Attendance",
        icon: "◷",
    },
    {
        id: "giving",
        label: "Giving",
        icon: "◇",
    },
    {
        id: "reports",
        label: "Reports",
        icon: "▥",
    },
    {
        id: "subscription",
        label: "Subscription",
        icon: "◆",
    },
    {
        id: "settings",
        label: "Account Settings",
        icon: "⚙",
    },
];

// =========================================================
// COMPONENT
// =========================================================

const ClientSidebar: React.FC<ClientSidebarProps> = ({
    activePage,
    onNavigate,
    onLogout,
    clientName,
}) => {

    // =====================================================
    // INITIALS
    // =====================================================

    const getInitials = (
        value?: string
    ): string => {

        if (!value?.trim()) {
            return "C";
        }

        const words =
            value
                .trim()
                .split(/\s+/)
                .filter(Boolean);

        if (words.length === 1) {
            return words[0]
                .substring(0, 2)
                .toUpperCase();
        }

        return (
            words[0].charAt(0) +
            words[words.length - 1].charAt(0)
        ).toUpperCase();
    };

    const initials =
        getInitials(clientName);

    // =====================================================
    // NAVIGATION HANDLER
    // =====================================================

    const handleNavigation = (
        page: string
    ): void => {

        if (activePage === page) {
            return;
        }

        onNavigate(page);
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <aside className="epic-client-sidebar">

            {/* =================================================
                BRAND
            ================================================= */}

            <div className="epic-sidebar-brand">

                <div className="epic-sidebar-logo">
                    E
                </div>

                <div className="epic-sidebar-brand-text">

                    <strong>
                        EPIC
                    </strong>

                    <span>
                        CLIENT PORTAL
                    </span>

                </div>

            </div>

            {/* =================================================
                NAVIGATION
            ================================================= */}

            <div className="epic-sidebar-section">

                <span className="epic-sidebar-section-title">
                    WORKSPACE
                </span>

                <nav
                    className="epic-sidebar-nav"
                    aria-label="Client portal navigation"
                >

                    {navigationItems.map(
                        (item) => {

                            const isActive =
                                activePage ===
                                item.id;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={
                                        `epic-sidebar-nav-item ${
                                            isActive
                                                ? "active"
                                                : ""
                                        }`
                                    }
                                    onClick={() =>
                                        handleNavigation(
                                            item.id
                                        )
                                    }
                                    aria-current={
                                        isActive
                                            ? "page"
                                            : undefined
                                    }
                                >

                                    {/* ICON */}

                                    <span
                                        className="epic-sidebar-nav-icon"
                                        aria-hidden="true"
                                    >
                                        {item.icon}
                                    </span>

                                    {/* LABEL */}

                                    <span className="epic-sidebar-nav-label">
                                        {item.label}
                                    </span>

                                    {/* ACTIVE INDICATOR */}

                                    {isActive && (
                                        <span
                                            className="epic-sidebar-active-indicator"
                                        />
                                    )}

                                </button>
                            );
                        }
                    )}

                </nav>

            </div>

            {/* =================================================
                SECURITY
            ================================================= */}

            <div className="epic-sidebar-security">

                <div className="epic-sidebar-security-icon">
                    ✓
                </div>

                <div>

                    <strong>
                        Secure Access
                    </strong>

                    <span>
                        Your session is protected
                    </span>

                </div>

            </div>

            {/* =================================================
                BOTTOM
            ================================================= */}

            <div className="epic-sidebar-bottom">

                {/* USER */}

                <div className="epic-sidebar-user">

                    <div className="epic-sidebar-avatar">
                        {initials}
                    </div>

                    <div className="epic-sidebar-user-info">

                        <strong>
                            {clientName ||
                                "Client"}
                        </strong>

                        <span>
                            CLIENT ACCOUNT
                        </span>

                    </div>

                </div>

                {/* LOGOUT */}

                <button
                    type="button"
                    className="epic-sidebar-logout"
                    onClick={onLogout}
                >

                    <span aria-hidden="true">
                        ↪
                    </span>

                    <span>
                        Logout
                    </span>

                </button>

            </div>

        </aside>
    );
};

export default ClientSidebar;