import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Users,
    Search,
    Plus,
    RefreshCw,
    Edit,
    UserX,
    Eye,
    X,
    Save,
    UserCircle,
    Phone,
    MapPin,
    CalendarDays,
    Church,
    ClipboardCheck,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import { API_BASE_URL } from "./config";
import "./Members.css";

// ============================================================
// TYPES
// ============================================================

interface Member {
    memberId: number;
    memberCode: string;

    firstName: string;
    middleName: string;
    lastName: string;

    gender: string;
    birthDate: string | null;

    contactNumber: string;
    address: string;

    civilStatus: string;
    ministry: string;

    dateJoined: string | null;

    status: string;
    photoPath: string;

    createdDate: string;
    updatedDate: string | null;
}

interface MemberProfile {
    member: Member;

    attendanceSummary: {
        totalRecords: number;
        present: number;
        late: number;
        early: number;
        absent: number;
        excused: number;
        attendanceRate: number;
    };

    attendanceHistory: {
        attendanceId: number;
        attendanceDate: string;
        service: string;
        status: string;
        recordedBy: string;
        recordedDate: string;
    }[];

    ministries: {
        ministryMemberId: number;
        ministryId: number;
        ministryName: string;
        role: string;
        status: string;
        dateAssigned: string | null;
    }[];

    visitorConversion: {
        visitorId: number;
        visitorCode: string;
        firstVisitDate: string | null;
        visitCount: number;
        followUpStatus: string;
        conversionDate: string | null;
        status: string;
    } | null;
}

interface MemberForm {
    memberCode: string;
    firstName: string;
    middleName: string;
    lastName: string;
    gender: string;
    birthDate: string;
    contactNumber: string;
    address: string;
    civilStatus: string;
    ministry: string;
    dateJoined: string;
    status: string;
    photoPath: string;
}

const emptyForm: MemberForm = {
    memberCode: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    birthDate: "",
    contactNumber: "",
    address: "",
    civilStatus: "",
    ministry: "",
    dateJoined: "",
    status: "ACTIVE",
    photoPath: "",
};

// ============================================================
// TOKEN
// ============================================================

function getToken(): string | null {
    const keys = [
        "token",
        "accessToken",
        "jwt",
        "authToken",
        "epicToken",
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
}

// ============================================================
// API ERROR
// ============================================================

class ApiError extends Error {
    status: number;

    constructor(
        message: string,
        status: number = 0
    ) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

// ============================================================
// RESPONSE MESSAGE
// ============================================================

async function readResponseMessage(
    response: Response
): Promise<string> {
    try {
        const text = await response.text();

        if (!text) {
            return "";
        }

        try {
            const json = JSON.parse(text);

            if (typeof json === "string") {
                return json;
            }

            return (
                json?.message ||
                json?.title ||
                json?.error ||
                text
            );
        } catch {
            return text;
        }
    } catch {
        return "";
    }
}

// ============================================================
// API FETCH
// ============================================================

async function apiFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = getToken();

    if (!token) {
        throw new ApiError(
            "Your session has expired. Please login again.",
            401
        );
    }

    const headers = new Headers(
        options.headers || {}
    );

    headers.set(
        "Accept",
        "application/json"
    );

    if (
        options.body &&
        !(options.body instanceof FormData) &&
        !headers.has("Content-Type")
    ) {
        headers.set(
            "Content-Type",
            "application/json"
        );
    }

    headers.set(
        "Authorization",
        `Bearer ${token}`
    );

    let response: Response;

    try {
        response = await fetch(
            url,
            {
                ...options,
                headers,
            }
        );
    } catch (error) {
        console.error(
            "MEMBERS API NETWORK ERROR:",
            error
        );

        throw new ApiError(
            `Cannot connect to EPIC API at ${API_BASE_URL}.`,
            0
        );
    }

    if (response.status === 401) {
        throw new ApiError(
            "Your session has expired. Please login again.",
            401
        );
    }

    if (response.status === 403) {
        throw new ApiError(
            "You do not have permission to access Members.",
            403
        );
    }

    if (!response.ok) {
        const message =
            await readResponseMessage(response);

        throw new ApiError(
            message ||
            `EPIC API returned HTTP ${response.status}.`,
            response.status
        );
    }

    return response;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

const Members: React.FC = () => {

    const [members, setMembers] =
        useState<Member[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [profileLoading, setProfileLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [showForm, setShowForm] =
        useState(false);

    const [showProfile, setShowProfile] =
        useState(false);

    const [editingId, setEditingId] =
        useState<number | null>(null);

    const [form, setForm] =
        useState<MemberForm>({
            ...emptyForm,
        });

    const [selectedMember, setSelectedMember] =
        useState<MemberProfile | null>(null);

    // ========================================================
    // LOAD MEMBERS
    // ========================================================

    const loadMembers = useCallback(
        async () => {
            setLoading(true);
            setError("");

            try {
                const response =
                    await apiFetch(
                        `${API_BASE_URL}/Members`
                    );

                const data =
                    await response.json();

                const list: Member[] =
                    Array.isArray(data)
                        ? data
                        : Array.isArray(data?.members)
                            ? data.members
                            : Array.isArray(data?.data)
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
        },
        []
    );

    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    // ========================================================
    // SEARCH
    // ========================================================

    const filteredMembers =
        useMemo(() => {

            const keyword =
                search
                    .trim()
                    .toLowerCase();

            if (!keyword) {
                return members;
            }

            return members.filter(
                member => {

                    const fullName =
                        getFullName(member)
                            .toLowerCase();

                    return (
                        fullName.includes(keyword) ||

                        member.memberCode
                            ?.toLowerCase()
                            .includes(keyword) ||

                        member.contactNumber
                            ?.toLowerCase()
                            .includes(keyword) ||

                        member.ministry
                            ?.toLowerCase()
                            .includes(keyword)
                    );
                }
            );

        }, [
            members,
            search,
        ]);

    // ========================================================
    // OPEN ADD FORM
    // ========================================================

    const openAddForm = () => {

        setEditingId(null);

        setForm({
            ...emptyForm,
        });

        setError("");
        setMessage("");

        setShowForm(true);
    };

    // ========================================================
    // OPEN EDIT FORM
    // ========================================================

    const openEditForm = (
        member: Member
    ) => {

        console.log(
            "EDIT MEMBER:",
            member
        );

        setEditingId(
            member.memberId
        );

        setForm({
            memberCode:
                member.memberCode || "",

            firstName:
                member.firstName || "",

            middleName:
                member.middleName || "",

            lastName:
                member.lastName || "",

            gender:
                member.gender || "",

            birthDate:
                toInputDate(
                    member.birthDate
                ),

            contactNumber:
                member.contactNumber || "",

            address:
                member.address || "",

            civilStatus:
                member.civilStatus || "",

            ministry:
                member.ministry || "",

            dateJoined:
                toInputDate(
                    member.dateJoined
                ),

            status:
                member.status || "ACTIVE",

            photoPath:
                member.photoPath || "",
        });

        setError("");
        setMessage("");

        setShowProfile(false);
        setShowForm(true);
    };

    // ========================================================
    // UPDATE FORM
    // ========================================================

    const updateForm = (
        field: keyof MemberForm,
        value: string
    ) => {

        setForm(previous => ({
            ...previous,
            [field]: value,
        }));
    };

    // ========================================================
    // SAVE / UPDATE MEMBER
    // ========================================================

    const saveMember = async () => {

        if (
            !form.firstName.trim()
        ) {
            setError(
                "First name is required."
            );

            return;
        }

        if (
            !form.lastName.trim()
        ) {
            setError(
                "Last name is required."
            );

            return;
        }

        const isEdit =
            editingId !== null;

        try {

            setSaving(true);

            setError("");
            setMessage("");

            console.log(
                "MEMBER SAVE MODE:",
                isEdit
                    ? "UPDATE"
                    : "CREATE"
            );

            console.log(
                "MEMBER ID:",
                editingId
            );

            // ==================================================
            // UPDATE
            // ==================================================

            if (isEdit) {

                const payload = {
                    memberCode:
                        form.memberCode.trim(),

                    firstName:
                        form.firstName.trim(),

                    middleName:
                        form.middleName.trim(),

                    lastName:
                        form.lastName.trim(),

                    gender:
                        form.gender,

                    birthDate:
                        form.birthDate ||
                        null,

                    contactNumber:
                        form.contactNumber.trim(),

                    address:
                        form.address.trim(),

                    civilStatus:
                        form.civilStatus,

                    ministry:
                        form.ministry.trim(),

                    dateJoined:
                        form.dateJoined ||
                        null,

                    status:
                        form.status,

                    photoPath:
                        form.photoPath.trim(),
                };

                console.log(
                    "UPDATE MEMBER PAYLOAD:",
                    payload
                );

                const response =
                    await apiFetch(
                        `${API_BASE_URL}/Members/${editingId}`,
                        {
                            method: "PUT",

                            body:
                                JSON.stringify(
                                    payload
                                ),
                        }
                    );

                console.log(
                    "UPDATE MEMBER RESPONSE:",
                    response.status
                );

                setShowForm(false);

                setEditingId(null);

                setForm({
                    ...emptyForm,
                });

                await loadMembers();

                setMessage(
                    "Member updated successfully."
                );

                return;
            }

            // ==================================================
            // CREATE
            // ==================================================

            const payload = {
                memberCode:
                    form.memberCode.trim(),

                firstName:
                    form.firstName.trim(),

                middleName:
                    form.middleName.trim(),

                lastName:
                    form.lastName.trim(),

                gender:
                    form.gender,

                birthDate:
                    form.birthDate ||
                    null,

                contactNumber:
                    form.contactNumber.trim(),

                address:
                    form.address.trim(),

                civilStatus:
                    form.civilStatus,

                ministry:
                    form.ministry.trim(),

                dateJoined:
                    form.dateJoined ||
                    null,

                status:
                    form.status,
            };

            console.log(
                "CREATE MEMBER PAYLOAD:",
                payload
            );

            const response =
                await apiFetch(
                    `${API_BASE_URL}/Members`,
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                payload
                            ),
                    }
                );

            const createdMember =
                await response.json();

            console.log(
                "CREATED MEMBER:",
                createdMember
            );

            setShowForm(false);

            setEditingId(null);

            setForm({
                ...emptyForm,
            });

            await loadMembers();

            setMessage(
                "Member added successfully."
            );

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

    // ========================================================
    // VIEW PROFILE
    // ========================================================

    const viewProfile = async (
        memberId: number
    ) => {

        setProfileLoading(true);
        setError("");

        try {

            const response =
                await apiFetch(
                    `${API_BASE_URL}/Members/${memberId}/complete-profile`
                );

            const data:
                MemberProfile =
                await response.json();

            setSelectedMember(data);

            setShowProfile(true);

        } catch (err) {

            console.error(
                "PROFILE ERROR:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load member profile."
            );

        } finally {

            setProfileLoading(false);
        }
    };

    // ========================================================
    // DEACTIVATE MEMBER
    // ========================================================

    const deactivateMember = async (
        member: Member
    ) => {

        const confirmed =
            window.confirm(
                `Are you sure you want to deactivate ${getFullName(
                    member
                )}?`
            );

        if (!confirmed) {
            return;
        }

        try {

            setError("");
            setMessage("");

            await apiFetch(
                `${API_BASE_URL}/Members/${member.memberId}`,
                {
                    method: "DELETE",
                }
            );

            await loadMembers();

            setMessage(
                "Member deactivated successfully."
            );

        } catch (err) {

            console.error(
                "DEACTIVATE MEMBER ERROR:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to deactivate member."
            );
        }
    };

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div className="members-page">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="module-header">

                <div className="module-title">

                    <div className="module-icon">
                        <Users size={28} />
                    </div>

                    <div>

                        <h2>
                            Members
                        </h2>

                        <p>
                            Manage EPIC Church
                            membership records
                        </p>

                    </div>

                </div>

                <div className="module-actions">

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={loadMembers}
                        disabled={loading}
                    >
                        <RefreshCw
                            size={18}
                            className={
                                loading
                                    ? "spin"
                                    : ""
                            }
                        />

                        Refresh
                    </button>

                    <button
                        type="button"
                        className="primary-button"
                        onClick={openAddForm}
                    >
                        <Plus size={18} />

                        Add Member
                    </button>

                </div>

            </div>

            {/* ==================================================
                MESSAGE
            ================================================== */}

            {message && (
                <div className="module-success">
                    <CheckCircle size={18} />
                    {message}

                    <button
                        type="button"
                        onClick={() =>
                            setMessage("")
                        }
                    >
                        <X size={15} />
                    </button>
                </div>
            )}

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (
                <div className="module-error">

                    <AlertCircle size={18} />

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                    >
                        <X size={16} />
                    </button>

                </div>
            )}

            {/* ==================================================
                SEARCH
            ================================================== */}

            <div className="members-toolbar">

                <div className="search-box">

                    <Search size={19} />

                    <input
                        type="text"
                        value={search}
                        onChange={e =>
                            setSearch(
                                e.target.value
                            )
                        }
                        placeholder="Search member name, code, contact, or ministry..."
                    />

                    {search && (
                        <button
                            type="button"
                            onClick={() =>
                                setSearch("")
                            }
                        >
                            <X size={16} />
                        </button>
                    )}

                </div>

                <div className="member-count">

                    <strong>
                        {
                            filteredMembers.length
                        }
                    </strong>

                    <span>
                        Members
                    </span>

                </div>

            </div>

            {/* ==================================================
                TABLE
            ================================================== */}

            <div className="members-table-card">

                {loading ? (

                    <div className="table-loading">

                        <RefreshCw
                            size={28}
                            className="spin"
                        />

                        Loading members...

                    </div>

                ) : filteredMembers.length === 0 ? (

                    <div className="table-empty">

                        <Users size={45} />

                        <strong>
                            No members found
                        </strong>

                        <span>
                            Add a new member
                            to begin.
                        </span>

                    </div>

                ) : (

                    <div className="table-wrapper">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Member
                                    </th>

                                    <th>
                                        Contact
                                    </th>

                                    <th>
                                        Ministry
                                    </th>

                                    <th>
                                        Date Joined
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Actions
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredMembers.map(
                                    member => (

                                        <tr
                                            key={
                                                member.memberId
                                            }
                                        >

                                            <td>

                                                <div className="member-cell">

                                                    <div className="member-avatar">

                                                        {member.photoPath ? (

                                                            <img
                                                                src={
                                                                    member.photoPath
                                                                }
                                                                alt={
                                                                    getFullName(
                                                                        member
                                                                    )
                                                                }
                                                            />

                                                        ) : (

                                                            <UserCircle
                                                                size={34}
                                                            />

                                                        )}

                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {
                                                                getFullName(
                                                                    member
                                                                )
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                member.memberCode
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>

                                            <td>
                                                {
                                                    member.contactNumber ||
                                                    "—"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    member.ministry ||
                                                    "—"
                                                }
                                            </td>

                                            <td>
                                                {formatDate(
                                                    member.dateJoined
                                                )}
                                            </td>

                                            <td>

                                                <span
                                                    className={`status-badge ${(
                                                        member.status ||
                                                        "ACTIVE"
                                                    ).toLowerCase()}`}
                                                >
                                                    {
                                                        member.status
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                <div className="action-buttons">

                                                    {/* VIEW */}

                                                    <button
                                                        type="button"
                                                        title="View Profile"
                                                        onClick={() =>
                                                            viewProfile(
                                                                member.memberId
                                                            )
                                                        }
                                                    >
                                                        <Eye
                                                            size={17}
                                                        />
                                                    </button>

                                                    {/* EDIT */}

                                                    <button
                                                        type="button"
                                                        title="Edit Member"
                                                        onClick={() =>
                                                            openEditForm(
                                                                member
                                                            )
                                                        }
                                                    >
                                                        <Edit
                                                            size={17}
                                                        />
                                                    </button>

                                                    {/* DEACTIVATE */}

                                                    {(
                                                        member.status ||
                                                        ""
                                                    ).toUpperCase() ===
                                                        "ACTIVE" && (

                                                        <button
                                                            type="button"
                                                            title="Deactivate"
                                                            className="danger"
                                                            onClick={() =>
                                                                deactivateMember(
                                                                    member
                                                                )
                                                            }
                                                        >
                                                            <UserX
                                                                size={
                                                                    17
                                                                }
                                                            />
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

            {/* ==================================================
                ADD / EDIT MODAL
            ================================================== */}

            {showForm && (

                <div
                    className="modal-overlay"
                    onMouseDown={() =>
                        !saving &&
                        setShowForm(false)
                    }
                >

                    <div
                        className="member-modal"
                        onMouseDown={e =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>

                                <h3>
                                    {editingId !== null
                                        ? "Edit Member"
                                        : "Add New Member"}
                                </h3>

                                <p>
                                    {editingId !== null
                                        ? "Update member information."
                                        : "Register a new EPIC Church member."}
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    !saving &&
                                    setShowForm(false)
                                }
                                disabled={saving}
                            >
                                <X size={22} />
                            </button>

                        </div>

                        <div className="modal-body">

                            {/* BASIC INFORMATION */}

                            <div className="form-section-title">

                                <UserCircle
                                    size={19}
                                />

                                Basic Information

                            </div>

                            <div className="form-grid">

                                <FormField
                                    label="Member Code"
                                    value={
                                        form.memberCode
                                    }
                                    onChange={value =>
                                        updateForm(
                                            "memberCode",
                                            value
                                        )
                                    }
                                    placeholder="Auto-generated if blank"
                                />

                                <FormField
                                    label="First Name *"
                                    value={
                                        form.firstName
                                    }
                                    onChange={value =>
                                        updateForm(
                                            "firstName",
                                            value
                                        )
                                    }
                                    placeholder="First name"
                                />

                                <FormField
                                    label="Middle Name"
                                    value={
                                        form.middleName
                                    }
                                    onChange={value =>
                                        updateForm(
                                            "middleName",
                                            value
                                        )
                                    }
                                    placeholder="Middle name"
                                />

                                <FormField
                                    label="Last Name *"
                                    value={
                                        form.lastName
                                    }
                                    onChange={value =>
                                        updateForm(
                                            "lastName",
                                            value
                                        )
                                    }
                                    placeholder="Last name"
                                />

                                <div className="form-group">

                                    <label>
                                        Gender
                                    </label>

                                    <select
                                        value={
                                            form.gender
                                        }
                                        onChange={e =>
                                            updateForm(
                                                "gender",
                                                e.target.value
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

                                <div className="form-group">

                                    <label>
                                        Birth Date
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            form.birthDate
                                        }
                                        onChange={e =>
                                            updateForm(
                                                "birthDate",
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Civil Status
                                    </label>

                                    <select
                                        value={
                                            form.civilStatus
                                        }
                                        onChange={e =>
                                            updateForm(
                                                "civilStatus",
                                                e.target.value
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

                            {/* CONTACT */}

                            <div className="form-section-title">

                                <Phone size={19} />

                                Contact Information

                            </div>

                            <div className="form-grid">

                                <FormField
                                    label="Contact Number"
                                    value={
                                        form.contactNumber
                                    }
                                    onChange={value =>
                                        updateForm(
                                            "contactNumber",
                                            value
                                        )
                                    }
                                    placeholder="09XXXXXXXXX"
                                />

                                <FormField
                                    label="Ministry"
                                    value={
                                        form.ministry
                                    }
                                    onChange={value =>
                                        updateForm(
                                            "ministry",
                                            value
                                        )
                                    }
                                    placeholder="e.g. Worship, Youth, Ushering"
                                />

                                <div className="form-group full">

                                    <label>
                                        Address
                                    </label>

                                    <textarea
                                        rows={3}
                                        value={
                                            form.address
                                        }
                                        onChange={e =>
                                            updateForm(
                                                "address",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Complete address"
                                    />

                                </div>

                            </div>

                            {/* CHURCH INFORMATION */}

                            <div className="form-section-title">

                                <Church size={19} />

                                Church Information

                            </div>

                            <div className="form-grid">

                                <div className="form-group">

                                    <label>
                                        Date Joined
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            form.dateJoined
                                        }
                                        onChange={e =>
                                            updateForm(
                                                "dateJoined",
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Status
                                    </label>

                                    <select
                                        value={
                                            form.status
                                        }
                                        onChange={e =>
                                            updateForm(
                                                "status",
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option value="ACTIVE">
                                            ACTIVE
                                        </option>

                                        <option value="INACTIVE">
                                            INACTIVE
                                        </option>

                                    </select>

                                </div>

                                <FormField
                                    label="Photo Path"
                                    value={
                                        form.photoPath
                                    }
                                    onChange={value =>
                                        updateForm(
                                            "photoPath",
                                            value
                                        )
                                    }
                                    placeholder="Optional"
                                />

                            </div>

                        </div>

                        {/* MODAL FOOTER */}

                        <div className="modal-footer">

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() =>
                                    setShowForm(false)
                                }
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="primary-button"
                                onClick={saveMember}
                                disabled={saving}
                            >

                                {saving ? (

                                    <>
                                        <RefreshCw
                                            size={18}
                                            className="spin"
                                        />

                                        Saving...
                                    </>

                                ) : (

                                    <>
                                        <Save
                                            size={18}
                                        />

                                        {editingId !== null
                                            ? "Update Member"
                                            : "Save Member"}
                                    </>

                                )}

                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* ==================================================
                PROFILE MODAL
            ================================================== */}

            {(showProfile ||
                profileLoading) && (

                <MemberProfileModal
                    profile={
                        selectedMember
                    }
                    loading={
                        profileLoading
                    }
                    onClose={() => {
                        setShowProfile(false);
                        setSelectedMember(null);
                    }}
                    onEdit={() => {

                        if (
                            selectedMember
                        ) {
                            openEditForm(
                                selectedMember.member
                            );
                        }

                    }}
                />

            )}

        </div>
    );
};

// ============================================================
// FORM FIELD
// ============================================================

function FormField({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (
        value: string
    ) => void;
    placeholder?: string;
}) {

    return (
        <div className="form-group">

            <label>
                {label}
            </label>

            <input
                type="text"
                value={value}
                placeholder={
                    placeholder
                }
                onChange={e =>
                    onChange(
                        e.target.value
                    )
                }
            />

        </div>
    );
}

// ============================================================
// PROFILE MODAL
// ============================================================

function MemberProfileModal({
    profile,
    loading,
    onClose,
    onEdit,
}: {
    profile:
        MemberProfile | null;

    loading: boolean;

    onClose: () => void;

    onEdit: () => void;
}) {

    return (
        <div
            className="modal-overlay"
            onMouseDown={onClose}
        >

            <div
                className="profile-modal"
                onMouseDown={e =>
                    e.stopPropagation()
                }
            >

                {loading ? (

                    <div className="profile-loading">

                        <RefreshCw
                            size={35}
                            className="spin"
                        />

                        <span>
                            Loading member
                            profile...
                        </span>

                    </div>

                ) : profile ? (

                    <>

                        <div className="modal-header">

                            <div>

                                <h3>
                                    Member Profile
                                </h3>

                                <p>
                                    Complete EPIC
                                    membership
                                    record
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                            >
                                <X size={22} />
                            </button>

                        </div>

                        <div className="profile-body">

                            {/* PROFILE HEADER */}

                            <div className="profile-header">

                                <div className="profile-photo">

                                    {profile.member.photoPath ? (

                                        <img
                                            src={
                                                profile
                                                    .member
                                                    .photoPath
                                            }
                                            alt={
                                                getFullName(
                                                    profile.member
                                                )
                                            }
                                        />

                                    ) : (

                                        <UserCircle
                                            size={70}
                                        />

                                    )}

                                </div>

                                <div>

                                    <span className="profile-code">
                                        {
                                            profile
                                                .member
                                                .memberCode
                                        }
                                    </span>

                                    <h2>
                                        {
                                            getFullName(
                                                profile.member
                                            )
                                        }
                                    </h2>

                                    <span
                                        className={`status-badge ${
                                            (
                                                profile
                                                    .member
                                                    .status ||
                                                "ACTIVE"
                                            ).toLowerCase()
                                        }`}
                                    >
                                        {
                                            profile
                                                .member
                                                .status
                                        }
                                    </span>

                                </div>

                            </div>

                            {/* INFORMATION */}

                            <div className="profile-info-grid">

                                <ProfileInfo
                                    icon={
                                        <Phone
                                            size={18}
                                        />
                                    }
                                    label="Contact"
                                    value={
                                        profile.member
                                            .contactNumber ||
                                        "—"
                                    }
                                />

                                <ProfileInfo
                                    icon={
                                        <MapPin
                                            size={18}
                                        />
                                    }
                                    label="Address"
                                    value={
                                        profile.member
                                            .address ||
                                        "—"
                                    }
                                />

                                <ProfileInfo
                                    icon={
                                        <CalendarDays
                                            size={18}
                                        />
                                    }
                                    label="Birth Date"
                                    value={
                                        formatDate(
                                            profile.member
                                                .birthDate
                                        )
                                    }
                                />

                                <ProfileInfo
                                    icon={
                                        <Church
                                            size={18}
                                        />
                                    }
                                    label="Ministry"
                                    value={
                                        profile.member
                                            .ministry ||
                                        "—"
                                    }
                                />

                            </div>

                            {/* ATTENDANCE */}

                            <div className="profile-section">

                                <div className="profile-section-title">

                                    <ClipboardCheck
                                        size={20}
                                    />

                                    <h3>
                                        Attendance
                                        Summary
                                    </h3>

                                </div>

                                <div className="profile-stats">

                                    <ProfileStat
                                        label="Records"
                                        value={
                                            profile
                                                .attendanceSummary
                                                .totalRecords
                                        }
                                    />

                                    <ProfileStat
                                        label="Present"
                                        value={
                                            profile
                                                .attendanceSummary
                                                .present
                                        }
                                    />

                                    <ProfileStat
                                        label="Late"
                                        value={
                                            profile
                                                .attendanceSummary
                                                .late
                                        }
                                    />

                                    <ProfileStat
                                        label="Absent"
                                        value={
                                            profile
                                                .attendanceSummary
                                                .absent
                                        }
                                    />

                                    <ProfileStat
                                        label="Rate"
                                        value={`${profile.attendanceSummary.attendanceRate}%`}
                                    />

                                </div>

                            </div>

                            {/* MINISTRIES */}

                            <div className="profile-section">

                                <div className="profile-section-title">

                                    <Church
                                        size={20}
                                    />

                                    <h3>
                                        Ministry
                                        Assignments
                                    </h3>

                                </div>

                                {profile.ministries
                                    .length ===
                                0 ? (

                                    <p className="empty-text">
                                        No ministry
                                        assignments
                                        recorded.
                                    </p>

                                ) : (

                                    <div className="profile-list">

                                        {profile.ministries.map(
                                            ministry => (

                                                <div
                                                    className="profile-list-row"
                                                    key={
                                                        ministry.ministryMemberId
                                                    }
                                                >

                                                    <div>

                                                        <strong>
                                                            {
                                                                ministry.ministryName
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                ministry.role
                                                            }
                                                        </span>

                                                    </div>

                                                    <span
                                                        className={`status-badge ${
                                                            (
                                                                ministry.status ||
                                                                ""
                                                            ).toLowerCase()
                                                        }`}
                                                    >
                                                        {
                                                            ministry.status
                                                        }
                                                    </span>

                                                </div>

                                            )
                                        )}

                                    </div>

                                )}

                            </div>

                            {/* VISITOR CONVERSION */}

                            <div className="profile-section">

                                <div className="profile-section-title">

                                    <Users
                                        size={20}
                                    />

                                    <h3>
                                        Visitor
                                        Conversion
                                    </h3>

                                </div>

                                {profile.visitorConversion ? (

                                    <div className="conversion-card">

                                        <strong>
                                            Converted
                                            Visitor
                                        </strong>

                                        <span>
                                            Code:{" "}
                                            {
                                                profile
                                                    .visitorConversion
                                                    .visitorCode
                                            }
                                        </span>

                                        <span>
                                            Visits:{" "}
                                            {
                                                profile
                                                    .visitorConversion
                                                    .visitCount
                                            }
                                        </span>

                                        <span>
                                            Conversion
                                            Date:{" "}
                                            {formatDate(
                                                profile
                                                    .visitorConversion
                                                    .conversionDate
                                            )}
                                        </span>

                                    </div>

                                ) : (

                                    <p className="empty-text">
                                        No visitor
                                        conversion
                                        record.
                                    </p>

                                )}

                            </div>

                        </div>

                        <div className="modal-footer">

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={onClose}
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                className="primary-button"
                                onClick={onEdit}
                            >
                                <Edit
                                    size={17}
                                />

                                Edit Member
                            </button>

                        </div>

                    </>

                ) : null}

            </div>

        </div>
    );
}

// ============================================================
// PROFILE INFO
// ============================================================

function ProfileInfo({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {

    return (
        <div className="profile-info">

            <div className="profile-info-icon">
                {icon}
            </div>

            <div>

                <span>
                    {label}
                </span>

                <strong>
                    {value}
                </strong>

            </div>

        </div>
    );
}

// ============================================================
// PROFILE STAT
// ============================================================

function ProfileStat({
    label,
    value,
}: {
    label: string;
    value: number | string;
}) {

    return (
        <div className="profile-stat">

            <span>
                {label}
            </span>

            <strong>
                {value}
            </strong>

        </div>
    );
}

// ============================================================
// HELPERS
// ============================================================

function getFullName(
    member: Member
): string {

    return [
        member.firstName,
        member.middleName,
        member.lastName,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();
}

function toInputDate(
    date: string | null
): string {

    if (!date) {
        return "";
    }

    return date.substring(
        0,
        10
    );
}

function formatDate(
    date: string | null
): string {

    if (!date) {
        return "—";
    }

    const parsed =
        new Date(date);

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return "—";
    }

    return parsed.toLocaleDateString(
        "en-PH",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        }
    );
}

export default Members;