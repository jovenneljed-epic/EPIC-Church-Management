import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import "./DemoRequests.css";
import { API_BASE_URL } from "../config";

// =========================================================
// TYPES
// =========================================================

interface DemoRequest {
    demoRequestId: number;

    fullName: string;
    churchName: string;
    email: string;

    phone?: string | null;
    position?: string | null;
    message?: string | null;

    status: string;

    adminNotes?: string | null;

    createdDate: string;

    contactedDate?: string | null;
    demoDate?: string | null;
}

interface DemoSummary {
    total: number;
    pending: number;
    contacted: number;
    scheduled: number;
    completed: number;
    cancelled: number;
}

interface ApiResponse {
    success?: boolean;
    message?: string;
    title?: string;
    errors?: Record<string, string[]>;
}

// =========================================================
// STATUS OPTIONS
// =========================================================

const STATUS_OPTIONS = [
    "Pending",
    "Contacted",
    "Scheduled",
    "Completed",
    "Cancelled"
];

// =========================================================
// AUTH TOKEN
// =========================================================

const getAuthToken = (): string | null => {

    const keys = [
        "token",
        "accessToken",
        "jwt",
        "authToken",
        "epicToken"
    ];

    for (const key of keys) {

        const token =
            localStorage.getItem(key);

        if (token) {
            return token;
        }
    }

    return null;
};

// =========================================================
// DATE FORMATTER
// =========================================================

const formatDate = (
    value?: string | null
): string => {

    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );
};

// =========================================================
// DATETIME LOCAL
// =========================================================

const toDateTimeLocal = (
    value?: string | null
): string => {

    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const pad = (
        number: number
    ) =>
        String(number).padStart(2, "0");

    return (
        `${date.getFullYear()}-` +
        `${pad(date.getMonth() + 1)}-` +
        `${pad(date.getDate())}T` +
        `${pad(date.getHours())}:` +
        `${pad(date.getMinutes())}`
    );
};

// =========================================================
// STATUS CLASS
// =========================================================

const getStatusClass = (
    status: string
): string => {

    return status
        .toLowerCase()
        .replace(/\s+/g, "-");
};

// =========================================================
// COMPONENT
// =========================================================

const DemoRequests: React.FC = () => {

    // =====================================================
    // STATE
    // =====================================================

    const [requests, setRequests] =
        useState<DemoRequest[]>([]);

    const [summary, setSummary] =
        useState<DemoSummary>({
            total: 0,
            pending: 0,
            contacted: 0,
            scheduled: 0,
            completed: 0,
            cancelled: 0
        });

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [searchTerm, setSearchTerm] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("All");

    const [selectedRequest, setSelectedRequest] =
        useState<DemoRequest | null>(null);

    const [editingStatus, setEditingStatus] =
        useState("Pending");

    const [adminNotes, setAdminNotes] =
        useState("");

    const [contactedDate, setContactedDate] =
        useState("");

    const [demoDate, setDemoDate] =
        useState("");

    const [saving, setSaving] =
        useState(false);

    const [deleting, setDeleting] =
        useState(false);

    // =====================================================
    // AUTH HEADERS
    // =====================================================

    const getHeaders = (): HeadersInit => {

        const token =
            getAuthToken();

        return {
            "Content-Type": "application/json",

            ...(token
                ? {
                    Authorization:
                        `Bearer ${token}`
                }
                : {})
        };
    };

    // =====================================================
    // LOAD REQUESTS
    // =====================================================

    const loadRequests = useCallback(
        async (
            showRefresh = false
        ) => {

            try {

                if (showRefresh) {
                    setRefreshing(true);
                }
                else {
                    setLoading(true);
                }

                setError("");

                const response =
                    await fetch(
                        `${API_BASE_URL}/DemoRequests`,
                        {
                            method: "GET",
                            headers: getHeaders()
                        }
                    );

                if (!response.ok) {

                    if (
                        response.status === 401 ||
                        response.status === 403
                    ) {
                        throw new Error(
                            "You are not authorized to view demo requests."
                        );
                    }

                    throw new Error(
                        `Failed to load demo requests. (${response.status})`
                    );
                }

                const data =
                    await response.json();

                setRequests(
                    Array.isArray(data)
                        ? data
                        : []
                );

            }
            catch (err) {

                console.error(
                    "DemoRequests load error:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load demo requests."
                );

            }
            finally {

                setLoading(false);
                setRefreshing(false);

            }

        },
        []
    );

    // =====================================================
    // LOAD SUMMARY
    // =====================================================

    const loadSummary = useCallback(
        async () => {

            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/DemoRequests/summary`,
                        {
                            method: "GET",
                            headers: getHeaders()
                        }
                    );

                if (!response.ok) {
                    return;
                }

                const data =
                    await response.json();

                setSummary({
                    total:
                        Number(data.total) || 0,

                    pending:
                        Number(data.pending) || 0,

                    contacted:
                        Number(data.contacted) || 0,

                    scheduled:
                        Number(data.scheduled) || 0,

                    completed:
                        Number(data.completed) || 0,

                    cancelled:
                        Number(data.cancelled) || 0
                });

            }
            catch (err) {

                console.error(
                    "DemoRequests summary error:",
                    err
                );

            }

        },
        []
    );

    // =====================================================
    // LOAD EVERYTHING
    // =====================================================

    const loadData = useCallback(
        async (
            showRefresh = false
        ) => {

            await Promise.all([
                loadRequests(showRefresh),
                loadSummary()
            ]);

        },
        [
            loadRequests,
            loadSummary
        ]
    );

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadData();

    }, [loadData]);

    // =====================================================
    // FILTER
    // =====================================================

    const filteredRequests =
        useMemo(() => {

            const search =
                searchTerm
                    .trim()
                    .toLowerCase();

            return requests.filter(
                request => {

                    const matchesSearch =
                        !search ||
                        request.fullName
                            ?.toLowerCase()
                            .includes(search) ||
                        request.churchName
                            ?.toLowerCase()
                            .includes(search) ||
                        request.email
                            ?.toLowerCase()
                            .includes(search) ||
                        request.phone
                            ?.toLowerCase()
                            .includes(search) ||
                        request.position
                            ?.toLowerCase()
                            .includes(search);

                    const matchesStatus =
                        statusFilter === "All" ||
                        request.status
                            ?.toLowerCase() ===
                        statusFilter.toLowerCase();

                    return (
                        matchesSearch &&
                        matchesStatus
                    );
                }
            );

        }, [
            requests,
            searchTerm,
            statusFilter
        ]);

    // =====================================================
    // VIEW REQUEST
    // =====================================================

    const handleView = (
        request: DemoRequest
    ) => {

        setSelectedRequest(request);

        setEditingStatus(
            request.status ||
            "Pending"
        );

        setAdminNotes(
            request.adminNotes ||
            ""
        );

        setContactedDate(
            toDateTimeLocal(
                request.contactedDate
            )
        );

        setDemoDate(
            toDateTimeLocal(
                request.demoDate
            )
        );
    };

    // =====================================================
    // SAVE REQUEST
    // =====================================================

    const handleSave = async () => {

        if (!selectedRequest) {
            return;
        }

        try {

            setSaving(true);

            setError("");

            // -------------------------------------------------
            // REQUEST BODY
            // -------------------------------------------------

            const requestBody = {
                status:
                    editingStatus,

                adminNotes:
                    adminNotes.trim() ||
                    null,

                contactedDate:
                    contactedDate
                        ? new Date(
                            contactedDate
                        ).toISOString()
                        : null,

                demoDate:
                    demoDate
                        ? new Date(
                            demoDate
                        ).toISOString()
                        : null
            };

            console.log(
                "Updating Demo Request:",
                selectedRequest.demoRequestId
            );

            console.log(
                "Request Body:",
                requestBody
            );

            // -------------------------------------------------
            // API
            // -------------------------------------------------

            const response =
                await fetch(
                    `${API_BASE_URL}/DemoRequests/${selectedRequest.demoRequestId}`,
                    {
                        method: "PUT",

                        headers:
                            getHeaders(),

                        body:
                            JSON.stringify(
                                requestBody
                            )
                    }
                );

            // -------------------------------------------------
            // READ RESPONSE
            // -------------------------------------------------

            const data:
                ApiResponse =
                await response
                    .json()
                    .catch(
                        () => ({})
                    );

            console.log(
                "Demo request update API response:",
                response.status,
                data
            );

            // -------------------------------------------------
            // HANDLE ERROR
            // -------------------------------------------------

            if (!response.ok) {

                let errorMessage =
                    data.message ||
                    data.title ||
                    `Request failed with status ${response.status}.`;

                if (data.errors) {

                    const validationErrors =
                        Object.entries(
                            data.errors
                        )
                            .flatMap(
                                ([
                                    field,
                                    messages
                                ]) =>
                                    (
                                        messages ||
                                        []
                                    ).map(
                                        message =>
                                            `${field}: ${message}`
                                    )
                            );

                    if (
                        validationErrors.length >
                        0
                    ) {

                        errorMessage +=
                            " " +
                            validationErrors.join(
                                " "
                            );
                    }
                }

                console.error(
                    "Demo request update API error:",
                    data
                );

                throw new Error(
                    errorMessage
                );
            }

            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            alert(
                data.message ||
                "Demo request updated successfully."
            );

            setSelectedRequest(null);

            await loadData(true);

        }
        catch (err) {

            console.error(
                "DemoRequests save error:",
                err
            );

            alert(
                err instanceof Error
                    ? err.message
                    : "Unable to update demo request."
            );

        }
        finally {

            setSaving(false);

        }
    };

    // =====================================================
    // DELETE
    // =====================================================

    const handleDelete = async () => {

        if (!selectedRequest) {
            return;
        }

        const confirmed =
            window.confirm(
                `Delete the demo request from ${selectedRequest.fullName}?`
            );

        if (!confirmed) {
            return;
        }

        try {

            setDeleting(true);

            const response =
                await fetch(
                    `${API_BASE_URL}/DemoRequests/${selectedRequest.demoRequestId}`,
                    {
                        method: "DELETE",
                        headers:
                            getHeaders()
                    }
                );

            const data:
                ApiResponse =
                await response
                    .json()
                    .catch(
                        () => ({})
                    );

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.title ||
                    "Failed to delete demo request."
                );
            }

            alert(
                data.message ||
                "Demo request deleted successfully."
            );

            setSelectedRequest(null);

            await loadData(true);

        }
        catch (err) {

            console.error(
                "DemoRequests delete error:",
                err
            );

            alert(
                err instanceof Error
                    ? err.message
                    : "Unable to delete demo request."
            );

        }
        finally {

            setDeleting(false);

        }
    };

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeModal = () => {

        if (
            saving ||
            deleting
        ) {
            return;
        }

        setSelectedRequest(null);
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div className="demo-requests-page">

                <div className="demo-loading">

                    <div>
                        ⏳
                    </div>

                    <h3>
                        Loading Demo Requests
                    </h3>

                    <p>
                        Please wait while we retrieve
                        incoming demo requests.
                    </p>

                </div>

            </div>
        );
    }

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="demo-requests-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="demo-page-header">

                <div>

                    <h1>
                        Demo Requests
                    </h1>

                    <p>
                        Manage churches interested in
                        an EPIC system demonstration.
                    </p>

                </div>

                <button
                    type="button"
                    className="demo-refresh-button"
                    onClick={() =>
                        loadData(true)
                    }
                    disabled={refreshing}
                >
                    {refreshing
                        ? "Refreshing..."
                        : "↻ Refresh"}
                </button>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div
                    style={{
                        background: "#fee2e2",
                        color: "#991b1b",
                        padding: "14px 16px",
                        borderRadius: "10px",
                        marginBottom: "20px"
                    }}
                >
                    {error}
                </div>

            )}

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="demo-summary-grid">

                <div className="demo-summary-card">
                    <span className="summary-icon">
                        📋
                    </span>

                    <div>
                        <strong>
                            {summary.total}
                        </strong>

                        <span>
                            Total Requests
                        </span>
                    </div>
                </div>

                <div className="demo-summary-card">
                    <span className="summary-icon">
                        ⏳
                    </span>

                    <div>
                        <strong>
                            {summary.pending}
                        </strong>

                        <span>
                            Pending
                        </span>
                    </div>
                </div>

                <div className="demo-summary-card">
                    <span className="summary-icon">
                        📞
                    </span>

                    <div>
                        <strong>
                            {summary.contacted}
                        </strong>

                        <span>
                            Contacted
                        </span>
                    </div>
                </div>

                <div className="demo-summary-card">
                    <span className="summary-icon">
                        📅
                    </span>

                    <div>
                        <strong>
                            {summary.scheduled}
                        </strong>

                        <span>
                            Scheduled
                        </span>
                    </div>
                </div>

                <div className="demo-summary-card">
                    <span className="summary-icon">
                        ✓
                    </span>

                    <div>
                        <strong>
                            {summary.completed}
                        </strong>

                        <span>
                            Completed
                        </span>
                    </div>
                </div>

                <div className="demo-summary-card">
                    <span className="summary-icon">
                        ✕
                    </span>

                    <div>
                        <strong>
                            {summary.cancelled}
                        </strong>

                        <span>
                            Cancelled
                        </span>
                    </div>
                </div>

            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="demo-table-card">

                <div className="demo-table-header">

                    <h2>
                        Incoming Demo Requests
                    </h2>

                    <span>
                        Churches interested in EPIC
                    </span>

                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "16px",
                            flexWrap: "wrap"
                        }}
                    >

                        <input
                            type="text"
                            placeholder="Search requester, church, email..."
                            value={searchTerm}
                            onChange={event =>
                                setSearchTerm(
                                    event.target.value
                                )
                            }
                            style={{
                                flex: "1",
                                minWidth: "240px",
                                border:
                                    "1px solid #cbd5e1",
                                borderRadius: "8px",
                                padding:
                                    "10px 12px",
                                outline: "none"
                            }}
                        />

                        <select
                            value={statusFilter}
                            onChange={event =>
                                setStatusFilter(
                                    event.target.value
                                )
                            }
                            style={{
                                border:
                                    "1px solid #cbd5e1",
                                borderRadius: "8px",
                                padding:
                                    "10px 12px",
                                background: "white"
                            }}
                        >

                            <option value="All">
                                All Statuses
                            </option>

                            {STATUS_OPTIONS.map(
                                status => (

                                    <option
                                        key={status}
                                        value={status}
                                    >
                                        {status}
                                    </option>

                                )
                            )}

                        </select>

                    </div>

                </div>

                {filteredRequests.length === 0 ? (

                    <div className="demo-empty">

                        <div>
                            📭
                        </div>

                        <h3>
                            No Demo Requests Found
                        </h3>

                        <p>
                            No requests match your
                            current search or filter.
                        </p>

                    </div>

                ) : (

                    <div className="demo-table-wrapper">

                        <table className="demo-table">

                            <thead>

                                <tr>

                                    <th>
                                        Requester
                                    </th>

                                    <th>
                                        Church
                                    </th>

                                    <th>
                                        Contact
                                    </th>

                                    <th>
                                        Position
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Submitted
                                    </th>

                                    <th>
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredRequests.map(
                                    request => (

                                        <tr
                                            key={
                                                request.demoRequestId
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    {
                                                        request.fullName
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                <strong>
                                                    {
                                                        request.churchName
                                                    }
                                                </strong>
                                            </td>

                                            <td>

                                                <div>
                                                    {
                                                        request.email
                                                    }
                                                </div>

                                                <small>
                                                    {
                                                        request.phone ||
                                                        "No phone"
                                                    }
                                                </small>

                                            </td>

                                            <td>
                                                {
                                                    request.position ||
                                                    "—"
                                                }
                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        `demo-status ${getStatusClass(
                                                            request.status
                                                        )}`
                                                    }
                                                >
                                                    {
                                                        request.status
                                                    }
                                                </span>

                                            </td>

                                            <td>
                                                {
                                                    formatDate(
                                                        request.createdDate
                                                    )
                                                }
                                            </td>

                                            <td>

                                                <button
                                                    type="button"
                                                    className="demo-view-button"
                                                    onClick={() =>
                                                        handleView(
                                                            request
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

            {/* =================================================
                MODAL
            ================================================= */}

            {selectedRequest && (

                <div
                    className="demo-modal-overlay"
                    onMouseDown={event => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }

                    }}
                >

                    <div className="demo-modal">

                        {/* HEADER */}

                        <div className="demo-modal-header">

                            <div>

                                <h2>
                                    Demo Request
                                </h2>

                                <span>
                                    Request #
                                    {
                                        selectedRequest.demoRequestId
                                    }
                                </span>

                            </div>

                            <button
                                type="button"
                                className="demo-close-button"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving ||
                                    deleting
                                }
                            >
                                ×
                            </button>

                        </div>

                        {/* DETAILS */}

                        <div className="demo-detail-grid">

                            <div className="demo-detail-item">

                                <label>
                                    Requester
                                </label>

                                <strong>
                                    {
                                        selectedRequest.fullName
                                    }
                                </strong>

                            </div>

                            <div className="demo-detail-item">

                                <label>
                                    Church
                                </label>

                                <strong>
                                    {
                                        selectedRequest.churchName
                                    }
                                </strong>

                            </div>

                            <div className="demo-detail-item">

                                <label>
                                    Email
                                </label>

                                <strong>
                                    {
                                        selectedRequest.email
                                    }
                                </strong>

                            </div>

                            <div className="demo-detail-item">

                                <label>
                                    Phone
                                </label>

                                <strong>
                                    {
                                        selectedRequest.phone ||
                                        "—"
                                    }
                                </strong>

                            </div>

                            <div className="demo-detail-item">

                                <label>
                                    Position
                                </label>

                                <strong>
                                    {
                                        selectedRequest.position ||
                                        "—"
                                    }
                                </strong>

                            </div>

                            <div className="demo-detail-item">

                                <label>
                                    Submitted
                                </label>

                                <strong>
                                    {
                                        formatDate(
                                            selectedRequest.createdDate
                                        )
                                    }
                                </strong>

                            </div>

                            <div className="demo-detail-item">

                                <label>
                                    Contacted
                                </label>

                                <strong>
                                    {
                                        formatDate(
                                            selectedRequest.contactedDate
                                        )
                                    }
                                </strong>

                            </div>

                            <div className="demo-detail-item">

                                <label>
                                    Demo Date
                                </label>

                                <strong>
                                    {
                                        formatDate(
                                            selectedRequest.demoDate
                                        )
                                    }
                                </strong>

                            </div>

                        </div>

                        {/* MESSAGE */}

                        {selectedRequest.message && (

                            <div className="demo-message-box">

                                <label>
                                    Message
                                </label>

                                <p>
                                    {
                                        selectedRequest.message
                                    }
                                </p>

                            </div>

                        )}

                        {/* ADMIN */}

                        <div className="demo-admin-section">

                            <h3>
                                Admin Management
                            </h3>

                            <div className="demo-form-group">

                                <label>
                                    Status
                                </label>

                                <select
                                    value={
                                        editingStatus
                                    }
                                    onChange={event =>
                                        setEditingStatus(
                                            event.target.value
                                        )
                                    }
                                >

                                    {STATUS_OPTIONS.map(
                                        status => (

                                            <option
                                                key={status}
                                                value={status}
                                            >
                                                {status}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>

                            <div className="demo-form-group">

                                <label>
                                    Contacted Date
                                </label>

                                <input
                                    type="datetime-local"
                                    value={
                                        contactedDate
                                    }
                                    onChange={event =>
                                        setContactedDate(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>

                            <div className="demo-form-group">

                                <label>
                                    Scheduled Demo Date
                                </label>

                                <input
                                    type="datetime-local"
                                    value={
                                        demoDate
                                    }
                                    onChange={event =>
                                        setDemoDate(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>

                            <div className="demo-form-group">

                                <label>
                                    Admin Notes
                                </label>

                                <textarea
                                    rows={5}
                                    placeholder="Add internal notes about this church or demo..."
                                    value={
                                        adminNotes
                                    }
                                    onChange={event =>
                                        setAdminNotes(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>

                        </div>

                        {/* ACTIONS */}

                        <div className="demo-modal-actions">

                            <button
                                type="button"
                                className="demo-delete-button"
                                onClick={
                                    handleDelete
                                }
                                disabled={
                                    saving ||
                                    deleting
                                }
                            >

                                {deleting
                                    ? "Deleting..."
                                    : "Delete Request"}

                            </button>

                            <div>

                                <button
                                    type="button"
                                    className="demo-cancel-button"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="demo-save-button"
                                    onClick={
                                        handleSave
                                    }
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                >

                                    {saving
                                        ? "Saving..."
                                        : "Save Changes"}

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};

export default DemoRequests;