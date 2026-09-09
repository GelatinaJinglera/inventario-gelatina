import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Retiro } from '../types';
import { Plus, Filter, ChevronRight } from 'lucide-react';

export default function WithdrawalsPage() {
  const navigate = useNavigate();
  const [retiros, setRetiros] = useState<Retiro[]>([]);
  const [filteredRetiros, setFilteredRetiros] = useState<Retiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const estados = ['Preparado', 'Retirado', 'Parcialmente devuelto', 'Devuelto', 'Cancelado'];

  useEffect(() => {
    const fetchRetiros = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('retiros')
          .select('*')
          .order('created_at', { ascending: false });

        if (err) throw err;
        setRetiros(data || []);
        setFilteredRetiros(data || []);
      } catch (err) {
        console.error('Error:', err);
        setError('No se pudieron cargar los retiros');
      } finally {
        setLoading(false);
      }
    };

    fetchRetiros();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = retiros;

    if (filterEstado) {
      filtered = filtered.filter((r) => r.estado === filterEstado);
    }

    setFilteredRetiros(filtered);
  }, [filterEstado, retiros]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Retiros</h1>
        <p className="text-gray-600 mt-2">Gestiona retiros de equipos y devoluciones</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Crear nuevo retiro */}
      <button
        onClick={() => navigate('/retiros/nuevo')}
        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center md:justify-start gap-2 transition text-base md:text-sm"
      >
        <Plus size={20} />
        Crear nuevo retiro
      </button>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base md:text-sm"
          >
            <option value="">Todos</option>
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
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

      {/* Lista de retiros */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-600">Cargando retiros...</div>
        ) : filteredRetiros.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No se encontraron retiros</div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              Mostrando <strong>{filteredRetiros.length}</strong> de <strong>{retiros.length}</strong> retiros
            </div>
            {filteredRetiros.map((retiro) => (
              <button
                key={retiro.id}
                onClick={() => navigate(`/retiros/${retiro.id}`)}
                className="w-full bg-white rounded-lg shadow hover:shadow-md transition p-4 text-left border-l-4 border-blue-500"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{retiro.nombre}</h3>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded ${
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
                    <p className="text-sm text-gray-600 mt-2">
                      Destino: <span className="font-semibold">{retiro.destino}</span>
                    </p>
                    {retiro.devolución_prevista && (
                      <p className="text-xs text-gray-500 mt-1">
                        Devolución prevista: {new Date(retiro.devolución_prevista).toLocaleDateString('es-AR')}
                      </p>
                    )}
                    {retiro.fecha_retiro && (
                      <p className="text-xs text-gray-500">
                        Retirado: {new Date(retiro.fecha_retiro).toLocaleDateString('es-AR')}
                      </p>
                    )}
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
