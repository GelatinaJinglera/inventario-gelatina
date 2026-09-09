import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Ubicacion } from '../types';
import { ArrowLeft, Plus, Edit2, Trash2, X, Check, ChevronDown, ChevronRight } from 'lucide-react';

interface UbicacionTree extends Ubicacion {
  hijos: UbicacionTree[];
}

export default function UbicacionesPage() {
  const navigate = useNavigate();
  const [ubicaciones, setUbicaciones] = useState<UbicacionTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<Ubicacion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [tipoAgregando, setTipoAgregando] = useState<string>('Sede');
  const [padreSelecionado, setPadreSelecionado] = useState<Ubicacion | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  });

  const tiposOrdenados = ['Sede', 'Ambiente', 'Sector', 'Mueble', 'Posición'];

  useEffect(() => {
    fetchUbicaciones();
  }, []);

  const fetchUbicaciones = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('ubicaciones')
        .select('*')
        .order('nombre');

      if (err) throw err;

      // Construir árbol jerárquico
      const tree = construirArbol(data || []);
      setUbicaciones(tree);
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudieron cargar las ubicaciones');
    } finally {
      setLoading(false);
    }
  };

  const construirArbol = (items: Ubicacion[]): UbicacionTree[] => {
    const map = new Map<string, UbicacionTree>();
    const raices: UbicacionTree[] = [];

    items.forEach((item) => {
      map.set(item.id, { ...item, hijos: [] });
    });

    items.forEach((item) => {
      const nodo = map.get(item.id)!;
      if (item.padre_id) {
        map.get(item.padre_id)?.hijos.push(nodo);
      } else {
        raices.push(nodo);
      }
    });

    raices.sort((a, b) => a.nombre.localeCompare(b.nombre));
    raices.forEach((r) => ordenarArbol(r));
    return raices;
  };

  const ordenarArbol = (nodo: UbicacionTree) => {
    nodo.hijos.sort((a, b) => a.nombre.localeCompare(b.nombre));
    nodo.hijos.forEach(ordenarArbol);
  };

  const obtenerSiguienteTipo = (tipo: string): string => {
    const idx = tiposOrdenados.indexOf(tipo);
    return idx >= 0 && idx < tiposOrdenados.length - 1 ? tiposOrdenados[idx + 1] : tipo;
  };

  const handleAgregar = (padre?: Ubicacion) => {
    setEditando(null);
    setPadreSelecionado(padre || null);
    setTipoAgregando(padre ? obtenerSiguienteTipo(padre.tipo) : 'Sede');
    setFormData({
      nombre: '',
      descripcion: '',
    });
    setMostrarFormulario(true);
  };

  const handleEditar = (ubicacion: Ubicacion) => {
    setEditando(ubicacion);
    setPadreSelecionado(null);
    setFormData({
      nombre: ubicacion.nombre,
      descripcion: ubicacion.descripcion || '',
    });
    setMostrarFormulario(true);
  };

  const handleGuardar = async () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    try {
      setGuardando(true);
      setError('');

      if (editando) {
        // Editar
        const { error: err } = await supabase
          .from('ubicaciones')
          .update({
            nombre: formData.nombre,
            descripcion: formData.descripcion || null,
          })
          .eq('id', editando.id);

        if (err) throw err;
      } else {
        // Crear
        const { error: err } = await supabase.from('ubicaciones').insert({
          nombre: formData.nombre,
          tipo: tipoAgregando,
          descripcion: formData.descripcion || null,
          padre_id: padreSelecionado?.id || null,
        });

        if (err) {
          if (err.message.includes('duplicate key')) {
            setError('Esta ubicación ya existe');
            setGuardando(false);
            return;
          }
          throw err;
        }
      }

      await fetchUbicaciones();
      setMostrarFormulario(false);
    } catch (err) {
      console.error('Error:', err);
      setError(`No se pudo ${editando ? 'editar' : 'agregar'} la ubicación`);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string, tieneHijos: boolean) => {
    if (tieneHijos) {
      setError('No se puede eliminar una ubicación que contiene otras');
      return;
    }

    if (!window.confirm('¿Eliminar esta ubicación? No se puede deshacer.')) return;

    try {
      const { error: err } = await supabase
        .from('ubicaciones')
        .delete()
        .eq('id', id);

      if (err) throw err;
      await fetchUbicaciones();
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudo eliminar la ubicación');
    }
  };

  const toggleExpandido = (id: string) => {
    const nuevo = new Set(expandidos);
    if (nuevo.has(id)) {
      nuevo.delete(id);
    } else {
      nuevo.add(id);
    }
    setExpandidos(nuevo);
  };

  const obtenerColorTipo = (tipo: string) => {
    const colores: Record<string, string> = {
      Sede: 'bg-red-100 text-red-800',
      Ambiente: 'bg-blue-100 text-blue-800',
      Sector: 'bg-green-100 text-green-800',
      Mueble: 'bg-purple-100 text-purple-800',
      Posición: 'bg-yellow-100 text-yellow-800',
    };
    return colores[tipo] || 'bg-gray-100 text-gray-800';
  };

  const renderNodo = (nodo: UbicacionTree, nivel: number = 0) => {
    const tieneHijos = nodo.hijos.length > 0;
    const expandido = expandidos.has(nodo.id);

    return (
      <div key={nodo.id}>
        <div
          className="flex items-center gap-2 p-3 hover:bg-gray-50 border-b"
          style={{ paddingLeft: `${12 + nivel * 24}px` }}
        >
          {tieneHijos ? (
            <button
              onClick={() => toggleExpandido(nodo.id)}
              className="text-gray-600 hover:text-gray-900"
            >
              {expandido ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <div className="w-[18px]" />
          )}

          <span className={`px-2 py-1 rounded text-xs font-semibold ${obtenerColorTipo(nodo.tipo)}`}>
            {nodo.tipo}
          </span>

          <div className="flex-1">
            <div className="font-medium text-gray-900">{nodo.nombre}</div>
            {nodo.descripcion && <div className="text-sm text-gray-600">{nodo.descripcion}</div>}
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => handleAgregar(nodo)}
              className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded transition"
              title={`Agregar ${obtenerSiguienteTipo(nodo.tipo).toLowerCase()}`}
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => handleEditar(nodo)}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded transition"
              title="Editar"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleEliminar(nodo.id, tieneHijos)}
              disabled={tieneHijos}
              className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              title={tieneHijos ? 'No se puede eliminar (tiene hijos)' : 'Eliminar'}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {tieneHijos && expandido && (
          <div>
            {nodo.hijos.map((hijo) => renderNodo(hijo, nivel + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
      >
        <ArrowLeft size={20} />
        Volver
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestionar Ubicaciones</h1>
          <p className="text-gray-600 mt-2">Estructura jerárquica: Sede → Ambiente → Sector → Mueble → Posición</p>
        </div>
        <button
          onClick={() => handleAgregar()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center gap-2"
        >
          <Plus size={20} />
          Agregar sede
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Modal formulario */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {editando ? 'Editar ubicación' : `Agregar ${tipoAgregando.toLowerCase()}`}
              </h2>
              <button
                onClick={() => setMostrarFormulario(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {!editando && padreSelecionado && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-900">
                  <div className="font-semibold">Padre:</div>
                  <div>{padreSelecionado.nombre}</div>
                  <div className="text-xs mt-1">
                    Nuevo tipo: <span className={`px-2 py-0.5 rounded ${obtenerColorTipo(tipoAgregando)}`}>{tipoAgregando}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={`Ej: ${tipoAgregando === 'Sede' ? 'Estudio A' : 'Armario'}`}
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
                  placeholder="Detalles adicionales (opcional)"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={() => setMostrarFormulario(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Árbol de ubicaciones */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-gray-600">Cargando ubicaciones...</div>
        ) : ubicaciones.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No hay ubicaciones. Agrega una sede para comenzar.
          </div>
        ) : (
          <>
            <div className="px-6 py-3 bg-gray-50 border-b text-sm text-gray-600 font-semibold">
              📍 Estructura de ubicaciones (clickea para expandir)
            </div>
            <div>{ubicaciones.map((nodo) => renderNodo(nodo))}</div>
          </>
        )}
      </div>

      {/* Legenda */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Tipos de ubicación:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {tiposOrdenados.map((tipo) => (
            <div key={tipo} className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${obtenerColorTipo(tipo)}`}>
                {tipo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
