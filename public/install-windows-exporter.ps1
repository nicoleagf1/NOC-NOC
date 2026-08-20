# install-windows-exporter.ps1
$ErrorActionPreference = "Stop"
$exporterUrl = "https://github.com/prometheus-community/windows_exporter/releases/download/v0.25.1/windows_exporter-0.25.1-amd64.msi"
$installerPath = "$env:TEMP\windows_exporter.msi"

Write-Host "========================================="
Write-Host " NOC-NOC Agent Installer (Windows)"
Write-Host "========================================="

Write-Host "Descargando Windows Exporter v0.25.1..."
Invoke-WebRequest -Uri $exporterUrl -OutFile $installerPath

Write-Host "Instalando Windows Exporter silenciosamente..."
Start-Process -FilePath "msiexec.exe" -ArgumentList "/i $installerPath /qn" -Wait -NoNewWindow

Write-Host "Verificando estado del servicio..."
Get-Service windows_exporter

Write-Host "¡Instalación completada satisfactoriamente!"
Write-Host "El servidor ahora reportará métricas en el puerto 9182."
Write-Host "Asegúrese de abrir el puerto 9182 en el Firewall de Windows si es necesario."
