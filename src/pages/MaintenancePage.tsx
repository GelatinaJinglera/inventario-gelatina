import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Mantenimiento, Inventario } from '../types';
import { AlertCircle, ChevronRight, Filter } from 'lucide-react';

interface MantenimientoConEquipo extends Mantenimiento {
  inventario?: Inventario;
}

export default function MaintenancePage() {
  const navigate = useNavigate();
  const [mantenimientos, setMantenimientos] = useState<MantenimientoConEquipo[]>([]);
  const [filteredMantenimientos, setFilteredMantenimientos] = useState<MantenimientoConEquipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  useEffect(() => {
    const fetchMantenimientos = async () => {
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
          .order('created_at', { ascending: false });

        if (err) throw err;
        setMantenimientos(data || []);
      } catch (err) {
        console.error('Error:', err);
        setError('No se pudieron cargar los mantenimientos');
      } finally {
        setLoading(false);
      }
    };

    fetchMantenimientos();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = mantenimientos;

    if (filterEstado) {
      filtered = filtered.filter((m) => m.estado === filterEstado);
    }

    setFilteredMantenimientos(filtered);
  }, [filterEstado, mantenimientos]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mantenimiento</h1>
        <p className="text-gray-600 mt-2">Gestiona equipos en falla y reparaciones</p>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base md:text-sm"
          >
            <option value="">Todos</option>
            <option value="Reportado">Reportado</option>
            <option value="En reparación">En reparación</option>
            <option value="Resuelto">Resuelto</option>
          </select>
        </div>

        {filterEstado && (
          <button
            onClick={() => setFilterEstado('')}
            className="mt-4 px-4 py-2 text-sm md:text-base bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition font-medium"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Lista de mantenimientos */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-600">Cargando mantenimientos...</div>
        ) : filteredMantenimientos.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No hay mantenimientos registrados</div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              Mostrando <strong>{filteredMantenimientos.length}</strong> de{' '}
              <strong>{mantenimientos.length}</strong> registros
            </div>
            {filteredMantenimientos.map((mantenimiento) => (
              <button
                key={mantenimiento.id}
                onClick={() => navigate(`/mantenimiento/${mantenimiento.id}`)}
                className={`w-full bg-white rounded-lg shadow hover:shadow-md transition p-4 text-left border-l-4 ${
                  mantenimiento.estado === 'Resuelto'
                    ? 'border-green-500'
                    : 'border-red-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {mantenimiento.estado !== 'Resuelto' && (
                        <AlertCircle size={20} className="text-red-600" />
                      )}
                      <h3 className="font-semibold text-gray-900">
                        {mantenimiento.inventario?.nombre}
                        {mantenimiento.cantidad_en_falla && mantenimiento.cantidad_en_falla > 1 && (
                          <span className="text-sm text-gray-600 ml-2">
                            ({mantenimiento.cantidad_en_falla} en falla)
                          </span>
                        )}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          mantenimiento.estado === 'Resuelto'
                            ? 'bg-green-100 text-green-800'
                            : mantenimiento.estado === 'En reparación'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {mantenimiento.estado}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {mantenimiento.inventario?.marca} {mantenimiento.inventario?.modelo}
                    </p>
                    {mantenimiento.problema && (
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                        {mantenimiento.problema}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Reportado: {new Date(mantenimiento.created_at).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <ChevronRight size={24} className="text-gray-400" />
                </div>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
