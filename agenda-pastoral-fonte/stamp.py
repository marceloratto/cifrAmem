# carimba a versão: número sequencial + data/hora (Brasília)
import datetime,os,tempfile
D=os.path.dirname(os.path.abspath(__file__))
PUB=os.path.join(tempfile.gettempdir(),'agenda-pub.html')
f=os.path.join(D,'VERSION');n=int(open(f).read()) if os.path.exists(f) else 27
n+=1;open(f,'w').write(str(n))
now=datetime.datetime.utcnow()-datetime.timedelta(hours=3)
v=f"{n} · {now:%d/%m/%Y %H:%M}"
src=open(os.path.join(D,'index.html')).read()
open(PUB,'w').write(src.replace("var APPV='__V__';",f"var APPV='{v}';"))
print(v,n)
