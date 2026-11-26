// presença (Vou / Talvez / Não vou)
var RS=[],UID=null,USR=null,NAMES={},CURRS=null;
const RSN={sim:'Vou',talvez:'Talvez',nao:'Não vou'};
function canSee(id){return mode!=='fb'||!ME||ME.papel==='admin'||(ME.ver||['todas']).some(x=>x==='todas'||x===id)}
function shared(){return(mode==='db'&&!!UID)||(mode==='fb'&&!!ME)}
function myId(){return mode==='fb'?(FBU?.email||'').toLowerCase():UID}
const rsKey=(ev,d)=>ev+'~'+d,safeSeg=s=>String(s).replace(/[^A-Za-z0-9_.~:@+-]/g,'-');
function rsOf(ev,d){return RS.filter(r=>r.ev===ev&&r.date===d)}
function rsName(r){return mode==='fb'?(r.nome||r.uid):(NAMES[r.uid]||'Alguém')}
async function rsNames(){if(mode!=='db'||!USR?.profiles)return;const ids=[...new Set(RS.map(r=>r.uid))].filter(i=>!(i in NAMES));if(!ids.length)return;
 try{const ps=await USR.profiles(ids);ids.forEach(i=>NAMES[i]=ps?.[i]?.name||'');rsRender();render()}catch{}}
function rsSum(ev,d){if(!shared())return'';const l=rsOf(ev,d),c=k=>l.filter(r=>r.resp===k).length;if(!l.length)return'';
 return[c('sim')&&c('sim')+(c('sim')>1?' vão':' vai'),c('talvez')&&c('talvez')+' talvez',c('nao')&&c('nao')+' não'].filter(Boolean).join(', ')}
function rsBlock(e,t){if(!shared()||!e.id)return'';return`<div class="rs" id="rsb"></div>`}
function rsRender(){const box=$('#rsb');if(!box||!CURRS)return;const{ev,d}=CURRS,l=rsOf(ev,d),me=l.find(r=>r.uid===myId());
 const grp=k=>{const n=l.filter(r=>r.resp===k).map(rsName);return n.length?`<p class="fine"><b>${RSN[k]==='Vou'?'Vão':RSN[k]==='Talvez'?'Talvez':'Não vão'} (${n.length}):</b> ${n.map(x=>esc(x)).join(', ')}</p>`:''};
 box.innerHTML=`<p class="sub">Presença em ${fd(parse(d))}</p><div class="rsb" role="group" aria-label="Sua presença">${Object.entries(RSN).map(([k,v])=>`<button type="button" class="btn" data-rs="${k}" aria-pressed="${me?.resp===k}">${v}</button>`).join('')}</div>${grp('sim')}${grp('talvez')}${grp('nao')}${l.length?'':'<p class="fine">Ninguém respondeu ainda.</p>'}`}
async function rsSet(resp){if(!CURRS)return;const{ev,d}=CURRS,me=myId();if(!me)return;const id=safeSeg(rsKey(ev,d)+'~'+me),cur=rsOf(ev,d).find(r=>r.uid===me);
 try{if(cur&&cur.resp===resp)await db.collection('rsvp').doc(id).delete();else await db.collection('rsvp').doc(id).set({ev,date:d,uid:me,resp,...(mode==='fb'?{nome:ME?.nome||FBU?.displayName||me}:{})})}
 catch(e){toast(e?.code==='permission-denied'||e?.code==='invalid_argument'?'Você não pode responder nesta agenda.':'Não foi possível registrar.')}}
function rsSub(){const un=db.collection('rsvp').onSnapshot(s=>{RS=s.docs.map(x=>({id:x.id,...x.data()}));rsRender();render();rsNames()},()=>{});if(mode==='fb')fbUn.push(un)}
document.addEventListener('click',ev=>{const b=ev.target.closest('[data-rs]');if(b)rsSet(b.dataset.rs)});
