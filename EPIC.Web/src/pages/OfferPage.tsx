
import React, { useMemo, useState } from "react";
import "./OfferPage.css";

interface OfferPageProps {
    onNavigate: (page: string) => void;
}

type BillingCycle = "monthly" | "yearly";

interface Plan {
    id: string;
    name: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    popular?: boolean;
    badge?: string;
    features: string[];
}

const PLANS: Plan[] = [
    {
        id: "starter",
        name: "EPIC Starter",
        description:
            "Essential church management tools for growing churches.",
        monthlyPrice: 999,
        yearlyPrice: 9990,
        features: [
            "Church Dashboard",
            "Member Management",
            "Church Services",
            "Attendance Management",
            "Visitor Management",
            "Basic Reports",
            "Secure Cloud Access",
            "Email Support",
        ],
    },
    {
        id: "growth",
        name: "EPIC Growth",
        description:
            "The complete church management solution for active ministries.",
        monthlyPrice: 1999,
        yearlyPrice: 19990,
        popular: true,
        badge: "MOST POPULAR",
        features: [
            "Everything in Starter",
            "Giving Management",
            "Income Management",
            "Expense Management",
            "Ministry Management",
            "Event Management",
            "Advanced Reports",
            "Member Attendance Reports",
            "Client Church Portal",
            "Priority Support",
        ],
    },
    {
        id: "complete",
        name: "EPIC Complete",
        description:
            "The full digital church ecosystem with discipleship and advanced tools.",
        monthlyPrice: 2999,
        yearlyPrice: 29990,
        badge: "BEST VALUE",
        features: [
            "Everything in Growth",
            "EPIC Learning School",
            "Online Discipleship",
            "Certificates",
            "Course & Lesson Management",
            "Learning Progress Tracking",
            "Website Analytics",
            "Subscription Management",
            "Advanced Business Dashboard",
            "Premium Support",
        ],
    },
];

const OfferPage: React.FC<OfferPageProps> = ({
    onNavigate,
}) => {
    const [billingCycle, setBillingCycle] =
        useState<BillingCycle>("monthly");

    const [selectedPlan, setSelectedPlan] =
        useState<string>("growth");

    const [openFaq, setOpenFaq] =
        useState<number | null>(null);

    const billingLabel = useMemo(
        () =>
            billingCycle === "monthly"
                ? "month"
                : "year",
        [billingCycle]
    );

    const handleSelectPlan = (plan: Plan) => {
        setSelectedPlan(plan.id);

        localStorage.setItem(
            "epicSelectedPlan",
            plan.id
        );

        localStorage.setItem(
            "epicSelectedPlanName",
            plan.name
        );

        localStorage.setItem(
            "epicBillingCycle",
            billingCycle
        );

        localStorage.setItem(
            "epicPlanPrice",
            String(
                billingCycle === "monthly"
                    ? plan.monthlyPrice
                    : plan.yearlyPrice
            )
        );

        onNavigate("checkout");
    };

    const faqs = [
        {
            question:
                "Can I change my plan later?",
            answer:
                "Yes. You can upgrade or change your EPIC plan as your church grows. Your existing church data remains protected.",
        },
        {
            question:
                "Do I need technical knowledge to use EPIC?",
            answer:
                "No. EPIC is designed for church administrators and ministry leaders. The system is built to be simple, organized and easy to use.",
        },
        {
            question:
                "Does EPIC include a church portal?",
            answer:
                "Yes. EPIC supports a dedicated client church portal where authorized church users can access their church information and services.",
        },
        {
            question:
                "What is EPIC Learning?",
            answer:
                "EPIC Learning is the discipleship and online learning component of the EPIC ecosystem. Churches can provide structured lessons, track learning progress and issue certificates.",
        },
        {
            question:
                "Is my church data secure?",
            answer:
                "EPIC is designed with authenticated access, role-based permissions and protected API communication to help keep church information secure.",
        },
        {
            question:
                "Can I request a demonstration?",
            answer:
                "Absolutely. If you want to see how EPIC works before subscribing, you can request a personalized demonstration.",
        },
    ];

    return (
        <div className="epic-offer-page">

            {/* =====================================================
                BACKGROUND
            ===================================================== */}

            <div className="epic-offer-glow epic-offer-glow-one" />
            <div className="epic-offer-glow epic-offer-glow-two" />

            {/* =====================================================
                NAVIGATION
            ===================================================== */}

            <header className="epic-offer-nav">
                <button
                    type="button"
                    className="epic-offer-brand"
                    onClick={() =>
                        onNavigate("landing")
                    }
                >
                    <span className="epic-offer-logo">
                        EPIC
                    </span>

                    <span className="epic-offer-brand-text">
                        <strong>
                            EPIC CHURCH
                        </strong>
                        <small>
                            MANAGEMENT SYSTEM
                        </small>
                    </span>
                </button>

                <div className="epic-offer-nav-actions">
                    <button
                        type="button"
                        className="epic-offer-nav-link"
                        onClick={() =>
                            onNavigate("opt-in")
                        }
                    >
                        Free Demo
                    </button>

                    <button
                        type="button"
                        className="epic-offer-nav-link"
                        onClick={() =>
                            onNavigate("home")
                        }
                    >
                        EPIC Website
                    </button>
                </div>
            </header>

            {/* =====================================================
                HERO
            ===================================================== */}

            <section className="epic-offer-hero">

                <div className="epic-offer-eyebrow">
                    <span className="epic-offer-eyebrow-dot" />
                    SIMPLE • POWERFUL • BUILT FOR CHURCHES
                </div>

                <h1>
                    Choose the EPIC plan
                    <span>
                        that fits your church.
                    </span>
                </h1>

                <p>
                    Everything your church needs to
                    organize people, manage ministry,
                    strengthen discipleship and grow
                    digitally — all in one ecosystem.
                </p>

                <div className="epic-offer-trust-row">
                    <div>
                        <span>✓</span>
                        Church Management
                    </div>

                    <div>
                        <span>✓</span>
                        Member Portal
                    </div>

                    <div>
                        <span>✓</span>
                        EPIC Learning
                    </div>

                    <div>
                        <span>✓</span>
                        Secure Cloud System
                    </div>
                </div>

            </section>

            {/* =====================================================
                BILLING TOGGLE
            ===================================================== */}

            <section className="epic-billing-section">

                <div className="epic-billing-toggle">

                    <button
                        type="button"
                        className={
                            billingCycle === "monthly"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setBillingCycle(
                                "monthly"
                            )
                        }
                    >
                        Monthly
                    </button>

                    <button
                        type="button"
                        className={
                            billingCycle === "yearly"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setBillingCycle(
                                "yearly"
                            )
                        }
                    >
                        Yearly
                        <span>
                            SAVE
                        </span>
                    </button>

                </div>

                <p>
                    {billingCycle === "monthly"
                        ? "Flexible monthly billing. Cancel anytime."
                        : "Pay yearly and save compared with monthly billing."}
                </p>

            </section>

            {/* =====================================================
                PRICING
            ===================================================== */}

            <section className="epic-pricing-section">

                <div className="epic-pricing-grid">

                    {PLANS.map((plan) => {

                        const price =
                            billingCycle ===
                            "monthly"
                                ? plan.monthlyPrice
                                : plan.yearlyPrice;

                        const isSelected =
                            selectedPlan ===
                            plan.id;

                        return (
                            <article
                                key={plan.id}
                                className={`epic-plan-card ${
                                    plan.popular
                                        ? "popular"
                                        : ""
                                } ${
                                    isSelected
                                        ? "selected"
                                        : ""
                                }`}
                            >

                                {plan.badge && (
                                    <div className="epic-plan-badge">
                                        {plan.badge}
                                    </div>
                                )}

                                <div className="epic-plan-header">

                                    <div className="epic-plan-icon">
                                        {plan.id ===
                                            "starter"
                                            ? "◈"
                                            : plan.id ===
                                              "growth"
                                            ? "◆"
                                            : "✦"}
                                    </div>

                                    <h2>
                                        {plan.name}
                                    </h2>

                                    <p>
                                        {
                                            plan.description
                                        }
                                    </p>

                                </div>

                                <div className="epic-plan-price">

                                    <span className="epic-currency">
                                        ₱
                                    </span>

                                    <strong>
                                        {price.toLocaleString(
                                            "en-PH"
                                        )}
                                    </strong>

                                    <span className="epic-price-cycle">
                                        /
                                        {billingLabel}
                                    </span>

                                </div>

                                {billingCycle ===
                                    "yearly" && (
                                    <div className="epic-yearly-note">
                                        Annual billing
                                    </div>
                                )}

                                <button
                                    type="button"
                                    className={`epic-plan-button ${
                                        plan.popular
                                            ? "primary"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        handleSelectPlan(
                                            plan
                                        )
                                    }
                                >
                                    {isSelected
                                        ? "Continue with this plan"
                                        : "Choose this plan"}
                                    <span>
                                        →
                                    </span>
                                </button>

                                <div className="epic-plan-divider" />

                                <h3>
                                    What's included
                                </h3>

                                <ul className="epic-feature-list">

                                    {plan.features.map(
                                        (
                                            feature
                                        ) => (
                                            <li
                                                key={
                                                    feature
                                                }
                                            >
                                                <span>
                                                    ✓
                                                </span>

                                                {
                                                    feature
                                                }
                                            </li>
                                        )
                                    )}

                                </ul>

                            </article>
                        );
                    })}

                </div>

            </section>

            {/* =====================================================
                VALUE SECTION
            ===================================================== */}

            <section className="epic-value-section">

                <div className="epic-section-heading">

                    <span>
                        ONE DIGITAL ECOSYSTEM
                    </span>

                    <h2>
                        More than church software.
                        <br />
                        <strong>
                            It's your church's digital foundation.
                        </strong>
                    </h2>

                    <p>
                        EPIC connects administration,
                        people, ministry, finances and
                        discipleship into one organized
                        platform.
                    </p>

                </div>

                <div className="epic-value-grid">

                    <div className="epic-value-card">
                        <div className="epic-value-icon">
                            👥
                        </div>
                        <h3>
                            Manage Your People
                        </h3>
                        <p>
                            Keep member information,
                            attendance, visitors and
                            ministry connections organized.
                        </p>
                    </div>

                    <div className="epic-value-card">
                        <div className="epic-value-icon">
                            ⛪
                        </div>
                        <h3>
                            Organize Ministry
                        </h3>
                        <p>
                            Manage services, events,
                            ministries and church
                            activities from one place.
                        </p>
                    </div>

                    <div className="epic-value-card">
                        <div className="epic-value-icon">
                            📊
                        </div>
                        <h3>
                            Understand Your Church
                        </h3>
                        <p>
                            Turn church information into
                            useful reports and actionable
                            insights.
                        </p>
                    </div>

                    <div className="epic-value-card">
                        <div className="epic-value-icon">
                            📚
                        </div>
                        <h3>
                            Develop Disciples
                        </h3>
                        <p>
                            Deliver structured learning,
                            track progress and recognize
                            completion with certificates.
                        </p>
                    </div>

                </div>

            </section>

            {/* =====================================================
                COMPARISON
            ===================================================== */}

            <section className="epic-comparison-section">

                <div className="epic-section-heading">
                    <span>
                        COMPARE YOUR OPTIONS
                    </span>

                    <h2>
                        Find the right level
                        <br />
                        <strong>
                            for your church.
                        </strong>
                    </h2>
                </div>

                <div className="epic-comparison-table">

                    <div className="epic-comparison-header">
                        <div>
                            Features
                        </div>
                        <div>
                            Starter
                        </div>
                        <div className="highlight">
                            Growth
                        </div>
                        <div>
                            Complete
                        </div>
                    </div>

                    {[
                        [
                            "Church Dashboard",
                            true,
                            true,
                            true,
                        ],
                        [
                            "Member Management",
                            true,
                            true,
                            true,
                        ],
                        [
                            "Attendance",
                            true,
                            true,
                            true,
                        ],
                        [
                            "Church Services",
                            true,
                            true,
                            true,
                        ],
                        [
                            "Visitors",
                            true,
                            true,
                            true,
                        ],
                        [
                            "Giving",
                            false,
                            true,
                            true,
                        ],
                        [
                            "Income & Expenses",
                            false,
                            true,
                            true,
                        ],
                        [
                            "Event Management",
                            false,
                            true,
                            true,
                        ],
                        [
                            "Client Portal",
                            false,
                            true,
                            true,
                        ],
                        [
                            "EPIC Learning",
                            false,
                            false,
                            true,
                        ],
                        [
                            "Certificates",
                            false,
                            false,
                            true,
                        ],
                        [
                            "Website Analytics",
                            false,
                            false,
                            true,
                        ],
                    ].map(
                        (
                            row,
                            index
                        ) => (
                            <div
                                className="epic-comparison-row"
                                key={index}
                            >
                                <div>
                                    {
                                        row[0]
                                    }
                                </div>

                                <div>
                                    {row[1] ? (
                                        <span className="comparison-check">
                                            ✓
                                        </span>
                                    ) : (
                                        <span className="comparison-none">
                                            —
                                        </span>
                                    )}
                                </div>

                                <div className="highlight">
                                    {row[2] ? (
                                        <span className="comparison-check">
                                            ✓
                                        </span>
                                    ) : (
                                        <span className="comparison-none">
                                            —
                                        </span>
                                    )}
                                </div>

                                <div>
                                    {row[3] ? (
                                        <span className="comparison-check">
                                            ✓
                                        </span>
                                    ) : (
                                        <span className="comparison-none">
                                            —
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    )}

                </div>

            </section>

            {/* =====================================================
                CTA
            ===================================================== */}

            <section className="epic-offer-cta">

                <div className="epic-cta-content">

                    <span>
                        READY TO TAKE THE NEXT STEP?
                    </span>

                    <h2>
                        Give your church
                        <br />
                        <strong>
                            a better digital foundation.
                        </strong>
                    </h2>

                    <p>
                        Choose your EPIC plan and take
                        the next step toward a more
                        organized, connected and
                        digitally empowered church.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            handleSelectPlan(
                                PLANS.find(
                                    (plan) =>
                                        plan.id ===
                                        selectedPlan
                                ) || PLANS[1]
                            )
                        }
                    >
                        Continue to Checkout
                        <span>
                            →
                        </span>
                    </button>

                    <small>
                        No complicated setup.
                        Secure checkout.
                    </small>

                </div>

            </section>

            {/* =====================================================
                FAQ
            ===================================================== */}

            <section className="epic-faq-section">

                <div className="epic-section-heading">
                    <span>
                        FREQUENTLY ASKED QUESTIONS
                    </span>

                    <h2>
                        Questions?
                        <br />
                        <strong>
                            We've got answers.
                        </strong>
                    </h2>
                </div>

                <div className="epic-faq-list">

                    {faqs.map(
                        (
                            faq,
                            index
                        ) => {

                            const open =
                                openFaq ===
                                index;

                            return (
                                <div
                                    key={
                                        index
                                    }
                                    className={`epic-faq-item ${
                                        open
                                            ? "open"
                                            : ""
                                    }`}
                                >

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenFaq(
                                                open
                                                    ? null
                                                    : index
                                            )
                                        }
                                    >
                                        <span>
                                            {
                                                faq.question
                                            }
                                        </span>

                                        <strong>
                                            {open
                                                ? "−"
                                                : "+"}
                                        </strong>
                                    </button>

                                    {open && (
                                        <div className="epic-faq-answer">
                                            {
                                                faq.answer
                                            }
                                        </div>
                                    )}

                                </div>
                            );
                        }
                    )}

                </div>

            </section>

            {/* =====================================================
                FOOTER
            ===================================================== */}

            <footer className="epic-offer-footer">

                <div className="epic-footer-brand">
                    <div className="epic-footer-logo">
                        EPIC
                    </div>

                    <div>
                        <strong>
                            EPIC CHURCH
                            MANAGEMENT SYSTEM
                        </strong>

                        <span>
                            Engaging People Into Christ
                        </span>
                    </div>
                </div>

                <div className="epic-footer-links">

                    <button
                        type="button"
                        onClick={() =>
                            onNavigate(
                                "landing"
                            )
                        }
                    >
                        Home
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            onNavigate(
                                "opt-in"
                            )
                        }
                    >
                        Free Demo
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            onNavigate(
                                "contact"
                            )
                        }
                    >
                        Contact
                    </button>

                </div>

                <div className="epic-footer-copy">
                    © {new Date().getFullYear()} EPIC
                    Church Management System
                </div>

            </footer>

        </div>
    );
};

export default OfferPage;

