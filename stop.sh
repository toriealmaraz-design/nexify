#!/usr/bin/env bash
# =============================================================================
# Nexify — Stop Script
# Kills backend (port 5000) and frontend (port 5173) processes.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
log_ok()  { echo -e "${GREEN}[OK]${NC}   $*"; }
log_err() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
log_info(){ echo -e "[INFO] $*"; }

stop_pid_file() {
  local pidfile="$1"
  local port="$2"
  local path="$SCRIPT_DIR/$pidfile"

  if [ -f "$path" ]; then
    local pid
    pid=$(cat "$path")
    if kill -0 "$pid" 2>/dev/null; then
      log_info "Stopping PID $pid..."
      kill -TERM "$pid" 2>/dev/null || true
      sleep 1
      kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$path"
  fi
}

# Stop via pid files first
stop_pid_file ".backend.pid" 5000
stop_pid_file ".frontend.pid" 5173

# Fallback: kill anything on those ports
for port in 5000 5173; do
  if command -v lsof &>/dev/null; then
    local pids
    pids=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
      log_info "Killing process(es) on port $port: $pids"
      echo "$pids" | xargs kill -TERM 2>/dev/null || true
      sleep 1
      # force if still alive
      pids=$(lsof -ti :$port 2>/dev/null || true)
      [ -n "$pids" ] && echo "$pids" | xargs kill -9 2>/dev/null || true
    fi
  elif command -v fuser &>/dev/null; then
    if fuser $port/tcp &>/dev/null; then
      log_info "Killing process on port $port"
      fuser -k $port/tcp 2>/dev/null || true
    fi
  fi
done

# Verify
for port in 5000 5173; do
  if command -v ss &>/dev/null; then
    if ss -tlnp 2>/dev/null | grep -q ":$port "; then
      log_err "Port $port still in use after cleanup."
      ss -tlnp 2>/dev/null | grep ":$port "
    fi
  fi
done

log_ok "Nexify services stopped."
