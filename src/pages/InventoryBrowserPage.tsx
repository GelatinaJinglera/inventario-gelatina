import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useRealtimeInventario } from '../hooks/useRealtimeInventario';
import { Inventario, Categoria } from '../types';
import { Search, ChevronRight } from 'lucide-react';

export default function InventoryBrowserPage() {
  const navigate = useNavigate();
  const { equipos: allInventario, loading: inventarioLoading } = useRealtimeInventario();
  
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Cuando inventario cambia, recalcular retiros y fallas
  useEffect(() => {
    const fetchDependencies = async () => {
      try {
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

        const mapaCantidad: Record<string, number> = {};
        (itemsEnRetiro || []).forEach((item) => {
          mapaCantidad[item.inventario_id] = (mapaCantidad[item.inventario_id] || 0) + item.cantidad_solicitada;
        });
        setCantidadEnRetiroPorEquipo(mapaCantidad);

        // Cargar equipos en falla
        const { data: enlFalla, error: fallaError } = await supabase
          .from('mantenimiento')
          .select('inventario_id, cantidad_en_falla')
          .in('estado', ['Reportado', 'En reparación']);

        if (fallaError) throw fallaError;

        const equiposEnFallaSet = new Set<string>();
        const mapaCantidadFalla: Record<string, number> = {};
        (enlFalla || []).forEach((item) => {
          equiposEnFallaSet.add(item.inventario_id);
          mapaCantidadFalla[item.inventario_id] = (mapaCantidadFalla[item.inventario_id] || 0) + item.cantidad_en_falla;
        });

        setEquiposEnFalla(equiposEnFallaSet);
        setCantidadEnFallaPorEquipo(mapaCantidadFalla);
      } catch (err) {
        console.error('Error fetching dependencies:', err);
      }
    };

    fetchDependencies();
  }, [allInventario]);

  // Filtrar por categoría y búsqueda
  useEffect(() => {
    let filtered = allInventario;

    if (selectedCategoria) {
      filtered = filtered.filter((e) => e.categoria_id === selectedCategoria);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.nombre.toLowerCase().includes(q) ||
          e.marca?.toLowerCase().includes(q) ||
          e.modelo?.toLowerCase().includes(q)
      );
    }

    setInventario(filtered);
  }, [allInventario, selectedCategoria, searchQuery]);

  if (inventarioLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Inventario</h1>
        <p className="text-gray-600">Gestiona y consulta los equipos disponibles</p>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre, marca, modelo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Categorías */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategoria(null)}
          className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
            selectedCategoria === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Todas
        </button>
        {categorias.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoria(cat.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
              selectedCategoria === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Equipos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventario.map((equipo) => {
          const enFalla = equiposEnFalla.has(equipo.id);
          const cantFalla = cantidadEnFallaPorEquipo[equipo.id] || 0;
          const cantRetiro = cantidadEnRetiroPorEquipo[equipo.id] || 0;

          return (
            <div
              key={equipo.id}
              onClick={() => navigate(`/equipos/${equipo.id}`)}
              className={`p-4 rounded-lg border cursor-pointer transition transform hover:scale-105 ${
                enFalla
                  ? 'bg-red-50 border-red-300'
                  : equipo.estado === 'Disponible'
                  ? 'bg-white border-gray-300 hover:shadow-lg'
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              {equipo.foto_principal_url && (
                <img
                  src={equipo.foto_principal_url}
                  alt={equipo.nombre}
                  className="w-full h-40 object-cover rounded mb-3"
                />
              )}

              <h3 className="font-bold text-lg mb-1">{equipo.nombre}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {equipo.marca} {equipo.modelo}
              </p>

              {equipo.tipo_control === 'Stock' && (
                <p className="text-sm font-semibold text-blue-600 mb-2">
                  Stock: {equipo.cantidad_total}
                </p>
              )}

              {enFalla && (
                <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-sm">
                  <span className="text-red-700 font-semibold">En falla: {cantFalla}</span>
                </div>
              )}

              {cantRetiro > 0 && (
                <div className="mb-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm">
                  <span className="text-yellow-700">En retiro: {cantRetiro}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    equipo.estado === 'Disponible'
                      ? 'bg-green-100 text-green-800'
                      : equipo.estado === 'En falla'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {equipo.estado}
                </span>
                <ChevronRight size={20} className="text-gray-400" />
              </div>
            </div>
          );
        })}
      </div>

      {inventario.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay equipos para mostrar</p>
        </div>
      )}
    </div>
  );
}
