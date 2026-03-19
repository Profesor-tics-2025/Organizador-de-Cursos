#!/bin/bash

# ==============================================================================
# SCRIPT REMOTO: Ejecutar dentro del VPS (conectado por SSH)
# ==============================================================================

DOMAIN="gestion.cibermedida.es"
PORT="3001"
DB_NAME="docentepro"
DB_USER="docentepro"

echo "🚀 Iniciando configuración en el VPS para $DOMAIN..."

# 1. Instalar dependencias
echo "📦 Instalando dependencias de Node.js..."
npm install

# 2. Crear archivo .env si no existe
if [ ! -f .env ]; then
  echo "⚙️ Creando archivo .env base..."
  cat <<EOF > .env
PORT=$PORT
DB_HOST=localhost
DB_USER=$DB_USER
DB_PASSWORD=PON_TU_CONTRASEÑA_AQUI
DB_NAME=$DB_NAME
JWT_SECRET=$(openssl rand -hex 32)
GEMINI_API_KEY=PON_TU_API_KEY_DE_GEMINI_AQUI
EOF
  echo "⚠️ IMPORTANTE: Edita el archivo .env con 'nano .env' para poner tu contraseña de DB y API Key de Gemini."
fi

# 3. Importar esquema de base de datos
echo "🗄️ Importando esquema de base de datos..."
echo "Se te pedirá la contraseña del usuario MariaDB '$DB_USER':"
mysql -u $DB_USER -p $DB_NAME < server/schema.sql

# 4. Configurar PM2 (Gestor de procesos)
echo "🔄 Configurando PM2 para mantener la app viva..."
sudo npm install -g pm2 tsx
pm2 stop docentepro 2>/dev/null || true
pm2 start server.ts --interpreter tsx --name "docentepro"
pm2 save
pm2 startup | grep "sudo" | bash

# 5. Configurar Apache (Reverse Proxy)
echo "🌐 Configurando Apache..."
# Habilitar módulos necesarios para el proxy inverso
sudo a2enmod proxy proxy_http rewrite headers

APACHE_CONF="/etc/apache2/sites-available/gestion-ssl.conf"

sudo bash -c "cat <<EOF > $APACHE_CONF
<VirtualHost *:80>
    ServerName $DOMAIN

    ProxyPreserveHost On
    ProxyPass / http://localhost:$PORT/
    ProxyPassReverse / http://localhost:$PORT/

    ErrorLog \${APACHE_LOG_DIR}/gestion_error.log
    CustomLog \${APACHE_LOG_DIR}/gestion_access.log combined
</VirtualHost>
EOF"

# Habilitar el nuevo sitio sin tocar los demás
sudo a2ensite gestion-ssl.conf
sudo systemctl restart apache2

# 6. Configurar SSL con Certbot (Let's Encrypt para Apache)
echo "🔒 Configurando certificado SSL..."
if ! command -v certbot &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-apache
fi

# Ejecutar certbot con el plugin de apache
sudo certbot --apache -d $DOMAIN --non-interactive --agree-tos -m admin@cibermedida.es --redirect

echo "🎉 ¡Despliegue completado exitosamente!"
echo "👉 Visita: https://$DOMAIN"

