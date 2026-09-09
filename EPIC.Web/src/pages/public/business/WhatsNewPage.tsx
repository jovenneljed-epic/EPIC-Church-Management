import { useEffect, useState } from "react";
import PublicHeader from "../../../components/PublicHeader";
import { getAnnouncements } from "../../../services/announcementService";
import type { Announcement } from "../../../services/announcementService";
import { getUpcomingChurchServices } from "../../../services/churchService";
import type { ChurchService } from "../../../services/churchService";
import {
    Sparkles,
    CalendarCheck,
    ArrowRight,
    CheckCircle2,
    Clock,
} from "lucide-react";
import "../../../components/business/whatsnew.css";

interface WhatsNewPageProps {
    onNavigate?: (url: string) => void;
}

export default function WhatsNewPage({ onNavigate }: WhatsNewPageProps) {
    const [activeTab, setActiveTab] = useState<"all" | "releases" | "announcements" | "roadmap">("all");
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [services, setServices] = useState<ChurchService[]>([]);

    useEffect(() => {
        window.scrollTo(0, 0);

        async function loadData() {
            try {
                const [announcementData, serviceData] = await Promise.all([
                    getAnnouncements().catch(() => []),
                    getUpcomingChurchServices().catch(() => []),
                ]);
                setAnnouncements(announcementData);
                setServices(serviceData);
            } catch (error) {
                console.error("Failed loading What's New data", error);
            }
        }

        loadData();
    }, []);

    const platformReleases = [
        {
            version: "v2.0.0",
            category: "Major Platform Update",
            date: "September 2026",
            title: "EPIC 2.0: Unified Church Intelligence & Operations Platform",
            description:
                "A complete evolution of the EPIC Church Management System introducing real-time QR attendance scanning, structured leadership evaluation matrices, multi-fund stewardship ledgers, and a refreshed Facebook-inspired light design.",
            highlights: [
                "Real-Time QR Attendance Scanner with Youth Retreat Break Pass (CRBreakPass) management",
                "Quarterly Ministry Leadership Evaluation Matrix with multi-factor scoring rubrics",
                "Multi-Fund Stewardship: Categorized Tithes, Building Fund, Missions & Love Gifts with instant receipts",
                "EPIC Discipleship Academy LMS: Integrated video tracks, module tracking & digital certificates",
                "Granular Role-Based Access Control (RBAC) isolating Pastor, Admin, Finance, and Ministry permissions",
                "Modern Facebook Light Theme UI optimized for mobile ushers and sanctuary entrance check-in",
            ],
        },
        {
            version: "v1.8.4",
            category: "Performance & Security",
            date: "August 2026",
            title: "Client Workspace Schema Isolation & Audit Logs",
            description:
                "Strengthened tenant boundaries and security logs for church administration, ensuring strict separation of confidential member pastoral notes and financial data.",
            highlights: [
                "Dedicated client schema isolation preventing cross-tenant data access",
                "Automatic daily cloud snapshots and transaction log shipping",
                "Audit trail logging for financial modifications and role changes",
            ],
        },
    ];

    const roadmapItems = [
        {
            quarter: "Q4 2026",
            title: "Automated SMS & WhatsApp Service Reminders",
            description:
                "Send broadcast reminders to congregation members for Sunday worship services, prayer meetings, and special church conferences directly from your dashboard.",
        },
        {
            quarter: "Q4 2026",
            title: "Self-Service Lobby Kiosk Mode",
            description:
                "A lockable touch-screen kiosk interface for sanctuary lobbies, enabling first-time visitors to register and parents to check in children safely.",
        },
        {
            quarter: "Q1 2027",
            title: "Automated Pastoral Care & 1st-Time Visitor Pipeline",
            description:
                "Automated multi-stage follow-up workflows guiding new guests from first-time visitor to water baptism, discipleship classes, and active ministry service.",
        },
    ];

    return (
        <div className="epic-whats-new">
            <PublicHeader onNavigate={onNavigate} />

            <main>
                {/* HERO */}
                <section className="wn-hero">
                    <div className="wn-container">
                        <div className="wn-label">
                            <Sparkles size={14} />
                            <span>PLATFORM RELEASES & COMMUNITY UPDATES</span>
                        </div>

                        <h1>
                            What&apos;s New in{" "}
                            <span className="wn-highlight">EPIC 2.0</span>
                        </h1>

                        <p className="wn-hero-desc">
                            Stay up to date with the latest features, platform improvements, system
                            changelogs, and active church announcements across the EPIC Church
                            Management ecosystem.
                        </p>

                        {/* FILTER TABS */}
                        <div className="wn-tabs">
                            <button
                                type="button"
                                className={`wn-tab-btn ${activeTab === "all" ? "active" : ""}`}
                                onClick={() => setActiveTab("all")}
                            >
                                All Updates
                            </button>
                            <button
                                type="button"
                                className={`wn-tab-btn ${activeTab === "releases" ? "active" : ""}`}
                                onClick={() => setActiveTab("releases")}
                            >
                                Platform Releases (v2.0)
                            </button>
                            <button
                                type="button"
                                className={`wn-tab-btn ${activeTab === "announcements" ? "active" : ""}`}
                                onClick={() => setActiveTab("announcements")}
                            >
                                Church Announcements
                            </button>
                            <button
                                type="button"
                                className={`wn-tab-btn ${activeTab === "roadmap" ? "active" : ""}`}
                                onClick={() => setActiveTab("roadmap")}
                            >
                                Upcoming Roadmap
                            </button>
                        </div>
                    </div>
                </section>

                {/* CONTENT SECTION */}
                <section className="wn-content-section">
                    <div className="wn-container">
                        {/* PLATFORM RELEASES */}
                        {(activeTab === "all" || activeTab === "releases") && (
                            <>
                                <div className="wn-section-title">
                                    <h2>System Releases & Changelogs</h2>
                                    <span className="wn-section-badge">Platform v2.0</span>
                                </div>

                                <div className="wn-releases-grid">
                                    {platformReleases.map((rel) => (
                                        <article key={rel.version} className="wn-release-card">
                                            <div className="wn-release-top">
                                                <div className="wn-release-tags">
                                                    <span className="wn-version-badge">{rel.version}</span>
                                                    <span className="wn-category-tag">{rel.category}</span>
                                                </div>
                                                <span className="wn-release-date">{rel.date}</span>
                                            </div>

                                            <h3>{rel.title}</h3>
                                            <p>{rel.description}</p>

                                            <ul className="wn-feature-bullets">
                                                {rel.highlights.map((h, i) => (
                                                    <li key={i}>
                                                        <CheckCircle2 size={14} className="wn-bullet-icon" />
                                                        <span>{h}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </article>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* UPCOMING ROADMAP */}
                        {(activeTab === "all" || activeTab === "roadmap") && (
                            <>
                                <div className="wn-section-title">
                                    <h2>Upcoming Ministry Roadmap</h2>
                                    <span className="wn-section-badge">In Development</span>
                                </div>

                                <div className="wn-roadmap-grid">
                                    {roadmapItems.map((item) => (
                                        <div key={item.title} className="wn-roadmap-card">
                                            <span className="wn-roadmap-quarter">{item.quarter}</span>
                                            <h4>{item.title}</h4>
                                            <p>{item.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* LIVE CHURCH ANNOUNCEMENTS (FROM DATABASE) */}
                        {(activeTab === "all" || activeTab === "announcements") && (
                            <>
                                <div className="wn-section-title">
                                    <h2>Live Church Announcements</h2>
                                    <span className="wn-section-badge">From Database</span>
                                </div>

                                {announcements.length > 0 ? (
                                    <div className="wn-announcements-grid">
                                        {announcements.map((item) => (
                                            <div key={item.id} className="wn-announcement-card">
                                                {item.imageUrl && (
                                                    <img
                                                        src={item.imageUrl}
                                                        alt={item.title}
                                                        className="wn-announcement-img"
                                                    />
                                                )}
                                                <div className="wn-announcement-body">
                                                    <div className="wn-announcement-meta">
                                                        <span className="wn-announcement-cat">
                                                            {item.category || "General"}
                                                        </span>
                                                        <span>
                                                            {item.createdDate
                                                                ? new Date(item.createdDate).toLocaleDateString()
                                                                : "Recent"}
                                                        </span>
                                                    </div>
                                                    <h4>{item.title}</h4>
                                                    <p>{item.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            padding: "24px",
                                            background: "#ffffff",
                                            borderRadius: "12px",
                                            border: "1px solid #e4e6eb",
                                            marginBottom: "40px",
                                            color: "#65676b",
                                            fontSize: "14px",
                                        }}
                                    >
                                        No announcements currently scheduled. Check back soon for upcoming church events!
                                    </div>
                                )}
                            </>
                        )}

                        {/* UPCOMING CHURCH SERVICES (FROM DATABASE) */}
                        {services.length > 0 && (
                            <>
                                <div className="wn-section-title">
                                    <h2>Upcoming Church Services</h2>
                                    <span className="wn-section-badge">Live Schedules</span>
                                </div>

                                <div className="wn-services-strip">
                                    {services.map((service) => (
                                        <div key={service.churchServiceId} className="wn-service-box">
                                            <div className="wn-service-icon">
                                                <CalendarCheck size={20} />
                                            </div>
                                            <div className="wn-service-info">
                                                <strong>{service.serviceName || "Worship Service"}</strong>
                                                <span>
                                                    <Clock size={12} style={{ display: "inline", marginRight: "4px" }} />
                                                    {service.serviceDate
                                                        ? new Date(service.serviceDate).toLocaleDateString()
                                                        : "Scheduled"}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {/* BOTTOM CTA */}
                <section className="wn-cta-section">
                    <div className="wn-container">
                        <h2>Ready to Experience What&apos;s New?</h2>
                        <p>
                            Discover how EPIC Church Management 2.0 can streamline operations and empower
                            your ministry leadership.
                        </p>
                        <div className="wn-cta-buttons">
                            <button
                                type="button"
                                className="wn-primary-btn"
                                onClick={() => onNavigate?.("demo")}
                            >
                                Try Interactive Demo <ArrowRight size={16} />
                            </button>
                            <button
                                type="button"
                                className="wn-secondary-btn"
                                onClick={() => onNavigate?.("epic-system")}
                            >
                                View System Features
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
