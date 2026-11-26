// Mural de avisos (por grupo/agenda), com "Ciente" e respostas
var AV=[],CI=[],RE=[],muralOn=false,MF='todas',MOPEN=new Set(),avUn=[];
function avSeen(){return LS.get('agp-avseen','')}
function hm(iso){try{return new Date(iso).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}catch{return''}}
function dtBr(iso){const d=new Date(iso);return isNaN(d)?'':p2(d.getDate())+'/'+p2(d.getMonth()+1)+'/'+d.getFullYear()+' '+hm(iso)}
function linkify(s){return esc(s).replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g,'<br>')}
function whoName(uid,nome){return mode==='fb'?(nome||uid):(NAMES[uid]||nome||'Alguém')}
function avVisible(){const t=iso(TODAY),vis=new Set(AGS().filter(a=>!hidden.has(a.id)).map(a=>a.id));return AV.filter(a=>vis.has(a.ag)&&(!a.ate||a.ate>=t)&&(MF==='todas'||a.ag===MF)).sort((a,b)=>(b.fixo?1:0)-(a.fixo?1:0)||(b.quando||'').localeCompare(a.quando||''))}
function avNovos(){const s=avSeen(),me=myId();return AV.filter(a=>(a.quando||'')>s&&a.autor!==me&&canSee(a.ag)&&(!a.ate||a.ate>=iso(TODAY))).length}
function canAvEdit(a){return a.autor===myId()||(mode==='fb'&&ME?.papel==='admin')}
function canAvPost(){return shared()&&!ro&&AGS().some(a=>canAg(a.id))}
function mural(){const box=$('#mural');if(!box)return;
 if(!shared()){box.innerHTML=`<div class="mh"><h2>Mural de avisos</h2></div><p class="empty">${mode==='local'?'O mural funciona na agenda compartilhada: os avisos chegam a todos do grupo.':'Entre na agenda para ver os avisos.'}</p>`;return}
 const L=avVisible(),ags=AGS().filter(a=>!hidden.has(a.id)&&AV.some(v=>v.ag===a.id));
 box.innerHTML=`<div class="mh"><h2>Mural de avisos</h2>${canAvPost()?'<button class="btn pri" data-avnew>+ Aviso</button>':''}</div>
 ${ags.length>1?`<div class="mfil" role="group" aria-label="Filtrar por grupo"><button data-mf="todas" aria-pressed="${MF==='todas'}">Todos</button>${ags.map(a=>`<button data-mf="${a.id}" aria-pressed="${MF===a.id}" style="--c:${a.color}"><i></i>${esc(a.name)}</button>`).join('')}</div>`:''}
 ${L.length?L.map(avCard).join(''):`<p class="empty">Nenhum aviso${MF==='todas'?'':' neste grupo'}.${canAvPost()?' Toque em “+ Aviso” para escrever o primeiro.':''}</p>`}`}
function avCard(a){const g=ag(a.ag),me=myId(),ci=CI.filter(c=>c.aviso===a.id),re=RE.filter(r=>r.aviso===a.id).sort((x,y)=>(x.quando||'').localeCompare(y.quando||'')),meu=ci.some(c=>c.uid===me),open=MOPEN.has(a.id),novo=(a.quando||'')>avSeen()&&a.autor!==me;
 return`<article class="av${a.fixo?' fx':''}" style="--c:${g?.color||'#888'}">
 <header><b>${a.fixo?'<span class="pin">Fixado</span> ':''}${novo?'<span class="nv">Novo</span> ':''}${esc(a.titulo)}</b><small>${esc(g?.name||'')} · ${esc(whoName(a.autor,a.autorNome))} · ${dtBr(a.quando)}${a.ate?' · válido até '+isoBr(a.ate):''}</small></header>
 <div class="avt">${linkify(a.texto||'')}</div>
 <footer><button class="btn sm${meu?' on':''}" data-ci="${a.id}" aria-pressed="${meu}">${meu?'✓ Ciente':'Marcar ciente'}${ci.length?` (${ci.length})`:''}</button><button class="btn sm" data-avo="${a.id}" aria-expanded="${open}">Respostas${re.length?` (${re.length})`:''}</button><button class="btn sm" data-wa="${a.id}">WhatsApp</button>${canAvEdit(a)?`<button class="btn sm" data-ave="${a.id}">Editar</button>`:''}</footer>
 ${open?`<div class="avr">${ci.length?`<p class="fine"><b>Cientes:</b> ${ci.map(c=>esc(whoName(c.uid,c.nome))).join(', ')}</p>`:''}${re.map(r=>`<p class="rp"><b>${esc(whoName(r.uid,r.nome))}</b> <small>${dtBr(r.quando)}</small>${r.uid===me||(mode==='fb'&&ME?.papel==='admin')?` <button class="lk" data-rdel="${r.id}">apagar</button>`:''}<br>${linkify(r.texto)}</p>`).join('')}
 <form class="rf" data-rf="${a.id}"><input maxlength="500" placeholder="Escrever resposta…" aria-label="Resposta"><button class="btn sm pri">Enviar</button></form></div>`:''}</article>`}
function openAv(id){const a=AV.find(x=>x.id===id)||{ag:MF!=='todas'&&canAg(MF)?MF:AGS().find(x=>canAg(x.id))?.id,fixo:false};
 sheet(`<form id="fa2"><div class="shh"><h3>${id?'Editar aviso':'Novo aviso'}</h3><button type="button" class="x" data-close aria-label="Fechar">✕</button></div>
 <label>Grupo (quem vai receber)<select id="a-ag">${AGS().filter(x=>canAg(x.id)||x.id===a.ag).map(x=>`<option value="${x.id}" ${x.id===a.ag?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label>
 <label>Título<input id="a-tit" required maxlength="100" value="${esc(a.titulo||'')}" placeholder="Ex.: Mudança de local da reunião"></label>
 <label>Aviso<textarea id="a-txt" rows="6" maxlength="3000" required placeholder="Escreva o aviso. Links viram clicáveis.">${esc(a.texto||'')}</textarea></label>
 <div class="two"><label>Válido até (opcional)${dfield('a-ate',a.ate)}</label><label class="tg"><input type="checkbox" id="a-fx" ${a.fixo?'checked':''}> Fixar no topo</label></div>
 <p class="fine">Só quem vê esse grupo recebe o aviso. Depois da data de validade ele sai do mural.</p><p id="a-st" class="fine" aria-live="polite"></p>
 <div class="act">${id?'<button type="button" class="btn del" id="adel2">Apagar</button>':''}<span></span><button type="button" class="btn" data-close>Cancelar</button><button class="btn pri">${id?'Salvar':'Publicar'}</button></div></form>`);
 $('#fa2').onsubmit=async ev=>{ev.preventDefault();const ate=$('#a-ate').value.trim()?brIso($('#a-ate').value):'';if($('#a-ate').value.trim()&&!ate)return $('#a-st').textContent='Data inválida: use dd/mm/aaaa.';
  const b={ag:$('#a-ag').value,titulo:$('#a-tit').value.trim(),texto:$('#a-txt').value.trim(),ate,fixo:$('#a-fx').checked,autor:a.autor||myId(),quando:a.quando||new Date().toISOString(),...(mode==='fb'?{autorNome:a.autorNome||ME?.nome||FBU?.displayName||''}:{}),...(id?{editado:new Date().toISOString()}:{})};
  if(!b.titulo||!b.texto)return;try{await db.collection('avisos').doc(id||nid()).set(b);close();MF='todas';toast(id?'Aviso atualizado.':'Aviso publicado.')}catch(e){$('#a-st').textContent='Não foi possível publicar ('+(e.code||'erro')+').'}};
 const d=$('#adel2');if(d)d.onclick=async()=>{if(!d.dataset.ok){d.dataset.ok=1;d.textContent='Confirmar';return}try{await db.collection('avisos').doc(id).delete();close();toast('Aviso apagado.')}catch(e){toast('Não foi possível apagar.')}}}
async function avCiente(id){const me=myId(),cid=safeSeg(id+'~'+me),cur=CI.find(c=>c.aviso===id&&c.uid===me);
 try{if(cur)await db.collection('cientes').doc(cid).delete();else await db.collection('cientes').doc(cid).set({aviso:id,uid:me,quando:new Date().toISOString(),...(mode==='fb'?{nome:ME?.nome||FBU?.displayName||me}:{})})}catch{toast('Não foi possível registrar.')}}
function avWa(id){const a=AV.find(x=>x.id===id);if(!a)return;const url=location.protocol.startsWith('http')&&!inClaude()?location.origin+location.pathname:'';
 const t=`*${a.titulo}*\n${a.texto}${a.ate?`\n(válido até ${isoBr(a.ate)})`:''}${url?`\n\nMural da agenda: ${url}`:''}`;window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank','noopener')}
function avSub(q){const un=[q.onSnapshot(s=>{AV=s.docs.map(x=>({id:x.id,...x.data()}));render();avNames()},()=>{}),
 db.collection('cientes').onSnapshot(s=>{CI=s.docs.map(x=>({id:x.id,...x.data()}));render();avNames()},()=>{}),
 db.collection('respostas').onSnapshot(s=>{RE=s.docs.map(x=>({id:x.id,...x.data()}));render();avNames()},()=>{})];if(mode==='fb')fbUn.push(...un)}
function avNames(){if(mode!=='db'||!USR?.profiles)return;const ids=[...new Set([...AV.map(a=>a.autor),...CI.map(c=>c.uid),...RE.map(r=>r.uid)])].filter(i=>i&&!(i in NAMES));if(!ids.length)return;
 USR.profiles(ids).then(ps=>{ids.forEach(i=>NAMES[i]=ps?.[i]?.name||'');render()}).catch(()=>{})}
document.addEventListener('click',ev=>{const t=ev.target,b=t.closest('[data-avnew],[data-mf],[data-ci],[data-avo],[data-wa],[data-ave],[data-rdel],#avbtn');if(!b)return;const D=b.dataset;
 if('avnew'in D)openAv(null);else if(D.mf){MF=D.mf;render()}else if(D.ci)avCiente(D.ci);else if(D.avo){MOPEN.has(D.avo)?MOPEN.delete(D.avo):MOPEN.add(D.avo);render()}
 else if(D.wa)avWa(D.wa);else if(D.ave)openAv(D.ave);else if(D.rdel)db.collection('respostas').doc(D.rdel).delete().catch(()=>toast('Não foi possível apagar.'));
 else if(b.id==='avbtn'){if(view!=='mes'){view='mes';render()}$('#mural')?.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>{LS.set('agp-avseen',new Date().toISOString());render()},1500)}});
document.addEventListener('submit',async ev=>{const f=ev.target.closest('[data-rf]');if(!f)return;ev.preventDefault();const inp=f.querySelector('input'),txt=inp.value.trim();if(!txt)return;
 try{await db.collection('respostas').doc(nid()).set({aviso:f.dataset.rf,uid:myId(),texto:txt,quando:new Date().toISOString(),...(mode==='fb'?{nome:ME?.nome||FBU?.displayName||''}:{})});inp.value=''}catch{toast('Não foi possível enviar.')}});
