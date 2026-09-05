import "../../../components/business/business.css";

interface DemoPageProps {
    onNavigate?: (page: string) => void;
}

export default function DemoPage({
    onNavigate
}: DemoPageProps) {

    return (
        <div className="business-page">


            <section className="business-hero">

                <div className="business-container">

                    <h1>
                        See EPIC In Action
                    </h1>

                    <p>
                        Schedule a personalized demo and
                        discover how EPIC can help your
                        ministry grow.
                    </p>


                </div>

            </section>



            <section className="business-section">

                <div className="business-container">

                    <div className="business-card">

                        <h2>
                            Request Your Demo
                        </h2>


                        <form>

                            <input
                                type="text"
                                placeholder="Church Name"
                            />


                            <input
                                type="text"
                                placeholder="Your Name"
                            />


                            <input
                                type="email"
                                placeholder="Email Address"
                            />


                            <input
                                type="tel"
                                placeholder="Phone Number"
                            />


                            <textarea
                                placeholder="Tell us about your ministry"
                            />


                            <button
                                type="submit"
                            >
                                Submit Request
                            </button>


                        </form>

                    </div>


                </div>

            </section>



            <section className="business-section light">

                <div className="business-container">

                    <h2>
                        What You Will See
                    </h2>


                    <div className="business-grid">


                        <div className="business-card">

                            <h3>
                                Church Management
                            </h3>

                            <p>
                                Members, attendance,
                                giving, and reports.
                            </p>

                        </div>



                        <div className="business-card">

                            <h3>
                                EPIC Academy
                            </h3>

                            <p>
                                Courses, lessons,
                                and certificates.
                            </p>

                        </div>



                        <div className="business-card">

                            <h3>
                                Digital Resources
                            </h3>

                            <p>
                                Ebooks, templates,
                                and ministry tools.
                            </p>

                        </div>


                    </div>


                </div>


            </section>



            <section className="business-cta">

                <div className="business-container">

                    <h2>
                        Ready to transform your ministry?
                    </h2>


                    <button
                        onClick={() =>
                            onNavigate?.("pricing")
                        }
                    >
                        View Plans
                    </button>


                </div>

            </section>


        </div>
    );
}