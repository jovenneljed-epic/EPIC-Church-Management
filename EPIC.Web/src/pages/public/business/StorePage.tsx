import "../../../components/business/business.css";

interface StorePageProps {
    onNavigate?: (page: string) => void;
}

export default function StorePage({
    onNavigate
}: StorePageProps) {

    const products = [
        "Church Leadership Guide",
        "Ministry Growth Workbook",
        "Discipleship Training Manual",
        "Church Administration Templates"
    ];

    return (
        <div className="business-page">

            {/* HERO */}
            <section className="business-hero">

                <div className="business-container">

                    <h1>
                        EPIC Digital Store
                    </h1>

                    <p>
                        Discover ebooks, ministry resources,
                        templates, and digital tools designed
                        to help churches grow.
                    </p>

                    <button
                        onClick={() =>
                            onNavigate?.("demo")
                        }
                    >
                        Explore Resources
                    </button>

                </div>

            </section>


            {/* PRODUCTS */}
            <section className="business-section">

                <div className="business-container">

                    <h2>
                        Featured Resources
                    </h2>


                    <div className="business-grid">

                        {products.map(product => (

                            <div
                                className="business-card"
                                key={product}
                            >

                                <h3>
                                    {product}
                                </h3>

                                <p>
                                    Practical resources
                                    for ministry leaders
                                    and church teams.
                                </p>

                                <button>
                                    View Product
                                </button>

                            </div>

                        ))}

                    </div>

                </div>

            </section>



            {/* DIGITAL PLATFORM */}
            <section className="business-section light">

                <div className="business-container">

                    <h2>
                        Build Your Ministry Library
                    </h2>

                    <p>
                        Access digital materials anytime
                        and equip your team with proven
                        ministry resources.
                    </p>

                </div>

            </section>



            {/* CTA */}
            <section className="business-cta">

                <div className="business-container">

                    <h2>
                        Grow your ministry with EPIC resources.
                    </h2>

                    <button
                        onClick={() =>
                            onNavigate?.("pricing")
                        }
                    >
                        View EPIC Plans
                    </button>

                </div>

            </section>


        </div>
    );
}