import "../../../components/business/business.css";

interface AcademyPageProps {
    onNavigate?: (page: string) => void;
}

export default function AcademyPage({
    onNavigate
}: AcademyPageProps) {

    const courses = [
        "Church Leadership Essentials",
        "Ministry Administration",
        "Discipleship Training",
        "Digital Ministry Growth"
    ];

    return (
        <div className="business-page">

            <section className="business-hero">
                <div className="business-container">

                    <h1>
                        EPIC Academy
                    </h1>

                    <p>
                        Equip your leaders with practical
                        ministry training, online courses,
                        and certification programs.
                    </p>

                    <button
                        onClick={() =>
                            onNavigate?.("demo")
                        }
                    >
                        Start Learning
                    </button>

                </div>
            </section>


            <section className="business-section">

                <div className="business-container">

                    <h2>
                        Featured Courses
                    </h2>

                    <div className="business-grid">

                        {courses.map(course => (

                            <div
                                className="business-card"
                                key={course}
                            >

                                <h3>
                                    {course}
                                </h3>

                                <p>
                                    Learn practical skills
                                    to strengthen ministry.
                                </p>

                            </div>

                        ))}

                    </div>

                </div>

            </section>


            <section className="business-section light">

                <div className="business-container">

                    <h2>
                        Learn. Grow. Lead.
                    </h2>

                    <p>
                        Track progress, complete lessons,
                        and earn certificates through EPIC
                        Learning.
                    </p>

                </div>

            </section>


            <section className="business-cta">

                <div className="business-container">

                    <h2>
                        Build stronger ministry leaders.
                    </h2>

                    <button
                        onClick={() =>
                            onNavigate?.("business-home")
                        }
                    >
                        Explore EPIC
                    </button>

                </div>

            </section>

        </div>
    );
}