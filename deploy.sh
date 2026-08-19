#!/bin/bash

# Detener el script si ocurre algún error
set -e

echo "================================================="
echo "  Iniciando Validaciones Pre-Despliegue NOC-NOC  "
echo "================================================="

# 1. Ejecutar las pruebas E2E localmente
echo "[1/3] Ejecutando pruebas E2E en Playwright..."
npm run test:e2e

echo "[2/3] Todas las pruebas han pasado satisfactoriamente."

# 2. Construir la imagen de Docker
echo "[3/3] Iniciando construcción de la imagen de Producción Docker..."
docker build -t noc-noc:latest .

# Podrías agregar un paso extra para reiniciar tu contenedor si usas docker-compose
# echo "Reiniciando servicios..."
# docker-compose up -d

echo "================================================="
echo "  Despliegue finalizado y listo para Producción  "
echo "================================================="
