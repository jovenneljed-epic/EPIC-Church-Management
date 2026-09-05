import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import axios from "axios";

import type {
    AxiosError,
    AxiosRequestConfig
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
    customerId: number;

    churchName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;

    subscriptionPlanId: number;
    planName?: string | null;

    billingCycle: string;

    amount: number;
    currency: string;

    status: string;

    startDate: string;
    trialEndsAt?: string | null;
    nextBillingDate?: string | null;

    endDate?: string | null;
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

    churchName?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;

    planName?: string | null;
    billingCycle?: string | null;

    amount: number;
    currency: string;

    paymentMethod: string;
    status: string;

    referenceNumber?: string | null;

    gatewayPaymentId?: string | null;
    gatewayCheckoutId?: string | null;
    gatewayCustomerId?: string | null;

    billingPeriodStart?: string | null;
    billingPeriodEnd?: string | null;

    invoiceNumber?: string | null;
    receiptNumber?: string | null;

    paidDate?: string | null;
    failedDate?: string | null;

    failureReason?: string | null;
    notes?: string | null;

    createdDate: string;
    updatedDate?: string | null;
}

interface ApiErrorResponse {
    message?: string;
    title?: string;
    detail?: string;
}

type FilterStatus =
    | "ALL"
    | "TRIAL"
    | "ACTIVE"
    | "PAST_DUE"
    | "SUSPENDED"
    | "EXPIRED"
    | "CANCELLED";

type SubscriptionStatus =
    | "PENDING_PAYMENT"
    | "TRIAL"
    | "ACTIVE"
    | "PAST_DUE"
    | "SUSPENDED"
    | "EXPIRED"
    | "CANCELLED"
    | "UNKNOWN";

type PaymentStatus =
    | "PENDING"
    | "PAID"
    | "FAILED"
    | "REFUNDED"
    | "UNKNOWN";

// =========================================================
// CONSTANTS
// =========================================================

const SUBSCRIPTIONS_ENDPOINT =
    `${API_BASE_URL}/Subscriptions`;

const PLANS_ENDPOINT =
    `${API_BASE_URL}/SubscriptionPlans`;

const PAYMENTS_ENDPOINT =
    `${API_BASE_URL}/Payments`;

const ACTIVE_STATUSES: readonly SubscriptionStatus[] = [
    "TRIAL",
    "ACTIVE",
    "PAST_DUE"
];

const RENEWABLE_STATUSES: readonly SubscriptionStatus[] = [
    "CANCELLED",
    "EXPIRED"
];

// =========================================================
// HELPERS
// =========================================================

const normalizeStatus = (
    status?: string | null
): string => {
    return (
        status?.trim().toUpperCase() ||
        "UNKNOWN"
    );
};

const getSubscriptionStatus = (
    status?: string | null
): SubscriptionStatus => {

    const normalized =
        normalizeStatus(status);

    const validStatuses: SubscriptionStatus[] = [
        "TRIAL",
        "ACTIVE",
        "PAST_DUE",
        "SUSPENDED",
        "EXPIRED",
        "CANCELLED",
        "UNKNOWN"
    ];

    return validStatuses.includes(
        normalized as SubscriptionStatus
    )
        ? normalized as SubscriptionStatus
        : "UNKNOWN";
};

const getPaymentStatus = (
    status?: string | null
): PaymentStatus => {

    const normalized =
        normalizeStatus(status);

    const validStatuses: PaymentStatus[] = [
        "PENDING",
        "PAID",
        "FAILED",
        "REFUNDED",
        "UNKNOWN"
    ];

    return validStatuses.includes(
        normalized as PaymentStatus
    )
        ? normalized as PaymentStatus
        : "UNKNOWN";
};

const getStatusLabel = (
    status?: string | null
): string => {

    const normalized =
        normalizeStatus(status);

    const labels: Record<string, string> = {
        PAST_DUE: "Past Due",
        CANCELLED: "Cancelled",
        SUSPENDED: "Suspended",
        EXPIRED: "Expired",
        TRIAL: "Trial",
        ACTIVE: "Active",
        PENDING: "Pending",
        PAID: "Paid",
        FAILED: "Failed",
        REFUNDED: "Refunded"
    };

    return labels[normalized] || normalized;
};

const getStatusClass = (
    status?: string | null
): string => {

    return `status-${normalizeStatus(status)
        .toLowerCase()
        .replace(/_/g, "-")}`;
};

// =========================================================
// COMPONENT
// =========================================================

const SubscriptionManagement: React.FC = () => {

    // =====================================================
    // STATE
    // =====================================================

    const [subscriptions, setSubscriptions] =
        useState<Subscription[]>([]);

    const [plans, setPlans] =
        useState<SubscriptionPlan[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [filter, setFilter] =
        useState<FilterStatus>("ALL");

    const [search, setSearch] =
        useState("");

    const [selectedSubscription, setSelectedSubscription] =
        useState<Subscription | null>(null);

    const [selectedPayments, setSelectedPayments] =
        useState<Payment[]>([]);

    const [showDetails, setShowDetails] =
        useState(false);

    const [detailsLoading, setDetailsLoading] =
        useState(false);

    const [detailsError, setDetailsError] =
        useState("");

    const [processingId, setProcessingId] =
        useState<number | null>(null);

    // =====================================================
    // AUTH
    // =====================================================

    const getAuthConfig =
        useCallback((): AxiosRequestConfig => {

            const token =
                localStorage.getItem("token") ||
                localStorage.getItem("accessToken") ||
                localStorage.getItem("jwt") ||
                localStorage.getItem("authToken") ||
                localStorage.getItem("epicToken");

            if (!token) {
                throw new Error(
                    "Authentication token not found. Please log in again."
                );
            }

            return {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

        }, []);

    // =====================================================
    // ERROR HANDLING
    // =====================================================

    const getErrorMessage =
        useCallback(
            (
                error: unknown,
                fallback: string
            ): string => {

                if (axios.isAxiosError(error)) {

                    const axiosError =
                        error as AxiosError<ApiErrorResponse>;

                    const status =
                        axiosError.response?.status;

                    switch (status) {

                        case 401:
                            return "Your session has expired. Please log in again.";

                        case 403:
                            return "You do not have permission to perform this action.";

                        case 404:
                            return "The requested resource was not found.";

                        case 500:
                            return "The server encountered an error. Please try again.";

                        default:
                            return (
                                axiosError.response?.data?.message ||
                                axiosError.response?.data?.detail ||
                                axiosError.response?.data?.title ||
                                axiosError.message ||
                                fallback
                            );
                    }
                }

                if (error instanceof Error) {
                    return error.message;
                }

                return fallback;

            },
            []
        );

    // =====================================================
    // FORMATTERS
    // =====================================================

    const formatCurrency =
        useCallback(
            (
                amount: number | null | undefined,
                currency = "PHP"
            ): string => {

                const value =
                    Number(amount ?? 0);

                try {

                    return new Intl.NumberFormat(
                        "en-PH",
                        {
                            style: "currency",
                            currency
                        }
                    ).format(value);

                } catch {

                    return `₱${value.toLocaleString(
                        "en-PH",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    )}`;

                }

            },
            []
        );

    const formatDate =
        useCallback(
            (
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

            },
            []
        );

    const formatDateTime =
        useCallback(
            (
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

                return date.toLocaleString(
                    "en-PH",
                    {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit"
                    }
                );

            },
            []
        );

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
    // LOAD DATA
    // =====================================================

    const loadData =
        useCallback(
            async (
                isRefresh = false
            ): Promise<void> => {

                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                try {

                    await Promise.all([
                        loadSubscriptions(),
                        loadPlans()
                    ]);

                } catch (error) {

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

                } finally {

                    setLoading(false);
                    setRefreshing(false);

                }

            },
            [
                loadSubscriptions,
                loadPlans,
                getErrorMessage
            ]
        );

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        void loadData();
    }, [loadData]);

    // =====================================================
    // STATISTICS
    // =====================================================

    const statistics =
        useMemo(() => {

            const countByStatus =
                (status: SubscriptionStatus): number =>
                    subscriptions.filter(
                        subscription =>
                            getSubscriptionStatus(
                                subscription.status
                            ) === status
                    ).length;

            return {
                total: subscriptions.length,
                active: countByStatus("ACTIVE"),
                trial: countByStatus("TRIAL"),
                pastDue: countByStatus("PAST_DUE"),
                suspended: countByStatus("SUSPENDED"),
                cancelled: countByStatus("CANCELLED")
            };

        }, [subscriptions]);

    // =====================================================
    // FILTERED SUBSCRIPTIONS
    // =====================================================

    const filteredSubscriptions =
        useMemo(() => {

            const searchValue =
                search.trim().toLowerCase();

            return subscriptions.filter(
                subscription => {

                    const status =
                        normalizeStatus(
                            subscription.status
                        );

                    if (
                        filter !== "ALL" &&
                        status !== filter
                    ) {
                        return false;
                    }

                    if (!searchValue) {
                        return true;
                    }

                    const searchableText = [
                        subscription.churchName,
                        subscription.contactName,
                        subscription.contactEmail,
                        subscription.contactPhone,
                        subscription.planName,
                        subscription.billingCycle,
                        subscription.status
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    return searchableText.includes(
                        searchValue
                    );
                }
            );

        }, [
            subscriptions,
            filter,
            search
        ]);

    // =====================================================
    // PAYMENT HISTORY
    // =====================================================

    const loadPaymentHistory =
        useCallback(
            async (
                subscriptionId: number
            ): Promise<void> => {

                setDetailsLoading(true);
                setDetailsError("");
                setSelectedPayments([]);

                try {

                    const response =
                        await axios.get<Payment[]>(
                            `${PAYMENTS_ENDPOINT}/subscription/${subscriptionId}`,
                            getAuthConfig()
                        );

                    const payments =
                        Array.isArray(response.data)
                            ? response.data
                            : [];

                    setSelectedPayments(
                        payments
                    );

                } catch (error) {

                    console.error(
                        "Payment history load error:",
                        error
                    );

                    setDetailsError(
                        getErrorMessage(
                            error,
                            "Unable to load payment history."
                        )
                    );

                } finally {

                    setDetailsLoading(false);

                }

            },
            [
                getAuthConfig,
                getErrorMessage
            ]
        );

    // =====================================================
    // VIEW SUBSCRIPTION
    // =====================================================

    const viewSubscription =
        useCallback(
            async (
                subscription: Subscription
            ): Promise<void> => {

                setSelectedSubscription(
                    subscription
                );

                setSelectedPayments([]);
                setDetailsError("");
                setShowDetails(true);

                await loadPaymentHistory(
                    subscription.subscriptionId
                );

            },
            [loadPaymentHistory]
        );

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeDetails =
        useCallback(() => {

            setShowDetails(false);
            setSelectedSubscription(null);
            setSelectedPayments([]);
            setDetailsError("");
            setDetailsLoading(false);

        }, []);

    // =====================================================
    // SUBSCRIPTION ACTION
    // =====================================================

    const processSubscriptionAction =
        useCallback(
            async (
                subscription: Subscription,
                action: "cancel" | "renew"
            ): Promise<void> => {

                const churchName =
                    subscription.churchName ||
                    "this church";

                const actionLabel =
                    action === "cancel"
                        ? "Cancel"
                        : "Renew";

                const confirmed =
                    window.confirm(
                        `${actionLabel} the subscription for ${churchName}?`
                    );

                if (!confirmed) {
                    return;
                }

                const subscriptionId =
                    subscription.subscriptionId;

                setProcessingId(
                    subscriptionId
                );

                setError("");

                try {

                    await axios.post(
                        `${SUBSCRIPTIONS_ENDPOINT}/${subscriptionId}/${action}`,
                        {},
                        getAuthConfig()
                    );

                    await loadData(true);

                    if (
                        selectedSubscription?.subscriptionId ===
                        subscriptionId
                    ) {
                        closeDetails();
                    }

                } catch (error) {

                    console.error(
                        `${actionLabel} subscription error:`,
                        error
                    );

                    const message =
                        getErrorMessage(
                            error,
                            `Unable to ${action} subscription.`
                        );

                    setError(message);

                    window.alert(
                        message
                    );

                } finally {

                    setProcessingId(null);

                }

            },
            [
                getAuthConfig,
                loadData,
                selectedSubscription,
                closeDetails,
                getErrorMessage
            ]
        );

    // =====================================================
    // CANCEL
    // =====================================================

    const cancelSubscription =
        useCallback(
            async (
                subscription: Subscription
            ) => {

                await processSubscriptionAction(
                    subscription,
                    "cancel"
                );

            },
            [processSubscriptionAction]
        );

    // =====================================================
    // RENEW
    // =====================================================

    const renewSubscription =
        useCallback(
            async (
                subscription: Subscription
            ) => {

                await processSubscriptionAction(
                    subscription,
                    "renew"
                );

            },
            [processSubscriptionAction]
        );

    // =====================================================
    // REFRESH
    // =====================================================

    const handleRefresh =
        useCallback(() => {

            void loadData(true);

        }, [loadData]);

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
    // RENDER PLAN
    // =====================================================

    const renderPlan =
        (plan: SubscriptionPlan) => (

            <div
                className="plan-card"
                key={plan.subscriptionPlanId}
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
        );

    // =====================================================
    // RENDER PAYMENT
    // =====================================================

    const renderPayment =
        (payment: Payment) => (

            <div
                className="payment-row"
                key={payment.paymentId}
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
                            {payment.referenceNumber}
                        </small>

                    )}

                    {payment.invoiceNumber && (

                        <small>
                            Invoice:{" "}
                            {payment.invoiceNumber}
                        </small>

                    )}

                    {payment.receiptNumber && (

                        <small>
                            Receipt:{" "}
                            {payment.receiptNumber}
                        </small>

                    )}

                </div>

                <div>

                    <span
                        className={
                            `payment-status ${getStatusClass(
                                getPaymentStatus(
                                    payment.status
                                )
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
                        Created:{" "}
                        {formatDateTime(
                            payment.createdDate
                        )}
                    </small>

                    {payment.paidDate && (

                        <small>
                            Paid:{" "}
                            {formatDateTime(
                                payment.paidDate
                            )}
                        </small>

                    )}

                    {payment.failedDate && (

                        <small>
                            Failed:{" "}
                            {formatDateTime(
                                payment.failedDate
                            )}
                        </small>

                    )}

                </div>

            </div>
        );

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
                        {plans.map(renderPlan)}
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
                                            getSubscriptionStatus(
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
                                                        subscription.planName ||
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
                                                                void viewSubscription(
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
                                                                    void cancelSubscription(
                                                                        subscription
                                                                    )
                                                                }
                                                                disabled={
                                                                    isProcessing
                                                                }
                                                            >
                                                                {
                                                                    isProcessing
                                                                        ? "..."
                                                                        : "Cancel"
                                                                }
                                                            </button>

                                                        )}

                                                        {canRenew && (

                                                            <button
                                                                type="button"
                                                                className="renew-button"
                                                                onClick={() =>
                                                                    void renewSubscription(
                                                                        subscription
                                                                    )
                                                                }
                                                                disabled={
                                                                    isProcessing
                                                                }
                                                            >
                                                                {
                                                                    isProcessing
                                                                        ? "..."
                                                                        : "Renew"
                                                                }
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
                                HEADER
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
                                            selectedSubscription.churchName ||
                                            "Unnamed Church"
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
                                BODY
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
                                                selectedSubscription.planName ||
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
                                                    selectedPayments.length !== 1
                                                        ? "s"
                                                        : ""
                                                }
                                            </span>

                                        </div>

                                    </div>

                                    {detailsError && (

                                        <div className="subscription-error">
                                            {detailsError}
                                        </div>

                                    )}

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

                                            {
                                                selectedPayments.map(
                                                    renderPayment
                                                )
                                            }

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