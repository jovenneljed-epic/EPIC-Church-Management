import React from "react";
import PublicHeader from "../../components/PublicHeader";
import {
    Church,
    BookOpen,
    Heart,
    HeartHandshake,
    Activity,
    Globe,
    Users,
    Sparkles,
    Target,
    ArrowRight
} from "lucide-react";
import "./AboutPage.css";
import "./PublicUnisonTheme.css";

interface AboutPageProps {
    onNavigate?: (page: string) => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
    const handleNavigate = (page: string) => {
        if (onNavigate) {
            onNavigate(page);
        }
    };

    return (
        <div className="epic-public-about">
            <PublicHeader onNavigate={onNavigate} />

            {/* HERO */}
            <section className="about-hero">
                <div className="about-hero-content">
                    <span className="about-eyebrow">
                        <Church size={14} /> ABOUT EPIC CHURCH
                    </span>

                    <h1>
                        Engaging People <span>Into Christ.</span>
                    </h1>

                    <p>
                        Discover who we are, what we believe, and how we are helping people
                        grow in faith, build meaningful relationships, and serve God's Kingdom
                        through the Luke 4:18 Ministries family.
                    </p>

                    <div className="about-hero-actions">
                        <button
                            type="button"
                            className="about-primary-button"
                            onClick={() => handleNavigate("contact")}
                        >
                            Connect With Us <ArrowRight size={16} />
                        </button>

                        <button
                            type="button"
                            className="about-secondary-button"
                            onClick={() => handleNavigate("ministries")}
                        >
                            <Users size={16} /> Explore Ministries
                        </button>
                    </div>
                </div>
            </section>

            {/* INTRODUCTION */}
            <section className="about-introduction">
                <div className="about-section-container">
                    <div className="about-intro-grid">
                        <div className="about-intro-content">
                            <span className="about-section-label">WHO WE ARE</span>
                            <h2>
                                A Church Focused on <span>People, Faith, and Purpose</span>
                            </h2>

                            <p>
                                EPIC stands for <strong>Engaging People Into Christ</strong>. It
                                represents our desire to create a church environment where people can
                                encounter God, grow in their faith, develop meaningful relationships,
                                and discover their God-given purpose.
                            </p>

                            <p>
                                Rooted in Luke 4:18 Ministries (San Vicente Church), we believe that
                                church is more than a weekly gathering. It is a spiritual family where
                                lives are transformed, families are strengthened, leaders are developed,
                                and people are equipped to make an eternal difference.
                            </p>

                            <p>
                                Through worship, discipleship, fellowship, ministry, and community
                                service, EPIC seeks to help every person take meaningful steps toward Christ.
                            </p>
                        </div>

                        <div className="about-intro-card">
                            <div className="about-intro-icon">
                                <Sparkles size={28} />
                            </div>

                            <h3>Engaging People</h3>
                            <p>
                                Building genuine relationships and creating welcoming opportunities
                                for people to connect with God and one another.
                            </p>

                            <div className="about-intro-divider" />

                            <h3>Into Christ</h3>
                            <p>
                                Helping every generation discover Jesus Christ, grow spiritually,
                                and live out their faith every day.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* MISSION & VISION */}
            <section className="about-mission">
                <div className="about-section-container">
                    <div className="about-section-heading">
                        <span className="about-section-label">OUR DIRECTION</span>
                        <h2>Mission &amp; Vision</h2>
                        <p>
                            Everything we do is shaped by a clear desire to help people know Christ,
                            grow in faith, and make an impact.
                        </p>
                    </div>

                    <div className="about-mission-grid">
                        <article className="about-mission-card">
                            <div className="about-card-number">01</div>
                            <div className="about-card-icon">
                                <Target size={26} />
                            </div>
                            <h3>Our Mission</h3>
                            <p>
                                To engage people into Christ by proclaiming the Gospel, building
                                disciples, strengthening families, developing leaders, and serving
                                our community with love, humility, and compassion.
                            </p>
                        </article>

                        <article className="about-mission-card featured">
                            <div className="about-card-number">02</div>
                            <div className="about-card-icon">
                                <Sparkles size={26} />
                            </div>
                            <h3>Our Vision</h3>
                            <p>
                                To become a Christ-centered, disciple-making church where individuals
                                and families are transformed by God's Word and empowered to impact their
                                communities, workplaces, and future generations.
                            </p>
                        </article>
                    </div>
                </div>
            </section>

            {/* CORE VALUES */}
            <section className="about-values">
                <div className="about-section-container">
                    <div className="about-section-heading">
                        <span className="about-section-label">WHAT GUIDES US</span>
                        <h2>Our Core Values</h2>
                        <p>
                            These biblical principles guide how we live, lead, serve, and build community together.
                        </p>
                    </div>

                    <div className="about-values-grid">
                        <article className="about-value-card">
                            <span className="about-value-icon"><Church size={24} /></span>
                            <h3>Christ-Centered</h3>
                            <p>Jesus Christ is the center of everything we do—our worship, teaching, community, and service.</p>
                        </article>

                        <article className="about-value-card">
                            <span className="about-value-icon"><BookOpen size={24} /></span>
                            <h3>Biblical Truth</h3>
                            <p>We believe God's Word is the ultimate foundation for faith, life, leadership, and discipleship.</p>
                        </article>

                        <article className="about-value-card">
                            <span className="about-value-icon"><Heart size={24} /></span>
                            <h3>People-Focused</h3>
                            <p>We value every person and seek to create a welcoming community where people can belong and grow.</p>
                        </article>

                        <article className="about-value-card">
                            <span className="about-value-icon"><HeartHandshake size={24} /></span>
                            <h3>Servant Leadership</h3>
                            <p>We develop leaders who serve others with humility, integrity, excellence, and compassion.</p>
                        </article>

                        <article className="about-value-card">
                            <span className="about-value-icon"><Activity size={24} /></span>
                            <h3>Spiritual Growth</h3>
                            <p>We encourage people to continually grow deeper in their relationship with God through daily devotion.</p>
                        </article>

                        <article className="about-value-card">
                            <span className="about-value-icon"><Globe size={24} /></span>
                            <h3>Kingdom Impact</h3>
                            <p>We seek opportunities to bring positive, lasting change to families, communities, and future generations.</p>
                        </article>
                    </div>
                </div>
            </section>

            {/* WHAT WE DO */}
            <section className="about-ministries-preview">
                <div className="about-section-container">
                    <div className="about-section-heading">
                        <span className="about-section-label">OUR COMMUNITY</span>
                        <h2>Growing Together</h2>
                        <p>
                            There are many ways to connect, grow, serve, and become part of the EPIC community.
                        </p>
                    </div>

                    <div className="about-community-grid">
                        <article className="about-community-card">
                            <div className="about-community-icon"><Church size={24} /></div>
                            <h3>Worship</h3>
                            <p>Gather together to worship God, hear His Word, and experience His life-changing presence.</p>
                        </article>

                        <article className="about-community-card">
                            <div className="about-community-icon"><BookOpen size={24} /></div>
                            <h3>Discipleship</h3>
                            <p>Grow in biblical understanding and develop a deeper relationship with Christ through EPIC Learning.</p>
                        </article>

                        <article className="about-community-card">
                            <div className="about-community-icon"><Users size={24} /></div>
                            <h3>Fellowship</h3>
                            <p>Build meaningful friendships through cell groups, family activities, and church gatherings.</p>
                        </article>

                        <article className="about-community-card">
                            <div className="about-community-icon"><HeartHandshake size={24} /></div>
                            <h3>Service</h3>
                            <p>Use your gifts, time, and resources to serve God, bless others, and impact the community.</p>
                        </article>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="about-final">
                <div className="about-section-container">
                    <h2>There is a Place for You at EPIC</h2>
                    <p>
                        Whether you are exploring faith, looking for a church home, or seeking
                        to grow deeper in your relationship with Christ, we would love to welcome you.
                    </p>
                    <div className="events-hero-actions">
                        <button
                            type="button"
                            className="about-primary-button"
                            onClick={() => handleNavigate("contact")}
                        >
                            Connect With Us <ArrowRight size={16} />
                        </button>
                        <button
                            type="button"
                            className="about-secondary-button"
                            onClick={() => handleNavigate("events")}
                        >
                            View Church Events
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
