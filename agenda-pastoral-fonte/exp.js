// exportação PDF e HTML
const JSPDF='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
const LHEX={w:'#e6d6a3',v:'#6a3fa3',g:'#2e7a3c',r:'#c0392b',p:'#e38aae'};
const rgb=h=>{h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return[0,2,4].map(i=>parseInt(h.substr(i,2),16))};
const pt=s=>String(s??'').replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/[–—]/g,'-').replace(/…/g,'...').replace(/[^\x20-\x7e\xa0-\xff]/g,'');
const short=n=>n.split(/[,·(]/)[0].trim();
function expRange(k){let y=cy,m=cm,n=1;if(k==='3')n=3;if(k==='ano'){m=0;n=12}if(k==='lit'){const a=ly(cy).adv1,d=new Date(a);if(sel>=a){y=cy;m=d.getUTCMonth()}else{const b=ly(cy-1).adv1,e=new Date(b);y=cy-1;m=e.getUTCMonth()}n=13}
 const months=[];for(let i=0;i<n;i++){const t=new Date(Date.UTC(y,m+i,1));months.push({y:t.getUTCFullYear(),m:t.getUTCMonth()})}
 const from=Date.UTC(months[0].y,months[0].m,1),l=months[n-1],to=Date.UTC(l.y,l.m+1,0);return{months,from,to,oc:expand(from,to)}}
function rangeLabel(R){const a=R.months[0],b=R.months[R.months.length-1];return R.months.length===1?`${MES[a.m]} de ${a.y}`:`${MES[a.m]} de ${a.y} a ${MES[b.m]} de ${b.y}`}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function openExp(){sheet(`<div class="shh"><h3>Exportar</h3><button class="x" data-close aria-label="Fechar">✕</button></div>
 <label>Período<select id="xr"><option value="1">${cap(MES[cm])} de ${cy}</option><option value="3">3 meses a partir de ${MES[cm]}</option><option value="ano">Ano civil ${cy}</option><option value="lit">Ano litúrgico (do 1º Domingo do Advento)</option></select></label>
 <label class="tg"><input type="checkbox" id="xg" checked> Calendário mensal (grade com cores)</label>
 <label class="tg"><input type="checkbox" id="xl" checked> Lista de eventos e solenidades</label>
 <p class="fine">Entram só as agendas visíveis (ajuste em “Agendas”). O PDF sai em A4 deitado, pronto para imprimir ou mandar no WhatsApp; o HTML abre em qualquer navegador.</p>
 <p id="xst" class="fine" aria-live="polite"></p>
 <div class="act"><span></span><button class="btn" id="xh">Baixar HTML</button><button class="btn pri" id="xp">Baixar PDF</button></div>`);
 $('#xp').onclick=()=>doExp('pdf');$('#xh').onclick=()=>doExp('html')}
async function doExp(kind){const st=$('#xst'),say=m=>st.textContent=m,g=$('#xg').checked,l=$('#xl').checked;if(!g&&!l)return say('Escolha a grade, a lista ou as duas.');
 let dl=null;try{dl=await window.claude?.use?.('downloads')}catch{}if(!dl)return say('A exportação funciona quando a agenda é aberta no Claude (app ou site).');
 const R=expRange($('#xr').value),a=R.months[0],name=`agenda-pastoral-${a.y}-${p2(a.m+1)}${R.months.length>1?'-'+R.months.length+'meses':''}`;
 document.querySelectorAll('#xp,#xh').forEach(b=>b.disabled=true);say(kind==='pdf'?'Montando o PDF…':'Montando o HTML…');
 try{let data;if(kind==='pdf'){await loadJs(JSPDF);data=buildPdf(R,g,l)}else data=buildHtml(R,g,l);
  await dl.save({filename:name+'.'+kind,data});say('Arquivo pronto.')}
 catch(e){say(e?.code==='declined'?'Download cancelado.':e?.code==='rate_limited'?'Aguarde um instante e tente de novo.':e?.message==='lib'?'Não foi possível carregar o gerador de PDF. Verifique a conexão.':'Não foi possível exportar.')}
 finally{document.querySelectorAll('#xp,#xh').forEach(b=>b.disabled=false)}}
function legend(){return AGS().filter(x=>!hidden.has(x.id))}
function buildPdf(R,g,l){const{jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}),W=297,H=210,M=12;let first=true;
 const fill=h=>doc.setFillColor(...rgb(h)),txt=h=>doc.setTextColor(...rgb(h)),draw=h=>doc.setDrawColor(...rgb(h));
 const newPage=()=>{if(!first)doc.addPage();first=false};
 const foot=()=>{doc.setFontSize(7);txt('#6c6860');doc.text(pt(`Agenda Pastoral · gerado em ${new Date().toLocaleDateString('pt-BR')} · tempos e solenidades pelas normas gerais e da CNBB; confira o Diretório Litúrgico da diocese.`),M,H-5)};
 if(g)for(const{y,m}of R.months){newPage();const f=Date.UTC(y,m,1),start=f-dow(f)*DAY,dim=new Date(Date.UTC(y,m+1,0)).getUTCDate(),wk=Math.ceil((dow(f)+dim)/7);
  doc.setFont('helvetica','bold');doc.setFontSize(20);txt('#1b1a17');doc.text(pt(cap(MES[m])+' '+y),M,17);
  const L0=lit(Date.UTC(y,m,15));doc.setFont('helvetica','normal');doc.setFontSize(9);txt('#6c6860');doc.text(pt(`Ano litúrgico ${L0.ano} · Agenda Pastoral`),W-M,17,{align:'right'});
  const gx=M,gy=24,gw=W-2*M,cw=gw/7,hh=6,gh=H-gy-24,ch=(gh-hh)/wk;
  doc.setFontSize(7.5);doc.setFont('helvetica','bold');['DOM','SEG','TER','QUA','QUI','SEX','SÁB'].forEach((d,i)=>{txt(i?'#6c6860':'#8a1c3b');doc.text(pt(d),gx+i*cw+cw/2,gy+4,{align:'center'})});
  for(let i=0;i<wk*7;i++){const t=start+i*DAY,d=new Date(t),x=gx+(i%7)*cw,yy=gy+hh+Math.floor(i/7)*ch,out=d.getUTCMonth()!==m,L=lit(t),ev=out?[]:(R.oc[iso(t)]||[]);
   draw('#d9d4ca');doc.setLineWidth(.2);doc.rect(x,yy,cw,ch);if(out){fill('#f6f4ef');doc.rect(x,yy,cw,ch,'F');draw('#d9d4ca');doc.rect(x,yy,cw,ch)}
   fill(LHEX[L.c]);doc.rect(x+1,yy+ch-2.2,cw-2,1.4,'F');
   doc.setFont('helvetica','bold');doc.setFontSize(9);txt(out?'#b5b0a6':!d.getUTCDay()?'#8a1c3b':'#1b1a17');doc.text(String(d.getUTCDate()),x+1.6,yy+4.2);
   let ly2=yy+4.2;const big=L.cel&&(L.cel.r==='S'||L.cel.r==='F');
   if(big&&!out){doc.setFont('helvetica','italic');doc.setFontSize(6);txt('#8a1c3b');doc.text(doc.splitTextToSize(pt(short(L.cel.n)),cw-9)[0],x+7,yy+4)}
   doc.setFont('helvetica','normal');doc.setFontSize(6.3);const lh=2.9,room=Math.floor((ch-8)/lh);
   ev.slice(0,ev.length>room?room-1:room).forEach((e,k)=>{const yl=ly2+3.4+k*lh;fill(col(e));doc.rect(x+1.4,yl-1.9,.9,2.2,'F');txt('#1b1a17');doc.text(doc.splitTextToSize(pt((e.all||!e.start?'':e.start+' ')+e.title),cw-4)[0],x+3,yl)});
   if(ev.length>room){txt('#6c6860');doc.text(`+${ev.length-room+1}`,x+3,ly2+3.4+(room-1)*lh)}}
  let lx=M,ly3=H-14;doc.setFontSize(7);doc.setFont('helvetica','normal');
  for(const a2 of legend()){fill(a2.color);doc.circle(lx+1.2,ly3-1,1.1,'F');txt('#1b1a17');const s=pt(a2.name);doc.text(s,lx+3.3,ly3);lx+=doc.getTextWidth(s)+8;if(lx>W-60){lx=M;ly3+=4}}
  for(const[k,c]of Object.entries(LC)){fill(LHEX[k]);doc.rect(lx,ly3-1.8,4,1.4,'F');txt('#6c6860');doc.text(pt(c.n),lx+5,ly3);lx+=doc.getTextWidth(pt(c.n))+8}
  foot()}
 if(l){newPage();let y=M+6;const head=()=>{doc.setFont('helvetica','bold');doc.setFontSize(16);txt('#1b1a17');doc.text(pt('Eventos · '+rangeLabel(R)),M,y);y+=8};head();
  for(let t=R.from;t<=R.to;t+=DAY){const ev=R.oc[iso(t)]||[],L=lit(t),big=L.cel&&(L.cel.r==='S'||L.cel.r==='F');if(!ev.length&&!big)continue;
   const need=8+ev.length*5;if(y+need>H-12){foot();doc.addPage();y=M+6;head()}
   const d=new Date(t);fill(LHEX[L.c]);doc.rect(M,y-3.2,1.6,4.2,'F');doc.setFont('helvetica','bold');doc.setFontSize(10);txt('#1b1a17');doc.text(pt(`${cap(SEM[d.getUTCDay()])}, ${d.getUTCDate()} de ${MES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`),M+3.5,y);
   doc.setFont('helvetica','normal');doc.setFontSize(8);txt('#6c6860');doc.text(pt([L.cel?L.cel.n+(RK[L.cel.r]?' ('+RK[L.cel.r]+')':''):(L.w||L.s),LC[L.c].n].join(' · ')),M+3.5,y+4);y+=9;
   for(const e of ev){fill(col(e));doc.rect(M+3.5,y-2.6,1.2,3.2,'F');doc.setFontSize(9);txt('#1b1a17');doc.setFont('helvetica','bold');doc.text(pt(e.all||!e.start?'dia todo':e.start+(e.end?'-'+e.end:'')),M+6,y);
    doc.text(doc.splitTextToSize(pt(e.title),95)[0],M+30,y);doc.setFont('helvetica','normal');txt('#6c6860');doc.text(doc.splitTextToSize(pt([e.tipo,ag(e.ag)?.name,e.local].filter(Boolean).join(' · ')),W-2*M-130)[0],M+128,y);y+=5}
   y+=2}
  if(y===M+14){doc.setFontSize(10);txt('#6c6860');doc.text(pt('Nenhum evento no período.'),M,y)}foot()}
 return doc.output('arraybuffer')}
function buildHtml(R,g,l){const e2=esc;let body='';
 if(g)for(const{y,m}of R.months){const f=Date.UTC(y,m,1),start=f-dow(f)*DAY,dim=new Date(Date.UTC(y,m+1,0)).getUTCDate(),wk=Math.ceil((dow(f)+dim)/7);let rows='';
  for(let w=0;w<wk;w++){rows+='<tr>';for(let i=0;i<7;i++){const t=start+(w*7+i)*DAY,d=new Date(t),out=d.getUTCMonth()!==m,L=lit(t),ev=out?[]:(R.oc[iso(t)]||[]),big=L.cel&&(L.cel.r==='S'||L.cel.r==='F');
   rows+=`<td class="${out?'out':''}" style="border-bottom:4px solid ${LHEX[L.c]}"><b class="${i?'':'dom'}">${d.getUTCDate()}</b>${big&&!out?`<i>${e2(short(L.cel.n))}</i>`:''}${ev.map(e=>`<span style="border-color:${col(e)}">${e.all||!e.start?'':e2(e.start)+' '}${e2(e.title)}</span>`).join('')}</td>`}rows+='</tr>'}
  body+=`<section class="mes"><h2>${cap(MES[m])} ${y} <small>Ano ${lit(Date.UTC(y,m,15)).ano}</small></h2><table><thead><tr>${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></section>`}
 if(l){let h='';for(let t=R.from;t<=R.to;t+=DAY){const ev=R.oc[iso(t)]||[],L=lit(t),big=L.cel&&(L.cel.r==='S'||L.cel.r==='F');if(!ev.length&&!big)continue;const d=new Date(t);
  h+=`<div class="dia" style="border-left:5px solid ${LHEX[L.c]}"><h3>${cap(SEM[d.getUTCDay()])}, ${d.getUTCDate()} de ${MES[d.getUTCMonth()]} de ${d.getUTCFullYear()}</h3><p class="lit">${e2(L.cel?L.cel.n+(RK[L.cel.r]?' ('+RK[L.cel.r]+')':''):(L.w||L.s))} · ${LC[L.c].n}</p>${ev.map(e=>`<p class="ev" style="border-color:${col(e)}"><b>${e.all||!e.start?'dia todo':e2(e.start)+(e.end?'–'+e2(e.end):'')}</b> ${e2(e.title)} <small>${e2([e.tipo,ag(e.ag)?.name,e.local].filter(Boolean).join(' · '))}</small>${e.notes?`<br><small>${e2(e.notes)}</small>`:''}</p>`).join('')}</div>`}
  body+=`<section class="lista"><h2>Eventos · ${rangeLabel(R)}</h2>${h||'<p>Nenhum evento no período.</p>'}</section>`}
 const leg=legend().map(a2=>`<span><i style="background:${a2.color}"></i>${e2(a2.name)}</span>`).join('')+Object.entries(LC).map(([k,c])=>`<span><i class="f" style="background:${LHEX[k]}"></i>${c.n}</span>`).join('');
 return`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Agenda Pastoral · ${rangeLabel(R)}</title><style>
body{font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1b1a17;margin:0;padding:24px;background:#fff}h1{font:600 28px Georgia,serif;margin:0 0 4px}h2{font:600 22px Georgia,serif;margin:28px 0 10px}h2 small{font:500 13px system-ui;color:#6c6860}
.leg{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13px;color:#444;margin:8px 0 0}.leg i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px}.leg i.f{width:16px;height:5px;border-radius:2px}
table{width:100%;border-collapse:collapse;table-layout:fixed}th{font-size:12px;color:#6c6860;padding:4px}td{vertical-align:top;border:1px solid #e3ded4;height:92px;padding:4px;font-size:11px}td.out{background:#f7f5f0;color:#b5b0a6}td b{display:block;font-size:13px}td b.dom{color:#8a1c3b}td i{display:block;color:#8a1c3b;font-size:10px;margin-bottom:2px}
td span{display:block;border-left:3px solid;padding-left:3px;margin-top:2px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.dia{padding:6px 0 8px 12px;margin:10px 0;break-inside:avoid}.dia h3{margin:0;font-size:16px}.lit{margin:2px 0 6px;color:#6c6860;font-size:13px}.ev{margin:4px 0;border-left:3px solid;padding-left:8px}.ev small{color:#6c6860}
.mes{break-after:page}@media(max-width:700px){td{height:60px;font-size:9px}body{padding:12px}}@page{size:A4 landscape;margin:12mm}
</style></head><body><h1>Agenda Pastoral</h1><p style="margin:0;color:#6c6860">${rangeLabel(R)}</p><div class="leg">${leg}</div>${body}
<p style="color:#6c6860;font-size:12px;margin-top:24px">Tempos e solenidades calculados pelas normas gerais e da CNBB; confira o Diretório Litúrgico da diocese. Gerado em ${new Date().toLocaleDateString('pt-BR')}.</p></body></html>`}
$('#exp').onclick=openExp;
