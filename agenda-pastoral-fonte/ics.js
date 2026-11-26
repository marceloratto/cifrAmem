// arquivos: salvar, .ics, backup
async function saveFile(name,data,mime){let dl=null;try{dl=await window.claude?.use?.('downloads')}catch{}
 if(dl)return dl.save({filename:name,data});
 const blob=new Blob([data],{type:mime||'application/octet-stream'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);return{status:'saved'}}
const inClaude=()=>!!window.claude;
const icsEsc=s=>String(s??'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/[,;]/g,m=>'\\'+m);
function fold(l){const out=[];let cur='';for(const ch of l){if(new TextEncoder().encode(cur+ch).length>73){out.push(cur);cur=' '+ch}else cur+=ch}out.push(cur);return out.join('\r\n')}
function buildIcs(items,name){const st=new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z',L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//cifrAmem//Agenda Pastoral//PT','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:'+icsEsc(name),'X-WR-TIMEZONE:America/Sao_Paulo',
 'BEGIN:VTIMEZONE','TZID:America/Sao_Paulo','BEGIN:STANDARD','DTSTART:19700101T000000','TZOFFSETFROM:-0300','TZOFFSETTO:-0300','TZNAME:-03','END:STANDARD','END:VTIMEZONE'];
 for(const{e,t,rec}of items){const a=ag(e.ag),d=iso(t).replace(/-/g,'');L.push('BEGIN:VEVENT','UID:'+e.id+(rec?'':'-'+d)+'@agenda-pastoral','DTSTAMP:'+st);
  if(e.all||!e.start){L.push('DTSTART;VALUE=DATE:'+d,'DTEND;VALUE=DATE:'+iso(t+DAY).replace(/-/g,''))}
  else{const end=e.end&&e.end>e.start?e.end:p2(Math.min(23,+e.start.slice(0,2)+1))+e.start.slice(2);L.push('DTSTART;TZID=America/Sao_Paulo:'+d+'T'+e.start.replace(':','')+'00','DTEND;TZID=America/Sao_Paulo:'+d+'T'+end.replace(':','')+'00')}
  if(rec){const r=rrule(e,t);if(r)L.push(r)}
  L.push('SUMMARY:'+icsEsc(e.title));if(e.local)L.push('LOCATION:'+icsEsc(e.local));L.push('DESCRIPTION:'+icsEsc([e.tipo,a&&a.name,e.notes].filter(Boolean).join('\n')));if(a)L.push('CATEGORIES:'+icsEsc(a.name));L.push('END:VEVENT')}
 L.push('END:VCALENDAR');return L.map(fold).join('\r\n')+'\r\n'}
function parseIcs(txt,defAg){const lines=txt.replace(/\r\n[ \t]/g,'').replace(/\n[ \t]/g,'').split(/\r?\n/),out=[];let ev=null;
 const un=s=>s.replace(/\\n/gi,'\n').replace(/\\([,;\\])/g,'$1');
 for(const ln of lines){if(ln==='BEGIN:VEVENT'){ev={};continue}if(ln==='END:VEVENT'){if(ev)out.push(ev);ev=null;continue}if(!ev)continue;const i=ln.indexOf(':');if(i<0)continue;const k=ln.slice(0,i),v=ln.slice(i+1),key=k.split(';')[0];ev[key]={k,v}}
 const dt=o=>{if(!o)return null;let v=o.v.trim();if(/^\d{8}$/.test(v))return{date:`${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}`,time:''};
  const m=v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);if(!m)return null;let d=Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5]);if(v.endsWith('Z'))d-=3*3600e3;const x=new Date(d);return{date:x.toISOString().slice(0,10),time:x.toISOString().slice(11,16)}};
 return out.map(o=>{const s=dt(o.DTSTART),e=dt(o.DTEND);if(!s||!o.SUMMARY)return null;let rep='none',until='';const r=o.RRULE?.v||'';
  if(/FREQ=WEEKLY/.test(r))rep='w';else if(/FREQ=MONTHLY/.test(r))rep=/BYDAY=\d/.test(r)?'n':'m';else if(/FREQ=YEARLY/.test(r))rep='y';const u=r.match(/UNTIL=(\d{8})/);if(u)until=`${u[1].slice(0,4)}-${u[1].slice(4,6)}-${u[1].slice(6,8)}`;
  return{title:un(o.SUMMARY.v).slice(0,120),date:s.date,start:s.time,end:e&&e.date===s.date?e.time:'',all:!s.time,local:un(o.LOCATION?.v||'').slice(0,120),tipo:'Evento',ag:defAg,notes:un(o.DESCRIPTION?.v||'').slice(0,1000),rep,until}}).filter(Boolean)}
async function icsDownload(items,name,file,say){if(inClaude()){say('Dentro do Claude não é permitido baixar .ics. Abra a agenda no site www.ciframem.com.br/agenda-pastoral para baixar.');return}
 try{await saveFile(file,buildIcs(items,name),'text/calendar');say('Arquivo .ics pronto: abra-o para adicionar à agenda do celular.')}catch{say('Não foi possível gerar o .ics.')}}
async function backupSave(){const data=JSON.stringify({app:'agenda-pastoral',v:1,salvo:new Date().toISOString(),agendas:AGD,eventos:EV},null,1);try{await saveFile(`agenda-pastoral-backup-${iso(TODAY)}.json`,data,'application/json');toast('Backup salvo.')}catch(e){toast(e?.code==='declined'?'Backup cancelado.':'Não foi possível salvar o backup.')}}
async function backupLoad(f){try{const j=JSON.parse(await f.text());if(j.app!=='agenda-pastoral')throw 0;let n=0;
 for(const a of j.agendas||[])if(a.id)await put('agendas',a.id,(({id,...r})=>r)(a));
 for(const e of j.eventos||[])if(e.id&&e.date){const{id,...r}=e;const cur=EV.find(x=>x.id===id);if(!cur||JSON.stringify(cur)!==JSON.stringify(e)){await put('events',id,r);n++}}
 render();toast(`Backup restaurado: ${n} evento${n===1?'':'s'} novo${n===1?'':'s'} ou atualizado${n===1?'':'s'}.`);close()}catch{toast('Arquivo de backup inválido.')}}
