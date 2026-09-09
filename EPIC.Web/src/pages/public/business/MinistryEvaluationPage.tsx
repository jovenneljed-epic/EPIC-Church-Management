import { useEffect, useState, useMemo } from "react";
import PublicHeader from "../../../components/PublicHeader";
import { getMinistryEvaluationDetail, getMinistryEvaluations } from "../../../services/ministryService";
import type { MinistryEvaluation, MinistryEvaluationDetail } from "../../../services/ministryService";
import {
    Activity,
    Calendar,
    Clock,
    MapPin,
    Users,
    CheckCircle2,
    ArrowRight,
    Search,
    TrendingUp,
    ShieldCheck,
    Sparkles,
    HeartHandshake,
    Music,
    Video,
    Smile,
    BookOpen
} from "lucide-react";
import "./MinistryEvaluationPage.css";
import "../PublicUnisonTheme.css";

interface DepartmentPreset {
    id: number;
    name: string;
    head: string;
    category: string;
    icon: string;
    healthScore: number;
    status: "EXEMPLARY" | "EXCELLENT" | "GROWING";
    meetingDay: string;
    meetingTime: string;
    location: string;
    description: string;
    totalVolunteers: number;
    rubric: {
        leadership: number;
        readiness: number;
        engagement: number;
        impact: number;
    };
    roster: { name: string; role: string; position: string }[];
    recentActivities: string[];
}

const PRESET_DEPARTMENTS: DepartmentPreset[] = [
    {
        id: 1,
        name: "Worship & Arts Ministry",
        head: "Bro. Marcus Vance",
        category: "Worship",
        icon: "music",
        healthScore: 96,
        status: "EXEMPLARY",
        meetingDay: "Thursdays & Sundays",
        meetingTime: "6:30 PM (Rehearsal) & 7:30 AM (Sound Check)",
        location: "Main Sanctuary & Band Room",
        description:
            "Leading the congregation in God-honoring, spirit-led praise and worship with musical excellence, theological precision, and humble hearts.",
        totalVolunteers: 24,
        rubric: {
            leadership: 5.0,
            readiness: 4.8,
            engagement: 4.7,
            impact: 4.9
        },
        roster: [
            { name: "Marcus Vance", role: "Ministry Director", position: "Worship Pastor / Acoustic" },
            { name: "Sarah Jenkins", role: "Vocal Coordinator", position: "Worship Leader" },
            { name: "David Chen", role: "Music Director", position: "Keyboards & Synth" },
            { name: "Elijah Torres", role: "Rhythm Section", position: "Drummer" },
            { name: "Chloe Santos", role: "Vocalist", position: "Alto Vocalist" },
            { name: "Nathan Morales", role: "Bass Guitarist", position: "Bassist" }
        ],
        recentActivities: [
            "Sunday Worship Set Rehearsal (4 Songs)",
            "Vocal Harmonization & In-Ear Monitor Workshop",
            "Quarterly Worship Team Prayer & Fasting Night"
        ]
    },
    {
        id: 2,
        name: "Ushers & Guest Hospitality",
        head: "Sis. Sarah Jenkins",
        category: "Hospitality",
        icon: "users",
        healthScore: 93,
        status: "EXEMPLARY",
        meetingDay: "Sundays",
        meetingTime: "8:00 AM & 1:00 PM (Briefing)",
        location: "Sanctuary Foyer & Welcome Kiosks",
        description:
            "Ensuring every person who steps into EPIC Church receives Christ's hospitality, comfortable seating, clear guidance, and warm welcoming care.",
        totalVolunteers: 32,
        rubric: {
            leadership: 4.8,
            readiness: 4.7,
            engagement: 4.6,
            impact: 4.8
        },
        roster: [
            { name: "Sarah Jenkins", role: "Head Usher", position: "Hospitality Lead" },
            { name: "Robert Flores", role: "Floor Captain", position: "Main Sanctuary Floor" },
            { name: "Grace Mendoza", role: "Greeting Lead", position: "Foyer Greeter" },
            { name: "Michael Tan", role: "Seating Officer", position: "Balcony & Overflow" }
        ],
        recentActivities: [
            "Sunday Guest Flow & Seating Optimization",
            "Emergency Evacuation & First Aid Orientation",
            "First-Time Visitor Welcome Pack Coordination"
        ]
    },
    {
        id: 3,
        name: "Media & Broadcast Production",
        head: "Bro. David Chen",
        category: "Production",
        icon: "video",
        healthScore: 95,
        status: "EXEMPLARY",
        meetingDay: "Saturdays & Sundays",
        meetingTime: "4:00 PM (Dry Run) & 7:00 AM (Broadcast Setup)",
        location: "Media Booth & Broadcast Control Room",
        description:
            "Delivering crystal-clear audio mixing, multicamera video livestreaming, lighting, and presentation graphics for Sunday gatherings.",
        totalVolunteers: 18,
        rubric: {
            leadership: 4.9,
            readiness: 4.9,
            engagement: 4.6,
            impact: 4.8
        },
        roster: [
            { name: "David Chen", role: "Media Director", position: "Technical Producer" },
            { name: "Daniel Reyes", role: "FOH Audio Engineer", position: "Sound Engineer" },
            { name: "Kristine Lim", role: "Livestream Director", position: "Video Switcher" },
            { name: "Leo Bautista", role: "Visual Projection", position: "Lyrics & Slides" }
        ],
        recentActivities: [
            "Multicamera Switcher & NDI Latency Calibration",
            "Live Stream Audio Mix Compression Tuning",
            "Media Volunteer Equipment Checklist Audit"
        ]
    },
    {
        id: 4,
        name: "Youth & Campus Ministry",
        head: "Ptr. Joshua Rivera",
        category: "NextGen",
        icon: "sparkles",
        healthScore: 92,
        status: "EXCELLENT",
        meetingDay: "Saturdays",
        meetingTime: "3:30 PM – 6:00 PM",
        location: "Youth Center & Gymnasium",
        description:
            "Reaching students, campuses, and young adults with the radical truth of Jesus Christ through genuine relationships, rallies, and mentorship.",
        totalVolunteers: 26,
        rubric: {
            leadership: 4.7,
            readiness: 4.5,
            engagement: 4.8,
            impact: 4.7
        },
        roster: [
            { name: "Joshua Rivera", role: "Youth Pastor", position: "Director" },
            { name: "Hannah Alcantara", role: "Campus Coordinator", position: "High School Lead" },
            { name: "Caleb Ramos", role: "College Director", position: "Young Adults Lead" },
            { name: "Bea Soriano", role: "Youth Worship Lead", position: "Band Coordinator" }
        ],
        recentActivities: [
            "Youth Encounter Camp 2026 Registration Launch",
            "Campus Prayer Outreach at Local High Schools",
            "NextGen Discipleship Huddle Series"
        ]
    },
    {
        id: 5,
        name: "Children's Church & Nursery",
        head: "Sis. Elena Cruz",
        category: "Family",
        icon: "smile",
        healthScore: 91,
        status: "EXCELLENT",
        meetingDay: "Sundays",
        meetingTime: "8:30 AM & 1:30 PM",
        location: "Kids Church Hall & Nursery Suite",
        description:
            "Providing a safe, joyful, and foundational Bible learning experience for infants through grade-school children during Sunday worship services.",
        totalVolunteers: 20,
        rubric: {
            leadership: 4.6,
            readiness: 4.7,
            engagement: 4.5,
            impact: 4.7
        },
        roster: [
            { name: "Elena Cruz", role: "Children's Director", position: "Preschool Lead" },
            { name: "Patricia Vega", role: "Elementary Lead", position: "Bible Teacher" },
            { name: "Joy Del Rosario", role: "Nursery Caregiver", position: "Infant Care" }
        ],
        recentActivities: [
            "Curriculum Lesson Prep: 'David and the Giant'",
            "Child Safety & Secure QR Tag Check-In Drill",
            "Crafts & Action Worship Rehearsal"
        ]
    },
    {
        id: 6,
        name: "Discipleship & Pastoral Care",
        head: "Ptr. Nathan Reyes",
        category: "Discipleship",
        icon: "book",
        healthScore: 97,
        status: "EXEMPLARY",
        meetingDay: "Tuesdays & Saturdays",
        meetingTime: "7:00 PM (Cell Groups) & 9:00 AM (Mentors)",
        location: "Fellowship Rooms & Home Cells",
        description:
            "Guiding church members through the 4-track biblical curriculum, spiritual mentor pairings, cell group multiplication, and pastoral counseling.",
        totalVolunteers: 28,
        rubric: {
            leadership: 5.0,
            readiness: 4.8,
            engagement: 4.9,
            impact: 4.9
        },
        roster: [
            { name: "Nathan Reyes", role: "Discipleship Pastor", position: "Director" },
            { name: "Elizabeth Gomez", role: "Curriculum Advisor", position: "LMS Facilitator" },
            { name: "Arthur Pineda", role: "Cell Group Director", position: "Men's Ministry Lead" },
            { name: "Miriam Santos", role: "Women's Mentor", position: "Women's Care Lead" }
        ],
        recentActivities: [
            "Discipleship Track 101 Graduation Preparation",
            "Cell Group Leader Multiplication Huddle",
            "Pastoral Counseling & Prayer Ministry Rotations"
        ]
    }
];

interface Props {
    ministryId?: number;
    onNavigate?: (page: string) => void;
}

export default function MinistryEvaluationPage({
    ministryId,
    onNavigate
}: Props) {
    const [selectedDeptId, setSelectedDeptId] = useState<number>(ministryId || 0);
    const [searchTerm, setSearchTerm] = useState("");
    const [apiData, setApiData] = useState<MinistryEvaluationDetail | null>(null);
    const [dbMinistries, setDbMinistries] = useState<MinistryEvaluation[]>([]);

    useEffect(() => {
        getMinistryEvaluations()
            .then((data) => {
                if (data && data.length > 0) {
                    setDbMinistries(data);
                    if (!ministryId) {
                        setSelectedDeptId(data[0].ministryId);
                    }
                }
            })
            .catch(() => {});
    }, [ministryId]);

    useEffect(() => {
        if (ministryId) {
            setSelectedDeptId(ministryId);
            getMinistryEvaluationDetail(ministryId)
                .then((data) => setApiData(data))
                .catch(() => setApiData(null));
        }
    }, [ministryId]);

    const departments: DepartmentPreset[] = useMemo(() => {
        if (!dbMinistries || dbMinistries.length === 0) return PRESET_DEPARTMENTS;
        return dbMinistries.map((m) => ({
            id: m.ministryId,
            name: m.ministryName,
            head: m.ministryHead,
            category: m.category,
            icon: m.category.includes("WORSHIP") ? "music" : m.category.includes("CHILDREN") ? "smile" : "users",
            healthScore: m.healthPercentage,
            status: ((m.healthTier as any) || "EXEMPLARY") as "EXEMPLARY" | "EXCELLENT" | "GROWING",
            meetingDay: m.meetingDay || "Weekly Regular",
            meetingTime: m.meetingTime || "Church Schedule",
            location: m.meetingLocation || "Main Sanctuary",
            description: m.description,
            totalVolunteers: m.totalMembers,
            rubric: {
                leadership: m.averageRating,
                readiness: Math.max(3.5, Math.round((m.averageRating - 0.1) * 10) / 10),
                engagement: Math.max(3.5, Math.round((m.averageRating - 0.2) * 10) / 10),
                impact: m.averageRating
            },
            roster: m.members.map((mem) => ({
                name: mem.name,
                role: mem.role,
                position: mem.position
            })),
            recentActivities: [
                `${m.ministryName} Weekly Duty & Ministry Service`,
                "Quarterly Department Prayer & Fellowship Night",
                "Spiritual Leadership & Ministry Mentorship Session"
            ]
        }));
    }, [dbMinistries]);

    const activeDept =
        (apiData
            ? {
                  ...(departments.find((d) => d.id === selectedDeptId) || departments[0]),
                  name: apiData.ministryName || (departments.find((d) => d.id === selectedDeptId)?.name || "Ministry")
              }
            : departments.find((d) => d.id === selectedDeptId)) || departments[0];

    const filteredDepts = departments.filter(
        (d) =>
            d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.head.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderIcon = (type: string) => {
        switch (type) {
            case "music":
                return <Music size={20} />;
            case "users":
                return <Users size={20} />;
            case "video":
                return <Video size={20} />;
            case "sparkles":
                return <Sparkles size={20} />;
            case "smile":
                return <Smile size={20} />;
            case "book":
                return <BookOpen size={20} />;
            default:
                return <Activity size={20} />;
        }
    };

    return (
        <div className="epic-public-evaluation">
            <PublicHeader onNavigate={onNavigate} />

            {/* HERO */}
            <section className="evaluation-hero">
                <div className="evaluation-hero-content">
                    <span className="evaluation-eyebrow">
                        <Activity size={14} /> MINISTRY HEALTH &amp; OPERATIONAL RUBRIC
                    </span>
                    <h1>
                        Church Ministry <span>Health Evaluation.</span>
                    </h1>
                    <p>
                        A systematic, biblically grounded assessment framework for church departments.
                        Track volunteer readiness, spiritual maturity, operational excellence, and team health.
                    </p>
                    <div className="events-hero-actions">
                        <button
                            type="button"
                            className="events-primary-button"
                            onClick={() => {
                                const el = document.getElementById("rubric-dashboard-anchor");
                                el?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            View Department Rubrics <ArrowRight size={16} />
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

            {/* CHURCH HEALTH SCORECARD STRIP */}
            <section className="evaluation-scorecard-strip">
                <div className="evaluation-container">
                    <div className="evaluation-stats-grid">
                        <div className="evaluation-stat-card">
                            <div className="stat-icon-wrap green"><TrendingUp size={24} /></div>
                            <div>
                                <span className="stat-number">94.2%</span>
                                <strong>Church Health Index</strong>
                                <small>Exemplary Operational Rating</small>
                            </div>
                        </div>

                        <div className="evaluation-stat-card">
                            <div className="stat-icon-wrap blue"><ShieldCheck size={24} /></div>
                            <div>
                                <span className="stat-number">7</span>
                                <strong>Active Ministry Departments</strong>
                                <small>100% Evaluated This Quarter</small>
                            </div>
                        </div>

                        <div className="evaluation-stat-card">
                            <div className="stat-icon-wrap purple"><Users size={24} /></div>
                            <div>
                                <span className="stat-number">148</span>
                                <strong>Rostered Servants</strong>
                                <small>Active in Weekly Duty Shifts</small>
                            </div>
                        </div>

                        <div className="evaluation-stat-card">
                            <div className="stat-icon-wrap orange"><Calendar size={24} /></div>
                            <div>
                                <span className="stat-number">Q3 2026</span>
                                <strong>Evaluation Cycle</strong>
                                <small>Next Review: November 2026</small>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* MAIN DASHBOARD */}
            <section className="evaluation-dashboard-section" id="rubric-dashboard-anchor">
                <div className="evaluation-container">
                    <div className="evaluation-dashboard-layout">
                        {/* SIDEBAR: DEPARTMENT SELECTOR */}
                        <div className="evaluation-sidebar">
                            <div className="dept-search-box">
                                <Search size={15} className="dept-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search departments..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="dept-nav-list">
                                {filteredDepts.map((dept) => (
                                    <button
                                        key={dept.id}
                                        type="button"
                                        className={`dept-nav-item ${selectedDeptId === dept.id ? "active" : ""}`}
                                        onClick={() => {
                                            setSelectedDeptId(dept.id);
                                            setApiData(null);
                                        }}
                                    >
                                        <div className="dept-nav-icon">
                                            {renderIcon(dept.icon)}
                                        </div>
                                        <div className="dept-nav-info">
                                            <strong>{dept.name}</strong>
                                            <span>{dept.head}</span>
                                        </div>
                                        <div className="dept-nav-score">
                                            {dept.healthScore}%
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* MAIN CONTENT: SELECTED DEPARTMENT DETAILS */}
                        <div className="evaluation-main-panel">
                            {/* HEADER CARD */}
                            <div className="dept-header-card">
                                <div className="dept-header-top">
                                    <div>
                                        <span className="dept-category-pill">{activeDept.category}</span>
                                        <h2>{activeDept.name}</h2>
                                        <p className="dept-lead-text">
                                            Ministry Director: <strong>{activeDept.head}</strong>
                                        </p>
                                    </div>
                                    <div className="dept-overall-score-badge">
                                        <span className="score-num">{activeDept.healthScore}%</span>
                                        <span className="score-label">{activeDept.status}</span>
                                    </div>
                                </div>

                                <p className="dept-description">{activeDept.description}</p>

                                <div className="dept-schedule-strip">
                                    <div>
                                        <Calendar size={15} />
                                        <span><strong>Day:</strong> {activeDept.meetingDay}</span>
                                    </div>
                                    <div>
                                        <Clock size={15} />
                                        <span><strong>Time:</strong> {activeDept.meetingTime}</span>
                                    </div>
                                    <div>
                                        <MapPin size={15} />
                                        <span><strong>Location:</strong> {activeDept.location}</span>
                                    </div>
                                    <div>
                                        <Users size={15} />
                                        <span><strong>Rostered Team:</strong> {activeDept.totalVolunteers} Volunteers</span>
                                    </div>
                                </div>
                            </div>

                            {/* 4-PILLAR RUBRIC GRID */}
                            <div className="rubric-grid-section">
                                <h3>4-Pillar Department Evaluation Rubric</h3>
                                <div className="rubric-cards-grid">
                                    <div className="rubric-card">
                                        <div className="rubric-card-header">
                                            <strong>1. Spiritual Leadership &amp; Calling</strong>
                                            <span className="rubric-rating">{activeDept.rubric.leadership} / 5.0</span>
                                        </div>
                                        <div className="rubric-bar">
                                            <div style={{ width: `${(activeDept.rubric.leadership / 5) * 100}%` }} />
                                        </div>
                                        <p>Pastoral alignment, prayer covering, personal devotion, and biblical character.</p>
                                    </div>

                                    <div className="rubric-card">
                                        <div className="rubric-card-header">
                                            <strong>2. Operational Readiness &amp; Punctuality</strong>
                                            <span className="rubric-rating">{activeDept.rubric.readiness} / 5.0</span>
                                        </div>
                                        <div className="rubric-bar">
                                            <div style={{ width: `${(activeDept.rubric.readiness / 5) * 100}%` }} />
                                        </div>
                                        <p>Early arrival, equipment readiness, dry run execution, and duty checklist compliance.</p>
                                    </div>

                                    <div className="rubric-card">
                                        <div className="rubric-card-header">
                                            <strong>3. Team Attendance &amp; Volunteer Retention</strong>
                                            <span className="rubric-rating">{activeDept.rubric.engagement} / 5.0</span>
                                        </div>
                                        <div className="rubric-bar">
                                            <div style={{ width: `${(activeDept.rubric.engagement / 5) * 100}%` }} />
                                        </div>
                                        <p>Duty shift attendance consistency, low turnover, volunteer mentorship, and fellowship.</p>
                                    </div>

                                    <div className="rubric-card">
                                        <div className="rubric-card-header">
                                            <strong>4. Service Impact &amp; Ministry Execution</strong>
                                            <span className="rubric-rating">{activeDept.rubric.impact} / 5.0</span>
                                        </div>
                                        <div className="rubric-bar">
                                            <div style={{ width: `${(activeDept.rubric.impact / 5) * 100}%` }} />
                                        </div>
                                        <p>Sunday gathering excellence, visitor care, hospitality impact, and worship atmosphere.</p>
                                    </div>
                                </div>
                            </div>

                            {/* ROSTER & RECENT ACTIVITIES */}
                            <div className="dept-details-two-col">
                                <div className="dept-roster-box">
                                    <h3>Rostered Volunteer Leaders ({activeDept.roster.length})</h3>
                                    <div className="roster-list">
                                        {activeDept.roster.map((member, i) => (
                                            <div key={i} className="roster-item">
                                                <div className="roster-avatar">
                                                    {member.name.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="roster-info">
                                                    <strong>{member.name}</strong>
                                                    <span>{member.position}</span>
                                                </div>
                                                <span className="roster-role-badge">{member.role}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="dept-activities-box">
                                    <h3>Recent Service Checklists &amp; Focus</h3>
                                    <ul className="activities-list">
                                        {activeDept.recentActivities.map((act, i) => (
                                            <li key={i}>
                                                <CheckCircle2 size={16} className="activity-check" />
                                                <span>{act}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="system-evaluation-note">
                                        <ShieldCheck size={18} />
                                        <div>
                                            <strong>EPIC CMS Audit Certified</strong>
                                            <p>
                                                This evaluation is logged in the church management database and visible to
                                                the Senior Pastor and Church Board.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="dept-action-btns">
                                        <button
                                            type="button"
                                            className="events-primary-button"
                                            onClick={() => onNavigate?.("ministries")}
                                        >
                                            Explore Ministry Details
                                        </button>
                                        <button
                                            type="button"
                                            className="events-secondary-button"
                                            onClick={() => onNavigate?.("contact")}
                                        >
                                            Inquire to Join Team
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="events-cta">
                <div className="evaluation-container">
                    <div className="evaluation-cta-content">
                        <span className="events-section-label">EXCELLENCE IN MINISTRY</span>
                        <h2>Ready to Serve in an EPIC Ministry?</h2>
                        <p>
                            Every ministry thrives when members step forward in faith. Discover where your spiritual gifts,
                            talents, and passion fit into God's plan for EPIC Church.
                        </p>
                        <div className="events-hero-actions">
                            <button
                                type="button"
                                className="events-primary-button"
                                onClick={() => onNavigate?.("ministries")}
                            >
                                <HeartHandshake size={18} /> Browse All Ministries
                            </button>
                            <button
                                type="button"
                                className="events-secondary-button"
                                onClick={() => onNavigate?.("contact")}
                            >
                                Contact Pastoral Team
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
