
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import axios from "axios";

import { API_BASE_URL } from "../config";

import "./GivingManagementPage.css";

// =========================================================
// TYPES
// =========================================================

interface ClientPermission {
    moduleName: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManage: boolean;
}

interface GivingRecord {
    givingId: number;
    customerId?: number;
    memberId?: number | null;
    memberCode?: string | null;
    memberName?: string | null;
    churchServiceId?: number | null;
    serviceName?: string | null;
    givingType: string;
    amount: number;
    givingDate: string;
    paymentMethod?: string | null;
    referenceNumber?: string | null;
    notes?: string | null;
    recordedBy?: string | null;
    recordedDate?: string | null;
}

interface Member {
    memberId: number;
    memberCode?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    status?: string;
}

interface ChurchService {
    churchServiceId: number;
    serviceName?: string;
    serviceType?: string;
    serviceDate?: string;
    status?: string;
}

interface GivingForm {
    memberId: string;
    churchServiceId: string;
    givingType: string;
    amount: string;
    givingDate: string;
    paymentMethod: string;
    referenceNumber: string;
    notes: string;
}

interface GivingManagementPageProps {
    permissions?: ClientPermission[];
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    onBack?: () => void;
}

// =========================================================
// CONSTANTS
// =========================================================

const GIVING_TYPES = [
    "TITHE",
    "OFFERING",
    "MISSION",
    "SPECIAL OFFERING",
    "PLEDGE",
    "OTHER",
];

const PAYMENT_METHODS = [
    "CASH",
    "GCASH",
    "BANK TRANSFER",
    "CHECK",
    "OTHER",
];

// =========================================================
// AUTH
// =========================================================

const getClientToken = (): string | null => {
    return (
        localStorage.getItem("clientToken") ||
        sessionStorage.getItem("clientToken") ||
        localStorage.getItem("clientAccessToken") ||
        sessionStorage.getItem("clientAccessToken") ||
        localStorage.getItem("clientAuthToken") ||
        sessionStorage.getItem("clientAuthToken") ||
        localStorage.getItem("epicClientToken") ||
        sessionStorage.getItem("epicClientToken")
    );
};

const getAuthConfig = () => {
    const token = getClientToken();

    if (!token) {
        return {};
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

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
    }).format(Number(value) || 0);
};

const formatDate = (value?: string | null): string => {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const formatGivingType = (value?: string | null): string => {
    if (!value) {
        return "Other";
    }

    return value
        .toLowerCase()
        .split(" ")
        .map(
            (word) =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");
};

const getMemberName = (member: Member): string => {
    return [
        member.lastName,
        member.firstName,
        member.middleName,
    ]
        .filter(Boolean)
        .join(", ")
        .replace(", ,", ",");
};

const getToday = (): string => {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const createEmptyForm = (): GivingForm => ({
    memberId: "",
    churchServiceId: "",
    givingType: "TITHE",
    amount: "",
    givingDate: getToday(),
    paymentMethod: "CASH",
    referenceNumber: "",
    notes: "",
});

// =========================================================
// COMPONENT
// =========================================================

const GivingManagementPage: React.FC<
    GivingManagementPageProps
> = ({
    permissions = [],
    canCreate = false,
    canEdit = false,
    canDelete = false,
    onBack,
}) => {
    // =====================================================
    // PERMISSION
    // =====================================================

    const givingPermission = useMemo(
        () =>
            permissions.find(
                (permission) =>
                    permission.moduleName
                        ?.trim()
                        .toLowerCase() === "giving"
            ),
        [permissions]
    );

    const allowCreate =
        canCreate ||
        givingPermission?.canCreate === true;

    const allowEdit =
        canEdit ||
        givingPermission?.canEdit === true;

    const allowDelete =
        canDelete ||
        givingPermission?.canDelete === true;

    // =====================================================
    // STATE
    // =====================================================

    const [givings, setGivings] =
        useState<GivingRecord[]>([]);

    const [members, setMembers] =
        useState<Member[]>([]);

    const [services, setServices] =
        useState<ChurchService[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [typeFilter, setTypeFilter] =
        useState("ALL");

    const [showModal, setShowModal] =
        useState(false);

    const [editingGiving, setEditingGiving] =
        useState<GivingRecord | null>(null);

    const [selectedGiving, setSelectedGiving] =
        useState<GivingRecord | null>(null);

    const [form, setForm] =
        useState<GivingForm>(
            createEmptyForm()
        );

    // =====================================================
    // LOAD GIVING
    // =====================================================

    const loadGiving = useCallback(
        async (
            fullLoading = true
        ): Promise<void> => {
            try {
                if (fullLoading) {
                    setLoading(true);
                } else {
                    setRefreshing(true);
                }

                setError("");

                const response =
                    await axios.get(
                        `${API_BASE_URL}/Giving`,
                        getAuthConfig()
                    );

                const data =
                    Array.isArray(response.data)
                        ? response.data
                        : response.data?.givings || [];

                setGivings(data);
            } catch (err) {
                console.error(
                    "EPIC GIVING LOAD ERROR:",
                    err
                );

                if (
                    axios.isAxiosError(err)
                ) {
                    if (
                        err.response?.status ===
                        401
                    ) {
                        setError(
                            "Your client session has expired. Please log in again."
                        );
                    } else if (
                        err.response?.status ===
                        403
                    ) {
                        setError(
                            "You do not have permission to view giving records."
                        );
                    } else {
                        setError(
                            err.response?.data
                                ?.message ||
                            "Unable to load giving records."
                        );
                    }
                } else {
                    setError(
                        "Unable to load giving records."
                    );
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    // =====================================================
    // LOAD MEMBERS
    // =====================================================

    const loadMembers =
        useCallback(async (): Promise<void> => {
            try {
                const response =
                    await axios.get(
                        `${API_BASE_URL}/Members`,
                        getAuthConfig()
                    );

                const data =
                    Array.isArray(response.data)
                        ? response.data
                        : response.data?.members || [];

                setMembers(
                    data.filter(
                        (member: Member) =>
                            !member.status ||
                            member.status
                                .toUpperCase() ===
                                "ACTIVE"
                    )
                );
            } catch (err) {
                console.error(
                    "EPIC GIVING MEMBERS LOAD ERROR:",
                    err
                );
            }
        }, []);

    // =====================================================
    // LOAD SERVICES
    // =====================================================

    const loadServices =
        useCallback(async (): Promise<void> => {
            try {
                const response =
                    await axios.get(
                        `${API_BASE_URL}/ChurchServices`,
                        getAuthConfig()
                    );

                const data =
                    Array.isArray(response.data)
                        ? response.data
                        : response.data?.services || [];

                setServices(data);
            } catch (err) {
                console.error(
                    "EPIC GIVING SERVICES LOAD ERROR:",
                    err
                );
            }
        }, []);

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        void Promise.all([
            loadGiving(),
            loadMembers(),
            loadServices(),
        ]);
    }, [
        loadGiving,
        loadMembers,
        loadServices,
    ]);

    // =====================================================
    // OPEN CREATE
    // =====================================================

    const openCreateModal = (): void => {
        if (!allowCreate) {
            setError(
                "You do not have permission to record giving."
            );
            return;
        }

        setError("");
        setMessage("");
        setEditingGiving(null);
        setSelectedGiving(null);
        setForm(createEmptyForm());
        setShowModal(true);
    };

    // =====================================================
    // OPEN EDIT
    // =====================================================

    const openEditModal = (
        giving: GivingRecord
    ): void => {
        if (!allowEdit) {
            setError(
                "You do not have permission to edit giving records."
            );
            return;
        }

        setError("");
        setMessage("");
        setEditingGiving(giving);

        setForm({
            memberId:
                giving.memberId
                    ? String(giving.memberId)
                    : "",

            churchServiceId:
                giving.churchServiceId
                    ? String(
                          giving.churchServiceId
                      )
                    : "",

            givingType:
                giving.givingType ||
                "TITHE",

            amount:
                String(
                    giving.amount ?? ""
                ),

            givingDate:
                giving.givingDate
                    ? giving.givingDate
                          .substring(0, 10)
                    : getToday(),

            paymentMethod:
                giving.paymentMethod ||
                "CASH",

            referenceNumber:
                giving.referenceNumber ||
                "",

            notes:
                giving.notes ||
                "",
        });

        setShowModal(true);
    };

    // =====================================================
    // FORM CHANGE
    // =====================================================

    const updateForm = (
        field: keyof GivingForm,
        value: string
    ): void => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    // =====================================================
    // SAVE
    // =====================================================

    const saveGiving = async (
        event: React.FormEvent
    ): Promise<void> => {
        event.preventDefault();

        setError("");
        setMessage("");

        if (!form.amount) {
            setError(
                "Giving amount is required."
            );
            return;
        }

        const amount =
            Number(form.amount);

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            setError(
                "Giving amount must be greater than zero."
            );
            return;
        }

        if (!form.givingType) {
            setError(
                "Please select a giving type."
            );
            return;
        }

        if (!form.paymentMethod) {
            setError(
                "Please select a payment method."
            );
            return;
        }

        try {
            setSaving(true);

            const payload = {
                memberId:
                    form.memberId
                        ? Number(form.memberId)
                        : null,

                churchServiceId:
                    form.churchServiceId
                        ? Number(
                              form.churchServiceId
                          )
                        : null,

                givingType:
                    form.givingType,

                amount,

                givingDate:
                    form.givingDate,

                paymentMethod:
                    form.paymentMethod,

                referenceNumber:
                    form.referenceNumber.trim(),

                notes:
                    form.notes.trim(),
            };

            if (editingGiving) {
                await axios.put(
                    `${API_BASE_URL}/Giving/${editingGiving.givingId}`,
                    payload,
                    getAuthConfig()
                );

                setMessage(
                    "Giving record updated successfully."
                );
            } else {
                await axios.post(
                    `${API_BASE_URL}/Giving`,
                    payload,
                    getAuthConfig()
                );

                setMessage(
                    "Giving recorded successfully."
                );
            }

            setShowModal(false);
            setEditingGiving(null);
            setForm(createEmptyForm());

            await loadGiving(false);
        } catch (err) {
            console.error(
                "EPIC GIVING SAVE ERROR:",
                err
            );

            if (
                axios.isAxiosError(err)
            ) {
                setError(
                    err.response?.data
                        ?.message ||
                    "Unable to save giving record."
                );
            } else {
                setError(
                    "Unable to save giving record."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // DELETE
    // =====================================================

    const deleteGiving = async (
        giving: GivingRecord
    ): Promise<void> => {
        if (!allowDelete) {
            setError(
                "You do not have permission to delete giving records."
            );
            return;
        }

        const confirmed =
            window.confirm(
                `Delete this ${formatGivingType(
                    giving.givingType
                )} record for ${formatCurrency(
                    giving.amount
                )}?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setMessage("");

            await axios.delete(
                `${API_BASE_URL}/Giving/${giving.givingId}`,
                getAuthConfig()
            );

            setMessage(
                "Giving record deleted successfully."
            );

            setSelectedGiving(null);

            await loadGiving(false);
        } catch (err) {
            console.error(
                "EPIC GIVING DELETE ERROR:",
                err
            );

            if (
                axios.isAxiosError(err)
            ) {
                setError(
                    err.response?.data
                        ?.message ||
                    "Unable to delete giving record."
                );
            } else {
                setError(
                    "Unable to delete giving record."
                );
            }
        }
    };

    // =====================================================
    // FILTER
    // =====================================================

    const filteredGivings =
        useMemo(() => {
            const keyword =
                search
                    .trim()
                    .toLowerCase();

            return [...givings]
                .filter((giving) => {
                    const matchesSearch =
                        !keyword ||
                        giving.memberName
                            ?.toLowerCase()
                            .includes(
                                keyword
                            ) ||
                        giving.memberCode
                            ?.toLowerCase()
                            .includes(
                                keyword
                            ) ||
                        giving.givingType
                            ?.toLowerCase()
                            .includes(
                                keyword
                            ) ||
                        giving.serviceName
                            ?.toLowerCase()
                            .includes(
                                keyword
                            ) ||
                        giving.referenceNumber
                            ?.toLowerCase()
                            .includes(
                                keyword
                            );

                    const matchesType =
                        typeFilter === "ALL" ||
                        giving.givingType
                            ?.toUpperCase() ===
                            typeFilter;

                    return (
                        matchesSearch &&
                        matchesType
                    );
                })
                .sort(
                    (a, b) =>
                        new Date(
                            b.givingDate
                        ).getTime() -
                        new Date(
                            a.givingDate
                        ).getTime()
                );
        }, [
            givings,
            search,
            typeFilter,
        ]);

    // =====================================================
    // STATISTICS
    // =====================================================

    const totalGiving =
        useMemo(
            () =>
                givings.reduce(
                    (sum, giving) =>
                        sum +
                        Number(
                            giving.amount || 0
                        ),
                    0
                ),
            [givings]
        );

    const todayGiving =
        useMemo(() => {
            const today =
                getToday();

            return givings
                .filter(
                    (giving) =>
                        giving.givingDate?.substring(
                            0,
                            10
                        ) === today
                )
                .reduce(
                    (sum, giving) =>
                        sum +
                        Number(
                            giving.amount || 0
                        ),
                    0
                );
        }, [givings]);

    const monthGiving =
        useMemo(() => {
            const now =
                new Date();

            return givings
                .filter((giving) => {
                    const date =
                        new Date(
                            giving.givingDate
                        );

                    return (
                        date.getFullYear() ===
                            now.getFullYear() &&
                        date.getMonth() ===
                            now.getMonth()
                    );
                })
                .reduce(
                    (sum, giving) =>
                        sum +
                        Number(
                            giving.amount || 0
                        ),
                    0
                );
        }, [givings]);

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="giving-management-page">

            {/* HEADER */}

            <section className="giving-management-hero">

                <div>
                    <span className="giving-management-eyebrow">
                        EPIC CHURCH MANAGEMENT SYSTEM
                    </span>

                    <h1>
                        Giving Management
                    </h1>

                    <p>
                        Record, monitor, and manage
                        church tithes, offerings,
                        missions, pledges, and other
                        contributions.
                    </p>
                </div>

                <div className="giving-management-hero-icon">
                    ₱
                </div>

            </section>

            {/* ALERTS */}

            {error && (
                <div className="giving-management-alert error">
                    <strong>
                        Unable to complete request
                    </strong>

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

            {message && (
                <div className="giving-management-alert success">
                    <strong>
                        Success
                    </strong>

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

            {/* STATISTICS */}

            <section className="giving-management-stats">

                <article className="giving-management-stat primary">
                    <span className="stat-icon">
                        ₱
                    </span>

                    <div>
                        <small>
                            TOTAL GIVING
                        </small>

                        <strong>
                            {formatCurrency(
                                totalGiving
                            )}
                        </strong>

                        <span>
                            All recorded contributions
                        </span>
                    </div>
                </article>

                <article className="giving-management-stat">
                    <span className="stat-icon">
                        ◷
                    </span>

                    <div>
                        <small>
                            TODAY
                        </small>

                        <strong>
                            {formatCurrency(
                                todayGiving
                            )}
                        </strong>

                        <span>
                            Today's giving
                        </span>
                    </div>
                </article>

                <article className="giving-management-stat">
                    <span className="stat-icon">
                        ▣
                    </span>

                    <div>
                        <small>
                            THIS MONTH
                        </small>

                        <strong>
                            {formatCurrency(
                                monthGiving
                            )}
                        </strong>

                        <span>
                            Current month
                        </span>
                    </div>
                </article>

                <article className="giving-management-stat">
                    <span className="stat-icon">
                        #
                    </span>

                    <div>
                        <small>
                            TRANSACTIONS
                        </small>

                        <strong>
                            {givings.length}
                        </strong>

                        <span>
                            Giving records
                        </span>
                    </div>
                </article>

            </section>

            {/* RECORDS */}

            <section className="giving-management-panel">

                <div className="giving-management-panel-header">

                    <div>
                        <span>
                            CONTRIBUTION RECORDS
                        </span>

                        <h2>
                            Church Giving
                        </h2>

                        <p>
                            View and manage recorded
                            church contributions.
                        </p>
                    </div>

                    <div className="giving-management-actions">

                        <button
                            type="button"
                            className="giving-refresh-button"
                            onClick={() =>
                                void loadGiving(false)
                            }
                            disabled={refreshing}
                        >
                            ↻{" "}
                            {refreshing
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>

                        {allowCreate && (
                            <button
                                type="button"
                                className="giving-record-button"
                                onClick={
                                    openCreateModal
                                }
                            >
                                ＋ Record Giving
                            </button>
                        )}

                    </div>

                </div>

                {/* FILTERS */}

                <div className="giving-management-filters">

                    <div className="giving-search">
                        <span>
                            ⌕
                        </span>

                        <input
                            type="text"
                            placeholder="Search member, giving type, service..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <select
                        value={typeFilter}
                        onChange={(event) =>
                            setTypeFilter(
                                event.target.value
                            )
                        }
                    >
                        <option value="ALL">
                            All Giving Types
                        </option>

                        {GIVING_TYPES.map(
                            (type) => (
                                <option
                                    key={type}
                                    value={type}
                                >
                                    {formatGivingType(
                                        type
                                    )}
                                </option>
                            )
                        )}
                    </select>

                </div>

                {/* TABLE */}

                {loading ? (
                    <div className="giving-management-empty">
                        <div className="giving-management-spinner" />

                        <h3>
                            Loading Giving Records
                        </h3>

                        <p>
                            Retrieving church
                            contribution records...
                        </p>
                    </div>
                ) : filteredGivings.length === 0 ? (
                    <div className="giving-management-empty">

                        <div className="giving-management-empty-icon">
                            ₱
                        </div>

                        <h3>
                            No Giving Records Yet
                        </h3>

                        <p>
                            {search ||
                            typeFilter !== "ALL"
                                ? "No records match your current filters."
                                : "Start recording church contributions using the Record Giving button."}
                        </p>

                        {allowCreate && (
                            <button
                                type="button"
                                onClick={
                                    openCreateModal
                                }
                            >
                                ＋ Record Giving
                            </button>
                        )}

                    </div>
                ) : (
                    <div className="giving-management-table-wrapper">

                        <table className="giving-management-table">

                            <thead>
                                <tr>
                                    <th>
                                        DATE
                                    </th>

                                    <th>
                                        MEMBER
                                    </th>

                                    <th>
                                        GIVING
                                    </th>

                                    <th>
                                        SERVICE
                                    </th>

                                    <th>
                                        PAYMENT
                                    </th>

                                    <th>
                                        AMOUNT
                                    </th>

                                    <th>
                                        ACTION
                                    </th>
                                </tr>
                            </thead>

                            <tbody>

                                {filteredGivings.map(
                                    (giving) => (
                                        <tr
                                            key={
                                                giving.givingId
                                            }
                                        >
                                            <td>
                                                <strong>
                                                    {formatDate(
                                                        giving.givingDate
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                <div className="giving-member-cell">
                                                    <strong>
                                                        {giving.memberName ||
                                                            "WALK-IN / ANONYMOUS"}
                                                    </strong>

                                                    {giving.memberCode && (
                                                        <small>
                                                            {
                                                                giving.memberCode
                                                            }
                                                        </small>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <span className="giving-type-badge">
                                                    {formatGivingType(
                                                        giving.givingType
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span>
                                                    {giving.serviceName ||
                                                        "No Service"}
                                                </span>
                                            </td>

                                            <td>
                                                {giving.paymentMethod ||
                                                    "—"}
                                            </td>

                                            <td className="giving-amount">
                                                {formatCurrency(
                                                    giving.amount
                                                )}
                                            </td>

                                            <td>
                                                <div className="giving-row-actions">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedGiving(
                                                                giving
                                                            )
                                                        }
                                                    >
                                                        View
                                                    </button>

                                                    {allowEdit && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    giving
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </button>
                                                    )}

                                                    {allowDelete && (
                                                        <button
                                                            type="button"
                                                            className="danger"
                                                            onClick={() =>
                                                                void deleteGiving(
                                                                    giving
                                                                )
                                                            }
                                                        >
                                                            Delete
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

            </section>

            {/* =====================================================
                RECORD / EDIT MODAL
            ===================================================== */}

            {showModal && (
                <div
                    className="giving-management-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setShowModal(false);
                        }
                    }}
                >
                    <div className="giving-management-modal">

                        <div className="giving-management-modal-header">

                            <div>
                                <span>
                                    {editingGiving
                                        ? "EDIT CONTRIBUTION"
                                        : "NEW CONTRIBUTION"}
                                </span>

                                <h2>
                                    {editingGiving
                                        ? "Edit Giving Record"
                                        : "Record Giving"}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowModal(
                                        false
                                    )
                                }
                            >
                                ×
                            </button>

                        </div>

                        <form
                            onSubmit={
                                saveGiving
                            }
                        >

                            <div className="giving-form-grid">

                                <label>
                                    <span>
                                        Member
                                    </span>

                                    <select
                                        value={
                                            form.memberId
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "memberId",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    >
                                        <option value="">
                                            Walk-in / Anonymous
                                        </option>

                                        {members.map(
                                            (member) => (
                                                <option
                                                    key={
                                                        member.memberId
                                                    }
                                                    value={
                                                        member.memberId
                                                    }
                                                >
                                                    {member.memberCode
                                                        ? `${member.memberCode} — `
                                                        : ""}
                                                    {getMemberName(
                                                        member
                                                    )}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>

                                <label>
                                    <span>
                                        Church Service
                                    </span>

                                    <select
                                        value={
                                            form.churchServiceId
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "churchServiceId",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    >
                                        <option value="">
                                            No Service
                                        </option>

                                        {services.map(
                                            (
                                                service
                                            ) => (
                                                <option
                                                    key={
                                                        service.churchServiceId
                                                    }
                                                    value={
                                                        service.churchServiceId
                                                    }
                                                >
                                                    {service.serviceName ||
                                                        `Service #${service.churchServiceId}`}
                                                    {service.serviceDate
                                                        ? ` — ${formatDate(
                                                              service.serviceDate
                                                          )}`
                                                        : ""}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>

                                <label>
                                    <span>
                                        Giving Type *
                                    </span>

                                    <select
                                        value={
                                            form.givingType
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "givingType",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        required
                                    >
                                        {GIVING_TYPES.map(
                                            (
                                                type
                                            ) => (
                                                <option
                                                    key={
                                                        type
                                                    }
                                                    value={
                                                        type
                                                    }
                                                >
                                                    {formatGivingType(
                                                        type
                                                    )}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>

                                <label>
                                    <span>
                                        Amount *
                                    </span>

                                    <div className="giving-amount-input">
                                        <span>
                                            ₱
                                        </span>

                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={
                                                form.amount
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateForm(
                                                    "amount",
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </label>

                                <label>
                                    <span>
                                        Giving Date *
                                    </span>

                                    <input
                                        type="date"
                                        value={
                                            form.givingDate
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "givingDate",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        required
                                    />
                                </label>

                                <label>
                                    <span>
                                        Payment Method *
                                    </span>

                                    <select
                                        value={
                                            form.paymentMethod
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "paymentMethod",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        required
                                    >
                                        {PAYMENT_METHODS.map(
                                            (
                                                method
                                            ) => (
                                                <option
                                                    key={
                                                        method
                                                    }
                                                    value={
                                                        method
                                                    }
                                                >
                                                    {formatGivingType(
                                                        method
                                                    )}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>

                                <label className="full-width">
                                    <span>
                                        Reference Number
                                    </span>

                                    <input
                                        type="text"
                                        value={
                                            form.referenceNumber
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "referenceNumber",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Optional reference number"
                                    />
                                </label>

                                <label className="full-width">
                                    <span>
                                        Notes
                                    </span>

                                    <textarea
                                        rows={4}
                                        value={
                                            form.notes
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "notes",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Optional notes..."
                                    />
                                </label>

                            </div>

                            <div className="giving-management-modal-footer">

                                <button
                                    type="button"
                                    className="secondary"
                                    onClick={() =>
                                        setShowModal(
                                            false
                                        )
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingGiving
                                        ? "Update Giving"
                                        : "Record Giving"}
                                </button>

                            </div>

                        </form>

                    </div>
                </div>
            )}

            {/* =====================================================
                VIEW MODAL
            ===================================================== */}

            {selectedGiving && (
                <div
                    className="giving-management-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setSelectedGiving(
                                null
                            );
                        }
                    }}
                >
                    <div className="giving-management-modal">

                        <div className="giving-management-modal-header">

                            <div>
                                <span>
                                    CONTRIBUTION RECORD
                                </span>

                                <h2>
                                    Giving Details
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedGiving(
                                        null
                                    )
                                }
                            >
                                ×
                            </button>

                        </div>

                        <div className="giving-detail-hero">

                            <div>
                                ₱
                            </div>

                            <section>
                                <span>
                                    {formatGivingType(
                                        selectedGiving.givingType
                                    )}
                                </span>

                                <strong>
                                    {formatCurrency(
                                        selectedGiving.amount
                                    )}
                                </strong>

                                <small>
                                    {formatDate(
                                        selectedGiving.givingDate
                                    )}
                                </small>
                            </section>

                        </div>

                        <div className="giving-detail-grid">

                            <div>
                                <span>
                                    Member
                                </span>

                                <strong>
                                    {selectedGiving.memberName ||
                                        "WALK-IN / ANONYMOUS"}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Member Code
                                </span>

                                <strong>
                                    {selectedGiving.memberCode ||
                                        "—"}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Giving Type
                                </span>

                                <strong>
                                    {formatGivingType(
                                        selectedGiving.givingType
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Payment Method
                                </span>

                                <strong>
                                    {selectedGiving.paymentMethod ||
                                        "—"}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Church Service
                                </span>

                                <strong>
                                    {selectedGiving.serviceName ||
                                        "No Service"}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Reference Number
                                </span>

                                <strong>
                                    {selectedGiving.referenceNumber ||
                                        "—"}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Recorded By
                                </span>

                                <strong>
                                    {selectedGiving.recordedBy ||
                                        "SYSTEM"}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Record ID
                                </span>

                                <strong>
                                    #
                                    {
                                        selectedGiving.givingId
                                    }
                                </strong>
                            </div>

                        </div>

                        {selectedGiving.notes && (
                            <div className="giving-detail-notes">
                                <span>
                                    NOTES
                                </span>

                                <p>
                                    {
                                        selectedGiving.notes
                                    }
                                </p>
                            </div>
                        )}

                        <div className="giving-management-modal-footer">

                            {allowEdit && (
                                <button
                                    type="button"
                                    className="secondary"
                                    onClick={() => {
                                        const giving =
                                            selectedGiving;

                                        setSelectedGiving(
                                            null
                                        );

                                        openEditModal(
                                            giving
                                        );
                                    }}
                                >
                                    Edit Record
                                </button>
                            )}

                            {allowDelete && (
                                <button
                                    type="button"
                                    className="danger-button"
                                    onClick={() =>
                                        void deleteGiving(
                                            selectedGiving
                                        )
                                    }
                                >
                                    Delete
                                </button>
                            )}

                            <button
                                type="button"
                                className="primary"
                                onClick={() =>
                                    setSelectedGiving(
                                        null
                                    )
                                }
                            >
                                Close
                            </button>

                        </div>

                    </div>
                </div>
            )}

            {onBack && (
                <button
                    type="button"
                    className="giving-management-back"
                    onClick={onBack}
                >
                    ← Back to Dashboard
                </button>
            )}

        </div>
    );
};

export default GivingManagementPage;

