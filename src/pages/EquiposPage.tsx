import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useRealtimeInventario } from '../hooks/useRealtimeInventario';
import { Inventario, Categoria, Ubicacion } from '../types';
import { ArrowLeft, Plus, Edit2, Trash2, Search } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';

export default function EquiposPage() {
  const navigate = useNavigate();
  const { equipos, refetch } = useRealtimeInventario();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
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
    tipo_control: 'Individual' as 'Stock' | 'Individual',
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
      const [categoriasRes, ubicacionesRes] = await Promise.all([
        supabase.from('categorias').select('*').order('nombre'),
        supabase.from('ubicaciones').select('*').order('nombre'),
      ]);

      if (categoriasRes.error) throw categoriasRes.error;
      if (ubicacionesRes.error) throw ubicacionesRes.error;

      setCategorias(categoriasRes.data || []);
      setUbicaciones(ubicacionesRes.data || []);
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudieron cargar los datos');
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
      tipo_control: 'Individual',
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

      // Auto-cambiar a Stock si cantidad_total > 1
      const tipoControl = formData.cantidad_total > 1 ? 'Stock' : formData.tipo_control;

      const dataConFoto = {
        ...formData,
        tipo_control: tipoControl,
        fecha_compra: formData.fecha_compra || null,
        foto_principal_drive_id: fotoDriveId,
        foto_principal_url: fotoPreviewUrl,
      };

      if (editando) {
        const { error: err } = await supabase
          .from('inventario')
          .update(dataConFoto)
          .eq('id', editando.id);

        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('inventario')
          .insert({
            ...dataConFoto,
            responsable_id: 'temp',
            estado: 'Disponible',
          });

        if (err) throw err;
      }

      await refetch();
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
      await refetch();
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudo eliminar el equipo');
    }
  };

  const getNombreUbicacion = (id: string) => {
    return ubicaciones.find((u) => u.id === id)?.nombre || id;
  };

  const filtrados = equipos.filter(
    (e) =>
      e.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.marca?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.modelo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
      >
        <ArrowLeft size={20} />
        Volver
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestionar Equipos</h1>
          <p className="text-gray-600 mt-2">Total: {equipos.length} equipos</p>
        </div>
        <button
          onClick={handleAgregar}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center gap-2"
        >
          <Plus size={20} />
          Agregar Equipo
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar equipos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {mostrarFormulario && (
        <div className="bg-white p-6 rounded-lg border border-gray-300 space-y-4">
          <h2 className="text-2xl font-bold">
            {editando ? 'Editar Equipo' : 'Nuevo Equipo'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre *"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Marca"
              value={formData.marca}
              onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Modelo"
              value={formData.modelo}
              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={formData.categoria_id}
              onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Categoría *</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              placeholder="Cantidad"
              value={formData.cantidad_total}
              onChange={(e) =>
                setFormData({ ...formData, cantidad_total: parseInt(e.target.value) || 1 })
              }
              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <span className="text-sm font-semibold">Tipo:</span>
              <span className="text-sm font-bold text-blue-600">
                {formData.cantidad_total > 1 ? 'Stock (auto)' : formData.tipo_control}
              </span>
            </div>
            <input
              type="text"
              placeholder="Número de serie"
              value={formData.numero_serie}
              onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={formData.fecha_compra}
              onChange={(e) => setFormData({ ...formData, fecha_compra: e.target.value })}
              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Proveedor"
              value={formData.proveedor}
              onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Valor unitario"
              value={formData.valor_unitario}
              onChange={(e) =>
                setFormData({ ...formData, valor_unitario: parseFloat(e.target.value) || 0 })
              }
              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={formData.ubicacion_id}
              onChange={(e) => setFormData({ ...formData, ubicacion_id: e.target.value })}
              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Ubicación *</option>
              {ubicaciones.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>

          <textarea
            placeholder="Observaciones"
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
          />

          <div className="space-y-2">
            <h3 className="font-semibold">Foto principal</h3>
            <ImageUpload
              onImageUpload={(driveId, url) => {
                setFotoDriveId(driveId);
                setFotoPreviewUrl(url);
              }}
              nombreEquipo={formData.nombre || 'Equipo'}
              imagenActual={fotoPreviewUrl || undefined}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setMostrarFormulario(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map((equipo) => (
          <div key={equipo.id} className="p-4 border rounded-lg bg-white hover:shadow-lg transition">
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
            <p className="text-sm mb-2">
              <span className="font-semibold">Cantidad:</span> {equipo.cantidad_total}
            </p>
            <p className="text-sm mb-2">
              <span className="font-semibold">Tipo:</span> {equipo.tipo_control}
            </p>
            <p className="text-sm mb-3 text-gray-600">
              {getNombreUbicacion(equipo.ubicacion_id)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleEditar(equipo)}
                className="flex-1 flex items-center justify-center gap-2 p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
              >
                <Edit2 size={16} />
                Editar
              </button>
              <button
                onClick={() => handleEliminar(equipo.id)}
                className="flex-1 flex items-center justify-center gap-2 p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtrados.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay equipos para mostrar</p>
        </div>
      )}
    </div>
  );
}
