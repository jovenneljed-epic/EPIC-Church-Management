
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import axios from "axios";

import { API_BASE_URL } from "../config";

import "./ClientGiving.css";

// =========================================================
// TYPES
// =========================================================

interface GivingRecord {
    givingId: number;
    customerId: number;

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

interface ClientIdentity {
    clientMemberId: number | null;
    customerId: number | null;
    memberId: number | null;
    memberCode: string | null;
    clientRoleName: string | null;
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

// Keep the constant available for future use and avoid
// accidental unused-variable problems during refactoring.
void PAYMENT_METHODS;

// =========================================================
// AUTH HELPERS
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
// JWT HELPERS
// =========================================================

const parseJwtPayload = (
    token: string
): Record<string, unknown> | null => {
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

        const binary = atob(padded);

        const bytes = Array.prototype.map.call(
            binary,
            (character: string) =>
                "%" +
                (
                    "00" +
                    character
                        .charCodeAt(0)
                        .toString(16)
                ).slice(-2)
        );

        const json = decodeURIComponent(
            bytes.join("")
        );

        return JSON.parse(json);
    } catch {
        return null;
    }
};

const getClaim = (
    payload: Record<string, unknown>,
    ...keys: string[]
): string | null => {
    for (const key of keys) {
        const value = payload[key];

        if (
            typeof value === "string" &&
            value.trim()
        ) {
            return value.trim();
        }

        if (
            typeof value === "number" &&
            Number.isFinite(value)
        ) {
            return String(value);
        }
    }

    return null;
};

const getIntegerClaim = (
    payload: Record<string, unknown>,
    ...keys: string[]
): number | null => {
    const value = getClaim(
        payload,
        ...keys
    );

    if (!value) {
        return null;
    }

    const number = Number(value);

    return Number.isInteger(number) &&
        number > 0
        ? number
        : null;
};

// =========================================================
// CLIENT IDENTITY
// =========================================================

const getClientIdentity = (): ClientIdentity => {
    const emptyIdentity: ClientIdentity = {
        clientMemberId: null,
        customerId: null,
        memberId: null,
        memberCode: null,
        clientRoleName: null,
    };

    const token = getClientToken();

    if (!token) {
        return emptyIdentity;
    }

    const payload = parseJwtPayload(token);

    if (!payload) {
        return emptyIdentity;
    }

    return {
        clientMemberId: getIntegerClaim(
            payload,
            "clientMemberId",
            "ClientMemberId"
        ),

        customerId: getIntegerClaim(
            payload,
            "customerId",
            "CustomerId",
            "clientId",
            "ClientId"
        ),

        memberId: getIntegerClaim(
            payload,
            "memberId",
            "MemberId"
        ),

        memberCode: getClaim(
            payload,
            "memberCode",
            "MemberCode"
        ),

        clientRoleName: getClaim(
            payload,
            "clientRoleName",
            "ClientRoleName"
        ),
    };
};

// =========================================================
// FORMATTING HELPERS
// =========================================================

const formatCurrency = (
    value: number
): string => {
    return new Intl.NumberFormat(
        "en-PH",
        {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 2,
        }
    ).format(
        Number(value) || 0
    );
};

const formatDate = (
    value?: string | null
): string => {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(
        "en-PH",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        }
    );
};

const formatDateTime = (
    value?: string | null
): string => {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString(
        "en-PH",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }
    );
};

const getCurrentYear = (): number => {
    return new Date().getFullYear();
};

const getGivingTypeLabel = (
    type?: string | null
): string => {
    if (!type) {
        return "Other";
    }

    return type
        .toLowerCase()
        .split(" ")
        .map(
            (word) =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");
};

const getGivingTypeClass = (
    type?: string | null
): string => {
    switch (
        type?.toUpperCase()
    ) {
        case "TITHE":
            return "client-giving-type-tithe";

        case "OFFERING":
            return "client-giving-type-offering";

        case "MISSION":
            return "client-giving-type-mission";

        case "SPECIAL OFFERING":
            return "client-giving-type-special";

        case "PLEDGE":
            return "client-giving-type-pledge";

        default:
            return "client-giving-type-other";
    }
};

// =========================================================
// COMPONENT
// =========================================================

const ClientGivingPage: React.FC = () => {

    // =====================================================
    // IDENTITY
    // =====================================================

    const identity = useMemo(
        () => getClientIdentity(),
        []
    );

    // =====================================================
    // STATE
    // =====================================================

    const [
        givings,
        setGivings,
    ] = useState<GivingRecord[]>([]);

    const [
        loading,
        setLoading,
    ] = useState<boolean>(true);

    const [
        refreshing,
        setRefreshing,
    ] = useState<boolean>(false);

    const [
        error,
        setError,
    ] = useState<string>("");

    const [
        search,
        setSearch,
    ] = useState<string>("");

    const [
        typeFilter,
        setTypeFilter,
    ] = useState<string>("ALL");

    const [
        selectedGiving,
        setSelectedGiving,
    ] =
        useState<GivingRecord | null>(
            null
        );

    // =====================================================
    // LOAD GIVING
    // =====================================================

    const loadGiving = useCallback(
        async (
            showFullLoading: boolean = true
        ): Promise<void> => {
            try {

                if (showFullLoading) {
                    setLoading(true);
                } else {
                    setRefreshing(true);
                }

                setError("");

                const token =
                    getClientToken();

                if (!token) {
                    setError(
                        "Your client session has expired. Please log in again."
                    );

                    setGivings([]);

                    return;
                }

                console.log(
                    "EPIC CLIENT GIVING: Loading giving records..."
                );

                const response =
                    await axios.get(
                        `${API_BASE_URL}/Giving`,
                        getAuthConfig()
                    );

                const responseData =
                    response.data;

                const data: GivingRecord[] =
                    Array.isArray(
                        responseData
                    )
                        ? responseData
                        : Array.isArray(
                              responseData?.givings
                          )
                        ? responseData.givings
                        : Array.isArray(
                              responseData?.giving
                          )
                        ? responseData.giving
                        : [];

                /*
                 * The backend should enforce authorization.
                 *
                 * This additional client-side filter makes sure
                 * the personal Client Giving page only displays
                 * records belonging to the authenticated member.
                 */

                let clientRecords =
                    data;

                if (identity.memberId) {

                    clientRecords =
                        data.filter(
                            (
                                giving
                            ) =>
                                Number(
                                    giving.memberId
                                ) ===
                                identity.memberId
                        );

                } else {

                    clientRecords = [];

                }

                setGivings(
                    clientRecords
                );

                console.log(
                    "EPIC CLIENT GIVING: Records loaded:",
                    clientRecords.length
                );

            } catch (err: unknown) {

                console.error(
                    "EPIC Client Giving Load Error:",
                    err
                );

                if (
                    axios.isAxiosError(
                        err
                    )
                ) {

                    if (
                        err.response
                            ?.status ===
                        401
                    ) {

                        setError(
                            "Your client session has expired. Please log in again."
                        );

                    } else if (
                        err.response
                            ?.status ===
                        403
                    ) {

                        setError(
                            "You do not have permission to view your giving records."
                        );

                    } else {

                        const serverMessage =
                            err.response
                                ?.data
                                ?.message;

                        setError(
                            typeof serverMessage ===
                                "string" &&
                            serverMessage.trim()
                                ? serverMessage
                                : "Unable to load your giving records."
                        );
                    }

                } else {

                    setError(
                        "Unable to load your giving records."
                    );

                }

            } finally {

                setLoading(false);
                setRefreshing(false);

            }
        },
        [
            identity.memberId,
        ]
    );

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        void loadGiving();
    }, [loadGiving]);

    // =====================================================
    // TOTAL GIVING
    // =====================================================

    const totalGiving = useMemo(
        () =>
            givings.reduce(
                (
                    total,
                    giving
                ) =>
                    total +
                    Number(
                        giving.amount || 0
                    ),
                0
            ),
        [givings]
    );

    // =====================================================
    // CURRENT YEAR
    // =====================================================

    const currentYearGiving =
        useMemo(() => {

            const year =
                getCurrentYear();

            return givings
                .filter(
                    (giving) => {

                        const date =
                            new Date(
                                giving.givingDate
                            );

                        return (
                            !Number.isNaN(
                                date.getTime()
                            ) &&
                            date.getFullYear() ===
                                year
                        );
                    }
                )
                .reduce(
                    (
                        total,
                        giving
                    ) =>
                        total +
                        Number(
                            giving.amount ||
                                0
                        ),
                    0
                );

        }, [givings]);

    // =====================================================
    // CURRENT MONTH
    // =====================================================

    const currentMonthGiving =
        useMemo(() => {

            const now =
                new Date();

            return givings
                .filter(
                    (giving) => {

                        const date =
                            new Date(
                                giving.givingDate
                            );

                        return (
                            !Number.isNaN(
                                date.getTime()
                            ) &&
                            date.getFullYear() ===
                                now.getFullYear() &&
                            date.getMonth() ===
                                now.getMonth()
                        );
                    }
                )
                .reduce(
                    (
                        total,
                        giving
                    ) =>
                        total +
                        Number(
                            giving.amount ||
                                0
                        ),
                    0
                );

        }, [givings]);

    // =====================================================
    // LATEST GIVING
    // =====================================================

    const latestGiving =
        useMemo(() => {

            if (!givings.length) {
                return null;
            }

            return [...givings].sort(
                (a, b) =>
                    new Date(
                        b.givingDate
                    ).getTime() -
                    new Date(
                        a.givingDate
                    ).getTime()
            )[0];

        }, [givings]);

    // =====================================================
    // TYPE BREAKDOWN
    // =====================================================

    const typeBreakdown =
        useMemo(() => {

            return GIVING_TYPES.map(
                (type) => {

                    const amount =
                        givings
                            .filter(
                                (giving) =>
                                    giving.givingType
                                        ?.toUpperCase() ===
                                    type
                            )
                            .reduce(
                                (
                                    total,
                                    giving
                                ) =>
                                    total +
                                    Number(
                                        giving.amount ||
                                            0
                                    ),
                                0
                            );

                    return {
                        type,
                        amount,
                    };
                }
            );

        }, [givings]);

    // =====================================================
    // FILTERED RECORDS
    // =====================================================

    const filteredGivings =
        useMemo(() => {

            const keyword =
                search
                    .trim()
                    .toLowerCase();

            return [...givings]
                .filter(
                    (giving) => {

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
                            giving.paymentMethod
                                ?.toLowerCase()
                                .includes(
                                    keyword
                                ) ||
                            giving.referenceNumber
                                ?.toLowerCase()
                                .includes(
                                    keyword
                                ) ||
                            giving.serviceName
                                ?.toLowerCase()
                                .includes(
                                    keyword
                                );

                        const matchesType =
                            typeFilter ===
                                "ALL" ||
                            giving.givingType
                                ?.toUpperCase() ===
                                typeFilter;

                        return (
                            matchesSearch &&
                            matchesType
                        );
                    }
                )
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
    // IDENTITY CHECK
    // =====================================================

    const identityMissing =
        !identity.memberId;

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="client-giving-page">

            {/* =================================================
                HERO
            ================================================= */}

            <section className="client-giving-hero">

                <div className="client-giving-hero-content">

                    <div className="client-giving-eyebrow">
                        EPIC CHURCH MANAGEMENT SYSTEM
                    </div>

                    <h1>
                        My Giving
                    </h1>

                    <p>
                        View your personal
                        giving history,
                        contributions, and
                        giving records.
                    </p>

                    <div className="client-giving-identity">

                        <span className="client-giving-identity-icon">
                            ✓
                        </span>

                        <div>

                            <strong>
                                Giving Account
                            </strong>

                            <span>
                                {identity.memberCode
                                    ? `Member ${identity.memberCode}`
                                    : "Authenticated member"}
                            </span>

                        </div>

                    </div>

                </div>

                <div className="client-giving-hero-symbol">
                    ₱
                </div>

            </section>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="client-giving-alert client-giving-alert-error">

                    <span>
                        !
                    </span>

                    <div>

                        <strong>
                            Unable to load giving
                        </strong>

                        <p>
                            {error}
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            void loadGiving(
                                false
                            )
                        }
                    >
                        Try Again
                    </button>

                </div>
            )}

            {/* =================================================
                MEMBER LINK WARNING
            ================================================= */}

            {identityMissing && (
                <div className="client-giving-alert client-giving-alert-warning">

                    <span>
                        !
                    </span>

                    <div>

                        <strong>
                            Member account not linked
                        </strong>

                        <p>
                            Your client account
                            does not currently
                            have a linked church
                            member record.
                        </p>

                    </div>

                </div>
            )}

            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <section className="client-giving-stats">

                <div className="client-giving-stat-card primary">

                    <div className="client-giving-stat-icon">
                        ₱
                    </div>

                    <div className="client-giving-stat-content">

                        <span>
                            Total Giving
                        </span>

                        <strong>
                            {formatCurrency(
                                totalGiving
                            )}
                        </strong>

                        <small>
                            All recorded contributions
                        </small>

                    </div>

                </div>

                <div className="client-giving-stat-card">

                    <div className="client-giving-stat-icon">
                        ◷
                    </div>

                    <div className="client-giving-stat-content">

                        <span>
                            This Month
                        </span>

                        <strong>
                            {formatCurrency(
                                currentMonthGiving
                            )}
                        </strong>

                        <small>
                            Current month
                        </small>

                    </div>

                </div>

                <div className="client-giving-stat-card">

                    <div className="client-giving-stat-icon">
                        ▣
                    </div>

                    <div className="client-giving-stat-content">

                        <span>
                            This Year
                        </span>

                        <strong>
                            {formatCurrency(
                                currentYearGiving
                            )}
                        </strong>

                        <small>
                            {getCurrentYear()}
                        </small>

                    </div>

                </div>

                <div className="client-giving-stat-card">

                    <div className="client-giving-stat-icon">
                        #
                    </div>

                    <div className="client-giving-stat-content">

                        <span>
                            Contributions
                        </span>

                        <strong>
                            {givings.length}
                        </strong>

                        <small>
                            Recorded giving transactions
                        </small>

                    </div>

                </div>

            </section>

            {/* =================================================
                CONTENT GRID
            ================================================= */}

            <div className="client-giving-content-grid">

                {/* =================================================
                    GIVING OVERVIEW
                ================================================= */}

                <section className="client-giving-panel">

                    <div className="client-giving-panel-header">

                        <div>

                            <span>
                                CONTRIBUTION SUMMARY
                            </span>

                            <h2>
                                Giving Overview
                            </h2>

                            <p>
                                Your giving
                                distribution by
                                category.
                            </p>

                        </div>

                    </div>

                    <div className="client-giving-breakdown">

                        {typeBreakdown.map(
                            (item) => {

                                const percentage =
                                    totalGiving >
                                    0
                                        ? Math.min(
                                              100,
                                              (
                                                  item.amount /
                                                  totalGiving
                                              ) *
                                                  100
                                          )
                                        : 0;

                                return (
                                    <div
                                        className="client-giving-breakdown-item"
                                        key={
                                            item.type
                                        }
                                    >

                                        <div className="client-giving-breakdown-top">

                                            <span>
                                                {getGivingTypeLabel(
                                                    item.type
                                                )}
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    item.amount
                                                )}
                                            </strong>

                                        </div>

                                        <div className="client-giving-progress">

                                            <span
                                                style={{
                                                    width: `${percentage}%`,
                                                }}
                                            />

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>

                </section>

                {/* =================================================
                    LATEST GIVING
                ================================================= */}

                <section className="client-giving-panel client-giving-latest-panel">

                    <div className="client-giving-panel-header">

                        <div>

                            <span>
                                MOST RECENT
                            </span>

                            <h2>
                                Latest Giving
                            </h2>

                        </div>

                    </div>

                    {latestGiving ? (
                        <div className="client-giving-latest">

                            <div className="client-giving-latest-icon">
                                ₱
                            </div>

                            <div className="client-giving-latest-info">

                                <span>
                                    {getGivingTypeLabel(
                                        latestGiving.givingType
                                    )}
                                </span>

                                <strong>
                                    {formatCurrency(
                                        latestGiving.amount
                                    )}
                                </strong>

                                <small>
                                    {formatDate(
                                        latestGiving.givingDate
                                    )}
                                </small>

                            </div>

                            <div
                                className={`client-giving-type-badge ${getGivingTypeClass(
                                    latestGiving.givingType
                                )}`}
                            >
                                {getGivingTypeLabel(
                                    latestGiving.givingType
                                )}
                            </div>

                        </div>
                    ) : (
                        <div className="client-giving-latest-empty">

                            <div>
                                ₱
                            </div>

                            <strong>
                                No giving recorded
                            </strong>

                            <p>
                                Your giving
                                history will
                                appear here once
                                contributions
                                have been recorded.
                            </p>

                        </div>
                    )}

                </section>

            </div>

            {/* =================================================
                RECORDS
            ================================================= */}

            <section className="client-giving-records-panel">

                <div className="client-giving-records-header">

                    <div>

                        <span>
                            TRANSACTION HISTORY
                        </span>

                        <h2>
                            My Giving Records
                        </h2>

                        <p>
                            View your recorded
                            contributions.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="client-giving-refresh-button"
                        onClick={() =>
                            void loadGiving(
                                false
                            )
                        }
                        disabled={
                            refreshing
                        }
                    >

                        <span
                            className={
                                refreshing
                                    ? "client-giving-refresh spinning"
                                    : "client-giving-refresh"
                            }
                        >
                            ↻
                        </span>

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}

                    </button>

                </div>

                {/* =================================================
                    FILTERS
                ================================================= */}

                <div className="client-giving-filters">

                    <div className="client-giving-search">

                        <span>
                            ⌕
                        </span>

                        <input
                            type="text"
                            placeholder="Search your giving..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() =>
                                    setSearch(
                                        ""
                                    )
                                }
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}

                    </div>

                    <select
                        value={
                            typeFilter
                        }
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
                                    key={
                                        type
                                    }
                                    value={
                                        type
                                    }
                                >
                                    {getGivingTypeLabel(
                                        type
                                    )}
                                </option>
                            )
                        )}

                    </select>

                </div>

                {/* =================================================
                    LOADING
                ================================================= */}

                {loading ? (
                    <div className="client-giving-loading">

                        <div className="client-giving-spinner" />

                        <strong>
                            Loading your giving...
                        </strong>

                        <p>
                            Please wait while
                            we retrieve your
                            giving records.
                        </p>

                    </div>

                ) : filteredGivings.length === 0 ? (

                    /* =================================================
                       EMPTY
                    ================================================= */

                    <div className="client-giving-empty">

                        <div className="client-giving-empty-icon">
                            ₱
                        </div>

                        <h3>
                            {givings.length === 0
                                ? "No Giving Records Yet"
                                : "No Matching Records"}
                        </h3>

                        <p>
                            {givings.length === 0
                                ? "Your recorded contributions will appear here."
                                : "Try changing your search or giving type filter."}
                        </p>

                        {givings.length > 0 &&
                            (
                                search ||
                                typeFilter !==
                                    "ALL"
                            ) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setTypeFilter(
                                            "ALL"
                                        );
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

                    <div className="client-giving-table-wrapper">

                        <table className="client-giving-table">

                            <thead>

                                <tr>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Giving
                                    </th>

                                    <th>
                                        Service
                                    </th>

                                    <th>
                                        Payment
                                    </th>

                                    <th>
                                        Reference
                                    </th>

                                    <th className="amount-column">
                                        Amount
                                    </th>

                                    <th>
                                        Action
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

                                                <div className="client-giving-date">

                                                    <strong>
                                                        {formatDate(
                                                            giving.givingDate
                                                        )}
                                                    </strong>

                                                    {giving.recordedDate && (
                                                        <small>
                                                            Recorded{" "}
                                                            {formatDate(
                                                                giving.recordedDate
                                                            )}
                                                        </small>
                                                    )}

                                                </div>

                                            </td>

                                            <td>

                                                <div className="client-giving-record-type">

                                                    <div
                                                        className={`client-giving-record-type-icon ${getGivingTypeClass(
                                                            giving.givingType
                                                        )}`}
                                                    >
                                                        ₱
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {getGivingTypeLabel(
                                                                giving.givingType
                                                            )}
                                                        </strong>

                                                        {giving.notes && (
                                                            <small>
                                                                {
                                                                    giving.notes
                                                                }
                                                            </small>
                                                        )}

                                                    </div>

                                                </div>

                                            </td>

                                            <td>

                                                <div className="client-giving-service">

                                                    <strong>
                                                        {giving.serviceName ||
                                                            "No Service"}
                                                    </strong>

                                                    {giving.churchServiceId && (
                                                        <small>
                                                            Service #
                                                            {
                                                                giving.churchServiceId
                                                            }
                                                        </small>
                                                    )}

                                                </div>

                                            </td>

                                            <td>

                                                <span className="client-giving-payment">
                                                    {giving.paymentMethod ||
                                                        "—"}
                                                </span>

                                            </td>

                                            <td>

                                                <span className="client-giving-reference">
                                                    {giving.referenceNumber ||
                                                        "—"}
                                                </span>

                                            </td>

                                            <td className="client-giving-amount">

                                                {formatCurrency(
                                                    giving.amount
                                                )}

                                            </td>

                                            <td>

                                                <button
                                                    type="button"
                                                    className="client-giving-view-button"
                                                    onClick={() =>
                                                        setSelectedGiving(
                                                            giving
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

                {/* =================================================
                    RECORD FOOTER
                ================================================= */}

                {!loading &&
                    filteredGivings.length >
                        0 && (

                        <div className="client-giving-records-footer">

                            Showing{" "}
                            <strong>
                                {
                                    filteredGivings.length
                                }
                            </strong>{" "}
                            of{" "}
                            <strong>
                                {
                                    givings.length
                                }
                            </strong>{" "}
                            giving records

                        </div>
                    )}

            </section>

            {/* =================================================
                DETAILS MODAL
            ================================================= */}

            {selectedGiving && (

                <div
                    className="client-giving-modal-overlay"
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

                    <div
                        className="client-giving-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="client-giving-modal-title"
                    >

                        <div className="client-giving-modal-header">

                            <div>

                                <span>
                                    GIVING RECORD
                                </span>

                                <h2 id="client-giving-modal-title">
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
                                className="client-giving-modal-close"
                                aria-label="Close giving details"
                            >
                                ×
                            </button>

                        </div>

                        {/* =================================================
                            MODAL SUMMARY
                        ================================================= */}

                        <div className="client-giving-modal-summary">

                            <div className="client-giving-modal-icon">
                                ₱
                            </div>

                            <div>

                                <span>
                                    {getGivingTypeLabel(
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

                            </div>

                        </div>

                        {/* =================================================
                            DETAILS
                        ================================================= */}

                        <div className="client-giving-detail-grid">

                            <div>

                                <span>
                                    Giving Type
                                </span>

                                <strong>
                                    {getGivingTypeLabel(
                                        selectedGiving.givingType
                                    )}
                                </strong>

                            </div>

                            <div>

                                <span>
                                    Amount
                                </span>

                                <strong>
                                    {formatCurrency(
                                        selectedGiving.amount
                                    )}
                                </strong>

                            </div>

                            <div>

                                <span>
                                    Giving Date
                                </span>

                                <strong>
                                    {formatDate(
                                        selectedGiving.givingDate
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
                                        "Church Admin"}
                                </strong>

                            </div>

                            <div>

                                <span>
                                    Recorded Date
                                </span>

                                <strong>
                                    {formatDateTime(
                                        selectedGiving.recordedDate
                                    )}
                                </strong>

                            </div>

                        </div>

                        {/* =================================================
                            NOTES
                        ================================================= */}

                        {selectedGiving.notes && (

                            <div className="client-giving-notes">

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

                        {/* =================================================
                            MODAL FOOTER
                        ================================================= */}

                        <div className="client-giving-modal-footer">

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

                            <button
                                type="button"
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

        </div>
    );
};

export default ClientGivingPage;

