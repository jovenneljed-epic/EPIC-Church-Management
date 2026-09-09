import { useState, useEffect } from "react";
import PublicHeader from "../../components/PublicHeader";
import {
    Heart,
    Wallet,
    Building,
    Gift,
    ShieldCheck,
    CheckCircle2,
    Copy,
    Check,
    BookOpen,
    Sparkles,
    Smartphone,
    Users,
    ChevronDown,
    ChevronUp,
    Lock,
    HeartHandshake,
    Church,
    Landmark,
    ArrowRight,
    Printer,
    RefreshCw,
    X,
    FileText,
    QrCode,
    Download,
    Eye
} from "lucide-react";
import {
    recordPublicGiving,
    getGivingLedgerSummary
} from "../../services/givingService";
import type {
    PublicGivingReceipt,
    GivingLedgerSummary
} from "../../services/givingService";
import "./GivingPage.css";
import "./PublicUnisonTheme.css";

interface GivingPageProps {
    onNavigate?: (page: string) => void;
}

interface ScriptureItem {
    id: number;
    reference: string;
    theme: string;
    text: string;
    principle: string;
}

interface KingdomFund {
    id: string;
    name: string;
    givingType: string;
    category: string;
    description: string;
    icon: "wallet" | "gift" | "building" | "compass" | "heart" | "users";
    benefits: string[];
}

const SCRIPTURES: ScriptureItem[] = [
    {
        id: 1,
        reference: "Malachi 3:10",
        theme: "The Storehouse Tithe",
        text: '"Bring the whole tithe into the storehouse, that there may be food in my house. Test me in this," says the Lord Almighty, "and see if I will not throw open the floodgates of heaven and pour out so much blessing that there will not be room enough to store it."',
        principle: "Returning God's tenth acknowledges Him as sovereign provider."
    },
    {
        id: 2,
        reference: "2 Corinthians 9:6-7",
        theme: "Cheerful Generosity",
        text: '"Remember this: Whoever sows sparingly will also reap sparingly, and whoever sows generously will also reap generously. Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."',
        principle: "Giving is an act of joyful worship, never compulsion."
    },
    {
        id: 3,
        reference: "Proverbs 3:9-10",
        theme: "Honoring Firstfruits",
        text: '"Honor the Lord with your wealth, with the firstfruits of all your crops; then your barns will be filled to overflowing, and your vats will brim over with new wine."',
        principle: "Dedicate the first and best of your increase to God."
    },
    {
        id: 4,
        reference: "Luke 6:38",
        theme: "Kingdom Multiplication",
        text: '"Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap. For with the measure you use, it will be measured to you."',
        principle: "Generosity opens heavenly floodgates in God\'s timing."
    },
    {
        id: 5,
        reference: "1 Chronicles 29:14",
        theme: "Stewards of God's Grace",
        text: '"But who am I, and who are my people, that we should be able to give as generously as this? Everything comes from you, and we have given you only what comes from your hand."',
        principle: "We own nothing; we steward God\'s eternal riches."
    },
    {
        id: 6,
        reference: "Matthew 6:19-21",
        theme: "Heavenly Treasures",
        text: '"Do not store up for yourselves treasures on earth, where moths and vermin destroy... But store up for yourselves treasures in heaven. For where your treasure is, there your heart will be also."',
        principle: "Generous giving anchors our hearts in eternity."
    }
];

const KINGDOM_FUNDS: KingdomFund[] = [
    {
        id: "tithes",
        name: "Tithes (Firstfruits)",
        givingType: "TITHE",
        category: "Sacred Stewardship",
        description: "Returning God's 10% to sustain biblical teaching, pastoral ministry, and sanctuary worship services.",
        icon: "wallet",
        benefits: [
            "Pastoral care & spiritual shepherd support",
            "Sunday worship services & sacraments",
            "Discipleship literature & ministry resources"
        ]
    },
    {
        id: "offering",
        name: "General Love Offering",
        givingType: "OFFERING",
        category: "Worship & Praise",
        description: "Freewill offerings celebrating God's goodness and providing vital resources for ongoing church operations.",
        icon: "gift",
        benefits: [
            "Sanctuary audiovisual & livestream production",
            "Community hospitality & welcoming ministry",
            "Weekly prayer vigils & revival gatherings"
        ]
    },
    {
        id: "missions",
        name: "Missions & Church Planting",
        givingType: "MISSION",
        category: "Kingdom Outreach",
        description: "Reaching the unreached by planting rural churches, training church planters, and supporting missionaries.",
        icon: "compass",
        benefits: [
            "Monthly support for 12 missionary families",
            "New regional church plant developments",
            "Bibles & gospel tracts for unreached villages"
        ]
    },
    {
        id: "building",
        name: "Nehemiah Building Fund",
        givingType: "SPECIAL OFFERING",
        category: "Facility Expansion",
        description: "Dedicated capital investments for campus development, children's classrooms, and ministry center renovations.",
        icon: "building",
        benefits: [
            "Auditorium acoustics & seating expansion",
            "Safe, modern nursery & children classrooms",
            "Dedicated pastoral counseling & conference rooms"
        ]
    },
    {
        id: "benevolence",
        name: "Compassion & Benevolence",
        givingType: "SPECIAL OFFERING",
        category: "Luke 4:18 Mandate",
        description: "Direct aid providing emergency grocery bags, medical expense subsidies, and crisis care for families in need.",
        icon: "heart",
        benefits: [
            "Weekly hot meal community food pantry",
            "Emergency medical subsidies for vulnerable members",
            "Disaster relief kits for typhoon-affected areas"
        ]
    },
    {
        id: "youth",
        name: "NextGen & Camp Fund",
        givingType: "SPECIAL OFFERING",
        category: "Student Ministry",
        description: "Sponsoring students and youth leaders to attend life-transforming discipleship camps and campus outreaches.",
        icon: "users",
        benefits: [
            "Full & partial youth camp registrations",
            "High school & university Bible study hubs",
            "Music and audio gear for student worship band"
        ]
    }
];

const BANK_ACCOUNTS = [
    {
        id: "gcash",
        bankName: "GCash Mobile Wallet",
        accountType: "Verified Mobile Account & InstaPay QR",
        accountName: "RO***L A. (EPIC Church Authorized)",
        accountNumber: "0995-632-6245",
        rawNumber: "09956326245",
        icon: "gcash",
        badge: "Official InstaPay QR",
        qrImage: "/payment/gcash-qr.png",
        instructions: "Open GCash > Scan QR Code or Send Money > Enter 09956326245 (RO***L A.)"
    },
    {
        id: "maya",
        bankName: "Maya Business",
        accountType: "Verified Wallet & QR Ph",
        accountName: "RO***L A. / EPIC Church",
        accountNumber: "0995-632-6245",
        rawNumber: "09956326245",
        icon: "maya",
        badge: "Instant 0% Fee",
        instructions: "Open Maya App > Send Money > Enter 09956326245"
    },
    {
        id: "bdo",
        bankName: "BDO Unibank",
        accountType: "Current / Checking Account",
        accountName: "EPIC Church Ministries Foundation, Inc.",
        accountNumber: "0045-8021-9943",
        rawNumber: "004580219943",
        icon: "bdo",
        badge: "Bank Transfer / InstaPay",
        instructions: "Transfer to BDO Current Account: 0045-8021-9943"
    },
    {
        id: "bpi",
        bankName: "Bank of the Philippine Islands (BPI)",
        accountType: "Savings Account",
        accountName: "EPIC Church Ministries Foundation, Inc.",
        accountNumber: "3290-0192-84",
        rawNumber: "3290019284",
        icon: "bpi",
        badge: "Bank Transfer / InstaPay",
        instructions: "Transfer to BPI Savings Account: 3290-0192-84"
    }
];

const FAQS = [
    {
        question: "What is the difference between tithes and offerings?",
        answer: "A tithe is a biblical principle of returning the first 10% of our gross earnings or harvest back to God through the local church (Malachi 3:10). An offering is a freewill sacrificial gift given above and beyond the tithe for special purposes such as building projects, missionary support, or benevolence."
    },
    {
        question: "How do I give using the official GCash QR code or number?",
        answer: "You can either: 1) Open your GCash app and scan our official InstaPay QR code shown on this page, or 2) Choose Express Send and send directly to 0995-632-6245 (Registered Name: RO***L A.). Both methods work instantly with 0% fee."
    },
    {
        question: "Will I receive an Official Acknowledgment Receipt (OAR)?",
        answer: "Yes! Every transfer submitted through this One-Stop Giving Portal is immediately written to our real database. You are issued an official electronic receipt code (#EPIC-GIVE-XXXXXX), and an official confirmation email is dispatched to your inbox for tax and annual statement purposes."
    },
    {
        question: "Can I give anonymously if I prefer not to leave my name?",
        answer: "Yes! When recording your transfer, simply check \"Keep my giving anonymous in church reports\". The system will credit your gift to the church ledger under \"Anonymous Giver\", while still issuing you an official digital receipt for your records."
    },
    {
        question: "How does EPIC ensure financial transparency and integrity?",
        answer: "Financial integrity is sacred. EPIC Church adheres to rigorous dual-custody counting, certified CPA book audits, and regular oversight by our Board of Trustees. Comprehensive financial summaries are published openly for our church membership."
    }
];

export default function GivingPage({ onNavigate }: GivingPageProps) {
    const [selectedFundId, setSelectedFundId] = useState<string>("tithes");
    const [selectedAmount, setSelectedAmount] = useState<number>(1000);
    const [customAmount, setCustomAmount] = useState<string>("");
    const [frequency, setFrequency] = useState<"one-time" | "weekly" | "monthly">("one-time");
    const [selectedPayment, setSelectedPayment] = useState<string>("gcash");
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [showQrModal, setShowQrModal] = useState<boolean>(false);

    // Live Database Stats
    const [ledgerSummary, setLedgerSummary] = useState<GivingLedgerSummary | null>(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);

    // Modal & Submission State
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [receipt, setReceipt] = useState<PublicGivingReceipt | null>(null);

    // Modal Form Inputs
    const [donorName, setDonorName] = useState<string>("");
    const [donorEmail, setDonorEmail] = useState<string>("");
    const [donorPhone, setDonorPhone] = useState<string>("");
    const [referenceNumber, setReferenceNumber] = useState<string>("");
    const [prayerRequest, setPrayerRequest] = useState<string>("");
    const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

    const activeFund = KINGDOM_FUNDS.find((f) => f.id === selectedFundId) || KINGDOM_FUNDS[0];
    const finalAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;
    const activeAccount = BANK_ACCOUNTS.find((a) => a.id === selectedPayment) || BANK_ACCOUNTS[0];

    const fetchSummary = async () => {
        setIsSummaryLoading(true);
        try {
            const summary = await getGivingLedgerSummary();
            setLedgerSummary(summary);
        } catch (err) {
            console.error("Failed to load giving ledger summary:", err);
        } finally {
            setIsSummaryLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    const handleCopy = (text: string, fieldKey: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            setCopiedField(fieldKey);
            setTimeout(() => setCopiedField(null), 2200);
        }
    };

    const toggleFaq = (index: number) => {
        setOpenFaq((prev) => (prev === index ? null : index));
    };

    const handleOpenModal = () => {
        if (finalAmount <= 0) {
            alert("Please select or enter a valid giving amount greater than ₱0.");
            return;
        }
        setSubmitError(null);
        setIsModalOpen(true);
    };

    const handleSubmitGiving = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        if (finalAmount <= 0) {
            setSubmitError("Giving amount must be greater than zero.");
            return;
        }

        if (!isAnonymous && !donorName.trim()) {
            setSubmitError("Please enter your name or select 'Keep my giving anonymous'.");
            return;
        }

        if (!donorEmail.trim()) {
            setSubmitError("Please provide an email address so we can send your official acknowledgment receipt.");
            return;
        }

        if (!referenceNumber.trim()) {
            setSubmitError("Please enter the GCash / Maya / Bank reference number from your transfer confirmation.");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await recordPublicGiving({
                amount: finalAmount,
                givingType: activeFund.givingType,
                paymentMethod: activeAccount.bankName,
                referenceNumber: referenceNumber.trim(),
                donorName: isAnonymous ? "Anonymous Giver" : donorName.trim(),
                donorEmail: donorEmail.trim(),
                donorPhone: donorPhone.trim(),
                frequency: frequency === "one-time" ? "One-Time Gift" : `Recurring (${frequency})`,
                prayerRequest: prayerRequest.trim(),
                isAnonymous
            });

            setReceipt(result);
            setIsModalOpen(false);
            fetchSummary(); // Refresh live count
        } catch (err: any) {
            setSubmitError(err.message || "Failed to record giving transfer. Please check your connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetGiving = () => {
        setReceipt(null);
        setReferenceNumber("");
        setPrayerRequest("");
    };

    const handlePrintReceipt = () => {
        window.print();
    };

    const renderFundIcon = (iconName: string) => {
        switch (iconName) {
            case "wallet":
                return <Wallet size={20} />;
            case "gift":
                return <Gift size={20} />;
            case "building":
                return <Building size={20} />;
            case "heart":
                return <Heart size={20} />;
            case "users":
                return <Users size={20} />;
            default:
                return <Church size={20} />;
        }
    };

    return (
        <div className="epic-public-giving">
            <PublicHeader onNavigate={onNavigate} />

            {/* HERO BANNER */}
            <section className="giving-hero-section">
                <div className="giving-hero-inner">
                    <span className="giving-badge">
                        <Sparkles size={14} /> ONE-STOP CASHLESS STEWARDSHIP PORTAL
                    </span>
                    <h1 className="giving-hero-title">
                        Worship Through Giving &amp; Generosity
                    </h1>
                    <p className="giving-hero-subtitle">
                        Honoring God with our firstfruits, sustaining church ministries, empowering
                        regional missions, and extending compassionate care through verified cashless
                        giving on <strong>GCash</strong>, <strong>Maya</strong>, and registered bank accounts.
                    </p>

                    <div className="giving-hero-stats">
                        <div className="giving-hero-stat-card">
                            <strong>100%</strong>
                            <span>Audited &amp; Accountable</span>
                        </div>
                        <div className="giving-hero-stat-card">
                            <strong>0995-632-6245</strong>
                            <span>Real GCash &amp; Maya</span>
                        </div>
                        <div className="giving-hero-stat-card">
                            <strong>6</strong>
                            <span>Dedicated Kingdom Funds</span>
                        </div>
                        <div className="giving-hero-stat-card">
                            <strong>Instant</strong>
                            <span>Official Receipts Issued</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* LIVE STEWARDSHIP DATABASE CONNECTION BAR */}
            <div className="stewardship-db-banner-wrap">
                <div className="stewardship-db-bar">
                    <div className="stewardship-db-info">
                        <span className="live-db-dot" />
                        <div>
                            <div className="stewardship-db-title">
                                <strong>Real Stewardship Database Connected</strong>
                                <span className="db-badge">EPICChurchDB &bull; Givings Ledger</span>
                            </div>
                            <span className="stewardship-db-status">
                                {ledgerSummary
                                    ? `${ledgerSummary.totalGiftsRecorded} Electronic Gifts Logged in Ledger `
                                    : "Real-time sync active "}
                                &bull; Official Digital Receipts Dispatched via Resend
                            </span>
                        </div>
                    </div>
                    <div className="stewardship-db-actions">
                        <button
                            type="button"
                            className="db-refresh-btn"
                            onClick={fetchSummary}
                            disabled={isSummaryLoading}
                            title="Refresh database records count"
                        >
                            <RefreshCw size={13} className={isSummaryLoading ? "spin" : ""} />
                            <span>{isSummaryLoading ? "Syncing..." : "Refresh Ledger"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* FEATURED SCRIPTURE BANNER */}
            <div className="featured-verse-banner">
                <div className="featured-verse-card">
                    <div className="featured-verse-icon-wrap">
                        <BookOpen size={28} />
                    </div>
                    <div className="featured-verse-content">
                        <span className="featured-verse-tag">Scripture Foundation</span>
                        <p className="featured-verse-quote">{SCRIPTURES[0].text}</p>
                        <span className="featured-verse-ref">
                            {SCRIPTURES[0].reference} &bull; {SCRIPTURES[0].theme}
                        </span>
                    </div>
                </div>
            </div>

            <main className="giving-container">
                {/* INTERACTIVE GIVING CALCULATOR & DIGITAL SLIP */}
                <div className="giving-section-header">
                    <span className="giving-section-tag">Electronic Stewardship</span>
                    <h2 className="giving-section-title">One-Stop Electronic Giving Hub</h2>
                    <p className="giving-section-desc">
                        Prepare your electronic giving slip below. Select your designated fund,
                        gift amount, and preferred cashless channel (GCash, Maya, BDO, BPI).
                    </p>
                </div>

                <div className="giving-interactive-grid">
                    {/* LEFT PANEL: CONFIGURATOR */}
                    <div className="giving-card-panel">
                        <h3 className="panel-title">
                            <Wallet size={20} /> 1. Select Kingdom Fund
                        </h3>
                        <p className="panel-subtitle">
                            Choose the ministry or initiative you feel led to support today.
                        </p>

                        <div className="fund-pills-grid">
                            {KINGDOM_FUNDS.map((fund) => {
                                const isSelected = selectedFundId === fund.id;
                                return (
                                    <button
                                        key={fund.id}
                                        type="button"
                                        className={`fund-pill-button ${isSelected ? "active" : ""}`}
                                        onClick={() => setSelectedFundId(fund.id)}
                                    >
                                        <div className="fund-pill-icon">{renderFundIcon(fund.icon)}</div>
                                        <div className="fund-pill-info">
                                            <strong>{fund.name}</strong>
                                            <small>{fund.category}</small>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <label className="form-group-label">2. Select or Enter Amount (PHP)</label>
                        <div className="amount-presets-grid">
                            {[500, 1000, 2500, 5000, 10000].map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    className={`amount-preset-btn ${
                                        !customAmount && selectedAmount === amt ? "active" : ""
                                    }`}
                                    onClick={() => {
                                        setSelectedAmount(amt);
                                        setCustomAmount("");
                                    }}
                                >
                                    &#8369;{amt.toLocaleString()}
                                </button>
                            ))}
                            <button
                                type="button"
                                className={`amount-preset-btn ${customAmount ? "active" : ""}`}
                                onClick={() => {
                                    if (!customAmount) setCustomAmount("1500");
                                }}
                            >
                                Custom
                            </button>
                        </div>

                        <div className="custom-amount-wrap">
                            <span className="custom-amount-prefix">&#8369;</span>
                            <input
                                type="number"
                                className="custom-amount-input"
                                placeholder="Or enter specific amount (e.g. 3500)"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                            />
                        </div>

                        <label className="form-group-label">3. Giving Frequency</label>
                        <div className="frequency-tabs">
                            <button
                                type="button"
                                className={`frequency-tab-btn ${frequency === "one-time" ? "active" : ""}`}
                                onClick={() => setFrequency("one-time")}
                            >
                                One-Time Gift
                            </button>
                            <button
                                type="button"
                                className={`frequency-tab-btn ${frequency === "weekly" ? "active" : ""}`}
                                onClick={() => setFrequency("weekly")}
                            >
                                Weekly Tithe
                            </button>
                            <button
                                type="button"
                                className={`frequency-tab-btn ${frequency === "monthly" ? "active" : ""}`}
                                onClick={() => setFrequency("monthly")}
                            >
                                Monthly Partnership
                            </button>
                        </div>

                        <label className="form-group-label">4. Select Payment Channel</label>
                        <div className="payment-methods-grid">
                            {BANK_ACCOUNTS.map((acc) => (
                                <button
                                    key={acc.id}
                                    type="button"
                                    className={`payment-method-card ${
                                        selectedPayment === acc.id ? "active" : ""
                                    }`}
                                    onClick={() => setSelectedPayment(acc.id)}
                                >
                                    {acc.id === "gcash" || acc.id === "maya" ? (
                                        <Smartphone size={22} color="#1877f2" />
                                    ) : (
                                        <Landmark size={22} color="#1877f2" />
                                    )}
                                    <div className="payment-method-info">
                                        <strong>{acc.bankName}</strong>
                                        <small>{acc.accountType}</small>
                                    </div>
                                    <span className="payment-badge">{acc.badge}</span>
                                </button>
                            ))}
                        </div>

                        {/* MOBILE APP QUICK INSTRUCTION */}
                        <div className="channel-instruction-box">
                            <strong>Quick Transfer Guide:</strong>
                            <p>{activeAccount.instructions}</p>
                        </div>
                    </div>

                    {/* RIGHT PANEL: DIGITAL SLIP OR OFFICIAL RECEIPT */}
                    <aside className="giving-slip-card">
                        {receipt ? (
                            /* OFFICIAL DIGITAL RECEIPT CERTIFICATE */
                            <div className="official-receipt-view">
                                <div className="receipt-banner">
                                    <span className="receipt-seal">
                                        <CheckCircle2 size={16} /> OFFICIAL RECEIPT
                                    </span>
                                    <span className="receipt-code">{receipt.receiptNumber}</span>
                                </div>

                                <div className="receipt-church-header">
                                    <h3>EPIC CHURCH STEWARDSHIP</h3>
                                    <small>Official Electronic Contribution Acknowledgment</small>
                                </div>

                                <div className="receipt-amount-display">
                                    <span className="receipt-amount-label">AMOUNT RECEIVED</span>
                                    <div className="receipt-amount-number">
                                        &#8369;{receipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <span className="receipt-status-pill">&#10003; Recorded in MSSQL Ledger</span>
                                </div>

                                <div className="receipt-details-list">
                                    <div className="receipt-row">
                                        <span>Giver / Partner:</span>
                                        <strong>{receipt.donorName}</strong>
                                    </div>
                                    <div className="receipt-row">
                                        <span>Designation:</span>
                                        <strong>{receipt.givingType}</strong>
                                    </div>
                                    <div className="receipt-row">
                                        <span>Payment Channel:</span>
                                        <strong>{receipt.paymentMethod}</strong>
                                    </div>
                                    <div className="receipt-row">
                                        <span>Transaction Ref #:</span>
                                        <strong style={{ fontFamily: "monospace", color: "#1877f2" }}>
                                            {receipt.referenceNumber}
                                        </strong>
                                    </div>
                                    <div className="receipt-row">
                                        <span>Date &amp; Time:</span>
                                        <span>{new Date(receipt.givingDate).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="receipt-scripture-box">
                                    <em>
                                        &ldquo;Bring the whole tithe into the storehouse... see if I will not throw open
                                        the floodgates of heaven.&rdquo;
                                    </em>
                                    <small>&mdash; Malachi 3:10</small>
                                </div>

                                <p className="receipt-email-notice">
                                    A formal electronic acknowledgment receipt has been dispatched to your email.
                                </p>

                                <div className="receipt-actions">
                                    <button type="button" className="receipt-print-btn" onClick={handlePrintReceipt}>
                                        <Printer size={15} /> Print / Save Receipt
                                    </button>
                                    <button
                                        type="button"
                                        className={`receipt-copy-btn ${copiedField === "receipt-code" ? "copied" : ""}`}
                                        onClick={() => handleCopy(receipt.receiptNumber, "receipt-code")}
                                    >
                                        {copiedField === "receipt-code" ? (
                                            <>
                                                <Check size={14} /> Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} /> Copy Ref Code
                                            </>
                                        )}
                                    </button>
                                </div>

                                <button type="button" className="receipt-reset-btn" onClick={handleResetGiving}>
                                    &larr; Make Another Contribution
                                </button>
                            </div>
                        ) : (
                            /* PENDING DIGITAL GIVING SLIP */
                            <>
                                <div className="giving-slip-header">
                                    <div className="giving-slip-logo-title">
                                        EPIC CHURCH STEWARDSHIP
                                        <small>One-Stop Digital Giving Slip</small>
                                    </div>
                                    <div className="giving-slip-ref-code">
                                        <span>Payment Channel</span>
                                        <code>{activeAccount.bankName.split(" ")[0].toUpperCase()}</code>
                                    </div>
                                </div>

                                <div className="giving-slip-amount-box">
                                    <span className="giving-slip-amount-label">
                                        {frequency.toUpperCase()} {activeFund.name.toUpperCase()}
                                    </span>
                                    <div className="giving-slip-amount-val">
                                        &#8369;{finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>

                                <div className="giving-slip-rows">
                                    <div className="giving-slip-row">
                                        <span>Designation:</span>
                                        <span>{activeFund.name}</span>
                                    </div>
                                    <div className="giving-slip-row">
                                        <span>Category:</span>
                                        <span>{activeFund.category}</span>
                                    </div>
                                    <div className="giving-slip-row">
                                        <span>Frequency:</span>
                                        <span>{frequency === "one-time" ? "One-Time Gift" : `Recurring (${frequency})`}</span>
                                    </div>
                                    <div className="giving-slip-row">
                                        <span>Payment Channel:</span>
                                        <span>{activeAccount.bankName}</span>
                                    </div>
                                </div>

                                {/* REAL GCASH INSTAPAY QR CODE EMBEDDED BOX */}
                                {activeAccount.id === "gcash" && (
                                    <div className="gcash-qr-embed-card">
                                        <div className="qr-card-header">
                                            <div className="qr-badge-inline">
                                                <QrCode size={14} /> InstaPay Official QR
                                            </div>
                                            <button
                                                type="button"
                                                className="qr-view-full-btn"
                                                onClick={() => setShowQrModal(true)}
                                                title="View Full-Screen QR"
                                            >
                                                <Eye size={12} /> View Full
                                            </button>
                                        </div>
                                        <div
                                            className="qr-image-wrapper clickable"
                                            onClick={() => setShowQrModal(true)}
                                            title="Click to view full-size QR code"
                                        >
                                            <img
                                                src="/payment/gcash-qr.png"
                                                alt="Official GCash InstaPay QR Code RO***L A."
                                                className="gcash-qr-image"
                                            />
                                        </div>
                                        <div className="qr-account-tag">
                                            <strong>RO***L A.</strong>
                                            <span>Scan with GCash, Maya, or any InstaPay Bank App</span>
                                        </div>
                                    </div>
                                )}

                                {/* VERIFIED ACCOUNT BOX WITH 1-CLICK COPY */}
                                <div className="verified-account-box">
                                    <div className="verified-account-header">
                                        <span className="verified-account-badge">
                                            <ShieldCheck size={16} /> Verified Account
                                        </span>
                                        <small style={{ color: "#65676b", fontSize: "11px", fontWeight: 700 }}>
                                            {activeAccount.accountName}
                                        </small>
                                    </div>
                                    <div className="verified-account-number">
                                        <code>{activeAccount.accountNumber}</code>
                                        <button
                                            type="button"
                                            className={`copy-btn ${copiedField === "slip-acc" ? "copied" : ""}`}
                                            onClick={() => handleCopy(activeAccount.rawNumber, "slip-acc")}
                                            title="Copy clean mobile number to clipboard"
                                        >
                                            {copiedField === "slip-acc" ? (
                                                <>
                                                    <Check size={14} /> Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={14} /> Copy Number
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <p className="giving-slip-notice">
                                    Transfer to <strong>{activeAccount.accountNumber}</strong> ({activeAccount.accountName}).
                                    Once completed, click the button below to submit your reference number and receive your official receipt!
                                </p>

                                <button
                                    type="button"
                                    className="giving-slip-action-btn"
                                    onClick={handleOpenModal}
                                >
                                    <Lock size={16} /> I Have Completed This Transfer
                                </button>
                            </>
                        )}
                    </aside>
                </div>

                {/* MODAL: FULL-SIZE QR CODE PREVIEW */}
                {showQrModal && (
                    <div className="giving-modal-backdrop" onClick={() => setShowQrModal(false)}>
                        <div className="qr-modal-dialog" onClick={(e) => e.stopPropagation()}>
                            <div className="qr-modal-header">
                                <div>
                                    <span className="modal-tag">OFFICIAL GCASH INSTAPAY QR</span>
                                    <h3 style={{ margin: "2px 0 0", fontSize: "18px", fontWeight: 800, color: "#050505" }}>
                                        Scan to Give &bull; RO***L A.
                                    </h3>
                                    <small style={{ color: "#65676b" }}>Mobile: 0995-632-6245</small>
                                </div>
                                <button type="button" className="giving-modal-close" onClick={() => setShowQrModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="qr-modal-body">
                                <img
                                    src="/payment/gcash-qr.png"
                                    alt="Full Size Official GCash QR"
                                    className="qr-modal-image"
                                />
                            </div>
                            <div className="qr-modal-footer">
                                <a
                                    href="/payment/gcash-qr.png"
                                    download="EPIC_Church_GCash_QR.png"
                                    className="qr-download-btn"
                                >
                                    <Download size={14} /> Download QR Image
                                </a>
                                <button
                                    type="button"
                                    className="qr-copy-btn"
                                    onClick={() => handleCopy("09956326245", "modal-qr-copy")}
                                >
                                    {copiedField === "modal-qr-copy" ? "Copied 09956326245!" : "Copy 09956326245"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: COMPLETE & RECORD TRANSFER */}
                {isModalOpen && (
                    <div className="giving-modal-backdrop" onClick={() => !isSubmitting && setIsModalOpen(false)}>
                        <div className="giving-modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="giving-modal-header">
                                <div>
                                    <span className="modal-tag">OFFICIAL GIVING RECORD</span>
                                    <h3 className="giving-modal-title">Complete &amp; Record Transfer</h3>
                                    <p className="giving-modal-subtitle">
                                        Submit your transfer reference number to log your contribution into the church ledger and receive your official acknowledgment receipt.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="giving-modal-close"
                                    onClick={() => !isSubmitting && setIsModalOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* PRE-FILLED TRANSFER SUMMARY CHIP */}
                            <div className="modal-transfer-summary">
                                <div className="summary-col">
                                    <small>Designation</small>
                                    <strong>{activeFund.name}</strong>
                                </div>
                                <div className="summary-col">
                                    <small>Amount</small>
                                    <strong style={{ color: "#1877f2", fontSize: "16px" }}>
                                        &#8369;{finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </strong>
                                </div>
                                <div className="summary-col">
                                    <small>Channel</small>
                                    <strong>{activeAccount.bankName}</strong>
                                </div>
                                <div className="summary-col">
                                    <small>Account</small>
                                    <strong style={{ fontFamily: "monospace" }}>{activeAccount.accountNumber}</strong>
                                </div>
                            </div>

                            {submitError && (
                                <div className="giving-modal-error">
                                    <strong>Submission Error:</strong> {submitError}
                                </div>
                            )}

                            <form onSubmit={handleSubmitGiving} className="giving-modal-form">
                                <div className="form-field-group">
                                    <label className="modal-label">
                                        Giver / Donor Full Name <span className="req">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="modal-input"
                                        placeholder="e.g. Bro. Juan Dela Cruz"
                                        value={donorName}
                                        onChange={(e) => setDonorName(e.target.value)}
                                        disabled={isAnonymous || isSubmitting}
                                    />
                                    <label className="modal-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={isAnonymous}
                                            onChange={(e) => setIsAnonymous(e.target.checked)}
                                            disabled={isSubmitting}
                                        />
                                        <span>Keep my name anonymous in church financial reports</span>
                                    </label>
                                </div>

                                <div className="form-fields-row">
                                    <div className="form-field-group">
                                        <label className="modal-label">
                                            Email Address <span className="req">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            className="modal-input"
                                            placeholder="e.g. juan@example.com"
                                            value={donorEmail}
                                            onChange={(e) => setDonorEmail(e.target.value)}
                                            disabled={isSubmitting}
                                            required
                                        />
                                        <small className="field-hint">Official receipt sent here</small>
                                    </div>
                                    <div className="form-field-group">
                                        <label className="modal-label">Mobile Number</label>
                                        <input
                                            type="tel"
                                            className="modal-input"
                                            placeholder="e.g. 0995-632-6245"
                                            value={donorPhone}
                                            onChange={(e) => setDonorPhone(e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                        <small className="field-hint">For SMS/member account sync</small>
                                    </div>
                                </div>

                                <div className="form-field-group">
                                    <label className="modal-label">
                                        {activeAccount.id === "gcash" ? "GCash Reference Number" : activeAccount.id === "maya" ? "Maya Transaction ID" : "Bank Reference / Confirmation Number"} <span className="req">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="modal-input ref-input"
                                        placeholder="e.g. 100293847581 or MP260909XXXX"
                                        value={referenceNumber}
                                        onChange={(e) => setReferenceNumber(e.target.value)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                    <small className="field-hint highlight">
                                        &#9432; Check your GCash / Maya app receipt or SMS confirmation for the transaction reference code.
                                    </small>
                                </div>

                                <div className="form-field-group">
                                    <label className="modal-label">
                                        Prayer Request / Dedication Petitions (Optional)
                                    </label>
                                    <textarea
                                        className="modal-textarea"
                                        rows={3}
                                        placeholder="Share what you are believing God for with this seed so our pastoral team can stand in prayer with you..."
                                        value={prayerRequest}
                                        onChange={(e) => setPrayerRequest(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="giving-modal-footer">
                                    <button
                                        type="button"
                                        className="modal-cancel-btn"
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="modal-submit-btn"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <RefreshCw size={15} className="spin" /> Recording in Database...
                                            </>
                                        ) : (
                                            <>
                                                <FileText size={15} /> Save &amp; Generate Official Receipt
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* SCRIPTURE REPOSITORY GRID */}
                <div className="giving-section-header">
                    <span className="giving-section-tag">Scriptural Foundation</span>
                    <h2 className="giving-section-title">What the Bible Teaches on Giving</h2>
                    <p className="giving-section-desc">
                        Generosity is not merely a financial transaction; it is a sacred spiritual
                        discipline reflecting the generous heart of God our Father.
                    </p>
                </div>

                <div className="scriptures-grid">
                    {SCRIPTURES.map((item) => (
                        <div key={item.id} className="scripture-card">
                            <div>
                                <div className="scripture-header">
                                    <span className="scripture-theme">{item.theme}</span>
                                    <BookOpen size={16} color="#1877f2" />
                                </div>
                                <p className="scripture-quote">{item.text}</p>
                            </div>
                            <div className="scripture-reference">
                                <strong>{item.reference}</strong>
                                <span className="scripture-principle">{item.principle}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* KINGDOM FUNDS DETAILED BREAKDOWN */}
                <div className="giving-section-header">
                    <span className="giving-section-tag">Kingdom Impact</span>
                    <h2 className="giving-section-title">Where Your Giving Goes</h2>
                    <p className="giving-section-desc">
                        Every peso entrusted to EPIC Church is faithfully allocated to ministry
                        operations, gospel outreach, campus facilities, and community relief.
                    </p>
                </div>

                <div className="funds-detail-grid">
                    {KINGDOM_FUNDS.map((fund) => (
                        <div key={fund.id} className="fund-detail-card">
                            <div className="fund-detail-icon-wrap">{renderFundIcon(fund.icon)}</div>
                            <h3 className="fund-detail-title">{fund.name}</h3>
                            <p className="fund-detail-desc">{fund.description}</p>
                            <ul className="fund-detail-bullets">
                                {fund.benefits.map((bullet, idx) => (
                                    <li key={idx}>
                                        <CheckCircle2 size={16} />
                                        <span>{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* VERIFIED BANK ACCOUNTS */}
                <div className="giving-section-header">
                    <span className="giving-section-tag">Banking &amp; Cashless Channels</span>
                    <h2 className="giving-section-title">Verified Cashless Accounts</h2>
                    <p className="giving-section-desc">
                        Direct transfers can be made directly into the following officially registered
                        church accounts on <strong>GCash</strong>, <strong>Maya</strong>, and partner banks.
                    </p>
                </div>

                <div className="accounts-cards-grid">
                    {BANK_ACCOUNTS.map((acc) => (
                        <div key={acc.id} className="account-card">
                            <div>
                                <div className="account-card-header">
                                    <div className="account-card-icon">
                                        {acc.id === "gcash" || acc.id === "maya" ? (
                                            <Smartphone size={20} />
                                        ) : (
                                            <Landmark size={20} />
                                        )}
                                    </div>
                                    <div className="account-card-name">
                                        <strong>{acc.bankName}</strong>
                                        <small>{acc.accountType}</small>
                                    </div>
                                </div>
                                <div className="account-card-number-box">
                                    <span>Account / Mobile Number</span>
                                    <code>{acc.accountNumber}</code>
                                </div>
                                <small style={{ color: "#65676b", fontSize: "11px", display: "block", marginBottom: "14px" }}>
                                    {acc.accountName}
                                </small>
                            </div>
                            <button
                                type="button"
                                className={`copy-btn ${copiedField === acc.id ? "copied" : ""}`}
                                onClick={() => handleCopy(acc.rawNumber, acc.id)}
                            >
                                {copiedField === acc.id ? (
                                    <>
                                        <Check size={14} /> Number Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy size={14} /> Copy Number
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* FINANCIAL TRANSPARENCY & ALLOCATION */}
                <div className="giving-section-header">
                    <span className="giving-section-tag">Financial Stewardship</span>
                    <h2 className="giving-section-title">Transparency &amp; Accountability</h2>
                    <p className="giving-section-desc">
                        We view financial integrity as essential to our witness before God and the church.
                    </p>
                </div>

                <div className="transparency-grid">
                    <div>
                        <div className="transparency-pillar-item">
                            <div className="transparency-pillar-icon">
                                <ShieldCheck size={22} />
                            </div>
                            <div className="transparency-pillar-info">
                                <strong>Independent CPA Book Auditing</strong>
                                <p>
                                    All financial disbursements and contributions undergo independent
                                    certified public accountant audits each fiscal quarter.
                                </p>
                            </div>
                        </div>

                        <div className="transparency-pillar-item">
                            <div className="transparency-pillar-icon">
                                <Landmark size={22} />
                            </div>
                            <div className="transparency-pillar-info">
                                <strong>Board of Elders &amp; Trustee Oversight</strong>
                                <p>
                                    Major capital projects, missionary allowances, and compensation scales
                                    are approved by our non-salaried Board of Trustees.
                                </p>
                            </div>
                        </div>

                        <div className="transparency-pillar-item">
                            <div className="transparency-pillar-icon">
                                <HeartHandshake size={22} />
                            </div>
                            <div className="transparency-pillar-info">
                                <strong>The Luke 4:18 Compassion Guarantee</strong>
                                <p>
                                    A fixed percentage of all general funds is permanently restricted
                                    to community benevolence, orphan care, and urgent family relief.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ fontSize: "16px", fontWeight: 800, color: "#050505", margin: "0 0 16px" }}>
                            Fund Allocation Breakdown (2026 Budget)
                        </h4>
                        <div className="allocation-bars">
                            <div className="allocation-bar-item">
                                <div className="allocation-bar-labels">
                                    <span>Pastoral Ministry &amp; Discipleship</span>
                                    <span>35%</span>
                                </div>
                                <div className="allocation-bar-track">
                                    <div className="allocation-bar-fill" style={{ width: "35%" }} />
                                </div>
                            </div>

                            <div className="allocation-bar-item">
                                <div className="allocation-bar-labels">
                                    <span>Missions, Church Plants &amp; Outreach</span>
                                    <span>25%</span>
                                </div>
                                <div className="allocation-bar-track">
                                    <div className="allocation-bar-fill" style={{ width: "25%" }} />
                                </div>
                            </div>

                            <div className="allocation-bar-item">
                                <div className="allocation-bar-labels">
                                    <span>Sanctuary Facilities &amp; Audiovisual Tech</span>
                                    <span>20%</span>
                                </div>
                                <div className="allocation-bar-track">
                                    <div className="allocation-bar-fill" style={{ width: "20%" }} />
                                </div>
                            </div>

                            <div className="allocation-bar-item">
                                <div className="allocation-bar-labels">
                                    <span>NextGen Youth &amp; Children's Ministry</span>
                                    <span>15%</span>
                                </div>
                                <div className="allocation-bar-track">
                                    <div className="allocation-bar-fill" style={{ width: "15%" }} />
                                </div>
                            </div>

                            <div className="allocation-bar-item">
                                <div className="allocation-bar-labels">
                                    <span>Emergency Benevolence &amp; Food Pantry</span>
                                    <span>5%</span>
                                </div>
                                <div className="allocation-bar-track">
                                    <div className="allocation-bar-fill" style={{ width: "5%" }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ ACCORDION */}
                <div className="giving-section-header">
                    <span className="giving-section-tag">Common Questions</span>
                    <h2 className="giving-section-title">Frequently Asked Questions</h2>
                    <p className="giving-section-desc">
                        Everything you need to know about giving, tithing, receipts, and designations.
                    </p>
                </div>

                <div className="faq-list">
                    {FAQS.map((faq, index) => {
                        const isOpen = openFaq === index;
                        return (
                            <div key={index} className={`faq-item ${isOpen ? "open" : ""}`}>
                                <button
                                    type="button"
                                    className="faq-question-btn"
                                    onClick={() => toggleFaq(index)}
                                >
                                    <span>{faq.question}</span>
                                    {isOpen ? <ChevronUp size={18} color="#1877f2" /> : <ChevronDown size={18} />}
                                </button>
                                {isOpen && <div className="faq-answer">{faq.answer}</div>}
                            </div>
                        );
                    })}
                </div>

                {/* PASTORAL BLESSING & PRAYER CARD */}
                <div className="pastoral-blessing-card">
                    <span className="pastoral-blessing-tag">Pastoral Blessing</span>
                    <h3 className="pastoral-blessing-title">A Blessing Over Every Giver</h3>
                    <p className="pastoral-blessing-text">
                        &ldquo;May the Lord God of Heaven bless the work of your hands, multiply every seed
                        you have sown in faith, and open the floodgates of His peace and provision over your
                        household. May you experience the exceeding joy of cheerful kingdom generosity.
                        In Jesus&apos; mighty name, Amen.&rdquo;
                    </p>
                    <div className="pastoral-blessing-actions">
                        <button
                            type="button"
                            className="blessing-btn-white"
                            onClick={() => window.scrollTo({ top: 400, behavior: "smooth" })}
                        >
                            Give Online Now
                        </button>
                        <button
                            type="button"
                            className="blessing-btn-outline"
                            onClick={() => onNavigate?.("contact")}
                        >
                            Contact Finance Office <ArrowRight size={14} style={{ verticalAlign: "middle" }} />
                        </button>
                    </div>
                </div>
            </main>

            {/* PUBLIC FOOTER */}
            <footer className="giving-footer">
                <div className="giving-footer-inner">
                    <p className="giving-footer-copy">
                        &copy; {new Date().getFullYear()} EPIC Church Management &bull; Engaging People Into Christ &bull; Luke 4:18 Ministries
                    </p>
                    <p className="giving-footer-tagline">
                        EPIC Church Ministries Foundation, Inc. is a registered religious non-profit organization. All contributions are faithfully stewarded for the expansion of God&apos;s Kingdom.
                    </p>
                </div>
            </footer>
        </div>
    );
}
