import React, { useState } from "react";
import "./Login.css";

import { API_BASE_URL } from "./config";

// =========================================================
// TYPES
// =========================================================

interface Permission {
    module: string;
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
}

interface LoginResponse {
    token?: string;
    accessToken?: string;
    jwt?: string;

    userId?: number;
    username?: string;
    userName?: string;
    fullName?: string;

    roleId?: number;
    role?: string;

    message?: string;
    error?: string;

    permissions?: Permission[];
}

interface LoginProps {
    onLoginSuccess?: () => void;
}

// =========================================================
// SESSION KEYS
// =========================================================

const SESSION_KEYS = [
    "token",
    "accessToken",
    "jwt",
    "authToken",
    "epicToken",

    "permissions",
    "epicPermissions",

    "currentUser",
    "currentFullName",
    "currentRole",
    "currentRoleId",
    "roleId",
    "userId"
];

// =========================================================
// CLEAR SESSION
// =========================================================

const clearSession = () => {

    SESSION_KEYS.forEach((key) => {
        localStorage.removeItem(key);
    });

};

// =========================================================
// LOGIN COMPONENT
// =========================================================

const Login: React.FC<LoginProps> = ({
    onLoginSuccess
}) => {

    // =====================================================
    // STATE
    // =====================================================

    const [username, setUsername] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    // =====================================================
    // LOGIN
    // =====================================================

    const handleLogin = async (
        event: React.FormEvent
    ) => {

        event.preventDefault();

        if (loading) {
            return;
        }

        setError("");

        const cleanUsername =
            username.trim();

        // =================================================
        // VALIDATION
        // =================================================

        if (!cleanUsername || !password) {

            setError(
                "Please enter your username and password."
            );

            return;
        }

        try {

            setLoading(true);

            // =================================================
            // STEP 1 — LOGIN REQUEST
            // =================================================

            const loginResponse =
                await fetch(
                    `${API_BASE_URL}/Auth/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json"
                        },

                        body: JSON.stringify({
                            username:
                                cleanUsername,

                            password
                        })
                    }
                );

            // =================================================
            // READ RESPONSE
            // =================================================

            let data:
                LoginResponse | null =
                null;

            try {

                data =
                    await loginResponse.json();

            } catch {

                data = null;

            }

            // =================================================
            // LOGIN FAILED
            // =================================================

            if (!loginResponse.ok) {

                throw new Error(
                    data?.message ||
                    data?.error ||
                    "Invalid username or password."
                );
            }

            // =================================================
            // STEP 2 — GET TOKEN
            // =================================================

            const token =
                data?.token ||
                data?.accessToken ||
                data?.jwt;

            if (!token) {

                throw new Error(
                    "Login succeeded, but the server did not return an authentication token."
                );
            }

            // =================================================
            // STEP 3 — CLEAR PREVIOUS SESSION
            // =================================================

            clearSession();

            // =================================================
            // STEP 4 — SAVE TOKEN
            // =================================================

            localStorage.setItem(
                "token",
                token
            );

            // =================================================
            // ALSO SAVE COMMON TOKEN ALIASES
            // =================================================
            //
            // Your App.tsx checks multiple possible token names.
            // Keeping "token" as the primary token is enough,
            // but these aliases make the session compatible
            // with older EPIC components.
            //
            // =================================================

            localStorage.setItem(
                "accessToken",
                token
            );

            // =================================================
            // STEP 5 — USERNAME
            // =================================================

            const savedUsername =
                data?.username ||
                data?.userName ||
                cleanUsername;

            localStorage.setItem(
                "currentUser",
                savedUsername
            );

            // =================================================
            // STEP 6 — FULL NAME
            // =================================================

            const savedFullName =
                data?.fullName ||
                data?.username ||
                data?.userName ||
                cleanUsername;

            localStorage.setItem(
                "currentFullName",
                savedFullName
            );

            // =================================================
            // STEP 7 — ROLE
            // =================================================

            const savedRole =
                data?.role ||
                "STAFF";

            localStorage.setItem(
                "currentRole",
                savedRole
            );

            // =================================================
            // STEP 8 — USER ID
            // =================================================

            if (
                data?.userId !== undefined &&
                data?.userId !== null
            ) {

                localStorage.setItem(
                    "userId",
                    String(data.userId)
                );
            }

            // =================================================
            // STEP 9 — ROLE ID
            // =================================================

            if (
                data?.roleId !== undefined &&
                data?.roleId !== null
            ) {

                localStorage.setItem(
                    "roleId",
                    String(data.roleId)
                );

                localStorage.setItem(
                    "currentRoleId",
                    String(data.roleId)
                );
            }

            // =================================================
            // STEP 10 — LOAD PERMISSIONS
            // =================================================

            let permissions:
                Permission[] = [];

            // -------------------------------------------------
            // FIRST: CHECK IF LOGIN RESPONSE ALREADY CONTAINS
            // PERMISSIONS
            // -------------------------------------------------

            if (
                Array.isArray(
                    data?.permissions
                )
            ) {

                permissions =
                    data.permissions;
            }

            // -------------------------------------------------
            // SECOND: LOAD FROM PERMISSION ENDPOINT
            // -------------------------------------------------
            //
            // Only do this if the login response did not
            // already contain permissions.
            //
            // -------------------------------------------------

            if (
                permissions.length === 0
            ) {

                try {

                    const permissionResponse =
                        await fetch(
                            `${API_BASE_URL}/Auth/permissions`,
                            {
                                method: "GET",

                                headers: {
                                    Accept:
                                        "application/json",

                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );

                    if (
                        permissionResponse.ok
                    ) {

                        const permissionData =
                            await permissionResponse.json();

                        // -----------------------------------------
                        // POSSIBLE RESPONSE:
                        //
                        // {
                        //     permissions: [...]
                        // }
                        //
                        // OR:
                        //
                        // [...]
                        // -----------------------------------------

                        if (
                            Array.isArray(
                                permissionData
                            )
                        ) {

                            permissions =
                                permissionData;

                        } else if (
                            Array.isArray(
                                permissionData?.permissions
                            )
                        ) {

                            permissions =
                                permissionData.permissions;
                        }

                    } else {

                        console.warn(
                            "Permission endpoint returned HTTP",
                            permissionResponse.status
                        );

                    }

                } catch (
                    permissionError
                ) {

                    console.warn(
                        "Permission loading failed:",
                        permissionError
                    );

                }
            }

            // =================================================
            // STEP 11 — SAVE PERMISSIONS
            // =================================================

            localStorage.setItem(
                "permissions",
                JSON.stringify(
                    permissions
                )
            );

            localStorage.setItem(
                "epicPermissions",
                JSON.stringify(
                    permissions
                )
            );

            // =================================================
            // STEP 12 — DEBUG
            // =================================================

            console.log(
                "===================================="
            );

            console.log(
                "EPIC LOGIN SUCCESS"
            );

            console.log(
                "Username:",
                savedUsername
            );

            console.log(
                "Full Name:",
                savedFullName
            );

            console.log(
                "Role:",
                savedRole
            );

            console.log(
                "User ID:",
                data?.userId
            );

            console.log(
                "Role ID:",
                data?.roleId
            );

            console.log(
                "Token exists:",
                Boolean(
                    localStorage.getItem(
                        "token"
                    )
                )
            );

            console.log(
                "Permissions:",
                permissions
            );

            console.log(
                "===================================="
            );

            // =================================================
            // STEP 13 — NOTIFY APP
            // =================================================
            //
            // IMPORTANT:
            //
            // Do NOT navigate here.
            //
            // App.tsx owns navigation.
            //
            // Login only tells App.tsx that authentication
            // succeeded.
            //
            // App.tsx will then navigate to:
            //
            // /dashboard
            //
            // =================================================

            onLoginSuccess?.();

        } catch (err) {

            console.error(
                "EPIC LOGIN ERROR:",
                err
            );

            // =================================================
            // REMOVE PARTIAL SESSION
            // =================================================

            clearSession();

            // =================================================
            // DISPLAY ERROR
            // =================================================

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to login. Please try again."
            );

        } finally {

            setLoading(false);

        }

    };

    // =========================================================
    // UI
    // =========================================================

    return (

        <div className="epic-login-page">

            {/* =================================================
                LEFT BRAND PANEL
            ================================================= */}

            <section className="epic-login-brand">

                <div className="epic-brand-overlay" />

                <div className="epic-brand-content">

                    <div className="epic-brand-logo">
                        EP
                    </div>

                    <div className="epic-brand-name">
                        EPIC CHURCH
                    </div>

                    <div className="epic-brand-system">
                        MANAGEMENT SYSTEM
                    </div>

                    <div className="epic-brand-divider" />

                    <h1>
                        Engaging People
                        <br />
                        Into Christ
                    </h1>

                    <p>
                        A centralized church
                        management platform for
                        people, attendance,
                        ministries, services,
                        and giving.
                    </p>

                    <div className="epic-brand-church">

                        <span className="church-symbol">
                            ✦
                        </span>

                        <div>

                            <strong>
                                Luke 4:18 Ministries
                            </strong>

                            <span>
                                San Vicente Church
                            </span>

                        </div>

                    </div>

                </div>

                <div className="epic-brand-footer">

                    <span>
                        Faith • People • Purpose
                    </span>

                    <span>
                        © {new Date().getFullYear()}
                    </span>

                </div>

            </section>

            {/* =================================================
                RIGHT LOGIN PANEL
            ================================================= */}

            <section className="epic-login-panel">

                <div className="epic-login-card">

                    {/* =================================================
                        MOBILE LOGO
                    ================================================= */}

                    <div className="epic-mobile-logo">

                        <div className="epic-mobile-logo-box">
                            EP
                        </div>

                    </div>

                    {/* =================================================
                        LOGIN HEADING
                    ================================================= */}

                    <div className="epic-login-heading">

                        <div className="epic-welcome">
                            WELCOME BACK
                        </div>

                        <h2>
                            Sign in to EPIC
                        </h2>

                        <p>
                            Access your church
                            management dashboard.
                        </p>

                    </div>

                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {error && (

                        <div
                            className="epic-login-error"
                            role="alert"
                        >

                            <span className="error-icon">
                                !
                            </span>

                            <span>
                                {error}
                            </span>

                        </div>

                    )}

                    {/* =================================================
                        FORM
                    ================================================= */}

                    <form
                        onSubmit={handleLogin}
                        className="epic-login-form"
                    >

                        {/* =================================================
                            USERNAME
                        ================================================= */}

                        <div className="epic-field">

                            <label htmlFor="username">
                                Username
                            </label>

                            <div className="epic-input-wrapper">

                                <span
                                    className="epic-input-icon"
                                    aria-hidden="true"
                                >
                                    👤
                                </span>

                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={username}
                                    onChange={(event) =>
                                        setUsername(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter your username"
                                    autoComplete="username"
                                    disabled={loading}
                                    autoFocus
                                />

                            </div>

                        </div>

                        {/* =================================================
                            PASSWORD
                        ================================================= */}

                        <div className="epic-field">

                            <label htmlFor="password">
                                Password
                            </label>

                            <div className="epic-input-wrapper">

                                <span
                                    className="epic-input-icon"
                                    aria-hidden="true"
                                >
                                    🔒
                                </span>

                                <input
                                    id="password"
                                    name="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    disabled={loading}
                                />

                                <button
                                    type="button"
                                    className="epic-password-toggle"
                                    onClick={() =>
                                        setShowPassword(
                                            previous =>
                                                !previous
                                        )
                                    }
                                    tabIndex={-1}
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    disabled={loading}
                                >
                                    {showPassword
                                        ? "◉"
                                        : "◌"}
                                </button>

                            </div>

                        </div>

                        {/* =================================================
                            OPTIONS
                        ================================================= */}

                        <div className="epic-login-options">

                            <label className="epic-remember">

                                <input
                                    type="checkbox"
                                    disabled={loading}
                                />

                                <span>
                                    Remember me
                                </span>

                            </label>

                            <span className="epic-secure">
                                🔐 Secure access
                            </span>

                        </div>

                        {/* =================================================
                            LOGIN BUTTON
                        ================================================= */}

                        <button
                            type="submit"
                            className="epic-login-button"
                            disabled={loading}
                        >

                            {loading ? (

                                <>

                                    <span
                                        className="epic-spinner"
                                        aria-hidden="true"
                                    />

                                    Signing in...

                                </>

                            ) : (

                                <>

                                    Sign In

                                    <span className="login-arrow">
                                        →
                                    </span>

                                </>

                            )}

                        </button>

                    </form>

                    {/* =================================================
                        DIVIDER
                    ================================================= */}

                    <div className="epic-login-divider">

                        <span />

                        <small>
                            EPIC CHURCH MANAGEMENT SYSTEM
                        </small>

                        <span />

                    </div>

                    {/* =================================================
                        CHURCH FOOTER
                    ================================================= */}

                    <div className="epic-login-bottom">

                        <div className="epic-bottom-icon">
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

                </div>

            </section>

        </div>
    );
};

export default Login;