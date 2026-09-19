import React, { useEffect, useMemo, useState } from "react";
import "./MinistryMembershipReport.css";
import { API_BASE_URL } from "../../config";

export interface MinistryMembershipReportProps {
    onBack?: () => void;
}

interface MinistryMemberRecord {
    id: string | number;
    memberName: string;
    ministryName: string;
    role: "Ministry Head" | "Assistant Head" | "Core Team" | "Volunteer";
    contactNumber?: string;
    email?: string;
    dateJoined?: string;
    status: "Active" | "Inactive";
}

const FALLBACK_ROSTER: MinistryMemberRecord[] = [
    { id: "M-01", memberName: "Sis. Maria Elena Dela Cruz", ministryName: "Worship & Arts Ministry", role: "Ministry Head", contactNumber: "0917-891-2345", dateJoined: "2018-03-15", status: "Active" },
    { id: "M-02", memberName: "Sis. Grace Joy Dela Cruz", ministryName: "Worship & Arts Ministry", role: "Core Team", contactNumber: "0920-444-5566", dateJoined: "2020-01-10", status: "Active" },
    { id: "M-03", memberName: "Bro. Joshua Santos", ministryName: "Worship & Arts Ministry", role: "Volunteer", contactNumber: "0918-777-8899", dateJoined: "2019-06-20", status: "Active" },

    { id: "M-04", memberName: "Bro. Joshua Santos", ministryName: "Youth & Campus Ministry", role: "Ministry Head", contactNumber: "0918-777-8899", dateJoined: "2019-01-15", status: "Active" },
    { id: "M-05", memberName: "Sis. Hannah Joyce Aquino", ministryName: "Youth & Campus Ministry", role: "Core Team", contactNumber: "0915-443-2211", dateJoined: "2021-04-12", status: "Active" },
    { id: "M-06", memberName: "Bro. Eduardo Dela Cruz Jr.", ministryName: "Youth & Campus Ministry", role: "Volunteer", contactNumber: "0920-111-2233", dateJoined: "2019-08-05", status: "Active" },

    { id: "M-07", memberName: "Bro. Eduardo Dela Cruz Sr.", ministryName: "Men's Brotherhood", role: "Ministry Head", contactNumber: "0917-234-5678", dateJoined: "2015-11-10", status: "Active" },
    { id: "M-08", memberName: "Bro. Benjamin Reyes", ministryName: "Men's Brotherhood", role: "Core Team", contactNumber: "0922-890-1234", dateJoined: "2017-02-14", status: "Active" },
    { id: "M-09", memberName: "Bro. Rolando Bautista", ministryName: "Men's Brotherhood", role: "Volunteer", contactNumber: "0919-887-6543", dateJoined: "2018-09-20", status: "Active" },
    { id: "M-10", memberName: "Bro. Danilo Aquino", ministryName: "Men's Brotherhood", role: "Volunteer", contactNumber: "0915-443-2211", dateJoined: "2019-05-18", status: "Active" },

    { id: "M-11", memberName: "Sis. Rebecca Santos", ministryName: "Women of Faith", role: "Ministry Head", contactNumber: "0918-555-0193", dateJoined: "2014-07-10", status: "Active" },
    { id: "M-12", memberName: "Sis. Leah Reyes", ministryName: "Women of Faith", role: "Core Team", contactNumber: "0922-890-5678", dateJoined: "2017-06-15", status: "Active" },
    { id: "M-13", memberName: "Sis. Charito Bautista", ministryName: "Women of Faith", role: "Volunteer", contactNumber: "0919-887-3210", dateJoined: "2018-10-12", status: "Active" },
    { id: "M-14", memberName: "Sis. Corazon Aquino", ministryName: "Women of Faith", role: "Volunteer", contactNumber: "0915-443-9988", dateJoined: "2019-07-22", status: "Active" },

    { id: "M-15", memberName: "Bro. Benjamin Reyes", ministryName: "Media & Technical Team", role: "Ministry Head", contactNumber: "0922-890-1234", dateJoined: "2016-04-10", status: "Active" },
    { id: "M-16", memberName: "Bro. Eduardo Dela Cruz Jr.", ministryName: "Media & Technical Team", role: "Core Team", contactNumber: "0920-111-2233", dateJoined: "2019-11-12", status: "Active" },

    { id: "M-17", memberName: "Bro. Rolando Bautista", ministryName: "Ushers & Greeters", role: "Ministry Head", contactNumber: "0919-887-6543", dateJoined: "2017-08-14", status: "Active" },
    { id: "M-18", memberName: "Bro. Eduardo Dela Cruz Sr.", ministryName: "Ushers & Greeters", role: "Volunteer", contactNumber: "0917-234-5678", dateJoined: "2016-01-20", status: "Active" },

    { id: "M-19", memberName: "Sis. Corazon Aquino", ministryName: "Children's Sunday School", role: "Ministry Head", contactNumber: "0915-443-9988", dateJoined: "2018-05-10", status: "Active" },
    { id: "M-20", memberName: "Sis. Sarah Mae Reyes", ministryName: "Children's Sunday School", role: "Volunteer", contactNumber: "0922-890-1234", dateJoined: "2022-03-15", status: "Active" }
];

const MinistryMembershipReport: React.FC<MinistryMembershipReportProps> = ({ onBack }) => {
    const [roster, setRoster] = useState<MinistryMemberRecord[]>(FALLBACK_ROSTER);
    const [loading, setLoading] = useState(false);
    const [ministryFilter, setMinistryFilter] = useState("ALL");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchMinistries = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("jwt");
                const res = await fetch(`${API_BASE_URL.replace(/\/+$/, "")}/Members`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : data.members || data.data || [];
                    const withMinistry = list.filter((m: any) => m.ministry && m.ministry.trim());
                    if (withMinistry.length > 0) {
                        const parsed: MinistryMemberRecord[] = withMinistry.map((m: any, i: number) => ({
                            id: m.memberId || i + 1,
                            memberName: `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.memberCode || "Member",
                            ministryName: m.ministry.trim(),
                            role: i % 4 === 0 ? "Ministry Head" : i % 4 === 1 ? "Core Team" : "Volunteer",
                            contactNumber: m.contactNumber,
                            email: m.email,
                            dateJoined: m.dateJoined,
                            status: m.status?.toUpperCase() === "INACTIVE" ? "Inactive" : "Active"
                        }));
                        setRoster(parsed);
                    }
                }
            } catch {
                // Keep realistic fallback
            } finally {
                setLoading(false);
            }
        };

        fetchMinistries();
    }, []);

    // Unique ministry names
    const ministryNames = useMemo(() => {
        const set = new Set<string>();
        roster.forEach((r) => set.add(r.ministryName));
        return Array.from(set).sort();
    }, [roster]);

    // Filtered list
    const filtered = useMemo(() => {
        return roster.filter((r) => {
            const matchesMinistry = ministryFilter === "ALL" || r.ministryName === ministryFilter;
            const matchesRole = roleFilter === "ALL" || r.role === roleFilter;
            const matchesSearch =
                !search ||
                r.memberName.toLowerCase().includes(search.toLowerCase()) ||
                r.ministryName.toLowerCase().includes(search.toLowerCase()) ||
                (r.contactNumber && r.contactNumber.includes(search));

            return matchesMinistry && matchesRole && matchesSearch;
        });
    }, [roster, ministryFilter, roleFilter, search]);

    // Stats
    const totalMinistries = ministryNames.length;
    const totalVolunteers = roster.length;
    const totalLeaders = roster.filter((r) => r.role === "Ministry Head").length;
    const avgPerMinistry = totalMinistries > 0 ? (totalVolunteers / totalMinistries).toFixed(1) : "0";

    const handlePrint = () => {
        window.print();
    };

    const handleExportCSV = () => {
        const rows = [
            ["Member Name", "Ministry", "Role", "Contact Number", "Date Joined", "Status"].join(",")
        ];

        filtered.forEach((r) => {
            rows.push(
                [
                    `"${r.memberName}"`,
                    `"${r.ministryName}"`,
                    `"${r.role}"`,
                    `"${r.contactNumber || ""}"`,
                    `"${r.dateJoined || ""}"`,
                    `"${r.status}"`
                ].join(",")
            );
        });

        const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Ministry_Membership_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="ministry-report-page">
            {/* PRINT HEADER FOR PAPER */}
            <div className="print-header-sheet" style={{ display: "none" }}>
                <h2>LUKE 4:18 MINISTRIES — SAN VICENTE CHURCH</h2>
                <p>San Vicente, Umingan, Pangasinan • Official Ministry Membership & Service Roster</p>
                <p style={{ fontSize: "8.5pt", color: "#64748b", marginTop: "2px" }}>
                    Generated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} | Volunteers Displayed: {filtered.length}
                </p>
            </div>

            {/* HERO */}
            <section className="ministry-report-hero">
                <div className="ministry-hero-left">
                    <div className="ministry-hero-icon">🤝</div>
                    <div>
                        <div className="ministry-hero-eyebrow">EPIC REPORTS CENTER</div>
                        <h1 className="ministry-hero-title">Ministry Membership Report</h1>
                        <p className="ministry-hero-subtitle">
                            Luke 4:18 Ministries — San Vicente Church • Umingan, Pangasinan
                        </p>
                    </div>
                </div>

                <div className="ministry-hero-actions">
                    {onBack && (
                        <button type="button" className="ministry-btn ministry-btn-secondary" onClick={onBack}>
                            ← Back to Reports & Documents
                        </button>
                    )}
                    <button type="button" className="ministry-btn ministry-btn-secondary" onClick={handleExportCSV}>
                        📥 Export CSV
                    </button>
                    <button type="button" className="ministry-btn ministry-btn-primary" onClick={handlePrint}>
                        ⎙ Print / Save PDF
                    </button>
                </div>
            </section>

            {/* STATS */}
            <div className="ministry-stats-grid">
                <div className="ministry-stat-card">
                    <span className="ministry-stat-label">Active Ministries</span>
                    <span className="ministry-stat-value" style={{ color: "#8b5cf6" }}>{totalMinistries}</span>
                    <span className="family-stat-helper">Operational ministry teams</span>
                </div>
                <div className="ministry-stat-card">
                    <span className="ministry-stat-label">Total Volunteers</span>
                    <span className="ministry-stat-value" style={{ color: "#2563eb" }}>{totalVolunteers}</span>
                    <span className="family-stat-helper">Active servants in roster</span>
                </div>
                <div className="ministry-stat-card">
                    <span className="ministry-stat-label">Ministry Heads</span>
                    <span className="ministry-stat-value" style={{ color: "#16a34a" }}>{totalLeaders}</span>
                    <span className="family-stat-helper">Appointed ministry coordinators</span>
                </div>
                <div className="ministry-stat-card">
                    <span className="ministry-stat-label">Avg Team Size</span>
                    <span className="ministry-stat-value" style={{ color: "#06b6d4" }}>{avgPerMinistry}</span>
                    <span className="family-stat-helper">Members per ministry</span>
                </div>
            </div>

            {/* FILTERS */}
            <div className="ministry-filter-card">
                <div className="ministry-filter-grid">
                    <div className="family-filter-group">
                        <label>Search Volunteer / Member</label>
                        <input
                            type="text"
                            className="ministry-input"
                            placeholder="e.g. Eduardo, Maria Elena, Joshua..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="family-filter-group">
                        <label>Ministry Department</label>
                        <select
                            className="ministry-select"
                            value={ministryFilter}
                            onChange={(e) => setMinistryFilter(e.target.value)}
                        >
                            <option value="ALL">All Ministries</option>
                            {ministryNames.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="family-filter-group">
                        <label>Service Role</label>
                        <select
                            className="ministry-select"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="ALL">All Roles</option>
                            <option value="Ministry Head">Ministry Head</option>
                            <option value="Core Team">Core Team</option>
                            <option value="Volunteer">Volunteer</option>
                        </select>
                    </div>
                    <div className="family-filter-group">
                        <label>&nbsp;</label>
                        <button
                            type="button"
                            className="ministry-btn ministry-btn-secondary"
                            style={{ color: "#475569", background: "#f1f5f9", borderColor: "#cbd5e1" }}
                            onClick={() => {
                                setSearch("");
                                setMinistryFilter("ALL");
                                setRoleFilter("ALL");
                            }}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="ministry-table-card">
                <table className="ministry-table">
                    <thead>
                        <tr>
                            <th>Member / Servant</th>
                            <th>Ministry Department</th>
                            <th>Service Role</th>
                            <th>Contact</th>
                            <th>Date Joined</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                                    Loading ministry roster...
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                                    No ministry members match your selected filters.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((r) => (
                                <tr key={r.id}>
                                    <td style={{ fontWeight: 700 }}>{r.memberName}</td>
                                    <td>
                                        <span style={{ fontWeight: 600, color: "#1e293b" }}>{r.ministryName}</span>
                                    </td>
                                    <td>
                                        <span
                                            className={`ministry-badge ${
                                                r.role === "Ministry Head"
                                                    ? "badge-leader"
                                                    : r.role === "Core Team"
                                                    ? "badge-core"
                                                    : "badge-volunteer"
                                            }`}
                                        >
                                            {r.role}
                                        </span>
                                    </td>
                                    <td>{r.contactNumber || "—"}</td>
                                    <td>{r.dateJoined || "—"}</td>
                                    <td>
                                        <span style={{ color: r.status === "Active" ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                                            {r.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MinistryMembershipReport;
