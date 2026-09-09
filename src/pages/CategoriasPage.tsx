import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Categoria } from '../types';
import { ArrowLeft, Plus, Edit2, Trash2, X, Check, Search } from 'lucide-react';

export default function CategoriasPage() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  });

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');

      if (err) throw err;
      setCategorias(data || []);
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudieron cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleAgregar = () => {
    setEditando(null);
    setFormData({
      nombre: '',
      descripcion: '',
    });
    setMostrarFormulario(true);
  };

  const handleEditar = (categoria: Categoria) => {
    setEditando(categoria);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
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
          .from('categorias')
          .update({
            nombre: formData.nombre,
            descripcion: formData.descripcion || null,
          })
          .eq('id', editando.id);

        if (err) throw err;
      } else {
        // Crear
        const { error: err } = await supabase.from('categorias').insert({
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
        });

        if (err) {
          if (err.message.includes('duplicate key')) {
            setError('Esta categoría ya existe');
            setGuardando(false);
            return;
          }
          throw err;
        }
      }

      await fetchCategorias();
      setMostrarFormulario(false);
    } catch (err) {
      console.error('Error:', err);
      setError(`No se pudo ${editando ? 'editar' : 'agregar'} la categoría`);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!window.confirm('¿Eliminar esta categoría? No se puede deshacer.')) return;

    try {
      const { error: err } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id);

      if (err) throw err;
      await fetchCategorias();
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudo eliminar la categoría');
    }
  };

  const filtrados = categorias.filter(
    (c) =>
      c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Gestionar Categorías</h1>
          <p className="text-gray-600 mt-2">Total: {categorias.length} categorías</p>
        </div>
        <button
          onClick={handleAgregar}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center gap-2"
        >
          <Plus size={20} />
          Agregar categoría
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
                {editando ? 'Editar categoría' : 'Agregar categoría'}
              </h2>
              <button
                onClick={() => setMostrarFormulario(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

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
                  placeholder="Ej: Video"
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
                  placeholder="Ej: Equipos de video y cámaras"
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

      {/* Tabla de categorías */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Búsqueda */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-600">Cargando categorías...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            {searchQuery ? 'No se encontraron categorías.' : 'No hay categorías. Agrega una para comenzar.'}
          </div>
        ) : (
          <>
            <div className="px-6 py-3 bg-gray-50 border-b text-sm text-gray-600">
              Mostrando {filtrados.length} de {categorias.length} categorías
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Nombre</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Descripción</th>
                    <th className="text-center px-6 py-3 font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((categoria) => (
                    <tr key={categoria.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-3 font-medium text-gray-900">{categoria.nombre}</td>
                      <td className="px-6 py-3 text-gray-600 max-w-xs truncate">
                        {categoria.descripcion || '—'}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEditar(categoria)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded transition"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleEliminar(categoria.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded transition"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
