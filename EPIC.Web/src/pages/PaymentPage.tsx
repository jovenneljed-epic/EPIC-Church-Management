import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import PublicHeader from "../components/PublicHeader";
import {
    Copy,
    Check,
    UploadCloud,
    FileText,
    ShieldCheck,
    Clock,
    ArrowLeft,
    CheckCircle2,
    Lock,
    Sparkles,
    AlertCircle,
    X,
} from "lucide-react";
import "./PaymentPage.css";
import { API_BASE_URL } from "../config";

interface PaymentPageProps {
    onNavigate: (page: string) => void;
}

type PaymentMethod = "gcash" | "maya" | "gotyme";

const PaymentPage: React.FC<PaymentPageProps> = ({ onNavigate }) => {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("gcash");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [copiedText, setCopiedText] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [notes, setNotes] = useState("");

    // Retrieve order details from localStorage
    const subscriptionId = Number(localStorage.getItem("epicSubscriptionId")) || 1;
    const churchName = localStorage.getItem("epicCheckoutChurchName") || "Your Church";
    const contactPerson = localStorage.getItem("epicCheckoutContactPerson") || "Pastor / Admin";
    const planName = localStorage.getItem("epicCheckoutPlanName") || "EPIC Solution";
    const billingCycle = localStorage.getItem("epicCheckoutBillingCycle") || "monthly";
    const itemType = localStorage.getItem("epicSelectedItemType") || "saas";
    const rawAmount = localStorage.getItem("epicCheckoutAmount");
    const amount = rawAmount ? Number(rawAmount) : 1999;

    const formatCurrency = (val: number) => {
        return "₱" + val.toLocaleString("en-PH");
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedText(label);
        setTimeout(() => setCopiedText(null), 2500);
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setProofFile(null);
            setPreviewUrl(null);
            setErrorMessage("Payment proof file must be 5 MB or smaller.");
            return;
        }

        const allowedTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
            setProofFile(null);
            setPreviewUrl(null);
            setErrorMessage("Please upload a valid receipt image (PNG, JPG, WEBP) or PDF.");
            return;
        }

        setProofFile(file);
        setErrorMessage("");

        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewUrl(null);
        }
    };

    const handleRemoveFile = () => {
        setProofFile(null);
        setPreviewUrl(null);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage("");

        if (!referenceNumber.trim()) {
            return setErrorMessage("Please enter the official payment reference number from your receipt.");
        }
        if (!proofFile) {
            return setErrorMessage("Please upload a clear screenshot or photo of your payment receipt.");
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("subscriptionId", String(subscriptionId));
            formData.append("referenceNumber", referenceNumber.trim());
            formData.append("paymentMethod", paymentMethod);
            formData.append("proof", proofFile);
            if (notes.trim()) {
                formData.append("notes", notes.trim());
            }

            const response = await fetch(`${API_BASE_URL}/PublicCheckout/payment`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || "Unable to submit your payment proof. Please verify your reference number.");
            }

            localStorage.setItem("epicPaymentId", String(data.paymentId || Date.now()));
            localStorage.setItem("epicPaymentMethod", paymentMethod);
            localStorage.setItem("epicPaymentReference", referenceNumber.trim());
            localStorage.setItem("epicPaymentSubmitted", "true");

            onNavigate("thank-you");
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Unable to submit payment proof.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="epic-payment-page">
            <PublicHeader onNavigate={onNavigate} />

            {/* STEPPER HEADER */}
            <div className="payment-stepper-wrap">
                <div className="payment-stepper-inner">
                    <button type="button" className="payment-back-link" onClick={() => onNavigate("checkout")}>
                        <ArrowLeft size={16} />
                        <span>Back to Account Setup</span>
                    </button>

                    <div className="payment-steps-indicator">
                        <div className="step-node is-completed">
                            <span className="step-circle"><Check size={12} /></span>
                            <span className="step-text">1. Choose Solution</span>
                        </div>
                        <div className="step-divider is-active" />
                        <div className="step-node is-completed">
                            <span className="step-circle"><Check size={12} /></span>
                            <span className="step-text">2. Account Setup</span>
                        </div>
                        <div className="step-divider is-active" />
                        <div className="step-node is-current">
                            <span className="step-circle">3</span>
                            <span className="step-text">3. Secure Payment</span>
                        </div>
                    </div>

                    <div className="payment-badge-secure">
                        <Lock size={14} />
                        <span>Direct Channel &bull; Zero Surcharge</span>
                    </div>
                </div>
            </div>

            {/* MAIN TWO-COLUMN PAYMENT */}
            <main className="payment-container">
                <div className="payment-columns-grid">

                    {/* LEFT COLUMN: PAYMENT METHOD & INSTRUCTIONS */}
                    <div className="payment-instructions-column">
                        <div className="payment-main-card">
                            <div className="payment-card-header">
                                <h2>Complete Your Payment</h2>
                                <p>
                                    Send your payment of <strong>{formatCurrency(amount)}</strong> via GCash, Maya, or Bank Transfer, then submit your transaction receipt below for instant activation.
                                </p>
                            </div>

                            {/* PAYMENT METHOD TABS */}
                            <div className="payment-method-tabs" role="tablist">
                                <button
                                    type="button"
                                    className={`method-tab-btn ${paymentMethod === "gcash" ? "is-active gcash" : ""}`}
                                    onClick={() => setPaymentMethod("gcash")}
                                >
                                    <span className="method-tab-badge">GCash</span>
                                    <span className="method-tab-sub">09956326245</span>
                                </button>

                                <button
                                    type="button"
                                    className={`method-tab-btn ${paymentMethod === "maya" ? "is-active maya" : ""}`}
                                    onClick={() => setPaymentMethod("maya")}
                                >
                                    <span className="method-tab-badge">Maya</span>
                                    <span className="method-tab-sub">09956326245</span>
                                </button>

                                <button
                                    type="button"
                                    className={`method-tab-btn ${paymentMethod === "gotyme" ? "is-active gotyme" : ""}`}
                                    onClick={() => setPaymentMethod("gotyme")}
                                >
                                    <span className="method-tab-badge">Bank / GoTyme</span>
                                    <span className="method-tab-sub">Transfer</span>
                                </button>
                            </div>

                            {/* PAYMENT CHANNEL ACCOUNT DETAILS BOX */}
                            <div className="payment-account-box">
                                {paymentMethod === "gcash" && (
                                    <div className="channel-detail-view">
                                        <div className="channel-brand-bar gcash">
                                            <span className="channel-tag-pill">OFFICIAL GCASH CHANNEL</span>
                                            <span className="instant-badge">Instant Verification</span>
                                        </div>

                                        <div className="channel-credentials-grid">
                                            <div className="credential-item">
                                                <small>GCash Mobile Number</small>
                                                <div className="credential-row">
                                                    <strong>09956326245</strong>
                                                    <button
                                                        type="button"
                                                        className="copy-chip"
                                                        onClick={() => handleCopy("09956326245", "gcash-num")}
                                                    >
                                                        {copiedText === "gcash-num" ? <Check size={14} /> : <Copy size={14} />}
                                                        <span>{copiedText === "gcash-num" ? "Copied!" : "Copy"}</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="credential-item">
                                                <small>Account Name</small>
                                                <div className="credential-row">
                                                    <strong>Ronald Aviguetero / EPIC Church</strong>
                                                    <button
                                                        type="button"
                                                        className="copy-chip"
                                                        onClick={() => handleCopy("Ronald Aviguetero", "gcash-name")}
                                                    >
                                                        {copiedText === "gcash-name" ? <Check size={14} /> : <Copy size={14} />}
                                                        <span>{copiedText === "gcash-name" ? "Copied!" : "Copy"}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="channel-steps-box">
                                            <strong>How to Pay with GCash:</strong>
                                            <ol>
                                                <li>Open your <strong>GCash App</strong> on your phone.</li>
                                                <li>Tap <strong>Send Money</strong> &rarr; <strong>Express Send</strong>.</li>
                                                <li>Enter mobile number <code>09956326245</code> and amount <strong>{formatCurrency(amount)}</strong>.</li>
                                                <li>Take a screenshot or save the completed transaction receipt.</li>
                                                <li>Upload the receipt and type the 13-digit Reference No. below.</li>
                                            </ol>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === "maya" && (
                                    <div className="channel-detail-view">
                                        <div className="channel-brand-bar maya">
                                            <span className="channel-tag-pill">OFFICIAL MAYA CHANNEL</span>
                                            <span className="instant-badge">Instant Verification</span>
                                        </div>

                                        <div className="channel-credentials-grid">
                                            <div className="credential-item">
                                                <small>Maya Mobile Number</small>
                                                <div className="credential-row">
                                                    <strong>09956326245</strong>
                                                    <button
                                                        type="button"
                                                        className="copy-chip"
                                                        onClick={() => handleCopy("09956326245", "maya-num")}
                                                    >
                                                        {copiedText === "maya-num" ? <Check size={14} /> : <Copy size={14} />}
                                                        <span>{copiedText === "maya-num" ? "Copied!" : "Copy"}</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="credential-item">
                                                <small>Account Name</small>
                                                <div className="credential-row">
                                                    <strong>Ronald Aviguetero / EPIC Church</strong>
                                                    <button
                                                        type="button"
                                                        className="copy-chip"
                                                        onClick={() => handleCopy("Ronald Aviguetero", "maya-name")}
                                                    >
                                                        {copiedText === "maya-name" ? <Check size={14} /> : <Copy size={14} />}
                                                        <span>{copiedText === "maya-name" ? "Copied!" : "Copy"}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="channel-steps-box">
                                            <strong>How to Pay with Maya:</strong>
                                            <ol>
                                                <li>Open your <strong>Maya App</strong>.</li>
                                                <li>Tap <strong>Send Money</strong> and enter <code>09956326245</code>.</li>
                                                <li>Confirm recipient name <strong>Ronald Aviguetero</strong> and amount <strong>{formatCurrency(amount)}</strong>.</li>
                                                <li>Save or capture the payment confirmation receipt.</li>
                                                <li>Enter your reference number and upload the receipt image below.</li>
                                            </ol>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === "gotyme" && (
                                    <div className="channel-detail-view">
                                        <div className="channel-brand-bar gotyme">
                                            <span className="channel-tag-pill">BANK TRANSFER / GOTYME</span>
                                            <span className="instant-badge">Same-Day Processing</span>
                                        </div>

                                        <div className="channel-credentials-grid">
                                            <div className="credential-item">
                                                <small>Bank / Provider</small>
                                                <div className="credential-row">
                                                    <strong>GoTyme Bank</strong>
                                                </div>
                                            </div>

                                            <div className="credential-item">
                                                <small>Account Number</small>
                                                <div className="credential-row">
                                                    <strong>09956326245</strong>
                                                    <button
                                                        type="button"
                                                        className="copy-chip"
                                                        onClick={() => handleCopy("09956326245", "gotyme-num")}
                                                    >
                                                        {copiedText === "gotyme-num" ? <Check size={14} /> : <Copy size={14} />}
                                                        <span>{copiedText === "gotyme-num" ? "Copied!" : "Copy"}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="channel-steps-box">
                                            <strong>Bank Transfer Instructions:</strong>
                                            <ol>
                                                <li>Send via InstaPay or PESONet from any Philippine bank (BDO, BPI, UnionBank, etc.).</li>
                                                <li>Select <strong>GoTyme Bank</strong> and transfer <strong>{formatCurrency(amount)}</strong>.</li>
                                                <li>Upload the transfer receipt and enter the bank reference code below.</li>
                                            </ol>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* RECEIPT SUBMISSION FORM */}
                            <form onSubmit={handleSubmit} className="payment-receipt-form">
                                <h3>Upload Proof of Payment</h3>
                                <p>Provide your receipt so our finance team can verify and activate your service.</p>

                                {errorMessage && (
                                    <div className="payment-error-banner" role="alert">
                                        <AlertCircle size={16} />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label htmlFor="referenceNumber">
                                        <span>Official Reference Number *</span>
                                    </label>
                                    <input
                                        id="referenceNumber"
                                        type="text"
                                        required
                                        placeholder="e.g. 1029384756102 or 92837482"
                                        value={referenceNumber}
                                        onChange={(e) => setReferenceNumber(e.target.value)}
                                        className="form-input"
                                    />
                                    <span className="field-hint">Found on your GCash / Maya SMS or in-app receipt</span>
                                </div>

                                <div className="form-group">
                                    <label>Payment Screenshot / PDF Proof *</label>

                                    {!proofFile ? (
                                        <label className="file-dropzone">
                                            <input
                                                type="file"
                                                accept="image/png, image/jpeg, image/webp, application/pdf"
                                                onChange={handleFileChange}
                                                className="file-input-hidden"
                                            />
                                            <UploadCloud size={32} className="upload-icon" />
                                            <strong>Click to upload receipt or drag &amp; drop</strong>
                                            <small>PNG, JPG, WEBP or PDF (Max 5 MB)</small>
                                        </label>
                                    ) : (
                                        <div className="file-preview-card">
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="Receipt Preview" className="receipt-preview-img" />
                                            ) : (
                                                <div className="receipt-preview-doc">
                                                    <FileText size={32} />
                                                    <span>PDF Document</span>
                                                </div>
                                            )}
                                            <div className="file-info-col">
                                                <strong>{proofFile.name}</strong>
                                                <small>{(proofFile.size / 1024).toFixed(1)} KB</small>
                                            </div>
                                            <button
                                                type="button"
                                                className="file-remove-btn"
                                                onClick={handleRemoveFile}
                                                title="Remove file"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="paymentNotes">Special Notes or Ministry Remarks (Optional)</label>
                                    <input
                                        id="paymentNotes"
                                        type="text"
                                        placeholder="e.g. Main church branch enrollment, urgent activation"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="form-input"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="payment-submit-btn"
                                >
                                    {isSubmitting ? (
                                        <span>Verifying &amp; Submitting...</span>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={18} />
                                            <span>Submit Payment &amp; Activate Account</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: ORDER SUMMARY CARD */}
                    <div className="payment-summary-column">
                        <div className="payment-summary-card">
                            <div className="summary-header-row">
                                <h3>Order Summary</h3>
                                <span className="summary-type-tag">
                                    {itemType === "saas" ? "⛪ CHURCH SAAS" : itemType === "course" ? "🎓 EPIC ACADEMY" : "📦 DIGITAL TOOLKIT"}
                                </span>
                            </div>

                            <div className="summary-solution-box">
                                <strong>{planName}</strong>
                                <small>
                                    {itemType === "saas" && (billingCycle === "yearly" ? "Annual Cloud Subscription" : "Monthly Cloud Subscription")}
                                    {itemType === "course" && "Lifetime Course Access &bull; Student Diploma"}
                                    {itemType === "product" && "Instant Digital Download Archive (.ZIP)"}
                                </small>
                            </div>

                            <div className="summary-customer-meta">
                                <div className="meta-row">
                                    <span>Church / Ministry:</span>
                                    <strong>{churchName}</strong>
                                </div>
                                <div className="meta-row">
                                    <span>Administrator:</span>
                                    <strong>{contactPerson}</strong>
                                </div>
                            </div>

                            <div className="summary-amount-box">
                                <div className="amount-label">Amount Payable:</div>
                                <div className="amount-value">{formatCurrency(amount)}</div>
                                <div className="amount-note">Zero Transaction &bull; Direct Philippine Channel</div>
                            </div>

                            <div className="payment-perks-box">
                                <div className="perk-row">
                                    <ShieldCheck size={16} className="perk-icon" />
                                    <span>100% Guaranteed Receipt Validation</span>
                                </div>
                                <div className="perk-row">
                                    <Clock size={16} className="perk-icon" />
                                    <span>Fast Human Verification (15-30 mins)</span>
                                </div>
                                <div className="perk-row">
                                    <Sparkles size={16} className="perk-icon" />
                                    <span>Automated Welcome Email &amp; Receipt PDF</span>
                                </div>
                            </div>

                            <div className="payment-help-box">
                                <strong>Need Immediate Assistance?</strong>
                                <p>Message our finance desk on WhatsApp or SMS at <code>09956326245</code> for real-time priority verification.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* SIMPLE FOOTER */}
            <footer className="payment-footer">
                <div className="payment-footer-inner">
                    <span>&copy; 2026 EPIC Church Management Platform &bull; All Rights Reserved</span>
                    <div className="payment-footer-links">
                        <button type="button" onClick={() => onNavigate("offer")}>Plans &amp; Pricing</button>
                        <button type="button" onClick={() => onNavigate("learning")}>EPIC Academy</button>
                        <button type="button" onClick={() => onNavigate("contact")}>Contact Support</button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PaymentPage;
