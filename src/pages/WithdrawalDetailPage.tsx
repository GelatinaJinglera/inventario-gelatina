import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Retiro, RetiroItem, Inventario } from '../types';
import { ArrowLeft, Check } from 'lucide-react';

interface DevolucionState {
  itemId: string | null;
  cantidad: number;
}

export default function WithdrawalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [retiro, setRetiro] = useState<Retiro | null>(null);
  const [items, setItems] = useState<(RetiroItem & { inventario?: Inventario })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [devolviendo, setDevolviendo] = useState(false);
  const [devolucionState, setDevolucionState] = useState<DevolucionState>({
    itemId: null,
    cantidad: 0,
  });
  const [confirmarDevolverTodo, setConfirmarDevolverTodo] = useState(false);

  useEffect(() => {
    const fetchRetiro = async () => {
      try {
        setLoading(true);

        // Obtener retiro
        const { data: retiroData, error: retiroError } = await supabase
          .from('retiros')
          .select('*')
          .eq('id', id)
          .single();

        if (retiroError) throw retiroError;
        setRetiro(retiroData);

        // Obtener items del retiro
        const { data: itemsData, error: itemsError } = await supabase
          .from('retiro_items')
          .select(
            `
            *,
            inventario:inventario_id(*)
          `
          )
          .eq('retiro_id', id);

        if (itemsError) throw itemsError;
        setItems(itemsData || []);
      } catch (err) {
        console.error('Error:', err);
        setError('No se pudo cargar el retiro');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRetiro();
    }
  }, [id]);

  const handleIniciarDevolucion = (itemId: string, cantidadFaltante: number) => {
    setDevolucionState({
      itemId,
      cantidad: cantidadFaltante,
    });
  };

  const handleDevolverTodo = async () => {
    try {
      setDevolviendo(true);

      // Devolver todos los items con cantidad pendiente
      const itemsPendientes = items.filter(
        (item) => item.cantidad_solicitada - (item.cantidad_devuelta || 0) > 0
      );

      for (const item of itemsPendientes) {
        const cantidadFaltante = item.cantidad_solicitada - (item.cantidad_devuelta || 0);

        // Registrar movimiento de devolución
        await supabase.from('movimientos').insert({
          inventario_id: item.inventario_id,
          accion: 'Devolución',
          cantidad: cantidadFaltante,
          responsable_id: null,
          devolución_real: new Date().toISOString().split('T')[0],
          observaciones: `Devolución completa del retiro ${id}`,
          retiro_id: id,
        });

        // Actualizar item del retiro
        await supabase
          .from('retiro_items')
          .update({ cantidad_devuelta: item.cantidad_solicitada })
          .eq('id', item.id);
      }

      // Recargar items
      const { data: itemsData } = await supabase
        .from('retiro_items')
        .select(
          `
          *,
          inventario:inventario_id(*)
        `
        )
        .eq('retiro_id', id);

      setItems(itemsData || []);

      // Actualizar estado del retiro a "Devuelto"
      await supabase
        .from('retiros')
        .update({
          estado: 'Devuelto',
          fecha_cierre: new Date().toISOString().split('T')[0],
        })
        .eq('id', id);

      // Recargar retiro
      const { data: retiroData } = await supabase
        .from('retiros')
        .select('*')
        .eq('id', id)
        .single();

      setRetiro(retiroData);
      setConfirmarDevolverTodo(false);
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudo registrar la devolución completa');
    } finally {
      setDevolviendo(false);
    }
  };

  const handleConfirmarDevolucion = async () => {
    if (!devolucionState.itemId) return;

    try {
      setDevolviendo(true);

      const item = items.find((i) => i.id === devolucionState.itemId);
      if (!item) return;

      // Registrar movimiento de devolución
      await supabase.from('movimientos').insert({
        inventario_id: item.inventario_id,
        accion: 'Devolución',
        cantidad: devolucionState.cantidad,
        responsable_id: null,
        devolución_real: new Date().toISOString().split('T')[0],
        observaciones: `Devolución del retiro ${id}`,
        retiro_id: id,
      });

      // Actualizar item del retiro
      const newCantidadDevuelta = (item.cantidad_devuelta || 0) + devolucionState.cantidad;
      await supabase
        .from('retiro_items')
        .update({ cantidad_devuelta: newCantidadDevuelta })
        .eq('id', devolucionState.itemId);

      // Recargar items
      const { data: itemsData } = await supabase
        .from('retiro_items')
        .select(
          `
          *,
          inventario:inventario_id(*)
        `
        )
        .eq('retiro_id', id);

      setItems(itemsData || []);

      // Verificar si todo está devuelto
      const todosDevueltos = itemsData?.every(
        (i) => i.cantidad_devuelta === i.cantidad_solicitada
      );

      if (todosDevueltos) {
        // Actualizar estado del retiro a "Devuelto"
        await supabase
          .from('retiros')
          .update({
            estado: 'Devuelto',
            fecha_cierre: new Date().toISOString().split('T')[0],
          })
          .eq('id', id);

        // Recargar retiro
        const { data: retiroData } = await supabase
          .from('retiros')
          .select('*')
          .eq('id', id)
          .single();

        setRetiro(retiroData);
      } else if ((itemsData || []).some((i) => i.cantidad_devuelta && i.cantidad_devuelta > 0)) {
        // Actualizar estado a "Parcialmente devuelto"
        await supabase
          .from('retiros')
          .update({ estado: 'Parcialmente devuelto' })
          .eq('id', id);

        const { data: retiroData } = await supabase
          .from('retiros')
          .select('*')
          .eq('id', id)
          .single();

        setRetiro(retiroData);
      }

      // Limpiar state de devolución
      setDevolucionState({ itemId: null, cantidad: 0 });
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudo registrar la devolución');
    } finally {
      setDevolviendo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (error || !retiro) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/retiros')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} />
          Volver
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error || 'Retiro no encontrado'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/retiros')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
      >
        <ArrowLeft size={20} />
        Volver
      </button>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{retiro.nombre}</h1>
            <p className="text-gray-600 mt-2">ID: {retiro.id}</p>
          </div>
          <span
            className={`px-4 py-2 font-semibold rounded-lg ${
              retiro.estado === 'Devuelto'
                ? 'bg-green-100 text-green-800'
                : retiro.estado === 'Retirado'
                ? 'bg-yellow-100 text-yellow-800'
                : retiro.estado === 'Preparado'
                ? 'bg-blue-100 text-blue-800'
                : retiro.estado === 'Parcialmente devuelto'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {retiro.estado}
          </span>
        </div>

        {/* Detalles */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-600">Destino</p>
            <p className="font-semibold text-gray-900">{retiro.destino}</p>
          </div>
          {retiro.devolución_prevista && (
            <div>
              <p className="text-sm text-gray-600">Devolución prevista</p>
              <p className="font-semibold text-gray-900">
                {new Date(retiro.devolución_prevista).toLocaleDateString('es-AR')}
              </p>
            </div>
          )}
          {retiro.fecha_retiro && (
            <div>
              <p className="text-sm text-gray-600">Fecha de retiro</p>
              <p className="font-semibold text-gray-900">
                {new Date(retiro.fecha_retiro).toLocaleDateString('es-AR')}
              </p>
            </div>
          )}
          {retiro.fecha_cierre && (
            <div>
              <p className="text-sm text-gray-600">Fecha de cierre</p>
              <p className="font-semibold text-gray-900">
                {new Date(retiro.fecha_cierre).toLocaleDateString('es-AR')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación "Devolver todo" */}
      {confirmarDevolverTodo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">¿Devolver todo?</h3>
            <p className="text-gray-600 mb-6">
              Esto devolverá todos los equipos del retiro y lo marcará como completado.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDevolverTodo}
                disabled={devolviendo}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {devolviendo ? 'Procesando...' : 'Sí, devolver todo'}
              </button>
              <button
                onClick={() => setConfirmarDevolverTodo(false)}
                disabled={devolviendo}
                className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Equipos en el retiro</h2>
          {retiro.estado !== 'Devuelto' && items.length > 0 && (
            <button
              onClick={() => setConfirmarDevolverTodo(true)}
              disabled={items.every((item) => item.cantidad_devuelta === item.cantidad_solicitada)}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg text-sm transition"
            >
              Devolver todo
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No hay equipos en este retiro</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const cantidadFaltante = item.cantidad_solicitada - (item.cantidad_devuelta || 0);
              const mostrarFormulario = devolucionState.itemId === item.id;

              return (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {item.inventario?.nombre}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.inventario?.marca} {item.inventario?.modelo}
                      </p>
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Solicitada</p>
                            <p className="font-bold text-gray-900">{item.cantidad_solicitada}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Retirada</p>
                            <p className="font-bold text-gray-900">{item.cantidad_retirada || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Devuelta</p>
                            <p className="font-bold text-gray-900">{item.cantidad_devuelta || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botón o formulario de devolución */}
                  {cantidadFaltante > 0 && retiro.estado !== 'Devuelto' && (
                    <div className="mt-4">
                      {!mostrarFormulario ? (
                        <button
                          onClick={() => handleIniciarDevolucion(item.id, cantidadFaltante)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          <Check size={18} />
                          Devolver {cantidadFaltante === 1 ? '1 equipo' : `${cantidadFaltante} equipos`}
                        </button>
                      ) : (
                        <div className="space-y-3">
                          {cantidadFaltante > 1 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                ¿Cuántos devuelves?
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  max={cantidadFaltante}
                                  value={devolucionState.cantidad}
                                  onChange={(e) =>
                                    setDevolucionState({
                                      ...devolucionState,
                                      cantidad: Math.min(
                                        cantidadFaltante,
                                        Math.max(1, parseInt(e.target.value) || 1)
                                      ),
                                    })
                                  }
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                />
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={handleConfirmarDevolucion}
                              disabled={devolviendo}
                              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                            >
                              {devolviendo ? 'Procesando...' : 'Confirmar'}
                            </button>
                            <button
                              onClick={() => setDevolucionState({ itemId: null, cantidad: 0 })}
                              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {cantidadFaltante === 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-semibold">
                        ✓ Completamente devuelto
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Observaciones */}
      {retiro.observaciones && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Observaciones</h3>
          <p className="text-blue-800">{retiro.observaciones}</p>
        </div>
      )}
    </div>
  );
}
