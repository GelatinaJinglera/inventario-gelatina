import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Inventario, Categoria, Ubicacion } from '../types';
import { ArrowLeft, Plus, Edit2, Trash2, X, Check, Search, Image as ImageIcon } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';

export default function EquiposPage() {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState<Inventario[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<Inventario | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    marca: '',
    modelo: '',
    categoria_id: '',
    cantidad_total: 1,
    tipo_control: 'Stock' as 'Stock' | 'Individual',
    numero_serie: '',
    fecha_compra: '',
    proveedor: '',
    valor_unitario: 0,
    ubicacion_id: '',
    observaciones: '',
  });

  const [fotoDriveId, setFotoDriveId] = useState<string | null>(null);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [equiposRes, categoriasRes, ubicacionesRes] = await Promise.all([
        supabase.from('inventario').select('*').order('nombre'),
        supabase.from('categorias').select('*').order('nombre'),
        supabase.from('ubicaciones').select('*').order('nombre'),
      ]);

      if (equiposRes.error) throw equiposRes.error;
      if (categoriasRes.error) throw categoriasRes.error;
      if (ubicacionesRes.error) throw ubicacionesRes.error;

      setEquipos(equiposRes.data || []);
      setCategorias(categoriasRes.data || []);
      setUbicaciones(ubicacionesRes.data || []);
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAgregar = () => {
    setEditando(null);
    setFormData({
      nombre: '',
      marca: '',
      modelo: '',
      categoria_id: '',
      cantidad_total: 1,
      tipo_control: 'Stock',
      numero_serie: '',
      fecha_compra: '',
      proveedor: '',
      valor_unitario: 0,
      ubicacion_id: '',
      observaciones: '',
    });
    setFotoDriveId(null);
    setFotoPreviewUrl(null);
    setMostrarFormulario(true);
  };

  const handleEditar = (equipo: Inventario) => {
    setEditando(equipo);
    setFormData({
      nombre: equipo.nombre,
      marca: equipo.marca,
      modelo: equipo.modelo,
      categoria_id: equipo.categoria_id,
      cantidad_total: equipo.cantidad_total,
      tipo_control: equipo.tipo_control,
      numero_serie: equipo.numero_serie || '',
      fecha_compra: equipo.fecha_compra || '',
      proveedor: equipo.proveedor || '',
      valor_unitario: equipo.valor_unitario || 0,
      ubicacion_id: equipo.ubicacion_id,
      observaciones: equipo.observaciones || '',
    });
    setFotoDriveId(equipo.foto_principal_drive_id || null);
    setFotoPreviewUrl(equipo.foto_principal_url || null);
    setMostrarFormulario(true);
  };

  const handleGuardar = async () => {
    if (!formData.nombre.trim() || !formData.categoria_id || !formData.ubicacion_id) {
      setError('Completa los campos obligatorios');
      return;
    }

    try {
      setGuardando(true);
      setError('');

      const dataConFoto = {
        ...formData,
        fecha_compra: formData.fecha_compra || null,
        foto_principal_drive_id: fotoDriveId,
        foto_principal_url: fotoPreviewUrl,
      };

      if (editando) {
        // Editar
        const { error: err } = await supabase
          .from('inventario')
          .update(dataConFoto)
          .eq('id', editando.id);

        if (err) throw err;
      } else {
        // Crear
        const { error: err } = await supabase
          .from('inventario')
          .insert({
            ...dataConFoto,
            responsable_id: 'temp', // Por ahora
            estado: 'Disponible',
          });

        if (err) throw err;
      }

      await fetchData();
      setMostrarFormulario(false);
    } catch (err) {
      console.error('Error:', err);
      setError(`No se pudo ${editando ? 'editar' : 'agregar'} el equipo`);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!window.confirm('¿Eliminar este equipo? No se puede deshacer.')) return;

    try {
      const { error: err } = await supabase
        .from('inventario')
        .delete()
        .eq('id', id);

      if (err) throw err;
      await fetchData();
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudo eliminar el equipo');
    }
  };

  const getNombreCategoria = (id: string) => {
    return categorias.find((c) => c.id === id)?.nombre || id;
  };

  const getNombreUbicacion = (id: string) => {
    return ubicaciones.find((u) => u.id === id)?.nombre || id;
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
          <h1 className="text-3xl font-bold text-gray-900">Gestionar Equipos</h1>
          <p className="text-gray-600 mt-2">Total: {equipos.length} equipos</p>
        </div>
        <button
          onClick={handleAgregar}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center gap-2"
        >
          <Plus size={20} />
          Agregar equipo
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
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {editando ? 'Editar equipo' : 'Agregar equipo'}
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
                  placeholder="Ej: Cámara Sony A7"
                />
              </div>

              {/* Marca y Modelo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej: Sony"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej: A7 III"
                  />
                </div>
              </div>

              {/* Categoría y Ubicación */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación *
                  </label>
                  <select
                    value={formData.ubicacion_id}
                    onChange={(e) => setFormData({ ...formData, ubicacion_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    {ubicaciones.map((ub) => (
                      <option key={ub.id} value={ub.id}>
                        {ub.nombre} ({ub.tipo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tipo control y Cantidad */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={formData.tipo_control}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo_control: e.target.value as 'Stock' | 'Individual' })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Stock">Stock</option>
                    <option value="Individual">Individual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.cantidad_total}
                    onChange={(e) => setFormData({ ...formData, cantidad_total: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Número de serie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de serie
                </label>
                <input
                  type="text"
                  value={formData.numero_serie}
                  onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Fecha compra y Proveedor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de compra
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_compra}
                    onChange={(e) => setFormData({ ...formData, fecha_compra: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={formData.proveedor}
                    onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Valor unitario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor unitario ($)
                </label>
                <input
                  type="number"
                  value={formData.valor_unitario}
                  onChange={(e) => setFormData({ ...formData, valor_unitario: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
                />
              </div>

              {/* Foto del Equipo */}
              <div className="pt-4 border-t">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-4">
                  <ImageIcon size={20} />
                  Foto del Equipo
                </label>
                <ImageUpload
                  onImageUpload={(driveId, previewUrl) => {
                    setFotoDriveId(driveId);
                    setFotoPreviewUrl(previewUrl);
                  }}
                  nombreEquipo={formData.nombre || 'equipo'}
                  imagenActual={fotoPreviewUrl || undefined}
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

      {/* Tabla de equipos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Búsqueda */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, marca o modelo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-600">Cargando equipos...</div>
        ) : equipos.filter((eq) =>
            eq.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            eq.marca?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            eq.modelo?.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            {searchQuery ? 'No se encontraron equipos.' : 'No hay equipos. Agrega uno para comenzar.'}
          </div>
        ) : (
          <>
            <div className="px-6 py-3 bg-gray-50 border-b text-sm text-gray-600">
              Mostrando {equipos.filter((eq) =>
                eq.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                eq.marca?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                eq.modelo?.toLowerCase().includes(searchQuery.toLowerCase())
              ).length} de {equipos.length} equipos
            </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-gray-700">Nombre</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-700">Marca</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-700">Categoría</th>
                  <th className="text-center px-6 py-3 font-semibold text-gray-700">Cantidad</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-700">Ubicación</th>
                  <th className="text-center px-6 py-3 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {equipos
                  .filter((eq) =>
                    eq.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    eq.marca?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    eq.modelo?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((equipo) => (
                  <tr key={equipo.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-3 font-medium text-gray-900">{equipo.nombre}</td>
                    <td className="px-6 py-3 text-gray-600">{equipo.marca}</td>
                    <td className="px-6 py-3 text-gray-600">
                      {getNombreCategoria(equipo.categoria_id)}
                    </td>
                    <td className="px-6 py-3 text-center font-semibold text-gray-900">
                      {equipo.cantidad_total}
                    </td>
                    <td className="px-6 py-3 text-gray-600 text-sm">
                      {getNombreUbicacion(equipo.ubicacion_id)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEditar(equipo)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded transition"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleEliminar(equipo.id)}
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
