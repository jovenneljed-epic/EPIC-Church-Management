
import React from "react";
import "./EventsPage.css";

interface EventsPageProps {
    onNavigate?: (page: string) => void;
}

const EventsPage: React.FC<EventsPageProps> = ({
    onNavigate,
}) => {
    const handleNavigate = (page: string) => {
        if (onNavigate) {
            onNavigate(page);
        }
    };

    return (
        <div className="epic-public-events">

            {/* =====================================================
                HERO
            ===================================================== */}

            <section className="events-hero">
                <div className="events-hero-overlay" />

                <div className="events-hero-content">

                    <span className="events-eyebrow">
                        EPIC COMMUNITY
                    </span>

                    <h1>
                        Connect.
                        <span>Grow. Serve.</span>
                    </h1>

                    <p>
                        Discover upcoming church events,
                        gatherings, programs, and opportunities
                        to connect with the EPIC community.
                    </p>

                    <div className="events-hero-actions">

                        <button
                            type="button"
                            className="events-primary-button"
                            onClick={() =>
                                handleNavigate("contact")
                            }
                        >
                            Get Connected
                            <span>→</span>
                        </button>

                        <button
                            type="button"
                            className="events-secondary-button"
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
                INTRO
            ===================================================== */}

            <section className="events-introduction">

                <div className="events-section-container">

                    <div className="events-section-heading">

                        <span className="events-section-label">
                            WHAT'S HAPPENING
                        </span>

                        <h2>
                            Life Is Better
                            <span> Together</span>
                        </h2>

                        <p>
                            Church is more than a Sunday gathering.
                            Throughout the year, we create opportunities
                            for worship, fellowship, discipleship,
                            service, and community.
                        </p>

                    </div>

                    <div className="events-feature-grid">

                        <article className="events-feature-card">

                            <div className="events-feature-icon">
                                ⛪
                            </div>

                            <h3>
                                Worship Gatherings
                            </h3>

                            <p>
                                Come together to worship God,
                                hear His Word, and experience
                                His presence.
                            </p>

                        </article>

                        <article className="events-feature-card">

                            <div className="events-feature-icon">
                                👥
                            </div>

                            <h3>
                                Community Events
                            </h3>

                            <p>
                                Build meaningful relationships
                                through fellowship, celebrations,
                                and church activities.
                            </p>

                        </article>

                        <article className="events-feature-card">

                            <div className="events-feature-icon">
                                📚
                            </div>

                            <h3>
                                Growth Opportunities
                            </h3>

                            <p>
                                Develop your faith and leadership
                                through discipleship, training,
                                seminars, and learning events.
                            </p>

                        </article>

                    </div>

                </div>

            </section>

            {/* =====================================================
                UPCOMING EVENTS
            ===================================================== */}

            <section className="events-upcoming">

                <div className="events-section-container">

                    <div className="events-section-heading">

                        <span className="events-section-label">
                            UPCOMING
                        </span>

                        <h2>
                            Upcoming Events
                        </h2>

                        <p>
                            Stay connected with what is happening
                            in the EPIC community.
                        </p>

                    </div>

                    <div className="events-list">

                        {/* EVENT 1 */}

                        <article className="event-card">

                            <div className="event-date">

                                <span className="event-month">
                                    AUG
                                </span>

                                <strong>
                                    30
                                </strong>

                                <span className="event-day">
                                    SUN
                                </span>

                            </div>

                            <div className="event-content">

                                <span className="event-category">
                                    WORSHIP
                                </span>

                                <h3>
                                    Sunday Worship Celebration
                                </h3>

                                <p>
                                    Join us for a powerful time
                                    of worship, fellowship, and
                                    God's Word.
                                </p>

                                <div className="event-meta">

                                    <span>
                                        🕘 9:00 AM
                                    </span>

                                    <span>
                                        📍 EPIC Church
                                    </span>

                                </div>

                            </div>

                            <button
                                type="button"
                                className="event-view-button"
                                onClick={() =>
                                    handleNavigate("contact")
                                }
                            >
                                Learn More
                                <span>→</span>
                            </button>

                        </article>

                        {/* EVENT 2 */}

                        <article className="event-card">

                            <div className="event-date">

                                <span className="event-month">
                                    SEP
                                </span>

                                <strong>
                                    06
                                </strong>

                                <span className="event-day">
                                    SUN
                                </span>

                            </div>

                            <div className="event-content">

                                <span className="event-category">
                                    DISCIPLESHIP
                                </span>

                                <h3>
                                    Discipleship & Bible Study
                                </h3>

                                <p>
                                    Grow deeper in God's Word
                                    and strengthen your relationship
                                    with Christ.
                                </p>

                                <div className="event-meta">

                                    <span>
                                        🕘 2:00 PM
                                    </span>

                                    <span>
                                        📍 Church Fellowship Hall
                                    </span>

                                </div>

                            </div>

                            <button
                                type="button"
                                className="event-view-button"
                                onClick={() =>
                                    handleNavigate("contact")
                                }
                            >
                                Learn More
                                <span>→</span>
                            </button>

                        </article>

                        {/* EVENT 3 */}

                        <article className="event-card">

                            <div className="event-date">

                                <span className="event-month">
                                    SEP
                                </span>

                                <strong>
                                    13
                                </strong>

                                <span className="event-day">
                                    SUN
                                </span>

                            </div>

                            <div className="event-content">

                                <span className="event-category">
                                    COMMUNITY
                                </span>

                                <h3>
                                    Family Fellowship Day
                                </h3>

                                <p>
                                    Spend time with church families
                                    through fellowship, games,
                                    food, and meaningful conversations.
                                </p>

                                <div className="event-meta">

                                    <span>
                                        🕘 10:00 AM
                                    </span>

                                    <span>
                                        📍 Church Grounds
                                    </span>

                                </div>

                            </div>

                            <button
                                type="button"
                                className="event-view-button"
                                onClick={() =>
                                    handleNavigate("contact")
                                }
                            >
                                Learn More
                                <span>→</span>
                            </button>

                        </article>

                    </div>

                </div>

            </section>

            {/* =====================================================
                EVENT CATEGORIES
            ===================================================== */}

            <section className="events-categories">

                <div className="events-section-container">

                    <div className="events-section-heading">

                        <span className="events-section-label">
                            FIND YOUR PLACE
                        </span>

                        <h2>
                            Something for Everyone
                        </h2>

                        <p>
                            Find an event that helps you connect,
                            grow, and serve.
                        </p>

                    </div>

                    <div className="events-category-grid">

                        <button
                            type="button"
                            className="events-category-card"
                            onClick={() =>
                                handleNavigate("ministries")
                            }
                        >
                            <span>
                                ⛪
                            </span>

                            <strong>
                                Worship
                            </strong>

                            <small>
                                Worship gatherings and celebrations
                            </small>

                            <em>
                                Explore →
                            </em>
                        </button>

                        <button
                            type="button"
                            className="events-category-card"
                            onClick={() =>
                                handleNavigate("ministries")
                            }
                        >
                            <span>
                                📖
                            </span>

                            <strong>
                                Discipleship
                            </strong>

                            <small>
                                Bible studies and spiritual growth
                            </small>

                            <em>
                                Explore →
                            </em>
                        </button>

                        <button
                            type="button"
                            className="events-category-card"
                            onClick={() =>
                                handleNavigate("ministries")
                            }
                        >
                            <span>
                                👨‍👩‍👧‍👦
                            </span>

                            <strong>
                                Family
                            </strong>

                            <small>
                                Activities for families and children
                            </small>

                            <em>
                                Explore →
                            </em>
                        </button>

                        <button
                            type="button"
                            className="events-category-card"
                            onClick={() =>
                                handleNavigate("ministries")
                            }
                        >
                            <span>
                                🙌
                            </span>

                            <strong>
                                Service
                            </strong>

                            <small>
                                Opportunities to serve others
                            </small>

                            <em>
                                Explore →
                            </em>
                        </button>

                    </div>

                </div>

            </section>

            {/* =====================================================
                CTA
            ===================================================== */}

            <section className="events-cta">

                <div className="events-cta-overlay" />

                <div className="events-cta-content">

                    <span className="events-section-label">
                        DON'T MISS OUT
                    </span>

                    <h2>
                        There's Always
                        <span> Something Happening</span>
                    </h2>

                    <p>
                        Stay connected, invite your family and
                        friends, and be part of what God is doing
                        through the EPIC community.
                    </p>

                    <div className="events-cta-actions">

                        <button
                            type="button"
                            className="events-primary-button"
                            onClick={() =>
                                handleNavigate("contact")
                            }
                        >
                            Contact Us
                            <span>→</span>
                        </button>

                        <button
                            type="button"
                            className="events-secondary-button"
                            onClick={() =>
                                handleNavigate("about")
                            }
                        >
                            Learn About EPIC
                        </button>

                    </div>

                </div>

            </section>

        </div>
    );
};

export default EventsPage;

