import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Mantenimiento, Inventario } from '../types';
import { ArrowLeft, Check } from 'lucide-react';

interface MantenimientoDetalle extends Mantenimiento {
  inventario?: Inventario;
}

export default function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mantenimiento, setMantenimiento] = useState<MantenimientoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reparando, setReparando] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [notaReparacion, setNotaReparacion] = useState('');
  const [cantidadReparada, setCantidadReparada] = useState(1);
  const [editandoEstado, setEditandoEstado] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState<'Reportado' | 'En reparación' | 'Resuelto'>('Reportado');

  useEffect(() => {
    const fetchMantenimiento = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('mantenimiento')
          .select(
            `
            *,
            inventario:inventario_id(*)
          `
          )
          .eq('id', id)
          .single();

        if (err) throw err;
        setMantenimiento(data);
      } catch (err) {
        console.error('Error:', err);
        setError('No se pudo cargar el mantenimiento');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMantenimiento();
    }
  }, [id]);

  const handleCambiarEstado = async (nuevoEst: 'Reportado' | 'En reparación' | 'Resuelto') => {
    if (!mantenimiento) return;

    try {
      await supabase
        .from('mantenimiento')
        .update({ estado: nuevoEst })
        .eq('id', mantenimiento.id);

      // Recargar mantenimiento
      const { data } = await supabase
        .from('mantenimiento')
        .select(
          `
          *,
          inventario:inventario_id(*)
        `
        )
        .eq('id', id)
        .single();

      setMantenimiento(data);
      setEditandoEstado(false);
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudo cambiar el estado');
    }
  };

  const handleMarcarReparado = async () => {
    if (!mantenimiento) return;

    try {
      setReparando(true);

      const cantidadRestante = (mantenimiento.cantidad_en_falla || 1) - cantidadReparada;
      const esReparacionCompleta = cantidadRestante === 0;

      // Actualizar mantenimiento
      await supabase
        .from('mantenimiento')
        .update({
          estado: esReparacionCompleta ? 'Resuelto' : 'Reportado', // Siempre Reportado si no está completo
          solucion_notas: notaReparacion || null,
          cantidad_en_falla: cantidadRestante > 0 ? cantidadRestante : 0,
        })
        .eq('id', mantenimiento.id);

      // Crear movimiento de reparación
      await supabase.from('movimientos').insert({
        inventario_id: mantenimiento.inventario_id,
        accion: 'Mantenimiento',
        cantidad: cantidadReparada,
        observaciones: `Reparación ${esReparacionCompleta ? 'completa' : 'parcial'} (${cantidadReparada} de ${mantenimiento.cantidad_en_falla} equipos)${notaReparacion ? ': ' + notaReparacion : ''}`,
      });

      // Recargar mantenimiento
      const { data } = await supabase
        .from('mantenimiento')
        .select(
          `
          *,
          inventario:inventario_id(*)
        `
        )
        .eq('id', id)
        .single();

      setMantenimiento(data);
      setMostrarConfirmar(false);
      setNotaReparacion('');
      setCantidadReparada(1);
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudo marcar como reparado');
    } finally {
      setReparando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (error || !mantenimiento) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/mantenimiento')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} />
          Volver
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error || 'Mantenimiento no encontrado'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/mantenimiento')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
      >
        <ArrowLeft size={20} />
        Volver
      </button>

      {/* Header */}
      <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${
        mantenimiento.estado === 'Resuelto'
          ? 'border-green-500'
          : 'border-red-500'
      }`}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {mantenimiento.inventario?.nombre}
            </h1>
            <p className="text-gray-600 mt-2">
              {mantenimiento.inventario?.marca} {mantenimiento.inventario?.modelo}
            </p>
          </div>
          <div>
            {editandoEstado ? (
              <div className="flex flex-col gap-2">
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value as 'Reportado' | 'En reparación' | 'Resuelto')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  <option value="Reportado">Reportado</option>
                  <option value="En reparación">En reparación</option>
                  <option value="Resuelto">Resuelto</option>
                </select>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleCambiarEstado(nuevoEstado)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-2 rounded transition"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setEditandoEstado(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm py-1 px-2 rounded transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditandoEstado(true);
                  setNuevoEstado(mantenimiento.estado as 'Reportado' | 'En reparación' | 'Resuelto');
                }}
                className={`px-4 py-2 font-semibold rounded-lg hover:opacity-80 transition cursor-pointer ${
                  mantenimiento.estado === 'Resuelto'
                    ? 'bg-green-100 text-green-800'
                    : mantenimiento.estado === 'En reparación'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {mantenimiento.estado}
              </button>
            )}
          </div>
        </div>

        {/* Detalles */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-600">Reportado</p>
            <p className="font-semibold text-gray-900">
              {new Date(mantenimiento.created_at).toLocaleDateString('es-AR')}
            </p>
          </div>
          {mantenimiento.cantidad_en_falla && (
            <div>
              <p className="text-sm text-gray-600">Cantidad en falla</p>
              <p className="font-semibold text-gray-900">{mantenimiento.cantidad_en_falla}</p>
            </div>
          )}
          {mantenimiento.fecha_resolucion && (
            <div>
              <p className="text-sm text-gray-600">Fecha de retorno prevista</p>
              <p className="font-semibold text-gray-900">
                {new Date(mantenimiento.fecha_resolucion).toLocaleDateString('es-AR')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Descripción */}
      {mantenimiento.problema && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Descripción del problema</h2>
          <p className="text-gray-700">{mantenimiento.problema}</p>
        </div>
      )}

      {/* Foto */}
      {mantenimiento.foto_drive_id && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Foto del problema</h2>
          <img
            src={mantenimiento.foto_drive_id}
            alt="Foto del problema"
            className="w-full max-h-96 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Notas de reparación */}
      {mantenimiento.solucion_notas && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-2">Notas de reparación</h3>
          <p className="text-green-800">{mantenimiento.solucion_notas}</p>
        </div>
      )}

      {/* Botón marcar como reparado */}
      {mantenimiento.estado !== 'Resuelto' && (
        <div className="bg-white rounded-lg shadow p-6">
          {!mostrarConfirmar ? (
            <button
              onClick={() => setMostrarConfirmar(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Check size={20} />
              Marcar como reparado
            </button>
          ) : (
            <div className="space-y-4">
              {mantenimiento.inventario?.tipo_control === 'Stock' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Cuántos se repararon?
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={mantenimiento.inventario?.cantidad_total}
                    value={cantidadReparada}
                    onChange={(e) => setCantidadReparada(Math.min(mantenimiento.inventario?.cantidad_total || 1, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas de reparación (opcional)
                </label>
                <textarea
                  value={notaReparacion}
                  onChange={(e) => setNotaReparacion(e.target.value)}
                  placeholder="Describe qué se reparó, qué se reemplazó, etc"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none h-24"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleMarcarReparado}
                  disabled={reparando}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  {reparando ? 'Procesando...' : 'Confirmar reparación'}
                </button>
                <button
                  onClick={() => {
                    setMostrarConfirmar(false);
                    setNotaReparacion('');
                    setCantidadReparada(1);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
