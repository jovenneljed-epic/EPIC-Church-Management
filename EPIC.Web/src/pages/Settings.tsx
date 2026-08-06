import React, { useEffect, useMemo, useState } from "react";

/*
============================================================
 EPIC CHURCH MANAGEMENT SYSTEM
 SYSTEM SETTINGS
============================================================

 Connected API endpoints:

 USERS
 GET    /api/Users
 POST   /api/Users
 PUT    /api/Users/{id}
 PUT    /api/Users/{id}/password
 PUT    /api/Users/{id}/status

 ROLES
 GET    /api/Roles
 POST   /api/Roles
 PUT    /api/Roles/{id}
 DELETE /api/Roles/{id}

 PERMISSIONS
 GET    /api/Roles/{id}/permissions
 PUT    /api/Roles/{id}/permissions
============================================================
*/

const API_BASE =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5109/api";

// ============================================================
// TYPES
// ============================================================

interface User {
    userId: number;
    username: string;
    fullName: string;
    roleId: number;
    role: string | null;
    isActive: boolean;
    createdDate: string;
}

interface Role {
    roleId: number;
    roleName: string;
    description: string;
    isActive: boolean;
    createdDate: string;
    userCount: number;
}

interface Permission {
    permissionId?: number;
    roleId: number;
    module: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
}

interface UserForm {
    username: string;
    password: string;
    fullName: string;
    roleId: number;
}

interface EditUserForm {
    fullName: string;
    roleId: number;
    isActive: boolean;
}

interface RoleForm {
    roleName: string;
    description: string;
    isActive: boolean;
}

type SettingsTab =
    | "overview"
    | "users"
    | "roles"
    | "permissions";


// ============================================================
// MODULES
// ============================================================

const DEFAULT_MODULES = [
    "Dashboard",
    "Members",
    "Attendance",
    "Visitors",
    "Church Services",
    "Giving",
    "Income",
    "Expenses",
    "Ministries",
    "Events",
    "Reports",
    "Settings",
];


// ============================================================
// TOKEN
// ============================================================

const getToken = (): string => {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("epicToken") ||
        ""
    );
};


// ============================================================
// API HELPER
// ============================================================

async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {

    const token = getToken();

    const headers: Record<string, string> = {
        Accept: "application/json",
        ...(options.body
            ? { "Content-Type": "application/json" }
            : {}),
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_BASE}${endpoint}`,
        {
            ...options,
            headers,
        }
    );

    const contentType =
        response.headers.get("content-type") || "";

    let data: any = null;

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        const text = await response.text();

        if (text) {
            data = text;
        }
    }

    if (!response.ok) {

        let message =
            `Request failed (${response.status})`;

        if (typeof data === "string") {
            message = data;
        } else if (data?.message) {
            message = data.message;
        } else if (data?.title) {
            message = data.title;
        }

        throw new Error(message);
    }

    return data as T;
}


// ============================================================
// MAIN COMPONENT
// ============================================================

const Settings: React.FC = () => {

    // ========================================================
    // STATE
    // ========================================================

    const [activeTab, setActiveTab] =
        useState<SettingsTab>("overview");

    const [users, setUsers] =
        useState<User[]>([]);

    const [roles, setRoles] =
        useState<Role[]>([]);

    const [selectedRole, setSelectedRole] =
        useState<Role | null>(null);

    const [permissions, setPermissions] =
        useState<Permission[]>([]);

    const [loadingUsers, setLoadingUsers] =
        useState(false);

    const [loadingRoles, setLoadingRoles] =
        useState(false);

    const [loadingPermissions, setLoadingPermissions] =
        useState(false);

    const [savingPermissions, setSavingPermissions] =
        useState(false);

    const [searchUser, setSearchUser] =
        useState("");

    const [searchRole, setSearchRole] =
        useState("");

    // ========================================================
    // MODALS
    // ========================================================

    const [showCreateUser, setShowCreateUser] =
        useState(false);

    const [showEditUser, setShowEditUser] =
        useState(false);

    const [showPassword, setShowPassword] =
        useState(false);

    const [showCreateRole, setShowCreateRole] =
        useState(false);

    const [showEditRole, setShowEditRole] =
        useState(false);

    // ========================================================
    // SELECTED USER / ROLE
    // ========================================================

    const [selectedUser, setSelectedUser] =
        useState<User | null>(null);

    // ========================================================
    // FORMS
    // ========================================================

    const [userForm, setUserForm] =
        useState<UserForm>({
            username: "",
            password: "",
            fullName: "",
            roleId: 0,
        });

    const [editUserForm, setEditUserForm] =
        useState<EditUserForm>({
            fullName: "",
            roleId: 0,
            isActive: true,
        });

    const [newPassword, setNewPassword] =
        useState("");

    const [roleForm, setRoleForm] =
        useState<RoleForm>({
            roleName: "",
            description: "",
            isActive: true,
        });

    // ========================================================
    // UI STATE
    // ========================================================

    const [showPasswordValue, setShowPasswordValue] =
        useState(false);

    const [showNewPasswordValue, setShowNewPasswordValue] =
        useState(false);

    const [processing, setProcessing] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    // ========================================================
    // LOAD USERS
    // ========================================================

    const loadUsers = async () => {

        try {

            setLoadingUsers(true);
            setError("");

            const data =
                await apiRequest<User[]>(
                    "/Users"
                );

            setUsers(data);

        } catch (err: any) {

            setError(
                err.message ||
                "Unable to load users."
            );

        } finally {

            setLoadingUsers(false);

        }
    };


    // ========================================================
    // LOAD ROLES
    // ========================================================

    const loadRoles = async () => {

        try {

            setLoadingRoles(true);
            setError("");

            const data =
                await apiRequest<Role[]>(
                    "/Roles"
                );

            setRoles(data);

        } catch (err: any) {

            setError(
                err.message ||
                "Unable to load roles."
            );

        } finally {

            setLoadingRoles(false);

        }
    };


    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {

        loadUsers();
        loadRoles();

    }, []);


    // ========================================================
    // CLEAR NOTIFICATIONS
    // ========================================================

    const clearNotifications = () => {

        setMessage("");
        setError("");

    };


    // ========================================================
    // CREATE USER
    // ========================================================

    const handleCreateUser = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        clearNotifications();

        if (!userForm.fullName.trim()) {

            setError("Full name is required.");
            return;

        }

        if (!userForm.username.trim()) {

            setError("Username is required.");
            return;

        }

        if (!userForm.password) {

            setError("Password is required.");
            return;

        }

        if (userForm.password.length < 6) {

            setError(
                "Password must be at least 6 characters."
            );

            return;

        }

        if (userForm.roleId <= 0) {

            setError("Please select a role.");
            return;

        }

        try {

            setProcessing(true);

            await apiRequest(
                "/Users",
                {
                    method: "POST",
                    body: JSON.stringify({
                        username:
                            userForm.username.trim(),

                        password:
                            userForm.password,

                        fullName:
                            userForm.fullName.trim(),

                        roleId:
                            userForm.roleId,
                    }),
                }
            );

            setMessage(
                "USER CREATED SUCCESSFULLY."
            );

            setShowCreateUser(false);

            setUserForm({
                username: "",
                password: "",
                fullName: "",
                roleId: 0,
            });

            await loadUsers();

        } catch (err: any) {

            setError(
                err.message ||
                "Unable to create user."
            );

        } finally {

            setProcessing(false);

        }
    };


    // ========================================================
    // OPEN EDIT USER
    // ========================================================

    const openEditUser = (user: User) => {

        clearNotifications();

        setSelectedUser(user);

        setEditUserForm({
            fullName: user.fullName,
            roleId: user.roleId,
            isActive: user.isActive,
        });

        setShowEditUser(true);
    };


    // ========================================================
    // UPDATE USER
    // ========================================================

    const handleUpdateUser = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        if (!selectedUser) return;

        clearNotifications();

        if (!editUserForm.fullName.trim()) {

            setError("Full name is required.");
            return;

        }

        if (editUserForm.roleId <= 0) {

            setError("Please select a role.");
            return;

        }

        try {

            setProcessing(true);

            await apiRequest(
                `/Users/${selectedUser.userId}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        fullName:
                            editUserForm.fullName.trim(),

                        roleId:
                            editUserForm.roleId,

                        isActive:
                            editUserForm.isActive,
                    }),
                }
            );

            setMessage(
                "USER UPDATED SUCCESSFULLY."
            );

            setShowEditUser(false);

            setSelectedUser(null);

            await loadUsers();

        } catch (err: any) {

            setError(
                err.message ||
                "Unable to update user."
            );

        } finally {

            setProcessing(false);

        }
    };


    // ========================================================
    // OPEN PASSWORD MODAL
    // ========================================================

    const openPasswordModal = (user: User) => {

        clearNotifications();

        setSelectedUser(user);
        setNewPassword("");

        setShowPassword(false);

    };


    // ========================================================
    // CHANGE PASSWORD
    // ========================================================

    const handleChangePassword = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        if (!selectedUser) return;

        clearNotifications();

        if (!newPassword) {

            setError(
                "New password is required."
            );

            return;

        }

        if (newPassword.length < 6) {

            setError(
                "Password must be at least 6 characters."
            );

            return;

        }

        try {

            setProcessing(true);

            await apiRequest(
                `/Users/${selectedUser.userId}/password`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        newPassword,
                    }),
                }
            );

            setMessage(
                "PASSWORD UPDATED SUCCESSFULLY."
            );

            setShowPassword(false);
            setSelectedUser(null);
            setNewPassword("");

        } catch (err: any) {

            setError(
                err.message ||
                "Unable to update password."
            );

        } finally {

            setProcessing(false);

        }
    };


    // ========================================================
    // TOGGLE USER STATUS
    // ========================================================

    const toggleUserStatus = async (
        user: User
    ) => {

        clearNotifications();

        const action =
            user.isActive
                ? "deactivate"
                : "activate";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${user.fullName}?`
        );

        if (!confirmed) return;

        try {

            setProcessing(true);

            await apiRequest(
                `/Users/${user.userId}/status`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        isActive:
                            !user.isActive,
                    }),
                }
            );

            setMessage(
                user.isActive
                    ? "USER DEACTIVATED."
                    : "USER ACTIVATED."
            );

            await loadUsers();

        } catch (err: any) {

            setError(
                err.message ||
                "Unable to update user status."
            );

        } finally {

            setProcessing(false);

        }
    };


    // ========================================================
    // CREATE ROLE
    // ========================================================

    const handleCreateRole = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        clearNotifications();

        if (!roleForm.roleName.trim()) {

            setError(
                "Role name is required."
            );

            return;

        }

        try {

            setProcessing(true);

            await apiRequest(
                "/Roles",
                {
                    method: "POST",
                    body: JSON.stringify({
                        roleName:
                            roleForm.roleName.trim(),

                        description:
                            roleForm.description.trim(),
                    }),
                }
            );

            setMessage(
                "ROLE CREATED SUCCESSFULLY."
            );

            setShowCreateRole(false);

            setRoleForm({
                roleName: "",
                description: "",
                isActive: true,
            });

            await loadRoles();

        } catch (err: any) {

            setError(
                err.message ||
                "Unable to create role."
            );

        } finally {

            setProcessing(false);

        }
    };


    // ========================================================
    // OPEN EDIT ROLE
    // ========================================================

    const openEditRole = (role: Role) => {

        clearNotifications();

        setSelectedRole(role);

        setRoleForm({
            roleName: role.roleName,
            description: role.description || "",
            isActive: role.isActive,
        });

        setShowEditRole(true);
    };


    // ========================================================
    // UPDATE ROLE
    // ========================================================

    const handleUpdateRole = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        if (!selectedRole) return;

        clearNotifications();

        if (!roleForm.roleName.trim()) {

            setError(
                "Role name is required."
            );

            return;

        }

        try {

            setProcessing(true);

            await apiRequest(
                `/Roles/${selectedRole.roleId}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        roleName:
                            roleForm.roleName.trim(),

                        description:
                            roleForm.description.trim(),

                        isActive:
                            roleForm.isActive,
                    }),
                }
            );

            setMessage(
                "ROLE UPDATED SUCCESSFULLY."
            );

            setShowEditRole(false);

            setSelectedRole(null);

            await loadRoles();

        } catch (err: any) {

            setError(
                err.message ||
                "Unable to update role."
            );

        } finally {

            setProcessing(false);

        }
    };


    // ========================================================
    // DEACTIVATE ROLE
    // ========================================================

    const deactivateRole = async (
        role: Role
    ) => {

        clearNotifications();

        if (!role.isActive) {

            setError(
                "This role is already inactive."
            );

            return;

        }

        const confirmed = window.confirm(
            `Deactivate role "${role.roleName}"?`
        );

        if (!confirmed) return;

        try {

            setProcessing(true);

            await apiRequest(
                `/Roles/${role.roleId}`,
                {
                    method: "DELETE",
                }
            );

            setMessage(
                "ROLE DEACTIVATED SUCCESSFULLY."
            );

            await loadRoles();

        } catch (err: any) {

            setError(
                err.message ||
                "Unable to deactivate role."
            );

        } finally {

            setProcessing(false);

        }
    };


    // ========================================================
    // LOAD PERMISSIONS
    // ========================================================

    const loadPermissions = async (
        role: Role
    ) => {

        try {

            setLoadingPermissions(true);
            clearNotifications();

            setSelectedRole(role);

            const result =
                await apiRequest<{
                    roleId: number;
                    roleName: string;
                    permissions: Permission[];
                }>(
                    `/Roles/${role.roleId}/permissions`
                );

            const existing =
                result.permissions || [];

            const normalized =
                DEFAULT_MODULES.map(module => {

                    const found =
                        existing.find(
                            p =>
                                p.module.toLowerCase() ===
                                module.toLowerCase()
                        );

                    if (found) {

                        return {
                            ...found,
                            module,
                        };

                    }

                    return {
                        permissionId: undefined,
                        roleId: role.roleId,
                        module,
                        canView: false,
                        canCreate: false,
                        canEdit: false,
                        canDelete: false,
                        canExport: false,
                    };

                });

            // Include any additional modules
            // already stored in database.
            existing.forEach(permission => {

                const exists =
                    normalized.some(
                        p =>
                            p.module.toLowerCase() ===
                            permission.module.toLowerCase()
                    );

                if (!exists) {
                    normalized.push(permission);
                }

            });

            setPermissions(normalized);

            setActiveTab("permissions");

        } catch (err: any) {

            setError(
                err.message ||
                "Unable to load permissions."
            );

        } finally {

            setLoadingPermissions(false);

        }
    };


    // ========================================================
    // UPDATE LOCAL PERMISSION
    // ========================================================

    const updatePermission = (
        index: number,
        field:
            | "canView"
            | "canCreate"
            | "canEdit"
            | "canDelete"
            | "canExport",
        value: boolean
    ) => {

        setPermissions(prev => {

            const copy =
                [...prev];

            copy[index] = {
                ...copy[index],
                [field]: value,
            };

            return copy;

        });
    };


    // ========================================================
    // SET ALL PERMISSION VALUES
    // ========================================================

    const setAllPermissions = (
        field:
            | "canView"
            | "canCreate"
            | "canEdit"
            | "canDelete"
            | "canExport",
        value: boolean
    ) => {

        setPermissions(prev =>
            prev.map(permission => ({
                ...permission,
                [field]: value,
            }))
        );

    };


    // ========================================================
    // SAVE PERMISSIONS
    // ========================================================

    const savePermissions = async () => {

        if (!selectedRole) {

            setError(
                "Please select a role."
            );

            return;

        }

        clearNotifications();

        try {

            setSavingPermissions(true);

            const payload =
                permissions.map(permission => ({
                    module:
                        permission.module,

                    canView:
                        permission.canView,

                    canCreate:
                        permission.canCreate,

                    canEdit:
                        permission.canEdit,

                    canDelete:
                        permission.canDelete,

                    canExport:
                        permission.canExport,
                }));

            await apiRequest(
                `/Roles/${selectedRole.roleId}/permissions`,
                {
                    method: "PUT",
                    body: JSON.stringify(payload),
                }
            );

            setMessage(
                `PERMISSIONS SAVED FOR ${selectedRole.roleName}.`
            );

            await loadPermissions(
                selectedRole
            );

        } catch (err: any) {

            setError(
                err.message ||
                "Unable to save permissions."
            );

        } finally {

            setSavingPermissions(false);

        }
    };


    // ========================================================
    // FILTER USERS
    // ========================================================

    const filteredUsers =
        useMemo(() => {

            const search =
                searchUser
                    .trim()
                    .toLowerCase();

            if (!search) {
                return users;
            }

            return users.filter(user =>
                user.fullName
                    .toLowerCase()
                    .includes(search) ||

                user.username
                    .toLowerCase()
                    .includes(search) ||

                (user.role || "")
                    .toLowerCase()
                    .includes(search)
            );

        }, [users, searchUser]);


    // ========================================================
    // FILTER ROLES
    // ========================================================

    const filteredRoles =
        useMemo(() => {

            const search =
                searchRole
                    .trim()
                    .toLowerCase();

            if (!search) {
                return roles;
            }

            return roles.filter(role =>
                role.roleName
                    .toLowerCase()
                    .includes(search) ||

                (role.description || "")
                    .toLowerCase()
                    .includes(search)
            );

        }, [roles, searchRole]);


    // ========================================================
    // STATISTICS
    // ========================================================

    const activeUsers =
        users.filter(
            user => user.isActive
        ).length;

    const activeRoles =
        roles.filter(
            role => role.isActive
        ).length;

    const totalPermissions =
        permissions.filter(
            p =>
                p.canView ||
                p.canCreate ||
                p.canEdit ||
                p.canDelete ||
                p.canExport
        ).length;


    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div className="epic-settings">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="settings-header">

                <div>

                    <div className="settings-eyebrow">
                        EPIC ADMINISTRATION CONSOLE
                    </div>

                    <h1>
                        System Settings
                    </h1>

                    <p>
                        Configure users, roles, access
                        permissions and system controls.
                    </p>

                </div>

                <div className="settings-header-status">

                    <span className="status-dot" />

                    SYSTEM ONLINE

                </div>

            </div>


            {/* ==================================================
                NOTIFICATIONS
            ================================================== */}

            {message && (
                <div className="settings-alert success">

                    <span>✓</span>

                    <span>
                        {message}
                    </span>

                    <button
                        onClick={() =>
                            setMessage("")
                        }
                    >
                        ×
                    </button>

                </div>
            )}


            {error && (
                <div className="settings-alert error">

                    <span>⚠</span>

                    <span>
                        {error}
                    </span>

                    <button
                        onClick={() =>
                            setError("")
                        }
                    >
                        ×
                    </button>

                </div>
            )}


            {/* ==================================================
                STAT CARDS
            ================================================== */}

            <div className="settings-stats">

                <div className="settings-stat-card">

                    <div className="stat-icon">
                        ◉
                    </div>

                    <div>
                        <span>
                            USERS
                        </span>

                        <strong>
                            {users.length}
                        </strong>

                        <small>
                            {activeUsers} active
                        </small>
                    </div>

                </div>


                <div className="settings-stat-card">

                    <div className="stat-icon">
                        ◆
                    </div>

                    <div>
                        <span>
                            ROLES
                        </span>

                        <strong>
                            {roles.length}
                        </strong>

                        <small>
                            {activeRoles} active
                        </small>
                    </div>

                </div>


                <div className="settings-stat-card">

                    <div className="stat-icon">
                        ◈
                    </div>

                    <div>
                        <span>
                            PERMISSIONS
                        </span>

                        <strong>
                            {totalPermissions}
                        </strong>

                        <small>
                            configured modules
                        </small>
                    </div>

                </div>


                <div className="settings-stat-card">

                    <div className="stat-icon">
                        ✓
                    </div>

                    <div>
                        <span>
                            SECURITY
                        </span>

                        <strong>
                            JWT
                        </strong>

                        <small>
                            Authentication active
                        </small>
                    </div>

                </div>

            </div>


            {/* ==================================================
                TABS
            ================================================== */}

            <div className="settings-tabs">

                <button
                    className={
                        activeTab === "overview"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab("overview")
                    }
                >
                    <span>⌂</span>
                    Overview
                </button>

                <button
                    className={
                        activeTab === "users"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab("users")
                    }
                >
                    <span>♙</span>
                    Users
                </button>

                <button
                    className={
                        activeTab === "roles"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab("roles")
                    }
                >
                    <span>◆</span>
                    Roles
                </button>

                <button
                    className={
                        activeTab === "permissions"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab("permissions")
                    }
                >
                    <span>⌁</span>
                    Permissions
                </button>

            </div>


            {/* ==================================================
                OVERVIEW
            ================================================== */}

            {activeTab === "overview" && (

                <div className="settings-panel">

                    <div className="panel-title">

                        <div>

                            <h2>
                                Administration Center
                            </h2>

                            <p>
                                Manage access to the EPIC
                                Church Management System.
                            </p>

                        </div>

                    </div>


                    <div className="overview-grid">

                        <button
                            className="overview-card"
                            onClick={() =>
                                setActiveTab("users")
                            }
                        >

                            <div className="overview-icon">
                                ♙
                            </div>

                            <div>

                                <h3>
                                    User Management
                                </h3>

                                <p>
                                    Create accounts, assign
                                    roles, edit users,
                                    change passwords and
                                    manage account status.
                                </p>

                                <span>
                                    {users.length} registered users →
                                </span>

                            </div>

                        </button>


                        <button
                            className="overview-card"
                            onClick={() =>
                                setActiveTab("roles")
                            }
                        >

                            <div className="overview-icon">
                                ◆
                            </div>

                            <div>

                                <h3>
                                    Role Management
                                </h3>

                                <p>
                                    Create and manage
                                    administrative roles
                                    throughout EPIC.
                                </p>

                                <span>
                                    {roles.length} roles configured →
                                </span>

                            </div>

                        </button>


                        <button
                            className="overview-card"
                            onClick={() =>
                                setActiveTab("permissions")
                            }
                        >

                            <div className="overview-icon">
                                ⛨
                            </div>

                            <div>

                                <h3>
                                    Permission Matrix
                                </h3>

                                <p>
                                    Control View, Create,
                                    Edit, Delete and Export
                                    access by module.
                                </p>

                                <span>
                                    Configure access →
                                </span>

                            </div>

                        </button>

                    </div>


                    <div className="security-banner">

                        <div className="security-banner-icon">
                            ⛨
                        </div>

                        <div>

                            <strong>
                                EPIC ACCESS CONTROL
                            </strong>

                            <p>
                                User authentication is handled
                                through JWT tokens and role-based
                                access permissions.
                            </p>

                        </div>

                    </div>

                </div>
            )}


            {/* ==================================================
                USERS
            ================================================== */}

            {activeTab === "users" && (

                <div className="settings-panel">

                    <div className="panel-toolbar">

                        <div>

                            <h2>
                                User Management
                            </h2>

                            <p>
                                Manage EPIC system accounts.
                            </p>

                        </div>

                        <div className="toolbar-actions">

                            <div className="search-box">

                                <span>
                                    ⌕
                                </span>

                                <input
                                    value={searchUser}
                                    onChange={e =>
                                        setSearchUser(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Search users..."
                                />

                            </div>

                            <button
                                className="primary-button"
                                onClick={() => {

                                    clearNotifications();

                                    setUserForm({
                                        username: "",
                                        password: "",
                                        fullName: "",
                                        roleId: 0,
                                    });

                                    setShowCreateUser(true);

                                }}
                            >
                                ＋ Add User
                            </button>

                        </div>

                    </div>


                    <div className="table-container">

                        <table className="epic-table">

                            <thead>

                                <tr>

                                    <th>
                                        USER
                                    </th>

                                    <th>
                                        USERNAME
                                    </th>

                                    <th>
                                        ROLE
                                    </th>

                                    <th>
                                        STATUS
                                    </th>

                                    <th>
                                        CREATED
                                    </th>

                                    <th>
                                        ACTIONS
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {loadingUsers ? (

                                    <tr>

                                        <td
                                            colSpan={6}
                                            className="table-loading"
                                        >
                                            Loading users...
                                        </td>

                                    </tr>

                                ) : filteredUsers.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan={6}
                                            className="table-empty"
                                        >
                                            No users found.
                                        </td>

                                    </tr>

                                ) : (

                                    filteredUsers.map(user => (

                                        <tr
                                            key={user.userId}
                                        >

                                            <td>

                                                <div className="user-cell">

                                                    <div className="user-avatar">
                                                        {user.fullName
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {user.fullName}
                                                        </strong>

                                                        <small>
                                                            ID #{user.userId}
                                                        </small>

                                                    </div>

                                                </div>

                                            </td>


                                            <td>

                                                <code>
                                                    {user.username}
                                                </code>

                                            </td>


                                            <td>

                                                <span className="role-chip">
                                                    {user.role || "NO ROLE"}
                                                </span>

                                            </td>


                                            <td>

                                                <span
                                                    className={
                                                        user.isActive
                                                            ? "status-chip active"
                                                            : "status-chip inactive"
                                                    }
                                                >

                                                    <span />

                                                    {user.isActive
                                                        ? "ACTIVE"
                                                        : "INACTIVE"}

                                                </span>

                                            </td>


                                            <td>

                                                {new Date(
                                                    user.createdDate
                                                ).toLocaleDateString()}

                                            </td>


                                            <td>

                                                <div className="action-buttons">

                                                    <button
                                                        title="Edit user"
                                                        onClick={() =>
                                                            openEditUser(user)
                                                        }
                                                    >
                                                        ✎
                                                    </button>

                                                    <button
                                                        title="Change password"
                                                        onClick={() =>
                                                            openPasswordModal(
                                                                user
                                                            )
                                                        }
                                                    >
                                                        🔑
                                                    </button>

                                                    <button
                                                        title={
                                                            user.isActive
                                                                ? "Deactivate"
                                                                : "Activate"
                                                        }
                                                        onClick={() =>
                                                            toggleUserStatus(
                                                                user
                                                            )
                                                        }
                                                    >
                                                        {user.isActive
                                                            ? "◉"
                                                            : "○"}
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    ))

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>
            )}


            {/* ==================================================
                ROLES
            ================================================== */}

            {activeTab === "roles" && (

                <div className="settings-panel">

                    <div className="panel-toolbar">

                        <div>

                            <h2>
                                Role Management
                            </h2>

                            <p>
                                Define access roles for EPIC users.
                            </p>

                        </div>

                        <div className="toolbar-actions">

                            <div className="search-box">

                                <span>
                                    ⌕
                                </span>

                                <input
                                    value={searchRole}
                                    onChange={e =>
                                        setSearchRole(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Search roles..."
                                />

                            </div>

                            <button
                                className="primary-button"
                                onClick={() => {

                                    clearNotifications();

                                    setRoleForm({
                                        roleName: "",
                                        description: "",
                                        isActive: true,
                                    });

                                    setShowCreateRole(true);

                                }}
                            >
                                ＋ Add Role
                            </button>

                        </div>

                    </div>


                    <div className="role-grid">

                        {loadingRoles ? (

                            <div className="large-loading">
                                Loading roles...
                            </div>

                        ) : filteredRoles.length === 0 ? (

                            <div className="large-empty">
                                No roles found.
                            </div>

                        ) : (

                            filteredRoles.map(role => (

                                <div
                                    className={
                                        `role-card ${role.isActive
                                            ? ""
                                            : "role-inactive"
                                        }`
                                    }
                                    key={role.roleId}
                                >

                                    <div className="role-card-top">

                                        <div className="role-symbol">
                                            ◆
                                        </div>

                                        <span
                                            className={
                                                role.isActive
                                                    ? "status-chip active"
                                                    : "status-chip inactive"
                                            }
                                        >
                                            {role.isActive
                                                ? "ACTIVE"
                                                : "INACTIVE"}
                                        </span>

                                    </div>


                                    <h3>
                                        {role.roleName}
                                    </h3>

                                    <p>
                                        {role.description ||
                                            "No description provided."}
                                    </p>


                                    <div className="role-meta">

                                        <span>
                                            ♙ {role.userCount} users
                                        </span>

                                        <span>
                                            ID #{role.roleId}
                                        </span>

                                    </div>


                                    <div className="role-card-actions">

                                        <button
                                            onClick={() =>
                                                openEditRole(
                                                    role
                                                )
                                            }
                                        >
                                            ✎ Edit
                                        </button>

                                        <button
                                            onClick={() =>
                                                loadPermissions(
                                                    role
                                                )
                                            }
                                        >
                                            ⛨ Permissions
                                        </button>

                                        {role.isActive && (

                                            <button
                                                className="danger-action"
                                                onClick={() =>
                                                    deactivateRole(
                                                        role
                                                    )
                                                }
                                            >
                                                ◉ Deactivate
                                            </button>

                                        )}

                                    </div>

                                </div>

                            ))

                        )}

                    </div>

                </div>
            )}


            {/* ==================================================
                PERMISSIONS
            ================================================== */}

            {activeTab === "permissions" && (

                <div className="settings-panel">

                    <div className="panel-toolbar">

                        <div>

                            <h2>
                                Permission Matrix
                            </h2>

                            <p>
                                Configure module access by role.
                            </p>

                        </div>

                        <div className="toolbar-actions">

                            <select
                                className="role-selector"
                                value={
                                    selectedRole?.roleId || ""
                                }
                                onChange={e => {

                                    const role =
                                        roles.find(
                                            r =>
                                                r.roleId ===
                                                Number(
                                                    e.target.value
                                                )
                                        );

                                    if (role) {
                                        loadPermissions(role);
                                    }

                                }}
                            >

                                <option value="">
                                    Select Role
                                </option>

                                {roles
                                    .filter(
                                        role =>
                                            role.isActive
                                    )
                                    .map(role => (

                                        <option
                                            key={role.roleId}
                                            value={role.roleId}
                                        >
                                            {role.roleName}
                                        </option>

                                    ))}

                            </select>

                            <button
                                className="primary-button"
                                disabled={
                                    !selectedRole ||
                                    savingPermissions
                                }
                                onClick={
                                    savePermissions
                                }
                            >
                                {savingPermissions
                                    ? "Saving..."
                                    : "✓ Save Permissions"}
                            </button>

                        </div>

                    </div>


                    {!selectedRole ? (

                        <div className="permission-empty">

                            <div>
                                ⛨
                            </div>

                            <h3>
                                Select a Role
                            </h3>

                            <p>
                                Choose a role above to
                                configure its module
                                permissions.
                            </p>

                        </div>

                    ) : loadingPermissions ? (

                        <div className="permission-empty">

                            <div>
                                ◌
                            </div>

                            <h3>
                                Loading permissions...
                            </h3>

                        </div>

                    ) : (

                        <>

                            <div className="permission-role-header">

                                <div>

                                    <span>
                                        CONFIGURING ROLE
                                    </span>

                                    <strong>
                                        {selectedRole.roleName}
                                    </strong>

                                </div>

                                <div>
                                    {permissions.length}
                                    {" "}modules
                                </div>

                            </div>


                            <div className="permission-table-container">

                                <table className="permission-table">

                                    <thead>

                                        <tr>

                                            <th>
                                                MODULE
                                            </th>

                                            <th>
                                                <PermissionHeader
                                                    label="VIEW"
                                                    onAll={() =>
                                                        setAllPermissions(
                                                            "canView",
                                                            true
                                                        )
                                                    }
                                                />
                                            </th>

                                            <th>
                                                <PermissionHeader
                                                    label="CREATE"
                                                    onAll={() =>
                                                        setAllPermissions(
                                                            "canCreate",
                                                            true
                                                        )
                                                    }
                                                />
                                            </th>

                                            <th>
                                                <PermissionHeader
                                                    label="EDIT"
                                                    onAll={() =>
                                                        setAllPermissions(
                                                            "canEdit",
                                                            true
                                                        )
                                                    }
                                                />
                                            </th>

                                            <th>
                                                <PermissionHeader
                                                    label="DELETE"
                                                    onAll={() =>
                                                        setAllPermissions(
                                                            "canDelete",
                                                            true
                                                        )
                                                    }
                                                />
                                            </th>

                                            <th>
                                                <PermissionHeader
                                                    label="EXPORT"
                                                    onAll={() =>
                                                        setAllPermissions(
                                                            "canExport",
                                                            true
                                                        )
                                                    }
                                                />
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {permissions.map(
                                            (
                                                permission,
                                                index
                                            ) => (

                                                <tr
                                                    key={
                                                        permission.module
                                                    }
                                                >

                                                    <td>

                                                        <div className="permission-module">

                                                            <div>
                                                                ◈
                                                            </div>

                                                            <strong>
                                                                {
                                                                    permission.module
                                                                }
                                                            </strong>

                                                        </div>

                                                    </td>


                                                    <td>
                                                        <PermissionToggle
                                                            checked={
                                                                permission.canView
                                                            }
                                                            onChange={
                                                                value =>
                                                                    updatePermission(
                                                                        index,
                                                                        "canView",
                                                                        value
                                                                    )
                                                            }
                                                        />
                                                    </td>


                                                    <td>
                                                        <PermissionToggle
                                                            checked={
                                                                permission.canCreate
                                                            }
                                                            onChange={
                                                                value =>
                                                                    updatePermission(
                                                                        index,
                                                                        "canCreate",
                                                                        value
                                                                    )
                                                            }
                                                        />
                                                    </td>


                                                    <td>
                                                        <PermissionToggle
                                                            checked={
                                                                permission.canEdit
                                                            }
                                                            onChange={
                                                                value =>
                                                                    updatePermission(
                                                                        index,
                                                                        "canEdit",
                                                                        value
                                                                    )
                                                            }
                                                        />
                                                    </td>


                                                    <td>
                                                        <PermissionToggle
                                                            checked={
                                                                permission.canDelete
                                                            }
                                                            onChange={
                                                                value =>
                                                                    updatePermission(
                                                                        index,
                                                                        "canDelete",
                                                                        value
                                                                    )
                                                            }
                                                        />
                                                    </td>


                                                    <td>
                                                        <PermissionToggle
                                                            checked={
                                                                permission.canExport
                                                            }
                                                            onChange={
                                                                value =>
                                                                    updatePermission(
                                                                        index,
                                                                        "canExport",
                                                                        value
                                                                    )
                                                            }
                                                        />
                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        </>

                    )}

                </div>
            )}


            {/* ==================================================
                CREATE USER MODAL
            ================================================== */}

            {showCreateUser && (

                <Modal
                    title="Create EPIC User"
                    subtitle="Add a new system account."
                    onClose={() =>
                        setShowCreateUser(false)
                    }
                >

                    <form
                        onSubmit={
                            handleCreateUser
                        }
                    >

                        <FormField
                            label="Full Name"
                            required
                        >

                            <input
                                className="epic-input"
                                value={
                                    userForm.fullName
                                }
                                onChange={e =>
                                    setUserForm({
                                        ...userForm,
                                        fullName:
                                            e.target.value,
                                    })
                                }
                                placeholder="EPIC Church Staff"
                            />

                        </FormField>


                        <FormField
                            label="Username"
                            required
                        >

                            <input
                                className="epic-input"
                                value={
                                    userForm.username
                                }
                                onChange={e =>
                                    setUserForm({
                                        ...userForm,
                                        username:
                                            e.target.value,
                                    })
                                }
                                placeholder="staff"
                                autoComplete="off"
                            />

                        </FormField>


                        <FormField
                            label="Password"
                            required
                        >

                            <div className="password-input">

                                <input
                                    className="epic-input"
                                    type={
                                        showPasswordValue
                                            ? "text"
                                            : "password"
                                    }
                                    value={
                                        userForm.password
                                    }
                                    onChange={e =>
                                        setUserForm({
                                            ...userForm,
                                            password:
                                                e.target.value,
                                        })
                                    }
                                    placeholder="Minimum 6 characters"
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPasswordValue(
                                            !showPasswordValue
                                        )
                                    }
                                >
                                    {showPasswordValue
                                        ? "◉"
                                        : "○"}
                                </button>

                            </div>

                        </FormField>


                        <FormField
                            label="Role"
                            required
                        >

                            <select
                                className="epic-input"
                                value={
                                    userForm.roleId
                                }
                                onChange={e =>
                                    setUserForm({
                                        ...userForm,
                                        roleId:
                                            Number(
                                                e.target.value
                                            ),
                                    })
                                }
                            >

                                <option value={0}>
                                    Select Role
                                </option>

                                {roles
                                    .filter(
                                        role =>
                                            role.isActive
                                    )
                                    .map(role => (

                                        <option
                                            key={
                                                role.roleId
                                            }
                                            value={
                                                role.roleId
                                            }
                                        >
                                            {role.roleName}
                                        </option>

                                    ))}

                            </select>

                        </FormField>


                        <ModalActions
                            onCancel={() =>
                                setShowCreateUser(false)
                            }
                            submitText={
                                processing
                                    ? "Creating..."
                                    : "Create User"
                            }
                            disabled={
                                processing
                            }
                        />

                    </form>

                </Modal>

            )}


            {/* ==================================================
                EDIT USER MODAL
            ================================================== */}

            {showEditUser && selectedUser && (

                <Modal
                    title="Edit User"
                    subtitle={`Account: ${selectedUser.username}`}
                    onClose={() =>
                        setShowEditUser(false)
                    }
                >

                    <form
                        onSubmit={
                            handleUpdateUser
                        }
                    >

                        <FormField
                            label="Username"
                        >

                            <input
                                className="epic-input readonly"
                                value={
                                    selectedUser.username
                                }
                                disabled
                            />

                        </FormField>


                        <FormField
                            label="Full Name"
                            required
                        >

                            <input
                                className="epic-input"
                                value={
                                    editUserForm.fullName
                                }
                                onChange={e =>
                                    setEditUserForm({
                                        ...editUserForm,
                                        fullName:
                                            e.target.value,
                                    })
                                }
                            />

                        </FormField>


                        <FormField
                            label="Role"
                            required
                        >

                            <select
                                className="epic-input"
                                value={
                                    editUserForm.roleId
                                }
                                onChange={e =>
                                    setEditUserForm({
                                        ...editUserForm,
                                        roleId:
                                            Number(
                                                e.target.value
                                            ),
                                    })
                                }
                            >

                                {roles
                                    .filter(
                                        role =>
                                            role.isActive
                                    )
                                    .map(role => (

                                        <option
                                            key={
                                                role.roleId
                                            }
                                            value={
                                                role.roleId
                                            }
                                        >
                                            {role.roleName}
                                        </option>

                                    ))}

                            </select>

                        </FormField>


                        <label className="switch-row">

                            <div>

                                <strong>
                                    Account Active
                                </strong>

                                <span>
                                    Allow this user to log in.
                                </span>

                            </div>

                            <input
                                type="checkbox"
                                checked={
                                    editUserForm.isActive
                                }
                                onChange={e =>
                                    setEditUserForm({
                                        ...editUserForm,
                                        isActive:
                                            e.target.checked,
                                    })
                                }
                            />

                        </label>


                        <ModalActions
                            onCancel={() =>
                                setShowEditUser(false)
                            }
                            submitText={
                                processing
                                    ? "Saving..."
                                    : "Save Changes"
                            }
                            disabled={
                                processing
                            }
                        />

                    </form>

                </Modal>

            )}


            {/* ==================================================
                PASSWORD MODAL
            ================================================== */}

            {showPassword && selectedUser && (

                <Modal
                    title="Reset Password"
                    subtitle={`Change password for ${selectedUser.username}`}
                    onClose={() =>
                        setShowPassword(false)
                    }
                >

                    <form
                        onSubmit={
                            handleChangePassword
                        }
                    >

                        <div className="password-warning">

                            <span>
                                🔐
                            </span>

                            <p>
                                The new password will immediately
                                replace the user's existing password.
                            </p>

                        </div>


                        <FormField
                            label="New Password"
                            required
                        >

                            <div className="password-input">

                                <input
                                    className="epic-input"
                                    type={
                                        showNewPasswordValue
                                            ? "text"
                                            : "password"
                                    }
                                    value={
                                        newPassword
                                    }
                                    onChange={e =>
                                        setNewPassword(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Minimum 6 characters"
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowNewPasswordValue(
                                            !showNewPasswordValue
                                        )
                                    }
                                >
                                    {showNewPasswordValue
                                        ? "◉"
                                        : "○"}
                                </button>

                            </div>

                        </FormField>


                        <ModalActions
                            onCancel={() =>
                                setShowPassword(false)
                            }
                            submitText={
                                processing
                                    ? "Updating..."
                                    : "Update Password"
                            }
                            disabled={
                                processing
                            }
                        />

                    </form>

                </Modal>

            )}


            {/* ==================================================
                CREATE ROLE MODAL
            ================================================== */}

            {showCreateRole && (

                <Modal
                    title="Create Role"
                    subtitle="Add a new access role."
                    onClose={() =>
                        setShowCreateRole(false)
                    }
                >

                    <form
                        onSubmit={
                            handleCreateRole
                        }
                    >

                        <FormField
                            label="Role Name"
                            required
                        >

                            <input
                                className="epic-input"
                                value={
                                    roleForm.roleName
                                }
                                onChange={e =>
                                    setRoleForm({
                                        ...roleForm,
                                        roleName:
                                            e.target.value,
                                    })
                                }
                                placeholder="MINISTRY LEADER"
                            />

                        </FormField>


                        <FormField
                            label="Description"
                        >

                            <textarea
                                className="epic-input epic-textarea"
                                value={
                                    roleForm.description
                                }
                                onChange={e =>
                                    setRoleForm({
                                        ...roleForm,
                                        description:
                                            e.target.value,
                                    })
                                }
                                placeholder="Describe this role..."
                                rows={4}
                            />

                        </FormField>


                        <ModalActions
                            onCancel={() =>
                                setShowCreateRole(false)
                            }
                            submitText={
                                processing
                                    ? "Creating..."
                                    : "Create Role"
                            }
                            disabled={
                                processing
                            }
                        />

                    </form>

                </Modal>

            )}


            {/* ==================================================
                EDIT ROLE MODAL
            ================================================== */}

            {showEditRole && selectedRole && (

                <Modal
                    title="Edit Role"
                    subtitle={`Role ID #${selectedRole.roleId}`}
                    onClose={() =>
                        setShowEditRole(false)
                    }
                >

                    <form
                        onSubmit={
                            handleUpdateRole
                        }
                    >

                        <FormField
                            label="Role Name"
                            required
                        >

                            <input
                                className="epic-input"
                                value={
                                    roleForm.roleName
                                }
                                onChange={e =>
                                    setRoleForm({
                                        ...roleForm,
                                        roleName:
                                            e.target.value,
                                    })
                                }
                            />

                        </FormField>


                        <FormField
                            label="Description"
                        >

                            <textarea
                                className="epic-input epic-textarea"
                                value={
                                    roleForm.description
                                }
                                onChange={e =>
                                    setRoleForm({
                                        ...roleForm,
                                        description:
                                            e.target.value,
                                    })
                                }
                                rows={4}
                            />

                        </FormField>


                        <label className="switch-row">

                            <div>

                                <strong>
                                    Role Active
                                </strong>

                                <span>
                                    Active roles can be assigned
                                    to new users.
                                </span>

                            </div>

                            <input
                                type="checkbox"
                                checked={
                                    roleForm.isActive
                                }
                                onChange={e =>
                                    setRoleForm({
                                        ...roleForm,
                                        isActive:
                                            e.target.checked,
                                    })
                                }
                            />

                        </label>


                        <ModalActions
                            onCancel={() =>
                                setShowEditRole(false)
                            }
                            submitText={
                                processing
                                    ? "Saving..."
                                    : "Save Role"
                            }
                            disabled={
                                processing
                            }
                        />

                    </form>

                </Modal>

            )}

        </div>
    );
};


// ============================================================
// PERMISSION HEADER
// ============================================================

interface PermissionHeaderProps {
    label: string;
    onAll: () => void;
}

const PermissionHeader: React.FC<
    PermissionHeaderProps
> = ({
    label,
    onAll,
}) => {

        return (
            <div className="permission-header">

                <span>
                    {label}
                </span>

                <button
                    type="button"
                    title={`Enable ${label} for all modules`}
                    onClick={onAll}
                >
                    ALL
                </button>

            </div>
        );
    };


// ============================================================
// PERMISSION TOGGLE
// ============================================================

interface PermissionToggleProps {
    checked: boolean;
    onChange: (value: boolean) => void;
}

const PermissionToggle: React.FC<
    PermissionToggleProps
> = ({
    checked,
    onChange,
}) => {

        return (
            <button
                type="button"
                className={
                    `permission-toggle ${checked ? "checked" : ""
                    }`
                }
                onClick={() =>
                    onChange(!checked)
                }
                aria-pressed={checked}
            >

                <span>
                    {checked ? "✓" : ""}
                </span>

            </button>
        );
    };


// ============================================================
// FORM FIELD
// ============================================================

interface FormFieldProps {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
    label,
    required,
    children,
}) => {

    return (
        <div className="form-field">

            <label>

                {label}

                {required && (
                    <span>
                        *
                    </span>
                )}

            </label>

            {children}

        </div>
    );
};


// ============================================================
// MODAL
// ============================================================

interface ModalProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({
    title,
    subtitle,
    children,
    onClose,
}) => {

    return (
        <div
            className="modal-backdrop"
            onMouseDown={e => {

                if (
                    e.target ===
                    e.currentTarget
                ) {
                    onClose();
                }

            }}
        >

            <div className="epic-modal">

                <div className="modal-header">

                    <div>

                        <div className="modal-eyebrow">
                            EPIC SYSTEM
                        </div>

                        <h2>
                            {title}
                        </h2>

                        {subtitle && (
                            <p>
                                {subtitle}
                            </p>
                        )}

                    </div>

                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}
                    >
                        ×
                    </button>

                </div>


                <div className="modal-body">

                    {children}

                </div>

            </div>

        </div>
    );
};


// ============================================================
// MODAL ACTIONS
// ============================================================

interface ModalActionsProps {
    onCancel: () => void;
    submitText: string;
    disabled?: boolean;
}

const ModalActions: React.FC<
    ModalActionsProps
> = ({
    onCancel,
    submitText,
    disabled,
}) => {

        return (
            <div className="modal-actions">

                <button
                    type="button"
                    className="secondary-button"
                    onClick={onCancel}
                    disabled={disabled}
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    className="primary-button"
                    disabled={disabled}
                >
                    {submitText}
                </button>

            </div>
        );
    };


// ============================================================
// STYLES
// ============================================================

const styles = `
/* ============================================================
   EPIC SETTINGS — FUTURISTIC ADMIN CONSOLE
============================================================ */

.epic-settings {
    min-height: 100%;
    padding: 30px;
    color: #e8eefc;
    background:
        radial-gradient(
            circle at 10% 0%,
            rgba(0, 180, 255, .08),
            transparent 30%
        ),
        radial-gradient(
            circle at 90% 10%,
            rgba(120, 70, 255, .08),
            transparent 30%
        ),
        #07101d;
}


/* HEADER */

.settings-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 25px;
}

.settings-eyebrow {
    color: #55d9ff;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 2px;
    margin-bottom: 8px;
}

.settings-header h1 {
    margin: 0;
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -.5px;
}

.settings-header p {
    margin: 8px 0 0;
    color: #8291aa;
    font-size: 14px;
}

.settings-header-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 15px;
    border: 1px solid rgba(76, 221, 173, .25);
    border-radius: 999px;
    color: #62e5b6;
    background: rgba(76, 221, 173, .06);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.5px;
}

.status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #52e6b0;
    box-shadow: 0 0 12px rgba(82, 230, 176, .8);
}


/* ALERTS */

.settings-alert {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 16px;
    margin-bottom: 18px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 700;
}

.settings-alert.success {
    border: 1px solid rgba(67, 224, 164, .25);
    background: rgba(67, 224, 164, .08);
    color: #6af0bd;
}

.settings-alert.error {
    border: 1px solid rgba(255, 91, 109, .3);
    background: rgba(255, 91, 109, .08);
    color: #ff8795;
}

.settings-alert button {
    margin-left: auto;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 20px;
    cursor: pointer;
}


/* STATS */

.settings-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    margin-bottom: 22px;
}

.settings-stat-card {
    display: flex;
    align-items: center;
    gap: 15px;
    min-height: 105px;
    padding: 18px;
    border: 1px solid rgba(124, 154, 200, .13);
    border-radius: 16px;
    background: rgba(14, 26, 44, .8);
    box-shadow: inset 0 1px rgba(255,255,255,.025);
}

.stat-icon {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 13px;
    color: #59dcff;
    background: rgba(55, 196, 255, .09);
    border: 1px solid rgba(55, 196, 255, .18);
    font-size: 20px;
}

.settings-stat-card span,
.settings-stat-card small {
    display: block;
    color: #6e809d;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.5px;
}

.settings-stat-card strong {
    display: block;
    margin: 4px 0;
    color: #f2f7ff;
    font-size: 24px;
}

.settings-stat-card small {
    color: #8291aa;
    font-size: 10px;
    letter-spacing: 0;
    font-weight: 500;
}


/* TABS */

.settings-tabs {
    display: flex;
    gap: 5px;
    padding: 6px;
    margin-bottom: 18px;
    border: 1px solid rgba(124,154,200,.12);
    border-radius: 14px;
    background: rgba(10,19,32,.75);
}

.settings-tabs button {
    flex: 1;
    padding: 12px 16px;
    border: 0;
    border-radius: 9px;
    color: #7f90aa;
    background: transparent;
    cursor: pointer;
    font-weight: 700;
    transition: .2s;
}

.settings-tabs button:hover {
    color: #dbeaff;
    background: rgba(255,255,255,.035);
}

.settings-tabs button.active {
    color: #5fe0ff;
    background: rgba(55,196,255,.09);
    box-shadow: inset 0 0 0 1px rgba(55,196,255,.12);
}

.settings-tabs span {
    margin-right: 7px;
}


/* PANEL */

.settings-panel {
    border: 1px solid rgba(124,154,200,.13);
    border-radius: 18px;
    background: rgba(9,19,33,.82);
    overflow: hidden;
}

.panel-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    padding: 22px;
    border-bottom: 1px solid rgba(124,154,200,.1);
}

.panel-toolbar h2,
.panel-title h2 {
    margin: 0;
    font-size: 19px;
}

.panel-toolbar p,
.panel-title p {
    margin: 5px 0 0;
    color: #71839e;
    font-size: 12px;
}

.toolbar-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}


/* SEARCH */

.search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 210px;
    padding: 9px 12px;
    border: 1px solid rgba(124,154,200,.16);
    border-radius: 9px;
    background: #07111f;
}

.search-box span {
    color: #63809f;
}

.search-box input {
    width: 100%;
    border: 0;
    outline: 0;
    color: #dbe9fa;
    background: transparent;
}


/* BUTTONS */

.primary-button,
.secondary-button {
    border: 0;
    border-radius: 9px;
    padding: 10px 16px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 800;
    transition: .2s;
}

.primary-button {
    color: #03101b;
    background: linear-gradient(
        135deg,
        #58ddff,
        #5ca9ff
    );
    box-shadow: 0 5px 20px rgba(62,192,255,.14);
}

.primary-button:hover {
    transform: translateY(-1px);
    filter: brightness(1.08);
}

.primary-button:disabled,
.secondary-button:disabled {
    opacity: .5;
    cursor: not-allowed;
    transform: none;
}

.secondary-button {
    color: #b6c4d8;
    background: #172437;
    border: 1px solid rgba(124,154,200,.15);
}


/* TABLE */

.table-container {
    overflow-x: auto;
}

.epic-table,
.permission-table {
    width: 100%;
    border-collapse: collapse;
}

.epic-table th,
.permission-table th {
    padding: 13px 18px;
    text-align: left;
    color: #667993;
    background: rgba(255,255,255,.018);
    font-size: 9px;
    letter-spacing: 1.2px;
}

.epic-table td {
    padding: 15px 18px;
    border-top: 1px solid rgba(124,154,200,.07);
    color: #a9b8cc;
    font-size: 12px;
}

.epic-table tbody tr:hover {
    background: rgba(75,194,255,.025);
}

.table-loading,
.table-empty {
    padding: 50px !important;
    text-align: center !important;
    color: #637590 !important;
}


/* USER CELL */

.user-cell {
    display: flex;
    align-items: center;
    gap: 11px;
}

.user-avatar {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    color: #5bdfff;
    background: rgba(59,203,255,.08);
    border: 1px solid rgba(59,203,255,.15);
    font-weight: 800;
}

.user-cell strong {
    display: block;
    color: #e3edf9;
}

.user-cell small {
    display: block;
    margin-top: 3px;
    color: #61738e;
    font-size: 9px;
}

code {
    color: #79cfff;
    font-family: Consolas, monospace;
}


/* CHIPS */

.role-chip {
    display: inline-block;
    padding: 5px 9px;
    border-radius: 6px;
    color: #a8d9ff;
    background: rgba(68,170,255,.08);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .7px;
}

.status-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 9px;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: .7px;
}

.status-chip span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
}

.status-chip.active {
    color: #65e8b8;
    background: rgba(61,220,161,.07);
}

.status-chip.active span {
    background: #55e0ad;
}

.status-chip.inactive {
    color: #ff8d9a;
    background: rgba(255,91,109,.07);
}


/* ACTION BUTTONS */

.action-buttons {
    display: flex;
    gap: 5px;
}

.action-buttons button {
    width: 30px;
    height: 30px;
    border: 1px solid rgba(124,154,200,.12);
    border-radius: 7px;
    color: #91a5c0;
    background: #101e31;
    cursor: pointer;
}

.action-buttons button:hover {
    color: #5edfff;
    border-color: rgba(75,210,255,.3);
}


/* OVERVIEW */

.overview-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    padding: 22px;
}

.overview-card {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    padding: 20px;
    text-align: left;
    border: 1px solid rgba(124,154,200,.11);
    border-radius: 14px;
    color: inherit;
    background: rgba(17,30,49,.65);
    cursor: pointer;
    transition: .2s;
}

.overview-card:hover {
    transform: translateY(-2px);
    border-color: rgba(79,211,255,.25);
    background: rgba(23,39,62,.8);
}

.overview-icon {
    display: grid;
    place-items: center;
    flex: 0 0 45px;
    height: 45px;
    border-radius: 11px;
    color: #60dcff;
    background: rgba(59,205,255,.08);
}

.overview-card h3 {
    margin: 0 0 7px;
    color: #e2edf9;
    font-size: 15px;
}

.overview-card p {
    margin: 0 0 12px;
    color: #71839c;
    font-size: 11px;
    line-height: 1.6;
}

.overview-card span {
    color: #55d9ff;
    font-size: 10px;
    font-weight: 700;
}

.security-banner {
    display: flex;
    gap: 14px;
    margin: 0 22px 22px;
    padding: 16px;
    border: 1px solid rgba(93,151,255,.14);
    border-radius: 12px;
    background: rgba(63,113,220,.05);
}

.security-banner-icon {
    color: #62cfff;
    font-size: 22px;
}

.security-banner strong {
    font-size: 11px;
    letter-spacing: 1px;
}

.security-banner p {
    margin: 5px 0 0;
    color: #71839e;
    font-size: 11px;
}


/* ROLES */

.role-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    padding: 22px;
}

.role-card {
    padding: 19px;
    border: 1px solid rgba(124,154,200,.12);
    border-radius: 14px;
    background: rgba(16,29,47,.7);
}

.role-card:hover {
    border-color: rgba(80,210,255,.22);
}

.role-card.role-inactive {
    opacity: .62;
}

.role-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.role-symbol {
    color: #60dfff;
    font-size: 18px;
}

.role-card h3 {
    margin: 18px 0 7px;
    font-size: 16px;
    color: #e3eefb;
}

.role-card p {
    min-height: 36px;
    color: #72849d;
    font-size: 11px;
    line-height: 1.5;
}

.role-meta {
    display: flex;
    justify-content: space-between;
    margin: 15px 0;
    padding-top: 12px;
    border-top: 1px solid rgba(124,154,200,.08);
    color: #637792;
    font-size: 10px;
}

.role-card-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.role-card-actions button {
    padding: 7px 9px;
    border: 1px solid rgba(124,154,200,.13);
    border-radius: 7px;
    color: #a5b7cd;
    background: #101e30;
    cursor: pointer;
    font-size: 9px;
    font-weight: 700;
}

.role-card-actions button:hover {
    color: #60dfff;
    border-color: rgba(80,210,255,.25);
}

.role-card-actions .danger-action {
    color: #ff8997;
}

.large-loading,
.large-empty {
    grid-column: 1 / -1;
    padding: 60px;
    text-align: center;
    color: #637590;
}


/* PERMISSIONS */

.role-selector {
    min-width: 170px;
    padding: 10px 12px;
    border: 1px solid rgba(124,154,200,.16);
    border-radius: 9px;
    outline: 0;
    color: #c9d9ed;
    background: #0b1727;
}

.permission-empty {
    padding: 70px 20px;
    text-align: center;
}

.permission-empty > div {
    margin-bottom: 15px;
    color: #55d9ff;
    font-size: 35px;
}

.permission-empty h3 {
    margin: 0;
    color: #d9e7f6;
}

.permission-empty p {
    color: #657893;
    font-size: 12px;
}

.permission-role-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 20px 22px;
    padding: 14px 16px;
    border: 1px solid rgba(72,210,255,.12);
    border-radius: 10px;
    background: rgba(55,196,255,.04);
}

.permission-role-header span {
    display: block;
    color: #637792;
    font-size: 8px;
    letter-spacing: 1.3px;
    font-weight: 800;
}

.permission-role-header strong {
    display: block;
    margin-top: 3px;
    color: #5bdfff;
    font-size: 15px;
}

.permission-role-header > div:last-child {
    color: #7386a0;
    font-size: 10px;
}

.permission-table-container {
    overflow-x: auto;
    margin: 0 22px 22px;
}

.permission-table {
    min-width: 750px;
}

.permission-table th,
.permission-table td {
    border-bottom: 1px solid rgba(124,154,200,.07);
}

.permission-table td {
    padding: 12px 14px;
    text-align: center;
}

.permission-table td:first-child,
.permission-table th:first-child {
    text-align: left;
}

.permission-module {
    display: flex;
    align-items: center;
    gap: 10px;
}

.permission-module > div {
    color: #54dfff;
}

.permission-module strong {
    color: #c7d5e6;
    font-size: 11px;
}

.permission-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
}

.permission-header button {
    border: 0;
    color: #4fdcff;
    background: transparent;
    font-size: 7px;
    cursor: pointer;
}

.permission-toggle {
    display: inline-grid;
    place-items: center;
    width: 27px;
    height: 27px;
    border: 1px solid rgba(124,154,200,.18);
    border-radius: 7px;
    color: transparent;
    background: #0b1726;
    cursor: pointer;
}

.permission-toggle.checked {
    border-color: rgba(74,219,255,.4);
    color: #03121b;
    background: #55dcff;
    box-shadow: 0 0 12px rgba(75,218,255,.15);
}

.permission-toggle span {
    font-size: 14px;
    font-weight: 900;
}


/* MODAL */

.modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(1,7,14,.78);
    backdrop-filter: blur(8px);
}

.epic-modal {
    width: min(520px, 100%);
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid rgba(84,213,255,.2);
    border-radius: 18px;
    background:
        radial-gradient(
            circle at 100% 0%,
            rgba(52,194,255,.07),
            transparent 35%
        ),
        #0a1625;
    box-shadow:
        0 25px 80px rgba(0,0,0,.55),
        0 0 40px rgba(46,188,255,.05);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    padding: 22px;
    border-bottom: 1px solid rgba(124,154,200,.1);
}

.modal-eyebrow {
    margin-bottom: 5px;
    color: #54dfff;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 1.5px;
}

.modal-header h2 {
    margin: 0;
    color: #e6f0fc;
    font-size: 19px;
}

.modal-header p {
    margin: 5px 0 0;
    color: #71849e;
    font-size: 11px;
}

.modal-close {
    width: 34px;
    height: 34px;
    border: 1px solid rgba(124,154,200,.13);
    border-radius: 8px;
    color: #8295ae;
    background: #101f32;
    cursor: pointer;
    font-size: 21px;
}

.modal-close:hover {
    color: #fff;
}

.modal-body {
    padding: 22px;
}


/* FORM */

.form-field {
    margin-bottom: 17px;
}

.form-field label {
    display: block;
    margin-bottom: 7px;
    color: #91a5be;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: .7px;
    text-transform: uppercase;
}

.form-field label span {
    margin-left: 3px;
    color: #ff7181;
}

.epic-input {
    width: 100%;
    box-sizing: border-box;
    padding: 11px 12px;
    border: 1px solid rgba(124,154,200,.15);
    border-radius: 9px;
    outline: 0;
    color: #dce9f7;
    background: #071321;
    font-family: inherit;
    font-size: 12px;
}

.epic-input:focus {
    border-color: rgba(74,211,255,.5);
    box-shadow: 0 0 0 3px rgba(74,211,255,.06);
}

.epic-input.readonly {
    opacity: .55;
}

.epic-textarea {
    resize: vertical;
}

.password-input {
    position: relative;
}

.password-input .epic-input {
    padding-right: 45px;
}

.password-input button {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    border: 0;
    color: #7087a3;
    background: transparent;
    cursor: pointer;
}

.password-warning {
    display: flex;
    gap: 10px;
    margin-bottom: 18px;
    padding: 12px;
    border: 1px solid rgba(255,190,80,.12);
    border-radius: 9px;
    color: #e0bb72;
    background: rgba(255,190,80,.05);
}

.password-warning p {
    margin: 0;
    font-size: 10px;
    line-height: 1.5;
}


/* SWITCH */

.switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin: 18px 0;
    padding: 13px;
    border: 1px solid rgba(124,154,200,.1);
    border-radius: 9px;
    background: rgba(255,255,255,.015);
}

.switch-row strong {
    display: block;
    color: #c8d7e9;
    font-size: 11px;
}

.switch-row span {
    display: block;
    margin-top: 3px;
    color: #667993;
    font-size: 9px;
}

.switch-row input {
    width: 18px;
    height: 18px;
    accent-color: #55dcff;
}


/* MODAL ACTIONS */

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 23px;
    padding-top: 18px;
    border-top: 1px solid rgba(124,154,200,.09);
}


/* RESPONSIVE */

@media (max-width: 1100px) {

    .settings-stats {
        grid-template-columns: repeat(2, 1fr);
    }

    .overview-grid,
    .role-grid {
        grid-template-columns: 1fr;
    }

}

@media (max-width: 800px) {

    .epic-settings {
        padding: 18px;
    }

    .settings-header {
        flex-direction: column;
    }

    .panel-toolbar {
        align-items: stretch;
        flex-direction: column;
    }

    .toolbar-actions {
        flex-wrap: wrap;
    }

    .search-box {
        flex: 1;
    }

    .settings-tabs {
        overflow-x: auto;
    }

    .settings-tabs button {
        min-width: 110px;
    }

}

@media (max-width: 520px) {

    .settings-stats {
        grid-template-columns: 1fr;
    }

    .settings-header h1 {
        font-size: 25px;
    }

    .toolbar-actions {
        flex-direction: column;
        align-items: stretch;
    }

    .search-box,
    .role-selector,
    .toolbar-actions .primary-button {
        width: 100%;
        box-sizing: border-box;
    }

}
`;


// ============================================================
// INJECT COMPONENT STYLES
// ============================================================

const styleId =
    "epic-settings-futuristic-styles";

if (
    typeof document !== "undefined" &&
    !document.getElementById(styleId)
) {

    const style =
        document.createElement("style");

    style.id = styleId;

    style.innerHTML = styles;

    document.head.appendChild(style);
}


// ============================================================
// EXPORT
// ============================================================

export default Settings;