#!/bin/bash
# gera pub.html carimbado, monta o site, sobe versão do sw e publica no GitHub
set -e
cd /home/claude/agenda
V=$(python3 stamp.py | awk '{print $NF}')
python3 build_site.py
cd /home/claude/ciframem
python3 - <<'P'
p=open('/home/claude/ciframem/agenda-pastoral/index.html').read()
p=p.replace('<script>{','<script src="firebase-config.js"></script>\n<script>{',1)
p=p.replace('content="Agenda Pastoral do cifrAmem: calendário litúrgico com os eventos de cada pastoral, por cor e nível."','content="Tempos litúrgicos, eventos e presença das pastorais em um só calendário. Pastoral Familiar · Regional Leste 1."')
open('/home/claude/ciframem/agenda-pastoral/index.html','w').write(p)
P
sed -i "s/agenda-pastoral-v[0-9]*/agenda-pastoral-v$V/" agenda-pastoral/sw.js
git add -A && git commit -q -m "Agenda Pastoral: $1 (versão $V)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KDeydP2Jk1SbPKTZ2ULVGF" && git -c push.negotiate=true push origin HEAD 2>&1 | tail -1
grep -o "var APPV='[^']*'" /home/claude/ciframem/agenda-pastoral/index.html
