import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import './ClientWorkspace.css';
import ClientAdministration from './ClientAdministration';

export const clientApi = axios.create({ baseURL: `${API_BASE_URL}/ClientWorkspace` });
clientApi.interceptors.request.use(config => {
  const token = localStorage.getItem('clientToken') || sessionStorage.getItem('clientToken') || localStorage.getItem('clientAccessToken') || sessionStorage.getItem('clientAccessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const clientError = (e: unknown): string => {
  if (!axios.isAxiosError(e)) return 'Unable to complete this request.';
  if (!e.response) return 'Cannot reach the API. Check your connection and the API address, then retry.';
  const data = e.response.data;
  if (typeof data?.message === 'string') return data.message;
  if (data?.errors && typeof data.errors === 'object') {
    const messages = Object.values(data.errors).flat().filter((v): v is string => typeof v === 'string');
    if (messages.length) return messages.join(' ');
  }
  if (e.response.status === 401) return 'Your client session has expired. Sign out and sign in again.';
  if (e.response.status === 403) return 'Your role or subscription does not permit this action.';
  if (e.response.status === 404) return 'This API endpoint or record was not found. Confirm the updated backend is running.';
  if (e.response.status >= 500) return `The API could not process this request (HTTP ${e.response.status}). Check the API error log; your form entries have been kept.`;
  return `Request failed (HTTP ${e.response.status}). Check the entered values and retry.`;
};
interface Settings { username: string; email: string | null; contactNumber: string | null; churchName: string; roleName: string; canManageUsers: boolean }
export function ClientSettings({ canEdit }: { canEdit: boolean }) {
  const [data, setData] = useState<Settings | null>(null), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false), [retry, setRetry] = useState(0);
  const [currentPassword, setCurrent] = useState(''), [newPassword, setNew] = useState(''), [confirm, setConfirm] = useState('');
  useEffect(() => { const c = new AbortController(); setError(''); clientApi.get<Settings>('/settings', { signal: c.signal }).then(r => setData(r.data)).catch(e => { if (!c.signal.aborted) setError(clientError(e)); }); return () => c.abort(); }, [retry]);
  async function save(password: boolean) {
    if (busy) return;
    setError(''); setMessage('');
    if (password && newPassword !== confirm) { setError('New passwords do not match.'); return; }
    setBusy(true);
    try { const r = password ? await clientApi.post('/settings/password', { currentPassword, newPassword }) : await clientApi.put('/settings', { email: data?.email || null, contactNumber: data?.contactNumber || null }); setMessage(r.data.message); if (password) { setCurrent(''); setNew(''); setConfirm(''); } }
    catch (e) { setError(clientError(e)); } finally { setBusy(false); }
  }
  return <section className="client-workspace"><h2>Account Settings</h2>
    {error && <p role="alert">{error} <button onClick={() => setRetry(n => n + 1)}>Reload</button></p>}{message && <p role="status">{message}</p>}
    {!data ? <p>{error ? 'Account details unavailable.' : 'Loading account…'}</p> : <>
      <p>{data.churchName} · {data.roleName}</p><p>Username: <strong>{data.username}</strong></p>
      {!canEdit && <p>Your role has read-only access to account settings.</p>}
      <form onSubmit={e => { e.preventDefault(); void save(false); }}><fieldset disabled={!canEdit || busy}><legend>Contact information</legend>
        <label>Email<input type="email" maxLength={200} value={data.email || ''} onChange={e => setData({ ...data, email: e.target.value })} /></label>
        <label>Phone<input type="tel" maxLength={20} value={data.contactNumber || ''} onChange={e => setData({ ...data, contactNumber: e.target.value })} /></label>
        <button type="submit">{busy ? 'Saving…' : 'Update contact details'}</button></fieldset></form>
      <form onSubmit={e => { e.preventDefault(); void save(true); }}><fieldset disabled={!canEdit || busy}><legend>Change password</legend>
        <label>Current password<input type="password" required autoComplete="current-password" value={currentPassword} onChange={e => setCurrent(e.target.value)} /></label>
        <label>New password (at least 10 characters)<input type="password" required minLength={10} maxLength={72} autoComplete="new-password" value={newPassword} onChange={e => setNew(e.target.value)} /></label>
        <label>Confirm new password<input type="password" required autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
        <button type="submit">Change password</button></fieldset></form>{data.canManageUsers && <ClientAdministration />}</>}
  </section>;
}
interface Report { from: string; to: string; members: number | null; attendance: { status: string; count: number }[] | null; giving: { type: string; count: number; amount: number }[] | null }
export function ClientReports() {
  const date = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const [from, setFrom] = useState(date(new Date(new Date().getFullYear(), new Date().getMonth(), 1))), [to, setTo] = useState(date(new Date()));
  const [data, setData] = useState<Report | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function load() { if (busy) return; setBusy(true); setError(''); setData(null); try { setData((await clientApi.get<Report>('/reports', { params: { from, to } })).data); } catch(e) { setError(clientError(e)); } finally { setBusy(false); } }
  function download() {
    if (!data) return;
    const cell = (v: unknown) => '"' + String(v).replace(/^[=+@\-\t\r]/, m => "'" + m).replaceAll('"', '""') + '"';
    const rows: unknown[][] = [['Report from',data.from.slice(0,10),'Report to',data.to.slice(0,10)],['Section','Category','Records','Amount']];
    if(data.members != null) rows.push(['Members','Current total',data.members,'']);
    data.attendance?.forEach(r=>rows.push(['Attendance',r.status,r.count,''])); data.giving?.forEach(r=>rows.push(['Giving',r.type,r.count,r.amount]));
    const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'})); const a=document.createElement('a');a.href=url;a.download='church-report.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <section className="client-workspace"><h2>Church Reports</h2><p>Reports include only your church and modules your role can view.</p>
    <form onSubmit={e=>{e.preventDefault();void load();}}><fieldset disabled={busy}><legend>Date range</legend><label>From<input type="date" required value={from} onChange={e=>setFrom(e.target.value)}/></label><label>Through<input type="date" required min={from} value={to} onChange={e=>setTo(e.target.value)}/></label><button>{busy?'Loading…':'Generate report'}</button></fieldset></form>
    {error&&<p role="alert">{error}</p>}{data&&<><p>Reporting period: {data.from.slice(0,10)} – {data.to.slice(0,10)}</p>{data.members!=null&&<p>Current registered members: <strong>{data.members}</strong></p>}
    {data.attendance&&<><h3>Attendance records</h3>{data.attendance.length===0?<p>No attendance recorded in this period.</p>:<table><thead><tr><th>Status</th><th>Records</th></tr></thead><tbody>{data.attendance.map(r=><tr key={r.status}><td>{r.status}</td><td>{r.count}</td></tr>)}</tbody></table>}</>}
    {data.giving&&<><h3>Giving</h3>{data.giving.length===0?<p>No giving recorded in this period.</p>:<table><thead><tr><th>Type</th><th>Records</th><th>Amount</th></tr></thead><tbody>{data.giving.map(r=><tr key={r.type}><td>{r.type}</td><td>{r.count}</td><td>{r.amount.toLocaleString(undefined,{minimumFractionDigits:2})}</td></tr>)}</tbody></table>}</>}
    <button onClick={download}>Download CSV</button></>}
  </section>;
}

