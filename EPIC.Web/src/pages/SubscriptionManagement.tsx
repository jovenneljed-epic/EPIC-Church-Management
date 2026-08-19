import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import axios, {
    AxiosError
} from "axios";

import { API_BASE_URL } from "../config";

import "./SubscriptionManagement.css";

// =========================================================
// TYPES
// =========================================================

interface SubscriptionPlan {
    subscriptionPlanId: number;
    planName: string;
    description?: string | null;

    monthlyPrice: number;
    annualPrice: number;

    trialDays: number;

    maxUsers: number;
    maxMembers: number;

    includesChurchManagement: boolean;
    includesAttendance: boolean;
    includesGiving: boolean;
    includesFinance: boolean;
    includesMinistries: boolean;
    includesEPICLearning: boolean;
    includesReports: boolean;

    isActive: boolean;
    sortOrder: number;
}

interface Subscription {
    subscriptionId: number;

    churchName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;

    subscriptionPlanId: number;
    subscriptionPlan?: SubscriptionPlan | null;

    billingCycle: string;

    amount: number;
    currency: string;

    status: string;

    startDate: string;
    trialEndsAt?: string | null;
    endDate?: string | null;
    nextBillingDate?: string | null;
    cancelledDate?: string | null;

    paymentCustomerId?: string | null;
    paymentSubscriptionId?: string | null;

    notes?: string | null;

    createdDate: string;
    updatedDate?: string | null;
}

interface Payment {
    paymentId: number;

    subscriptionId: number;

    amount: number;
    currency: string;

    paymentMethod: string;
    status: string;

    referenceNumber?: string | null;

    gatewayPaymentId?: string | null;
    gatewayCheckoutId?: string | null;
    gatewayCustomerId?: string | null;

    invoiceNumber?: string | null;
    receiptNumber?: string | null;

    failureReason?: string | null;
    notes?: string | null;

    createdDate: string;
}

type FilterStatus =
    | "ALL"
    | "TRIAL"
    | "ACTIVE"
    | "PAST_DUE"
    | "SUSPENDED"
    | "EXPIRED"
    | "CANCELLED";

// =========================================================
// CONSTANTS
// =========================================================

const SUBSCRIPTIONS_ENDPOINT =
    `${API_BASE_URL}/Subscriptions`;

const PLANS_ENDPOINT =
    `${API_BASE_URL}/SubscriptionPlans`;

const ACTIVE_STATUSES: string[] = [
    "TRIAL",
    "ACTIVE",
    "PAST_DUE"
];

const RENEWABLE_STATUSES: string[] = [
    "CANCELLED",
    "EXPIRED"
];

// =========================================================
// COMPONENT
// =========================================================

const SubscriptionManagement: React.FC = () => {

    // =====================================================
    // STATE
    // =====================================================

    const [
        subscriptions,
        setSubscriptions
    ] = useState<Subscription[]>([]);

    const [
        plans,
        setPlans
    ] = useState<SubscriptionPlan[]>([]);

    const [
        loading,
        setLoading
    ] = useState<boolean>(true);

    const [
        refreshing,
        setRefreshing
    ] = useState<boolean>(false);

    const [
        error,
        setError
    ] = useState<string>("");

    const [
        filter,
        setFilter
    ] = useState<FilterStatus>("ALL");

    const [
        search,
        setSearch
    ] = useState<string>("");

    const [
        selectedSubscription,
        setSelectedSubscription
    ] = useState<Subscription | null>(null);

    const [
        selectedPayments,
        setSelectedPayments
    ] = useState<Payment[]>([]);

    const [
        showDetails,
        setShowDetails
    ] = useState<boolean>(false);

    const [
        detailsLoading,
        setDetailsLoading
    ] = useState<boolean>(false);

    const [
        processingId,
        setProcessingId
    ] = useState<number | null>(null);

    // =====================================================
    // AUTH CONFIG
    // =====================================================

    const getAuthConfig = useCallback(() => {

        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("epicToken");

        if (!token) {
            throw new Error(
                "Authentication token not found."
            );
        }

        return {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        };

    }, []);

    // =====================================================
    // ERROR MESSAGE HELPER
    // =====================================================

    const getErrorMessage = (
        error: unknown,
        fallback: string
    ): string => {

        if (
            axios.isAxiosError(error)
        ) {

            const axiosError =
                error as AxiosError<{
                    message?: string;
                    title?: string;
                }>;

            return (
                axiosError.response?.data?.message ||
                axiosError.response?.data?.title ||
                axiosError.message ||
                fallback
            );
        }

        if (
            error instanceof Error
        ) {
            return error.message;
        }

        return fallback;
    };

    // =====================================================
    // LOAD SUBSCRIPTIONS
    // =====================================================

    const loadSubscriptions =
        useCallback(
            async (): Promise<Subscription[]> => {

                const response =
                    await axios.get<Subscription[]>(
                        SUBSCRIPTIONS_ENDPOINT,
                        getAuthConfig()
                    );

                const data =
                    Array.isArray(response.data)
                        ? response.data
                        : [];

                setSubscriptions(data);

                return data;
            },
            [getAuthConfig]
        );

    // =====================================================
    // LOAD PLANS
    // =====================================================

    const loadPlans =
        useCallback(
            async (): Promise<SubscriptionPlan[]> => {

                const response =
                    await axios.get<SubscriptionPlan[]>(
                        PLANS_ENDPOINT,
                        getAuthConfig()
                    );

                const data =
                    Array.isArray(response.data)
                        ? response.data
                        : [];

                setPlans(data);

                return data;
            },
            [getAuthConfig]
        );

    // =====================================================
    // LOAD ALL DATA
    // =====================================================

    const loadData =
        useCallback(
            async (
                isRefresh = false
            ) => {

                try {

                    if (isRefresh) {
                        setRefreshing(true);
                    }
                    else {
                        setLoading(true);
                    }

                    setError("");

                    await Promise.all([
                        loadSubscriptions(),
                        loadPlans()
                    ]);

                }
                catch (error) {

                    console.error(
                        "Subscription management load error:",
                        error
                    );

                    setError(
                        getErrorMessage(
                            error,
                            "Unable to load subscription management data."
                        )
                    );

                }
                finally {

                    setLoading(false);
                    setRefreshing(false);

                }

            },
            [
                loadSubscriptions,
                loadPlans
            ]
        );

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadData();

    }, [loadData]);

    // =====================================================
    // STATISTICS
    // =====================================================

    const statistics = useMemo(() => {

        const total =
            subscriptions.length;

        const active =
            subscriptions.filter(
                subscription =>
                    subscription.status === "ACTIVE"
            ).length;

        const trial =
            subscriptions.filter(
                subscription =>
                    subscription.status === "TRIAL"
            ).length;

        const pastDue =
            subscriptions.filter(
                subscription =>
                    subscription.status === "PAST_DUE"
            ).length;

        const suspended =
            subscriptions.filter(
                subscription =>
                    subscription.status === "SUSPENDED"
            ).length;

        const cancelled =
            subscriptions.filter(
                subscription =>
                    subscription.status === "CANCELLED"
            ).length;

        return {
            total,
            active,
            trial,
            pastDue,
            suspended,
            cancelled
        };

    }, [subscriptions]);

    // =====================================================
    // FILTERED SUBSCRIPTIONS
    // =====================================================

    const filteredSubscriptions =
        useMemo(() => {

            const searchValue =
                search
                    .trim()
                    .toLowerCase();

            return subscriptions.filter(
                subscription => {

                    const matchesStatus =
                        filter === "ALL" ||
                        subscription.status === filter;

                    if (!matchesStatus) {
                        return false;
                    }

                    if (!searchValue) {
                        return true;
                    }

                    const churchName =
                        subscription.churchName
                            ?.toLowerCase() || "";

                    const contactName =
                        subscription.contactName
                            ?.toLowerCase() || "";

                    const email =
                        subscription.contactEmail
                            ?.toLowerCase() || "";

                    const planName =
                        subscription.subscriptionPlan
                            ?.planName
                            ?.toLowerCase() || "";

                    return (
                        churchName.includes(
                            searchValue
                        ) ||
                        contactName.includes(
                            searchValue
                        ) ||
                        email.includes(
                            searchValue
                        ) ||
                        planName.includes(
                            searchValue
                        )
                    );

                }
            );

        }, [
            subscriptions,
            filter,
            search
        ]);

    // =====================================================
    // FORMAT CURRENCY
    // =====================================================

    const formatCurrency = (
        amount: number | null | undefined,
        currency = "PHP"
    ): string => {

        const numericAmount =
            Number(amount || 0);

        try {

            return new Intl.NumberFormat(
                "en-PH",
                {
                    style: "currency",
                    currency
                }
            ).format(numericAmount);

        }
        catch {

            return `₱${numericAmount.toLocaleString(
                "en-PH",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )}`;

        }
    };

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (
        value?: string | null
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
            return "—";
        }

        return date.toLocaleDateString(
            "en-PH",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
    };

    // =====================================================
    // NORMALIZE STATUS
    // =====================================================

    const normalizeStatus = (
        status?: string | null
    ): string => {

        return (
            status ||
            "UNKNOWN"
        )
            .trim()
            .toUpperCase();

    };

    // =====================================================
    // STATUS CLASS
    // =====================================================

    const getStatusClass = (
        status?: string | null
    ): string => {

        const normalized =
            normalizeStatus(status);

        return `status-${normalized
            .toLowerCase()
            .replace(/_/g, "-")}`;

    };

    // =====================================================
    // STATUS LABEL
    // =====================================================

    const getStatusLabel = (
        status?: string | null
    ): string => {

        const normalized =
            normalizeStatus(status);

        switch (normalized) {

            case "PAST_DUE":
                return "Past Due";

            case "CANCELLED":
                return "Cancelled";

            case "SUSPENDED":
                return "Suspended";

            case "EXPIRED":
                return "Expired";

            case "TRIAL":
                return "Trial";

            case "ACTIVE":
                return "Active";

            default:
                return normalized;

        }
    };

    // =====================================================
    // VIEW SUBSCRIPTION
    // =====================================================

    const viewSubscription =
        async (
            subscription: Subscription
        ) => {

            try {

                setSelectedSubscription(
                    subscription
                );

                setSelectedPayments([]);

                setShowDetails(true);

                setDetailsLoading(true);

               const response =
    await axios.get(
        `${API_BASE_URL}/Subscriptions/${subscription.subscriptionId}/payments`,
        getAuthConfig()
    );

                setSelectedPayments(
                    Array.isArray(response.data)
                        ? response.data
                        : []
                );

            }
            catch (error) {

                console.error(
                    "Failed to load payment history:",
                    error
                );

                setSelectedPayments([]);

            }
            finally {

                setDetailsLoading(false);

            }

        };

    // =====================================================
    // CLOSE DETAILS
    // =====================================================

    const closeDetails = () => {

        setShowDetails(false);

        setSelectedSubscription(null);

        setSelectedPayments([]);

    };

    // =====================================================
    // CANCEL SUBSCRIPTION
    // =====================================================

    const cancelSubscription =
        async (
            subscription: Subscription
        ) => {

            const confirmed =
                window.confirm(
                    `Cancel the subscription for ${subscription.churchName}?`
                );

            if (!confirmed) {
                return;
            }

            try {

                setProcessingId(
                    subscription.subscriptionId
                );

                setError("");

                await axios.post(
                    `${SUBSCRIPTIONS_ENDPOINT}/${subscription.subscriptionId}/cancel`,
                    {},
                    getAuthConfig()
                );

                await loadData(true);

                if (
                    selectedSubscription
                        ?.subscriptionId ===
                    subscription.subscriptionId
                ) {

                    closeDetails();

                }

            }
            catch (error) {

                console.error(
                    "Cancel subscription error:",
                    error
                );

                alert(
                    getErrorMessage(
                        error,
                        "Unable to cancel subscription."
                    )
                );

            }
            finally {

                setProcessingId(null);

            }

        };

    // =====================================================
    // RENEW SUBSCRIPTION
    // =====================================================

    const renewSubscription =
        async (
            subscription: Subscription
        ) => {

            const confirmed =
                window.confirm(
                    `Renew the subscription for ${subscription.churchName}?`
                );

            if (!confirmed) {
                return;
            }

            try {

                setProcessingId(
                    subscription.subscriptionId
                );

                setError("");

                await axios.post(
                    `${SUBSCRIPTIONS_ENDPOINT}/${subscription.subscriptionId}/renew`,
                    {},
                    getAuthConfig()
                );

                await loadData(true);

                if (
                    selectedSubscription
                        ?.subscriptionId ===
                    subscription.subscriptionId
                ) {

                    closeDetails();

                }

            }
            catch (error) {

                console.error(
                    "Renew subscription error:",
                    error
                );

                alert(
                    getErrorMessage(
                        error,
                        "Unable to renew subscription."
                    )
                );

            }
            finally {

                setProcessingId(null);

            }

        };

    // =====================================================
    // REFRESH
    // =====================================================

    const handleRefresh = () => {

        loadData(true);

    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div className="subscription-page">

                <div className="subscription-loading">

                    <div className="loading-spinner" />

                    <p>
                        Loading subscription management...
                    </p>

                </div>

            </div>
        );

    }

    // =====================================================
    // PAGE
    // =====================================================

    return (
        <div className="subscription-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="subscription-header">

                <div>

                    <div className="subscription-eyebrow">
                        EPIC CMS
                    </div>

                    <h1>
                        Subscription Management
                    </h1>

                    <p>
                        Manage churches, subscription
                        plans, billing status, and
                        payment history.
                    </p>

                </div>

                <button
                    type="button"
                    className="refresh-button"
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    {refreshing
                        ? "Refreshing..."
                        : "↻ Refresh"}
                </button>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="subscription-error">

                    {error}

                </div>

            )}

            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="subscription-stats">

                <div className="stat-card">

                    <span className="stat-label">
                        Total
                    </span>

                    <strong>
                        {statistics.total}
                    </strong>

                </div>

                <div className="stat-card">

                    <span className="stat-label">
                        Active
                    </span>

                    <strong>
                        {statistics.active}
                    </strong>

                </div>

                <div className="stat-card">

                    <span className="stat-label">
                        Trial
                    </span>

                    <strong>
                        {statistics.trial}
                    </strong>

                </div>

                <div className="stat-card">

                    <span className="stat-label">
                        Past Due
                    </span>

                    <strong>
                        {statistics.pastDue}
                    </strong>

                </div>

                <div className="stat-card">

                    <span className="stat-label">
                        Suspended
                    </span>

                    <strong>
                        {statistics.suspended}
                    </strong>

                </div>

                <div className="stat-card">

                    <span className="stat-label">
                        Cancelled
                    </span>

                    <strong>
                        {statistics.cancelled}
                    </strong>

                </div>

            </div>

            {/* =================================================
                PLANS
            ================================================= */}

            <section className="plans-section">

                <div className="section-heading">

                    <div>

                        <h2>
                            Subscription Plans
                        </h2>

                        <p>
                            {plans.length} plan
                            {plans.length !== 1
                                ? "s"
                                : ""}
                        </p>

                    </div>

                </div>

                {plans.length === 0 ? (

                    <div className="empty-table">
                        No subscription plans found.
                    </div>

                ) : (

                    <div className="plans-grid">

                        {plans.map(plan => (

                            <div
                                className="plan-card"
                                key={
                                    plan.subscriptionPlanId
                                }
                            >

                                <div className="plan-card-top">

                                    <div>

                                        <h3>
                                            {plan.planName}
                                        </h3>

                                        <p>
                                            {
                                                plan.description ||
                                                "No description available."
                                            }
                                        </p>

                                    </div>

                                    <span
                                        className={
                                            plan.isActive
                                                ? "plan-active"
                                                : "plan-inactive"
                                        }
                                    >
                                        {plan.isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </span>

                                </div>

                                <div className="plan-pricing">

                                    <div>

                                        <small>
                                            Monthly
                                        </small>

                                        <strong>
                                            {formatCurrency(
                                                plan.monthlyPrice
                                            )}
                                        </strong>

                                    </div>

                                    <div>

                                        <small>
                                            Annual
                                        </small>

                                        <strong>
                                            {formatCurrency(
                                                plan.annualPrice
                                            )}
                                        </strong>

                                    </div>

                                </div>

                                <div className="plan-limits">

                                    <span>
                                        👥 {plan.maxUsers} users
                                    </span>

                                    <span>
                                        🏠 {plan.maxMembers} members
                                    </span>

                                    {plan.trialDays > 0 && (

                                        <span>
                                            🎁 {plan.trialDays} day trial
                                        </span>

                                    )}

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </section>

            {/* =================================================
                SUBSCRIPTIONS
            ================================================= */}

            <section className="subscriptions-section">

                <div className="section-heading">

                    <div>

                        <h2>
                            Church Subscriptions
                        </h2>

                        <p>
                            Manage customer subscriptions
                            and billing status.
                        </p>

                    </div>

                </div>

                {/* =================================================
                    TOOLBAR
                ================================================= */}

                <div className="subscription-toolbar">

                    <input
                        type="text"
                        placeholder="Search church, contact, email, or plan..."
                        value={search}
                        onChange={event =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />

                    <select
                        value={filter}
                        onChange={event =>
                            setFilter(
                                event.target.value as FilterStatus
                            )
                        }
                    >

                        <option value="ALL">
                            All Statuses
                        </option>

                        <option value="TRIAL">
                            Trial
                        </option>

                        <option value="ACTIVE">
                            Active
                        </option>

                        <option value="PAST_DUE">
                            Past Due
                        </option>

                        <option value="SUSPENDED">
                            Suspended
                        </option>

                        <option value="EXPIRED">
                            Expired
                        </option>

                        <option value="CANCELLED">
                            Cancelled
                        </option>

                    </select>

                </div>

                {/* =================================================
                    TABLE
                ================================================= */}

                <div className="subscription-table-wrapper">

                    <table className="subscription-table">

                        <thead>

                            <tr>

                                <th>
                                    Church
                                </th>

                                <th>
                                    Plan
                                </th>

                                <th>
                                    Billing
                                </th>

                                <th>
                                    Amount
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Next Billing
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {filteredSubscriptions.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan={7}
                                        className="empty-table"
                                    >
                                        No subscriptions found.
                                    </td>

                                </tr>

                            ) : (

                                filteredSubscriptions.map(
                                    subscription => {

                                        const status =
                                            normalizeStatus(
                                                subscription.status
                                            );

                                        const isProcessing =
                                            processingId ===
                                            subscription.subscriptionId;

                                        const canCancel =
                                            ACTIVE_STATUSES.includes(
                                                status
                                            );

                                        const canRenew =
                                            RENEWABLE_STATUSES.includes(
                                                status
                                            );

                                        return (

                                            <tr
                                                key={
                                                    subscription.subscriptionId
                                                }
                                            >

                                                <td>

                                                    <div className="church-cell">

                                                        <strong>
                                                            {
                                                                subscription.churchName ||
                                                                "Unnamed Church"
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                subscription.contactEmail ||
                                                                "No email"
                                                            }
                                                        </span>

                                                    </div>

                                                </td>

                                                <td>
                                                    {
                                                        subscription
                                                            .subscriptionPlan
                                                            ?.planName ||
                                                        "—"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        subscription.billingCycle ||
                                                        "—"
                                                    }
                                                </td>

                                                <td>
                                                    {formatCurrency(
                                                        subscription.amount,
                                                        subscription.currency
                                                    )}
                                                </td>

                                                <td>

                                                    <span
                                                        className={
                                                            `subscription-status ${getStatusClass(
                                                                status
                                                            )}`
                                                        }
                                                    >
                                                        {
                                                            getStatusLabel(
                                                                status
                                                            )
                                                        }
                                                    </span>

                                                </td>

                                                <td>
                                                    {formatDate(
                                                        subscription.nextBillingDate
                                                    )}
                                                </td>

                                                <td>

                                                    <div className="action-buttons">

                                                        <button
                                                            type="button"
                                                            className="view-button"
                                                            onClick={() =>
                                                                viewSubscription(
                                                                    subscription
                                                                )
                                                            }
                                                            disabled={
                                                                isProcessing
                                                            }
                                                        >
                                                            View
                                                        </button>

                                                        {canCancel && (

                                                            <button
                                                                type="button"
                                                                className="cancel-button"
                                                                onClick={() =>
                                                                    cancelSubscription(
                                                                        subscription
                                                                    )
                                                                }
                                                                disabled={
                                                                    isProcessing
                                                                }
                                                            >
                                                                {isProcessing
                                                                    ? "..."
                                                                    : "Cancel"}
                                                            </button>

                                                        )}

                                                        {canRenew && (

                                                            <button
                                                                type="button"
                                                                className="renew-button"
                                                                onClick={() =>
                                                                    renewSubscription(
                                                                        subscription
                                                                    )
                                                                }
                                                                disabled={
                                                                    isProcessing
                                                                }
                                                            >
                                                                {isProcessing
                                                                    ? "..."
                                                                    : "Renew"}
                                                            </button>

                                                        )}

                                                    </div>

                                                </td>

                                            </tr>

                                        );

                                    }
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </section>

            {/* =================================================
                DETAILS MODAL
            ================================================= */}

            {showDetails &&
                selectedSubscription && (

                    <div
                        className="subscription-modal-overlay"
                        onClick={closeDetails}
                    >

                        <div
                            className="subscription-modal"
                            onClick={event =>
                                event.stopPropagation()
                            }
                        >

                            {/* =================================================
                                MODAL HEADER
                            ================================================= */}

                            <div className="modal-header">

                                <div>

                                    <span>
                                        Subscription #
                                        {
                                            selectedSubscription.subscriptionId
                                        }
                                    </span>

                                    <h2>
                                        {
                                            selectedSubscription.churchName
                                        }
                                    </h2>

                                </div>

                                <button
                                    type="button"
                                    onClick={closeDetails}
                                    className="modal-close"
                                    aria-label="Close"
                                >
                                    ×
                                </button>

                            </div>

                            {/* =================================================
                                MODAL BODY
                            ================================================= */}

                            <div className="modal-body">

                                <div className="detail-grid">

                                    <div>

                                        <label>
                                            Contact
                                        </label>

                                        <strong>
                                            {
                                                selectedSubscription.contactName ||
                                                "—"
                                            }
                                        </strong>

                                    </div>

                                    <div>

                                        <label>
                                            Email
                                        </label>

                                        <strong>
                                            {
                                                selectedSubscription.contactEmail ||
                                                "—"
                                            }
                                        </strong>

                                    </div>

                                    <div>

                                        <label>
                                            Phone
                                        </label>

                                        <strong>
                                            {
                                                selectedSubscription.contactPhone ||
                                                "—"
                                            }
                                        </strong>

                                    </div>

                                    <div>

                                        <label>
                                            Plan
                                        </label>

                                        <strong>
                                            {
                                                selectedSubscription
                                                    .subscriptionPlan
                                                    ?.planName ||
                                                "—"
                                            }
                                        </strong>

                                    </div>

                                    <div>

                                        <label>
                                            Status
                                        </label>

                                        <strong>
                                            {
                                                getStatusLabel(
                                                    selectedSubscription.status
                                                )
                                            }
                                        </strong>

                                    </div>

                                    <div>

                                        <label>
                                            Billing Cycle
                                        </label>

                                        <strong>
                                            {
                                                selectedSubscription.billingCycle ||
                                                "—"
                                            }
                                        </strong>

                                    </div>

                                    <div>

                                        <label>
                                            Amount
                                        </label>

                                        <strong>
                                            {formatCurrency(
                                                selectedSubscription.amount,
                                                selectedSubscription.currency
                                            )}
                                        </strong>

                                    </div>

                                    <div>

                                        <label>
                                            Start Date
                                        </label>

                                        <strong>
                                            {formatDate(
                                                selectedSubscription.startDate
                                            )}
                                        </strong>

                                    </div>

                                    <div>

                                        <label>
                                            Trial Ends
                                        </label>

                                        <strong>
                                            {formatDate(
                                                selectedSubscription.trialEndsAt
                                            )}
                                        </strong>

                                    </div>

                                    <div>

                                        <label>
                                            Next Billing
                                        </label>

                                        <strong>
                                            {formatDate(
                                                selectedSubscription.nextBillingDate
                                            )}
                                        </strong>

                                    </div>

                                    <div>

                                        <label>
                                            Cancelled
                                        </label>

                                        <strong>
                                            {formatDate(
                                                selectedSubscription.cancelledDate
                                            )}
                                        </strong>

                                    </div>

                                    <div>

                                        <label>
                                            End Date
                                        </label>

                                        <strong>
                                            {formatDate(
                                                selectedSubscription.endDate
                                            )}
                                        </strong>

                                    </div>

                                </div>

                                {/* =================================================
                                    NOTES
                                ================================================= */}

                                {selectedSubscription.notes && (

                                    <div className="subscription-notes">

                                        <label>
                                            Notes
                                        </label>

                                        <p>
                                            {
                                                selectedSubscription.notes
                                            }
                                        </p>

                                    </div>

                                )}

                                {/* =================================================
                                    PAYMENT HISTORY
                                ================================================= */}

                                <div className="payment-history">

                                    <div className="payment-history-header">

                                        <div>

                                            <h3>
                                                Payment History
                                            </h3>

                                            <span>
                                                {
                                                    selectedPayments.length
                                                } payment
                                                {
                                                    selectedPayments.length !==
                                                    1
                                                        ? "s"
                                                        : ""
                                                }
                                            </span>

                                        </div>

                                    </div>

                                    {detailsLoading ? (

                                        <div className="empty-payments">
                                            Loading payment history...
                                        </div>

                                    ) : selectedPayments.length === 0 ? (

                                        <div className="empty-payments">
                                            No payment records found.
                                        </div>

                                    ) : (

                                        <div className="payment-list">

                                            {selectedPayments.map(
                                                payment => (

                                                    <div
                                                        className="payment-row"
                                                        key={
                                                            payment.paymentId
                                                        }
                                                    >

                                                        <div>

                                                            <strong>
                                                                {formatCurrency(
                                                                    payment.amount,
                                                                    payment.currency
                                                                )}
                                                            </strong>

                                                            <span>
                                                                {
                                                                    payment.paymentMethod ||
                                                                    "Unknown method"
                                                                }
                                                            </span>

                                                            {payment.referenceNumber && (

                                                                <small>
                                                                    Ref:{" "}
                                                                    {
                                                                        payment.referenceNumber
                                                                    }
                                                                </small>

                                                            )}

                                                        </div>

                                                        <div>

                                                            <span
                                                                className={
                                                                    `payment-status ${getStatusClass(
                                                                        payment.status
                                                                    )}`
                                                                }
                                                            >
                                                                {
                                                                    getStatusLabel(
                                                                        payment.status
                                                                    )
                                                                }
                                                            </span>

                                                            <small>
                                                                {formatDate(
                                                                    payment.createdDate
                                                                )}
                                                            </small>

                                                        </div>

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    )}

                                </div>

                            </div>

                        </div>

                    </div>

                )}

        </div>
    );
};

export default SubscriptionManagement;