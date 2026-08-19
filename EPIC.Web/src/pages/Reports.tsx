import React, { useMemo, useState } from "react";

import "./Reports.css";
import MembershipDirectoryReport from "./reports/MembershipDirectoryReport";


// =========================================================
// TYPES
// =========================================================

export type ReportCategory =
    | "Membership"
    | "Attendance"
    | "Visitors"
    | "Giving"
    | "Finance"
    | "Ministries"
    | "Church Services"
    | "EPIC Learning";

export interface ReportsProps {
    onOpenAttendanceReport?: () => void;
    onOpenAttendanceByDate?: () => void;
}

interface ReportDefinition {
    id: string;
    title: string;
    description: string;
    category: ReportCategory;
    icon: string;
}

interface FormDefinition {
    id: string;
    title: string;
    description: string;
    icon: string;
}

// =========================================================
// REPORT DEFINITIONS
// =========================================================

const REPORTS: ReportDefinition[] = [

    // =====================================================
    // MEMBERSHIP
    // =====================================================

    {
        id: "membership-directory",
        title: "Membership Directory",
        description:
            "Complete directory of church members and their basic information.",
        category: "Membership",
        icon: "👥"
    },

    {
        id: "active-members",
        title: "Active Members",
        description:
            "List of currently active church members.",
        category: "Membership",
        icon: "✅"
    },

    {
        id: "birthday-report",
        title: "Birthdays & Anniversaries",
        description:
            "View upcoming member birthdays and wedding anniversaries.",
        category: "Membership",
        icon: "🎂"
    },

    {
        id: "family-report",
        title: "Family / Household Report",
        description:
            "Generate a report of members grouped by family or household.",
        category: "Membership",
        icon: "🏠"
    },

    // =====================================================
    // ATTENDANCE
    // =====================================================

    {
        id: "attendance-summary",
        title: "Attendance Summary",
        description:
            "Summary of attendance records across church services.",
        category: "Attendance",
        icon: "📊"
    },

    {
        id: "attendance-date",
        title: "Attendance by Date",
        description:
            "View attendance records for a selected date or date range.",
        category: "Attendance",
        icon: "📅"
    },

    {
        id: "member-attendance",
        title: "Member Attendance History",
        description:
            "Review individual member attendance performance.",
        category: "Attendance",
        icon: "✓"
    },

    // =====================================================
    // VISITORS
    // =====================================================

    {
        id: "visitor-report",
        title: "Visitors Report",
        description:
            "Complete visitor records and follow-up information.",
        category: "Visitors",
        icon: "🚪"
    },

    // =====================================================
    // GIVING
    // =====================================================

    {
        id: "giving-report",
        title: "Giving Report",
        description:
            "Generate giving, tithe and offering reports.",
        category: "Giving",
        icon: "₱"
    },

    // =====================================================
    // FINANCE
    // =====================================================

    {
        id: "income-report",
        title: "Income Report",
        description:
            "Detailed church income records and summaries.",
        category: "Finance",
        icon: "↗"
    },

    {
        id: "expense-report",
        title: "Expense Report",
        description:
            "Detailed church expense records and summaries.",
        category: "Finance",
        icon: "↘"
    },

    {
        id: "financial-summary",
        title: "Income vs Expenses",
        description:
            "Compare church income and expenses for a selected period.",
        category: "Finance",
        icon: "📈"
    },

    // =====================================================
    // MINISTRIES
    // =====================================================

    {
        id: "ministries-report",
        title: "Ministry Membership",
        description:
            "Members assigned to ministries and ministry groups.",
        category: "Ministries",
        icon: "♫"
    },

    // =====================================================
    // CHURCH SERVICES
    // =====================================================

    {
        id: "services-report",
        title: "Church Services Report",
        description:
            "Church services, schedules and service records.",
        category: "Church Services",
        icon: "⛪"
    },

    // =====================================================
    // EPIC LEARNING
    // =====================================================

    {
        id: "learning-report",
        title: "Learning Progress",
        description:
            "Course enrollment, lesson progress and completion reports.",
        category: "EPIC Learning",
        icon: "📚"
    }
];

// =========================================================
// CATEGORIES
// =========================================================

const CATEGORIES: Array<{
    name: ReportCategory | "All";
    icon: string;
}> = [

    {
        name: "All",
        icon: "▦"
    },

    {
        name: "Membership",
        icon: "👥"
    },

    {
        name: "Attendance",
        icon: "✓"
    },

    {
        name: "Visitors",
        icon: "🚪"
    },

    {
        name: "Giving",
        icon: "₱"
    },

    {
        name: "Finance",
        icon: "💰"
    },

    {
        name: "Ministries",
        icon: "♫"
    },

    {
        name: "Church Services",
        icon: "⛪"
    },

    {
        name: "EPIC Learning",
        icon: "📚"
    }
];

// =========================================================
// FORMS
// =========================================================

const FORMS: FormDefinition[] = [

    {
        id: "membership-registration",
        title: "New Member Registration",
        description:
            "Standard church membership registration form.",
        icon: "📝"
    },

    {
        id: "membership-information",
        title: "Membership Information Form",
        description:
            "Detailed member information and contact details.",
        icon: "👤"
    },

    {
        id: "family-information",
        title: "Family Information Form",
        description:
            "Family and household information form.",
        icon: "🏠"
    },

    {
        id: "visitor-card",
        title: "Visitor Information Card",
        description:
            "Ready-made visitor connection card.",
        icon: "🚪"
    },

    {
        id: "ministry-volunteer",
        title: "Ministry Volunteer Form",
        description:
            "Application for members who want to serve in a ministry.",
        icon: "🤝"
    },

    {
        id: "ministry-assignment",
        title: "Ministry Assignment Form",
        description:
            "Document ministry assignments and responsibilities.",
        icon: "📋"
    },

    {
        id: "baptism",
        title: "Baptism Information Form",
        description:
            "Baptism applicant information and documentation.",
        icon: "🙏"
    },

    {
        id: "child-dedication",
        title: "Child Dedication Form",
        description:
            "Child dedication information and parent details.",
        icon: "👶"
    },

    {
        id: "marriage",
        title: "Marriage Information Form",
        description:
            "Marriage counseling and church wedding information.",
        icon: "💍"
    }
];

// =========================================================
// COMPONENT
// =========================================================

const Reports: React.FC<ReportsProps> = ({
    onOpenAttendanceReport,
    onOpenAttendanceByDate
}) => {

    // =====================================================
    // STATE
    // =====================================================
    const [
        showMembershipDirectory,
        setShowMembershipDirectory
    ] = useState(false);

    const [
        activeCategory,
        setActiveCategory
    ] = useState<ReportCategory | "All">("All");

    const [
        search,
        setSearch
    ] = useState("");

    const [
        activeTab,
        setActiveTab
    ] = useState<"reports" | "forms">("reports");

    // =====================================================
    // FILTER REPORTS
    // =====================================================

    const filteredReports = useMemo(() => {

        const query =
            search.trim().toLowerCase();

        return REPORTS.filter((report) => {

            const matchesCategory =
                activeCategory === "All" ||
                report.category === activeCategory;

            const matchesSearch =
                !query ||
                report.title
                    .toLowerCase()
                    .includes(query) ||
                report.description
                    .toLowerCase()
                    .includes(query) ||
                report.category
                    .toLowerCase()
                    .includes(query);

            return (
                matchesCategory &&
                matchesSearch
            );
        });

    }, [
        activeCategory,
        search
    ]);

    // =====================================================
    // PRINT
    // =====================================================

  

    // =====================================================
    // OPEN REPORT
    // =====================================================

    const handleOpenReport = (
        report: ReportDefinition
    ): void => {

        switch (report.id) {
            case "membership-directory":

                setShowMembershipDirectory(true);

                return;

            // =================================================
            // ATTENDANCE SUMMARY
            // =================================================

            case "attendance-summary":

                if (onOpenAttendanceReport) {

                    onOpenAttendanceReport();

                }

                return;

            // =================================================
            // ATTENDANCE BY DATE
            // =================================================

            case "attendance-date":

                if (onOpenAttendanceByDate) {

                    onOpenAttendanceByDate();

                } else {

                    console.warn(
                        "Reports: onOpenAttendanceByDate callback is not connected."
                    );

                }

                return;

            // =================================================
            // MEMBER ATTENDANCE
            // =================================================

            case "member-attendance":

                alert(
                    "Member Attendance History\n\n" +
                    "This report is available through the Member Attendance Report."
                );

                return;

            // =================================================
            // OTHER REPORTS
            // =================================================

            default:

                alert(
                    `${report.title}\n\n` +
                    "This report builder will be added in the next reporting phase."
                );

                return;
        }
    };

    // =====================================================
    // OPEN FORM
    // =====================================================

    const handleOpenForm = (
        form: FormDefinition
    ): void => {

        alert(
            `${form.title}\n\n` +
            "The printable form template will be added in the Forms & Documents phase."
        );

    };

    // =====================================================
    // RENDER
    // =====================================================
    if (showMembershipDirectory) {

        return (
            <MembershipDirectoryReport
                onBack={() =>
                    setShowMembershipDirectory(false)
                }
            />
        );
    }
    return (

        <div className="epic-reports">

            {/* =================================================
                HERO
            ================================================= */}

            <div className="reports-hero">

                <div className="reports-hero-content">

                    <div className="reports-hero-icon">
                        📊
                    </div>

                    <div>

                        <h1>
                            EPIC CHURCH Reports & Documents
                        </h1>

                        <p>
                            Generate church reports, printable
                            documents and ready-made forms from
                            one central location.
                        </p>

                    </div>

                </div>

                

            </div>

            {/* =================================================
                TABS
            ================================================= */}

            <div className="reports-tabs">

                <button
                    type="button"
                    className={
                        activeTab === "reports"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab("reports")
                    }
                >
                    📊 Reports
                </button>

                <button
                    type="button"
                    className={
                        activeTab === "forms"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab("forms")
                    }
                >
                    📝 Forms & Documents
                </button>

            </div>

            {/* =================================================
                REPORTS
            ================================================= */}

            {activeTab === "reports" && (

                <>

                    {/* =========================================
                        SEARCH
                    ========================================= */}

                    <div className="reports-toolbar">

                        <div className="reports-search">

                            <span>
                                🔎
                            </span>

                            <input
                                type="text"
                                placeholder="Search reports..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                    </div>

                    {/* =========================================
                        CATEGORIES
                    ========================================= */}

                    <div className="reports-category-bar">

                        {CATEGORIES.map((category) => (

                            <button
                                key={category.name}
                                type="button"
                                className={
                                    activeCategory ===
                                    category.name
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setActiveCategory(
                                        category.name
                                    )
                                }
                            >

                                <span>
                                    {category.icon}
                                </span>

                                {category.name}

                            </button>

                        ))}

                    </div>

                    {/* =========================================
                        SECTION HEADING
                    ========================================= */}

                    <div className="reports-section-heading">

                        <div>

                            <h2>
                                Available Reports
                            </h2>

                            <p>
                                Select a report to configure
                                filters and generate a printable
                                document.
                            </p>

                        </div>

                        <span className="reports-count">
                            {filteredReports.length} reports
                        </span>

                    </div>

                    {/* =========================================
                        REPORT GRID
                    ========================================= */}

                    {filteredReports.length > 0 ? (

                        <div className="reports-grid">

                            {filteredReports.map((report) => (

                                <button
                                    key={report.id}
                                    type="button"
                                    className="report-card"
                                    onClick={() =>
                                        handleOpenReport(
                                            report
                                        )
                                    }
                                    aria-label={`Open ${report.title}`}
                                >

                                    <div className="report-card-icon">
                                        {report.icon}
                                    </div>

                                    <div className="report-card-content">

                                        <span className="report-card-category">
                                            {report.category}
                                        </span>

                                        <h3>
                                            {report.title}
                                        </h3>

                                        <p>
                                            {report.description}
                                        </p>

                                    </div>

                                    <span className="report-card-arrow">
                                        →
                                    </span>

                                </button>

                            ))}

                        </div>

                    ) : (

                        <div className="reports-empty">

                            <div>
                                🔎
                            </div>

                            <h3>
                                No reports found
                            </h3>

                            <p>
                                Try another search term or
                                report category.
                            </p>

                        </div>

                    )}

                </>

            )}

            {/* =================================================
                FORMS
            ================================================= */}

            {activeTab === "forms" && (

                <>

                    <div className="reports-section-heading">

                        <div>

                            <h2>
                                Forms & Documents
                            </h2>

                            <p>
                                Ready-made church forms that can
                                be completed, printed and saved
                                as PDF.
                            </p>

                        </div>

                    </div>

                    <div className="reports-grid">

                        {FORMS.map((form) => (

                            <button
                                key={form.id}
                                type="button"
                                className="report-card"
                                onClick={() =>
                                    handleOpenForm(form)
                                }
                            >

                                <div className="report-card-icon">
                                    {form.icon}
                                </div>

                                <div className="report-card-content">

                                    <span className="report-card-category">
                                        FORM
                                    </span>

                                    <h3>
                                        {form.title}
                                    </h3>

                                    <p>
                                        {form.description}
                                    </p>

                                </div>

                                <span className="report-card-arrow">
                                    →
                                </span>

                            </button>

                        ))}

                    </div>

                </>

            )}

            {/* =================================================
                PRINT INFORMATION
            ================================================= */}

            <div className="reports-print-info">

                <div>
                    🖨
                </div>

                <div>

                    <strong>
                        Print & Save as PDF
                    </strong>

                    <p>
                        Every generated report and form will
                        support browser printing and{" "}
                        <strong>
                            Save as PDF
                        </strong>.
                    </p>

                </div>

            </div>

        </div>
    );
};

export default Reports;