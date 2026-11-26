import os,tempfile
D=os.path.dirname(os.path.abspath(__file__))
SITE=os.path.join(D,'..','agenda-pastoral','index.html')
p=open(os.path.join(tempfile.gettempdir(),'agenda-pub.html')).read()
og=('<meta property="og:type" content="website">\n<meta property="og:site_name" content="cifrAmem">\n<meta property="og:title" content="Agenda da Pastoral Familiar">\n'
 '<meta property="og:description" content="Tempos litúrgicos, eventos e presença das pastorais em um só calendário. Regional Leste 1.">\n'
 '<meta property="og:url" content="https://www.ciframem.com.br/agenda-pastoral/">\n<meta property="og:image" content="https://www.ciframem.com.br/agenda-pastoral/og.jpg?v=2">\n'
 '<meta property="og:image:type" content="image/jpeg">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:image:alt" content="Agenda Pastoral – Pastoral Familiar, Regional Leste 1">\n<meta property="og:locale" content="pt_BR">\n'
 '<meta name="twitter:card" content="summary_large_image">\n')
head='<link rel="icon" type="image/png" href="icon-192.png">\n<link rel="apple-touch-icon" href="icon-192.png">\n<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#8a1c3b">\n<link rel="canonical" href="https://www.ciframem.com.br/agenda-pastoral/">\n<meta name="description" content="Agenda Pastoral do cifrAmem: calendário litúrgico com os eventos de cada pastoral, por cor e nível.">\n'
p=p.replace('<title>Agenda Pastoral Familiar</title>','<title>Agenda da Pastoral Familiar</title>\n'+og+head)
p=p.replace('<span><b>Agenda Pastoral</b> · calendário litúrgico e das pastorais</span>','<span style="display:inline-flex;align-items:center;gap:.75rem"><a href="https://www.cnpf.org.br/" target="_blank" rel="noopener" title="Site da Pastoral Familiar (CNPF)" style="display:inline-flex"><img src="icon-192.png" alt="Pastoral Familiar — abrir o site nacional" width="84" height="84" style="width:clamp(60px,8vw,84px);height:auto;border-radius:50%"></a><span style="font-size:1.15rem;line-height:1.25"><b>Agenda</b><br>Pastoral Familiar</span></span>')
tail='''<!-- Contagem de acessos anônima (GoatCounter, sem cookies): painel em https://ciframem.goatcounter.com -->
<script data-goatcounter="https://ciframem.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
<script>if('serviceWorker' in navigator&&location.protocol==='https:'){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}</script>
</body></html>'''
assert p.rstrip().endswith('</body></html>') and 'Pastoral Familiar</span>' in p
p=p.rstrip()[:-len('</body></html>')]+tail+'\n'
# ajustes finais do site publicado
assert p.count('<script>{')>=1
p=p.replace('<script>{','<script src="firebase-config.js"></script>\n<script>{',1)
p=p.replace('content="Agenda Pastoral do cifrAmem: calendário litúrgico com os eventos de cada pastoral, por cor e nível."','content="Tempos litúrgicos, eventos e presença das pastorais em um só calendário. Pastoral Familiar · Regional Leste 1."')
open(SITE,'w').write(p)
