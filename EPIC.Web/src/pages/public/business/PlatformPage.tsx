import "../../../components/business/business.css";

interface PlatformPageProps {
    onNavigate?: (page: string) => void;
}

export default function PlatformPage({
    onNavigate
}: PlatformPageProps) {

    const features = [
        {
            title: "Member Management",
            description:
                "Manage members, families, profiles, and ministry relationships from one central system."
        },
        {
            title: "Attendance Tracking",
            description:
                "Track attendance patterns and understand engagement across your church."
        },
        {
            title: "Church Services",
            description:
                "Organize services, schedules, and ministry activities efficiently."
        },
        {
            title: "Giving & Finance",
            description:
                "Manage donations, income, expenses, and financial reporting."
        },
        {
            title: "Ministry Management",
            description:
                "Coordinate ministries, teams, leaders, and volunteers."
        },
        {
            title: "Reports & Analytics",
            description:
                "Turn church data into meaningful insights for better decisions."
        }
    ];


    return (
        <div className="business-page">


            {/* HERO */}
            <section className="business-hero">

                <div className="business-container">

                    <h1>
                        Complete Church Management Platform
                    </h1>

                    <p>
                        EPIC brings your members, attendance,
                        giving, ministries, and reporting together
                        in one powerful platform.
                    </p>


                    <div className="business-actions">

                        <button
                            onClick={() =>
                                onNavigate?.("demo")
                            }
                        >
                            Request Demo
                        </button>


                        <button
                            className="secondary"
                            onClick={() =>
                                onNavigate?.("pricing")
                            }
                        >
                            View Pricing
                        </button>

                    </div>


                </div>

            </section>



            {/* FEATURES */}
            <section className="business-section">

                <div className="business-container">

                    <h2>
                        Everything Your Church Needs
                    </h2>


                    <div className="business-grid">

                        {features.map(feature => (

                            <div
                                className="business-card"
                                key={feature.title}
                            >

                                <h3>
                                    {feature.title}
                                </h3>

                                <p>
                                    {feature.description}
                                </p>


                            </div>

                        ))}


                    </div>


                </div>

            </section>




            {/* WORKFLOW */}
            <section className="business-section light">

                <div className="business-container">


                    <h2>
                        A Better Ministry Workflow
                    </h2>


                    <div className="business-grid">


                        <div className="business-card">
                            <h3>
                                1. Connect Members
                            </h3>

                            <p>
                                Build organized member profiles
                                and relationships.
                            </p>
                        </div>



                        <div className="business-card">
                            <h3>
                                2. Track Engagement
                            </h3>

                            <p>
                                Monitor attendance,
                                participation, and growth.
                            </p>
                        </div>



                        <div className="business-card">
                            <h3>
                                3. Grow Ministry
                            </h3>

                            <p>
                                Use insights to strengthen
                                your church community.
                            </p>
                        </div>


                    </div>


                </div>


            </section>




            {/* CTA */}
            <section className="business-cta">

                <div className="business-container">

                    <h2>
                        Ready to simplify your church operations?
                    </h2>


                    <button
                        onClick={() =>
                            onNavigate?.("demo")
                        }
                    >
                        Start With EPIC
                    </button>


                </div>


            </section>


        </div>
    );
}