import { useEffect, useRef, useState, useMemo } from "react";
import "./Attendance.css";
import { API_BASE_URL } from "./config";
import {
    Calendar,
    ChevronDown,
    Search,
    Check,
    Clock,
    AlertTriangle,
    X,
    Shield,
    Hourglass,
    Users,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Filter
} from "lucide-react";

const statuses = ["EARLY", "PRESENT", "LATE", "ABSENT", "EXCUSED"] as const;
type Status = typeof statuses[number];

interface Service {
    churchServiceId: number;
    serviceName: string;
    serviceDate: string;
    startTime: string;
    endTime: string;
    status: string;
}

interface Row {
    memberId: number;
    memberCode: string;
    fullName: string;
    ministry: string;
    status: Status | "PENDING";
    recordedDate: string | null;
}

interface Roster {
    service: Service;
    ended: boolean;
    canUpdate: boolean;
    attendance: Row[];
}

type ServiceCategory = "TODAY" | "UPCOMING" | "COMPLETED" | "CANCELLED";

function getServiceCategory(service: Service): ServiceCategory {
    const rawStatus = (service.status || "").trim().toUpperCase();
    if (rawStatus === "CANCELLED" || rawStatus === "POSTPONED") return "CANCELLED";
    if (rawStatus === "COMPLETED") return "COMPLETED";

    const serviceDay = service.serviceDate?.slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    if (serviceDay === today || rawStatus === "IN_PROGRESS" || rawStatus === "LIVE") {
        return "TODAY";
    }

    if (rawStatus === "SCHEDULED" || (serviceDay && serviceDay > today)) {
        return "UPCOMING";
    }

    return "COMPLETED";
}

function formatServiceDate(dateStr: string): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.slice(0, 10);
    return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function getRelativeTimeLabel(dateStr: string): string {
    if (!dateStr) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 1 && diffDays <= 14) return `In ${diffDays} days`;
    if (diffDays < -1 && diffDays >= -14) return `${Math.abs(diffDays)}d ago`;
    return "";
}

const label = (status: string) => status === "PENDING" ? "Not recorded yet" : status[0] + status.slice(1).toLowerCase();

function getStatusIcon(status: string) {
    switch (status) {
        case "PRESENT": return <Check size={13} strokeWidth={2.5} />;
        case "EARLY": return <Clock size={13} strokeWidth={2.5} />;
        case "LATE": return <AlertTriangle size={13} strokeWidth={2.5} />;
        case "ABSENT": return <X size={13} strokeWidth={2.5} />;
        case "EXCUSED": return <Shield size={13} strokeWidth={2.5} />;
        default: return <Hourglass size={13} strokeWidth={2.5} />;
    }
}

function getStatIcon(status: string) {
    switch (status) {
        case "TOTAL": return <Users size={16} />;
        case "PRESENT": return <CheckCircle2 size={16} />;
        case "EARLY": return <Clock size={16} />;
        case "LATE": return <AlertTriangle size={16} />;
        case "ABSENT": return <XCircle size={16} />;
        case "EXCUSED": return <Shield size={16} />;
        default: return <Hourglass size={16} />;
    }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = ["token", "accessToken", "jwt", "authToken", "epicToken"].map(key => localStorage.getItem(key)).find(Boolean);
    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token.replace(/^Bearer\s+/i, "").trim()}`);
    if (options.body) headers.set("Content-Type", "application/json");
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : {}; } catch { body = {}; }
    if (!response.ok) throw new Error(body.message || (response.status === 401 ? "Please sign in again." : `Attendance request failed (${response.status}).`));
    return body as T;
}

export default function AutomaticAttendance() {
    const [services, setServices] = useState<Service[]>([]);
    const [serviceId, setServiceId] = useState("");
    const [roster, setRoster] = useState<Roster | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [editing, setEditing] = useState<Row | null>(null);
    const [correction, setCorrection] = useState<Status>("EXCUSED");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [refresh, setRefresh] = useState(0);

    // Custom dropdown states
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
    const [serviceSearchQuery, setServiceSearchQuery] = useState("");
    const [serviceCategoryFilter, setServiceCategoryFilter] = useState<"ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED">("ALL");
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const updateController = useRef<AbortController | null>(null);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsServiceDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void request<Service[] | { services: Service[] }>("/ChurchServices", { signal: controller.signal })
            .then(data => {
                if (!controller.signal.aborted) {
                    setServices((Array.isArray(data) ? data : data.services || []).sort((a, b) => b.serviceDate.localeCompare(a.serviceDate)));
                }
            })
            .catch(err => {
                if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to load services.");
            });
        return () => { controller.abort(); updateController.current?.abort(); };
    }, []);

    useEffect(() => {
        if (!serviceId) return;
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout>;
        let first = true;
        const load = async () => {
            if (first) setLoading(true);
            try {
                const data = await request<Roster>(`/Attendance/church-service/${serviceId}/automatic`, { signal: controller.signal });
                if (!controller.signal.aborted) { setRoster(data); }
            } catch (err) {
                if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Attendance refresh failed.");
            } finally {
                if (!controller.signal.aborted) { setLoading(false); first = false; timer = setTimeout(load, 10000); }
            }
        };
        void load();
        return () => { controller.abort(); clearTimeout(timer); };
    }, [serviceId, refresh]);

    const selectedService = useMemo(() => {
        return services.find(s => String(s.churchServiceId) === String(serviceId)) || null;
    }, [services, serviceId]);

    // Filtered services for dropdown
    const upcomingCount = useMemo(() => services.filter(s => ["UPCOMING", "TODAY"].includes(getServiceCategory(s))).length, [services]);
    const completedCount = useMemo(() => services.filter(s => getServiceCategory(s) === "COMPLETED").length, [services]);
    const cancelledCount = useMemo(() => services.filter(s => getServiceCategory(s) === "CANCELLED").length, [services]);

    const filteredServices = useMemo(() => {
        return services.filter(s => {
            const cat = getServiceCategory(s);
            if (serviceCategoryFilter === "UPCOMING" && cat !== "UPCOMING" && cat !== "TODAY") return false;
            if (serviceCategoryFilter === "COMPLETED" && cat !== "COMPLETED") return false;
            if (serviceCategoryFilter === "CANCELLED" && cat !== "CANCELLED") return false;

            if (serviceSearchQuery.trim()) {
                const q = serviceSearchQuery.toLowerCase();
                const text = `${s.serviceName} ${s.serviceDate} ${s.status}`.toLowerCase();
                return text.includes(q);
            }
            return true;
        });
    }, [services, serviceCategoryFilter, serviceSearchQuery]);

    const rows = roster?.attendance ?? [];

    // Counts for member status tabs
    const presentCount = useMemo(() => rows.filter(r => r.status === "PRESENT").length, [rows]);
    const earlyCount = useMemo(() => rows.filter(r => r.status === "EARLY").length, [rows]);
    const lateCount = useMemo(() => rows.filter(r => r.status === "LATE").length, [rows]);
    const absentCount = useMemo(() => rows.filter(r => r.status === "ABSENT").length, [rows]);
    const excusedCount = useMemo(() => rows.filter(r => r.status === "EXCUSED").length, [rows]);
    const pendingCount = useMemo(() => rows.filter(r => r.status === "PENDING").length, [rows]);

    const filtered = rows.filter(row => {
        const matchesSearch = `${row.fullName} ${row.memberCode}`.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || row.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const update = async () => {
        if (!editing || saving) return;
        const controller = new AbortController();
        updateController.current = controller;
        setSaving(true); setError(""); setMessage("");
        try {
            await request(`/Attendance/church-service/${serviceId}/members/${editing.memberId}`, {
                method: "PATCH", signal: controller.signal,
                body: JSON.stringify({ status: correction, expectedStatus: editing.status, expectedRecordedDate: editing.recordedDate })
            });
            if (!controller.signal.aborted) {
                setEditing(null);
                setMessage("Attendance updated. The member's inbox will reflect the correction.");
                setRefresh(n => n + 1);
            }
        } catch (err) {
            if (!controller.signal.aborted) { setError(err instanceof Error ? err.message : "Update failed."); setRefresh(n => n + 1); }
        } finally { if (!controller.signal.aborted) setSaving(false); }
    };

    const handleSelectService = (id: string) => {
        setServiceId(id);
        setIsServiceDropdownOpen(false);
        setRoster(null);
        setEditing(null);
        setStatusFilter("ALL");
        setMessage("");
        setError("");
    };

    return (
        <div className="attendance-page">
            <div className="attendance-header">
                <div>
                    <h1>Attendance Management</h1>
                    <p>Automatic records with admin corrections.</p>
                </div>
                <button
                    className="attendance-refresh-btn"
                    disabled={!serviceId || loading || saving}
                    onClick={() => { setError(""); setRefresh(n => n + 1); }}
                >
                    <RotateCcw size={14} style={{ display: "inline-block", marginRight: 6, verticalAlign: "-2px" }} />
                    Refresh
                </button>
            </div>

            {error && <div className="attendance-error" role="alert">{error}</div>}
            {message && <div className="attendance-success" role="status">{message}</div>}

            <div className="attendance-control-card">
                {/* COLOR-FRIENDLY CHURCH SERVICE DROPDOWN */}
                <div className="control-group" ref={dropdownRef}>
                    <label htmlFor="attendance-service">Church service</label>
                    <div className="service-dropdown-container">
                        <div
                            className={`service-dropdown-trigger ${isServiceDropdownOpen ? "open" : ""} ${saving ? "disabled" : ""}`}
                            onClick={() => !saving && setIsServiceDropdownOpen(prev => !prev)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setIsServiceDropdownOpen(prev => !prev); }}
                        >
                            {selectedService ? (
                                <div className="trigger-content">
                                    <span className={`service-pill ${getServiceCategory(selectedService).toLowerCase()}`}>
                                        {getServiceCategory(selectedService) === "COMPLETED" && <Check size={12} strokeWidth={2.5} />}
                                        {getServiceCategory(selectedService) === "UPCOMING" && <Calendar size={12} strokeWidth={2.5} />}
                                        {getServiceCategory(selectedService) === "TODAY" && <span className="pulse-dot"></span>}
                                        {getServiceCategory(selectedService) === "CANCELLED" && <X size={12} strokeWidth={2.5} />}
                                        {getServiceCategory(selectedService) === "TODAY" ? "Today" : selectedService.status}
                                    </span>
                                    <span className="trigger-date">{formatServiceDate(selectedService.serviceDate)}</span>
                                    <span style={{ color: "#94a3b8" }}>—</span>
                                    <span className="trigger-title">{selectedService.serviceName}</span>
                                </div>
                            ) : (
                                <div className="trigger-placeholder">
                                    <Calendar size={16} />
                                    <span>Select a church service...</span>
                                </div>
                            )}

                            <div className="trigger-actions">
                                {selectedService && (
                                    <button
                                        type="button"
                                        className="trigger-clear-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectService("");
                                        }}
                                        title="Clear selected service"
                                    >
                                        ✕
                                    </button>
                                )}
                                <ChevronDown size={17} className={`trigger-chevron ${isServiceDropdownOpen ? "open" : ""}`} />
                            </div>
                        </div>

                        {/* Interactive Dropdown Menu */}
                        {isServiceDropdownOpen && (
                            <div className="service-dropdown-popover">
                                {/* Search Bar */}
                                <div className="service-dropdown-search-box">
                                    <Search size={15} style={{ color: "#64748b", flexShrink: 0 }} />
                                    <input
                                        type="text"
                                        placeholder="Search service name, week, or date..."
                                        value={serviceSearchQuery}
                                        onChange={e => setServiceSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                    {serviceSearchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setServiceSearchQuery("")}
                                            style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* Category Filter Tabs */}
                                <div className="service-dropdown-filter-tabs">
                                    <button
                                        type="button"
                                        className={`service-filter-tab ${serviceCategoryFilter === "ALL" ? "active" : ""}`}
                                        onClick={() => setServiceCategoryFilter("ALL")}
                                    >
                                        All ({services.length})
                                    </button>
                                    <button
                                        type="button"
                                        className={`service-filter-tab tab-upcoming ${serviceCategoryFilter === "UPCOMING" ? "active" : ""}`}
                                        onClick={() => setServiceCategoryFilter("UPCOMING")}
                                    >
                                        📅 Upcoming ({upcomingCount})
                                    </button>
                                    <button
                                        type="button"
                                        className={`service-filter-tab tab-completed ${serviceCategoryFilter === "COMPLETED" ? "active" : ""}`}
                                        onClick={() => setServiceCategoryFilter("COMPLETED")}
                                    >
                                        ✓ Completed ({completedCount})
                                    </button>
                                    {cancelledCount > 0 && (
                                        <button
                                            type="button"
                                            className={`service-filter-tab tab-cancelled ${serviceCategoryFilter === "CANCELLED" ? "active" : ""}`}
                                            onClick={() => setServiceCategoryFilter("CANCELLED")}
                                        >
                                            ✕ Cancelled ({cancelledCount})
                                        </button>
                                    )}
                                </div>

                                {/* Scrollable List */}
                                <div className="service-dropdown-list">
                                    {filteredServices.length === 0 ? (
                                        <div className="service-dropdown-empty">
                                            No church services match your filter.
                                        </div>
                                    ) : (
                                        filteredServices.map(s => {
                                            const category = getServiceCategory(s);
                                            const isSelected = String(s.churchServiceId) === String(serviceId);
                                            const relLabel = getRelativeTimeLabel(s.serviceDate);

                                            return (
                                                <div
                                                    key={s.churchServiceId}
                                                    className={`service-dropdown-item item-${category.toLowerCase()} ${isSelected ? "selected" : ""}`}
                                                    onClick={() => handleSelectService(String(s.churchServiceId))}
                                                >
                                                    <div className="service-item-main">
                                                        <div className="service-item-top">
                                                            <span className="service-item-date">
                                                                <Calendar size={13} style={{ color: "#64748b" }} />
                                                                {formatServiceDate(s.serviceDate)}
                                                            </span>
                                                            {relLabel && (
                                                                <span className={`service-item-relative ${category === "TODAY" ? "rel-today" : category === "UPCOMING" ? "rel-upcoming" : ""}`}>
                                                                    {relLabel}
                                                                </span>
                                                            )}
                                                            {s.startTime && (
                                                                <span className="service-item-time">
                                                                    {s.startTime}{s.endTime ? ` – ${s.endTime}` : ""}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="service-item-title">{s.serviceName}</span>
                                                    </div>

                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <span className={`service-pill ${category.toLowerCase()}`}>
                                                            {category === "COMPLETED" && <Check size={12} strokeWidth={2.5} />}
                                                            {category === "UPCOMING" && <Calendar size={12} strokeWidth={2.5} />}
                                                            {category === "TODAY" && <span className="pulse-dot"></span>}
                                                            {category === "CANCELLED" && <X size={12} strokeWidth={2.5} />}
                                                            {category === "TODAY" ? "Today" : s.status}
                                                        </span>
                                                        {isSelected && <Check size={16} color="#2563eb" strokeWidth={3} />}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* FIND A MEMBER SEARCH */}
                <div className="control-group search-group">
                    <label htmlFor="attendance-search">Find a member</label>
                    <div style={{ position: "relative", width: "100%" }}>
                        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                        <input
                            id="attendance-search"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search name or member code..."
                            style={{ paddingLeft: 34 }}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {roster && (
                <>
                    {/* COLORFUL STAT CARDS (CLICK TO FILTER) */}
                    <div className="attendance-stat-grid">
                        {["TOTAL", ...statuses, "PENDING"].map(st => {
                            const count = st === "TOTAL" ? rows.length : rows.filter(row => row.status === st).length;
                            const isActive = statusFilter === st || (st === "TOTAL" && statusFilter === "ALL");

                            return (
                                <div
                                    key={st}
                                    className={`attendance-stat-card stat-${st.toLowerCase()} ${isActive ? "active-filter" : ""}`}
                                    onClick={() => setStatusFilter(prev => prev === st ? "ALL" : st)}
                                    title={`Click to filter list by ${st === "PENDING" ? "Not Recorded" : st}`}
                                >
                                    <div className="stat-header-row">
                                        <div className="stat-label">{st === "PENDING" ? "NOT RECORDED" : st}</div>
                                        <span className="stat-icon">{getStatIcon(st)}</span>
                                    </div>
                                    <div className="stat-number">{count}</div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="attendance-state-banner automatic-attendance-help">
                        <strong>Live Automatic Rules:</strong> Early: before start • Present: start through 15 minutes after • Late: after 15 minutes.<br />
                        Missing attendance is recorded as Absent after service end. Excused requires an admin update.<br />
                        <span style={{ fontWeight: 700, color: "#1e293b" }}>{roster.service.serviceName}</span> ({roster.service.startTime}–{roster.service.endTime} • {roster.service.status})
                    </div>
                </>
            )}

            {/* EDIT / CORRECTION SECTION WITH 1-CLICK STATUS BUTTONS */}
            {editing && (
                <section className="attendance-control-card" aria-label="Attendance correction" style={{ background: "#f8fafc", border: "1px solid #cbd5e1" }}>
                    <div className="control-group">
                        <strong style={{ fontSize: 15, color: "#0f172a" }}>Update Attendance for {editing.fullName}</strong>
                        <p style={{ margin: "2px 0 8px", fontSize: 12, color: "#64748b" }}>
                            Current recorded status: <span className={`attendance-badge status-${editing.status.toLowerCase()}`}>{getStatusIcon(editing.status)} {label(editing.status)}</span>
                        </p>

                        <div className="quick-correction-container">
                            <span style={{ fontSize: 11, fontWeight: 750, color: "#475569" }}>SELECT NEW STATUS:</span>
                            <div className="quick-correction-buttons">
                                {statuses.map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        className={`quick-status-btn status-${s.toLowerCase()} ${correction === s ? "selected" : ""}`}
                                        onClick={() => setCorrection(s)}
                                        disabled={saving}
                                    >
                                        {getStatusIcon(s)}
                                        <span>{label(s)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                        <button
                            className="save-attendance-btn"
                            disabled={saving || correction === editing.status}
                            onClick={() => void update()}
                        >
                            {saving ? "Updating…" : `Confirm Update to ${label(correction)}`}
                        </button>
                        <button
                            className="attendance-refresh-btn"
                            disabled={saving}
                            onClick={() => setEditing(null)}
                        >
                            Cancel
                        </button>
                    </div>
                </section>
            )}

            {/* COLOR-FRIENDLY MEMBER ATTENDANCE TABLE CARD */}
            <div className="attendance-table-card">
                <div className="table-card-header">
                    <div>
                        <h3>Member Attendance Records</h3>
                        <p>Live records refresh every 10 seconds. Unrecorded members are never assumed present.</p>
                    </div>
                    {statusFilter !== "ALL" && (
                        <button
                            type="button"
                            className="attendance-refresh-btn"
                            style={{ padding: "6px 12px", fontSize: 11 }}
                            onClick={() => setStatusFilter("ALL")}
                        >
                            Clear Filter (Showing {statusFilter})
                        </button>
                    )}
                </div>

                {/* STATUS FILTER PILL TABS BAR */}
                {roster && (
                    <div className="member-status-filter-bar">
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", display: "flex", alignItems: "center", gap: 4, marginRight: 4 }}>
                            <Filter size={12} /> Filter:
                        </span>
                        <button
                            type="button"
                            className={`member-filter-tab ${statusFilter === "ALL" ? "active" : ""}`}
                            onClick={() => setStatusFilter("ALL")}
                        >
                            All Members <span className="filter-count">{rows.length}</span>
                        </button>
                        <button
                            type="button"
                            className={`member-filter-tab tab-present ${statusFilter === "PRESENT" ? "active" : ""}`}
                            onClick={() => setStatusFilter(prev => prev === "PRESENT" ? "ALL" : "PRESENT")}
                        >
                            <Check size={12} strokeWidth={2.5} /> Present <span className="filter-count">{presentCount}</span>
                        </button>
                        <button
                            type="button"
                            className={`member-filter-tab tab-early ${statusFilter === "EARLY" ? "active" : ""}`}
                            onClick={() => setStatusFilter(prev => prev === "EARLY" ? "ALL" : "EARLY")}
                        >
                            <Clock size={12} strokeWidth={2.5} /> Early <span className="filter-count">{earlyCount}</span>
                        </button>
                        <button
                            type="button"
                            className={`member-filter-tab tab-late ${statusFilter === "LATE" ? "active" : ""}`}
                            onClick={() => setStatusFilter(prev => prev === "LATE" ? "ALL" : "LATE")}
                        >
                            <AlertTriangle size={12} strokeWidth={2.5} /> Late <span className="filter-count">{lateCount}</span>
                        </button>
                        <button
                            type="button"
                            className={`member-filter-tab tab-absent ${statusFilter === "ABSENT" ? "active" : ""}`}
                            onClick={() => setStatusFilter(prev => prev === "ABSENT" ? "ALL" : "ABSENT")}
                        >
                            <X size={12} strokeWidth={2.5} /> Absent <span className="filter-count">{absentCount}</span>
                        </button>
                        <button
                            type="button"
                            className={`member-filter-tab tab-excused ${statusFilter === "EXCUSED" ? "active" : ""}`}
                            onClick={() => setStatusFilter(prev => prev === "EXCUSED" ? "ALL" : "EXCUSED")}
                        >
                            <Shield size={12} strokeWidth={2.5} /> Excused <span className="filter-count">{excusedCount}</span>
                        </button>
                        <button
                            type="button"
                            className={`member-filter-tab tab-pending ${statusFilter === "PENDING" ? "active" : ""}`}
                            onClick={() => setStatusFilter(prev => prev === "PENDING" ? "ALL" : "PENDING")}
                        >
                            <Hourglass size={12} strokeWidth={2.5} /> Not Recorded <span className="filter-count">{pendingCount}</span>
                        </button>
                    </div>
                )}

                {!serviceId ? (
                    <div className="empty-attendance" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <Calendar size={32} color="#94a3b8" />
                        <strong>Select a church service above to view and manage attendance.</strong>
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>You can pick from Upcoming or Completed services.</span>
                    </div>
                ) : loading && !roster ? (
                    <div className="attendance-loading">Loading attendance records…</div>
                ) : (
                    <div className="attendance-table-wrapper">
                        <table className="attendance-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>MEMBER</th>
                                    <th>CODE</th>
                                    <th>MINISTRY</th>
                                    <th>ATTENDANCE STATUS</th>
                                    <th>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((row, index) => (
                                    <tr key={row.memberId} className={`member-row status-${row.status.toLowerCase()}`}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <div className="member-name-cell">
                                                <div className="member-avatar">
                                                    {row.fullName.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("")}
                                                </div>
                                                <strong>{row.fullName}</strong>
                                            </div>
                                        </td>
                                        <td><span className="member-code">{row.memberCode}</span></td>
                                        <td>
                                            <span style={{ padding: "3px 8px", borderRadius: 4, background: "#f1f5f9", fontSize: 11, fontWeight: 600, color: "#475569" }}>
                                                {row.ministry || "General"}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`attendance-badge status-${row.status.toLowerCase()}`}>
                                                {getStatusIcon(row.status)}
                                                <span>{label(row.status)}</span>
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="attendance-refresh-btn"
                                                style={{ padding: "5px 12px", fontSize: 11 }}
                                                disabled={!roster?.canUpdate || saving}
                                                onClick={() => {
                                                    setEditing(row);
                                                    setCorrection(row.status === "PENDING" ? "EXCUSED" : row.status);
                                                    setMessage("");
                                                }}
                                            >
                                                Update
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!filtered.length && (
                                    <tr>
                                        <td colSpan={6} className="empty-attendance">
                                            No matching members found{statusFilter !== "ALL" ? ` with status "${statusFilter}"` : ""}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
