
import React, {
    useEffect,
    useState,
} from "react";

import axios from "axios";

import { API_BASE_URL } from "../config";

import "./ClientPortal.css";

import ClientSidebar, {
    type ClientPermission,
} from "../components/client/ClientSidebar";

import ClientChurchProfile from "./ClientChurchProfile";
import ClientMembers from "./ClientMembers";
import ClientAttendance from "./ClientAttendance";
import ClientChurchServices from "./ClientChurchServices";
import GivingManagementPage from "./GivingManagementPage";


// =========================================================
// TYPES
// =========================================================

interface ClientData {
    clientId: number;
    clientName: string;
    contactPerson?: string;
    email?: string;
    phone?: string | null;
    status?: string;
}

interface ClientMemberData {
    memberId: number;
    memberCode?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    fullName?: string;
    customerId?: number;
    status?: string;
}

interface ClientRoleData {
    clientRoleId: number;
    roleName: string;
    description?: string;
    isSystemRole?: boolean;
    isActive?: boolean;
}

interface ClientMeResponse {
    clientMemberId: number;
    username: string;
    role: string;
    accountType?: string;

    clientRoleId?: number;
    clientRoleName?: string;

    customerId: number;

    memberId?: number;
    memberCode?: string;

    email?: string | null;
    contactNumber?: string | null;

    status?: string;
    isActive: boolean;

    createdDate?: string;
    lastLoginDate?: string;

    client: ClientData;

    member?: ClientMemberData;

    clientRole?: ClientRoleData;
}

interface ClientPermissionsResponse {
    message: string;
    clientMemberId: number;
    customerId: number;
    clientRoleId: number;
    clientRoleName: string;
    permissions: ClientPermission[];
}

interface ClientPortalProps {
    onLogout: () => void;
    onBackToLanding?: () => void;
}

// =========================================================
// COMPONENT
// =========================================================

const ClientPortal: React.FC<ClientPortalProps> = ({
    onLogout,
}) => {

    // =========================================================
    // STATE
    // =========================================================

    const [client, setClient] =
        useState<ClientMeResponse | null>(null);

    const [permissions, setPermissions] =
        useState<ClientPermission[]>([]);

    const [loading, setLoading] =
        useState<boolean>(true);

    const [error, setError] =
        useState<string>("");

    const [activePage, setActivePage] =
        useState<string>("dashboard");

const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState<boolean>(false);

    // =========================================================
    // GET CLIENT TOKEN
    // =========================================================

    const getClientToken = (): string | null => {

        return (
            localStorage.getItem("clientToken") ||
            sessionStorage.getItem("clientToken") ||
            localStorage.getItem("clientAccessToken") ||
            sessionStorage.getItem("clientAccessToken")
        );
    };

    // =========================================================
    // GET PERMISSION FOR MODULE
    // =========================================================

    const getPermission = (
        moduleName: string
    ): ClientPermission | undefined => {

        return permissions.find(
            (permission) =>
                permission.moduleName
                    ?.trim()
                    .toLowerCase() ===
                moduleName
                    .trim()
                    .toLowerCase()
        );
    };

    // =========================================================
    // CHECK VIEW PERMISSION
    // =========================================================

    const canView = (
        moduleName: string
    ): boolean => {

        const permission =
            getPermission(moduleName);

        return permission?.canView === true;
    };

    // =========================================================
    // CHECK CREATE PERMISSION
    // =========================================================

    const canCreate = (
        moduleName: string
    ): boolean => {

        const permission =
            getPermission(moduleName);

        return permission?.canCreate === true;
    };

    // =========================================================
    // CHECK EDIT PERMISSION
    // =========================================================

    const canEdit = (
        moduleName: string
    ): boolean => {

        const permission =
            getPermission(moduleName);

        return permission?.canEdit === true;
    };

    // =========================================================
    // CHECK DELETE PERMISSION
    // =========================================================

    const canDelete = (
        moduleName: string
    ): boolean => {

        const permission =
            getPermission(moduleName);

        return permission?.canDelete === true;
    };

    // =========================================================
    // CHECK MANAGE PERMISSION
    // =========================================================

  

    // =========================================================
    // PAGE → MODULE MAP
    // MUST MATCH BACKEND PERMISSION MODULE NAMES
    // =========================================================

    const pageToModule: Record<string, string> = {

        dashboard:
            "Dashboard",

        "church-profile":
            "ChurchProfile",

        members:
            "Members",

        attendance:
            "Attendance",

        visitors:
            "Visitors",

        services:
            "Services",

        giving:
            "Giving",

        income:
            "Income",

        expenses:
            "Expenses",

        ministries:
            "Ministries",

        events:
            "Events",

        learning:
            "Learning",

        reports:
            "Reports",

        settings:
            "Settings",
    };

    // =========================================================
    // NAVIGATION
    // =========================================================

    const handleNavigate = (
        page: string
    ): void => {

        const moduleName =
            pageToModule[page];

        // -----------------------------------------------------
        // UNKNOWN PAGE
        // -----------------------------------------------------

        if (!moduleName) {

            console.warn(
                "⚠️ EPIC CLIENT: Unknown page:",
                page
            );

            return;
        }

        // -----------------------------------------------------
        // PERMISSION CHECK
        // -----------------------------------------------------

        if (!canView(moduleName)) {

            console.warn(
                `⛔ EPIC CLIENT: Access denied to ${moduleName}`
            );

            return;
        }

        console.log(
            "EPIC CLIENT: Navigating:",
            {
                page,
                moduleName,
            }
        );

        // -----------------------------------------------------
        // NAVIGATE
        // -----------------------------------------------------

        setActivePage(page);
    };

    // =========================================================
    // LOAD CLIENT
    // =========================================================

    const loadClient = async (): Promise<void> => {

        try {

            setLoading(true);
            setError("");

            console.log(
                "🔥 EPIC CLIENT PORTAL: Loading current client..."
            );

            const token =
                getClientToken();

            // -------------------------------------------------
            // NO TOKEN
            // -------------------------------------------------

            if (!token) {

                setError(
                    "You are not logged in."
                );

                return;
            }

            const headers = {
                Authorization:
                    `Bearer ${token}`,
            };

            // =================================================
            // LOAD CURRENT CLIENT
            // =================================================

            const clientResponse =
                await axios.get<ClientMeResponse>(
                    `${API_BASE_URL}/ClientAuth/me`,
                    {
                        headers,
                    }
                );

            const clientData =
                clientResponse.data;

            console.log(
                "🔥 EPIC CLIENT ME:",
                clientData
            );

            // -------------------------------------------------
            // STORE CLIENT
            // -------------------------------------------------

            setClient(clientData);

            localStorage.setItem(
                "clientUser",
                JSON.stringify(clientData)
            );

            localStorage.setItem(
                "clientCustomerId",
                String(
                    clientData.customerId
                )
            );

            localStorage.setItem(
                "clientMemberId",
                String(
                    clientData.clientMemberId
                )
            );

            // =================================================
            // LOAD CLIENT PERMISSIONS
            // =================================================

            const permissionsResponse =
                await axios.get<ClientPermissionsResponse>(
                    `${API_BASE_URL}/ClientPermissions/my`,
                    {
                        headers,
                    }
                );

            const permissionsData =
                permissionsResponse.data;

            const loadedPermissions =
                permissionsData.permissions || [];

            // -------------------------------------------------
            // STORE PERMISSIONS
            // -------------------------------------------------

            setPermissions(
                loadedPermissions
            );

            // =================================================
            // DEBUG
            // =================================================

            console.log(
                "🔥 EPIC CLIENT PERMISSIONS FULL:",
                JSON.stringify(
                    permissionsData,
                    null,
                    2
                )
            );

            console.log(
                "🔥 EPIC CLIENT ROLE:",
                permissionsData.clientRoleName
            );

            console.log(
                "🔥 EPIC CLIENT CUSTOMER ID:",
                permissionsData.customerId
            );

            console.log(
                "🔥 EPIC CLIENT MEMBER ID:",
                permissionsData.clientMemberId
            );

            console.log(
                "🔥 EPIC CLIENT MODULES:",
                loadedPermissions.map(
                    (
                        permission
                    ) => ({
                        module:
                            permission.moduleName,

                        view:
                            permission.canView,

                        create:
                            permission.canCreate,

                        edit:
                            permission.canEdit,

                        delete:
                            permission.canDelete,

                        manage:
                            permission.canManage,
                    })
                )
            );

            // =================================================
            // VERIFY DASHBOARD ACCESS
            // =================================================

            const dashboardPermission =
                loadedPermissions.find(
                    (permission) =>
                        permission.moduleName
                            ?.trim()
                            .toLowerCase() ===
                        "dashboard"
                );

            // -------------------------------------------------
            // NO DASHBOARD ACCESS
            // -------------------------------------------------

            if (
                !dashboardPermission?.canView
            ) {

                const firstAvailablePermission =
                    loadedPermissions.find(
                        (permission) =>
                            permission.canView
                    );

                if (
                    firstAvailablePermission
                ) {

                    const firstPage =
                        Object.entries(
                            pageToModule
                        ).find(
                            ([, moduleName]) =>
                                moduleName
                                    .toLowerCase() ===
                                firstAvailablePermission
                                    .moduleName
                                    ?.toLowerCase()
                        );

                    if (firstPage) {

                        setActivePage(
                            firstPage[0]
                        );
                    }
                }
            }

            console.log(
                "🔥 EPIC CLIENT PORTAL: Client + permissions loaded successfully."
            );

        } catch (err) {

            console.error(
                "EPIC CLIENT PORTAL ERROR:",
                err
            );

            if (
                axios.isAxiosError(err)
            ) {

                if (
                    err.response?.status ===
                    401
                ) {

                    setError(
                        "Your session has expired. Please sign in again."
                    );

                } else if (
                    err.response?.status ===
                    403
                ) {

                    setError(
                        "You do not have permission to access the client portal."
                    );

                } else {

                    setError(
                        err.response?.data
                            ?.message ||
                        "Unable to load your client account."
                    );
                }

            } else {

                setError(
                    "Unable to load your client account."
                );
            }

        } finally {

            setLoading(false);
        }
    };

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        loadClient();

    }, []);

    // =========================================================
    // LOGOUT
    // =========================================================

    const handleLogout = (): void => {

        const authKeys = [

            "clientToken",
            "clientAccessToken",
            "clientJwt",
            "clientAuthToken",

            "clientUser",

            "clientId",
            "clientName",
            "clientEmail",
            "clientChurchName",

            "clientCustomerId",
            "clientMemberId",
            "clientUserId",

        ];

        authKeys.forEach(
            (key) => {

                localStorage.removeItem(
                    key
                );

                sessionStorage.removeItem(
                    key
                );
            }
        );

        window.dispatchEvent(
            new Event(
                "epic:client-auth-changed"
            )
        );

        onLogout();
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <div className="epic-portal-loading">

                <div className="epic-loading-card">

                    <div className="epic-loading-logo">
                        E
                    </div>

                    <div className="epic-loading-spinner" />

                    <h2>
                        Loading Client Portal
                    </h2>

                    <p>
                        Securely loading your EPIC account...
                    </p>

                </div>

            </div>
        );
    }

    // =========================================================
    // ERROR
    // =========================================================

    if (
        error ||
        !client
    ) {

        return (

            <div className="epic-portal-error-page">

                <div className="epic-portal-error-card">

                    <div className="epic-error-icon">
                        !
                    </div>

                    <div className="epic-error-brand">
                        EPIC
                    </div>

                    <h2>
                        Client Portal
                    </h2>

                    <p>
                        {
                            error ||
                            "Unable to load your client account."
                        }
                    </p>

                    <button
                        type="button"
                        className="epic-error-button"
                        onClick={
                            handleLogout
                        }
                    >
                        Return to Login
                    </button>

                </div>

            </div>
        );
    }

    // =========================================================
    // PLACEHOLDER PAGE
    // =========================================================

    const renderPlaceholder = (
        title: string,
        description: string,
        icon: string
    ) => (

        <section className="epic-client-page-placeholder">

            <div className="epic-client-placeholder-icon">
                {icon}
            </div>

            <h2>
                {title}
            </h2>

            <p>
                {description}
            </p>

            <button
                type="button"
                onClick={() =>
                    handleNavigate(
                        "dashboard"
                    )
                }
            >
                Back to Dashboard
            </button>

        </section>
    );

    // =========================================================
    // MAIN PORTAL
    // =========================================================

    return (

        <div className="epic-client-portal">

            {/* =============================================
                SIDEBAR
            ============================================= */}

           <div
    className={
        mobileSidebarOpen
            ? "epic-sidebar-wrapper open"
            : "epic-sidebar-wrapper"
    }
>
    <ClientSidebar
        activePage={activePage}
        onNavigate={(page) => {
            handleNavigate(page);
            setMobileSidebarOpen(false);
        }}
        onLogout={handleLogout}
        clientName={
            client.client?.clientName ||
            client.member?.fullName ||
            client.username ||
            "Client"
        }
        permissions={permissions}
    />
</div>

            {/* =============================================
                MAIN
            ============================================= */}
             {
    mobileSidebarOpen && (
        <div
            className="epic-sidebar-overlay"
            onClick={() =>
                setMobileSidebarOpen(false)
            }
        />
    )
}
 
            <div className="epic-client-main">

                {/* =============================================
                    HEADER
                ============================================= */}

                <header className="epic-client-header">

<button
    type="button"
    className="epic-mobile-menu-button"
    onClick={() =>
        setMobileSidebarOpen(true)
    }
    aria-label="Open navigation"
>
    ☰
</button>

                    <div className="epic-client-header-title">

                        <div className="epic-client-header-label">
                            EPIC CHURCH MANAGEMENT SYSTEM
                        </div>

                        <h1>

                            {
                                activePage
                                    .replace(
                                        "-",
                                        " "
                                    )
                                    .replace(
                                        /\b\w/g,
                                        (
                                            character
                                        ) =>
                                            character.toUpperCase()
                                    )
                            }

                        </h1>

                    </div>

                    <div className="epic-client-header-user">

                        <div className="epic-client-header-avatar">

                            {
                                (
                                    client.member
                                        ?.fullName ||
                                    client.username ||
                                    "C"
                                )
                                    .charAt(0)
                                    .toUpperCase()
                            }

                        </div>

                        <div className="epic-client-header-user-info">

                            <strong>

                                {
                                    client.member
                                        ?.fullName ||
                                    client.username
                                }

                            </strong>

                            <span>

                                {
                                    client.clientRoleName ||
                                    client.clientRole
                                        ?.roleName ||
                                    client.role
                                }

                            </span>

                        </div>

                    </div>

                </header>

                {/* =============================================
                    CONTENT
                ============================================= */}

                <main className="epic-client-content">

                    {/* =========================================
                        DASHBOARD
                    ========================================= */}

                    {
                        activePage ===
                        "dashboard" &&
                        canView(
                            "Dashboard"
                        ) && (

                            <section>

                                <div className="epic-client-welcome">

                                    <div>

                                        <span>
                                            WELCOME BACK
                                        </span>

                                        <h2>

                                            {
                                                client.member
                                                    ?.fullName ||
                                                client.username
                                            }

                                        </h2>

                                        <p>
                                            Manage your church account
                                            through EPIC Church
                                            Management System.
                                        </p>

                                    </div>

                                    <div className="epic-client-status">

                                        <span>
                                            ✓
                                        </span>

                                        <div>

                                            <strong>
                                                Account Verified
                                            </strong>

                                            <small>
                                                Secure client access
                                            </small>

                                        </div>

                                    </div>

                                </div>

                                <div className="epic-client-overview">

                                    <article className="epic-client-card">

                                        <span className="epic-client-card-label">
                                            CHURCH
                                        </span>

                                        <h3>

                                            {
                                                client.client
                                                    ?.clientName ||
                                                "Church"
                                            }

                                        </h3>

                                        <p>
                                            Contact Person
                                        </p>

                                        <strong>

                                            {
                                                client.client
                                                    ?.contactPerson ||
                                                "Not provided"
                                            }

                                        </strong>

                                    </article>

                                    <article className="epic-client-card">

                                        <span className="epic-client-card-label">
                                            ACCOUNT
                                        </span>

                                        <h3>
                                            {
                                                client.username
                                            }
                                        </h3>

                                        <p>
                                            Account Status
                                        </p>

                                        <strong>

                                            {
                                                client.isActive
                                                    ? "Active"
                                                    : "Inactive"
                                            }

                                        </strong>

                                    </article>

                                    <article className="epic-client-card">

                                        <span className="epic-client-card-label">
                                            ROLE
                                        </span>

                                        <h3>

                                            {
                                                client.clientRoleName ||
                                                client.clientRole
                                                    ?.roleName ||
                                                client.role
                                            }

                                        </h3>

                                        <p>
                                            Customer ID
                                        </p>

                                        <strong>
                                            #
                                            {
                                                client.customerId
                                            }
                                        </strong>

                                    </article>

                                </div>

                            </section>
                        )
                    }

                    {/* =========================================
                        CHURCH PROFILE
                    ========================================= */}

                    {
                        activePage ===
                        "church-profile" &&
                        canView(
                            "ChurchProfile"
                        ) && (

                            <ClientChurchProfile
                                onBack={() =>
                                    handleNavigate(
                                        "dashboard"
                                    )
                                }
                            />

                        )
                    }

                    {/* =========================================
                        MEMBERS
                    ========================================= */}

                    {
                        activePage ===
                        "members" &&
                        canView(
                            "Members"
                        ) && (

                            <ClientMembers
                                onBack={() =>
                                    handleNavigate(
                                        "dashboard"
                                    )
                                }
                            />

                        )
                    }

                    {/* =========================================
                        ATTENDANCE
                    ========================================= */}

                   {
    activePage ===
    "attendance" &&
    canView("Attendance") && (

        <ClientAttendance
            canCreate={canCreate("Attendance")}
            canEdit={canEdit("Attendance")}
            canDelete={canDelete("Attendance")}
            onBack={() =>
                handleNavigate("dashboard")
            }
        />

    )
}
                    {/* =========================================
                        VISITORS
                    ========================================= */}

                    {
                        activePage ===
                        "visitors" &&
                        canView(
                            "Visitors"
                        ) &&

                        renderPlaceholder(
                            "Visitors",
                            "Visitor management will be connected next.",
                            "◉"
                        )
                    }

                    {/* =========================================
                        SERVICES
                    ========================================= */}

                  {
    activePage === "services" &&
    canView("Services") && (
        <ClientChurchServices
            permissions={permissions}
        />
    )
}

                    {/* =========================================
                        GIVING
                    ========================================= */}

                   {/* =========================================
    GIVING
========================================= */}


{
    activePage === "giving" &&
    canView("Giving") && (

        <GivingManagementPage
            permissions={permissions}
            canCreate={canCreate("Giving")}
            canEdit={canEdit("Giving")}
            canDelete={canDelete("Giving")}
            onBack={() =>
                handleNavigate("dashboard")
            }
        />

    )
}


                    {/* =========================================
                        INCOME
                    ========================================= */}

                    {
                        activePage ===
                        "income" &&
                        canView(
                            "Income"
                        ) &&

                        renderPlaceholder(
                            "Income",
                            "Income management will be connected next.",
                            "↑"
                        )
                    }

                    {/* =========================================
                        EXPENSES
                    ========================================= */}

                    {
                        activePage ===
                        "expenses" &&
                        canView(
                            "Expenses"
                        ) &&

                        renderPlaceholder(
                            "Expenses",
                            "Expense management will be connected next.",
                            "↓"
                        )
                    }

                    {/* =========================================
                        MINISTRIES
                    ========================================= */}

                    {
                        activePage ===
                        "ministries" &&
                        canView(
                            "Ministries"
                        ) &&

                        renderPlaceholder(
                            "Ministries",
                            "Ministry management will be connected next.",
                            "✦"
                        )
                    }

                    {/* =========================================
                        EVENTS
                    ========================================= */}

                    {
                        activePage ===
                        "events" &&
                        canView(
                            "Events"
                        ) &&

                        renderPlaceholder(
                            "Events",
                            "Event management will be connected next.",
                            "◈"
                        )
                    }

                    {/* =========================================
                        LEARNING
                    ========================================= */}

                    {
                        activePage ===
                        "learning" &&
                        canView(
                            "Learning"
                        ) &&

                        renderPlaceholder(
                            "EPIC Learning",
                            "Learning and discipleship management will be connected next.",
                            "▣"
                        )
                    }

                    {/* =========================================
                        REPORTS
                    ========================================= */}

                    {
                        activePage ===
                        "reports" &&
                        canView(
                            "Reports"
                        ) &&

                        renderPlaceholder(
                            "Reports",
                            "Client reports will be connected next.",
                            "▥"
                        )
                    }

                    {/* =========================================
                        SETTINGS
                    ========================================= */}

                    {
                        activePage ===
                        "settings" &&
                        canView(
                            "Settings"
                        ) &&

                        renderPlaceholder(
                            "Account Settings",
                            "Client account settings will be connected next.",
                            "⚙"
                        )
                    }

                </main>

                {/* =============================================
                    FOOTER
                ============================================= */}

                <footer className="epic-client-footer">

                    <strong>
                        EPIC
                    </strong>

                    <span>
                        Engaging People Into Christ
                    </span>

                    <span>
                        © {new Date().getFullYear()}
                    </span>

                </footer>

            </div>

        </div>
    );
};

export default ClientPortal;

