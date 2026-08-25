import React, {
    useCallback,
    useEffect,
    useState,
} from "react";

import "./LandingPage.css";
import { API_BASE_URL } from "../config";
import { initializeWebsiteAnalytics } from "../analytics/websiteAnalytics";

// =========================================================
// TYPES
// =========================================================

interface LandingPageProps {
    onLogin: () => void;
    onNavigate?: (page: string) => void;
}

interface DemoFormData {
    churchName: string;
    fullName: string;
    email: string;
    phone: string;
    churchSize: string;
    message: string;
}

interface DemoResponse {
    success?: boolean;
    message?: string;
    demoRequestId?: number;
}

// =========================================================
// CONSTANTS
// =========================================================

const INITIAL_DEMO_FORM: DemoFormData = {
    churchName: "",
    fullName: "",
    email: "",
    phone: "",
    churchSize: "",
    message: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// =========================================================
// COMPONENT
// =========================================================

const LandingPage: React.FC<LandingPageProps> = ({
    onLogin,
    onNavigate,
}) => {
    // =====================================================
    // STATE
    // =====================================================

    const [menuOpen, setMenuOpen] = useState(false);

    const [demoForm, setDemoForm] =
        useState<DemoFormData>(INITIAL_DEMO_FORM);

    const [demoSubmitting, setDemoSubmitting] =
        useState(false);

    const [demoSuccess, setDemoSuccess] =
        useState("");

    const [demoError, setDemoError] =
        useState("");

    // =====================================================
    // NAVIGATION
    // =====================================================

    const closeMobileMenu = useCallback(() => {
        setMenuOpen(false);
    }, []);

    const scrollToSection = useCallback(
        (id: string) => {
            const element =
                document.getElementById(id);

            if (element) {
                element.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }

            closeMobileMenu();
        },
        [closeMobileMenu]
    );

    const navigateTo = useCallback(
        (page: string) => {
            closeMobileMenu();
            onNavigate?.(page);
        },
        [closeMobileMenu, onNavigate]
    );

    // =====================================================
    // WEBSITE ANALYTICS
    // =====================================================

    useEffect(() => {
        try {
            initializeWebsiteAnalytics();
        } catch (error) {
            console.error(
                "EPIC website analytics initialization failed:",
                error
            );
        }
    }, []);

    // =====================================================
    // NAVBAR SCROLL EFFECT
    // =====================================================

    useEffect(() => {
        const handleScroll = () => {
            const navbar =
                document.querySelector(
                    ".epic-public-navbar"
                );

            if (!navbar) {
                return;
            }

            navbar.classList.toggle(
                "epic-public-navbar-scrolled",
                window.scrollY > 40
            );
        };

        window.addEventListener(
            "scroll",
            handleScroll,
            { passive: true }
        );

        handleScroll();

        return () => {
            window.removeEventListener(
                "scroll",
                handleScroll
            );
        };
    }, []);

    // =====================================================
    // DEMO FORM
    // =====================================================

    const handleDemoChange = useCallback(
        (
            event: React.ChangeEvent<
                HTMLInputElement |
                HTMLTextAreaElement |
                HTMLSelectElement
            >
        ) => {
            const {
                name,
                value,
            } = event.target;

            setDemoForm((previous) => ({
                ...previous,
                [name]: value,
            }));

            setDemoError("");
            setDemoSuccess("");
        },
        []
    );

    // =====================================================
    // DEMO FORM VALIDATION
    // =====================================================

    const validateDemoForm = useCallback(() => {
        if (!demoForm.churchName.trim()) {
            return "Please enter your church name.";
        }

        if (!demoForm.fullName.trim()) {
            return "Please enter your name.";
        }

        if (!demoForm.email.trim()) {
            return "Please enter your email address.";
        }

        if (
            !EMAIL_REGEX.test(
                demoForm.email.trim()
            )
        ) {
            return "Please enter a valid email address.";
        }

        if (!demoForm.churchSize) {
            return "Please select your church size.";
        }

        return null;
    }, [demoForm]);

    // =====================================================
    // SUBMIT DEMO REQUEST
    // =====================================================

    const handleDemoSubmit = useCallback(
        async (
            event: React.FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            setDemoError("");
            setDemoSuccess("");

            const validationError =
                validateDemoForm();

            if (validationError) {
                setDemoError(validationError);
                return;
            }

            const finalMessage = [
                `Church Size: ${demoForm.churchSize}`,
                demoForm.message.trim(),
            ]
                .filter(Boolean)
                .join("\n\n");

            const payload = {
                fullName:
                    demoForm.fullName.trim(),

                churchName:
                    demoForm.churchName.trim(),

                email:
                    demoForm.email
                        .trim()
                        .toLowerCase(),

                phone:
                    demoForm.phone.trim(),

                position:
                    "Church Representative",

                message:
                    finalMessage,
            };

            try {
                setDemoSubmitting(true);

                const response =
                    await fetch(
                        `${API_BASE_URL}/DemoRequests`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Accept:
                                    "application/json",
                            },

                            body:
                                JSON.stringify(
                                    payload
                                ),
                        }
                    );

                let data:
                    DemoResponse | null = null;

                try {
                    data =
                        await response.json();
                } catch {
                    data = null;
                }

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                            `Unable to submit your demo request. Server returned ${response.status}.`
                    );
                }

                setDemoSuccess(
                    data?.message ||
                        "Your demo request has been submitted successfully. Our team will contact you soon."
                );

                setDemoForm(
                    INITIAL_DEMO_FORM
                );
            } catch (error) {
                console.error(
                    "Demo request submission error:",
                    error
                );

                setDemoError(
                    error instanceof Error
                        ? error.message
                        : "Something went wrong while submitting your request. Please try again."
                );
            } finally {
                setDemoSubmitting(false);
            }
        },
        [
            demoForm,
            validateDemoForm,
        ]
    );

    // =====================================================
    // MOBILE MENU
    // =====================================================

    const toggleMobileMenu = useCallback(() => {
        setMenuOpen((previous) => !previous);
    }, []);

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="epic-landing-page">

            {/* =====================================================
                NAVIGATION
            ===================================================== */}

            <header className="epic-public-navbar">
                <div className="epic-public-nav-inner">

                    <button
                        type="button"
                        className="epic-public-logo"
                        onClick={() =>
                            scrollToSection("home")
                        }
                        aria-label="Go to EPIC Church home"
                    >
                        <span className="epic-public-logo-mark">
                            EPIC
                        </span>

                        <span className="epic-public-logo-text">
                            <strong>
                                EPIC CHURCH
                            </strong>

                            <small>
                                Engaging People Into Christ
                            </small>
                        </span>
                    </button>

                    <nav
                        className={`epic-public-nav-links ${
                            menuOpen ? "open" : ""
                        }`}
                        aria-label="Main navigation"
                    >
                        <button
                            type="button"
                            onClick={() =>
                                scrollToSection("home")
                            }
                        >
                            Home
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigateTo("about")
                            }
                        >
                            About
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                scrollToSection("ministries")
                            }
                        >
                            Ministries
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                scrollToSection("system")
                            }
                        >
                            EPIC System
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                scrollToSection("learning")
                            }
                        >
                            Learning
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                scrollToSection("pricing")
                            }
                        >
                            Pricing
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigateTo("contact")
                            }
                        >
                            Contact
                        </button>
                    </nav>

                 <div className="epic-public-nav-actions">

   <button
    type="button"
    className="epic-client-login-button"
    onClick={() => navigateTo("client-login")}
>
    <span>🔐</span>
    LOGIN
</button>
    <button
        type="button"
        className="epic-nav-cta"
        onClick={() =>
            navigateTo("contact")
        }
    >
        Connect With Us
    </button>

</div>
                    <button
                        type="button"
                        className="epic-mobile-menu"
                        onClick={toggleMobileMenu}
                        aria-label={
                            menuOpen
                                ? "Close navigation"
                                : "Open navigation"
                        }
                        aria-expanded={menuOpen}
                    >
                        {menuOpen ? "✕" : "☰"}
                    </button>

                </div>
            </header>

            {/* =====================================================
                HERO
            ===================================================== */}

            <section
                id="home"
                className="epic-public-hero"
            >
                <div className="epic-hero-overlay" />

                <div className="epic-hero-content">

                    <div className="epic-hero-badge">
                        <span>✦</span>
                        ENGAGING PEOPLE INTO CHRIST
                    </div>

                    <h1>
                        A Church With A
                        <span>
                            Mission.
                        </span>
                    </h1>

                    <p>
                        Welcome to EPIC Church — a
                        Christ-centered community committed
                        to reaching people, building disciples,
                        and transforming lives through the
                        power of the Gospel.
                    </p>

                    <div className="epic-hero-buttons">

                        <button
                            type="button"
                            className="epic-primary-button"
                            onClick={() =>
                                scrollToSection("about")
                            }
                        >
                            Discover EPIC
                            <span>→</span>
                        </button>

                        <button
    type="button"
    className="epic-secondary-button"
    onClick={onLogin}
>
    🔐 Member's Login
</button>

                    </div>

                    <div className="epic-hero-trust">

                        <div>
                            <strong>
                                Faith
                            </strong>

                            <span>
                                Built on God's Word
                            </span>
                        </div>

                        <div>
                            <strong>
                                Community
                            </strong>

                            <span>
                                Growing Together
                            </span>
                        </div>

                        <div>
                            <strong>
                                Mission
                            </strong>

                            <span>
                                Reaching Others
                            </span>
                        </div>

                    </div>
                </div>

                <button
                    type="button"
                    className="epic-scroll-indicator"
                    onClick={() =>
                        scrollToSection("about")
                    }
                >
                    <span>
                        Explore
                    </span>
                    ↓
                </button>
            </section>

            {/* =====================================================
                VISION
            ===================================================== */}

            <section
                id="about"
                className="epic-public-section epic-vision-section"
            >
                <div className="epic-section-container">

                    <div className="epic-section-heading">

                        <span className="epic-section-label">
                            OUR VISION
                        </span>

                        <h2>
                            Engaging People
                            <br />
                            <span>
                                Into Christ.
                            </span>
                        </h2>

                        <p>
                            We believe the church is more than
                            a building. It is a community of people
                            who know Christ, grow together, serve
                            faithfully, and carry the Gospel into
                            the world.
                        </p>

                    </div>

                    <div className="epic-vision-cards">

                        <article className="epic-vision-card">
                            <div className="epic-card-number">
                                01
                            </div>

                            <div className="epic-card-icon">
                                ♡
                            </div>

                            <h3>
                                REACH
                            </h3>

                            <p>
                                Reach people with the
                                transforming message of
                                Jesus Christ.
                            </p>
                        </article>

                        <article className="epic-vision-card">
                            <div className="epic-card-number">
                                02
                            </div>

                            <div className="epic-card-icon">
                                ✦
                            </div>

                            <h3>
                                DISCIPLE
                            </h3>

                            <p>
                                Build believers through
                                biblical teaching, fellowship
                                and spiritual growth.
                            </p>
                        </article>

                        <article className="epic-vision-card">
                            <div className="epic-card-number">
                                03
                            </div>

                            <div className="epic-card-icon">
                                →
                            </div>

                            <h3>
                                SEND
                            </h3>

                            <p>
                                Equip God's people to serve
                                and fulfill the mission of
                                the Gospel.
                            </p>
                        </article>

                    </div>
                </div>
            </section>

            {/* =====================================================
                CHURCH
            ===================================================== */}

            <section
                id="ministries"
                className="epic-public-section epic-church-section"
            >
                <div className="epic-section-container">

                    <div className="epic-church-grid">

                        <div className="epic-church-image">
                            <div className="epic-image-placeholder">
                                <span>
                                    EPIC CHURCH
                                </span>

                                <small>
                                    Your church photo can
                                    be placed here
                                </small>
                            </div>
                        </div>

                        <div className="epic-church-content">

                            <span className="epic-section-label">
                                OUR CHURCH
                            </span>

                            <h2>
                                More Than A Church.
                                <br />
                                <span>
                                    A Family On Mission.
                                </span>
                            </h2>

                            <p>
                                EPIC Church exists to create
                                an environment where people
                                can encounter God, discover
                                their purpose, develop their
                                gifts, and make a difference
                                in the lives of others.
                            </p>

                            <div className="epic-ministry-list">

                                <div>
                                    <span>01</span>
                                    <strong>Worship</strong>
                                </div>

                                <div>
                                    <span>02</span>
                                    <strong>Prayer</strong>
                                </div>

                                <div>
                                    <span>03</span>
                                    <strong>Discipleship</strong>
                                </div>

                                <div>
                                    <span>04</span>
                                    <strong>Outreach</strong>
                                </div>

                            </div>

                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                EPIC SYSTEM
            ===================================================== */}

            <section
                id="system"
                className="epic-public-section epic-system-section"
            >
                <div className="epic-section-container">

                    <div className="epic-system-header">

                        <span className="epic-section-label">
                            TECHNOLOGY FOR MINISTRY
                        </span>

                        <h2>
                            Meet
                            <span>
                                EPIC System
                            </span>
                        </h2>

                        <p>
                            Your church. Your people.
                            Your mission. One powerful
                            digital ecosystem.
                        </p>

                    </div>

                    <div className="epic-system-showcase">

                        <div className="epic-dashboard-window">

                            <div className="epic-window-top">

                                <div className="epic-window-dots">
                                    <span />
                                    <span />
                                    <span />
                                </div>

                                <span>
                                    EPIC Church Management System
                                </span>

                            </div>

                            <div className="epic-dashboard-preview">

                                <div className="epic-preview-sidebar">

                                    <div className="preview-logo">
                                        EPIC
                                    </div>

                                    <span>Dashboard</span>
                                    <span>Members</span>
                                    <span>Attendance</span>
                                    <span>Ministries</span>
                                    <span>Giving</span>
                                    <span>Reports</span>
                                    <span>Learning</span>

                                </div>

                                <div className="epic-preview-main">

                                    <div className="preview-title">
                                        Church Dashboard
                                    </div>

                                    <div className="preview-stat-grid">

                                        <div>
                                            <small>
                                                MEMBERS
                                            </small>

                                            <strong>
                                                127
                                            </strong>
                                        </div>

                                        <div>
                                            <small>
                                                MINISTRIES
                                            </small>

                                            <strong>
                                                17
                                            </strong>
                                        </div>

                                        <div>
                                            <small>
                                                ATTENDANCE
                                            </small>

                                            <strong>
                                                +24%
                                            </strong>
                                        </div>

                                    </div>

                                    <div className="preview-chart">
                                        <span />
                                        <span />
                                        <span />
                                        <span />
                                        <span />
                                        <span />
                                        <span />
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="epic-feature-grid">

                        <article>
                            <div>👥</div>

                            <h3>
                                Members
                            </h3>

                            <p>
                                Manage your church family
                                in one organized system.
                            </p>
                        </article>

                        <article>
                            <div>✓</div>

                            <h3>
                                Attendance
                            </h3>

                            <p>
                                Track participation and
                                understand your congregation.
                            </p>
                        </article>

                        <article>
                            <div>₱</div>

                            <h3>
                                Giving
                            </h3>

                            <p>
                                Manage church giving and
                                financial records.
                            </p>
                        </article>

                        <article>
                            <div>📊</div>

                            <h3>
                                Reports
                            </h3>

                            <p>
                                Turn church data into
                                meaningful information.
                            </p>
                        </article>

                    </div>
                </div>
            </section>

            {/* =====================================================
                LEARNING
            ===================================================== */}

            <section
                id="learning"
                className="epic-public-section epic-learning-section"
            >
                <div className="epic-section-container">

                    <div className="epic-learning-grid">

                        <div className="epic-learning-content">

                            <span className="epic-section-label">
                                EPIC LEARNING
                            </span>

                            <h2>
                                Discipleship
                                <br />
                                <span>
                                    Goes Digital.
                                </span>
                            </h2>

                            <p>
                                Help your members grow through
                                structured biblical courses,
                                lessons, progress tracking and
                                certificates.
                            </p>

                            <div className="epic-learning-flow">
                                <span>COURSES</span>
                                <b>→</b>
                                <span>LESSONS</span>
                                <b>→</b>
                                <span>PROGRESS</span>
                                <b>→</b>
                                <span>CERTIFICATE</span>
                            </div>

                            <button
                                type="button"
                                className="epic-primary-button"
                                onClick={onLogin}
                            >
                                Explore EPIC Learning
                                <span>→</span>
                            </button>

                        </div>

                        <div className="epic-learning-card">

                            <div className="learning-card-header">
                                <span>
                                    EPIC LEARNING
                                </span>

                                <span>
                                    ●
                                </span>
                            </div>

                            <div className="learning-course">

                                <div className="learning-course-icon">
                                    ✦
                                </div>

                                <div>
                                    <strong>
                                        Foundations of Faith
                                    </strong>

                                    <small>
                                        Biblical Discipleship
                                    </small>
                                </div>

                                <span className="learning-progress">
                                    75%
                                </span>

                            </div>

                            <div className="learning-progress-bar">
                                <span />
                            </div>

                            <div className="learning-course">

                                <div className="learning-course-icon">
                                    ✝
                                </div>

                                <div>
                                    <strong>
                                        Knowing Jesus Christ
                                    </strong>

                                    <small>
                                        Christ-Centered Growth
                                    </small>
                                </div>

                                <span className="learning-progress">
                                    50%
                                </span>

                            </div>

                            <div className="learning-progress-bar">
                                <span className="half" />
                            </div>

                            <div className="learning-certificate">

                                <div>
                                    🏆
                                </div>

                                <span>
                                    Complete your course
                                    and earn your certificate.
                                </span>

                            </div>

                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                WHY EPIC
            ===================================================== */}

            <section className="epic-public-section epic-why-section">
                <div className="epic-section-container">

                    <div className="epic-section-heading centered">

                        <span className="epic-section-label">
                            WHY EPIC
                        </span>

                        <h2>
                            Technology That
                            <br />
                            <span>
                                Serves The Mission.
                            </span>
                        </h2>

                    </div>

                    <div className="epic-why-grid">

                        <article>
                            <span>01</span>

                            <h3>
                                Everything In One Place
                            </h3>

                            <p>
                                Members, attendance, giving,
                                ministries, reports and learning
                                connected in one platform.
                            </p>
                        </article>

                        <article>
                            <span>02</span>

                            <h3>
                                Know Your Church
                            </h3>

                            <p>
                                Gain meaningful insights into
                                participation, growth and
                                ministry activity.
                            </p>
                        </article>

                        <article>
                            <span>03</span>

                            <h3>
                                Develop Your People
                            </h3>

                            <p>
                                Go beyond administration and
                                create intentional discipleship
                                pathways.
                            </p>
                        </article>

                    </div>
                </div>
            </section>

            {/* =====================================================
                SUNDAY INVITATION
            ===================================================== */}

            <section className="epic-sunday-section">
                <div className="epic-section-container">

                    <div className="epic-sunday-card">

                        <div className="epic-sunday-content">

                            <span className="epic-section-label">
                                JOIN US
                            </span>

                            <h2>
                                There Is A Place
                                <br />
                                <span>
                                    For You Here.
                                </span>
                            </h2>

                            <p>
                                Come worship with us, grow in
                                God's Word, build meaningful
                                relationships, and discover
                                how you can become part of
                                the mission.
                            </p>

                            <div className="epic-service-details">

                                <div className="epic-service-item">

                                    <span className="epic-service-icon">
                                        ◷
                                    </span>

                                    <div>
                                        <strong>
                                            Sunday Worship
                                        </strong>

                                        <small>
                                            Join us for worship,
                                            fellowship and the Word.
                                        </small>
                                    </div>

                                </div>

                                <div className="epic-service-item">

                                    <span className="epic-service-icon">
                                        ✦
                                    </span>

                                    <div>
                                        <strong>
                                            Luke 4:18 Ministries
                                        </strong>

                                        <small>
                                            San Vicente Church
                                        </small>
                                    </div>

                                </div>

                            </div>

                            <button
                                type="button"
                                className="epic-primary-button"
                                onClick={() =>
                                    scrollToSection("contact")
                                }
                            >
                                Connect With Us
                                <span>→</span>
                            </button>

                        </div>

                        <div className="epic-sunday-visual">

                            <div className="epic-sunday-visual-inner">

                                <span className="epic-cross">
                                    ✝
                                </span>

                                <strong>
                                    EPIC
                                </strong>

                                <small>
                                    Engaging People
                                    <br />
                                    Into Christ
                                </small>

                            </div>

                        </div>

                    </div>
                </div>
            </section>

            {/* =====================================================
                BUILT FOR MINISTRY
            ===================================================== */}

            <section className="epic-ministry-tech-section">
                <div className="epic-section-container">

                    <div className="epic-ministry-tech-grid">

                        <div>

                            <span className="epic-section-label">
                                BUILT FOR MINISTRY
                            </span>

                            <h2>
                                Ministry First.
                                <br />
                                <span>
                                    Technology Second.
                                </span>
                            </h2>

                            <p>
                                EPIC is designed around one
                                simple principle: technology
                                should serve the mission of
                                the church.
                            </p>

                        </div>

                        <div className="epic-ministry-principles">

                            <div className="epic-principle">

                                <span>01</span>

                                <div>
                                    <strong>
                                        ORGANIZE
                                    </strong>

                                    <p>
                                        Keep your church
                                        information organized
                                        and accessible.
                                    </p>
                                </div>

                            </div>

                            <div className="epic-principle">

                                <span>02</span>

                                <div>
                                    <strong>
                                        CONNECT
                                    </strong>

                                    <p>
                                        Help leaders understand
                                        and connect with the
                                        people they serve.
                                    </p>
                                </div>

                            </div>

                            <div className="epic-principle">

                                <span>03</span>

                                <div>
                                    <strong>
                                        DISCIPLE
                                    </strong>

                                    <p>
                                        Turn church information
                                        into intentional
                                        discipleship.
                                    </p>
                                </div>

                            </div>

                            <div className="epic-principle">

                                <span>04</span>

                                <div>
                                    <strong>
                                        SERVE
                                    </strong>

                                    <p>
                                        Give ministry leaders
                                        better tools to serve
                                        God's people.
                                    </p>
                                </div>

                            </div>

                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                PLATFORM
            ===================================================== */}

            <section className="epic-platform-section">
                <div className="epic-section-container">

                    <div className="epic-platform-header">

                        <span className="epic-section-label">
                            THE EPIC PLATFORM
                        </span>

                        <h2>
                            Everything Your Church Needs.
                            <br />
                            <span>
                                One EPIC Platform.
                            </span>
                        </h2>

                        <p>
                            From your first-time visitor to your
                            most faithful member, EPIC helps your
                            church organize people, manage ministry,
                            steward resources and develop disciples.
                        </p>

                    </div>

                    <div className="epic-platform-showcase">

                        <div className="epic-platform-window">

                            <div className="epic-platform-window-top">

                                <div className="epic-window-dots">
                                    <span />
                                    <span />
                                    <span />
                                </div>

                                <div className="epic-window-title">
                                    EPIC CHURCH MANAGEMENT SYSTEM
                                </div>

                                <div className="epic-window-status">
                                    ● LIVE
                                </div>

                            </div>

                            <div className="epic-dashboard-preview">

                                <aside className="epic-preview-sidebar">

                                    <div className="epic-preview-logo">
                                        EPIC
                                    </div>

                                    <div className="epic-preview-church">
                                        Luke 4:18 Ministries
                                    </div>

                                    <div className="epic-preview-nav active">
                                        ▦ Dashboard
                                    </div>

                                    <div className="epic-preview-nav">
                                        ♟ Members
                                    </div>

                                    <div className="epic-preview-nav">
                                        ✓ Attendance
                                    </div>

                                    <div className="epic-preview-nav">
                                        ♫ Ministries
                                    </div>

                                    <div className="epic-preview-nav">
                                        👤 Visitors
                                    </div>

                                    <div className="epic-preview-nav">
                                        ₱ Giving
                                    </div>

                                    <div className="epic-preview-nav">
                                        ↗ Income
                                    </div>

                                    <div className="epic-preview-nav">
                                        − Expenses
                                    </div>

                                    <div className="epic-preview-nav">
                                        📚 EPIC Learning
                                    </div>

                                </aside>

                                <div className="epic-preview-main">

                                    <div className="epic-preview-heading">

                                        <div>

                                            <small>
                                                CHURCH OVERVIEW
                                            </small>

                                            <h3>
                                                Welcome to EPIC
                                            </h3>

                                        </div>

                                        <div className="epic-preview-date">
                                            Church Management
                                        </div>

                                    </div>

                                    <div className="epic-preview-stats">

                                        <div className="epic-preview-stat">
                                            <span>
                                                MEMBERS
                                            </span>

                                            <strong>
                                                127
                                            </strong>

                                            <small>
                                                Active members
                                            </small>
                                        </div>

                                        <div className="epic-preview-stat">
                                            <span>
                                                MINISTRIES
                                            </span>

                                            <strong>
                                                17
                                            </strong>

                                            <small>
                                                Ministry teams
                                            </small>
                                        </div>

                                        <div className="epic-preview-stat">
                                            <span>
                                                ATTENDANCE
                                            </span>

                                            <strong>
                                                94%
                                            </strong>

                                            <small>
                                                Engagement
                                            </small>
                                        </div>

                                        <div className="epic-preview-stat">
                                            <span>
                                                LEARNING
                                            </span>

                                            <strong>
                                                86%
                                            </strong>

                                            <small>
                                                Course progress
                                            </small>
                                        </div>

                                    </div>

                                    <div className="epic-preview-lower">

                                        <div className="epic-preview-chart">

                                            <div className="epic-preview-card-title">
                                                Ministry Overview
                                            </div>

                                            <div className="epic-bars">

                                                <span style={{ height: "45%" }} />
                                                <span style={{ height: "70%" }} />
                                                <span style={{ height: "55%" }} />
                                                <span style={{ height: "82%" }} />
                                                <span style={{ height: "65%" }} />
                                                <span style={{ height: "92%" }} />
                                                <span style={{ height: "78%" }} />

                                            </div>

                                        </div>

                                        <div className="epic-preview-activity">

                                            <div className="epic-preview-card-title">
                                                Recent Activity
                                            </div>

                                            <div className="epic-preview-activity-row">
                                                <span>✓</span>
                                                Member attendance recorded
                                            </div>

                                            <div className="epic-preview-activity-row">
                                                <span>₱</span>
                                                Giving record updated
                                            </div>

                                            <div className="epic-preview-activity-row">
                                                <span>★</span>
                                                New visitor registered
                                            </div>

                                            <div className="epic-preview-activity-row">
                                                <span>📚</span>
                                                Lesson completed
                                            </div>

                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="epic-module-grid">

                        <div className="epic-module-card">
                            <div className="epic-module-icon">
                                ♟
                            </div>

                            <h3>
                                Members
                            </h3>

                            <p>
                                Keep your church member records
                                organized and accessible.
                            </p>
                        </div>

                        <div className="epic-module-card">
                            <div className="epic-module-icon">
                                ✓
                            </div>

                            <h3>
                                Attendance
                            </h3>

                            <p>
                                Understand participation and
                                strengthen pastoral follow-up.
                            </p>
                        </div>

                        <div className="epic-module-card">
                            <div className="epic-module-icon">
                                ₱
                            </div>

                            <h3>
                                Giving
                            </h3>

                            <p>
                                Manage giving records with
                                greater clarity and accountability.
                            </p>
                        </div>

                        <div className="epic-module-card">
                            <div className="epic-module-icon">
                                ♫
                            </div>

                            <h3>
                                Ministries
                            </h3>

                            <p>
                                Organize ministry teams,
                                assignments and participation.
                            </p>
                        </div>

                        <div className="epic-module-card">
                            <div className="epic-module-icon">
                                📊
                            </div>

                            <h3>
                                Reports
                            </h3>

                            <p>
                                Turn church information into
                                meaningful ministry insight.
                            </p>
                        </div>

                        <div className="epic-module-card">
                            <div className="epic-module-icon">
                                📚
                            </div>

                            <h3>
                                EPIC Learning
                            </h3>

                            <p>
                                Develop disciples through structured
                                courses, lessons and progress tracking.
                            </p>
                        </div>

                    </div>

                    <div className="epic-learning-banner">

                        <div>

                            <span className="epic-section-label">
                                BEYOND MANAGEMENT
                            </span>

                            <h3>
                                Manage the Church.
                                <br />
                                <span>
                                    Develop the People.
                                </span>
                            </h3>

                            <p>
                                EPIC connects church management with
                                intentional discipleship through
                                EPIC Learning.
                            </p>

                        </div>

                        <div className="epic-learning-flow">

                            <div>
                                <strong>
                                    PEOPLE
                                </strong>

                                <small>
                                    Connect
                                </small>
                            </div>

                            <span>→</span>

                            <div>
                                <strong>
                                    LEARN
                                </strong>

                                <small>
                                    Grow
                                </small>
                            </div>

                            <span>→</span>

                            <div>
                                <strong>
                                    SERVE
                                </strong>

                                <small>
                                    Minister
                                </small>
                            </div>

                            <span>→</span>

                            <div>
                                <strong>
                                    DISCIPLE
                                </strong>

                                <small>
                                    Multiply
                                </small>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                FOR CHURCHES
            ===================================================== */}

            <section className="epic-for-church-section">
                <div className="epic-section-container">

                    <div className="epic-for-church-header">

                        <span className="epic-section-label">
                            FOR CHURCHES
                        </span>

                        <h2>
                            Your Church Deserves
                            <br />
                            <span>
                                Better Tools.
                            </span>
                        </h2>

                        <p>
                            Stop managing your ministry
                            through disconnected spreadsheets,
                            notebooks and scattered systems.
                        </p>

                    </div>

                    <div className="epic-transformation">

                        <div className="epic-before">

                            <span>
                                BEFORE EPIC
                            </span>

                            <div>
                                <b>×</b>
                                Scattered records
                            </div>

                            <div>
                                <b>×</b>
                                Manual reports
                            </div>

                            <div>
                                <b>×</b>
                                Paper-based tracking
                            </div>

                            <div>
                                <b>×</b>
                                Disconnected information
                            </div>

                            <div>
                                <b>×</b>
                                Limited discipleship tracking
                            </div>

                        </div>

                        <div className="epic-transformation-arrow">
                            →
                        </div>

                        <div className="epic-after">

                            <span>
                                WITH EPIC
                            </span>

                            <div>
                                <b>✓</b>
                                Centralized church data
                            </div>

                            <div>
                                <b>✓</b>
                                Meaningful reports
                            </div>

                            <div>
                                <b>✓</b>
                                Digital management
                            </div>

                            <div>
                                <b>✓</b>
                                Connected ministries
                            </div>

                            <div>
                                <b>✓</b>
                                Intentional discipleship
                            </div>

                        </div>

                    </div>
                </div>
            </section>

            {/* =====================================================
                PRICING
            ===================================================== */}

            <section
                className="epic-pricing-section"
                id="pricing"
            >
                <div className="epic-section-container">

                    <div className="epic-pricing-header">

                        <span className="epic-section-label">
                            SIMPLE. POWERFUL. SCALABLE.
                        </span>

                        <h2>
                            Choose the EPIC
                            <br />
                            <span>
                                That Fits Your Church.
                            </span>
                        </h2>

                        <p>
                            Start with what your church needs today
                            and grow with EPIC as your ministry grows.
                        </p>

                    </div>

                    <div className="epic-pricing-grid">

                        {/* STARTER */}

                        <div className="epic-pricing-card">

                            <div className="epic-pricing-card-top">

                                <span>
                                    STARTER
                                </span>

                                <h3>
                                    Church Essentials
                                </h3>

                                <p>
                                    The foundation for organized
                                    church management.
                                </p>

                            </div>

                            <div className="epic-price">

                                <strong>
                                    Let's Talk
                                </strong>

                                <small>
                                    Custom pricing
                                </small>

                            </div>

                            <div className="epic-pricing-features">

                                <div>
                                    ✓ Member Management
                                </div>

                                <div>
                                    ✓ Attendance
                                </div>

                                <div>
                                    ✓ Visitors
                                </div>

                                <div>
                                    ✓ Ministries
                                </div>

                                <div>
                                    ✓ Church Services
                                </div>

                            </div>

                            <button
                                type="button"
                                className="epic-outline-button"
                                onClick={() =>
                                    scrollToSection("contact")
                                }
                            >
                                Talk to EPIC
                                <span>→</span>
                            </button>

                        </div>

                        {/* COMPLETE */}

                        <div className="epic-pricing-card epic-pricing-featured">

                            <div className="epic-pricing-badge">
                                RECOMMENDED
                            </div>

                            <div className="epic-pricing-card-top">

                                <span>
                                    COMPLETE
                                </span>

                                <h3>
                                    EPIC Church Platform
                                </h3>

                                <p>
                                    Complete church management
                                    and discipleship.
                                </p>

                            </div>

                            <div className="epic-price">

                                <strong>
                                    Let's Talk
                                </strong>

                                <small>
                                    Custom pricing
                                </small>

                            </div>

                            <div className="epic-pricing-features">

                                <div>
                                    ✓ Everything in Starter
                                </div>

                                <div>
                                    ✓ Giving Management
                                </div>

                                <div>
                                    ✓ Income & Expenses
                                </div>

                                <div>
                                    ✓ Reports & Analytics
                                </div>

                                <div>
                                    ✓ EPIC Learning
                                </div>

                                <div>
                                    ✓ Course & Lesson Tracking
                                </div>

                                <div>
                                    ✓ Certificates
                                </div>

                            </div>

                            <button
                                type="button"
                                className="epic-primary-button"
                                onClick={() =>
                                    scrollToSection("contact")
                                }
                            >
                                Request a Demo
                                <span>→</span>
                            </button>

                        </div>

                        {/* ENTERPRISE */}

                        <div className="epic-pricing-card">

                            <div className="epic-pricing-card-top">

                                <span>
                                    CUSTOM
                                </span>

                                <h3>
                                    Ministry Enterprise
                                </h3>

                                <p>
                                    For churches and organizations
                                    with advanced requirements.
                                </p>

                            </div>

                            <div className="epic-price">

                                <strong>
                                    Let's Build
                                </strong>

                                <small>
                                    Designed for you
                                </small>

                            </div>

                            <div className="epic-pricing-features">

                                <div>
                                    ✓ Everything in Complete
                                </div>

                                <div>
                                    ✓ Custom Modules
                                </div>

                                <div>
                                    ✓ Custom Workflows
                                </div>

                                <div>
                                    ✓ Advanced Reporting
                                </div>

                                <div>
                                    ✓ Organization Support
                                </div>

                            </div>

                            <button
                                type="button"
                                className="epic-outline-button"
                                onClick={() =>
                                    scrollToSection("contact")
                                }
                            >
                                Discuss Your Needs
                                <span>→</span>
                            </button>

                        </div>

                    </div>

                    <div className="epic-pricing-note">

                        <span>✦</span>

                        Every church is different.
                        We can tailor EPIC to your ministry's needs.

                    </div>

                </div>
            </section>

            {/* =====================================================
                REQUEST DEMO
            ===================================================== */}

            <section
                className="epic-demo-section"
                id="contact"
            >
                <div className="epic-section-container">

                    <div className="epic-demo-card">

                        <div className="epic-demo-content">

                            <span className="epic-section-label">
                                READY TO GO EPIC?
                            </span>

                            <h2>
                                Let's Build a Better
                                <br />
                                <span>
                                    Ministry Experience.
                                </span>
                            </h2>

                            <p>
                                See how EPIC can help your church
                                organize ministry, connect people,
                                manage resources and develop disciples.
                            </p>

                            <div className="epic-demo-points">

                                <div>
                                    <span>✓</span>
                                    Personalized demonstration
                                </div>

                                <div>
                                    <span>✓</span>
                                    See EPIC CMS in action
                                </div>

                                <div>
                                    <span>✓</span>
                                    Explore EPIC Learning
                                </div>

                                <div>
                                    <span>✓</span>
                                    Discuss your church's needs
                                </div>

                            </div>

                        </div>

                        <form
                            className="epic-demo-form"
                            onSubmit={handleDemoSubmit}
                            noValidate
                        >

                            <div className="epic-form-title">
                                Request a Demo
                            </div>

                            <div className="epic-form-subtitle">
                                Tell us a little about your church.
                            </div>

                            {demoSuccess && (
                                <div
                                    className="epic-demo-success"
                                    role="alert"
                                >
                                    ✓ {demoSuccess}
                                </div>
                            )}

                            {demoError && (
                                <div
                                    className="epic-demo-error"
                                    role="alert"
                                >
                                    {demoError}
                                </div>
                            )}

                            <input
                                type="text"
                                name="churchName"
                                placeholder="Church Name"
                                value={demoForm.churchName}
                                onChange={handleDemoChange}
                                disabled={demoSubmitting}
                                autoComplete="organization"
                                required
                            />

                            <input
                                type="text"
                                name="fullName"
                                placeholder="Your Name"
                                value={demoForm.fullName}
                                onChange={handleDemoChange}
                                disabled={demoSubmitting}
                                autoComplete="name"
                                required
                            />

                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={demoForm.email}
                                onChange={handleDemoChange}
                                disabled={demoSubmitting}
                                autoComplete="email"
                                required
                            />

                            <input
                                type="tel"
                                name="phone"
                                placeholder="Phone Number"
                                value={demoForm.phone}
                                onChange={handleDemoChange}
                                disabled={demoSubmitting}
                                autoComplete="tel"
                            />

                            <select
                                name="churchSize"
                                value={demoForm.churchSize}
                                onChange={handleDemoChange}
                                disabled={demoSubmitting}
                                required
                            >
                                <option
                                    value=""
                                    disabled
                                >
                                    Church Size
                                </option>

                                <option value="Under 100 members">
                                    Under 100 members
                                </option>

                                <option value="100–500 members">
                                    100–500 members
                                </option>

                                <option value="500–1,000 members">
                                    500–1,000 members
                                </option>

                                <option value="1,000+ members">
                                    1,000+ members
                                </option>
                            </select>

                            <textarea
                                name="message"
                                placeholder="Tell us what your church needs..."
                                rows={4}
                                value={demoForm.message}
                                onChange={handleDemoChange}
                                disabled={demoSubmitting}
                            />

                            <button
                                type="submit"
                                className="epic-primary-button epic-demo-submit"
                                disabled={demoSubmitting}
                            >
                                {demoSubmitting
                                    ? "Submitting..."
                                    : "Request My Demo"}

                                {!demoSubmitting && (
                                    <span>
                                        →
                                    </span>
                                )}
                            </button>

                            <small className="epic-form-note">
                                Your information will only be used
                                to contact you about EPIC.
                            </small>

                        </form>
                    </div>
                </div>
            </section>

            {/* =====================================================
                FINAL CTA
            ===================================================== */}

            <section className="epic-final-cta">

                <div className="epic-final-glow" />

                <div className="epic-section-container">

                    <span className="epic-final-cross">
                        ✝
                    </span>

                    <h2>
                        Your Church Has a Mission.
                    </h2>

                    <h3>
                        Let EPIC Help You Manage It.
                    </h3>

                    <p>
                        Engaging People Into Christ.
                        <br />
                        Empowering Churches Through Technology.
                    </p>

                    <div className="epic-final-actions">

                        <button
                            type="button"
                            className="epic-primary-button"
                            onClick={() =>
                                scrollToSection("contact")
                            }
                        >
                            Request a Demo
                            <span>→</span>
                        </button>

                        <button
                            type="button"
                            className="epic-outline-light-button"
                            onClick={() =>
                                scrollToSection("pricing")
                            }
                        >
                            Explore EPIC
                        </button>

                    </div>
                </div>
            </section>

            {/* =====================================================
                FOOTER
            ===================================================== */}

            <footer className="epic-landing-footer">

                <div className="epic-section-container">

                    <div className="epic-footer-grid">

                        <div className="epic-footer-brand">

                            <div className="epic-footer-logo">
                                EPIC
                            </div>

                            <strong>
                                EPIC CHURCH
                            </strong>

                            <p>
                                Engaging People Into Christ.
                            </p>

                            <small>
                                Church Management & Discipleship Platform
                            </small>

                        </div>

                        <div className="epic-footer-column">

                            <strong>
                                EPIC CHURCH
                            </strong>

                            <button
                                type="button"
                                onClick={() =>
                                    scrollToSection("ministries")
                                }
                            >
                                Our Church
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    scrollToSection("about")
                                }
                            >
                                Vision & Mission
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    navigateTo("contact")
                                }
                            >
                                Connect With Us
                            </button>

                        </div>

                        <div className="epic-footer-column">

                            <strong>
                                EPIC SYSTEM
                            </strong>

                            <button
                                type="button"
                                onClick={() =>
                                    scrollToSection("system")
                                }
                            >
                                Platform
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    scrollToSection("pricing")
                                }
                            >
                                Pricing
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    scrollToSection("contact")
                                }
                            >
                                Request Demo
                            </button>

                        </div>

                        <div className="epic-footer-column">

                            <strong>
                                CONNECT
                            </strong>

                            <button
                                type="button"
                                onClick={() =>
                                    navigateTo("contact")
                                }
                            >
                                Contact EPIC
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    navigateTo("contact")
                                }
                            >
                                Facebook
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    navigateTo("contact")
                                }
                            >
                                Email Us
                            </button>

                        </div>

                    </div>

                    <div className="epic-footer-bottom">

                        <span>
                            © {new Date().getFullYear()}{" "}
                            EPIC Church Management System
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

export default LandingPage;