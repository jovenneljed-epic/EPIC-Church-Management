
import React, { useEffect, useRef, useState } from "react";
import {
    Activity,
    ArrowRight,
    BarChart3,
    Bell,
    BookOpen,
    Calendar,
    CalendarCheck,
    CalendarDays,
    Camera,
    Check,
    ChevronDown,
    ChevronRight,
    Church,
    Clock,
    EyeOff,
    FileText,
    GraduationCap,
    HeartHandshake,
    Info,
    Laptop,
    Layers,
    Lock,
    Maximize2,
    Menu,
    Pause,
    Phone,
    Play,
    RotateCcw,
    Server,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Tag,
    UserPlus,
    Users,
    Volume2,
    VolumeX,
    Wallet,
    X,
} from "lucide-react";
import "./SalesLandingPage.css";
import { API_BASE_URL } from "../config";

interface SalesLandingPageProps {
    onNavigate?: (page: string) => void;
}

interface MenuItem {
    title: string;
    description: string;
    page: string;
    fallback: string;
    icon: React.ReactNode;
    badge?: string;
}

interface MenuColumn {
    heading: string;
    items: MenuItem[];
}

interface MenuCategory {
    id: string;
    label: string;
    columns: MenuColumn[];
    featured?: {
        title: string;
        description: string;
        actionText: string;
        page: string;
        fallback: string;
        icon: React.ReactNode;
    };
}

interface Feature {
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface Problem {
    icon: React.ReactNode;
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

const INITIAL_FORM_DATA: DemoFormData = {
    fullName: "",
    email: "",
    churchName: "",
    phone: "",
    position: "",
    message: "",
};

const MENU_CATEGORIES: MenuCategory[] = [
    {
        id: "platform",
        label: "Platform",
        columns: [
            {
                heading: "EXPLORE PLATFORM",
                items: [
                    {
                        title: "EPIC System Overview",
                        description: "Complete ministry operating system",
                        page: "epic-system",
                        fallback: "/epic-system",
                        icon: <Layers size={18} />,
                    },
                    {
                        title: "Platform Architecture",
                        description: "Enterprise-grade cloud technology",
                        page: "platform",
                        fallback: "/platform",
                        icon: <Server size={18} />,
                    },
                    {
                        title: "What's New",
                        description: "Latest updates and feature releases",
                        page: "whats-new",
                        fallback: "/whats-new",
                        icon: <Sparkles size={18} />,
                        badge: "New",
                    },
                    {
                        title: "Interactive Demo",
                        description: "Experience the system in real-time",
                        page: "demo",
                        fallback: "/demo",
                        icon: <Play size={18} />,
                    },
                ],
            },
            {
                heading: "CORE CAPABILITIES",
                items: [
                    {
                        title: "Members & Directory",
                        description: "Centralized profiles & pastoral notes",
                        page: "home",
                        fallback: "/home",
                        icon: <Users size={18} />,
                    },
                    {
                        title: "Attendance Tracking",
                        description: "Service participation and check-in",
                        page: "home",
                        fallback: "/home",
                        icon: <CalendarCheck size={18} />,
                    },
                    {
                        title: "Giving & Financials",
                        description: "Tithes, offerings & biblical stewardship",
                        page: "giving",
                        fallback: "/giving",
                        icon: <Wallet size={18} />,
                    },
                    {
                        title: "Ministries & Teams",
                        description: "Schedules, volunteers & assignments",
                        page: "ministries",
                        fallback: "/ministries",
                        icon: <HeartHandshake size={18} />,
                    },
                ],
            },
        ],
        featured: {
            title: "See EPIC in Action",
            description: "Request a personalized walkthrough tailored for your church leadership team.",
            actionText: "Schedule Demo",
            page: "demo",
            fallback: "/demo",
            icon: <Laptop size={24} />,
        },
    },
    {
        id: "church",
        label: "Church Life",
        columns: [
            {
                heading: "COMMUNITY & WORSHIP",
                items: [
                    {
                        title: "Church Community Home",
                        description: "Member welcome, worship & announcements",
                        page: "home",
                        fallback: "/home",
                        icon: <Church size={18} />,
                    },
                    {
                        title: "About EPIC Church",
                        description: "Our identity, vision, mission & leadership",
                        page: "about",
                        fallback: "/about",
                        icon: <Info size={18} />,
                    },
                    {
                        title: "Ministries & Programs",
                        description: "Worship, youth, discipleship & outreach",
                        page: "ministries",
                        fallback: "/ministries",
                        icon: <HeartHandshake size={18} />,
                    },
                    {
                        title: "Connect & Contact",
                        description: "Service times, locations & prayer requests",
                        page: "contact",
                        fallback: "/contact",
                        icon: <Phone size={18} />,
                    },
                    {
                        title: "Giving & Stewardship",
                        description: "Tithes, offerings, missions & building fund",
                        page: "giving",
                        fallback: "/giving",
                        icon: <Wallet size={18} />,
                    },
                ],
            },
            {
                heading: "GATHERINGS & EVALUATION",
                items: [
                    {
                        title: "Church Events & Gatherings",
                        description: "Sunday worship, youth camp & outreaches",
                        page: "events",
                        fallback: "/events",
                        icon: <Calendar size={18} />,
                    },
                    {
                        title: "Church Life Gallery",
                        description: "Moments, people, and community stories",
                        page: "gallery",
                        fallback: "/gallery",
                        icon: <Camera size={18} />,
                    },
                    {
                        title: "Church Announcements",
                        description: "Official bulletins, updates & registrations",
                        page: "announcements",
                        fallback: "/announcements",
                        icon: <Bell size={18} />,
                    },
                    {
                        title: "Ministry Health Evaluation",
                        description: "Assess department operational health & rubrics",
                        page: "ministry-evaluation",
                        fallback: "/ministry-evaluation",
                        icon: <Activity size={18} />,
                        badge: "Free",
                    },
                    {
                        title: "Discipleship Pathway",
                        description: "Guide members from seeker to servant",
                        page: "learning",
                        fallback: "/learning",
                        icon: <Sparkles size={18} />,
                    },
                ],
            },
        ],
        featured: {
            title: "Engaging People Into Christ",
            description: "Discover our heart for reaching people, building disciples, and serving God's kingdom.",
            actionText: "About EPIC",
            page: "about",
            fallback: "/about",
            icon: <Church size={24} />,
        },
    },
    {
        id: "learning",
        label: "Academy & Learning",
        columns: [
            {
                heading: "EDUCATION & TRAINING",
                items: [
                    {
                        title: "EPIC Learning",
                        description: "Biblical discipleship tracks & lessons",
                        page: "learning",
                        fallback: "/learning",
                        icon: <BookOpen size={18} />,
                    },
                    {
                        title: "Leadership Academy",
                        description: "Training for pastors and ministry leaders",
                        page: "academy",
                        fallback: "/academy",
                        icon: <GraduationCap size={18} />,
                    },
                    {
                        title: "Resources & Toolkits",
                        description: "Downloadable guides, templates & forms",
                        page: "resources",
                        fallback: "/resources",
                        icon: <FileText size={18} />,
                    },
                    {
                        title: "Church Blog & Insights",
                        description: "Articles on church health and leadership",
                        page: "blog",
                        fallback: "/blog",
                        icon: <Layers size={18} />,
                    },
                ],
            },
        ],
        featured: {
            title: "Foundations of Faith",
            description: "Enroll your congregation in structured, interactive discipleship courses.",
            actionText: "Start Learning",
            page: "learning",
            fallback: "/learning",
            icon: <GraduationCap size={24} />,
        },
    },
    {
        id: "pricing",
        label: "Plans & Pricing",
        columns: [
            {
                heading: "INVESTMENT & SOLUTIONS",
                items: [
                    {
                        title: "Plans & Packages",
                        description: "Transparent pricing tiers for churches of all sizes",
                        page: "offer",
                        fallback: "/offer",
                        icon: <Tag size={18} />,
                    },
                    {
                        title: "Ministry Store",
                        description: "Curated ministry resources, books & tools",
                        page: "store",
                        fallback: "/store",
                        icon: <ShoppingBag size={18} />,
                    },
                    {
                        title: "Special Launch Offer",
                        description: "Exclusive discounts and church starter perks",
                        page: "opt-in",
                        fallback: "/opt-in",
                        icon: <Sparkles size={18} />,
                        badge: "Special",
                    },
                ],
            },
        ],
        featured: {
            title: "30-Day Free Trial",
            description: "Get full access to all EPIC Church Management features with zero setup fees.",
            actionText: "View Plans",
            page: "offer",
            fallback: "/offer",
            icon: <Tag size={24} />,
        },
    },
];

const SalesLandingPage: React.FC<SalesLandingPageProps> = ({
    onNavigate,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
    const headerRef = useRef<HTMLElement>(null);
    const hoverTimerRef = useRef<number | null>(null);

    const handleDropdownTrigger = (categoryId: string) => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        setActiveDropdown((current) => (current === categoryId ? null : categoryId));
    };

    const handleDropdownHover = (categoryId: string) => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        setActiveDropdown(categoryId);
    };

    const handleDropdownLeave = () => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
        }
        hoverTimerRef.current = window.setTimeout(() => {
            setActiveDropdown(null);
        }, 180);
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setActiveDropdown(null);
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // =========================================================
    // DEMO REQUEST STATE
    // =========================================================

    const [showDemoForm, setShowDemoForm] = useState(false);
    const [submittingDemo, setSubmittingDemo] = useState(false);
    const [demoSuccess, setDemoSuccess] = useState(false);
    const [demoError, setDemoError] = useState("");
    const [demoRequestId, setDemoRequestId] =
        useState<number | null>(null);

    const [formData, setFormData] =
        useState<DemoFormData>(INITIAL_FORM_DATA);

    // =========================================================
    // REAL PRODUCT VIDEO AUTOPLAY ON SCROLL STATE
    // =========================================================
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const videoContainerRef = useRef<HTMLDivElement | null>(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
    const [isVideoMuted, setIsVideoMuted] = useState<boolean>(true);
    const [videoProgress, setVideoProgress] = useState<number>(0);
    const [videoDuration, setVideoDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);

    // Scroll-based auto play/pause: plays when scrolling in, pauses when scrolling out
    useEffect(() => {
        const videoElement = videoRef.current;
        const container = videoContainerRef.current;
        if (!videoElement || !container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
                        videoElement.play().then(() => {
                            setIsVideoPlaying(true);
                        }).catch(() => {
                            // Autoplay policies silently handled if needed
                        });
                    } else if (!entry.isIntersecting || entry.intersectionRatio < 0.15) {
                        videoElement.pause();
                        setIsVideoPlaying(false);
                    }
                });
            },
            {
                threshold: [0, 0.15, 0.25, 0.5, 0.75]
            }
        );

        observer.observe(container);

        return () => {
            observer.disconnect();
        };
    }, []);

    const handleVideoTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const dur = videoRef.current.duration || 1;
            setCurrentTime(current);
            setVideoDuration(dur);
            setVideoProgress((current / dur) * 100);
        }
    };

    const togglePlayPause = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => {});
        } else {
            videoRef.current.pause();
            setIsVideoPlaying(false);
        }
    };

    const toggleMute = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!videoRef.current) return;
        const nextMuted = !isVideoMuted;
        videoRef.current.muted = nextMuted;
        setIsVideoMuted(nextMuted);
    };

    const toggleFullscreen = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!videoContainerRef.current) return;
        if (!document.fullscreenElement) {
            videoContainerRef.current.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    };

    const handleRestartVideo = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!videoRef.current) return;
        videoRef.current.currentTime = 0;
        videoRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => {});
    };

    const formatVideoTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    // =========================================================
    // PAGE REVEAL ANIMATION
    // =========================================================

    useEffect(() => {
        const elements =
            document.querySelectorAll(".sales-reveal");

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(
                            "sales-visible"
                        );

                        observer.unobserve(entry.target);
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

        return () => observer.disconnect();
    }, []);

    // =========================================================
    // NAVIGATION
    // =========================================================

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const navigate = (
        page: string,
        fallback: string
    ) => {
        closeMenu();

        if (onNavigate) {
            onNavigate(page);
            return;
        }

        window.location.href = fallback;
    };

    // =========================================================
    // EPIC MAIN WEBSITE
    // =========================================================

    const goToEpicWebsite = () => {
        closeMenu();

        /*
         * IMPORTANT:
         * This is the EPIC MAIN CMS website.
         *
         * Change "/home" only if your main CMS route
         * uses a different path.
         */
        navigate("home", "/home");
    };

    // =========================================================
    // CLIENT LOGIN
    // =========================================================

    const goToClientLogin = () => {
        navigate(
            "client-login",
            "/client-login"
        );
    };

    // =========================================================
    // OPEN DEMO FORM
    // =========================================================

    const openDemoForm = () => {
        closeMenu();

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
        const { name, value } = event.target;

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
        // VALIDATION
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

            const payload = {
                fullName: formData.fullName.trim(),

                email: formData.email
                    .trim()
                    .toLowerCase(),

                churchName:
                    formData.churchName.trim(),

                phone:
                    formData.phone.trim() || null,

                position:
                    formData.position.trim() || null,

                message:
                    formData.message.trim() || null,
            };

            console.log(
                "Submitting EPIC demo request:",
                payload
            );

            // -------------------------------------------------
            // DATABASE API
            // POST /api/DemoRequests
            // -------------------------------------------------

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
                            ([field, messages]) =>
                                (
                                    messages as string[]
                                ).map(
                                    (message) =>
                                        `${field}: ${message}`
                                )
                        );

                    if (
                        validationErrors.length > 0
                    ) {
                        errorMessage +=
                            " " +
                            validationErrors.join(
                                " "
                            );
                    }
                }

                throw new Error(errorMessage);
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

            setFormData(INITIAL_FORM_DATA);
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
    // PROBLEMS
    // =========================================================

    const problems: Problem[] = [
        {
            icon: <Layers size={22} />,
            title: "Scattered Records",
            description:
                "Member information, attendance, giving and ministry records are often spread across spreadsheets, notebooks and files.",
        },
        {
            icon: <Clock size={22} />,
            title: "Wasted Time",
            description:
                "Church administrators spend valuable hours searching for information and repeating manual tasks.",
        },
        {
            icon: <EyeOff size={22} />,
            title: "Limited Visibility",
            description:
                "Important church information can be difficult to track, understand and turn into useful decisions.",
        },
        {
            icon: <ShieldCheck size={22} />,
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
            icon: <Users size={22} />,
            title: "Members",
            description:
                "Centralize member profiles, personal information and church records in one organized system.",
        },
        {
            icon: <CalendarCheck size={22} />,
            title: "Attendance",
            description:
                "Record attendance and gain a clearer picture of participation across your church services.",
        },
        {
            icon: <Wallet size={22} />,
            title: "Giving",
            description:
                "Organize tithes, offerings and giving records while keeping financial information easier to manage.",
        },
        {
            icon: <Church size={22} />,
            title: "Church Services",
            description:
                "Create and manage church services, schedules and service information from one place.",
        },
        {
            icon: <CalendarDays size={22} />,
            title: "Events",
            description:
                "Plan church events, programs, assignments and activities without relying on disconnected tools.",
        },
        {
            icon: <HeartHandshake size={22} />,
            title: "Ministries",
            description:
                "Manage ministries, ministry members and assignments while keeping everything organized.",
        },
        {
            icon: <UserPlus size={22} />,
            title: "Visitors",
            description:
                "Track visitors and follow-up information so your church can build meaningful connections.",
        },
        {
            icon: <BarChart3 size={22} />,
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

            {/* BACKGROUND */}

            <div className="sales-bg sales-bg-one" />
            <div className="sales-bg sales-bg-two" />
            <div className="sales-bg sales-bg-three" />
            <div className="sales-grid" />

            {/* =================================================
                NAVIGATION
            ================================================= */}

         <header
            ref={headerRef}
            className="sales-header"
            onMouseLeave={handleDropdownLeave}
        >
            <div className="sales-header-content">
                {/* BRAND */}
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

                {/* DESKTOP APPLE-STYLE NAVIGATION */}
                <nav className="sales-nav" aria-label="Main Navigation">
                    {MENU_CATEGORIES.map((category) => (
                        <button
                            key={category.id}
                            type="button"
                            className={`sales-nav-category-btn ${
                                activeDropdown === category.id ? "active" : ""
                            }`}
                            onClick={() => handleDropdownTrigger(category.id)}
                            onMouseEnter={() => handleDropdownHover(category.id)}
                            aria-expanded={activeDropdown === category.id}
                        >
                            <span>{category.label}</span>
                            <ChevronDown
                                size={14}
                                className={`sales-chevron ${
                                    activeDropdown === category.id ? "rotated" : ""
                                }`}
                            />
                        </button>
                    ))}

                    <a
                        href="#features"
                        className="sales-nav-link"
                        onClick={() => setActiveDropdown(null)}
                    >
                        Features
                    </a>

                    <a
                        href="#how-it-works"
                        className="sales-nav-link"
                        onClick={() => setActiveDropdown(null)}
                    >
                        How It Works
                    </a>

                    <div className="sales-nav-actions">
                        <button
                            type="button"
                            className="sales-login-button"
                            onClick={goToClientLogin}
                        >
                            Client Login
                        </button>

                        <button
                            type="button"
                            className="sales-primary-button sales-nav-cta"
                            onClick={openDemoForm}
                        >
                            Get Started
                        </button>
                    </div>
                </nav>

                {/* MOBILE ACTIONS */}
                <div className="sales-mobile-actions">
                    <button
                        type="button"
                        className="sales-mobile-menu"
                        onClick={() => setMenuOpen((value) => !value)}
                        aria-label="Toggle navigation"
                        aria-expanded={menuOpen}
                    >
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* APPLE-STYLE MEGA DROPDOWN PANEL */}
            {activeDropdown && (
                <div
                    className="sales-mega-dropdown"
                    onMouseEnter={() => {
                        if (hoverTimerRef.current) {
                            clearTimeout(hoverTimerRef.current);
                            hoverTimerRef.current = null;
                        }
                    }}
                    onMouseLeave={handleDropdownLeave}
                >
                    {(() => {
                        const currentCat = MENU_CATEGORIES.find(
                            (c) => c.id === activeDropdown
                        );
                        if (!currentCat) return null;

                        return (
                            <div className="sales-mega-dropdown-inner">
                                <div className="sales-mega-columns">
                                    {currentCat.columns.map((col, idx) => (
                                        <div key={idx} className="sales-mega-column">
                                            <span className="sales-mega-heading">
                                                {col.heading}
                                            </span>

                                            <div className="sales-mega-items">
                                                {col.items.map((item) => (
                                                    <button
                                                        key={item.title}
                                                        type="button"
                                                        className="sales-mega-item"
                                                        onClick={() => {
                                                            setActiveDropdown(null);
                                                            navigate(item.page, item.fallback);
                                                        }}
                                                    >
                                                        <div className="sales-mega-icon">
                                                            {item.icon}
                                                        </div>

                                                        <div className="sales-mega-text">
                                                            <div className="sales-mega-title-row">
                                                                <strong>{item.title}</strong>
                                                                {item.badge && (
                                                                    <span className="sales-mega-badge">
                                                                        {item.badge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span>{item.description}</span>
                                                        </div>

                                                        <ChevronRight size={14} className="sales-mega-arrow" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {currentCat.featured && (
                                    <div className="sales-mega-featured">
                                        <div className="sales-mega-featured-icon">
                                            {currentCat.featured.icon}
                                        </div>
                                        <h4>{currentCat.featured.title}</h4>
                                        <p>{currentCat.featured.description}</p>
                                        <button
                                            type="button"
                                            className="sales-mega-featured-btn"
                                            onClick={() => {
                                                setActiveDropdown(null);
                                                navigate(
                                                    currentCat.featured!.page,
                                                    currentCat.featured!.fallback
                                                );
                                            }}
                                        >
                                            {currentCat.featured.actionText} <ArrowRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* MOBILE ACCORDION DRAWER */}
            {menuOpen && (
                <div className="sales-mobile-drawer">
                    <div className="sales-mobile-drawer-content">
                        {MENU_CATEGORIES.map((cat) => (
                            <div key={cat.id} className="sales-mobile-cat">
                                <button
                                    type="button"
                                    className="sales-mobile-cat-header"
                                    onClick={() =>
                                        setMobileExpanded((curr) =>
                                            curr === cat.id ? null : cat.id
                                        )
                                    }
                                >
                                    <span>{cat.label}</span>
                                    <ChevronDown
                                        size={16}
                                        className={`sales-chevron ${
                                            mobileExpanded === cat.id ? "rotated" : ""
                                        }`}
                                    />
                                </button>

                                {mobileExpanded === cat.id && (
                                    <div className="sales-mobile-cat-items">
                                        {cat.columns.flatMap((c) => c.items).map((item) => (
                                            <button
                                                key={item.title}
                                                type="button"
                                                className="sales-mobile-subitem"
                                                onClick={() => {
                                                    setMenuOpen(false);
                                                    navigate(item.page, item.fallback);
                                                }}
                                            >
                                                <div className="sales-mega-icon">
                                                    {item.icon}
                                                </div>
                                                <div className="sales-mega-text">
                                                    <strong>{item.title}</strong>
                                                    <span>{item.description}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="sales-mobile-direct-links">
                            <a
                                href="#features"
                                onClick={() => setMenuOpen(false)}
                            >
                                Features
                            </a>
                            <a
                                href="#how-it-works"
                                onClick={() => setMenuOpen(false)}
                            >
                                How It Works
                            </a>
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    goToClientLogin();
                                }}
                            >
                                Client Login
                            </button>
                            <button
                                type="button"
                                className="sales-primary-button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    openDemoForm();
                                }}
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
                                onClick={openDemoForm}
                            >
                                <span>
                                    Get Started
                                </span>

                                <ArrowRight size={16} />
                            </button>

                            <a
                                href="#video"
                                className="sales-video-button"
                            >
                                <span className="sales-play-icon">
                                    <Play size={14} />
                                </span>

                                <span>
                                    Watch EPIC in Action
                                </span>
                            </a>

                        </div>

                        <div className="sales-trust-row">
                            <span>
                                <Check size={14} /> Cloud-Based
                            </span>

                            <span>
                                <Check size={14} /> Secure
                            </span>

                            <span>
                                <Check size={14} /> Church-Focused
                            </span>

                            <span>
                                <Check size={14} /> Easy to Use
                            </span>
                        </div>

                    </div>

                    {/* HERO DASHBOARD */}

                    <div className="sales-hero-visual sales-reveal">

                        <div className="sales-floating sales-floating-one">
                            <strong>127</strong>
                            <span>Members</span>
                        </div>

                        <div className="sales-floating sales-floating-two">
                            <strong>94%</strong>
                            <span>Attendance</span>
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

                                    <span><Church size={16} /></span>
                                    <span><Users size={16} /></span>
                                    <span><CalendarCheck size={16} /></span>
                                    <span><Wallet size={16} /></span>
                                    <span><Sparkles size={16} /></span>
                                    <span><BarChart3 size={16} /></span>

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

                    <div className="sales-video-wrapper sales-reveal" ref={videoContainerRef}>

                        <div className="sales-video-frame">

                            <div className="sales-real-video-container" onClick={togglePlayPause}>

                                <video
                                    ref={videoRef}
                                    className="sales-real-video-player"
                                    src="/videos/epic-overview.mp4"
                                    playsInline
                                    loop
                                    muted={isVideoMuted}
                                    preload="metadata"
                                    onTimeUpdate={handleVideoTimeUpdate}
                                    onPlay={() => setIsVideoPlaying(true)}
                                    onPause={() => setIsVideoPlaying(false)}
                                    onLoadedMetadata={() => {
                                        if (videoRef.current) {
                                            setVideoDuration(videoRef.current.duration);
                                        }
                                    }}
                                />

                                {/* Top status & sound badges */}
                                <div className="sales-video-top-bar" onClick={(e) => e.stopPropagation()}>
                                    <div className="sales-video-status-tag">
                                        <span className={`status-beacon ${isVideoPlaying ? "is-live" : ""}`} />
                                        <span>{isVideoPlaying ? "AUTOPLAYING ON SCROLL" : "PAUSED (SCROLL OR CLICK TO PLAY)"}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className={`sales-video-sound-chip ${!isVideoMuted ? "is-active" : ""}`}
                                        onClick={toggleMute}
                                        title={isVideoMuted ? "Click to unmute" : "Click to mute"}
                                    >
                                        {isVideoMuted ? (
                                            <>
                                                <VolumeX size={15} />
                                                <span>Unmute Sound</span>
                                            </>
                                        ) : (
                                            <>
                                                <Volume2 size={15} />
                                                <span>Sound On</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Center Paused Overlay */}
                                {!isVideoPlaying && (
                                    <div className="sales-video-paused-overlay">
                                        <div className="sales-video-play-large" onClick={togglePlayPause}>
                                            <Play size={28} />
                                        </div>
                                        <strong>EPIC CHURCH MANAGEMENT PLATFORM</strong>
                                        <span>PRODUCT PREVIEW &amp; WALKTHROUGH</span>
                                        <small>Click to play with sound or scroll to watch automatically</small>
                                    </div>
                                )}

                                {/* Bottom Controls Bar */}
                                <div className="sales-video-controls-bar" onClick={(e) => e.stopPropagation()}>
                                    <div
                                        className="video-progress-bar-wrap"
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const clickX = e.clientX - rect.left;
                                            const newPct = clickX / rect.width;
                                            if (videoRef.current) {
                                                videoRef.current.currentTime = newPct * (videoRef.current.duration || 1);
                                            }
                                        }}
                                    >
                                        <div
                                            className="video-progress-bar-fill"
                                            style={{ width: `${videoProgress}%` }}
                                        />
                                    </div>

                                    <div className="video-controls-row">
                                        <div className="video-controls-left">
                                            <button
                                                type="button"
                                                className="v-action-btn"
                                                onClick={togglePlayPause}
                                                title={isVideoPlaying ? "Pause" : "Play"}
                                            >
                                                {isVideoPlaying ? <Pause size={17} /> : <Play size={17} />}
                                            </button>

                                            <button
                                                type="button"
                                                className="v-action-btn"
                                                onClick={handleRestartVideo}
                                                title="Restart Video"
                                            >
                                                <RotateCcw size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                className="v-action-btn"
                                                onClick={toggleMute}
                                                title={isVideoMuted ? "Unmute" : "Mute"}
                                            >
                                                {isVideoMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                                            </button>

                                            <span className="video-time-display">
                                                {formatVideoTime(currentTime)} / {formatVideoTime(videoDuration)}
                                            </span>
                                        </div>

                                        <div className="video-controls-right">
                                            <span className="video-badge-pill">HD 1080p</span>
                                            <button
                                                type="button"
                                                className="v-action-btn"
                                                onClick={toggleFullscreen}
                                                title="Fullscreen"
                                            >
                                                <Maximize2 size={17} />
                                            </button>
                                        </div>
                                    </div>
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
                            (problem, index) => (
                                <div
                                    key={problem.title}
                                    className="sales-problem-card sales-reveal"
                                    style={{
                                        transitionDelay:
                                            `${index * 80}ms`,
                                    }}
                                >

                                    <div className="sales-card-icon">
                                        {problem.icon}
                                    </div>

                                    <h3>
                                        {problem.title}
                                    </h3>

                                    <p>
                                        {problem.description}
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
                            (feature, index) => (
                                <div
                                    className="sales-feature-card sales-reveal"
                                    key={feature.title}
                                    style={{
                                        transitionDelay:
                                            `${index * 60}ms`,
                                    }}
                                >

                                    <div className="sales-feature-top">

                                        <div className="sales-feature-icon">
                                            {feature.icon}
                                        </div>

                                        <span className="sales-feature-number">
                                            0{index + 1}
                                        </span>

                                    </div>

                                    <h3>
                                        {feature.title}
                                    </h3>

                                    <p>
                                        {feature.description}
                                    </p>

                                    <div className="sales-feature-link">
                                        Learn more <ArrowRight size={14} />
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
                            (step, index) => (
                                <div
                                    className="sales-step sales-reveal"
                                    key={step.number}
                                >

                                    <div className="sales-step-number">
                                        {step.number}
                                    </div>

                                    <div className="sales-step-content">

                                        <span>
                                            STEP{" "}
                                            {index + 1}
                                        </span>

                                        <h3>
                                            {step.title}
                                        </h3>

                                        <p>
                                            {step.description}
                                        </p>

                                    </div>

                                    {index <
                                        steps.length - 1 && (
                                        <div className="sales-step-connector">
                                            <ArrowRight size={18} />
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
                                <b><Check size={14} /></b>
                                Self-paced courses
                            </div>

                            <div>
                                <b><Check size={14} /></b>
                                Structured lessons
                            </div>

                            <div>
                                <b><Check size={14} /></b>
                                Progress tracking
                            </div>

                            <div>
                                <b><Check size={14} /></b>
                                Certificates
                            </div>

                        </div>

                        <button
                            className="sales-primary-button"
                            onClick={openDemoForm}
                        >
                            Explore EPIC Learning
                            <ArrowRight size={16} />
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
                                    <i>✓</i>
                                    Introduction to Faith
                                </div>

                                <div className="completed">
                                    <i>✓</i>
                                    Foundations of Faith
                                </div>

                                <div className="completed">
                                    <i>✓</i>
                                    Understanding Faith
                                </div>

                                <div>
                                    <i>○</i>
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
                                onClick={openDemoForm}
                            >
                                Start Your EPIC Journey
                                <ArrowRight size={16} />
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
                                <ArrowRight size={16} />
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

                <div
                    className="sales-brand"
                    onClick={goToEpicWebsite}
                    role="button"
                    tabIndex={0}
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

                <button onClick={openDemoForm}>
                    Get Started <ArrowRight size={16} />
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
                                onClick={closeDemoForm}
                                disabled={submittingDemo}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>

                        </div>

                        {/* SUCCESS */}

                        {demoSuccess ? (

                            <div className="sales-demo-success">

                                <div className="sales-demo-success-icon">
                                    <Check size={28} />
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
                                    onClick={closeDemoForm}
                                >
                                    Done <Check size={16} />
                                </button>

                            </div>

                        ) : (

                            <form
                                className="sales-demo-form"
                                onSubmit={handleDemoSubmit}
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
                                            <span>*</span>
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
                                            <span>*</span>
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
                                            <span>*</span>
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

                                    <span><Check size={14} /></span>

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
                                        onClick={closeDemoForm}
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
                                                Continue to EPIC <ArrowRight size={16} />
                                            </>
                                        )}

                                    </button>

                                </div>

                                <div className="sales-demo-security">
                                    <Lock size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                                    Your information is kept secure.
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

