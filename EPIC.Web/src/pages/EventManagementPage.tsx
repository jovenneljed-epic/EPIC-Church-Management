import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import axios from "axios";
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Printer,
    Sparkles,
    Plus,
    Search,
    CheckCircle2,
    ClipboardList,
    FileText,
    AlertCircle,
    Trash2,
    Edit3,
    X,
    Building,
    SlidersHorizontal,
    UserCheck,
    Award,
    BookOpen,
    Eye,
    ListOrdered
} from "lucide-react";
import { API_BASE_URL } from "../config";
import "./EventManagementPage.css";
import EventPlanningPanel from "./events/EventPlanningPanel";

/* =========================================================
   TYPES
========================================================= */

type EventStatus =
    | "Upcoming"
    | "Ongoing"
    | "Completed"
    | "Cancelled";

type AssignmentDisplayStatus =
    | "Assigned"
    | "Pending"
    | "In Progress"
    | "Completed"
    | "Cancelled";

interface EventAssignment {
    id: number;
    eventId?: number;
    eventDepartmentId?: number | null;
    eventRoleId?: number | null;
    memberId?: number | null;
    role: string;
    person: string;
    department: string;
    status: AssignmentDisplayStatus;
    priority: string;
    notes: string;
    createdAt?: string;
    updatedAt?: string | null;
}

interface EventNeedItem {
    eventNeedId?: number;
    id?: number;
    needName: string;
    category?: string | null;
    quantity?: number | null;
    unit?: string | null;
    responsiblePerson?: string | null;
    status?: string | null;
    priority?: string | null;
    notes?: string | null;
}

interface EventChecklistItem {
    eventChecklistId?: number;
    id?: number;
    taskName: string;
    category?: string | null;
    assignedPerson?: string | null;
    status?: string | null;
    priority?: string | null;
}

interface ChurchEvent {
    id: number;
    title: string;
    eventType: string;
    location: string;
    startDate: string;
    startTime: string;
    endTime: string;
    coordinator: string;
    ministry: string;
    status: EventStatus;
    description: string;
    notes: string;
    assignments: EventAssignment[];
    needs?: EventNeedItem[];
    checklists?: EventChecklistItem[];
}

interface NewEventForm {
    title: string;
    eventType: string;
    location: string;
    startDate: string;
    startTime: string;
    endTime: string;
    coordinator: string;
    ministry: string;
    description: string;
    notes: string;
}

interface AssignmentForm {
    role: string;
    person: string;
    department: string;
    status: AssignmentDisplayStatus;
    priority: string;
    notes: string;
}

interface ProgramItem {
    id: string;
    time: string;
    activity: string;
    leader: string;
    technicalCue: string;
}

/* =========================================================
   DEFAULT PROGRAM RUNDOWN GENERATOR
========================================================= */

const getDefaultProgramRundown = (event: ChurchEvent): ProgramItem[] => {
    const start = event.startTime || "09:00 AM";
    const coord = event.coordinator || "Pastor / Worship Team";

    if (event.eventType.toLowerCase().includes("worship") || event.eventType.toLowerCase().includes("sunday")) {
        return [
            { id: "1", time: "30 mins before", activity: "Pre-Service Intercessory Prayer & Tech Check", leader: "Intercessory Team & AV Crew", technicalCue: "FOH Audio Live, Stage Lights 50%" },
            { id: "2", time: `${start}`, activity: "Call to Worship & Opening Prayer", leader: coord, technicalCue: "Stage Wash Lights 100%, House Music Fade" },
            { id: "3", time: "+10 mins", activity: "Praise & Worship Set (3-4 Songs)", leader: "Praise & Worship Team", technicalCue: "Lyrics on Main Screen, Dynamic Stage Lighting" },
            { id: "4", time: "+35 mins", activity: "Church Announcements & Welcome First-Time Guests", leader: "Host / Ushering Ministry", technicalCue: "Media Slides On, FOH Mic Active" },
            { id: "5", time: "+45 mins", activity: "Tithes, Praise Offerings & Pastoral Blessing", leader: "Presiding Pastor", technicalCue: "Soft Instrumental BG Music, Offering Slides" },
            { id: "6", time: "+55 mins", activity: "Word of God (Sermon / Exhortation)", leader: event.coordinator || "Pastor Ronnel M. Aviguetero", technicalCue: "Sermon Keynote Slides, Preacher Mic On" },
            { id: "7", time: "+1 hr 35m", activity: "Altar Call, Ministry Time & Corporate Prayer", leader: "Pastoral Team & Counselors", technicalCue: "Warm Stage Lighting, Soft Worship Reprise" },
            { id: "8", time: "+1 hr 50m", activity: "Pastoral Benediction, Fellowship & Dismissal", leader: "Senior Pastor", technicalCue: "Upbeat Post-Service Music, Foyer Lights On" }
        ];
    }

    return [
        { id: "1", time: "45 mins before", activity: "Staff & Volunteer Call Time, Stage & AV Setup", leader: "Event Director & Operations Team", technicalCue: "System Power On, Sound Check, Stage Prep" },
        { id: "2", time: "15 mins before", activity: "Doors Open & Attendee Registration / Welcome", leader: "Ushering & Welcome Ministry", technicalCue: "Ambient Background Music, Welcome Slide" },
        { id: "3", time: `${start}`, activity: "Opening Invocation & Welcome Address", leader: coord, technicalCue: "House Lights Down, Stage Spot On" },
        { id: "4", time: "+20 mins", activity: "Main Session / Keynote Ministry Program", leader: event.coordinator || "Event Speaker", technicalCue: "Main Visual Slides, Stage Video Recording" },
        { id: "5", time: "+1 hr 10m", activity: "Interactive Workshop / Activity / Q&A", leader: "Facilitators & Group Leaders", technicalCue: "Roving Wireless Microphones Ready" },
        { id: "6", time: "+1 hr 45m", activity: "Closing Prayer, Pastoral Impartation & Dismissal", leader: "Senior Pastor / Ministry Head", technicalCue: "Closing Slides, Exit Music" }
    ];
};

/* =========================================================
   DEFAULTS
========================================================= */

const DEFAULT_EVENT_FORM: NewEventForm = {
    title: "",
    eventType: "Sunday Worship",
    location: "Main Sanctuary, San Vicente",
    startDate: new Date().toISOString().split("T")[0],
    startTime: "09:00 AM",
    endTime: "11:30 AM",
    coordinator: "Pastor Ronnel M. Aviguetero",
    ministry: "Pastoral & Worship",
    description: "",
    notes: "",
};

const DEFAULT_ASSIGNMENT_FORM: AssignmentForm = {
    role: "",
    person: "",
    department: "Worship Ministry",
    status: "Pending",
    priority: "Normal",
    notes: "",
};

/* =========================================================
   COMPONENT
========================================================= */

const EventManagementPage: React.FC = () => {
    /* =====================================================
       STATE
    ===================================================== */

    const [events, setEvents] = useState<ChurchEvent[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [activeTab, setActiveTab] = useState<"rundown" | "assignments" | "logistics" | "notes">("rundown");

    /* =====================================================
       PRINT MODAL
    ===================================================== */
    const [showPrintModal, setShowPrintModal] = useState(false);

    /* =====================================================
       CREATE / EDIT EVENT MODAL
    ===================================================== */
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isEditingEvent, setIsEditingEvent] = useState(false);
    const [creating, setCreating] = useState(false);

    const [newEvent, setNewEvent] = useState<NewEventForm>({
        ...DEFAULT_EVENT_FORM,
    });

    /* =====================================================
       ASSIGNMENTS MODAL
    ===================================================== */
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [savingAssignment, setSavingAssignment] = useState(false);

    const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>({
        ...DEFAULT_ASSIGNMENT_FORM,
    });

    const [editingAssignment, setEditingAssignment] = useState<EventAssignment | null>(null);
    const [viewingAssignment, setViewingAssignment] = useState<EventAssignment | null>(null);

    /* =====================================================
       EVENT LOGISTICS (NEEDS & CHECKLISTS)
    ===================================================== */
    const [eventNeeds, setEventNeeds] = useState<EventNeedItem[]>([]);
    const [eventChecklists, setEventChecklists] = useState<EventChecklistItem[]>([]);

    /* =====================================================
       AUTH HEADERS
    ===================================================== */

    const getAuthHeaders = useCallback(() => {
        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt");

        if (!token) {
            return {};
        }

        return {
            Authorization: "Bearer " + token,
        };
    }, []);

    /* =====================================================
       API ERROR
    ===================================================== */

    const getApiErrorMessage = useCallback(
        (err: any, fallback: string): string => {
            const data = err?.response?.data;
            if (!data) return fallback;
            if (typeof data === "string") return data;
            if (data.message) return String(data.message);
            if (data.title) return String(data.title);
            return fallback;
        },
        []
    );

    /* =====================================================
       STATUS NORMALIZATION
    ===================================================== */

    const normalizeStatus = useCallback((value: unknown): EventStatus => {
        const status = String(value ?? "").trim().toLowerCase().replace(/_/g, " ");
        if (status === "ongoing" || status === "in progress" || status === "inprogress") return "Ongoing";
        if (status === "completed" || status === "complete" || status === "finished") return "Completed";
        if (status === "cancelled" || status === "canceled") return "Cancelled";
        return "Upcoming";
    }, []);

    const normalizeAssignmentStatus = useCallback((value: unknown): AssignmentDisplayStatus => {
        const status = String(value ?? "").trim().toLowerCase().replace(/-/g, "_").replace(/\s+/g, "_");
        switch (status) {
            case "assigned":
                return "Assigned";
            case "in_progress":
            case "inprogress":
                return "In Progress";
            case "completed":
            case "complete":
                return "Completed";
            case "cancelled":
            case "canceled":
                return "Cancelled";
            default:
                return "Pending";
        }
    }, []);

    /* =====================================================
       NORMALIZE ASSIGNMENT
    ===================================================== */

    const normalizeAssignment = useCallback(
        (assignment: any, index: number): EventAssignment => {
            return {
                id: Number(
                    assignment?.eventAssignmentId ??
                    assignment?.EventAssignmentId ??
                    assignment?.id ??
                    index + 1
                ),
                eventId: assignment?.eventId ?? assignment?.EventId,
                eventDepartmentId: assignment?.eventDepartmentId ?? null,
                eventRoleId: assignment?.eventRoleId ?? null,
                memberId: assignment?.memberId ?? null,
                role: assignment?.roleName ?? assignment?.RoleName ?? assignment?.role ?? "Volunteer / Minister",
                person: assignment?.assignedPerson ?? assignment?.AssignedPerson ?? assignment?.memberName ?? "To Be Assigned",
                department: assignment?.departmentName ?? assignment?.DepartmentName ?? assignment?.department ?? "General",
                status: normalizeAssignmentStatus(assignment?.assignmentStatus ?? assignment?.status),
                priority: assignment?.priority ?? assignment?.Priority ?? "Normal",
                notes: assignment?.notes ?? assignment?.Notes ?? "",
                createdAt: assignment?.createdAt ?? assignment?.CreatedAt,
                updatedAt: assignment?.updatedAt ?? assignment?.UpdatedAt ?? null,
            };
        },
        [normalizeAssignmentStatus]
    );

    /* =====================================================
       NORMALIZE EVENT
    ===================================================== */

    const normalizeEvent = useCallback(
        (event: any, index: number): ChurchEvent => {
            const rawAssignments =
                event?.assignments ??
                event?.Assignments ??
                event?.eventAssignments ??
                [];

            return {
                id: Number(
                    event?.eventId ??
                    event?.EventId ??
                    event?.id ??
                    index + 1
                ),
                title: event?.title ?? event?.Title ?? "Untitled Church Event",
                eventType: event?.eventType ?? event?.EventType ?? "Sunday Worship",
                location: event?.venue ?? event?.Venue ?? event?.location ?? "Main Sanctuary",
                startDate: event?.eventDate ?? event?.EventDate ?? event?.startDate ?? "",
                startTime: event?.startTime ?? event?.StartTime ?? "09:00 AM",
                endTime: event?.endTime ?? event?.EndTime ?? "11:30 AM",
                coordinator: event?.speaker ?? event?.Speaker ?? event?.coordinator ?? "Pastor Ronnel M. Aviguetero",
                ministry: event?.ministry ?? event?.Ministry ?? "Luke 4:18 Ministries",
                status: normalizeStatus(event?.status ?? event?.Status),
                description: event?.description ?? event?.Description ?? "",
                notes: event?.notes ?? event?.Notes ?? "",
                assignments: Array.isArray(rawAssignments)
                    ? rawAssignments.map((a: any, i: number) => normalizeAssignment(a, i))
                    : [],
            };
        },
        [normalizeAssignment, normalizeStatus]
    );

    /* =====================================================
       LOAD EVENT ASSIGNMENTS
    ===================================================== */

    const loadEventAssignments = useCallback(
        async (eventId: number): Promise<EventAssignment[]> => {
            try {
                const response = await axios.get(
                    API_BASE_URL + "/EventAssignments/event/" + eventId,
                    { headers: getAuthHeaders() }
                );

                const data = response.data;
                const raw = Array.isArray(data)
                    ? data
                    : data?.assignments ?? data?.items ?? data?.data ?? [];

                if (!Array.isArray(raw)) return [];

                return raw.map((a: any, i: number) => normalizeAssignment(a, i));
            } catch (err) {
                console.warn("Unable to load assignments for event " + eventId, err);
                return [];
            }
        },
        [getAuthHeaders, normalizeAssignment]
    );

    /* =====================================================
       LOAD EVENT NEEDS & CHECKLISTS
    ===================================================== */

    const loadLogisticsData = useCallback(async (eventId: number) => {
        try {
            const [needsRes, checksRes] = await Promise.allSettled([
                axios.get(API_BASE_URL + "/EventNeeds/event/" + eventId, { headers: getAuthHeaders() }),
                axios.get(API_BASE_URL + "/EventChecklists/event/" + eventId, { headers: getAuthHeaders() })
            ]);

            if (needsRes.status === "fulfilled" && Array.isArray(needsRes.value.data)) {
                setEventNeeds(needsRes.value.data);
            } else {
                setEventNeeds([]);
            }

            if (checksRes.status === "fulfilled" && Array.isArray(checksRes.value.data)) {
                setEventChecklists(checksRes.value.data);
            } else {
                setEventChecklists([]);
            }
        } catch (err) {
            console.warn("Could not load logistics data for event", err);
        }
    }, [getAuthHeaders]);

    /* =====================================================
       LOAD EVENTS
    ===================================================== */

    const loadEvents = useCallback(
        async (preferredEventId?: number | null) => {
            try {
                setLoading(true);
                setError("");

                const response = await axios.get(API_BASE_URL + "/Events", {
                    headers: getAuthHeaders(),
                });

                const data = response.data;
                const rawEvents = Array.isArray(data)
                    ? data
                    : data?.items ?? data?.data ?? data?.value ?? [];

                const normalized = await Promise.all(
                    rawEvents.map(async (event: any, index: number) => {
                        const baseEvent = normalizeEvent(event, index);
                        const assignments = await loadEventAssignments(baseEvent.id);
                        return {
                            ...baseEvent,
                            assignments,
                        };
                    })
                );

                setEvents(normalized);

                setSelectedEventId((previous) => {
                    if (preferredEventId != null && normalized.some(e => e.id === preferredEventId)) {
                        return preferredEventId;
                    }
                    if (previous != null && normalized.some(e => e.id === previous)) {
                        return previous;
                    }
                    return normalized[0]?.id ?? null;
                });
            } catch (err: any) {
                console.error("Unable to load events:", err);
                setError(getApiErrorMessage(err, "Unable to load events."));
            } finally {
                setLoading(false);
            }
        },
        [getApiErrorMessage, getAuthHeaders, loadEventAssignments, normalizeEvent]
    );

    useEffect(() => {
        void loadEvents();
    }, [loadEvents]);

    useEffect(() => {
        if (selectedEventId) {
            void loadLogisticsData(selectedEventId);
        }
    }, [selectedEventId, loadLogisticsData]);

    /* =====================================================
       FILTERED EVENTS
    ===================================================== */

    const filteredEvents = useMemo(() => {
        const query = search.trim().toLowerCase();

        return events.filter((event) => {
            const searchableText = [
                event.title,
                event.location,
                event.eventType,
                event.coordinator,
                event.ministry,
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch = !query || searchableText.includes(query);
            const matchesStatus = statusFilter === "ALL" || event.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [events, search, statusFilter]);

    /* =====================================================
       SELECTED EVENT
    ===================================================== */

    const selectedEvent = useMemo(
        () => events.find((e) => e.id === selectedEventId) ?? null,
        [events, selectedEventId]
    );

    /* =====================================================
       STATISTICS
    ===================================================== */

    const statistics = useMemo(
        () => {
            const totalVolunteers = events.reduce((sum, e) => sum + (e.assignments?.length || 0), 0);
            return {
                total: events.length,
                upcoming: events.filter((e) => e.status === "Upcoming").length,
                ongoing: events.filter((e) => e.status === "Ongoing").length,
                completed: events.filter((e) => e.status === "Completed").length,
                volunteers: totalVolunteers
            };
        },
        [events]
    );

    /* =====================================================
       FORM ACTIONS
    ===================================================== */

    const resetNewEvent = useCallback(() => {
        setNewEvent({ ...DEFAULT_EVENT_FORM });
        setIsEditingEvent(false);
    }, []);

    const resetAssignmentForm = useCallback(() => {
        setAssignmentForm({ ...DEFAULT_ASSIGNMENT_FORM });
    }, []);

    const handleOpenCreateModal = useCallback(() => {
        resetNewEvent();
        setIsEditingEvent(false);
        setShowCreateModal(true);
    }, [resetNewEvent]);

    const handleOpenEditEventModal = useCallback(() => {
        if (!selectedEvent) return;
        setNewEvent({
            title: selectedEvent.title,
            eventType: selectedEvent.eventType,
            location: selectedEvent.location,
            startDate: selectedEvent.startDate ? selectedEvent.startDate.split("T")[0] : "",
            startTime: selectedEvent.startTime,
            endTime: selectedEvent.endTime,
            coordinator: selectedEvent.coordinator,
            ministry: selectedEvent.ministry,
            description: selectedEvent.description,
            notes: selectedEvent.notes,
        });
        setIsEditingEvent(true);
        setShowCreateModal(true);
    }, [selectedEvent]);

    const handleSaveEvent = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (creating) return;

        const title = newEvent.title.trim();
        const location = newEvent.location.trim();

        if (!title) {
            alert("Please enter the event title.");
            return;
        }

        if (!location) {
            alert("Please enter the venue or location.");
            return;
        }

        try {
            setCreating(true);

            const payload = {
                title,
                eventType: newEvent.eventType.trim() || "Sunday Worship",
                eventDate: newEvent.startDate,
                startTime: newEvent.startTime || null,
                endTime: newEvent.endTime || null,
                venue: location,
                speaker: newEvent.coordinator.trim() || null,
                ministry: newEvent.ministry.trim() || null,
                status: isEditingEvent && selectedEvent ? selectedEvent.status.toUpperCase() : "SCHEDULED",
                description: newEvent.description.trim() || null,
                notes: newEvent.notes.trim() || null,
            };

            let targetId: number | null = null;

            if (isEditingEvent && selectedEvent) {
                await axios.put(API_BASE_URL + "/Events/" + selectedEvent.id, payload, {
                    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                });
                targetId = selectedEvent.id;
            } else {
                const res = await axios.post(API_BASE_URL + "/Events", payload, {
                    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                });
                targetId = Number(res.data?.eventId || res.data?.id);
            }

            setShowCreateModal(false);
            resetNewEvent();
            await loadEvents(targetId);
            alert(isEditingEvent ? "Event updated successfully." : "Event created successfully.");
        } catch (err: any) {
            console.error("EVENT SAVE ERROR:", err);
            alert(getApiErrorMessage(err, "Unable to save the event."));
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;
        const confirmed = window.confirm(
            `Are you sure you want to delete event "${selectedEvent.title}"?\n\nThis will remove all associated program rundown and volunteer assignments.`
        );
        if (!confirmed) return;

        try {
            await axios.delete(API_BASE_URL + "/Events/" + selectedEvent.id, {
                headers: getAuthHeaders(),
            });
            await loadEvents();
            alert("Event deleted successfully.");
        } catch (err: any) {
            console.error("DELETE EVENT ERROR:", err);
            alert(getApiErrorMessage(err, "Unable to delete the event."));
        }
    };

    /* =====================================================
       ASSIGNMENT ACTIONS
    ===================================================== */

    const handleOpenAssignmentModal = useCallback(() => {
        if (!selectedEvent) {
            alert("Please select an event first.");
            return;
        }
        setEditingAssignment(null);
        resetAssignmentForm();
        setShowAssignmentModal(true);
    }, [resetAssignmentForm, selectedEvent]);

    const handleEditAssignment = (assignment: EventAssignment) => {
        setEditingAssignment(assignment);
        setAssignmentForm({
            role: assignment.role || "",
            person: assignment.person || "",
            department: assignment.department || "Worship Ministry",
            status: assignment.status || "Pending",
            priority: assignment.priority || "Normal",
            notes: assignment.notes || "",
        });
        setShowAssignmentModal(true);
    };

    const handleSaveAssignment = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedEvent) return;
        if (!assignmentForm.role.trim() || !assignmentForm.person.trim()) {
            alert("Please fill in both the Role and the Assigned Person.");
            return;
        }

        try {
            setSavingAssignment(true);
            const payload = {
                eventId: selectedEvent.id,
                eventDepartmentId: editingAssignment?.eventDepartmentId ?? null,
                eventRoleId: editingAssignment?.eventRoleId ?? null,
                memberId: editingAssignment?.memberId ?? null,
                assignedPerson: assignmentForm.person.trim(),
                departmentName: assignmentForm.department.trim() || "General",
                roleName: assignmentForm.role.trim(),
                assignmentStatus: assignmentForm.status.trim().replace(/\s+/g, "_").toUpperCase(),
                priority: assignmentForm.priority.trim().toUpperCase(),
                notes: assignmentForm.notes.trim() || null,
            };

            if (editingAssignment) {
                await axios.put(API_BASE_URL + "/EventAssignments/" + editingAssignment.id, payload, {
                    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                });
            } else {
                await axios.post(API_BASE_URL + "/EventAssignments", payload, {
                    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                });
            }

            const updatedAssignments = await loadEventAssignments(selectedEvent.id);
            setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, assignments: updatedAssignments } : e));
            setShowAssignmentModal(false);
            setEditingAssignment(null);
            resetAssignmentForm();
            alert(editingAssignment ? "Assignment updated." : "Assignment saved.");
        } catch (err: any) {
            console.error("ASSIGNMENT ERROR:", err);
            alert(getApiErrorMessage(err, "Unable to save assignment."));
        } finally {
            setSavingAssignment(false);
        }
    };

    const handleDeleteAssignment = async (assignment: EventAssignment) => {
        if (!selectedEvent) return;
        if (!window.confirm(`Delete assignment "${assignment.role}" for ${assignment.person}?`)) return;

        try {
            await axios.delete(API_BASE_URL + "/EventAssignments/" + assignment.id, {
                headers: getAuthHeaders(),
            });
            const updatedAssignments = await loadEventAssignments(selectedEvent.id);
            setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, assignments: updatedAssignments } : e));
            if (viewingAssignment?.id === assignment.id) setViewingAssignment(null);
        } catch (err: any) {
            console.error("DELETE ERROR:", err);
            alert(getApiErrorMessage(err, "Unable to delete assignment."));
        }
    };

    /* =====================================================
       PRINT ACTION
    ===================================================== */

    const handlePrintDirect = () => {
        const originalTitle = document.title;
        if (selectedEvent) {
            document.title = `EPIC_Event_Plan_${selectedEvent.title.replace(/[^a-zA-Z0-9]/g, "_")}`;
        }
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 1500);
    };

    /* =====================================================
       DATE HELPERS
    ===================================================== */

    const formatDate = (value: string) => {
        if (!value) return "—";
        const date = new Date(value.includes("T") ? value.split("T")[0] + "T00:00:00" : value + "T00:00:00");
        return isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getEventDay = (value: string) => {
        if (!value) return "—";
        const date = new Date(value.includes("T") ? value.split("T")[0] + "T00:00:00" : value + "T00:00:00");
        return isNaN(date.getTime()) ? "—" : date.getDate();
    };

    const getEventMonth = (value: string) => {
        if (!value) return "";
        const date = new Date(value.includes("T") ? value.split("T")[0] + "T00:00:00" : value + "T00:00:00");
        return isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    };

    /* Program rundown for selected event */
    const currentRundown = useMemo(() => {
        if (!selectedEvent) return [];
        return getDefaultProgramRundown(selectedEvent);
    }, [selectedEvent]);

    return (
        <div className="event-management">
            {/* =================================================
                COMMAND HEADER
            ================================================= */}
            <header className="event-command-hero">
                <div className="event-hero-meta">
                    <div className="event-hero-eyebrow">
                        <Sparkles size={13} className="sparkle-icon" />
                        <span>EPIC CHURCH MANAGEMENT • SAN VICENTE CHURCH</span>
                    </div>
                    <h1 className="event-hero-title">Event Operations & Planning Command</h1>
                    <p className="event-hero-subtitle">
                        Coordinate church worship services, discipleship rallies, volunteer committee matrices, and print official event operational directives.
                    </p>
                </div>

                <div className="event-hero-actions">
                    <button
                        type="button"
                        className="btn-create-event"
                        onClick={handleOpenCreateModal}
                    >
                        <Plus size={16} />
                        <span>Create New Event</span>
                    </button>
                </div>
            </header>

            {/* =================================================
                EXECUTIVE KPI METRICS
            ================================================= */}
            <section className="event-kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-icon-wrap indigo">
                        <Calendar size={22} />
                    </div>
                    <div className="kpi-body">
                        <span className="kpi-label">TOTAL EVENTS</span>
                        <strong className="kpi-value">{statistics.total}</strong>
                        <span className="kpi-sub">Managed church programs</span>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon-wrap cyan">
                        <Clock size={22} />
                    </div>
                    <div className="kpi-body">
                        <span className="kpi-label">UPCOMING SCHEDULE</span>
                        <strong className="kpi-value">{statistics.upcoming}</strong>
                        <span className="kpi-sub">Scheduled future services</span>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon-wrap emerald">
                        <Sparkles size={22} />
                    </div>
                    <div className="kpi-body">
                        <span className="kpi-label">ACTIVE OPERATIONS</span>
                        <strong className="kpi-value">{statistics.ongoing}</strong>
                        <span className="kpi-sub">Currently running</span>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon-wrap purple">
                        <Users size={22} />
                    </div>
                    <div className="kpi-body">
                        <span className="kpi-label">MOBILIZED VOLUNTEERS</span>
                        <strong className="kpi-value">{statistics.volunteers}</strong>
                        <span className="kpi-sub">Assigned ministry personnel</span>
                    </div>
                </div>
            </section>

            {/* =================================================
                ERROR BANNER
            ================================================= */}
            {error && (
                <div className="event-error-banner">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button type="button" onClick={() => void loadEvents()}>Retry</button>
                </div>
            )}

            {/* =================================================
                MAIN EVENT WORKSPACE
            ================================================= */}
            <div className="event-main-workspace">
                {/* ---------------------------------------------
                    LEFT: EVENT CALENDAR LIST
                --------------------------------------------- */}
                <aside className="event-roster-sidebar">
                    <div className="roster-search-box">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by title, venue, pastor..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button type="button" className="clear-search" onClick={() => setSearch("")}>
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="roster-filter-chips">
                        {(["ALL", "Upcoming", "Ongoing", "Completed"] as const).map((filter) => (
                            <button
                                key={filter}
                                type="button"
                                className={`filter-chip ${statusFilter === filter ? "active" : ""}`}
                                onClick={() => setStatusFilter(filter)}
                            >
                                {filter === "ALL" ? "All Events" : filter}
                            </button>
                        ))}
                    </div>

                    <div className="roster-event-cards">
                        {loading && (
                            <div className="roster-loading-state">
                                <Clock size={24} className="spin-icon" />
                                <span>Loading church events...</span>
                            </div>
                        )}

                        {!loading && filteredEvents.length === 0 && (
                            <div className="roster-empty-state">
                                <Calendar size={32} />
                                <strong>No events found</strong>
                                <p>Try adjusting your search query or filter criteria.</p>
                            </div>
                        )}

                        {!loading && filteredEvents.map((evt) => {
                            const isSelected = selectedEventId === evt.id;
                            return (
                                <div
                                    key={evt.id}
                                    className={`roster-event-card ${isSelected ? "selected" : ""}`}
                                    onClick={() => setSelectedEventId(evt.id)}
                                >
                                    <div className="event-date-tile">
                                        <span className="date-month">{getEventMonth(evt.startDate)}</span>
                                        <strong className="date-day">{getEventDay(evt.startDate)}</strong>
                                    </div>

                                    <div className="event-card-info">
                                        <div className="event-card-type-row">
                                            <span className="event-type-badge">{evt.eventType}</span>
                                            <span className={`event-status-pill ${evt.status.toLowerCase()}`}>
                                                {evt.status}
                                            </span>
                                        </div>
                                        <h4 className="event-card-title">{evt.title}</h4>
                                        <div className="event-card-details">
                                            <span><Clock size={12} /> {evt.startTime || "TBA"}</span>
                                            <span><MapPin size={12} /> {evt.location || "San Vicente"}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* ---------------------------------------------
                    RIGHT: EVENT COMMAND CENTER & DETAILS
                --------------------------------------------- */}
                <main className="event-command-view">
                    {!selectedEvent ? (
                        <div className="event-unselected-state">
                            <Calendar size={48} className="unselected-icon" />
                            <h3>Select an Event to Open Command Center</h3>
                            <p>Select any event from the schedule roster on the left to view the master operational plan, personnel assignments, logistics checklist, and export official print directives.</p>
                            <button type="button" className="btn-create-event" onClick={handleOpenCreateModal}>
                                <Plus size={16} />
                                <span>Create Your First Event</span>
                            </button>
                        </div>
                    ) : (
                        <div className="event-active-plan">
                            {/* EVENT BANNER CARD */}
                            <div className="event-header-card">
                                <div className="event-header-top">
                                    <div className="event-header-meta">
                                        <div className="badge-row">
                                            <span className="event-type-tag">{selectedEvent.eventType}</span>
                                            <span className={`event-status-tag ${selectedEvent.status.toLowerCase()}`}>
                                                {selectedEvent.status}
                                            </span>
                                        </div>
                                        <h2 className="event-master-title">{selectedEvent.title}</h2>
                                        {selectedEvent.description && (
                                            <p className="event-master-desc">{selectedEvent.description}</p>
                                        )}
                                    </div>

                                    <div className="event-header-buttons">
                                        {/* STANDOUT PRINT BUTTON */}
                                        <button
                                            type="button"
                                            className="btn-print-plan-cta"
                                            onClick={() => setShowPrintModal(true)}
                                            title="Print official Church Event Plan"
                                        >
                                            <Printer size={18} />
                                            <span>Print Final Event Plan</span>
                                        </button>

                                        <button
                                            type="button"
                                            className="btn-secondary-action"
                                            onClick={handleOpenEditEventModal}
                                            title="Edit Event Details"
                                        >
                                            <Edit3 size={15} />
                                            <span>Edit</span>
                                        </button>

                                        <button
                                            type="button"
                                            className="btn-secondary-action danger"
                                            onClick={handleDeleteEvent}
                                            title="Delete Event"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                {/* EVENT SUMMARY TILES */}
                                <div className="event-meta-strip">
                                    <div className="meta-strip-item">
                                        <span className="meta-label">EVENT DATE</span>
                                        <strong className="meta-val"><Calendar size={14} /> {formatDate(selectedEvent.startDate)}</strong>
                                    </div>
                                    <div className="meta-strip-item">
                                        <span className="meta-label">TIME WINDOW</span>
                                        <strong className="meta-val"><Clock size={14} /> {selectedEvent.startTime || "TBA"} - {selectedEvent.endTime || "TBA"}</strong>
                                    </div>
                                    <div className="meta-strip-item">
                                        <span className="meta-label">FACILITY / VENUE</span>
                                        <strong className="meta-val"><MapPin size={14} /> {selectedEvent.location}</strong>
                                    </div>
                                    <div className="meta-strip-item">
                                        <span className="meta-label">LEAD DIRECTOR / SPEAKER</span>
                                        <strong className="meta-val"><UserCheck size={14} /> {selectedEvent.coordinator}</strong>
                                    </div>
                                    <div className="meta-strip-item">
                                        <span className="meta-label">MINISTRY OVERSIGHT</span>
                                        <strong className="meta-val"><Building size={14} /> {selectedEvent.ministry || "Luke 4:18 Ministries"}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* NAVIGATION TABS */}
                            <div className="event-nav-tabs">
                                <button
                                    type="button"
                                    className={`event-tab-btn ${activeTab === "rundown" ? "active" : ""}`}
                                    onClick={() => setActiveTab("rundown")}
                                >
                                    <ListOrdered size={16} />
                                    <span>Program Rundown</span>
                                    <span className="tab-count">{currentRundown.length}</span>
                                </button>

                                <button
                                    type="button"
                                    className={`event-tab-btn ${activeTab === "assignments" ? "active" : ""}`}
                                    onClick={() => setActiveTab("assignments")}
                                >
                                    <Users size={16} />
                                    <span>Team Staffing & Assignments</span>
                                    <span className="tab-count">{selectedEvent.assignments?.length || 0}</span>
                                </button>

                                <button
                                    type="button"
                                    className={`event-tab-btn ${activeTab === "logistics" ? "active" : ""}`}
                                    onClick={() => setActiveTab("logistics")}
                                >
                                    <ClipboardList size={16} />
                                    <span>Logistics & Needs</span>
                                    <span className="tab-count">{eventNeeds.length + eventChecklists.length}</span>
                                </button>

                                <button
                                    type="button"
                                    className={`event-tab-btn ${activeTab === "notes" ? "active" : ""}`}
                                    onClick={() => setActiveTab("notes")}
                                >
                                    <FileText size={16} />
                                    <span>Directives & Pastoral Notes</span>
                                </button>
                            </div>

                            {/* TAB 1: PROGRAM RUNDOWN */}
                            {activeTab === "rundown" && (
                                <section className="tab-content-section">
                                    <div className="section-toolbar">
                                        <div>
                                            <h3 className="section-title">Order of Service & Program Rundown</h3>
                                            <p className="section-subtitle">Chronological sequence of segments, assigned leaders, and technical production cues.</p>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-print-mini"
                                            onClick={() => setShowPrintModal(true)}
                                        >
                                            <Printer size={15} />
                                            <span>Print Schedule</span>
                                        </button>
                                    </div>

                                    <div className="rundown-table-card">
                                        <table className="rundown-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: "130px" }}>TIME / CUE</th>
                                                    <th>PROGRAM SEGMENT</th>
                                                    <th style={{ width: "240px" }}>LEAD / IN-CHARGE</th>
                                                    <th style={{ width: "280px" }}>TECHNICAL / AV NOTE</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentRundown.map((item, idx) => (
                                                    <tr key={item.id || idx}>
                                                        <td>
                                                            <div className="rundown-time-badge">
                                                                <Clock size={12} />
                                                                <span>{item.time}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <strong className="rundown-activity">{item.activity}</strong>
                                                        </td>
                                                        <td>
                                                            <div className="rundown-leader">
                                                                <UserCheck size={14} className="leader-icon" />
                                                                <span>{item.leader}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="rundown-cue">
                                                                <SlidersHorizontal size={13} className="cue-icon" />
                                                                <span>{item.technicalCue}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}

                            {/* TAB 2: MINISTRY ASSIGNMENTS */}
                            {activeTab === "assignments" && (
                                <section className="tab-content-section">
                                    <div className="section-toolbar">
                                        <div>
                                            <h3 className="section-title">Ministry Staffing & Committee Assignments</h3>
                                            <p className="section-subtitle">Personnel dispatched across worship, ushering, multimedia, and church operations.</p>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-primary-action"
                                            onClick={handleOpenAssignmentModal}
                                        >
                                            <Plus size={16} />
                                            <span>Add Team Assignment</span>
                                        </button>
                                    </div>

                                    {selectedEvent.assignments.length === 0 ? (
                                        <div className="assignments-empty-card">
                                            <Users size={36} className="empty-icon" />
                                            <h4>No Committee Assignments Dispatched</h4>
                                            <p>Start mobilizing volunteers, praise & worship members, sound engineers, and ushers for this event.</p>
                                            <button type="button" className="btn-primary-action" onClick={handleOpenAssignmentModal}>
                                                <Plus size={15} />
                                                <span>Assign First Volunteer</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="assignments-grid">
                                            {selectedEvent.assignments.map((assignment) => (
                                                <div key={assignment.id} className="assignment-modern-card">
                                                    <div className="assignment-card-header">
                                                        <div className="assignment-role-badge">
                                                            <Award size={14} />
                                                            <span>{assignment.role}</span>
                                                        </div>
                                                        <span className={`priority-tag ${assignment.priority.toLowerCase()}`}>
                                                            {assignment.priority}
                                                        </span>
                                                    </div>

                                                    <div className="assignment-card-body">
                                                        <div className="person-row">
                                                            <div className="person-avatar">
                                                                {assignment.person.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <strong className="person-name">{assignment.person}</strong>
                                                                <span className="department-name">{assignment.department}</span>
                                                            </div>
                                                        </div>

                                                        {assignment.notes && (
                                                            <p className="assignment-instructions">
                                                                "{assignment.notes}"
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="assignment-card-footer">
                                                        <span className={`status-pill ${assignment.status.toLowerCase().replace(/\s+/g, "-")}`}>
                                                            <CheckCircle2 size={12} />
                                                            <span>{assignment.status}</span>
                                                        </span>

                                                        <div className="assignment-actions">
                                                            <button
                                                                type="button"
                                                                className="btn-icon"
                                                                onClick={() => setViewingAssignment(assignment)}
                                                                title="View Details"
                                                            >
                                                                <Eye size={15} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn-icon"
                                                                onClick={() => handleEditAssignment(assignment)}
                                                                title="Edit Assignment"
                                                            >
                                                                <Edit3 size={15} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn-icon danger"
                                                                onClick={() => void handleDeleteAssignment(assignment)}
                                                                title="Delete Assignment"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* TAB 3: LOGISTICS & NEEDS */}
                            {activeTab === "logistics" && (
                                <section className="tab-content-section">
                                    <div className="section-toolbar">
                                        <div>
                                            <h3 className="section-title">Equipment, Logistics & Resource Planning</h3>
                                            <p className="section-subtitle">Comprehensive readiness checklist for facilities, technical gear, and event necessities.</p>
                                        </div>
                                    </div>

                                    {/* Embed existing event planning panel with real data sync */}
                                    <EventPlanningPanel eventId={selectedEvent.id} eventName={selectedEvent.title} />
                                </section>
                            )}

                            {/* TAB 4: DIRECTIVES & NOTES */}
                            {activeTab === "notes" && (
                                <section className="tab-content-section">
                                    <div className="section-toolbar">
                                        <div>
                                            <h3 className="section-title">Pastoral Directives & Biblical Anchor</h3>
                                            <p className="section-subtitle">Spiritual instructions, theme scripture, and coordinator directives.</p>
                                        </div>
                                    </div>

                                    <div className="directives-card">
                                        <div className="scripture-callout-box">
                                            <div className="scripture-badge">
                                                <BookOpen size={14} />
                                                <span>THEME SCRIPTURE ANCHOR</span>
                                            </div>
                                            <blockquote className="scripture-text">
                                                “The Spirit of the Lord is on me, because he has anointed me to proclaim good news to the poor. He has sent me to proclaim freedom for the prisoners and recovery of sight for the blind, to set the oppressed free.”
                                            </blockquote>
                                            <strong className="scripture-ref">— Luke 4:18-19 (Ministry Cornerstone)</strong>
                                        </div>

                                        <div className="directives-grid">
                                            <div className="directive-item">
                                                <span className="directive-label">EVENT OVERVIEW</span>
                                                <p className="directive-content">
                                                    {selectedEvent.description || "Official church program organized under Luke 4:18 Ministries San Vicente. All committee leaders are requested to observe proper call times and spiritual preparation."}
                                                </p>
                                            </div>

                                            <div className="directive-item">
                                                <span className="directive-label">COORDINATOR DIRECTIVES</span>
                                                <p className="directive-content">
                                                    {selectedEvent.notes || "Ensure technical sound checks are completed 45 minutes prior to doors opening. Ushers should coordinate seating arrangements for guests and new attendees."}
                                                </p>
                                            </div>

                                            <div className="directive-item">
                                                <span className="directive-label">SANCTUARY GUIDELINES</span>
                                                <p className="directive-content">
                                                    Sanctuary temperature controls, stage monitors, and live-streaming feeds must be verified by the Multimedia Team lead prior to the start of praise and worship.
                                                </p>
                                            </div>

                                            <div className="directive-item">
                                                <span className="directive-label">SENIOR PASTOR ENDORSEMENT</span>
                                                <p className="directive-content">
                                                    “Let all things be done decently and in order.” Authorized and endorsed by <strong>Pastor Ronnel M. Aviguetero</strong>, Senior Pastor.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* =================================================
                PRINT PREVIEW MODAL (OFFICIAL DIRECTIVE FORMAT)
            ================================================= */}
            {showPrintModal && selectedEvent && (
                <div className="event-modal-overlay" onClick={() => setShowPrintModal(false)}>
                    <div className="event-print-preview-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="print-modal-header no-print">
                            <div className="print-modal-title">
                                <Printer size={20} className="modal-print-icon" />
                                <div>
                                    <h3>Print Final Event Plan Directive</h3>
                                    <span>Preview the official letterhead document for Luke 4:18 Ministries San Vicente</span>
                                </div>
                            </div>
                            <div className="print-modal-header-actions">
                                <button
                                    type="button"
                                    className="btn-print-confirm"
                                    onClick={handlePrintDirect}
                                >
                                    <Printer size={16} />
                                    <span>Print Directive Now</span>
                                </button>
                                <button
                                    type="button"
                                    className="btn-close-modal"
                                    onClick={() => setShowPrintModal(false)}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* PRINTABLE LETTERHEAD DOCUMENT */}
                        <div className="event-print-sheet" id="final-event-plan-print">
                            {/* OFFICIAL CHURCH HEADER */}
                            <div className="print-doc-header">
                                <div className="print-church-brand">
                                    <div className="print-church-logo">EPIC</div>
                                    <div className="print-church-details">
                                        <h1 className="church-main-title">EPIC CHURCH MANAGEMENT SYSTEM</h1>
                                        <h2 className="church-branch">LUKE 4:18 MINISTRIES • SAN VICENTE CHURCH</h2>
                                        <span className="church-location">San Vicente, Philippines • Ministry Operations & Secretariat</span>
                                    </div>
                                </div>

                                <div className="print-doc-id-box">
                                    <span className="doc-type-tag">OFFICIAL OPERATIONAL DIRECTIVE</span>
                                    <strong className="doc-num">EPIC-EOD-2026-{String(selectedEvent.id).padStart(4, "0")}</strong>
                                    <span className="doc-date">Issued: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                                </div>
                            </div>

                            <div className="print-doc-divider" />

                            <div className="print-document-title-block">
                                <h2 className="directive-subject-title">EVENT MASTER OPERATIONAL DIRECTIVE & FINAL EVENT PLAN</h2>
                                <span className="directive-tagline">Authorized Executive Plan for Production, Staffing, and Order of Service</span>
                            </div>

                            {/* SECTION 1: EXECUTIVE EVENT SUMMARY */}
                            <div className="print-section-box">
                                <h3 className="print-section-title">I. EXECUTIVE EVENT PROFILE</h3>
                                <div className="print-profile-grid">
                                    <div className="profile-cell">
                                        <span className="cell-label">EVENT TITLE:</span>
                                        <strong className="cell-value">{selectedEvent.title}</strong>
                                    </div>
                                    <div className="profile-cell">
                                        <span className="cell-label">EVENT CLASSIFICATION:</span>
                                        <span className="cell-value">{selectedEvent.eventType}</span>
                                    </div>
                                    <div className="profile-cell">
                                        <span className="cell-label">EVENT DATE:</span>
                                        <strong className="cell-value">{formatDate(selectedEvent.startDate)}</strong>
                                    </div>
                                    <div className="profile-cell">
                                        <span className="cell-label">SCHEDULED TIME:</span>
                                        <span className="cell-value">{selectedEvent.startTime || "09:00 AM"} – {selectedEvent.endTime || "11:30 AM"}</span>
                                    </div>
                                    <div className="profile-cell">
                                        <span className="cell-label">VENUE / SANCTUARY:</span>
                                        <strong className="cell-value">{selectedEvent.location}</strong>
                                    </div>
                                    <div className="profile-cell">
                                        <span className="cell-label">PRESIDING MINISTER:</span>
                                        <span className="cell-value">{selectedEvent.coordinator}</span>
                                    </div>
                                    <div className="profile-cell" style={{ gridColumn: "1 / -1" }}>
                                        <span className="cell-label">MINISTRY THEME / SCRIPTURE:</span>
                                        <span className="cell-value italic">
                                            “The Spirit of the Lord is on me, because he has anointed me to proclaim good news to the poor.” (Luke 4:18)
                                        </span>
                                    </div>
                                    {selectedEvent.description && (
                                        <div className="profile-cell" style={{ gridColumn: "1 / -1" }}>
                                            <span className="cell-label">EVENT PURPOSE & DIRECTIVE:</span>
                                            <span className="cell-value">{selectedEvent.description}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SECTION 2: PROGRAM RUNDOWN */}
                            <div className="print-section-box">
                                <h3 className="print-section-title">II. PROGRAM RUNDOWN & ORDER OF SERVICE</h3>
                                <table className="print-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "120px" }}>TIME SLOT</th>
                                            <th>PROGRAM SEGMENT / ACTIVITY</th>
                                            <th style={{ width: "220px" }}>LEAD PERSON / TEAM</th>
                                            <th style={{ width: "240px" }}>TECHNICAL & PRODUCTION CUE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentRundown.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="center bold">{item.time}</td>
                                                <td className="bold">{item.activity}</td>
                                                <td>{item.leader}</td>
                                                <td className="cue-cell">{item.technicalCue}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* SECTION 3: MINISTRY ASSIGNMENTS MATRIX */}
                            <div className="print-section-box">
                                <h3 className="print-section-title">III. COMMITTEE & MINISTRY STAFFING MATRIX</h3>
                                {selectedEvent.assignments.length === 0 ? (
                                    <p className="print-empty-note">General volunteer mobilization. All active church ministry members on duty.</p>
                                ) : (
                                    <table className="print-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: "180px" }}>DEPARTMENT / MINISTRY</th>
                                                <th style={{ width: "200px" }}>ASSIGNED ROLE</th>
                                                <th>PERSONNEL IN-CHARGE</th>
                                                <th style={{ width: "100px" }}>PRIORITY</th>
                                                <th style={{ width: "110px" }}>CONFIRMATION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedEvent.assignments.map((a, idx) => (
                                                <tr key={idx}>
                                                    <td className="bold">{a.department || "Church Operations"}</td>
                                                    <td>{a.role}</td>
                                                    <td className="bold">{a.person}</td>
                                                    <td className="center">{a.priority}</td>
                                                    <td className="center">{a.status}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* SECTION 4: LOGISTICS & EQUIPMENT VERIFICATION */}
                            <div className="print-section-box">
                                <h3 className="print-section-title">IV. LOGISTICS & EQUIPMENT READINESS VERIFICATION</h3>
                                {eventNeeds.length === 0 ? (
                                    <div className="print-logistics-standard">
                                        <p>Standard Sanctuary Setup Applied: FOH Sound Console, Stage Microphones, Video Projectors, Sanctuary Air Conditioning, Emergency Medical Kit, Welcome Registration Table, and Offering Buckets.</p>
                                    </div>
                                ) : (
                                    <table className="print-table">
                                        <thead>
                                            <tr>
                                                <th>EQUIPMENT / ITEM</th>
                                                <th style={{ width: "140px" }}>CATEGORY</th>
                                                <th style={{ width: "80px" }}>QTY</th>
                                                <th style={{ width: "180px" }}>RESPONSIBLE PERSON</th>
                                                <th style={{ width: "110px" }}>STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {eventNeeds.map((n, idx) => (
                                                <tr key={idx}>
                                                    <td className="bold">{n.needName}</td>
                                                    <td>{n.category || "Logistics"}</td>
                                                    <td className="center">{n.quantity || 1} {n.unit || ""}</td>
                                                    <td>{n.responsiblePerson || "Operations Lead"}</td>
                                                    <td className="center">{n.status || "Ready"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* SECTION 5: SIGNATURES & ENDORSEMENT */}
                            <div className="print-endorsement-block">
                                <h3 className="print-section-title">V. OFFICIAL AUTHORIZATION & ENDORSEMENTS</h3>
                                <div className="print-signatures-grid">
                                    <div className="sig-box">
                                        <span className="sig-label">PREPARED BY:</span>
                                        <div className="sig-line" />
                                        <strong className="sig-name">{selectedEvent.coordinator || "Event Coordinator"}</strong>
                                        <span className="sig-title">Event Operations Director</span>
                                    </div>

                                    <div className="sig-box">
                                        <span className="sig-label">NOTED BY:</span>
                                        <div className="sig-line" />
                                        <strong className="sig-name">Head of Ministries</strong>
                                        <span className="sig-title">Luke 4:18 Pastoral Secretariat</span>
                                    </div>

                                    <div className="sig-box">
                                        <span className="sig-label">APPROVED BY:</span>
                                        <div className="sig-line" />
                                        <strong className="sig-name">PASTOR RONNEL M. AVIGUETERO</strong>
                                        <span className="sig-title">Senior Pastor • Luke 4:18 Ministries</span>
                                    </div>
                                </div>
                            </div>

                            <div className="print-footer-notice">
                                <span>Official Church Directive • Luke 4:18 Ministries San Vicente • Generated via EPIC Church Management System</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================
                CREATE / EDIT EVENT MODAL
            ================================================= */}
            {showCreateModal && (
                <div className="event-modal-overlay" onClick={() => !creating && setShowCreateModal(false)}>
                    <div className="event-dialog-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dialog-modal-header">
                            <div>
                                <span className="modal-eyebrow">CHURCH EVENT REGISTRATION</span>
                                <h2>{isEditingEvent ? "Edit Event Plan" : "Create New Church Event"}</h2>
                                <p>Set up dates, venues, presiding pastors, and initial program directives.</p>
                            </div>
                            <button
                                type="button"
                                className="btn-close-modal"
                                disabled={creating}
                                onClick={() => setShowCreateModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEvent} className="dialog-modal-form">
                            <div className="form-row full">
                                <label>EVENT TITLE *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Sunday Worship Celebration & Anointing Service"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </div>

                            <div className="form-row half">
                                <div>
                                    <label>EVENT CLASSIFICATION</label>
                                    <select
                                        value={newEvent.eventType}
                                        onChange={(e) => setNewEvent(prev => ({ ...prev, eventType: e.target.value }))}
                                    >
                                        <option value="Sunday Worship">Sunday Worship</option>
                                        <option value="Midweek Service">Midweek Service</option>
                                        <option value="Youth Alive">Youth Alive Service</option>
                                        <option value="Men of Integrity">Men of Integrity Fellowship</option>
                                        <option value="Women of Grace">Women of Grace Fellowship</option>
                                        <option value="Leadership Seminar">Leadership & Discipleship Seminar</option>
                                        <option value="Water Baptism">Water Baptism & Dedication</option>
                                        <option value="Community Outreach">Community Medical & Food Outreach</option>
                                        <option value="Concert of Praise">Concert of Praise & Worship</option>
                                        <option value="Conference">General Conference</option>
                                    </select>
                                </div>

                                <div>
                                    <label>VENUE / FACILITY *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Main Sanctuary, San Vicente"
                                        value={newEvent.location}
                                        onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="form-row third">
                                <div>
                                    <label>EVENT DATE *</label>
                                    <input
                                        type="date"
                                        required
                                        value={newEvent.startDate}
                                        onChange={(e) => setNewEvent(prev => ({ ...prev, startDate: e.target.value }))}
                                    />
                                </div>

                                <div>
                                    <label>START TIME</label>
                                    <input
                                        type="text"
                                        placeholder="09:00 AM"
                                        value={newEvent.startTime}
                                        onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                                    />
                                </div>

                                <div>
                                    <label>END TIME</label>
                                    <input
                                        type="text"
                                        placeholder="11:30 AM"
                                        value={newEvent.endTime}
                                        onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="form-row half">
                                <div>
                                    <label>PRESIDING SPEAKER / COORDINATOR</label>
                                    <input
                                        type="text"
                                        placeholder="Pastor Ronnel M. Aviguetero"
                                        value={newEvent.coordinator}
                                        onChange={(e) => setNewEvent(prev => ({ ...prev, coordinator: e.target.value }))}
                                    />
                                </div>

                                <div>
                                    <label>MINISTRY OVERSIGHT</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Pastoral & Worship"
                                        value={newEvent.ministry}
                                        onChange={(e) => setNewEvent(prev => ({ ...prev, ministry: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="form-row full">
                                <label>EVENT DESCRIPTION & PURPOSE</label>
                                <textarea
                                    rows={2}
                                    placeholder="Brief overview of event goals, target attendees, and key objectives..."
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>

                            <div className="form-row full">
                                <label>COORDINATOR NOTES / DIRECTIVES</label>
                                <textarea
                                    rows={2}
                                    placeholder="Technical AV reminders, call time instructions, sound check schedules..."
                                    value={newEvent.notes}
                                    onChange={(e) => setNewEvent(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>

                            <div className="dialog-modal-actions">
                                <button
                                    type="button"
                                    className="btn-modal-cancel"
                                    disabled={creating}
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-modal-save"
                                    disabled={creating}
                                >
                                    {creating ? "Saving Event..." : isEditingEvent ? "Update Event Plan" : "Create Event Directive"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =================================================
                ASSIGNMENT MODAL
            ================================================= */}
            {showAssignmentModal && selectedEvent && (
                <div className="event-modal-overlay" onClick={() => !savingAssignment && setShowAssignmentModal(false)}>
                    <div className="event-dialog-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dialog-modal-header">
                            <div>
                                <span className="modal-eyebrow">MINISTRY COMMITTEE STAFFING</span>
                                <h2>{editingAssignment ? "Edit Committee Assignment" : "Assign Volunteer / Minister"}</h2>
                                <p>Assign roles for: <strong>{selectedEvent.title}</strong></p>
                            </div>
                            <button
                                type="button"
                                className="btn-close-modal"
                                disabled={savingAssignment}
                                onClick={() => setShowAssignmentModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAssignment} className="dialog-modal-form">
                            <div className="form-row half">
                                <div>
                                    <label>ASSIGNED ROLE *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Worship Leader, Head Usher, AV Sound"
                                        value={assignmentForm.role}
                                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, role: e.target.value }))}
                                    />
                                </div>

                                <div>
                                    <label>ASSIGNED PERSON / TEAM *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Sis. Grace Santos, Bro. Daniel"
                                        value={assignmentForm.person}
                                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, person: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="form-row third">
                                <div>
                                    <label>MINISTRY / DEPARTMENT</label>
                                    <select
                                        value={assignmentForm.department}
                                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, department: e.target.value }))}
                                    >
                                        <option value="Worship Ministry">Praise & Worship</option>
                                        <option value="Ushering & Welcome">Ushering & Welcome</option>
                                        <option value="Multimedia & Audio">Multimedia & Sound</option>
                                        <option value="Pastoral & Preaching">Pastoral & Preaching</option>
                                        <option value="Intercessory Prayer">Intercessory Prayer</option>
                                        <option value="Children's Ministry">Children's Ministry</option>
                                        <option value="Hospitality & Food">Hospitality & Food</option>
                                        <option value="Security & Logistics">Security & Logistics</option>
                                    </select>
                                </div>

                                <div>
                                    <label>PRIORITY</label>
                                    <select
                                        value={assignmentForm.priority}
                                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, priority: e.target.value }))}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Normal">Normal</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label>STATUS</label>
                                    <select
                                        value={assignmentForm.status}
                                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, status: e.target.value as AssignmentDisplayStatus }))}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Assigned">Assigned</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row full">
                                <label>ASSIGNMENT INSTRUCTIONS & SPECIAL NOTES</label>
                                <textarea
                                    rows={3}
                                    placeholder="Specific call time, equipment assignments, or coordination instructions..."
                                    value={assignmentForm.notes}
                                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>

                            <div className="dialog-modal-actions">
                                <button
                                    type="button"
                                    className="btn-modal-cancel"
                                    disabled={savingAssignment}
                                    onClick={() => setShowAssignmentModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-modal-save"
                                    disabled={savingAssignment}
                                >
                                    {savingAssignment ? "Saving..." : editingAssignment ? "Update Assignment" : "Confirm Assignment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =================================================
                VIEW ASSIGNMENT CARD MODAL
            ================================================= */}
            {viewingAssignment && (
                <div className="event-modal-overlay" onClick={() => setViewingAssignment(null)}>
                    <div className="event-dialog-modal view-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dialog-modal-header">
                            <div>
                                <span className="modal-eyebrow">ASSIGNMENT PROFILE</span>
                                <h2>{viewingAssignment.role}</h2>
                                <p>{viewingAssignment.department}</p>
                            </div>
                            <button
                                type="button"
                                className="btn-close-modal"
                                onClick={() => setViewingAssignment(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="assignment-profile-body">
                            <div className="profile-detail-row">
                                <span className="p-label">Assigned Person:</span>
                                <strong className="p-val">{viewingAssignment.person}</strong>
                            </div>
                            <div className="profile-detail-row">
                                <span className="p-label">Ministry / Department:</span>
                                <span className="p-val">{viewingAssignment.department}</span>
                            </div>
                            <div className="profile-detail-row">
                                <span className="p-label">Priority:</span>
                                <span className={`priority-tag ${viewingAssignment.priority.toLowerCase()}`}>
                                    {viewingAssignment.priority}
                                </span>
                            </div>
                            <div className="profile-detail-row">
                                <span className="p-label">Confirmation Status:</span>
                                <span className={`status-pill ${viewingAssignment.status.toLowerCase().replace(/\s+/g, "-")}`}>
                                    {viewingAssignment.status}
                                </span>
                            </div>
                            {viewingAssignment.notes && (
                                <div className="profile-notes-box">
                                    <span className="p-label">Instructions / Notes:</span>
                                    <p className="p-notes-text">{viewingAssignment.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="dialog-modal-actions">
                            <button
                                type="button"
                                className="btn-modal-cancel"
                                onClick={() => setViewingAssignment(null)}
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                className="btn-modal-save"
                                onClick={() => {
                                    const a = viewingAssignment;
                                    setViewingAssignment(null);
                                    handleEditAssignment(a);
                                }}
                            >
                                Edit Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventManagementPage;