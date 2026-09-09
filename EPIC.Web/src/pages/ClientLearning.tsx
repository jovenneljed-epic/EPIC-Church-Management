import { useEffect, useRef, useState } from 'react';
import { clientApi, clientError } from './ClientWorkspace';
interface Course { courseId: number; title: string; shortDescription: string; enrolled: boolean }
interface Detail { course: Course; enrolled: boolean; progress: number; lessons: { lessonId: number; title: string; completed: boolean; locked: boolean }[] }
interface Lesson { lessonId: number; title: string; content: string; videoUrl?: string; resourceUrl?: string }
function content(value: string) { const doc = new DOMParser().parseFromString(value || '', 'text/html'); doc.querySelectorAll('script,style').forEach(e=>e.remove()); return doc.body.textContent || ''; }
function safeUrl(value?: string) { try { const u=new URL(value || '');return ['https:','http:'].includes(u.protocol)?u.href:undefined; } catch { return undefined; } }
export default function ClientLearning() {
 const [courses,setCourses]=useState<Course[]>([]),[detail,setDetail]=useState<Detail|null>(null),[lesson,setLesson]=useState<Lesson|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''); const lock=useRef(false);
 async function run(task:()=>Promise<void>) { if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await task();}catch(e){setError(clientError(e));}finally{lock.current=false;setBusy(false);} }
 const list=async()=>setCourses((await clientApi.get<Course[]>('/learning')).data);
 useEffect(()=>{const c=new AbortController();setBusy(true);clientApi.get<Course[]>('/learning',{signal:c.signal}).then(r=>setCourses(r.data)).catch(e=>{if(!c.signal.aborted)setError(clientError(e));}).finally(()=>{if(!c.signal.aborted)setBusy(false);});return()=>c.abort();},[]);
 const open=async(id:number)=>{setDetail((await clientApi.get<Detail>(`/learning/${id}`)).data);setLesson(null);};
 return <section className="client-workspace"><h2>EPIC Learning</h2><p>Published EPIC courses for your own learning journey.</p>{error&&<p role="alert">{error}</p>}{busy&&<p role="status">Loading…</p>}
 {!detail?<><button disabled={busy} onClick={()=>void run(list)}>Refresh courses</button>{!busy&&!error&&!courses.length&&<p>No published courses available yet.</p>}{courses.map(c=><article key={c.courseId}><h3>{c.title}</h3><p>{c.shortDescription}</p><button disabled={busy} onClick={()=>void run(()=>open(c.courseId))}>{c.enrolled?'Continue learning':'View course'}</button></article>)}</>:<>
 <button disabled={busy} onClick={()=>{setDetail(null);setLesson(null);void run(list);}}>All courses</button><h3>{detail.course.title}</h3><p>{detail.progress}% complete</p>
 {!detail.enrolled&&<button disabled={busy} onClick={()=>void run(async()=>{await clientApi.post(`/learning/${detail.course.courseId}/enroll`);await open(detail.course.courseId);})}>Enroll in this course</button>}
 {!lesson?detail.lessons.map(l=><article key={l.lessonId}><h3>{l.title}</h3><p>{l.completed?'Completed':l.locked?'Finish the earlier lessons first':'Ready to study'}</p><button disabled={busy||l.locked} onClick={()=>void run(async()=>setLesson((await clientApi.get<Lesson>(`/learning/lessons/${l.lessonId}`)).data))}>Open lesson</button></article>):<>
 <button disabled={busy} onClick={()=>setLesson(null)}>Back to lessons</button><h3>{lesson.title}</h3><div style={{whiteSpace:'pre-wrap'}}>{content(lesson.content)}</div>
 {safeUrl(lesson.videoUrl)&&<p><a href={safeUrl(lesson.videoUrl)} target="_blank" rel="noopener noreferrer">Watch lesson video</a></p>}{safeUrl(lesson.resourceUrl)&&<p><a href={safeUrl(lesson.resourceUrl)} target="_blank" rel="noopener noreferrer">Open lesson resource</a></p>}
 <button disabled={busy} onClick={()=>void run(async()=>{await clientApi.post(`/learning/lessons/${lesson.lessonId}/complete`);await open(detail.course.courseId);})}>Mark lesson complete</button>
 </>}</>}
 </section>;
}
