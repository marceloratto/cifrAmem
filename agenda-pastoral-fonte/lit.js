const DAY=864e5,U=(y,m,d)=>Date.UTC(y,m-1,d),iso=t=>new Date(t).toISOString().slice(0,10),parse=s=>{const[a,b,c]=s.split('-').map(Number);return U(a,b,c)},dow=t=>new Date(t).getUTCDay(),nextSun=t=>t+((7-dow(t))%7)*DAY;
const MES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'],SEM=['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
const LC={w:{n:'Branco',v:'var(--lw)'},v:{n:'Roxo',v:'var(--lv)'},g:{n:'Verde',v:'var(--lg)'},r:{n:'Vermelho',v:'var(--lr)'},p:{n:'Rosa',v:'var(--lp)'}};
const RK={S:'Solenidade',F:'Festa',M:'Memória'};
function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),x=h+l-7*m+114;return U(y,Math.floor(x/31),x%31+1)}
const YC={};
function ly(y){
  if(YC[y])return YC[y];
  const E=easter(y),ash=E-46*DAY,pent=E+49*DAY,x25=U(y,12,25),adv1=(dow(x25)?x25-dow(x25)*DAY:x25-7*DAY)-21*DAY,
    epi=nextSun(U(y,1,2)),bapt=new Date(epi).getUTCDate()>=7?epi+DAY:epi+7*DAY,baptSun=dow(bapt)?bapt-DAY:bapt,m=new Map(),
    A=(t,n,c,r)=>m.set(iso(t),{n,c,r});
  A(U(y,2,2),'Apresentação do Senhor','w','F');
  let j=U(y,3,19);if(j>=E-7*DAY&&j<=E+7*DAY)j=E-8*DAY;else if(!dow(j))j+=DAY;A(j,'São José, esposo da Virgem Maria','w','S');
  let an=U(y,3,25);if(an>=E-7*DAY&&an<=E+7*DAY)an=E+8*DAY;else if(!dow(an))an+=DAY;A(an,'Anunciação do Senhor','w','S');
  A(U(y,6,24),'Natividade de São João Batista','w','S');
  A(nextSun(U(y,6,29)),'São Pedro e São Paulo, apóstolos','r','S');
  A(U(y,8,6),'Transfiguração do Senhor','w','F');
  A(nextSun(U(y,8,15)),'Assunção de Nossa Senhora','w','S');
  A(U(y,9,14),'Exaltação da Santa Cruz','r','F');
  A(U(y,10,12),'Nossa Senhora da Conceição Aparecida, Padroeira do Brasil','w','S');
  const n1=U(y,11,1);A(dow(n1)===6?n1:nextSun(n1),'Todos os Santos','w','S');
  A(U(y,11,2),'Comemoração dos Fiéis Defuntos (Finados)','v','S');
  let im=U(y,12,8);if(!dow(im))im+=DAY;A(im,'Imaculada Conceição de Nossa Senhora','w','S');
  A(U(y,1,1),'Santa Maria, Mãe de Deus','w','S');A(epi,'Epifania do Senhor','w','S');A(bapt,'Batismo do Senhor','w','F');
  let sf=nextSun(U(y,12,26));if(sf>U(y,12,31))sf=U(y,12,30);A(sf,'Sagrada Família de Jesus, Maria e José','w','F');
  A(x25,'Natal do Senhor','w','S');
  A(E+69*DAY,'Imaculado Coração de Maria','w','M');
  A(E+68*DAY,'Sagrado Coração de Jesus','w','S');
  A(ash,'Quarta-feira de Cinzas · abertura da Campanha da Fraternidade','v','');
  A(ash+25*DAY,'4º Domingo da Quaresma (Laetare)','p','');
  A(adv1+14*DAY,'3º Domingo do Advento (Gaudete)','p','');
  A(E-7*DAY,'Domingo de Ramos e da Paixão do Senhor','r','');
  A(E-3*DAY,'Quinta-feira Santa · Missa da Ceia do Senhor','w','');
  A(E-2*DAY,'Sexta-feira Santa · Paixão do Senhor','r','');
  A(E-DAY,'Sábado Santo · Vigília Pascal','w','');
  A(E,'Páscoa da Ressurreição do Senhor','w','S');
  A(E+7*DAY,'2º Domingo da Páscoa · da Divina Misericórdia','w','');
  A(E+42*DAY,'Ascensão do Senhor','w','S');
  A(pent,'Pentecostes','r','S');
  A(pent+7*DAY,'Santíssima Trindade','w','S');
  A(E+60*DAY,'Corpus Christi · Santíssimo Corpo e Sangue de Cristo','w','S');
  A(adv1-7*DAY,'Nosso Senhor Jesus Cristo, Rei do Universo','w','S');
  return YC[y]={E,ash,pent,adv1,bapt,baptSun,m};
}
function lit(t){
  const y=new Date(t).getUTCFullYear(),Y=ly(y),sun=!dow(t),W=(n,x)=>sun?`${n}º Domingo ${x}`:`${n}ª Semana ${x}`;
  let s,c,w='';
  if(t<=Y.bapt){s='Tempo do Natal';c='w'}
  else if(t<Y.ash){s='Tempo Comum';c='g';w=W(Math.floor((t-Y.baptSun)/DAY/7)+1,'do Tempo Comum')}
  else if(t<Y.E-3*DAY){s='Quaresma';c='v';const f=Y.ash+4*DAY;w=t<f?'Após as Cinzas':t>=Y.E-7*DAY?'Semana Santa':W(Math.floor((t-f)/DAY/7)+1,'da Quaresma')}
  else if(t<Y.E){s='Tríduo Pascal';c='w'}
  else if(t<=Y.pent){s='Tempo Pascal';c='w';w=t>Y.E&&t<Y.E+7*DAY?'Oitava da Páscoa':W(Math.floor((t-Y.E)/DAY/7)+1,'da Páscoa')}
  else if(t<Y.adv1){s='Tempo Comum';c='g';const cr=Y.adv1-7*DAY,ps=t-dow(t)*DAY;w=W(34-Math.round((cr-ps)/DAY/7),'do Tempo Comum')}
  else if(t<U(y,12,25)){s='Advento';c='v';w=W(Math.floor((t-Y.adv1)/DAY/7)+1,'do Advento')}
  else{s='Tempo do Natal';c='w'}
  const cel=Y.m.get(iso(t));if(cel){c=cel.c;if(sun&&cel.r)w=''}
  return{s,c,w,cel,ano:['C','A','B'][(t>=Y.adv1?y+1:y)%3]};
}
