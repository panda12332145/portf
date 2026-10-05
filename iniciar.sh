#!/usr/bin/env bash
# ====================================================================
#  iniciar.sh — liga o site localmente e deixa no ar para testes
#  (equivalente Linux/macOS/WSL do iniciar.bat)
#
#  Uso:
#    ./iniciar.sh                 -> desenvolvimento, porta 3000
#    ./iniciar.sh 4000            -> desenvolvimento, porta 4000
#    ./iniciar.sh prod            -> build de produção + servidor
#    ./iniciar.sh 4000 prod       -> idem, na porta 4000
#    ./iniciar.sh noopen          -> não abre o navegador
#
#  Ctrl+C encerra o servidor.
# ====================================================================
set -uo pipefail
cd "$(dirname "$0")"

PORT=3000
MODE=dev
OPEN=1

for arg in "$@"; do
  case "$arg" in
    prod|--prod) MODE=prod ;;
    noopen|--noopen) OPEN=0 ;;
    *[!0-9]*) echo "[X] argumento não reconhecido: $arg"; exit 1 ;;
    *) PORT="$arg" ;;
  esac
done

echo
echo "============================================================"
echo "   ATELIER GIRASSOL — portfólio de arte + livro 3D"
echo "============================================================"
echo

[ -f package.json ] || { echo "[X] rode este script na raiz do projeto"; exit 1; }

# ---------------------------- Node.js -------------------------------
command -v node >/dev/null 2>&1 || {
  echo "[X] Node.js não encontrado. Instale a versão 22+: https://nodejs.org"
  exit 1
}
NODE_MAJOR="$(node -v | sed 's/^v\([0-9]*\).*/\1/')"
if [ "${NODE_MAJOR:-0}" -lt 22 ]; then
  echo "[X] Node $(node -v) encontrado, mas o projeto exige Node 22+ (better-sqlite3)."
  echo "    Instale a LTS: https://nodejs.org"
  exit 1
fi
echo "[1/4] Node $(node -v) OK"

# --------------------------- dependências ---------------------------
if [ ! -f node_modules/next/package.json ]; then
  echo "[2/4] Instalando dependências (primeira vez, pode demorar)…"
  npm install || { echo "[X] falha no npm install"; exit 1; }
else
  echo "[2/4] Dependências OK"
fi

# ------------------------------ banco -------------------------------
echo "[3/4] Sincronizando o banco SQLite (data/atelier.sqlite)…"
npm run db:build || { echo "[X] falha ao preparar o banco"; exit 1; }

# --------------------------- endereço de rede ------------------------
# primeiro IPv4 que não seja link-local (169.254.x) nem loopback
LANIP="$(hostname -I 2>/dev/null | tr ' ' '\n' | grep -vE '^(169\.254\.|127\.)' | head -n1)"
[ -z "${LANIP:-}" ] && LANIP="$(ipconfig getifaddr en0 2>/dev/null || true)"
[ -z "${LANIP:-}" ] && LANIP="$(ipconfig getifaddr en1 2>/dev/null || true)"

echo "[4/4] Subindo o servidor (modo $MODE, porta $PORT)…"
echo
echo "  ------------------------------------------------------------"
echo "   Site ......... http://localhost:$PORT"
echo "   Estúdio ...... http://localhost:$PORT/estudio"
echo "   Galeria ...... http://localhost:$PORT/galeria"
echo "   API .......... http://localhost:$PORT/api/health"
[ -n "${LANIP:-}" ] && echo "   No celular ... http://$LANIP:$PORT   (mesma rede Wi-Fi)"
echo "  ------------------------------------------------------------"
echo
echo "   Ctrl+C encerra o servidor."
echo

# ------- abre o navegador assim que o site responder (em segundo plano) -------
if [ "$OPEN" = "1" ]; then
  (
    for _ in $(seq 1 120); do
      if command -v curl >/dev/null 2>&1; then
        code="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT" || true)"
        [ "$code" = "200" ] && break
      elif command -v wget >/dev/null 2>&1; then
        wget -q -O /dev/null "http://localhost:$PORT" && break
      else
        break
      fi
      sleep 0.8
    done
    url="http://localhost:$PORT"
    if command -v xdg-open >/dev/null 2>&1; then xdg-open "$url" >/dev/null 2>&1
    elif command -v open >/dev/null 2>&1; then open "$url" >/dev/null 2>&1
    fi
  ) &
fi

# ------------------------------ servidor ----------------------------
if [ "$MODE" = "prod" ]; then
  echo "Compilando a versão de produção (pode levar 1–3 minutos)…"
  npm run build || { echo "[X] falha no build"; exit 1; }
  exec npm run start:lan -- -p "$PORT"
else
  exec npm run dev:lan -- -p "$PORT"
fi
