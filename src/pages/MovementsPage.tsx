import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Movimiento } from '../types';
import { Filter } from 'lucide-react';

export default function MovementsPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [filteredMovimientos, setFilteredMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterAccion, setFilterAccion] = useState('');
  const [filterFecha, setFilterFecha] = useState('');

  const acciones = ['Retiro', 'Devolución', 'Cambio ubicación', 'Alta', 'Baja', 'Falla', 'Mantenimiento'];

  useEffect(() => {
    const fetchMovimientos = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('movimientos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (err) throw err;
        setMovimientos(data || []);
        setFilteredMovimientos(data || []);
      } catch (err) {
        console.error('Error:', err);
        setError('No se pudieron cargar los movimientos');
      } finally {
        setLoading(false);
      }
    };

    fetchMovimientos();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = movimientos;

    if (filterAccion) {
      filtered = filtered.filter((m) => m.accion === filterAccion);
    }

    if (filterFecha) {
      filtered = filtered.filter((m) => {
        const movDate = new Date(m.created_at).toISOString().split('T')[0];
        return movDate === filterFecha;
      });
    }

    setFilteredMovimientos(filtered);
  }, [filterAccion, filterFecha, movimientos]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Movimientos</h1>
        <p className="text-gray-600 mt-2">Historial de retiros, devoluciones y cambios</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro por acción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de movimiento
            </label>
            <select
              value={filterAccion}
              onChange={(e) => setFilterAccion(e.target.value)}
              className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base md:text-sm"
            >
              <option value="">Todos</option>
              {acciones.map((accion) => (
                <option key={accion} value={accion}>
                  {accion}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={filterFecha}
              onChange={(e) => setFilterFecha(e.target.value)}
              className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base md:text-sm"
            />
          </div>
        </div>

        {/* Limpiar filtros */}
        {(filterAccion || filterFecha) && (
          <button
            onClick={() => {
              setFilterAccion('');
              setFilterFecha('');
            }}
            className="mt-4 px-4 py-2 text-sm md:text-base bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition font-medium"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Lista de movimientos */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-600">Cargando movimientos...</div>
        ) : filteredMovimientos.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No se encontraron movimientos</div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              Mostrando <strong>{filteredMovimientos.length}</strong> de <strong>{movimientos.length}</strong> movimientos
            </div>
            {filteredMovimientos.map((mov) => (
              <div key={mov.id} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Acción */}
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">ACCIÓN</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{mov.accion}</p>
                  </div>

                  {/* Equipo y cantidad */}
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">CANTIDAD / EQUIPO</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {mov.cantidad} {mov.inventario_id}
                    </p>
                  </div>

                  {/* Destino / Ubicación */}
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">DESTINO</p>
                    <p className="text-gray-900 mt-1">
                      {mov.destino || '—'}
                    </p>
                  </div>

                  {/* Fecha y hora */}
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">FECHA Y HORA</p>
                    <p className="text-gray-900 mt-1">
                      {new Date(mov.created_at).toLocaleDateString('es-AR')}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(mov.created_at).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {/* Observaciones (si existen) */}
                {mov.observaciones && (
                  <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                    <strong>Nota:</strong> {mov.observaciones}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
