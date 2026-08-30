import React, { useState } from "react";
import PublicHeader from "../../components/PublicHeader";
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

const ContactPage: React.FC<ContactPageProps> = ({
    onNavigate,
}) => {
    const [form, setForm] = useState<ContactFormData>({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
    });

    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // =========================================================
    // FORM CHANGE
    // =========================================================

    const handleChange = (
        event: React.ChangeEvent<
            HTMLInputElement |
            HTMLTextAreaElement |
            HTMLSelectElement
        >
    ) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        setSubmitted(false);
        setError("");
    };

    // =========================================================
    // SUBMIT CONTACT FORM
    //
    // Uses the existing DemoRequests API.
    //
    // Contact Form -> DemoRequest
    //
    // name     -> FullName
    // email    -> Email
    // phone    -> Phone
    // subject  -> Position
    // message  -> Message
    // automatic -> ChurchName = Website Contact Inquiry
    // =========================================================

    const handleSubmit = async (
        event: React.FormEvent
    ) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        setSubmitting(true);
        setSubmitted(false);
        setError("");

        try {
            const payload = {
                fullName: form.name.trim(),

                // Contact inquiries do not provide
                // a church name, so we identify them
                // clearly in the existing Demo Requests system.
                churchName: "Website Contact Inquiry",

                email: form.email.trim().toLowerCase(),

                phone:
                    form.phone.trim() ||
                    null,

                // Existing DemoRequest.Position
                // stores the selected inquiry type.
                position:
                    form.subject.trim() ||
                    "General Inquiry",

                message:
                    form.message.trim(),
            };

            const response = await fetch(
                `${API_BASE_URL}/DemoRequests`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response
                .json()
                .catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Unable to send your message. Please try again."
                );
            }

            setSubmitted(true);

            setForm({
                name: "",
                email: "",
                phone: "",
                subject: "",
                message: "",
            });
        }
        catch (err) {
            console.error(
                "Contact form submission error:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to send your message. Please try again."
            );
        }
        finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="epic-contact-page">
            <PublicHeader onNavigate={onNavigate} />

            <section className="epic-contact-hero">

                <div className="epic-contact-hero-glow" />

                <div className="epic-contact-container">

                    <div className="epic-contact-hero-content">

                        <span className="epic-contact-label">
                            GET IN TOUCH
                        </span>

                        <h1>
                            Let's Connect
                            <br />
                            <span>With EPIC.</span>
                        </h1>

                        <p>
                            Whether you want to learn more about
                            EPIC Church, explore the EPIC Church
                            Management System, request a demo, or
                            simply connect with us — we'd love to
                            hear from you.
                        </p>

                        <div className="epic-contact-hero-actions">

                            <button
                                type="button"
                                className="epic-contact-primary-button"
                                onClick={() =>
                                    document
                                        .getElementById(
                                            "contact-form"
                                        )
                                        ?.scrollIntoView({
                                            behavior:
                                                "smooth",
                                        })
                                }
                            >
                                Send Us a Message
                                <span>→</span>
                            </button>

                            <button
                                type="button"
                                className="epic-contact-secondary-button"
                                onClick={() =>
                                    onNavigate("landing")
                                }
                            >
                                Explore EPIC
                            </button>

                        </div>

                    </div>

                    <div className="epic-contact-hero-mark">

                        <div className="epic-contact-cross">
                            ✝
                        </div>

                        <strong>
                            EPIC
                        </strong>

                        <span>
                            Engaging People
                            <br />
                            Into Christ
                        </span>

                    </div>

                </div>

            </section>

            {/* =====================================================
                CONTACT INFORMATION
            ===================================================== */}

            <section className="epic-contact-info-section">

                <div className="epic-contact-container">

                    <div className="epic-contact-section-heading">

                        <span className="epic-contact-label">
                            CONNECT WITH US
                        </span>

                        <h2>
                            We're Here
                            <br />
                            <span>To Help.</span>
                        </h2>

                        <p>
                            Have a question about our church,
                            ministries, or EPIC technology?
                            Reach out and our team will be happy
                            to connect with you.
                        </p>

                    </div>

                    <div className="epic-contact-info-grid">

                        <article className="epic-contact-info-card">

                            <div className="epic-contact-info-icon">
                                ✉
                            </div>

                            <span>
                                EMAIL
                            </span>

                            <h3>
                                Email Us
                            </h3>

                            <p>
                                Send us your questions,
                                inquiries or ministry concerns.
                            </p>

                            <a href="mailto:info@epicchurch.org">
                                info@epicchurch.org
                            </a>

                        </article>

                        <article className="epic-contact-info-card">

                            <div className="epic-contact-info-icon">
                                ☎
                            </div>

                            <span>
                                PHONE
                            </span>

                            <h3>
                                Call Us
                            </h3>

                            <p>
                                Speak with our team about EPIC
                                Church or the EPIC platform.
                            </p>

                            <a href="tel:+630000000000">
                                +63 000 000 0000
                            </a>

                        </article>

                        <article className="epic-contact-info-card">

                            <div className="epic-contact-info-icon">
                                ⛪
                            </div>

                            <span>
                                CHURCH
                            </span>

                            <h3>
                                Luke 4:18 Ministries
                            </h3>

                            <p>
                                San Vicente Church
                                <br />
                                Philippines
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    onNavigate(
                                        "ministries"
                                    )
                                }
                            >
                                Learn About Our Church →
                            </button>

                        </article>

                    </div>

                </div>

            </section>

            {/* =====================================================
                CONTACT FORM
            ===================================================== */}

            <section
                id="contact-form"
                className="epic-contact-form-section"
            >

                <div className="epic-contact-container">

                    <div className="epic-contact-form-card">

                        {/* =================================================
                            FORM INTRO
                        ================================================= */}

                        <div className="epic-contact-form-intro">

                            <span className="epic-contact-label">
                                SEND A MESSAGE
                            </span>

                            <h2>
                                We'd Love To
                                <br />
                                <span>Hear From You.</span>
                            </h2>

                            <p>
                                Fill out the form and let us know
                                how we can help. Your inquiry will
                                be received by the EPIC team and
                                managed through our EPIC Demo
                                Requests system.
                            </p>

                            <div className="epic-contact-form-points">

                                <div>
                                    <span>✓</span>
                                    Church inquiries
                                </div>

                                <div>
                                    <span>✓</span>
                                    EPIC System questions
                                </div>

                                <div>
                                    <span>✓</span>
                                    Demo requests
                                </div>

                                <div>
                                    <span>✓</span>
                                    Ministry connections
                                </div>

                            </div>

                        </div>

                        {/* =================================================
                            FORM
                        ================================================= */}

                        <form
                            className="epic-contact-form"
                            onSubmit={handleSubmit}
                        >

                            {/* SUCCESS */}

                            {submitted && (
                                <div
                                    className="epic-contact-success"
                                    role="alert"
                                >
                                    ✓ Thank you for contacting
                                    EPIC. Your message has been
                                    received successfully. Our
                                    team will contact you soon.
                                </div>
                            )}

                            {/* ERROR */}

                            {error && (
                                <div
                                    className="epic-contact-error"
                                    role="alert"
                                >
                                    {error}
                                </div>
                            )}

                            {/* =================================================
                                REQUESTER + EMAIL
                            ================================================= */}

                            <div className="epic-contact-form-row">

                                <div className="epic-contact-field">

                                    <label htmlFor="name">
                                        Requester Name
                                    </label>

                                    <input
                                        id="name"
                                        type="text"
                                        name="name"
                                        placeholder="Enter your full name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        maxLength={150}
                                    />

                                </div>

                                <div className="epic-contact-field">

                                    <label htmlFor="email">
                                        Email Address
                                    </label>

                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        placeholder="you@example.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        maxLength={150}
                                    />

                                </div>

                            </div>

                            {/* =================================================
                                PHONE + POSITION / INQUIRY TYPE
                            ================================================= */}

                            <div className="epic-contact-form-row">

                                <div className="epic-contact-field">

                                    <label htmlFor="phone">
                                        Phone Number
                                    </label>

                                    <input
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        placeholder="+63 9XX XXX XXXX"
                                        value={form.phone}
                                        onChange={handleChange}
                                        maxLength={50}
                                    />

                                </div>

                                <div className="epic-contact-field">

                                    <label htmlFor="subject">
                                        Position / Inquiry Type
                                    </label>

                                    <select
                                        id="subject"
                                        name="subject"
                                        value={form.subject}
                                        onChange={handleChange}
                                        required
                                    >

                                        <option value="">
                                            Select inquiry type
                                        </option>

                                        <option value="EPIC Church">
                                            EPIC Church
                                        </option>

                                        <option value="EPIC Church Management System">
                                            EPIC Church Management System
                                        </option>

                                        <option value="EPIC Learning">
                                            EPIC Learning
                                        </option>

                                        <option value="Request a Demo">
                                            Request a Demo
                                        </option>

                                        <option value="Partnership">
                                            Partnership
                                        </option>

                                        <option value="Other">
                                            Other
                                        </option>

                                    </select>

                                </div>

                            </div>

                            {/* =================================================
                                MESSAGE
                            ================================================= */}

                            <div className="epic-contact-field">

                                <label htmlFor="message">
                                    Message
                                </label>

                                <textarea
                                    id="message"
                                    name="message"
                                    rows={7}
                                    placeholder="Tell us how we can help..."
                                    value={form.message}
                                    onChange={handleChange}
                                    required
                                    maxLength={1000}
                                />

                            </div>

                            {/* =================================================
                                SUBMIT
                            ================================================= */}

                            <button
                                type="submit"
                                className="epic-contact-submit"
                                disabled={submitting}
                            >

                                {submitting
                                    ? "Sending Message..."
                                    : "Send Message"}

                                {!submitting && (
                                    <span>→</span>
                                )}

                            </button>

                            <small className="epic-contact-form-note">
                                Your information will only be
                                used to respond to your inquiry.
                            </small>

                        </form>

                    </div>

                </div>

            </section>

            {/* =====================================================
                CTA
            ===================================================== */}

            <section className="epic-contact-cta">

                <div className="epic-contact-container">

                    <span className="epic-contact-cta-cross">
                        ✝
                    </span>

                    <h2>
                        Your Church Has A Mission.
                    </h2>

                    <h3>
                        Let EPIC Help You Manage It.
                    </h3>

                    <p>
                        Engaging People Into Christ.
                        <br />
                        Empowering Churches Through Technology.
                    </p>

                    <button
                        type="button"
                        className="epic-contact-primary-button"
                        onClick={() =>
                            onNavigate("landing")
                        }
                    >
                        Explore EPIC
                        <span>→</span>
                    </button>

                </div>

            </section>

            {/* =====================================================
                FOOTER
            ===================================================== */}

            <footer className="epic-contact-footer">

                <div className="epic-contact-container">

                    <div className="epic-contact-footer-grid">

                        <div>

                            <div className="epic-contact-footer-logo">
                                EPIC
                            </div>

                            <strong>
                                EPIC CHURCH
                            </strong>

                            <p>
                                Engaging People Into Christ.
                            </p>

                            <small>
                                Church Management &
                                Discipleship Platform
                            </small>

                        </div>

                        <div>

                            <strong>
                                EPIC CHURCH
                            </strong>

                            <button
                                type="button"
                                onClick={() =>
                                    onNavigate("about")
                                }
                            >
                                About EPIC
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    onNavigate("ministries")
                                }
                            >
                                Our Church
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    onNavigate("landing")
                                }
                            >
                                Home
                            </button>

                        </div>

                        <div>

                            <strong>
                                EPIC SYSTEM
                            </strong>

                            <button
                                type="button"
                                onClick={() =>
                                    onNavigate("system")
                                }
                            >
                                Platform
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    onNavigate("pricing")
                                }
                            >
                                Pricing
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    onNavigate("landing")
                                }
                            >
                                Request Demo
                            </button>

                        </div>

                        <div>

                            <strong>
                                CONNECT
                            </strong>

                            <button
                                type="button"
                                className="active"
                            >
                                Contact Us
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    onNavigate("about")
                                }
                            >
                                About Us
                            </button>

                        </div>

                    </div>

                    <div className="epic-contact-footer-bottom">

                        <span>
                            © {new Date().getFullYear()} EPIC
                            Church Management System
                        </span>

                        <span>
                            Engaging People Into Christ
                        </span>

                    </div>

                </div>

            </footer>

        </div>
    );
};

export default ContactPage;