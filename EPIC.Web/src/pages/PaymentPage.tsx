
import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import "./PaymentPage.css";

interface PaymentPageProps {
    onNavigate: (page: string) => void;
}

type PaymentMethod = "gcash" | "gotyme";

const PaymentPage: React.FC<PaymentPageProps> = ({
    onNavigate,
}) => {
    const [paymentMethod, setPaymentMethod] =
        useState<PaymentMethod>("gcash");

    const [referenceNumber, setReferenceNumber] =
        useState("");

    const [proofFile, setProofFile] =
        useState<File | null>(null);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    const handleFileChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file =
            event.target.files?.[0] ?? null;

        setProofFile(file);
        setErrorMessage("");
    };

    const handleSubmit = (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setErrorMessage("");

        if (!referenceNumber.trim()) {
            setErrorMessage(
                "Please enter your payment reference number."
            );
            return;
        }

        if (!proofFile) {
            setErrorMessage(
                "Please upload your payment screenshot or proof of payment."
            );
            return;
        }

        setIsSubmitting(true);

        /*
         * TEMPORARY PAYMENT FLOW
         *
         * This currently simulates a successful submission.
         *
         * Later we will connect this to the EPIC API so the
         * payment record can be saved and verified by admin.
         */

        setTimeout(() => {
            setIsSubmitting(false);

            localStorage.setItem(
                "epicPaymentMethod",
                paymentMethod
            );

            localStorage.setItem(
                "epicPaymentReference",
                referenceNumber.trim()
            );

            localStorage.setItem(
                "epicPaymentSubmitted",
                "true"
            );

            onNavigate("thank-you");
        }, 800);
    };

    return (
        <div className="epic-payment-page">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <header className="epic-payment-header">

                <button
                    type="button"
                    className="epic-payment-logo"
                    onClick={() =>
                        onNavigate("landing")
                    }
                >
                    <span className="epic-payment-logo-mark">
                        EPIC
                    </span>

                    <span className="epic-payment-logo-text">
                        CHURCH MANAGEMENT
                    </span>
                </button>

                <div className="epic-payment-secure">
                    <span className="epic-secure-icon">
                        🔒
                    </span>

                    Secure Payment
                </div>
            </header>

            {/* =====================================================
                MAIN
            ===================================================== */}

            <main className="epic-payment-main">

                {/* BACK */}
                <button
                    type="button"
                    className="epic-payment-back"
                    onClick={() =>
                        onNavigate("checkout")
                    }
                >
                    ← Back to Checkout
                </button>

                <div className="epic-payment-layout">

                    {/* =================================================
                        LEFT — PAYMENT
                    ================================================= */}

                    <section className="epic-payment-card">

                        <div className="epic-payment-heading">

                            <div className="epic-payment-step">
                                STEP 3 OF 3
                            </div>

                            <h1>
                                Complete Your Payment
                            </h1>

                            <p>
                                Choose your preferred payment
                                method and complete your
                                EPIC Church Management System
                                subscription payment.
                            </p>

                        </div>

                        {/* PAYMENT METHODS */}

                        <div className="epic-payment-section">

                            <h2>
                                Choose Payment Method
                            </h2>

                            <div className="epic-payment-methods">

                                <button
                                    type="button"
                                    className={`epic-payment-method ${
                                        paymentMethod ===
                                        "gcash"
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() => {
                                        setPaymentMethod(
                                            "gcash"
                                        );
                                        setErrorMessage("");
                                    }}
                                >
                                    <span className="epic-method-icon">
                                        ₱
                                    </span>

                                    <span className="epic-method-content">
                                        <strong>
                                            GCash
                                        </strong>

                                        <small>
                                            Pay using GCash QR
                                        </small>
                                    </span>

                                    <span className="epic-method-check">
                                        {paymentMethod ===
                                        "gcash"
                                            ? "✓"
                                            : ""}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className={`epic-payment-method ${
                                        paymentMethod ===
                                        "gotyme"
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() => {
                                        setPaymentMethod(
                                            "gotyme"
                                        );
                                        setErrorMessage("");
                                    }}
                                >
                                    <span className="epic-method-icon gotyme">
                                        G
                                    </span>

                                    <span className="epic-method-content">
                                        <strong>
                                            GoTyme
                                        </strong>

                                        <small>
                                            Pay using GoTyme QR
                                        </small>
                                    </span>

                                    <span className="epic-method-check">
                                        {paymentMethod ===
                                        "gotyme"
                                            ? "✓"
                                            : ""}
                                    </span>
                                </button>

                            </div>
                        </div>

                        {/* QR CODE */}

                        <div className="epic-qr-section">

                            <div className="epic-qr-heading">

                                <div>
                                    <h2>
                                        Scan to Pay
                                    </h2>

                                    <p>
                                        Open{" "}
                                        {paymentMethod ===
                                        "gcash"
                                            ? "GCash"
                                            : "GoTyme"}{" "}
                                        and scan the QR code
                                        below.
                                    </p>
                                </div>

                                <span className="epic-selected-method">
                                    {paymentMethod ===
                                    "gcash"
                                        ? "GCash"
                                        : "GoTyme"}
                                </span>

                            </div>

                            <div className="epic-qr-container">

                                <div className="epic-qr-frame">

                                    {paymentMethod ===
                                    "gcash" ? (
                                        <img
                                            src="/payment/gcash-qr.png"
                                            alt="EPIC GCash QR Code"
                                            className="epic-qr-image"
                                            onError={(event) => {
                                                event.currentTarget.style.display =
                                                    "none";

                                                const parent =
                                                    event.currentTarget
                                                        .parentElement;

                                                if (
                                                    parent
                                                ) {
                                                    parent.classList.add(
                                                        "qr-missing"
                                                    );
                                                }
                                            }}
                                        />
                                    ) : (
                                        <img
                                            src="/payment/gotyme-qr.png"
                                            alt="EPIC GoTyme QR Code"
                                            className="epic-qr-image"
                                            onError={(event) => {
                                                event.currentTarget.style.display =
                                                    "none";

                                                const parent =
                                                    event.currentTarget
                                                        .parentElement;

                                                if (
                                                    parent
                                                ) {
                                                    parent.classList.add(
                                                        "qr-missing"
                                                    );
                                                }
                                            }}
                                        />
                                    )}

                                    <div className="epic-qr-placeholder">

                                        <span>
                                            QR CODE
                                        </span>

                                        <small>
                                            Place your{" "}
                                            {paymentMethod ===
                                            "gcash"
                                                ? "GCash"
                                                : "GoTyme"}{" "}
                                            QR image at:
                                        </small>

                                        <code>
                                            /public/payment/
                                            {paymentMethod ===
                                            "gcash"
                                                ? "gcash-qr.png"
                                                : "gotyme-qr.png"}
                                        </code>

                                    </div>

                                </div>

                            </div>

                            <div className="epic-qr-instruction">
                                <span>
                                    1
                                </span>

                                <p>
                                    Open your{" "}
                                    {paymentMethod ===
                                    "gcash"
                                        ? "GCash"
                                        : "GoTyme"}{" "}
                                    app.
                                </p>
                            </div>

                            <div className="epic-qr-instruction">
                                <span>
                                    2
                                </span>

                                <p>
                                    Scan the QR code and
                                    complete the payment.
                                </p>
                            </div>

                            <div className="epic-qr-instruction">
                                <span>
                                    3
                                </span>

                                <p>
                                    Save your payment
                                    confirmation for your
                                    records.
                                </p>
                            </div>

                        </div>

                        {/* PAYMENT DETAILS */}

                        <form
                            className="epic-payment-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="epic-payment-section">

                                <h2>
                                    Payment Details
                                </h2>

                                <div className="epic-form-group">

                                    <label htmlFor="referenceNumber">
                                        Payment Reference Number
                                    </label>

                                    <input
                                        id="referenceNumber"
                                        type="text"
                                        value={
                                            referenceNumber
                                        }
                                        onChange={(event) =>
                                            setReferenceNumber(
                                                event.target
                                                    .value
                                            )
                                        }
                                        placeholder="Enter your transaction/reference number"
                                        autoComplete="off"
                                    />

                                    <small>
                                        Enter the reference number
                                        shown after your payment.
                                    </small>

                                </div>

                                <div className="epic-form-group">

                                    <label htmlFor="paymentProof">
                                        Proof of Payment
                                    </label>

                                    <label
                                        htmlFor="paymentProof"
                                        className="epic-upload-box"
                                    >
                                        <span className="epic-upload-icon">
                                            ↑
                                        </span>

                                        <strong>
                                            {proofFile
                                                ? proofFile.name
                                                : "Upload payment screenshot"}
                                        </strong>

                                        <small>
                                            PNG, JPG or JPEG
                                        </small>
                                    </label>

                                    <input
                                        id="paymentProof"
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg"
                                        onChange={
                                            handleFileChange
                                        }
                                        hidden
                                    />

                                </div>

                                {errorMessage && (
                                    <div className="epic-payment-error">
                                        <span>
                                            !
                                        </span>

                                        {errorMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="epic-submit-payment"
                                    disabled={
                                        isSubmitting
                                    }
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="epic-spinner" />
                                            Submitting Payment...
                                        </>
                                    ) : (
                                        <>
                                            ✓ Submit Payment
                                        </>
                                    )}
                                </button>

                                <p className="epic-payment-disclaimer">
                                    Your payment will be reviewed
                                    by the EPIC administration team
                                    before your subscription is
                                    activated.
                                </p>

                            </div>

                        </form>

                    </section>

                    {/* =================================================
                        RIGHT — ORDER SUMMARY
                    ================================================= */}

                    <aside className="epic-order-summary">

                        <div className="epic-summary-header">

                            <span>
                                YOUR ORDER
                            </span>

                            <span className="epic-summary-secure">
                                🔒
                            </span>

                        </div>

                        <div className="epic-summary-product">

                            <div className="epic-summary-product-icon">
                                E
                            </div>

                            <div>
                                <strong>
                                    EPIC Church Management
                                    System
                                </strong>

                                <span>
                                    Church subscription
                                </span>
                            </div>

                        </div>

                        <div className="epic-summary-divider" />

                        <div className="epic-summary-row">

                            <span>
                                Subscription
                            </span>

                            <strong>
                                EPIC CMS
                            </strong>

                        </div>

                        <div className="epic-summary-row">

                            <span>
                                Billing
                            </span>

                            <strong>
                                Monthly
                            </strong>

                        </div>

                        <div className="epic-summary-row">

                            <span>
                                Payment Method
                            </span>

                            <strong>
                                {paymentMethod ===
                                "gcash"
                                    ? "GCash"
                                    : "GoTyme"}
                            </strong>

                        </div>

                        <div className="epic-summary-divider" />

                        <div className="epic-summary-total">

                            <span>
                                Total
                            </span>

                            <strong>
                                ₱
                                <span className="epic-price-placeholder">
                                    Amount
                                </span>
                            </strong>

                        </div>

                        <div className="epic-summary-note">

                            <span>
                                ✓
                            </span>

                            <p>
                                Your subscription will be
                                activated after payment
                                verification.
                            </p>

                        </div>

                        <div className="epic-trust-list">

                            <div>
                                <span>
                                    🔒
                                </span>

                                Secure payment
                            </div>

                            <div>
                                <span>
                                    ✓
                                </span>

                                Manual payment verification
                            </div>

                            <div>
                                <span>
                                    ⚡
                                </span>

                                Fast account activation
                            </div>

                        </div>

                    </aside>

                </div>
            </main>

            {/* =====================================================
                FOOTER
            ===================================================== */}

            <footer className="epic-payment-footer">

                <span>
                    © {new Date().getFullYear()} EPIC Church
                    Management System
                </span>

                <span>
                    Engaging People Into Christ
                </span>

            </footer>

        </div>
    );
};

export default PaymentPage;

