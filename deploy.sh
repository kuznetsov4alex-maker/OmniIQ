#!/bin/bash
# deploy.sh — OmniIQ production deploy script
# Run on the Timeweb VPS as root or sudo user
set -euo pipefail

REPO="https://github.com/kuznetsov4alex-maker/OmniIQ.git"
APP_DIR="/opt/omniiq"
DOMAIN="omniiq.tech"

echo "═══════════════════════════════════════════"
echo "  OmniIQ Deploy Script"
echo "═══════════════════════════════════════════"

# ── Install Docker if not present ────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "▶ Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

# ── Install docker-compose plugin ────────────────────────────
if ! docker compose version &>/dev/null; then
  echo "▶ Installing docker-compose..."
  apt-get install -y docker-compose-plugin
fi

# ── Clone or pull repo ────────────────────────────────────────
if [ -d "$APP_DIR" ]; then
  echo "▶ Pulling latest code..."
  cd "$APP_DIR"
  git pull origin main
else
  echo "▶ Cloning repo..."
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── Check .env.prod exists ────────────────────────────────────
if [ ! -f "$APP_DIR/apps/api/.env.prod" ]; then
  echo "⚠️  Missing apps/api/.env.prod — creating from template"
  cp "$APP_DIR/apps/api/.env.prod.example" "$APP_DIR/apps/api/.env.prod"
  echo ""
  echo "❌ STOP: Fill in apps/api/.env.prod before continuing!"
  echo "   nano $APP_DIR/apps/api/.env.prod"
  exit 1
fi

# ── Check .env (for compose passwords) ───────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  echo "⚠️  Missing .env — creating from .env.prod values"
  grep -E "^(POSTGRES_|REDIS_|DOMAIN|ADMIN_EMAIL)" "$APP_DIR/apps/api/.env.prod" > "$APP_DIR/.env"
fi

# ── Build images ──────────────────────────────────────────────
echo "▶ Building Docker images..."
docker compose -f "$APP_DIR/docker-compose.prod.yml" build --no-cache

# ── Run migrations ────────────────────────────────────────────
echo "▶ Starting database..."
docker compose -f "$APP_DIR/docker-compose.prod.yml" up -d postgres
sleep 5

echo "▶ Running migrations..."
docker compose -f "$APP_DIR/docker-compose.prod.yml" \
  --profile migrate run --rm migrate

# ── Start all services ────────────────────────────────────────
echo "▶ Starting all services..."
docker compose -f "$APP_DIR/docker-compose.prod.yml" up -d

# ── Get SSL certificate ───────────────────────────────────────
echo "▶ Obtaining SSL certificate..."
docker compose -f "$APP_DIR/docker-compose.prod.yml" \
  --profile certbot run --rm certbot || echo "SSL setup skipped (already exists?)"

# ── Reload nginx ──────────────────────────────────────────────
docker compose -f "$APP_DIR/docker-compose.prod.yml" exec nginx nginx -s reload || true

echo ""
echo "✅ OmniIQ deployed!"
echo "   Landing:   https://$DOMAIN"
echo "   Dashboard: https://$DOMAIN/app"
echo "   API docs:  https://$DOMAIN/docs"
echo "   Health:    https://$DOMAIN/api/v1/health"
