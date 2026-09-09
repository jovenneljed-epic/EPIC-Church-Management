import React, { useEffect, useState } from "react";
import PublicHeader from "../components/PublicHeader";
import { Sparkles, Check, ArrowRight, ShieldCheck, Building2, User, Mail, Phone, Users } from "lucide-react";
import "./OptInPage.css";

interface OptInPageProps {
    onNavigate?: (page: string) => void;
}

const OptInPage: React.FC<OptInPageProps> = ({ onNavigate }) => {
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        churchName: "",
        phone: "",
        churchSize: "",
    });

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    const handleChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = event.target;
        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const goToOffer = () => {
        if (onNavigate) {
            onNavigate("offer");
        } else {
            window.location.href = "/offer";
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitted(true);
        setTimeout(() => {
            goToOffer();
        }, 700);
    };

    return (
        <div className="epic-optin-page">
            <PublicHeader onNavigate={onNavigate} />

            <main className="optin-main-container">
                <div className="optin-columns-grid">
                    {/* LEFT CONTENT */}
                    <div className="optin-info-col">
                        <div className="optin-eyebrow">
                            <Sparkles size={15} />
                            <span>SPECIAL LAUNCH PERKS &bull; 30-DAY FREE ACCESS</span>
                        </div>

                        <h1>
                            Experience the Future of <span>Church Operations &amp; Growth</span>
                        </h1>

                        <p className="optin-subtitle">
                            Tell us a little about your church and unlock special perks, zero setup fees, and customized digital discipleship modules built for Philippine ministries.
                        </p>

                        <div className="optin-benefits-list">
                            <div className="optin-benefit-item">
                                <div className="benefit-check-box">
                                    <Check size={16} />
                                </div>
                                <div>
                                    <strong>All-in-One Church Cloud Management</strong>
                                    <p>Members, Sunday services, attendance desk, visitors, and giving records in one private dashboard.</p>
                                </div>
                            </div>

                            <div className="optin-benefit-item">
                                <div className="benefit-check-box">
                                    <Check size={16} />
                                </div>
                                <div>
                                    <strong>Integrated Discipleship Academy</strong>
                                    <p>Equip members with biblical discipleship tracks, video masterclasses, and certified completion badges.</p>
                                </div>
                            </div>

                            <div className="optin-benefit-item">
                                <div className="benefit-check-box">
                                    <Check size={16} />
                                </div>
                                <div>
                                    <strong>Free Onboarding Consultation</strong>
                                    <p>Personalized step-by-step assistance from our team to migrate your rosters and setup your portal.</p>
                                </div>
                            </div>
                        </div>

                        <div className="optin-guarantee-note">
                            <ShieldCheck size={18} className="shield-icon" />
                            <span>Zero obligation &bull; No credit card required &bull; 100% Confidential</span>
                        </div>
                    </div>

                    {/* RIGHT FORM CARD */}
                    <div className="optin-form-col">
                        <div className="optin-card">
                            <div className="optin-card-header">
                                <h2>Claim Your Launch Offer</h2>
                                <p>Fill in your details below to view tailored plans and get immediate trial access.</p>
                            </div>

                            {submitted ? (
                                <div className="optin-success-box">
                                    <div className="success-check-circle">
                                        <Check size={28} />
                                    </div>
                                    <h3>Information Received!</h3>
                                    <p>Preparing your customized church launch package and redirecting you to plans...</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="optin-form">
                                    <div className="form-group">
                                        <label htmlFor="churchName">
                                            <Building2 size={16} />
                                            <span>Church / Ministry Name *</span>
                                        </label>
                                        <input
                                            id="churchName"
                                            name="churchName"
                                            type="text"
                                            required
                                            placeholder="e.g. Life in Christ Christian Fellowship"
                                            value={formData.churchName}
                                            onChange={handleChange}
                                            className="optin-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="name">
                                            <User size={16} />
                                            <span>Your Name / Pastoral Title *</span>
                                        </label>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            placeholder="e.g. Pastor Ronald Aviguetero"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="optin-input"
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="email">
                                                <Mail size={16} />
                                                <span>Email Address *</span>
                                            </label>
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                placeholder="pastor@church.org"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="optin-input"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="phone">
                                                <Phone size={16} />
                                                <span>Mobile Number *</span>
                                            </label>
                                            <input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                required
                                                placeholder="09956326245"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="optin-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="churchSize">
                                            <Users size={16} />
                                            <span>Approximate Congregation Size *</span>
                                        </label>
                                        <select
                                            id="churchSize"
                                            name="churchSize"
                                            required
                                            value={formData.churchSize}
                                            onChange={handleChange}
                                            className="optin-input"
                                        >
                                            <option value="">Select church size...</option>
                                            <option value="under50">Under 50 members (Church Plant)</option>
                                            <option value="50-150">50 - 150 members (Growing Fellowship)</option>
                                            <option value="150-500">150 - 500 members (Midsize Ministry)</option>
                                            <option value="500-1000">500 - 1,000 members (Active Regional Church)</option>
                                            <option value="1000plus">1,000+ members (Multi-Campus / Network)</option>
                                        </select>
                                    </div>

                                    <button type="submit" className="optin-submit-btn">
                                        <span>View Tailored Plans &amp; Perks</span>
                                        <ArrowRight size={18} />
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <footer className="optin-footer">
                <div className="optin-footer-inner">
                    <span>&copy; 2026 EPIC Church Management Platform &bull; All Rights Reserved</span>
                    <div className="optin-footer-links">
                        <button type="button" onClick={() => onNavigate?.("offer")}>Plans &amp; Pricing</button>
                        <button type="button" onClick={() => onNavigate?.("learning")}>EPIC Academy</button>
                        <button type="button" onClick={() => onNavigate?.("contact")}>Contact Support</button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default OptInPage;
