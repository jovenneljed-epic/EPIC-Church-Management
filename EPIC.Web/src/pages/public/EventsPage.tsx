import React, { useState, useEffect, useMemo, useCallback } from "react";
import PublicHeader from "../../components/PublicHeader";
import {
    Calendar,
    MapPin,
    Clock,
    Users,
    QrCode,
    Sparkles,
    CheckCircle2,
    ArrowRight,
    Search,
    HeartHandshake,
    X,
    RefreshCw,
    Mic,
    UserCheck,
    Church,
    AlertCircle
} from "lucide-react";
import { getUpcomingChurchServices, type ChurchService } from "../../services/churchService";
import "./EventsPage.css";
import "./PublicUnisonTheme.css";

interface EventsPageProps {
    onNavigate?: (page: string) => void;
}

// Helpers for real database field formatting
function formatTime12h(timeStr: string): string {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
}

function formatTimeRange(start: string, end: string): string {
    const s = formatTime12h(start);
    const e = formatTime12h(end);
    if (s && e) return `${s} – ${e}`;
    return s || e || "TBA";
}

function formatDateBadge(dateStr: string): { month: string; day: string; weekday: string; fullDate: string } {
    if (!dateStr) {
        return { month: "SEP", day: "01", weekday: "SUN", fullDate: "" };
    }
    const cleanDate = dateStr.split("T")[0];
    const parts = cleanDate.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);

    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const fullMonths = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const fullWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const dayIndex = isNaN(d.getDay()) ? 0 : d.getDay();
    const monthIndex = isNaN(d.getMonth()) ? 8 : d.getMonth();
    const dayNum = isNaN(d.getDate()) ? 1 : d.getDate();

    return {
        month: months[monthIndex],
        day: String(dayNum).padStart(2, "0"),
        weekday: weekdays[dayIndex],
        fullDate: `${fullWeekdays[dayIndex]}, ${fullMonths[monthIndex]} ${dayNum}, ${year}`
    };
}

interface ProgramItem {
    label: string;
    value: string;
}

function parseMinisterialProgram(description: string): ProgramItem[] {
    if (!description) return [];
    const lines = description
        .split(/\r?\n|;/)
        .map((line) => line.trim())
        .filter(Boolean);

    const items: ProgramItem[] = [];
    for (const line of lines) {
        const colonIdx = line.indexOf(":");
        if (colonIdx > 0) {
            const label = line.substring(0, colonIdx).trim();
            const value = line.substring(colonIdx + 1).trim();
            items.push({ label, value });
        } else if (line.toUpperCase().includes("DEPARTMENT") || line.toUpperCase().includes("STUDENTS")) {
            items.push({ label: "FOCUS", value: line });
        } else {
            items.push({ label: "ORDER", value: line });
        }
    }
    return items;
}

function getSystemFeature(serviceType: string): string {
    const st = (serviceType || "").toUpperCase();
    if (st.includes("YOUTH")) {
        return "CRBreakPass QR Token & Youth Session Verification";
    }
    if (st.includes("PRAYER")) {
        return "Ministry Attendance & Intercessor Prayer Roster";
    }
    if (st.includes("WORSHIP") || st.includes("CELL")) {
        return "Real-Time QR Attendance & Sanctuary Entry Verification";
    }
    return "Real-Time Attendance & Member Lifecycle Tracking";
}

const EventsPage: React.FC<EventsPageProps> = ({ onNavigate }) => {
    const [services, setServices] = useState<ChurchService[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [activeModalService, setActiveModalService] = useState<ChurchService | null>(null);
    const [rsvpSuccess, setRsvpSuccess] = useState<boolean>(false);
    const [lastSyncTime, setLastSyncTime] = useState<string>("");

    const fetchServices = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const data = await getUpcomingChurchServices(50, true);
            setServices(data);
            setLastSyncTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        } catch (err: any) {
            console.error("Failed to load church services:", err);
            setError(err?.message || "Failed to connect to church database. Please check your network.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchServices(false);
    }, [fetchServices]);

    // Distinct category filters extracted directly from real DB records
    const categories = useMemo(() => {
        const types = new Set<string>();
        services.forEach((s) => {
            if (s.serviceType) {
                types.add(s.serviceType.trim().toUpperCase());
            }
        });
        const arr = Array.from(types).sort();
        return ["ALL", ...arr];
    }, [services]);

    // Filter services based on category and search query
    const filteredServices = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return services.filter((svc) => {
            const matchesCategory =
                selectedCategory === "ALL" ||
                (svc.serviceType && svc.serviceType.trim().toUpperCase() === selectedCategory);

            const matchesSearch =
                query === "" ||
                svc.serviceName.toLowerCase().includes(query) ||
                (svc.description && svc.description.toLowerCase().includes(query)) ||
                (svc.location && svc.location.toLowerCase().includes(query)) ||
                (svc.speaker && svc.speaker.toLowerCase().includes(query)) ||
                (svc.serviceLeader && svc.serviceLeader.toLowerCase().includes(query));

            return matchesCategory && matchesSearch;
        });
    }, [services, selectedCategory, searchQuery]);

    const handleOpenModal = (svc: ChurchService) => {
        setActiveModalService(svc);
        setRsvpSuccess(false);
    };

    return (
        <div className="epic-public-events">
            <PublicHeader onNavigate={onNavigate} />

            {/* HERO */}
            <section className="events-hero">
                <div className="events-hero-content">
                    <span className="events-eyebrow">
                        <Calendar size={14} /> EPIC CHURCH LIFE &amp; GATHERINGS
                    </span>
                    <h1>
                        Connect. Grow. <span>Serve Together.</span>
                    </h1>
                    <p>
                        Experience dynamic worship celebrations, prayer nights, and youth gatherings.
                        Every service is synchronized live with the EPIC Church Management System for
                        accurate schedules, speaker profiles, and QR attendance.
                    </p>
                    <div className="events-hero-actions">
                        <button
                            type="button"
                            className="events-primary-button"
                            onClick={() => {
                                const list = document.getElementById("events-browser-anchor");
                                list?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            Browse Church Calendar <ArrowRight size={16} />
                        </button>
                        <button
                            type="button"
                            className="events-secondary-button"
                            onClick={() => onNavigate?.("ministries")}
                        >
                            <Users size={16} /> Explore Ministries
                        </button>
                    </div>
                </div>
            </section>

            {/* SYSTEM HIGHLIGHT STRIP */}
            <section className="events-system-strip">
                <div className="events-section-container">
                    <div className="events-strip-grid">
                        <div className="events-strip-card">
                            <div className="events-strip-icon"><QrCode size={22} /></div>
                            <div>
                                <strong>Real-Time QR Check-In</strong>
                                <p>Instant scanning for sanctuary attendees &amp; youth passes</p>
                            </div>
                        </div>
                        <div className="events-strip-card">
                            <div className="events-strip-icon"><Church size={22} /></div>
                            <div>
                                <strong>Live Service Order</strong>
                                <p>Preachers, worship leaders &amp; ministerial flow from DB</p>
                            </div>
                        </div>
                        <div className="events-strip-card">
                            <div className="events-strip-icon"><Sparkles size={22} /></div>
                            <div>
                                <strong>Centralized Scheduling</strong>
                                <p>Weekly cell celebrations, prayer services &amp; TGIF nights</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* EVENT BROWSER & LIST */}
            <section className="events-browser-section" id="events-browser-anchor">
                <div className="events-section-container">
                    <div className="events-section-heading">
                        <span className="events-section-label">UPCOMING CALENDAR</span>
                        <h2>Church Gatherings &amp; Services</h2>
                        <p>
                            Connected directly to our church database. All service schedules, speakers,
                            and ministerial assignments update in real time.
                        </p>
                    </div>

                    {/* LIVE DATABASE STATUS BAR */}
                    <div className="events-db-status-bar">
                        <div className="events-db-badge-group">
                            <span className="events-live-indicator">
                                <span className="events-pulse-dot" />
                                Live Database Connected
                            </span>
                            <span className="events-count-badge">
                                <strong>{services.length}</strong> scheduled services found
                                {lastSyncTime && ` • Synced at ${lastSyncTime}`}
                            </span>
                        </div>

                        <button
                            type="button"
                            className="events-refresh-btn"
                            onClick={() => fetchServices(true)}
                            disabled={refreshing || loading}
                            title="Fetch latest updates from ChurchServices database"
                        >
                            <RefreshCw size={14} className={refreshing ? "spin-icon" : ""} />
                            {refreshing ? "Syncing..." : "↻ Refresh Calendar"}
                        </button>
                    </div>

                    {/* CONTROLS */}
                    <div className="events-filter-bar">
                        <div className="events-category-pills">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    className={`events-pill ${selectedCategory === cat ? "active" : ""}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat === "ALL" ? "All Gatherings" : cat}
                                </button>
                            ))}
                        </div>

                        <div className="events-search-box">
                            <Search size={16} className="events-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by service name, speaker, or leader..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="events-clear-search"
                                    onClick={() => setSearchQuery("")}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ERROR STATE */}
                    {error && services.length === 0 && (
                        <div className="events-empty-state" style={{ borderColor: "#ffa39e", background: "#fff1f0" }}>
                            <AlertCircle size={44} color="#cf1322" />
                            <h3 style={{ color: "#cf1322" }}>Unable to Connect to Church Services</h3>
                            <p>{error}</p>
                            <button
                                type="button"
                                className="events-primary-button"
                                onClick={() => fetchServices(false)}
                            >
                                Retry Connection
                            </button>
                        </div>
                    )}

                    {/* LOADING SKELETONS */}
                    {loading && (
                        <div className="events-grid-list">
                            {[1, 2, 3].map((n) => (
                                <article key={n} className="event-card event-skeleton" style={{ minHeight: "180px" }}>
                                    <div style={{ padding: "20px" }}>
                                        <div style={{ height: "24px", width: "40%", background: "#e4e6eb", borderRadius: "4px", marginBottom: "12px" }} />
                                        <div style={{ height: "16px", width: "70%", background: "#e4e6eb", borderRadius: "4px", marginBottom: "8px" }} />
                                        <div style={{ height: "16px", width: "50%", background: "#e4e6eb", borderRadius: "4px" }} />
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    {/* REAL DATABASE SERVICES CARDS */}
                    {!loading && (
                        <div className="events-grid-list">
                            {filteredServices.map((svc) => {
                                const badge = formatDateBadge(svc.serviceDate);
                                const timeRange = formatTimeRange(svc.startTime, svc.endTime);
                                const programItems = parseMinisterialProgram(svc.description);
                                const systemFeature = getSystemFeature(svc.serviceType);

                                return (
                                    <article key={svc.churchServiceId} className="event-card">
                                        <div className="event-date-column">
                                            <div className="event-date-box">
                                                <span className="event-date-month">{badge.month}</span>
                                                <strong className="event-date-day">{badge.day}</strong>
                                                <span className="event-date-weekday">{badge.weekday}</span>
                                            </div>
                                            <span className="event-category-badge">
                                                {svc.serviceType || "SERVICE"}
                                            </span>
                                        </div>

                                        <div className="event-info-column">
                                            <div className="event-meta-row">
                                                <span><Clock size={14} /> {timeRange}</span>
                                                <span><MapPin size={14} /> {svc.location || "Main Sanctuary"}</span>
                                            </div>

                                            <h3>{svc.serviceName}</h3>

                                            {/* Preacher and Leader tags */}
                                            <div className="event-roles-bar">
                                                {svc.speaker && (
                                                    <span className="event-role-tag">
                                                        <Mic size={13} />
                                                        <strong>Preacher:</strong> {svc.speaker}
                                                    </span>
                                                )}
                                                {svc.serviceLeader && (
                                                    <span className="event-role-tag leader">
                                                        <UserCheck size={13} />
                                                        <strong>Leader:</strong> {svc.serviceLeader}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Ministerial Program Preview */}
                                            {programItems.length > 0 && (
                                                <div className="event-highlights-list">
                                                    {programItems.slice(0, 3).map((item, idx) => (
                                                        <div key={idx} className="event-highlight-item">
                                                            <CheckCircle2 size={14} className="highlight-check" />
                                                            <span><strong>{item.label}:</strong> {item.value}</span>
                                                        </div>
                                                    ))}
                                                    {programItems.length > 3 && (
                                                        <small style={{ color: "#1877f2", fontWeight: 600 }}>
                                                            +{programItems.length - 3} more program items...
                                                        </small>
                                                    )}
                                                </div>
                                            )}

                                            <div className="event-system-tag">
                                                <QrCode size={13} />
                                                <small>
                                                    System: <strong>{systemFeature}</strong>
                                                </small>
                                            </div>
                                        </div>

                                        <div className="event-action-column">
                                            <button
                                                type="button"
                                                className="event-rsvp-btn"
                                                onClick={() => handleOpenModal(svc)}
                                            >
                                                Service Order &amp; RSVP <ArrowRight size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                className="event-contact-btn"
                                                onClick={() => onNavigate?.("contact")}
                                            >
                                                Ask a Question
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}

                            {filteredServices.length === 0 && !error && (
                                <div className="events-empty-state">
                                    <Calendar size={48} />
                                    <h3>No church services found matching your criteria</h3>
                                    <p>Try clearing your search query or picking "All Gatherings" to see our full calendar.</p>
                                    <button
                                        type="button"
                                        className="events-primary-button"
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

            {/* MODAL DIALOG — FULL MINISTERIAL SERVICE ORDER */}
            {activeModalService && (() => {
                const modalBadge = formatDateBadge(activeModalService.serviceDate);
                const modalTime = formatTimeRange(activeModalService.startTime, activeModalService.endTime);
                const modalProgram = parseMinisterialProgram(activeModalService.description);
                const modalSystemFeature = getSystemFeature(activeModalService.serviceType);

                return (
                    <div className="event-modal-backdrop" onClick={() => setActiveModalService(null)}>
                        <div className="event-modal-content" onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                className="event-modal-close"
                                onClick={() => setActiveModalService(null)}
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>

                            <div className="event-modal-header">
                                <span className="event-category-badge">
                                    {activeModalService.serviceType || "CHURCH SERVICE"}
                                </span>
                                <h2>{activeModalService.serviceName}</h2>
                                <div className="event-modal-meta">
                                    <div><Calendar size={15} /> {modalBadge.fullDate || `${modalBadge.weekday}, ${modalBadge.month} ${modalBadge.day}`}</div>
                                    <div><Clock size={15} /> {modalTime}</div>
                                    <div><MapPin size={15} /> {activeModalService.location || "Main Sanctuary"}</div>
                                </div>
                            </div>

                            <div className="event-modal-body">
                                {/* Speaker & Leader Highlight */}
                                <div className="event-roles-bar" style={{ marginBottom: "16px" }}>
                                    {activeModalService.speaker && (
                                        <span className="event-role-tag" style={{ fontSize: "13px", padding: "6px 12px" }}>
                                            <Mic size={15} />
                                            <strong>Word of God / Speaker:</strong> {activeModalService.speaker}
                                        </span>
                                    )}
                                    {activeModalService.serviceLeader && (
                                        <span className="event-role-tag leader" style={{ fontSize: "13px", padding: "6px 12px" }}>
                                            <UserCheck size={15} />
                                            <strong>Service Leader:</strong> {activeModalService.serviceLeader}
                                        </span>
                                    )}
                                </div>

                                {/* Full Ministerial Program Flow */}
                                {modalProgram.length > 0 ? (
                                    <div className="event-program-flow">
                                        <div className="event-program-flow-header">
                                            Ministerial Program &amp; Order of Service
                                        </div>
                                        <div className="event-program-flow-list">
                                            {modalProgram.map((item, idx) => (
                                                <div key={idx} className="event-program-flow-item">
                                                    <span className="event-program-label">{item.label}:</span>
                                                    <span className="event-program-value">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="event-modal-desc">
                                        Join us for this worship gathering at {activeModalService.location || "the sanctuary"}.
                                    </p>
                                )}

                                <div className="event-modal-system-callout">
                                    <QrCode size={20} />
                                    <div>
                                        <strong>Live Database Verification:</strong>
                                        <p>
                                            Attendance and session check-in are synchronized via{" "}
                                            <em>{modalSystemFeature}</em>. Check-in records are automatically recorded
                                            in the EPIC Church Management attendance database.
                                        </p>
                                    </div>
                                </div>

                                {rsvpSuccess ? (
                                    <div className="event-rsvp-success">
                                        <CheckCircle2 size={24} />
                                        <div>
                                            <strong>Attendance Confirmed!</strong>
                                            <p>
                                                We look forward to worshipping with you. Please present your EPIC digital
                                                member pass or check in at the sanctuary kiosk upon arrival.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="event-rsvp-box">
                                        <button
                                            type="button"
                                            className="events-primary-button"
                                            onClick={() => setRsvpSuccess(true)}
                                        >
                                            Confirm My Attendance (Free)
                                        </button>
                                        <button
                                            type="button"
                                            className="events-secondary-button"
                                            onClick={() => {
                                                setActiveModalService(null);
                                                onNavigate?.("contact");
                                            }}
                                        >
                                            Inquire With Pastors
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* CTA SECTION */}
            <section className="events-cta">
                <div className="events-section-container">
                    <div className="events-cta-content">
                        <span className="events-section-label">GET INVOLVED</span>
                        <h2>Want to Serve in an Upcoming Gathering?</h2>
                        <p>
                            From our welcoming Ushers and Greeters to our Praise &amp; Worship musicians,
                            Media &amp; Sound team, and Kids Church leaders—God has given you gifts to build His kingdom.
                        </p>
                        <div className="events-hero-actions">
                            <button
                                type="button"
                                className="events-primary-button"
                                onClick={() => onNavigate?.("ministries")}
                            >
                                <HeartHandshake size={18} /> Join a Ministry Team
                            </button>
                            <button
                                type="button"
                                className="events-secondary-button"
                                onClick={() => onNavigate?.("contact")}
                            >
                                Connect With Us
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default EventsPage;
