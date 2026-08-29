
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

// =========================================================
// CLIENT INFORMATION
// =========================================================

interface ClientInfo {
    clientId?: number;
    clientName?: string;
    churchName?: string;
    contactPerson?: string;
    email?: string | null;
    phone?: string | null;
    status?: string;
    subscriptionStatus?: string;
}

// =========================================================
// CLIENT MEMBER USER INFORMATION
// =========================================================

interface ClientUserInfo {
    clientMemberId?: number;

    // Compatibility
    userId?: number;

    username?: string;

    fullName?: string;

    roleId?: number;

    role?: string;

    accountType?: string;

    customerId?: number | null;

    memberId?: number | null;

    memberCode?: string;

    email?: string | null;

    contactNumber?: string | null;

    status?: string;

    approvalStatus?: string;

    isActive?: boolean;

    lastLoginDate?: string | null;
}

// =========================================================
// MEMBER INFORMATION
// =========================================================

interface ClientMemberInfo {
    memberId?: number;

    memberCode?: string;

    firstName?: string;

    middleName?: string;

    lastName?: string;

    fullName?: string;

    customerId?: number;

    status?: string;
}

// =========================================================
// LOGIN RESPONSE
// =========================================================

interface ClientLoginResponse {
    success?: boolean;

    message?: string;

    token?: string;

    accessToken?: string;

    jwt?: string;

    user?: ClientUserInfo;

    client?: ClientInfo;

    member?: ClientMemberInfo;
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
    "clientMember",
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

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

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
    // LOAD REMEMBERED USERNAME
    // =====================================================

    useEffect(() => {

        try {

            const savedEmail =
                localStorage.getItem(
                    REMEMBERED_EMAIL_KEY
                );

            if (savedEmail) {

                setEmail(
                    savedEmail
                );

                setRememberMe(
                    true
                );
            }

        } catch (error) {

            console.warn(
                "Unable to load remembered client username:",
                error
            );
        }

    }, []);

    // =====================================================
    // CLEAR CLIENT AUTHENTICATION
    // =====================================================

    const clearClientAuthentication =
        useCallback(() => {

            CLIENT_TOKEN_KEYS.forEach(
                (key) => {

                    localStorage.removeItem(
                        key
                    );

                    sessionStorage.removeItem(
                        key
                    );
                }
            );

            CLIENT_USER_KEYS.forEach(
                (key) => {

                    localStorage.removeItem(
                        key
                    );

                    sessionStorage.removeItem(
                        key
                    );
                }
            );

        }, []);

    // =====================================================
    // GET ERROR MESSAGE
    // =====================================================

    const getErrorMessage =
        useCallback(
            (
                error: AxiosError<ClientLoginResponse>
            ): string => {

                const responseData =
                    error.response?.data;

                // -------------------------------------------------
                // BACKEND MESSAGE
                // -------------------------------------------------

                if (
                    responseData &&
                    typeof responseData.message ===
                        "string" &&
                    responseData.message.trim()
                ) {

                    return responseData.message;
                }

                // -------------------------------------------------
                // HTTP STATUS
                // -------------------------------------------------

                switch (
                    error.response?.status
                ) {

                    case 400:

                        return (
                            "Please check your username/email and password."
                        );

                    case 401:

                        return (
                            "Invalid client username/email or password."
                        );

                    case 403:

                        return (
                            "Your client account does not currently have access to EPIC."
                        );

                    case 404:

                        return (
                            "Client login service could not be found."
                        );

                    case 408:

                        return (
                            "The request timed out. Please try again."
                        );

                    case 500:

                        return (
                            "The EPIC server encountered an error. Please try again."
                        );

                    case 502:
                    case 503:
                    case 504:

                        return (
                            "The EPIC server is temporarily unavailable. Please try again."
                        );

                    default:
                        break;
                }

                // -------------------------------------------------
                // TIMEOUT
                // -------------------------------------------------

                if (
                    error.code ===
                    "ECONNABORTED"
                ) {

                    return (
                        "The login request timed out. Please try again."
                    );
                }

                // -------------------------------------------------
                // NETWORK ERROR
                // -------------------------------------------------

                if (
                    error.code ===
                    "ERR_NETWORK"
                ) {

                    return (
                        "Unable to connect to the EPIC server. Please check your connection."
                    );
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

    const saveAuthentication =
        useCallback(
            (
                response: ClientLoginResponse
            ) => {

                // -------------------------------------------------
                // GET TOKEN
                // -------------------------------------------------

                const token =
                    response.token ||
                    response.accessToken ||
                    response.jwt;

                if (!token) {

                    throw new Error(
                        "Login succeeded, but no authentication token was returned by the server."
                    );
                }

                // -------------------------------------------------
                // GET RESPONSE OBJECTS
                // -------------------------------------------------

                const user =
                    response.user ||
                    null;

                const client =
                    response.client ||
                    null;

                const member =
                    response.member ||
                    null;

                // -------------------------------------------------
                // VALIDATE CLIENT MEMBER
                // -------------------------------------------------

                if (!user) {

                    throw new Error(
                        "Login succeeded, but the client member information was not returned by the server."
                    );
                }

                if (
                    user.clientMemberId ===
                    undefined ||
                    user.clientMemberId ===
                    null
                ) {

                    throw new Error(
                        "Login succeeded, but the Client Member ID was not returned by the server."
                    );
                }

                // -------------------------------------------------
                // CLEAR OLD AUTHENTICATION
                // -------------------------------------------------

                clearClientAuthentication();

                // -------------------------------------------------
                // SELECT STORAGE
                // -------------------------------------------------

                const storage =
                    rememberMe
                        ? localStorage
                        : sessionStorage;

                // -------------------------------------------------
                // STORE TOKEN
                // -------------------------------------------------

                storage.setItem(
                    "clientToken",
                    token
                );

                storage.setItem(
                    "clientAccessToken",
                    token
                );

                storage.setItem(
                    "clientJwt",
                    token
                );

                // -------------------------------------------------
                // STORE CLIENT MEMBER USER
                // -------------------------------------------------

                storage.setItem(
                    "clientUser",
                    JSON.stringify(user)
                );

                // -------------------------------------------------
                // STORE CLIENT / CHURCH
                // -------------------------------------------------

                if (client) {

                    storage.setItem(
                        "client",
                        JSON.stringify(client)
                    );

                    storage.setItem(
                        "clientInfo",
                        JSON.stringify(client)
                    );
                }

                // -------------------------------------------------
                // STORE MEMBER
                // -------------------------------------------------

                if (member) {

                    storage.setItem(
                        "clientMember",
                        JSON.stringify(member)
                    );
                }

                // -------------------------------------------------
                // STORE NORMALIZED CLIENT SESSION
                //
                // Useful for future portal components.
                // -------------------------------------------------

                const clientSession = {

                    clientMemberId:
                        user.clientMemberId,

                    username:
                        user.username || "",

                    fullName:
                        user.fullName || "",

                    role:
                        user.role || "CLIENT",

                    accountType:
                        user.accountType || "CLIENT",

                    customerId:
                        user.customerId ?? null,

                    memberId:
                        user.memberId ?? null,

                    memberCode:
                        user.memberCode || "",

                    email:
                        user.email ?? null,

                    contactNumber:
                        user.contactNumber ?? null,

                    status:
                        user.status || "ACTIVE",

                    isActive:
                        user.isActive ?? true,

                    client:
                        client,

                    member:
                        member,
                };

                storage.setItem(
                    "clientSession",
                    JSON.stringify(
                        clientSession
                    )
                );

                // -------------------------------------------------
                // REMEMBER USERNAME
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

                // -------------------------------------------------
                // DEBUG INFORMATION
                // -------------------------------------------------

                console.log(
                    "EPIC CLIENT LOGIN: Authentication saved."
                );

                console.log(
                    "EPIC CLIENT LOGIN: ClientMemberId:",
                    user.clientMemberId
                );

                console.log(
                    "EPIC CLIENT LOGIN: CustomerId:",
                    user.customerId
                );

                console.log(
                    "EPIC CLIENT LOGIN: MemberId:",
                    user.memberId
                );

                console.log(
                    "EPIC CLIENT LOGIN: MemberCode:",
                    user.memberCode
                );

                console.log(
                    "EPIC CLIENT LOGIN: Role:",
                    user.role
                );

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

    const handleSubmit =
        useCallback(
            async (
                event: FormEvent<HTMLFormElement>
            ) => {

                event.preventDefault();

                // -------------------------------------------------
                // PREVENT DOUBLE SUBMIT
                // -------------------------------------------------

                if (isSubmitting) {
                    return;
                }

                setErrorMessage("");

                setSuccessMessage("");

                // -------------------------------------------------
                // NORMALIZE USERNAME
                // -------------------------------------------------

                const normalizedUsername =
                    email.trim();

                // -------------------------------------------------
                // VALIDATION
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
                // LOGIN
                // -------------------------------------------------

                try {

                    setIsSubmitting(
                        true
                    );

                    console.log(
                        "========================================"
                    );

                    console.log(
                        "EPIC CLIENT LOGIN"
                    );

                    console.log(
                        "Starting login request..."
                    );

                    console.log(
                        "API URL:",
                        `${API_BASE_URL}/ClientAuth/login`
                    );

                    console.log(
                        "Username:",
                        normalizedUsername
                    );

                    console.log(
                        "========================================"
                    );

                    // -------------------------------------------------
                    // API REQUEST
                    // -------------------------------------------------

                    const response =
                        await axios.post<ClientLoginResponse>(
                            `${API_BASE_URL}/ClientAuth/login`,
                            {
                                username:
                                    normalizedUsername,

                                password:
                                    password,
                            },
                            {
                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    Accept:
                                        "application/json",
                                },

                                timeout:
                                    30000,
                            }
                        );

                    // -------------------------------------------------
                    // RESPONSE
                    // -------------------------------------------------

                    const data =
                        response.data;

                    console.log(
                        "EPIC CLIENT LOGIN: HTTP STATUS:",
                        response.status
                    );

                    console.log(
                        "EPIC CLIENT LOGIN: API RESPONSE:",
                        data
                    );

                    // -------------------------------------------------
                    // VERIFY TOKEN
                    // -------------------------------------------------

                    const token =
                        data.token ||
                        data.accessToken ||
                        data.jwt;

                    if (!token) {

                        throw new Error(
                            "The server did not return an authentication token."
                        );
                    }

                    // -------------------------------------------------
                    // VERIFY USER
                    // -------------------------------------------------

                    if (!data.user) {

                        throw new Error(
                            "The server did not return client member information."
                        );
                    }

                    // -------------------------------------------------
                    // SAVE AUTHENTICATION
                    // -------------------------------------------------

                    saveAuthentication(
                        data
                    );

                    // -------------------------------------------------
                    // SUCCESS MESSAGE
                    // -------------------------------------------------

                    setErrorMessage("");

                    setSuccessMessage(
                        data.message ||
                        "Login successful. Welcome to your EPIC Client Portal."
                    );

                    // -------------------------------------------------
                    // CLEAR PASSWORD
                    // -------------------------------------------------

                    setPassword("");

                    // -------------------------------------------------
                    // SUCCESS LOG
                    // -------------------------------------------------

                    console.log(
                        "EPIC CLIENT LOGIN: Login successful."
                    );

                    console.log(
                        "EPIC CLIENT LOGIN: ClientMemberId:",
                        data.user.clientMemberId
                    );

                    console.log(
                        "EPIC CLIENT LOGIN: MemberId:",
                        data.user.memberId
                    );

                    console.log(
                        "EPIC CLIENT LOGIN: CustomerId:",
                        data.user.customerId
                    );

                    // -------------------------------------------------
                    // NAVIGATE
                    // -------------------------------------------------

                    window.setTimeout(
                        () => {

                            onLoginSuccess?.();

                        },
                        500
                    );

                }

                // =====================================================
                // LOGIN ERROR
                // =====================================================

                catch (error) {

                    console.error(
                        "EPIC Client Login Error:",
                        error
                    );

                    // -------------------------------------------------
                    // AXIOS ERROR
                    // -------------------------------------------------

                    if (
                        axios.isAxiosError(error)
                    ) {

                        console.error(
                            "EPIC CLIENT LOGIN - HTTP STATUS:",
                            error.response?.status
                        );

                        console.error(
                            "EPIC CLIENT LOGIN - API RESPONSE:",
                            error.response?.data
                        );

                        console.error(
                            "EPIC CLIENT LOGIN - API MESSAGE:",
                            error.response?.data?.message
                        );

                        console.error(
                            "EPIC CLIENT LOGIN - REQUEST URL:",
                            error.config?.url
                        );

                        console.error(
                            "EPIC CLIENT LOGIN - REQUEST METHOD:",
                            error.config?.method
                        );

                        // -------------------------------------------------
                        // SHOW ERROR
                        // -------------------------------------------------

                        setErrorMessage(
                            getErrorMessage(
                                error
                            )
                        );

                    }

                    // -------------------------------------------------
                    // NON AXIOS ERROR
                    // -------------------------------------------------

                    else {

                        console.error(
                            "EPIC CLIENT LOGIN - UNKNOWN ERROR:",
                            error
                        );

                        setErrorMessage(
                            error instanceof Error
                                ? error.message
                                : "Unable to sign in. Please try again."
                        );
                    }

                    setSuccessMessage("");
                }

                // =====================================================
                // RESET SUBMITTING
                // =====================================================

                finally {

                    setIsSubmitting(
                        false
                    );
                }

            },
            [
                email,
                password,
                isSubmitting,
                saveAuthentication,
                onLoginSuccess,
                getErrorMessage,
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

        }, [
            onBackToLanding,
        ]);

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
    // USERNAME CHANGE
    // =====================================================

    const handleUsernameChange =
        useCallback(
            (
                event:
                    React.ChangeEvent<HTMLInputElement>
            ) => {

                setEmail(
                    event.target.value
                );

                setErrorMessage("");

                setSuccessMessage("");
            },
            []
        );

    // =====================================================
    // PASSWORD CHANGE
    // =====================================================

    const handlePasswordChange =
        useCallback(
            (
                event:
                    React.ChangeEvent<HTMLInputElement>
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
                    onClick={
                        handleBackToWebsite
                    }
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
                    onClick={
                        handleBackToWebsite
                    }
                >

                    <span>
                        ←
                    </span>

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
                                onSubmit={
                                    handleSubmit
                                }
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
                                            disabled={
                                                isSubmitting
                                            }
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
                                            disabled={
                                                isSubmitting
                                            }
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
                                            disabled={
                                                isSubmitting
                                            }
                                            required
                                        />

                                        <button
                                            type="button"
                                            className="epic-show-password"
                                            onClick={() =>
                                                setShowPassword(
                                                    previous =>
                                                        !previous
                                                )
                                            }
                                            disabled={
                                                isSubmitting
                                            }
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        >

                                            {
                                                showPassword
                                                    ? "Hide"
                                                    : "Show"
                                            }

                                        </button>

                                    </div>

                                </div>

                                {/* REMEMBER ME */}

                                <div className="epic-login-options">

                                    <label className="epic-remember">

                                        <input
                                            type="checkbox"
                                            checked={
                                                rememberMe
                                            }
                                            onChange={
                                                event =>
                                                    setRememberMe(
                                                        event.target.checked
                                                    )
                                            }
                                            disabled={
                                                isSubmitting
                                            }
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
                                    disabled={
                                        isSubmitting
                                    }
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

