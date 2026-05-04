-- Migration: 006_remove_hours_upper_limit.sql
-- Descripción: Eliminar el límite superior de 24h en time_entry_lines (check_hours_range)
-- Fecha: 2026-04-30
-- ¿Requiere downtime? No
-- ¿Pérdida de datos potencial? No

-- ============================================
-- UP
-- ============================================
ALTER TABLE time_entry_lines DROP CONSTRAINT check_hours_range;
ALTER TABLE time_entry_lines ADD CONSTRAINT check_hours_range CHECK (hours >= 0);
-- ============================================
-- DOWN
-- ============================================

-- BEGIN;
-- ALTER TABLE time_entry_lines DROP CONSTRAINT check_hours_range;
-- ALTER TABLE time_entry_lines ADD CONSTRAINT check_hours_range CHECK (hours >= 0 AND hours <= 24);
-- COMMIT;
