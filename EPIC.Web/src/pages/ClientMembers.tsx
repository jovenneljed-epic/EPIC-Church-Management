import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import axios from "axios";

import { API_BASE_URL } from "../config";

import "./ClientMembers.css";

// =========================================================
// TYPES
// =========================================================

interface Member {
    memberId: number;
    customerId: number;

    memberCode?: string | null;

    firstName: string;
    middleName?: string | null;
    lastName: string;

    gender?: string | null;
    birthDate?: string | null;

    contactNumber?: string | null;
    address?: string | null;

    civilStatus?: string | null;
    ministry?: string | null;

    dateJoined?: string | null;

    status?: string | null;

    photoPath?: string | null;

    createdDate?: string | null;
    updatedDate?: string | null;
}

interface ClientMembersProps {
    onBack?: () => void;
}

interface CreateMemberForm {
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
}

// =========================================================
// CONSTANTS
// =========================================================

const DEFAULT_STATUS = "ACTIVE";

const EMPTY_MEMBER_FORM: CreateMemberForm = {
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
    status: DEFAULT_STATUS,
};

// =========================================================
// AUTH
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

const getAuthConfig = () => {
    const token = getClientToken();

    if (!token) {
        throw new Error(
            "Your client session could not be found. Please sign in again."
        );
    }

    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

// =========================================================
// HELPERS
// =========================================================

const getMemberName = (member: Member): string => {
    return [
        member.firstName,
        member.middleName,
        member.lastName,
    ]
        .filter(
            (value) =>
                typeof value === "string" &&
                value.trim().length > 0 &&
                value.trim().toUpperCase() !== "N/A"
        )
        .map((value) => value!.trim())
        .join(" ")
        .trim() || "Unnamed Member";
};

const getMemberInitials = (member: Member): string => {
    const first =
        member.firstName?.trim().charAt(0) || "";

    const last =
        member.lastName?.trim().charAt(0) || "";

    return (
        `${first}${last}`.toUpperCase() ||
        "M"
    );
};

const getStatus = (
    status?: string | null
): string => {
    return (
        status?.trim() ||
        DEFAULT_STATUS
    ).toUpperCase();
};

const isActiveStatus = (
    status?: string | null
): boolean => {
    return getStatus(status) === "ACTIVE";
};

const formatDate = (
    value?: string | null
): string => {
    if (!value) {
        return "Not provided";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not provided";
    }

    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        }
    );
};

const extractApiError = (
    error: unknown,
    fallback: string
): string => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data;

        if (
            typeof data?.message === "string" &&
            data.message.trim()
        ) {
            return data.message;
        }

        if (
            typeof data === "string" &&
            data.trim()
        ) {
            return data;
        }

        switch (error.response?.status) {
            case 400:
                return "The submitted member information is invalid.";

            case 401:
                return "Your client session has expired. Please sign in again.";

            case 403:
                return "You do not have permission to manage members.";

            case 404:
                return "The requested member was not found.";

            case 409:
                return "A member with the same information already exists.";

            case 500:
                return "The server encountered an error. Please try again.";

            default:
                return fallback;
        }
    }

    if (
        error instanceof Error &&
        error.message
    ) {
        return error.message;
    }

    return fallback;
};

// =========================================================
// INFO ITEM
// =========================================================

interface InfoItemProps {
    label: string;
    value?: React.ReactNode;
    fullWidth?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({
    label,
    value,
    fullWidth = false,
}) => {
    return (
        <div
            className={[
                "epic-members-info-item",
                fullWidth
                    ? "epic-members-info-item-full"
                    : "",
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <span>{label}</span>

            <strong>
                {value || "Not provided"}
            </strong>
        </div>
    );
};

// =========================================================
// LOADING VIEW
// =========================================================

const LoadingView: React.FC = () => {
    return (
        <div className="epic-members-page-state">
            <div className="epic-members-loading-card">
                <div className="epic-members-loading-mark">
                    E
                </div>

                <div className="epic-members-spinner" />

                <h2>
                    Loading Members
                </h2>

                <p>
                    Securely retrieving your church
                    membership records...
                </p>
            </div>
        </div>
    );
};

// =========================================================
// ERROR VIEW
// =========================================================

interface ErrorViewProps {
    message: string;
    onRetry: () => void;
    onBack?: () => void;
}

const ErrorView: React.FC<ErrorViewProps> = ({
    message,
    onRetry,
    onBack,
}) => {
    return (
        <div className="epic-members-page-state">
            <div className="epic-members-error-card">
                <div className="epic-members-error-mark">
                    !
                </div>

                <div className="epic-members-error-brand">
                    EPIC CLIENT PORTAL
                </div>

                <h2>
                    Unable to Load Members
                </h2>

                <p>
                    {message}
                </p>

                <div className="epic-members-error-actions">
                    {onBack && (
                        <button
                            type="button"
                            className="epic-members-secondary-button"
                            onClick={onBack}
                        >
                            ← Back to Dashboard
                        </button>
                    )}

                    <button
                        type="button"
                        className="epic-members-primary-button"
                        onClick={onRetry}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );
};

// =========================================================
// MEMBER PROFILE MODAL
// =========================================================

interface MemberModalProps {
    member: Member;
    onClose: () => void;
}

const MemberModal: React.FC<MemberModalProps> = ({
    member,
    onClose,
}) => {
    const status = getStatus(member.status);
    const active = isActiveStatus(member.status);

    return (
        <div
            className="epic-member-modal-overlay"
            onClick={onClose}
        >
            <div
                className="epic-member-modal"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >
                <button
                    type="button"
                    className="epic-member-modal-close"
                    onClick={onClose}
                    aria-label="Close member profile"
                >
                    ×
                </button>

                <div className="epic-member-modal-profile">
                    <div className="epic-member-modal-avatar">
                        {getMemberInitials(member)}
                    </div>

                    <div className="epic-member-modal-heading">
                        <span>
                            MEMBER PROFILE
                        </span>

                        <h2>
                            {getMemberName(member)}
                        </h2>

                        <div className="epic-member-modal-meta">
                            <small>
                                {member.memberCode ||
                                    `Member #${member.memberId}`}
                            </small>

                            <span className="epic-member-modal-dot">
                                •
                            </span>

                            <span
                                className={[
                                    "epic-member-modal-status",
                                    active
                                        ? "active"
                                        : "inactive",
                                ].join(" ")}
                            >
                                <i />
                                {status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="epic-member-modal-section-title">
                    MEMBER INFORMATION
                </div>

                <div className="epic-member-modal-grid">
                    <InfoItem
                        label="Member Code"
                        value={
                            member.memberCode ||
                            `#${member.memberId}`
                        }
                    />

                    <InfoItem
                        label="Gender"
                        value={member.gender}
                    />

                    <InfoItem
                        label="Civil Status"
                        value={member.civilStatus}
                    />

                    <InfoItem
                        label="Contact Number"
                        value={member.contactNumber}
                    />

                    <InfoItem
                        label="Ministry"
                        value={
                            member.ministry ||
                            "Not assigned"
                        }
                    />

                    <InfoItem
                        label="Date Joined"
                        value={formatDate(
                            member.dateJoined
                        )}
                    />

                    <InfoItem
                        label="Birth Date"
                        value={formatDate(
                            member.birthDate
                        )}
                    />

                    <InfoItem
                        label="Address"
                        value={member.address}
                        fullWidth
                    />
                </div>

                <div className="epic-member-modal-footer">
                    <span>
                        EPIC SECURE MEMBER RECORD
                    </span>

                    <button
                        type="button"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// =========================================================
// ADD MEMBER MODAL
// =========================================================

interface AddMemberModalProps {
    form: CreateMemberForm;
    saving: boolean;
    error: string;
    success: string;

    onClose: () => void;

    onSubmit: (
        event: React.FormEvent<HTMLFormElement>
    ) => void;

    onChange: (
        field: keyof CreateMemberForm,
        value: string
    ) => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
    form,
    saving,
    error,
    success,
    onClose,
    onSubmit,
    onChange,
}) => {
    return (
        <div
            className="epic-member-modal-overlay"
            onClick={() => {
                if (!saving) {
                    onClose();
                }
            }}
        >
            <div
                className="epic-member-modal epic-member-add-modal"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >
                <button
                    type="button"
                    className="epic-member-modal-close"
                    onClick={onClose}
                    disabled={saving}
                    aria-label="Close add member"
                >
                    ×
                </button>

                <div className="epic-member-modal-profile">
                    <div className="epic-member-modal-avatar epic-member-add-avatar">
                        +
                    </div>

                    <div className="epic-member-modal-heading">
                        <span>
                            MEMBER REGISTRATION
                        </span>

                        <h2>
                            Add New Member
                        </h2>

                        <div className="epic-member-modal-meta">
                            <small>
                                Register a new member
                                securely
                            </small>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="epic-member-form-alert error">
                        <strong>
                            Unable to add member
                        </strong>

                        <span>
                            {error}
                        </span>
                    </div>
                )}

                {success && (
                    <div className="epic-member-form-alert success">
                        <strong>
                            ✓ Member Added
                        </strong>

                        <span>
                            {success}
                        </span>
                    </div>
                )}

                <form
                    onSubmit={onSubmit}
                    className="epic-member-form"
                >
                    <div className="epic-member-form-section">
                        MEMBER INFORMATION
                    </div>

                    <div className="epic-member-form-grid">
                        <label>
                            <span>
                                First Name *
                            </span>

                            <input
                                type="text"
                                value={form.firstName}
                                onChange={(event) =>
                                    onChange(
                                        "firstName",
                                        event.target.value
                                    )
                                }
                                placeholder="Enter first name"
                                required
                                disabled={saving}
                                autoComplete="given-name"
                            />
                        </label>

                        <label>
                            <span>
                                Middle Name
                            </span>

                            <input
                                type="text"
                                value={form.middleName}
                                onChange={(event) =>
                                    onChange(
                                        "middleName",
                                        event.target.value
                                    )
                                }
                                placeholder="Enter middle name"
                                disabled={saving}
                                autoComplete="additional-name"
                            />
                        </label>

                        <label>
                            <span>
                                Last Name *
                            </span>

                            <input
                                type="text"
                                value={form.lastName}
                                onChange={(event) =>
                                    onChange(
                                        "lastName",
                                        event.target.value
                                    )
                                }
                                placeholder="Enter last name"
                                required
                                disabled={saving}
                                autoComplete="family-name"
                            />
                        </label>

                        <label>
                            <span>
                                Gender
                            </span>

                            <select
                                value={form.gender}
                                onChange={(event) =>
                                    onChange(
                                        "gender",
                                        event.target.value
                                    )
                                }
                                disabled={saving}
                            >
                                <option value="">
                                    Select Gender
                                </option>

                                <option value="MALE">
                                    Male
                                </option>

                                <option value="FEMALE">
                                    Female
                                </option>
                            </select>
                        </label>

                        <label>
                            <span>
                                Birth Date
                            </span>

                            <input
                                type="date"
                                value={form.birthDate}
                                onChange={(event) =>
                                    onChange(
                                        "birthDate",
                                        event.target.value
                                    )
                                }
                                disabled={saving}
                            />
                        </label>

                        <label>
                            <span>
                                Contact Number
                            </span>

                            <input
                                type="tel"
                                value={
                                    form.contactNumber
                                }
                                onChange={(event) =>
                                    onChange(
                                        "contactNumber",
                                        event.target.value
                                    )
                                }
                                placeholder="09XXXXXXXXX"
                                disabled={saving}
                                autoComplete="tel"
                            />
                        </label>

                        <label>
                            <span>
                                Civil Status
                            </span>

                            <select
                                value={
                                    form.civilStatus
                                }
                                onChange={(event) =>
                                    onChange(
                                        "civilStatus",
                                        event.target.value
                                    )
                                }
                                disabled={saving}
                            >
                                <option value="">
                                    Select Civil Status
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
                        </label>

                        <label>
                            <span>
                                Ministry
                            </span>

                            <input
                                type="text"
                                value={form.ministry}
                                onChange={(event) =>
                                    onChange(
                                        "ministry",
                                        event.target.value
                                    )
                                }
                                placeholder="e.g. Worship Ministry"
                                disabled={saving}
                            />
                        </label>

                        <label>
                            <span>
                                Date Joined
                            </span>

                            <input
                                type="date"
                                value={form.dateJoined}
                                onChange={(event) =>
                                    onChange(
                                        "dateJoined",
                                        event.target.value
                                    )
                                }
                                disabled={saving}
                            />
                        </label>

                        <label>
                            <span>
                                Status
                            </span>

                            <select
                                value={form.status}
                                onChange={(event) =>
                                    onChange(
                                        "status",
                                        event.target.value
                                    )
                                }
                                disabled={saving}
                            >
                                <option value="ACTIVE">
                                    Active
                                </option>

                                <option value="INACTIVE">
                                    Inactive
                                </option>
                            </select>
                        </label>

                        <label className="epic-member-form-full">
                            <span>
                                Address
                            </span>

                            <textarea
                                value={form.address}
                                onChange={(event) =>
                                    onChange(
                                        "address",
                                        event.target.value
                                    )
                                }
                                placeholder="Enter complete address"
                                rows={3}
                                disabled={saving}
                            />
                        </label>
                    </div>

                    <div className="epic-member-form-security">
                        <div className="epic-member-form-security-icon">
                            🔒
                        </div>

                        <div>
                            <strong>
                                Secure Church Registration
                            </strong>

                            <small>
                                Customer ID and Member Code
                                are assigned by EPIC.
                                Your account can only
                                create members belonging
                                to your authorized church.
                            </small>
                        </div>
                    </div>

                    <div className="epic-member-form-actions">
                        <button
                            type="button"
                            className="epic-members-secondary-button"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="epic-members-primary-button"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="epic-members-button-spinner" />
                                    Adding Member...
                                </>
                            ) : (
                                <>
                                    + Add Member
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// =========================================================
// MAIN COMPONENT
// =========================================================

const ClientMembers: React.FC<ClientMembersProps> = ({
    onBack,
}) => {
    const [members, setMembers] =
        useState<Member[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [searchTerm, setSearchTerm] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("All");

    const [selectedMember, setSelectedMember] =
        useState<Member | null>(null);

    const [showAddMember, setShowAddMember] =
        useState(false);

    const [memberForm, setMemberForm] =
        useState<CreateMemberForm>({
            ...EMPTY_MEMBER_FORM,
        });

    const [savingMember, setSavingMember] =
        useState(false);

    const [saveError, setSaveError] =
        useState("");

    const [saveSuccess, setSaveSuccess] =
        useState("");

    // =====================================================
    // LOAD MEMBERS
    // =====================================================

    const loadMembers = useCallback(
        async () => {
            setLoading(true);
            setError("");

            try {
                const response =
                    await axios.get<Member[]>(
                        `${API_BASE_URL}/ClientMembers`,
                        getAuthConfig()
                    );

                const data =
                    Array.isArray(response.data)
                        ? response.data
                        : [];

                setMembers(data);
            } catch (err) {
                console.error(
                    "EPIC Client Members Load Error:",
                    err
                );

                setError(
                    extractApiError(
                        err,
                        "Unable to load your church members."
                    )
                );
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        void loadMembers();
    }, [loadMembers]);

    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleFormChange =
        useCallback(
            (
                field: keyof CreateMemberForm,
                value: string
            ) => {
                setMemberForm(
                    (previous) => ({
                        ...previous,
                        [field]: value,
                    })
                );
            },
            []
        );

    // =====================================================
    // OPEN ADD MEMBER
    // =====================================================

    const openAddMember =
        useCallback(() => {
            setMemberForm({
                ...EMPTY_MEMBER_FORM,
            });

            setSaveError("");
            setSaveSuccess("");

            setShowAddMember(true);
        }, []);

    // =====================================================
    // CLOSE ADD MEMBER
    // =====================================================

    const closeAddMember =
        useCallback(() => {
            if (savingMember) {
                return;
            }

            setShowAddMember(false);
            setSaveError("");
            setSaveSuccess("");

            setMemberForm({
                ...EMPTY_MEMBER_FORM,
            });
        }, [savingMember]);

    // =====================================================
    // CREATE MEMBER
    // =====================================================

    const handleCreateMember =
        useCallback(
            async (
                event: React.FormEvent<HTMLFormElement>
            ) => {
                event.preventDefault();

                setSaveError("");
                setSaveSuccess("");

                const firstName =
                    memberForm.firstName.trim();

                const middleName =
                    memberForm.middleName.trim();

                const lastName =
                    memberForm.lastName.trim();

                if (!firstName) {
                    setSaveError(
                        "First name is required."
                    );
                    return;
                }

                if (!lastName) {
                    setSaveError(
                        "Last name is required."
                    );
                    return;
                }

                setSavingMember(true);

                try {
                    /*
                     * IMPORTANT:
                     *
                     * CustomerId is NOT sent.
                     *
                     * MemberCode is NOT sent.
                     *
                     * The authenticated API determines
                     * the customer's identity.
                     */

                    const payload = {
                        firstName,
                        middleName:
                            middleName || null,
                        lastName,

                        gender:
                            memberForm.gender.trim() ||
                            null,

                        birthDate:
                            memberForm.birthDate ||
                            null,

                        contactNumber:
                            memberForm.contactNumber.trim() ||
                            null,

                        address:
                            memberForm.address.trim() ||
                            null,

                        civilStatus:
                            memberForm.civilStatus.trim() ||
                            null,

                        ministry:
                            memberForm.ministry.trim() ||
                            null,

                        dateJoined:
                            memberForm.dateJoined ||
                            null,

                        status:
                            memberForm.status ||
                            DEFAULT_STATUS,
                    };

                    const response =
                        await axios.post(
                            `${API_BASE_URL}/ClientMembers`,
                            payload,
                            getAuthConfig()
                        );

                    console.log(
                        "EPIC Client Member Created:",
                        response.data
                    );

                    setSaveSuccess(
                        response.data?.message ||
                        "Member added successfully."
                    );

                    await loadMembers();

                    window.setTimeout(() => {
                        setShowAddMember(false);
                        setSaveError("");
                        setSaveSuccess("");

                        setMemberForm({
                            ...EMPTY_MEMBER_FORM,
                        });
                    }, 800);
                } catch (err) {
                    console.error(
                        "EPIC Client Member Create Error:",
                        err
                    );

                    setSaveError(
                        extractApiError(
                            err,
                            "Unable to add member. Please try again."
                        )
                    );
                } finally {
                    setSavingMember(false);
                }
            },
            [
                memberForm,
                loadMembers,
            ]
        );

    // =====================================================
    // FILTER
    // =====================================================

    const filteredMembers =
        useMemo(() => {
            const query =
                searchTerm
                    .trim()
                    .toLowerCase();

            return members.filter(
                (member) => {
                    const name =
                        getMemberName(
                            member
                        ).toLowerCase();

                    const code =
                        member.memberCode
                            ?.toLowerCase() ||
                        "";

                    const ministry =
                        member.ministry
                            ?.toLowerCase() ||
                        "";

                    const contact =
                        member.contactNumber
                            ?.toLowerCase() ||
                        "";

                    const status =
                        getStatus(
                            member.status
                        ).toLowerCase();

                    const matchesSearch =
                        !query ||
                        name.includes(query) ||
                        code.includes(query) ||
                        ministry.includes(query) ||
                        contact.includes(query);

                    const matchesStatus =
                        statusFilter === "All" ||
                        status ===
                            statusFilter.toLowerCase();

                    return (
                        matchesSearch &&
                        matchesStatus
                    );
                }
            );
        }, [
            members,
            searchTerm,
            statusFilter,
        ]);

    // =====================================================
    // SUMMARY
    // =====================================================

    const summary =
        useMemo(() => {
            const active =
                members.filter(
                    (member) =>
                        isActiveStatus(
                            member.status
                        )
                ).length;

            return {
                total: members.length,
                active,
                inactive:
                    members.length - active,
            };
        }, [members]);

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return <LoadingView />;
    }

    // =====================================================
    // ERROR
    // =====================================================

    if (error) {
        return (
            <ErrorView
                message={error}
                onRetry={() =>
                    void loadMembers()
                }
                onBack={onBack}
            />
        );
    }

    // =====================================================
    // MAIN
    // =====================================================

    return (
        <div className="epic-client-members">
            <div className="epic-members-grid" />

            <div className="epic-members-glow epic-members-glow-one" />

            <div className="epic-members-glow epic-members-glow-two" />

            <main className="epic-members-main">
                {/* =========================================
                    HEADER
                ========================================= */}

                <section className="epic-members-heading">
                    <div className="epic-members-title">
                        <div className="epic-members-title-icon">
                            ♙
                        </div>

                        <div>
                            <div className="epic-members-eyebrow">
                                <span />
                                MEMBER DIRECTORY
                            </div>

                            <h1>
                                Church Members
                            </h1>

                            <p>
                                View and manage your
                                church membership records
                                and member information.
                            </p>
                        </div>
                    </div>

                    <div className="epic-members-secure">
                        <div className="epic-members-secure-icon">
                            ✓
                        </div>

                        <div>
                            <strong>
                                Secure Records
                            </strong>

                            <small>
                                Authorized access only
                            </small>
                        </div>
                    </div>
                </section>

                {/* =========================================
                    SUMMARY
                ========================================= */}

                <section className="epic-members-summary">
                    <article className="epic-members-summary-card">
                        <div className="epic-members-summary-top">
                            <span>
                                TOTAL MEMBERS
                            </span>

                            <div className="epic-members-summary-icon">
                                ♙
                            </div>
                        </div>

                        <strong>
                            {summary.total}
                        </strong>

                        <small>
                            Registered members
                        </small>
                    </article>

                    <article className="epic-members-summary-card epic-members-summary-active">
                        <div className="epic-members-summary-top">
                            <span>
                                ACTIVE MEMBERS
                            </span>

                            <div className="epic-members-summary-icon">
                                ✓
                            </div>
                        </div>

                        <strong>
                            {summary.active}
                        </strong>

                        <small>
                            Currently active
                        </small>
                    </article>

                    <article className="epic-members-summary-card">
                        <div className="epic-members-summary-top">
                            <span>
                                OTHER STATUS
                            </span>

                            <div className="epic-members-summary-icon">
                                •
                            </div>
                        </div>

                        <strong>
                            {summary.inactive}
                        </strong>

                        <small>
                            Inactive or other status
                        </small>
                    </article>
                </section>

                {/* =========================================
                    DIRECTORY
                ========================================= */}

                <section className="epic-members-panel">
                    <div className="epic-members-panel-header">
                        <div>
                            <span>
                                MEMBER DIRECTORY
                            </span>

                            <h2>
                                All Members
                            </h2>
                        </div>

                        <div className="epic-members-panel-actions">
                            <div className="epic-members-result-count">
                                <strong>
                                    {
                                        filteredMembers.length
                                    }
                                </strong>

                                <span>
                                    {
                                        filteredMembers.length ===
                                        1
                                            ? "member"
                                            : "members"
                                    }
                                </span>
                            </div>

                            <button
                                type="button"
                                className="epic-members-add-button"
                                onClick={
                                    openAddMember
                                }
                            >
                                + Add Member
                            </button>
                        </div>
                    </div>

                    {/* TOOLBAR */}

                    <div className="epic-members-toolbar">
                        <div className="epic-members-search">
                            <span
                                className="epic-members-search-icon"
                                aria-hidden="true"
                            >
                                ⌕
                            </span>

                            <input
                                type="text"
                                value={
                                    searchTerm
                                }
                                onChange={(event) =>
                                    setSearchTerm(
                                        event.target.value
                                    )
                                }
                                placeholder="Search by name, member code, ministry..."
                                aria-label="Search members"
                            />

                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearchTerm("")
                                    }
                                    aria-label="Clear search"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        <select
                            className="epic-members-filter"
                            value={
                                statusFilter
                            }
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value
                                )
                            }
                            aria-label="Filter members by status"
                        >
                            <option value="All">
                                All Status
                            </option>

                            <option value="Active">
                                Active
                            </option>

                            <option value="Inactive">
                                Inactive
                            </option>
                        </select>
                    </div>

                    {/* EMPTY */}

                    {filteredMembers.length ===
                    0 ? (
                        <div className="epic-members-empty">
                            <div className="epic-members-empty-icon">
                                ♙
                            </div>

                            <h3>
                                No Members Found
                            </h3>

                            <p>
                                No member records match
                                your current search or
                                filter.
                            </p>

                            {(searchTerm ||
                                statusFilter !==
                                    "All") && (
                                <button
                                    type="button"
                                    className="epic-members-reset-button"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setStatusFilter(
                                            "All"
                                        );
                                    }}
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="epic-members-table-wrapper">
                            <table className="epic-members-table">
                                <thead>
                                    <tr>
                                        <th>
                                            MEMBER
                                        </th>

                                        <th>
                                            MEMBER CODE
                                        </th>

                                        <th>
                                            MINISTRY
                                        </th>

                                        <th>
                                            CONTACT
                                        </th>

                                        <th>
                                            STATUS
                                        </th>

                                        <th>
                                            ACTION
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredMembers.map(
                                        (member) => {
                                            const status =
                                                getStatus(
                                                    member.status
                                                );

                                            const active =
                                                isActiveStatus(
                                                    member.status
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        member.memberId
                                                    }
                                                >
                                                    <td>
                                                        <div className="epic-member-person">
                                                            <div className="epic-member-avatar">
                                                                {
                                                                    getMemberInitials(
                                                                        member
                                                                    )
                                                                }
                                                            </div>

                                                            <div className="epic-member-person-info">
                                                                <strong>
                                                                    {
                                                                        getMemberName(
                                                                            member
                                                                        )
                                                                    }
                                                                </strong>

                                                                <small>
                                                                    {
                                                                        member.gender ||
                                                                        "Member"
                                                                    }
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <span className="epic-member-code">
                                                            {
                                                                member.memberCode ||
                                                                `#${member.memberId}`
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span className="epic-member-text">
                                                            {
                                                                member.ministry ||
                                                                "—"
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span className="epic-member-text">
                                                            {
                                                                member.contactNumber ||
                                                                "—"
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={[
                                                                "epic-member-status",
                                                                active
                                                                    ? "active"
                                                                    : "inactive",
                                                            ].join(
                                                                " "
                                                            )}
                                                        >
                                                            <i />
                                                            {
                                                                status
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="epic-member-view-button"
                                                            onClick={() =>
                                                                setSelectedMember(
                                                                    member
                                                                )
                                                            }
                                                        >
                                                            View Profile
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            {/* PROFILE MODAL */}

            {selectedMember && (
                <MemberModal
                    member={selectedMember}
                    onClose={() =>
                        setSelectedMember(
                            null
                        )
                    }
                />
            )}

            {/* ADD MEMBER MODAL */}

            {showAddMember && (
                <AddMemberModal
                    form={memberForm}
                    saving={savingMember}
                    error={saveError}
                    success={saveSuccess}
                    onClose={closeAddMember}
                    onSubmit={handleCreateMember}
                    onChange={handleFormChange}
                />
            )}
        </div>
    );
};

export default ClientMembers;