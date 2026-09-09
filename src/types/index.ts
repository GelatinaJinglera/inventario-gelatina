// Usuarios
export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: 'EQUIPO' | 'ADMIN';
  activo: boolean;
  created_at: string;
}

// Categorías
export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
}

// Ubicaciones (jerárquicas)
export interface Ubicacion {
  id: string;
  nombre: string;
  tipo: 'Sede' | 'Ambiente' | 'Sector' | 'Mueble' | 'Posición';
  padre_id?: string;
  descripcion?: string;
  created_at?: string;
  updated_at?: string;
}

// Inventario (equipos)
export interface Inventario {
  id: string;
  nombre: string;
  marca: string;
  modelo: string;
  categoria_id: string;
  cantidad_total: number;
  numero_serie?: string;
  fecha_compra?: string;
  proveedor?: string;
  valor_unitario?: number;
  responsable_id: string;
  ubicacion_id: string;
  estado: 'Disponible' | 'En falla' | 'Descartado';
  foto_principal_drive_id?: string;
  foto_principal_url?: string;
  manual_drive_id?: string;
  observaciones?: string;
  etiquetas?: string[];
  tipo_control: 'Individual' | 'Stock';
  created_at: string;
  updated_at: string;
  // Relaciones (para lecturas)
  categorias?: Categoria;
  ubicacion?: Ubicacion;
  responsable?: Usuario;
}

// Movimientos
export interface Movimiento {
  id: string;
  inventario_id: string;
  accion: 'Retiro' | 'Devolución' | 'Cambio ubicación' | 'Alta' | 'Baja' | 'Falla' | 'Mantenimiento';
  cantidad: number;
  responsable_id: string;
  destino?: string;
  ubicacion_nueva_id?: string;
  devolución_prevista?: string;
  devolución_real?: string;
  observaciones?: string;
  retiro_id?: string;
  created_at: string;
  // Relaciones
  inventario?: Inventario;
  responsable?: Usuario;
}

// Retiros
export interface Retiro {
  id: string;
  nombre: string;
  plantilla_id?: string;
  responsable_id: string;
  destino: string;
  estado: 'Preparado' | 'Retirado' | 'Parcialmente devuelto' | 'Devuelto' | 'Cancelado';
  fecha_preparacion: string;
  fecha_retiro?: string;
  devolución_prevista?: string;
  fecha_cierre?: string;
  observaciones?: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  responsable?: Usuario;
  items?: RetiroItem[];
}

// Items dentro de un retiro
export interface RetiroItem {
  id: string;
  retiro_id: string;
  inventario_id: string;
  cantidad_solicitada: number;
  cantidad_retirada?: number;
  cantidad_devuelta?: number;
  observaciones?: string;
  // Relaciones
  inventario?: Inventario;
}

// Plantillas de retiros
export interface PlantillaRetiro {
  id: string;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  items?: PlantillaItem[];
}

// Items dentro de una plantilla
export interface PlantillaItem {
  id: string;
  plantilla_id: string;
  inventario_id: string;
  cantidad_requerida: number;
  orden: number;
  // Relaciones
  inventario?: Inventario;
}

// Mantenimiento
export interface Mantenimiento {
  id: string;
  inventario_id: string;
  estado: 'Reportado' | 'En reparación' | 'Resuelto';
  problema: string;
  cantidad_en_falla?: number;
  foto_drive_id?: string;
  responsable_tecnico_id?: string;
  costo?: number;
  fecha_resolucion?: string;
  solucion_notas?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  inventario?: Inventario;
  responsable_tecnico?: Usuario;
}

// Para auth
export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    nombre?: string;
  };
}
