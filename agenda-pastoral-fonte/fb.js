// Firebase: base única compartilhada (versão do site)
let ME=null,FBU=null,fbAuth=null,MEMB=[],fbUn=[],fbSubOn=false,fbReady=false;
const FBV='10.14.1',FBS=n=>`https://www.gstatic.com/firebasejs/${FBV}/firebase-${n}-compat.js`,PAP={leitor:'Leitor (só vê)',editor:'Editor',admin:'Administrador'};
const canAg=id=>mode!=='fb'||!!ME&&(ME.papel==='admin'||ME.papel==='editor'&&(ME.agendas||[]).some(x=>x==='todas'||x===id));
const canEditAg=()=>!ro&&(mode!=='fb'||ME?.papel==='admin');
async function fbInit(){mode='fb';ro=true;render();
 try{await loadJs(FBS('app'));await loadJs(FBS('auth'));await loadJs(FBS('firestore'))}catch{fbReady=true;render();toast('Sem conexão com o servidor da agenda.');return}
 firebase.initializeApp(window.AGP_FIREBASE);fbAuth=firebase.auth();const fs=firebase.firestore();try{await fs.enablePersistence({synchronizeTabs:true})}catch{}
 db=fs;fbAuth.getRedirectResult().catch(e=>toast('Falha ao entrar ('+(e.code||'erro')+').'));
 fbAuth.onAuthStateChanged(u=>{FBU=u;fbReady=true;fbUn.forEach(f=>f());fbUn=[];fbSubOn=false;ME=null;EV=[];AGD=[];MEMB=[];ro=true;render();if(u)fbStart(u)})}
function fbStart(u){const em=(u.email||'').toLowerCase(),dono=em&&em===String(window.AGP_DONO||'').toLowerCase();
 fbUn.push(db.collection('membros').doc(em).onSnapshot(d=>{ME=d.exists?d.data():dono?{nome:u.displayName||'',papel:'admin',agendas:['todas']}:null;
  if(dono&&!d.exists)db.collection('membros').doc(em).set({nome:u.displayName||'',papel:'admin',agendas:['todas']}).catch(()=>{});
  ro=!ME||ME.papel==='leitor';if(ME&&!fbSubOn)fbSub();render()},e=>{toast('Erro de acesso ('+e.code+').')}))}
function fbSub(){fbSubOn=true;const tm=setTimeout(()=>toast('Ainda carregando os eventos…'),10000);
 fbUn.push(db.collection('events').onSnapshot(s=>{clearTimeout(tm);EV=s.docs.map(x=>({id:x.id,...x.data()}));render()},e=>{clearTimeout(tm);toast('Erro ao carregar eventos ('+e.code+').')}));
 fbUn.push(db.collection('agendas').onSnapshot(s=>{AGD=s.docs.map(x=>({id:x.id,...x.data()}));render()},()=>{}));
 if(ME.papel==='admin')fbUn.push(db.collection('membros').onSnapshot(s=>{MEMB=s.docs.map(x=>({id:x.id,...x.data()})).sort((a,b)=>(a.nome||a.id).localeCompare(b.nome||b.id))},()=>{}))}
async function fbLogin(){const p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});
 try{await fbAuth.signInWithPopup(p)}catch(e){if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment','auth/web-storage-unsupported'].includes(e.code))return fbAuth.signInWithRedirect(p);if(!['auth/popup-closed-by-user','auth/cancelled-popup-request'].includes(e.code))toast('Falha ao entrar ('+e.code+').')}}
function fbNote(){const em=esc(FBU?.email||'');if(!fbReady)return'Conectando à agenda compartilhada…';
 if(!fbAuth)return'Sem conexão com o servidor da agenda. Verifique a internet e recarregue.';
 if(!FBU)return`Agenda compartilhada da pastoral: entre com sua conta Google para ver e lançar eventos. <button class="btn sm pri" id="fbin">Entrar com Google</button>`;
 if(!ME)return`Conectado como ${em}. Seu acesso ainda não foi liberado: peça ao coordenador para incluir este e-mail. <button class="btn sm" id="fbout">Sair</button>`;
 return`Agenda compartilhada · ${esc(ME.nome||em)} · ${PAP[ME.papel]||ME.papel}${ME.papel==='editor'&&!(ME.agendas||[]).includes('todas')?' de '+esc((ME.agendas||[]).map(id=>ag(id)?.name||id).join(', ')):''} <button class="btn sm" id="fbout">Sair</button>`}
function memBlock(){if(mode!=='fb'||ME?.papel!=='admin')return'';
 return`<p class="sub">Pessoas com acesso</p><div class="agl">${MEMB.map(m=>`<div class="agr"><span style="flex:1;display:flex;flex-direction:column"><b>${esc(m.nome||m.id)}</b><small>${esc(m.id)} · ${PAP[m.papel]||esc(m.papel)} · ${(m.agendas||[]).includes('todas')?'todas as agendas':esc((m.agendas||[]).map(id=>ag(id)?.name||id).join(', ')||'nenhuma agenda')}</small></span><button class="btn sm" data-edm="${esc(m.id)}">Editar</button></div>`).join('')}</div><button class="btn" data-edm="">+ Adicionar pessoa</button>`}
function openMem(id){const m=MEMB.find(x=>x.id===id)||{id:'',nome:'',papel:'editor',agendas:[]},all=(m.agendas||[]).includes('todas'),self=id&&id===(FBU?.email||'').toLowerCase();
 sheet(`<form id="fm"><div class="shh"><h3>${id?'Editar acesso':'Adicionar pessoa'}</h3><button type="button" class="x" data-close aria-label="Fechar">✕</button></div>
 <label>E-mail da conta Google<input id="m-email" type="email" required ${id?'readonly':''} value="${esc(m.id)}" placeholder="nome@gmail.com"></label>
 <label>Nome<input id="m-nome" maxlength="60" value="${esc(m.nome||'')}"></label>
 <label>Permissão<select id="m-pap" ${self?'disabled':''}>${Object.entries(PAP).map(([k,v])=>`<option value="${k}" ${k===m.papel?'selected':''}>${v}</option>`).join('')}</select></label>
 <div id="m-ags"><p class="sub">Agendas em que pode lançar e editar</p><label class="tg"><input type="checkbox" id="m-all" ${all?'checked':''}> Todas as agendas</label>
 ${AGS().map(a=>`<label class="tg"><input type="checkbox" data-mag="${a.id}" ${all||(m.agendas||[]).includes(a.id)?'checked':''} ${all?'disabled':''}><i style="display:inline-block;width:.8rem;height:.8rem;border-radius:50%;background:${a.color}"></i> ${esc(a.name)}</label>`).join('')}</div>
 <p class="fine">Leitor vê tudo e não altera. Editor lança e altera eventos só nas agendas marcadas. Administrador altera tudo, inclusive agendas e pessoas.</p><p id="m-st" class="fine" aria-live="polite"></p>
 <div class="act">${id&&!self?'<button type="button" class="btn del" id="mdel">Remover acesso</button>':''}<span></span><button type="button" class="btn" data-back>Voltar</button><button class="btn pri">Salvar</button></div></form>`);
 const sync=()=>{$('#m-ags').hidden=$('#m-pap').value!=='editor';document.querySelectorAll('[data-mag]').forEach(c=>{c.disabled=$('#m-all').checked;if($('#m-all').checked)c.checked=true})};$('#m-pap').onchange=sync;$('#m-all').onchange=sync;sync();
 $('#fm').onsubmit=async ev=>{ev.preventDefault();const em=$('#m-email').value.trim().toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))return $('#m-st').textContent='E-mail inválido.';
  const papel=self?'admin':$('#m-pap').value,agendas=papel!=='editor'||$('#m-all').checked?['todas']:[...document.querySelectorAll('[data-mag]:checked')].map(c=>c.dataset.mag);
  if(papel==='editor'&&!agendas.length)return $('#m-st').textContent='Marque ao menos uma agenda.';
  try{await db.collection('membros').doc(em).set({nome:$('#m-nome').value.trim(),papel,agendas});openAg();toast('Acesso salvo. A pessoa entra com essa conta Google.')}catch(e){$('#m-st').textContent='Não foi possível salvar ('+e.code+').'}};
 const d=$('#mdel');if(d)d.onclick=async()=>{if(!d.dataset.ok){d.dataset.ok=1;d.textContent='Confirmar remoção';return}try{await db.collection('membros').doc(id).delete();openAg();toast('Acesso removido.')}catch(e){toast('Não foi possível remover ('+e.code+').')}}}
document.addEventListener('click',ev=>{const t=ev.target;if(t.closest('#fbin'))fbLogin();else if(t.closest('#fbout'))fbAuth&&fbAuth.signOut();else{const b=t.closest('[data-edm]');if(b)openMem(b.dataset.edm)}});
