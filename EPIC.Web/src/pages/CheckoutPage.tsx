
import React, { useMemo, useState } from "react";
import "./CheckoutPage.css";
import { API_BASE_URL } from "../config";

interface CheckoutPageProps {
    onNavigate: (page: string) => void;
}

type BillingCycle = "monthly" | "yearly";

interface PlanInfo {
    id: string;
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    description: string;
}

const PLANS: PlanInfo[] = [
    {
        id: "starter",
        name: "EPIC Starter",
        monthlyPrice: 999,
        yearlyPrice: 9990,
        description:
            "Essential church management tools for growing churches.",
    },
    {
        id: "growth",
        name: "EPIC Growth",
        monthlyPrice: 1999,
        yearlyPrice: 19990,
        description:
            "The complete church management solution for active ministries.",
    },
    {
        id: "complete",
        name: "EPIC Complete",
        monthlyPrice: 2999,
        yearlyPrice: 29990,
        description:
            "The full digital church ecosystem with discipleship and advanced tools.",
    },
];

const CheckoutPage: React.FC<CheckoutPageProps> = ({
    onNavigate,
}) => {
    const [churchName, setChurchName] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [agreeTerms, setAgreeTerms] = useState(false);

    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedPlanId =
        localStorage.getItem("epicSelectedPlan") ||
        "growth";

    const storedPlanName =
        localStorage.getItem("epicSelectedPlanName");

    const storedBilling =
        localStorage.getItem("epicBillingCycle") as
            | BillingCycle
            | null;

    const selectedBilling: BillingCycle =
        storedBilling === "yearly"
            ? "yearly"
            : "monthly";

    const selectedPlan = useMemo(() => {
        return (
            PLANS.find(
                (plan) => plan.id === selectedPlanId
            ) || PLANS[1]
        );
    }, [selectedPlanId]);

    const billingCycle = selectedBilling;

    const price =
        billingCycle === "monthly"
            ? selectedPlan.monthlyPrice
            : selectedPlan.yearlyPrice;

    const billingLabel =
        billingCycle === "monthly"
            ? "month"
            : "year";

    const monthlyEquivalent =
        selectedPlan.yearlyPrice / 12;

    const formatCurrency = (value: number) => {
        return value.toLocaleString("en-PH", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    };

    const handleBackToPlans = () => {
        onNavigate("offer");
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        setError("");

        if (!churchName.trim()) return setError("Please enter your church name.");
        if (!contactPerson.trim()) return setError("Please enter the primary contact person.");
        if (!email.trim()) return setError("Please enter your email address.");
        if (!phone.trim()) return setError("Please enter your phone number.");
        if (password.length < 8) return setError("Your password must contain at least 8 characters.");
        if (password !== confirmPassword) return setError("Passwords do not match.");
        if (!agreeTerms) return setError("Please agree to the Terms and Conditions before continuing.");

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/PublicCheckout/subscribe`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    churchName: churchName.trim(),
                    contactPerson: contactPerson.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    planId: selectedPlan.id,
                    billingCycle,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || "Unable to create your subscription.");

            localStorage.setItem("epicSubscriptionId", String(data.subscriptionId));
            localStorage.setItem("epicCheckoutChurchName", churchName.trim());
            localStorage.setItem("epicCheckoutContactPerson", contactPerson.trim());
            localStorage.setItem("epicCheckoutEmail", email.trim());
            localStorage.setItem("epicCheckoutPhone", phone.trim());
            localStorage.setItem("epicCheckoutPlanName", data.planName || selectedPlan.name);
            localStorage.setItem("epicCheckoutAmount", String(data.amount ?? price));
            localStorage.setItem("epicCheckoutBillingCycle", data.billingCycle || billingCycle);
            onNavigate("payment");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to continue checkout.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="epic-checkout-page">

            {/* BACKGROUND */}
            <div className="checkout-glow checkout-glow-one" />
            <div className="checkout-glow checkout-glow-two" />
            <div className="checkout-grid" />

            {/* NAVIGATION */}
            <header className="checkout-navbar">

                <button
                    type="button"
                    className="checkout-brand"
                    onClick={() => onNavigate("landing")}
                >
                    <span className="checkout-logo">
                        EPIC
                    </span>

                    <span className="checkout-brand-text">
                        <strong>EPIC CHURCH</strong>
                        <small>MANAGEMENT SYSTEM</small>
                    </span>
                </button>

                <div className="checkout-secure">
                    <span>🔒</span>
                    Secure Checkout
                </div>

            </header>

            {/* MAIN */}
            <main className="checkout-main">

                {/* HEADER */}
                <section className="checkout-heading">

                    <button
                        type="button"
                        className="checkout-back"
                        onClick={handleBackToPlans}
                    >
                        ← Back to Plans & Pricing
                    </button>

                    <div className="checkout-eyebrow">
                        <span />
                        EPIC SUBSCRIPTION
                    </div>

                    <h1>
                        Complete your
                        <span>EPIC setup.</span>
                    </h1>

                    <p>
                        Tell us a little about your church so
                        we can prepare your EPIC account.
                    </p>

                </section>

                {/* PROGRESS */}
                <div className="checkout-progress">

                    <div className="checkout-progress-step active">
                        <span>1</span>
                        <strong>Account</strong>
                    </div>

                    <div className="checkout-progress-line" />

                    <div className="checkout-progress-step">
                        <span>2</span>
                        <strong>Payment</strong>
                    </div>

                    <div className="checkout-progress-line" />

                    <div className="checkout-progress-step">
                        <span>3</span>
                        <strong>Confirmation</strong>
                    </div>

                </div>

                {/* CONTENT */}
                <div className="checkout-layout">

                    {/* FORM */}
                    <section className="checkout-form-card">

                        <div className="checkout-card-heading">
                            <div className="checkout-card-icon">
                                ⛪
                            </div>

                            <div>
                                <span>STEP 1</span>
                                <h2>
                                    Church Information
                                </h2>
                            </div>
                        </div>

                        {error && (
                            <div className="checkout-error">
                                <span>!</span>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>

                            <div className="checkout-form-section">

                                <div className="checkout-section-label">
                                    CHURCH DETAILS
                                </div>

                                <div className="checkout-field full">

                                    <label htmlFor="churchName">
                                        Church Name
                                        <span>*</span>
                                    </label>

                                    <input
                                        id="churchName"
                                        type="text"
                                        value={churchName}
                                        onChange={(event) =>
                                            setChurchName(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Enter your church name"
                                        autoComplete="organization"
                                    />

                                </div>

                                <div className="checkout-field-grid">

                                    <div className="checkout-field">

                                        <label htmlFor="contactPerson">
                                            Primary Contact Person
                                            <span>*</span>
                                        </label>

                                        <input
                                            id="contactPerson"
                                            type="text"
                                            value={contactPerson}
                                            onChange={(event) =>
                                                setContactPerson(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Full name"
                                            autoComplete="name"
                                        />

                                    </div>

                                    <div className="checkout-field">

                                        <label htmlFor="phone">
                                            Phone Number
                                            <span>*</span>
                                        </label>

                                        <input
                                            id="phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(event) =>
                                                setPhone(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="09XX XXX XXXX"
                                            autoComplete="tel"
                                        />

                                    </div>

                                </div>

                            </div>

                            <div className="checkout-form-divider" />

                            <div className="checkout-form-section">

                                <div className="checkout-section-label">
                                    ACCOUNT DETAILS
                                </div>

                                <div className="checkout-field full">

                                    <label htmlFor="email">
                                        Email Address
                                        <span>*</span>
                                    </label>

                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(
                                                event.target.value
                                            )
                                        }
                                        placeholder="church@example.com"
                                        autoComplete="email"
                                    />

                                    <small>
                                        This email will be used
                                        for your EPIC account.
                                    </small>

                                </div>

                                <div className="checkout-field-grid">

                                    <div className="checkout-field">

                                        <label htmlFor="password">
                                            Password
                                            <span>*</span>
                                        </label>

                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(event) =>
                                                setPassword(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Minimum 8 characters"
                                            autoComplete="new-password"
                                        />

                                    </div>

                                    <div className="checkout-field">

                                        <label htmlFor="confirmPassword">
                                            Confirm Password
                                            <span>*</span>
                                        </label>

                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(event) =>
                                                setConfirmPassword(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Repeat your password"
                                            autoComplete="new-password"
                                        />

                                    </div>

                                </div>

                            </div>

                            <div className="checkout-terms">

                                <label>
                                    <input
                                        type="checkbox"
                                        checked={agreeTerms}
                                        onChange={(event) =>
                                            setAgreeTerms(
                                                event.target.checked
                                            )
                                        }
                                    />

                                    <span>
                                        I agree to the EPIC
                                        Terms and Conditions
                                        and Privacy Policy.
                                    </span>
                                </label>

                            </div>

                            <button
                                type="submit"
                                className="checkout-submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? "Preparing Checkout..."
                                    : "Continue to Payment"}

                                <span>→</span>
                            </button>

                            <div className="checkout-security-note">
                                <span>🔒</span>
                                Your information is protected
                                and will be securely processed.
                            </div>

                        </form>

                    </section>

                    {/* ORDER SUMMARY */}
                    <aside className="checkout-summary">

                        <div className="checkout-summary-card">

                            <div className="checkout-summary-top">

                                <span className="checkout-summary-label">
                                    YOUR EPIC PLAN
                                </span>

                                <span className="checkout-summary-status">
                                    SELECTED
                                </span>

                            </div>

                            <div className="checkout-plan-icon">
                                {selectedPlan.id === "starter"
                                    ? "◈"
                                    : selectedPlan.id === "growth"
                                    ? "◆"
                                    : "✦"}
                            </div>

                            <h2>
                                {storedPlanName ||
                                    selectedPlan.name}
                            </h2>

                            <p>
                                {selectedPlan.description}
                            </p>

                            <div className="checkout-summary-divider" />

                            <div className="checkout-price">

                                <span>₱</span>

                                <strong>
                                    {formatCurrency(price)}
                                </strong>

                                <small>
                                    /{billingLabel}
                                </small>

                            </div>

                            {billingCycle === "yearly" && (
                                <div className="checkout-saving">

                                    <span>✓</span>

                                    Annual billing selected

                                    <small>
                                        ≈ ₱
                                        {formatCurrency(
                                            monthlyEquivalent
                                        )}
                                        /month
                                    </small>

                                </div>
                            )}

                            <div className="checkout-summary-divider" />

                            <div className="checkout-summary-details">

                                <div>
                                    <span>Plan</span>
                                    <strong>
                                        {selectedPlan.name}
                                    </strong>
                                </div>

                                <div>
                                    <span>Billing</span>
                                    <strong>
                                        {billingCycle ===
                                        "monthly"
                                            ? "Monthly"
                                            : "Yearly"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Subscription</span>
                                    <strong>
                                        Recurring
                                    </strong>
                                </div>

                            </div>

                            <button
                                type="button"
                                className="checkout-change-plan"
                                onClick={handleBackToPlans}
                            >
                                ← Change Plan
                            </button>

                        </div>

                        {/* TRUST */}
                        <div className="checkout-trust-card">

                            <div>
                                <span>🔒</span>
                                <div>
                                    <strong>
                                        Secure Checkout
                                    </strong>
                                    <small>
                                        Protected account
                                        information
                                    </small>
                                </div>
                            </div>

                            <div>
                                <span>☁</span>
                                <div>
                                    <strong>
                                        Cloud-Based
                                    </strong>
                                    <small>
                                        Access your church
                                        anywhere
                                    </small>
                                </div>
                            </div>

                            <div>
                                <span>✦</span>
                                <div>
                                    <strong>
                                        Church-Focused
                                    </strong>
                                    <small>
                                        Built specifically
                                        for churches
                                    </small>
                                </div>
                            </div>

                        </div>

                    </aside>

                </div>

            </main>

            {/* FOOTER */}
            <footer className="checkout-footer">

                <span>
                    © {new Date().getFullYear()} EPIC
                    Church Management System
                </span>

                <span>
                    Engaging People Into Christ
                </span>

            </footer>

        </div>
    );
};

export default CheckoutPage;

