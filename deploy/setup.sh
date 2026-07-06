#!/bin/bash
# OmniIQ — Full server setup script for Timeweb VPS (Ubuntu 22.04)
# Usage: curl -fsSL <url> | bash
# Or: bash setup.sh
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── Config ─────────────────────────────────────────────────────────────────
DB_NAME="omniiq_db"
DB_USER="omniiq_user"
DB_PASS="$(openssl rand -base64 24)"
SECRET_KEY="$(openssl rand -base64 32)"
REPO_URL="https://github.com/kuznetsov4alex-maker/OmniIQ.git"
APP_DIR="/var/www/OmniIQ"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║          OmniIQ — Timeweb VPS Setup Script          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── 1. System update ───────────────────────────────────────────────────────
info "Updating system packages..."
apt update -q && apt upgrade -y -q
apt install -y -q curl git nginx certbot python3-certbot-nginx \
    python3.11 python3.11-venv python3.11-dev build-essential \
    libpq-dev postgresql postgresql-contrib ufw
success "System packages installed"

# ── 2. Node.js 20 ──────────────────────────────────────────────────────────
info "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
apt install -y -q nodejs
success "Node.js $(node -v) installed"

# ── 3. Poetry (Python package manager) ─────────────────────────────────────
info "Installing Poetry..."
curl -sSL https://install.python-poetry.org | python3.11 - >/dev/null
export PATH="$HOME/.local/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
success "Poetry $(poetry --version) installed"

# ── 4. PostgreSQL ──────────────────────────────────────────────────────────
info "Setting up PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" 2>/dev/null || warn "User may already exist"
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null || warn "DB may already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" >/dev/null
success "PostgreSQL configured (db: ${DB_NAME}, user: ${DB_USER})"

# ── 5. Clone repo ──────────────────────────────────────────────────────────
info "Cloning OmniIQ repository..."
mkdir -p /var/www
if [ -d "$APP_DIR" ]; then
    warn "Directory exists, pulling latest..."
    cd "$APP_DIR" && git pull origin main
else
    git clone "$REPO_URL" "$APP_DIR"
fi
success "Repository ready at $APP_DIR"

# ── 6. Prompt for API keys ─────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔑 Нужны API ключи"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "OpenAI API Key (sk-...): " OPENAI_KEY
read -p "Домен для API (напр. api.omniiq.tech): " API_DOMAIN
read -p "Домен для App (напр. app.omniiq.tech): " APP_DOMAIN
read -p "Домен лендинга (напр. omniiq.tech): " LANDING_DOMAIN
echo ""

# ── 7. Environment files ───────────────────────────────────────────────────
info "Writing .env files..."
cat > "$APP_DIR/apps/api/.env" << EOF
DATABASE_URL=postgresql+asyncpg://${DB_USER}:${DB_PASS}@localhost/${DB_NAME}
OPENAI_API_KEY=${OPENAI_KEY}
SECRET_KEY=${SECRET_KEY}
ENVIRONMENT=production
ALLOWED_ORIGINS=https://${APP_DOMAIN},https://${LANDING_DOMAIN}
EOF

cat > "$APP_DIR/apps/web/.env.production" << EOF
NEXT_PUBLIC_API_URL=https://${API_DOMAIN}
EOF
success ".env files written"

# ── 8. Backend install + migrations ────────────────────────────────────────
info "Installing Python dependencies..."
cd "$APP_DIR/apps/api"
poetry env use python3.11
poetry install --no-dev -q
info "Running database migrations..."
poetry run alembic upgrade head
success "Backend ready"

# ── 9. Frontend build ──────────────────────────────────────────────────────
info "Building Next.js frontend (this may take 2-3 min)..."
cd "$APP_DIR/apps/web"
cp .env.production .env.local
npm install -q
npm run build
success "Frontend built"

# ── 10. Systemd services ───────────────────────────────────────────────────
info "Creating systemd services..."

cat > /etc/systemd/system/omniiq-api.service << EOF
[Unit]
Description=OmniIQ API
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}/apps/api
ExecStart=${HOME}/.local/bin/poetry run uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=on-failure
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/omniiq-web.service << EOF
[Unit]
Description=OmniIQ Web
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}/apps/web
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=127.0.0.1

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable omniiq-api omniiq-web
systemctl start omniiq-api omniiq-web
success "Services started"

# ── 11. Nginx ──────────────────────────────────────────────────────────────
info "Configuring Nginx..."
cat > /etc/nginx/sites-available/omniiq << EOF
server {
    listen 80;
    server_name ${API_DOMAIN};
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 10M;
    }
}
server {
    listen 80;
    server_name ${APP_DOMAIN};
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
server {
    listen 80;
    server_name ${LANDING_DOMAIN} www.${LANDING_DOMAIN};
    root ${APP_DIR}/apps/landing;
    index index.html;
    location /ru/ {
        try_files \$uri \$uri/ /ru/index.html;
    }
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    gzip on;
    gzip_types text/css application/javascript image/svg+xml;
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/omniiq /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
success "Nginx configured"

# ── 12. Firewall ───────────────────────────────────────────────────────────
info "Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
success "Firewall configured"

# ── 13. SSL ────────────────────────────────────────────────────────────────
info "Getting SSL certificates (Let's Encrypt)..."
certbot --nginx --non-interactive --agree-tos -m admin@${LANDING_DOMAIN} \
    -d ${LANDING_DOMAIN} -d www.${LANDING_DOMAIN} \
    -d ${APP_DOMAIN} -d ${API_DOMAIN} || warn "SSL setup failed — check DNS first"

# ── 14. Update script ──────────────────────────────────────────────────────
cat > "$APP_DIR/deploy/update.sh" << 'UPDATEEOF'
#!/bin/bash
set -e
echo "⬇ Pulling latest code..."
cd /var/www/OmniIQ
git pull origin main

echo "📦 Backend..."
cd apps/api
~/.local/bin/poetry install --no-dev -q
~/.local/bin/poetry run alembic upgrade head

echo "🏗 Frontend..."
cd ../web
npm install -q
npm run build

echo "🔄 Restarting..."
systemctl restart omniiq-api omniiq-web
echo "✅ Update complete!"
UPDATEEOF
chmod +x "$APP_DIR/deploy/update.sh"

# ── Done ───────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║               ✅ Деплой завершён!                   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  🌐 Лендинг:   https://${LANDING_DOMAIN}"
echo "  📱 Дашборд:   https://${APP_DOMAIN}"
echo "  🔧 API docs:  https://${API_DOMAIN}/docs"
echo ""
echo "  📋 DB пароль сохранён в: ${APP_DIR}/apps/api/.env"
echo "  🔄 Обновление: ${APP_DIR}/deploy/update.sh"
echo ""
echo "  Статус сервисов:"
systemctl is-active omniiq-api && echo "    ✓ API — работает" || echo "    ✗ API — ошибка"
systemctl is-active omniiq-web && echo "    ✓ Web — работает" || echo "    ✗ Web — ошибка"
echo ""
