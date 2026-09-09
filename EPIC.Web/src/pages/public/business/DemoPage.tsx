import React, { useState } from "react";
import PublicHeader from "../../../components/PublicHeader";
import { API_BASE_URL } from "../../../config";
import {
    Sparkles,
    QrCode,
    Wallet,
    Activity,
    GraduationCap,
    CheckCircle2,
    ArrowRight,
    Check,
    Clock,
    ShieldCheck,
    Send,
} from "lucide-react";
import "./DemoPage.css";

interface DemoPageProps {
    onNavigate?: (page: string) => void;
}

export default function DemoPage({ onNavigate }: DemoPageProps) {
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // =========================================================
    // SIMULATOR STATE
    // =========================================================
    const [simTab, setSimTab] = useState<"qr" | "giving" | "evaluation" | "academy">("qr");

    // QR State
    const [qrCount, setQrCount] = useState(248);
    const [qrScanning, setQrScanning] = useState(false);
    const [lastScan, setLastScan] = useState<{
        name: string;
        role: string;
        time: string;
        passType: string;
    } | null>(null);

    const handleSimulateScan = (type: "member" | "breakpass") => {
        setQrScanning(true);
        setTimeout(() => {
            setQrScanning(false);
            if (type === "member") {
                setQrCount((c) => c + 1);
                setLastScan({
                    name: "Bro. Daniel Cruz & Family",
                    role: "Adult Ministry • Member #1042",
                    time: new Date().toLocaleTimeString(),
                    passType: "Sunday Worship Entry",
                });
            } else {
                setLastScan({
                    name: "Joshua Ramirez",
                    role: "Youth Fellowship • Member #2088",
                    time: new Date().toLocaleTimeString(),
                    passType: "CR / Youth Retreat Break Pass",
                });
            }
        }, 600);
    };

    // Giving State
    const [givingAmount, setGivingAmount] = useState("5000");
    const [givingFund, setGivingFund] = useState("Tithes (10%)");
    const [givingMethod, setGivingMethod] = useState("Bank Transfer / GCash");
    const [receiptGenerated, setReceiptGenerated] = useState(false);

    // Ministry Evaluation State
    const [rubricScores, setRubricScores] = useState({
        spiritual: 5,
        punctuality: 4,
        volunteerCare: 5,
        execution: 5,
    });

    const totalRubricScore = Math.round(
        ((rubricScores.spiritual +
            rubricScores.punctuality +
            rubricScores.volunteerCare +
            rubricScores.execution) /
            20) *
            100
    );

    // Academy State
    const [lessonCompleted, setLessonCompleted] = useState(false);

    // =========================================================
    // REAL DEMO REQUEST FORM
    // =========================================================
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        churchName: "",
        phone: "",
        position: "Senior Pastor",
        message: "",
    });

    const [submitting, setSubmitting] = useState(false);
    const [demoError, setDemoError] = useState("");
    const [demoSuccess, setDemoSuccess] = useState(false);
    const [demoId, setDemoId] = useState<number | null>(null);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (demoError) setDemoError("");
    };

    const handleSubmitDemo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        if (!formData.fullName.trim() || !formData.email.trim() || !formData.churchName.trim()) {
            setDemoError("Please enter your name, email, and church name.");
            return;
        }

        try {
            setSubmitting(true);
            setDemoError("");

            const payload = {
                fullName: formData.fullName.trim(),
                email: formData.email.trim().toLowerCase(),
                churchName: formData.churchName.trim(),
                phone: formData.phone.trim() || null,
                position: formData.position.trim() || null,
                message: formData.message.trim() || null,
            };

            const response = await fetch(`${API_BASE_URL}/DemoRequests`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Failed to submit demo request.");
            }

            setDemoId(data.id || Math.floor(100000 + Math.random() * 900000));
            setDemoSuccess(true);
        } catch (err) {
            setDemoError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="epic-demo-page">
            <PublicHeader onNavigate={onNavigate} />

            <main>
                {/* HERO */}
                <section className="demo-hero">
                    <div className="demo-container">
                        <div className="demo-badge">
                            <Sparkles size={14} />
                            <span>HANDS-ON SYSTEM EXPERIENCE</span>
                        </div>

                        <h1>
                            Experience EPIC Church Management{" "}
                            <span className="demo-highlight">Live</span>
                        </h1>

                        <p className="demo-hero-desc">
                            Test real ministry workflows directly in your browser: simulate instant
                            member QR check-ins, generate multi-fund stewardship receipts, evaluate
                            leadership rubrics, and preview discipleship progress.
                        </p>

                        <div className="demo-hero-actions">
                            <a href="#simulator" className="demo-primary-btn">
                                Try Feature Simulator <ArrowRight size={16} />
                            </a>
                            <a href="#request-form" className="demo-secondary-btn">
                                Schedule Guided Walkthrough
                            </a>
                        </div>
                    </div>
                </section>

                {/* SIMULATOR SECTION */}
                <section id="simulator" className="demo-sim-section">
                    <div className="demo-container">
                        <div className="demo-sim-card">
                            {/* TABS */}
                            <div className="demo-sim-tabs">
                                <button
                                    type="button"
                                    className={`demo-sim-tab ${simTab === "qr" ? "active" : ""}`}
                                    onClick={() => setSimTab("qr")}
                                >
                                    <QrCode size={16} /> Member QR Attendance
                                </button>
                                <button
                                    type="button"
                                    className={`demo-sim-tab ${simTab === "giving" ? "active" : ""}`}
                                    onClick={() => setSimTab("giving")}
                                >
                                    <Wallet size={16} /> Multi-Fund Giving Calculator
                                </button>
                                <button
                                    type="button"
                                    className={`demo-sim-tab ${simTab === "evaluation" ? "active" : ""}`}
                                    onClick={() => setSimTab("evaluation")}
                                >
                                    <Activity size={16} /> Ministry Health Rubric
                                </button>
                                <button
                                    type="button"
                                    className={`demo-sim-tab ${simTab === "academy" ? "active" : ""}`}
                                    onClick={() => setSimTab("academy")}
                                >
                                    <GraduationCap size={16} /> Discipleship Academy
                                </button>
                            </div>

                            {/* WORKSPACE */}
                            <div className="demo-sim-workspace">
                                {/* 1. QR ATTENDANCE */}
                                {simTab === "qr" && (
                                    <div className="demo-qr-grid">
                                        <div className="demo-kiosk-box">
                                            <div className="demo-kiosk-icon">
                                                <QrCode size={32} />
                                            </div>
                                            <h4>Sanctuary Entrance Scanner Simulator</h4>
                                            <p style={{ fontSize: "13px", color: "#65676b", margin: 0 }}>
                                                Simulate scanning a member&apos;s digital badge at the church door.
                                            </p>
                                            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                                                <button
                                                    type="button"
                                                    className="demo-kiosk-btn"
                                                    onClick={() => handleSimulateScan("member")}
                                                    disabled={qrScanning}
                                                >
                                                    {qrScanning ? "Scanning Token..." : "Scan Member QR Badge"}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="demo-secondary-btn"
                                                    onClick={() => handleSimulateScan("breakpass")}
                                                    disabled={qrScanning}
                                                    style={{ padding: "10px 16px", fontSize: "13px" }}
                                                >
                                                    Scan CR Break Pass
                                                </button>
                                            </div>
                                        </div>

                                        <div className="demo-qr-result">
                                            <div className="demo-qr-badge-header">
                                                <span>Live Service Roster</span>
                                                <span className="demo-qr-verified">
                                                    <ShieldCheck size={14} /> Cryptographically Verified
                                                </span>
                                            </div>

                                            <div>
                                                <span style={{ fontSize: "12px", color: "#65676b" }}>
                                                    Present Congregation
                                                </span>
                                                <div className="demo-qr-counter">{qrCount}</div>
                                                <small style={{ color: "#31a24c", fontWeight: 700 }}>
                                                    +1 registered just now
                                                </small>
                                            </div>

                                            {lastScan && (
                                                <div
                                                    style={{
                                                        padding: "12px",
                                                        borderRadius: "10px",
                                                        background: "#ffffff",
                                                        border: "1px solid #e4e6eb",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "4px",
                                                    }}
                                                >
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                        <strong style={{ fontSize: "13.5px", color: "#050505" }}>
                                                            {lastScan.name}
                                                        </strong>
                                                        <span style={{ fontSize: "11px", color: "#1877f2", fontWeight: 700 }}>
                                                            {lastScan.passType}
                                                        </span>
                                                    </div>
                                                    <span style={{ fontSize: "12px", color: "#65676b" }}>
                                                        {lastScan.role}
                                                    </span>
                                                    <small style={{ fontSize: "11px", color: "#65676b" }}>
                                                        <Clock size={11} style={{ display: "inline", marginRight: "3px" }} />
                                                        Timestamp: {lastScan.time}
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 2. GIVING CALCULATOR */}
                                {simTab === "giving" && (
                                    <div className="demo-giving-grid">
                                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                            <h4>Multi-Fund Stewardship Processing</h4>
                                            <div className="demo-form-field">
                                                <label>Giving Amount (₱)</label>
                                                <input
                                                    type="number"
                                                    value={givingAmount}
                                                    onChange={(e) => {
                                                        setGivingAmount(e.target.value);
                                                        setReceiptGenerated(false);
                                                    }}
                                                />
                                            </div>

                                            <div className="demo-form-field">
                                                <label>Fund Allocation</label>
                                                <select
                                                    value={givingFund}
                                                    onChange={(e) => {
                                                        setGivingFund(e.target.value);
                                                        setReceiptGenerated(false);
                                                    }}
                                                >
                                                    <option>Tithes (10%)</option>
                                                    <option>Building & Sanctuary Expansion</option>
                                                    <option>Missions & Evangelism</option>
                                                    <option>Pastor&apos;s Love Offering</option>
                                                </select>
                                            </div>

                                            <div className="demo-form-field">
                                                <label>Payment Channel</label>
                                                <select
                                                    value={givingMethod}
                                                    onChange={(e) => {
                                                        setGivingMethod(e.target.value);
                                                        setReceiptGenerated(false);
                                                    }}
                                                >
                                                    <option>Bank Transfer / GCash / Maya</option>
                                                    <option>Cash In Envelope</option>
                                                    <option>Church Check</option>
                                                </select>
                                            </div>

                                            <button
                                                type="button"
                                                className="demo-primary-btn"
                                                onClick={() => setReceiptGenerated(true)}
                                            >
                                                Record Stewardship & Generate Receipt
                                            </button>
                                        </div>

                                        <div className="demo-receipt-card">
                                            <div className="demo-receipt-header">
                                                <h4>EPIC CHURCH MANAGEMENT</h4>
                                                <span style={{ fontSize: "11px", color: "#65676b" }}>
                                                    Official Digital Stewardship Receipt
                                                </span>
                                            </div>

                                            <div className="demo-receipt-row">
                                                <span>Member ID:</span>
                                                <strong>#1042 - Bro. Daniel Cruz</strong>
                                            </div>
                                            <div className="demo-receipt-row">
                                                <span>Reference No:</span>
                                                <strong>EPIC-{Math.floor(100000 + Math.random() * 900000)}</strong>
                                            </div>
                                            <div className="demo-receipt-row">
                                                <span>Fund Allocated:</span>
                                                <strong style={{ color: "#1877f2" }}>{givingFund}</strong>
                                            </div>
                                            <div className="demo-receipt-row">
                                                <span>Payment Method:</span>
                                                <span>{givingMethod}</span>
                                            </div>

                                            <div className="demo-receipt-total">
                                                <span>Total Verified:</span>
                                                <span>₱{Number(givingAmount || 0).toLocaleString()}</span>
                                            </div>

                                            {receiptGenerated && (
                                                <div
                                                    style={{
                                                        padding: "8px",
                                                        borderRadius: "8px",
                                                        background: "#e7f3ff",
                                                        color: "#1877f2",
                                                        fontSize: "12px",
                                                        textAlign: "center",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    ✓ Logged into General Financial Ledger
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 3. MINISTRY EVALUATION */}
                                {simTab === "evaluation" && (
                                    <div className="demo-rubric-card">
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <h4 style={{ margin: 0 }}>Worship Department Quarterly Evaluation</h4>
                                                <span style={{ fontSize: "12.5px", color: "#65676b" }}>
                                                    Rubric Scorecard for Ministry Health & Volunteer Readiness
                                                </span>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div className="demo-rubric-score">{totalRubricScore}%</div>
                                                <span style={{ fontSize: "11px", color: "#31a24c", fontWeight: 700 }}>
                                                    Approved for Leadership
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "10px" }}>
                                            <div className="demo-rubric-row">
                                                <div>
                                                    <strong style={{ fontSize: "13.5px" }}>Spiritual Walk & Testimony</strong>
                                                    <p style={{ margin: 0, fontSize: "12px", color: "#65676b" }}>
                                                        Consistent prayer life and personal spiritual maturity
                                                    </p>
                                                </div>
                                                <select
                                                    value={rubricScores.spiritual}
                                                    onChange={(e) =>
                                                        setRubricScores((s) => ({ ...s, spiritual: Number(e.target.value) }))
                                                    }
                                                    style={{ padding: "6px 10px", borderRadius: "6px" }}
                                                >
                                                    <option value={5}>5 - Excellent</option>
                                                    <option value={4}>4 - Commendable</option>
                                                    <option value={3}>3 - Satisfactory</option>
                                                </select>
                                            </div>

                                            <div className="demo-rubric-row">
                                                <div>
                                                    <strong style={{ fontSize: "13.5px" }}>Punctuality & Call Time Readiness</strong>
                                                    <p style={{ margin: 0, fontSize: "12px", color: "#65676b" }}>
                                                        Arriving prepared for Sunday soundcheck & devotionals
                                                    </p>
                                                </div>
                                                <select
                                                    value={rubricScores.punctuality}
                                                    onChange={(e) =>
                                                        setRubricScores((s) => ({ ...s, punctuality: Number(e.target.value) }))
                                                    }
                                                    style={{ padding: "6px 10px", borderRadius: "6px" }}
                                                >
                                                    <option value={5}>5 - Excellent</option>
                                                    <option value={4}>4 - Commendable</option>
                                                    <option value={3}>3 - Satisfactory</option>
                                                </select>
                                            </div>

                                            <div className="demo-rubric-row">
                                                <div>
                                                    <strong style={{ fontSize: "13.5px" }}>Volunteer Mentorship & Unity</strong>
                                                    <p style={{ margin: 0, fontSize: "12px", color: "#65676b" }}>
                                                        Discipling new musicians and fostering team harmony
                                                    </p>
                                                </div>
                                                <select
                                                    value={rubricScores.volunteerCare}
                                                    onChange={(e) =>
                                                        setRubricScores((s) => ({ ...s, volunteerCare: Number(e.target.value) }))
                                                    }
                                                    style={{ padding: "6px 10px", borderRadius: "6px" }}
                                                >
                                                    <option value={5}>5 - Excellent</option>
                                                    <option value={4}>4 - Commendable</option>
                                                    <option value={3}>3 - Satisfactory</option>
                                                </select>
                                            </div>

                                            <div className="demo-rubric-row">
                                                <div>
                                                    <strong style={{ fontSize: "13.5px" }}>Order of Worship Execution</strong>
                                                    <p style={{ margin: 0, fontSize: "12px", color: "#65676b" }}>
                                                        Seamless flow and musical execution during service
                                                    </p>
                                                </div>
                                                <select
                                                    value={rubricScores.execution}
                                                    onChange={(e) =>
                                                        setRubricScores((s) => ({ ...s, execution: Number(e.target.value) }))
                                                    }
                                                    style={{ padding: "6px 10px", borderRadius: "6px" }}
                                                >
                                                    <option value={5}>5 - Excellent</option>
                                                    <option value={4}>4 - Commendable</option>
                                                    <option value={3}>3 - Satisfactory</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 4. ACADEMY VIEWER */}
                                {simTab === "academy" && (
                                    <div className="demo-academy-card">
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <h4 style={{ margin: 0 }}>Foundations of Faith — Track 1</h4>
                                                <span style={{ fontSize: "12.5px", color: "#65676b" }}>
                                                    Lesson 3: The Holy Spirit & Kingdom Stewardship
                                                </span>
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: "12px",
                                                    fontWeight: 800,
                                                    color: lessonCompleted ? "#31a24c" : "#1877f2",
                                                }}
                                            >
                                                {lessonCompleted ? "100% Completed" : "50% In Progress"}
                                            </span>
                                        </div>

                                        <div className="demo-academy-bar-track">
                                            <div
                                                className="demo-academy-bar-fill"
                                                style={{ width: lessonCompleted ? "100%" : "50%" }}
                                            />
                                        </div>

                                        <div
                                            style={{
                                                padding: "16px",
                                                borderRadius: "10px",
                                                background: "#ffffff",
                                                border: "1px solid #e4e6eb",
                                            }}
                                        >
                                            <h5 style={{ margin: "0 0 6px", fontSize: "14px", color: "#050505" }}>
                                                Video Module: Serving With Spiritual Excellence
                                            </h5>
                                            <p style={{ margin: 0, fontSize: "13px", color: "#65676b" }}>
                                                In this lesson, members discover the biblical principles of stewarding their
                                                spiritual gifts and honoring God with time and resources.
                                            </p>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <button
                                                type="button"
                                                className="demo-primary-btn"
                                                onClick={() => setLessonCompleted(true)}
                                                disabled={lessonCompleted}
                                            >
                                                {lessonCompleted ? "✓ Lesson Completed" : "Mark Lesson As Complete"}
                                            </button>

                                            {lessonCompleted && (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        fontSize: "13px",
                                                        fontWeight: 700,
                                                        color: "#31a24c",
                                                    }}
                                                >
                                                    <CheckCircle2 size={16} /> Certificate of Completion Unlocked!
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* FORM SECTION */}
                <section id="request-form" className="demo-form-section">
                    <div className="demo-container">
                        <div className="demo-form-card">
                            <div style={{ textAlign: "center", marginBottom: "28px" }}>
                                <span style={{ fontSize: "12px", fontWeight: 800, color: "#1877f2", letterSpacing: "0.08em" }}>
                                    PERSONALIZED CHURCH DEMO
                                </span>
                                <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "6px 0 10px", color: "#050505" }}>
                                    Request a Live 1-on-1 Walkthrough
                                </h2>
                                <p style={{ fontSize: "15px", color: "#65676b", margin: 0 }}>
                                    Connect with a church operations specialist who will configure EPIC to match
                                    your congregation&apos;s specific service schedules, ministries, and leadership needs.
                                </p>
                            </div>

                            {demoSuccess ? (
                                <div className="demo-form-success">
                                    <div className="demo-success-icon">
                                        <Check size={28} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: "22px", color: "#050505" }}>
                                        Demo Request Received!
                                    </h3>
                                    <p style={{ color: "#65676b", fontSize: "14px", margin: 0, maxWidth: "460px" }}>
                                        Thank you, {formData.fullName}. Our church operations team has received your
                                        request and will reach out via email shortly with your personalized access link.
                                    </p>
                                    <div className="demo-success-ref">
                                        Reference ID: #{demoId}
                                    </div>
                                    <button
                                        type="button"
                                        className="demo-secondary-btn"
                                        onClick={() => {
                                            setDemoSuccess(false);
                                            setFormData({
                                                fullName: "",
                                                email: "",
                                                churchName: "",
                                                phone: "",
                                                position: "Senior Pastor",
                                                message: "",
                                            });
                                        }}
                                    >
                                        Submit Another Request
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmitDemo} className="demo-form-grid">
                                    {demoError && <div className="demo-form-error">{demoError}</div>}

                                    <div className="demo-form-field">
                                        <label>
                                            Full Name <span>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            placeholder="Pastor John Doe"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="demo-form-field">
                                        <label>
                                            Email Address <span>*</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="pastor@church.org"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="demo-form-field">
                                        <label>
                                            Church / Organization Name <span>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="churchName"
                                            placeholder="Grace Community Church"
                                            value={formData.churchName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="demo-form-field">
                                        <label>Contact Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            placeholder="+63 912 345 6789"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="demo-form-field">
                                        <label>Your Ministry Role</label>
                                        <select
                                            name="position"
                                            value={formData.position}
                                            onChange={handleInputChange}
                                        >
                                            <option>Senior Pastor</option>
                                            <option>Associate Pastor</option>
                                            <option>Church Administrator</option>
                                            <option>Treasurer / Finance Head</option>
                                            <option>Ministry Director / Elder</option>
                                        </select>
                                    </div>

                                    <div className="demo-form-field">
                                        <label>Congregation Size</label>
                                        <select defaultValue="100 - 300 members">
                                            <option>Under 100 members</option>
                                            <option>100 - 300 members</option>
                                            <option>300 - 1,000 members</option>
                                            <option>1,000+ members (Multi-Site)</option>
                                        </select>
                                    </div>

                                    <div className="demo-form-field demo-field-full">
                                        <label>Key Operations Challenges / Message</label>
                                        <textarea
                                            name="message"
                                            rows={3}
                                            placeholder="Tell us what you'd like to see: QR attendance, tithes accounting, ministry evaluations..."
                                            value={formData.message}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="demo-field-full">
                                        <button
                                            type="submit"
                                            className="demo-primary-btn"
                                            style={{ width: "100%", justifyContent: "center", padding: "14px" }}
                                            disabled={submitting}
                                        >
                                            {submitting ? "Submitting Request..." : "Submit Demo Request"}
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}