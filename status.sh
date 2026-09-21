#!/usr/bin/env bash
# =============================================================================
# Nexify — Status Script
# Shows whether backend (port 5000) and frontend (port 5173) are running.
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
log_ok()  { echo -e "${GREEN}[OK]${NC}   $*"; }
log_err() { echo -e "${RED}[ERROR]${NC} $*"; }

check_port() {
  local port=$1
  if command -v ss &>/dev/null; then
    ss -tlnp 2>/dev/null | grep -q ":$port " && return 0
  fi
  if command -v lsof &>/dev/null; then
    lsof -i :$port &>/dev/null && return 0
  fi
  return 1
}

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║         Nexify Platform — Status             ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Backend
if check_port 5000; then
  log_ok "Backend:  http://localhost:5000  ✓ running"
  if command -v curl &>/dev/null; then
    health=$(curl -s --max-time 3 http://localhost:5000/health 2>/dev/null || echo "unreachable")
    if echo "$health" | grep -q '"success"'; then
      echo "         Health check: OK"
      echo "         $health" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'         Status: {d.get(\"status\",\"?\")} | Timestamp: {d.get(\"timestamp\",\"?\")}')" 2>/dev/null || true
    else
      echo "         Health check: $health"
    fi
  fi
else
  log_err "Backend:  http://localhost:5000  ✗ not running"
  echo "         Start with: ./start.sh"
fi

echo ""

# Frontend
if check_port 5173; then
  log_ok "Frontend: http://localhost:5173  ✓ running"
  if command -v curl &>/dev/null; then
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:5173 2>/dev/null || echo "000")
    echo "         HTTP status: $http_code"
    [ "$http_code" = "200" ] && echo "         Accessible: yes" || echo "         Accessible: no"
  fi
else
  log_err "Frontend: http://localhost:5173  ✗ not running"
  echo "         Start with: ./start.sh"
fi

echo ""
echo "Database: ~/nexify/backend/prisma/dev.db"
echo "Logs:     ~/nexify/backend.log / frontend.log (if using nohup mode)"
echo ""
