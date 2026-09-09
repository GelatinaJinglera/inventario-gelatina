import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Users, Package, Layers, MapPin, BarChart3, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  action: string;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: '',
    message: '',
    action: '',
    onConfirm: async () => {},
    isLoading: false,
  });
  const [feedback, setFeedback] = useState('');

  const adminMenus = [
    {
      title: 'Equipos',
      description: 'Agregar, editar o eliminar equipos del inventario',
      icon: <Package size={32} />,
      path: '/admin/equipos',
      color: 'bg-blue-50 border-blue-200 text-blue-900',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Usuarios',
      description: 'Gestionar usuarios y sus roles',
      icon: <Users size={32} />,
      path: '/admin/usuarios',
      color: 'bg-purple-50 border-purple-200 text-purple-900',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Categorías',
      description: 'Gestionar categorías de equipos',
      icon: <Layers size={32} />,
      path: '/admin/categorias',
      color: 'bg-green-50 border-green-200 text-green-900',
      iconColor: 'text-green-600'
    },
    {
      title: 'Ubicaciones',
      description: 'Gestionar ubicaciones del inventario',
      icon: <MapPin size={32} />,
      path: '/admin/ubicaciones',
      color: 'bg-orange-50 border-orange-200 text-orange-900',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Estadísticas',
      description: 'Ver estadísticas y análisis del inventario',
      icon: <BarChart3 size={32} />,
      path: '/admin/estadisticas',
      color: 'bg-red-50 border-red-200 text-red-900',
      iconColor: 'text-red-600'
    }
  ];

  // Funciones de limpieza
  const limpiarMovimientos = async () => {
    const { error } = await supabase.from('movimientos').delete().gte('created_at', '1900-01-01');
    if (error) throw error;
  };

  const limpiarMantenimiento = async () => {
    const { error } = await supabase.from('mantenimiento').delete().gte('created_at', '1900-01-01');
    if (error) throw error;
  };

  const limpiarRetiros = async () => {
    // Primero borrar retiro_items (FK)
    const { error: itemsError } = await supabase
      .from('retiro_items')
      .delete()
      .gte('created_at', '1900-01-01');
    if (itemsError) throw itemsError;

    // Luego borrar retiros
    const { error: retirosError } = await supabase
      .from('retiros')
      .delete()
      .gte('created_at', '1900-01-01');
    if (retirosError) throw retirosError;
  };

  const limpiarItemsRetiros = async () => {
    const { error } = await supabase
      .from('retiro_items')
      .delete()
      .gte('created_at', '1900-01-01');
    if (error) throw error;
  };

  const borrarTodosEquipos = async () => {
    // Las FKs se borran en cascada por las configuraciones de Supabase
    const { error } = await supabase
      .from('inventario')
      .delete()
      .gte('created_at', '1900-01-01');
    if (error) throw error;
  };

  // Mostrar confirmación
  const mostrarConfirmacion = (
    title: string,
    message: string,
    action: string,
    onConfirm: () => Promise<void>
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      action,
      onConfirm,
      isLoading: false,
    });
  };

  // Ejecutar acción
  const handleConfirm = async () => {
    try {
      setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
      await confirmDialog.onConfirm();
      setFeedback('✅ Operación completada exitosamente');
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      setFeedback('❌ Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      setTimeout(() => setFeedback(''), 3000);
    } finally {
      setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-gray-600 mt-2">Gestiona equipos, usuarios, categorías y ubicaciones</p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`p-4 rounded-lg border ${
          feedback.startsWith('✅')
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {feedback}
        </div>
      )}

      {/* Menu grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminMenus.map((menu) => (
          <button
            key={menu.path}
            onClick={() => navigate(menu.path)}
            className={`p-6 rounded-lg border-2 hover:shadow-lg transition text-left ${menu.color}`}
          >
            <div className={`${menu.iconColor} mb-4`}>{menu.icon}</div>
            <h3 className="text-lg font-bold mb-2">{menu.title}</h3>
            <p className="text-sm opacity-80">{menu.description}</p>
          </button>
        ))}
      </div>

      {/* Acciones Peligrosas */}
      <div className="mt-12 pt-8 border-t-2 border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle size={28} className="text-red-600" />
          <h2 className="text-2xl font-bold text-gray-900">Acciones Peligrosas</h2>
        </div>
        <p className="text-gray-600 mb-6">Limpia historiales o datos. Estas acciones no se pueden deshacer.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Limpiar Movimientos */}
          <button
            onClick={() =>
              mostrarConfirmacion(
                'Limpiar Movimientos',
                '¿Estás seguro? Se borrarán TODOS los movimientos del inventario.',
                'Limpiar',
                limpiarMovimientos
              )
            }
            className="p-6 rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:shadow-lg transition text-left"
          >
            <div className="text-red-600 mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-900">Limpiar Movimientos</h3>
            <p className="text-sm text-gray-700">Borra el historial de movimientos</p>
          </button>

          {/* Limpiar Mantenimiento */}
          <button
            onClick={() =>
              mostrarConfirmacion(
                'Limpiar Mantenimiento',
                '¿Estás seguro? Se borrarán TODOS los registros de mantenimiento.',
                'Limpiar',
                limpiarMantenimiento
              )
            }
            className="p-6 rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:shadow-lg transition text-left"
          >
            <div className="text-red-600 mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-900">Limpiar Mantenimiento</h3>
            <p className="text-sm text-gray-700">Borra el historial de fallas</p>
          </button>

          {/* Limpiar Retiros */}
          <button
            onClick={() =>
              mostrarConfirmacion(
                'Limpiar Retiros',
                '¿Estás seguro? Se borrarán TODOS los retiros e items asociados.',
                'Limpiar',
                limpiarRetiros
              )
            }
            className="p-6 rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:shadow-lg transition text-left"
          >
            <div className="text-red-600 mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-900">Limpiar Retiros</h3>
            <p className="text-sm text-gray-700">Borra todos los retiros</p>
          </button>

          {/* Limpiar Items Retiros */}
          <button
            onClick={() =>
              mostrarConfirmacion(
                'Limpiar Items de Retiros',
                '¿Estás seguro? Se borrarán TODOS los items dentro de retiros.',
                'Limpiar',
                limpiarItemsRetiros
              )
            }
            className="p-6 rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:shadow-lg transition text-left"
          >
            <div className="text-red-600 mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-900">Limpiar Items Retiros</h3>
            <p className="text-sm text-gray-700">Borra solo los items (no los retiros)</p>
          </button>

          {/* Borrar Todos Equipos */}
          <button
            onClick={() =>
              mostrarConfirmacion(
                'Borrar Todos los Equipos',
                '¿ESTÁS SEGURO? Se borrarán TODOS los equipos del inventario y sus datos asociados. ESTO NO SE PUEDE DESHACER.',
                'BORRAR TODO',
                borrarTodosEquipos
              )
            }
            className="p-6 rounded-lg border-2 border-red-500 bg-red-100 hover:bg-red-200 hover:shadow-lg transition text-left md:col-span-2 lg:col-span-3"
          >
            <div className="text-red-700 mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-red-900">🔴 BORRAR TODOS LOS EQUIPOS</h3>
            <p className="text-sm text-red-800">⚠️ Acción irreversible. Borra TODO el inventario</p>
          </button>
        </div>
      </div>

      {/* Modal de confirmación */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={28} className="text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">{confirmDialog.title}</h2>
            </div>

            <p className="text-gray-600 mb-6">{confirmDialog.message}</p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                disabled={confirmDialog.isLoading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition disabled:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirmDialog.isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:bg-red-400"
              >
                {confirmDialog.isLoading ? 'Procesando...' : confirmDialog.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
