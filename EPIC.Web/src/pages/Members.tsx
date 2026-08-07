import { API_BASE_URL } from "../config";
import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Search,
    Plus,
    RefreshCw,
    Eye,
    Pencil,
    UserX,
    X,
    Users,
    Phone,
    MapPin,
    CalendarDays,
    Church,
    ClipboardCheck,
    Building2,
    UserRound,
    ArrowLeft,
    AlertCircle,
} from "lucide-react";



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
    birthDate?: string | null;
    contactNumber: string;
    address: string;
    civilStatus: string;
    ministry: string;
    dateJoined?: string | null;
    status: string;
    photoPath: string;
    createdDate?: string;
    updatedDate?: string | null;
}

interface CompleteProfile {
    member: Member & {
        fullName: string;
    };

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
        dateAssigned?: string | null;
    }[];

    visitorConversion?: {
        visitorId: number;
        visitorCode: string;
        firstVisitDate: string;
        visitCount: number;
        followUpStatus: string;
        conversionDate?: string | null;
        status: string;
    } | null;
}

interface MemberFormData {
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

const emptyForm: MemberFormData = {
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
// HELPERS
// ============================================================

function getToken(): string | null {
    return localStorage.getItem("token");
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return "An unexpected error occurred.";
}

function formatDate(value?: string | null): string {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function getFullName(member: Member): string {
    return [
        member.firstName,
        member.middleName,
        member.lastName,
    ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
}

// ============================================================
// API REQUEST
// ============================================================

async function apiRequest(
    endpoint: string,
    options: RequestInit = {}
): Promise<unknown> {
    const token = getToken();

    if (!token) {
        throw new Error(
            "Your session has expired. Please sign in again."
        );
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("epicUser");

        window.location.reload();

        throw new Error(
            "Your session has expired. Please sign in again."
        );
    }

    const text = await response.text();

    let data: unknown = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    if (!response.ok) {
        if (typeof data === "string") {
            throw new Error(data);
        }

        if (
            data &&
            typeof data === "object" &&
            "message" in data
        ) {
            throw new Error(
                String(
                    (data as { message: unknown }).message
                )
            );
        }

        throw new Error(
            `API ERROR: ${response.status}`
        );
    }

    return data;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Members() {
    const [members, setMembers] =
        useState<Member[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("ALL");

    const [showForm, setShowForm] =
        useState(false);

    const [editingId, setEditingId] =
        useState<number | null>(null);

    const [form, setForm] =
        useState<MemberFormData>(emptyForm);

    const [selectedMember, setSelectedMember] =
        useState<CompleteProfile | null>(null);

    const [, setProfileLoading] =
        useState(false);

    const [confirmDeactivate, setConfirmDeactivate] =
        useState<Member | null>(null);

    // ========================================================
    // LOAD MEMBERS
    // ========================================================

    const loadMembers = async () => {
        try {
            setLoading(true);
            setError("");

            const data =
                await apiRequest("/Members");

            setMembers(
                Array.isArray(data)
                    ? (data as Member[])
                    : []
            );
        } catch (err) {
            console.error(err);

            setError(
                getErrorMessage(err)
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMembers();
    }, []);

    // ========================================================
    // FILTER
    // ========================================================

    const filteredMembers = useMemo(() => {
        const keyword =
            search.trim().toLowerCase();

        return members.filter((member) => {
            const fullName =
                getFullName(member).toLowerCase();

            const matchesSearch =
                !keyword ||
                (member.memberCode || "")
                    .toLowerCase()
                    .includes(keyword) ||
                fullName.includes(keyword) ||
                (member.contactNumber || "")
                    .toLowerCase()
                    .includes(keyword) ||
                (member.ministry || "")
                    .toLowerCase()
                    .includes(keyword);

            const matchesStatus =
                statusFilter === "ALL" ||
                member.status === statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );
        });
    }, [
        members,
        search,
        statusFilter,
    ]);

    // ========================================================
    // STATISTICS
    // ========================================================

    const totalMembers =
        members.length;

    const activeMembers =
        members.filter(
            (m) => m.status === "ACTIVE"
        ).length;

    const inactiveMembers =
        members.filter(
            (m) => m.status === "INACTIVE"
        ).length;

    const ministryCount =
        new Set(
            members
                .map((m) => m.ministry)
                .filter(Boolean)
        ).size;

    // ========================================================
    // OPEN ADD FORM
    // ========================================================

    const openAddForm = () => {
        setEditingId(null);
        setForm({ ...emptyForm });
        setError("");
        setSuccess("");
        setShowForm(true);
    };

    // ========================================================
    // OPEN EDIT FORM
    // ========================================================

    const openEditForm = (
        member: Member
    ) => {
        setEditingId(member.memberId);

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
                member.birthDate
                    ? member.birthDate.substring(
                        0,
                        10
                    )
                    : "",

            contactNumber:
                member.contactNumber || "",

            address:
                member.address || "",

            civilStatus:
                member.civilStatus || "",

            ministry:
                member.ministry || "",

            dateJoined:
                member.dateJoined
                    ? member.dateJoined.substring(
                        0,
                        10
                    )
                    : "",

            status:
                member.status || "ACTIVE",

            photoPath:
                member.photoPath || "",
        });

        setSelectedMember(null);
        setError("");
        setSuccess("");
        setShowForm(true);
    };

    // ========================================================
    // CLOSE FORM
    // ========================================================

    const closeForm = () => {
        if (saving) return;

        setShowForm(false);
        setEditingId(null);
        setForm({ ...emptyForm });
    };

    // ========================================================
    // FORM CHANGE
    // ========================================================

    const updateField = (
        field: keyof MemberFormData,
        value: string
    ) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    // ========================================================
    // SAVE MEMBER
    // ========================================================

    const saveMember = async () => {
        setError("");
        setSuccess("");

        if (!form.firstName.trim()) {
            setError(
                "FIRST NAME IS REQUIRED."
            );
            return;
        }

        if (!form.lastName.trim()) {
            setError(
                "LAST NAME IS REQUIRED."
            );
            return;
        }

        try {
            setSaving(true);

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
                    form.gender.trim(),

                birthDate:
                    form.birthDate || null,

                contactNumber:
                    form.contactNumber.trim(),

                address:
                    form.address.trim(),

                civilStatus:
                    form.civilStatus.trim(),

                ministry:
                    form.ministry.trim(),

                dateJoined:
                    form.dateJoined || null,

                status:
                    form.status || "ACTIVE",

                photoPath:
                    form.photoPath.trim(),
            };

            if (editingId !== null) {
                await apiRequest(
                    `/Members/${editingId}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(
                            payload
                        ),
                    }
                );

                setSuccess(
                    "MEMBER UPDATED SUCCESSFULLY."
                );
            } else {
                await apiRequest(
                    "/Members",
                    {
                        method: "POST",
                        body: JSON.stringify(
                            payload
                        ),
                    }
                );

                setSuccess(
                    "MEMBER ADDED SUCCESSFULLY."
                );
            }

            await loadMembers();

            setShowForm(false);
            setEditingId(null);
            setForm({ ...emptyForm });

            setTimeout(() => {
                setSuccess("");
            }, 4000);
        } catch (err) {
            console.error(err);

            setError(
                getErrorMessage(err)
            );
        } finally {
            setSaving(false);
        }
    };

    // ========================================================
    // VIEW PROFILE — FIXED
    // ========================================================

    const viewProfile = async (
        memberId: number
    ) => {
        try {
            setProfileLoading(true);
            setError("");

            const data =
                await apiRequest(
                    `/Members/${memberId}/profile`
                );

            if (!data || typeof data !== "object") {
                throw new Error(
                    "Invalid member profile response from the API."
                );
            }

            setSelectedMember(
                data as CompleteProfile
            );
        } catch (err) {
            console.error(
                "VIEW MEMBER PROFILE ERROR:",
                err
            );

            setError(
                getErrorMessage(err)
            );
        } finally {
            setProfileLoading(false);
        }
    };

    // ========================================================
    // DEACTIVATE
    // ========================================================

    const deactivateMember = async () => {
        if (!confirmDeactivate) return;

        try {
            setLoading(true);
            setError("");

            await apiRequest(
                `/Members/${confirmDeactivate.memberId}`,
                {
                    method: "DELETE",
                }
            );

            setConfirmDeactivate(null);

            setSuccess(
                "MEMBER DEACTIVATED SUCCESSFULLY."
            );

            await loadMembers();

            setTimeout(() => {
                setSuccess("");
            }, 4000);
        } catch (err) {
            console.error(err);

            setError(
                getErrorMessage(err)
            );
        } finally {
            setLoading(false);
        }
    };

    // ========================================================
    // PROFILE VIEW
    // ========================================================

    if (selectedMember) {
        return (
            <MemberProfile
                profile={selectedMember}
                onBack={() =>
                    setSelectedMember(null)
                }
                onEdit={() => {
                    const member =
                        members.find(
                            (m) =>
                                m.memberId ===
                                selectedMember
                                    .member
                                    .memberId
                        );

                    if (member) {
                        openEditForm(member);
                    }
                }}
            />
        );
    }

    // ========================================================
    // PAGE
    // ========================================================

    return (
        <div className="members-page">

            <div className="page-header">

                <div>

                    <div className="page-title-icon">

                        <div className="module-icon">
                            <Users size={24} />
                        </div>

                        <div>

                            <h2>
                                Members Management
                            </h2>

                            <p>
                                Manage church members,
                                profiles, ministries,
                                and membership status.
                            </p>

                        </div>

                    </div>

                </div>

                <div className="page-actions">

                    <button
                        className="secondary-button"
                        onClick={loadMembers}
                        disabled={loading}
                    >
                        <RefreshCw
                            size={17}
                            className={
                                loading
                                    ? "spin"
                                    : ""
                            }
                        />

                        Refresh
                    </button>

                    <button
                        className="primary-button"
                        onClick={openAddForm}
                    >
                        <Plus size={18} />

                        Add Member
                    </button>

                </div>

            </div>

            {/* ALERTS */}

            {error && (
                <div className="module-alert error">

                    <AlertCircle size={20} />

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                    >
                        <X size={17} />
                    </button>

                </div>
            )}

            {success && (
                <div className="module-alert success">

                    <span>
                        ✓
                    </span>

                    <span>
                        {success}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setSuccess("")
                        }
                    >
                        <X size={17} />
                    </button>

                </div>
            )}

            {/* STATISTICS */}

            <div className="member-stat-grid">

                <MemberStat
                    title="Total Members"
                    value={totalMembers}
                    subtitle="All registered members"
                    icon={
                        <Users size={22} />
                    }
                />

                <MemberStat
                    title="Active Members"
                    value={activeMembers}
                    subtitle="Currently active"
                    icon={
                        <UserRound size={22} />
                    }
                />

                <MemberStat
                    title="Inactive Members"
                    value={inactiveMembers}
                    subtitle="Inactive records"
                    icon={
                        <UserX size={22} />
                    }
                />

                <MemberStat
                    title="Ministries"
                    value={ministryCount}
                    subtitle="Ministries represented"
                    icon={
                        <Building2 size={22} />
                    }
                />

            </div>

            {/* SEARCH */}

            <div className="member-toolbar">

                <div className="member-search">

                    <Search size={19} />

                    <input
                        value={search}
                        onChange={(e) =>
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
                            <X size={17} />
                        </button>
                    )}

                </div>

                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(
                            e.target.value
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

            {/* MEMBER TABLE */}

            <div className="member-table-card">

                <div className="table-heading">

                    <div>

                        <h3>
                            Church Members
                        </h3>

                        <p>
                            Showing{" "}
                            {
                                filteredMembers.length
                            }{" "}
                            of{" "}
                            {members.length}{" "}
                            members
                        </p>

                    </div>

                </div>

                {loading &&
                    members.length === 0 ? (
                    <div className="module-loading">

                        <RefreshCw
                            size={28}
                            className="spin"
                        />

                        <span>
                            Loading members...
                        </span>

                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="empty-state">

                        <Users size={40} />

                        <h3>
                            No Members Found
                        </h3>

                        <p>
                            Try changing your
                            search or add a new
                            member.
                        </p>

                        <button
                            className="primary-button"
                            onClick={openAddForm}
                        >
                            <Plus size={17} />

                            Add Member
                        </button>

                    </div>
                ) : (
                    <div className="member-table-wrapper">

                        <table className="member-table">

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
                                        Joined
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
                                    (member) => (
                                        <tr
                                            key={
                                                member.memberId
                                            }
                                        >

                                            <td>

                                                <div className="member-name-cell">

                                                    <div className="member-avatar">

                                                        {member
                                                            .firstName
                                                            ?.charAt(0)
                                                            .toUpperCase()}

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

                                                <div className="table-contact">

                                                    <Phone
                                                        size={14}
                                                    />

                                                    {
                                                        member.contactNumber ||
                                                        "—"
                                                    }

                                                </div>

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
                                                    className={`status-badge ${member.status ===
                                                            "ACTIVE"
                                                            ? "active"
                                                            : "inactive"
                                                        }`}
                                                >
                                                    {
                                                        member.status
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                <div className="table-actions">

                                                    <button
                                                        type="button"
                                                        className="icon-action view"
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

                                                    <button
                                                        type="button"
                                                        className="icon-action edit"
                                                        title="Edit Member"
                                                        onClick={() =>
                                                            openEditForm(
                                                                member
                                                            )
                                                        }
                                                    >
                                                        <Pencil
                                                            size={17}
                                                        />
                                                    </button>

                                                    {member.status ===
                                                        "ACTIVE" && (
                                                            <button
                                                                type="button"
                                                                className="icon-action deactivate"
                                                                title="Deactivate Member"
                                                                onClick={() =>
                                                                    setConfirmDeactivate(
                                                                        member
                                                                    )
                                                                }
                                                            >
                                                                <UserX
                                                                    size={17}
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

            {/* ADD / EDIT */}

            {showForm && (
                <MemberForm
                    form={form}
                    editingId={editingId}
                    saving={saving}
                    onChange={updateField}
                    onSave={saveMember}
                    onClose={closeForm}
                />
            )}

            {/* DEACTIVATE */}

            {confirmDeactivate && (
                <div className="modal-overlay">

                    <div className="confirm-modal">

                        <div className="confirm-icon">
                            <UserX size={28} />
                        </div>

                        <h3>
                            Deactivate Member?
                        </h3>

                        <p>
                            Are you sure you want
                            to deactivate{" "}
                            <strong>
                                {
                                    getFullName(
                                        confirmDeactivate
                                    )
                                }
                            </strong>
                            ?
                        </p>

                        <div className="confirm-actions">

                            <button
                                className="secondary-button"
                                onClick={() =>
                                    setConfirmDeactivate(
                                        null
                                    )
                                }
                            >
                                Cancel
                            </button>

                            <button
                                className="danger-button"
                                onClick={
                                    deactivateMember
                                }
                            >
                                <UserX size={17} />

                                Deactivate
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

// ============================================================
// STAT CARD
// ============================================================

function MemberStat({
    title,
    value,
    subtitle,
    icon,
}: {
    title: string;
    value: number;
    subtitle: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="member-stat-card">

            <div className="member-stat-icon">
                {icon}
            </div>

            <div>

                <span>
                    {title}
                </span>

                <strong>
                    {value}
                </strong>

                <small>
                    {subtitle}
                </small>

            </div>

        </div>
    );
}

// ============================================================
// MEMBER FORM
// ============================================================

function MemberForm({
    form,
    editingId,
    saving,
    onChange,
    onSave,
    onClose,
}: {
    form: MemberFormData;
    editingId: number | null;
    saving: boolean;
    onChange: (
        field: keyof MemberFormData,
        value: string
    ) => void;
    onSave: () => void;
    onClose: () => void;
}) {
    return (
        <div className="modal-overlay">

            <div className="member-form-modal">

                <div className="modal-header">

                    <div>

                        <div className="modal-title-icon">
                            <Users size={21} />
                        </div>

                        <div>

                            <h3>
                                {editingId !== null
                                    ? "Edit Member"
                                    : "Add New Member"}
                            </h3>

                            <p>
                                {editingId !== null
                                    ? "Update member information."
                                    : "Register a new church member."}
                            </p>

                        </div>

                    </div>

                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}
                        disabled={saving}
                    >
                        <X size={21} />
                    </button>

                </div>

                <div className="member-form">

                    <div className="form-group">

                        <label>
                            Member Code
                        </label>

                        <input
                            value={form.memberCode}
                            onChange={(e) =>
                                onChange(
                                    "memberCode",
                                    e.target.value
                                )
                            }
                            placeholder="Auto-generated if blank"
                            disabled={
                                editingId === null
                            }
                        />

                    </div>

                    <div className="form-row">

                        <div className="form-group">

                            <label>
                                First Name *
                            </label>

                            <input
                                value={
                                    form.firstName
                                }
                                onChange={(e) =>
                                    onChange(
                                        "firstName",
                                        e.target.value
                                    )
                                }
                                placeholder="First name"
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                Middle Name
                            </label>

                            <input
                                value={
                                    form.middleName
                                }
                                onChange={(e) =>
                                    onChange(
                                        "middleName",
                                        e.target.value
                                    )
                                }
                                placeholder="Middle name"
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                Last Name *
                            </label>

                            <input
                                value={
                                    form.lastName
                                }
                                onChange={(e) =>
                                    onChange(
                                        "lastName",
                                        e.target.value
                                    )
                                }
                                placeholder="Last name"
                            />

                        </div>

                    </div>

                    <div className="form-row">

                        <div className="form-group">

                            <label>
                                Gender
                            </label>

                            <select
                                value={form.gender}
                                onChange={(e) =>
                                    onChange(
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
                                onChange={(e) =>
                                    onChange(
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
                                onChange={(e) =>
                                    onChange(
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

                    <div className="form-row">

                        <div className="form-group">

                            <label>
                                Contact Number
                            </label>

                            <input
                                value={
                                    form.contactNumber
                                }
                                onChange={(e) =>
                                    onChange(
                                        "contactNumber",
                                        e.target.value
                                    )
                                }
                                placeholder="09XXXXXXXXX"
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                Ministry
                            </label>

                            <input
                                value={
                                    form.ministry
                                }
                                onChange={(e) =>
                                    onChange(
                                        "ministry",
                                        e.target.value
                                    )
                                }
                                placeholder="e.g. WORSHIP"
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                Date Joined
                            </label>

                            <input
                                type="date"
                                value={
                                    form.dateJoined
                                }
                                onChange={(e) =>
                                    onChange(
                                        "dateJoined",
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                    </div>

                    <div className="form-row">

                        <div className="form-group">

                            <label>
                                Status
                            </label>

                            <select
                                value={form.status}
                                onChange={(e) =>
                                    onChange(
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

                        <div className="form-group form-wide">

                            <label>
                                Photo Path
                            </label>

                            <input
                                value={
                                    form.photoPath
                                }
                                onChange={(e) =>
                                    onChange(
                                        "photoPath",
                                        e.target.value
                                    )
                                }
                                placeholder="Optional photo path"
                            />

                        </div>

                    </div>

                    <div className="form-group">

                        <label>
                            Address
                        </label>

                        <textarea
                            value={form.address}
                            onChange={(e) =>
                                onChange(
                                    "address",
                                    e.target.value
                                )
                            }
                            placeholder="Complete address"
                            rows={3}
                        />

                    </div>

                </div>

                <div className="modal-footer">

                    <button
                        className="secondary-button"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </button>

                    <button
                        className="primary-button"
                        onClick={onSave}
                        disabled={saving}
                    >

                        {saving ? (
                            <>
                                <RefreshCw
                                    size={17}
                                    className="spin"
                                />

                                Saving...
                            </>
                        ) : (
                            <>
                                <Users size={17} />

                                {editingId !== null
                                    ? "Update Member"
                                    : "Save Member"}
                            </>
                        )}

                    </button>

                </div>

            </div>

        </div>
    );
}

// ============================================================
// MEMBER PROFILE
// ============================================================

function MemberProfile({
    profile,
    onBack,
    onEdit,
}: {
    profile: CompleteProfile;
    onBack: () => void;
    onEdit: () => void;
}) {
    const member =
        profile.member;

    return (
        <div className="members-page">

            <div className="profile-topbar">

                <button
                    className="secondary-button"
                    onClick={onBack}
                >
                    <ArrowLeft size={17} />

                    Back to Members
                </button>

                <button
                    className="primary-button"
                    onClick={onEdit}
                >
                    <Pencil size={17} />

                    Edit Member
                </button>

            </div>

            <div className="member-profile-header">

                <div className="large-member-avatar">

                    {member.firstName
                        ?.charAt(0)
                        .toUpperCase()}

                </div>

                <div className="profile-main-info">

                    <div className="profile-code">
                        {member.memberCode}
                    </div>

                    <h2>
                        {member.fullName ||
                            getFullName(member)}
                    </h2>

                    <span
                        className={`status-badge ${member.status ===
                                "ACTIVE"
                                ? "active"
                                : "inactive"
                            }`}
                    >
                        {member.status}
                    </span>

                </div>

            </div>

            {/* BASIC INFORMATION */}

            <div className="profile-grid">

                <div className="profile-panel">

                    <div className="profile-panel-heading">

                        <UserRound size={20} />

                        <h3>
                            Personal Information
                        </h3>

                    </div>

                    <ProfileInfo
                        label="Gender"
                        value={
                            member.gender
                        }
                    />

                    <ProfileInfo
                        label="Birth Date"
                        value={formatDate(
                            member.birthDate
                        )}
                    />

                    <ProfileInfo
                        label="Civil Status"
                        value={
                            member.civilStatus
                        }
                    />

                    <ProfileInfo
                        label="Contact Number"
                        value={
                            member.contactNumber
                        }
                        icon={
                            <Phone size={15} />
                        }
                    />

                    <ProfileInfo
                        label="Address"
                        value={
                            member.address
                        }
                        icon={
                            <MapPin size={15} />
                        }
                    />

                </div>

                <div className="profile-panel">

                    <div className="profile-panel-heading">

                        <Church size={20} />

                        <h3>
                            Church Information
                        </h3>

                    </div>

                    <ProfileInfo
                        label="Ministry"
                        value={
                            member.ministry
                        }
                    />

                    <ProfileInfo
                        label="Date Joined"
                        value={formatDate(
                            member.dateJoined
                        )}
                        icon={
                            <CalendarDays
                                size={15}
                            />
                        }
                    />

                    <ProfileInfo
                        label="Member Code"
                        value={
                            member.memberCode
                        }
                    />

                    <ProfileInfo
                        label="Created"
                        value={formatDate(
                            member.createdDate
                        )}
                    />

                </div>

            </div>

            {/* ATTENDANCE SUMMARY */}

            <div className="profile-panel full-width">

                <div className="profile-panel-heading">

                    <ClipboardCheck
                        size={20}
                    />

                    <div>

                        <h3>
                            Attendance Summary
                        </h3>

                        <p>
                            Member attendance
                            history
                        </p>

                    </div>

                </div>

                <div className="attendance-stat-grid">

                    <ProfileStat
                        label="Total Records"
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
                        label="Early"
                        value={
                            profile
                                .attendanceSummary
                                .early
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
                        label="Excused"
                        value={
                            profile
                                .attendanceSummary
                                .excused
                        }
                    />

                    <ProfileStat
                        label="Attendance Rate"
                        value={`${profile.attendanceSummary.attendanceRate}%`}
                    />

                </div>

            </div>

            {/* MINISTRIES */}

            <div className="profile-panel full-width">

                <div className="profile-panel-heading">

                    <Building2 size={20} />

                    <div>

                        <h3>
                            Ministry Assignments
                        </h3>

                        <p>
                            Current and previous
                            ministry assignments
                        </p>

                    </div>

                </div>

                {profile.ministries.length === 0 ? (
                    <div className="profile-empty">
                        No ministry assignments
                        recorded.
                    </div>
                ) : (
                    <div className="profile-table-wrapper">

                        <table className="profile-table">

                            <thead>

                                <tr>

                                    <th>
                                        Ministry
                                    </th>

                                    <th>
                                        Role
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Date Assigned
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {profile.ministries.map(
                                    (ministry) => (
                                        <tr
                                            key={
                                                ministry.ministryMemberId
                                            }
                                        >

                                            <td>
                                                {
                                                    ministry.ministryName
                                                }
                                            </td>

                                            <td>
                                                {
                                                    ministry.role ||
                                                    "—"
                                                }
                                            </td>

                                            <td>

                                                <span
                                                    className={`status-badge ${ministry.status ===
                                                            "ACTIVE"
                                                            ? "active"
                                                            : "inactive"
                                                        }`}
                                                >
                                                    {
                                                        ministry.status
                                                    }
                                                </span>

                                            </td>

                                            <td>
                                                {formatDate(
                                                    ministry.dateAssigned
                                                )}
                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

            {/* VISITOR CONVERSION */}

            {profile.visitorConversion && (
                <div className="profile-panel full-width">

                    <div className="profile-panel-heading">

                        <Users size={20} />

                        <div>

                            <h3>
                                Visitor Conversion
                            </h3>

                            <p>
                                Visitor-to-member
                                history
                            </p>

                        </div>

                    </div>

                    <div className="conversion-grid">

                        <ProfileInfo
                            label="Visitor Code"
                            value={
                                profile
                                    .visitorConversion
                                    .visitorCode
                            }
                        />

                        <ProfileInfo
                            label="First Visit"
                            value={formatDate(
                                profile
                                    .visitorConversion
                                    .firstVisitDate
                            )}
                        />

                        <ProfileInfo
                            label="Visit Count"
                            value={String(
                                profile
                                    .visitorConversion
                                    .visitCount
                            )}
                        />

                        <ProfileInfo
                            label="Follow-up"
                            value={
                                profile
                                    .visitorConversion
                                    .followUpStatus
                            }
                        />

                        <ProfileInfo
                            label="Conversion Date"
                            value={formatDate(
                                profile
                                    .visitorConversion
                                    .conversionDate
                            )}
                        />

                    </div>

                </div>
            )}

            {/* ATTENDANCE HISTORY */}

            <div className="profile-panel full-width">

                <div className="profile-panel-heading">

                    <ClipboardCheck
                        size={20}
                    />

                    <div>

                        <h3>
                            Attendance History
                        </h3>

                        <p>
                            Detailed attendance
                            records
                        </p>

                    </div>

                </div>

                {profile.attendanceHistory.length === 0 ? (
                    <div className="profile-empty">
                        No attendance records
                        found.
                    </div>
                ) : (
                    <div className="profile-table-wrapper">

                        <table className="profile-table">

                            <thead>

                                <tr>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Service
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Recorded By
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {profile.attendanceHistory.map(
                                    (attendance) => (
                                        <tr
                                            key={
                                                attendance.attendanceId
                                            }
                                        >

                                            <td>
                                                {formatDate(
                                                    attendance.attendanceDate
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    attendance.service
                                                }
                                            </td>

                                            <td>

                                                <span
                                                    className={`attendance-status ${(
                                                        attendance.status ||
                                                        ""
                                                    ).toLowerCase()}`}
                                                >
                                                    {
                                                        attendance.status
                                                    }
                                                </span>

                                            </td>

                                            <td>
                                                {
                                                    attendance.recordedBy
                                                }
                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

        </div>
    );
}

// ============================================================
// PROFILE INFO
// ============================================================

function ProfileInfo({
    label,
    value,
    icon,
}: {
    label: string;
    value?: string | null;
    icon?: React.ReactNode;
}) {
    return (
        <div className="profile-info">

            <span>
                {label}
            </span>

            <strong>

                {icon}

                {value || "—"}

            </strong>

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
    value: string | number;
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