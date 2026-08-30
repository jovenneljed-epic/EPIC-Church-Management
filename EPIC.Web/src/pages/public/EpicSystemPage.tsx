import React from "react";
import PublicHeader from "../../components/PublicHeader";
import "./EpicSystemPage.css";
import "./PublicUnisonTheme.css";

interface EpicSystemPageProps {
    onNavigate?: (page: string) => void;
}

const EpicSystemPage: React.FC<EpicSystemPageProps> = ({ onNavigate }) => {
    React.useEffect(() => window.scrollTo(0, 0), []);

    return (
        <div className="epic-system-page">
            <PublicHeader onNavigate={onNavigate} />
            <main>
                <section className="system-hero">
                    <div>
                        <span>EPIC CHURCH TECHNOLOGY</span>
                        <h1>Meet <em>EPIC System.</em></h1>
                        <p>
                            A church management platform designed to help leaders organize
                            ministry information, support church operations, and serve God's
                            people with greater clarity.
                        </p>
                        <button type="button" onClick={() => onNavigate?.("contact")}>
                            Connect With Us →
                        </button>
                    </div>
                </section>

                <section className="system-content">
                    <div className="system-heading">
                        <span>BUILT FOR MINISTRY</span>
                        <h2>Technology that <em>serves the mission.</em></h2>
                        <p>
                            EPIC System brings essential church information together so
                            leaders can spend less time searching for records and more time
                            caring for people.
                        </p>
                    </div>

                    <div className="system-features">
                        {[
                            ["👥", "Members", "Keep church member information organized and accessible."],
                            ["✓", "Attendance", "Record participation and understand church engagement."],
                            ["₱", "Giving", "Maintain organized church giving and financial records."],
                            ["📊", "Reports", "Turn church information into meaningful reports."],
                            ["⛪", "Ministries", "Coordinate ministries, assignments, and activities."],
                            ["🎯", "Events", "Plan programs, teams, and church events in one place."],
                        ].map(([icon, title, text]) => (
                            <article key={title}>
                                <div className="system-icon">{icon}</div>
                                <h3>{title}</h3>
                                <p>{text}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="system-workflow">
                    <div>
                        <span>ONE CONNECTED WORKFLOW</span>
                        <h2>Organize. <em>Understand. Serve.</em></h2>
                        <p>
                            From member records and attendance to giving, ministries, events,
                            and reports, EPIC System provides a clearer view of church
                            operations.
                        </p>
                    </div>
                    <div className="system-window">
                        <div className="system-window-bar">EPIC Church Management System</div>
                        <div className="system-dashboard">
                            <aside>
                                <b>EPIC</b>
                                <span>Dashboard</span>
                                <span>Members</span>
                                <span>Attendance</span>
                                <span>Ministries</span>
                                <span>Giving</span>
                                <span>Reports</span>
                            </aside>
                            <div>
                                <h3>Church Dashboard</h3>
                                <div className="system-stat-row">
                                    <div /><div /><div />
                                </div>
                                <div className="system-chart" />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="system-final">
                    <h2>Ready to learn more about EPIC System?</h2>
                    <button type="button" onClick={() => onNavigate?.("contact")}>
                        Talk With Us →
                    </button>
                </section>
            </main>
        </div>
    );
};

export default EpicSystemPage;
