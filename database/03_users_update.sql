BEGIN;

-- ==============================================================================
-- NOC-NOC DATABASE UPDATE: USERS AUTHENTICATION
-- ==============================================================================

-- 1. Agregar campo para forzar cambio de contraseña
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Asegurarse de que el rol ADMIN exista (debería existir por el init.sql, pero por precaución)
INSERT INTO roles (id, name, description) 
VALUES (1, 'ADMIN', 'Acceso total al sistema')
ON CONFLICT (name) DO NOTHING;

-- 3. Insertar el usuario por defecto 'admin' con clave 'admin' (hasheada)
-- y marcar que debe cambiar la clave al primer inicio de sesión
INSERT INTO users (role_id, username, email, password_hash, first_name, last_name, must_change_password)
VALUES (
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    'admin',
    'admin@vepagos.com',
    '$2b$10$Ey0fnisLMEX/rNBjAElBreIGYGkHBuwhw9wPNH54sx3PztIm1z0QG', -- hash de 'admin'
    'Administrador',
    'Sistema',
    TRUE
)
ON CONFLICT (username) DO NOTHING;
-- En caso de conflicto por el email, si ya existe otro admin, no fallará porque ON CONFLICT (username) lo protege

COMMIT;
