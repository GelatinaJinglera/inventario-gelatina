-- Crear tabla ubicaciones con modelo jerárquico
-- Si ya existe la tabla, ejecutar primero el DROP o el ALTER

-- Opción 1: Si NO existe la tabla (nueva)
CREATE TABLE IF NOT EXISTS ubicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Sede', 'Ambiente', 'Sector', 'Mueble', 'Posición')),
  padre_id UUID REFERENCES ubicaciones(id) ON DELETE CASCADE,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(nombre, padre_id)
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_ubicaciones_padre_id ON ubicaciones(padre_id);
CREATE INDEX IF NOT EXISTS idx_ubicaciones_tipo ON ubicaciones(tipo);

-- ==========================================
-- Opción 2: Si EXISTE la tabla (migración)
-- ==========================================
-- Ejecutar esto solo si necesitas migrar desde estructura antigua
-- Primero, respalda los datos o verifica que no haya FK dependencias

/*
-- Renombrar tabla antigua
ALTER TABLE ubicaciones RENAME TO ubicaciones_old;

-- Crear tabla nueva
CREATE TABLE ubicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Sede', 'Ambiente', 'Sector', 'Mueble', 'Posición')),
  padre_id UUID REFERENCES ubicaciones(id) ON DELETE CASCADE,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(nombre, padre_id)
);

-- Migrar datos (ejemplo: crear sedes desde edificios únicos)
INSERT INTO ubicaciones (nombre, tipo, descripcion)
SELECT DISTINCT edificio, 'Sede', NULL
FROM ubicaciones_old;

-- Obtener IDs de sedes para usarlos en ambientes
WITH sedes AS (
  SELECT id, nombre FROM ubicaciones WHERE tipo = 'Sede'
)
INSERT INTO ubicaciones (nombre, tipo, padre_id, descripcion)
SELECT DISTINCT ambiente, 'Ambiente', s.id, NULL
FROM ubicaciones_old uo
JOIN sedes s ON s.nombre = uo.edificio;

-- Eliminar tabla antigua si todo está correcto
DROP TABLE ubicaciones_old;

-- Crear índices
CREATE INDEX idx_ubicaciones_padre_id ON ubicaciones(padre_id);
CREATE INDEX idx_ubicaciones_tipo ON ubicaciones(tipo);
*/

-- ==========================================
-- Datos iniciales de ejemplo (ejecutar después)
-- ==========================================
-- Insertar sedes
INSERT INTO ubicaciones (nombre, tipo, descripcion) VALUES
  ('Estudio A', 'Sede', 'Estudio principal de producción'),
  ('Depósito', 'Sede', 'Almacenamiento de mobiliario y equipos no frecuentes');

-- Obtener IDs para insertar ambientes bajo Estudio A
-- (Necesitarás reemplazar los UUIDs reales)
-- INSERT INTO ubicaciones (nombre, tipo, padre_id, descripcion) VALUES
--   ('Armario', 'Ambiente', (SELECT id FROM ubicaciones WHERE nombre = 'Estudio A'), 'Guardado de equipos de uso cotidiano'),
--   ('Control', 'Ambiente', (SELECT id FROM ubicaciones WHERE nombre = 'Estudio A'), 'PCs, consola de sonido y demás');

-- Alternativa más segura: usar subconsulta
INSERT INTO ubicaciones (nombre, tipo, padre_id, descripcion)
SELECT 'Armario', 'Ambiente', id, 'Guardado de equipos de uso cotidiano'
FROM ubicaciones WHERE nombre = 'Estudio A' AND tipo = 'Sede'
ON CONFLICT DO NOTHING;

INSERT INTO ubicaciones (nombre, tipo, padre_id, descripcion)
SELECT 'Control', 'Ambiente', id, 'PCs, consola de sonido y demás'
FROM ubicaciones WHERE nombre = 'Estudio A' AND tipo = 'Sede'
ON CONFLICT DO NOTHING;

-- Verificar datos insertados
SELECT id, nombre, tipo, padre_id FROM ubicaciones ORDER BY tipo, nombre;
