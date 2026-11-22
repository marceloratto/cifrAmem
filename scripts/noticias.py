#!/usr/bin/env python3
"""Junta as manchetes das fontes católicas em agenda-pastoral/noticias.json (só título, resumo curto, imagem e link)."""
import json, re, html, sys, urllib.request, email.utils, datetime as dt
import xml.etree.ElementTree as ET

FONTES = [
    ("Diocese de Petrópolis", "local", "https://diocesepetropolis.com.br/feed/"),
    ("Regional Leste 1 – CNBB", "regional", "https://cnbbleste1.org.br/feed/"),
    ("Pastoral Familiar – Vida e Família", "nacional", "https://vidaefamilia.org.br/feed/"),
    ("CNBB", "nacional", "https://www.cnbb.org.br/feed/"),
    ("Vatican News", "igreja", "https://www.vaticannews.va/pt.rss.xml"),
]
NS = {"media": "http://search.yahoo.com/mrss/", "content": "http://purl.org/rss/1.0/modules/content/"}
SAIDA = "agenda-pastoral/noticias.json"

def limpa(t, n=180):
    t = re.sub(r"<[^>]+>", " ", t or "")
    t = re.sub(r"\s+", " ", html.unescape(t)).strip()
    t = re.sub(r"\s*(The post|O post) .*$", "", t)
    if len(t) > n:
        t = t[:n].rsplit(" ", 1)[0] + "…"
    return t

def imagem(it):
    for m in it.findall("media:content", NS) + it.findall("media:thumbnail", NS):
        if m.get("url"):
            return m.get("url")
    e = it.find("enclosure")
    if e is not None and (e.get("type") or "").startswith("image"):
        return e.get("url")
    corpo = (it.findtext("content:encoded", "", NS) or "") + (it.findtext("description") or "")
    m = re.search(r'<img[^>]+src="([^"]+)"', corpo)
    return m.group(1) if m else ""

def data(it):
    try:
        return email.utils.parsedate_to_datetime(it.findtext("pubDate")).astimezone(dt.timezone.utc).isoformat()
    except Exception:
        return ""

itens, erros = [], []
for nome, nivel, url in FONTES:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AgendaPastoral/1.0 (+https://www.ciframem.com.br/agenda-pastoral/)"})
        raiz = ET.fromstring(urllib.request.urlopen(req, timeout=30).read())
        for it in raiz.iter("item"):
            tit, link = limpa(it.findtext("title"), 200), (it.findtext("link") or "").strip()
            if not tit or not link:
                continue
            itens.append({"fonte": nome, "nivel": nivel, "titulo": tit, "link": link, "data": data(it),
                          "resumo": limpa(it.findtext("description")), "img": imagem(it)})
    except Exception as e:
        erros.append(f"{nome}: {e}")

if not itens:
    print("Nenhuma notícia obtida:", erros); sys.exit(1)
itens.sort(key=lambda x: x["data"], reverse=True)
# no máximo 12 por fonte, 60 no total
cont, final = {}, []
for x in itens:
    if cont.get(x["fonte"], 0) < 12:
        cont[x["fonte"]] = cont.get(x["fonte"], 0) + 1; final.append(x)
final = final[:60]
novo = {"fontes": [f[0] for f in FONTES], "itens": final}
try:
    velho = json.load(open(SAIDA, encoding="utf-8"))
    if velho.get("itens") == final:
        print("Sem novidades."); sys.exit(0)
except Exception:
    pass
novo["atualizado"] = dt.datetime.now(dt.timezone.utc).isoformat(timespec="minutes")
json.dump(novo, open(SAIDA, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(f"{len(final)} notícias gravadas.", "Erros:" if erros else "", "; ".join(erros))
