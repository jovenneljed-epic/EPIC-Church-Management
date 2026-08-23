
import React, { useState } from "react";
import "./GalleryPage.css";

interface GalleryItem {
    id: number;
    title: string;
    category: string;
    description: string;
    icon: string;
}

interface GalleryPageProps {
    onNavigate?: (page: string) => void;
}

const GalleryPage: React.FC<GalleryPageProps> = ({
    onNavigate,
}) => {
    const [activeCategory, setActiveCategory] = useState("ALL");
    const [selectedItem, setSelectedItem] =
        useState<GalleryItem | null>(null);

    const galleryItems: GalleryItem[] = [
        {
            id: 1,
            title: "Sunday Worship",
            category: "WORSHIP",
            description:
                "A time of worship, prayer, fellowship, and hearing God's Word together.",
            icon: "⛪",
        },
        {
            id: 2,
            title: "Praise & Worship",
            category: "WORSHIP",
            description:
                "Celebrating God's goodness through music, worship, and thanksgiving.",
            icon: "🎵",
        },
        {
            id: 3,
            title: "Bible Teaching",
            category: "DISCIPLESHIP",
            description:
                "Growing together through biblical teaching and practical application of God's Word.",
            icon: "📖",
        },
        {
            id: 4,
            title: "Prayer Gathering",
            category: "PRAYER",
            description:
                "Coming together in prayer and seeking God's direction for our church and community.",
            icon: "🙏",
        },
        {
            id: 5,
            title: "Youth Ministry",
            category: "MINISTRIES",
            description:
                "Helping the next generation discover Christ, build relationships, and grow in faith.",
            icon: "🙌",
        },
        {
            id: 6,
            title: "Children's Ministry",
            category: "MINISTRIES",
            description:
                "Creating a safe and engaging environment where children can learn about Jesus.",
            icon: "🌱",
        },
        {
            id: 7,
            title: "Church Fellowship",
            category: "COMMUNITY",
            description:
                "Building meaningful relationships through fellowship, friendship, and shared experiences.",
            icon: "👥",
        },
        {
            id: 8,
            title: "Community Outreach",
            category: "OUTREACH",
            description:
                "Serving people and demonstrating God's love through practical acts of compassion.",
            icon: "❤️",
        },
        {
            id: 9,
            title: "Leadership Training",
            category: "LEADERSHIP",
            description:
                "Equipping leaders to serve with integrity, humility, excellence, and purpose.",
            icon: "🎯",
        },
        {
            id: 10,
            title: "Special Church Events",
            category: "EVENTS",
            description:
                "Celebrating special moments and creating memories together as a church family.",
            icon: "🎉",
        },
        {
            id: 11,
            title: "Discipleship Community",
            category: "DISCIPLESHIP",
            description:
                "Growing deeper in Christ through intentional relationships and discipleship.",
            icon: "📚",
        },
        {
            id: 12,
            title: "Serving Together",
            category: "OUTREACH",
            description:
                "Using our gifts, time, and resources to serve God and bless others.",
            icon: "🤝",
        },
    ];

    const categories = [
        "ALL",
        "WORSHIP",
        "DISCIPLESHIP",
        "MINISTRIES",
        "COMMUNITY",
        "OUTREACH",
        "PRAYER",
        "EVENTS",
        "LEADERSHIP",
    ];

    const filteredItems =
        activeCategory === "ALL"
            ? galleryItems
            : galleryItems.filter(
                  (item) => item.category === activeCategory
              );

    const handleNavigate = (page: string) => {
        if (onNavigate) {
            onNavigate(page);
        }
    };

    return (
        <div className="epic-public-page epic-public-gallery">

            {/* =====================================================
                HERO
            ===================================================== */}

            <section className="gallery-hero">

                <div className="gallery-hero-overlay" />

                <div className="gallery-hero-content">

                    <span className="gallery-eyebrow">
                        EPIC GALLERY
                    </span>

                    <h1>
                        Moments.
                        <span>People. Purpose.</span>
                    </h1>

                    <p>
                        Take a glimpse into the life of our
                        church community — worshipping together,
                        growing together, serving together, and
                        engaging people into Christ.
                    </p>

                </div>

            </section>

            {/* =====================================================
                INTRO
            ===================================================== */}

            <section className="gallery-intro">

                <div className="gallery-container">

                    <div className="gallery-intro-grid">

                        <div className="gallery-intro-content">

                            <span className="gallery-section-label">
                                LIFE AT EPIC
                            </span>

                            <h2>
                                More Than
                                <span> Moments</span>
                            </h2>

                            <p>
                                Every gathering represents an
                                opportunity to encounter God,
                                connect with people, grow in faith,
                                and discover our purpose.
                            </p>

                            <p>
                                These moments reflect the heart of
                                EPIC — a community committed to
                                following Christ and helping others
                                take their next step in faith.
                            </p>

                        </div>

                        <div className="gallery-intro-card">

                            <div className="gallery-intro-icon">
                                ✦
                            </div>

                            <strong>
                                Engaging People
                            </strong>

                            <p>
                                Creating meaningful opportunities
                                for people to connect, grow,
                                serve, and belong.
                            </p>

                            <div className="gallery-intro-divider" />

                            <strong>
                                Into Christ
                            </strong>

                            <p>
                                Pointing every generation toward
                                Jesus and helping people live out
                                their faith.
                            </p>

                        </div>

                    </div>

                </div>

            </section>

            {/* =====================================================
                CATEGORY FILTER
            ===================================================== */}

            <section className="gallery-filter-section">

                <div className="gallery-container">

                    <div className="gallery-section-heading">

                        <span className="gallery-section-label">
                            EXPLORE
                        </span>

                        <h2>
                            Our Community
                        </h2>

                        <p>
                            Explore different areas of life and
                            ministry at EPIC.
                        </p>

                    </div>

                    <div className="gallery-filters">

                        {categories.map((category) => (

                            <button
                                key={category}
                                type="button"
                                className={
                                    activeCategory === category
                                        ? "gallery-filter active"
                                        : "gallery-filter"
                                }
                                onClick={() =>
                                    setActiveCategory(category)
                                }
                            >
                                {category}
                            </button>

                        ))}

                    </div>

                </div>

            </section>

            {/* =====================================================
                GALLERY GRID
            ===================================================== */}

            <section className="gallery-grid-section">

                <div className="gallery-container">

                    <div className="gallery-grid">

                        {filteredItems.map((item) => (

                            <article
                                key={item.id}
                                className="gallery-card"
                                onClick={() =>
                                    setSelectedItem(item)
                                }
                            >

                                <div className="gallery-card-visual">

                                    <div className="gallery-card-pattern" />

                                    <div className="gallery-card-icon">
                                        {item.icon}
                                    </div>

                                    <span className="gallery-card-category">
                                        {item.category}
                                    </span>

                                </div>

                                <div className="gallery-card-content">

                                    <h3>
                                        {item.title}
                                    </h3>

                                    <p>
                                        {item.description}
                                    </p>

                                    <button
                                        type="button"
                                        className="gallery-view-button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setSelectedItem(item);
                                        }}
                                    >
                                        View Moment
                                        <span>→</span>
                                    </button>

                                </div>

                            </article>

                        ))}

                    </div>

                    {filteredItems.length === 0 && (

                        <div className="gallery-empty">

                            <div className="gallery-empty-icon">
                                ✦
                            </div>

                            <h3>
                                No Gallery Items
                            </h3>

                            <p>
                                There are currently no items in
                                this category.
                            </p>

                        </div>

                    )}

                </div>

            </section>

            {/* =====================================================
                COMMUNITY MESSAGE
            ===================================================== */}

            <section className="gallery-message">

                <div className="gallery-container">

                    <div className="gallery-message-card">

                        <div className="gallery-message-content">

                            <span className="gallery-section-label">
                                OUR STORY
                            </span>

                            <h2>
                                Every Moment Has
                                <span> a Story.</span>
                            </h2>

                            <p>
                                Behind every photograph is a person,
                                a family, a testimony, a prayer,
                                a lesson, or a moment of worship.
                                These are the stories that make
                                our church community special.
                            </p>

                            <button
                                type="button"
                                className="gallery-primary-button"
                                onClick={() =>
                                    handleNavigate("events")
                                }
                            >
                                See Upcoming Events
                                <span>→</span>
                            </button>

                        </div>

                        <div className="gallery-message-mark">

                            <div className="gallery-message-icon">
                                📸
                            </div>

                            <strong>
                                EPIC Community
                            </strong>

                            <span>
                                Growing Together
                            </span>

                        </div>

                    </div>

                </div>

            </section>

            {/* =====================================================
                CTA
            ===================================================== */}

            <section className="gallery-cta">

                <div className="gallery-cta-overlay" />

                <div className="gallery-cta-content">

                    <span className="gallery-section-label">
                        BE PART OF THE STORY
                    </span>

                    <h2>
                        Your Story
                        <span> Matters Too.</span>
                    </h2>

                    <p>
                        Come worship with us, connect with our
                        community, discover a ministry, and take
                        your next step toward Christ.
                    </p>

                    <div className="gallery-cta-actions">

                        <button
                            type="button"
                            className="gallery-primary-button light"
                            onClick={() =>
                                handleNavigate("contact")
                            }
                        >
                            Connect With Us
                            <span>→</span>
                        </button>

                        <button
                            type="button"
                            className="gallery-secondary-button light"
                            onClick={() =>
                                handleNavigate("ministries")
                            }
                        >
                            Explore Ministries
                        </button>

                    </div>

                </div>

            </section>

            {/* =====================================================
                MODAL
            ===================================================== */}

            {selectedItem && (

                <div
                    className="gallery-modal"
                    onClick={() =>
                        setSelectedItem(null)
                    }
                >

                    <div
                        className="gallery-modal-content"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <button
                            type="button"
                            className="gallery-modal-close"
                            aria-label="Close gallery item"
                            onClick={() =>
                                setSelectedItem(null)
                            }
                        >
                            ×
                        </button>

                        <div className="gallery-modal-visual">

                            <div className="gallery-modal-icon">
                                {selectedItem.icon}
                            </div>

                        </div>

                        <div className="gallery-modal-body">

                            <span className="gallery-modal-category">
                                {selectedItem.category}
                            </span>

                            <h2>
                                {selectedItem.title}
                            </h2>

                            <p>
                                {selectedItem.description}
                            </p>

                            <button
                                type="button"
                                className="gallery-primary-button"
                                onClick={() => {
                                    setSelectedItem(null);
                                    handleNavigate("contact");
                                }}
                            >
                                Connect With Us
                                <span>→</span>
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};

export default GalleryPage;

