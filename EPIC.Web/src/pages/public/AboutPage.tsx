
import React from "react";
import PublicHeader from "../../components/PublicHeader";
import "./AboutPage.css";
import "./PublicUnisonTheme.css";

interface AboutPageProps {
    onNavigate?: (page: string) => void;
}

const AboutPage: React.FC<AboutPageProps> = ({
    onNavigate,
}) => {
    const handleNavigate = (page: string) => {
        if (onNavigate) {
            onNavigate(page);
        }
    };

    return (
        <div className="epic-public-about">
            <PublicHeader onNavigate={onNavigate} />

            {/* =====================================================
                HERO
            ===================================================== */}

            <section className="about-hero">
                <div className="about-hero-overlay" />

                <div className="about-hero-content">

                    <span className="about-eyebrow">
                        ABOUT EPIC
                    </span>

                    <h1>
                        Engaging People
                        <span> Into Christ</span>
                    </h1>

                    <p>
                        Discover who we are, what we believe,
                        and how we are helping people grow in
                        faith, build meaningful relationships,
                        and serve God's purpose.
                    </p>

                    <div className="about-hero-actions">

                        <button
                            type="button"
                            className="about-primary-button"
                            onClick={() =>
                                handleNavigate("contact")
                            }
                        >
                            Connect With Us
                            <span>→</span>
                        </button>

                        <button
                            type="button"
                            className="about-secondary-button"
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
                INTRODUCTION
            ===================================================== */}

            <section className="about-introduction">

                <div className="about-section-container">

                    <div className="about-intro-grid">

                        <div className="about-intro-content">

                            <span className="about-section-label">
                                WHO WE ARE
                            </span>

                            <h2>
                                A Church Focused on
                                <span> People, Faith, and Purpose</span>
                            </h2>

                            <p>
                                EPIC stands for
                                <strong> Engaging People Into Christ</strong>.
                                It represents our desire to create a
                                church environment where people can
                                encounter God, grow in their faith,
                                develop meaningful relationships, and
                                discover their purpose.
                            </p>

                            <p>
                                We believe that church is more than a
                                place where people gather. It is a
                                community where lives are transformed,
                                families are strengthened, leaders are
                                developed, and people are equipped to
                                make a difference.
                            </p>

                            <p>
                                Through worship, discipleship,
                                fellowship, ministry, and service,
                                EPIC seeks to help every person take
                                meaningful steps toward Christ.
                            </p>

                        </div>

                        <div className="about-intro-card">

                            <div className="about-intro-icon">
                                ✦
                            </div>

                            <h3>
                                Engaging People
                            </h3>

                            <p>
                                Building genuine relationships and
                                creating opportunities for people to
                                connect with God and one another.
                            </p>

                            <div className="about-intro-divider" />

                            <h3>
                                Into Christ
                            </h3>

                            <p>
                                Helping people discover Jesus Christ,
                                grow spiritually, and live out their
                                faith every day.
                            </p>

                        </div>

                    </div>

                </div>

            </section>

            {/* =====================================================
                MISSION & VISION
            ===================================================== */}

            <section className="about-mission">

                <div className="about-section-container">

                    <div className="about-section-heading">

                        <span className="about-section-label">
                            OUR DIRECTION
                        </span>

                        <h2>
                            Mission & Vision
                        </h2>

                        <p>
                            Everything we do is shaped by a clear
                            desire to help people know Christ,
                            grow in faith, and make an impact.
                        </p>

                    </div>

                    <div className="about-mission-grid">

                        <article className="about-mission-card">

                            <div className="about-card-number">
                                01
                            </div>

                            <div className="about-card-icon">
                                🎯
                            </div>

                            <h3>
                                Our Mission
                            </h3>

                            <p>
                                To engage people into Christ by
                                proclaiming the Gospel, building
                                disciples, strengthening families,
                                developing leaders, and serving
                                our community with love and
                                compassion.
                            </p>

                        </article>

                        <article className="about-mission-card featured">

                            <div className="about-card-number">
                                02
                            </div>

                            <div className="about-card-icon">
                                👁
                            </div>

                            <h3>
                                Our Vision
                            </h3>

                            <p>
                                To become a Christ-centered,
                                disciple-making church where
                                individuals and families are
                                transformed by God's Word and
                                empowered to impact their
                                communities and generations.
                            </p>

                        </article>

                    </div>

                </div>

            </section>

            {/* =====================================================
                CORE VALUES
            ===================================================== */}

            <section className="about-values">

                <div className="about-section-container">

                    <div className="about-section-heading">

                        <span className="about-section-label">
                            WHAT GUIDES US
                        </span>

                        <h2>
                            Our Core Values
                        </h2>

                        <p>
                            These values shape how we serve,
                            lead, worship, and relate to people.
                        </p>

                    </div>

                    <div className="about-values-grid">

                        <article className="about-value-card">
                            <span className="about-value-icon">
                                ✝
                            </span>

                            <h3>
                                Christ-Centered
                            </h3>

                            <p>
                                Jesus Christ remains at the
                                center of everything we believe,
                                teach, and do.
                            </p>
                        </article>

                        <article className="about-value-card">
                            <span className="about-value-icon">
                                📖
                            </span>

                            <h3>
                                Biblical
                            </h3>

                            <p>
                                We value God's Word as the
                                foundation for faith, life,
                                leadership, and discipleship.
                            </p>
                        </article>

                        <article className="about-value-card">
                            <span className="about-value-icon">
                                ❤️
                            </span>

                            <h3>
                                People-Focused
                            </h3>

                            <p>
                                We value every person and seek
                                to create a welcoming community
                                where people can belong and grow.
                            </p>
                        </article>

                        <article className="about-value-card">
                            <span className="about-value-icon">
                                🤝
                            </span>

                            <h3>
                                Servant Leadership
                            </h3>

                            <p>
                                We develop leaders who serve
                                others with humility, integrity,
                                excellence, and compassion.
                            </p>
                        </article>

                        <article className="about-value-card">
                            <span className="about-value-icon">
                                🌱
                            </span>

                            <h3>
                                Spiritual Growth
                            </h3>

                            <p>
                                We encourage people to continually
                                grow deeper in their relationship
                                with God.
                            </p>
                        </article>

                        <article className="about-value-card">
                            <span className="about-value-icon">
                                🌎
                            </span>

                            <h3>
                                Kingdom Impact
                            </h3>

                            <p>
                                We seek opportunities to bring
                                positive and lasting change to
                                families, communities, and
                                future generations.
                            </p>
                        </article>

                    </div>

                </div>

            </section>

            {/* =====================================================
                WHAT WE DO
            ===================================================== */}

            <section className="about-ministries-preview">

                <div className="about-section-container">

                    <div className="about-section-heading">

                        <span className="about-section-label">
                            OUR COMMUNITY
                        </span>

                        <h2>
                            Growing Together
                        </h2>

                        <p>
                            There are many ways to connect,
                            grow, serve, and become part of
                            the EPIC community.
                        </p>

                    </div>

                    <div className="about-community-grid">

                        <article className="about-community-card">

                            <div className="about-community-icon">
                                ⛪
                            </div>

                            <h3>
                                Worship
                            </h3>

                            <p>
                                Gather together to worship God,
                                hear His Word, and experience
                                His presence.
                            </p>

                        </article>

                        <article className="about-community-card">

                            <div className="about-community-icon">
                                📚
                            </div>

                            <h3>
                                Discipleship
                            </h3>

                            <p>
                                Grow in biblical understanding
                                and develop a deeper relationship
                                with Christ.
                            </p>

                        </article>

                        <article className="about-community-card">

                            <div className="about-community-icon">
                                👥
                            </div>

                            <h3>
                                Fellowship
                            </h3>

                            <p>
                                Build authentic friendships and
                                strengthen relationships within
                                the church community.
                            </p>

                        </article>

                        <article className="about-community-card">

                            <div className="about-community-icon">
                                🙌
                            </div>

                            <h3>
                                Service
                            </h3>

                            <p>
                                Discover opportunities to use
                                your gifts and serve God by
                                serving others.
                            </p>

                        </article>

                    </div>

                </div>

            </section>

            {/* =====================================================
                EPIC CMS
            ===================================================== */}

            <section className="about-system">

                <div className="about-section-container">

                    <div className="about-system-card">

                        <div className="about-system-content">

                            <span className="about-section-label">
                                POWERED BY TECHNOLOGY
                            </span>

                            <h2>
                                EPIC Church Management System
                            </h2>

                            <p>
                                EPIC is more than a church community.
                                It is also a complete Church Management
                                System designed to help churches organize
                                people, ministries, attendance, events,
                                giving, reports, learning, and administration
                                in one connected platform.
                            </p>

                            <p>
                                Our goal is simple: technology should
                                help churches spend less time managing
                                information and more time engaging people
                                into Christ.
                            </p>

                            <button
                                type="button"
                                className="about-system-button"
                                onClick={() =>
                                    handleNavigate("contact")
                                }
                            >
                                Learn More About EPIC
                                <span>→</span>
                            </button>

                        </div>

                        <div className="about-system-stat">

                            <div className="about-system-logo">
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
                CALL TO ACTION
            ===================================================== */}

            <section className="about-cta">

                <div className="about-cta-content">

                    <span className="about-section-label">
                        BE PART OF THE JOURNEY
                    </span>

                    <h2>
                        There's a Place for You at EPIC
                    </h2>

                    <p>
                        Whether you are looking for a church,
                        searching for community, wanting to grow
                        in your faith, or looking for ways to serve,
                        we would love to connect with you.
                    </p>

                    <div className="about-cta-actions">

                        <button
                            type="button"
                            className="about-primary-button"
                            onClick={() =>
                                handleNavigate("contact")
                            }
                        >
                            Get Connected
                            <span>→</span>
                        </button>

                        <button
                            type="button"
                            className="about-secondary-button"
                            onClick={() =>
                                handleNavigate("events")
                            }
                        >
                            See Upcoming Events
                        </button>

                    </div>

                </div>

            </section>

        </div>
    );
};

export default AboutPage;

