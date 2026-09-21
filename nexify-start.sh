#!/usr/bin/env bash
#
#  nexify-start.sh
#  Starts the Nexify backend (Express + Prisma, port 5000)
#  and frontend (React + Vite, port 5173) on Pop!_OS.
#
#  Usage:
#    ./nexify-start.sh          # starts both, attaches to tmux session
#    ./nexify-start.sh detach   # starts both, leaves tmux running in background
#    ./nexify-start.sh stop     # kills the tmux session + both servers
#    ./nexify-start.sh status   # shows whether ports 5000 & 5173 are listening
#

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
BACKEND_DIR="${BACKEND_DIR:-$(pwd)/backend}"
FRONTEND_DIR="${FRONTEND_DIR:-$(pwd)/frontend}"
BACKEND_PORT=5000
FRONTEND_PORT=5173
TMUX_SESSION="nexify"

# ── Helpers ──────────────────────────────────────────────────────────────────
log()   { echo -e "\033[1;34m[nexify]\033[0m  $*"; }
ok()    { echo -e "\033[1;32m[ok]\033[0m     $*"; }
err()   { echo -e "\033[1;31m[error]\033[0m $*" >&2; }
warn()  { echo -e "\033[1;33m[warn]\033[0m  $*"; }

check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    err "Required command '$1' not found. Install it and try again."
    exit 1
  fi
}

check_port_in_use() {
  # Returns 0 (true) if something is already listening on the given port.
  local port=$1
  if command -v ss &>/dev/null; then
    ss -tlnp 2>/dev/null | grep -q ":${port} " && return 0
  elif command -v lsof &>/dev/null; then
    lsof -i :${port} &>/dev/null && return 0
  fi
  return 1
}

# ── Status ───────────────────────────────────────────────────────────────────
do_status() {
  echo "── Nexify status ──────────────────────────────────────────────────"
  for port in $BACKEND_PORT $FRONTEND_PORT; do
    if check_port_in_use "$port"; then
      ok "Port $port is listening"
    else
      err "Port $port is free (nothing running)"
    fi
  done
  echo ""
  if command -v curl &>/dev/null; then
    log "Backend health:"
    curl -s "http://localhost:${BACKEND_PORT}/health" 2>/dev/null || warn "backend not reachable"
    echo ""
  fi
  exit 0
}

# ── Stop ─────────────────────────────────────────────────────────────────────
do_stop() {
  if tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
    log "Stopping tmux session '$TMUX_SESSION' (backend + frontend)..."
    tmux kill-session -t "$TMUX_SESSION"
    ok "Stopped."
  else
    warn "No tmux session '$TMUX_SESSION' found."
    # Fallback: try to kill anything on the two ports
    for port in $BACKEND_PORT $FRONTEND_PORT; do
      if check_port_in_use "$port"; then
        log "Killing process on port $port..."
        fuser -k "${port}/tcp" 2>/dev/null || true
      fi
    done
    ok "Done."
  fi
  exit 0
}

# ── Start ────────────────────────────────────────────────────────────────────
do_start() {
  # ── Pre-flight checks ────────────────────────────────────────────────────
  check_cmd node
  check_cmd npm

  if [ ! -d "$BACKEND_DIR" ]; then
    err "Backend directory not found: $BACKEND_DIR"
    exit 1
  fi
  if [ ! -d "$FRONTEND_DIR" ]; then
    err "Frontend directory not found: $FRONTEND_DIR"
    exit 1
  fi

  # ── Warn about port conflicts ─────────────────────────────────────────────
  if check_port_in_use "$BACKEND_PORT"; then
    warn "Port $BACKEND_PORT already in use — backend may not start cleanly."
  fi
  if check_port_in_use "$FRONTEND_PORT"; then
    warn "Port $FRONTEND_PORT already in use — frontend may not start cleanly."
  fi

  # ── Decide launch mode ─────────────────────────────────────────────────────
  local detach_mode=false
  if [ "${1:-}" = "detach" ]; then
    detach_mode=true
  fi

  # ── Try tmux first (best experience on Pop!_OS) ───────────────────────────
  if command -v tmux &>/dev/null; then
    log "Using tmux session '$TMUX_SESSION'."

    # Kill any stale session
    tmux kill-session -t "$TMUX_SESSION" 2>/dev/null || true

    # Create a new detached session with two windows
    tmux new-session -d -s "$TMUX_SESSION" -n backend \
      "cd '$BACKEND_DIR' && echo '=== Backend starting on :$BACKEND_PORT ===' && npm run dev"

    tmux new-window -t "$TMUX_SESSION" -n frontend \
      "cd '$FRONTEND_DIR' && echo '=== Frontend starting on :$FRONTEND_PORT ===' && npm run dev"

    # Split the backend window into two panes (one for backend, one for logs)
    # Actually keep them in separate windows for clarity.

    # Set the starting window back to backend
    tmux select-window -t "$TMUX_SESSION:backend"

    ok "Backend  → tmux window 'backend'  (cd $BACKEND_DIR && npm run dev)"
    ok "Frontend → tmux window 'frontend' (cd $FRONTEND_DIR && npm run dev)"
    echo ""

    if $detach_mode; then
      ok "Servers running in background tmux session '$TMUX_SESSION'."
      ok "Re-attach with: tmux attach -t $TMUX_SESSION"
      ok "Stop with:     ./nexify-start.sh stop"
    else
      log "Attaching to tmux session — Ctrl-b d to detach, Ctrl-c to stop each server."
      tmux attach -t "$TMUX_SESSION"
    fi

    exit 0
  fi

  # ── Fallback: no tmux — use background processes + log files ───────────────
  warn "tmux not found. Falling back to background processes with log files."

  log "Starting backend in background (logs → backend.log)..."
  (
    cd "$BACKEND_DIR"
    echo "=== Backend starting on :$BACKEND_PORT ==="
    npm run dev 2>&1 | tee backend.log
  ) &
  local backend_pid=$!
  echo "$backend_pid" > .backend.pid
  ok "Backend PID $backend_pid  (cd $BACKEND_DIR)"

  log "Starting frontend in background (logs → frontend.log)..."
  (
    cd "$FRONTEND_DIR"
    echo "=== Frontend starting on :$FRONTEND_PORT ==="
    npm run dev 2>&1 | tee frontend.log
  ) &
  local frontend_pid=$!
  echo "$frontend_pid" > .frontend.pid
  ok "Frontend PID $frontend_pid  (cd $FRONTEND_DIR)"

  echo ""
  ok "Both servers running in background."
  ok "Backend  logs: $(pwd)/backend.log"
  ok "Frontend logs: $(pwd)/frontend.log"
  ok ""
  ok "Stop both:  ./nexify-start.sh stop"
  ok "Status:     ./nexify-start.sh status"

  # If not detached, wait and show live status
  if ! $detach_mode; then
    echo ""
    log "Watching processes (Ctrl-C to exit watcher, servers keep running)..."
    sleep 2
    while true; do
      printf "\r\033[K"
      if kill -0 "$backend_pid" 2>/dev/null; then
        printf "Backend PID %s: \033[1;32mrunning\033[0m    " "$backend_pid"
      else
        printf "Backend PID %s: \033[1;31mstopped\033[0m    " "$backend_pid"
      fi
      if kill -0 "$frontend_pid" 2>/dev/null; then
        printf "Frontend PID %s: \033[1;32mrunning\033[0m\n" "$frontend_pid"
      else
        printf "Frontend PID %s: \033[1;31mstopped\033[0m\n" "$frontend_pid"
      fi
      sleep 2
    done
  fi
}

# ── Entry point ──────────────────────────────────────────────────────────────
case "${1:-start}" in
  start)   do_start ""     ;;
  detach)  do_start "detach" ;;
  stop)    do_stop         ;;
  status)  do_status       ;;
  -h|--help)
    echo "Nexify start script — Pop!_OS"
    echo ""
    echo "Usage: ./nexify-start.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start    Start both backend and frontend in a tmux session (default)"
    echo "  detach   Same as start, but leaves tmux running in background"
    echo "  stop     Kill the tmux session and both servers"
    echo "  status   Show whether ports 5000 and 5173 are in use"
    echo ""
    echo "Environment variables:"
    echo "  BACKEND_DIR   Path to backend directory  (default: ./backend)"
    echo "  FRONTEND_DIR  Path to frontend directory (default: ./frontend)"
    exit 0
    ;;
  *)
    err "Unknown command: $1"
    echo "Run ./nexify-start.sh --help for usage."
    exit 1
    ;;
esac
