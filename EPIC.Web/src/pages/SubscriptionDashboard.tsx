
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./SubscriptionDashboard.css";

import { API_BASE_URL } from "../config";

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

const SubscriptionDashboard: React.FC = () => {

    const [dashboard, setDashboard] =
        useState<DashboardData | null>(null);

    const [recentPayments, setRecentPayments] =
        useState<RecentPayment[]>([]);

    const [expiringTrials, setExpiringTrials] =
        useState<ExpiringTrial[]>([]);

    const [pastDue, setPastDue] =
        useState<PastDueSubscription[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    // =========================================================
    // LOAD DASHBOARD
    // =========================================================

    const loadDashboard = async () => {

        try {

            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const headers = {
                Authorization: `Bearer ${token}`
            };

            const [
                dashboardResponse,
                paymentsResponse,
                trialsResponse,
                pastDueResponse
            ] = await Promise.all([

                axios.get(
                    `${API_BASE_URL}/SubscriptionDashboard`,
                    { headers }
                ),

                axios.get(
                    `${API_BASE_URL}/SubscriptionDashboard/recent-payments`,
                    { headers }
                ),

                axios.get(
                    `${API_BASE_URL}/SubscriptionDashboard/expiring-trials`,
                    { headers }
                ),

                axios.get(
                    `${API_BASE_URL}/SubscriptionDashboard/past-due`,
                    { headers }
                )
            ]);

            setDashboard(
                dashboardResponse.data
            );

            setRecentPayments(
                paymentsResponse.data
            );

            setExpiringTrials(
                trialsResponse.data
            );

            setPastDue(
                pastDueResponse.data
            );

        } catch (err: any) {

            console.error(
                "Subscription dashboard error:",
                err
            );

            if (err.response?.status === 401) {

                setError(
                    "Your session has expired. Please login again."
                );

            } else if (err.response?.status === 403) {

                setError(
                    "You do not have permission to view the subscription dashboard."
                );

            } else {

                setError(
                    err.response?.data?.message ||
                    "Unable to load subscription dashboard."
                );
            }

        } finally {

            setLoading(false);
        }
    };

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        loadDashboard();

    }, []);

    // =========================================================
    // FORMAT MONEY
    // =========================================================

    const formatMoney = (
        amount: number,
        currency = "PHP"
    ) => {

        return new Intl.NumberFormat(
            "en-PH",
            {
                style: "currency",
                currency,
                minimumFractionDigits: 2
            }
        ).format(amount);
    };

    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDate = (
        value: string | null
    ) => {

        if (!value) {
            return "—";
        }

        return new Date(value).toLocaleDateString(
            "en-PH",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
    };

    // =========================================================
    // STATUS CLASS
    // =========================================================

    const statusClass = (
        status: string
    ) => {

        switch (
            status.toUpperCase()
        ) {

            case "PAID":
                return "status-paid";

            case "PENDING":
                return "status-pending";

            case "FAILED":
                return "status-failed";

            case "REFUNDED":
                return "status-refunded";

            default:
                return "status-default";
        }
    };

    // =========================================================
    // LOADING
    // =========================================================

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

    // =========================================================
    // ERROR
    // =========================================================

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
                        onClick={loadDashboard}
                        className="retry-button"
                    >
                        Try Again
                    </button>

                </div>

            </div>
        );
    }

    if (!dashboard) {
        return null;
    }

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="subscription-dashboard">

            {/* =================================================
                HEADER
            ================================================= */}

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
                    className="refresh-button"
                    onClick={loadDashboard}
                >
                    ↻ Refresh
                </button>

            </div>

            {/* =================================================
                SUBSCRIPTION CARDS
            ================================================= */}

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

            {/* =================================================
                REVENUE
            ================================================= */}

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
                            {dashboard.upcoming.billingNext30Days}
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
                            {dashboard.upcoming.trialsExpiringNext7Days}
                        </div>

                        <div className="revenue-description">
                            Trials ending within 7 days
                        </div>

                    </div>

                </div>

            </section>

            {/* =================================================
                PAYMENT OVERVIEW
            ================================================= */}

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

            {/* =================================================
                TWO COLUMN AREA
            ================================================= */}

            <div className="dashboard-columns">

                {/* =================================================
                    RECENT PAYMENTS
                ================================================= */}

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
                                        key={payment.paymentId}
                                    >

                                        <div className="payment-main">

                                            <strong>
                                                {payment.churchName ||
                                                    "Unknown Church"}
                                            </strong>

                                            <span>
                                                {payment.planName ||
                                                    "Subscription"}
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
                                            className={`payment-status ${statusClass(
                                                payment.status
                                            )}`}
                                        >
                                            {payment.status}
                                        </span>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </section>

                {/* =================================================
                    EXPIRING TRIALS
                ================================================= */}

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
                                        key={trial.subscriptionId}
                                    >

                                        <div>

                                            <strong>
                                                {trial.churchName}
                                            </strong>

                                            <span>
                                                {trial.planName ||
                                                    "Subscription"}
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

            {/* =================================================
                PAST DUE
            ================================================= */}

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
                                        {subscription.planName ||
                                            "—"}
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
                                        PAST DUE
                                    </span>

                                </div>

                            )
                        )}

                    </div>

                )}

            </section>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="dashboard-footer">

                Last updated:
                {" "}
                {formatDate(
                    dashboard.generatedAt
                )}

            </div>

        </div>
    );
};

export default SubscriptionDashboard;

