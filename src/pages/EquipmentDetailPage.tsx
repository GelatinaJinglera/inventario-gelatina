import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Inventario, Movimiento } from '../types';
import { ArrowLeft, AlertCircle, FileText } from 'lucide-react';

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [equipo, setEquipo] = useState<Inventario | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cantidadEnRetiro, setCantidadEnRetiro] = useState(0);
  const [cantidadEnFalla, setCantidadEnFalla] = useState(0);
  const [estaPenFalla, setEstaPenFalla] = useState(false);
  const [mostrarReportarFalla, setMostrarReportarFalla] = useState(false);
  const [descripcionFalla, setDescripcionFalla] = useState('');
  const [fechaRetorno, setFechaRetorno] = useState('');
  const [cantidadEnFallaForm, setCantidadEnFallaForm] = useState(1);
  const [reportando, setReportando] = useState(false);

  useEffect(() => {
    const fetchEquipo = async () => {
      try {
        setLoading(true);

        // Obtener equipo con categoría
        const { data: equipoData, error: equipoError } = await supabase
          .from('inventario')
          .select('*, categorias(*)')
          .eq('id', id)
          .single();

        if (equipoError) throw equipoError;
        setEquipo(equipoData);

        // Obtener cantidad en retiros activos
        const { data: retiros, error: retError } = await supabase
          .from('retiros')
          .select('id')
          .in('estado', ['Preparado', 'Retirado']);

        if (retError) throw retError;

        const { data: itemsEnRetiro, error: itemsError } = await supabase
          .from('retiro_items')
          .select('cantidad_solicitada')
          .eq('inventario_id', id)
          .in('retiro_id', retiros?.map((r) => r.id) || []);

        if (itemsError) throw itemsError;

        const totalEnRetiro = (itemsEnRetiro || []).reduce(
          (sum, item) => sum + item.cantidad_solicitada,
          0
        );
        setCantidadEnRetiro(totalEnRetiro);

        // Obtener movimientos
        const { data: movimientosData, error: movError } = await supabase
          .from('movimientos')
          .select('*')
          .eq('inventario_id', id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (movError) throw movError;
        setMovimientos(movimientosData || []);

        // Verificar si el equipo está en falla
        const { data: enlFalla, error: fallaError } = await supabase
          .from('mantenimiento')
          .select('cantidad_en_falla')
          .eq('inventario_id', id)
          .in('estado', ['Reportado', 'En reparación']);

        if (fallaError) throw fallaError;
        
        const tieneEnFalla = (enlFalla?.length || 0) > 0;
        const totalEnFalla = (enlFalla || []).reduce((sum, m) => sum + (m.cantidad_en_falla || 1), 0);
        
        setEstaPenFalla(tieneEnFalla);
        setCantidadEnFalla(totalEnFalla);
      } catch (err) {
        console.error('Error:', err);
        setError('No se pudo cargar el equipo');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEquipo();
    }
  }, [id]);

  const handleReportarFalla = async () => {
    if (!equipo || !descripcionFalla.trim()) {
      setError('Debe incluir una descripción de la falla');
      return;
    }

    try {
      setReportando(true);

      // Crear registro en mantenimiento SIN cambiar estado del equipo
      await supabase.from('mantenimiento').insert({
        inventario_id: equipo.id,
        problema: descripcionFalla,
        estado: 'Reportado',
        fecha_resolucion: fechaRetorno || null,
        cantidad_en_falla: equipo.tipo_control === 'Stock' ? cantidadEnFallaForm : 1,
      });

      // Crear movimiento de falla
      await supabase.from('movimientos').insert({
        inventario_id: equipo.id,
        accion: 'Falla',
        cantidad: equipo.tipo_control === 'Stock' ? cantidadEnFallaForm : 1,
        observaciones: descripcionFalla,
      });

      // Recargar equipo
      const { data: equipoData } = await supabase
        .from('inventario')
        .select('*')
        .eq('id', id)
        .single();

      setEquipo(equipoData);
      setMostrarReportarFalla(false);
      setDescripcionFalla('');
      setFechaRetorno('');
      setCantidadEnFallaForm(1);
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudo reportar la falla');
    } finally {
      setReportando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (error || !equipo) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/inventario')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} />
          Volver
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error || 'Equipo no encontrado'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/inventario')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
      >
        <ArrowLeft size={20} />
        Volver
      </button>

      {/* Main info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Foto */}
          <div className="md:col-span-1">
            {equipo.foto_principal_url ? (
              <img
                src={equipo.foto_principal_url}
                alt={equipo.nombre}
                className="w-full rounded-lg object-cover bg-gray-100 h-64"
              />
            ) : (
              <div className="w-full rounded-lg bg-gray-200 h-64 flex items-center justify-center text-gray-600">
                Sin foto
              </div>
            )}
          </div>

          {/* Detalles */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{equipo.nombre}</h1>
              <p className="text-gray-600 mt-2">
                {equipo.marca} {equipo.modelo && `- ${equipo.modelo}`}
              </p>
            </div>

            {/* Estado badge */}
            <div>
              {(() => {
                const hayRetiros = cantidadEnRetiro > 0;
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
                    className={`inline-block px-4 py-2 font-semibold rounded-lg ${
                      estadoMostrar === 'Parcialmente disponible'
                        ? 'bg-orange-100 text-orange-800'
                        : estadoMostrar === 'Disponible'
                        ? 'bg-green-100 text-green-800'
                        : estadoMostrar === 'En falla'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {estadoMostrar}
                  </span>
                );
              })()}
            </div>

            {/* Grid de info */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-gray-600 text-sm">ID</p>
                <p className="font-mono font-semibold text-gray-900">{equipo.id}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Categoría</p>
                <p className="font-semibold text-gray-900">
                  {equipo.categorias?.nombre || 'Sin categoría'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Tipo</p>
                <p className="font-semibold text-gray-900">{equipo.tipo_control}</p>
              </div>
              {equipo.tipo_control === 'Stock' && (
                <>
                  {(() => {
                    const disponibles = (equipo.cantidad_total || 0) - cantidadEnRetiro - cantidadEnFalla;
                    const hayAfectaciones = cantidadEnRetiro > 0 || cantidadEnFalla > 0;
                    return (
                      <div>
                        <p className={`text-sm font-bold ${hayAfectaciones ? 'text-red-600' : 'text-gray-600'}`}>
                          Disponibles
                        </p>
                        <p className={`text-2xl font-bold ${hayAfectaciones ? 'text-red-600' : 'text-gray-900'}`}>
                          {disponibles} de {equipo.cantidad_total}
                        </p>
                      </div>
                    );
                  })()}
                  {cantidadEnRetiro > 0 && (
                    <div>
                      <p className="text-sm text-orange-600 font-semibold">En retiro</p>
                      <p className="text-2xl font-bold text-orange-600">{cantidadEnRetiro}</p>
                    </div>
                  )}
                  {cantidadEnFalla > 0 && (
                    <div>
                      <p className="text-sm text-red-600 font-semibold">En falla</p>
                      <p className="text-2xl font-bold text-red-600">{cantidadEnFalla}</p>
                    </div>
                  )}
                </>
              )}
              {equipo.numero_serie && (
                <div>
                  <p className="text-gray-600 text-sm">Serie</p>
                  <p className="font-mono text-gray-900">{equipo.numero_serie}</p>
                </div>
              )}
              {equipo.fecha_compra && (
                <div>
                  <p className="text-gray-600 text-sm">Fecha compra</p>
                  <p className="text-gray-900">{new Date(equipo.fecha_compra).toLocaleDateString('es-AR')}</p>
                </div>
              )}
              {equipo.valor_unitario && (
                <div>
                  <p className="text-gray-600 text-sm">Valor unitario</p>
                  <p className="text-gray-900">${equipo.valor_unitario}</p>
                </div>
              )}
            </div>

            {equipo.observaciones && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <FileText size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 font-semibold">Observaciones</p>
                    <p className="text-blue-800 text-sm mt-1">{equipo.observaciones}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botón reportar falla */}
      {!estaPenFalla && (
        <button
          onClick={() => setMostrarReportarFalla(true)}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
        >
          <AlertCircle size={20} />
          Reportar falla
        </button>
      )}

      {/* Modal reportar falla */}
      {mostrarReportarFalla && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reportar falla</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Causa de falla *
                </label>
                <textarea
                  value={descripcionFalla}
                  onChange={(e) => setDescripcionFalla(e.target.value)}
                  placeholder="Describe qué problema tiene el equipo..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none h-24"
                />
              </div>

              {equipo.tipo_control === 'Stock' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad con falla (de {equipo.cantidad_total})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={equipo.cantidad_total}
                    value={cantidadEnFallaForm}
                    onChange={(e) => setCantidadEnFallaForm(Math.min(equipo.cantidad_total, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de retorno prevista (opcional)
                </label>
                <input
                  type="date"
                  value={fechaRetorno}
                  onChange={(e) => setFechaRetorno(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleReportarFalla}
                  disabled={reportando || !descripcionFalla.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  {reportando ? 'Reportando...' : 'Reportar falla'}
                </button>
                <button
                  onClick={() => {
                    setMostrarReportarFalla(false);
                    setDescripcionFalla('');
                    setFechaRetorno('');
                    setCantidadEnFallaForm(1);
                  }}
                  disabled={reportando}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historial de movimientos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Últimos movimientos</h2>
        {movimientos.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Sin movimientos registrados</p>
        ) : (
          <div className="space-y-3">
            {movimientos.map((mov) => (
              <div key={mov.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{mov.accion}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Cantidad: <span className="font-mono font-semibold">{mov.cantidad}</span>
                    </p>
                    {mov.destino && (
                      <p className="text-sm text-gray-600">
                        Destino: <span className="font-semibold">{mov.destino}</span>
                      </p>
                    )}
                    {mov.observaciones && (
                      <p className="text-sm text-gray-600 mt-2 italic">
                        "{mov.observaciones}"
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(mov.created_at).toLocaleDateString('es-AR')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(mov.created_at).toLocaleTimeString('es-AR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
