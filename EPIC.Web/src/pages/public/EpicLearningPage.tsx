import React from "react";
import PublicHeader from "../../components/PublicHeader";
import "./EpicLearningPage.css";
import "./PublicUnisonTheme.css";

interface EpicLearningPageProps {
    onNavigate?: (page: string) => void;
}

const EpicLearningPage: React.FC<EpicLearningPageProps> = ({ onNavigate }) => {
    React.useEffect(() => window.scrollTo(0, 0), []);

    return (
        <div className="epic-learning-public-page">
            <PublicHeader onNavigate={onNavigate} />
            <main>
                <section className="learning-public-hero">
                    <div>
                        <span>EPIC LEARNING</span>
                        <h1>Discipleship <em>Goes Digital.</em></h1>
                        <p>
                            A structured environment for biblical learning, discipleship,
                            lesson progress, and certificates—helping people continue
                            growing in Christ.
                        </p>
                        <button type="button" onClick={() => onNavigate?.("contact")}>
                            Learn More →
                        </button>
                    </div>
                </section>

                <section className="learning-public-content">
                    <div className="learning-public-heading">
                        <span>GROW IN GOD'S WORD</span>
                        <h2>Learn. Grow. <em>Follow Christ.</em></h2>
                        <p>
                            EPIC Learning supports a clear discipleship journey from courses
                            and lessons to progress and completion.
                        </p>
                    </div>

                    <div className="learning-steps">
                        {[
                            ["01", "Courses", "Explore structured biblical and discipleship topics."],
                            ["02", "Lessons", "Move through practical lessons at a clear pace."],
                            ["03", "Progress", "Keep track of learning progress and completed work."],
                            ["04", "Certificate", "Celebrate completed learning milestones."],
                        ].map(([number, title, text]) => (
                            <article key={number}>
                                <strong>{number}</strong>
                                <h3>{title}</h3>
                                <p>{text}</p>
                            </article>
                        ))}
                    </div>

                    <div className="learning-preview">
                        <div className="learning-preview-head">
                            <span>EPIC LEARNING</span>
                            <b>●</b>
                        </div>
                        <div className="learning-course">
                            <div className="course-icon">✦</div>
                            <div>
                                <strong>Foundations of Faith</strong>
                                <small>Biblical Discipleship</small>
                            </div>
                            <b>75%</b>
                        </div>
                        <div className="learning-bar"><span style={{ width: "75%" }} /></div>
                        <div className="learning-course">
                            <div className="course-icon">✝</div>
                            <div>
                                <strong>Knowing Jesus Christ</strong>
                                <small>Christ-Centered Growth</small>
                            </div>
                            <b>50%</b>
                        </div>
                        <div className="learning-bar"><span style={{ width: "50%" }} /></div>
                    </div>
                </section>

                <section className="learning-public-final">
                    <h2>Keep growing in faith.</h2>
                    <p>Connect with EPIC Church and discover the next step in your discipleship journey.</p>
                    <button type="button" onClick={() => onNavigate?.("contact")}>Connect With Us →</button>
                </section>
            </main>
        </div>
    );
};

export default EpicLearningPage;
