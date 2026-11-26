const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const AG0=[
 {id:'paroquia',name:'Paróquia (geral)',pastoral:'Paróquia',nivel:'Paroquial',color:'#7a5c3e'},
 {id:'pf-paroquia',name:'Pastoral Familiar',pastoral:'Pastoral Familiar',nivel:'Paroquial',color:'#1f6fd1'},
 {id:'pf-decanato',name:'Pastoral Familiar · Decanato',pastoral:'Pastoral Familiar',nivel:'Decanato',color:'#0b8a8f'},
 {id:'pf-regional',name:'Pastoral Familiar · Regional',pastoral:'Pastoral Familiar',nivel:'Regional',color:'#4a3fc4'},
 {id:'pf-brasil',name:'Pastoral Familiar · Brasil (CNPF)',pastoral:'Pastoral Familiar',nivel:'Nacional',color:'#b0237e'},
 {id:'musica',name:'Pastoral da Música',pastoral:'Música',nivel:'Paroquial',color:'#d9730d'}];
const NIV=['Paroquial','Decanato','Diocesano','Regional','Nacional','Outro'],TIPOS=['Missa especial','Missa','Reunião','Encontro','Formação','Ensaio','Retiro','Celebração','Evento'];
const SW=['#1f6fd1','#0b8a8f','#4a3fc4','#b0237e','#d9730d','#7a5c3e','#2b7a4b','#c2410c','#5b6472','#0f766e'];
const now=new Date(),TODAY=U(now.getFullYear(),now.getMonth()+1,now.getDate());
let cy=now.getFullYear(),cm=now.getMonth(),sel=TODAY,view='mes',EV=[],AGD=[],db=null,mode='local',ro=false,picking=false,picked=new Set();
let hidden=new Set(LS.get('agp-hidden',[])),fs=LS.get('agp-fs',16),theme=LS.get('agp-theme','auto');
const AGS=()=>{const m=new Map(AG0.map(a=>[a.id,{...a}]));AGD.forEach(a=>m.set(a.id,{...(m.get(a.id)||{}),...a}));return[...m.values()].filter(a=>!a.off)};
const ag=id=>AGS().find(a=>a.id===id),col=e=>ag(e.ag)?.color||'#888';
const byTime=(a,b)=>(b.all?1:0)-(a.all?1:0)||(a.start||'').localeCompare(b.start||'')||a.title.localeCompare(b.title);
function expand(from,to,all){const out={},vis=new Set(AGS().filter(a=>all||!hidden.has(a.id)).map(a=>a.id));
 for(const e of EV){if(!e.date||!(all||vis.has(e.ag)))continue;const s=parse(e.date),until=e.until?parse(e.until):Infinity,P=t=>{if(t>=s&&t>=from&&t<=to&&t<=until)(out[iso(t)]??=[]).push(e)};
  if(!e.rep||e.rep==='none'){P(s);continue}
  if(e.rep==='w'){let t=s;if(t<from)t+=Math.floor((from-t)/(7*DAY))*7*DAY;for(;t<=to;t+=7*DAY)P(t);continue}
  const d0=new Date(s);let y=d0.getUTCFullYear(),m=d0.getUTCMonth();const dd=d0.getUTCDate(),wd=d0.getUTCDay(),nth=Math.ceil(dd/7);
  for(let i=0;i<1200;i++){let t;
   if(e.rep==='n'){const f=Date.UTC(y,m,1),day=1+(wd-new Date(f).getUTCDay()+7)%7+(nth-1)*7;t=Date.UTC(y,m,day);if(new Date(t).getUTCMonth()!==((m%12)+12)%12)t=null}
   else{t=Date.UTC(y,m,dd);if(new Date(t).getUTCDate()!==dd)t=null}
   const base=Date.UTC(y,m,1);if(base>to||base>until)break;if(t)P(t);if(e.rep==='y')y++;else m++}}
 for(const k in out)out[k].sort(byTime);return out}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),2600)}
function applyUi(){document.documentElement.style.fontSize=fs+'px';document.documentElement.dataset.ui=theme;$('#fsv').textContent=Math.round(fs/16*100)+'%';
 document.querySelectorAll('[data-th]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.th===theme))}
function render(){
 $('#mt').innerHTML=`${MES[cm]} <span>${cy}</span>`;
 document.querySelectorAll('[data-v]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===view));
 const L=lit(sel);$('#rib').style.setProperty('--lc',LC[L.c].v);$('#rib').dataset.c=L.c;
 $('#rib').innerHTML=`<b>${L.s}</b><span>${L.w?esc(L.w)+' · ':''}Ano ${L.ano} · cor ${LC[L.c].n.toLowerCase()}</span>`;
 $('#note').hidden=mode!=='local';$('#note').textContent=mode==='local'?'Modo local: os eventos ficam salvos só neste aparelho.':'';
 $('#mview').hidden=view!=='mes';$('#lview').hidden=view!=='lista';
 view==='mes'?(grid(),day()):list();bar()}
function grid(){const first=U(cy,cm+1,1),start=first-dow(first)*DAY,dim=new Date(Date.UTC(cy,cm+1,0)).getUTCDate(),wk=Math.ceil((dow(first)+dim)/7),oc=expand(start,start+(wk*7-1)*DAY);let h='';
 for(let i=0;i<wk*7;i++){const t=start+i*DAY,L=lit(t),d=new Date(t),ev=oc[iso(t)]||[],big=L.cel&&(L.cel.r==='S'||L.cel.r==='F');
  h+=`<button class="c${d.getUTCMonth()!==cm?' out':''}${t===TODAY?' today':''}${t===sel?' sel':''}" data-t="${t}" aria-label="${d.getUTCDate()} de ${MES[d.getUTCMonth()]}${L.cel?', '+esc(L.cel.n):''}${ev.length?', '+ev.length+' evento(s)':''}">
  <span class="n">${d.getUTCDate()}</span>${big?`<span class="s ${L.cel.r}"></span>`:''}
  <span class="cl">${big?esc(L.cel.n.split(/[,·(]/)[0]):''}</span>
  <span class="dots">${ev.slice(0,4).map(e=>`<i style="background:${col(e)}"></i>`).join('')}</span>
  <span class="chips">${ev.slice(0,3).map(e=>`<em style="--c:${col(e)}">${e.all?'':esc(e.start||'')+' '}${esc(e.title)}</em>`).join('')}${ev.length>3?`<em class="more">+${ev.length-3}</em>`:''}</span>
  <span class="rb" style="background:${LC[L.c].v}"></span></button>`}
 $('#grid').innerHTML=h}
function litBlock(t){const L=lit(t);return`<div class="lit" data-c="${L.c}" style="--lc:${LC[L.c].v}"><span class="sw"></span><div>${L.cel?`<strong>${esc(L.cel.n)}</strong>${RK[L.cel.r]?`<small class="rk">${RK[L.cel.r]}</small>`:''}`:''}<span>${L.w&&!(L.cel&&/Domingo/.test(L.cel.n))?esc(L.w)+' · ':''}${L.s} · Ano ${L.ano} · ${LC[L.c].n}</span></div></div>`}
function evRow(e,t){const a=ag(e.ag),k=e.id+'@'+iso(t);return`<div class="ev" style="--c:${col(e)}">${picking?`<label class="pk"><input type="checkbox" data-pick="${k}" ${picked.has(k)?'checked':''} aria-label="Selecionar ${esc(e.title)}"></label>`:''}<button class="evb" data-id="${e.id}" data-t="${t}"><span class="tm">${e.all?'dia todo':esc(e.start||'—')}${!e.all&&e.end?`<small>${esc(e.end)}</small>`:''}</span><span class="tx"><strong>${esc(e.title)}</strong><span>${e.tipo?esc(e.tipo)+' · ':''}${esc(a?a.name:'Sem agenda')}${e.local?' · '+esc(e.local):''}${e.rep&&e.rep!=='none'?' · repete':''}</span></span></button></div>`}
function day(){const d=new Date(sel),ev=expand(sel,sel)[iso(sel)]||[];
 $('#day').innerHTML=`<div class="dh"><h2>${SEM[d.getUTCDay()]}, ${d.getUTCDate()} de ${MES[d.getUTCMonth()]}</h2>${ro?'':'<button class="btn pri" data-new>+ Evento</button>'}</div>${litBlock(sel)}
 <div class="evs">${ev.length?ev.map(e=>evRow(e,sel)).join(''):`<p class="empty">Nenhum evento neste dia.${ro?'':' Toque em “+ Evento” para agendar.'}</p>`}</div>`}
function list(){const from=Math.max(TODAY,U(cy,cm+1,1)),to=from+119*DAY,oc=expand(from,to);let h='';
 for(let t=from;t<=to;t+=DAY){const ev=oc[iso(t)]||[],L=lit(t),big=L.cel&&(L.cel.r==='S'||L.cel.r==='F');if(!ev.length&&!big)continue;const d=new Date(t);
  h+=`<section class="ld"><h3><button data-go="${t}">${SEM[d.getUTCDay()].split('-')[0]}, ${d.getUTCDate()} de ${MES[d.getUTCMonth()]}</button></h3>${big||ev.length?litBlock(t):''}${ev.map(e=>evRow(e,t)).join('')}</section>`}
 $('#lview').innerHTML=`<p class="lh">Próximos 120 dias a partir de ${new Date(from).getUTCDate()} de ${MES[new Date(from).getUTCMonth()]}</p>`+(h||'<p class="empty">Nada agendado neste período.</p>')}
function bar(){$('#pbar').hidden=!picking;$('#pick').setAttribute('aria-pressed',picking);$('#pn').textContent=picked.size?`${picked.size} selecionado${picked.size>1?'s':''}`:'Marque os eventos';$('#psend').disabled=!picked.size}
// links para a agenda do celular
const p2=n=>String(n).padStart(2,'0'),stamp=(t,hm)=>iso(t).replace(/-/g,'')+(hm?'T'+hm.replace(':','')+'00':'');
function rrule(e,t){if(!e.rep||e.rep==='none')return'';const u=e.until?';UNTIL='+e.until.replace(/-/g,''):'',d=new Date(t),BD=['SU','MO','TU','WE','TH','FR','SA'];
 return'RRULE:'+({w:'FREQ=WEEKLY',m:'FREQ=MONTHLY',y:'FREQ=YEARLY',n:`FREQ=MONTHLY;BYDAY=${Math.ceil(d.getUTCDate()/7)}${BD[d.getUTCDay()]}`}[e.rep])+u}
function gLink(e,t){const a=ag(e.ag),det=[e.tipo,a&&a.name,e.notes].filter(Boolean).join('\n');let dates;
 if(e.all||!e.start)dates=stamp(t)+'/'+stamp(t+DAY);else{const end=e.end&&e.end>e.start?e.end:p2(Math.min(23,+e.start.slice(0,2)+1))+e.start.slice(2);dates=stamp(t,e.start)+'/'+stamp(t,end)}
 const q=new URLSearchParams({action:'TEMPLATE',text:e.title,dates,details:det,location:e.local||'',ctz:'America/Sao_Paulo'});const r=rrule(e,t);if(r)q.set('recur',r);
 return'https://calendar.google.com/calendar/render?'+q}
function oLink(e,t){const end=e.end&&e.end>e.start?e.end:e.start;const q=new URLSearchParams({path:'/calendar/action/compose',rru:'addevent',subject:e.title,location:e.local||'',body:[e.tipo,ag(e.ag)?.name,e.notes].filter(Boolean).join(' · '),allday:String(!!(e.all||!e.start)),
 startdt:iso(t)+(e.all||!e.start?'':'T'+e.start+':00-03:00'),enddt:(e.all||!e.start)?iso(t+DAY):iso(t)+'T'+end+':00-03:00'});return'https://outlook.live.com/calendar/0/deeplink/compose?'+q}
function phoneBtns(e,t){return`<div class="ph"><a class="btn" href="${esc(gLink(e,t))}" target="_blank" rel="noopener">Google Agenda</a><a class="btn" href="${esc(oLink(e,t))}" target="_blank" rel="noopener">Outlook</a></div>`}
// folhas
function sheet(h){$('#sh').innerHTML=`<div class="sp" role="dialog" aria-modal="true">${h}</div>`;$('#sh').hidden=false;setTimeout(()=>$('#sh input,#sh select,#sh button')?.focus(),30)}
function close(){$('#sh').hidden=true;$('#sh').innerHTML=''}
function openEv(id,t){const e=EV.find(x=>x.id===id)||{date:iso(t||sel),ag:AGS().find(a=>!hidden.has(a.id))?.id||'paroquia',tipo:'Reunião',rep:'none'},opts=(a,v)=>a.map(x=>`<option ${x===v?'selected':''}>${x}</option>`).join('');
 sheet(`<form id="fe"><div class="shh"><h3>${e.id?'Editar evento':'Novo evento'}</h3><button type="button" class="x" data-close aria-label="Fechar">✕</button></div>
 <label>Título<input id="f-title" required maxlength="120" value="${esc(e.title)}" placeholder="Ex.: Encontro de noivos"></label>
 <div class="two"><label>Tipo<select id="f-tipo">${opts(TIPOS,e.tipo)}</select></label><label>Agenda<select id="f-ag">${AGS().map(a=>`<option value="${a.id}" ${a.id===e.ag?'selected':''}>${esc(a.name)}</option>`).join('')}</select></label></div>
 <div class="two"><label>Data<input type="date" id="f-date" required value="${esc(e.date)}"></label><label class="tg"><input type="checkbox" id="f-all" ${e.all?'checked':''}> Dia inteiro</label></div>
 <div class="two" id="hrs" ${e.all?'hidden':''}><label>Início<input type="time" id="f-start" value="${esc(e.start||'')}"></label><label>Fim<input type="time" id="f-end" value="${esc(e.end||'')}"></label></div>
 <label>Local<input id="f-local" maxlength="120" value="${esc(e.local||'')}" placeholder="Ex.: Salão paroquial"></label>
 <div class="two"><label>Repetir<select id="f-rep">${[['none','Não repete'],['w','Toda semana'],['n','Todo mês (ex.: 2º sábado)'],['m','Todo mês (mesmo dia)'],['y','Todo ano']].map(([v,n])=>`<option value="${v}" ${v===(e.rep||'none')?'selected':''}>${n}</option>`).join('')}</select></label><label>Até<input type="date" id="f-until" value="${esc(e.until||'')}"></label></div>
 <label>Observações<textarea id="f-notes" rows="3" maxlength="1000">${esc(e.notes||'')}</textarea></label>
 ${e.id?`<p class="sub">Adicionar à agenda do celular (Android ou iPhone)</p>${phoneBtns(e,t||parse(e.date))}`:''}
 <div class="act">${e.id&&!ro?'<button type="button" class="btn del" id="fdel">Excluir</button>':''}<span></span><button type="button" class="btn" data-close>Cancelar</button>${ro?'':'<button class="btn pri">Salvar</button>'}</div></form>`);
 $('#f-all').onchange=ev=>$('#hrs').hidden=ev.target.checked;
 $('#fe').onsubmit=async ev=>{ev.preventDefault();const n={title:$('#f-title').value.trim(),tipo:$('#f-tipo').value,ag:$('#f-ag').value,date:$('#f-date').value,all:$('#f-all').checked,start:$('#f-start').value,end:$('#f-end').value,local:$('#f-local').value.trim(),rep:$('#f-rep').value,until:$('#f-until').value,notes:$('#f-notes').value.trim()};
  if(!n.title||!n.date)return toast('Preencha título e data.');if(await put('events',e.id||nid(),n)){close();sel=parse(n.date);const d=new Date(sel);cy=d.getUTCFullYear();cm=d.getUTCMonth();render();toast('Evento salvo.')}};
 const del=$('#fdel');if(del)del.onclick=async()=>{if(del.dataset.ok){if(await rm('events',e.id)){close();render();toast('Evento excluído.')}}else{del.dataset.ok=1;del.textContent=e.rep&&e.rep!=='none'?'Excluir todas as repetições?':'Confirmar exclusão'}}}
function openAg(){sheet(`<div class="shh"><h3>Agendas e cores</h3><button class="x" data-close aria-label="Fechar">✕</button></div>
 <p class="sub">Mostrar no calendário</p><div class="agl">${AGS().map(a=>`<div class="agr"><label><input type="checkbox" data-vis="${a.id}" ${hidden.has(a.id)?'':'checked'}><i style="background:${a.color}"></i><span><b>${esc(a.name)}</b><small>${esc(a.pastoral)} · ${esc(a.nivel)}</small></span></label>${ro?'':`<button class="btn sm" data-edag="${a.id}">Editar</button>`}</div>`).join('')}</div>
 ${ro?'':'<button class="btn" data-edag="">+ Nova agenda</button>'}
 <p class="sub">Cores litúrgicas (fita sob cada dia)</p><div class="leg">${Object.entries(LC).map(([k,c])=>`<span data-c="${k}"><i style="background:${c.v}"></i>${c.n}</span>`).join('')}<span><i class="s S"></i>Solenidade</span><span><i class="s F"></i>Festa</span></div>
 <p class="fine">Tempos e solenidades calculados pelas normas gerais e da CNBB (Epifania, Ascensão, São Pedro e São Paulo, Assunção e Todos os Santos no domingo). Confira sempre o Diretório Litúrgico da sua diocese.</p>`)}
function openAgEd(id){const a=ag(id)||{id:'',name:'',pastoral:'Pastoral Familiar',nivel:'Paroquial',color:SW[0]};
 sheet(`<form id="fa"><div class="shh"><h3>${id?'Editar agenda':'Nova agenda'}</h3><button type="button" class="x" data-close aria-label="Fechar">✕</button></div>
 <label>Nome<input id="a-name" required maxlength="60" value="${esc(a.name)}" placeholder="Ex.: Pastoral do Batismo"></label>
 <div class="two"><label>Pastoral<input id="a-past" maxlength="60" value="${esc(a.pastoral)}"></label><label>Nível<select id="a-niv">${NIV.map(n=>`<option ${n===a.nivel?'selected':''}>${n}</option>`).join('')}</select></label></div>
 <p class="sub">Cor</p><div class="sws">${SW.map(c=>`<button type="button" data-sw="${c}" style="background:${c}" aria-label="Cor ${c}" aria-pressed="${c===a.color}"></button>`).join('')}<input type="color" id="a-col" value="${a.color}" aria-label="Outra cor"></div>
 <div class="act">${id?'<button type="button" class="btn del" id="adel">Remover</button>':''}<span></span><button type="button" class="btn" data-back>Voltar</button><button class="btn pri">Salvar</button></div></form>`);
 $('#fa').onclick=ev=>{const s=ev.target.dataset.sw;if(s){$('#a-col').value=s;document.querySelectorAll('[data-sw]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.sw===s))}};
 $('#fa').onsubmit=async ev=>{ev.preventDefault();const n={name:$('#a-name').value.trim(),pastoral:$('#a-past').value.trim(),nivel:$('#a-niv').value,color:$('#a-col').value};if(!n.name)return;if(await put('agendas',id||nid(),n)){render();openAg()}};
 const d=$('#adel');if(d)d.onclick=async()=>{if(d.dataset.ok){if(await put('agendas',id,{...a,off:true})){render();openAg()}}else{d.dataset.ok=1;d.textContent='Confirmar (eventos ficam ocultos)'}}}
function openSend(){const items=[...picked].map(k=>{const[id,d]=k.split('@');return{e:EV.find(x=>x.id===id),t:parse(d)}}).filter(x=>x.e).sort((a,b)=>a.t-b.t).filter((x,i,arr)=>!(x.e.rep&&x.e.rep!=='none')||arr.findIndex(y=>y.e.id===x.e.id)===i);
 sheet(`<div class="shh"><h3>Enviar para o celular</h3><button class="x" data-close aria-label="Fechar">✕</button></div>
 <p class="fine">Toque em cada botão: abre a agenda já preenchida para você confirmar. <b>Android:</b> Google Agenda. <b>iPhone:</b> Google Agenda (ou Outlook) sincronizado com o app Calendário do iPhone. Eventos que repetem vão com a repetição.</p>
 ${items.map(({e,t})=>{const d=new Date(t);return`<div class="sr" style="--c:${col(e)}"><div><b>${esc(e.title)}</b><small>${d.getUTCDate()}/${p2(d.getUTCMonth()+1)} ${e.all?'· dia todo':e.start?'· '+esc(e.start):''} · ${esc(ag(e.ag)?.name||'')}</small></div>${phoneBtns(e,t)}</div>`}).join('')}
 <div class="act"><button class="btn" data-clear>Limpar seleção</button><span></span><button class="btn pri" data-close>Concluir</button></div>`)}
// dados
const nid=()=>'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
async function put(c,id,b){const body=JSON.parse(JSON.stringify(b));
 if(mode==='db'){try{await db.collection(c).doc(id).set(body);return true}catch(e){err(e);return false}}
 const arr=c==='events'?EV:AGD,i=arr.findIndex(x=>x.id===id),v={id,...body};i<0?arr.push(v):arr[i]=v;LS.set('agp-'+c,arr);return true}
async function rm(c,id){if(mode==='db'){try{await db.collection(c).doc(id).delete();return true}catch(e){err(e);return false}}
 EV=EV.filter(x=>x.id!==id);LS.set('agp-events',EV);return true}
function err(e){if(e&&e.code==='invalid_argument'){ro=true;render();toast('Você tem acesso só de leitura a esta agenda.')}else if(e&&e.code==='quota_exceeded')toast('Limite de armazenamento atingido: exclua eventos antigos.');else toast('Não foi possível salvar. Tente de novo.')}
function local(){mode='local';EV=LS.get('agp-events',[]);AGD=LS.get('agp-agendas',[]);render()}
(async()=>{let d=null;try{d=await window.claude?.use?.('db')}catch{}

 if(!d)return local();db=d;mode='db';render();const tm=setTimeout(()=>toast('Ainda carregando os eventos…'),10000);
 db.collection('events').onSnapshot(s=>{if(!s.metadata.fromCache)clearTimeout(tm);EV=s.docs.map(x=>({id:x.id,...x.data()}));render()},e=>{clearTimeout(tm);toast('Erro ao carregar eventos ('+e.code+').')});
 db.collection('agendas').onSnapshot(s=>{AGD=s.docs.map(x=>({id:x.id,...x.data()}));render()},()=>{})})();
// eventos de interface
function go(t){sel=t;const d=new Date(t);cy=d.getUTCFullYear();cm=d.getUTCMonth()}
function shift(n){cm+=n;if(cm<0){cm=11;cy--}if(cm>11){cm=0;cy++}const dim=new Date(Date.UTC(cy,cm+1,0)).getUTCDate();sel=U(cy,cm+1,Math.min(new Date(sel).getUTCDate(),dim));render()}
document.addEventListener('click',ev=>{const b=ev.target.closest('button,[data-pick]');if(!b)return;const D=b.dataset;
 if(D.t&&b.classList.contains('c')){const t=+D.t,d=new Date(t);if(d.getUTCMonth()!==cm){go(t)}else sel=t;render()}
 else if(D.id)openEv(D.id,+D.t);else if('new'in D)openEv(null,sel);else if(D.v){view=D.v;render()}
 else if(D.go){go(+D.go);view='mes';render()}else if('close'in D)close();else if('back'in D)openAg();
 else if(D.edag!==undefined)openAgEd(D.edag);else if(D.th){theme=D.th;LS.set('agp-theme',theme);applyUi()}
 else if('clear'in D){picked.clear();close();render()}});
document.addEventListener('change',ev=>{const D=ev.target.dataset;
 if(D.vis){ev.target.checked?hidden.delete(D.vis):hidden.add(D.vis);LS.set('agp-hidden',[...hidden]);render()}
 if(D.pick){ev.target.checked?picked.add(D.pick):picked.delete(D.pick);bar()}});
$('#prev').onclick=()=>shift(-1);$('#next').onclick=()=>shift(1);$('#today').onclick=()=>{go(TODAY);render()};
$('#ags').onclick=openAg;$('#pick').onclick=()=>{picking=!picking;if(!picking)picked.clear();render()};$('#psend').onclick=openSend;
$('#pall').onclick=()=>{document.querySelectorAll('[data-pick]').forEach(c=>{c.checked=true;picked.add(c.dataset.pick)});bar()};
$('#fsm').onclick=()=>{fs=Math.max(13,fs-1);LS.set('agp-fs',fs);applyUi()};$('#fsp').onclick=()=>{fs=Math.min(22,fs+1);LS.set('agp-fs',fs);applyUi()};
$('#sh').onclick=ev=>{if(ev.target.id==='sh')close()};document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!$('#sh').hidden)close()});
let tx=null;$('#mview').addEventListener('touchstart',e=>tx=e.touches[0].clientX,{passive:true});$('#mview').addEventListener('touchend',e=>{if(tx==null)return;const dx=e.changedTouches[0].clientX-tx;tx=null;if(Math.abs(dx)>60&&!e.target.closest('#day'))shift(dx<0?1:-1)});
applyUi();render();
// importação de Word, PDF e fotos
const LIB={pdf:'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',pdfw:'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js',docx:'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js'};
const loaded={};function loadJs(u){return loaded[u]??=new Promise((ok,no)=>{const s=document.createElement('script');s.src=u;s.onload=ok;s.onerror=()=>{delete loaded[u];no(new Error('lib'))};document.head.append(s)})}
async function pdfLib(){await loadJs(LIB.pdfw);await loadJs(LIB.pdf);const p=window.pdfjsLib;p.GlobalWorkerOptions.workerSrc=LIB.pdfw;return p}
async function readFile(f,imgs,max){const n=f.name.toLowerCase();
 if(/^image\//.test(f.type)||/\.(jpe?g|png|webp|gif|heic)$/.test(n)){imgs.push(f);return`[Foto: ${f.name}]`}
 if(n.endsWith('.docx')){await loadJs(LIB.docx);const r=await window.mammoth.extractRawText({arrayBuffer:await f.arrayBuffer()});return`[Documento Word: ${f.name}]\n${r.value}`}
 if(n.endsWith('.pdf')){const P=await pdfLib(),doc=await P.getDocument({data:new Uint8Array(await f.arrayBuffer()),isEvalSupported:false}).promise;let txt='';
  for(let i=1;i<=Math.min(doc.numPages,40);i++){const pg=await doc.getPage(i),c=await pg.getTextContent();let last=null,line='';for(const it of c.items){const y=Math.round(it.transform[5]);if(last!==null&&y!==last){txt+=line+'\n';line=''}line+=it.str+' ';last=y}txt+=line+'\n\n'}
  if(txt.replace(/\s/g,'').length<40){for(let i=1;i<=Math.min(doc.numPages,max-imgs.length);i++){const pg=await doc.getPage(i),vp=pg.getViewport({scale:1.6}),cv=document.createElement('canvas');cv.width=vp.width;cv.height=vp.height;await pg.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;imgs.push(await new Promise(r=>cv.toBlob(r,'image/png')))}return`[PDF digitalizado: ${f.name}, enviado como imagem]`}
  return`[PDF: ${f.name}]\n${txt}`}
 if(n.endsWith('.doc'))throw new Error('Arquivo .doc antigo: salve como .docx ou PDF e tente de novo.');
 if(/\.(txt|csv|md)$/.test(n))return`[Texto: ${f.name}]\n${await f.text()}`;
 throw new Error(`Formato não suportado: ${f.name}`)}
let found=[],ictl=null;
function openImp(){sheet(`<div class="shh"><h3>Importar datas</h3><button class="x" data-close aria-label="Fechar">✕</button></div>
 <p class="fine">Envie o calendário da pastoral, da diocese ou da CNBB em <b>Word (.docx)</b>, <b>PDF</b> ou <b>foto</b> (cartaz, folheto, quadro de avisos). O Claude lê as datas e você confere antes de salvar.</p>
 <label class="drop" id="drop"><input type="file" id="ifile" multiple accept=".pdf,.docx,.doc,.txt,image/*"><span><b>Escolher arquivos</b> ou arrastar aqui</span><small id="inames">Nenhum arquivo escolhido</small></label>
 <label>Agenda padrão (quando o documento não indicar)<select id="iag">${AGS().map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></label>
 <p id="ist" class="fine" aria-live="polite"></p>
 <div class="act"><span></span><button class="btn" data-close>Cancelar</button><button class="btn pri" id="igo" disabled>Ler datas</button></div>`);
 const fi=$('#ifile'),upd=()=>{$('#inames').textContent=fi.files.length?[...fi.files].map(f=>f.name).join(', '):'Nenhum arquivo escolhido';$('#igo').disabled=!fi.files.length};fi.onchange=upd;
 const dr=$('#drop');dr.ondragover=e=>{e.preventDefault();dr.classList.add('on')};dr.ondragleave=()=>dr.classList.remove('on');dr.ondrop=e=>{e.preventDefault();dr.classList.remove('on');fi.files=e.dataTransfer.files;upd()};
 $('#igo').onclick=()=>runImp([...fi.files],$('#iag').value)}
async function runImp(files,defAg){const st=$('#ist'),go=$('#igo');go.disabled=true;const say=m=>st.textContent=m;let sample=null;
 try{sample=await window.claude?.use?.('sample')}catch{}if(!sample){say('A leitura automática funciona quando a agenda é aberta no Claude (app ou site).');go.disabled=false;return}
 const lim=await sample.limits().catch(()=>null),max=lim?.images?.maxCount||0,imgs=[],parts=[];
 try{say('Lendo os arquivos…');for(const f of files)parts.push(await readFile(f,imgs,max))}catch(e){say(e.message==='lib'?'Não foi possível carregar o leitor de arquivos. Verifique a conexão.':e.message);go.disabled=false;return}
 if(imgs.length&&!lim?.images){say('Este aparelho não consegue enviar fotos ao Claude. Tente um PDF ou Word.');go.disabled=false;return}
 if(imgs.length>max){say(`Envie no máximo ${max} fotos ou páginas por vez.`);go.disabled=false;return}
 const ags=AGS().map(a=>`${a.id} = ${a.name} (${a.pastoral}, nível ${a.nivel})`).join('\n'),text=parts.join('\n\n').slice(0,90000);
 const prompt=`Você extrai eventos de calendário de documentos e fotos de uma paróquia católica no Brasil.
Hoje é ${iso(TODAY)}. Quando o ano não aparecer, use a próxima ocorrência a partir de hoje.
Agendas disponíveis (id = nome):
${ags}
Escolha o "ag" pelo assunto e pelo nível (paroquial, decanato, regional, nacional/CNBB); se não der para saber use "${defAg}".
Tipos: ${TIPOS.join(', ')}.
Responda SOMENTE com um array JSON. Cada item: {"title":string,"date":"AAAA-MM-DD","start":"HH:MM" ou "","end":"HH:MM" ou "","all":boolean,"local":string,"tipo":string,"ag":string,"notes":string}.
Eventos de vários dias: um item por dia. Ignore texto que não seja evento. Se não houver eventos, responda [].
${imgs.length?`Há ${imgs.length} imagem(ns) anexada(s): leia as datas nelas.`:''}

DOCUMENTOS:
${text}`;
 ictl=new AbortController();say('O Claude está lendo as datas… pode levar até um minuto.');
 try{const r=await sample.json(prompt,{images:imgs.length?imgs:undefined,signal:ictl.signal,modelTier:'default'});
  const ids=new Set(AGS().map(a=>a.id));found=(Array.isArray(r)?r:[]).filter(x=>x&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&x.title).map(x=>({title:String(x.title).slice(0,120),date:x.date,start:/^\d\d:\d\d$/.test(x.start)?x.start:'',end:/^\d\d:\d\d$/.test(x.end)?x.end:'',all:!!x.all||!x.start,local:String(x.local||'').slice(0,120),tipo:TIPOS.includes(x.tipo)?x.tipo:'Evento',ag:ids.has(x.ag)?x.ag:defAg,notes:String(x.notes||'').slice(0,1000),rep:'none'})).sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start));
  if(!found.length){say('Nenhuma data de evento encontrada nesses arquivos.');go.disabled=false;return}review()}
 catch(e){const m={not_granted:'Permissão para usar o Claude não concedida.',rate_limited:'Muitas leituras seguidas. Tente de novo em alguns minutos.',image_rejected:'Uma das fotos não pôde ser lida. Tente outra foto.',invalid_json:'Não consegui organizar as datas. Tente de novo.',prompt_too_large:'Documento grande demais: envie menos páginas por vez.',cancelled:''}[e.code];say(m??'Falha na leitura. Tente de novo.');go.disabled=false}}
const STOP=new Set('de da do das dos e a o as os em no na nos nas para com por um uma ao à às pastoral'.split(' '));
const toks=s=>new Set(String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>2&&!STOP.has(w)));
function simil(a,b){const A=toks(a),B=toks(b);if(!A.size||!B.size)return 0;let i=0;A.forEach(w=>B.has(w)&&i++);return Math.max(i/Math.min(A.size,B.size)*.8,i/(A.size+B.size-i))}
function dupOf(e,others){const near=t=>!e.start||!t||Math.abs((+e.start.slice(0,2)*60+ +e.start.slice(3))-(+t.slice(0,2)*60+ +t.slice(3)))<=60;
 return others.find(o=>near(o.start)&&simil(e.title,o.title)>=.5)}
function markDups(){const ds=found.map(e=>parse(e.date)),oc=expand(Math.min(...ds),Math.max(...ds),true);
 found.forEach((e,i)=>{const ex=dupOf(e,oc[e.date]||[]),prev=dupOf(e,found.slice(0,i).filter(x=>x.date===e.date));
  e.dup=ex?`Já existe: “${ex.title}”${ex.all||!ex.start?'':' às '+ex.start} em ${ag(ex.ag)?.name||'outra agenda'}`:prev?`Repetido neste mesmo arquivo: “${prev.title}”`:'';e.on=!e.dup})}
function review(){markDups();const nd=found.filter(e=>e.dup).length;sheet(`<div class="shh"><h3>Conferir ${found.length} data${found.length>1?'s':''}</h3><button class="x" data-close aria-label="Fechar">✕</button></div>
 <p class="fine">Desmarque o que não quiser e ajuste a agenda de cada item.${nd?` <b>${nd} parece${nd>1?'m':''} já estar na agenda</b> e ${nd>1?'foram desmarcados':'foi desmarcado'}; marque se quiser importar mesmo assim.`:' Nenhum evento parecido foi encontrado na agenda.'}</p>
 <div class="rv">${found.map((e,i)=>{const d=new Date(parse(e.date));return`<div class="rvr${e.dup?' dup':''}" style="--c:${col(e)}"><input type="checkbox" ${e.on?'checked':''} data-rv="${i}" aria-label="Importar ${esc(e.title)}"><div><b>${esc(e.title)}</b><small>${SEM[d.getUTCDay()].split('-')[0]}, ${d.getUTCDate()}/${p2(d.getUTCMonth()+1)}/${d.getUTCFullYear()} · ${e.all?'dia todo':esc(e.start)+(e.end?'–'+esc(e.end):'')}${e.local?' · '+esc(e.local):''}</small>${e.dup?`<span class="dw">${esc(e.dup)}</span>`:''}
 <select data-rva="${i}" aria-label="Agenda">${AGS().map(a=>`<option value="${a.id}" ${a.id===e.ag?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div></div>`}).join('')}</div>
 <p id="rst" class="fine" aria-live="polite"></p><div class="act"><span></span><button class="btn" data-close>Cancelar</button>${ro?'':'<button class="btn pri" id="rgo">Importar selecionados</button>'}</div>`);
 document.querySelectorAll('[data-rva]').forEach(s=>s.onchange=()=>{found[+s.dataset.rva].ag=s.value;s.closest('.rvr').style.setProperty('--c',col(found[+s.dataset.rva]))});
 const g=$('#rgo');if(g)g.onclick=async()=>{const pick=[...document.querySelectorAll('[data-rv]')].filter(c=>c.checked).map(c=>found[+c.dataset.rv]);if(!pick.length)return;g.disabled=true;let n=0;
  for(const e of pick){if(!(await put('events',nid(),e)))break;n++;$('#rst').textContent=`Salvando ${n} de ${pick.length}…`}
  close();if(n){go(parse(pick[0].date));render();toast(`${n} evento${n>1?'s':''} importado${n>1?'s':''}.`)}}}
$('#imp').onclick=openImp;
