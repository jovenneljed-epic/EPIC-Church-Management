import { useEffect, useState } from 'react';
import { clientApi, clientError } from './ClientWorkspace';
import './ClientAdministration.css';
type Grant = { moduleName: string; canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean; canManage: boolean };
type Role = { clientRoleId: number; roleName: string; isSystemRole: boolean; permissions: Grant[] };
type Account = { clientMemberId: number; memberId: number; clientRoleId: number; username: string; email: string | null; isActive: boolean; password?: string };
type Data = { currentUserId: number; users: Account[]; roles: Role[]; members: { memberId: number; name: string; memberCode: string }[]; modules: string[] };
const actions = ['canView', 'canCreate', 'canEdit', 'canDelete', 'canManage'] as const;
export default function ClientAdministration() {
  const [data, setData] = useState<Data | null>(null), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [tab, setTab] = useState<'users' | 'roles'>('users'), [busy, setBusy] = useState(false), [reload, setReload] = useState(0);
  const [user, setUser] = useState<Account | null>(null), [role, setRole] = useState<Role | null>(null);
  useEffect(() => { const c = new AbortController(); clientApi.get<Data>('/administration', { signal: c.signal }).then(r => setData(r.data)).catch(e => { if (!c.signal.aborted) setError(clientError(e)); }); return () => c.abort(); }, [reload]);
  async function save(kind: 'users' | 'roles') {
    if (busy) return; setBusy(true); setError(''); setMessage('');
    const body = kind === 'users' ? user : role, id = kind === 'users' ? user?.clientMemberId : role?.clientRoleId;
    try { await clientApi.request({ url: `/${kind}${id ? `/${id}` : ''}`, method: id ? 'PUT' : 'POST', data: body }); setMessage('Saved successfully.'); setUser(null); setRole(null); setReload(n => n + 1); }
    catch (e) { setError(clientError(e)); } finally { setBusy(false); }
  }
  return <section className="client-admin"><header><div><h2>Users, Roles & Permissions</h2><p>Manage access to your church workspace.</p></div><button disabled={busy} onClick={() => { setError(''); setReload(n => n + 1); }}>Refresh</button></header>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {!data ? <p>{error ? 'User management unavailable.' : 'Loading…'}</p> : <>
      <nav aria-label="Administration"><button aria-pressed={tab === 'users'} onClick={() => setTab('users')}>Client users</button><button aria-pressed={tab === 'roles'} onClick={() => setTab('roles')}>Roles & permissions</button></nav>
      {tab === 'users' ? <><button onClick={() => { setError(''); setUser({ clientMemberId: 0, memberId: 0, clientRoleId: 0, username: '', email: '', isActive: true, password: '' }); }}>Add client user</button>
      <div className="admin-table"><table><thead><tr><th>Username</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.users.map(u => <tr key={u.clientMemberId}><td>{u.username}<small>{u.email}</small></td><td>{data.roles.find(r => r.clientRoleId === u.clientRoleId)?.roleName || 'Unavailable role'}</td><td>{u.isActive ? 'Active' : 'Inactive'}</td><td>{u.clientMemberId === data.currentUserId ? 'Your account' : <button onClick={() => { setError(''); setUser({ ...u, password: '' }); }}>Edit access</button>}</td></tr>)}</tbody></table></div>
      {user && <form onSubmit={e => { e.preventDefault(); void save('users'); }}><h3>{user.clientMemberId ? 'Edit client user' : 'Add client user'}</h3><fieldset disabled={busy}>
        <label>Church member<select aria-label="Church member" required value={user.memberId || ''} onChange={e => setUser({ ...user, memberId: Number(e.target.value) })}><option value="">Choose member</option>{data.members.map(m => <option key={m.memberId} value={m.memberId}>{m.name} · {m.memberCode}</option>)}</select></label>
        <label>Role<select aria-label="Role" required value={user.clientRoleId || ''} onChange={e => setUser({ ...user, clientRoleId: Number(e.target.value) })}><option value="">Choose role</option>{data.roles.map(r => <option key={r.clientRoleId} value={r.clientRoleId}>{r.roleName}</option>)}</select></label>
        <label>Username<input required pattern="[a-zA-Z0-9._-]{3,100}" maxLength={100} value={user.username} onChange={e => setUser({ ...user, username: e.target.value })} /></label>
        <label>Email<input type="email" maxLength={200} value={user.email || ''} onChange={e => setUser({ ...user, email: e.target.value })} /></label>
        <label>{user.clientMemberId ? 'New password (leave blank to keep)' : 'Initial password'}<input type="password" autoComplete="new-password" required={!user.clientMemberId} minLength={10} maxLength={72} value={user.password || ''} onChange={e => setUser({ ...user, password: e.target.value })} /></label>
        <label>Status<select value={String(user.isActive)} onChange={e => setUser({ ...user, isActive: e.target.value === 'true' })}><option value="true">Active</option><option value="false">Inactive</option></select></label>
      </fieldset><button disabled={busy}>Save client user</button><button type="button" disabled={busy} onClick={() => setUser(null)}>Cancel</button></form>}</> : <>
        <button onClick={() => { setError(''); setRole({ clientRoleId: 0, roleName: '', isSystemRole: false, permissions: data.modules.map(moduleName => ({ moduleName, canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false })) }); }}>Add role</button>
        <p>System roles are protected. Create a custom role to choose individual permissions. You can grant only permissions you have.</p>
        <div className="admin-table"><table><thead><tr><th>Role</th><th>Type</th><th>Action</th></tr></thead><tbody>{data.roles.map(r => <tr key={r.clientRoleId}><td>{r.roleName}</td><td>{r.isSystemRole ? 'System' : 'Custom'}</td><td><button onClick={() => { setError(''); setRole({ ...r, permissions: data.modules.map(moduleName => r.permissions.find(p => p.moduleName === moduleName) || { moduleName, canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false }) }); }}>View permissions</button></td></tr>)}</tbody></table></div>
        {role && <form onSubmit={e => { e.preventDefault(); void save('roles'); }}><h3>Role permissions</h3><label>Role name<input required maxLength={100} disabled={role.isSystemRole || busy} value={role.roleName} onChange={e => setRole({ ...role, roleName: e.target.value })} /></label>
          <div className="admin-table"><table><thead><tr><th>Module</th>{actions.map(a => <th key={a}>{a.slice(3)}</th>)}</tr></thead><tbody>{role.permissions.map((p, index) => <tr key={p.moduleName}><td>{p.moduleName}</td>{actions.map(action => <td key={action}><input type="checkbox" aria-label={`${p.moduleName} ${action.slice(3)}`} checked={p[action]} disabled={role.isSystemRole || busy} onChange={e => setRole({ ...role, permissions: role.permissions.map((g, i) => i !== index ? g : action === 'canView' && !e.target.checked ? { ...g, canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false } : { ...g, [action]: e.target.checked, canView: e.target.checked || g.canView }) })} /></td>)}</tr>)}</tbody></table></div>
          {!role.isSystemRole && <button disabled={busy}>Save permissions</button>}<button type="button" disabled={busy} onClick={() => setRole(null)}>Close</button></form>}
      </>}
    </>}
  </section>;
}

