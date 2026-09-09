import React, { useState } from "react";
import PublicHeader from "../components/PublicHeader";
import {
    Check,
    Sparkles,
    ShieldCheck,
    Zap,
    Download,
    GraduationCap,
    Clock,
    Award,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    ArrowRight,
    QrCode,
    FileText,
    Users,
} from "lucide-react";
import "./OfferPage.css";

interface OfferPageProps {
    onNavigate: (page: string) => void;
}

type PillarCategory = "saas" | "courses" | "products";
type BillingCycle = "monthly" | "yearly";

interface SaasPlan {
    id: string;
    name: string;
    badge?: string;
    popular?: boolean;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
    highlightFeature: string;
}

interface CourseItem {
    id: string;
    name: string;
    badge?: string;
    popular?: boolean;
    description: string;
    price: number;
    billingType: "One-Time" | "Annual Access";
    duration: string;
    modulesCount: number;
    features: string[];
}

interface ProductItem {
    id: string;
    name: string;
    badge?: string;
    popular?: boolean;
    description: string;
    price: number;
    fileFormats: string;
    features: string[];
}

const SAAS_PLANS: SaasPlan[] = [
    {
        id: "starter",
        name: "EPIC Starter",
        description: "Essential church administration tools for growing congregations and local fellowships.",
        monthlyPrice: 999,
        yearlyPrice: 9990,
        highlightFeature: "Up to 250 Active Members",
        features: [
            "Church Operations Dashboard",
            "Member Directory & Profiles",
            "Church Services & Schedules",
            "Attendance Tracking Desk",
            "First-Time Visitor Management",
            "Weekly & Monthly Summary Reports",
            "Cloud Multi-Device Synchronization",
            "Standard Email Support",
        ],
    },
    {
        id: "growth",
        name: "EPIC Growth",
        badge: "MOST POPULAR",
        popular: true,
        description: "The complete, all-in-one church operations system for active, thriving ministries.",
        monthlyPrice: 1999,
        yearlyPrice: 19990,
        highlightFeature: "Up to 1,000 Active Members",
        features: [
            "Everything in Starter Plan",
            "Giving & Tithes Management",
            "Income & Expense Ledgers",
            "Ministries & Points Leaderboard",
            "Event Planning & Management",
            "Member Attendance Detail Reports",
            "Dedicated Client Church Portal",
            "GCash & Maya Giving Support",
            "Priority Technical Support",
        ],
    },
    {
        id: "complete",
        name: "EPIC Complete",
        badge: "BEST VALUE",
        description: "The full digital church ecosystem with integrated discipleship, analytics, and VIP care.",
        monthlyPrice: 2999,
        yearlyPrice: 29990,
        highlightFeature: "Unlimited Members & Ministries",
        features: [
            "Everything in Growth Plan",
            "Integrated EPIC Academy LMS",
            "Online Discipleship Tracking",
            "Automated Course Certificates",
            "Church Website Analytics",
            "Multi-Campus & Role Permissions",
            "Custom Data Exports & PDF Reports",
            "VIP Dedicated Support & Training",
        ],
    },
];

const DIGITAL_COURSES: CourseItem[] = [
    {
        id: "course-foundations",
        name: "Foundations of Faith Masterclass",
        badge: "CERTIFICATE COURSE",
        description: "A comprehensive discipleship curriculum designed for new believers, baptismal classes, and cell groups.",
        price: 499,
        billingType: "One-Time",
        duration: "Self-Paced • 6 Modules",
        modulesCount: 6,
        features: [
            "6 Foundational Video & Text Modules",
            "30 Structured Discipleship Lessons",
            "Printable PDF Reflection Worksheets",
            "Theological Pillar Study Notes",
            "Certified Disciple Digital Diploma",
            "Lifetime Personal Access",
        ],
    },
    {
        id: "course-leadership",
        name: "Church Leadership & Ministry Mastery",
        badge: "PASTOR & LEADER LEVEL",
        popular: true,
        description: "Equip elders, deacons, and ministry heads with modern leadership, conflict resolution, and stewardship skills.",
        price: 1499,
        billingType: "One-Time",
        duration: "10-Session Intensive",
        modulesCount: 10,
        features: [
            "10 Leadership & Administration Sessions",
            "Ministry Health & Evaluation Rubrics",
            "Volunteer Recruitment & Retention Systems",
            "Biblical Leadership Principles",
            "Ministry Head Certificate of Completion",
            "Includes Printable Leader Manuals",
        ],
    },
    {
        id: "course-all-access",
        name: "EPIC Academy All-Access Scholar Pass",
        badge: "WHOLE CHURCH PASS",
        description: "Unlock the entire EPIC Academy curriculum for your entire congregation and all ministry team scholars.",
        price: 2499,
        billingType: "Annual Access",
        duration: "12 Months All-Access",
        modulesCount: 20,
        features: [
            "Full Access to All Current & Future Courses",
            "Unlimited Congregation Student Accounts",
            "Live Discipleship Progress Tracking",
            "Ladder Board of Success Integration",
            "Automated Graduation Diplomas",
            "Quarterly Theological Updates",
        ],
    },
];

const DIGITAL_PRODUCTS: ProductItem[] = [
    {
        id: "product-admin-suite",
        name: "Church Administration & Policy Suite",
        badge: "INSTANT DOWNLOAD",
        description: "Legally reviewed, customizable church governance documents, constitution templates, and policies.",
        price: 799,
        fileFormats: "DOCX • PDF • Google Docs",
        features: [
            "Church Constitution & Bylaws Template",
            "Pastoral & Staff Employment Agreements",
            "Volunteer Safety & Child Protection Policy",
            "Ministry Team Job Descriptions & Rubrics",
            "Usher & Protocol Service Handbooks",
            "100% Editable in Microsoft Word / Docs",
        ],
    },
    {
        id: "product-media-pack",
        name: "Worship Media & Sermon Slide Pack",
        badge: "150+ ASSETS",
        description: "High-definition worship backgrounds, title slides, countdowns, and presentation decks ready to project.",
        price: 999,
        fileFormats: "1080p MP4 • PPTX • Canva Links",
        features: [
            "150+ Motion Video Backgrounds (1080p)",
            "20 Complete Sermon Slide Themes",
            "5-Minute Pre-Service Countdowns",
            "Offering, Communion & Welcome Title Cards",
            "Editable Canva & PowerPoint Templates",
            "Royalty-Free for Sanctuary & Live Stream",
        ],
    },
    {
        id: "product-financial-suite",
        name: "Church Financial Ledgers & Stewardship Suite",
        badge: "EXCEL & SHEETS",
        description: "Automated church bookkeeping spreadsheets, tithe reconciliation formulas, and annual budget templates.",
        price: 1299,
        fileFormats: "XLSX • Google Sheets",
        features: [
            "Automated Tithes & Offering Calculator",
            "GCash & Maya Giving Reconciliation Tab",
            "Departmental Budget Tracking Spreadsheets",
            "Automated Donor Contribution Statements",
            "Year-End Financial Audit & Statement Sheet",
            "Video Tutorial on Church Bookkeeping",
        ],
    },
    {
        id: "product-launch-bundle",
        name: "Complete Church Starter Launch Kit",
        badge: "BEST VALUE BUNDLE",
        popular: true,
        description: "The complete suite: Admin Documents, Worship Media Pack, and Financial Bookkeeping Suite all in one.",
        price: 1999,
        fileFormats: "Full Digital Archive (.ZIP)",
        features: [
            "Everything in Admin & Policy Suite",
            "Everything in Worship Media Pack",
            "Everything in Financial Stewardship Suite",
            "Church Launch 90-Day Implementation Checklist",
            "Over ₱3,097 Total Value (Save 35%)",
            "Lifetime Access & Free Template Updates",
        ],
    },
];

const FAQS = [
    {
        question: "Can I upgrade or change my plan anytime?",
        answer: "Yes! You can upgrade your SaaS subscription tier at any time from your church portal. Upgrades take effect immediately and are prorated so you only pay the difference.",
    },
    {
        question: "How do Digital Course enrollments work?",
        answer: "When you enroll in an EPIC Academy course, your account is immediately granted access to all lessons, videos, and study notes. You can learn at your own pace and receive an official certificate upon completion.",
    },
    {
        question: "How do I receive my Digital Products after purchase?",
        answer: "Digital Products (Toolkits, Media Packs, Spreadsheets) are delivered immediately via a secure download link on your receipt page and emailed to your address. You can download and edit them right away in Microsoft Office, Canva, or Google Docs.",
    },
    {
        question: "What payment methods are supported?",
        answer: "We support real-time Philippine payments via GCash, Maya, and Bank Transfer / GoTyme with instant verification and zero transaction surcharge.",
    },
    {
        question: "Is there a free trial for the Church Management SaaS?",
        answer: "Yes! All church management plans come with a 30-day satisfaction guarantee and free onboarding guidance. If you ever need help, our team provides step-by-step assistance.",
    },
    {
        question: "Is my church data safe and private?",
        answer: "Absolutely. EPIC utilizes tenant-isolated SQL databases, 256-bit SSL encryption, and strict role-based access control so your members' private records, giving data, and pastoral notes remain confidential.",
    },
];

const OfferPage: React.FC<OfferPageProps> = ({ onNavigate }) => {
    const [category, setCategory] = useState<PillarCategory>("saas");
    const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const handleSelectSaas = (plan: SaasPlan) => {
        const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
        localStorage.setItem("epicSelectedPlan", plan.id);
        localStorage.setItem("epicSelectedPlanName", plan.name);
        localStorage.setItem("epicBillingCycle", billingCycle);
        localStorage.setItem("epicCheckoutAmount", String(price));
        localStorage.setItem("epicSelectedItemType", "saas");
        localStorage.setItem("epicSelectedItemBadge", plan.badge || "");
        onNavigate("checkout");
    };

    const handleSelectCourse = (course: CourseItem) => {
        localStorage.setItem("epicSelectedPlan", course.id);
        localStorage.setItem("epicSelectedPlanName", course.name);
        localStorage.setItem("epicBillingCycle", course.billingType === "Annual Access" ? "yearly" : "one-time");
        localStorage.setItem("epicCheckoutAmount", String(course.price));
        localStorage.setItem("epicSelectedItemType", "course");
        localStorage.setItem("epicSelectedItemBadge", course.badge || "");
        onNavigate("checkout");
    };

    const handleSelectProduct = (product: ProductItem) => {
        localStorage.setItem("epicSelectedPlan", product.id);
        localStorage.setItem("epicSelectedPlanName", product.name);
        localStorage.setItem("epicBillingCycle", "one-time");
        localStorage.setItem("epicCheckoutAmount", String(product.price));
        localStorage.setItem("epicSelectedItemType", "product");
        localStorage.setItem("epicSelectedItemBadge", product.badge || "");
        onNavigate("checkout");
    };

    const formatCurrency = (val: number) => {
        return "₱" + val.toLocaleString("en-PH");
    };

    return (
        <div className="epic-offer-page">
            <PublicHeader onNavigate={onNavigate} />

            {/* HERO BANNER */}
            <section className="offer-hero">
                <div className="offer-hero-inner">
                    <div className="offer-eyebrow">
                        <Sparkles size={16} />
                        <span>TRANSPARENT KINGDOM SOLUTIONS &bull; ZERO HIDDEN FEES</span>
                    </div>

                    <h1>
                        Empower Your Church with <span>Software, Courses &amp; Tools</span>
                    </h1>

                    <p className="offer-subtitle">
                        Select from cloud-hosted Church Management SaaS subscriptions, in-depth discipleship masterclasses from EPIC Academy, or instantly downloadable ministry toolkits.
                    </p>

                    {/* THREE PILLARS TAB SELECTOR */}
                    <div className="offer-pillar-tabs" role="tablist">
                        <button
                            type="button"
                            className={`offer-pillar-btn ${category === "saas" ? "is-active" : ""}`}
                            onClick={() => setCategory("saas")}
                        >
                            <span className="pillar-icon">⛪</span>
                            <div className="pillar-btn-text">
                                <strong>Church Management SaaS</strong>
                                <small>Cloud software &amp; operations</small>
                            </div>
                        </button>

                        <button
                            type="button"
                            className={`offer-pillar-btn ${category === "courses" ? "is-active" : ""}`}
                            onClick={() => setCategory("courses")}
                        >
                            <span className="pillar-icon">🎓</span>
                            <div className="pillar-btn-text">
                                <strong>Digital Discipleship Courses</strong>
                                <small>EPIC Academy certifications</small>
                            </div>
                        </button>

                        <button
                            type="button"
                            className={`offer-pillar-btn ${category === "products" ? "is-active" : ""}`}
                            onClick={() => setCategory("products")}
                        >
                            <span className="pillar-icon">📦</span>
                            <div className="pillar-btn-text">
                                <strong>Digital Products &amp; Toolkits</strong>
                                <small>Downloadable media &amp; templates</small>
                            </div>
                        </button>
                    </div>

                    {/* BILLING CYCLE TOGGLE (FOR SAAS ONLY) */}
                    {category === "saas" && (
                        <div className="offer-billing-toggle-wrap">
                            <span className={`toggle-label ${billingCycle === "monthly" ? "active" : ""}`}>
                                Monthly Billing
                            </span>
                            <button
                                type="button"
                                className={`offer-toggle-switch ${billingCycle === "yearly" ? "yearly" : ""}`}
                                onClick={() =>
                                    setBillingCycle((prev) => (prev === "monthly" ? "yearly" : "monthly"))
                                }
                                aria-label="Toggle billing cycle"
                            >
                                <span className="toggle-thumb" />
                            </button>
                            <span className={`toggle-label ${billingCycle === "yearly" ? "active" : ""}`}>
                                Annual Billing
                                <span className="discount-pill">Save 20% &bull; 2 Months Free</span>
                            </span>
                        </div>
                    )}
                </div>
            </section>

            {/* MAIN CONTENT AREA */}
            <main className="offer-content-container">

                {/* =========================================================
                    PILLAR 1: SAAS CHURCH MANAGEMENT
                ========================================================= */}
                {category === "saas" && (
                    <section className="offer-section">
                        <div className="offer-cards-grid">
                            {SAAS_PLANS.map((plan) => {
                                const monthlyEquiv = Math.round(plan.yearlyPrice / 12);

                                return (
                                    <div
                                        key={plan.id}
                                        className={`offer-card ${plan.popular ? "is-featured" : ""}`}
                                    >
                                        {plan.badge && (
                                            <div className="offer-card-badge">
                                                {plan.badge}
                                            </div>
                                        )}

                                        <div className="offer-card-top">
                                            <h3>{plan.name}</h3>
                                            <p>{plan.description}</p>
                                        </div>

                                        <div className="offer-card-price-box">
                                            <div className="offer-price">
                                                <span className="offer-price-currency">₱</span>
                                                <span className="offer-price-amount">
                                                    {billingCycle === "monthly"
                                                        ? plan.monthlyPrice.toLocaleString()
                                                        : monthlyEquiv.toLocaleString()}
                                                </span>
                                                <span className="offer-price-period">/ month</span>
                                            </div>

                                            {billingCycle === "yearly" && (
                                                <div className="offer-billing-detail">
                                                    Billed annually at {formatCurrency(plan.yearlyPrice)}/yr
                                                </div>
                                            )}

                                            <div className="offer-highlight-pill">
                                                <Users size={14} />
                                                <span>{plan.highlightFeature}</span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className={`offer-cta-button ${plan.popular ? "is-primary" : "is-secondary"}`}
                                            onClick={() => handleSelectSaas(plan)}
                                        >
                                            Get Started with {plan.name}
                                            <ArrowRight size={16} />
                                        </button>

                                        <div className="offer-card-features-list">
                                            <div className="features-list-title">Everything Included:</div>
                                            <ul>
                                                {plan.features.map((feat, idx) => (
                                                    <li key={idx}>
                                                        <Check size={16} className="feature-check-icon" />
                                                        <span>{feat}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* =========================================================
                    PILLAR 2: DIGITAL COURSES & ACADEMY
                ========================================================= */}
                {category === "courses" && (
                    <section className="offer-section">
                        <div className="offer-cards-grid">
                            {DIGITAL_COURSES.map((course) => (
                                <div
                                    key={course.id}
                                    className={`offer-card ${course.popular ? "is-featured" : ""}`}
                                >
                                    {course.badge && (
                                        <div className="offer-card-badge">
                                            {course.badge}
                                        </div>
                                    )}

                                    <div className="offer-card-top">
                                        <div className="offer-course-category-tag">
                                            <GraduationCap size={15} />
                                            <span>EPIC ACADEMY</span>
                                        </div>
                                        <h3>{course.name}</h3>
                                        <p>{course.description}</p>
                                    </div>

                                    <div className="offer-card-price-box">
                                        <div className="offer-price">
                                            <span className="offer-price-currency">₱</span>
                                            <span className="offer-price-amount">
                                                {course.price.toLocaleString()}
                                            </span>
                                            <span className="offer-price-period">
                                                {course.billingType === "Annual Access" ? "/ year" : "one-time"}
                                            </span>
                                        </div>

                                        <div className="offer-highlight-pill course-pill">
                                            <Clock size={14} />
                                            <span>{course.duration}</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className={`offer-cta-button ${course.popular ? "is-primary" : "is-secondary"}`}
                                        onClick={() => handleSelectCourse(course)}
                                    >
                                        Enroll in Masterclass
                                        <ArrowRight size={16} />
                                    </button>

                                    <div className="offer-card-features-list">
                                        <div className="features-list-title">What You'll Receive:</div>
                                        <ul>
                                            {course.features.map((feat, idx) => (
                                                <li key={idx}>
                                                    <Check size={16} className="feature-check-icon" />
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* =========================================================
                    PILLAR 3: DIGITAL PRODUCTS & TOOLKITS
                ========================================================= */}
                {category === "products" && (
                    <section className="offer-section">
                        <div className="offer-cards-grid grid-4-cols">
                            {DIGITAL_PRODUCTS.map((prod) => (
                                <div
                                    key={prod.id}
                                    className={`offer-card ${prod.popular ? "is-featured" : ""}`}
                                >
                                    {prod.badge && (
                                        <div className="offer-card-badge">
                                            {prod.badge}
                                        </div>
                                    )}

                                    <div className="offer-card-top">
                                        <div className="offer-course-category-tag product-tag">
                                            <Download size={14} />
                                            <span>DIGITAL DOWNLOAD</span>
                                        </div>
                                        <h3>{prod.name}</h3>
                                        <p>{prod.description}</p>
                                    </div>

                                    <div className="offer-card-price-box">
                                        <div className="offer-price">
                                            <span className="offer-price-currency">₱</span>
                                            <span className="offer-price-amount">
                                                {prod.price.toLocaleString()}
                                            </span>
                                            <span className="offer-price-period">one-time</span>
                                        </div>

                                        <div className="offer-highlight-pill product-pill">
                                            <FileText size={14} />
                                            <span>{prod.fileFormats}</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className={`offer-cta-button ${prod.popular ? "is-primary" : "is-secondary"}`}
                                        onClick={() => handleSelectProduct(prod)}
                                    >
                                        Get Instant Download
                                        <ArrowRight size={16} />
                                    </button>

                                    <div className="offer-card-features-list">
                                        <div className="features-list-title">Contents &amp; Templates:</div>
                                        <ul>
                                            {prod.features.map((feat, idx) => (
                                                <li key={idx}>
                                                    <Check size={16} className="feature-check-icon" />
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* =========================================================
                    TRUST GUARANTEE BAR
                ========================================================= */}
                <section className="offer-trust-banner">
                    <div className="trust-item">
                        <div className="trust-icon-box">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <strong>256-Bit SSL Encryption</strong>
                            <p>Bank-grade data security for all transactions and church databases.</p>
                        </div>
                    </div>

                    <div className="trust-item">
                        <div className="trust-icon-box">
                            <Zap size={24} />
                        </div>
                        <div>
                            <strong>Instant Activation</strong>
                            <p>Immediate digital asset delivery &amp; real-time church workspace setup.</p>
                        </div>
                    </div>

                    <div className="trust-item">
                        <div className="trust-icon-box">
                            <QrCode size={24} />
                        </div>
                        <div>
                            <strong>GCash &amp; Maya Verified</strong>
                            <p>Real-time Philippine mobile payments with zero extra transaction fees.</p>
                        </div>
                    </div>

                    <div className="trust-item">
                        <div className="trust-icon-box">
                            <Award size={24} />
                        </div>
                        <div>
                            <strong>30-Day Money-Back Guarantee</strong>
                            <p>Try EPIC completely risk-free with full support from our pastoral team.</p>
                        </div>
                    </div>
                </section>

                {/* =========================================================
                    FAQ ACCORDION
                ========================================================= */}
                <section className="offer-faq-section">
                    <div className="offer-faq-header">
                        <div className="offer-eyebrow small">
                            <HelpCircle size={15} />
                            <span>FREQUENTLY ASKED QUESTIONS</span>
                        </div>
                        <h2>Got Questions? We've Got Answers.</h2>
                        <p>Everything you need to know about our plans, academy courses, and digital tools.</p>
                    </div>

                    <div className="offer-faq-list">
                        {FAQS.map((faq, index) => {
                            const isOpen = openFaq === index;
                            return (
                                <div
                                    key={index}
                                    className={`offer-faq-item ${isOpen ? "is-open" : ""}`}
                                    onClick={() => setOpenFaq(isOpen ? null : index)}
                                >
                                    <div className="offer-faq-question">
                                        <span>{faq.question}</span>
                                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                    {isOpen && (
                                        <div className="offer-faq-answer">
                                            <p>{faq.answer}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* BOTTOM CALL TO ACTION */}
                <section className="offer-bottom-cta">
                    <h2>Need a Custom Solution for Your Church Network?</h2>
                    <p>
                        We provide multi-campus enterprise configurations, theological seminary licenses, and personalized ministry consultation.
                    </p>
                    <div className="bottom-cta-actions">
                        <button
                            type="button"
                            className="cta-primary-btn"
                            onClick={() => onNavigate("contact")}
                        >
                            Talk to Our Church Solutions Specialist
                            <ArrowRight size={16} />
                        </button>
                        <button
                            type="button"
                            className="cta-secondary-btn"
                            onClick={() => onNavigate("learning")}
                        >
                            Explore EPIC Academy
                        </button>
                    </div>
                </section>

            </main>

            {/* FOOTER */}
            <footer className="offer-footer">
                <div className="offer-footer-inner">
                    <div className="offer-footer-copy">
                        &copy; 2026 EPIC Church Management Platform &bull; Engaging People Into Christ. All rights reserved.
                    </div>
                    <div className="offer-footer-links">
                        <button type="button" onClick={() => onNavigate("home")}>Home</button>
                        <button type="button" onClick={() => onNavigate("learning")}>EPIC Academy</button>
                        <button type="button" onClick={() => onNavigate("giving")}>Giving</button>
                        <button type="button" onClick={() => onNavigate("contact")}>Contact</button>
                        <button type="button" onClick={() => onNavigate("client-login")}>Member Portal</button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default OfferPage;
