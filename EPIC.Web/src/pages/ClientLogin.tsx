import React, {
    useCallback,
    useEffect,
    useState,
} from "react";

import axios, {
    AxiosError,
} from "axios";

import type {
    FormEvent,
} from "react";

import { API_BASE_URL } from "../config";

import "./ClientLogin.css";

// =========================================================
// TYPES
// =========================================================

interface ClientLoginProps {
    onLoginSuccess?: () => void;
    onBackToLanding?: () => void;
}

interface ClientInfo {
    clientId?: number;
    clientName?: string;
    email?: string;
    churchName?: string;
    status?: string;
    subscriptionStatus?: string;
}

interface ClientLoginResponse {
    success?: boolean;
    message?: string;

    token?: string;
    accessToken?: string;
    jwt?: string;

    client?: ClientInfo;
    user?: ClientInfo;
}

// =========================================================
// STORAGE KEYS
// =========================================================

const CLIENT_TOKEN_KEYS = [
    "clientToken",
    "clientAccessToken",
    "clientJwt",
];

const CLIENT_USER_KEYS = [
    "clientUser",
    "client",
    "clientInfo",
];

const REMEMBERED_EMAIL_KEY =
    "epicClientRememberedEmail";

// =========================================================
// COMPONENT
// =========================================================

const ClientLogin: React.FC<ClientLoginProps> = ({
    onLoginSuccess,
    onBackToLanding,
}) => {
    // =====================================================
    // STATE
    // =====================================================

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [rememberMe, setRememberMe] =
        useState(true);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    // =====================================================
    // LOAD REMEMBERED EMAIL / USERNAME
    // =====================================================

    useEffect(() => {
        try {
            const savedEmail =
                localStorage.getItem(
                    REMEMBERED_EMAIL_KEY
                );

            if (savedEmail) {
                setEmail(savedEmail);
                setRememberMe(true);
            }
        } catch (error) {
            console.warn(
                "Unable to load remembered client email:",
                error
            );
        }
    }, []);

    // =====================================================
    // CLEAR CLIENT AUTHENTICATION
    // =====================================================

    const clearClientAuthentication =
        useCallback(() => {
            CLIENT_TOKEN_KEYS.forEach((key) => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });

            CLIENT_USER_KEYS.forEach((key) => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });
        }, []);

    // =====================================================
    // GET ERROR MESSAGE
    // =====================================================

    const getErrorMessage = useCallback(
        (
            error: AxiosError<ClientLoginResponse>
        ): string => {
            const responseData =
                error.response?.data;

            if (responseData?.message) {
                return responseData.message;
            }

            switch (error.response?.status) {
                case 400:
                    return "Please check your username/email and password.";

                case 401:
                    return "Invalid client username/email or password.";

                case 403:
                    return "Your client account does not currently have access to EPIC.";

                case 404:
                    return "Client login service could not be found.";

                case 500:
                    return "The EPIC server encountered an error. Please try again.";

                default:
                    break;
            }

            if (error.code === "ERR_NETWORK") {
                return "Unable to connect to the EPIC server. Please check your connection.";
            }

            return (
                error.message ||
                "Unable to sign in. Please try again."
            );
        },
        []
    );

    // =====================================================
    // SAVE AUTHENTICATION
    // =====================================================

    const saveAuthentication = useCallback(
        (
            response: ClientLoginResponse
        ) => {
            const token =
                response.token ||
                response.accessToken ||
                response.jwt;

            if (!token) {
                throw new Error(
                    "Login succeeded, but no authentication token was returned by the server."
                );
            }

            const client =
                response.client ||
                response.user ||
                null;

            // -------------------------------------------------
            // Clear previous client authentication
            // -------------------------------------------------

            clearClientAuthentication();

            // -------------------------------------------------
            // Select storage
            // -------------------------------------------------

            const storage = rememberMe
                ? localStorage
                : sessionStorage;

            // -------------------------------------------------
            // Store authentication token
            // -------------------------------------------------

            storage.setItem(
                "clientToken",
                token
            );

            storage.setItem(
                "clientAccessToken",
                token
            );

            // -------------------------------------------------
            // Store client information
            // -------------------------------------------------

            if (client) {
                const clientJson =
                    JSON.stringify(client);

                storage.setItem(
                    "clientUser",
                    clientJson
                );

                storage.setItem(
                    "client",
                    clientJson
                );

                storage.setItem(
                    "clientInfo",
                    clientJson
                );
            }

            // -------------------------------------------------
            // Remember username/email
            // -------------------------------------------------

            if (rememberMe) {
                localStorage.setItem(
                    REMEMBERED_EMAIL_KEY,
                    email.trim()
                );
            } else {
                localStorage.removeItem(
                    REMEMBERED_EMAIL_KEY
                );
            }
        },
        [
            clearClientAuthentication,
            email,
            rememberMe,
        ]
    );

    // =====================================================
    // LOGIN
    // =====================================================

    const handleSubmit = useCallback(
        async (
            event: FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            if (isSubmitting) {
                return;
            }

            setErrorMessage("");
            setSuccessMessage("");

            const normalizedUsername =
                email.trim();

            // -------------------------------------------------
            // Basic validation
            // -------------------------------------------------

            if (!normalizedUsername) {
                setErrorMessage(
                    "Please enter your email address or username."
                );
                return;
            }

            if (!password) {
                setErrorMessage(
                    "Please enter your password."
                );
                return;
            }

            // -------------------------------------------------
            // Submit
            // -------------------------------------------------

            try {
                setIsSubmitting(true);

                const response =
                    await axios.post<ClientLoginResponse>(
                        `${API_BASE_URL}/ClientAuth/login`,
                        {
                            username:
                                normalizedUsername,
                            password,
                        },
                        {
                            headers: {
                                "Content-Type":
                                    "application/json",
                                Accept:
                                    "application/json",
                            },
                            timeout: 30000,
                        }
                    );

                const data =
                    response.data;

                saveAuthentication(data);

                setSuccessMessage(
                    "Login successful. Welcome to your EPIC Client Portal."
                );

                setPassword("");

                // -------------------------------------------------
                // Navigate after brief success message
                // -------------------------------------------------

                window.setTimeout(() => {
                    onLoginSuccess?.();
                }, 500);
            } catch (error) {
                console.error(
                    "EPIC Client Login Error:",
                    error
                );

                clearClientAuthentication();

                const axiosError =
                    error as AxiosError<ClientLoginResponse>;

                setErrorMessage(
                    getErrorMessage(
                        axiosError
                    )
                );
            } finally {
                setIsSubmitting(false);
            }
        },
        [
            email,
            password,
            isSubmitting,
            saveAuthentication,
            clearClientAuthentication,
            getErrorMessage,
            onLoginSuccess,
        ]
    );

    // =====================================================
    // BACK TO WEBSITE
    // =====================================================

    const handleBackToWebsite =
        useCallback(() => {
            if (onBackToLanding) {
                onBackToLanding();
                return;
            }

            window.location.href = "/";
        }, [onBackToLanding]);

    // =====================================================
    // FORGOT PASSWORD
    // =====================================================

    const handleForgotPassword =
        useCallback(() => {
            setErrorMessage("");

            setSuccessMessage(
                "Please contact your EPIC administrator to reset your client account password."
            );
        }, []);

    // =====================================================
    // INPUT CHANGE HANDLERS
    // =====================================================

    const handleUsernameChange =
        useCallback(
            (
                event: React.ChangeEvent<HTMLInputElement>
            ) => {
                setEmail(
                    event.target.value
                );

                setErrorMessage("");
                setSuccessMessage("");
            },
            []
        );

    const handlePasswordChange =
        useCallback(
            (
                event: React.ChangeEvent<HTMLInputElement>
            ) => {
                setPassword(
                    event.target.value
                );

                setErrorMessage("");
                setSuccessMessage("");
            },
            []
        );

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="epic-client-login-page">

            {/* =================================================
                BACKGROUND
            ================================================= */}

            <div className="epic-client-bg-grid" />

            <div className="epic-client-bg-glow epic-client-bg-glow-one" />

            <div className="epic-client-bg-glow epic-client-bg-glow-two" />

            {/* =================================================
                TOP BAR
            ================================================= */}

            <header className="epic-client-topbar">

                <button
                    type="button"
                    className="epic-client-brand"
                    onClick={handleBackToWebsite}
                    aria-label="Back to EPIC website"
                >
                    <span className="epic-client-brand-mark">
                        E
                    </span>

                    <span className="epic-client-brand-text">
                        <strong>
                            EPIC
                        </strong>

                        <small>
                            CHURCH MANAGEMENT SYSTEM
                        </small>
                    </span>
                </button>

                <button
                    type="button"
                    className="epic-client-back-button"
                    onClick={handleBackToWebsite}
                >
                    <span>←</span>
                    Back to Website
                </button>

            </header>

            {/* =================================================
                MAIN
            ================================================= */}

            <main className="epic-client-main">

                <div className="epic-client-layout">

                    {/* =================================================
                        LEFT BRANDING PANEL
                    ================================================= */}

                    <section className="epic-client-intro">

                        <div className="epic-client-eyebrow">
                            <span className="epic-status-dot" />
                            SECURE CLIENT ACCESS
                        </div>

                        <div className="epic-client-large-logo">
                            <span>
                                E
                            </span>
                        </div>

                        <div className="epic-client-heading">

                            <span className="epic-client-epic-word">
                                EPIC
                            </span>

                            <h1>
                                Client Portal
                            </h1>

                        </div>

                        <h2>
                            Manage your church
                            <br />
                            <span>
                                with confidence.
                            </span>
                        </h2>

                        <p className="epic-client-description">
                            Access your EPIC Church Management
                            System, manage your church information,
                            subscription, account and services from
                            one secure portal.
                        </p>

                        {/* FEATURES */}

                        <div className="epic-client-features">

                            <div className="epic-client-feature">

                                <div className="epic-client-feature-icon">
                                    ✓
                                </div>

                                <div>
                                    <strong>
                                        Secure Client Access
                                    </strong>

                                    <span>
                                        Protected access to your church account
                                    </span>
                                </div>

                            </div>

                            <div className="epic-client-feature">

                                <div className="epic-client-feature-icon">
                                    ◈
                                </div>

                                <div>
                                    <strong>
                                        Church Management
                                    </strong>

                                    <span>
                                        Manage your church information
                                    </span>
                                </div>

                            </div>

                            <div className="epic-client-feature">

                                <div className="epic-client-feature-icon">
                                    $
                                </div>

                                <div>
                                    <strong>
                                        Subscription Management
                                    </strong>

                                    <span>
                                        Manage your EPIC services and subscription
                                    </span>
                                </div>

                            </div>

                        </div>

                        <div className="epic-client-security-note">

                            <span>
                                ◉
                            </span>

                            <div>
                                <strong>
                                    Secure EPIC Environment
                                </strong>

                                <p>
                                    Your client account is protected
                                    by authenticated access.
                                </p>
                            </div>

                        </div>

                    </section>

                    {/* =================================================
                        LOGIN PANEL
                    ================================================= */}

                    <section className="epic-client-login-section">

                        <div className="epic-client-login-card">

                            {/* CARD HEADER */}

                            <div className="epic-login-card-header">

                                <div className="epic-login-mini-brand">
                                    <span>
                                        EPIC
                                    </span>

                                    <small>
                                        CLIENT ACCESS
                                    </small>
                                </div>

                                <div className="epic-login-lock">
                                    <span>
                                        ✓
                                    </span>
                                </div>

                            </div>

                            <div className="epic-login-heading">

                                <h2>
                                    Welcome Back
                                </h2>

                                <p>
                                    Sign in to access your church account.
                                </p>

                            </div>

                            {/* ALERTS */}

                            {errorMessage && (
                                <div
                                    className="epic-login-alert epic-login-alert-error"
                                    role="alert"
                                >
                                    <span>
                                        !
                                    </span>

                                    <div>
                                        {errorMessage}
                                    </div>
                                </div>
                            )}

                            {successMessage && (
                                <div
                                    className="epic-login-alert epic-login-alert-success"
                                    role="status"
                                >
                                    <span>
                                        ✓
                                    </span>

                                    <div>
                                        {successMessage}
                                    </div>
                                </div>
                            )}

                            {/* FORM */}

                            <form
                                className="epic-login-form"
                                onSubmit={handleSubmit}
                                noValidate
                            >

                                {/* USERNAME / EMAIL */}

                                <div className="epic-login-field">

                                    <label htmlFor="client-email">
                                        Email or Username
                                    </label>

                                    <div className="epic-login-input-wrapper">

                                        <span className="epic-input-icon">
                                            @
                                        </span>

                                        <input
                                            id="client-email"
                                            name="email"
                                            type="text"
                                            value={email}
                                            onChange={
                                                handleUsernameChange
                                            }
                                            placeholder="Enter your email or username"
                                            autoComplete="username"
                                            disabled={isSubmitting}
                                            required
                                        />

                                    </div>

                                </div>

                                {/* PASSWORD */}

                                <div className="epic-login-field">

                                    <div className="epic-login-label-row">

                                        <label htmlFor="client-password">
                                            Password
                                        </label>

                                        <button
                                            type="button"
                                            className="epic-forgot-button"
                                            onClick={
                                                handleForgotPassword
                                            }
                                            disabled={isSubmitting}
                                        >
                                            Forgot password?
                                        </button>

                                    </div>

                                    <div className="epic-login-input-wrapper">

                                        <span className="epic-input-icon">
                                            •
                                        </span>

                                        <input
                                            id="client-password"
                                            name="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={password}
                                            onChange={
                                                handlePasswordChange
                                            }
                                            placeholder="Enter your password"
                                            autoComplete="current-password"
                                            disabled={isSubmitting}
                                            required
                                        />

                                        <button
                                            type="button"
                                            className="epic-show-password"
                                            onClick={() =>
                                                setShowPassword(
                                                    (previous) =>
                                                        !previous
                                                )
                                            }
                                            disabled={isSubmitting}
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        >
                                            {showPassword
                                                ? "Hide"
                                                : "Show"}
                                        </button>

                                    </div>

                                </div>

                                {/* REMEMBER ME */}

                                <div className="epic-login-options">

                                    <label className="epic-remember">

                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(event) =>
                                                setRememberMe(
                                                    event.target.checked
                                                )
                                            }
                                            disabled={isSubmitting}
                                        />

                                        <span className="epic-custom-checkbox">
                                            ✓
                                        </span>

                                        <span>
                                            Remember me
                                        </span>

                                    </label>

                                </div>

                                {/* SIGN IN */}

                                <button
                                    type="submit"
                                    className="epic-client-signin-button"
                                    disabled={isSubmitting}
                                >

                                    {isSubmitting ? (
                                        <>
                                            <span className="epic-login-spinner" />

                                            Signing In...
                                        </>
                                    ) : (
                                        <>
                                            Sign In

                                            <span>
                                                →
                                            </span>
                                        </>
                                    )}

                                </button>

                            </form>

                            {/* DIVIDER */}

                            <div className="epic-login-divider">

                                <span />

                                <strong>
                                    OR
                                </strong>

                                <span />

                            </div>

                            {/* HELP */}

                            <div className="epic-login-help">

                                <div className="epic-help-icon">
                                    ?
                                </div>

                                <div>

                                    <strong>
                                        Need help?
                                    </strong>

                                    <p>
                                        Contact your EPIC administrator
                                        if you are having trouble accessing
                                        your account.
                                    </p>

                                </div>

                            </div>

                        </div>

                    </section>

                </div>

            </main>

            {/* =================================================
                FOOTER
            ================================================= */}

            <footer className="epic-client-footer">

                <span>
                    © {new Date().getFullYear()} EPIC Church
                    Management System
                </span>

                <span className="epic-footer-separator">
                    •
                </span>

                <span>
                    Engaging People Into Christ
                </span>

            </footer>

        </div>
    );
};

export default ClientLogin;