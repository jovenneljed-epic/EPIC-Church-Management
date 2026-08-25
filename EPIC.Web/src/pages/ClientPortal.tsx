
import React, {
    useEffect,
    useState,
} from "react";

import axios from "axios";

import { API_BASE_URL } from "../config";

import "./ClientPortal.css";

import ClientSidebar from "../components/client/ClientSidebar";

import ClientChurchProfile from "./ClientChurchProfile";
import ClientMembers from "./ClientMembers";

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

interface ClientMeResponse {
    userId: number;
    username: string;
    fullName: string;
    roleId: number;
    role: string;
    customerId: number;
    approvalStatus: string;
    isActive: boolean;
    client: ClientData;
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

    const [loading, setLoading] =
        useState<boolean>(true);

    const [error, setError] =
        useState<string>("");

    const [activePage, setActivePage] =
        useState<string>("dashboard");

    // =========================================================
    // NAVIGATION
    // =========================================================

    const handleNavigate = (
        page: string
    ): void => {

        setActivePage(page);
    };

    // =========================================================
    // LOAD CURRENT CLIENT
    // =========================================================

    useEffect(() => {

        loadClient();

    }, []);

    // =========================================================
    // GET /ClientAuth/me
    // =========================================================

    const loadClient = async (): Promise<void> => {

        try {

            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("clientToken") ||
                sessionStorage.getItem("clientToken") ||
                localStorage.getItem("clientAccessToken") ||
                sessionStorage.getItem("clientAccessToken");

            if (!token) {

                setError(
                    "You are not logged in."
                );

                return;
            }

            const response =
                await axios.get<ClientMeResponse>(
                    `${API_BASE_URL}/ClientAuth/me`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            setClient(response.data);

            // Keep latest verified client information
            localStorage.setItem(
                "clientUser",
                JSON.stringify(response.data)
            );

        } catch (err) {

            console.error(
                "Client portal error:",
                err
            );

            if (axios.isAxiosError(err)) {

                if (
                    err.response?.status === 401
                ) {

                    setError(
                        "Your session has expired. Please sign in again."
                    );

                } else if (
                    err.response?.status === 403
                ) {

                    setError(
                        "You do not have permission to access the client portal."
                    );

                } else {

                    setError(
                        err.response?.data?.message ||
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
            "clientUserId",
        ];

        authKeys.forEach((key) => {

            localStorage.removeItem(key);
            sessionStorage.removeItem(key);

        });

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

    if (error || !client) {

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
                        {error ||
                            "Unable to load your client account."}
                    </p>

                    <button
                        type="button"
                        className="epic-error-button"
                        onClick={handleLogout}
                    >
                        Return to Login
                    </button>

                </div>

            </div>
        );
    }

    // =========================================================
    // MAIN PORTAL
    // =========================================================

    return (
        <div className="epic-client-portal">

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <ClientSidebar
                activePage={activePage}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                clientName={
                    client.client?.clientName ||
                    client.fullName ||
                    "Client"
                }
            />

            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <div className="epic-client-main">

                {/* =================================================
                    HEADER
                ================================================= */}

             <header className="epic-client-header">

    <div className="epic-client-header-title">

        <div className="epic-client-header-label">
            EPIC CHURCH MANAGEMENT SYSTEM
        </div>

        <h1>
            {activePage === "dashboard" && "Dashboard"}
            {activePage === "church-profile" && "Church Profile"}
            {activePage === "members" && "Members"}
            {activePage === "attendance" && "Attendance"}
            {activePage === "giving" && "Giving"}
            {activePage === "reports" && "Reports"}
            {activePage === "subscription" && "Subscription"}
            {activePage === "settings" && "Account Settings"}
        </h1>

    </div>

    <div className="epic-client-header-user">

        <div className="epic-client-header-avatar">
            {client.fullName
                ?.charAt(0)
                .toUpperCase() || "C"}
        </div>

        <div className="epic-client-header-user-info">

            <strong>
                {client.fullName}
            </strong>

        </div>

    </div>

</header>
                {/* =================================================
                    PAGE CONTENT
                ================================================= */}

                <main className="epic-client-content">

                    {/* =================================================
                        DASHBOARD
                    ================================================= */}

                    {activePage === "dashboard" && (

                        <section>

                            <div className="epic-client-welcome">

                                <div>

                                    <span>
                                        WELCOME BACK
                                    </span>

                                    <h2>
                                        {client.fullName}
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

                            {/* OVERVIEW CARDS */}

                            <div className="epic-client-overview">

                                {/* CHURCH */}

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

                                {/* ACCOUNT */}

                                <article className="epic-client-card">

                                    <span className="epic-client-card-label">
                                        ACCOUNT
                                    </span>

                                    <h3>
                                        {client.username}
                                    </h3>

                                    <p>
                                        Account Status
                                    </p>

                                    <strong>
                                        {client.isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </strong>

                                </article>

                                {/* SUBSCRIPTION */}

                                <article className="epic-client-card">

                                    <span className="epic-client-card-label">
                                        SUBSCRIPTION
                                    </span>

                                    <h3>
                                        {
                                            client.client
                                                ?.status ||
                                            "Active"
                                        }
                                    </h3>

                                    <p>
                                        Approval
                                    </p>

                                    <strong>
                                        ✓{" "}
                                        {
                                            client.approvalStatus ||
                                            "APPROVED"
                                        }
                                    </strong>

                                </article>

                            </div>

                        </section>
                    )}

                    {/* =================================================
                        CHURCH PROFILE
                    ================================================= */}

                    {activePage === "church-profile" && (

                        <ClientChurchProfile
                            onBack={() =>
                                handleNavigate(
                                    "dashboard"
                                )
                            }
                        />

                    )}

                    {/* =================================================
                        MEMBERS
                    ================================================= */}

                   {activePage === "members" && (
    <ClientMembers
        onBack={() =>
            handleNavigate("dashboard")
        }
    />
)}
                    {/* =================================================
                        ATTENDANCE
                    ================================================= */}

                    {activePage === "attendance" && (

                        <section className="epic-client-page-placeholder">

                            <div className="epic-client-placeholder-icon">
                                ◷
                            </div>

                            <h2>
                                Attendance
                            </h2>

                            <p>
                                Church attendance management will
                                be connected next.
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

                    )}

                    {/* =================================================
                        GIVING
                    ================================================= */}

                    {activePage === "giving" && (

                        <section className="epic-client-page-placeholder">

                            <div className="epic-client-placeholder-icon">
                                ◇
                            </div>

                            <h2>
                                Giving
                            </h2>

                            <p>
                                Giving and financial management will
                                be connected next.
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

                    )}

                    {/* =================================================
                        REPORTS
                    ================================================= */}

                    {activePage === "reports" && (

                        <section className="epic-client-page-placeholder">

                            <div className="epic-client-placeholder-icon">
                                ▥
                            </div>

                            <h2>
                                Reports
                            </h2>

                            <p>
                                Client reports will be connected
                                next.
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

                    )}

                    {/* =================================================
                        SUBSCRIPTION
                    ================================================= */}

                    {activePage === "subscription" && (

                        <section className="epic-client-page-placeholder">

                            <div className="epic-client-placeholder-icon">
                                ◆
                            </div>

                            <h2>
                                Subscription
                            </h2>

                            <p>
                                Subscription management will be
                                connected next.
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

                    )}

                    {/* =================================================
                        SETTINGS
                    ================================================= */}

                    {activePage === "settings" && (

                        <section className="epic-client-page-placeholder">

                            <div className="epic-client-placeholder-icon">
                                ⚙
                            </div>

                            <h2>
                                Account Settings
                            </h2>

                            <p>
                                Client account settings will be
                                connected next.
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

                    )}

                </main>

                {/* =================================================
                    FOOTER
                ================================================= */}

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

