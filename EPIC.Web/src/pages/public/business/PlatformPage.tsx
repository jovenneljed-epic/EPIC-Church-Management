import React from "react";
import PublicHeader from "../../../components/PublicHeader";
import {
    Server,
    Database,
    ShieldCheck,
    Cpu,
    Lock,
    Cloud,
    QrCode,
    FileSpreadsheet,
    Layers,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    KeyRound,
} from "lucide-react";
import "./PlatformPage.css";

interface PlatformPageProps {
    onNavigate?: (page: string) => void;
}

export default function PlatformPage({ onNavigate }: PlatformPageProps) {
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const architecturalPillars = [
        {
            icon: <Layers size={22} />,
            title: "Multi-Tenant Workspace Isolation",
            badge: "Data Isolation",
            description:
                "Dedicated client schema isolation guarantees that each church's member directory, pastoral notes, and financial transactions are physically separated and private.",
            specs: [
                "Logical & schema-level tenant partitioning",
                "Zero risk of cross-church data leakage",
                "Custom church domain & branding settings",
            ],
        },
        {
            icon: <Server size={22} />,
            title: "ASP.NET Core & EF Core Backend",
            badge: "High Throughput",
            description:
                "Engineered with modern .NET 8 Web APIs and Entity Framework Core, providing sub-millisecond query execution and ACID transaction integrity for financial ledgers.",
            specs: [
                "ACID transaction safety for tithes & giving",
                "Asynchronous I/O connection pooling",
                "Secure parameterized SQL preventing injection",
            ],
        },
        {
            icon: <Cpu size={22} />,
            title: "React 19 Single-Page Architecture",
            badge: "Zero-Lag UI",
            description:
                "A fluid single-page client built with modern React, optimistic UI updates, and responsive touch targets designed for church usher tablets and mobile phones.",
            specs: [
                "Vite-bundled fast client runtime",
                "Optimistic UI state for instant click responses",
                "Touch-optimized for Sunday morning check-in tablets",
            ],
        },
        {
            icon: <QrCode size={22} />,
            title: "Cryptographic QR Verification Engine",
            badge: "Attendance Security",
            description:
                "High-speed QR token generation and validation engine that handles hundreds of simultaneous scans at sanctuary doors without queuing.",
            specs: [
                "Cryptographic tamper-proof member QR tokens",
                "Duplicate scan rejection & debounce logic",
                "CR & youth retreat break pass lifecycle tracking",
            ],
        },
        {
            icon: <KeyRound size={22} />,
            title: "Granular Role-Based Access Control (RBAC)",
            badge: "Permissions",
            description:
                "Strict role isolation ensures finance staff view ledgers, ministry leaders manage rosters, and volunteers only see what they need to serve.",
            specs: [
                "Pre-configured: Pastor, Admin, Finance, Leader",
                "Custom permission toggles per client workspace",
                "Audit logs tracking administrative modifications",
            ],
        },
        {
            icon: <Cloud size={22} />,
            title: "Continuous Backups & Disaster Recovery",
            badge: "High Reliability",
            description:
                "Cloud infrastructure designed for 99.9% Sunday morning uptime with automated database snapshots, transaction log shipping, and instant restore.",
            specs: [
                "Point-in-time transaction log recovery",
                "Automated nightly cloud database backups",
                "Redundant failover for zero Sunday disruption",
            ],
        },
    ];

    const stackTiers = [
        {
            layer: "TIER 1: CLIENT APPLICATIONS",
            desc: "Usher Tablets • Web Admin Portal • Volunteer Scanners",
            icon: <Cpu size={20} />,
            chips: ["React 19", "Vite Runtime", "Mobile Touch UI", "Offline Caching"],
        },
        {
            layer: "TIER 2: API GATEWAY & SECURITY",
            desc: "Authentication • Rate Limiting • CORS • SSL/TLS 1.3",
            icon: <Lock size={20} />,
            chips: ["ASP.NET Core Web API", "JWT Bearer Tokens", "Tenant Middleware", "Audit Pipeline"],
        },
        {
            layer: "TIER 3: CORE DOMAIN SERVICES",
            desc: "Business Logic • Attendance QR Engine • Multi-Fund Ledger • Academy LMS",
            icon: <Layers size={20} />,
            chips: ["Members Service", "Giving Engine", "Evaluation Matrix", "Course LMS", "CR Break Pass"],
        },
        {
            layer: "TIER 4: DATA PERSISTENCE & STORAGE",
            desc: "Relational Database • Document Storage • Encrypted Snapshots",
            icon: <Database size={20} />,
            chips: ["SQL Server / EF Core", "Blob Storage", "Automated Snapshots", "ACID Compliance"],
        },
    ];

    return (
        <div className="epic-platform-page">
            <PublicHeader onNavigate={onNavigate} />

            <main>
                {/* HERO */}
                <section className="platform-hero">
                    <div className="platform-container">
                        <div className="platform-hero-badge">
                            <Sparkles size={14} />
                            <span>CLOUD-NATIVE CHURCH INFRASTRUCTURE</span>
                        </div>

                        <h1>
                            Enterprise Platform Architecture Built for{" "}
                            <span className="platform-highlight">Growing Churches</span>
                        </h1>

                        <p className="platform-hero-desc">
                            EPIC Church Management System is engineered on modern cloud standards with
                            high-throughput ASP.NET Core APIs, Entity Framework Core with SQL Server data
                            protection, multi-tenant workspace isolation, and cryptographic QR token processing.
                        </p>

                        <div className="platform-hero-actions">
                            <button
                                type="button"
                                className="platform-primary-btn"
                                onClick={() => onNavigate?.("demo")}
                            >
                                Request Technical Demo <ArrowRight size={16} />
                            </button>

                            <button
                                type="button"
                                className="platform-secondary-btn"
                                onClick={() => onNavigate?.("epic-system")}
                            >
                                View System Overview
                            </button>
                        </div>

                        {/* TELEMETRY STRIP */}
                        <div className="platform-telemetry-strip">
                            <div className="platform-telemetry-item">
                                <div className="platform-telemetry-val">
                                    <span className="platform-dot-active" />
                                    <span>99.9%</span>
                                </div>
                                <span className="platform-telemetry-label">Sunday Uptime SLA</span>
                            </div>
                            <div className="platform-telemetry-sep" />
                            <div className="platform-telemetry-item">
                                <div className="platform-telemetry-val">
                                    <span>&lt; 15ms</span>
                                </div>
                                <span className="platform-telemetry-label">Database Query Latency</span>
                            </div>
                            <div className="platform-telemetry-sep" />
                            <div className="platform-telemetry-item">
                                <div className="platform-telemetry-val">
                                    <span>Isolated</span>
                                </div>
                                <span className="platform-telemetry-label">Multi-Tenant Schemas</span>
                            </div>
                            <div className="platform-telemetry-sep" />
                            <div className="platform-telemetry-item">
                                <div className="platform-telemetry-val">
                                    <span>Automated</span>
                                </div>
                                <span className="platform-telemetry-label">Cloud Backups & Snapshots</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ARCHITECTURAL PILLARS */}
                <section className="platform-section">
                    <div className="platform-container">
                        <div className="platform-section-header">
                            <span className="platform-subhead">ENGINEERING EXCELLENCE</span>
                            <h2>Architectural Foundations of EPIC</h2>
                            <p>
                                Built from the ground up to solve the real operational challenges churches
                                face every Sunday morning.
                            </p>
                        </div>

                        <div className="platform-pillars-grid">
                            {architecturalPillars.map((pillar) => (
                                <article key={pillar.title} className="platform-pillar-card">
                                    <div className="platform-card-header">
                                        <div className="platform-card-icon">{pillar.icon}</div>
                                        <span className="platform-card-badge">{pillar.badge}</span>
                                    </div>

                                    <h3>{pillar.title}</h3>
                                    <p>{pillar.description}</p>

                                    <ul className="platform-card-specs">
                                        {pillar.specs.map((spec, i) => (
                                            <li key={i}>
                                                <CheckCircle2 size={14} className="platform-check" />
                                                <span>{spec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ARCHITECTURE STACK VISUALIZATION */}
                <section className="platform-section light">
                    <div className="platform-container">
                        <div className="platform-section-header">
                            <span className="platform-subhead">4-TIER ARCHITECTURE</span>
                            <h2>The Complete Technology Stack</h2>
                            <p>
                                A robust, layered software stack ensuring high security, real-time
                                reactivity, and seamless integration between church departments.
                            </p>
                        </div>

                        <div className="platform-stack-card">
                            {stackTiers.map((tier) => (
                                <div key={tier.layer} className="platform-tier">
                                    <div className="platform-tier-label">
                                        <div className="platform-tier-icon">{tier.icon}</div>
                                        <div className="platform-tier-text">
                                            <strong>{tier.layer}</strong>
                                            <span>{tier.desc}</span>
                                        </div>
                                    </div>

                                    <div className="platform-tier-chips">
                                        {tier.chips.map((chip) => (
                                            <span key={chip} className="platform-chip">
                                                {chip}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* SECURITY HIGHLIGHTS */}
                        <div className="platform-security-grid">
                            <div className="platform-sec-box">
                                <h4>
                                    <ShieldCheck size={18} color="#1877f2" />
                                    Data Encryption in Transit & Rest
                                </h4>
                                <p>
                                    All data transmission is encrypted via TLS 1.3. Confidential pastoral
                                    records and giving transactions are protected with industry-standard
                                    storage encryption.
                                </p>
                            </div>

                            <div className="platform-sec-box">
                                <h4>
                                    <KeyRound size={18} color="#1877f2" />
                                    Zero-Trust Church Roles
                                </h4>
                                <p>
                                    Every API request verifies JWT tokens and enforces client workspace
                                    authorization filters, preventing unauthorized financial or pastoral
                                    access.
                                </p>
                            </div>

                            <div className="platform-sec-box">
                                <h4>
                                    <FileSpreadsheet size={18} color="#1877f2" />
                                    Audit Trails & Export Engine
                                </h4>
                                <p>
                                    Every tithe entry, attendance modification, and leadership evaluation is
                                    stamped with timestamps and user identities for complete financial
                                    integrity.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* BOTTOM CTA */}
                <section className="platform-cta-section">
                    <div className="platform-container">
                        <h2>Deploy Enterprise Church Technology Today</h2>
                        <p>
                            Experience the speed, reliability, and security of EPIC Church Management System.
                        </p>
                        <div className="platform-cta-buttons">
                            <button
                                type="button"
                                className="platform-primary-btn"
                                onClick={() => onNavigate?.("demo")}
                            >
                                Request Technical Demo <ArrowRight size={16} />
                            </button>
                            <button
                                type="button"
                                className="platform-secondary-btn"
                                onClick={() => onNavigate?.("contact")}
                            >
                                Talk With An Architect
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}