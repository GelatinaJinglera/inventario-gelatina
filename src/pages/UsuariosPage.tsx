import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Usuario } from '../types';
import { ArrowLeft, Plus, Edit2, Trash2, X, Check, Search } from 'lucide-react';

export default function UsuariosPage() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    rol: 'EQUIPO' as 'EQUIPO' | 'ADMIN',
    activo: true,
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setUsuarios(data || []);
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleAgregar = () => {
    setEditando(null);
    setFormData({
      email: '',
      nombre: '',
      rol: 'EQUIPO',
      activo: true,
    });
    setMostrarFormulario(true);
  };

  const handleEditar = (usuario: Usuario) => {
    setEditando(usuario);
    setFormData({
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      activo: usuario.activo,
    });
    setMostrarFormulario(true);
  };

  const handleGuardar = async () => {
    if (!formData.email.trim() || !formData.nombre.trim()) {
      setError('Completa email y nombre');
      return;
    }

    // Validar email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Email inválido');
      return;
    }

    try {
      setGuardando(true);
      setError('');

      if (editando) {
        // Editar
        const { error: err } = await supabase
          .from('usuarios')
          .update({
            nombre: formData.nombre,
            rol: formData.rol,
            activo: formData.activo,
          })
          .eq('id', editando.id);

        if (err) throw err;
      } else {
        // Crear
        const { error: err } = await supabase.from('usuarios').insert({
          email: formData.email,
          nombre: formData.nombre,
          rol: formData.rol,
          activo: formData.activo,
        });

        if (err) {
          if (err.message.includes('duplicate key')) {
            setError('Este email ya existe');
            setGuardando(false);
            return;
          }
          throw err;
        }
      }

      await fetchUsuarios();
      setMostrarFormulario(false);
    } catch (err) {
      console.error('Error:', err);
      setError(`No se pudo ${editando ? 'editar' : 'agregar'} el usuario`);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!window.confirm('¿Eliminar este usuario? No se puede deshacer.')) return;

    try {
      const { error: err } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (err) throw err;
      await fetchUsuarios();
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudo eliminar el usuario');
    }
  };

  const filtrados = usuarios.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.nombre.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900">Gestionar Usuarios</h1>
          <p className="text-gray-600 mt-2">Total: {usuarios.length} usuarios</p>
        </div>
        <button
          onClick={handleAgregar}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center gap-2"
        >
          <Plus size={20} />
          Agregar usuario
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
                {editando ? 'Editar usuario' : 'Agregar usuario'}
              </h2>
              <button
                onClick={() => setMostrarFormulario(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editando}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  placeholder="usuario@gmail.com"
                />
              </div>

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
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              {/* Rol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value as 'EQUIPO' | 'ADMIN' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="EQUIPO">Equipo</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* Activo */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Usuario activo</span>
                </label>
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

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Búsqueda */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por email o nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-600">Cargando usuarios...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            {searchQuery ? 'No se encontraron usuarios.' : 'No hay usuarios. Agrega uno para comenzar.'}
          </div>
        ) : (
          <>
            <div className="px-6 py-3 bg-gray-50 border-b text-sm text-gray-600">
              Mostrando {filtrados.length} de {usuarios.length} usuarios
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Email</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Nombre</th>
                    <th className="text-center px-6 py-3 font-semibold text-gray-700">Rol</th>
                    <th className="text-center px-6 py-3 font-semibold text-gray-700">Estado</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Creado</th>
                    <th className="text-center px-6 py-3 font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((usuario) => (
                    <tr key={usuario.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-3 font-medium text-gray-900">{usuario.email}</td>
                      <td className="px-6 py-3 text-gray-600">{usuario.nombre}</td>
                      <td className="px-6 py-3 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            usuario.rol === 'ADMIN'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            usuario.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {new Date(usuario.created_at).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEditar(usuario)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded transition"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleEliminar(usuario.id)}
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
