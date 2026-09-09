import React, { useEffect, useState } from "react";
import PublicHeader from "../../components/PublicHeader";
import { getAnnouncements } from "../../services/announcementService";
import type { Announcement as DbAnnouncement } from "../../services/announcementService";
import {
    Bell,
    Calendar,
    Tag,
    ArrowRight,
    Search,
    X,
    CheckCircle2
} from "lucide-react";
import "./AnnouncementsPage.css";
import "./PublicUnisonTheme.css";

export interface SystemAnnouncement {
    id: number | string;
    title: string;
    category: "FEATURED" | "MINISTRY" | "DISCIPLESHIP" | "FINANCE" | "COMMUNITY";
    date: string;
    badge: string;
    summary: string;
    content: string;
    actionLabel?: string;
    actionTarget?: string;
    keyPoints: string[];
    isFeatured?: boolean;
}

interface AnnouncementsPageProps {
    onNavigate?: (page: string) => void;
}

const OFFICIAL_ANNOUNCEMENTS: SystemAnnouncement[] = [
    {
        id: "ann-1",
        title: "EPIC 2.0 Express QR Check-In Stations Are Now Live",
        category: "FEATURED",
        date: "August 28, 2026",
        badge: "System Upgrade",
        summary:
            "We have deployed real-time QR attendance kiosks at all sanctuary entryways and children's church rooms. Members can scan their digital member QR code directly from their smartphone for express, zero-queue check-in.",
        content:
            "As our church continues to grow, we are dedicated to providing a smooth, welcoming Sunday morning experience. Starting this Sunday, our Greeter and Ushering teams are equipped with tablet-based QR scanner kiosks. Simply open your member profile on your phone or show your printed family badge to be verified in under two seconds. First-time visitors will receive a welcoming guest badge and welcome pack.",
        actionLabel: "View Demo Simulator",
        actionTarget: "demo",
        keyPoints: [
            "Save your digital QR pass to Apple Wallet or phone photos",
            "Zero-queue express attendance for Sunday 9AM & 2PM services",
            "Safe nursery and children's church automated matching tags",
            "Assistance volunteers stationed in the main church foyer"
        ],
        isFeatured: true
    },
    {
        id: "ann-2",
        title: "Discipleship Academy Term 2 Enrollment Now Open",
        category: "DISCIPLESHIP",
        date: "August 24, 2026",
        badge: "Enrollment",
        summary:
            "Registration is open for Discipleship Track 101 (Foundations of Faith) and Track 201 (Christian Life & Growth). Structured modules include video lessons, downloadable workbooks, and mentorship group sessions.",
        content:
            "Grow deeper in God's Word and prepare for kingdom service. Term 2 classes begin next month both online via the EPIC Learning LMS and through weekly in-person small group huddles. Complete lessons at your own pace and meet weekly with your spiritual mentor to discuss practical biblical application.",
        actionLabel: "Explore Learning Tracks",
        actionTarget: "learning",
        keyPoints: [
            "Track 101: Salvation, Prayer, Biblical Authority & Holy Spirit",
            "Track 201: Character, Spiritual Disciplines & Faith Walking",
            "Official Church Graduation Certificate upon completion",
            "Classes led by Senior Pastoral Team and certified teachers"
        ],
        isFeatured: true
    },
    {
        id: "ann-3",
        title: "Mid-Year Tithes & Multi-Fund Giving Statements Available",
        category: "FINANCE",
        date: "August 20, 2026",
        badge: "Stewardship",
        summary:
            "Your digital stewardship statements covering General Tithes, Missions, Building Fund, and Benevolence are ready in the Member Portal. Electronic receipts ensure 100% financial transparency and audit integrity.",
        content:
            "We give thanks to God for the steadfast generosity of the EPIC Church congregation. Mid-year giving statements have been finalized by our Church Finance Office. You can download your itemized summary showing contributions across all designated church funds.",
        actionLabel: "Contact Finance Office",
        actionTarget: "contact",
        keyPoints: [
            "Download itemized PDF statements for your family records",
            "Multi-fund breakdown: Tithes, Building, Missions & Love Gifts",
            "Full church financial audit presented at Quarterly Stewardship Night",
            "Encrypted, tamper-proof electronic transaction ledgers"
        ]
    },
    {
        id: "ann-4",
        title: "Quarterly Ministry Health & Volunteer Evaluations Scheduled",
        category: "MINISTRY",
        date: "August 15, 2026",
        badge: "Leadership",
        summary:
            "Department directors for Worship, Ushers, Media, Youth, Children, and Outreach will complete their Q3 Ministry Health evaluations using the EPIC 4-Pillar Rubric to support volunteer readiness and spiritual vitality.",
        content:
            "Healthy churches are built on healthy ministry teams. Our quarterly evaluation process provides a structured assessment of team attendance, leadership development, equipment maintenance, and spiritual vitality. Ministry heads will meet one-on-one with pastoral mentors to review team rubrics.",
        actionLabel: "View Ministry Rubrics",
        actionTarget: "ministry-evaluation",
        keyPoints: [
            "Assessment of operational readiness, checklists & punctuality",
            "Spiritual growth checkups for all rostered servants",
            "Results reviewed during Pastoral Alignment Summit",
            "Recognition awards for exemplary volunteer commitment"
        ]
    },
    {
        id: "ann-5",
        title: "Youth Encounter Camp 2026 Registration with Digital Break Passes",
        category: "COMMUNITY",
        date: "August 10, 2026",
        badge: "Youth Retreat",
        summary:
            "Registration for the annual 3-day Youth Encounter Retreat at Mount Hermon is now active. All registered youth will receive a secure CRBreakPass QR credential for check-in and session security.",
        content:
            "Calling all high school, college students, and young adults! Prepare for three days of life-changing encounters with God. Featuring powerful praise sessions, relevant breakout discussions on culture and calling, outdoor team challenges, and deep fellowship.",
        actionLabel: "View Camp Details",
        actionTarget: "events",
        keyPoints: [
            "Camp capacity limited to 250 registered youth",
            "Subsidized slots available through Church Benevolence",
            "Digital CRBreakPass badges issued upon registration confirmation",
            "Parent informational meeting this coming Sunday after 2PM service"
        ]
    },
    {
        id: "ann-6",
        title: "Volunteer Duty Rostering Open for 28th Church Anniversary",
        category: "MINISTRY",
        date: "August 05, 2026",
        badge: "Volunteer Service",
        summary:
            "Prepare for our upcoming celebration! Open volunteer slots are available for Ushering, Parking & Traffic, Food Service, Stage Production, and Kids Church. Sign up through your ministry director.",
        content:
            "Our church anniversary celebration requires all hands on deck! We invite every member who is not currently serving in a ministry to step forward and experience the joy of Christian service. Duty rotations and checklists will be managed via the EPIC system.",
        actionLabel: "Join a Ministry",
        actionTarget: "ministries",
        keyPoints: [
            "Duty shifts coordinated through the EPIC Ministry Duty Roster",
            "Dry run and prayer briefing scheduled for the Saturday prior",
            "Commemorative volunteer team shirt provided to all participants",
            "Sign up through your ministry director or online contact form"
        ]
    }
];

const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({ onNavigate }) => {
    const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>(OFFICIAL_ANNOUNCEMENTS);
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [activeAnnouncement, setActiveAnnouncement] = useState<SystemAnnouncement | null>(null);

    useEffect(() => {
        getAnnouncements()
            .then((dbData: DbAnnouncement[]) => {
                if (Array.isArray(dbData) && dbData.length > 0) {
                    const formattedDb: SystemAnnouncement[] = dbData.map((item) => ({
                        id: `db-${item.id}`,
                        title: item.title,
                        category: "COMMUNITY",
                        date: item.publishDate ? new Date(item.publishDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent",
                        badge: item.category || "Church Notice",
                        summary: item.content ? item.content.slice(0, 160) + "..." : "Important church update.",
                        content: item.content || "No details provided.",
                        keyPoints: ["Official Church Database Notice", "For inquiries, contact pastoral office"]
                    }));
                    setAnnouncements([...OFFICIAL_ANNOUNCEMENTS, ...formattedDb]);
                }
            })
            .catch(() => {
                // Graceful fallback to OFFICIAL_ANNOUNCEMENTS
            });
    }, []);

    const categories = ["ALL", "FEATURED", "MINISTRY", "DISCIPLESHIP", "FINANCE", "COMMUNITY"];

    const filtered = announcements.filter((ann) => {
        const matchesCat = selectedCategory === "ALL" || ann.category === selectedCategory;
        const matchesSearch =
            searchQuery.trim() === "" ||
            ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ann.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ann.badge.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    return (
        <div className="epic-public-announcements">
            <PublicHeader onNavigate={onNavigate} />

            {/* HERO */}
            <section className="announcements-hero">
                <div className="announcements-hero-content">
                    <span className="announcements-eyebrow">
                        <Bell size={14} /> OFFICIAL CHURCH NOTICES &amp; UPDATES
                    </span>
                    <h1>
                        Stay Informed. <span>Stay Connected.</span>
                    </h1>
                    <p>
                        Keep up with the latest announcements, spiritual milestones, ministry rosters,
                        and system updates across the EPIC Church community.
                    </p>
                    <div className="events-hero-actions">
                        <button
                            type="button"
                            className="events-primary-button"
                            onClick={() => {
                                const el = document.getElementById("announcements-list-anchor");
                                el?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            Read Latest Bulletins <ArrowRight size={16} />
                        </button>
                        <button
                            type="button"
                            className="events-secondary-button"
                            onClick={() => onNavigate?.("events")}
                        >
                            <Calendar size={16} /> Upcoming Calendar
                        </button>
                    </div>
                </div>
            </section>

            {/* ANNOUNCEMENT LIST SECTION */}
            <section className="announcements-main-section" id="announcements-list-anchor">
                <div className="announcements-container">
                    {/* CONTROLS */}
                    <div className="announcements-controls-bar">
                        <div className="announcements-filter-pills">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    className={`announcements-pill ${selectedCategory === cat ? "active" : ""}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat === "ALL" ? "All Bulletins" : cat}
                                </button>
                            ))}
                        </div>

                        <div className="announcements-search-box">
                            <Search size={16} className="announcements-search-icon" />
                            <input
                                type="text"
                                placeholder="Search announcements..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="announcements-clear-search"
                                    onClick={() => setSearchQuery("")}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* CARDS GRID */}
                    <div className="announcements-cards-grid">
                        {filtered.map((ann) => (
                            <article
                                key={ann.id}
                                className={`announcement-card ${ann.isFeatured ? "featured" : ""}`}
                                onClick={() => setActiveAnnouncement(ann)}
                            >
                                <div className="announcement-card-top-row">
                                    <span className="announcement-badge-pill">{ann.badge}</span>
                                    <span className="announcement-date-text">
                                        <Calendar size={13} /> {ann.date}
                                    </span>
                                </div>

                                <h3>{ann.title}</h3>
                                <p>{ann.summary}</p>

                                <div className="announcement-card-highlights">
                                    {ann.keyPoints.slice(0, 2).map((pt, idx) => (
                                        <div key={idx} className="announcement-bullet-pill">
                                            <CheckCircle2 size={13} className="bullet-icon" />
                                            <span>{pt}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="announcement-card-bottom-row">
                                    <span className="announcement-category-tag">{ann.category}</span>
                                    <button
                                        type="button"
                                        className="announcement-read-more"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveAnnouncement(ann);
                                        }}
                                    >
                                        Full Bulletin <ArrowRight size={14} />
                                    </button>
                                </div>
                            </article>
                        ))}

                        {filtered.length === 0 && (
                            <div className="announcements-empty-box">
                                <Bell size={44} />
                                <h3>No announcements found</h3>
                                <p>Try clearing your search query or selecting "All Bulletins".</p>
                                <button
                                    type="button"
                                    className="events-primary-button"
                                    onClick={() => {
                                        setSelectedCategory("ALL");
                                        setSearchQuery("");
                                    }}
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* MODAL PREVIEW */}
            {activeAnnouncement && (
                <div className="announcement-modal-backdrop" onClick={() => setActiveAnnouncement(null)}>
                    <div className="announcement-modal-sheet" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="announcement-modal-close"
                            onClick={() => setActiveAnnouncement(null)}
                            aria-label="Close announcement"
                        >
                            <X size={20} />
                        </button>

                        <div className="announcement-modal-header">
                            <span className="announcement-badge-pill">{activeAnnouncement.badge}</span>
                            <h2>{activeAnnouncement.title}</h2>
                            <div className="announcement-modal-meta">
                                <span><Calendar size={14} /> Published: {activeAnnouncement.date}</span>
                                <span><Tag size={14} /> Category: {activeAnnouncement.category}</span>
                            </div>
                        </div>

                        <div className="announcement-modal-body">
                            <p className="announcement-modal-full-text">{activeAnnouncement.content}</p>

                            <h4>Key Takeaways &amp; Next Steps:</h4>
                            <ul className="announcement-modal-bullets">
                                {activeAnnouncement.keyPoints.map((point, idx) => (
                                    <li key={idx}>
                                        <CheckCircle2 size={16} className="bullet-check" />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="announcement-modal-actions">
                                {activeAnnouncement.actionTarget && (
                                    <button
                                        type="button"
                                        className="events-primary-button"
                                        onClick={() => {
                                            const target = activeAnnouncement.actionTarget!;
                                            setActiveAnnouncement(null);
                                            onNavigate?.(target);
                                        }}
                                    >
                                        {activeAnnouncement.actionLabel || "Proceed"} <ArrowRight size={15} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="events-secondary-button"
                                    onClick={() => {
                                        setActiveAnnouncement(null);
                                        onNavigate?.("contact");
                                    }}
                                >
                                    Inquire With Church Staff
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CTA */}
            <section className="announcements-cta">
                <div className="announcements-container">
                    <div className="announcements-cta-card">
                        <span className="announcements-section-label">NEVER MISS A BLESSING</span>
                        <h2>Have Questions About a Church Announcement?</h2>
                        <p>
                            Our pastoral office and ministry coordinators are here to assist with event registrations,
                            discipleship enrollment, giving records, or prayer requests.
                        </p>
                        <div className="events-hero-actions">
                            <button
                                type="button"
                                className="events-primary-button"
                                onClick={() => onNavigate?.("contact")}
                            >
                                Contact Church Office <ArrowRight size={16} />
                            </button>
                            <button
                                type="button"
                                className="events-secondary-button"
                                onClick={() => onNavigate?.("events")}
                            >
                                View Church Events
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AnnouncementsPage;
