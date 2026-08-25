import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import type {
    FormEvent,
} from "react";

import axios from "axios";

import type {
    AxiosError,
    AxiosRequestConfig,
} from "axios";

import { API_BASE_URL } from "../config";

import "./ClientPayment.css";

// =========================================================
// TYPES
// =========================================================

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

    notes?: string | null;
}

interface Payment {
    paymentId: number;
    subscriptionId: number;

    churchName?: string | null;
    planName?: string | null;

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

    billingPeriodStart?: string | null;
    billingPeriodEnd?: string | null;

    paidDate?: string | null;
    failedDate?: string | null;

    failureReason?: string | null;
    notes?: string | null;

    createdDate: string;
    updatedDate?: string | null;
}

interface PaymentInformationResponse {
    success: boolean;
    subscription: Subscription;
}

interface PaymentResponse {
    success: boolean;
    message: string;

    paymentId: number;
    subscriptionId: number;

    churchName?: string | null;
    planName?: string | null;

    amount: number;
    currency: string;

    paymentMethod: string;
    status: string;

    referenceNumber?: string | null;

    billingPeriodStart?: string | null;
    billingPeriodEnd?: string | null;

    invoiceNumber?: string | null;
    receiptNumber?: string | null;

    createdDate: string;
}

interface PaymentHistoryResponse {
    success: boolean;
    payments: Payment[];
}

interface ApiErrorResponse {
    message?: string;
    title?: string;
    detail?: string;
    errors?: Record<string, string[]>;
}

interface EpicUser {
    userId?: number;
    username?: string;
    fullName?: string;
    role?: string;
    token?: string;
}

type PaymentMethod =
    | "GCash"
    | "Maya"
    | "BankTransfer"
    | "Manual";

type PaymentStep =
    | "FORM"
    | "SUCCESS";

// =========================================================
// PROPS
// =========================================================

interface ClientPaymentProps {
    subscriptionId?: number;
}

// =========================================================
// CONSTANTS
// =========================================================

const CLIENT_PAYMENTS_ENDPOINT =
    `${API_BASE_URL}/ClientPayments`;

const PAYMENT_METHODS: Array<{
    value: PaymentMethod;
    label: string;
    description: string;
    icon: string;
}> = [
    {
        value: "GCash",
        label: "GCash",
        description: "Mobile wallet",
        icon: "G",
    },
    {
        value: "Maya",
        label: "Maya",
        description: "Mobile wallet",
        icon: "M",
    },
    {
        value: "BankTransfer",
        label: "Bank Transfer",
        description: "Bank deposit",
        icon: "₱",
    },
    {
        value: "Manual",
        label: "Manual",
        description: "Other payment",
        icon: "✓",
    },
];

// =========================================================
// HELPERS
// =========================================================

const normalizeStatus = (
    status?: string | null
): string => {
    return (
        status
            ?.trim()
            .toUpperCase()
            .replace(/\s+/g, "_") ||
        "UNKNOWN"
    );
};

const getToday = (): string => {
    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

// =========================================================
// AUTH TOKEN
// =========================================================

const getAuthToken = (): string | null => {

    const epicUserRaw =
        localStorage.getItem("epicUser");

    if (epicUserRaw) {

        try {

            const epicUser =
                JSON.parse(
                    epicUserRaw
                ) as EpicUser;

            if (
                typeof epicUser?.token ===
                    "string" &&
                epicUser.token.trim()
            ) {
                return epicUser.token.trim();
            }

        } catch (error) {

            console.error(
                "ClientPayment: invalid epicUser:",
                error
            );
        }
    }

    const fallbackKeys = [
        "token",
        "accessToken",
        "jwt",
        "authToken",
        "epicToken",
    ];

    for (const key of fallbackKeys) {

        const token =
            localStorage.getItem(key);

        if (
            token &&
            token.trim()
        ) {
            return token.trim();
        }
    }

    return null;
};

// =========================================================
// SUBSCRIPTION ID
// =========================================================

const getSubscriptionIdFromUrl =
    (): number | null => {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const value =
            params.get(
                "subscriptionId"
            );

        if (!value) {
            return null;
        }

        const parsed =
            Number(value);

        return (
            Number.isFinite(parsed) &&
            parsed > 0
        )
            ? parsed
            : null;
    };

const getStoredSubscriptionId =
    (): number | null => {

        const value =
            localStorage.getItem(
                "subscriptionId"
            );

        if (!value) {
            return null;
        }

        const parsed =
            Number(value);

        return (
            Number.isFinite(parsed) &&
            parsed > 0
        )
            ? parsed
            : null;
    };

// =========================================================
// COMPONENT
// =========================================================

const ClientPayment: React.FC<
    ClientPaymentProps
> = ({
    subscriptionId,
}) => {

    // =====================================================
    // STATE
    // =====================================================

    const [
        subscription,
        setSubscription,
    ] = useState<Subscription | null>(
        null
    );

    const [
        paymentHistory,
        setPaymentHistory,
    ] = useState<Payment[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        historyLoading,
        setHistoryLoading,
    ] = useState(false);

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        step,
        setStep,
    ] = useState<PaymentStep>(
        "FORM"
    );

    const [
        submittedPayment,
        setSubmittedPayment,
    ] = useState<PaymentResponse | null>(
        null
    );

    const [
        paymentMethod,
        setPaymentMethod,
    ] = useState<PaymentMethod>(
        "GCash"
    );

    const [
        referenceNumber,
        setReferenceNumber,
    ] = useState("");

    const [
        paymentDate,
        setPaymentDate,
    ] = useState(
        getToday()
    );

    const [
        notes,
        setNotes,
    ] = useState("");

    // =====================================================
    // RESOLVE SUBSCRIPTION ID
    // =====================================================

    const resolvedSubscriptionId =
        useMemo(() => {

            if (
                typeof subscriptionId ===
                    "number" &&
                subscriptionId > 0
            ) {
                return subscriptionId;
            }

            return (
                getSubscriptionIdFromUrl() ??
                getStoredSubscriptionId()
            );

        }, [
            subscriptionId,
        ]);

    // =====================================================
    // AUTH CONFIG
    // =====================================================

    const getAuthConfig =
        useCallback((): AxiosRequestConfig => {

            const token =
                getAuthToken();

            if (!token) {
                throw new Error(
                    "Authentication token not found. Please log in again."
                );
            }

            return {
                headers: {
                    Authorization:
                        `Bearer ${token}`,
                    "Content-Type":
                        "application/json",
                },
            };

        }, []);

    // =====================================================
    // ERROR HANDLER
    // =====================================================

    const getErrorMessage =
        useCallback(
            (
                value: unknown,
                fallback: string
            ): string => {

                if (
                    axios.isAxiosError(value)
                ) {

                    const axiosError =
                        value as AxiosError<
                            ApiErrorResponse
                        >;

                    const status =
                        axiosError.response?.status;

                    if (
                        status === 401
                    ) {
                        return (
                            "Your login session has expired or is not authorized. Please log in again."
                        );
                    }

                    if (
                        status === 403
                    ) {
                        return (
                            "You do not have permission to submit this payment."
                        );
                    }

                    if (
                        status === 404
                    ) {
                        return (
                            "The subscription or payment endpoint was not found."
                        );
                    }

                    if (
                        status === 409
                    ) {
                        return (
                            axiosError.response?.data?.message ||
                            "A payment with this reference already exists."
                        );
                    }

                    const data =
                        axiosError.response?.data;

                    if (
                        data?.message
                    ) {
                        return data.message;
                    }

                    if (
                        data?.detail
                    ) {
                        return data.detail;
                    }

                    if (
                        data?.title
                    ) {
                        return data.title;
                    }

                    if (
                        data?.errors
                    ) {

                        const messages =
                            Object.values(
                                data.errors
                            ).flat();

                        if (
                            messages.length
                        ) {
                            return messages.join(
                                " "
                            );
                        }
                    }

                    return (
                        axiosError.message ||
                        fallback
                    );
                }

                if (
                    value instanceof Error
                ) {
                    return value.message;
                }

                return fallback;
            },
            []
        );

    // =====================================================
    // FORMAT CURRENCY
    // =====================================================

    const formatCurrency =
        useCallback(
            (
                amount:
                    number |
                    null |
                    undefined,
                currency = "PHP"
            ): string => {

                const numericAmount =
                    Number(amount ?? 0);

                try {

                    return new Intl.NumberFormat(
                        "en-PH",
                        {
                            style: "currency",
                            currency,
                        }
                    ).format(
                        numericAmount
                    );

                } catch {

                    return `₱${numericAmount.toLocaleString(
                        "en-PH",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }
                    )}`;
                }
            },
            []
        );

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate =
        useCallback(
            (
                value?:
                    string |
                    null
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
                        day: "numeric",
                    }
                );

            },
            []
        );

    // =====================================================
    // FORMAT DATETIME
    // =====================================================

    const formatDateTime =
        useCallback(
            (
                value?:
                    string |
                    null
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
                        minute: "2-digit",
                    }
                );

            },
            []
        );

    // =====================================================
    // STATUS
    // =====================================================

    const getStatusClass =
        useCallback(
            (
                status?:
                    string |
                    null
            ): string => {

                return normalizeStatus(
                    status
                )
                    .toLowerCase()
                    .replace(
                        /_/g,
                        "-"
                    );
            },
            []
        );

    const getStatusLabel =
        useCallback(
            (
                status?:
                    string |
                    null
            ): string => {

                const normalized =
                    normalizeStatus(
                        status
                    );

                const labels:
                    Record<
                        string,
                        string
                    > = {
                        TRIAL:
                            "Trial",
                        ACTIVE:
                            "Active",
                        PAST_DUE:
                            "Past Due",
                        SUSPENDED:
                            "Suspended",
                        EXPIRED:
                            "Expired",
                        CANCELLED:
                            "Cancelled",
                        PENDING:
                            "Pending",
                        PAID:
                            "Paid",
                        FAILED:
                            "Failed",
                        REFUNDED:
                            "Refunded",
                    };

                return (
                    labels[normalized] ||
                    normalized
                );
            },
            []
        );

    // =====================================================
    // PAYMENT METHOD PLACEHOLDER
    // =====================================================

    const referencePlaceholder =
        useMemo(() => {

            switch (
                paymentMethod
            ) {

                case "GCash":
                    return (
                        "Enter GCash reference number"
                    );

                case "Maya":
                    return (
                        "Enter Maya reference number"
                    );

                case "BankTransfer":
                    return (
                        "Enter bank transaction reference"
                    );

                case "Manual":
                    return (
                        "Enter payment reference number"
                    );

                default:
                    return (
                        "Enter payment reference number"
                    );
            }

        }, [
            paymentMethod,
        ]);

    // =====================================================
    // PAYMENT INSTRUCTIONS
    // =====================================================

    const paymentInstructions =
        useMemo(() => {

            switch (
                paymentMethod
            ) {

                case "GCash":
                    return [
                        "Send the exact amount to the official EPIC CMS GCash account.",
                        "Complete the transaction.",
                        "Copy the GCash reference number.",
                        "Enter the reference number and submit.",
                    ];

                case "Maya":
                    return [
                        "Send the exact amount to the official EPIC CMS Maya account.",
                        "Complete the transaction.",
                        "Copy the Maya reference number.",
                        "Enter the reference number and submit.",
                    ];

                case "BankTransfer":
                    return [
                        "Transfer the exact amount to the official EPIC CMS bank account.",
                        "Keep your bank transaction receipt.",
                        "Copy the transaction reference number.",
                        "Enter the transaction reference number and submit.",
                    ];

                case "Manual":
                default:
                    return [
                        "Complete your payment using the agreed payment method.",
                        "Keep your payment receipt.",
                        "Enter the payment reference number.",
                        "Submit the payment for verification.",
                    ];
            }

        }, [
            paymentMethod,
        ]);

    // =====================================================
    // CHECK PENDING PAYMENT
    // =====================================================

    const pendingPayment =
        useMemo(() => {

            return paymentHistory.find(
                payment =>
                    normalizeStatus(
                        payment.status
                    ) === "PENDING"
            ) ?? null;

        }, [
            paymentHistory,
        ]);

    // =====================================================
    // LOAD SUBSCRIPTION
    // =====================================================

    const loadSubscription =
        useCallback(
            async (): Promise<void> => {

                if (
                    !resolvedSubscriptionId
                ) {

                    setSubscription(null);

                    setError(
                        "No subscription was selected."
                    );

                    setLoading(false);

                    return;
                }

                try {

                    setLoading(true);
                    setError("");

                    const config =
                        getAuthConfig();

                    const response =
                        await axios.get<
                            PaymentInformationResponse
                        >(
                            `${CLIENT_PAYMENTS_ENDPOINT}/subscription/${resolvedSubscriptionId}`,
                            config
                        );

                    const data =
                        response.data;

                    if (
                        !data?.success ||
                        !data.subscription
                    ) {

                        throw new Error(
                            "Subscription information was not found."
                        );
                    }

                    setSubscription(
                        data.subscription
                    );

                } catch (
                    requestError
                ) {

                    console.error(
                        "ClientPayment: subscription load failed:",
                        requestError
                    );

                    setSubscription(null);

                    setError(
                        getErrorMessage(
                            requestError,
                            "Unable to load subscription information."
                        )
                    );

                } finally {

                    setLoading(false);
                }

            },
            [
                resolvedSubscriptionId,
                getAuthConfig,
                getErrorMessage,
            ]
        );

    // =====================================================
    // LOAD PAYMENT HISTORY
    // =====================================================

    const loadPaymentHistory =
        useCallback(
            async (): Promise<void> => {

                if (
                    !resolvedSubscriptionId
                ) {
                    setPaymentHistory([]);
                    return;
                }

                try {

                    setHistoryLoading(
                        true
                    );

                    const config =
                        getAuthConfig();

                    const response =
                        await axios.get<
                            PaymentHistoryResponse
                        >(
                            `${CLIENT_PAYMENTS_ENDPOINT}/subscription/${resolvedSubscriptionId}/history`,
                            config
                        );

                    const payments =
                        response.data?.payments;

                    setPaymentHistory(
                        Array.isArray(
                            payments
                        )
                            ? payments
                            : []
                    );

                } catch (
                    requestError
                ) {

                    console.error(
                        "ClientPayment: payment history failed:",
                        requestError
                    );

                    setPaymentHistory([]);

                } finally {

                    setHistoryLoading(
                        false
                    );
                }

            },
            [
                resolvedSubscriptionId,
                getAuthConfig,
            ]
        );

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        void loadSubscription();

    }, [
        loadSubscription,
    ]);

    // =====================================================
    // LOAD HISTORY AFTER SUBSCRIPTION
    // =====================================================

    useEffect(() => {

        if (subscription) {
            void loadPaymentHistory();
        }

    }, [
        subscription,
        loadPaymentHistory,
    ]);

    // =====================================================
    // SUBMIT PAYMENT
    // =====================================================

    const handleSubmit =
        useCallback(
            async (
                event:
                    FormEvent<HTMLFormElement>
            ): Promise<void> => {

                event.preventDefault();

                if (!subscription) {

                    setError(
                        "Subscription information is unavailable."
                    );

                    return;
                }

                const reference =
                    referenceNumber.trim();

                if (!reference) {

                    setError(
                        "Please enter your payment reference number."
                    );

                    return;
                }

                /*
                 * Prevent accidental duplicate
                 * submissions when there is already
                 * a pending payment.
                 */
                if (pendingPayment) {

                    setError(
                        `You already have a pending payment (${pendingPayment.referenceNumber || `#${pendingPayment.paymentId}`}). Please wait for administrator verification.`
                    );

                    return;
                }

                const amount =
                    Number(
                        subscription.amount
                    ) || 0;

                const currency =
                    subscription.currency ||
                    "PHP";

                const confirmed =
                    window.confirm(
                        `Submit your ${paymentMethod} payment of ${formatCurrency(
                            amount,
                            currency
                        )}?`
                    );

                if (!confirmed) {
                    return;
                }

                try {

                    setSubmitting(true);
                    setError("");

                    const paymentNotes = [
                        notes.trim(),
                        `Payment date: ${paymentDate}`,
                    ]
                        .filter(Boolean)
                        .join("\n");

                    const payload = {
                        paymentMethod,
                        referenceNumber:
                            reference,
                        notes:
                            paymentNotes ||
                            null,
                    };

                    const response =
                        await axios.post<
                            PaymentResponse
                        >(
                            `${CLIENT_PAYMENTS_ENDPOINT}/subscription/${subscription.subscriptionId}`,
                            payload,
                            getAuthConfig()
                        );

                    const data =
                        response.data;

                    if (
                        !data?.success
                    ) {

                        throw new Error(
                            data?.message ||
                            "Payment submission failed."
                        );
                    }

                    setSubmittedPayment(
                        data
                    );

                    setStep(
                        "SUCCESS"
                    );

                    await loadPaymentHistory();

                } catch (
                    requestError
                ) {

                    console.error(
                        "ClientPayment: payment submission failed:",
                        requestError
                    );

                    setError(
                        getErrorMessage(
                            requestError,
                            "Unable to submit payment."
                        )
                    );

                } finally {

                    setSubmitting(
                        false
                    );
                }

            },
            [
                subscription,
                referenceNumber,
                pendingPayment,
                paymentMethod,
                notes,
                paymentDate,
                formatCurrency,
                getAuthConfig,
                getErrorMessage,
                loadPaymentHistory,
            ]
        );

    // =====================================================
    // SUBMIT ANOTHER PAYMENT
    // =====================================================

    const handleSubmitAnother =
        useCallback(() => {

            setStep("FORM");

            setSubmittedPayment(
                null
            );

            setReferenceNumber(
                ""
            );

            setNotes(
                ""
            );

            setPaymentDate(
                getToday()
            );

            setError("");

        }, []);

    // =====================================================
    // REFRESH
    // =====================================================

    const handleRefresh =
        useCallback(
            async (): Promise<void> => {

                setError("");

                await Promise.all([
                    loadSubscription(),
                    loadPaymentHistory(),
                ]);

            },
            [
                loadSubscription,
                loadPaymentHistory,
            ]
        );

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div className="client-payment-page">

                <div className="client-payment-loading">

                    <div className="payment-spinner" />

                    <h2>
                        Loading payment information...
                    </h2>

                    <p>
                        Please wait while we retrieve
                        your subscription.
                    </p>

                </div>

            </div>
        );
    }

    // =====================================================
    // NO SUBSCRIPTION
    // =====================================================

    if (!subscription) {

        return (
            <div className="client-payment-page">

                <div className="client-payment-error-card">

                    <div className="error-icon">
                        !
                    </div>

                    <h2>
                        Payment Information Unavailable
                    </h2>

                    <p>
                        {
                            error ||
                            "No subscription was selected."
                        }
                    </p>

                    <small>
                        Please return to your subscription
                        page and select the subscription
                        you want to pay.
                    </small>

                </div>

            </div>
        );
    }

    // =====================================================
    // SUCCESS
    // =====================================================

    if (
        step === "SUCCESS" &&
        submittedPayment
    ) {

        return (
            <div className="client-payment-page">

                <div className="client-payment-container">

                    <div className="payment-success-card">

                        <div className="success-icon">
                            ✓
                        </div>

                        <div className="success-eyebrow">
                            EPIC CMS
                        </div>

                        <h1>
                            Payment Submitted
                        </h1>

                        <p className="success-message">
                            Your payment has been submitted
                            successfully and is now waiting
                            for administrator verification.
                        </p>

                        <div className="success-status">

                            <span>
                                Status
                            </span>

                            <strong>
                                {
                                    getStatusLabel(
                                        submittedPayment.status ||
                                        "PENDING"
                                    )
                                }
                            </strong>

                        </div>

                        <div className="success-details">

                            <div>
                                <span>
                                    Payment ID
                                </span>

                                <strong>
                                    #
                                    {
                                        submittedPayment.paymentId
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Church
                                </span>

                                <strong>
                                    {
                                        submittedPayment.churchName ||
                                        subscription.churchName
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Plan
                                </span>

                                <strong>
                                    {
                                        submittedPayment.planName ||
                                        subscription.planName ||
                                        "—"
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Amount
                                </span>

                                <strong>
                                    {
                                        formatCurrency(
                                            submittedPayment.amount,
                                            submittedPayment.currency
                                        )
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Payment Method
                                </span>

                                <strong>
                                    {
                                        submittedPayment.paymentMethod
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Reference
                                </span>

                                <strong>
                                    {
                                        submittedPayment.referenceNumber ||
                                        "—"
                                    }
                                </strong>
                            </div>

                            {submittedPayment.invoiceNumber && (

                                <div>
                                    <span>
                                        Invoice
                                    </span>

                                    <strong>
                                        {
                                            submittedPayment.invoiceNumber
                                        }
                                    </strong>
                                </div>

                            )}

                            {submittedPayment.receiptNumber && (

                                <div>
                                    <span>
                                        Receipt
                                    </span>

                                    <strong>
                                        {
                                            submittedPayment.receiptNumber
                                        }
                                    </strong>
                                </div>

                            )}

                            <div>
                                <span>
                                    Submitted
                                </span>

                                <strong>
                                    {
                                        formatDateTime(
                                            submittedPayment.createdDate
                                        )
                                    }
                                </strong>
                            </div>

                        </div>

                        <div className="success-notice">

                            <strong>
                                What happens next?
                            </strong>

                            <p>
                                Your payment is now
                                <strong>
                                    {" "}PENDING
                                </strong>.
                                An EPIC CMS administrator
                                will review your payment
                                reference and receipt.
                            </p>

                            <p>
                                Once approved, your
                                subscription will be
                                activated or renewed.
                            </p>

                        </div>

                        <button
                            type="button"
                            className="payment-primary-button"
                            onClick={
                                handleSubmitAnother
                            }
                        >
                            Back to Payment Form
                        </button>

                    </div>

                </div>

            </div>
        );
    }

    // =====================================================
    // PAYMENT FORM
    // =====================================================

    return (
        <div className="client-payment-page">

            <div className="client-payment-container">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="client-payment-header">

                    <div>

                        <div className="payment-eyebrow">
                            EPIC CMS
                        </div>

                        <h1>
                            Complete Your Payment
                        </h1>

                        <p>
                            Submit your payment information
                            for verification.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="payment-refresh-button"
                        onClick={() =>
                            void handleRefresh()
                        }
                        disabled={
                            loading ||
                            historyLoading
                        }
                    >
                        {historyLoading
                            ? "Refreshing..."
                            : "↻ Refresh"}
                    </button>

                </div>

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div
                        className="client-payment-error"
                        role="alert"
                    >
                        {error}
                    </div>

                )}

                {/* =================================================
                    PENDING PAYMENT NOTICE
                ================================================= */}

                {pendingPayment && (

                    <div className="pending-payment-notice">

                        <div className="pending-payment-icon">
                            !
                        </div>

                        <div>

                            <strong>
                                Payment verification pending
                            </strong>

                            <p>
                                You already submitted a payment
                                for this subscription.
                                Reference:
                                {" "}
                                <strong>
                                    {
                                        pendingPayment.referenceNumber ||
                                        `#${pendingPayment.paymentId}`
                                    }
                                </strong>
                            </p>

                            <small>
                                Please wait for an EPIC CMS
                                administrator to verify your payment.
                            </small>

                        </div>

                    </div>

                )}

                <div className="payment-layout">

                    {/* =================================================
                        MAIN FORM
                    ================================================= */}

                    <div className="payment-main">

                        <form
                            className="payment-form-card"
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <div className="payment-card-heading">

                                <div>

                                    <h2>
                                        Payment Details
                                    </h2>

                                    <p>
                                        Choose how you paid
                                        and provide your
                                        payment reference.
                                    </p>

                                </div>

                            </div>

                            {/* =================================================
                                PAYMENT METHOD
                            ================================================= */}

                            <div className="form-section">

                                <label className="form-label">
                                    Payment Method
                                </label>

                                <div className="payment-method-grid">

                                    {PAYMENT_METHODS.map(
                                        method => (

                                            <button
                                                key={
                                                    method.value
                                                }
                                                type="button"
                                                className={
                                                    `payment-method-option ${
                                                        paymentMethod ===
                                                        method.value
                                                            ? "selected"
                                                            : ""
                                                    }`
                                                }
                                                onClick={() =>
                                                    setPaymentMethod(
                                                        method.value
                                                    )
                                                }
                                                aria-pressed={
                                                    paymentMethod ===
                                                    method.value
                                                }
                                                disabled={
                                                    submitting ||
                                                    Boolean(
                                                        pendingPayment
                                                    )
                                                }
                                            >

                                                <span className="method-icon">
                                                    {
                                                        method.icon
                                                    }
                                                </span>

                                                <strong>
                                                    {
                                                        method.label
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        method.description
                                                    }
                                                </small>

                                            </button>

                                        )
                                    )}

                                </div>

                            </div>

                            {/* =================================================
                                REFERENCE NUMBER
                            ================================================= */}

                            <div className="form-section">

                                <label
                                    htmlFor="referenceNumber"
                                    className="form-label"
                                >
                                    Payment Reference Number
                                </label>

                                <input
                                    id="referenceNumber"
                                    type="text"
                                    value={
                                        referenceNumber
                                    }
                                    onChange={
                                        event =>
                                            setReferenceNumber(
                                                event.target.value
                                            )
                                    }
                                    placeholder={
                                        referencePlaceholder
                                    }
                                    autoComplete="off"
                                    maxLength={100}
                                    required
                                    disabled={
                                        submitting ||
                                        Boolean(
                                            pendingPayment
                                        )
                                    }
                                />

                                <small className="form-help">
                                    Enter the reference number
                                    shown on your payment
                                    confirmation.
                                </small>

                            </div>

                            {/* =================================================
                                PAYMENT DATE
                            ================================================= */}

                            <div className="form-section">

                                <label
                                    htmlFor="paymentDate"
                                    className="form-label"
                                >
                                    Payment Date
                                </label>

                                <input
                                    id="paymentDate"
                                    type="date"
                                    value={
                                        paymentDate
                                    }
                                    onChange={
                                        event =>
                                            setPaymentDate(
                                                event.target.value
                                            )
                                    }
                                    max={
                                        getToday()
                                    }
                                    required
                                    disabled={
                                        submitting ||
                                        Boolean(
                                            pendingPayment
                                        )
                                    }
                                />

                            </div>

                            {/* =================================================
                                NOTES
                            ================================================= */}

                            <div className="form-section">

                                <label
                                    htmlFor="paymentNotes"
                                    className="form-label"
                                >
                                    Additional Notes

                                    <span>
                                        Optional
                                    </span>
                                </label>

                                <textarea
                                    id="paymentNotes"
                                    value={
                                        notes
                                    }
                                    onChange={
                                        event =>
                                            setNotes(
                                                event.target.value
                                            )
                                    }
                                    rows={4}
                                    maxLength={1000}
                                    placeholder="Add any additional information about your payment..."
                                    disabled={
                                        submitting ||
                                        Boolean(
                                            pendingPayment
                                        )
                                    }
                                />

                            </div>

                            {/* =================================================
                                SUBMIT
                            ================================================= */}

                            <button
                                type="submit"
                                className="payment-primary-button"
                                disabled={
                                    submitting ||
                                    !referenceNumber.trim() ||
                                    Boolean(
                                        pendingPayment
                                    )
                                }
                            >

                                {submitting
                                    ? "Submitting Payment..."
                                    : pendingPayment
                                        ? "Payment Verification Pending"
                                        : `Submit Payment — ${formatCurrency(
                                              subscription.amount,
                                              subscription.currency
                                          )}`}

                            </button>

                            <p className="payment-security-note">

                                Your payment will remain{" "}

                                <strong>
                                    PENDING
                                </strong>{" "}

                                until verified by an EPIC
                                CMS administrator.

                            </p>

                        </form>

                    </div>

                    {/* =================================================
                        SIDEBAR
                    ================================================= */}

                    <aside className="payment-sidebar">

                        {/* =================================================
                            SUBSCRIPTION SUMMARY
                        ================================================= */}

                        <div className="payment-summary-card">

                            <div className="summary-eyebrow">
                                SUBSCRIPTION
                            </div>

                            <h2>
                                {
                                    subscription.churchName ||
                                    "Your Church"
                                }
                            </h2>

                            <div className="summary-plan">

                                <span>
                                    Plan
                                </span>

                                <strong>
                                    {
                                        subscription.planName ||
                                        `Plan #${subscription.subscriptionPlanId}`
                                    }
                                </strong>

                            </div>

                            <div className="summary-row">

                                <span>
                                    Billing
                                </span>

                                <strong>
                                    {
                                        subscription.billingCycle ||
                                        "—"
                                    }
                                </strong>

                            </div>

                            <div className="summary-row">

                                <span>
                                    Status
                                </span>

                                <strong
                                    className={
                                        `summary-status ${getStatusClass(
                                            subscription.status
                                        )}`
                                    }
                                >
                                    {
                                        getStatusLabel(
                                            subscription.status
                                        )
                                    }
                                </strong>

                            </div>

                            {subscription.trialEndsAt && (

                                <div className="summary-row">

                                    <span>
                                        Trial Ends
                                    </span>

                                    <strong>
                                        {
                                            formatDate(
                                                subscription.trialEndsAt
                                            )
                                        }
                                    </strong>

                                </div>

                            )}

                            {subscription.nextBillingDate && (

                                <div className="summary-row">

                                    <span>
                                        Next Billing
                                    </span>

                                    <strong>
                                        {
                                            formatDate(
                                                subscription.nextBillingDate
                                            )
                                        }
                                    </strong>

                                </div>

                            )}

                            <div className="summary-total">

                                <span>
                                    Amount Due
                                </span>

                                <strong>
                                    {
                                        formatCurrency(
                                            subscription.amount,
                                            subscription.currency
                                        )
                                    }
                                </strong>

                            </div>

                        </div>

                        {/* =================================================
                            PAYMENT INSTRUCTIONS
                        ================================================= */}

                        <div className="payment-instructions-card">

                            <h3>
                                Payment Instructions
                            </h3>

                            <ol>

                                {paymentInstructions.map(
                                    (
                                        instruction,
                                        index
                                    ) => (

                                        <li
                                            key={
                                                index
                                            }
                                        >
                                            {
                                                instruction
                                            }
                                        </li>

                                    )
                                )}

                            </ol>

                            <div className="verification-notice">

                                <strong>
                                    Verification required
                                </strong>

                                <p>
                                    Payments are reviewed
                                    by the EPIC CMS
                                    administrator before
                                    your subscription is
                                    activated or renewed.
                                </p>

                            </div>

                        </div>

                        {/* =================================================
                            PAYMENT HISTORY
                        ================================================= */}

                        <div className="payment-history-card">

                            <div className="history-heading">

                                <div>

                                    <h3>
                                        Recent Payments
                                    </h3>

                                    <small>
                                        {
                                            paymentHistory.length
                                        } payment
                                        {
                                            paymentHistory.length !== 1
                                                ? "s"
                                                : ""
                                        }
                                    </small>

                                </div>

                                {historyLoading && (
                                    <span>
                                        Loading...
                                    </span>
                                )}

                            </div>

                            {paymentHistory.length ===
                            0 ? (

                                <p className="history-empty">
                                    No payment history yet.
                                </p>

                            ) : (

                                <div className="history-list">

                                    {paymentHistory
                                        .slice(0, 5)
                                        .map(
                                            payment => (

                                                <div
                                                    className="history-item"
                                                    key={
                                                        payment.paymentId
                                                    }
                                                >

                                                    <div>

                                                        <strong>
                                                            {
                                                                formatCurrency(
                                                                    payment.amount,
                                                                    payment.currency
                                                                )
                                                            }
                                                        </strong>

                                                        <small>
                                                            {
                                                                payment.paymentMethod
                                                            }
                                                        </small>

                                                        {payment.referenceNumber && (

                                                            <small>
                                                                Ref:{" "}
                                                                {
                                                                    payment.referenceNumber
                                                                }
                                                            </small>

                                                        )}

                                                        {payment.invoiceNumber && (

                                                            <small>
                                                                Invoice:{" "}
                                                                {
                                                                    payment.invoiceNumber
                                                                }
                                                            </small>

                                                        )}

                                                    </div>

                                                    <div>

                                                        <span
                                                            className={
                                                                `history-status history-${getStatusClass(
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
                                                            {
                                                                formatDate(
                                                                    payment.createdDate
                                                                )
                                                            }
                                                        </small>

                                                    </div>

                                                </div>

                                            )
                                        )}

                                </div>

                            )}

                        </div>

                    </aside>

                </div>

            </div>

        </div>
    );
};

export default ClientPayment;