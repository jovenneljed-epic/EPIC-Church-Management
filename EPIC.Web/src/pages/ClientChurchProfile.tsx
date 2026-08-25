
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import axios from "axios";

import { API_BASE_URL } from "../config";

import "./ClientChurchProfile.css";

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

interface ClientChurchProfileProps {
    onBack?: () => void;
}

// =========================================================
// REUSABLE INFO ITEM
// =========================================================

interface InfoItemProps {
    label: string;
    value?: React.ReactNode;
    className?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({
    label,
    value,
    className = "",
}) => {
    return (
        <div className={`epic-profile-info-item ${className}`}>
            <span>{label}</span>

            <strong>
                {value || "Not provided"}
            </strong>
        </div>
    );
};

// =========================================================
// REUSABLE PROFILE CARD
// =========================================================

interface ProfileCardProps {
    icon: string;
    eyebrow: string;
    title: string;
    children: React.ReactNode;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
    icon,
    eyebrow,
    title,
    children,
}) => {
    return (
        <section className="epic-profile-card">

            <div className="epic-profile-card-heading">

                <div className="epic-profile-card-icon">
                    {icon}
                </div>

                <div>
                    <span>{eyebrow}</span>

                    <h2>{title}</h2>
                </div>

            </div>

            <div className="epic-profile-info-grid">
                {children}
            </div>

        </section>
    );
};

// =========================================================
// TOKEN HELPER
// =========================================================

const getClientToken = (): string | null => {
    return (
        localStorage.getItem("clientToken") ||
        sessionStorage.getItem("clientToken") ||
        localStorage.getItem("clientAccessToken") ||
        sessionStorage.getItem("clientAccessToken") ||
        null
    );
};

// =========================================================
// COMPONENT
// =========================================================

const ClientChurchProfile: React.FC<ClientChurchProfileProps> = ({
    onBack,
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

    // =========================================================
    // LOAD CLIENT
    // =========================================================

    const loadClient = useCallback(async (): Promise<void> => {

        try {

            setLoading(true);
            setError("");

            const token = getClientToken();

            if (!token) {

                setError(
                    "Your client session could not be found."
                );

                return;
            }

            const response =
                await axios.get<ClientMeResponse>(
                    `${API_BASE_URL}/ClientAuth/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

            setClient(response.data);

        } catch (err) {

            console.error(
                "Unable to load church profile:",
                err
            );

            if (axios.isAxiosError(err)) {

                switch (err.response?.status) {

                    case 401:
                        setError(
                            "Your session has expired. Please sign in again."
                        );
                        break;

                    case 403:
                        setError(
                            "You do not have permission to view this profile."
                        );
                        break;

                    default:
                        setError(
                            err.response?.data?.message ||
                            "Unable to load your church profile."
                        );
                        break;
                }

            } else {

                setError(
                    "Unable to load your church profile."
                );
            }

        } finally {

            setLoading(false);
        }

    }, []);

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
        void loadClient();
    }, [loadClient]);

    // =========================================================
    // HELPERS
    // =========================================================

    const getInitials = (
        value?: string
    ): string => {

        if (!value?.trim()) {
            return "EP";
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

    // =========================================================
    // DERIVED DATA
    // =========================================================

    const clientInfo = client?.client;

    const churchName =
        clientInfo?.clientName ||
        "Church Name";

    const accountStatus =
        clientInfo?.status ||
        (client?.isActive ? "Active" : "Inactive");

    const contactEmail =
        clientInfo?.email ||
        client?.username ||
        "Not provided";

    const initials = useMemo(
        () => getInitials(clientInfo?.clientName),
        [clientInfo?.clientName]
    );

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (
            <div className="epic-profile-loading">

                <div className="epic-profile-loading-card">

                    <div className="epic-profile-loading-logo">
                        E
                    </div>

                    <div className="epic-profile-spinner" />

                    <h2>
                        Loading Church Profile
                    </h2>

                    <p>
                        Securely retrieving your church information...
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
            <div className="epic-profile-error">

                <div className="epic-profile-error-card">

                    <div className="epic-profile-error-icon">
                        !
                    </div>

                    <span className="epic-profile-error-brand">
                        EPIC
                    </span>

                    <h2>
                        Unable to Load Profile
                    </h2>

                    <p>
                        {error ||
                            "Church information could not be loaded."}
                    </p>

                    <div className="epic-profile-error-actions">

                        {onBack && (
                            <button
                                type="button"
                                className="epic-profile-secondary-button"
                                onClick={onBack}
                            >
                                ← Back to Dashboard
                            </button>
                        )}

                        <button
                            type="button"
                            className="epic-profile-primary-button"
                            onClick={() => void loadClient()}
                        >
                            Try Again
                        </button>

                    </div>

                </div>

            </div>
        );
    }

    // =========================================================
    // MAIN
    // =========================================================

    return (
        <div className="epic-church-profile">

            {/* =================================================
                BACKGROUND
            ================================================= */}

            <div className="epic-profile-grid" />

            <div
                className="
                    epic-profile-glow
                    epic-profile-glow-one
                "
            />

            <div
                className="
                    epic-profile-glow
                    epic-profile-glow-two
                "
            />

            {/* =================================================
                CONTENT
            ================================================= */}

            <main className="epic-profile-main">

                {/* =================================================
                    PAGE HEADING
                ================================================= */}

                <section className="epic-profile-page-heading">

                    <div className="epic-profile-page-title">

                        <div className="epic-profile-eyebrow">
                            <span />
                            CHURCH PROFILE
                        </div>

                        <h1>
                            Your Church
                        </h1>

                        <p>
                            View your registered church
                            information and account details.
                        </p>

                    </div>

                    <div className="epic-profile-verified">

                        <div className="epic-profile-verified-icon">
                            ✓
                        </div>

                        <div>
                            <strong>
                                Verified Account
                            </strong>

                            <small>
                                Secure client access
                            </small>
                        </div>

                    </div>

                </section>

                {/* =================================================
                    CHURCH SUMMARY
                ================================================= */}

                <section className="epic-profile-hero">

                    <div className="epic-profile-church-avatar">
                        {initials}
                    </div>

                    <div className="epic-profile-hero-info">

                        <span>
                            CHURCH
                        </span>

                        <h2>
                            {churchName}
                        </h2>

                        <p>
                            Customer ID #{client.customerId}
                        </p>

                    </div>

                    <div className="epic-profile-active">

                        <span className="epic-profile-active-dot" />

                        {accountStatus}

                    </div>

                </section>

                {/* =================================================
                    ORGANIZATION
                ================================================= */}

                <ProfileCard
                    icon="◈"
                    eyebrow="ORGANIZATION"
                    title="Church Details"
                >

                    <InfoItem
                        label="Church Name"
                        value={churchName}
                    />

                    <InfoItem
                        label="Customer ID"
                        value={`#${client.customerId}`}
                    />

                    <InfoItem
                        label="Client ID"
                        value={`#${clientInfo?.clientId ?? "—"}`}
                    />

                    <InfoItem
                        label="Account Status"
                        value={
                            <span className="epic-profile-success">
                                <i />
                                {accountStatus}
                            </span>
                        }
                    />

                </ProfileCard>

                {/* =================================================
                    CONTACT
                ================================================= */}

                <ProfileCard
                    icon="@"
                    eyebrow="CONTACT"
                    title="Primary Contact"
                >

                    <InfoItem
                        label="Contact Person"
                        value={
                            clientInfo?.contactPerson
                        }
                    />

                    <InfoItem
                        label="Email Address"
                        value={contactEmail}
                        className="epic-profile-break"
                    />

                    <InfoItem
                        label="Phone Number"
                        value={clientInfo?.phone}
                    />

                    <InfoItem
                        label="Client Username"
                        value={client.username}
                        className="epic-profile-break"
                    />

                </ProfileCard>

                {/* =================================================
                    SECURITY
                ================================================= */}

                <section className="epic-profile-security">

                    <div className="epic-profile-security-icon">
                        ✓
                    </div>

                    <div className="epic-profile-security-content">

                        <strong>
                            Your information is protected
                        </strong>

                        <p>
                            Your church information is retrieved
                            directly from your authenticated EPIC
                            client account and is available only
                            to authorized users.
                        </p>

                    </div>

                </section>

            </main>

        </div>
    );
};

export default ClientChurchProfile;

