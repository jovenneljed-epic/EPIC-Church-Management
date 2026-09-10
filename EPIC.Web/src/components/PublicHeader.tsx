import React, { useCallback, useState } from "react";
import "./PublicHeader.css";

interface PublicHeaderProps {
    onNavigate?: (page: string) => void;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({
    onNavigate,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);

    const navigateTo = useCallback(
        (page: string) => {
            setMenuOpen(false);
            onNavigate?.(page);
        },
        [onNavigate]
    );

    return (
        <header className="epic-public-navbar">
            <div className="epic-public-nav-inner">

                {/* LOGO */}
                <button
                    type="button"
                    className="epic-public-logo"
                    onClick={() => navigateTo("home")}
                    aria-label="Go to EPIC Church home"
                >
                    <span className="epic-public-logo-mark">
                        EPIC
                    </span>

                    <span className="epic-public-logo-text">
                        <strong>EPIC CHURCH</strong>
                        <small>
                            Engaging People Into Christ
                        </small>
                    </span>
                </button>

                {/* DESKTOP / MOBILE NAVIGATION */}
                <nav
                    className={`epic-public-nav-links ${
                        menuOpen ? "open" : ""
                    }`}
                    aria-label="Main navigation"
                >
                    <button
                        type="button"
                        onClick={() => navigateTo("home")}
                    >
                        Home
                    </button>

                    <button
                        type="button"
                        onClick={() => navigateTo("about")}
                    >
                        About
                    </button>

                    <button
                        type="button"
                        onClick={() => navigateTo("ministries")}
                    >
                        Ministries
                    </button>

                    <button
                        type="button"
                        onClick={() => navigateTo("events")}
                    >
                        Events
                    </button>

                    <button
                        type="button"
                        onClick={() => navigateTo("gallery")}
                    >
                        Gallery
                    </button>

                    <button
                        type="button"
                        className="epic-community-nav-btn"
                        onClick={() => navigateTo("community")}
                    >
                        <span className="community-nav-dot"></span>
                        Community
                    </button>

                    <button
                        type="button"
                        onClick={() => navigateTo("announcements")}
                    >
                        Announcements
                    </button>

                    <button
                        type="button"
                        onClick={() => navigateTo("giving")}
                    >
                        Giving
                    </button>

                    <button
                        type="button"
                        onClick={() => navigateTo("epic-system")}
                    >
                        EPIC System
                    </button>

                    <button
                        type="button"
                        onClick={() => navigateTo("learning")}
                    >
                        EPIC Academy
                    </button>

                    <button
                        type="button"
                        onClick={() => navigateTo("contact")}
                    >
                        Contact
                    </button>

                    {/* MOBILE COMMUNITY */}
                    <button
                        type="button"
                        className="epic-mobile-community"
                        onClick={() => navigateTo("community")}
                    >
                        ❤️ EPIC Community
                    </button>

                    {/* MOBILE LOGIN */}
                    <button
                        type="button"
                        className="epic-mobile-login"
                        onClick={() => navigateTo("client-login")}
                    >
                        <span className="epic-login-icon">
                            ↪
                        </span>
                        LOGIN
                    </button>

                    {/* MOBILE CTA */}
                    <button
                        type="button"
                        className="epic-mobile-connect"
                        onClick={() => navigateTo("contact")}
                    >
                        Connect With Us
                    </button>
                </nav>

                {/* DESKTOP ACTIONS */}
                <div className="epic-public-nav-actions">
                    {/* EPIC COMMUNITY TITLE HEADER BUTTON */}
                    <button
                        type="button"
                        className="epic-community-header-pill"
                        onClick={() => navigateTo("community")}
                        title="Enter EPIC Community Fellowship & Prayer Wall"
                    >
                        <span className="community-pill-heart">❤️</span>
                        <span>EPIC COMMUNITY</span>
                    </button>

                    <button
                        type="button"
                        className="epic-client-login-button"
                        onClick={() => navigateTo("client-login")}
                    >
                        <span className="epic-login-icon">
                            ↪
                        </span>
                        LOGIN
                    </button>

                    <button
                        type="button"
                        className="epic-nav-cta"
                        onClick={() => navigateTo("contact")}
                    >
                        Connect
                    </button>

                </div>

                {/* MOBILE MENU */}
                <button
                    type="button"
                    className="epic-mobile-menu"
                    onClick={() =>
                        setMenuOpen((open) => !open)
                    }
                    aria-label={
                        menuOpen
                            ? "Close navigation"
                            : "Open navigation"
                    }
                    aria-expanded={menuOpen}
                >
                    {menuOpen ? "✕" : "☰"}
                </button>

            </div>
        </header>
    );
};

export default PublicHeader;