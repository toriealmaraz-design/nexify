#!/usr/bin/env bash
# Nexify VPS Deploy Script
# Run on the VPS after initial setup. Clones from GitHub and starts the platform.
set -euo pipefail

APP_DIR="/home/nexify/nexify"
REPO_URL="${GITHUB_REPO_URL:?Set GITHUB_REPO_URL env var}"
BRANCH="${GITHUB_BRANCH:-main}"

echo "=== Nexify VPS Deploy ==="

# 1. Install system deps
apt-get update -qq
apt-get install -y -qq nodejs npm postgresql-client build-essential git

# 2. Clone or update repo
if [ ! -d "$APP_DIR/.git" ]; then
  git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

# 3. Install backend deps
cd backend
npm ci --production
npx prisma generate
npx prisma migrate deploy
cd ..

# 4. Install frontend deps & build
cd frontend
npm ci
npm run build
cd ..

# 5. Start with PM2 (requires .env.production to exist with real values)
cd backend
pm2 start dist/server.js --name nexify-backend --update-env \
  --env-file .env.production \
  --max-memory-restart 512M
pm2 save
pm2 startup

echo "=== Deploy complete ==="
echo "Backend: pm2 logs nexify-backend"
