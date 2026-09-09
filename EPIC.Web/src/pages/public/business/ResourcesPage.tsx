import { useState, useMemo } from "react";
import PublicHeader from "../../../components/PublicHeader";
import {
    BookOpen,
    FileText,
    Download,
    CheckCircle2,
    Search,
    X,
    ShieldCheck,
    Scale,
    Users,
    Music,
    DollarSign,
    Eye,
    ArrowRight,
    Sparkles,
    Check,
} from "lucide-react";
import "./ResourcesPage.css";

interface ResourcesPageProps {
    onNavigate?: (page: string) => void;
}

export interface MinistryResource {
    id: string;
    title: string;
    category: "governance" | "leadership" | "discipleship" | "worship" | "financial";
    categoryLabel: string;
    fileType: string;
    fileSize: string;
    pagesCount: string;
    badge?: string;
    description: string;
    highlights: string[];
    synopsis: string;
    tableOfContents: string[];
    fileName: string;
}

const MINISTRY_RESOURCES: MinistryResource[] = [
    {
        id: "res-church-bylaws",
        title: "Church Constitution, Bylaws & Governance Manual",
        category: "governance",
        categoryLabel: "GOVERNANCE & LEGAL",
        fileType: "DOCX / PDF",
        fileSize: "2.4 MB",
        pagesCount: "38 Pages",
        badge: "ESSENTIAL LEGAL",
        description:
            "A comprehensive, legally compliant constitution and bylaws framework for independent and evangelical churches. Covers elder boards, voting rights, and asset protection.",
        highlights: [
            "Elder Board & Trustee governance and authority boundaries",
            "Pastoral tenure, compensation review and transition protocols",
            "Official membership admission, discipline and voting guidelines",
        ],
        synopsis:
            "Designed to safeguard your ministry against legal vulnerabilities, this template provides clear operational bylaws aligned with statutory non-profit governance requirements.",
        tableOfContents: [
            "Article I: Name, Purpose & Statement of Faith",
            "Article II: Membership Qualifications, Rights & Discipline",
            "Article III: Pastoral Office, Call & Dissolution",
            "Article IV: Board of Elders & Deacons Selection & Duties",
            "Article V: Business Meetings, Quorums & Voting Rules",
            "Article VI: Property, Financial Safeguards & Dissolution",
        ],
        fileName: "EPIC-Church-Constitution-and-Bylaws-Template.docx",
    },
    {
        id: "res-child-safety",
        title: "Volunteer Safety & Child Protection Policy Manual",
        category: "governance",
        categoryLabel: "GOVERNANCE & LEGAL",
        fileType: "PDF / DOCX",
        fileSize: "1.8 MB",
        pagesCount: "24 Pages",
        badge: "SAFETY COMPLIANCE",
        description:
            "Standard operating procedures for Sunday School, nurseries, and youth camps. Enforces two-adult supervision, digital check-in protocols, and background checks.",
        highlights: [
            "Strict two-adult supervision rule and nursery check-in protocols",
            "Background screening procedures and disqualifying criteria",
            "Mandatory incident reporting templates and emergency contacts",
        ],
        synopsis:
            "A zero-compromise policy manual ensuring child safety across all church facilities, transport activities, Sunday School classrooms, and off-site retreats.",
        tableOfContents: [
            "Section 1: Volunteer Screening & Background Verification",
            "Section 2: Classroom Ratios, Restroom Policies & Supervision",
            "Section 3: Electronic Check-In, Tagging & Secure Dismissal",
            "Section 4: Medical Authorization & Allergy Precautions",
            "Section 5: Incident Investigation & Mandatory Reporting Protocol",
        ],
        fileName: "EPIC-Child-Protection-and-Volunteer-Safety-Manual.pdf",
    },
    {
        id: "res-pastoral-counseling",
        title: "Biblical Pastoral Counseling & Confidentiality Intake Rubric",
        category: "leadership",
        categoryLabel: "PASTORAL LEADERSHIP",
        fileType: "PDF / DOCX",
        fileSize: "1.2 MB",
        pagesCount: "18 Pages",
        badge: "PASTORAL CARE",
        description:
            "Pastoral counseling intake questionnaires, biblical confidentiality consent forms, counseling progress logs, and professional psychiatric referral protocols.",
        highlights: [
            "Client intake questionnaire and spiritual assessment rubric",
            "Confidentiality release agreement and legal reporting boundaries",
            "Step-by-step referral workflow for clinical psychiatric needs",
        ],
        synopsis:
            "Equips pastoral staff and lay counselors with structured, confidential forms that balance spiritual care with legal awareness and accountability.",
        tableOfContents: [
            "Chapter 1: Pastoral Counseling Ethics & Confidentiality Scope",
            "Chapter 2: Intake Form & Personal History Questionnaire",
            "Chapter 3: Session Progress Tracking & Growth Action Plan",
            "Chapter 4: Referral Criteria for Licensed Medical Professionals",
            "Appendix: Consent to Counsel & Liability Release Waiver",
        ],
        fileName: "EPIC-Pastoral-Counseling-Intake-and-Rubrics.pdf",
    },
    {
        id: "res-sermon-calendar",
        title: "Expository Sermon Architecture & 52-Week Preaching Calendar",
        category: "leadership",
        categoryLabel: "PASTORAL LEADERSHIP",
        fileType: "DOCX / XLSX",
        fileSize: "3.1 MB",
        pagesCount: "28 Pages",
        badge: "PREACHING SYSTEM",
        description:
            "Annual pulpit roadmap covering liturgical milestones, thematic sermon series planning, exegetical manuscript templates, and sermon slide coordinate worksheets.",
        highlights: [
            "The Hook-Book-Look-Took sermon manuscript structural template",
            "Full 52-week thematic and expository preaching calendar",
            "Original language Greek & Hebrew word study worksheet",
        ],
        synopsis:
            "Eliminate pulpit fatigue with a year-long preaching roadmap that helps pastors study ahead, coordinate sermon graphics, and balance systematic biblical exposition.",
        tableOfContents: [
            "Part 1: The Expository Hermeneutical Blueprint",
            "Part 2: 52-Week Preaching Grid (Themes, Scriptures, Holidays)",
            "Part 3: Sermon Preparation Worksheet & Illustration Catalog",
            "Part 4: Slide & Visual Media Production Cue Sheet",
        ],
        fileName: "EPIC-Expository-Preaching-Calendar-and-Framework.docx",
    },
    {
        id: "res-new-believers",
        title: "New Believers 4-Week Foundation Study & Discipleship Guide",
        category: "discipleship",
        categoryLabel: "DISCIPLESHIP & SMALL GROUPS",
        fileType: "PDF / DOCX",
        fileSize: "4.5 MB",
        pagesCount: "44 Pages",
        badge: "FOUNDATIONAL DISCIPLESHIP",
        description:
            "Printable 4-week discipleship manual covering Assurance of Salvation, The Holy Spirit, Prayer & Scripture, and Water Baptism with small group leader notes.",
        highlights: [
            "Fill-in-the-blank student workbook with scripture memorization",
            "Group leader facilitator guides and discussion prompt keys",
            "Daily devotional journaling sheets for first 30 days of faith",
        ],
        synopsis:
            "A plug-and-play discipleship curriculum designed for 1-on-1 mentorship or cell group studies, helping newly converted Christians establish unshakeable roots in Christ.",
        tableOfContents: [
            "Week 1: Saved by Grace - Assurance & Forgiveness in Christ",
            "Week 2: Living by the Spirit - Overcoming Temptation & New Life",
            "Week 3: Daily Communion - The Power of Scripture and Prayer",
            "Week 4: The Church Family - Baptism, Giving and God's Purpose",
        ],
        fileName: "EPIC-New-Believers-4-Week-Foundation-Curriculum.pdf",
    },
    {
        id: "res-fasting-prayer",
        title: "21-Day Corporate Fasting & Intercessory Prayer Devotional",
        category: "discipleship",
        categoryLabel: "DISCIPLESHIP & SMALL GROUPS",
        fileType: "PDF",
        fileSize: "2.9 MB",
        pagesCount: "32 Pages",
        badge: "SPIRITUAL RENEWAL",
        description:
            "Church-wide corporate prayer guide featuring daily devotional readings, focused prayer targets for families, community harvest, and spiritual revival.",
        highlights: [
            "21 daily devotional scriptures with guided intercessory declarations",
            "Biblical guidelines on Daniel fasting, liquid fasts, and safety",
            "Dedicated prayer targets for youth, city leaders, and church health",
        ],
        synopsis:
            "Mobilize your entire congregation into united prayer and fasting at the start of the year or before major evangelistic crusades.",
        tableOfContents: [
            "Guide: Understanding Biblical Fasting, Motives and Health Precautions",
            "Days 1-7: Consecration, Personal Repentance & Cleansing",
            "Days 8-14: Families, Marriages, Children & Future Generations",
            "Days 15-21: The Church, Lost Souls, Nations & Kingdom Expansion",
        ],
        fileName: "EPIC-21-Day-Fasting-and-Prayer-Guide.pdf",
    },
    {
        id: "res-sunday-runsheet",
        title: "Sunday Service Production Run-Sheet & Audio-Visual Cue Sheet",
        category: "worship",
        categoryLabel: "WORSHIP & PRODUCTION",
        fileType: "XLSX / PDF",
        fileSize: "950 KB",
        pagesCount: "4 Sheets",
        badge: "PRODUCTION TIMING",
        description:
            "Minute-by-minute order of service timing templates with dedicated channels for Audio FOH, Stage Lighting cues, ProPresenter slides, and Live Stream broadcast.",
        highlights: [
            "Automated countdown formulas in Excel calculating remaining service time",
            "Dedicated cue channels for pastor mic, band transitions, and video clips",
            "Pre-service 60-minute production checklist for broadcast teams",
        ],
        synopsis:
            "Achieve seamless, distraction-free Sunday worship experiences with synchronized communication across stage managers, audio engineers, and projectionists.",
        tableOfContents: [
            "Sheet 1: Master Service Order & Minute-by-Minute Timeline",
            "Sheet 2: Stage & AV Cue Sheet (Lighting, Mic, Screen Triggers)",
            "Sheet 3: Live Stream Broadcast Switcher Cues & Lower-Thirds",
            "Sheet 4: Post-Service Production Review & Log Form",
        ],
        fileName: "EPIC-Sunday-Service-Production-Runsheet.xlsx",
    },
    {
        id: "res-worship-handbook",
        title: "Worship Team Operating Manual & Musician Audition Rubric",
        category: "worship",
        categoryLabel: "WORSHIP & PRODUCTION",
        fileType: "PDF / DOCX",
        fileSize: "1.7 MB",
        pagesCount: "16 Pages",
        badge: "WORSHIP STANDARDS",
        description:
            "Standards of excellence for vocalists, instrumentalists, and sound crew. Includes green room etiquette, spiritual expectations, and objective audition scoring.",
        highlights: [
            "Objective 5-metric vocal and instrumental audition assessment rubric",
            "Rehearsal attendance, stage attire, and spiritual integrity standards",
            "Nashville Number System primer and chord sheet standard conventions",
        ],
        synopsis:
            "Clarify expectations, resolve team friction, and maintain spiritual depth on the platform with an official worship team handbook.",
        tableOfContents: [
            "Section 1: The Heart of Worship - Biblical Theology of Praise",
            "Section 2: Team Commitments, Punctuality & Stage Etiquette",
            "Section 3: Audition Workflow & Skill Evaluation Rubric",
            "Section 4: Sound Check SOP & IEM (In-Ear Monitor) Protocols",
        ],
        fileName: "EPIC-Worship-Team-Handbook-and-Audition-Rubric.pdf",
    },
    {
        id: "res-tithe-audit",
        title: "Tithes & Offering Counting Team Audit Checklist & Log",
        category: "financial",
        categoryLabel: "FINANCIAL STEWARDSHIP",
        fileType: "PDF / XLSX",
        fileSize: "1.1 MB",
        pagesCount: "10 Pages",
        badge: "FINANCIAL INTEGRITY",
        description:
            "Dual-counter verification sheets, currency breakdown tally sheets, numbered envelope logs, and bank deposit reconciliation templates protecting pastoral integrity.",
        highlights: [
            "Mandatory dual-sign-off custody protocol preventing discrepancies",
            "Currency denomination calculator and digital giving audit trail",
            "Quarterly internal finance committee audit verification checklist",
        ],
        synopsis:
            "Protect your church leadership against suspicion or mishandling with rigorous, transparent offering tally sheets and internal audit protocols.",
        tableOfContents: [
            "Form A: Dual-Custody Offering Box Collection Sign-Off",
            "Form B: Cash & Coin Denomination Breakdown Sheet",
            "Form C: Numbered Envelope Tithe Ledger & Check Record",
            "Form D: Bank Deposit Slip Verification & Safe Custody Form",
            "Form E: Quarterly Audit Committee Review Worksheet",
        ],
        fileName: "EPIC-Tithes-and-Offering-Audit-Tally-Sheets.xlsx",
    },
    {
        id: "res-annual-budget",
        title: "Church Annual Operating Budget Model & Petty Cash System",
        category: "financial",
        categoryLabel: "FINANCIAL STEWARDSHIP",
        fileType: "XLSX / DOCX",
        fileSize: "2.1 MB",
        pagesCount: "8 Sheets",
        badge: "STEWARDSHIP MODEL",
        description:
            "Comprehensive Excel budget model with departmental allocations (Missions, Facilities, Pastoral, Youth, Media) and printable petty cash voucher forms.",
        highlights: [
            "Automated departmental variance formulas (Budget vs Actual Spend)",
            "Missions giving and benevolence fund allocation calculation tables",
            "Ready-to-print official church reimbursement vouchers and receipts",
        ],
        synopsis:
            "Give your church board, treasurer, and congregation clear, professional financial projections and spending accountability throughout the fiscal year.",
        tableOfContents: [
            "Sheet 1: Executive Summary & Projected vs Actual Revenue",
            "Sheet 2: Departmental Budget Allocations (Missions, Worship, Admin)",
            "Sheet 3: Capital Expenditure & Building Maintenance Reserve",
            "Sheet 4: Petty Cash Voucher Template & Disbursement Log",
        ],
        fileName: "EPIC-Church-Annual-Budget-Model-and-Petty-Cash.xlsx",
    },
];

export default function ResourcesPage({ onNavigate }: ResourcesPageProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [previewResource, setPreviewResource] = useState<MinistryResource | null>(null);
    const [downloadToast, setDownloadToast] = useState<string | null>(null);

    const categories = [
        { id: "all", label: "All Toolkits" },
        { id: "governance", label: "Governance & Legal" },
        { id: "leadership", label: "Pastoral Leadership" },
        { id: "discipleship", label: "Discipleship Curricula" },
        { id: "worship", label: "Worship & Production" },
        { id: "financial", label: "Financial Stewardship" },
    ];

    const filteredResources = useMemo(() => {
        return MINISTRY_RESOURCES.filter((res) => {
            const matchesCategory =
                selectedCategory === "all" || res.category === selectedCategory;

            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                res.title.toLowerCase().includes(q) ||
                res.description.toLowerCase().includes(q) ||
                res.highlights.some((h) => h.toLowerCase().includes(q)) ||
                res.categoryLabel.toLowerCase().includes(q);

            return matchesCategory && matchesSearch;
        });
    }, [selectedCategory, searchQuery]);

    const handleDownload = (resource: MinistryResource) => {
        // Trigger simulated file download
        const blob = new Blob(
            [
                `====================================================\n` +
                `EPIC CHURCH MANAGEMENT SYSTEM - OFFICIAL TOOLKIT\n` +
                `====================================================\n\n` +
                `TITLE: ${resource.title}\n` +
                `CATEGORY: ${resource.categoryLabel}\n` +
                `FORMAT: ${resource.fileType}\n` +
                `SIZE: ${resource.fileSize}\n\n` +
                `SYNOPSIS:\n${resource.synopsis}\n\n` +
                `OUTLINE & TABLE OF CONTENTS:\n` +
                resource.tableOfContents.map((t, idx) => `${idx + 1}. ${t}`).join(`\n`) +
                `\n\nKEY HIGHLIGHTS:\n` +
                resource.highlights.map((h) => `* ${h}`).join(`\n`) +
                `\n\n====================================================\n` +
                `For full enterprise church management software and automated cloud features, visit: https://epicchurchmanagement.com\n` +
                `====================================================\n`
            ],
            { type: "text/plain;charset=utf-8" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = resource.fileName.replace(/\.(pdf|docx|xlsx)$/i, ".txt");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setDownloadToast(resource.title);
        setTimeout(() => setDownloadToast(null), 4000);
    };

    const getCategoryIcon = (category: MinistryResource["category"]) => {
        switch (category) {
            case "governance":
                return <Scale size={22} />;
            case "leadership":
                return <ShieldCheck size={22} />;
            case "discipleship":
                return <Users size={22} />;
            case "worship":
                return <Music size={22} />;
            case "financial":
                return <DollarSign size={22} />;
            default:
                return <FileText size={22} />;
        }
    };

    return (
        <div className="epic-resources-page">
            <PublicHeader onNavigate={onNavigate} />

            {/* HERO */}
            <section className="resources-hero">
                <div className="resources-container">
                    <div className="resources-hero-badge">
                        <Sparkles size={15} />
                        <span>EPIC MINISTRY RESOURCES &amp; TOOLKITS</span>
                    </div>

                    <h1>
                        Free Church Leadership Toolkits,{" "}
                        <span className="resources-hero-highlight">Legal Templates &amp; Manuals</span>
                    </h1>

                    <p className="resources-hero-desc">
                        Equipping pastors, administrators, and ministry directors with ready-to-use
                        governance bylaws, discipleship curricula, financial audit sheets, and worship production run-sheets.
                    </p>

                    {/* SEARCH & FILTERS */}
                    <div className="resources-toolbar">
                        <div className="resources-search-box">
                            <Search className="resources-search-icon" size={20} />
                            <input
                                type="text"
                                className="resources-search-input"
                                placeholder="Search by title, keyword, or document type (e.g. bylaws, sermon, audit)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="resources-search-clear"
                                    onClick={() => setSearchQuery("")}
                                    title="Clear search"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <nav className="resources-categories-nav">
                            {categories.map((cat) => {
                                const count =
                                    cat.id === "all"
                                        ? MINISTRY_RESOURCES.length
                                        : MINISTRY_RESOURCES.filter((r) => r.category === cat.id).length;

                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        className={`category-pill ${
                                            selectedCategory === cat.id ? "active" : ""
                                        }`}
                                        onClick={() => setSelectedCategory(cat.id)}
                                    >
                                        <span>{cat.label}</span>
                                        <span className="category-pill-count">{count}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </section>

            {/* MAIN CONTENT */}
            <main className="resources-main-content">
                <div className="resources-container">
                    <div className="resources-results-summary">
                        <span>
                            Showing <strong>{filteredResources.length}</strong> available{" "}
                            {filteredResources.length === 1 ? "resource" : "resources"}
                        </span>
                        {selectedCategory !== "all" && (
                            <button
                                type="button"
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#1877f2",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontSize: "0.875rem",
                                }}
                                onClick={() => setSelectedCategory("all")}
                            >
                                Show All Toolkits
                            </button>
                        )}
                    </div>

                    {filteredResources.length === 0 ? (
                        <div className="resources-empty-state">
                            <div className="resources-empty-icon">
                                <BookOpen size={28} />
                            </div>
                            <h3>No resources matched your search</h3>
                            <p>
                                Try adjusting your keywords or clearing the category filter to view all toolkits.
                            </p>
                            <button
                                type="button"
                                className="resources-reset-btn"
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedCategory("all");
                                }}
                            >
                                Reset Search Filters
                            </button>
                        </div>
                    ) : (
                        <div className="resources-grid">
                            {filteredResources.map((res) => (
                                <article key={res.id} className="resource-card">
                                    <div className="resource-card-header">
                                        <div className={`resource-icon-wrap ${res.category}`}>
                                            {getCategoryIcon(res.category)}
                                        </div>
                                        <div className="resource-format-badges">
                                            {res.badge && (
                                                <span className="resource-popular-badge">
                                                    {res.badge}
                                                </span>
                                            )}
                                            <span className="resource-format-badge">
                                                {res.fileType}
                                            </span>
                                        </div>
                                    </div>

                                    <span className="resource-category-label">
                                        {res.categoryLabel}
                                    </span>

                                    <h3 className="resource-title">{res.title}</h3>

                                    <p className="resource-desc">{res.description}</p>

                                    <ul className="resource-highlights">
                                        {res.highlights.map((item, idx) => (
                                            <li key={idx} className="resource-highlight-item">
                                                <CheckCircle2
                                                    size={15}
                                                    className="resource-check-icon"
                                                />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="resource-meta">
                                        <span className="resource-meta-item">
                                            📄 {res.pagesCount}
                                        </span>
                                        <span>•</span>
                                        <span className="resource-meta-item">
                                            💾 {res.fileSize}
                                        </span>
                                    </div>

                                    <div className="resource-actions">
                                        <button
                                            type="button"
                                            className="resource-btn-primary"
                                            onClick={() => handleDownload(res)}
                                        >
                                            <Download size={16} />
                                            <span>Download Free</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="resource-btn-secondary"
                                            onClick={() => setPreviewResource(res)}
                                        >
                                            <Eye size={15} />
                                            <span>Preview</span>
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* PREVIEW MODAL */}
            {previewResource && (
                <div
                    className="resource-modal-overlay"
                    onClick={() => setPreviewResource(null)}
                >
                    <div
                        className="resource-modal-card"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="resource-modal-header">
                            <div className="resource-modal-title-group">
                                <div
                                    className={`resource-icon-wrap ${previewResource.category}`}
                                    style={{ width: 38, height: 38 }}
                                >
                                    {getCategoryIcon(previewResource.category)}
                                </div>
                                <div>
                                    <span className="resource-category-label" style={{ marginBottom: 2 }}>
                                        {previewResource.categoryLabel}
                                    </span>
                                    <h3
                                        style={{
                                            margin: 0,
                                            fontSize: "1.125rem",
                                            fontWeight: 700,
                                            color: "#050505",
                                        }}
                                    >
                                        {previewResource.title}
                                    </h3>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="resource-modal-close"
                                onClick={() => setPreviewResource(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="resource-modal-body">
                            <div className="resource-modal-synopsis">
                                <strong>Overview &amp; Practical Purpose:</strong>
                                <p style={{ margin: "6px 0 0 0" }}>
                                    {previewResource.synopsis}
                                </p>
                            </div>

                            <div className="resource-modal-section-title">
                                Table of Contents &amp; Modules Included
                            </div>

                            <ul className="resource-modal-toc">
                                {previewResource.tableOfContents.map((toc, idx) => (
                                    <li key={idx} className="resource-modal-toc-item">
                                        <Check size={16} color="#1877f2" />
                                        <span>{toc}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="resource-modal-section-title">
                                Document Specifications
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 12,
                                    background: "#f0f2f5",
                                    padding: 14,
                                    borderRadius: 8,
                                    fontSize: "0.875rem",
                                }}
                            >
                                <div>
                                    <span style={{ color: "#65676b" }}>File Format: </span>
                                    <strong>{previewResource.fileType}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#65676b" }}>Length: </span>
                                    <strong>{previewResource.pagesCount}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#65676b" }}>File Size: </span>
                                    <strong>{previewResource.fileSize}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#65676b" }}>License: </span>
                                    <strong>Free Ministry Use</strong>
                                </div>
                            </div>
                        </div>

                        <div className="resource-modal-footer">
                            <button
                                type="button"
                                className="resource-btn-secondary"
                                onClick={() => setPreviewResource(null)}
                            >
                                Close Preview
                            </button>
                            <button
                                type="button"
                                className="resource-btn-primary"
                                style={{ flex: "none", padding: "10px 24px" }}
                                onClick={() => {
                                    handleDownload(previewResource);
                                    setPreviewResource(null);
                                }}
                            >
                                <Download size={16} />
                                <span>Download Document Now</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DOWNLOAD TOAST */}
            {downloadToast && (
                <div className="resource-toast">
                    <CheckCircle2 size={20} className="resource-toast-check" />
                    <span>Downloaded: {downloadToast}</span>
                </div>
            )}

            {/* CTA BANNER */}
            <section className="resources-cta-banner">
                <div className="resources-container">
                    <div className="resources-cta-box">
                        <div className="resources-cta-text">
                            <h2>Looking for Full Church Operations Automation?</h2>
                            <p>
                                Power your entire church with QR code member check-in, real-time tithes &amp; offerings
                                ledgers, digital course learning, and volunteer scheduling.
                            </p>
                        </div>
                        <div className="resources-cta-buttons">
                            <button
                                type="button"
                                className="cta-btn-light"
                                onClick={() => onNavigate?.("platform")}
                            >
                                Explore Platform <ArrowRight size={16} />
                            </button>
                            <button
                                type="button"
                                className="cta-btn-outline"
                                onClick={() => onNavigate?.("store")}
                            >
                                Visit Digital Store
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="resources-footer">
                <div className="resources-container">
                    <p>
                        &copy; {new Date().getFullYear()} EPIC Church Management System. All ministry resources are provided free to equip the Body of Christ.
                    </p>
                </div>
            </footer>
        </div>
    );
}