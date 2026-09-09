import React from "react";
import PublicHeader from "../../components/PublicHeader";
import {
    Users,
    QrCode,
    Wallet,
    CalendarCheck,
    HeartHandshake,
    Activity,
    GraduationCap,
    ShieldCheck,
    ArrowRight,
    CheckCircle2,
    Sparkles,
    BarChart3,
    Clock,
} from "lucide-react";
import "./EpicSystemPage.css";

interface EpicSystemPageProps {
    onNavigate?: (page: string) => void;
}

const EpicSystemPage: React.FC<EpicSystemPageProps> = ({ onNavigate }) => {
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const coreModules = [
        {
            icon: <Users size={22} />,
            title: "Smart Member Care & Family Directory",
            badge: "Core Directory",
            description:
                "Centralize member profiles, contact information, family trees, and spiritual milestones from salvation to water baptism and discipleship.",
            highlights: [
                "Family tree & household grouping",
                "Spiritual journey milestone tracking",
                "Automated member status & contact logs",
            ],
        },
        {
            icon: <QrCode size={22} />,
            title: "Real-Time QR Attendance & Session Scanning",
            badge: "Instant Check-In",
            description:
                "Conduct lightning-fast attendance check-ins using member QR identities, mobile camera scanning, and automated youth camp break passes.",
            highlights: [
                "Service session check-in with live counts",
                "CR & youth retreat break pass scanning",
                "Absentee detection & pastoral follow-up alerts",
            ],
        },
        {
            icon: <Wallet size={22} />,
            title: "Multi-Fund Stewardship & Tithes Accounting",
            badge: "Financial Ledger",
            description:
                "Record tithes, offerings, missions, building funds, and love gifts with complete transparency, automated digital receipts, and audit reports.",
            highlights: [
                "Multi-fund allocation (Tithes, Missions, Building)",
                "Instant electronic receipt generation",
                "Church council & treasurer audit statements",
            ],
        },
        {
            icon: <CalendarCheck size={22} />,
            title: "Church Services & Worship Operations",
            badge: "Service Planning",
            description:
                "Organize service schedules, orders of worship, scripture themes, and preacher assignments for multi-service Sunday mornings.",
            highlights: [
                "Custom orders of service & rundown builder",
                "Multi-campus service coordination",
                "Sermon archives & digital bulletin sync",
            ],
        },
        {
            icon: <HeartHandshake size={22} />,
            title: "Ministry Department & Volunteer Rostering",
            badge: "Team Management",
            description:
                "Coordinate worship teams, ushering, media, youth, and outreach departments with volunteer duty rosters and task assignment checklists.",
            highlights: [
                "Department volunteer scheduling & rosters",
                "Equipment checklists & requisition tracking",
                "Leader-to-volunteer communication",
            ],
        },
        {
            icon: <Activity size={22} />,
            title: "Quarterly Ministry Leadership Evaluation",
            badge: "Health Matrix",
            description:
                "Assess ministry health and leadership readiness using structured evaluation matrices, performance scoring rubrics, and mentor feedback.",
            highlights: [
                "Multi-factor ministry evaluation scoring",
                "Leader readiness & spiritual maturity rubric",
                "Historical ministry health trend reports",
            ],
        },
        {
            icon: <GraduationCap size={22} />,
            title: "EPIC Discipleship Academy LMS",
            badge: "Education",
            description:
                "Empower leaders and new believers through integrated video modules, self-paced courses, progress tracking, and digital completion certificates.",
            highlights: [
                "Structured discipleship learning tracks",
                "Interactive video & lesson progress tracker",
                "Automated graduation certificate generation",
            ],
        },
        {
            icon: <ShieldCheck size={22} />,
            title: "Client Workspace & Multi-Role Permissions",
            badge: "Tenant Security",
            description:
                "Role-based access control protecting sensitive pastoral notes and financial statements while granting ministry heads full operational power.",
            highlights: [
                "Dedicated client tenant data isolation",
                "Granular roles: Senior Pastor, Admin, Finance, Leader",
                "Encrypted cloud backups & security logs",
            ],
        },
    ];

    const workflowSteps = [
        {
            num: "01",
            title: "Member Check-In & Identity",
            desc: "Ushers scan member QR codes at the entrance or log attendance manually in seconds.",
        },
        {
            num: "02",
            title: "Service Operations & Rostering",
            desc: "Ministries execute order-of-service items, record tithes, and manage team duties live.",
        },
        {
            num: "03",
            title: "Stewardship & Fund Accounting",
            desc: "Treasurers record tithes and allocate funds with automated receipts and verified ledger balances.",
        },
        {
            num: "04",
            title: "Leadership Insights & Academy",
            desc: "Pastors review health evaluations, track discipleship progress, and plan next Sunday's ministry.",
        },
    ];

    return (
        <div className="epic-system-page">
            <PublicHeader onNavigate={onNavigate} />

            <main>
                {/* HERO */}
                <section className="system-hero">
                    <div className="system-container">
                        <div className="system-hero-badge">
                            <Sparkles size={14} />
                            <span>EPIC CHURCH MANAGEMENT SYSTEM 2.0</span>
                        </div>

                        <h1>
                            Technology Crafted for{" "}
                            <span className="system-highlight">Kingdom Ministry</span>
                        </h1>

                        <p className="system-hero-desc">
                            EPIC is an enterprise-grade church management platform designed to help
                            pastors, ministry directors, and church administrators organize records,
                            steward finances, evaluate leadership, and shepherd members with clarity
                            and excellence.
                        </p>

                        <div className="system-hero-actions">
                            <button
                                type="button"
                                className="system-primary-btn"
                                onClick={() => onNavigate?.("demo")}
                            >
                                Experience Interactive Demo <ArrowRight size={16} />
                            </button>

                            <button
                                type="button"
                                className="system-secondary-btn"
                                onClick={() => onNavigate?.("platform")}
                            >
                                View Platform Architecture
                            </button>
                        </div>

                        {/* KEY STATS BAR */}
                        <div className="system-stats-strip">
                            <div className="system-stat-item">
                                <strong>8 Core</strong>
                                <span>Ministry Modules</span>
                            </div>
                            <div className="system-stat-sep" />
                            <div className="system-stat-item">
                                <strong>100% Real-Time</strong>
                                <span>QR Attendance</span>
                            </div>
                            <div className="system-stat-sep" />
                            <div className="system-stat-item">
                                <strong>Multi-Fund</strong>
                                <span>Financial Ledgers</span>
                            </div>
                            <div className="system-stat-sep" />
                            <div className="system-stat-item">
                                <strong>Integrated</strong>
                                <span>Discipleship LMS</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CORE MODULES SECTION */}
                <section className="system-modules-section">
                    <div className="system-container">
                        <div className="system-section-header">
                            <span className="system-subhead">SYSTEM CAPABILITIES</span>
                            <h2>Comprehensive Tools for Every Ministry Area</h2>
                            <p>
                                Everything your church needs to operate smoothly, eliminate manual
                                paperwork, and keep pastoral leadership informed.
                            </p>
                        </div>

                        <div className="system-modules-grid">
                            {coreModules.map((module) => (
                                <article key={module.title} className="system-module-card">
                                    <div className="system-card-top">
                                        <div className="system-card-icon">{module.icon}</div>
                                        <span className="system-card-badge">{module.badge}</span>
                                    </div>

                                    <h3>{module.title}</h3>
                                    <p>{module.description}</p>

                                    <ul className="system-card-highlights">
                                        {module.highlights.map((h, i) => (
                                            <li key={i}>
                                                <CheckCircle2 size={14} className="system-check" />
                                                <span>{h}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* SYSTEM WORKFLOW & DASHBOARD PREVIEW */}
                <section className="system-workflow-section">
                    <div className="system-container">
                        <div className="system-section-header">
                            <span className="system-subhead">ONE CONNECTED ECOSYSTEM</span>
                            <h2>How EPIC Connects Your Church Workflow</h2>
                            <p>
                                Information moves effortlessly between departments so your team
                                works as one united body.
                            </p>
                        </div>

                        <div className="system-workflow-grid">
                            {workflowSteps.map((step) => (
                                <div key={step.num} className="system-workflow-card">
                                    <div className="system-workflow-num">{step.num}</div>
                                    <h4>{step.title}</h4>
                                    <p>{step.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* MOCKUP WINDOW */}
                        <div className="system-window">
                            <div className="system-window-header">
                                <div className="system-window-dots">
                                    <span />
                                    <span />
                                    <span />
                                </div>
                                <div className="system-window-title">
                                    EPIC Church Management System — Executive Dashboard
                                </div>
                                <div className="system-window-status">
                                    <span className="system-pulse" /> Live System Active
                                </div>
                            </div>

                            <div className="system-window-body">
                                <div className="system-dash-sidebar">
                                    <div className="system-dash-brand">EPIC CMS</div>
                                    <div className="system-dash-nav-item active">
                                        <BarChart3 size={15} /> Dashboard
                                    </div>
                                    <div className="system-dash-nav-item">
                                        <Users size={15} /> Members
                                    </div>
                                    <div className="system-dash-nav-item">
                                        <QrCode size={15} /> Attendance
                                    </div>
                                    <div className="system-dash-nav-item">
                                        <Wallet size={15} /> Giving & Tithes
                                    </div>
                                    <div className="system-dash-nav-item">
                                        <CalendarCheck size={15} /> Services
                                    </div>
                                    <div className="system-dash-nav-item">
                                        <HeartHandshake size={15} /> Ministries
                                    </div>
                                    <div className="system-dash-nav-item">
                                        <Activity size={15} /> Evaluation
                                    </div>
                                    <div className="system-dash-nav-item">
                                        <GraduationCap size={15} /> Academy
                                    </div>
                                </div>

                                <div className="system-dash-main">
                                    <div className="system-dash-top">
                                        <div>
                                            <h4>Sunday Morning Service Overview</h4>
                                            <span className="system-dash-sub">
                                                Main Campus — Worship Service 10:00 AM
                                            </span>
                                        </div>
                                        <div className="system-dash-pill">
                                            <Clock size={13} /> Real-Time Sync
                                        </div>
                                    </div>

                                    <div className="system-dash-metrics">
                                        <div className="system-metric-box">
                                            <span>Present Members</span>
                                            <strong>384</strong>
                                            <small className="system-pos">+12% vs last week</small>
                                        </div>
                                        <div className="system-metric-box">
                                            <span>First-Time Visitors</span>
                                            <strong>26</strong>
                                            <small className="system-pos">Assigned for follow-up</small>
                                        </div>
                                        <div className="system-metric-box">
                                            <span>Tithes & Offerings</span>
                                            <strong>₱148,500</strong>
                                            <small className="system-neu">Multi-fund verified</small>
                                        </div>
                                        <div className="system-metric-box">
                                            <span>Volunteers On Duty</span>
                                            <strong>42 / 45</strong>
                                            <small className="system-neu">93% rostered</small>
                                        </div>
                                    </div>

                                    <div className="system-dash-row">
                                        <div className="system-dash-panel">
                                            <h5>Live QR Attendance Feed</h5>
                                            <div className="system-feed-list">
                                                <div className="system-feed-row">
                                                    <span className="system-feed-dot" />
                                                    <div>
                                                        <strong>Bro. Daniel Cruz</strong>
                                                        <small>Adult Ministry • 09:42 AM</small>
                                                    </div>
                                                    <span className="system-badge-in">Checked In</span>
                                                </div>
                                                <div className="system-feed-row">
                                                    <span className="system-feed-dot" />
                                                    <div>
                                                        <strong>Sis. Maria Santos & Family (4)</strong>
                                                        <small>Family Check-In • 09:46 AM</small>
                                                    </div>
                                                    <span className="system-badge-in">Checked In</span>
                                                </div>
                                                <div className="system-feed-row">
                                                    <span className="system-feed-dot" />
                                                    <div>
                                                        <strong>Joshua Ramirez</strong>
                                                        <small>Youth Camp Pass • 09:51 AM</small>
                                                    </div>
                                                    <span className="system-badge-in">Break Pass</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="system-dash-panel">
                                            <h5>Ministry Health Rating</h5>
                                            <div className="system-health-bars">
                                                <div className="system-bar-group">
                                                    <div className="system-bar-label">
                                                        <span>Worship Team</span>
                                                        <strong>98%</strong>
                                                    </div>
                                                    <div className="system-bar-track">
                                                        <div className="system-bar-fill" style={{ width: "98%" }} />
                                                    </div>
                                                </div>
                                                <div className="system-bar-group">
                                                    <div className="system-bar-label">
                                                        <span>Ushering & Greeters</span>
                                                        <strong>94%</strong>
                                                    </div>
                                                    <div className="system-bar-track">
                                                        <div className="system-bar-fill" style={{ width: "94%" }} />
                                                    </div>
                                                </div>
                                                <div className="system-bar-group">
                                                    <div className="system-bar-label">
                                                        <span>Media & Tech</span>
                                                        <strong>92%</strong>
                                                    </div>
                                                    <div className="system-bar-track">
                                                        <div className="system-bar-fill" style={{ width: "92%" }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* BOTTOM CALL TO ACTION */}
                <section className="system-cta-section">
                    <div className="system-container">
                        <h2>Ready to Empower Your Church Leadership?</h2>
                        <p>
                            Join pastors and churches using EPIC to modernize operations, care for
                            congregations, and advance the Kingdom.
                        </p>
                        <div className="system-cta-buttons">
                            <button
                                type="button"
                                className="system-primary-btn"
                                onClick={() => onNavigate?.("demo")}
                            >
                                Test Live Interactive Demo <ArrowRight size={16} />
                            </button>
                            <button
                                type="button"
                                className="system-secondary-btn"
                                onClick={() => onNavigate?.("contact")}
                            >
                                Connect With Our Team
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default EpicSystemPage;
