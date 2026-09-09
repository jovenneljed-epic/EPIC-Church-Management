import React, { useState } from "react";
import PublicHeader from "../../components/PublicHeader";
import {
    Camera,
    Heart,
    Users,
    Sparkles,
    Music,
    BookOpen,
    Award,
    ArrowRight,
    Search,
    X,
    QrCode,
    HeartHandshake,
    Calendar
} from "lucide-react";
import "./GalleryPage.css";
import "./PublicUnisonTheme.css";

export interface GalleryMoment {
    id: number;
    title: string;
    category: "WORSHIP" | "TECHNOLOGY" | "YOUTH" | "DISCIPLESHIP" | "OUTREACH" | "FAMILY" | "LEADERSHIP";
    department: string;
    iconType: string;
    description: string;
    fullDetails: string;
    systemConnection: string;
    date: string;
}

interface GalleryPageProps {
    onNavigate?: (page: string) => void;
}

const GALLERY_DATA: GalleryMoment[] = [
    {
        id: 1,
        title: "Sunday Morning Praise & Expository Worship",
        category: "WORSHIP",
        department: "Worship & Arts Ministry",
        iconType: "music",
        description: "Dynamic worship and congregation-wide prayer filling the main sanctuary with praise.",
        fullDetails:
            "Every Sunday, the EPIC Worship Team and instrumentalists lead the church into the presence of God. Our services feature sound expository preaching, corporate prayer, and an atmosphere where hearts encounter Jesus.",
        systemConnection: "Attendance tracked live via EPIC QR check-in stations.",
        date: "Sunday Gatherings"
    },
    {
        id: 2,
        title: "Real-Time Mobile QR Check-In Kiosks",
        category: "TECHNOLOGY",
        department: "Greeters & IT Operations",
        iconType: "qrcode",
        description: "Express scanning for members, first-time visitors, and kids church attendees at sanctuary doors.",
        fullDetails:
            "Equipped with tablet-based QR scanner kiosks, our greeting team greets every arriving member with warmth and speed. Check-ins instantly update the pastoral dashboard to track Sunday service headcounts.",
        systemConnection: "Directly powered by the EPIC Web API QR verification engine.",
        date: "Weekly Services"
    },
    {
        id: 3,
        title: "EPIC Youth Encounter: 'Unstoppable Generation'",
        category: "YOUTH",
        department: "Youth & Campus Ministry",
        iconType: "sparkles",
        description: "High-energy worship, spirit-led breakout huddles, and fellowship for high school & college youth.",
        fullDetails:
            "Our youth encounters provide an encouraging, safe environment where young people discover their true identity in Christ, break free from worldly pressures, and build lifelong Christian friendships.",
        systemConnection: "Session attendance and security managed with CRBreakPass QR passes.",
        date: "Monthly Youth Rally"
    },
    {
        id: 4,
        title: "Discipleship Small Group & Bible Study Circles",
        category: "DISCIPLESHIP",
        department: "Pastoral Care & Mentorship",
        iconType: "book",
        description: "Believers gathering in homes and fellowship rooms for weekly scripture study and prayer.",
        fullDetails:
            "True spiritual growth happens in community. Our discipleship groups use the structured 4-track EPIC Academy curriculum, walking together from new believers to mature spiritual leaders.",
        systemConnection: "Learner progress recorded through the EPIC Academy LMS.",
        date: "Midweek Life Groups"
    },
    {
        id: 5,
        title: "Children's Faith Explorers Sunday School",
        category: "FAMILY",
        department: "Children's Ministry",
        iconType: "heart",
        description: "Joyful, secure bible lessons, action songs, and creative crafts for toddlers to pre-teens.",
        fullDetails:
            "Parents worship with peace of mind knowing their children are receiving sound biblical instruction in a fun, safe, and loving environment tailored to their developmental age.",
        systemConnection: "Secure parent-child QR matching tokens ensure child safety.",
        date: "Every Sunday 9AM & 2PM"
    },
    {
        id: 6,
        title: "Community Medical Aid & Food Relief Mission",
        category: "OUTREACH",
        department: "Community Compassion Team",
        iconType: "handshake",
        description: "Free medical checkups, pediatric care, and grocery food packages for local barangay families.",
        fullDetails:
            "Serving the community as Christ served. Our church volunteers and medical professionals provided essential consultations, free medicines, and food supplies to over 500 neighborhood families.",
        systemConnection: "Volunteer rosters and supply distributions coordinated via EPIC Ministry Rosters.",
        date: "Quarterly Outreach"
    },
    {
        id: 7,
        title: "Water Baptism & Public Confession of Faith",
        category: "WORSHIP",
        department: "Pastoral & Discipleship",
        iconType: "award",
        description: "New believers taking the bold step of obedience through water baptism before the church family.",
        fullDetails:
            "A holy milestone in the Christian walk. Following completion of Foundations of Faith Track 101, candidates publicly profess Christ Jesus as Lord and Savior in our sanctuary courtyard pool.",
        systemConnection: "Baptismal date and digital certificate archived in Member Records.",
        date: "Quarterly Baptism Service"
    },
    {
        id: 8,
        title: "Media, Broadcast & Sound Console Ministry",
        category: "TECHNOLOGY",
        department: "Media & Tech Production",
        iconType: "camera",
        description: "Dedicated production volunteers operating live audio, lighting, and multicam streaming feeds.",
        fullDetails:
            "Our media booth ensures crisp audio, vibrant visuals, and high-definition video broadcasting so that homebound members and overseas families can participate in worship without interruption.",
        systemConnection: "Ministry duty rotations and gear checklists logged in Ministry Evaluations.",
        date: "Every Gathering"
    },
    {
        id: 9,
        title: "Guest Hospitality & Usher Greeting Service",
        category: "FAMILY",
        department: "Ushers & Hospitality",
        iconType: "users",
        description: "Welcoming every person with Christ's warmth, providing seating assistance and order of service.",
        fullDetails:
            "From the parking entrance to the sanctuary seats, our ushering team represents the welcoming heart of EPIC Church, ensuring every visitor feels loved, respected, and welcomed as family.",
        systemConnection: "Usher team attendance and headcounts tracked in EPIC Services module.",
        date: "Weekly Celebrations"
    },
    {
        id: 10,
        title: "Quarterly Leadership Alignment & Vision Summit",
        category: "LEADERSHIP",
        department: "Pastoral Staff & Ministry Heads",
        iconType: "award",
        description: "Pastors, department directors, and cell group facilitators aligning on church mission.",
        fullDetails:
            "Ministry leaders gather each quarter to review department health scores, examine operational rubrics, pray for the congregation, and cast vision for church expansion and disciple-making.",
        systemConnection: "Quarterly department evaluations conducted via EPIC Ministry Rubrics.",
        date: "Quarterly Summit"
    }
];

const GalleryPage: React.FC<GalleryPageProps> = ({ onNavigate }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [activeMoment, setActiveMoment] = useState<GalleryMoment | null>(null);

    const categories = ["ALL", "WORSHIP", "TECHNOLOGY", "YOUTH", "DISCIPLESHIP", "OUTREACH", "FAMILY", "LEADERSHIP"];

    const filteredMoments = GALLERY_DATA.filter((item) => {
        const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
        const matchesSearch =
            searchQuery.trim() === "" ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.department.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    const renderIcon = (type: string) => {
        switch (type) {
            case "music":
                return <Music size={24} />;
            case "qrcode":
                return <QrCode size={24} />;
            case "sparkles":
                return <Sparkles size={24} />;
            case "book":
                return <BookOpen size={24} />;
            case "heart":
                return <Heart size={24} />;
            case "handshake":
                return <HeartHandshake size={24} />;
            case "award":
                return <Award size={24} />;
            case "camera":
                return <Camera size={24} />;
            case "users":
                return <Users size={24} />;
            default:
                return <Camera size={24} />;
        }
    };

    return (
        <div className="epic-public-gallery">
            <PublicHeader onNavigate={onNavigate} />

            {/* HERO */}
            <section className="gallery-hero">
                <div className="gallery-hero-content">
                    <span className="gallery-eyebrow">
                        <Camera size={14} /> CHURCH LIFE &amp; MINISTRY MOMENTS
                    </span>
                    <h1>
                        Moments. People. <span>Living Purpose.</span>
                    </h1>
                    <p>
                        Take a look into the vibrant life of EPIC Church. From uplifting Sunday worship
                        and mobile QR check-in kiosks to youth camps, discipleship groups, and community outreach.
                    </p>
                    <div className="events-hero-actions">
                        <button
                            type="button"
                            className="events-primary-button"
                            onClick={() => {
                                const el = document.getElementById("gallery-grid-anchor");
                                el?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            Explore Moments <ArrowRight size={16} />
                        </button>
                        <button
                            type="button"
                            className="events-secondary-button"
                            onClick={() => onNavigate?.("events")}
                        >
                            <Calendar size={16} /> Upcoming Events
                        </button>
                    </div>
                </div>
            </section>

            {/* MAIN GALLERY SECTION */}
            <section className="gallery-main-section" id="gallery-grid-anchor">
                <div className="gallery-container">
                    {/* CONTROLS */}
                    <div className="gallery-controls-bar">
                        <div className="gallery-filter-pills">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    className={`gallery-pill ${selectedCategory === cat ? "active" : ""}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat === "ALL" ? "All Moments" : cat}
                                </button>
                            ))}
                        </div>

                        <div className="gallery-search-input">
                            <Search size={16} className="gallery-search-icon" />
                            <input
                                type="text"
                                placeholder="Search moments or ministries..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="gallery-clear-search"
                                    onClick={() => setSearchQuery("")}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* GALLERY GRID */}
                    <div className="gallery-cards-grid">
                        {filteredMoments.map((moment) => (
                            <article
                                key={moment.id}
                                className="gallery-item-card"
                                onClick={() => setActiveMoment(moment)}
                            >
                                <div className="gallery-card-banner">
                                    <div className="gallery-card-icon-bubble">
                                        {renderIcon(moment.iconType)}
                                    </div>
                                    <span className="gallery-card-category-tag">{moment.category}</span>
                                </div>

                                <div className="gallery-card-body">
                                    <span className="gallery-card-dept">{moment.department}</span>
                                    <h3>{moment.title}</h3>
                                    <p>{moment.description}</p>

                                    <div className="gallery-card-footer">
                                        <span className="gallery-card-date">
                                            <Calendar size={12} /> {moment.date}
                                        </span>
                                        <button
                                            type="button"
                                            className="gallery-view-details-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMoment(moment);
                                            }}
                                        >
                                            View Story <ArrowRight size={13} />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}

                        {filteredMoments.length === 0 && (
                            <div className="gallery-empty-box">
                                <Camera size={44} />
                                <h3>No moments match your search</h3>
                                <p>Try clearing your filter or searching for another ministry keyword.</p>
                                <button
                                    type="button"
                                    className="events-primary-button"
                                    onClick={() => {
                                        setSelectedCategory("ALL");
                                        setSearchQuery("");
                                    }}
                                >
                                    View All Moments
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* MODAL PREVIEW */}
            {activeMoment && (
                <div className="gallery-modal-backdrop" onClick={() => setActiveMoment(null)}>
                    <div className="gallery-modal-sheet" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="gallery-modal-close"
                            onClick={() => setActiveMoment(null)}
                            aria-label="Close modal"
                        >
                            <X size={20} />
                        </button>

                        <div className="gallery-modal-header">
                            <div className="gallery-modal-icon-badge">
                                {renderIcon(activeMoment.iconType)}
                            </div>
                            <div>
                                <span className="gallery-card-category-tag">{activeMoment.category}</span>
                                <h2>{activeMoment.title}</h2>
                                <span className="gallery-modal-dept">{activeMoment.department} • {activeMoment.date}</span>
                            </div>
                        </div>

                        <div className="gallery-modal-content">
                            <p className="gallery-modal-full-text">{activeMoment.fullDetails}</p>

                            <div className="gallery-modal-system-box">
                                <QrCode size={20} className="system-box-icon" />
                                <div>
                                    <strong>EPIC Church Management System Integration:</strong>
                                    <p>{activeMoment.systemConnection}</p>
                                </div>
                            </div>

                            <div className="gallery-modal-actions">
                                <button
                                    type="button"
                                    className="events-primary-button"
                                    onClick={() => {
                                        setActiveMoment(null);
                                        onNavigate?.("events");
                                    }}
                                >
                                    View Related Events
                                </button>
                                <button
                                    type="button"
                                    className="events-secondary-button"
                                    onClick={() => {
                                        setActiveMoment(null);
                                        onNavigate?.("contact");
                                    }}
                                >
                                    Connect With This Ministry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CTA */}
            <section className="gallery-cta">
                <div className="gallery-container">
                    <div className="gallery-cta-card">
                        <span className="gallery-section-label">YOUR STORY MATTERS</span>
                        <h2>Be Part of What God Is Doing at EPIC</h2>
                        <p>
                            Every smile, volunteer, and testimony represents a life transformed by the Gospel.
                            We would love to welcome you to our church family this Sunday.
                        </p>
                        <div className="events-hero-actions">
                            <button
                                type="button"
                                className="events-primary-button"
                                onClick={() => onNavigate?.("contact")}
                            >
                                Plan Your Sunday Visit <ArrowRight size={16} />
                            </button>
                            <button
                                type="button"
                                className="events-secondary-button"
                                onClick={() => onNavigate?.("about")}
                            >
                                Learn About Our Mission
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default GalleryPage;
