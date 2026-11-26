# carimba a versão: número sequencial + data/hora (Brasília)
import datetime,os
f='/home/claude/agenda/VERSION';n=int(open(f).read()) if os.path.exists(f) else 27
n+=1;open(f,'w').write(str(n))
now=datetime.datetime.utcnow()-datetime.timedelta(hours=3)
v=f"{n} · {now:%d/%m/%Y %H:%M}"
src=open('/home/claude/agenda/index.html').read()
open('/home/claude/agenda/pub.html','w').write(src.replace("var APPV='__V__';",f"var APPV='{v}';"))
print(v,n)
