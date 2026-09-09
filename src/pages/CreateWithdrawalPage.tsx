import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getCurrentUser } from '../services/supabaseClient';
import { Inventario } from '../types';
import { ArrowLeft, Plus, X, AlertCircle } from 'lucide-react';

interface SelectedItem {
  inventario_id: string;
  cantidad: number;
  inventario?: Inventario;
}

interface ConfirmDialog {
  show: boolean;
  equipo?: Inventario;
  equipoExistente?: SelectedItem;
}

export default function CreateWithdrawalPage() {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState<Inventario[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({ show: false });

  // Form fields
  const [nombre, setNombre] = useState('');
  const [destino, setDestino] = useState('');
  const [fechaDevolucion, setFechaDevolucion] = useState('');

  useEffect(() => {
    const fetchEquipos = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('inventario')
          .select('*')
          .eq('estado', 'Disponible')
          .order('nombre');

        if (err) throw err;
        setEquipos(data || []);
      } catch (err) {
        console.error('Error:', err);
        setError('No se pudieron cargar los equipos');
      } finally {
        setLoading(false);
      }
    };

    fetchEquipos();
  }, []);

  const agregarEquipo = (equipo: Inventario) => {
    const existe = selectedItems.find((item) => item.inventario_id === equipo.id);

    if (existe) {
      // Mostrar modal de confirmación
      setConfirmDialog({
        show: true,
        equipo,
        equipoExistente: existe,
      });
    } else {
      // Agregar equipo nuevo
      setSelectedItems([
        ...selectedItems,
        {
          inventario_id: equipo.id,
          cantidad: 1,
          inventario: equipo,
        },
      ]);
    }
  };

  const confirmarSumarCantidad = () => {
    if (!confirmDialog.equipoExistente || !confirmDialog.equipo) return;

    const nuevaCantidad = confirmDialog.equipoExistente.cantidad + 1;

    setSelectedItems(
      selectedItems.map((item) =>
        item.inventario_id === confirmDialog.equipo!.id
          ? { ...item, cantidad: nuevaCantidad }
          : item
      )
    );

    setConfirmDialog({ show: false });
  };

  const quitarEquipo = (inventario_id: string) => {
    setSelectedItems(selectedItems.filter((item) => item.inventario_id !== inventario_id));
  };

  const actualizarCantidad = (inventario_id: string, cantidad: number) => {
    const cantidadValida = Math.max(1, cantidad);

    setSelectedItems(
      selectedItems.map((item) =>
        item.inventario_id === inventario_id
          ? { ...item, cantidad: cantidadValida }
          : item
      )
    );
  };

  const handleGuardar = async () => {
    // Validaciones
    if (!nombre.trim()) {
      setError('El nombre del retiro es requerido');
      return;
    }

    if (!destino.trim()) {
      setError('El destino es requerido');
      return;
    }

    if (selectedItems.length === 0) {
      setError('Debe agregar al menos un equipo');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const user = await getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Crear retiro
      const { data: retiro, error: retiroError } = await supabase
        .from('retiros')
        .insert({
          nombre,
          destino,
          fecha_devolucion: fechaDevolucion || null,
          responsable_id: user.id,
          estado: 'Activo',
        })
        .select()
        .single();

      if (retiroError) throw retiroError;

      // Crear items de retiro
      const items = selectedItems.map((item) => ({
        retiro_id: retiro.id,
        inventario_id: item.inventario_id,
        cantidad: item.cantidad,
      }));

      const { error: itemsError } = await supabase
        .from('retiro_items')
        .insert(items);

      if (itemsError) throw itemsError;

      navigate('/retiros');
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 md:pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/retiros')}
          className="p-2 hover:bg-gray-200 rounded-lg"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Nuevo Retiro</h1>
      </div>

      {/* Modal de confirmación para duplicados */}
      {confirmDialog.show && confirmDialog.equipo && confirmDialog.equipoExistente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Equipo repetido</h3>
            <p className="text-gray-700 mb-4">
              Ya has agregado <strong>{confirmDialog.equipo.nombre}</strong> a la lista (cantidad actual: {confirmDialog.equipoExistente.cantidad}).
            </p>
            <p className="text-gray-600 mb-6">
              ¿Deseas sumar una unidad más a este equipo?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDialog({ show: false })}
                className="flex-1 px-4 py-2 border rounded-lg font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarSumarCantidad}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Sí, sumar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error global */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-start">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={(e) => { e.preventDefault(); handleGuardar(); }} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre del Retiro *</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Grabación en vivo 15/Sept"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Destino *</label>
          <input
            type="text"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            placeholder="Ej: Piso 2, Estudio A"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fecha devolución estimada</label>
          <input
            type="date"
            value={fechaDevolucion}
            onChange={(e) => setFechaDevolucion(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      {/* Equipos disponibles */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Equipos Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {equipos.map((equipo) => {
            const yaAgregado = selectedItems.find(item => item.inventario_id === equipo.id);
            return (
              <button
                key={equipo.id}
                onClick={() => agregarEquipo(equipo)}
                className={`p-3 border rounded-lg text-left transition ${
                  yaAgregado
                    ? 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-sm">{equipo.nombre}</div>
                <div className="text-xs text-gray-600">
                  {equipo.tipo_control === 'Stock' ? `Stock disponible: ${equipo.cantidad_total}` : 'Individual'}
                </div>
                {yaAgregado && (
                  <div className="text-xs text-blue-600 mt-1">
                    ✓ Agregado ({yaAgregado.cantidad} unidad{yaAgregado.cantidad > 1 ? 'es' : ''})
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Items seleccionados */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">
          Items Seleccionados ({selectedItems.length})
        </h2>
        {selectedItems.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Sin equipos seleccionados</p>
        ) : (
          <div className="space-y-2">
            {selectedItems.map((item) => (
              <div
                key={item.inventario_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="font-medium">{item.inventario?.nombre}</div>
                  <div className="text-xs text-gray-600">
                    {item.inventario?.tipo_control === 'Stock'
                      ? `Stock disponible: ${item.inventario.cantidad_total}`
                      : 'Equipo Individual'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) =>
                      actualizarCantidad(item.inventario_id, parseInt(e.target.value) || 1)
                    }
                    className="w-16 px-2 py-1 border rounded text-center"
                  />
                  <button
                    type="button"
                    onClick={() => quitarEquipo(item.inventario_id)}
                    className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botón guardar */}
      <div className="flex gap-2">
        <button
          onClick={() => navigate('/retiros')}
          className="flex-1 px-4 py-3 border rounded-lg font-medium hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          disabled={saving || selectedItems.length === 0 || !nombre.trim() || !destino.trim()}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          {saving ? 'Guardando...' : 'Crear Retiro'}
        </button>
      </div>
    </div>
  );
}
