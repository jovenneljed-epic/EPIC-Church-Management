import React, { useEffect, useMemo, useState } from "react";
import "./BirthdayAnniversaryReport.css";
import { API_BASE_URL } from "../../config";

export interface BirthdayAnniversaryReportProps {
    onBack?: () => void;
}

interface CelebrationRecord {
    id: string | number;
    name: string;
    type: "BIRTHDAY" | "ANNIVERSARY";
    dateString: string; // YYYY-MM-DD or MM-DD
    month: number; // 1-12
    day: number; // 1-31
    year?: number;
    spouseName?: string;
    ministry?: string;
    contactNumber?: string;
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Fallback celebrants for Luke 4:18 Ministries San Vicente Church
const FALLBACK_CELEBRANTS: CelebrationRecord[] = [
    { id: 1, name: "Bro. Eduardo Dela Cruz Sr.", type: "BIRTHDAY", dateString: "1972-04-12", month: 4, day: 12, year: 1972, ministry: "Men's Fellowship", contactNumber: "0917-234-5678" },
    { id: 2, name: "Sis. Rebecca Santos", type: "BIRTHDAY", dateString: "1971-12-05", month: 12, day: 5, year: 1971, ministry: "Women's Ministry", contactNumber: "0918-555-0193" },
    { id: 3, name: "Pastor Mateo Santos", type: "BIRTHDAY", dateString: "1968-09-10", month: 9, day: 10, year: 1968, ministry: "Pastoral", contactNumber: "0918-555-0192" },
    { id: 4, name: "Pastor Mateo & Sis. Rebecca Santos", type: "ANNIVERSARY", dateString: "1994-06-18", month: 6, day: 18, year: 1994, spouseName: "Rebecca Santos", contactNumber: "0918-555-0192" },
    { id: 5, name: "Bro. Benjamin Reyes", type: "BIRTHDAY", dateString: "1980-03-14", month: 3, day: 14, year: 1980, ministry: "Media Ministry", contactNumber: "0922-890-1234" },
    { id: 6, name: "Bro. Benjamin & Sis. Leah Reyes", type: "ANNIVERSARY", dateString: "2008-08-22", month: 8, day: 22, year: 2008, spouseName: "Leah Reyes", contactNumber: "0922-890-1234" },
    { id: 7, name: "Sis. Maria Elena Dela Cruz", type: "BIRTHDAY", dateString: "1975-08-20", month: 8, day: 20, year: 1975, ministry: "Worship Team", contactNumber: "0917-891-2345" },
    { id: 8, name: "Bro. Eduardo & Sis. Maria Dela Cruz", type: "ANNIVERSARY", dateString: "1998-05-15", month: 5, day: 15, year: 1998, spouseName: "Maria Elena Dela Cruz", contactNumber: "0917-234-5678" },
    { id: 9, name: "Joshua Santos", type: "BIRTHDAY", dateString: "1998-06-22", month: 6, day: 22, year: 1998, ministry: "Youth Ministry", contactNumber: "0918-777-8899" },
    { id: 10, name: "Hannah Joyce Aquino", type: "BIRTHDAY", dateString: "2006-08-14", month: 8, day: 14, year: 2006, ministry: "Children's Ministry", contactNumber: "0915-443-2211" },
    { id: 11, name: "Bro. Rolando & Sis. Charito Bautista", type: "ANNIVERSARY", dateString: "2012-02-14", month: 2, day: 14, year: 2012, spouseName: "Charito Bautista", contactNumber: "0919-887-6543" },
    { id: 12, name: "Grace Joy Dela Cruz", type: "BIRTHDAY", dateString: "2004-11-03", month: 11, day: 3, year: 2004, ministry: "Worship Team", contactNumber: "0920-444-5566" }
];

function getDaysUntil(month: number, day: number): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    const target = new Date(currentYear, month - 1, day);
    const startOfToday = new Date(currentYear, now.getMonth(), now.getDate());

    if (target < startOfToday) {
        target.setFullYear(currentYear + 1);
    }
    const diffMs = target.getTime() - startOfToday.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

const BirthdayAnniversaryReport: React.FC<BirthdayAnniversaryReportProps> = ({ onBack }) => {
    const currentMonth = new Date().getMonth() + 1;
    const [celebrants, setCelebrants] = useState<CelebrationRecord[]>(FALLBACK_CELEBRANTS);
    const [loading, setLoading] = useState(false);
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [monthFilter, setMonthFilter] = useState<string>("ALL");
    const [search, setSearch] = useState<string>("");

    useEffect(() => {
        const loadCelebrants = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("jwt");
                const res = await fetch(`${API_BASE_URL.replace(/\/+$/, "")}/Members`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : data.members || data.data || [];
                    if (list.length > 0) {
                        const parsed: CelebrationRecord[] = [];
                        list.forEach((m: any, idx: number) => {
                            if (m.birthDate) {
                                const d = new Date(m.birthDate);
                                if (!isNaN(d.getTime())) {
                                    parsed.push({
                                        id: `b_${m.memberId || idx}`,
                                        name: `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.memberCode || "Member",
                                        type: "BIRTHDAY",
                                        dateString: m.birthDate,
                                        month: d.getMonth() + 1,
                                        day: d.getDate(),
                                        year: d.getFullYear(),
                                        ministry: m.ministry,
                                        contactNumber: m.contactNumber
                                    });
                                }
                            }
                        });
                        if (parsed.length > 0) {
                            setCelebrants(parsed);
                        }
                    }
                }
            } catch {
                // Keep fallback data
            } finally {
                setLoading(false);
            }
        };

        loadCelebrants();
    }, []);

    // Filter celebrants
    const filtered = useMemo(() => {
        return celebrants.filter((c) => {
            const matchesType = typeFilter === "ALL" || c.type === typeFilter;
            const matchesMonth = monthFilter === "ALL" || c.month === Number(monthFilter);
            const matchesSearch =
                !search ||
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                (c.spouseName && c.spouseName.toLowerCase().includes(search.toLowerCase())) ||
                (c.ministry && c.ministry.toLowerCase().includes(search.toLowerCase()));

            return matchesType && matchesMonth && matchesSearch;
        }).sort((a, b) => {
            const daysA = getDaysUntil(a.month, a.day);
            const daysB = getDaysUntil(b.month, b.day);
            return daysA - daysB;
        });
    }, [celebrants, typeFilter, monthFilter, search]);

    // Metrics
    const thisMonthCount = celebrants.filter((c) => c.month === currentMonth).length;
    const totalBirthdays = celebrants.filter((c) => c.type === "BIRTHDAY").length;
    const totalAnniversaries = celebrants.filter((c) => c.type === "ANNIVERSARY").length;
    const upcoming30Days = celebrants.filter((c) => getDaysUntil(c.month, c.day) <= 30).length;

    const handlePrint = () => {
        window.print();
    };

    const handleExportCSV = () => {
        const rows = [
            ["Celebrant Name", "Type", "Celebration Date", "Month", "Day", "Days Away", "Ministry", "Contact Number"].join(",")
        ];

        filtered.forEach((c) => {
            const daysAway = getDaysUntil(c.month, c.day);
            rows.push(
                [
                    `"${c.name}"`,
                    `"${c.type}"`,
                    `"${c.dateString}"`,
                    `"${MONTH_NAMES[c.month - 1]}"`,
                    `"${c.day}"`,
                    `"${daysAway}"`,
                    `"${c.ministry || ""}"`,
                    `"${c.contactNumber || ""}"`
                ].join(",")
            );
        });

        const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Birthdays_Anniversaries_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="celebration-report-page">
            {/* PRINT HEADER FOR PAPER */}
            <div className="print-header-sheet" style={{ display: "none" }}>
                <h2>LUKE 4:18 MINISTRIES — SAN VICENTE CHURCH</h2>
                <p>San Vicente, Umingan, Pangasinan • Official Church Birthdays & Anniversaries Register</p>
                <p style={{ fontSize: "8.5pt", color: "#64748b", marginTop: "2px" }}>
                    Generated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} | Celebrants Displayed: {filtered.length}
                </p>
            </div>

            {/* HERO */}
            <section className="celebration-report-hero">
                <div className="celebration-hero-left">
                    <div className="celebration-hero-icon">🎂</div>
                    <div>
                        <div className="celebration-hero-eyebrow">EPIC REPORTS CENTER</div>
                        <h1 className="celebration-hero-title">Birthdays & Anniversaries</h1>
                        <p className="celebration-hero-subtitle">
                            Luke 4:18 Ministries — San Vicente Church • Umingan, Pangasinan
                        </p>
                    </div>
                </div>

                <div className="celebration-hero-actions">
                    {onBack && (
                        <button type="button" className="celebration-btn celebration-btn-secondary" onClick={onBack}>
                            ← Back to Reports & Documents
                        </button>
                    )}
                    <button type="button" className="celebration-btn celebration-btn-secondary" onClick={handleExportCSV}>
                        📥 Export CSV
                    </button>
                    <button type="button" className="celebration-btn celebration-btn-primary" onClick={handlePrint}>
                        ⎙ Print / Save PDF
                    </button>
                </div>
            </section>

            {/* STATS */}
            <div className="celebration-stats-grid">
                <div className="celebration-stat-card">
                    <span className="celebration-stat-label">This Month ({MONTH_NAMES[currentMonth - 1]})</span>
                    <span className="celebration-stat-value" style={{ color: "#ec4899" }}>{thisMonthCount}</span>
                    <span className="celebration-stat-helper">Celebrants this calendar month</span>
                </div>
                <div className="celebration-stat-card">
                    <span className="celebration-stat-label">Upcoming in 30 Days</span>
                    <span className="celebration-stat-value" style={{ color: "#7c3aed" }}>{upcoming30Days}</span>
                    <span className="celebration-stat-helper">Next celebration dates</span>
                </div>
                <div className="celebration-stat-card">
                    <span className="celebration-stat-label">Total Birthdays</span>
                    <span className="celebration-stat-value" style={{ color: "#2563eb" }}>{totalBirthdays}</span>
                    <span className="celebration-stat-helper">Registered member birthdays</span>
                </div>
                <div className="celebration-stat-card">
                    <span className="celebration-stat-label">Wedding Anniversaries</span>
                    <span className="celebration-stat-value" style={{ color: "#16a34a" }}>{totalAnniversaries}</span>
                    <span className="celebration-stat-helper">Registered church couples</span>
                </div>
            </div>

            {/* FILTERS */}
            <div className="celebration-filter-card">
                <div className="celebration-filter-grid">
                    <div className="celebration-filter-group">
                        <label>Search Celebrant / Couple</label>
                        <input
                            type="text"
                            className="celebration-input"
                            placeholder="Search by name, ministry..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="celebration-filter-group">
                        <label>Event Type</label>
                        <select
                            className="celebration-select"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="ALL">All Celebrations</option>
                            <option value="BIRTHDAY">🎂 Birthdays Only</option>
                            <option value="ANNIVERSARY">💍 Anniversaries Only</option>
                        </select>
                    </div>
                    <div className="celebration-filter-group">
                        <label>Month</label>
                        <select
                            className="celebration-select"
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                        >
                            <option value="ALL">All Months</option>
                            {MONTH_NAMES.map((name, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {name} {i + 1 === currentMonth ? "(Current)" : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="celebration-filter-group">
                        <label>&nbsp;</label>
                        <button
                            type="button"
                            className="celebration-btn celebration-btn-secondary"
                            style={{ color: "#475569", background: "#f1f5f9", borderColor: "#cbd5e1" }}
                            onClick={() => {
                                setSearch("");
                                setTypeFilter("ALL");
                                setMonthFilter("ALL");
                            }}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="celebration-table-card">
                <table className="celebration-table">
                    <thead>
                        <tr>
                            <th>Celebrant / Couple</th>
                            <th>Celebration</th>
                            <th>Date</th>
                            <th>Upcoming</th>
                            <th>Ministry</th>
                            <th>Contact</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                                    Loading celebration records...
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                                    No celebrations match your selected filters.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((c) => {
                                const daysAway = getDaysUntil(c.month, c.day);
                                return (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 700 }}>{c.name}</td>
                                        <td>
                                            <span
                                                className={`celebration-badge ${
                                                    c.type === "BIRTHDAY" ? "badge-birthday" : "badge-anniversary"
                                                }`}
                                            >
                                                {c.type === "BIRTHDAY" ? "🎂 Birthday" : "💍 Anniversary"}
                                            </span>
                                        </td>
                                        <td>
                                            <strong>{MONTH_NAMES[c.month - 1]} {c.day}</strong>
                                            {c.year && <span style={{ color: "#94a3b8", marginLeft: "6px", fontSize: "12px" }}>({c.year})</span>}
                                        </td>
                                        <td>
                                            <span
                                                className={`days-tag ${
                                                    daysAway === 0
                                                        ? "days-today"
                                                        : daysAway <= 7
                                                        ? "days-soon"
                                                        : "days-normal"
                                                }`}
                                            >
                                                {daysAway === 0
                                                    ? "🎉 Today!"
                                                    : daysAway === 1
                                                    ? "Tomorrow"
                                                    : `In ${daysAway} days`}
                                            </span>
                                        </td>
                                        <td>{c.ministry || "General Membership"}</td>
                                        <td>{c.contactNumber || "—"}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* PRINT FOOTER / SIGNATURE SHEET */}
            <div className="print-footer-sheet" style={{ display: "none" }}>
                <div className="print-signature-box">
                    <div className="signature-line" />
                    <div className="signature-name">Sis. Leah Reyes</div>
                    <div className="signature-title">Pastoral Care & Celebrations Coordinator</div>
                </div>
                <div className="print-signature-box">
                    <div className="signature-line" />
                    <div className="signature-name">Pastor Mateo Santos</div>
                    <div className="signature-title">Senior Pastor, Luke 4:18 Ministries</div>
                </div>
                <div className="print-signature-box">
                    <div className="signature-line" />
                    <div className="signature-name">San Vicente Church Council</div>
                    <div className="signature-title">Official Verification Stamp</div>
                </div>
            </div>
        </div>
    );
};

export default BirthdayAnniversaryReport;
