
import React from "react";
import "./AnnouncementsPage.css";

interface Announcement {
    id: number;
    category: string;
    date: string;
    title: string;
    description: string;
    icon: string;
    featured?: boolean;
}

interface AnnouncementsPageProps {
    onNavigate?: (page: string) => void;
}

const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({
    onNavigate,
}) => {
    const announcements: Announcement[] = [
        {
            id: 1,
            category: "CHURCH UPDATE",
            date: "August 2026",
            title: "Welcome to EPIC Church",
            description:
                "We are excited to continue growing together as a church community. Stay connected with our latest updates, activities, and opportunities to serve.",
            icon: "📢",
            featured: true,
        },
        {
            id: 2,
            category: "WORSHIP",
            date: "August 2026",
            title: "Join Us for Worship",
            description:
                "Come together with the EPIC family as we worship God, hear His Word, and strengthen our faith through fellowship.",
            icon: "⛪",
        },
        {
            id: 3,
            category: "DISCIPLESHIP",
            date: "August 2026",
            title: "Grow Deeper in Faith",
            description:
                "Take the next step in your spiritual journey through discipleship, biblical learning, and meaningful Christian relationships.",
            icon: "📖",
        },
        {
            id: 4,
            category: "COMMUNITY",
            date: "August 2026",
            title: "Connect With the EPIC Family",
            description:
                "There is always a place for you to connect, build relationships, discover your gifts, and become part of the church community.",
            icon: "🤝",
        },
        {
            id: 5,
            category: "SERVICE",
            date: "August 2026",
            title: "Serve With Us",
            description:
                "Discover opportunities to use your gifts and talents as we serve God, our church, our families, and our community.",
            icon: "🙌",
        },
        {
            id: 6,
            category: "EPIC LEARNING",
            date: "August 2026",
            title: "Keep Growing With EPIC Learning",
            description:
                "Explore biblical lessons and discipleship resources designed to help you grow spiritually and become a stronger follower of Christ.",
            icon: "📚",
        },
    ];

    const handleNavigate = (page: string) => {
        if (onNavigate) {
            onNavigate(page);
        }
    };

    return (
        <div className="epic-public-page epic-public-announcements">

            {/* =====================================================
                HERO
            ===================================================== */}

            <section className="announcements-hero">
                <div className="announcements-hero-overlay" />

                <div className="announcements-hero-content">

                    <span className="announcements-eyebrow">
                        STAY CONNECTED
                    </span>

                    <h1>
                        What's Happening
                        <span> at EPIC</span>
                    </h1>

                    <p>
                        Stay informed about church updates, upcoming
                        activities, opportunities, and everything
                        happening in the EPIC community.
                    </p>

                </div>
            </section>

            {/* =====================================================
                INTRO
            ===================================================== */}

            <section className="announcements-intro">

                <div className="announcements-container">

                    <div className="announcements-intro-grid">

                        <div>

                            <span className="announcements-section-label">
                                LATEST UPDATES
                            </span>

                            <h2>
                                Stay Connected.
                                <span> Stay Informed.</span>
                            </h2>

                            <p>
                                Church life is always moving. This is
                                where you can find important announcements,
                                ministry updates, community news, and
                                opportunities to participate.
                            </p>

                        </div>

                        <div className="announcements-intro-card">

                            <div className="announcements-intro-icon">
                                📢
                            </div>

                            <div>
                                <strong>
                                    Never Miss an Update
                                </strong>

                                <p>
                                    Check this page regularly for the
                                    latest EPIC announcements and
                                    community updates.
                                </p>
                            </div>

                        </div>

                    </div>

                </div>

            </section>

            {/* =====================================================
                ANNOUNCEMENTS
            ===================================================== */}

            <section className="announcements-list-section">

                <div className="announcements-container">

                    <div className="announcements-section-heading">

                        <span className="announcements-section-label">
                            EPIC NEWS
                        </span>

                        <h2>
                            Latest Announcements
                        </h2>

                        <p>
                            Important updates and opportunities
                            for our church family.
                        </p>

                    </div>

                    <div className="announcements-grid">

                        {announcements.map((announcement) => (

                            <article
                                key={announcement.id}
                                className={`announcement-card ${
                                    announcement.featured
                                        ? "featured"
                                        : ""
                                }`}
                            >

                                <div className="announcement-card-top">

                                    <div className="announcement-icon">
                                        {announcement.icon}
                                    </div>

                                    <span className="announcement-category">
                                        {announcement.category}
                                    </span>

                                </div>

                                <div className="announcement-date">
                                    {announcement.date}
                                </div>

                                <h3>
                                    {announcement.title}
                                </h3>

                                <p>
                                    {announcement.description}
                                </p>

                                <button
                                    type="button"
                                    className="announcement-read-more"
                                    onClick={() =>
                                        handleNavigate("contact")
                                    }
                                >
                                    Learn More
                                    <span>→</span>
                                </button>

                            </article>

                        ))}

                    </div>

                </div>

            </section>

            {/* =====================================================
                STAY CONNECTED
            ===================================================== */}

            <section className="announcements-connect">

                <div className="announcements-container">

                    <div className="announcements-connect-card">

                        <div className="announcements-connect-content">

                            <span className="announcements-section-label">
                                BE PART OF THE COMMUNITY
                            </span>

                            <h2>
                                Don't Just Read About It.
                                <span> Be Part of It.</span>
                            </h2>

                            <p>
                                The best way to experience EPIC is to
                                connect with people, attend an event,
                                join a ministry, and grow together.
                            </p>

                            <div className="announcements-actions">

                                <button
                                    type="button"
                                    className="announcements-primary-button"
                                    onClick={() =>
                                        handleNavigate("events")
                                    }
                                >
                                    View Events
                                    <span>→</span>
                                </button>

                                <button
                                    type="button"
                                    className="announcements-secondary-button"
                                    onClick={() =>
                                        handleNavigate("ministries")
                                    }
                                >
                                    Explore Ministries
                                </button>

                            </div>

                        </div>

                        <div className="announcements-connect-mark">

                            <div className="announcements-connect-logo">
                                EPIC
                            </div>

                            <strong>
                                Engaging People
                            </strong>

                            <span>
                                Into Christ
                            </span>

                        </div>

                    </div>

                </div>

            </section>

            {/* =====================================================
                CONTACT CTA
            ===================================================== */}

            <section className="announcements-cta">

                <div className="announcements-cta-overlay" />

                <div className="announcements-cta-content">

                    <span className="announcements-section-label">
                        HAVE QUESTIONS?
                    </span>

                    <h2>
                        We'd Love to Hear From You
                    </h2>

                    <p>
                        If you have questions about an announcement,
                        ministry, event, or anything happening at EPIC,
                        feel free to reach out.
                    </p>

                    <button
                        type="button"
                        className="announcements-cta-button"
                        onClick={() =>
                            handleNavigate("contact")
                        }
                    >
                        Contact Us
                        <span>→</span>
                    </button>

                </div>

            </section>

        </div>
    );
};

export default AnnouncementsPage;

