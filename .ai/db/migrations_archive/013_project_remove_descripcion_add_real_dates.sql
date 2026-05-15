-- Elimina el campo descripcion de projects y agrega fechas reales de ejecución
-- Estas fechas permiten calcular desviaciones y extensiones de proyectos

ALTER TABLE projects DROP COLUMN IF EXISTS descripcion;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS fecha_inicio_real DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS fecha_fin_real DATE;
