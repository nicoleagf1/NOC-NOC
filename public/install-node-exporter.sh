#!/bin/bash
# install-node-exporter.sh
set -e

VERSION="1.7.0"
TAR_FILE="node_exporter-${VERSION}.linux-amd64.tar.gz"
DOWNLOAD_URL="https://github.com/prometheus/node_exporter/releases/download/v${VERSION}/${TAR_FILE}"

echo "========================================="
echo " NOC-NOC Agent Installer (Linux)"
echo "========================================="

echo "Descargando Node Exporter v${VERSION}..."
curl -sSL -o /tmp/${TAR_FILE} ${DOWNLOAD_URL}

echo "Extrayendo archivos..."
tar xvfz /tmp/${TAR_FILE} -C /tmp/

echo "Moviendo binario a /usr/local/bin..."
sudo mv /tmp/node_exporter-${VERSION}.linux-amd64/node_exporter /usr/local/bin/

echo "Creando usuario seguro para node_exporter..."
sudo useradd -rs /bin/false node_exporter || true

echo "Configurando servicio Systemd..."
cat <<EOF | sudo tee /etc/systemd/system/node_exporter.service
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

echo "Iniciando servicio..."
sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter

echo "Limpiando archivos temporales..."
rm -rf /tmp/${TAR_FILE} /tmp/node_exporter-${VERSION}.linux-amd64

echo "¡Instalación completada satisfactoriamente!"
echo "El servidor ahora reportará métricas en el puerto 9100."
echo "Asegúrese de abrir el puerto 9100 en su firewall (iptables/ufw) si es necesario."
