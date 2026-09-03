-- Migración: Añadir campos para 2FA a la tabla de usuarios
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;
