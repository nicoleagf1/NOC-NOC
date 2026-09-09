BEGIN;

-- ==============================================================================
-- NOC-NOC MIGRATION: ADD N8N AS MONITORING CONNECTION TYPE
-- ==============================================================================

-- Drop existing type check constraint
ALTER TABLE monitoring_connections 
DROP CONSTRAINT IF EXISTS monitoring_connections_type_check;

-- Add updated constraint including 'n8n'
ALTER TABLE monitoring_connections 
ADD CONSTRAINT monitoring_connections_type_check 
CHECK (type IN ('prometheus', 'uptime-kuma', 'fortigate', 'n8n'));

COMMIT;
