
import React from "react";
import "./ThankYouPage.css";

interface ThankYouPageProps {
    onNavigate: (page: string) => void;
}

const ThankYouPage: React.FC<ThankYouPageProps> = ({
    onNavigate,
}) => {
    return (
        <div className="thankyou-page">
            {/* BACKGROUND EFFECTS */}
            <div className="thankyou-glow thankyou-glow-one" />
            <div className="thankyou-glow thankyou-glow-two" />

            <div className="thankyou-container">
                {/* SUCCESS ICON */}
                <div className="thankyou-success-icon">
                    <div className="thankyou-check">
                        ✓
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="thankyou-badge">
                    PAYMENT SUBMITTED
                </div>

                <h1>
                    Welcome to{" "}
                    <span>EPIC!</span>
                </h1>

                <h2>
                    Your journey toward better
                    church management starts here.
                </h2>

                <p className="thankyou-description">
                    Thank you for choosing the EPIC
                    Church Management System.
                    Your payment information has
                    been received and is now ready
                    for verification.
                </p>

                {/* STATUS CARD */}
                <div className="thankyou-status-card">
                    <div className="thankyou-status-icon">
                        ✓
                    </div>

                    <div className="thankyou-status-content">
                        <strong>
                            Payment Received
                        </strong>

                        <span>
                            Our team will verify your
                            payment and activate your
                            EPIC subscription.
                        </span>
                    </div>
                </div>

                {/* WHAT HAPPENS NEXT */}
                <div className="thankyou-next">
                    <div className="thankyou-section-label">
                        WHAT HAPPENS NEXT
                    </div>

                    <div className="thankyou-steps">
                        <div className="thankyou-step">
                            <div className="thankyou-step-number">
                                01
                            </div>

                            <div>
                                <strong>
                                    Payment Verification
                                </strong>

                                <p>
                                    Your submitted
                                    payment will be
                                    reviewed by our
                                    team.
                                </p>
                            </div>
                        </div>

                        <div className="thankyou-step">
                            <div className="thankyou-step-number">
                                02
                            </div>

                            <div>
                                <strong>
                                    Account Activation
                                </strong>

                                <p>
                                    Once verified,
                                    your EPIC account
                                    and subscription
                                    will be activated.
                                </p>
                            </div>
                        </div>

                        <div className="thankyou-step">
                            <div className="thankyou-step-number">
                                03
                            </div>

                            <div>
                                <strong>
                                    Start Managing
                                </strong>

                                <p>
                                    Access your church
                                    management tools
                                    and start using
                                    EPIC.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="thankyou-actions">
                    <button
                        type="button"
                        className="thankyou-primary-button"
                        onClick={() =>
                            onNavigate("home")
                        }
                    >
                        <span>
                            Enter EPIC
                        </span>

                        <span className="thankyou-arrow">
                            →
                        </span>
                    </button>

                    <button
                        type="button"
                        className="thankyou-secondary-button"
                        onClick={() =>
                            onNavigate("landing")
                        }
                    >
                        Return to Website
                    </button>
                </div>

                {/* SUPPORT */}
                <div className="thankyou-support">
                    <span className="thankyou-support-icon">
                        ?
                    </span>

                    <span>
                        Need help? Contact the EPIC
                        team for assistance with
                        your account or payment.
                    </span>
                </div>

                {/* FOOTER */}
                <div className="thankyou-footer">
                    <div className="thankyou-footer-logo">
                        EPIC
                    </div>

                    <div>
                        <strong>
                            EPIC CHURCH MANAGEMENT
                            SYSTEM
                        </strong>

                        <span>
                            Engaging People Into
                            Christ
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThankYouPage;

