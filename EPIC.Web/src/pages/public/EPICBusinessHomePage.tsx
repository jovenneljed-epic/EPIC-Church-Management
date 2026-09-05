import "../../components/business/business.css";

interface EPICBusinessHomePageProps {
    onNavigate?: (page: string) => void;
}

export default function EPICBusinessHomePage({
    onNavigate
}: EPICBusinessHomePageProps) {

    return (
        <div className="business-page">

            {/* HERO */}
            <section className="business-hero">

                <div className="business-container">

                    <h1>
                        Manage Your Church.
                        <br />
                        Equip Your Leaders.
                        <br />
                        Grow Your Ministry.
                    </h1>

                    <p>
                        EPIC is an all-in-one church management,
                        learning, and ministry growth platform.
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
                            Start Free Trial
                        </button>

                    </div>

                </div>

            </section>


            {/* PLATFORM */}
            <section className="business-section">

                <div className="business-container">

                    <h2>
                        Everything Your Ministry Needs
                    </h2>

                    <div className="business-grid">

                        {[
                            "Member Management",
                            "Attendance Tracking",
                            "Giving Management",
                            "Events & Ministries",
                            "Reports & Analytics",
                            "Church Administration"
                        ].map(item => (

                            <div
                                className="business-card"
                                key={item}
                            >
                                <h3>
                                    {item}
                                </h3>

                                <p>
                                    Powerful tools designed
                                    for modern churches.
                                </p>

                            </div>

                        ))}

                    </div>

                </div>

            </section>



            {/* ACADEMY */}
            <section className="business-section light">

                <div className="business-container">

                    <h2>
                        EPIC Academy
                    </h2>

                    <p>
                        Train pastors, leaders, and teams
                        with online courses, lessons,
                        certificates, and leadership programs.
                    </p>


                    <button
                        onClick={() =>
                            onNavigate?.("academy")
                        }
                    >
                        Explore Academy
                    </button>


                </div>

            </section>




            {/* STORE */}
            <section className="business-section">

                <div className="business-container">

                    <h2>
                        Digital Ministry Store
                    </h2>

                    <p>
                        Sell ebooks, ministry templates,
                        resources, and digital products.
                    </p>


                    <button
                        onClick={() =>
                            onNavigate?.("store")
                        }
                    >
                        Visit Store
                    </button>


                </div>

            </section>




            {/* PRICING */}
            <section className="business-cta">

                <div className="business-container">

                    <h2>
                        Ready to Transform Your Ministry?
                    </h2>


                    <button
                        onClick={() =>
                            onNavigate?.("pricing")
                        }
                    >
                        View Pricing
                    </button>


                </div>

            </section>



        </div>
    );
}