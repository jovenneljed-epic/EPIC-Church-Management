
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
    memberCode?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    gender?: string;
    birthDate?: string;
    contactNumber?: string;
    address?: string;
    civilStatus?: string;
    ministry?: string;
    dateJoined?: string;
    status?: string;
    photoPath?: string;
}

interface ClientMembersProps {
    onBack?: () => void;
}

// =========================================================
// CONSTANTS
// =========================================================

const DEFAULT_STATUS = "Active";

// =========================================================
// HELPERS
// =========================================================

const getClientToken = (): string | null =>
    localStorage.getItem("clientToken") ||
    sessionStorage.getItem("clientToken") ||
    localStorage.getItem("clientAccessToken") ||
    sessionStorage.getItem("clientAccessToken");

const getMemberName = (member: Member): string =>
    [
        member.firstName,
        member.middleName,
        member.lastName,
    ]
        .filter(Boolean)
        .join(" ")
        .trim() || "Unnamed Member";

const getMemberInitials = (member: Member): string => {
    const first = member.firstName?.trim().charAt(0) || "";
    const last = member.lastName?.trim().charAt(0) || "";

    return `${first}${last}`.toUpperCase() || "M";
};

const getStatus = (status?: string): string =>
    status?.trim() || DEFAULT_STATUS;

const isActiveStatus = (status?: string): boolean =>
    getStatus(status).toLowerCase() === "active";

const formatDate = (value?: string): string => {
    if (!value) {
        return "Not provided";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not provided";
    }

    return date.toLocaleDateString();
};

// =========================================================
// REUSABLE COMPONENTS
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
}) => (
    <div
        className={`epic-members-info-item${
            fullWidth
                ? " epic-members-info-item-full"
                : ""
        }`}
    >
        <span>{label}</span>
        <strong>{value || "Not provided"}</strong>
    </div>
);

// =========================================================
// LOADING VIEW
// =========================================================

const LoadingView: React.FC = () => (
    <div className="epic-members-loading">
        <div className="epic-members-loading-card">

            <div className="epic-members-loading-logo">
                E
            </div>

            <div className="epic-members-spinner" />

            <h2>
                Loading Members
            </h2>

            <p>
                Retrieving your church membership records...
            </p>

        </div>
    </div>
);

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
}) => (
    <div className="epic-members-error">
        <div className="epic-members-error-card">

            <div className="epic-members-error-icon">
                !
            </div>

            <span className="epic-members-error-brand">
                EPIC
            </span>

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
                        ← Dashboard
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

// =========================================================
// MEMBER MODAL
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

                {/* PROFILE HEADER */}

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

                        <small>
                            {member.memberCode ||
                                `Member #${member.memberId}`}
                        </small>

                    </div>

                </div>

                {/* DETAILS */}

                <div className="epic-member-modal-grid">

                    <InfoItem
                        label="Gender"
                        value={member.gender}
                    />

                    <InfoItem
                        label="Civil Status"
                        value={member.civilStatus}
                    />

                    <InfoItem
                        label="Contact"
                        value={member.contactNumber}
                    />

                    <InfoItem
                        label="Ministry"
                        value={member.ministry || "Not assigned"}
                    />

                    <InfoItem
                        label="Date Joined"
                        value={formatDate(member.dateJoined)}
                    />

                    <InfoItem
                        label="Status"
                        value={
                            <span
                                className={`epic-member-modal-status ${
                                    isActiveStatus(member.status)
                                        ? "active"
                                        : "inactive"
                                }`}
                            >
                                <i />
                                {status}
                            </span>
                        }
                    />

                    <InfoItem
                        label="Address"
                        value={member.address}
                        fullWidth
                    />

                </div>

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
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [selectedMember, setSelectedMember] =
        useState<Member | null>(null);

    // =========================================================
    // LOAD MEMBERS
    // =========================================================

    const loadMembers = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const token = getClientToken();

            if (!token) {
                setError(
                    "Your client session could not be found."
                );
                return;
            }

            const response = await axios.get<Member[]>(
                `${API_BASE_URL}/Members`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setMembers(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );
        } catch (err) {
            console.error(
                "Unable to load client members:",
                err
            );

            if (axios.isAxiosError(err)) {
                switch (err.response?.status) {
                    case 401:
                        setError(
                            "Your session has expired. Please sign in again."
                        );
                        break;

                    case 403:
                        setError(
                            "You do not have permission to view members."
                        );
                        break;

                    default:
                        setError(
                            err.response?.data?.message ||
                            "Unable to load members."
                        );
                }
            } else {
                setError("Unable to load members.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    // =========================================================
    // FILTER MEMBERS
    // =========================================================

    const filteredMembers = useMemo(() => {
        const query = searchTerm
            .trim()
            .toLowerCase();

        return members.filter((member) => {
            const name =
                getMemberName(member).toLowerCase();

            const code =
                member.memberCode?.toLowerCase() || "";

            const ministry =
                member.ministry?.toLowerCase() || "";

            const contact =
                member.contactNumber?.toLowerCase() || "";

            const status =
                getStatus(member.status).toLowerCase();

            const matchesSearch =
                !query ||
                name.includes(query) ||
                code.includes(query) ||
                ministry.includes(query) ||
                contact.includes(query);

            const matchesStatus =
                statusFilter === "All" ||
                status === statusFilter.toLowerCase();

            return (
                matchesSearch &&
                matchesStatus
            );
        });
    }, [
        members,
        searchTerm,
        statusFilter,
    ]);

    // =========================================================
    // SUMMARY
    // =========================================================

    const summary = useMemo(() => {
        const active = members.filter((member) =>
            isActiveStatus(member.status)
        ).length;

        return {
            total: members.length,
            active,
            inactive: members.length - active,
        };
    }, [members]);

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return <LoadingView />;
    }

    // =========================================================
    // ERROR
    // =========================================================

    if (error) {
        return (
            <ErrorView
                message={error}
                onRetry={loadMembers}
                onBack={onBack}
            />
        );
    }

    // =========================================================
    // MAIN
    // =========================================================

    return (
        <div className="epic-client-members">

            {/* BACKGROUND */}

            <div className="epic-members-grid" />

            <div className="epic-members-glow epic-members-glow-one" />
            <div className="epic-members-glow epic-members-glow-two" />

            <main className="epic-members-main">

                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <section className="epic-members-heading">

                    <div className="epic-members-title">

                        <div className="epic-members-title-icon">
                            ♙
                        </div>

                        <div>
                            <span className="epic-members-eyebrow">
                                MEMBERS
                            </span>

                            <h1>
                                Church Members
                            </h1>

                            <p>
                                View and manage your church
                                membership records.
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

                {/* =================================================
                    SUMMARY
                ================================================= */}

                <section className="epic-members-summary">

                    <article className="epic-members-summary-card">

                        <div className="epic-members-summary-label">
                            TOTAL MEMBERS
                        </div>

                        <strong>
                            {summary.total}
                        </strong>

                        <span>
                            Registered members
                        </span>

                    </article>

                    <article className="epic-members-summary-card">

                        <div className="epic-members-summary-label">
                            ACTIVE
                        </div>

                        <strong>
                            {summary.active}
                        </strong>

                        <span>
                            Currently active
                        </span>

                    </article>

                    <article className="epic-members-summary-card">

                        <div className="epic-members-summary-label">
                            OTHER
                        </div>

                        <strong>
                            {summary.inactive}
                        </strong>

                        <span>
                            Inactive or other status
                        </span>

                    </article>

                </section>

                {/* =================================================
                    MEMBER DIRECTORY
                ================================================= */}

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

                        <div className="epic-members-result-count">
                            {filteredMembers.length}
                            {" "}
                            {filteredMembers.length === 1
                                ? "member"
                                : "members"}
                        </div>

                    </div>

                    {/* =================================================
                        TOOLBAR
                    ================================================= */}

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
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(
                                        event.target.value
                                    )
                                }
                                placeholder="Search members..."
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
                            value={statusFilter}
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

                    {/* =================================================
                        EMPTY STATE
                    ================================================= */}

                    {filteredMembers.length === 0 ? (
                        <div className="epic-members-empty">

                            <div className="epic-members-empty-icon">
                                ♙
                            </div>

                            <h3>
                                No Members Found
                            </h3>

                            <p>
                                No member records match
                                your current search or filter.
                            </p>

                            {(searchTerm ||
                                statusFilter !== "All") && (
                                <button
                                    type="button"
                                    className="epic-members-reset-button"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setStatusFilter("All");
                                    }}
                                >
                                    Clear Filters
                                </button>
                            )}

                        </div>
                    ) : (

                        /* =================================================
                           TABLE
                        ================================================= */

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

                                                    {/* MEMBER */}

                                                    <td>
                                                        <div className="epic-member-person">

                                                            <div className="epic-member-avatar">
                                                                {getMemberInitials(
                                                                    member
                                                                )}
                                                            </div>

                                                            <div className="epic-member-person-info">

                                                                <strong>
                                                                    {getMemberName(
                                                                        member
                                                                    )}
                                                                </strong>

                                                                <small>
                                                                    {member.gender ||
                                                                        "Member"}
                                                                </small>

                                                            </div>

                                                        </div>
                                                    </td>

                                                    {/* CODE */}

                                                    <td>
                                                        <span className="epic-member-code">
                                                            {member.memberCode ||
                                                                `#${member.memberId}`}
                                                        </span>
                                                    </td>

                                                    {/* MINISTRY */}

                                                    <td>
                                                        <span className="epic-member-text">
                                                            {member.ministry ||
                                                                "—"}
                                                        </span>
                                                    </td>

                                                    {/* CONTACT */}

                                                    <td>
                                                        <span className="epic-member-text">
                                                            {member.contactNumber ||
                                                                "—"}
                                                        </span>
                                                    </td>

                                                    {/* STATUS */}

                                                    <td>
                                                        <span
                                                            className={`epic-member-status ${
                                                                active
                                                                    ? "active"
                                                                    : "inactive"
                                                            }`}
                                                        >
                                                            <i />
                                                            {status}
                                                        </span>
                                                    </td>

                                                    {/* ACTION */}

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
                                                            View
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

            {/* =================================================
                MEMBER MODAL
            ================================================= */}

            {selectedMember && (
                <MemberModal
                    member={selectedMember}
                    onClose={() =>
                        setSelectedMember(null)
                    }
                />
            )}

        </div>
    );
};

export default ClientMembers;

