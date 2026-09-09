import React, { useState } from "react";
import PublicHeader from "../../components/PublicHeader";
import {
    Mail,
    Phone,
    MapPin,
    Clock,
    Calendar,
    Send,
    CheckCircle2,
    Sparkles,
    Church,
    HeartHandshake,
    ArrowRight,
    User,
    AlertCircle,
    MessageSquare
} from "lucide-react";
import "./ContactPage.css";
import "./PublicUnisonTheme.css";
import { API_BASE_URL } from "../../config";

interface ContactPageProps {
    onNavigate: (page: string) => void;
}

interface ContactFormData {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
}

interface SubmissionReceipt {
    requestId: number;
    name: string;
    email: string;
    phone: string;
    department: string;
    message: string;
    submittedAt: string;
}

const GATHERING_TIMES = [
    {
        day: "SUN",
        title: "Sunday Worship & Word Encounter",
        time: "8:30 AM (1st Service) & 1:30 PM (2nd Service)",
        detail: "Main Sanctuary & Livestream • Kids Church Available"
    },
    {
        day: "SAT",
        title: "NextGen Youth Encounter",
        time: "4:00 PM – 6:30 PM",
        detail: "Youth Pavilion • High School & College Students"
    },
    {
        day: "WED",
        title: "Midweek Prayer & Bible Study",
        time: "7:00 PM – 8:30 PM",
        detail: "Sanctuary Hall & Online Zoom Link"
    },
    {
        day: "TUE",
        title: "Discipleship Life Groups",
        time: "7:30 PM",
        detail: "District homes across Metro & Provincial Clusters"
    }
];

export default function ContactPage({ onNavigate }: ContactPageProps) {
    const [form, setForm] = useState<ContactFormData>({
        name: "",
        email: "",
        phone: "",
        subject: "General Inquiry",
        message: ""
    });

    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [submissionReceipt, setSubmissionReceipt] = useState<SubmissionReceipt | null>(null);

    const handleChange = (
        event: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
        setSubmitted(false);
        setError("");
    };

    const handlePrayerSelect = () => {
        setForm((prev) => ({
            ...prev,
            subject: "Pastoral Counseling & Prayer Request"
        }));
        document.getElementById("contact-form-section")?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (submitting) return;

        setSubmitting(true);
        setSubmitted(false);
        setError("");

        const payload = {
            fullName: form.name.trim(),
            churchName: "Website Contact Inquiry",
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim() || null,
            position: form.subject.trim() || "General Church Inquiry",
            message: form.message.trim()
        };

        try {
            let response: Response;
            try {
                response = await fetch(`${API_BASE_URL}/DemoRequests`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });
            } catch (netErr) {
                // If on localhost and primary fetch fails, attempt direct local fallback
                if (
                    typeof window !== "undefined" &&
                    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
                    !API_BASE_URL.includes("5109")
                ) {
                    response = await fetch("http://localhost:5109/api/DemoRequests", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(payload)
                    });
                } else {
                    throw netErr;
                }
            }

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        "Unable to send your message. Please verify your details and try again."
                );
            }

            const reqId = Number(data?.demoRequestId) || 0;
            setSubmissionReceipt({
                requestId: reqId,
                name: payload.fullName,
                email: payload.email,
                phone: payload.phone || "",
                department: payload.position,
                message: payload.message,
                submittedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            });
            setSubmitted(true);
            setForm({
                name: "",
                email: "",
                phone: "",
                subject: "General Inquiry",
                message: ""
            });

            document.getElementById("contact-form-section")?.scrollIntoView({ behavior: "smooth" });
        } catch (err) {
            console.error("Contact form submission error:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to send your message. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="epic-contact-page">
            <PublicHeader onNavigate={onNavigate} />

            {/* HERO BANNER */}
            <section className="epic-contact-hero">
                <div className="epic-contact-container">
                    <div className="epic-contact-hero-inner">
                        <span className="epic-contact-badge">
                            <Sparkles size={14} /> WE'D LOVE TO CONNECT WITH YOU
                        </span>
                        <h1>
                            Let's Connect &amp; <span>Grow Together.</span>
                        </h1>
                        <p>
                            Whether you have questions about EPIC Church worship services, our discipleship
                            programs, volunteering in ministry, or need assistance with the EPIC Church
                            Management platform — our pastoral and support team is here for you.
                        </p>

                        <div className="epic-contact-quick-pills">
                            <div className="epic-contact-pill">
                                <MapPin size={16} /> San Vicente Church, Philippines
                            </div>
                            <div className="epic-contact-pill">
                                <Calendar size={16} /> Sunday Worship: 8:30 AM &amp; 1:30 PM
                            </div>
                            <div className="epic-contact-pill">
                                <Clock size={16} /> Office: Mon–Fri, 9:00 AM – 5:00 PM
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3 CONTACT INFO CARDS */}
            <section className="epic-contact-info-section">
                <div className="epic-contact-container">
                    <div className="epic-contact-info-grid">
                        {/* EMAIL */}
                        <article className="epic-contact-info-card">
                            <div>
                                <div className="epic-contact-info-icon">
                                    <Mail size={24} />
                                </div>
                                <span className="epic-contact-info-label">DIGITAL CARE &amp; INQUIRIES</span>
                                <h3>Email Pastoral Office</h3>
                                <p>
                                    Send us your questions, prayer requests, event registrations, or ministry
                                    collaboration inquiries.
                                </p>
                            </div>
                            <a href="mailto:info@epicchurch.org" className="epic-contact-link">
                                info@epicchurch.org <ArrowRight size={14} />
                            </a>
                        </article>

                        {/* PHONE */}
                        <article className="epic-contact-info-card">
                            <div>
                                <div className="epic-contact-info-icon">
                                    <Phone size={24} />
                                </div>
                                <span className="epic-contact-info-label">PASTORAL HOTLINE</span>
                                <h3>Call Church Office</h3>
                                <p>
                                    Speak directly with our ministry staff or schedule pastoral counseling and
                                    family appointments.
                                </p>
                            </div>
                            <a href="tel:+639178493742" className="epic-contact-link">
                                +63 917 849 3742 <ArrowRight size={14} />
                            </a>
                        </article>

                        {/* CAMPUS */}
                        <article className="epic-contact-info-card">
                            <div>
                                <div className="epic-contact-info-icon">
                                    <Church size={24} />
                                </div>
                                <span className="epic-contact-info-label">WORSHIP SANCTUARY</span>
                                <h3>Luke 4:18 Ministries</h3>
                                <p>
                                    San Vicente Church, Philippines. Welcoming atmosphere, secure kids nursery,
                                    and free guest parking.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="epic-contact-link"
                                style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
                                onClick={() => onNavigate("about")}
                            >
                                Learn About Our Heritage <ArrowRight size={14} />
                            </button>
                        </article>
                    </div>
                </div>
            </section>

            {/* MAIN GRID: FORM + GATHERING SCHEDULE & PRAYER */}
            <div className="epic-contact-container" id="contact-form-section">
                <div className="epic-contact-main-grid">
                    {/* LEFT COLUMN: INTERACTIVE FORM */}
                    <div className="epic-contact-form-card">
                        <div className="epic-contact-form-intro">
                            <span className="epic-contact-form-tag">DIRECT INQUIRY</span>
                            <h2 className="epic-contact-form-title">Send Us a Message</h2>
                            <p className="epic-contact-form-subtitle">
                                Complete the form below and our team will get in touch with you shortly.
                            </p>
                        </div>

                        {submitted && submissionReceipt ? (
                            <div className="epic-contact-success-receipt">
                                <div className="receipt-header">
                                    <div className="receipt-check-icon">
                                        <CheckCircle2 size={36} color="#1877f2" />
                                    </div>
                                    <span className="receipt-badge">RECORDED IN DATABASE</span>
                                    <h3 className="receipt-title">Message Received &amp; Recorded!</h3>
                                    <p className="receipt-subtitle">
                                        Your inquiry has been successfully entered into the church database and queued for pastoral review.
                                    </p>
                                </div>

                                <div className="receipt-box">
                                    <div className="receipt-ref-row">
                                        <span className="receipt-ref-label">Inquiry Reference Code</span>
                                        <span className="receipt-ref-code">
                                            #CR-{String(submissionReceipt.requestId).padStart(6, "0")}
                                        </span>
                                    </div>

                                    <div className="receipt-details-list">
                                        <div className="receipt-detail-item">
                                            <span className="detail-label">Requester Name:</span>
                                            <strong className="detail-val">{submissionReceipt.name}</strong>
                                        </div>
                                        <div className="receipt-detail-item">
                                            <span className="detail-label">Department / Topic:</span>
                                            <strong className="detail-val" style={{ color: "#1877f2" }}>
                                                {submissionReceipt.department}
                                            </strong>
                                        </div>
                                        <div className="receipt-detail-item">
                                            <span className="detail-label">Email Address:</span>
                                            <strong className="detail-val">{submissionReceipt.email}</strong>
                                        </div>
                                        {submissionReceipt.phone && (
                                            <div className="receipt-detail-item">
                                                <span className="detail-label">Mobile / Phone:</span>
                                                <strong className="detail-val">{submissionReceipt.phone}</strong>
                                            </div>
                                        )}
                                        <div className="receipt-detail-item">
                                            <span className="detail-label">Database Queue:</span>
                                            <span className="detail-val receipt-status-tag">
                                                Pending Pastoral Review (Active)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="receipt-email-notice">
                                    <Mail size={18} color="#1877f2" style={{ flexShrink: 0, marginTop: "2px" }} />
                                    <div>
                                        <strong>Dual Confirmation Dispatched</strong>
                                        <p>
                                            A confirmation email with your reference code was sent to <u>{submissionReceipt.email}</u>, and an immediate alert was sent to our pastoral team.
                                        </p>
                                    </div>
                                </div>

                                <div className="receipt-verse">
                                    &ldquo;Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.&rdquo;
                                    <br />
                                    <strong>&mdash; Philippians 4:6</strong>
                                </div>

                                <button
                                    type="button"
                                    className="epic-contact-submit"
                                    style={{ width: "100%", marginTop: "16px" }}
                                    onClick={() => {
                                        setSubmitted(false);
                                        setSubmissionReceipt(null);
                                    }}
                                >
                                    <Send size={16} />
                                    <span>Send Another Message</span>
                                </button>
                            </div>
                        ) : (
                            <form className="epic-contact-form" onSubmit={handleSubmit}>
                                {error && (
                                    <div className="epic-contact-error" role="alert">
                                        <AlertCircle size={20} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                                        {error}
                                    </div>
                                )}

                                {/* NAME & EMAIL */}
                                <div className="epic-contact-form-row">
                                    <div className="epic-contact-field">
                                        <label htmlFor="contact-name">Requester Full Name *</label>
                                        <div className="epic-contact-input-wrap">
                                            <User size={16} className="epic-contact-input-icon" />
                                            <input
                                                id="contact-name"
                                                type="text"
                                                name="name"
                                                className="epic-contact-input-with-icon"
                                                placeholder="e.g. Maria Santos"
                                                value={form.name}
                                                onChange={handleChange}
                                                required
                                                maxLength={150}
                                            />
                                        </div>
                                    </div>

                                    <div className="epic-contact-field">
                                        <label htmlFor="contact-email">Email Address *</label>
                                        <div className="epic-contact-input-wrap">
                                            <Mail size={16} className="epic-contact-input-icon" />
                                            <input
                                                id="contact-email"
                                                type="email"
                                                name="email"
                                                className="epic-contact-input-with-icon"
                                                placeholder="e.g. maria@example.com"
                                                value={form.email}
                                                onChange={handleChange}
                                                required
                                                maxLength={150}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* PHONE & INQUIRY CATEGORY */}
                                <div className="epic-contact-form-row">
                                    <div className="epic-contact-field">
                                        <label htmlFor="contact-phone">Mobile / Phone Number</label>
                                        <div className="epic-contact-input-wrap">
                                            <Phone size={16} className="epic-contact-input-icon" />
                                            <input
                                                id="contact-phone"
                                                type="tel"
                                                name="phone"
                                                className="epic-contact-input-with-icon"
                                                placeholder="+63 9XX XXX XXXX"
                                                value={form.phone}
                                                onChange={handleChange}
                                                maxLength={50}
                                            />
                                        </div>
                                    </div>

                                    <div className="epic-contact-field">
                                        <label htmlFor="contact-subject">Inquiry Type / Department *</label>
                                        <select
                                            id="contact-subject"
                                            name="subject"
                                            value={form.subject}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="General Inquiry">General Church Inquiry</option>
                                            <option value="Sunday Worship & Visitors">Sunday Worship &amp; Visitors</option>
                                            <option value="Pastoral Counseling & Prayer Request">
                                                Pastoral Counseling &amp; Prayer Request
                                            </option>
                                            <option value="Ministries & Volunteer Opportunities">
                                                Ministries &amp; Volunteer Opportunities
                                            </option>
                                            <option value="EPIC Church Management Platform & Demo">
                                                EPIC System Demo &amp; Technology
                                            </option>
                                            <option value="Giving, Tithing & Stewardship">
                                                Giving, Tithing &amp; Stewardship
                                            </option>
                                            <option value="Youth & Campus Ministry">Youth &amp; Campus Ministry</option>
                                            <option value="Water Baptism & Dedication">
                                                Water Baptism &amp; Child Dedication
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                {/* MESSAGE */}
                                <div className="epic-contact-field">
                                    <label htmlFor="contact-message">Message or Prayer Request *</label>
                                    <div className="epic-contact-input-wrap" style={{ alignItems: "flex-start" }}>
                                        <textarea
                                            id="contact-message"
                                            name="message"
                                            rows={6}
                                            placeholder="How can we pray for you or assist your ministry needs?"
                                            value={form.message}
                                            onChange={handleChange}
                                            required
                                            maxLength={1000}
                                        />
                                    </div>
                                </div>

                                {/* SUBMIT */}
                                <button type="submit" className="epic-contact-submit" disabled={submitting}>
                                    <Send size={16} />
                                    <span>{submitting ? "Sending Your Message..." : "Send Message"}</span>
                                </button>

                                <small className="epic-contact-form-note">
                                    Your privacy is sacred to us. Information shared is handled with pastoral confidentiality.
                                </small>
                            </form>
                        )}
                    </div>

                    {/* RIGHT COLUMN: GATHERING TIMES & PRAYER SUPPORT */}
                    <div className="epic-contact-sidebar">
                        {/* SERVICE SCHEDULE CARD */}
                        <div className="epic-contact-side-card">
                            <h3 className="side-card-title">
                                <Calendar size={20} /> Weekly Gatherings &amp; Services
                            </h3>
                            <div className="service-times-list">
                                {GATHERING_TIMES.map((svc, idx) => (
                                    <div key={idx} className="service-time-item">
                                        <div className="service-time-badge">{svc.day}</div>
                                        <div className="service-time-info">
                                            <strong>{svc.title}</strong>
                                            <span>
                                                <Clock size={12} style={{ verticalAlign: "middle", marginRight: "4px" }} />
                                                {svc.time}
                                            </span>
                                            <div style={{ fontSize: "11px", color: "#8a8d91", marginTop: "2px" }}>
                                                {svc.detail}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PRAYER SUPPORT CARD */}
                        <div className="prayer-support-card">
                            <div className="prayer-card-header">
                                <HeartHandshake size={22} color="#1877f2" />
                                <h3>Need Prayer Support?</h3>
                            </div>
                            <p className="prayer-card-verse">
                                &ldquo;The prayer of a righteous person is powerful and effective.&rdquo;
                                <br />
                                <strong>&mdash; James 5:16</strong>
                            </p>
                            <p className="prayer-card-text">
                                You do not have to walk through life's trials alone. Our intercessory team and pastors
                                pray over every confidential prayer request.
                            </p>
                            <button
                                type="button"
                                className="prayer-hotline-btn"
                                onClick={handlePrayerSelect}
                            >
                                <MessageSquare size={16} /> Submit Prayer Request
                            </button>
                        </div>
                    </div>
                </div>

                {/* CALL TO ACTION BANNER */}
                <section className="epic-contact-cta">
                    <h2>Your Church Has A Divine Mission.</h2>
                    <p>
                        Engaging People Into Christ. Empowering pastors, staff, and volunteers through
                        compassionate leadership and world-class management technology.
                    </p>
                    <div className="epic-contact-cta-actions">
                        <button
                            type="button"
                            className="cta-btn-white"
                            onClick={() => onNavigate("ministries")}
                        >
                            <Church size={16} /> Explore Ministries
                        </button>
                        <button
                            type="button"
                            className="cta-btn-outline"
                            onClick={() => onNavigate("giving")}
                        >
                            Giving &amp; Stewardship <ArrowRight size={14} style={{ verticalAlign: "middle" }} />
                        </button>
                    </div>
                </section>
            </div>

            {/* PUBLIC FOOTER */}
            <footer className="epic-contact-footer">
                <div className="epic-contact-container">
                    <p className="epic-contact-footer-copy">
                        &copy; {new Date().getFullYear()} EPIC Church Management &bull; Engaging People Into Christ &bull; Luke 4:18 Ministries
                    </p>
                    <p className="epic-contact-footer-tagline">
                        San Vicente Church, Philippines &bull; Dedicated to preaching good news and serving our community.
                    </p>
                </div>
            </footer>
        </div>
    );
}
