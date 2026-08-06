import React, { useState } from "react";
import "./Login.css";

import { API_BASE_URL } from "./config";

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
}

const Login: React.FC = () => {

    const [username, setUsername] = useState("");

    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    // =========================================================
    // LOGIN
    // =========================================================

    const handleLogin = async (
        event: React.FormEvent
    ) => {

        event.preventDefault();

        setError("");

        if (!username.trim() || !password) {

            setError(
                "Please enter your username and password."
            );

            return;
        }

        try {

            setLoading(true);


            // =================================================
            // STEP 1 — LOGIN
            // =================================================

            const response = await fetch(
                `${API_BASE_URL}/Auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },

                    body: JSON.stringify({
                        username: username.trim(),
                        password: password,
                    }),
                }
            );


            let data: LoginResponse | null = null;

            try {

                data = await response.json();

            } catch {

                data = null;

            }


            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    data?.error ||
                    "Invalid username or password."
                );

            }


            // =================================================
            // STEP 2 — GET JWT
            // =================================================

            const token =
                data?.token ||
                data?.accessToken ||
                data?.jwt;


            if (!token) {

                throw new Error(
                    "Login succeeded, but no authentication token was returned."
                );

            }


            // =================================================
            // STEP 3 — CLEAR OLD SESSION DATA
            // =================================================

            localStorage.removeItem("permissions");

            localStorage.removeItem("epicPermissions");


            // =================================================
            // STEP 4 — SAVE JWT
            // =================================================

            localStorage.setItem(
                "token",
                token
            );


            // =================================================
            // STEP 5 — SAVE USER
            // =================================================

            localStorage.setItem(
                "currentUser",
                data?.username ||
                data?.userName ||
                username.trim()
            );


            // =================================================
            // STEP 6 — SAVE FULL NAME
            // =================================================

            localStorage.setItem(
                "currentFullName",
                data?.fullName || ""
            );


            // =================================================
            // STEP 7 — SAVE ROLE
            // =================================================

            localStorage.setItem(
                "currentRole",
                data?.role ||
                "STAFF"
            );


            // =================================================
            // STEP 8 — SAVE USER ID
            // =================================================

            if (data?.userId !== undefined) {

                localStorage.setItem(
                    "userId",
                    String(data.userId)
                );

            }


            // =================================================
            // STEP 9 — SAVE ROLE ID
            // =================================================

            if (data?.roleId !== undefined) {

                localStorage.setItem(
                    "roleId",
                    String(data.roleId)
                );

            }


            // =================================================
            // STEP 10 — GET PERMISSION MATRIX
            // =================================================

            console.log(
                "Loading EPIC permissions..."
            );


            const permissionResponse =
                await fetch(
                    `${API_BASE_URL}/Auth/permissions`,
                    {
                        method: "GET",

                        headers: {
                            Accept:
                                "application/json",

                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );


            if (!permissionResponse.ok) {

                let permissionError: any = null;

                try {

                    permissionError =
                        await permissionResponse.json();

                } catch {

                    permissionError = null;

                }


                throw new Error(
                    permissionError?.message ||
                    "Login succeeded, but permissions could not be loaded."
                );

            }


            const permissionData =
                await permissionResponse.json();


            // =================================================
            // STEP 11 — VALIDATE PERMISSIONS
            // =================================================

            const permissions: Permission[] =
                Array.isArray(
                    permissionData?.permissions
                )
                    ? permissionData.permissions
                    : [];


            if (!permissions.length) {

                console.warn(
                    "No permissions were returned for this user."
                );

            }


            // =================================================
            // STEP 12 — SAVE PERMISSION MATRIX
            // =================================================

            localStorage.setItem(
                "permissions",
                JSON.stringify(permissions)
            );


            // Keep a second EPIC-specific copy.
            // This makes migration easier if we later
            // introduce a dedicated permission context.

            localStorage.setItem(
                "epicPermissions",
                JSON.stringify(permissions)
            );


            // =================================================
            // DEBUG
            // =================================================

            console.log(
                "EPIC LOGIN SUCCESS"
            );

            console.log(
                "User:",
                data?.username
            );

            console.log(
                "Role:",
                data?.role
            );

            console.log(
                "Permissions:",
                permissions
            );


            // =================================================
            // STEP 13 — GO TO DASHBOARD
            // =================================================

            window.location.href = "/";


        } catch (err) {

            console.error(
                "LOGIN ERROR:",
                err
            );


            // -------------------------------------------------
            // IMPORTANT:
            // If login succeeded but permission loading failed,
            // remove the partial session.
            // -------------------------------------------------

            localStorage.removeItem("token");

            localStorage.removeItem(
                "currentUser"
            );

            localStorage.removeItem(
                "currentFullName"
            );

            localStorage.removeItem(
                "currentRole"
            );

            localStorage.removeItem(
                "userId"
            );

            localStorage.removeItem(
                "roleId"
            );

            localStorage.removeItem(
                "permissions"
            );

            localStorage.removeItem(
                "epicPermissions"
            );


            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to login. Please try again."
            );


        } finally {

            setLoading(false);

        }

    };


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

                    <div className="epic-mobile-logo">

                        <div className="epic-mobile-logo-box">
                            EP
                        </div>

                    </div>


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


                    {/* ERROR */}

                    {error && (

                        <div className="epic-login-error">

                            <span className="error-icon">
                                !
                            </span>

                            <span>
                                {error}
                            </span>

                        </div>

                    )}


                    <form
                        onSubmit={handleLogin}
                        className="epic-login-form"
                    >

                        {/* USERNAME */}

                        <div className="epic-field">

                            <label htmlFor="username">
                                Username
                            </label>

                            <div className="epic-input-wrapper">

                                <span className="epic-input-icon">
                                    👤
                                </span>

                                <input
                                    id="username"
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
                                />

                            </div>

                        </div>


                        {/* PASSWORD */}

                        <div className="epic-field">

                            <label htmlFor="password">
                                Password
                            </label>

                            <div className="epic-input-wrapper">

                                <span className="epic-input-icon">
                                    🔒
                                </span>

                                <input
                                    id="password"
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
                                >

                                    {showPassword
                                        ? "◉"
                                        : "◌"}

                                </button>

                            </div>

                        </div>


                        {/* OPTIONS */}

                        <div className="epic-login-options">

                            <label className="epic-remember">

                                <input
                                    type="checkbox"
                                />

                                <span>
                                    Remember me
                                </span>

                            </label>

                            <span className="epic-secure">
                                🔐 Secure access
                            </span>

                        </div>


                        {/* LOGIN BUTTON */}

                        <button
                            type="submit"
                            className="epic-login-button"
                            disabled={loading}
                        >

                            {loading ? (

                                <>

                                    <span className="epic-spinner" />

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


                    {/* DIVIDER */}

                    <div className="epic-login-divider">

                        <span />

                        <small>
                            EPIC CHURCH MANAGEMENT SYSTEM
                        </small>

                        <span />

                    </div>


                    {/* CHURCH FOOTER */}

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