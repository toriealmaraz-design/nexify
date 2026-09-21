#!/usr/bin/env bash
# =============================================================================
# Nexify — Start Script (Pop!_OS / Linux)
# =============================================================================
# Starts both the backend (Express + Prisma + SQLite, port 5000)
# and frontend (React + Vite, port 5173) in separate terminals.
#
# Prerequisites:
#   1. Node.js >= 18 installed and on PATH
#   2. Both backend/ and frontend/ have had `npm install` run
#   3. backend/.env is configured (JWT_SECRET, DATABASE_URL, etc.)
#   4. Database exists: run `cd backend && npx prisma db push && npx prisma db seed`
#
# Usage:
#   chmod +x start.sh
#   ./start.sh          # interactive popups (default)
#   ./start.sh term     # open terminals via gnome-terminal (if available)
#   ./start.sh nohup    # run both in backgrounded terminals, no popup
#
# Stop:
#   ./stop.sh           # kills both processes
#
# Check:
#   ./status.sh         # prints health of both services
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ── Helpers ──────────────────────────────────────────────────────────────────
log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_err()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ── Checks ───────────────────────────────────────────────────────────────────
check_node() {
  if ! command -v node &>/dev/null; then
    log_err "Node.js is not installed or not on PATH."
    log_err "Install it: https://nodejs.org or `sudo apt install nodejs npm`"
    exit 1
  fi
  local node_version
  node_version=$(node --version)
  log_ok "Node.js $node_version found"
}

check_dir() {
  if [ ! -d "$1" ]; then
    log_err "Directory not found: $1"
    exit 1
  fi
}

check_deps_installed() {
  local pkg_json="$1/package.json"
  local node_modules="$1/node_modules"
  local pkg_name
  pkg_name=$(basename "$1")

  if [ ! -f "$pkg_json" ]; then
    log_err "$pkg_json not found. Did you extract the project correctly?"
    exit 1
  fi

  if [ ! -d "$node_modules" ] || [ -z "$(ls -A "$node_modules" 2>/dev/null)" ]; then
    log_warn "$pkg_name dependencies not installed. Running npm install..."
    (cd "$1" && npm install) || {
      log_err "npm install failed in $pkg_name. Check the error above."
      exit 1
    }
    log_ok "$pkg_name dependencies installed"
  else
    log_ok "$pkg_name dependencies already installed"
  fi
}

check_port() {
  local port=$1
  if command -v ss &>/dev/null; then
    if ss -tlnp 2>/dev/null | grep -q ":$port "; then
      return 0  # port is in use
    fi
  elif command -v lsof &>/dev/null; then
    if lsof -i :$port &>/dev/null; then
      return 0
    fi
  fi
  return 1  # port is free
}

# ── Launch strategies ────────────────────────────────────────────────────────

launch_backend() {
  log_info "Starting backend on http://localhost:5000 ..."

  if check_port 5000; then
    log_warn "Port 5000 is already in use — another backend may be running."
    log_warn "Run ./stop.sh first, or use a different PORT in backend/.env"
  fi

  if [ "$LAUNCH_MODE" = "nohup" ]; then
    # Run in background, logging to file
    log_info "Starting backend in background (logs → backend.log)"
    (cd "$BACKEND_DIR" && npm run dev > backend.log 2>&1 & echo $! > "$SCRIPT_DIR/.backend.pid")
    log_ok "Backend started (logs → $SCRIPT_DIR/backend.log)"
    sleep 3
    return
  fi

  if [ "$LAUNCH_MODE" = "term" ]; then
    # Try to open a new terminal window. Fall back to nohup.
    if command -v gnome-terminal &>/dev/null; then
      gnome-terminal -- bash -c "cd '$BACKEND_DIR' && npm run dev; exec bash" &
      log_ok "Backend launched in new terminal tab"
      return
    elif command -v konsole &>/dev/null; then
      konsole --hold -e "cd '$BACKEND_DIR' && npm run dev" &
      log_ok "Backend launched in new terminal tab"
      return
    elif command -v terminator &>/dev/null; then
      terminator -e "cd '$BACKEND_DIR' && npm run dev" &
      log_ok "Backend launched in new terminal tab"
      return
    else
      log_warn "No supported terminal emulator found. Falling back to background."
      LAUNCH_MODE="nohup"
      launch_backend
      return
    fi
  fi

  # Default: interactive — run in a foreground child process.
  # The parent script waits here until the user Ctrl-C's.
  log_info "Backend running in foreground (Ctrl-C to stop)."
  log_info "Frontend will start in a separate process below."
  (cd "$BACKEND_DIR" && npm run dev)
}

launch_frontend() {
  log_info "Starting frontend on http://localhost:5173 ..."

  if check_port 5173; then
    log_warn "Port 5173 is already in use — another Vite dev server may be running."
  fi

  if [ "$LAUNCH_MODE" = "nohup" ]; then
    log_info "Starting frontend in background (logs → frontend.log)"
    (cd "$FRONTEND_DIR" && npm run dev > frontend.log 2>&1 & echo $! > "$SCRIPT_DIR/.frontend.pid")
    log_ok "Frontend started (logs → $SCRIPT_DIR/frontend.log)"
    return
  fi

  if [ "$LAUNCH_MODE" = "term" ]; then
    if command -v gnome-terminal &>/dev/null; then
      gnome-terminal -- bash -c "cd '$FRONTEND_DIR' && npm run dev; exec bash" &
      log_ok "Frontend launched in new terminal tab"
      return
    fi
    log_warn "No terminal emulator. Falling back to background."
    LAUNCH_MODE="nohup"
    launch_frontend
    return
  fi

  (cd "$FRONTEND_DIR" && npm run dev)
}

# ── Stop / Status helpers ────────────────────────────────────────────────────

stop_services() {
  log_info "Stopping Nexify services..."

  stop_pid_file ".backend.pid" 5000
  stop_pid_file ".frontend.pid" 5173

  # Fallback: kill anything listening on those ports
  for port in 5000 5173; do
    if check_port $port; then
      log_warn "Port $port still in use — trying to kill process..."
      if command -v lsof &>/dev/null; then
        local pids
        pids=$(lsof -ti :$port 2>/dev/null || true)
        if [ -n "$pids" ]; then
          echo "$pids" | xargs kill -TERM 2>/dev/null || true
          sleep 1
        fi
      fi
    fi
  done

  # Remove stale pid files
  rm -f "$SCRIPT_DIR/.backend.pid" "$SCRIPT_DIR/.frontend.pid"

  log_ok "Services stopped."
}

stop_pid_file() {
  local pidfile="$1"
  local port="$2"
  local pidfile_path="$SCRIPT_DIR/$pidfile"

  if [ -f "$pidfile_path" ]; then
    local pid
    pid=$(cat "$pidfile_path")
    if kill -0 "$pid" 2>/dev/null; then
      log_info "Stopping process $pid (from $pidfile)..."
      kill -TERM "$pid" 2>/dev/null || true
      sleep 1
      # Force kill if still alive
      if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null || true
      fi
    fi
    rm -f "$pidfile_path"
  fi
}

show_status() {
  echo ""
  echo "╔══════════════════════════════════════════════╗"
  echo "║         Nexify Platform — Status              ║"
  echo "╚══════════════════════════════════════════════╝"
  echo ""

  # Backend
  if check_port 5000; then
    log_ok "Backend:  http://localhost:5000  (running)"
    if command -v curl &>/dev/null; then
      local health
      health=$(curl -s --max-time 3 http://localhost:5000/health 2>/dev/null || echo "unreachable")
      if echo "$health" | grep -q '"success":true'; then
        echo "         Health: OK"
      else
        echo "         Health: $health"
      fi
    fi
  else
    log_err "Backend:  http://localhost:5000  (not running)"
  fi

  # Frontend
  if check_port 5173; then
    log_ok "Frontend: http://localhost:5173  (running)"
  else
    log_err "Frontend: http://localhost:5173  (not running)"
  fi

  echo ""
  echo "Quick checks:"
  echo "  ./status.sh   — this screen"
  echo "  ./start.sh    — start both"
  echo "  ./stop.sh     — stop both"
  echo ""
}

# ── Main ─────────────────────────────────────────────────────────────────────

LAUNCH_MODE="${1:-interactive}"

case "$LAUNCH_MODE" in
  term|nohup|interactive) ;;
  stop)   stop_services; exit 0 ;;
  status) show_status; exit 0 ;;
  restart)
    stop_services
    sleep 2
    LAUNCH_MODE="interactive"
    ;;
  --help|-h)
    echo "Nexify Start Script — Pop!_OS / Linux"
    echo ""
    echo "Usage: ./start.sh [MODE]"
    echo ""
    echo "Modes:"
    echo "  interactive (default) — starts backend in foreground, frontend waits"
    echo "  term                  — opens new terminal tabs (gnome/konsole/terminator)"
    echo "  nohup                 — starts both in background, logs to .log files"
    echo "  stop                  — stop both services"
    echo "  status                — show running status"
    echo "  restart               — stop then start"
    echo ""
    echo "Prerequisites:"
    echo "  - Node.js >= 18"
    echo "  - backend/.env configured"
    echo "  - Run once: cd backend && npx prisma db push && npx prisma db seed"
    exit 0
    ;;
  *)
    log_err "Unknown mode: $LAUNCH_MODE"
    echo "Run ./start.sh --help for usage."
    exit 1
    ;;
esac

# ── Run ──────────────────────────────────────────────────────────────────────

check_node
check_dir "$BACKEND_DIR"
check_dir "$FRONTEND_DIR"
check_deps_installed "$BACKEND_DIR"
check_deps_installed "$FRONTEND_DIR"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        Nexify Platform — Starting Up         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
log_info "Backend:  $BACKEND_DIR"
log_info "Frontend: $FRONTEND_DIR"
echo ""

# When launching in interactive mode, we start backend in the background
# so we can then foreground the frontend. The user sees frontend logs and
# can Ctrl-C to stop frontend; we trap that and stop backend too.
if [ "$LAUNCH_MODE" = "interactive" ]; then
  log_info "Starting backend in background..."
  (cd "$BACKEND_DIR" && npm run dev > backend.log 2>&1 & echo $! > "$SCRIPT_DIR/.backend.pid")
  log_ok "Backend started (logs → backend.log)"

  sleep 4

  # Quick health check
  if check_port 5000; then
    log_ok "Backend is up on port 5000"
  else
    log_warn "Backend may still be starting up (port 5000 not yet open)"
  fi

  log_info ""
  log_info "Starting frontend..."
  log_info "Frontend running in foreground — Ctrl-C stops both."
  echo ""

  # Trap Ctrl-C to stop backend when frontend exits
  cleanup() {
    log_info ""
    log_info "Shutting down..."
    stop_pid_file ".backend.pid" 5000
    exit 0
  }
  trap cleanup SIGINT SIGTERM

  (cd "$FRONTEND_DIR" && npm run dev)
  cleanup
else
  launch_backend
  launch_frontend

  # For nohup/term modes, give a status summary and exit
  sleep 3
  show_status
fi
