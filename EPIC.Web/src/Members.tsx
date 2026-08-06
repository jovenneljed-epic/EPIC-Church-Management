import React, { useEffect, useMemo, useState } from "react";
import "./Members.css";
import PermissionService from "./PermissionService";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE_URL = "http://192.168.1.10:5109/api";

/* =========================================================
   TYPES
========================================================= */

interface Member {
    memberId: number;
    memberCode?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    suffix?: string;
    gender?: string;
    birthDate?: string;
    civilStatus?: string;
    contactNumber?: string;
    email?: string;
    address?: string;
    ministry?: string;
    status?: string;
    dateJoined?: string;
    occupation?: string;
    notes?: string;
}

interface MemberForm {
    memberCode: string;
    firstName: string;
    middleName: string;
    lastName: string;
    suffix: string;
    gender: string;
    birthDate: string;
    civilStatus: string;
    contactNumber: string;
    email: string;
    address: string;
    ministry: string;
    status: string;
    dateJoined: string;
    occupation: string;
    notes: string;
}

interface JwtPayload {
    sub?: string;
    name?: string;
    unique_name?: string;
    role?: string | string[];
    roles?: string | string[];

    [key: string]: unknown;
}

/* =========================================================
   EMPTY FORM
========================================================= */

const emptyForm: MemberForm = {
    memberCode: "",
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    gender: "",
    birthDate: "",
    civilStatus: "",
    contactNumber: "",
    email: "",
    address: "",
    ministry: "",
    status: "ACTIVE",
    dateJoined: new Date().toISOString().split("T")[0],
    occupation: "",
    notes: ""
};

/* =========================================================
   TOKEN HELPERS
========================================================= */

const getToken = (): string | null => {
    const keys = [
        "token",
        "accessToken",
        "jwt",
        "authToken",
        "epicToken"
    ];

    for (const key of keys) {
        const value = localStorage.getItem(key);

        if (value) {
            return value
                .replace(/^Bearer\s+/i, "")
                .trim();
        }
    }

    return null;
};

/* =========================================================
   JWT PAYLOAD
========================================================= */

const getJwtPayload = (): JwtPayload | null => {
    const token = getToken();

    if (!token) {
        return null;
    }

    try {
        const parts = token.split(".");

        if (parts.length !== 3) {
            return null;
        }

        const base64Url = parts[1];

        const base64 = base64Url
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const padded =
            base64 +
            "=".repeat(
                (4 - (base64.length % 4)) % 4
            );

        const decoded = atob(padded);

        return JSON.parse(decoded) as JwtPayload;

    } catch (error) {

        console.error(
            "JWT PAYLOAD ERROR:",
            error
        );

        return null;
    }
};

/* =========================================================
   GET CURRENT USER ROLES
========================================================= */

const getCurrentUserRoles = (): string[] => {

    const payload = getJwtPayload();

    if (!payload) {
        return [];
    }

    const possibleRoleValues = [
        payload.role,
        payload.roles,
        payload[
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ]
    ];

    let roleValue:
        | string
        | string[]
        | undefined;

    for (const value of possibleRoleValues) {

        if (
            typeof value === "string" ||
            Array.isArray(value)
        ) {

            roleValue = value;

            break;
        }
    }

    if (Array.isArray(roleValue)) {

        return roleValue
            .flatMap(role =>
                String(role).split(",")
            )
            .map(role =>
                role.trim().toUpperCase()
            )
            .filter(Boolean);
    }

    if (typeof roleValue === "string") {

        return roleValue
            .split(",")
            .map(role =>
                role.trim().toUpperCase()
            )
            .filter(Boolean);
    }

    return [];
};

/* =========================================================
   ADMIN CHECK
========================================================= */

const hasAdminRole = (): boolean => {

    const roles = getCurrentUserRoles();

    return roles.some(
        role =>
            role === "ADMIN" ||
            role === "ADMINISTRATOR" ||
            role === "SUPER ADMIN" ||
            role === "SUPERADMIN"
    );
};

/* =========================================================
   API FETCH
========================================================= */

const apiFetch = async (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {

    const token = getToken();

    const headers =
        new Headers(options.headers || {});

    headers.set(
        "Accept",
        "application/json"
    );

    if (options.body) {

        headers.set(
            "Content-Type",
            "application/json"
        );
    }

    if (token) {

        headers.set(
            "Authorization",
            `Bearer ${token}`
        );
    }

    return fetch(
        url,
        {
            ...options,
            headers
        }
    );
};

/* =========================================================
   COMPONENT
========================================================= */

const Members: React.FC = () => {

    /* =====================================================
       STATE
    ===================================================== */

    const [members, setMembers] =
        useState<Member[]>([]);

    const [loading, setLoading] =
        useState<boolean>(true);

    const [saving, setSaving] =
        useState<boolean>(false);

    const [search, setSearch] =
        useState<string>("");

    const [statusFilter, setStatusFilter] =
        useState<string>("ALL");

    const [ministryFilter, setMinistryFilter] =
        useState<string>("ALL");

    const [showModal, setShowModal] =
        useState<boolean>(false);

    const [editingMember, setEditingMember] =
        useState<Member | null>(null);

    const [form, setForm] =
        useState<MemberForm>(emptyForm);

    const [message, setMessage] =
        useState<string>("");

    const [error, setError] =
        useState<string>("");

    /* =====================================================
       CURRENT USER
    ===================================================== */

    const [isAdmin, setIsAdmin] =
        useState<boolean>(
            hasAdminRole()
        );

    /* =====================================================
       PERMISSIONS

       ADMIN automatically receives permissions.
       MEMBER must have explicit permission.
    ===================================================== */

    const canCreateMembers =
        isAdmin ||
        PermissionService.hasPermission(
            "Members",
            "create"
        );

    const canEditMembers =
        isAdmin ||
        PermissionService.hasPermission(
            "Members",
            "edit"
        );

    const canDeleteMembers =
        isAdmin ||
        PermissionService.hasPermission(
            "Members",
            "delete"
        );

    /* =====================================================
       REFRESH USER ROLE
    ===================================================== */

    useEffect(() => {

        setIsAdmin(
            hasAdminRole()
        );

    }, []);

    /* =====================================================
       LOAD MEMBERS
    ===================================================== */

    useEffect(() => {

        loadMembers();

    }, []);

    const loadMembers = async () => {

        setLoading(true);
        setError("");

        try {

            const response =
                await apiFetch(
                    `${API_BASE_URL}/Members`
                );

            if (response.status === 401) {

                throw new Error(
                    "UNAUTHORIZED: Please login again."
                );
            }

            if (response.status === 403) {

                throw new Error(
                    "FORBIDDEN: You do not have permission to view members."
                );
            }

            if (!response.ok) {

                const text =
                    await response.text();

                throw new Error(
                    text ||
                    `Members API returned ${response.status}.`
                );
            }

            const data =
                await response.json();

            const list: Member[] =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.members)
                        ? data.members
                        : Array.isArray(data.data)
                            ? data.data
                            : [];

            setMembers(list);

        } catch (err) {

            console.error(
                "LOAD MEMBERS ERROR:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load members."
            );

        } finally {

            setLoading(false);
        }
    };

    /* =====================================================
       STATISTICS
    ===================================================== */

    const totalMembers =
        members.length;

    const activeMembers =
        members.filter(
            member =>
                normalizeStatus(
                    member.status
                ) === "ACTIVE"
        ).length;

    const inactiveMembers =
        members.filter(
            member =>
                normalizeStatus(
                    member.status
                ) === "INACTIVE"
        ).length;

    const maleMembers =
        members.filter(
            member =>
                member.gender
                    ?.toUpperCase() ===
                "MALE"
        ).length;

    const femaleMembers =
        members.filter(
            member =>
                member.gender
                    ?.toUpperCase() ===
                "FEMALE"
        ).length;

    /* =====================================================
       MINISTRY LIST
    ===================================================== */

    const ministries =
        useMemo(() => {

            const values =
                members
                    .map(
                        member =>
                            member.ministry?.trim()
                    )
                    .filter(
                        (
                            ministry
                        ): ministry is string =>
                            Boolean(ministry)
                    );

            return Array.from(
                new Set(values)
            ).sort();

        }, [members]);

    /* =====================================================
       FILTERED MEMBERS
    ===================================================== */

    const filteredMembers =
        useMemo(() => {

            const keyword =
                search
                    .trim()
                    .toLowerCase();

            return members.filter(
                member => {

                    const fullName =
                        getFullName(
                            member
                        ).toLowerCase();

                    const code =
                        (
                            member.memberCode ||
                            ""
                        ).toLowerCase();

                    const ministry =
                        (
                            member.ministry ||
                            ""
                        ).toLowerCase();

                    const contact =
                        (
                            member.contactNumber ||
                            ""
                        ).toLowerCase();

                    const matchesSearch =
                        !keyword ||
                        fullName.includes(
                            keyword
                        ) ||
                        code.includes(
                            keyword
                        ) ||
                        ministry.includes(
                            keyword
                        ) ||
                        contact.includes(
                            keyword
                        );

                    const matchesStatus =
                        statusFilter === "ALL" ||
                        normalizeStatus(
                            member.status
                        ) === statusFilter;

                    const matchesMinistry =
                        ministryFilter === "ALL" ||
                        (
                            member.ministry ||
                            ""
                        ) === ministryFilter;

                    return (
                        matchesSearch &&
                        matchesStatus &&
                        matchesMinistry
                    );
                }
            );

        }, [
            members,
            search,
            statusFilter,
            ministryFilter
        ]);

    /* =====================================================
       FORM CHANGE
    ===================================================== */

    const handleInputChange = (
        field: keyof MemberForm,
        value: string
    ) => {

        setForm(
            previous => ({
                ...previous,
                [field]: value
            })
        );
    };

    /* =====================================================
       OPEN ADD MODAL
    ===================================================== */

    const openAddModal = () => {

        if (!canCreateMembers) {

            setError(
                "Permission denied. You do not have permission to create members."
            );

            return;
        }

        setEditingMember(null);

        setForm({
            ...emptyForm,
            memberCode:
                generateMemberCode()
        });

        setMessage("");
        setError("");
        setShowModal(true);
    };

    /* =====================================================
       OPEN VIEW / EDIT MODAL
    ===================================================== */

    const openEditModal = (
        member: Member
    ) => {

        setEditingMember(member);

        setForm({
            memberCode:
                member.memberCode || "",

            firstName:
                member.firstName || "",

            middleName:
                member.middleName || "",

            lastName:
                member.lastName || "",

            suffix:
                member.suffix || "",

            gender:
                member.gender || "",

            birthDate:
                formatInputDate(
                    member.birthDate
                ),

            civilStatus:
                member.civilStatus || "",

            contactNumber:
                member.contactNumber || "",

            email:
                member.email || "",

            address:
                member.address || "",

            ministry:
                member.ministry || "",

            status:
                normalizeStatus(
                    member.status
                ),

            dateJoined:
                formatInputDate(
                    member.dateJoined
                ) ||
                emptyForm.dateJoined,

            occupation:
                member.occupation || "",

            notes:
                member.notes || ""
        });

        setMessage("");
        setError("");
        setShowModal(true);
    };

    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    const closeModal = () => {

        if (saving) {
            return;
        }

        setShowModal(false);
        setEditingMember(null);
        setForm(emptyForm);
        setError("");
    };

    /* =====================================================
       SAVE MEMBER
    ===================================================== */

    const saveMember = async (
        event: React.FormEvent
    ) => {

        event.preventDefault();

        setError("");
        setMessage("");

        const isEditing =
            Boolean(editingMember);

        /* ===============================================
           PERMISSION CHECK
        =============================================== */

        if (
            isEditing &&
            !canEditMembers
        ) {

            setError(
                "Permission denied. You do not have permission to edit members."
            );

            return;
        }

        if (
            !isEditing &&
            !canCreateMembers
        ) {

            setError(
                "Permission denied. You do not have permission to create members."
            );

            return;
        }

        /* ===============================================
           VALIDATION
        =============================================== */

        if (
            !form.firstName.trim() ||
            !form.lastName.trim()
        ) {

            setError(
                "First name and last name are required."
            );

            return;
        }

        setSaving(true);

        try {

            const payload = {

                memberCode:
                    form.memberCode.trim(),

                firstName:
                    form.firstName.trim(),

                middleName:
                    form.middleName.trim(),

                lastName:
                    form.lastName.trim(),

                suffix:
                    form.suffix.trim(),

                gender:
                    form.gender || null,

                birthDate:
                    form.birthDate || null,

                civilStatus:
                    form.civilStatus || null,

                contactNumber:
                    form.contactNumber.trim(),

                email:
                    form.email.trim(),

                address:
                    form.address.trim(),

                ministry:
                    form.ministry.trim(),

                status:
                    form.status,

                dateJoined:
                    form.dateJoined || null,

                occupation:
                    form.occupation.trim(),

                notes:
                    form.notes.trim()
            };

            const url =
                isEditing
                    ? `${API_BASE_URL}/Members/${editingMember?.memberId}`
                    : `${API_BASE_URL}/Members`;

            const response =
                await apiFetch(
                    url,
                    {
                        method:
                            isEditing
                                ? "PUT"
                                : "POST",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

            if (
                response.status === 401
            ) {

                throw new Error(
                    "UNAUTHORIZED: Please login again."
                );
            }

            if (
                response.status === 403
            ) {

                throw new Error(
                    isEditing
                        ? "FORBIDDEN: You do not have permission to edit members."
                        : "FORBIDDEN: You do not have permission to create members."
                );
            }

            if (!response.ok) {

                const text =
                    await response.text();

                throw new Error(
                    text ||
                    `Unable to save member. Server returned ${response.status}.`
                );
            }

            setMessage(
                isEditing
                    ? "Member updated successfully."
                    : "Member added successfully."
            );

            setShowModal(false);
            setEditingMember(null);
            setForm(emptyForm);

            await loadMembers();

        } catch (err) {

            console.error(
                "SAVE MEMBER ERROR:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save member."
            );

        } finally {

            setSaving(false);
        }
    };

    /* =====================================================
       DELETE MEMBER
    ===================================================== */

    const deleteMember = async (
        member: Member
    ) => {

        if (!canDeleteMembers) {

            setError(
                "Permission denied. You do not have permission to delete members."
            );

            return;
        }

        const confirmed =
            window.confirm(
                `Are you sure you want to delete ${getFullName(member)}?`
            );

        if (!confirmed) {
            return;
        }

        setError("");
        setMessage("");

        try {

            const response =
                await apiFetch(
                    `${API_BASE_URL}/Members/${member.memberId}`,
                    {
                        method: "DELETE"
                    }
                );

            if (
                response.status === 401
            ) {

                throw new Error(
                    "UNAUTHORIZED: Please login again."
                );
            }

            if (
                response.status === 403
            ) {

                throw new Error(
                    "FORBIDDEN: You do not have permission to delete members."
                );
            }

            if (!response.ok) {

                const text =
                    await response.text();

                throw new Error(
                    text ||
                    `Unable to delete member. Server returned ${response.status}.`
                );
            }

            setMessage(
                `${getFullName(member)} was deleted successfully.`
            );

            await loadMembers();

        } catch (err) {

            console.error(
                "DELETE MEMBER ERROR:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to delete member."
            );
        }
    };

    /* =====================================================
       TOGGLE ACTIVE / INACTIVE
    ===================================================== */

    const toggleStatus = async (
        member: Member
    ) => {

        if (!canEditMembers) {

            setError(
                "Permission denied. You do not have permission to change member status."
            );

            return;
        }

        const currentStatus =
            normalizeStatus(
                member.status
            );

        const newStatus =
            currentStatus === "ACTIVE"
                ? "INACTIVE"
                : "ACTIVE";

        setError("");
        setMessage("");

        try {

            const payload = {

                memberCode:
                    member.memberCode || "",

                firstName:
                    member.firstName || "",

                middleName:
                    member.middleName || "",

                lastName:
                    member.lastName || "",

                suffix:
                    member.suffix || "",

                gender:
                    member.gender || null,

                birthDate:
                    member.birthDate || null,

                civilStatus:
                    member.civilStatus || null,

                contactNumber:
                    member.contactNumber || "",

                email:
                    member.email || "",

                address:
                    member.address || "",

                ministry:
                    member.ministry || "",

                status:
                    newStatus,

                dateJoined:
                    member.dateJoined || null,

                occupation:
                    member.occupation || "",

                notes:
                    member.notes || ""
            };

            const response =
                await apiFetch(
                    `${API_BASE_URL}/Members/${member.memberId}`,
                    {
                        method: "PUT",
                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

            if (
                response.status === 401
            ) {

                throw new Error(
                    "UNAUTHORIZED: Please login again."
                );
            }

            if (
                response.status === 403
            ) {

                throw new Error(
                    "FORBIDDEN: You do not have permission to change member status."
                );
            }

            if (!response.ok) {

                const text =
                    await response.text();

                throw new Error(
                    text ||
                    "Unable to update member status."
                );
            }

            setMessage(
                `${getFullName(member)} is now ${newStatus.toLowerCase()}.`
            );

            await loadMembers();

        } catch (err) {

            console.error(
                "STATUS UPDATE ERROR:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update member status."
            );
        }
    };

    /* =====================================================
       REFRESH
    ===================================================== */

    const refreshMembers = async () => {

        setMessage("");
        setError("");

        await loadMembers();

        setMessage(
            "Members list refreshed successfully."
        );
    };

    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div className="members-page">

            {/* =================================================
               HEADER
            ================================================= */}

            <div className="members-header">

                <div className="members-header-left">

                    <div className="members-header-icon">
                        <span>♟</span>
                    </div>

                    <div>

                        <div className="members-eyebrow">
                            EPIC CHURCH MANAGEMENT SYSTEM
                        </div>

                        <h1>
                            Members
                        </h1>

                        <p>
                            Manage church members,
                            profiles, ministries,
                            and membership status.
                        </p>

                    </div>

                </div>

                <div className="members-header-actions">

                    <button
                        type="button"
                        className="members-refresh-btn"
                        onClick={
                            refreshMembers
                        }
                        disabled={
                            loading
                        }
                    >
                        <span>↻</span>
                        Refresh
                    </button>

                    {/* =========================================
                       CREATE BUTTON
                       ONLY ADMIN / CREATE PERMISSION
                    ========================================= */}

                    {canCreateMembers && (

                        <button
                            type="button"
                            className="members-add-btn"
                            onClick={
                                openAddModal
                            }
                        >
                            <span>＋</span>
                            Add Member
                        </button>

                    )}

                </div>

            </div>

            {/* =================================================
               ROLE INFORMATION
            ================================================= */}

            <div
                style={{
                    marginBottom: "18px",
                    padding: "10px 14px",
                    borderRadius: "8px",

                    background:
                        isAdmin
                            ? "#ecfdf5"
                            : "#f3f4f6",

                    border:
                        isAdmin
                            ? "1px solid #a7f3d0"
                            : "1px solid #d1d5db",

                    color:
                        isAdmin
                            ? "#065f46"
                            : "#4b5563",

                    fontSize: "13px"
                }}
            >

                {isAdmin ? (

                    <>
                        <strong>
                            ADMIN ACCESS:
                        </strong>{" "}
                        You can add, edit,
                        update status,
                        and delete members.
                    </>

                ) : (

                    <>
                        <strong>
                            VIEW-ONLY ACCESS:
                        </strong>{" "}
                        You can view member
                        records, but you cannot
                        create, edit, delete,
                        or change member status.
                    </>

                )}

            </div>

            {/* =================================================
               ALERTS
            ================================================= */}

            {message && (

                <div className="members-alert members-alert-success">

                    <span className="alert-symbol">
                        ✓
                    </span>

                    <span>
                        {message}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setMessage("")
                        }
                    >
                        ×
                    </button>

                </div>

            )}

            {error && (

                <div className="members-alert members-alert-error">

                    <span className="alert-symbol">
                        !
                    </span>

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                    >
                        ×
                    </button>

                </div>

            )}

            {/* =================================================
               STATISTICS
            ================================================= */}

            <div className="members-stat-grid">

                <div className="member-stat-card stat-blue">

                    <div className="member-stat-icon">
                        👥
                    </div>

                    <div className="member-stat-content">

                        <span>
                            TOTAL MEMBERS
                        </span>

                        <strong>
                            {totalMembers}
                        </strong>

                    </div>

                </div>

                <div className="member-stat-card stat-green">

                    <div className="member-stat-icon">
                        ✓
                    </div>

                    <div className="member-stat-content">

                        <span>
                            ACTIVE MEMBERS
                        </span>

                        <strong>
                            {activeMembers}
                        </strong>

                    </div>

                </div>

                <div className="member-stat-card stat-orange">

                    <div className="member-stat-icon">
                        ◷
                    </div>

                    <div className="member-stat-content">

                        <span>
                            INACTIVE MEMBERS
                        </span>

                        <strong>
                            {inactiveMembers}
                        </strong>

                    </div>

                </div>

                <div className="member-stat-card stat-purple">

                    <div className="member-stat-icon">
                        ♀
                    </div>

                    <div className="member-stat-content">

                        <span>
                            FEMALE MEMBERS
                        </span>

                        <strong>
                            {femaleMembers}
                        </strong>

                    </div>

                </div>

                <div className="member-stat-card stat-indigo">

                    <div className="member-stat-icon">
                        ♂
                    </div>

                    <div className="member-stat-content">

                        <span>
                            MALE MEMBERS
                        </span>

                        <strong>
                            {maleMembers}
                        </strong>

                    </div>

                </div>

            </div>

            {/* =================================================
               FILTER CARD
            ================================================= */}

            <div className="members-filter-card">

                <div className="members-search-box">

                    <span className="search-icon">
                        ⌕
                    </span>

                    <input
                        type="text"
                        placeholder="Search member name, code, ministry, or contact..."
                        value={
                            search
                        }
                        onChange={
                            event =>
                                setSearch(
                                    event.target.value
                                )
                        }
                    />

                    {search && (

                        <button
                            type="button"
                            className="clear-search"
                            onClick={() =>
                                setSearch("")
                            }
                        >
                            ×
                        </button>

                    )}

                </div>

                <div className="members-filter-group">

                    <label>
                        STATUS
                    </label>

                    <select
                        value={
                            statusFilter
                        }
                        onChange={
                            event =>
                                setStatusFilter(
                                    event.target.value
                                )
                        }
                    >

                        <option value="ALL">
                            All Status
                        </option>

                        <option value="ACTIVE">
                            Active
                        </option>

                        <option value="INACTIVE">
                            Inactive
                        </option>

                    </select>

                </div>

                <div className="members-filter-group">

                    <label>
                        MINISTRY
                    </label>

                    <select
                        value={
                            ministryFilter
                        }
                        onChange={
                            event =>
                                setMinistryFilter(
                                    event.target.value
                                )
                        }
                    >

                        <option value="ALL">
                            All Ministries
                        </option>

                        {ministries.map(
                            ministry => (

                                <option
                                    key={
                                        ministry
                                    }
                                    value={
                                        ministry
                                    }
                                >
                                    {ministry}
                                </option>

                            )
                        )}

                    </select>

                </div>

                <div className="members-result-count">

                    <strong>
                        {filteredMembers.length}
                    </strong>

                    <span>
                        member
                        {filteredMembers.length !== 1
                            ? "s"
                            : ""}
                    </span>

                </div>

            </div>

            {/* =================================================
               TABLE
            ================================================= */}

            <div className="members-table-card">

                <div className="members-table-heading">

                    <div>

                        <h2>
                            Church Members
                        </h2>

                        <p>
                            Complete list of registered
                            church members.
                        </p>

                    </div>

                    <div className="members-table-meta">

                        Showing{" "}

                        <strong>
                            {filteredMembers.length}
                        </strong>

                        {" "}of{" "}

                        <strong>
                            {members.length}
                        </strong>

                    </div>

                </div>

                {loading ? (

                    <div className="members-loading">

                        <div className="members-spinner" />

                        <h3>
                            Loading members...
                        </h3>

                        <p>
                            Please wait while the
                            member database is loaded.
                        </p>

                    </div>

                ) : filteredMembers.length === 0 ? (

                    <div className="members-empty">

                        <div className="members-empty-icon">
                            👥
                        </div>

                        <h3>
                            No Members Found
                        </h3>

                        <p>
                            {members.length === 0
                                ? "There are currently no members registered in the system."
                                : "Try changing your search or filter settings."}
                        </p>

                        {members.length === 0 &&
                            canCreateMembers && (

                                <button
                                    type="button"
                                    className="members-empty-add"
                                    onClick={
                                        openAddModal
                                    }
                                >
                                    ＋ Add First Member
                                </button>

                            )}

                    </div>

                ) : (

                    <div className="members-table-wrapper">

                        <table className="members-table">

                            <thead>

                                <tr>

                                    <th>
                                        #
                                    </th>

                                    <th>
                                        MEMBER
                                    </th>

                                    <th>
                                        MEMBER CODE
                                    </th>

                                    <th>
                                        CONTACT
                                    </th>

                                    <th>
                                        MINISTRY
                                    </th>

                                    <th>
                                        STATUS
                                    </th>

                                    <th>
                                        DATE JOINED
                                    </th>

                                    <th className="actions-column">
                                        ACTIONS
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredMembers.map(
                                    (
                                        member,
                                        index
                                    ) => (

                                        <tr
                                            key={
                                                member.memberId
                                            }
                                        >

                                            <td className="row-number">
                                                {
                                                    index + 1
                                                }
                                            </td>

                                            <td>

                                                <div className="member-person">

                                                    <div
                                                        className={`member-avatar ${getAvatarClass(
                                                            member
                                                        )}`}
                                                    >
                                                        {
                                                            getInitials(
                                                                getFullName(
                                                                    member
                                                                )
                                                            )
                                                        }
                                                    </div>

                                                    <div className="member-person-info">

                                                        <strong>
                                                            {
                                                                getFullName(
                                                                    member
                                                                )
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                member.email ||
                                                                "No email registered"
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>

                                            <td>

                                                <span className="member-code-badge">

                                                    {
                                                        member.memberCode ||
                                                        `MEM-${String(
                                                            member.memberId
                                                        ).padStart(
                                                            4,
                                                            "0"
                                                        )}`
                                                    }

                                                </span>

                                            </td>

                                            <td>

                                                <span className="member-contact">

                                                    {
                                                        member.contactNumber ||
                                                        "—"
                                                    }

                                                </span>

                                            </td>

                                            <td>

                                                <span className="ministry-badge">

                                                    {
                                                        member.ministry ||
                                                        "General"
                                                    }

                                                </span>

                                            </td>

                                            <td>

                                                {/* ===================================
                                                    EDIT PERMISSION
                                                =================================== */}

                                                {canEditMembers ? (

                                                    <button
                                                        type="button"
                                                        className={`member-status-badge status-${normalizeStatus(
                                                            member.status
                                                        ).toLowerCase()}`}
                                                        onClick={() =>
                                                            toggleStatus(
                                                                member
                                                            )
                                                        }
                                                        title="Click to change status"
                                                    >

                                                        <span>
                                                            ●
                                                        </span>

                                                        {
                                                            normalizeStatus(
                                                                member.status
                                                            )
                                                        }

                                                    </button>

                                                ) : (

                                                    <span
                                                        className={`member-status-badge status-${normalizeStatus(
                                                            member.status
                                                        ).toLowerCase()}`}
                                                        title="View only"
                                                    >

                                                        <span>
                                                            ●
                                                        </span>

                                                        {
                                                            normalizeStatus(
                                                                member.status
                                                            )
                                                        }

                                                    </span>

                                                )}

                                            </td>

                                            <td>

                                                <span className="date-text">

                                                    {
                                                        formatDate(
                                                            member.dateJoined
                                                        )
                                                    }

                                                </span>

                                            </td>

                                            <td>

                                                <div className="member-actions">

                                                    {/* =================================
                                                        VIEW
                                                    ================================= */}

                                                    <button
                                                        type="button"
                                                        className="member-action-btn view-action"
                                                        title="View member"
                                                        onClick={() =>
                                                            openEditModal(
                                                                member
                                                            )
                                                        }
                                                    >
                                                        👁
                                                    </button>

                                                    {/* =================================
                                                        EDIT
                                                    ================================= */}

                                                    {canEditMembers && (

                                                        <button
                                                            type="button"
                                                            className="member-action-btn edit-action"
                                                            title="Edit member"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    member
                                                                )
                                                            }
                                                        >
                                                            ✎
                                                        </button>

                                                    )}

                                                    {/* =================================
                                                        DELETE
                                                    ================================= */}

                                                    {canDeleteMembers && (

                                                        <button
                                                            type="button"
                                                            className="member-action-btn delete-action"
                                                            title="Delete member"
                                                            onClick={() =>
                                                                deleteMember(
                                                                    member
                                                                )
                                                            }
                                                        >
                                                            🗑
                                                        </button>

                                                    )}

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

            {/* =================================================
               MODAL
            ================================================= */}

            {showModal && (

                <div
                    className="members-modal-overlay"
                    onMouseDown={
                        event => {

                            if (
                                event.target ===
                                event.currentTarget
                            ) {

                                closeModal();
                            }
                        }
                    }
                >

                    <div className="members-modal">

                        <div className="members-modal-header">

                            <div>

                                <div className="modal-eyebrow">
                                    EPIC MEMBER MANAGEMENT
                                </div>

                                <h2>

                                    {editingMember
                                        ? canEditMembers
                                            ? "Edit Member"
                                            : "View Member"
                                        : "Add New Member"}

                                </h2>

                                <p>

                                    {editingMember
                                        ? canEditMembers
                                            ? "Update the member's information below."
                                            : "Member information is displayed in read-only mode."
                                        : "Register a new member in the church database."}

                                </p>

                            </div>

                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
                                }
                            >
                                ×
                            </button>

                        </div>

                        <form
                            onSubmit={
                                saveMember
                            }
                        >

                            <div className="members-modal-body">

                                {/* =================================================
                                   BASIC INFORMATION
                                ================================================= */}

                                <div className="form-section">

                                    <div className="form-section-title">

                                        <span>
                                            01
                                        </span>

                                        <div>

                                            <h3>
                                                Basic Information
                                            </h3>

                                            <p>
                                                Member identification
                                                and personal details.
                                            </p>

                                        </div>

                                    </div>

                                    <div className="form-grid form-grid-4">

                                        <div className="form-field">

                                            <label>
                                                MEMBER CODE
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    form.memberCode
                                                }
                                                disabled={
                                                    !canEditMembers &&
                                                    !canCreateMembers
                                                }
                                                onChange={
                                                    event =>
                                                        handleInputChange(
                                                            "memberCode",
                                                            event.target.value.toUpperCase()
                                                        )
                                                }
                                                placeholder="EPIC-0001"
                                            />

                                        </div>

                                        <div className="form-field required-field">

                                            <label>
                                                FIRST NAME
                                            </label>

                                            <input
                                                type="text"
                                                required
                                                disabled={
                                                    !canEditMembers &&
                                                    !canCreateMembers
                                                }
                                                value={
                                                    form.firstName
                                                }
                                                onChange={
                                                    event =>
                                                        handleInputChange(
                                                            "firstName",
                                                            event.target.value
                                                        )
                                                }
                                                placeholder="First name"
                                            />

                                        </div>

                                        <div className="form-field">

                                            <label>
                                                MIDDLE NAME
                                            </label>

                                            <input
                                                type="text"
                                                disabled={
                                                    !canEditMembers &&
                                                    !canCreateMembers
                                                }
                                                value={
                                                    form.middleName
                                                }
                                                onChange={
                                                    event =>
                                                        handleInputChange(
                                                            "middleName",
                                                            event.target.value
                                                        )
                                                }
                                                placeholder="Middle name"
                                            />

                                        </div>

                                        <div className="form-field required-field">

                                            <label>
                                                LAST NAME
                                            </label>

                                            <input
                                                type="text"
                                                required
                                                disabled={
                                                    !canEditMembers &&
                                                    !canCreateMembers
                                                }
                                                value={
                                                    form.lastName
                                                }
                                                onChange={
                                                    event =>
                                                        handleInputChange(
                                                            "lastName",
                                                            event.target.value
                                                        )
                                                }
                                                placeholder="Last name"
                                            />

                                        </div>

                                        <div className="form-field">

                                            <label>
                                                SUFFIX
                                            </label>

                                            <input
                                                type="text"
                                                disabled={
                                                    !canEditMembers &&
                                                    !canCreateMembers
                                                }
                                                value={
                                                    form.suffix
                                                }
                                                onChange={
                                                    event =>
                                                        handleInputChange(
                                                            "suffix",
                                                            event.target.value
                                                        )
                                                }
                                                placeholder="Jr., Sr., III"
                                            />

                                        </div>

                                        <div className="form-field">

                                            <label>
                                                GENDER
                                            </label>

                                            <select
                                                disabled={
                                                    !canEditMembers &&
                                                    !canCreateMembers
                                                }
                                                value={
                                                    form.gender
                                                }
                                                onChange={
                                                    event =>
                                                        handleInputChange(
                                                            "gender",
                                                            event.target.value
                                                        )
                                                }
                                            >

                                                <option value="">
                                                    Select gender
                                                </option>

                                                <option value="MALE">
                                                    Male
                                                </option>

                                                <option value="FEMALE">
                                                    Female
                                                </option>

                                            </select>

                                        </div>

                                        <div className="form-field">

                                            <label>
                                                BIRTH DATE
                                            </label>

                                            <input
                                                type="date"
                                                disabled={
                                                    !canEditMembers &&
                                                    !canCreateMembers
                                                }
                                                value={
                                                    form.birthDate
                                                }
                                                onChange={
                                                    event =>
                                                        handleInputChange(
                                                            "birthDate",
                                                            event.target.value
                                                        )
                                                }
                                            />

                                        </div>

                                        <div className="form-field">

                                            <label>
                                                CIVIL STATUS
                                            </label>

                                            <select
                                                disabled={
                                                    !canEditMembers &&
                                                    !canCreateMembers
                                                }
                                                value={
                                                    form.civilStatus
                                                }
                                                onChange={
                                                    event =>
                                                        handleInputChange(
                                                            "civilStatus",
                                                            event.target.value
                                                        )
                                                }
                                            >

                                                <option value="">
                                                    Select status
                                                </option>

                                                <option value="SINGLE">
                                                    Single
                                                </option>

                                                <option value="MARRIED">
                                                    Married
                                                </option>

                                                <option value="WIDOWED">
                                                    Widowed
                                                </option>

                                                <option value="SEPARATED">
                                                    Separated
                                                </option>

                                            </select>

                                        </div>

                                    </div>

                                </div>

                                {/* =================================================
                                   CONTACT INFORMATION
                                ================================================= */}

                                <div className="form-section">

                                    <div className="form-section-title">

                                        <span>
                                            02
                                        </span>

                                        <div>

                                            <h3>
                                                Contact Information
                                            </h3>

                                            <p>
                                                Communication and
                                                address details.
                                            </p>

                                        </div>

                                    </div>

                                    <div className="form-grid form-grid-2">

                                        <div className="form-field">

                                            <label>
                                                CONTACT NUMBER
                                            </label>

                                            <input
                                                type="tel"
                                                disabled={
                                                    !canEditMembers &&
                                                    !canCreateMembers
                                                }
                                                value={
                                                    form.contactNumber
                                                }
                                                onChange={
                                                    event =>
                                                        handleInputChange(
                                                            "contactNumber",
                                                            event.target.value
                                                        )
                                                }
                                                placeholder="09XX XXX XXXX"
                                            />

                                        </div>

                                        <div className="form-field">

                                            <label>
                                                EMAIL ADDRESS
                                            </label>

                                            <input
                                                type="email"
                                                disabled={
                                                    !canEditMembers &&
                                                    !canCreateMembers
                                                }
                                                value={
                                                    form.email
                                                }
                                                onChange={
                                                    event =>
                                                        handleInputChange(
                                                            "email",
                                                            event.target.value
                                                        )
                                                }
                                                placeholder="member@email.com"
                                            />

                                        </div>

                                        <div className="form-field full-width">

                                            <label>
                                                ADDRESS
                                            </label>

                                            <textarea
                                                disabled={
                                                    !canEditMembers &&
                                                    !canCreateMembers
                                                }
                                                value={
                                                    form.address
                                                }
                                                onChange={
                                                    event =>
                                                        handleInputChange(
                                                            "address",
                                                            event.target.value
                                                        )
                                                }
                                                placeholder="Complete residential address"
                                                rows={3}
                                            />

                                        </div>

                                    </div>

                                </div>

                                {/* =================================================
                                   CHURCH INFORMATION
                                ================================================= */}

                                <div className="form-section">

                                    <div className="form-section-title">

                                        <span>
                                            03
                                        </span>

                                        <div>

                                            <h3>
                                                Church Information
                                            </h3>

                                            <p>
                                                Membership and
                                                ministry details.
                                            </p>

                                        </div>

                                    </div>

                                    <div className="form-grid form-grid-4">

                                        <div className="form-field">

                                            <label>
                                                MINISTRY
                                            </label>

                                            <input
                                                type="text"
                                                disabled={
                                                    !canEditMembers &&
                                                    !canCreateMembers
                                                }
                                                value={
                                                    form.ministry
                                                }
                                                onChange={
                                                    event =>
                                                        handleInputChange(
                                                            "ministry",
                                                            event.target.value
                                                        )
                                                }
                                                placeholder="e.g. EPIC V3"
                                            />

                                        </div>

                                        <div className="form-field">

                                            <label>
                                                OCCUPATION
                                            </label>

                                            <input
                                                type="text"
                                                disabled={
                                                    !canEditMembers &&
                                                    !canCreateMembers
                                                }
                                                value={
                                                    form.occupation
                                                }
                                                onChange={
                                                    event =>
                                                        handleInputChange(
                                                            "occupation",
                                                            event.target.value
                                                        )
                                                }
                                                placeholder="Occupation"
                                            />

                                        </div>

                                        <div className="form-field">

                                            <label>
                                                DATE JOINED
                                            </label>

                                            <input
                                                type="date"
                                                disabled={
                                                    !canEditMembers &&
                                                    !canCreateMembers
                                                }
                                                value={
                                                    form.dateJoined
                                                }
                                                onChange={
                                                    event =>
                                                        handleInputChange(
                                                            "dateJoined",
                                                            event.target.value
                                                        )
                                                }
                                            />

                                        </div>

                                        <div className="form-field">

                                            <label>
                                                MEMBERSHIP STATUS
                                            </label>

                                            <select
                                                disabled={
                                                    !canEditMembers &&
                                                    !canCreateMembers
                                                }
                                                value={
                                                    form.status
                                                }
                                                onChange={
                                                    event =>
                                                        handleInputChange(
                                                            "status",
                                                            event.target.value
                                                        )
                                                }
                                            >

                                                <option value="ACTIVE">
                                                    Active
                                                </option>

                                                <option value="INACTIVE">
                                                    Inactive
                                                </option>

                                            </select>

                                        </div>

                                        <div className="form-field full-width">

                                            <label>
                                                NOTES
                                            </label>

                                            <textarea
                                                disabled={
                                                    !canEditMembers &&
                                                    !canCreateMembers
                                                }
                                                value={
                                                    form.notes
                                                }
                                                onChange={
                                                    event =>
                                                        handleInputChange(
                                                            "notes",
                                                            event.target.value
                                                        )
                                                }
                                                placeholder="Additional notes about this member..."
                                                rows={3}
                                            />

                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* =================================================
                               MODAL FOOTER
                            ================================================= */}

                            <div className="members-modal-footer">

                                <button
                                    type="button"
                                    className="modal-cancel-btn"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    {canEditMembers ||
                                        canCreateMembers
                                        ? "Cancel"
                                        : "Close"}
                                </button>

                                {/* =========================================
                                   SAVE / UPDATE BUTTON
                                   HIDDEN FOR VIEW-ONLY MEMBER
                                ========================================= */}

                                {(
                                    editingMember
                                        ? canEditMembers
                                        : canCreateMembers
                                ) && (

                                        <button
                                            type="submit"
                                            className="modal-save-btn"
                                            disabled={
                                                saving
                                            }
                                        >

                                            {saving ? (

                                                <>
                                                    <span className="button-spinner" />
                                                    Saving...
                                                </>

                                            ) : (

                                                <>
                                                    ✓{" "}
                                                    {editingMember
                                                        ? "Update Member"
                                                        : "Save Member"}
                                                </>

                                            )}

                                        </button>

                                    )}

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
};

/* =========================================================
   HELPERS
========================================================= */

const getFullName = (
    member: Member
): string => {

    const parts = [
        member.firstName,
        member.middleName,
        member.lastName,
        member.suffix
    ]
        .filter(
            value =>
                Boolean(
                    value &&
                    value.trim()
                )
        )
        .map(
            value =>
                value!.trim()
        );

    return (
        parts.join(" ") ||
        member.memberCode ||
        "Unnamed Member"
    );
};

/* =========================================================
   INITIALS
========================================================= */

const getInitials = (
    name: string
): string => {

    const parts =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (parts.length === 0) {
        return "?";
    }

    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
};

/* =========================================================
   STATUS
========================================================= */

const normalizeStatus = (
    status?: string
): string => {

    const normalized =
        status
            ?.trim()
            .toUpperCase();

    if (
        normalized === "INACTIVE"
    ) {

        return "INACTIVE";
    }

    return "ACTIVE";
};

/* =========================================================
   FORMAT DATE
========================================================= */

const formatDate = (
    value?: string
): string => {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;
    }

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
};

/* =========================================================
   FORMAT INPUT DATE
========================================================= */

const formatInputDate = (
    value?: string
): string => {

    if (!value) {
        return "";
    }

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            value
        )
    ) {

        return value;
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";
    }

    return date
        .toISOString()
        .split("T")[0];
};

/* =========================================================
   GENERATE MEMBER CODE
========================================================= */

const generateMemberCode = (): string => {

    const number =
        Math.floor(
            1000 +
            Math.random() * 9000
        );

    return `EPIC-${number}`;
};

/* =========================================================
   AVATAR CLASS
========================================================= */

const getAvatarClass = (
    member: Member
): string => {

    const name =
        getFullName(member);

    const first =
        name.charCodeAt(0);

    return `avatar-${first % 6}`;
};

/* =========================================================
   EXPORT
========================================================= */

export default Members;