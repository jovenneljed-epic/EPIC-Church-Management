import { useEffect, useState } from 'react';
import { clientApi, clientError } from './ClientWorkspace';
import './ClientAdministration.css';
import './ClientDocuments.css';
const catalog: Record<string, {title:string; category:string; description:string}> = {
  members:{title:'Membership Directory',category:'Membership',description:'Current church members and account status.'},
  attendance:{title:'Attendance by Date',category:'Attendance',description:'Member attendance records for a selected period.'},
  giving:{title:'Giving Report',category:'Giving',description:'Dated giving records and amounts.'},
  income:{title:'Income Report',category:'Finance',description:'Income categories, payment details and references.'},
  expenses:{title:'Expense Report',category:'Finance',description:'Expense categories, payment details and references.'},
  visitors:{title:'Visitors Report',category:'Visitors',description:'Visitors and their first visit dates.'},
  ministries:{title:'Ministry Directory',category:'Ministries',description:'Current ministries, meeting locations and contacts.'},
  services:{title:'Church Services Report',category:'Church Services',description:'Service schedules, locations and status.'}
};
type Report={churchName:string;kind:string;from:string;to:string;currentDirectory:boolean;rows:Record<string,string|number|null>[]};
const forms = { 'Member registration':['Full name','Birth date','Address','Phone','Email','Emergency contact','Signature / date'], 'Visitor information':['Full name','Phone / email','Visit date','How did you hear about us?','May we contact you?','Prayer request'], 'Ministry volunteer':['Full name','Ministry','Contact details','Availability','Skills / experience','Signature / date'] };
export default function ClientDocuments(){
  const [kinds,setKinds]=useState<string[]>([]),[church,setChurch]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [tab,setTab]=useState<'reports'|'forms'>('reports'),[category,setCategory]=useState('All'),[search,setSearch]=useState(''),[selected,setSelected]=useState(''),[form,setForm]=useState<keyof typeof forms|null>(null);
  const localDate=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const [from,setFrom]=useState(localDate(new Date(new Date().getFullYear(),new Date().getMonth(),1))),[to,setTo]=useState(localDate(new Date())),[report,setReport]=useState<Report|null>(null),[retry,setRetry]=useState(0);
  useEffect(()=>{const c=new AbortController();clientApi.get('/documents',{signal:c.signal}).then(r=>{setKinds(r.data.kinds);setChurch(r.data.churchName);}).catch(e=>{if(!c.signal.aborted)setError(clientError(e));});return()=>c.abort();},[retry]);
  async function generate(){if(busy)return;setBusy(true);setError('');setReport(null);try{setReport((await clientApi.get<Report>(`/documents/${selected}`,{params:{from,to}})).data);}catch(e){setError(clientError(e));}finally{setBusy(false);}}
  const label=(s:string)=>s.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,c=>c.toUpperCase());
  function csv(){if(!report)return;const keys=Object.keys(report.rows[0]||{});const cell=(v:unknown)=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,m=>"'"+m).replaceAll('"','""')+'"';const lines=[[report.churchName,catalog[report.kind].title],[report.currentDirectory?'Current directory':`${report.from.slice(0,10)} to ${report.to.slice(0,10)}`],keys.map(label),...report.rows.map(r=>keys.map(k=>r[k]))];const url=URL.createObjectURL(new Blob(['\uFEFF'+lines.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`${report.kind}-report.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  return <section className="client-admin client-documents"><header className="documents-hero"><div><h2>Reports & Documents</h2><p>Generate church reports and printable forms in one place.</p></div></header>
    {error&&<p role="alert">{error} <button onClick={()=>{setError('');setRetry(n=>n+1);}}>Retry</button></p>}
    <nav><button aria-pressed={tab==='reports'} onClick={()=>setTab('reports')}>Reports</button><button aria-pressed={tab==='forms'} onClick={()=>setTab('forms')}>Forms & Documents</button></nav>
    {tab==='reports'?<><label>Search reports<input type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label><nav aria-label="Report categories">{['All',...new Set(kinds.filter(k=>catalog[k]).map(k=>catalog[k].category))].map(c=><button key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</nav>
    <div className="document-cards">{kinds.filter(k=>catalog[k]&&(category==='All'||catalog[k].category===category)&&catalog[k].title.toLowerCase().includes(search.toLowerCase())).map(k=><button disabled={busy} key={k} onClick={()=>{setSelected(k);setReport(null);setError('');}}><small>{catalog[k].category}</small><h3>{catalog[k].title}</h3><p>{catalog[k].description}</p><span>Configure report →</span></button>)}</div>
    {selected&&<form onSubmit={e=>{e.preventDefault();void generate();}}><h3>{catalog[selected].title}</h3>{['members','ministries'].includes(selected)?<p>This directory shows current records.</p>:<fieldset disabled={busy}><label>From<input type="date" required value={from} onChange={e=>setFrom(e.target.value)}/></label><label>Through<input type="date" required min={from} value={to} onChange={e=>setTo(e.target.value)}/></label></fieldset>}<button disabled={busy}>{busy?'Generating…':'Generate report'}</button></form>}
    {report&&<><div className="document-actions"><button onClick={csv}>Download CSV</button><button onClick={()=>window.print()}>Print / Save as PDF</button></div><article className="client-print-document"><h2>{report.churchName}</h2><h3>{catalog[report.kind].title}</h3><p>{report.currentDirectory?'Current directory':`${report.from.slice(0,10)} – ${report.to.slice(0,10)}`} · {report.rows.length} records</p>{report.rows.length?<div className="admin-table"><table><thead><tr>{Object.keys(report.rows[0]).map(k=><th key={k}>{label(k)}</th>)}</tr></thead><tbody>{report.rows.map((r,i)=><tr key={i}>{Object.entries(r).map(([k,v])=><td key={k}>{typeof v==='number'?v.toLocaleString(undefined,{maximumFractionDigits:2}):v||'—'}</td>)}</tr>)}</tbody></table></div>:<p>No records found.</p>}</article></>}
    </>:<><div className="document-cards">{(Object.keys(forms) as (keyof typeof forms)[]).map(f=><button key={f} onClick={()=>setForm(f)}><h3>{f}</h3><p>Open printable blank form →</p></button>)}</div>{form&&<><button onClick={()=>window.print()}>Print / Save as PDF</button><article className="client-print-document"><h2>{church}</h2><h3>{form}</h3>{forms[form].map(f=><div className="form-line" key={f}>{f}</div>)}</article></>}</>}
  </section>;
}
