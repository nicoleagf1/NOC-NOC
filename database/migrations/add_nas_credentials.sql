-- Migración: Agregar soporte de credenciales NAS para carpetas de red
-- Ejecutar en la base de datos PostgreSQL de NOC-NOC en producción

ALTER TABLE backup_jobs ADD COLUMN IF NOT EXISTS nas_username VARCHAR(100);
ALTER TABLE backup_jobs ADD COLUMN IF NOT EXISTS nas_password_encrypted TEXT;
