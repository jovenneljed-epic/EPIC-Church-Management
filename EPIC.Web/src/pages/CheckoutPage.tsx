import React, { useMemo, useState } from "react";
import PublicHeader from "../components/PublicHeader";
import {
    Lock,
    ShieldCheck,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Building2,
    User,
    Mail,
    Phone,
    Key,
    Check,
} from "lucide-react";
import "./CheckoutPage.css";
import { API_BASE_URL } from "../config";

interface CheckoutPageProps {
    onNavigate: (page: string) => void;
}

const DEFAULT_PLANS_FALLBACK: Record<string, { name: string; priceMonthly: number; priceAnnual: number; type: string; features: string[] }> = {
    starter: {
        name: "EPIC Starter",
        priceMonthly: 999,
        priceAnnual: 9990,
        type: "saas",
        features: ["Up to 250 Members", "Services & Attendance Desk", "Visitor Management", "Cloud Sync"],
    },
    growth: {
        name: "EPIC Growth",
        priceMonthly: 1999,
        priceAnnual: 19990,
        type: "saas",
        features: ["Up to 1,000 Members", "Giving & Tithes Management", "Ministries & Points System", "Client Church Portal", "Priority Support"],
    },
    complete: {
        name: "EPIC Complete",
        priceMonthly: 2999,
        priceAnnual: 29990,
        type: "saas",
        features: ["Unlimited Members", "Integrated EPIC Academy LMS", "Discipleship Progress & Certificates", "VIP Dedicated Care"],
    },
};

const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
    const [churchName, setChurchName] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agreeTerms, setAgreeTerms] = useState(true);

    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Retrieve selected plan data from localStorage
    const selectedPlanId = localStorage.getItem("epicSelectedPlan") || "growth";
    const selectedPlanName = localStorage.getItem("epicSelectedPlanName") || "EPIC Growth Plan";
    const storedBillingCycle = localStorage.getItem("epicBillingCycle") || "monthly";
    const itemType = localStorage.getItem("epicSelectedItemType") || "saas";
    const storedAmount = localStorage.getItem("epicCheckoutAmount");
    const itemBadge = localStorage.getItem("epicSelectedItemBadge") || "";

    // Resolve Price
    const price = useMemo(() => {
        if (storedAmount && !isNaN(Number(storedAmount))) {
            return Number(storedAmount);
        }
        const fallback = DEFAULT_PLANS_FALLBACK[selectedPlanId];
        if (fallback) {
            return storedBillingCycle === "yearly" ? fallback.priceAnnual : fallback.priceMonthly;
        }
        return 1999;
    }, [storedAmount, selectedPlanId, storedBillingCycle]);

    const formatCurrency = (val: number) => {
        return "₱" + val.toLocaleString("en-PH");
    };

    const handleBackToPlans = () => {
        onNavigate("offer");
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        if (!churchName.trim()) return setError("Please enter your church or ministry name.");
        if (!contactPerson.trim()) return setError("Please enter the contact person or pastor name.");
        if (!email.trim()) return setError("Please enter a valid email address.");
        if (!phone.trim()) return setError("Please enter your contact phone number.");
        if (password.length < 8) return setError("Password must be at least 8 characters long.");
        if (password !== confirmPassword) return setError("Passwords do not match.");
        if (!agreeTerms) return setError("Please accept the terms and conditions to proceed.");

        setIsSubmitting(true);

        try {
            // Map planId to a backend-safe alias
            let backendPlanId = "growth";
            if (selectedPlanId.includes("starter") || selectedPlanId.includes("admin") || selectedPlanId.includes("media")) {
                backendPlanId = "starter";
            } else if (selectedPlanId.includes("complete") || selectedPlanId.includes("all-access")) {
                backendPlanId = "complete";
            } else {
                backendPlanId = "growth";
            }

            const response = await fetch(`${API_BASE_URL}/PublicCheckout/subscribe`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    churchName: churchName.trim(),
                    contactPerson: contactPerson.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    planId: backendPlanId,
                    billingCycle: storedBillingCycle === "yearly" ? "yearly" : "monthly",
                    customAmount: price,
                    itemType: itemType,
                    itemTitle: selectedPlanName,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || "Unable to initiate checkout. Please try again.");
            }

            localStorage.setItem("epicSubscriptionId", String(data.subscriptionId));
            localStorage.setItem("epicCheckoutChurchName", churchName.trim());
            localStorage.setItem("epicCheckoutContactPerson", contactPerson.trim());
            localStorage.setItem("epicCheckoutEmail", email.trim());
            localStorage.setItem("epicCheckoutPhone", phone.trim());
            localStorage.setItem("epicCheckoutPlanName", selectedPlanName);
            localStorage.setItem("epicCheckoutAmount", String(data.amount ?? price));
            localStorage.setItem("epicCheckoutBillingCycle", storedBillingCycle);
            localStorage.setItem("epicSelectedItemType", itemType);

            onNavigate("payment");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to continue checkout.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="epic-checkout-page">
            <PublicHeader onNavigate={onNavigate} />

            {/* CHECKOUT STEPPER BAR */}
            <div className="checkout-stepper-wrap">
                <div className="checkout-stepper-inner">
                    <button type="button" className="checkout-back-link" onClick={handleBackToPlans}>
                        <ArrowLeft size={16} />
                        <span>Back to Plans &amp; Pricing</span>
                    </button>

                    <div className="checkout-steps-indicator">
                        <div className="step-node is-completed">
                            <span className="step-circle"><Check size={12} /></span>
                            <span className="step-text">1. Choose Solution</span>
                        </div>
                        <div className="step-divider is-active" />
                        <div className="step-node is-current">
                            <span className="step-circle">2</span>
                            <span className="step-text">2. Account Setup</span>
                        </div>
                        <div className="step-divider" />
                        <div className="step-node">
                            <span className="step-circle">3</span>
                            <span className="step-text">3. Payment &amp; Activation</span>
                        </div>
                    </div>

                    <div className="checkout-badge-secure">
                        <Lock size={14} />
                        <span>256-Bit SSL Encrypted</span>
                    </div>
                </div>
            </div>

            {/* MAIN TWO-COLUMN CHECKOUT */}
            <main className="checkout-container">
                <div className="checkout-columns-grid">

                    {/* LEFT COLUMN: ACCOUNT FORM */}
                    <div className="checkout-form-card">
                        <div className="form-card-header">
                            <h2>Complete Your Registration</h2>
                            <p>
                                Provide your church and administrator credentials. Your login details will be created immediately upon activation.
                            </p>
                        </div>

                        {error && (
                            <div className="checkout-error-banner" role="alert">
                                <strong>Notice: </strong>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="checkout-form">
                            <div className="form-group">
                                <label htmlFor="churchName">
                                    <Building2 size={16} />
                                    <span>Church / Ministry Name *</span>
                                </label>
                                <input
                                    id="churchName"
                                    type="text"
                                    required
                                    placeholder="e.g. Grace Community Christian Church"
                                    value={churchName}
                                    onChange={(e) => setChurchName(e.target.value)}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="contactPerson">
                                    <User size={16} />
                                    <span>Senior Pastor / Administrator Name *</span>
                                </label>
                                <input
                                    id="contactPerson"
                                    type="text"
                                    required
                                    placeholder="e.g. Pastor Ronald Aviguetero"
                                    value={contactPerson}
                                    onChange={(e) => setContactPerson(e.target.value)}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label htmlFor="email">
                                        <Mail size={16} />
                                        <span>Official Email Address *</span>
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        placeholder="admin@yourchurch.org"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="form-input"
                                    />
                                    <span className="field-hint">Your login &amp; receipt will be sent here</span>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">
                                        <Phone size={16} />
                                        <span>Mobile / GCash Number *</span>
                                    </label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        required
                                        placeholder="09956326245"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="form-input"
                                    />
                                    <span className="field-hint">Used for SMS alerts and payment matching</span>
                                </div>
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label htmlFor="password">
                                        <Key size={16} />
                                        <span>Account Password *</span>
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        placeholder="Minimum 8 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">
                                        <Key size={16} />
                                        <span>Confirm Password *</span>
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        required
                                        placeholder="Re-enter password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="form-checkbox-group">
                                <label className="custom-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={agreeTerms}
                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                    />
                                    <span className="checkbox-text">
                                        I agree to the <strong>EPIC Terms of Service</strong> and <strong>Church Data Privacy Policy</strong>.
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="checkout-submit-btn"
                            >
                                {isSubmitting ? (
                                    <span>Processing Account Setup...</span>
                                ) : (
                                    <>
                                        <span>Proceed to Payment ({formatCurrency(price)})</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* RIGHT COLUMN: ORDER SUMMARY */}
                    <div className="checkout-summary-column">
                        <div className="checkout-summary-card">
                            <div className="summary-header">
                                <div className="summary-title-wrap">
                                    <h3>Order Summary</h3>
                                    <span className="summary-type-tag">
                                        {itemType === "saas" ? "⛪ CHURCH SAAS" : itemType === "course" ? "🎓 EPIC ACADEMY" : "📦 DIGITAL TOOLKIT"}
                                    </span>
                                </div>
                                <button type="button" className="summary-change-btn" onClick={handleBackToPlans}>
                                    Change
                                </button>
                            </div>

                            <div className="summary-product-box">
                                <div className="summary-product-name">
                                    <strong>{selectedPlanName}</strong>
                                    {itemBadge && <span className="summary-badge">{itemBadge}</span>}
                                </div>
                                <div className="summary-product-desc">
                                    {itemType === "saas" && (
                                        <span>{storedBillingCycle === "yearly" ? "Annual Subscription (Includes 2 Months Free)" : "Monthly Cloud Subscription"}</span>
                                    )}
                                    {itemType === "course" && (
                                        <span>Lifetime Discipleship Academy Portal Access &bull; Certificate Included</span>
                                    )}
                                    {itemType === "product" && (
                                        <span>Instant Download Archive (.ZIP) &bull; Editable Word, PPTX &amp; Excel</span>
                                    )}
                                </div>
                                <div className="summary-product-price">
                                    {formatCurrency(price)}
                                </div>
                            </div>

                            <div className="summary-breakdown">
                                <div className="summary-row">
                                    <span>Subtotal</span>
                                    <strong>{formatCurrency(price)}</strong>
                                </div>
                                <div className="summary-row">
                                    <span>System Onboarding &amp; Setup</span>
                                    <strong className="text-free">FREE (₱0)</strong>
                                </div>
                                <div className="summary-row">
                                    <span>Platform Processing Fee</span>
                                    <strong className="text-free">FREE (₱0)</strong>
                                </div>
                                <div className="summary-divider" />
                                <div className="summary-row total-row">
                                    <div>
                                        <strong>Total Due Today</strong>
                                        <small className="currency-note">Philippine Pesos (PHP)</small>
                                    </div>
                                    <strong className="total-amount">{formatCurrency(price)}</strong>
                                </div>
                            </div>

                            <div className="summary-features-box">
                                <div className="summary-features-title">
                                    What&apos;s Included in this Order:
                                </div>
                                <ul>
                                    <li>
                                        <CheckCircle2 size={15} className="check-green" />
                                        <span>Instant Account Provisioning &amp; Access</span>
                                    </li>
                                    <li>
                                        <CheckCircle2 size={15} className="check-green" />
                                        <span>Verified GCash &amp; Maya Payment Support</span>
                                    </li>
                                    <li>
                                        <CheckCircle2 size={15} className="check-green" />
                                        <span>30-Day Money-Back Satisfaction Guarantee</span>
                                    </li>
                                    <li>
                                        <CheckCircle2 size={15} className="check-green" />
                                        <span>Dedicated Philippine Church Care Specialists</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="summary-security-note">
                                <ShieldCheck size={18} className="shield-icon" />
                                <div>
                                    <strong>Guaranteed Safe Checkout</strong>
                                    <p>Your payment information and church records are protected by enterprise-grade cryptographic standards.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* SIMPLE FOOTER */}
            <footer className="checkout-footer">
                <div className="checkout-footer-inner">
                    <span>&copy; 2026 EPIC Church Management Platform &bull; All Rights Reserved</span>
                    <div className="checkout-footer-links">
                        <button type="button" onClick={() => onNavigate("offer")}>Plans &amp; Pricing</button>
                        <button type="button" onClick={() => onNavigate("learning")}>EPIC Academy</button>
                        <button type="button" onClick={() => onNavigate("contact")}>Contact Support</button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default CheckoutPage;
