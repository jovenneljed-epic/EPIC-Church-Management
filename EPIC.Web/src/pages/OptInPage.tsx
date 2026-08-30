
import React, { useEffect, useState } from "react";
import "./OptInPage.css";

interface OptInPageProps {
    onNavigate?: (page: string) => void;
}

const OptInPage: React.FC<OptInPageProps> = ({
    onNavigate,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        churchName: "",
        phone: "",
        churchSize: "",
    });

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    const handleChange = (
        event: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const goToOffer = () => {
        if (onNavigate) {
            onNavigate("offer");
        } else {
            window.location.href = "/offer";
        }
    };

    const goToSales = () => {
        if (onNavigate) {
            onNavigate("sales");
        } else {
            window.location.href = "/";
        }
    };

    const goToLogin = () => {
        if (onNavigate) {
            onNavigate("client-login");
        } else {
            window.location.href = "/client-login";
        }
    };

    const handleSubmit = (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        /*
         * UI / NAVIGATION ONLY
         *
         * No API call yet.
         * We will connect this form to the ASP.NET API
         * after the funnel UI is completed.
         */

        setSubmitted(true);

        setTimeout(() => {
            goToOffer();
        }, 700);
    };

    return (
        <div className="optin-page">

            {/* BACKGROUND */}
            <div className="optin-bg-grid" />
            <div className="optin-bg-glow optin-glow-one" />
            <div className="optin-bg-glow optin-glow-two" />

            {/* NAVBAR */}
            <header className="optin-navbar">

                <button
                    className="optin-brand"
                    onClick={goToSales}
                    type="button"
                >
                    <div className="optin-brand-logo">
                        EPIC
                    </div>

                    <div className="optin-brand-text">
                        <strong>
                            EPIC CHURCH
                        </strong>

                        <span>
                            MANAGEMENT SYSTEM
                        </span>
                    </div>
                </button>

                <button
                    className="optin-mobile-menu"
                    type="button"
                    onClick={() =>
                        setMenuOpen((previous) => !previous)
                    }
                    aria-label="Toggle navigation"
                >
                    ☰
                </button>

                <nav
                    className={`optin-nav ${
                        menuOpen
                            ? "optin-nav-open"
                            : ""
                    }`}
                >
                    <button
                        type="button"
                        onClick={goToSales}
                    >
                        Home
                    </button>

                    <a href="/#features">
                        Features
                    </a>

                    <a href="/#learning">
                        EPIC Learning
                    </a>

                    <button
                        type="button"
                        className="optin-login-button"
                        onClick={goToLogin}
                    >
                        Client Login
                    </button>
                </nav>
            </header>

            {/* MAIN */}
            <main className="optin-main">

                {/* LEFT SIDE */}
                <section className="optin-content">

                    <div className="optin-eyebrow">
                        <span className="optin-live-dot" />
                        START YOUR DIGITAL JOURNEY
                    </div>

                    <h1>
                        Let's Build a
                        <span>
                            Better Church System.
                        </span>
                    </h1>

                    <p className="optin-intro">
                        Tell us a little about your church
                        and discover how EPIC can help you
                        organize your people, services,
                        ministries, giving, discipleship,
                        and church operations.
                    </p>

                    <div className="optin-benefits">

                        <div className="optin-benefit">
                            <div className="optin-benefit-icon">
                                ✓
                            </div>

                            <div>
                                <strong>
                                    Church Management
                                </strong>

                                <span>
                                    Organize your church
                                    information in one place.
                                </span>
                            </div>
                        </div>

                        <div className="optin-benefit">
                            <div className="optin-benefit-icon">
                                ✓
                            </div>

                            <div>
                                <strong>
                                    EPIC Learning
                                </strong>

                                <span>
                                    Equip and disciple people
                                    through online learning.
                                </span>
                            </div>
                        </div>

                        <div className="optin-benefit">
                            <div className="optin-benefit-icon">
                                ✓
                            </div>

                            <div>
                                <strong>
                                    One Connected Platform
                                </strong>

                                <span>
                                    Bring church operations
                                    together in one ecosystem.
                                </span>
                            </div>
                        </div>

                    </div>

                    <div className="optin-trust">

                        <span>🔒 Secure</span>
                        <span>☁ Cloud-Based</span>
                        <span>⚡ Easy Setup</span>

                    </div>

                </section>

                {/* FORM SIDE */}
                <section className="optin-form-wrapper">

                    <div className="optin-form-glow" />

                    <div className="optin-form-card">

                        <div className="optin-form-header">

                            <div className="optin-form-step">
                                STEP 01
                            </div>

                            <h2>
                                Tell Us About
                                <span>
                                    Your Church
                                </span>
                            </h2>

                            <p>
                                Complete this short form
                                to continue to the EPIC
                                package.
                            </p>

                        </div>

                        <form
                            className="optin-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="optin-field">

                                <label htmlFor="name">
                                    Your Name
                                </label>

                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="optin-field">

                                <label htmlFor="email">
                                    Email Address
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="optin-field">

                                <label htmlFor="churchName">
                                    Church / Organization Name
                                </label>

                                <input
                                    id="churchName"
                                    name="churchName"
                                    type="text"
                                    placeholder="Enter your church name"
                                    value={formData.churchName}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="optin-row">

                                <div className="optin-field">

                                    <label htmlFor="phone">
                                        Mobile Number
                                    </label>

                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        placeholder="+63 9XX XXX XXXX"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />

                                </div>

                                <div className="optin-field">

                                    <label htmlFor="churchSize">
                                        Church Size
                                    </label>

                                    <select
                                        id="churchSize"
                                        name="churchSize"
                                        value={formData.churchSize}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">
                                            Select size
                                        </option>

                                        <option value="1-50">
                                            1–50
                                        </option>

                                        <option value="51-100">
                                            51–100
                                        </option>

                                        <option value="101-250">
                                            101–250
                                        </option>

                                        <option value="251-500">
                                            251–500
                                        </option>

                                        <option value="500+">
                                            500+
                                        </option>
                                    </select>

                                </div>

                            </div>

                            <div className="optin-consent">

                                <span className="optin-check">
                                    ✓
                                </span>

                                <p>
                                    By continuing, you agree
                                    to be contacted regarding
                                    EPIC Church Management
                                    System.
                                </p>

                            </div>

                            <button
                                className={`optin-submit ${
                                    submitted
                                        ? "optin-submitted"
                                        : ""
                                }`}
                                type="submit"
                                disabled={submitted}
                            >
                                {submitted ? (
                                    <>
                                        Preparing Your
                                        EPIC Experience...
                                        <span>✓</span>
                                    </>
                                ) : (
                                    <>
                                        Continue to EPIC
                                        <span>→</span>
                                    </>
                                )}
                            </button>

                            <div className="optin-security">
                                🔐 Your information is kept
                                secure.
                            </div>

                        </form>

                    </div>

                </section>

            </main>

            {/* BOTTOM MESSAGE */}
            <section className="optin-bottom">

                <div className="optin-bottom-line" />

                <p>
                    <strong>
                        EPIC
                    </strong>{" "}
                    — Engaging People Into Christ
                </p>

                <span>
                    Church management + discipleship
                    in one powerful ecosystem.
                </span>

            </section>

        </div>
    );
};

export default OptInPage;

