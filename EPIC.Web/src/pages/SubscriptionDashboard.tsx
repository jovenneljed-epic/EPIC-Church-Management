import React, {
    useCallback,
    useEffect,
    useState
} from "react";

import axios, {
    AxiosError
} from "axios";

import { API_BASE_URL } from "../config";

import "./SubscriptionDashboard.css";

// =========================================================
// TYPES
// =========================================================

interface DashboardData {
    generatedAt: string;

    subscriptions: {
        total: number;
        active: number;
        trial: number;
        pastDue: number;
        expired: number;
        cancelled: number;
    };

    payments: {
        total: number;
        paid: number;
        pending: number;
        failed: number;
        refunded: number;
    };

    revenue: {
        total: number;
        currentMonth: number;
    };

    upcoming: {
        billingNext30Days: number;
        trialsExpiringNext7Days: number;
    };
}

interface RecentPayment {
    paymentId: number;
    subscriptionId: number;

    churchName: string | null;
    planName: string | null;

    amount: number;
    currency: string;

    status: string;
    paymentMethod: string;

    referenceNumber: string | null;

    createdDate: string;
}

interface ExpiringTrial {
    subscriptionId: number;

    churchName: string;

    contactName: string | null;
    contactEmail: string | null;

    planName: string | null;

    trialEndsAt: string;

    daysRemaining: number;
}

interface PastDueSubscription {
    subscriptionId: number;

    churchName: string;

    contactName: string | null;
    contactEmail: string | null;

    planName: string | null;

    amount: number;
    currency: string;

    nextBillingDate: string | null;

    status: string;
}

// =========================================================
// CONSTANTS
// =========================================================

const DASHBOARD_ENDPOINT =
    `${API_BASE_URL}/SubscriptionDashboard`;

// =========================================================
// COMPONENT
// =========================================================

const SubscriptionDashboard: React.FC = () => {

    // =====================================================
    // STATE
    // =====================================================

    const [
        dashboard,
        setDashboard
    ] = useState<DashboardData | null>(
        null
    );

    const [
        recentPayments,
        setRecentPayments
    ] = useState<RecentPayment[]>(
        []
    );

    const [
        expiringTrials,
        setExpiringTrials
    ] = useState<ExpiringTrial[]>(
        []
    );

    const [
        pastDue,
        setPastDue
    ] = useState<PastDueSubscription[]>(
        []
    );

    const [
        loading,
        setLoading
    ] = useState<boolean>(
        true
    );

    const [
        refreshing,
        setRefreshing
    ] = useState<boolean>(
        false
    );

    const [
        error,
        setError
    ] = useState<string>(
        ""
    );

    // =====================================================
    // AUTH CONFIG
    // =====================================================

    const getAuthConfig =
        useCallback(() => {

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

            const status =
                axiosError.response?.status;

            if (status === 401) {

                return (
                    "Your session has expired. " +
                    "Please login again."
                );

            }

            if (status === 403) {

                return (
                    "You do not have permission " +
                    "to view the subscription dashboard."
                );

            }

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
    // LOAD DASHBOARD
    // =====================================================

    const loadDashboard =
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

                    const [
                        dashboardResponse,
                        paymentsResponse,
                        trialsResponse,
                        pastDueResponse
                    ] = await Promise.all([

                        axios.get<DashboardData>(
                            DASHBOARD_ENDPOINT,
                            getAuthConfig()
                        ),

                        axios.get<RecentPayment[]>(
                            `${DASHBOARD_ENDPOINT}/recent-payments`,
                            getAuthConfig()
                        ),

                        axios.get<ExpiringTrial[]>(
                            `${DASHBOARD_ENDPOINT}/expiring-trials`,
                            getAuthConfig()
                        ),

                        axios.get<PastDueSubscription[]>(
                            `${DASHBOARD_ENDPOINT}/past-due`,
                            getAuthConfig()
                        )

                    ]);

                    setDashboard(
                        dashboardResponse.data
                    );

                    setRecentPayments(
                        Array.isArray(
                            paymentsResponse.data
                        )
                            ? paymentsResponse.data
                            : []
                    );

                    setExpiringTrials(
                        Array.isArray(
                            trialsResponse.data
                        )
                            ? trialsResponse.data
                            : []
                    );

                    setPastDue(
                        Array.isArray(
                            pastDueResponse.data
                        )
                            ? pastDueResponse.data
                            : []
                    );

                }
                catch (error) {

                    console.error(
                        "Subscription dashboard error:",
                        error
                    );

                    setError(
                        getErrorMessage(
                            error,
                            "Unable to load subscription dashboard."
                        )
                    );

                }
                finally {

                    setLoading(false);

                    setRefreshing(false);

                }

            },
            [
                getAuthConfig
            ]
        );

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadDashboard();

    }, [
        loadDashboard
    ]);

    // =====================================================
    // FORMAT MONEY
    // =====================================================

    const formatMoney = (
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
                    currency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            ).format(
                numericAmount
            );

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
    // STATUS CLASS
    // =====================================================

    const statusClass = (
        status?: string | null
    ): string => {

        const normalized =
            (status || "")
                .trim()
                .toUpperCase();

        switch (normalized) {

            case "PAID":
                return "status-paid";

            case "PENDING":
                return "status-pending";

            case "FAILED":
                return "status-failed";

            case "REFUNDED":
                return "status-refunded";

            case "PAST_DUE":
                return "status-past-due";

            default:
                return "status-default";

        }

    };

    // =====================================================
    // STATUS LABEL
    // =====================================================

    const getStatusLabel = (
        status?: string | null
    ): string => {

        const normalized =
            (status || "UNKNOWN")
                .trim()
                .toUpperCase();

        switch (normalized) {

            case "PAST_DUE":
                return "Past Due";

            case "PAID":
                return "Paid";

            case "PENDING":
                return "Pending";

            case "FAILED":
                return "Failed";

            case "REFUNDED":
                return "Refunded";

            default:
                return normalized;

        }

    };

    // =====================================================
    // REFRESH
    // =====================================================

    const handleRefresh = () => {

        loadDashboard(true);

    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="subscription-dashboard">

                <div className="dashboard-loading">

                    <div className="loading-spinner" />

                    <p>
                        Loading subscription dashboard...
                    </p>

                </div>

            </div>

        );

    }

    // =====================================================
    // ERROR
    // =====================================================

    if (error) {

        return (

            <div className="subscription-dashboard">

                <div className="dashboard-error">

                    <div className="error-icon">
                        !
                    </div>

                    <h2>
                        Unable to Load Dashboard
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            loadDashboard()
                        }
                        className="retry-button"
                    >
                        Try Again
                    </button>

                </div>

            </div>

        );

    }

    // =====================================================
    // SAFETY CHECK
    // =====================================================

    if (!dashboard) {

        return null;

    }

    // =====================================================
    // PAGE
    // =====================================================

    return (

        <div className="subscription-dashboard">

            {/* =============================================
                HEADER
            ============================================= */}

            <div className="subscription-header">

                <div>

                    <div className="eyebrow">
                        EPIC SAAS MANAGEMENT
                    </div>

                    <h1>
                        Subscription Dashboard
                    </h1>

                    <p>
                        Monitor churches, subscriptions,
                        payments, trials, and recurring revenue.
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

            {/* =============================================
                SUBSCRIPTION OVERVIEW
            ============================================= */}

            <section>

                <div className="section-title">
                    Subscription Overview
                </div>

                <div className="stats-grid">

                    <div className="stat-card">

                        <div className="stat-icon">
                            🏛️
                        </div>

                        <div>

                            <span>
                                Total Subscriptions
                            </span>

                            <strong>
                                {dashboard.subscriptions.total}
                            </strong>

                        </div>

                    </div>

                    <div className="stat-card active">

                        <div className="stat-icon">
                            ✓
                        </div>

                        <div>

                            <span>
                                Active
                            </span>

                            <strong>
                                {dashboard.subscriptions.active}
                            </strong>

                        </div>

                    </div>

                    <div className="stat-card trial">

                        <div className="stat-icon">
                            ⏳
                        </div>

                        <div>

                            <span>
                                Trial
                            </span>

                            <strong>
                                {dashboard.subscriptions.trial}
                            </strong>

                        </div>

                    </div>

                    <div className="stat-card overdue">

                        <div className="stat-icon">
                            !
                        </div>

                        <div>

                            <span>
                                Past Due
                            </span>

                            <strong>
                                {dashboard.subscriptions.pastDue}
                            </strong>

                        </div>

                    </div>

                    <div className="stat-card expired">

                        <div className="stat-icon">
                            ×
                        </div>

                        <div>

                            <span>
                                Expired
                            </span>

                            <strong>
                                {dashboard.subscriptions.expired}
                            </strong>

                        </div>

                    </div>

                    <div className="stat-card cancelled">

                        <div className="stat-icon">
                            —
                        </div>

                        <div>

                            <span>
                                Cancelled
                            </span>

                            <strong>
                                {dashboard.subscriptions.cancelled}
                            </strong>

                        </div>

                    </div>

                </div>

            </section>

            {/* =============================================
                REVENUE
            ============================================= */}

            <section>

                <div className="section-title">
                    Revenue
                </div>

                <div className="revenue-grid">

                    <div className="revenue-card primary">

                        <div className="revenue-label">
                            Total Revenue
                        </div>

                        <div className="revenue-value">

                            {formatMoney(
                                dashboard.revenue.total
                            )}

                        </div>

                        <div className="revenue-description">
                            All recorded paid transactions
                        </div>

                    </div>

                    <div className="revenue-card">

                        <div className="revenue-label">
                            Current Month
                        </div>

                        <div className="revenue-value">

                            {formatMoney(
                                dashboard.revenue.currentMonth
                            )}

                        </div>

                        <div className="revenue-description">
                            Paid payments this month
                        </div>

                    </div>

                    <div className="revenue-card">

                        <div className="revenue-label">
                            Billing Next 30 Days
                        </div>

                        <div className="revenue-value">

                            {
                                dashboard.upcoming
                                    .billingNext30Days
                            }

                        </div>

                        <div className="revenue-description">
                            Active subscriptions due soon
                        </div>

                    </div>

                    <div className="revenue-card">

                        <div className="revenue-label">
                            Trials Expiring
                        </div>

                        <div className="revenue-value">

                            {
                                dashboard.upcoming
                                    .trialsExpiringNext7Days
                            }

                        </div>

                        <div className="revenue-description">
                            Trials ending within 7 days
                        </div>

                    </div>

                </div>

            </section>

            {/* =============================================
                PAYMENT OVERVIEW
            ============================================= */}

            <section>

                <div className="section-title">
                    Payment Overview
                </div>

                <div className="payment-grid">

                    <div>

                        <span>
                            Total
                        </span>

                        <strong>
                            {dashboard.payments.total}
                        </strong>

                    </div>

                    <div className="payment-paid">

                        <span>
                            Paid
                        </span>

                        <strong>
                            {dashboard.payments.paid}
                        </strong>

                    </div>

                    <div className="payment-pending">

                        <span>
                            Pending
                        </span>

                        <strong>
                            {dashboard.payments.pending}
                        </strong>

                    </div>

                    <div className="payment-failed">

                        <span>
                            Failed
                        </span>

                        <strong>
                            {dashboard.payments.failed}
                        </strong>

                    </div>

                    <div className="payment-refunded">

                        <span>
                            Refunded
                        </span>

                        <strong>
                            {dashboard.payments.refunded}
                        </strong>

                    </div>

                </div>

            </section>

            {/* =============================================
                RECENT PAYMENTS + EXPIRING TRIALS
            ============================================= */}

            <div className="dashboard-columns">

                {/* RECENT PAYMENTS */}

                <section className="dashboard-panel">

                    <div className="panel-header">

                        <div>

                            <h2>
                                Recent Payments
                            </h2>

                            <p>
                                Latest payment activity
                            </p>

                        </div>

                    </div>

                    {recentPayments.length === 0 ? (

                        <div className="empty-state">
                            No payments recorded yet.
                        </div>

                    ) : (

                        <div className="payment-list">

                            {recentPayments.map(
                                payment => (

                                    <div
                                        className="payment-row"
                                        key={
                                            payment.paymentId
                                        }
                                    >

                                        <div className="payment-main">

                                            <strong>

                                                {
                                                    payment.churchName ||
                                                    "Unknown Church"
                                                }

                                            </strong>

                                            <span>

                                                {
                                                    payment.planName ||
                                                    "Subscription"
                                                }

                                            </span>

                                        </div>

                                        <div className="payment-amount">

                                            <strong>

                                                {formatMoney(
                                                    payment.amount,
                                                    payment.currency
                                                )}

                                            </strong>

                                            <span>

                                                {formatDate(
                                                    payment.createdDate
                                                )}

                                            </span>

                                        </div>

                                        <span
                                            className={
                                                `payment-status ${statusClass(
                                                    payment.status
                                                )}`
                                            }
                                        >

                                            {getStatusLabel(
                                                payment.status
                                            )}

                                        </span>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </section>

                {/* EXPIRING TRIALS */}

                <section className="dashboard-panel">

                    <div className="panel-header">

                        <div>

                            <h2>
                                Expiring Trials
                            </h2>

                            <p>
                                Trials ending within 7 days
                            </p>

                        </div>

                    </div>

                    {expiringTrials.length === 0 ? (

                        <div className="empty-state">
                            No trials are expiring soon.
                        </div>

                    ) : (

                        <div className="trial-list">

                            {expiringTrials.map(
                                trial => (

                                    <div
                                        className="trial-row"
                                        key={
                                            trial.subscriptionId
                                        }
                                    >

                                        <div>

                                            <strong>
                                                {trial.churchName}
                                            </strong>

                                            <span>

                                                {
                                                    trial.planName ||
                                                    "Subscription"
                                                }

                                            </span>

                                        </div>

                                        <div className="trial-days">

                                            <strong>
                                                {trial.daysRemaining}
                                            </strong>

                                            <span>
                                                days left
                                            </span>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </section>

            </div>

            {/* =============================================
                PAST DUE SUBSCRIPTIONS
            ============================================= */}

            <section className="dashboard-panel">

                <div className="panel-header">

                    <div>

                        <h2>
                            Past Due Subscriptions
                        </h2>

                        <p>
                            Churches requiring payment attention
                        </p>

                    </div>

                </div>

                {pastDue.length === 0 ? (

                    <div className="empty-state">
                        No past due subscriptions.
                    </div>

                ) : (

                    <div className="past-due-table">

                        <div className="table-header">

                            <span>
                                Church
                            </span>

                            <span>
                                Plan
                            </span>

                            <span>
                                Amount
                            </span>

                            <span>
                                Billing Date
                            </span>

                            <span>
                                Status
                            </span>

                        </div>

                        {pastDue.map(
                            subscription => (

                                <div
                                    className="table-row"
                                    key={
                                        subscription.subscriptionId
                                    }
                                >

                                    <strong>
                                        {subscription.churchName}
                                    </strong>

                                    <span>

                                        {
                                            subscription.planName ||
                                            "—"
                                        }

                                    </span>

                                    <span>

                                        {formatMoney(
                                            subscription.amount,
                                            subscription.currency
                                        )}

                                    </span>

                                    <span>

                                        {formatDate(
                                            subscription.nextBillingDate
                                        )}

                                    </span>

                                    <span className="status-past-due">
                                        Past Due
                                    </span>

                                </div>

                            )
                        )}

                    </div>

                )}

            </section>

            {/* =============================================
                FOOTER
            ============================================= */}

            <div className="dashboard-footer">

                Last updated:{" "}

                {formatDate(
                    dashboard.generatedAt
                )}

            </div>

        </div>

    );

};

export default SubscriptionDashboard;