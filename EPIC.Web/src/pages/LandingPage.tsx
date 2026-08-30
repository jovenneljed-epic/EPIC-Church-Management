import React from "react";
import { ArrowRight, BookOpen, Church, HeartHandshake, LockKeyhole, Sparkles, Users, Workflow } from "lucide-react";
import PublicHeader from "../components/PublicHeader";
import "./HomePage.css";
import { initializeWebsiteAnalytics } from "../analytics/websiteAnalytics";

interface LandingPageProps {
    onLogin: () => void;
    onNavigate?: (page: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onNavigate }) => {
    React.useEffect(() => {
        try {
            initializeWebsiteAnalytics();
        } catch (error) {
            console.error("EPIC website analytics initialization failed:", error);
        }
        window.scrollTo(0, 0);
    }, []);

    const navigate = (page: string) => onNavigate?.(page);

    return (
        <div className="epic-home-page">
            <div className="epic-home-grid" aria-hidden="true" />
            <div className="epic-home-glow epic-home-glow-one" aria-hidden="true" />
            <div className="epic-home-glow epic-home-glow-two" aria-hidden="true" />
            <PublicHeader onNavigate={onNavigate} />

            <main>
                <section className="epic-home-hero">
                    <div className="epic-home-container epic-home-hero-layout">
                        <div className="epic-home-hero-content">
                            <span className="epic-home-badge">
                                <span className="epic-home-pulse" />
                                ENGAGING PEOPLE INTO CHRIST
                            </span>

                            <h1>
                                A Church Built For
                                <span>Faith, Purpose &amp; Mission.</span>
                            </h1>

                            <p className="epic-home-hero-description">
                                Welcome to EPIC Church — a Christ-centered community committed
                                to reaching people, building disciples, strengthening families,
                                and serving God's people with excellence.
                            </p>

                            <div className="epic-home-actions">
                                <button
                                    type="button"
                                    className="epic-home-primary"
                                    onClick={() => navigate("about")}
                                >
                                    Discover EPIC <ArrowRight size={18} />
                                </button>
                                <button
                                    type="button"
                                    className="epic-home-secondary"
                                    onClick={onLogin}
                                >
                                    <LockKeyhole size={16} />
                                    Member's Login
                                </button>
                            </div>

                            <div className="epic-home-trust-row">
                                <span><Sparkles size={14} /> Christ-centered</span>
                                <span><Users size={14} /> Community</span>
                                <span><BookOpen size={14} /> Discipleship</span>
                            </div>
                        </div>

                        <div className="epic-home-visual" aria-label="EPIC Church overview">
                            <div className="epic-home-visual-glow" />
                            <div className="epic-home-dashboard">
                                <div className="epic-home-dashboard-header">
                                    <div className="epic-home-dashboard-title">
                                        <span className="epic-home-live-dot" />
                                        EPIC CHURCH
                                    </div>
                                    <span className="epic-home-live">ENGAGING PEOPLE INTO CHRIST</span>
                                </div>

                                <div className="epic-home-dashboard-layout">
                                    <aside className="epic-home-dashboard-side">
                                        <span className="epic-home-mini-logo">EPIC</span>
                                        <Church size={17} />
                                        <Users size={17} />
                                        <BookOpen size={17} />
                                        <HeartHandshake size={17} />
                                    </aside>

                                    <div className="epic-home-dashboard-main">
                                        <div className="epic-home-dashboard-welcome">
                                            <div>
                                                <small>WELCOME TO</small>
                                                <h3>EPIC Church</h3>
                                            </div>
                                            <span>FAITH • COMMUNITY • MISSION</span>
                                        </div>

                                        <div className="epic-home-dashboard-cards">
                                            <div>
                                                <span>WORSHIP</span>
                                                <strong>Gather</strong>
                                                <small>Encounter God together</small>
                                            </div>
                                            <div>
                                                <span>DISCIPLESHIP</span>
                                                <strong>Grow</strong>
                                                <small>Build a life of faith</small>
                                            </div>
                                            <div>
                                                <span>MISSION</span>
                                                <strong>Serve</strong>
                                                <small>Make an impact for Christ</small>
                                            </div>
                                        </div>

                                        <div className="epic-home-dashboard-feature">
                                            <div className="epic-home-dashboard-feature-icon"><Workflow size={19} /></div>
                                            <div>
                                                <strong>Ministry + Technology</strong>
                                                <span>Simple tools that help leaders serve people better.</span>
                                            </div>
                                            <ArrowRight size={17} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="epic-home-floating epic-home-floating-one">
                                <Sparkles size={18} />
                                <div><strong>Faith</strong><span>Centered on Christ</span></div>
                            </div>
                            <div className="epic-home-floating epic-home-floating-two">
                                <Users size={18} />
                                <div><strong>Community</strong><span>Growing together</span></div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="epic-home-intro">
                    <div className="epic-home-container">
                        <div className="epic-home-section-heading">
                            <span className="epic-home-eyebrow">WELCOME TO EPIC</span>
                            <h2>More Than A Church.<span>A People On Mission.</span></h2>
                            <p>
                                EPIC Church exists to engage people into Christ — creating a place
                                where people can encounter God, grow in faith, build meaningful
                                relationships, discover purpose, and serve others.
                            </p>
                            <button type="button" className="epic-home-text-link" onClick={() => navigate("about")}>
                                Learn more about EPIC <ArrowRight size={16} />
                            </button>
                        </div>

                        <div className="epic-home-card-grid">
                            <button type="button" onClick={() => navigate("about")}>
                                <span className="epic-home-card-number">01</span>
                                <div className="epic-home-card-icon"><Church size={21} /></div>
                                <strong>ABOUT EPIC</strong>
                                <span>Know our identity, mission, vision, and values.</span>
                                <ArrowRight size={17} />
                            </button>
                            <button type="button" onClick={() => navigate("ministries")}>
                                <span className="epic-home-card-number">02</span>
                                <div className="epic-home-card-icon"><HeartHandshake size={21} /></div>
                                <strong>MINISTRIES</strong>
                                <span>Discover opportunities to worship, serve, and grow.</span>
                                <ArrowRight size={17} />
                            </button>
                            <button type="button" onClick={() => navigate("epic-system")}>
                                <span className="epic-home-card-number">03</span>
                                <div className="epic-home-card-icon"><Workflow size={21} /></div>
                                <strong>EPIC SYSTEM</strong>
                                <span>See how technology supports church ministry and leadership.</span>
                                <ArrowRight size={17} />
                            </button>
                            <button type="button" onClick={() => navigate("learning")}>
                                <span className="epic-home-card-number">04</span>
                                <div className="epic-home-card-icon"><BookOpen size={21} /></div>
                                <strong>EPIC LEARNING</strong>
                                <span>Grow through structured biblical learning and discipleship.</span>
                                <ArrowRight size={17} />
                            </button>
                        </div>
                    </div>
                </section>

                <section className="epic-home-mission">
                    <div className="epic-home-container epic-home-mission-layout">
                        <div>
                            <span className="epic-home-eyebrow">THE EPIC JOURNEY</span>
                            <h2>Gather. <span>Grow.</span> Serve.</h2>
                            <p>
                                Everything we do is designed to help people move closer to Christ,
                                stronger in community, and deeper in their calling to serve.
                            </p>
                        </div>
                        <div className="epic-home-steps">
                            <div><b>01</b><strong>Gather</strong><span>Encounter God through worship and community.</span></div>
                            <div><b>02</b><strong>Grow</strong><span>Build a strong foundation through God's Word and discipleship.</span></div>
                            <div><b>03</b><strong>Serve</strong><span>Use your gifts to bless people and advance the mission.</span></div>
                        </div>
                    </div>
                </section>

                <section className="epic-home-cta">
                    <div className="epic-home-cta-glow" />
                    <div className="epic-home-container epic-home-cta-inner">
                        <span className="epic-home-badge">YOUR PLACE IS HERE</span>
                        <h2>Let's Walk The <span>Journey Together.</span></h2>
                        <p>
                            Come worship with us, grow in God's Word, build meaningful
                            relationships, and become part of the mission.
                        </p>
                        <button type="button" className="epic-home-primary" onClick={() => navigate("contact")}>
                            Connect With Us <ArrowRight size={18} />
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default LandingPage;
