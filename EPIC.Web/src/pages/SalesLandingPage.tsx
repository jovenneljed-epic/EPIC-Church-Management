
import React, { useEffect, useState } from "react";
import "./SalesLandingPage.css";
import { API_BASE_URL } from "../config";

interface SalesLandingPageProps {
    onNavigate?: (page: string) => void;
}

interface Feature {
    icon: string;
    title: string;
    description: string;
}

interface Problem {
    icon: string;
    title: string;
    description: string;
}

interface Step {
    number: string;
    title: string;
    description: string;
}

interface DemoFormData {
    fullName: string;
    email: string;
    churchName: string;
    phone: string;
    position: string;
    message: string;
}

const SalesLandingPage: React.FC<SalesLandingPageProps> = ({
    onNavigate,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);

    // =========================================================
    // DEMO REQUEST STATE
    // =========================================================

    const [showDemoForm, setShowDemoForm] = useState(false);

    const [submittingDemo, setSubmittingDemo] =
        useState(false);

    const [demoSuccess, setDemoSuccess] =
        useState(false);

    const [demoError, setDemoError] =
        useState("");

    const [demoRequestId, setDemoRequestId] =
        useState<number | null>(null);

    const [formData, setFormData] =
        useState<DemoFormData>({
            fullName: "",
            email: "",
            churchName: "",
            phone: "",
            position: "",
            message: "",
        });

    // =========================================================
    // PAGE REVEAL ANIMATION
    // =========================================================

    useEffect(() => {
        const elements =
            document.querySelectorAll(".sales-reveal");

        const observer =
            new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add(
                                "sales-visible"
                            );

                            observer.unobserve(
                                entry.target
                            );
                        }
                    });
                },
                {
                    threshold: 0.12,
                }
            );

        elements.forEach((element) =>
            observer.observe(element)
        );

        return () =>
            observer.disconnect();
    }, []);

    // =========================================================
    // NAVIGATION
    // =========================================================

    const navigate = (
        page: string,
        fallback: string
    ) => {
        setMenuOpen(false);

        if (onNavigate) {
            onNavigate(page);
        } else {
            window.location.href = fallback;
        }
    };

    // =========================================================
    // OPEN DEMO FORM
    // =========================================================

    const openDemoForm = () => {
        setMenuOpen(false);
        setDemoError("");
        setDemoSuccess(false);
        setDemoRequestId(null);

        setShowDemoForm(true);
    };

    // =========================================================
    // CLOSE DEMO FORM
    // =========================================================

    const closeDemoForm = () => {
        if (submittingDemo) {
            return;
        }

        setShowDemoForm(false);
        setDemoError("");
        setDemoSuccess(false);
        setDemoRequestId(null);
    };

    // =========================================================
    // FORM INPUT
    // =========================================================

    const handleFormChange = (
        event: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement
        >
    ) => {
        const {
            name,
            value,
        } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));

        if (demoError) {
            setDemoError("");
        }
    };

    // =========================================================
    // SUBMIT DEMO REQUEST
    // =========================================================

    const handleDemoSubmit = async (
        event: React.FormEvent
    ) => {
        event.preventDefault();

        if (submittingDemo) {
            return;
        }

        setDemoError("");

        // -----------------------------------------------------
        // BASIC CLIENT VALIDATION
        // -----------------------------------------------------

        if (
            !formData.fullName.trim() ||
            !formData.email.trim() ||
            !formData.churchName.trim()
        ) {
            setDemoError(
                "Please complete your name, email address, and church/organization name."
            );

            return;
        }

        if (!formData.email.includes("@")) {
            setDemoError(
                "Please enter a valid email address."
            );

            return;
        }

        try {
            setSubmittingDemo(true);

            // -------------------------------------------------
            // PAYLOAD
            //
            // Matches the existing DemoRequest model used by
            // DemoRequestsController.
            // -------------------------------------------------

            const payload = {
                fullName:
                    formData.fullName.trim(),

                email:
                    formData.email
                        .trim()
                        .toLowerCase(),

                churchName:
                    formData.churchName.trim(),

                phone:
                    formData.phone.trim() ||
                    null,

                position:
                    formData.position.trim() ||
                    null,

                message:
                    formData.message.trim() ||
                    null,
            };

            console.log(
                "Submitting EPIC demo request:",
                payload
            );

            // -------------------------------------------------
            // EXISTING DATABASE API
            // POST /api/DemoRequests
            // -------------------------------------------------

            const response =
                await fetch(
                    `${API_BASE_URL}/DemoRequests`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify(
                                payload
                            ),
                    }
                );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            console.log(
                "Demo request response:",
                response.status,
                data
            );

            // -------------------------------------------------
            // API ERROR
            // -------------------------------------------------

            if (!response.ok) {
                let errorMessage =
                    data?.message ||
                    data?.title ||
                    `Unable to submit your request. (${response.status})`;

                if (data?.errors) {
                    const validationErrors =
                        Object.entries(
                            data.errors
                        ).flatMap(
                            ([
                                field,
                                messages,
                            ]) =>
                                (
                                    messages as string[]
                                ).map(
                                    (message) =>
                                        `${field}: ${message}`
                                )
                        );

                    if (
                        validationErrors.length >
                        0
                    ) {
                        errorMessage +=
                            " " +
                            validationErrors.join(
                                " "
                            );
                    }
                }

                throw new Error(
                    errorMessage
                );
            }

            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            setDemoRequestId(
                Number(
                    data?.demoRequestId
                ) || null
            );

            setDemoSuccess(true);

            // Clear form after successful submission
            setFormData({
                fullName: "",
                email: "",
                churchName: "",
                phone: "",
                position: "",
                message: "",
            });
        } catch (error) {
            console.error(
                "Sales Landing Page demo request error:",
                error
            );

            setDemoError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while submitting your request. Please try again."
            );
        } finally {
            setSubmittingDemo(false);
        }
    };

    // =========================================================
    // CLIENT LOGIN
    // =========================================================

    const goToLogin = () => {
        navigate(
            "client-login",
            "/client-login"
        );
    };

    // =========================================================
    // PROBLEMS
    // =========================================================

    const problems: Problem[] = [
        {
            icon: "▦",
            title: "Scattered Records",
            description:
                "Member information, attendance, giving and ministry records are often spread across spreadsheets, notebooks and files.",
        },
        {
            icon: "◷",
            title: "Wasted Time",
            description:
                "Church administrators spend valuable hours searching for information and repeating manual tasks.",
        },
        {
            icon: "⌁",
            title: "Limited Visibility",
            description:
                "Important church information can be difficult to track, understand and turn into useful decisions.",
        },
        {
            icon: "◈",
            title: "Security Concerns",
            description:
                "Church information deserves a centralized system with controlled access and organized records.",
        },
    ];

    // =========================================================
    // FEATURES
    // =========================================================

    const features: Feature[] = [
        {
            icon: "♟",
            title: "Members",
            description:
                "Centralize member profiles, personal information and church records in one organized system.",
        },
        {
            icon: "✓",
            title: "Attendance",
            description:
                "Record attendance and gain a clearer picture of participation across your church services.",
        },
        {
            icon: "₱",
            title: "Giving",
            description:
                "Organize tithes, offerings and giving records while keeping financial information easier to manage.",
        },
        {
            icon: "⛪",
            title: "Church Services",
            description:
                "Create and manage church services, schedules and service information from one place.",
        },
        {
            icon: "◆",
            title: "Events",
            description:
                "Plan church events, programs, assignments and activities without relying on disconnected tools.",
        },
        {
            icon: "♫",
            title: "Ministries",
            description:
                "Manage ministries, ministry members and assignments while keeping everything organized.",
        },
        {
            icon: "●",
            title: "Visitors",
            description:
                "Track visitors and follow-up information so your church can build meaningful connections.",
        },
        {
            icon: "▤",
            title: "Reports",
            description:
                "Access useful church reports and information to help leaders understand what is happening.",
        },
    ];

    // =========================================================
    // STEPS
    // =========================================================

    const steps: Step[] = [
        {
            number: "01",
            title: "Request Your Demo",
            description:
                "Tell us a little about your church and discover how EPIC can support your ministry operations.",
        },
        {
            number: "02",
            title: "Set Up Your Church",
            description:
                "Configure your church profile, members, ministries, services and other essential information.",
        },
        {
            number: "03",
            title: "Start Managing",
            description:
                "Bring your church operations together and manage your ministry from one connected dashboard.",
        },
    ];

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="sales-page">

            {/* =================================================
                BACKGROUND
            ================================================= */}

            <div className="sales-bg sales-bg-one" />
            <div className="sales-bg sales-bg-two" />
            <div className="sales-bg sales-bg-three" />
            <div className="sales-grid" />

            {/* =================================================
                NAVIGATION
            ================================================= */}

            <header className="sales-navbar">

                <div
                    className="sales-brand"
                    onClick={() =>
                        window.scrollTo({
                            top: 0,
                            behavior: "smooth",
                        })
                    }
                >
                    <div className="sales-brand-logo">
                        EPIC
                    </div>

                    <div className="sales-brand-text">
                        <strong>
                            EPIC CHURCH
                        </strong>

                        <span>
                            MANAGEMENT SYSTEM
                        </span>
                    </div>
                </div>

                <button
                    className="sales-mobile-menu"
                    onClick={() =>
                        setMenuOpen(
                            (value) => !value
                        )
                    }
                    aria-label="Toggle navigation"
                >
                    {menuOpen
                        ? "×"
                        : "☰"}
                </button>

                <nav
                    className={`sales-nav ${
                        menuOpen
                            ? "sales-nav-open"
                            : ""
                    }`}
                >
                    <a
                        href="#features"
                        onClick={() =>
                            setMenuOpen(false)
                        }
                    >
                        Features
                    </a>

                    <a
                        href="#how-it-works"
                        onClick={() =>
                            setMenuOpen(false)
                        }
                    >
                        How It Works
                    </a>

                    <a
                        href="#learning"
                        onClick={() =>
                            setMenuOpen(false)
                        }
                    >
                        EPIC Learning
                    </a>

                    <a
                        href="#pricing"
                        onClick={() =>
                            setMenuOpen(false)
                        }
                    >
                        Pricing
                    </a>

                    <button
                        className="sales-login-button"
                        onClick={goToLogin}
                    >
                        Client Login
                    </button>
                </nav>
            </header>

            {/* =================================================
                HERO
            ================================================= */}

            <main>

                <section className="sales-hero">

                    <div className="sales-hero-content sales-reveal">

                        <div className="sales-badge">
                            <span className="sales-pulse" />
                            BUILT FOR MODERN CHURCHES
                        </div>

                        <h1>
                            Stop Managing Your Church
                            <span>
                                With Spreadsheets.
                            </span>
                        </h1>

                        <p className="sales-hero-description">
                            Meet EPIC — an all-in-one
                            church management platform
                            designed to help churches
                            organize members, attendance,
                            giving, ministries, events,
                            discipleship and more.
                        </p>

                        <div className="sales-hero-actions">

                            <button
                                className="sales-primary-button"
                                onClick={
                                    openDemoForm
                                }
                            >
                                <span>
                                    Get Started
                                </span>

                                <b>
                                    →
                                </b>
                            </button>

                            <a
                                href="#video"
                                className="sales-video-button"
                            >
                                <span className="sales-play-icon">
                                    ▶
                                </span>

                                <span>
                                    Watch EPIC in Action
                                </span>
                            </a>

                        </div>

                        <div className="sales-trust-row">
                            <span>
                                ✓ Cloud-Based
                            </span>

                            <span>
                                ✓ Secure
                            </span>

                            <span>
                                ✓ Church-Focused
                            </span>

                            <span>
                                ✓ Easy to Use
                            </span>
                        </div>

                    </div>

                    {/* HERO DASHBOARD */}

                    <div className="sales-hero-visual sales-reveal">

                        <div className="sales-floating sales-floating-one">
                            <strong>
                                127
                            </strong>

                            <span>
                                Members
                            </span>
                        </div>

                        <div className="sales-floating sales-floating-two">
                            <strong>
                                94%
                            </strong>

                            <span>
                                Attendance
                            </span>
                        </div>

                        <div className="sales-dashboard-shadow" />

                        <div className="sales-dashboard">

                            <div className="sales-dashboard-header">

                                <div className="sales-dashboard-title">
                                    <span className="sales-live-dot" />

                                    EPIC DASHBOARD
                                </div>

                                <div className="sales-live">
                                    ● LIVE
                                </div>

                            </div>

                            <div className="sales-dashboard-layout">

                                <aside className="sales-dashboard-sidebar">

                                    <div className="sales-mini-logo">
                                        E
                                    </div>

                                    <span>⌂</span>
                                    <span>♟</span>
                                    <span>✓</span>
                                    <span>₱</span>
                                    <span>♫</span>
                                    <span>⚙</span>

                                </aside>

                                <div className="sales-dashboard-main">

                                    <div className="sales-dashboard-welcome">

                                        <div>
                                            <small>
                                                WELCOME BACK
                                            </small>

                                            <h3>
                                                Church Dashboard
                                            </h3>
                                        </div>

                                        <span>
                                            AUG 2026
                                        </span>

                                    </div>

                                    <div className="sales-dashboard-stats">

                                        <div className="sales-dashboard-stat">
                                            <span>
                                                MEMBERS
                                            </span>

                                            <strong>
                                                127
                                            </strong>

                                            <small>
                                                ↑ 12.4%
                                            </small>
                                        </div>

                                        <div className="sales-dashboard-stat">
                                            <span>
                                                ATTENDANCE
                                            </span>

                                            <strong>
                                                94%
                                            </strong>

                                            <small>
                                                ↑ 8.2%
                                            </small>
                                        </div>

                                        <div className="sales-dashboard-stat">
                                            <span>
                                                GIVING
                                            </span>

                                            <strong>
                                                ₱48K
                                            </strong>

                                            <small>
                                                This Month
                                            </small>
                                        </div>

                                    </div>

                                    <div className="sales-dashboard-chart">

                                        <div className="sales-chart-heading">

                                            <strong>
                                                Church Growth
                                            </strong>

                                            <span>
                                                LAST 6 MONTHS
                                            </span>

                                        </div>

                                        <div className="sales-chart-area">

                                            <div className="sales-chart-line" />

                                            <div className="sales-chart-bars">
                                                <i />
                                                <i />
                                                <i />
                                                <i />
                                                <i />
                                                <i />
                                                <i />
                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    VIDEO
                ================================================= */}

                <section
                    id="video"
                    className="sales-video-section"
                >

                    <div className="sales-section-heading sales-reveal">

                        <div className="sales-eyebrow">
                            SEE EPIC IN ACTION
                        </div>

                        <h2>
                            Your Church.
                            <span>
                                One Powerful System.
                            </span>
                        </h2>

                        <p>
                            See how EPIC brings your
                            church operations, people
                            and ministry information
                            together in one simple platform.
                        </p>

                    </div>

                    <div className="sales-video-wrapper sales-reveal">

                        <div className="sales-video-frame">

                            <div className="sales-video-screen">

                                <div className="sales-video-content">

                                    <div className="sales-video-play-large">
                                        ▶
                                    </div>

                                    <strong>
                                        EPIC CHURCH MANAGEMENT SYSTEM
                                    </strong>

                                    <span>
                                        PRODUCT OVERVIEW
                                    </span>

                                    <small>
                                        Watch how EPIC helps
                                        your church become
                                        more organized and
                                        connected.
                                    </small>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    PROBLEM
                ================================================= */}

                <section className="sales-problem-section">

                    <div className="sales-section-heading sales-reveal">

                        <div className="sales-eyebrow">
                            THE PROBLEM
                        </div>

                        <h2>
                            Church Administration
                            Shouldn't Be This
                            <span>
                                Complicated.
                            </span>
                        </h2>

                        <p>
                            Your church should spend
                            more time serving people
                            and less time fighting with
                            paperwork.
                        </p>

                    </div>

                    <div className="sales-problem-grid">

                        {problems.map(
                            (
                                problem,
                                index
                            ) => (
                                <div
                                    key={
                                        problem.title
                                    }
                                    className="sales-problem-card sales-reveal"
                                    style={{
                                        transitionDelay:
                                            `${index * 80}ms`,
                                    }}
                                >

                                    <div className="sales-card-icon">
                                        {
                                            problem.icon
                                        }
                                    </div>

                                    <h3>
                                        {
                                            problem.title
                                        }
                                    </h3>

                                    <p>
                                        {
                                            problem.description
                                        }
                                    </p>

                                </div>
                            )
                        )}

                    </div>

                </section>

                {/* =================================================
                    FEATURES
                ================================================= */}

                <section
                    id="features"
                    className="sales-features-section"
                >

                    <div className="sales-section-heading sales-reveal">

                        <div className="sales-eyebrow">
                            THE EPIC SOLUTION
                        </div>

                        <h2>
                            Everything Your Church Needs.
                            <span>
                                One Platform.
                            </span>
                        </h2>

                        <p>
                            EPIC connects the essential
                            systems your church needs
                            to operate, organize and grow.
                        </p>

                    </div>

                    <div className="sales-feature-grid">

                        {features.map(
                            (
                                feature,
                                index
                            ) => (
                                <div
                                    className="sales-feature-card sales-reveal"
                                    key={
                                        feature.title
                                    }
                                    style={{
                                        transitionDelay:
                                            `${index * 60}ms`,
                                    }}
                                >

                                    <div className="sales-feature-top">

                                        <div className="sales-feature-icon">
                                            {
                                                feature.icon
                                            }
                                        </div>

                                        <span className="sales-feature-number">
                                            0
                                            {index + 1}
                                        </span>

                                    </div>

                                    <h3>
                                        {
                                            feature.title
                                        }
                                    </h3>

                                    <p>
                                        {
                                            feature.description
                                        }
                                    </p>

                                    <div className="sales-feature-link">
                                        Learn more
                                        <span>
                                            →
                                        </span>
                                    </div>

                                </div>
                            )
                        )}

                    </div>

                </section>

                {/* =================================================
                    HOW IT WORKS
                ================================================= */}

                <section
                    id="how-it-works"
                    className="sales-how-section"
                >

                    <div className="sales-section-heading sales-reveal">

                        <div className="sales-eyebrow">
                            SIMPLE PROCESS
                        </div>

                        <h2>
                            Get Your Church
                            <span>
                                Organized.
                            </span>
                        </h2>

                        <p>
                            Getting started with EPIC
                            is designed to be simple,
                            practical and church-friendly.
                        </p>

                    </div>

                    <div className="sales-steps">

                        {steps.map(
                            (
                                step,
                                index
                            ) => (
                                <div
                                    className="sales-step sales-reveal"
                                    key={
                                        step.number
                                    }
                                >

                                    <div className="sales-step-number">
                                        {
                                            step.number
                                        }
                                    </div>

                                    <div className="sales-step-content">

                                        <span>
                                            STEP{" "}
                                            {index + 1}
                                        </span>

                                        <h3>
                                            {
                                                step.title
                                            }
                                        </h3>

                                        <p>
                                            {
                                                step.description
                                            }
                                        </p>

                                    </div>

                                    {index <
                                        steps.length -
                                            1 && (
                                        <div className="sales-step-connector">
                                            →
                                        </div>
                                    )}

                                </div>
                            )
                        )}

                    </div>

                </section>

                {/* =================================================
                    LEARNING
                ================================================= */}

                <section
                    id="learning"
                    className="sales-learning-section"
                >

                    <div className="sales-learning-content sales-reveal">

                        <div className="sales-eyebrow">
                            MORE THAN MANAGEMENT
                        </div>

                        <h2>
                            Equip People.
                            <span>
                                Build Disciples.
                            </span>
                        </h2>

                        <p>
                            EPIC Learning brings online
                            discipleship and church
                            education into the same ecosystem.
                        </p>

                        <div className="sales-learning-list">

                            <div>
                                <b>✓</b>
                                Self-paced courses
                            </div>

                            <div>
                                <b>✓</b>
                                Structured lessons
                            </div>

                            <div>
                                <b>✓</b>
                                Progress tracking
                            </div>

                            <div>
                                <b>✓</b>
                                Certificates
                            </div>

                        </div>

                        <button
                            className="sales-primary-button"
                            onClick={
                                openDemoForm
                            }
                        >
                            Explore EPIC Learning
                            <b>
                                →
                            </b>
                        </button>

                    </div>

                    <div className="sales-learning-visual sales-reveal">

                        <div className="sales-learning-glow" />

                        <div className="sales-course-card">

                            <div className="sales-course-header">

                                <div>
                                    <span>
                                        EPIC LEARNING
                                    </span>

                                    <strong>
                                        Foundations of Faith
                                    </strong>
                                </div>

                                <b>
                                    78%
                                </b>

                            </div>

                            <div className="sales-progress-bar">
                                <span />
                            </div>

                            <div className="sales-course-meta">
                                <span>
                                    8 Lessons
                                </span>

                                <span>
                                    Self-Paced
                                </span>

                                <span>
                                    Certificate
                                </span>
                            </div>

                            <div className="sales-course-lessons">

                                <div className="completed">
                                    <i>
                                        ✓
                                    </i>

                                    Introduction to Faith
                                </div>

                                <div className="completed">
                                    <i>
                                        ✓
                                    </i>

                                    Foundations of Faith
                                </div>

                                <div className="completed">
                                    <i>
                                        ✓
                                    </i>

                                    Understanding Faith
                                </div>

                                <div>
                                    <i>
                                        ○
                                    </i>

                                    Spiritual Growth
                                </div>

                            </div>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    FINAL CTA
                ================================================= */}

                <section
                    id="pricing"
                    className="sales-final-section"
                >

                    <div className="sales-final-glow" />

                    <div className="sales-final-content sales-reveal">

                        <div className="sales-eyebrow">
                            READY TO MOVE FORWARD?
                        </div>

                        <h2>
                            Your Church Deserves
                            <span>
                                Better Tools.
                            </span>
                        </h2>

                        <p>
                            Stop managing your church
                            through disconnected systems.
                            Start building a more organized,
                            connected and empowered church
                            with EPIC.
                        </p>

                        <div className="sales-final-actions">

                            <button
                                className="sales-primary-button sales-large-button"
                                onClick={
                                    openDemoForm
                                }
                            >
                                Start Your EPIC Journey
                                <b>
                                    →
                                </b>
                            </button>

                            <button
                                type="button"
                                className="sales-secondary-button"
                                onClick={() =>
                                    navigate(
                                        "offer",
                                        "/offer"
                                    )
                                }
                            >
                                View Plans & Pricing
                                <b>
                                    →
                                </b>
                            </button>

                        </div>

                        <div className="sales-final-note">
                            No complicated setup
                            &nbsp; • &nbsp;
                            Church-focused
                            &nbsp; • &nbsp;
                            Built to grow with you
                        </div>

                    </div>

                </section>

            </main>

            {/* =================================================
                FOOTER
            ================================================= */}

            <footer className="sales-footer">

                <div className="sales-brand">

                    <div className="sales-brand-logo">
                        EPIC
                    </div>

                    <div className="sales-brand-text">

                        <strong>
                            EPIC CHURCH
                        </strong>

                        <span>
                            MANAGEMENT SYSTEM
                        </span>

                    </div>

                </div>

                <div className="sales-footer-copy">
                    ©{" "}
                    {new Date().getFullYear()}{" "}
                    EPIC Church Management System.
                    <br />
                    Engaging People Into Christ.
                </div>

            </footer>

            {/* =================================================
                MOBILE CTA
            ================================================= */}

            <div className="sales-mobile-cta">

                <button
                    onClick={
                        openDemoForm
                    }
                >
                    Get Started
                    <span>
                        →
                    </span>
                </button>

            </div>

            {/* =================================================
                DEMO REQUEST MODAL
            ================================================= */}

            {showDemoForm && (

                <div
                    className="sales-demo-overlay"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeDemoForm();
                        }

                    }}
                >

                    <div
                        className="sales-demo-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="sales-demo-title"
                    >

                        {/* MODAL HEADER */}

                        <div className="sales-demo-header">

                            <div>

                                <div className="sales-eyebrow">
                                    EPIC CHURCH MANAGEMENT SYSTEM
                                </div>

                                <h2 id="sales-demo-title">
                                    Start Your
                                    <span>
                                        EPIC Journey.
                                    </span>
                                </h2>

                                <p>
                                    Tell us a little about
                                    your church and our team
                                    will contact you to discuss
                                    how EPIC can help.
                                </p>

                            </div>

                            <button
                                type="button"
                                className="sales-demo-close"
                                onClick={
                                    closeDemoForm
                                }
                                disabled={
                                    submittingDemo
                                }
                                aria-label="Close"
                            >
                                ×
                            </button>

                        </div>

                        {/* SUCCESS */}

                        {demoSuccess ? (

                            <div className="sales-demo-success">

                                <div className="sales-demo-success-icon">
                                    ✓
                                </div>

                                <h3>
                                    Request Submitted!
                                </h3>

                                <p>
                                    Thank you for your
                                    interest in EPIC.
                                    Your demo request has
                                    been successfully
                                    received.
                                </p>

                                {demoRequestId && (
                                    <div className="sales-demo-reference">
                                        Request #
                                        {demoRequestId}
                                    </div>
                                )}

                                <p className="sales-demo-success-note">
                                    Please check your email
                                    for a confirmation message.
                                    Our EPIC team will contact
                                    you soon.
                                </p>

                                <button
                                    type="button"
                                    className="sales-primary-button sales-demo-done-button"
                                    onClick={
                                        closeDemoForm
                                    }
                                >
                                    Done
                                    <b>
                                        ✓
                                    </b>
                                </button>

                            </div>

                        ) : (

                            /* FORM */

                            <form
                                className="sales-demo-form"
                                onSubmit={
                                    handleDemoSubmit
                                }
                            >

                                {demoError && (

                                    <div className="sales-demo-error">
                                        {demoError}
                                    </div>

                                )}

                                <div className="sales-demo-form-grid">

                                    {/* FULL NAME */}

                                    <div className="sales-demo-field">

                                        <label htmlFor="fullName">
                                            Your Name
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <input
                                            id="fullName"
                                            name="fullName"
                                            type="text"
                                            value={
                                                formData.fullName
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            placeholder="Enter your full name"
                                            required
                                            disabled={
                                                submittingDemo
                                            }
                                        />

                                    </div>

                                    {/* EMAIL */}

                                    <div className="sales-demo-field">

                                        <label htmlFor="email">
                                            Email Address
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={
                                                formData.email
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            placeholder="you@example.com"
                                            required
                                            disabled={
                                                submittingDemo
                                            }
                                        />

                                    </div>

                                    {/* CHURCH */}

                                    <div className="sales-demo-field sales-demo-field-full">

                                        <label htmlFor="churchName">
                                            Church / Organization Name
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <input
                                            id="churchName"
                                            name="churchName"
                                            type="text"
                                            value={
                                                formData.churchName
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            placeholder="Enter your church or organization"
                                            required
                                            disabled={
                                                submittingDemo
                                            }
                                        />

                                    </div>

                                    {/* PHONE */}

                                    <div className="sales-demo-field">

                                        <label htmlFor="phone">
                                            Mobile Number
                                        </label>

                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={
                                                formData.phone
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            placeholder="+63 9XX XXX XXXX"
                                            disabled={
                                                submittingDemo
                                            }
                                        />

                                    </div>

                                    {/* POSITION */}

                                    <div className="sales-demo-field">

                                        <label htmlFor="position">
                                            Your Position
                                        </label>

                                        <input
                                            id="position"
                                            name="position"
                                            type="text"
                                            value={
                                                formData.position
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            placeholder="Pastor, Administrator, Leader..."
                                            disabled={
                                                submittingDemo
                                            }
                                        />

                                    </div>

                                    {/* MESSAGE */}

                                    <div className="sales-demo-field sales-demo-field-full">

                                        <label htmlFor="message">
                                            Message
                                        </label>

                                        <textarea
                                            id="message"
                                            name="message"
                                            rows={4}
                                            value={
                                                formData.message
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            placeholder="Tell us how EPIC could help your church..."
                                            disabled={
                                                submittingDemo
                                            }
                                        />

                                    </div>

                                </div>

                                {/* AGREEMENT */}

                                <div className="sales-demo-agreement">

                                    <span>
                                        ✓
                                    </span>

                                    <p>
                                        By continuing,
                                        you agree to be
                                        contacted regarding
                                        the EPIC Church
                                        Management System.
                                    </p>

                                </div>

                                {/* ACTIONS */}

                                <div className="sales-demo-actions">

                                    <button
                                        type="button"
                                        className="sales-demo-cancel"
                                        onClick={
                                            closeDemoForm
                                        }
                                        disabled={
                                            submittingDemo
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="sales-primary-button sales-demo-submit"
                                        disabled={
                                            submittingDemo
                                        }
                                    >

                                        {submittingDemo ? (
                                            <>
                                                <span className="sales-demo-spinner" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                Continue to EPIC
                                                <b>
                                                    →
                                                </b>
                                            </>
                                        )}

                                    </button>

                                </div>

                                <div className="sales-demo-security">
                                    🔐 Your information is
                                    kept secure.
                                </div>

                            </form>

                        )}

                    </div>

                </div>

            )}

        </div>
    );
};

export default SalesLandingPage;

