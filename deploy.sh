#!/bin/bash
# =====================================================
# DEPLOY SCRIPT - Faculdade Diferencial EAD
# Execute no VPS via SSH
# =====================================================

set -e

echo "🚀 Iniciando deploy da Faculdade Diferencial EAD..."

# 1. Atualizar sistema
echo "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js 18.x
echo "🟢 Instalando Node.js..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt install -y nodejs
fi
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"

# 3. Instalar MariaDB
echo "🗄️ Instalando MariaDB..."
if ! command -v mysql &> /dev/null; then
  sudo apt install -y mariadb-server mariadb-client
  sudo systemctl enable mariadb
  sudo systemctl start mariadb
fi

# 4. Criar banco de dados
echo "📋 Configurando banco de dados..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS faculdade_diferencial_ead CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'faculdade_user'@'localhost' IDENTIFIED BY 'SENHA_FORTE_AQUI';"
sudo mysql -e "GRANT ALL PRIVILEGES ON faculdade_diferencial_ead.* TO 'faculdade_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# 5. Instalar Nginx
echo "🌐 Instalando Nginx..."
if ! command -v nginx &> /dev/null; then
  sudo apt install -y nginx
  sudo systemctl enable nginx
fi

# 6. Instalar PM2
echo "⚙️ Instalando PM2..."
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
fi

# 7. Criar diretório do projeto
echo "📁 Preparando diretório..."
sudo mkdir -p /var/www/faculdade-diferencial-ead
sudo chown $USER:$USER /var/www/faculdade-diferencial-ead

# 8. Clonar repositório
echo "📥 Clonando repositório..."
cd /var/www
if [ -d "faculdade-diferencial-ead/.git" ]; then
  cd faculdade-diferencial-ead
  git pull origin main
else
  rm -rf faculdade-diferencial-ead
  git clone https://github.com/ED709112/faculdade-diferencial-ead.git
  cd faculdade-diferencial-ead
fi

# 9. Configurar backend
echo "🔧 Configurando backend..."
cd backend
cp .env.production .env
npm install --production

# 10. Configurar frontend
echo "🎨 Configurando frontend..."
cd ../frontend
cp .env.production .env.local
npm install
npm run build

# 11. Criar diretórios necessários
echo "📂 Criando diretórios..."
cd ..
mkdir -p logs backups
cd backend
mkdir -p uploads/products
mkdir -p uploads/certificates
mkdir -p uploads/thumbnails

# 12. Rodar migrations
echo "🗃️ Rodando migrations..."
node database/migrate.js
node database/seed.js

# 13. Configurar Nginx
echo "⚙️ Configurando Nginx..."
sudo tee /etc/nginx/sites-available/faculdade > /dev/null << 'NGINX'
server {
    listen 80;
    server_name fadead.com.br www.fadead.com.br;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }

    # Uploads
    location /uploads {
        proxy_pass http://127.0.0.1:3001/uploads;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://127.0.0.1:3001/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/faculdade /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 14. Iniciar com PM2
echo "🚀 Iniciando aplicação..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# 15. Configurar auto-start
echo "🔄 Configurando auto-start..."
pm2 startup systemd -u $USER --hp /home/$USER | tail -1 | sudo bash -

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure o DNS do fadead.com.br para apontar para este IP"
echo "2. Execute: sudo certbot --nginx -d fadead.com.br -d www.fadead.com.br"
echo "3. Edite o .env com as senhas corretas"
echo "4. Acesse: http://fadead.com.br"
