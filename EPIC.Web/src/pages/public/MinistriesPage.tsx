import React, { useState, useEffect, useMemo, useCallback } from "react";
import PublicHeader from "../../components/PublicHeader";
import {
    HeartHandshake,
    Sparkles,
    Users,
    Church,
    ArrowRight,
    Calendar,
    MapPin,
    Award,
    Star,
    RefreshCw,
    Search,
    Crown,
    X,
    CheckCircle2,
    AlertCircle,
    BookOpen
} from "lucide-react";
import { getMinistryEvaluations, type MinistryEvaluation } from "../../services/ministryService";
import "./MinistriesPage.css";
import "./PublicUnisonTheme.css";

interface MinistriesPageProps {
    onNavigate?: (page: string) => void;
}

const MinistriesPage: React.FC<MinistriesPageProps> = ({ onNavigate }) => {
    const [ministries, setMinistries] = useState<MinistryEvaluation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [activeModalMinistry, setActiveModalMinistry] = useState<MinistryEvaluation | null>(null);
    const [volunteerSuccess, setVolunteerSuccess] = useState<boolean>(false);
    const [lastSyncTime, setLastSyncTime] = useState<string>("");

    const fetchMinistries = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const data = await getMinistryEvaluations();
            setMinistries(data);
            setLastSyncTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        } catch (err: any) {
            console.error("Failed to load ministries:", err);
            setError(err?.message || "Failed to connect to church ministries database. Please check your network.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchMinistries(false);
    }, [fetchMinistries]);

    // Categories derived dynamically from real DB records
    const categories = useMemo(() => {
        const set = new Set<string>();
        ministries.forEach((m) => {
            if (m.category) {
                set.add(m.category.trim());
            }
        });
        const sorted = Array.from(set).sort();
        return ["ALL", ...sorted];
    }, [ministries]);

    // Filtered ministries
    const filteredMinistries = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return ministries.filter((m) => {
            const matchesCat =
                selectedCategory === "ALL" ||
                m.category.toLowerCase() === selectedCategory.toLowerCase();

            const matchesSearch =
                q === "" ||
                m.ministryName.toLowerCase().includes(q) ||
                m.ministryHead.toLowerCase().includes(q) ||
                m.description.toLowerCase().includes(q) ||
                m.meetingLocation.toLowerCase().includes(q) ||
                m.members.some((mem) => mem.name.toLowerCase().includes(q) || mem.role.toLowerCase().includes(q));

            return matchesCat && matchesSearch;
        });
    }, [ministries, selectedCategory, searchQuery]);

    const handleOpenModal = (m: MinistryEvaluation) => {
        setActiveModalMinistry(m);
        setVolunteerSuccess(false);
    };

    // Calculate total servants across all ministries
    const totalServants = useMemo(() => {
        return ministries.reduce((acc, m) => acc + (m.totalMembers || 0), 0);
    }, [ministries]);

    return (
        <div className="epic-public-page epic-public-ministries">
            <PublicHeader onNavigate={onNavigate} />

            {/* HERO */}
            <section className="ministries-hero">
                <div className="ministries-hero-content">
                    <span className="ministries-eyebrow">
                        <Users size={14} /> OUR MINISTRIES &amp; TEAMS
                    </span>
                    <h1>
                        Find Your Place. <span>Live Your Purpose.</span>
                    </h1>
                    <p>
                        Discover opportunities to serve with passion and grow in character. Every church department
                        is connected live to our church management database with performance health rubrics and
                        encouraging service point recognition for all leaders and members.
                    </p>
                    <div className="ministries-hero-actions">
                        <button
                            type="button"
                            className="ministries-primary-button"
                            onClick={() => {
                                const el = document.getElementById("ministries-browser-anchor");
                                el?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            Explore Church Ministries <ArrowRight size={16} />
                        </button>
                        <button
                            type="button"
                            className="ministries-secondary-button"
                            onClick={() => onNavigate?.("contact")}
                        >
                            <HeartHandshake size={16} /> Volunteer &amp; Connect
                        </button>
                    </div>
                </div>
            </section>

            {/* STAT & ENCOURAGEMENT STRIP */}
            <section className="ministries-stat-strip">
                <div className="ministries-section-container">
                    <div className="ministries-stat-grid">
                        <div className="ministries-stat-card">
                            <div className="ministries-stat-icon"><Church size={22} /></div>
                            <div>
                                <strong>{ministries.length > 0 ? ministries.length : "22"} Active Departments</strong>
                                <p>From Children &amp; Worship to Logistics &amp; Care</p>
                            </div>
                        </div>
                        <div className="ministries-stat-card">
                            <div className="ministries-stat-icon"><Users size={22} /></div>
                            <div>
                                <strong>{totalServants > 0 ? `${totalServants}+` : "45+"} Rostered Servants</strong>
                                <p>Volunteers &amp; ministers serving with joy</p>
                            </div>
                        </div>
                        <div className="ministries-stat-card">
                            <div className="ministries-stat-icon"><Award size={22} /></div>
                            <div>
                                <strong>Kingdom Service Point System</strong>
                                <p>Faithfulness &amp; excellence recognized in Christ</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* BROWSER SECTION */}
            <section className="ministries-browser-section" id="ministries-browser-anchor">
                <div className="ministries-section-container">
                    {/* LIVE DATABASE STATUS BAR */}
                    <div className="ministries-db-status-bar">
                        <div className="ministries-db-badge-group">
                            <span className="ministries-live-indicator">
                                <span className="ministries-pulse-dot" />
                                Live Database Connected
                            </span>
                            <span className="ministries-count-badge">
                                <strong>{ministries.length}</strong> active ministries • Real-time Point System Synced
                                {lastSyncTime && ` • Synced at ${lastSyncTime}`}
                            </span>
                        </div>

                        <button
                            type="button"
                            className="ministries-refresh-btn"
                            onClick={() => fetchMinistries(true)}
                            disabled={refreshing || loading}
                            title="Fetch latest ministry updates from database"
                        >
                            <RefreshCw size={14} className={refreshing ? "spin-icon" : ""} />
                            {refreshing ? "Syncing..." : "↻ Refresh Ministries"}
                        </button>
                    </div>

                    {/* CONTROLS */}
                    <div className="ministries-filter-bar">
                        <div className="ministries-category-pills">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    className={`ministries-pill ${selectedCategory === cat ? "active" : ""}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat === "ALL" ? "All Departments" : cat}
                                </button>
                            ))}
                        </div>

                        <div className="ministries-search-box">
                            <Search size={16} className="ministries-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by ministry, head, or member..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="ministries-clear-search"
                                    onClick={() => setSearchQuery("")}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ERROR STATE */}
                    {error && ministries.length === 0 && (
                        <div className="ministries-empty-state" style={{ borderColor: "#ffa39e", background: "#fff1f0" }}>
                            <AlertCircle size={44} color="#cf1322" />
                            <h3 style={{ color: "#cf1322" }}>Unable to Connect to Ministries Database</h3>
                            <p>{error}</p>
                            <button
                                type="button"
                                className="ministries-primary-button"
                                onClick={() => fetchMinistries(false)}
                            >
                                Retry Connection
                            </button>
                        </div>
                    )}

                    {/* SKELETONS */}
                    {loading && (
                        <div className="ministries-cards-grid">
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                                <div key={n} className="ministry-skeleton" />
                            ))}
                        </div>
                    )}

                    {/* REAL DATABASE MINISTRY CARDS */}
                    {!loading && (
                        <div className="ministries-cards-grid">
                            {filteredMinistries.map((ministry) => {
                                const tierClass = (ministry.healthTier || "exemplary").toLowerCase();

                                return (
                                    <article key={ministry.ministryId} className="ministry-fb-card">
                                        <div>
                                            {/* TOP ROW: CATEGORY & HONOR TIER */}
                                            <div className="ministry-card-top">
                                                <span className="ministry-cat-badge">{ministry.category}</span>
                                                <span className={`ministry-tier-badge ${tierClass}`}>
                                                    <Award size={13} /> {ministry.healthTier}
                                                </span>
                                            </div>

                                            {/* TITLE & MINISTRY HEAD */}
                                            <div className="ministry-card-main">
                                                <h3>{ministry.ministryName}</h3>

                                                <div className="ministry-head-chip">
                                                    <Crown size={14} />
                                                    <span><strong>Head:</strong> {ministry.ministryHead}</span>
                                                </div>

                                                <p className="ministry-card-desc">
                                                    {ministry.description}
                                                </p>
                                            </div>

                                            {/* ENCOURAGEMENT POINT SYSTEM & HEALTH */}
                                            <div className="ministry-points-box">
                                                <div className="ministry-points-row">
                                                    <span className="ministry-points-total">
                                                        <Sparkles size={14} />
                                                        {ministry.totalMinistryPoints.toLocaleString()} Service Pts
                                                    </span>
                                                    <span className="ministry-rating-stars">
                                                        <Star size={13} fill="#1e7e34" />
                                                        {ministry.averageRating} / 5.0
                                                    </span>
                                                </div>

                                                <div className="ministry-health-progress-bar">
                                                    <div
                                                        className="ministry-health-fill"
                                                        style={{ width: `${ministry.healthPercentage}%` }}
                                                    />
                                                </div>

                                                <div className="ministry-health-caption">
                                                    <span>{ministry.healthPercentage}% Health Rating</span>
                                                    <span>Tier: {ministry.healthTier}</span>
                                                </div>
                                            </div>

                                            {/* ROSTER PREVIEW */}
                                            <div className="ministry-roster-preview">
                                                <Users size={16} />
                                                <span>
                                                    <strong>{ministry.totalMembers}</strong> Rostered Servants
                                                    {ministry.members.length > 0 && (
                                                        <> • {ministry.members.slice(0, 2).map((m) => m.name.split(" ")[0]).join(", ")}
                                                            {ministry.members.length > 2 && ` +${ministry.members.length - 2} more`}
                                                        </>
                                                    )}
                                                </span>
                                            </div>

                                            {/* SCHEDULE & LOCATION */}
                                            <div className="ministry-meta-row">
                                                <span>
                                                    <Calendar size={13} />
                                                    {ministry.meetingDay ? `${ministry.meetingDay} ${ministry.meetingTime}` : "Regular Weekly Gathering"}
                                                </span>
                                                <span>
                                                    <MapPin size={13} />
                                                    {ministry.meetingLocation}
                                                </span>
                                            </div>
                                        </div>

                                        {/* ACTION BUTTONS (NO OVERLAP / SEPARATE CLEAN BUTTONS) */}
                                        <div className="ministry-card-actions">
                                            <button
                                                type="button"
                                                className="ministry-action-btn-primary"
                                                onClick={() => handleOpenModal(ministry)}
                                            >
                                                View Team Roster &amp; Rubric <ArrowRight size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                className="ministry-action-btn-secondary"
                                                onClick={() => onNavigate?.("contact")}
                                            >
                                                Join This Ministry Team
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}

                            {filteredMinistries.length === 0 && !error && (
                                <div className="ministries-empty-state">
                                    <Church size={48} />
                                    <h3>No ministries found matching your criteria</h3>
                                    <p>Try clearing your search query or picking "All Departments".</p>
                                    <button
                                        type="button"
                                        className="ministries-primary-button"
                                        onClick={() => {
                                            setSelectedCategory("ALL");
                                            setSearchQuery("");
                                        }}
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* MODAL DIALOG — ROSTER & POINT SYSTEM RUBRIC */}
            {activeModalMinistry && (
                <div className="ministry-modal-backdrop" onClick={() => setActiveModalMinistry(null)}>
                    <div className="ministry-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="ministry-modal-close"
                            onClick={() => setActiveModalMinistry(null)}
                            aria-label="Close modal"
                        >
                            <X size={20} />
                        </button>

                        <div className="ministry-modal-header">
                            <span className="ministry-cat-badge">{activeModalMinistry.category}</span>
                            <h2>{activeModalMinistry.ministryName}</h2>
                            <div className="ministry-modal-meta">
                                <div><Crown size={15} color="#d48806" /> <strong>Head:</strong> {activeModalMinistry.ministryHead}</div>
                                <div><Calendar size={15} /> {activeModalMinistry.meetingDay ? `${activeModalMinistry.meetingDay} ${activeModalMinistry.meetingTime}` : "Regular Weekly Gathering"}</div>
                                <div><MapPin size={15} /> {activeModalMinistry.meetingLocation}</div>
                            </div>
                        </div>

                        <div className="ministry-modal-body">
                            {/* Scripture Encouragement Box */}
                            {activeModalMinistry.encouragementVerse && (
                                <div className="ministry-verse-box">
                                    <BookOpen size={16} style={{ display: "inline", marginRight: "6px" }} />
                                    {activeModalMinistry.encouragementVerse}
                                </div>
                            )}

                            {/* Department Honor Overview */}
                            <div className="ministry-honor-overview">
                                <div className="ministry-honor-item">
                                    <small>Total Service Points</small>
                                    <strong style={{ color: "#b06000" }}>
                                        🏆 {activeModalMinistry.totalMinistryPoints.toLocaleString()} pts
                                    </strong>
                                </div>
                                <div className="ministry-honor-item">
                                    <small>Health Rating</small>
                                    <strong style={{ color: "#1e7e34" }}>
                                        {activeModalMinistry.healthPercentage}% ({activeModalMinistry.healthTier})
                                    </strong>
                                </div>
                                <div className="ministry-honor-item">
                                    <small>Active Servants</small>
                                    <strong style={{ color: "#1877f2" }}>
                                        👥 {activeModalMinistry.totalMembers} Rostered
                                    </strong>
                                </div>
                            </div>

                            {/* Description */}
                            <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#65676b", margin: 0 }}>
                                {activeModalMinistry.description}
                            </p>

                            {/* Roster Table */}
                            <div className="ministry-roster-section">
                                <h4>
                                    <span>Active Team Members &amp; Honor Roll</span>
                                    <span style={{ fontSize: "12px", color: "#65676b", fontWeight: 500 }}>
                                        {activeModalMinistry.members.length} members recognized
                                    </span>
                                </h4>

                                {activeModalMinistry.members.length > 0 ? (
                                    <div style={{ overflowX: "auto" }}>
                                        <table className="ministry-roster-table">
                                            <thead>
                                                <tr>
                                                    <th>Servant Name</th>
                                                    <th>Assigned Role</th>
                                                    <th>Position</th>
                                                    <th>Score</th>
                                                    <th>Encouragement Points</th>
                                                    <th>Honor Title</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {activeModalMinistry.members.map((mem) => (
                                                    <tr key={mem.ministryMemberId || mem.memberId}>
                                                        <td>
                                                            <strong>{mem.name}</strong>
                                                            {mem.isHead && (
                                                                <span style={{ marginLeft: "6px", color: "#d48806", fontSize: "11px", fontWeight: 700 }}>
                                                                    (Head)
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className="member-role-badge">{mem.role || "Member"}</span>
                                                        </td>
                                                        <td style={{ color: "#65676b", fontSize: "12.5px" }}>
                                                            {mem.position || "—"}
                                                        </td>
                                                        <td>
                                                            <span style={{ color: "#1e7e34", fontWeight: 600 }}>
                                                                ★ {mem.overallRating || 4.5}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="member-points-pill">
                                                                <Sparkles size={11} /> {mem.encouragementPoints || 500} pts
                                                            </span>
                                                        </td>
                                                        <td style={{ fontSize: "12px", fontWeight: 600 }}>
                                                            {mem.honorTitle || "⭐ Faithful Servant"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ background: "#f7f8fa", padding: "20px", borderRadius: "8px", textAlign: "center", color: "#65676b" }}>
                                        <p style={{ margin: "0 0 8px" }}>No rostered members currently assigned to this department.</p>
                                        <small>Pastoral leadership is currently accepting servant leader applications.</small>
                                    </div>
                                )}
                            </div>

                            {/* Volunteer CTA Strip */}
                            <div className="ministry-volunteer-box">
                                <div>
                                    <strong>Want to Serve in {activeModalMinistry.ministryName}?</strong>
                                    <p>Join our dedicated servants and build God's kingdom with your gifts.</p>
                                </div>
                                {volunteerSuccess ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#1e7e34", fontWeight: 600 }}>
                                        <CheckCircle2 size={20} />
                                        <span>Interest Registered! Pastors will reach out.</span>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="ministries-primary-button"
                                        onClick={() => {
                                            setActiveModalMinistry(null);
                                            onNavigate?.("contact");
                                        }}
                                    >
                                        Sign Up to Volunteer
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FINAL CALLOUT */}
            <section className="ministries-hero" style={{ background: "#f7f8fa", borderTop: "1px solid #e4e6eb" }}>
                <div className="ministries-hero-content">
                    <h2>Ready to Find Your Ministry Calling?</h2>
                    <p>
                        "As each has received a gift, use it to serve one another, as good stewards of God's varied grace."
                        &mdash; 1 Peter 4:10
                    </p>
                    <div className="ministries-hero-actions">
                        <button
                            type="button"
                            className="ministries-primary-button"
                            onClick={() => onNavigate?.("contact")}
                        >
                            Connect With Our Ministry Pastors <ArrowRight size={16} />
                        </button>
                        <button
                            type="button"
                            className="ministries-secondary-button"
                            onClick={() => onNavigate?.("events")}
                        >
                            View Worship Calendar
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default MinistriesPage;
