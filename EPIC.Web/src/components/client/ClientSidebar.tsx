
import React from "react";

import "./ClientSidebar.css";

// =========================================================
// TYPES
// =========================================================

export interface ClientPermission {
    clientPermissionId?: number;
    moduleName: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManage: boolean;
}

interface ClientSidebarProps {
    activePage: string;
    onNavigate: (page: string) => void;
    onLogout: () => void;
    clientName?: string;
    permissions?: ClientPermission[];
}

interface NavigationItem {
    id: string;
    label: string;
    icon: string;
    moduleName: string;
}

// =========================================================
// NAVIGATION
// =========================================================

const navigationItems: NavigationItem[] = [
    {
        id: "dashboard",
        label: "Dashboard",
        icon: "⌂",
        moduleName: "Dashboard",
    },
    {
        id: "church-profile",
        label: "Church Profile",
        icon: "◈",
        moduleName: "ChurchProfile",
    },
    {
        id: "members",
        label: "Members",
        icon: "♙",
        moduleName: "Members",
    },
  {
    id: "services",
    label: "Church Services",
    icon: "✦",
    moduleName: "Services",
},
    {
        id: "attendance",
        label: "Attendance",
        icon: "◷",
        moduleName: "Attendance",
    },
    {
        id: "giving",
        label: "Giving",
        icon: "◇",
        moduleName: "Giving",
    },
    {
        id: "reports",
        label: "Reports",
        icon: "▥",
        moduleName: "Reports",
    },
    {
        id: "subscription",
        label: "Subscription",
        icon: "◆",
        moduleName: "Subscriptions",
    },
    {
        id: "settings",
        label: "Account Settings",
        icon: "⚙",
        moduleName: "Settings",
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
    permissions = [],
}) => {
console.log("CLIENT PERMISSIONS:", permissions);
    // =====================================================
    // INITIALS
    // =====================================================

    const getInitials = (value?: string): string => {
        if (!value?.trim()) {
            return "C";
        }

        const words = value
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

    const initials = getInitials(clientName);

    // =====================================================
    // PERMISSION CHECK
    // =====================================================

    const canViewModule = (moduleName: string): boolean => {
        const permission = permissions.find(
            (item) =>
                item.moduleName?.trim().toLowerCase() ===
                moduleName.trim().toLowerCase()
        );

        if (!permission) {
            return false;
        }

        return permission.canView === true;
    };

    // =====================================================
    // FILTER NAVIGATION
    // =====================================================

    const visibleNavigationItems = navigationItems.filter(
        (item) => canViewModule(item.moduleName)
    );

    // =====================================================
    // NAVIGATION HANDLER
    // =====================================================

    const handleNavigation = (page: string): void => {
        if (activePage === page) {
            return;
        }

        const item = navigationItems.find(
            (navigationItem) => navigationItem.id === page
        );

        if (!item) {
            return;
        }

        if (!canViewModule(item.moduleName)) {
            console.warn(
                `CLIENT PERMISSION DENIED: ${item.moduleName}`
            );

            return;
        }

        onNavigate(page);
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <aside className="epic-client-sidebar">

            {/* BRAND */}

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

            {/* NAVIGATION */}

            <div className="epic-sidebar-section">

                <span className="epic-sidebar-section-title">
                    WORKSPACE
                </span>

                <nav
                    className="epic-sidebar-nav"
                    aria-label="Client portal navigation"
                >

                    {visibleNavigationItems.map((item) => {

                        const isActive =
                            activePage === item.id;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                className={`epic-sidebar-nav-item ${
                                    isActive ? "active" : ""
                                }`}
                                onClick={() =>
                                    handleNavigation(item.id)
                                }
                                aria-current={
                                    isActive
                                        ? "page"
                                        : undefined
                                }
                            >

                                <span
                                    className="epic-sidebar-nav-icon"
                                    aria-hidden="true"
                                >
                                    {item.icon}
                                </span>

                                <span className="epic-sidebar-nav-label">
                                    {item.label}
                                </span>

                                {isActive && (
                                    <span className="epic-sidebar-active-indicator" />
                                )}

                            </button>
                        );
                    })}

                    {visibleNavigationItems.length === 0 && (

                        <div className="epic-sidebar-no-access">

                            <span>
                                No modules available
                            </span>

                        </div>

                    )}

                </nav>

            </div>

            {/* SECURITY */}

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

            {/* BOTTOM */}

            <div className="epic-sidebar-bottom">

                <div className="epic-sidebar-user">

                    <div className="epic-sidebar-avatar">
                        {initials}
                    </div>

                    <div className="epic-sidebar-user-info">

                        <strong>
                            {clientName || "Client"}
                        </strong>

                        <span>
                            CLIENT ACCOUNT
                        </span>

                    </div>

                </div>

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

