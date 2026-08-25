
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

interface MemberInfo {
    memberId?: number;
    memberCode?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    fullName?: string;
    status?: string;
    photoPath?: string | null;
}

interface LoginResponse {
    message?: string;

    token?: string;
    accessToken?: string;
    jwt?: string;

    userId?: number;
    username?: string;
    userName?: string;
    fullName?: string;

    roleId?: number;
    role?: string;

    memberId?: number | null;
    customerId?: number | null;

    approvalStatus?: string;

    member?: MemberInfo | null;

    permissions?: Permission[];

    status?: string;
    error?: string;
}

interface LoginProps {
    onLoginSuccess?: () => void;
}

// =========================================================
// EPIC USER SESSION OBJECT
// =========================================================

interface EpicUserSession {
    userId?: number;
    username?: string;
    fullName?: string;
    role?: string;
    roleId?: number;

    memberId?: number | null;
    customerId?: number | null;

    approvalStatus?: string;

    member?: MemberInfo | null;

    permissions?: Permission[];

    token?: string;
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
    "username",

    "currentFullName",
    "fullName",

    "currentRole",
    "role",

    "currentRoleId",
    "roleId",

    "userId",

    "memberId",
    "customerId",

    "approvalStatus",

    "currentMember",
    "member",

    "memberCode",

    "epicUser",

    "subscriptionId",

    "isAuthenticated"
];

// =========================================================
// CLEAR SESSION
// =========================================================

const clearSession = (): void => {
    SESSION_KEYS.forEach((key) => {
        localStorage.removeItem(key);
    });
};

// =========================================================
// SAVE VALUE
// =========================================================

const saveValue = (
    key: string,
    value: unknown
): void => {

    if (
        value === undefined ||
        value === null
    ) {
        return;
    }

    localStorage.setItem(
        key,
        String(value)
    );
};

// =========================================================
// NORMALIZE ROLE
// =========================================================

const normalizeRole = (
    role?: string
): string => {

    return (
        role
            ?.trim()
            .toUpperCase()
            .replace(/\s+/g, " ")
            .trim()
        || ""
    );
};

// =========================================================
// NORMALIZE APPROVAL STATUS
// =========================================================

const normalizeApprovalStatus = (
    status?: string
): string => {

    if (
        !status ||
        !status.trim()
    ) {
        return "APPROVED";
    }

    return status
        .trim()
        .toUpperCase();
};

// =========================================================
// BOOLEAN NORMALIZER
// =========================================================

const toBoolean = (
    value: unknown
): boolean => {

    if (
        typeof value === "boolean"
    ) {
        return value;
    }

    if (
        typeof value === "number"
    ) {
        return value === 1;
    }

    if (
        typeof value === "string"
    ) {

        const normalized =
            value
                .trim()
                .toLowerCase();

        return [
            "true",
            "1",
            "yes",
            "y"
        ].includes(
            normalized
        );
    }

    return false;
};

// =========================================================
// NORMALIZE PERMISSION
// =========================================================

const normalizePermission = (
    item: unknown
): Permission | null => {

    if (
        typeof item === "string"
    ) {

        try {
            item = JSON.parse(item);
        } catch {
            return null;
        }
    }

    if (
        !item ||
        typeof item !== "object"
    ) {
        return null;
    }

    const source =
        item as Record<string, unknown>;

    const module =
        source.module ??
        source.Module ??
        source.moduleName ??
        source.ModuleName ??
        source.name ??
        source.Name;

    if (
        typeof module !== "string" ||
        !module.trim()
    ) {
        return null;
    }

    return {

        module:
            module.trim(),

        view:
            toBoolean(
                source.view ??
                source.View ??
                source.canView ??
                source.CanView
            ),

        create:
            toBoolean(
                source.create ??
                source.Create ??
                source.canCreate ??
                source.CanCreate
            ),

        edit:
            toBoolean(
                source.edit ??
                source.Edit ??
                source.update ??
                source.Update ??
                source.canEdit ??
                source.CanEdit
            ),

        delete:
            toBoolean(
                source.delete ??
                source.Delete ??
                source.remove ??
                source.Remove ??
                source.canDelete ??
                source.CanDelete
            ),

        export:
            toBoolean(
                source.export ??
                source.Export ??
                source.canExport ??
                source.CanExport
            )
    };
};

// =========================================================
// NORMALIZE PERMISSIONS
// =========================================================

const normalizePermissions = (
    value: unknown
): Permission[] => {

    let source = value;

    if (
        typeof source === "string"
    ) {

        try {
            source = JSON.parse(source);
        } catch {
            return [];
        }
    }

    if (
        source &&
        typeof source === "object" &&
        !Array.isArray(source)
    ) {

        const object =
            source as Record<string, unknown>;

        source =
            object.permissions ??
            object.Permissions ??
            [];
    }

    if (
        !Array.isArray(source)
    ) {
        return [];
    }

    return source
        .map(normalizePermission)
        .filter(
            (
                permission
            ): permission is Permission =>
                permission !== null
        );
};

// =========================================================
// LOGIN COMPONENT
// =========================================================

const Login: React.FC<LoginProps> = ({
    onLoginSuccess
}) => {

    const [
        username,
        setUsername
    ] = useState("");

    const [
        password,
        setPassword
    ] = useState("");

    const [
        showPassword,
        setShowPassword
    ] = useState(false);

    const [
        loading,
        setLoading
    ] = useState(false);

    const [
        error,
        setError
    ] = useState("");

    // =========================================================
    // LOGIN
    // =========================================================

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

        // =====================================================
        // VALIDATION
        // =====================================================

        if (
            !cleanUsername ||
            !password
        ) {

            setError(
                "Please enter your username and password."
            );

            return;
        }

        try {

            setLoading(true);

            // =================================================
            // LOGIN REQUEST
            // =================================================

            const response =
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

                        body:
                            JSON.stringify({
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
                    await response.json();

            } catch {

                data = null;
            }

            // =================================================
            // LOGIN ERROR
            // =================================================

            if (!response.ok) {

                const status =
                    normalizeApprovalStatus(
                        data?.approvalStatus ||
                        data?.status
                    );

                const message =
                    data?.message ||
                    data?.error;

                if (
                    status === "PENDING"
                ) {

                    throw new Error(
                        message ||
                        "Your account is pending admin approval."
                    );
                }

                if (
                    status === "REJECTED"
                ) {

                    throw new Error(
                        message ||
                        "Your account registration was rejected by the administrator."
                    );
                }

                if (
                    status === "SUSPENDED"
                ) {

                    throw new Error(
                        message ||
                        "Your account has been suspended."
                    );
                }

                throw new Error(
                    message ||
                    "Invalid username or password."
                );
            }

            // =================================================
            // TOKEN
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
            // USER INFORMATION
            // =================================================

            const savedUsername =
                (
                    data?.username ||
                    data?.userName ||
                    cleanUsername
                ).trim();

            const savedFullName =
                (
                    data?.fullName ||
                    data?.username ||
                    data?.userName ||
                    cleanUsername
                ).trim();

            const savedRole =
                normalizeRole(
                    data?.role
                ) ||
                "STAFF";

            const savedApprovalStatus =
                normalizeApprovalStatus(
                    data?.approvalStatus
                );

            // =================================================
            // APPROVAL VALIDATION
            // =================================================

            if (
                savedApprovalStatus === "PENDING"
            ) {

                throw new Error(
                    "Your account is pending admin approval."
                );
            }

            if (
                savedApprovalStatus === "REJECTED"
            ) {

                throw new Error(
                    "Your account registration was rejected by the administrator."
                );
            }

            if (
                savedApprovalStatus === "SUSPENDED"
            ) {

                throw new Error(
                    "Your account has been suspended."
                );
            }

            // =================================================
            // CLIENT VALIDATION
            // =================================================

            if (
                savedRole === "CLIENT" &&
                (
                    data?.customerId ===
                    undefined ||
                    data?.customerId ===
                    null
                )
            ) {

                throw new Error(
                    "Your CLIENT account is not linked to a customer account. Please contact the administrator."
                );
            }

            // =================================================
            // CLEAR OLD SESSION
            // =================================================

            clearSession();

            // =================================================
            // SAVE TOKEN
            // =================================================

            saveValue(
                "token",
                token
            );

            saveValue(
                "accessToken",
                token
            );

            saveValue(
                "jwt",
                token
            );

            saveValue(
                "authToken",
                token
            );

            saveValue(
                "epicToken",
                token
            );

            saveValue(
                "isAuthenticated",
                "true"
            );

            // =================================================
            // SAVE USERNAME
            // =================================================

            saveValue(
                "currentUser",
                savedUsername
            );

            saveValue(
                "username",
                savedUsername
            );

            // =================================================
            // SAVE FULL NAME
            // =================================================

            saveValue(
                "currentFullName",
                savedFullName
            );

            saveValue(
                "fullName",
                savedFullName
            );

            // =================================================
            // SAVE ROLE
            // =================================================

            saveValue(
                "currentRole",
                savedRole
            );

            saveValue(
                "role",
                savedRole
            );

            // =================================================
            // SAVE USER ID
            // =================================================

            if (
                data?.userId !== undefined &&
                data?.userId !== null
            ) {

                saveValue(
                    "userId",
                    data.userId
                );
            }

            // =================================================
            // SAVE ROLE ID
            // =================================================

            if (
                data?.roleId !== undefined &&
                data?.roleId !== null
            ) {

                saveValue(
                    "roleId",
                    data.roleId
                );

                saveValue(
                    "currentRoleId",
                    data.roleId
                );
            }

            // =================================================
            // SAVE MEMBER ID
            // =================================================

            if (
                data?.memberId !== undefined &&
                data?.memberId !== null
            ) {

                saveValue(
                    "memberId",
                    data.memberId
                );
            }

            // =================================================
            // SAVE CUSTOMER ID
            // =================================================

            if (
                data?.customerId !== undefined &&
                data?.customerId !== null
            ) {

                saveValue(
                    "customerId",
                    data.customerId
                );
            }

            // =================================================
            // SAVE APPROVAL STATUS
            // =================================================

            saveValue(
                "approvalStatus",
                savedApprovalStatus
            );

            // =================================================
            // SAVE MEMBER
            // =================================================

            if (data?.member) {

                const memberJson =
                    JSON.stringify(
                        data.member
                    );

                localStorage.setItem(
                    "currentMember",
                    memberJson
                );

                localStorage.setItem(
                    "member",
                    memberJson
                );

                if (
                    data.member.memberCode
                ) {

                    saveValue(
                        "memberCode",
                        data.member.memberCode
                    );
                }
            }

            // =================================================
            // LOAD PERMISSIONS
            // =================================================

            let permissions:
                Permission[] =
                normalizePermissions(
                    data?.permissions
                );

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

                        permissions =
                            normalizePermissions(
                                permissionData
                            );

                    } else {

                        console.warn(
                            "EPIC permissions endpoint returned HTTP",
                            permissionResponse.status
                        );
                    }

                } catch (
                    permissionError
                ) {

                    console.warn(
                        "EPIC permission loading failed:",
                        permissionError
                    );
                }
            }

            // =================================================
            // SAVE PERMISSIONS
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
            // IMPORTANT:
            // SAVE COMPLETE EPIC USER OBJECT
            //
            // ClientPortal.tsx depends on this.
            // =================================================

            const epicUser:
                EpicUserSession = {

                userId:
                    data?.userId,

                username:
                    savedUsername,

                fullName:
                    savedFullName,

                role:
                    savedRole,

                roleId:
                    data?.roleId,

                memberId:
                    data?.memberId,

                customerId:
                    data?.customerId,

                approvalStatus:
                    savedApprovalStatus,

                member:
                    data?.member,

                permissions:
                    permissions,

                token:
                    token
            };

            localStorage.setItem(
                "epicUser",
                JSON.stringify(
                    epicUser
                )
            );

            // =================================================
            // ADMIN DETECTION
            // =================================================

            const isAdmin =
                [
                    "ADMIN",
                    "ADMINISTRATOR",
                    "SYSTEM ADMINISTRATOR",
                    "SUPER ADMIN",
                    "SUPERADMIN"
                ].includes(
                    savedRole
                );

            // =================================================
            // DEBUG
            // =================================================

            console.group(
                "🔐 EPIC LOGIN SUCCESS"
            );

            console.log(
                "User:",
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
                "Role ID:",
                data?.roleId
            );

            console.log(
                "User ID:",
                data?.userId
            );

            console.log(
                "Member ID:",
                data?.memberId
            );

            console.log(
                "Customer ID:",
                data?.customerId
            );

            console.log(
                "Approval Status:",
                savedApprovalStatus
            );

            console.log(
                "Administrator:",
                isAdmin
            );

            console.log(
                "Permissions:",
                permissions
            );

            console.log(
                "EPIC User:",
                epicUser
            );

            console.log(
                "Token Exists:",
                Boolean(
                    localStorage.getItem(
                        "token"
                    )
                )
            );

            console.groupEnd();

            // =================================================
            // NOTIFY APP
            // =================================================

            window.dispatchEvent(
                new Event(
                    "epic:permissions-changed"
                )
            );

            window.dispatchEvent(
                new Event(
                    "epic:auth-changed"
                )
            );

            // =================================================
            // CLIENT ROUTING
            // =================================================
            //
            // CLIENTS must NOT be sent to the normal CMS
            // dashboard.
            //
            // They go directly to Client Portal.
            // =================================================

            if (
                savedRole === "CLIENT"
            ) {

                console.log(
                    "EPIC CLIENT LOGIN — redirecting to Client Portal."
                );

                window.location.href =
                    "/client-portal";

                return;
            }

            // =================================================
            // NORMAL ADMIN / STAFF / MEMBER LOGIN
            // =================================================

            onLoginSuccess?.();

        } catch (err) {

            console.error(
                "EPIC LOGIN ERROR:",
                err
            );

            clearSession();

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

                    <form
                        onSubmit={handleLogin}
                        className="epic-login-form"
                    >

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
                                    onChange={event =>
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
                                    onChange={event =>
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

                    <div className="epic-login-divider">

                        <span />

                        <small>
                            EPIC CHURCH MANAGEMENT SYSTEM
                        </small>

                        <span />

                    </div>

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

