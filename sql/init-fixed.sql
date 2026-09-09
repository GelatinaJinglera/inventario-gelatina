-- ============================================================================
-- SISTEMA DE INVENTARIO GELATINA
-- Script de inicialización de base de datos (VERSIÓN CORREGIDA)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLA: USUARIOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('EQUIPO', 'ADMIN')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLA: CATEGORIAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLA: UBICACIONES
-- ============================================================================
CREATE TABLE IF NOT EXISTS ubicaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  edificio VARCHAR(255) NOT NULL,
  ambiente VARCHAR(255) NOT NULL,
  sector VARCHAR(255),
  mueble_rack VARCHAR(255),
  posicion_caja VARCHAR(255),
  ubicacion_completa VARCHAR(1000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(edificio, ambiente, sector, mueble_rack, posicion_caja)
);

-- ============================================================================
-- TABLA: INVENTARIO
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventario (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  marca VARCHAR(255),
  modelo VARCHAR(255),
  categoria_id UUID NOT NULL REFERENCES categorias(id),
  cantidad_total INTEGER NOT NULL DEFAULT 1,
  numero_serie VARCHAR(255),
  fecha_compra DATE,
  proveedor VARCHAR(255),
  valor_unitario DECIMAL(12, 2),
  responsable_id UUID REFERENCES usuarios(id),
  ubicacion_id UUID REFERENCES ubicaciones(id),
  estado VARCHAR(50) NOT NULL DEFAULT 'Disponible' CHECK (estado IN ('Disponible', 'En falla', 'Descartado')),
  foto_principal_drive_id VARCHAR(255),
  foto_principal_url TEXT,
  manual_drive_id VARCHAR(255),
  observaciones TEXT,
  etiquetas TEXT[],
  tipo_control VARCHAR(50) NOT NULL CHECK (tipo_control IN ('Individual', 'Stock')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsqueda rápida
CREATE INDEX idx_inventario_categoria ON inventario(categoria_id);
CREATE INDEX idx_inventario_ubicacion ON inventario(ubicacion_id);
CREATE INDEX idx_inventario_estado ON inventario(estado);
CREATE INDEX idx_inventario_nombre ON inventario(nombre);

-- ============================================================================
-- TABLA: MOVIMIENTOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS movimientos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventario_id VARCHAR(50) NOT NULL REFERENCES inventario(id),
  accion VARCHAR(50) NOT NULL CHECK (accion IN ('Retiro', 'Devolución', 'Cambio ubicación', 'Alta', 'Baja', 'Falla', 'Mantenimiento')),
  cantidad INTEGER NOT NULL,
  responsable_id UUID REFERENCES usuarios(id),
  destino VARCHAR(255),
  ubicacion_nueva_id UUID REFERENCES ubicaciones(id),
  devolución_prevista DATE,
  devolución_real DATE,
  observaciones TEXT,
  retiro_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_movimientos_inventario ON movimientos(inventario_id);
CREATE INDEX idx_movimientos_accion ON movimientos(accion);
CREATE INDEX idx_movimientos_fecha ON movimientos(created_at);

-- ============================================================================
-- TABLA: RETIROS
-- ============================================================================
CREATE TABLE IF NOT EXISTS retiros (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  plantilla_id UUID,
  responsable_id UUID NOT NULL REFERENCES usuarios(id),
  destino VARCHAR(255) NOT NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'Preparado' CHECK (estado IN ('Preparado', 'Retirado', 'Parcialmente devuelto', 'Devuelto', 'Cancelado')),
  fecha_preparacion DATE,
  fecha_retiro DATE,
  devolución_prevista DATE,
  fecha_cierre DATE,
  observaciones TEXT,
  created_by_id UUID NOT NULL REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_retiros_estado ON retiros(estado);
CREATE INDEX idx_retiros_responsable ON retiros(responsable_id);

-- ============================================================================
-- TABLA: RETIRO_ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS retiro_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retiro_id VARCHAR(50) NOT NULL REFERENCES retiros(id),
  inventario_id VARCHAR(50) NOT NULL REFERENCES inventario(id),
  cantidad_solicitada INTEGER NOT NULL,
  cantidad_retirada INTEGER,
  cantidad_devuelta INTEGER,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_retiro_items_retiro ON retiro_items(retiro_id);
CREATE INDEX idx_retiro_items_inventario ON retiro_items(inventario_id);

-- ============================================================================
-- TABLA: PLANTILLAS_RETIRO
-- ============================================================================
CREATE TABLE IF NOT EXISTS plantillas_retiro (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,
  activa BOOLEAN DEFAULT true,
  created_by_id UUID NOT NULL REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLA: PLANTILLA_ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS plantilla_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plantilla_id VARCHAR(50) NOT NULL REFERENCES plantillas_retiro(id),
  inventario_id VARCHAR(50) NOT NULL REFERENCES inventario(id),
  cantidad_requerida INTEGER NOT NULL,
  orden INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_plantilla_items_plantilla ON plantilla_items(plantilla_id);

-- ============================================================================
-- TABLA: MANTENIMIENTO
-- ============================================================================
CREATE TABLE IF NOT EXISTS mantenimiento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventario_id VARCHAR(50) NOT NULL REFERENCES inventario(id),
  estado VARCHAR(50) NOT NULL DEFAULT 'Reportado' CHECK (estado IN ('Reportado', 'En reparación', 'Resuelto')),
  problema TEXT NOT NULL,
  foto_drive_id VARCHAR(255),
  responsable_tecnico_id UUID REFERENCES usuarios(id),
  costo DECIMAL(12, 2),
  fecha_resolucion DATE,
  solucion_notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_mantenimiento_inventario ON mantenimiento(inventario_id);
CREATE INDEX idx_mantenimiento_estado ON mantenimiento(estado);

-- ============================================================================
-- TABLA: HISTORIAL_STOCK (opcional, para auditoría)
-- ============================================================================
CREATE TABLE IF NOT EXISTS historial_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventario_id VARCHAR(50) NOT NULL REFERENCES inventario(id),
  stock_anterior INTEGER,
  stock_nuevo INTEGER,
  movimiento_id UUID REFERENCES movimientos(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Insertar categorías
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Video', 'Cámaras, monitores, cables de video'),
  ('Audio', 'Micrófonos, consolas, cajas directas'),
  ('Computadoras', 'PCs, notebooks, servidores'),
  ('Accesorios', 'Cables, vinchas, conectores'),
  ('Iluminación', 'Luces, reflectores, geles'),
  ('Conectividad', 'Routers, switches, cableado de red'),
  ('Mobiliario', 'Racks, mesas, sillas')
ON CONFLICT DO NOTHING;

-- Insertar ubicaciones
INSERT INTO ubicaciones (edificio, ambiente, sector, mueble_rack, ubicacion_completa) VALUES
  ('Estudio A', 'Armario', 'Equipos cotidianos', NULL, 'Estudio A > Armario > Equipos cotidianos'),
  ('Estudio A', 'Control', NULL, 'Rack video', 'Estudio A > Control > Rack video'),
  ('Estudio A', 'Control', NULL, 'Rack audio', 'Estudio A > Control > Rack audio'),
  ('Depósito', 'Almacenamiento', 'Video', 'Estante A', 'Depósito > Almacenamiento > Video > Estante A'),
  ('Depósito', 'Almacenamiento', 'Audio', 'Estante B', 'Depósito > Almacenamiento > Audio > Estante B'),
  ('Depósito', 'Almacenamiento', 'Accesorios', 'Caja 1', 'Depósito > Almacenamiento > Accesorios > Caja 1')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Fin del script
-- ============================================================================
