#!/bin/bash

# ==============================================================================
# SCRIPT LOCAL: Ejecutar en tu ordenador para subir la app al VPS
# ==============================================================================

VPS_USER="cibermedida"
VPS_IP="217.154.186.35"
APP_DIR="~/docentepro-app"

echo "🚀 1. Construyendo la aplicación para producción..."
npm run build

echo "📦 2. Sincronizando archivos con el VPS (excluyendo node_modules y .env)..."
# Crea el directorio en el VPS si no existe
ssh $VPS_USER@$VPS_IP "mkdir -p $APP_DIR"

# Sube los archivos usando rsync
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude 'dist' \
  ./ $VPS_USER@$VPS_IP:$APP_DIR/

# Sube también la carpeta dist generada
rsync -avz --progress ./dist/ $VPS_USER@$VPS_IP:$APP_DIR/dist/

echo "✅ Subida completada. Ahora conéctate por SSH y ejecuta setup-vps.sh:"
echo "ssh $VPS_USER@$VPS_IP"
echo "cd $APP_DIR && bash setup-vps.sh"
