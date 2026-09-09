import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Inventario, Categoria } from '../types';
import { Search, ChevronRight } from 'lucide-react';

export default function InventoryBrowserPage() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [allInventario, setAllInventario] = useState<Inventario[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cantidadEnRetiroPorEquipo, setCantidadEnRetiroPorEquipo] = useState<Record<string, number>>({});
  const [equiposEnFalla, setEquiposEnFalla] = useState<Set<string>>(new Set());
  const [cantidadEnFallaPorEquipo, setCantidadEnFallaPorEquipo] = useState<Record<string, number>>({});

  // Cargar categorías
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const { data, error: err } = await supabase
          .from('categorias')
          .select('*')
          .order('nombre');

        if (err) throw err;
        setCategorias(data || []);
      } catch (err) {
        console.error('Error fetching categorias:', err);
        setError('No se pudieron cargar las categorías');
      }
    };

    fetchCategorias();
  }, []);

  // Cargar TODOS los equipos una sola vez
  useEffect(() => {
    const fetchAllInventario = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('inventario')
          .select('*')
          .order('nombre');

        if (err) throw err;
        setAllInventario(data || []);

        // Cargar cantidad en retiros activos
        const { data: retiros, error: retError } = await supabase
          .from('retiros')
          .select('id')
          .in('estado', ['Preparado', 'Retirado']);

        if (retError) throw retError;

        const { data: itemsEnRetiro, error: itemsError } = await supabase
          .from('retiro_items')
          .select('inventario_id, cantidad_solicitada')
          .in('retiro_id', retiros?.map((r) => r.id) || []);

        if (itemsError) throw itemsError;

        // Mapear cantidad por inventario_id
        const mapaCantidad: Record<string, number> = {};
        (itemsEnRetiro || []).forEach((item) => {
          mapaCantidad[item.inventario_id] = (mapaCantidad[item.inventario_id] || 0) + item.cantidad_solicitada;
        });
        setCantidadEnRetiroPorEquipo(mapaCantidad);

        // Cargar equipos en falla desde MANTENIMIENTO
        const { data: enlFalla, error: fallaError } = await supabase
          .from('mantenimiento')
          .select('inventario_id, cantidad_en_falla')
          .in('estado', ['Reportado', 'En reparación']);

        if (fallaError) throw fallaError;

        // Crear Set de equipos únicos en falla y mapear cantidad
        const equiposEnFallaSet = new Set(enlFalla?.map((m) => m.inventario_id) || []);
        const mapaFalla: Record<string, number> = {};
        (enlFalla || []).forEach((m) => {
          mapaFalla[m.inventario_id] = (mapaFalla[m.inventario_id] || 0) + (m.cantidad_en_falla || 1);
        });
        setEquiposEnFalla(equiposEnFallaSet);
        setCantidadEnFallaPorEquipo(mapaFalla);
      } catch (err) {
        console.error('Error fetching inventario:', err);
        setError('No se pudieron cargar los equipos');
      } finally {
        setLoading(false);
      }
    };

    fetchAllInventario();
  }, []);

  // Filtrar inventario basado en categoría y búsqueda
  useEffect(() => {
    let filtered = allInventario;

    if (selectedCategoria) {
      filtered = filtered.filter((inv) => inv.categoria_id === selectedCategoria);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (inv) =>
          inv.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.marca?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.modelo?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setInventario(filtered);
  }, [selectedCategoria, searchQuery, allInventario]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
        <p className="text-gray-600 mt-2">Busca y consulta los equipos disponibles</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Search bar */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex items-center gap-3 border-2 border-gray-300 rounded-lg px-4 py-3 md:py-2 focus-within:border-blue-500">
          <Search size={20} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre, marca, modelo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none text-gray-900 text-base md:text-sm"
          />
        </div>
      </div>

      {/* Categorías */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtrar por categoría</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
          <button
            onClick={() => setSelectedCategoria(null)}
            className={`p-3 md:p-2 rounded-lg border-2 transition text-left font-medium text-sm md:text-base ${
              selectedCategoria === null
                ? 'bg-blue-50 border-blue-500 text-blue-900'
                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            Todas ({allInventario.length})
          </button>

          {categorias.map((cat) => {
            const count = allInventario.filter((inv) => inv.categoria_id === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoria(cat.id)}
                className={`p-3 md:p-2 rounded-lg border-2 transition text-left font-medium text-sm md:text-base ${
                  selectedCategoria === cat.id
                    ? 'bg-blue-50 border-blue-500 text-blue-900'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {cat.nombre} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Equipment list */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-600">Cargando equipos...</div>
        ) : inventario.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No se encontraron equipos
          </div>
        ) : (
          inventario.map((equipo) => (
            <button
              key={equipo.id}
              onClick={() => navigate(`/equipos/${equipo.id}`)}
              className="w-full bg-white rounded-lg shadow hover:shadow-md transition p-4 md:p-5 text-left border-l-4 border-blue-500 active:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-base md:text-lg break-words">{equipo.nombre}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {equipo.marca} {equipo.modelo && `- ${equipo.modelo}`}
                  </p>
                  {equipo.tipo_control === 'Stock' ? (
                    <div className="mt-3 space-y-1">
                      {(() => {
                        const cantidadEnRetiro = cantidadEnRetiroPorEquipo[equipo.id] || 0;
                        const cantidadEnFalla = cantidadEnFallaPorEquipo[equipo.id] || 0;
                        const disponibles = (equipo.cantidad_total || 0) - cantidadEnRetiro - cantidadEnFalla;
                        const hayRetiros = cantidadEnRetiro > 0;
                        const hayFalla = cantidadEnFalla > 0;

                        return (
                          <>
                            <p className={`text-sm font-bold ${(hayRetiros || hayFalla) ? 'text-red-600' : 'text-gray-600'}`}>
                              Disponibles: {disponibles} de {equipo.cantidad_total}
                            </p>
                            {hayRetiros && (
                              <p className="text-xs text-orange-600">
                                {cantidadEnRetiro} en retiro
                              </p>
                            )}
                            {hayFalla && (
                              <p className="text-xs text-red-600">
                                {cantidadEnFalla} en falla
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">ID: {equipo.id}</p>
                  )}
                  <div className="mt-3">
                    {(() => {
                      const cantidadEnRetiro = cantidadEnRetiroPorEquipo[equipo.id] || 0;
                      const hayRetiros = cantidadEnRetiro > 0;
                      const estaPenFalla = equiposEnFalla.has(equipo.id);
                      
                      let estadoMostrar: string;
                      if (estaPenFalla) {
                        estadoMostrar = 'En falla';
                      } else if (hayRetiros && equipo.estado === 'Disponible') {
                        estadoMostrar = 'Parcialmente disponible';
                      } else {
                        estadoMostrar = equipo.estado;
                      }

                      return (
                        <span
                          className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                            estadoMostrar === 'En falla'
                              ? 'bg-red-100 text-red-800'
                              : estadoMostrar === 'Parcialmente disponible'
                              ? 'bg-orange-100 text-orange-800'
                              : estadoMostrar === 'Disponible'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {estadoMostrar}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <ChevronRight size={24} className="text-gray-400 flex-shrink-0 mt-1" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
