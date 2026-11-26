#!/bin/bash
# Publica a Agenda Pastoral: carimba a versão, monta o site, sobe a versão do sw e envia ao GitHub.
# Uso: ./release.sh "o que mudou"   (funciona de qualquer pasta; os caminhos são relativos a este arquivo)
set -e
D="$(cd "$(dirname "$0")" && pwd)"; R="$(cd "$D/.." && pwd)"
node -e "const s=require('fs').readFileSync('$D/index.html','utf8');const i=s.indexOf('<script>{'),j=s.lastIndexOf('</script>');new Function(s.slice(i+8,j))" 2>/dev/null || { echo "ERRO de sintaxe no index.html: nada foi publicado."; exit 1; }
V=$(python3 "$D/stamp.py" | awk '{print $NF}')
python3 "$D/build_site.py"
sed -i "s/agenda-pastoral-v[0-9]*/agenda-pastoral-v$V/" "$R/agenda-pastoral/sw.js"
cd "$R"
git add -A agenda-pastoral agenda-pastoral-fonte
git commit -q -F - <<MSG
Agenda Pastoral: $1 (versão $V)
${AGP_TRAILER:+
$AGP_TRAILER}
MSG
git -c push.negotiate=true push origin HEAD 2>&1 | tail -1
grep -o "var APPV='[^']*'" "$R/agenda-pastoral/index.html"
