#!/bin/bash
# ==========================================================================
# AwesomeContext — AWS EC2 Initial Setup Script
# ==========================================================================
# Run this once on a fresh Ubuntu 22.04+ EC2 instance.
#
# Usage:
#   chmod +x setup-aws.sh
#   sudo ./setup-aws.sh
#
# Prerequisites:
#   - Ubuntu 22.04 LTS (recommended: t3.small or t3.medium)
#   - Security Group: inbound ports 22, 80, 443, 5432 (5432 only if Vercel needs direct DB access)
#   - Elastic IP attached (for stable DNS A record)
# ==========================================================================

set -euo pipefail

DOMAIN="api.awesomecontext.awareness.market"
EMAIL="${CERTBOT_EMAIL:-}"

echo "=== AwesomeContext EC2 Setup ==="
echo "Domain: $DOMAIN"

# ------------------------------------------------------------------
# 1. System packages
# ------------------------------------------------------------------
echo "[1/5] Updating system and installing dependencies..."
apt-get update -y
apt-get upgrade -y
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw

# ------------------------------------------------------------------
# 2. Docker + Docker Compose
# ------------------------------------------------------------------
echo "[2/5] Installing Docker..."
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    # Allow current user to run docker without sudo
    usermod -aG docker ubuntu 2>/dev/null || true
fi

echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker compose version)"

# ------------------------------------------------------------------
# 3. Firewall
# ------------------------------------------------------------------
echo "[3/5] Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (for ACME challenge + redirect)
ufw allow 443/tcp   # HTTPS (MCP server)
ufw allow 5432/tcp  # PostgreSQL (for Vercel serverless functions)
ufw --force enable
ufw status

# ------------------------------------------------------------------
# 4. SSL Certificate (Let's Encrypt)
# ------------------------------------------------------------------
echo "[4/5] Obtaining SSL certificate..."
if [ -z "$EMAIL" ]; then
    echo ""
    echo "ERROR: Set CERTBOT_EMAIL before running:"
    echo "  export CERTBOT_EMAIL=your@email.com"
    echo "  sudo -E ./setup-aws.sh"
    echo ""
    echo "Skipping SSL setup. You can run this later:"
    echo "  docker compose -f docker-compose.prod.yml run --rm certbot certonly --webroot -w /var/www/certbot -d $DOMAIN --email your@email.com --agree-tos --no-eff-email"
    echo ""
else
    # First, start nginx without SSL for ACME challenge
    # We need a temporary nginx config for initial cert
    mkdir -p /tmp/acme-nginx
    cat > /tmp/acme-nginx/nginx.conf <<'NGINX'
events { worker_connections 128; }
http {
    server {
        listen 80;
        location /.well-known/acme-challenge/ { root /var/www/certbot; }
        location / { return 200 'ok'; }
    }
}
NGINX

    mkdir -p /var/www/certbot

    # Run temporary nginx
    docker run -d --name acme-nginx \
        -p 80:80 \
        -v /tmp/acme-nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
        -v /var/www/certbot:/var/www/certbot \
        nginx:alpine

    # Get certificate
    docker run --rm \
        -v acme-certs:/etc/letsencrypt \
        -v acme-var:/var/lib/letsencrypt \
        -v /var/www/certbot:/var/www/certbot \
        certbot/certbot certonly \
        --webroot -w /var/www/certbot \
        -d "$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email

    # Stop temporary nginx
    docker rm -f acme-nginx
    rm -rf /tmp/acme-nginx

    echo "SSL certificate obtained for $DOMAIN"
fi

# ------------------------------------------------------------------
# 5. Project directory
# ------------------------------------------------------------------
echo "[5/5] Setting up project directory..."
PROJECT_DIR="/opt/awesomecontext"
mkdir -p "$PROJECT_DIR"

echo ""
echo "============================================"
echo "  Setup complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Clone the repo:"
echo "   cd $PROJECT_DIR"
echo "   git clone https://github.com/your-org/AwesomeContext.git ."
echo ""
echo "2. Configure environment:"
echo "   cd deploy"
echo "   cp .env.prod.example .env"
echo "   nano .env  # Fill in production values"
echo ""
echo "3. Build and start:"
echo "   docker compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "4. Initialize database (first time):"
echo "   # Run Prisma migrations from landing directory"
echo "   # Or connect Vercel to the database and run migrations there"
echo ""
echo "5. Verify:"
echo "   curl https://$DOMAIN/health"
echo ""
