// Regional Leste 1: dioceses, decanatos e paróquias (fonte: cnbbleste1.org.br e diocesepetropolis.com.br, nov/2026)
const REGIONAL='Leste 1 (RJ)';
const LOC=[
 {nome:'Arquidiocese de São Sebastião do Rio de Janeiro',decanatos:[]},
 {nome:'Arquidiocese de Niterói',decanatos:[]},
 {nome:'Diocese de Barra do Piraí – Volta Redonda',decanatos:[]},
 {nome:'Diocese de Campos dos Goytacazes',decanatos:[]},
 {nome:'Diocese de Duque de Caxias',decanatos:[]},
 {nome:'Diocese de Itaguaí',decanatos:[]},
 {nome:'Diocese de Nova Friburgo',decanatos:[]},
 {nome:'Diocese de Nova Iguaçu',decanatos:[]},
 {nome:'Diocese de Petrópolis',decanatos:[
  {nome:'Decanato Nossa Senhora do Amor Divino',paroquias:['Paróquia Nossa Senhora da Conceição – Bemposta','Paróquia Nossa Senhora das Dores – Areal','Paróquia Nossa Senhora de Fátima – Madame Machado','Paróquia Nossa Senhora de Lourdes – Araras','Paróquia Nossa Senhora do Amor Divino – Corrêas','Paróquia Santana de Inconfidência – Sebollas (Paraíba do Sul)','Paróquia Santo Antônio e Santo Agostinho – Nogueira','Paróquia São João Batista – Posse','Paróquia São José – Itaipava','Paróquia São José – São José do Vale do Rio Preto','Paróquia São Pedro – Pedro do Rio','Paróquia São Sebastião – Contendas']},
  {nome:'Decanato Santa Teresa',paroquias:['Paróquia Nossa Senhora da Conceição – Nhunguaçu','Paróquia Nossa Senhora do Bom Sucesso','Paróquia Sagrado Coração de Jesus de Barra – Imbuí','Paróquia Santa Rita de Cássia – Meudon','Paróquia Santa Teresa – Várzea','Paróquia Santo Antônio de Paquequer','Paróquia São Charbel de Pessegueiros','Paróquia São Cristóvão','Paróquia São José – Água Quente','Paróquia São Judas Tadeu – Teresópolis','Paróquia São Pedro – Teresópolis']},
  {nome:'Decanato São José de Anchieta',paroquias:['Paróquia Nossa Senhora Aparecida – Parada Modelo','Paróquia Nossa Senhora Aparecida – Piabetá','Paróquia Nossa Senhora da Ajuda – Guapimirim','Paróquia Nossa Senhora da Conceição – Raiz da Serra','Paróquia Nossa Senhora da Conceição e Santo Aleixo','Paróquia Nossa Senhora da Guia de Pacobaíba – Magé','Paróquia Nossa Senhora da Piedade – Magé','Paróquia Santa Terezinha do Menino Jesus – Vila Inhomirim','Paróquia Santo Antônio – Nova Marília','Paróquia São Nicolau – Suruí','Paróquia São Sebastião – Piabetá']},
  {nome:'Decanato São Pedro de Alcântara',paroquias:['Paróquia Nossa Senhora Aparecida – Quitandinha','Paróquia Nossa Senhora do Rosário – Centro','Paróquia Sagrado Coração de Jesus – Centro','Paróquia Sant’Ana e São Joaquim – Cascatinha','Paróquia Santa Clara – Valparaíso','Paróquia Santa Rita de Cássia – Castrioto','Paróquia Santo Antônio – Alto da Serra','Paróquia Santo Tomás de Aquino – Retiro','Paróquia São Charbel do Caxambu','Paróquia São Jorge – Independência','Paróquia São José – Itamarati','Paróquia São Judas Tadeu – Mosela','Paróquia São Pedro de Alcântara – Catedral','Paróquia São Sebastião – Carangola','Paróquia São Sebastião – Indaiá']}]},
 {nome:'Diocese de Valença',decanatos:[]},
 {nome:'Administração Apostólica Pessoal São João Maria Vianney',decanatos:[]}];
const OUT='__outra',lopt=(arr,v,ph)=>`<option value="">${ph}</option>`+arr.map(x=>`<option ${x===v?'selected':''}>${esc(x)}</option>`).join('');
function locHTML(p){return`<p class="sub">Onde participa</p>
 <label>Diocese<select id="${p}-dio"></select><input id="${p}-diot" maxlength="80" placeholder="Digite a diocese" hidden></label>
 <label>Decanato / vicariato<select id="${p}-dec"></select><input id="${p}-dect" maxlength="80" placeholder="Digite o decanato ou vicariato" hidden></label>
 <label>Paróquia<select id="${p}-par"></select><input id="${p}-part" maxlength="100" placeholder="Digite o nome da paróquia" hidden></label>`}
function locBind(p,v0){const v={...(v0||{})},g=s=>$('#'+p+'-'+s),dio=g('dio'),diot=g('diot'),dec=g('dec'),dect=g('dect'),par=g('par'),part=g('part');
 const D=()=>LOC.find(d=>d.nome===dio.value);
 const sel=(s,t,list,val,ph)=>{if(list.length){s.hidden=false;const inl=!val||list.includes(val);s.innerHTML=lopt(list,inl?val:'',ph)+`<option value="${OUT}" ${!inl?'selected':''}>Outra (digitar)</option>`;t.hidden=inl;t.value=inl?'':val}else{s.hidden=true;s.innerHTML='';t.hidden=false;t.value=val||''}};
 const fPar=()=>{const d=D(),x=d?.decanatos.find(k=>k.nome===dec.value),ps=x?x.paroquias:(d?.decanatos||[]).flatMap(k=>k.paroquias);sel(par,part,ps,v.paroquia,'Selecione a paróquia')};
 const fDec=()=>{const d=D();sel(dec,dect,(d?.decanatos||[]).map(k=>k.nome),v.decanato,'Selecione o decanato');fPar()};
 sel(dio,diot,LOC.map(d=>d.nome),v.diocese,'Selecione a diocese');fDec();
 dio.onchange=()=>{diot.hidden=dio.value!==OUT;v.decanato='';v.paroquia='';fDec()};
 dec.onchange=()=>{dect.hidden=dec.value!==OUT;v.paroquia='';fPar()};
 par.onchange=()=>{part.hidden=par.value!==OUT}}
function locRead(p){const g=s=>$('#'+p+'-'+s),val=(s,t)=>s.hidden||s.value===OUT?t.value.trim():s.value;
 const diocese=val(g('dio'),g('diot'));return{regional:LOC.some(d=>d.nome===diocese)?REGIONAL:'',diocese,decanato:val(g('dec'),g('dect')),paroquia:val(g('par'),g('part'))}}
// pedidos de acesso
var PED=[],MYREQ=null,myReqSub=false;
function openReq(){const u=FBU,r=MYREQ||{};sheet(`<form id="fr"><div class="shh"><h3>Pedir acesso</h3><button type="button" class="x" data-close aria-label="Fechar">✕</button></div>
 <p class="fine">Seu pedido vai para o coordenador da agenda. Assim que for aprovado, você vê os eventos ao entrar com <b>${esc(u.email)}</b>.</p>
 <label>Nome<input id="r-nome" required maxlength="60" value="${esc(r.nome||u.displayName||'')}"></label>
 <div class="two"><label>Telefone / WhatsApp<input id="r-tel" inputmode="tel" maxlength="20" value="${esc(r.telefone||'')}"></label><label>Função<input id="r-func" list="dl-func2" maxlength="60" value="${esc(r.funcao||'')}" placeholder="Ex.: Agente da Pastoral Familiar"></label></div>
 <datalist id="dl-func2">${FUNCOES.map(f=>`<option value="${esc(f)}">`).join('')}</datalist>
 ${locHTML('r')}
 <label>Recado ao coordenador (opcional)<textarea id="r-msg" rows="2" maxlength="300">${esc(r.msg||'')}</textarea></label><p id="r-st" class="fine" aria-live="polite"></p>
 <div class="act">${MYREQ?'<button type="button" class="btn del" id="rdel">Cancelar pedido</button>':''}<span></span><button type="button" class="btn" data-close>Voltar</button><button class="btn pri">${MYREQ?'Atualizar pedido':'Enviar pedido'}</button></div></form>`);
 locBind('r',r);
 $('#fr').onsubmit=async ev=>{ev.preventDefault();const em=(u.email||'').toLowerCase(),l=locRead('r');if(!l.paroquia)return $('#r-st').textContent='Informe a sua paróquia.';
  try{await db.collection('pedidos').doc(em).set({email:em,nome:$('#r-nome').value.trim(),telefone:$('#r-tel').value.trim(),funcao:$('#r-func').value.trim(),...l,msg:$('#r-msg').value.trim(),quando:new Date().toISOString()});close();toast('Pedido enviado ao coordenador.')}catch(e){$('#r-st').textContent='Não foi possível enviar ('+(e.code||'erro')+').'}};
 const d=$('#rdel');if(d)d.onclick=async()=>{try{await db.collection('pedidos').doc((u.email||'').toLowerCase()).delete();close();toast('Pedido cancelado.')}catch{}}}
function pedBlock(){if(mode!=='fb'||ME?.papel!=='admin'||!PED.length)return'';
 return`<p class="sub" style="color:var(--acc)">Pedidos de acesso (${PED.length})</p><div class="agl">${PED.map(r=>`<div class="agr"><span style="flex:1;display:flex;flex-direction:column"><b>${esc(r.nome||r.email)}</b><small><b style="font-weight:600;color:var(--ink)">${esc([r.funcao,r.paroquia].filter(Boolean).join(' · '))}</b></small><small>${esc(r.email)}${r.telefone?' · '+esc(r.telefone):''}${r.quando?' · pedido em '+fd(parse(r.quando.slice(0,10))):''}</small>${r.msg?`<small>“${esc(r.msg)}”</small>`:''}</span><span style="display:flex;flex-direction:column;gap:.3rem"><button class="btn sm pri" data-apr="${esc(r.email)}">Aprovar</button><button class="btn sm" data-rec="${esc(r.email)}">Recusar</button></span></div>`).join('')}</div>`}
document.addEventListener('click',async ev=>{const t=ev.target;
 if(t.closest('#fbreq'))return openReq();
 const a=t.closest('[data-apr]');if(a){const r=PED.find(x=>x.email===a.dataset.apr);if(r)openMem('',r);return}
 const rc=t.closest('[data-rec]');if(rc){if(!rc.dataset.ok){rc.dataset.ok=1;rc.textContent='Confirmar';return}try{await db.collection('pedidos').doc(rc.dataset.rec).delete();openAg();toast('Pedido recusado.')}catch(e){toast('Não foi possível ('+e.code+').')}}});
