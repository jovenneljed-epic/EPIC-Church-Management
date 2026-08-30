
import React from "react";
import PublicHeader from "../../components/PublicHeader";
import "./MinistriesPage.css";
import "./PublicUnisonTheme.css";

interface MinistriesPageProps {
    onNavigate?: (page: string) => void;
}

const MinistriesPage: React.FC<MinistriesPageProps> = ({
    onNavigate,
}) => {
    const handleNavigate = (page: string) => {
        if (onNavigate) {
            onNavigate(page);
        }
    };

    return (
        <div className="epic-public-page epic-public-ministries">
            <PublicHeader onNavigate={onNavigate} />

            {/* =====================================================
                HERO
            ===================================================== */}

            <section className="ministries-hero">

                <div className="ministries-hero-overlay" />

                <div className="ministries-hero-content">

                    <span className="ministries-eyebrow">
                        OUR MINISTRIES
                    </span>

                    <h1>
                        Find Your Place.
                        <span>Live Your Purpose.</span>
                    </h1>

                    <p>
                        Discover opportunities to connect,
                        grow, serve, and make a difference
                        through the ministries of EPIC.
                    </p>

                    <div className="ministries-hero-actions">

                        <button
                            type="button"
                            className="ministries-primary-button"
                            onClick={() =>
                                handleNavigate("contact")
                            }
                        >
                            Get Connected
                            <span>→</span>
                        </button>

                        <button
                            type="button"
                            className="ministries-secondary-button"
                            onClick={() =>
                                handleNavigate("events")
                            }
                        >
                            View Events
                        </button>

                    </div>

                </div>

            </section>

            {/* =====================================================
                INTRODUCTION
            ===================================================== */}

            <section className="ministries-introduction">

                <div className="ministries-section-container">

                    <div className="ministries-intro-grid">

                        <div className="ministries-intro-content">

                            <span className="ministries-section-label">
                                SERVE & GROW
                            </span>

                            <h2>
                                There's a Place for
                                <span> Everyone at EPIC</span>
                            </h2>

                            <p>
                                We believe every person has unique
                                gifts, talents, experiences, and
                                purpose. Our ministries create
                                opportunities for people to connect
                                with others, grow spiritually, and
                                use what God has given them to serve.
                            </p>

                            <p>
                                Whether you are a child discovering
                                faith, a young person finding your
                                identity, a parent strengthening your
                                family, or someone looking for a way
                                to serve, there is a place for you
                                in the EPIC community.
                            </p>

                            <p>
                                You don't have to do life alone.
                                Find a ministry, build relationships,
                                and take your next step with Christ.
                            </p>

                        </div>

                        <div className="ministries-intro-card">

                            <div className="ministries-intro-icon">
                                ✦
                            </div>

                            <h3>
                                Connect
                            </h3>

                            <p>
                                Build meaningful relationships
                                with people who will encourage
                                you in your journey.
                            </p>

                            <div className="ministries-intro-divider" />

                            <h3>
                                Grow
                            </h3>

                            <p>
                                Develop your relationship with
                                Christ through God's Word,
                                discipleship, and fellowship.
                            </p>

                            <div className="ministries-intro-divider" />

                            <h3>
                                Serve
                            </h3>

                            <p>
                                Use your gifts and abilities to
                                serve God and make an impact
                                in the lives of others.
                            </p>

                        </div>

                    </div>

                </div>

            </section>

            {/* =====================================================
                MINISTRY LIST
            ===================================================== */}

            <section className="ministries-list">

                <div className="ministries-section-container">

                    <div className="ministries-section-heading">

                        <span className="ministries-section-label">
                            FIND YOUR COMMUNITY
                        </span>

                        <h2>
                            Ministries at EPIC
                        </h2>

                        <p>
                            Explore the different ministry
                            opportunities available for you
                            and your family.
                        </p>

                    </div>

                    <div className="ministries-grid">

                        {/* CHILDREN */}

                        <article className="ministry-card">

                            <div className="ministry-card-icon">
                                👧
                            </div>

                            <span className="ministry-card-label">
                                CHILDREN
                            </span>

                            <h3>
                                Kids Ministry
                            </h3>

                            <p>
                                Helping children discover God's
                                love, learn biblical truths, build
                                friendships, and develop a strong
                                foundation of faith.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    handleNavigate("contact")
                                }
                            >
                                Learn More
                                <span>→</span>
                            </button>

                        </article>

                        {/* YOUTH */}

                        <article className="ministry-card featured">

                            <div className="ministry-card-icon">
                                🔥
                            </div>

                            <span className="ministry-card-label">
                                YOUTH
                            </span>

                            <h3>
                                Youth Ministry
                            </h3>

                            <p>
                                Empowering young people to know
                                Christ, discover their identity,
                                develop leadership, and influence
                                their generation.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    handleNavigate("contact")
                                }
                            >
                                Learn More
                                <span>→</span>
                            </button>

                        </article>

                        {/* YOUNG ADULTS */}

                        <article className="ministry-card">

                            <div className="ministry-card-icon">
                                🌱
                            </div>

                            <span className="ministry-card-label">
                                YOUNG ADULTS
                            </span>

                            <h3>
                                Young Adults
                            </h3>

                            <p>
                                Creating a community where young
                                adults can grow in faith, build
                                healthy relationships, and discover
                                their God-given purpose.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    handleNavigate("contact")
                                }
                            >
                                Learn More
                                <span>→</span>
                            </button>

                        </article>

                        {/* MEN */}

                        <article className="ministry-card">

                            <div className="ministry-card-icon">
                                🛡️
                            </div>

                            <span className="ministry-card-label">
                                MEN
                            </span>

                            <h3>
                                Men's Ministry
                            </h3>

                            <p>
                                Equipping men to become faithful
                                followers of Christ, godly leaders,
                                strong husbands, fathers, mentors,
                                and servants.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    handleNavigate("contact")
                                }
                            >
                                Learn More
                                <span>→</span>
                            </button>

                        </article>

                        {/* WOMEN */}

                        <article className="ministry-card">

                            <div className="ministry-card-icon">
                                🌷
                            </div>

                            <span className="ministry-card-label">
                                WOMEN
                            </span>

                            <h3>
                                Women's Ministry
                            </h3>

                            <p>
                                Encouraging women to grow deeper
                                in Christ, strengthen relationships,
                                support one another, and live with
                                confidence and purpose.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    handleNavigate("contact")
                                }
                            >
                                Learn More
                                <span>→</span>
                            </button>

                        </article>

                        {/* WORSHIP */}

                        <article className="ministry-card">

                            <div className="ministry-card-icon">
                                🎵
                            </div>

                            <span className="ministry-card-label">
                                WORSHIP
                            </span>

                            <h3>
                                Worship Ministry
                            </h3>

                            <p>
                                Leading the church in worship and
                                creating opportunities for people
                                to encounter God through music,
                                prayer, and praise.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    handleNavigate("contact")
                                }
                            >
                                Learn More
                                <span>→</span>
                            </button>

                        </article>

                        {/* PRAYER */}

                        <article className="ministry-card">

                            <div className="ministry-card-icon">
                                🙏
                            </div>

                            <span className="ministry-card-label">
                                PRAYER
                            </span>

                            <h3>
                                Prayer Ministry
                            </h3>

                            <p>
                                Building a culture of prayer by
                                interceding for individuals,
                                families, the church, communities,
                                and God's Kingdom.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    handleNavigate("contact")
                                }
                            >
                                Learn More
                                <span>→</span>
                            </button>

                        </article>

                        {/* OUTREACH */}

                        <article className="ministry-card">

                            <div className="ministry-card-icon">
                                🌎
                            </div>

                            <span className="ministry-card-label">
                                OUTREACH
                            </span>

                            <h3>
                                Community Outreach
                            </h3>

                            <p>
                                Serving people beyond the church
                                through compassion, practical help,
                                evangelism, and community-centered
                                initiatives.
                            </p>

                            <button
                                type="button"
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
                MINISTRY PHILOSOPHY
            ===================================================== */}

            <section className="ministries-philosophy">

                <div className="ministries-section-container">

                    <div className="ministries-philosophy-card">

                        <div className="ministries-philosophy-content">

                            <span className="ministries-section-label">
                                OUR HEART
                            </span>

                            <h2>
                                Ministry Is More Than
                                <span> Filling a Role</span>
                            </h2>

                            <p>
                                Ministry is about people. It is
                                about using what God has placed
                                in your hands to encourage,
                                strengthen, teach, serve, and
                                help others move closer to Christ.
                            </p>

                            <p>
                                You don't need to have everything
                                figured out before you serve.
                                Start where you are, grow along
                                the way, and discover how God
                                can use your life.
                            </p>

                            <button
                                type="button"
                                className="ministries-philosophy-button"
                                onClick={() =>
                                    handleNavigate("contact")
                                }
                            >
                                I Want to Serve
                                <span>→</span>
                            </button>

                        </div>

                        <div className="ministries-philosophy-visual">

                            <div className="ministries-cross">
                                ✝
                            </div>

                            <strong>
                                Serve With Purpose
                            </strong>

                            <span>
                                Love People
                            </span>

                            <span>
                                Follow Christ
                            </span>

                        </div>

                    </div>

                </div>

            </section>

            {/* =====================================================
                SCRIPTURE
            ===================================================== */}

            <section className="ministries-scripture">

                <div className="ministries-scripture-content">

                    <div className="ministries-scripture-mark">
                        “
                    </div>

                    <blockquote>
                        “Each of you should use whatever gift
                        you have received to serve others, as
                        faithful stewards of God's grace in its
                        various forms.”
                    </blockquote>

                    <span>
                        1 Peter 4:10
                    </span>

                </div>

            </section>

            {/* =====================================================
                CTA
            ===================================================== */}

            <section className="ministries-cta">

                <div className="ministries-cta-content">

                    <span className="ministries-section-label">
                        YOUR NEXT STEP
                    </span>

                    <h2>
                        Ready to Find Your Place?
                    </h2>

                    <p>
                        We'd love to help you discover a ministry
                        where you can connect with people, grow
                        in your faith, and serve with purpose.
                    </p>

                    <div className="ministries-cta-actions">

                        <button
                            type="button"
                            className="ministries-primary-button"
                            onClick={() =>
                                handleNavigate("contact")
                            }
                        >
                            Get Connected
                            <span>→</span>
                        </button>

                        <button
                            type="button"
                            className="ministries-secondary-button"
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

export default MinistriesPage;

