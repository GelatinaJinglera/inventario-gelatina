-- ============================================================================
-- DATOS DE PRUEBA - INVENTARIO GELATINA
-- Ejecutar DESPUÉS de init.sql
-- ============================================================================

-- ============================================================================
-- USUARIOS DE PRUEBA
-- ============================================================================
-- Nota: Los usuarios se crean con Supabase Auth, pero aquí agregamos registros
-- para la tabla de usuarios (sincronizar después de crear usuarios en Auth)

-- Para agregar usuarios, ve a Supabase Dashboard > Authentication > Add user
-- Después de crear, registra aquí sus IDs. Por ahora usamos UUIDs placeholder:

-- Admin: joawav0201@gmail.com
INSERT INTO usuarios (id, email, nombre, rol, activo) VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'joawav0201@gmail.com', 'Joacquín', 'ADMIN', true),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'producegelatina@gmail.com', 'Productor', 'EQUIPO', true),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'riojoaquin1@gmail.com', 'Joaquín Río', 'EQUIPO', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- EQUIPOS - CÁMARAS
-- ============================================================================
INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'VID-001', 'Cámara Aida', 'Aida', 'Pro Model', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Estudio A' AND ambiente='Armario' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Video'
ON CONFLICT DO NOTHING;

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'VID-002', 'Cámara Aida', 'Aida', 'Pro Model', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Estudio A' AND ambiente='Armario' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Video'
ON CONFLICT DO NOTHING;

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'VID-003', 'Cámara Aida', 'Aida', 'Pro Model', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Depósito' AND ambiente='Almacenamiento' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Video'
ON CONFLICT DO NOTHING;

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'VID-004', 'Cámara Aida', 'Aida', 'Pro Model', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Depósito' AND ambiente='Almacenamiento' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Video'
ON CONFLICT DO NOTHING;

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'VID-005', 'Cámara Aida', 'Aida', 'Pro Model', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Depósito' AND ambiente='Almacenamiento' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Video'
ON CONFLICT DO NOTHING;

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'VID-006', 'Cámara Aida', 'Aida', 'Pro Model', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Depósito' AND ambiente='Almacenamiento' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Video'
ON CONFLICT DO NOTHING;

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'VID-007', 'Cámara Aida', 'Aida', 'Pro Model', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Depósito' AND ambiente='Almacenamiento' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Video'
ON CONFLICT DO NOTHING;

-- Cámaras Sony
INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'VID-008', 'Cámara Sony', 'Sony', 'Alpha Series', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Estudio A' AND ambiente='Control' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Video'
ON CONFLICT DO NOTHING;

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'VID-009', 'Cámara Sony', 'Sony', 'Alpha Series', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Depósito' AND ambiente='Almacenamiento' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Video'
ON CONFLICT DO NOTHING;

-- Televisores
INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'VID-010', 'Televisor Samsung', 'Samsung', 'UHD 55"', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Estudio A' AND ambiente='Control' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Video'
ON CONFLICT DO NOTHING;

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'VID-011', 'Televisor Samsung', 'Samsung', 'UHD 55"', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Depósito' AND ambiente='Almacenamiento' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Video'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- EQUIPOS - AUDIO
-- ============================================================================

-- Micrófonos Shure MV7X
INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'AUD-MIC-001', 'Micrófono Shure MV7X', 'Shure', 'MV7X', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Estudio A' AND ambiente='Armario' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Audio'
ON CONFLICT DO NOTHING;

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'AUD-MIC-002', 'Micrófono Shure MV7X', 'Shure', 'MV7X', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Estudio A' AND ambiente='Armario' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Audio'
ON CONFLICT DO NOTHING;

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'AUD-MIC-003', 'Micrófono Shure MV7X', 'Shure', 'MV7X', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Estudio A' AND ambiente='Armario' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Audio'
ON CONFLICT DO NOTHING;

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'AUD-MIC-004', 'Micrófono Shure MV7X', 'Shure', 'MV7X', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Depósito' AND ambiente='Almacenamiento' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Audio'
ON CONFLICT DO NOTHING;

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'AUD-MIC-005', 'Micrófono Shure MV7X', 'Shure', 'MV7X', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Depósito' AND ambiente='Almacenamiento' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Audio'
ON CONFLICT DO NOTHING;

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'AUD-MIC-006', 'Micrófono Shure MV7X', 'Shure', 'MV7X', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Depósito' AND ambiente='Almacenamiento' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Audio'
ON CONFLICT DO NOTHING;

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'AUD-MIC-007', 'Micrófono Shure MV7X', 'Shure', 'MV7X', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Depósito' AND ambiente='Almacenamiento' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Audio'
ON CONFLICT DO NOTHING;

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'AUD-MIC-008', 'Micrófono Shure MV7X', 'Shure', 'MV7X', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Depósito' AND ambiente='Almacenamiento' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Audio'
ON CONFLICT DO NOTHING;

-- Micrófono inalámbrico Shure
INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'AUD-MIC-WIRELESS', 'Micrófono Inalámbrico Shure', 'Shure', 'ULX-D Series', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Estudio A' AND ambiente='Control' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Audio'
ON CONFLICT DO NOTHING;

-- Cajas directas Samson MDA1
INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'AUD-DI-001', 'Caja Directa Samson MDA1', 'Samson', 'MDA1', categorias.id, 6, 'Stock',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Estudio A' AND ambiente='Control' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Audio'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- EQUIPOS - COMPUTADORAS
-- ============================================================================

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado, observaciones) 
SELECT
  'PC-PLAYOUT', 'PC Playout', 'Custom Build', 'Pro', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Estudio A' AND ambiente='Control' AND mueble_rack='Rack video' LIMIT 1),
  'Disponible',
  'Sistema especializado para reproducción de contenido'
FROM categorias WHERE nombre='Computadoras'
ON CONFLICT DO NOTHING;

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado, observaciones) 
SELECT
  'PC-CAMARAS', 'PC Cámaras', 'Custom Build', 'Pro', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Estudio A' AND ambiente='Control' LIMIT 1),
  'Disponible',
  'Conecta y controla todas las cámaras'
FROM categorias WHERE nombre='Computadoras'
ON CONFLICT DO NOTHING;

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado, observaciones) 
SELECT
  'PC-SONIDO', 'PC Sonido', 'Custom Build', 'Pro', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Estudio A' AND ambiente='Control' AND mueble_rack='Rack audio' LIMIT 1),
  'Disponible',
  'Gestiona entrada y salida de audio'
FROM categorias WHERE nombre='Computadoras'
ON CONFLICT DO NOTHING;

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado, observaciones) 
SELECT
  'PC-SWITCHER', 'PC Switcher Master', 'Custom Build', 'Pro', categorias.id, 1, 'Individual',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Estudio A' AND ambiente='Control' LIMIT 1),
  'Disponible',
  'Control maestro del mezclador de video'
FROM categorias WHERE nombre='Computadoras'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- EQUIPOS - ACCESORIOS
-- ============================================================================

INSERT INTO inventario (id, nombre, marca, modelo, categoria_id, cantidad_total, tipo_control, responsable_id, ubicacion_id, estado) 
SELECT
  'ACC-VINCHA-001', 'Vincha', 'Genérica', 'Standard', categorias.id, 2, 'Stock',
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM ubicaciones WHERE edificio='Estudio A' AND ambiente='Armario' LIMIT 1),
  'Disponible'
FROM categorias WHERE nombre='Accesorios'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MOVIMIENTOS DE EJEMPLO
-- ============================================================================

-- Retiro de una cámara Aida hace 3 días
INSERT INTO movimientos (inventario_id, accion, cantidad, responsable_id, destino, observaciones, created_at)
VALUES ('VID-001', 'Retiro', 1, '00000000-0000-0000-0000-000000000002'::uuid, 'Evento externo', 'Retiro para transmisión en vivo', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- Devolución de esa cámara
INSERT INTO movimientos (inventario_id, accion, cantidad, responsable_id, devolución_real, observaciones, created_at)
VALUES ('VID-001', 'Devolución', 1, '00000000-0000-0000-0000-000000000002'::uuid, CURRENT_DATE - 1, 'Regresó en buen estado', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Fin del script
-- ============================================================================
