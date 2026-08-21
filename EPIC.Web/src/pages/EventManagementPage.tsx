import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import axios from "axios";
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

/* =========================================================
   DEFAULTS
========================================================= */

const DEFAULT_EVENT_FORM: NewEventForm = {
    title: "",
    eventType: "Conference",
    location: "",
    startDate: "",
    startTime: "",
    endTime: "",
    coordinator: "",
    ministry: "",
    description: "",
    notes: "",
};

const DEFAULT_ASSIGNMENT_FORM: AssignmentForm = {
    role: "",
    person: "",
    department: "",
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
    const [selectedEventId, setSelectedEventId] =
        useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    /* =====================================================
       CREATE EVENT
    ===================================================== */

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);

    const [newEvent, setNewEvent] = useState<NewEventForm>({
        ...DEFAULT_EVENT_FORM,
    });

    /* =====================================================
       ASSIGNMENTS
    ===================================================== */

    const [showAssignmentModal, setShowAssignmentModal] =
        useState(false);

    const [savingAssignment, setSavingAssignment] = useState(false);

    const [assignmentForm, setAssignmentForm] =
        useState<AssignmentForm>({
            ...DEFAULT_ASSIGNMENT_FORM,
        });

    const [editingAssignment, setEditingAssignment] =
        useState<EventAssignment | null>(null);

    const [viewingAssignment, setViewingAssignment] =
        useState<EventAssignment | null>(null);

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

        /*
         * IMPORTANT:
         * Use string concatenation instead of a template literal.
         * This avoids the Vite/OXC parsing problem.
         */
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

            if (!data) {
                return fallback;
            }

            if (typeof data === "string") {
                return data;
            }

            if (data.message) {
                return String(data.message);
            }

            if (data.title) {
                return String(data.title);
            }

            if (data.errors) {
                const validationErrors = Object.values(
                    data.errors
                )
                    .flat()
                    .map((value) => String(value))
                    .join("\n");

                if (validationErrors) {
                    return validationErrors;
                }
            }

            return fallback;
        },
        []
    );

    /* =====================================================
       STATUS NORMALIZATION
    ===================================================== */

    const normalizeStatus = useCallback(
        (value: unknown): EventStatus => {
            const status = String(value ?? "")
                .trim()
                .toLowerCase()
                .replace(/_/g, " ");

            if (
                status === "ongoing" ||
                status === "in progress" ||
                status === "inprogress"
            ) {
                return "Ongoing";
            }

            if (
                status === "completed" ||
                status === "complete" ||
                status === "finished"
            ) {
                return "Completed";
            }

            if (
                status === "cancelled" ||
                status === "canceled"
            ) {
                return "Cancelled";
            }

            return "Upcoming";
        },
        []
    );

    const normalizeAssignmentStatus = useCallback(
        (value: unknown): AssignmentDisplayStatus => {
            const status = String(value ?? "")
                .trim()
                .toLowerCase()
                .replace(/-/g, "_")
                .replace(/\s+/g, "_");

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
        },
        []
    );

    /* =====================================================
       NORMALIZE ASSIGNMENT
    ===================================================== */

    const normalizeAssignment = useCallback(
        (
            assignment: any,
            index: number
        ): EventAssignment => {
            return {
                id: Number(
                    assignment?.eventAssignmentId ??
                        assignment?.EventAssignmentId ??
                        assignment?.id ??
                        assignment?.Id ??
                        index + 1
                ),

                eventId:
                    assignment?.eventId ??
                    assignment?.EventId,

                eventDepartmentId:
                    assignment?.eventDepartmentId ??
                    assignment?.EventDepartmentId ??
                    null,

                eventRoleId:
                    assignment?.eventRoleId ??
                    assignment?.EventRoleId ??
                    null,

                memberId:
                    assignment?.memberId ??
                    assignment?.MemberId ??
                    null,

                role:
                    assignment?.roleName ??
                    assignment?.RoleName ??
                    assignment?.role ??
                    assignment?.Role ??
                    "Unspecified Role",

                person:
                    assignment?.assignedPerson ??
                    assignment?.AssignedPerson ??
                    assignment?.memberName ??
                    assignment?.MemberName ??
                    assignment?.person ??
                    assignment?.Person ??
                    "To Be Assigned",

                department:
                    assignment?.departmentName ??
                    assignment?.DepartmentName ??
                    assignment?.department ??
                    assignment?.Department ??
                    "",

                status: normalizeAssignmentStatus(
                    assignment?.assignmentStatus ??
                        assignment?.AssignmentStatus ??
                        assignment?.status ??
                        assignment?.Status
                ),

                priority:
                    assignment?.priority ??
                    assignment?.Priority ??
                    "Normal",

                notes:
                    assignment?.notes ??
                    assignment?.Notes ??
                    "",

                createdAt:
                    assignment?.createdAt ??
                    assignment?.CreatedAt,

                updatedAt:
                    assignment?.updatedAt ??
                    assignment?.UpdatedAt ??
                    null,
            };
        },
        [normalizeAssignmentStatus]
    );

    /* =====================================================
       NORMALIZE EVENT
    ===================================================== */

    const normalizeEvent = useCallback(
        (
            event: any,
            index: number
        ): ChurchEvent => {
            const rawAssignments =
                event?.assignments ??
                event?.Assignments ??
                event?.eventAssignments ??
                event?.EventAssignments ??
                [];

            return {
                id: Number(
                    event?.eventId ??
                        event?.EventId ??
                        event?.id ??
                        event?.Id ??
                        index + 1
                ),

                title:
                    event?.title ??
                    event?.Title ??
                    "Untitled Event",

                eventType:
                    event?.eventType ??
                    event?.EventType ??
                    "Event",

                location:
                    event?.venue ??
                    event?.Venue ??
                    event?.location ??
                    event?.Location ??
                    "TBA",

                startDate:
                    event?.eventDate ??
                    event?.EventDate ??
                    event?.startDate ??
                    event?.StartDate ??
                    "",

                startTime:
                    event?.startTime ??
                    event?.StartTime ??
                    "",

                endTime:
                    event?.endTime ??
                    event?.EndTime ??
                    "",

                coordinator:
                    event?.speaker ??
                    event?.Speaker ??
                    event?.coordinator ??
                    event?.Coordinator ??
                    "To Be Assigned",

                ministry:
                    event?.ministry ??
                    event?.Ministry ??
                    "",

                status: normalizeStatus(
                    event?.status ??
                        event?.Status
                ),

                description:
                    event?.description ??
                    event?.Description ??
                    "",

                notes:
                    event?.notes ??
                    event?.Notes ??
                    "",

                assignments:
                    Array.isArray(rawAssignments)
                        ? rawAssignments.map(
                              (
                                  assignment: any,
                                  assignmentIndex: number
                              ) =>
                                  normalizeAssignment(
                                      assignment,
                                      assignmentIndex
                                  )
                          )
                        : [],
            };
        },
        [normalizeAssignment, normalizeStatus]
    );

    /* =====================================================
       LOAD EVENT ASSIGNMENTS
    ===================================================== */

    const loadEventAssignments = useCallback(
        async (
            eventId: number
        ): Promise<EventAssignment[]> => {
            try {
                const response = await axios.get(
                    API_BASE_URL +
                        "/EventAssignments/event/" +
                        eventId,
                    {
                        headers: getAuthHeaders(),
                    }
                );

                const data = response.data;

                const raw =
                    Array.isArray(data)
                        ? data
                        : data?.assignments ??
                          data?.items ??
                          data?.data ??
                          data?.value ??
                          [];

                if (!Array.isArray(raw)) {
                    return [];
                }

                return raw.map(
                    (
                        assignment: any,
                        index: number
                    ) =>
                        normalizeAssignment(
                            assignment,
                            index
                        )
                );
            } catch (err) {
                console.error(
                    "Unable to load assignments for event " +
                        eventId,
                    err
                );

                return [];
            }
        },
        [
            getAuthHeaders,
            normalizeAssignment,
        ]
    );

    /* =====================================================
       LOAD EVENTS
    ===================================================== */

    const loadEvents = useCallback(
        async (
            preferredEventId?: number | null
        ) => {
            try {
                setLoading(true);
                setError("");

                const response = await axios.get(
                    API_BASE_URL + "/Events",
                    {
                        headers: getAuthHeaders(),
                    }
                );

                const data = response.data;

                let rawEvents: any[] = [];

                if (Array.isArray(data)) {
                    rawEvents = data;
                } else if (
                    Array.isArray(data?.items)
                ) {
                    rawEvents = data.items;
                } else if (
                    Array.isArray(data?.data)
                ) {
                    rawEvents = data.data;
                } else if (
                    Array.isArray(data?.value)
                ) {
                    rawEvents = data.value;
                }

                const normalized =
                    await Promise.all(
                        rawEvents.map(
                            async (
                                event,
                                index
                            ) => {
                                const normalizedEvent =
                                    normalizeEvent(
                                        event,
                                        index
                                    );

                                const assignments =
                                    await loadEventAssignments(
                                        normalizedEvent.id
                                    );

                                return {
                                    ...normalizedEvent,
                                    assignments,
                                };
                            }
                        )
                    );

                setEvents(normalized);

                setSelectedEventId(
                    (previous) => {
                        if (
                            preferredEventId !=
                                null &&
                            normalized.some(
                                (event) =>
                                    event.id ===
                                    preferredEventId
                            )
                        ) {
                            return preferredEventId;
                        }

                        if (
                            previous != null &&
                            normalized.some(
                                (event) =>
                                    event.id ===
                                    previous
                            )
                        ) {
                            return previous;
                        }

                        return (
                            normalized[0]?.id ??
                            null
                        );
                    }
                );
            } catch (err: any) {
                console.error(
                    "Unable to load events:",
                    err
                );

                if (
                    err?.response?.status ===
                    401
                ) {
                    setError(
                        "Your session has expired or you are not authorized. Please log in again."
                    );
                } else {
                    setError(
                        getApiErrorMessage(
                            err,
                            "Unable to load events from the server."
                        )
                    );
                }

                setEvents([]);
                setSelectedEventId(null);
            } finally {
                setLoading(false);
            }
        },
        [
            getAuthHeaders,
            getApiErrorMessage,
            loadEventAssignments,
            normalizeEvent,
        ]
    );

    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        void loadEvents();
    }, [loadEvents]);

    /* =====================================================
       FILTERED EVENTS
    ===================================================== */

    const filteredEvents = useMemo(() => {
        const query =
            search.trim().toLowerCase();

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

            const matchesSearch =
                !query ||
                searchableText.includes(query);

            const matchesStatus =
                statusFilter === "ALL" ||
                event.status === statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );
        });
    }, [
        events,
        search,
        statusFilter,
    ]);

    /* =====================================================
       SELECTED EVENT
    ===================================================== */

    const selectedEvent = useMemo(
        () =>
            events.find(
                (event) =>
                    event.id ===
                    selectedEventId
            ) ?? null,
        [events, selectedEventId]
    );

    /* =====================================================
       STATISTICS
    ===================================================== */

    const statistics = useMemo(
        () => ({
            total: events.length,

            upcoming: events.filter(
                (event) =>
                    event.status === "Upcoming"
            ).length,

            ongoing: events.filter(
                (event) =>
                    event.status === "Ongoing"
            ).length,

            completed: events.filter(
                (event) =>
                    event.status === "Completed"
            ).length,
        }),
        [events]
    );

    /* =====================================================
       FORM HELPERS
    ===================================================== */

    const resetNewEvent = useCallback(() => {
        setNewEvent({
            ...DEFAULT_EVENT_FORM,
        });
    }, []);

    const resetAssignmentForm = useCallback(() => {
        setAssignmentForm({
            ...DEFAULT_ASSIGNMENT_FORM,
        });
    }, []);

    const updateNewEventField = <
        K extends keyof NewEventForm
    >(
        field: K,
        value: NewEventForm[K]
    ) => {
        setNewEvent((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const updateAssignmentField = <
        K extends keyof AssignmentForm
    >(
        field: K,
        value: AssignmentForm[K]
    ) => {
        setAssignmentForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    /* =====================================================
       CREATE EVENT MODAL
    ===================================================== */

    const handleOpenCreateModal =
        useCallback(() => {
            resetNewEvent();
            setShowCreateModal(true);
        }, [resetNewEvent]);

    const handleCloseCreateModal =
        useCallback(() => {
            if (creating) {
                return;
            }

            setShowCreateModal(false);
            resetNewEvent();
        }, [
            creating,
            resetNewEvent,
        ]);

    /* =====================================================
       CREATE EVENT
    ===================================================== */

    const handleCreateEvent = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (creating) {
            return;
        }

        const title =
            newEvent.title.trim();

        const location =
            newEvent.location.trim();

        if (!title) {
            alert(
                "Please enter the event title."
            );
            return;
        }

        if (!location) {
            alert(
                "Please enter the venue or location."
            );
            return;
        }

        if (!newEvent.startDate) {
            alert(
                "Please select the event date."
            );
            return;
        }

        if (
            newEvent.startTime &&
            newEvent.endTime &&
            newEvent.endTime <=
                newEvent.startTime
        ) {
            alert(
                "The end time must be later than the start time."
            );
            return;
        }

        try {
            setCreating(true);

            const payload = {
                title,
                eventType:
                    newEvent.eventType.trim() ||
                    "Conference",
                eventDate:
                    newEvent.startDate,
                startTime:
                    newEvent.startTime || null,
                endTime:
                    newEvent.endTime || null,
                venue: location,
                speaker:
                    newEvent.coordinator.trim() ||
                    null,
                ministry:
                    newEvent.ministry.trim() ||
                    null,
                status: "SCHEDULED",
                description:
                    newEvent.description.trim() ||
                    null,
                notes:
                    newEvent.notes.trim() ||
                    null,
            };

            const response = await axios.post(
                API_BASE_URL + "/Events",
                payload,
                {
                    headers: {
                        ...getAuthHeaders(),
                        "Content-Type":
                            "application/json",
                    },
                }
            );

            const createdId = Number(
                response.data?.eventId ??
                    response.data?.EventId ??
                    response.data?.id ??
                    response.data?.Id
            );

            setShowCreateModal(false);
            resetNewEvent();

            if (
                Number.isFinite(createdId) &&
                createdId > 0
            ) {
                await loadEvents(createdId);
            } else {
                await loadEvents();
            }

            alert(
                "Event created successfully."
            );
        } catch (err: any) {
            console.error(
                "CREATE EVENT ERROR:",
                err
            );

            alert(
                getApiErrorMessage(
                    err,
                    "Unable to create the event."
                )
            );
        } finally {
            setCreating(false);
        }
    };

    /* =====================================================
       ASSIGNMENT MODAL
    ===================================================== */

    const handleOpenAssignmentModal =
        useCallback(() => {
            if (!selectedEvent) {
                alert(
                    "Please select an event first."
                );
                return;
            }

            setEditingAssignment(null);
            resetAssignmentForm();
            setShowAssignmentModal(true);
        }, [
            resetAssignmentForm,
            selectedEvent,
        ]);

    const handleCloseAssignmentModal =
        useCallback(() => {
            if (savingAssignment) {
                return;
            }

            setShowAssignmentModal(false);
            setEditingAssignment(null);
            resetAssignmentForm();
        }, [
            resetAssignmentForm,
            savingAssignment,
        ]);

    /* =====================================================
       EDIT ASSIGNMENT
    ===================================================== */

    const handleEditAssignment = (
        assignment: EventAssignment
    ) => {
        setEditingAssignment(
            assignment
        );

        setAssignmentForm({
            role: assignment.role || "",
            person:
                assignment.person || "",
            department:
                assignment.department || "",
            status:
                assignment.status ||
                "Pending",
            priority:
                assignment.priority ||
                "Normal",
            notes:
                assignment.notes || "",
        });

        setShowAssignmentModal(true);
    };

    /* =====================================================
       SAVE ASSIGNMENT
    ===================================================== */

    const handleSaveAssignment = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!selectedEvent) {
            alert(
                "Please select an event first."
            );
            return;
        }

        if (
            !assignmentForm.role.trim()
        ) {
            alert(
                "Please enter the assignment role."
            );
            return;
        }

        if (
            !assignmentForm.person.trim()
        ) {
            alert(
                "Please enter the assigned person or team."
            );
            return;
        }

        if (savingAssignment) {
            return;
        }

        const payload = {
            eventId: selectedEvent.id,

            eventDepartmentId:
                editingAssignment?.eventDepartmentId ??
                null,

            eventRoleId:
                editingAssignment?.eventRoleId ??
                null,

            memberId:
                editingAssignment?.memberId ??
                null,

            assignedPerson:
                assignmentForm.person.trim(),

            departmentName:
                assignmentForm.department.trim() ||
                null,

            roleName:
                assignmentForm.role.trim(),

            assignmentStatus:
                assignmentForm.status
                    .trim()
                    .replace(/\s+/g, "_")
                    .toUpperCase(),

            priority:
                assignmentForm.priority
                    .trim()
                    .toUpperCase(),

            notes:
                assignmentForm.notes.trim() ||
                null,
        };

        const isEditing =
            editingAssignment !== null;

        try {
            setSavingAssignment(true);

            console.log(
                "================================="
            );
            console.log(
                "EVENT ASSIGNMENT SAVE"
            );
            console.log(
                "URL:",
                isEditing
                    ? API_BASE_URL +
                      "/EventAssignments/" +
                      editingAssignment.id
                    : API_BASE_URL +
                      "/EventAssignments"
            );
            console.log(
                "PAYLOAD:",
                payload
            );
            console.log(
                "================================="
            );

            let response;

            if (isEditing) {
                response =
                    await axios.put(
                        API_BASE_URL +
                            "/EventAssignments/" +
                            editingAssignment.id,
                        payload,
                        {
                            headers: {
                                ...getAuthHeaders(),
                                "Content-Type":
                                    "application/json",
                            },
                        }
                    );
            } else {
                response =
                    await axios.post(
                        API_BASE_URL +
                            "/EventAssignments",
                        payload,
                        {
                            headers: {
                                ...getAuthHeaders(),
                                "Content-Type":
                                    "application/json",
                            },
                        }
                    );
            }

            console.log(
                "ASSIGNMENT API RESPONSE:",
                response.data
            );

            const assignments =
                await loadEventAssignments(
                    selectedEvent.id
                );

            setEvents((previous) =>
                previous.map((event) =>
                    event.id ===
                    selectedEvent.id
                        ? {
                              ...event,
                              assignments,
                          }
                        : event
                )
            );

            setShowAssignmentModal(false);
            setEditingAssignment(null);
            resetAssignmentForm();

            alert(
                isEditing
                    ? "Assignment updated successfully."
                    : "Assignment saved successfully."
            );
        } catch (err: any) {
            console.error(
                "================================="
            );
            console.error(
                "ASSIGNMENT SAVE ERROR"
            );
            console.error(err);
            console.error(
                "STATUS:",
                err?.response?.status
            );
            console.error(
                "RESPONSE:",
                err?.response?.data
            );
            console.error(
                "================================="
            );

            const message =
                getApiErrorMessage(
                    err,
                    isEditing
                        ? "Unable to update assignment."
                        : "Unable to save assignment."
                );

            alert(message);
        } finally {
            setSavingAssignment(false);
        }
    };

    /* =====================================================
       DELETE ASSIGNMENT
    ===================================================== */

    const handleDeleteAssignment =
        async (
            assignment: EventAssignment
        ) => {
            if (!selectedEvent) {
                return;
            }

            const confirmed =
                window.confirm(
                    "Delete this assignment?\n\nRole: " +
                        assignment.role +
                        "\nAssigned: " +
                        assignment.person
                );

            if (!confirmed) {
                return;
            }

            try {
                await axios.delete(
                    API_BASE_URL +
                        "/EventAssignments/" +
                        assignment.id,
                    {
                        headers:
                            getAuthHeaders(),
                    }
                );

                const assignments =
                    await loadEventAssignments(
                        selectedEvent.id
                    );

                setEvents((previous) =>
                    previous.map((event) =>
                        event.id ===
                        selectedEvent.id
                            ? {
                                  ...event,
                                  assignments,
                              }
                            : event
                    )
                );

                if (
                    viewingAssignment?.id ===
                    assignment.id
                ) {
                    setViewingAssignment(
                        null
                    );
                }

                alert(
                    "Assignment deleted successfully."
                );
            } catch (err: any) {
                console.error(
                    "DELETE ASSIGNMENT ERROR:",
                    err
                );

                alert(
                    getApiErrorMessage(
                        err,
                        "Unable to delete assignment."
                    )
                );
            }
        };

    /* =====================================================
       DATE HELPERS
    ===================================================== */

    const normalizeDate = (
        value: string
    ) => {
        if (!value) {
            return "";
        }

        return value.includes("T")
            ? value.split("T")[0]
            : value;
    };

    const getDateObject = (
        value: string
    ): Date | null => {
        const normalized =
            normalizeDate(value);

        if (!normalized) {
            return null;
        }

        const date = new Date(
            normalized + "T00:00:00"
        );

        return Number.isNaN(
            date.getTime()
        )
            ? null
            : date;
    };

    const formatDate = (
        value: string
    ) => {
        const date =
            getDateObject(value);

        return date
            ? date.toLocaleDateString(
                  "en-US",
                  {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                  }
              )
            : value || "—";
    };

    const getEventDay = (
        value: string
    ): string | number => {
        const date =
            getDateObject(value);

        return date
            ? date.getDate()
            : "—";
    };

    const getEventMonth = (
        value: string
    ) => {
        const date =
            getDateObject(value);

        return date
            ? date.toLocaleDateString(
                  "en-US",
                  {
                      month: "short",
                  }
              )
            : "";
    };

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="event-management">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="event-page-header">

                <div className="event-page-heading">

                    <div className="event-page-icon">
                        🎯
                    </div>

                    <div>
                        <span className="event-eyebrow">
                            EPIC EVENT MANAGEMENT
                        </span>

                        <h1>
                            Event Management System
                        </h1>

                        <p>
                            Plan, organize and manage
                            church events, programs
                            and teams.
                        </p>
                    </div>

                </div>

                <button
                    type="button"
                    className="event-primary-button create-event-button"
                    onClick={
                        handleOpenCreateModal
                    }
                    disabled={creating}
                >
                    <span className="create-event-icon">
                        ＋
                    </span>

                    <span>
                        Create Event
                    </span>
                </button>

            </div>

            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="event-stat-grid">

                <div className="event-stat-card">
                    <span>
                        TOTAL EVENTS
                    </span>

                    <strong>
                        {statistics.total}
                    </strong>

                    <small>
                        All managed events
                    </small>
                </div>

                <div className="event-stat-card upcoming">
                    <span>
                        UPCOMING
                    </span>

                    <strong>
                        {statistics.upcoming}
                    </strong>

                    <small>
                        Scheduled events
                    </small>
                </div>

                <div className="event-stat-card ongoing">
                    <span>
                        ONGOING
                    </span>

                    <strong>
                        {statistics.ongoing}
                    </strong>

                    <small>
                        Currently active
                    </small>
                </div>

                <div className="event-stat-card completed">
                    <span>
                        COMPLETED
                    </span>

                    <strong>
                        {statistics.completed}
                    </strong>

                    <small>
                        Finished events
                    </small>
                </div>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="event-error">

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            void loadEvents()
                        }
                    >
                        Retry
                    </button>

                </div>
            )}

            {/* =================================================
                WORKSPACE
            ================================================= */}

            <div className="event-workspace">

                {/* =================================================
                    EVENT LIST
                ================================================= */}

                <section className="event-list-panel">

                    <div className="event-list-header">

                        <div>
                            <span>
                                EVENTS
                            </span>

                            <h2>
                                Event Calendar
                            </h2>
                        </div>

                    </div>

                    <div className="event-filters">

                        <input
                            type="text"
                            placeholder="Search events..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                        <select
                            value={
                                statusFilter
                            }
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value
                                )
                            }
                        >
                            <option value="ALL">
                                All Status
                            </option>

                            <option value="Upcoming">
                                Upcoming
                            </option>

                            <option value="Ongoing">
                                Ongoing
                            </option>

                            <option value="Completed">
                                Completed
                            </option>

                            <option value="Cancelled">
                                Cancelled
                            </option>
                        </select>

                    </div>

                    <div className="event-list">

                        {loading && (
                            <div className="event-loading">
                                Loading events...
                            </div>
                        )}

                        {!loading &&
                            filteredEvents.length ===
                                0 && (
                                <div className="event-empty-list">
                                    No events found.
                                </div>
                            )}

                        {!loading &&
                            filteredEvents.map(
                                (event) => (
                                    <button
                                        type="button"
                                        key={
                                            event.id
                                        }
                                        className={
                                            "event-list-item " +
                                            (selectedEventId ===
                                            event.id
                                                ? "selected"
                                                : "")
                                        }
                                        onClick={() =>
                                            setSelectedEventId(
                                                event.id
                                            )
                                        }
                                    >

                                        <div className="event-list-date">

                                            <strong>
                                                {getEventDay(
                                                    event.startDate
                                                )}
                                            </strong>

                                            <span>
                                                {getEventMonth(
                                                    event.startDate
                                                )}
                                            </span>

                                        </div>

                                        <div className="event-list-content">

                                            <strong>
                                                {
                                                    event.title
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    event.eventType
                                                }
                                            </span>

                                            <small>
                                                📍{" "}
                                                {
                                                    event.location
                                                }
                                            </small>

                                        </div>

                                        <span
                                            className={
                                                "event-status " +
                                                event.status.toLowerCase()
                                            }
                                        >
                                            {
                                                event.status
                                            }
                                        </span>

                                    </button>
                                )
                            )}

                    </div>

                </section>

                {/* =================================================
                    EVENT DETAILS
                ================================================= */}

                <section className="event-details-panel">

                    {loading ? (
                        <div className="event-empty-details">

                            <div>
                                ⏳
                            </div>

                            <h2>
                                Loading Events
                            </h2>

                            <p>
                                Please wait while
                                event data is
                                loaded.
                            </p>

                        </div>
                    ) : !selectedEvent ? (
                        <div className="event-empty-details">

                            <div>
                                🎯
                            </div>

                            <h2>
                                Select an Event
                            </h2>

                            <p>
                                Select an event from
                                the list to view its
                                program and team
                                details.
                            </p>

                            <button
                                type="button"
                                className="event-primary-button"
                                onClick={
                                    handleOpenCreateModal
                                }
                            >
                                ＋ Create Your First Event
                            </button>

                        </div>
                    ) : (
                        <>

                            {/* =================================================
                                EVENT HEADER
                            ================================================= */}

                            <div className="event-details-header">

                                <div>

                                    <span className="event-detail-type">
                                        {
                                            selectedEvent.eventType
                                        }
                                    </span>

                                    <h2>
                                        {
                                            selectedEvent.title
                                        }
                                    </h2>

                                    <p>
                                        {
                                            selectedEvent.description ||
                                            "No event description available."
                                        }
                                    </p>

                                </div>

                                <span
                                    className={
                                        "event-status large " +
                                        selectedEvent.status.toLowerCase()
                                    }
                                >
                                    {
                                        selectedEvent.status
                                    }
                                </span>

                            </div>

                            {/* =================================================
                                EVENT INFORMATION
                            ================================================= */}

                            <div className="event-information-grid">

                                <div>
                                    <span>
                                        DATE
                                    </span>

                                    <strong>
                                        {formatDate(
                                            selectedEvent.startDate
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        TIME
                                    </span>

                                    <strong>
                                        {
                                            selectedEvent.startTime ||
                                            "TBA"
                                        }
                                        {" — "}
                                        {
                                            selectedEvent.endTime ||
                                            "TBA"
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        VENUE
                                    </span>

                                    <strong>
                                        {
                                            selectedEvent.location
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        SPEAKER /
                                        COORDINATOR
                                    </span>

                                    <strong>
                                        {
                                            selectedEvent.coordinator
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        MINISTRY
                                    </span>

                                    <strong>
                                        {
                                            selectedEvent.ministry ||
                                            "—"
                                        }
                                    </strong>
                                </div>

                            </div>

                            {/* =================================================
                                EVENT PLANNING
                            ================================================= */}

                            <div className="event-section event-planning-section">

                                <div className="event-section-header">

                                    <div>

                                        <span>
                                            EVENT PLANNING
                                        </span>

                                        <h3>
                                            Plan This Event
                                        </h3>

                                        <p>
                                            Manage the
                                            program,
                                            departments,
                                            roles and
                                            assignments
                                            for this
                                            specific
                                            event.
                                        </p>

                                    </div>

                                </div>

                                <EventPlanningPanel
                                    eventId={
                                        selectedEvent.id
                                    }
                                />

                            </div>

                            {/* =================================================
                                NOTES
                            ================================================= */}

                            {selectedEvent.notes && (
                                <div className="event-section">

                                    <div className="event-section-header">

                                        <div>

                                            <span>
                                                EVENT NOTES
                                            </span>

                                            <h3>
                                                Additional
                                                Information
                                            </h3>

                                        </div>

                                    </div>

                                    <div className="event-notes">
                                        {
                                            selectedEvent.notes
                                        }
                                    </div>

                                </div>
                            )}

                            {/* =================================================
                                ASSIGNMENTS
                            ================================================= */}

                            <div className="event-section">

                                <div className="event-section-header">

                                    <div>

                                        <span>
                                            EVENT PROGRAM
                                        </span>

                                        <h3>
                                            Program &
                                            Team
                                            Assignments
                                        </h3>

                                    </div>

                                    <button
                                        type="button"
                                        className="event-secondary-button"
                                        onClick={
                                            handleOpenAssignmentModal
                                        }
                                    >
                                        + Add Assignment
                                    </button>

                                </div>

                                <div className="event-assignment-table">

                                    <div className="event-assignment-row header">

                                        <span>
                                            ROLE
                                        </span>

                                        <span>
                                            ASSIGNED
                                            PERSON /
                                            TEAM
                                        </span>

                                        <span>
                                            DEPARTMENT
                                        </span>

                                        <span>
                                            STATUS
                                        </span>

                                        <span>
                                            ACTION
                                        </span>

                                    </div>

                                    {selectedEvent.assignments.length ===
                                    0 ? (
                                        <div className="event-no-assignments">

                                            <div>
                                                👥
                                            </div>

                                            <strong>
                                                No
                                                assignments
                                                yet
                                            </strong>

                                            <p>
                                                Start
                                                building
                                                this
                                                event's
                                                program
                                                and
                                                working
                                                team.
                                            </p>

                                        </div>
                                    ) : (
                                        selectedEvent.assignments.map(
                                            (assignment) => (
                                                <div
                                                    className="event-assignment-row"
                                                    key={
                                                        assignment.id
                                                    }
                                                >

                                                    <strong>
                                                        {
                                                            assignment.role
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            assignment.person
                                                        }
                                                    </span>

                                                    <span>
                                                        {
                                                            assignment.department ||
                                                            "—"
                                                        }
                                                    </span>

                                                    <span
                                                        className={
                                                            assignment.status ===
                                                                "Assigned" ||
                                                            assignment.status ===
                                                                "Completed"
                                                                ? "assignment-assigned"
                                                                : "assignment-pending"
                                                        }
                                                    >
                                                        ●{" "}
                                                        {
                                                            assignment.status
                                                        }
                                                    </span>

                                                    <div className="event-assignment-actions">

                                                        <button
                                                            type="button"
                                                            className="event-assignment-view"
                                                            title="View assignment"
                                                            onClick={() =>
                                                                setViewingAssignment(
                                                                    assignment
                                                                )
                                                            }
                                                        >
                                                            👁
                                                            <span>
                                                                View
                                                            </span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="event-assignment-edit"
                                                            title="Edit assignment"
                                                            onClick={() =>
                                                                handleEditAssignment(
                                                                    assignment
                                                                )
                                                            }
                                                        >
                                                            ✎
                                                            <span>
                                                                Edit
                                                            </span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="event-assignment-delete"
                                                            title="Delete assignment"
                                                            onClick={() =>
                                                                void handleDeleteAssignment(
                                                                    assignment
                                                                )
                                                            }
                                                        >
                                                            🗑
                                                            <span>
                                                                Delete
                                                            </span>
                                                        </button>

                                                    </div>

                                                </div>
                                            )
                                        )
                                    )}

                                </div>

                            </div>

                        </>
                    )}

                </section>

            </div>

            {/* =================================================
                ADD / EDIT ASSIGNMENT MODAL
            ================================================= */}

            {showAssignmentModal &&
                selectedEvent && (
                    <div
                        className="event-modal-overlay"
                        onClick={
                            handleCloseAssignmentModal
                        }
                    >

                        <div
                            className="event-modal"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div className="event-modal-header">

                                <div>

                                    <span>
                                        EVENT PROGRAM
                                    </span>

                                    <h2>
                                        {editingAssignment
                                            ? "Edit Assignment"
                                            : "Add Assignment"}
                                    </h2>

                                    <small>
                                        {editingAssignment
                                            ? "Editing assignment #" +
                                              editingAssignment.id
                                            : (
                                                <>
                                                    Add
                                                    assignment
                                                    for:{" "}
                                                    <strong>
                                                        {
                                                            selectedEvent.title
                                                        }
                                                    </strong>
                                                </>
                                            )}
                                    </small>

                                </div>

                                <button
                                    type="button"
                                    disabled={
                                        savingAssignment
                                    }
                                    onClick={
                                        handleCloseAssignmentModal
                                    }
                                >
                                    ×
                                </button>

                            </div>

                            <form
                                onSubmit={
                                    handleSaveAssignment
                                }
                            >

                                <div className="event-form-grid">

                                    <div className="event-form-field">

                                        <label>
                                            ROLE
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                assignmentForm.role
                                            }
                                            onChange={(event) =>
                                                updateAssignmentField(
                                                    "role",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="e.g. Worship Leader"
                                            required
                                        />

                                    </div>

                                    <div className="event-form-field">

                                        <label>
                                            ASSIGNED
                                            PERSON /
                                            TEAM
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                assignmentForm.person
                                            }
                                            onChange={(event) =>
                                                updateAssignmentField(
                                                    "person",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="e.g. Juan Dela Cruz"
                                            required
                                        />

                                    </div>

                                    <div className="event-form-field">

                                        <label>
                                            DEPARTMENT /
                                            MINISTRY
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                assignmentForm.department
                                            }
                                            onChange={(event) =>
                                                updateAssignmentField(
                                                    "department",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="e.g. Worship Ministry"
                                        />

                                    </div>

                                    <div className="event-form-field">

                                        <label>
                                            PRIORITY
                                        </label>

                                        <select
                                            value={
                                                assignmentForm.priority
                                            }
                                            onChange={(event) =>
                                                updateAssignmentField(
                                                    "priority",
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="Low">
                                                Low
                                            </option>

                                            <option value="Normal">
                                                Normal
                                            </option>

                                            <option value="High">
                                                High
                                            </option>

                                            <option value="Critical">
                                                Critical
                                            </option>
                                        </select>

                                    </div>

                                    <div className="event-form-field">

                                        <label>
                                            ASSIGNMENT
                                            STATUS
                                        </label>

                                        <select
                                            value={
                                                assignmentForm.status
                                            }
                                            onChange={(event) =>
                                                updateAssignmentField(
                                                    "status",
                                                    event.target
                                                        .value as AssignmentDisplayStatus
                                                )
                                            }
                                        >
                                            <option value="Pending">
                                                Pending
                                            </option>

                                            <option value="Assigned">
                                                Assigned
                                            </option>

                                            <option value="In Progress">
                                                In Progress
                                            </option>

                                            <option value="Completed">
                                                Completed
                                            </option>

                                            <option value="Cancelled">
                                                Cancelled
                                            </option>
                                        </select>

                                    </div>

                                    <div className="event-form-field full">

                                        <label>
                                            ASSIGNMENT
                                            NOTES
                                        </label>

                                        <textarea
                                            value={
                                                assignmentForm.notes
                                            }
                                            onChange={(event) =>
                                                updateAssignmentField(
                                                    "notes",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Instructions, responsibilities, reminders..."
                                            rows={4}
                                        />

                                    </div>

                                </div>

                                <div className="event-modal-actions">

                                    <button
                                        type="button"
                                        className="event-cancel-button"
                                        disabled={
                                            savingAssignment
                                        }
                                        onClick={
                                            handleCloseAssignmentModal
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="event-primary-button"
                                        disabled={
                                            savingAssignment
                                        }
                                    >
                                        {savingAssignment
                                            ? editingAssignment
                                                ? "Updating..."
                                                : "Saving..."
                                            : editingAssignment
                                                ? "Update Assignment"
                                                : "Save Assignment"}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>
                )}

            {/* =================================================
                VIEW ASSIGNMENT
            ================================================= */}

            {viewingAssignment && (
                <div
                    className="event-modal-overlay"
                    onClick={() =>
                        setViewingAssignment(null)
                    }
                >

                    <div
                        className="event-assignment-view-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="event-modal-header">

                            <div>

                                <span>
                                    EVENT PROGRAM
                                </span>

                                <h2>
                                    Assignment Details
                                </h2>

                                {selectedEvent && (
                                    <small>
                                        {
                                            selectedEvent.title
                                        }
                                    </small>
                                )}

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setViewingAssignment(
                                        null
                                    )
                                }
                            >
                                ×
                            </button>

                        </div>

                        <div className="event-assignment-view-content">

                            <div className="assignment-view-hero">

                                <div className="assignment-view-icon">
                                    👤
                                </div>

                                <div>

                                    <span>
                                        ASSIGNED ROLE
                                    </span>

                                    <h3>
                                        {
                                            viewingAssignment.role
                                        }
                                    </h3>

                                    <p>
                                        {
                                            viewingAssignment.person
                                        }
                                    </p>

                                </div>

                            </div>

                            <div className="assignment-view-grid">

                                <div className="assignment-view-card">

                                    <span>
                                        ASSIGNED PERSON /
                                        TEAM
                                    </span>

                                    <strong>
                                        {
                                            viewingAssignment.person ||
                                            "To Be Assigned"
                                        }
                                    </strong>

                                </div>

                                <div className="assignment-view-card">

                                    <span>
                                        DEPARTMENT /
                                        MINISTRY
                                    </span>

                                    <strong>
                                        {
                                            viewingAssignment.department ||
                                            "—"
                                        }
                                    </strong>

                                </div>

                                <div className="assignment-view-card">

                                    <span>
                                        STATUS
                                    </span>

                                    <strong
                                        className={
                                            "assignment-view-status " +
                                            viewingAssignment.status
                                                .toLowerCase()
                                                .replace(
                                                    /\s+/g,
                                                    "-"
                                                )
                                        }
                                    >
                                        ●{" "}
                                        {
                                            viewingAssignment.status
                                        }
                                    </strong>

                                </div>

                                <div className="assignment-view-card">

                                    <span>
                                        PRIORITY
                                    </span>

                                    <strong
                                        className={
                                            "assignment-view-priority " +
                                            viewingAssignment.priority.toLowerCase()
                                        }
                                    >
                                        {
                                            viewingAssignment.priority
                                        }
                                    </strong>

                                </div>

                            </div>

                            <div className="assignment-view-notes">

                                <span>
                                    ASSIGNMENT NOTES
                                </span>

                                {viewingAssignment.notes ? (
                                    <p>
                                        {
                                            viewingAssignment.notes
                                        }
                                    </p>
                                ) : (
                                    <p className="empty">
                                        No additional
                                        instructions
                                        or notes were
                                        provided.
                                    </p>
                                )}

                            </div>

                            <div className="assignment-view-audit">

                                <div>

                                    <span>
                                        CREATED
                                    </span>

                                    <strong>
                                        {viewingAssignment.createdAt
                                            ? new Date(
                                                  viewingAssignment.createdAt
                                              ).toLocaleString()
                                            : "—"}
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        LAST UPDATED
                                    </span>

                                    <strong>
                                        {viewingAssignment.updatedAt
                                            ? new Date(
                                                  viewingAssignment.updatedAt
                                              ).toLocaleString()
                                            : "Not updated"}
                                    </strong>

                                </div>

                            </div>

                        </div>

                        <div className="event-assignment-view-footer">

                            <button
                                type="button"
                                className="event-secondary-button"
                                onClick={() =>
                                    setViewingAssignment(
                                        null
                                    )
                                }
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* =================================================
                CREATE EVENT MODAL
            ================================================= */}

            {showCreateModal && (
                <div
                    className="event-modal-overlay"
                    onClick={
                        handleCloseCreateModal
                    }
                >

                    <div
                        className="event-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="event-modal-header">

                            <div>

                                <span>
                                    EVENT MANAGEMENT
                                </span>

                                <h2>
                                    Create New Event
                                </h2>

                                <small>
                                    Create a new church
                                    event and start
                                    planning its
                                    program.
                                </small>

                            </div>

                            <button
                                type="button"
                                disabled={creating}
                                onClick={
                                    handleCloseCreateModal
                                }
                            >
                                ×
                            </button>

                        </div>

                        <form
                            onSubmit={
                                handleCreateEvent
                            }
                        >

                            <div className="event-form-grid">

                                <div className="event-form-field full">

                                    <label>
                                        EVENT TITLE
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            newEvent.title
                                        }
                                        onChange={(event) =>
                                            updateNewEventField(
                                                "title",
                                                event.target.value
                                            )
                                        }
                                        placeholder="e.g. Community Outreach 2026"
                                        required
                                    />

                                </div>

                                <div className="event-form-field">

                                    <label>
                                        EVENT TYPE
                                    </label>

                                    <select
                                        value={
                                            newEvent.eventType
                                        }
                                        onChange={(event) =>
                                            updateNewEventField(
                                                "eventType",
                                                event.target.value
                                            )
                                        }
                                    >
                                        <option value="Conference">
                                            Conference
                                        </option>

                                        <option value="Seminar">
                                            Seminar
                                        </option>

                                        <option value="Outreach">
                                            Outreach
                                        </option>

                                        <option value="Fun Run">
                                            Fun Run
                                        </option>

                                        <option value="Camp">
                                            Camp
                                        </option>

                                        <option value="Fellowship">
                                            Fellowship
                                        </option>

                                        <option value="Concert">
                                            Concert
                                        </option>

                                        <option value="Training">
                                            Training
                                        </option>

                                        <option value="Community Event">
                                            Community Event
                                        </option>

                                        <option value="Other">
                                            Other
                                        </option>
                                    </select>

                                </div>

                                <div className="event-form-field">

                                    <label>
                                        SPEAKER /
                                        COORDINATOR
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            newEvent.coordinator
                                        }
                                        onChange={(event) =>
                                            updateNewEventField(
                                                "coordinator",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Speaker or event coordinator"
                                    />

                                </div>

                                <div className="event-form-field full">

                                    <label>
                                        MINISTRY
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            newEvent.ministry
                                        }
                                        onChange={(event) =>
                                            updateNewEventField(
                                                "ministry",
                                                event.target.value
                                            )
                                        }
                                        placeholder="e.g. Youth Ministry"
                                    />

                                </div>

                                <div className="event-form-field full">

                                    <label>
                                        VENUE / LOCATION
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            newEvent.location
                                        }
                                        onChange={(event) =>
                                            updateNewEventField(
                                                "location",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Church, school, community center..."
                                        required
                                    />

                                </div>

                                <div className="event-form-field">

                                    <label>
                                        DATE
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            newEvent.startDate
                                        }
                                        onChange={(event) =>
                                            updateNewEventField(
                                                "startDate",
                                                event.target.value
                                            )
                                        }
                                        required
                                    />

                                </div>

                                <div className="event-form-field">

                                    <label>
                                        START TIME
                                    </label>

                                    <input
                                        type="time"
                                        value={
                                            newEvent.startTime
                                        }
                                        onChange={(event) =>
                                            updateNewEventField(
                                                "startTime",
                                                event.target.value
                                            )
                                        }
                                    />

                                </div>

                                <div className="event-form-field">

                                    <label>
                                        END TIME
                                    </label>

                                    <input
                                        type="time"
                                        value={
                                            newEvent.endTime
                                        }
                                        onChange={(event) =>
                                            updateNewEventField(
                                                "endTime",
                                                event.target.value
                                            )
                                        }
                                    />

                                </div>

                                <div className="event-form-field full">

                                    <label>
                                        DESCRIPTION
                                    </label>

                                    <textarea
                                        value={
                                            newEvent.description
                                        }
                                        onChange={(event) =>
                                            updateNewEventField(
                                                "description",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Describe the purpose and goals of this event..."
                                        rows={4}
                                    />

                                </div>

                                <div className="event-form-field full">

                                    <label>
                                        NOTES
                                    </label>

                                    <textarea
                                        value={
                                            newEvent.notes
                                        }
                                        onChange={(event) =>
                                            updateNewEventField(
                                                "notes",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Additional event notes..."
                                        rows={3}
                                    />

                                </div>

                            </div>

                            <div className="event-modal-actions">

                                <button
                                    type="button"
                                    className="event-cancel-button"
                                    disabled={creating}
                                    onClick={
                                        handleCloseCreateModal
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="event-primary-button"
                                    disabled={creating}
                                >
                                    {creating
                                        ? "Creating..."
                                        : "Create Event"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
};

export default EventManagementPage;