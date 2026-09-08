import { useEffect, useRef, useState } from "react";
import "./Attendance.css";
import { API_BASE_URL } from "./config";

const statuses = ["EARLY", "PRESENT", "LATE", "ABSENT", "EXCUSED"] as const;
type Status = typeof statuses[number];
interface Service { churchServiceId: number; serviceName: string; serviceDate: string; startTime: string; endTime: string; status: string }
interface Row { memberId: number; memberCode: string; fullName: string; ministry: string; status: Status | "PENDING"; recordedDate: string | null }
interface Roster { service: Service; ended: boolean; canUpdate: boolean; attendance: Row[] }
const label = (status: string) => status === "PENDING" ? "Not recorded yet" : status[0] + status.slice(1).toLowerCase();

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
    const [editing, setEditing] = useState<Row | null>(null);
    const [correction, setCorrection] = useState<Status>("EXCUSED");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [refresh, setRefresh] = useState(0);
    const updateController = useRef<AbortController | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        void request<Service[] | { services: Service[] }>("/ChurchServices", { signal: controller.signal })
            .then(data => { if (!controller.signal.aborted) setServices((Array.isArray(data) ? data : data.services || []).sort((a, b) => b.serviceDate.localeCompare(a.serviceDate))); })
            .catch(err => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to load services."); });
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

    const rows = roster?.attendance ?? [];
    const filtered = rows.filter(row => `${row.fullName} ${row.memberCode}`.toLowerCase().includes(search.toLowerCase()));
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
            if (!controller.signal.aborted) { setEditing(null); setMessage("Attendance updated. The member's inbox will reflect the correction."); setRefresh(n => n + 1); }
        } catch (err) {
            if (!controller.signal.aborted) { setError(err instanceof Error ? err.message : "Update failed."); setRefresh(n => n + 1); }
        } finally { if (!controller.signal.aborted) setSaving(false); }
    };

    return <div className="attendance-page">
        <div className="attendance-header"><div><h1>Attendance Management</h1><p>Automatic records with admin corrections.</p></div>
            <button className="attendance-refresh-btn" disabled={!serviceId || loading || saving} onClick={() => { setError(""); setRefresh(n => n + 1); }}>Refresh</button></div>
        {error && <div className="attendance-error" role="alert">{error}</div>}
        {message && <div className="attendance-success" role="status">{message}</div>}
        <div className="attendance-control-card"><div className="control-group"><label htmlFor="attendance-service">Church service</label>
            <select id="attendance-service" value={serviceId} disabled={saving} onChange={e => { setServiceId(e.target.value); setRoster(null); setEditing(null); setMessage(""); setError(""); }}>
                <option value="">Select a church service</option>{services.map(s => <option key={s.churchServiceId} value={s.churchServiceId}>{s.serviceDate.slice(0, 10)} — {s.serviceName} ({s.status})</option>)}
            </select></div><div className="control-group search-group"><label htmlFor="attendance-search">Find a member</label>
                <input id="attendance-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or member code" /></div></div>
        {roster && <><div className="attendance-stat-grid">{["TOTAL", ...statuses, "PENDING"].map(status => <div key={status} className={`attendance-stat-card stat-${status.toLowerCase()}`}>
            <div className="stat-label">{status === "PENDING" ? "NOT RECORDED" : status}</div><div className="stat-number">{status === "TOTAL" ? rows.length : rows.filter(row => row.status === status).length}</div></div>)}</div>
            <div className="attendance-state-banner automatic-attendance-help">Early: before start • Present: start through 15 minutes after • Late: after 15 minutes.<br />
                Missing attendance is recorded as Absent after service end. Excused requires an admin update.<br />{roster.service.startTime}–{roster.service.endTime} • {roster.service.status}</div></>}
        {editing && <section className="attendance-control-card" aria-label="Attendance correction"><div className="control-group"><strong>Update {editing.fullName}</strong><p>Recorded status: {label(editing.status)}</p>
            <label htmlFor="correct-status">Correct status</label><select id="correct-status" value={correction} disabled={saving} onChange={e => setCorrection(e.target.value as Status)}>{statuses.map(s => <option key={s} value={s}>{label(s)}</option>)}</select></div>
            <button className="save-attendance-btn" disabled={saving || correction === editing.status} onClick={() => void update()}>{saving ? "Updating…" : "Update attendance"}</button>
            <button className="attendance-refresh-btn" disabled={saving} onClick={() => setEditing(null)}>Cancel</button></section>}
        <div className="attendance-table-card"><div className="table-card-header"><div><h3>Member attendance</h3><p>Live records refresh every 10 seconds. Unrecorded members are never assumed present.</p></div></div>
            {!serviceId ? <div className="empty-attendance">Select a service to view attendance.</div> : loading && !roster ? <div className="attendance-loading">Loading attendance…</div> : <div className="attendance-table-wrapper">
                <table className="attendance-table"><thead><tr><th>#</th><th>MEMBER</th><th>CODE</th><th>MINISTRY</th><th>ATTENDANCE STATUS</th><th>ACTION</th></tr></thead><tbody>
                    {filtered.map((row, index) => <tr key={row.memberId}><td>{index + 1}</td><td><div className="member-name-cell"><div className="member-avatar">{row.fullName.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("")}</div><strong>{row.fullName}</strong></div></td>
                        <td><span className="member-code">{row.memberCode}</span></td><td>{row.ministry || "—"}</td><td><span className={`attendance-status status-${row.status.toLowerCase()} selected`}>{label(row.status)}</span></td>
                        <td><button className="attendance-refresh-btn" disabled={!roster?.canUpdate || saving} onClick={() => { setEditing(row); setCorrection(row.status === "PENDING" ? "EXCUSED" : row.status); setMessage(""); }}>Update</button></td></tr>)}
                    {!filtered.length && <tr><td colSpan={6} className="empty-attendance">No matching members.</td></tr>}
                </tbody></table></div>}
        </div>
    </div>;
}
