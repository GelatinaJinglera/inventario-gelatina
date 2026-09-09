import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Inventario, Mantenimiento, Movimiento } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { ArrowLeft, Download, AlertTriangle } from 'lucide-react';

interface KPI {
  label: string;
  valor: number;
  subtext: string;
  color: string;
}

interface EquipoCritico {
  nombre: string;
  categoria: string;
  disponible: number;
  en_falla: number;
  en_retiro: number;
  total: number;
  porcentaje: number;
}

export default function EstadísticasPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [datoPorCategoria, setDatoPorCategoria] = useState<any[]>([]);
  const [datoDisponibilidad, setDatoDisponibilidad] = useState<any[]>([]);
  const [datoMovimientos, setDatoMovimientos] = useState<any[]>([]);
  const [top5Retirados, setTop5Retirados] = useState<any[]>([]);
  const [equiposCriticos, setEquiposCriticos] = useState<EquipoCritico[]>([]);

  const COLORES = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    fetchDatos();
  }, []);

  const fetchDatos = async () => {
    try {
      setLoading(true);

      // Obtener inventario
      const { data: inventarioData, error: invErr } = await supabase
        .from('inventario')
        .select('*, categorias(*)')
        .order('nombre');

      if (invErr) throw invErr;

      // Obtener mantenimiento
      const { data: mantenimientoData, error: mantErr } = await supabase
        .from('mantenimiento')
        .select('*')
        .in('estado', ['Reportado', 'En reparación']);

      if (mantErr) throw mantErr;

      // Obtener movimientos
      const { data: movimientosData, error: movErr } = await supabase
        .from('movimientos')
        .select('*, created_at')
        .order('created_at', { ascending: false });

      if (movErr) throw movErr;

      // Obtener retiros
      const { data: retirosData, error: retErr } = await supabase
        .from('retiro_items')
        .select('inventario_id, cantidad_solicitada, retiro_id')
        .order('cantidad_solicitada', { ascending: false });

      if (retErr) throw retErr;

      calcularEstadisticas(
        inventarioData || [],
        mantenimientoData || [],
        movimientosData || [],
        retirosData || []
      );
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = (
    inventario: Inventario[],
    mantenimiento: Mantenimiento[],
    movimientos: Movimiento[],
    retiroItems: any[]
  ) => {
    // KPIs
    const stockTotal = inventario.reduce((sum, inv) => sum + inv.cantidad_total, 0);
    const equiposFalla = mantenimiento.length;
    const retirosActivos = new Set(
      retiroItems.map((r) => r.retiro_id)
    ).size;

    // Calcular disponibles
    let disponibles = stockTotal;
    mantenimiento.forEach((m) => {
      if (m.cantidad_en_falla) {
        disponibles -= m.cantidad_en_falla;
      }
    });

    const nuevosKPIs: KPI[] = [
      {
        label: 'Stock Total',
        valor: stockTotal,
        subtext: 'Equipos en inventario',
        color: 'bg-blue-50 border-blue-200',
      },
      {
        label: 'Disponibles',
        valor: disponibles,
        subtext: `${((disponibles / stockTotal) * 100).toFixed(1)}% del total`,
        color: 'bg-green-50 border-green-200',
      },
      {
        label: 'En Falla',
        valor: equiposFalla,
        subtext: 'Requieren reparación',
        color: 'bg-red-50 border-red-200',
      },
      {
        label: 'Retiros Activos',
        valor: retirosActivos,
        subtext: 'Retiros en curso',
        color: 'bg-orange-50 border-orange-200',
      },
    ];
    setKpis(nuevosKPIs);

    // Gráfico: Equipos por categoría
    const porCategoria: Record<string, number> = {};
    inventario.forEach((inv) => {
      const cat = inv.categorias?.nombre || 'Sin categoría';
      porCategoria[cat] = (porCategoria[cat] || 0) + inv.cantidad_total;
    });

    const datoCat = Object.entries(porCategoria).map(([nombre, valor]) => ({
      nombre,
      valor,
    }));
    setDatoPorCategoria(datoCat);

    // Gráfico: Disponibilidad por categoría
    const disponibilidadPorCat: Record<string, { disponible: number; total: number }> = {};

    inventario.forEach((inv) => {
      const cat = inv.categorias?.nombre || 'Sin categoría';
      if (!disponibilidadPorCat[cat]) {
        disponibilidadPorCat[cat] = { disponible: 0, total: 0 };
      }
      disponibilidadPorCat[cat].total += inv.cantidad_total;

      // Restar fallas
      const falla = mantenimiento.find((m) => m.inventario_id === inv.id);
      if (falla && falla.cantidad_en_falla) {
        disponibilidadPorCat[cat].disponible += Math.max(
          0,
          inv.cantidad_total - falla.cantidad_en_falla
        );
      } else {
        disponibilidadPorCat[cat].disponible += inv.cantidad_total;
      }
    });

    const datoDisp = Object.entries(disponibilidadPorCat).map(([nombre, { disponible, total }]) => ({
      nombre,
      disponible,
      no_disponible: total - disponible,
    }));
    setDatoDisponibilidad(datoDisp);

    // Gráfico: Movimientos por mes
    const movimientosPorMes: Record<string, number> = {};
    movimientos.forEach((mov) => {
      const fecha = new Date(mov.created_at);
      const mes = fecha.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
      movimientosPorMes[mes] = (movimientosPorMes[mes] || 0) + 1;
    });

    const datoMov = Object.entries(movimientosPorMes)
      .slice(-12)
      .map(([mes, cantidad]) => ({
        mes,
        movimientos: cantidad,
      }));
    setDatoMovimientos(datoMov);

    // Top 5 equipos más retirados
    const retiradosPorEquipo: Record<string, number> = {};
    retiroItems.forEach((item) => {
      const inv = inventario.find((i) => i.id === item.inventario_id);
      if (inv) {
        retiradosPorEquipo[inv.nombre] = (retiradosPorEquipo[inv.nombre] || 0) + item.cantidad_solicitada;
      }
    });

    const top5 = Object.entries(retiradosPorEquipo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
      }));
    setTop5Retirados(top5);

    // Equipos críticos (menos de 30% disponibilidad)
    const criticos: EquipoCritico[] = [];
    inventario.forEach((inv) => {
      const falla = mantenimiento.find((m) => m.inventario_id === inv.id);
      const enFalla = falla?.cantidad_en_falla || 0;
      const disponible = Math.max(0, inv.cantidad_total - enFalla);
      const porcentaje = (disponible / inv.cantidad_total) * 100;

      if (porcentaje < 30) {
        criticos.push({
          nombre: inv.nombre,
          categoria: inv.categorias?.nombre || 'Sin categoría',
          disponible,
          en_falla: enFalla,
          en_retiro: 0,
          total: inv.cantidad_total,
          porcentaje,
        });
      }
    });

    criticos.sort((a, b) => a.porcentaje - b.porcentaje);
    setEquiposCriticos(criticos);
  };

  const exportarCSV = () => {
    let csv = 'REPORTE DE INVENTARIO GELATINA\n';
    csv += `Fecha: ${new Date().toLocaleDateString('es-AR')}\n\n`;

    // KPIs
    csv += 'INDICADORES CLAVE\n';
    csv += 'Metrica,Valor\n';
    kpis.forEach((k) => {
      csv += `${k.label},${k.valor}\n`;
    });

    csv += '\n\nEQUIPOS CRITICOS (< 30% disponibilidad)\n';
    csv += 'Equipo,Categoria,Disponible,En Falla,Total,Disponibilidad %\n';
    equiposCriticos.forEach((e) => {
      csv += `"${e.nombre}","${e.categoria}",${e.disponible},${e.en_falla},${e.total},${e.porcentaje.toFixed(1)}\n`;
    });

    csv += '\n\nTOP 5 EQUIPOS MAS RETIRADOS\n';
    csv += 'Equipo,Cantidad Retirada\n';
    top5Retirados.forEach((t) => {
      csv += `"${t.nombre}",${t.cantidad}\n`;
    });

    // Descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario-gelatina-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
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
          <h1 className="text-3xl font-bold text-gray-900">Estadisticas e Informes</h1>
          <p className="text-gray-600 mt-2">Analisis completo del inventario y movimientos</p>
        </div>
        <button
          onClick={exportarCSV}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center gap-2"
        >
          <Download size={20} />
          Descargar CSV
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-600">Cargando estadisticas...</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className={`p-6 rounded-lg border-2 ${kpi.color}`}
              >
                <div className="text-sm font-medium text-gray-600 mb-2">{kpi.label}</div>
                <div className="text-3xl font-bold text-gray-900">{kpi.valor}</div>
                <div className="text-xs text-gray-600 mt-2">{kpi.subtext}</div>
              </div>
            ))}
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart: Por categoría */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Equipos por Categoria</h2>
              {datoPorCategoria.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={datoPorCategoria}
                      dataKey="valor"
                      nameKey="nombre"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {datoPorCategoria.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORES[idx % COLORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-600 h-[300px] flex items-center justify-center">
                  Sin datos
                </div>
              )}
            </div>

            {/* Bar Chart: Disponibilidad */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Disponibilidad por Categoria</h2>
              {datoDisponibilidad.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={datoDisponibilidad}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="disponible" stackId="a" fill="#10b981" />
                    <Bar dataKey="no_disponible" stackId="a" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-600 h-[300px] flex items-center justify-center">
                  Sin datos
                </div>
              )}
            </div>
          </div>

          {/* Línea: Movimientos por mes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Movimientos por Mes</h2>
            {datoMovimientos.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={datoMovimientos}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="movimientos" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-600 h-[300px] flex items-center justify-center">
                Sin datos
              </div>
            )}
          </div>

          {/* Top 5 Retirados */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Top 5 Equipos Mas Retirados</h2>
            {top5Retirados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 font-semibold text-gray-700">Equipo</th>
                      <th className="text-right px-6 py-3 font-semibold text-gray-700">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top5Retirados.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-900">{item.nombre}</td>
                        <td className="px-6 py-3 text-right">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                            {item.cantidad}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-600 py-8">Sin datos de retiros</div>
            )}
          </div>

          {/* Equipos Críticos */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={24} className="text-red-600" />
              <h2 className="text-lg font-bold text-gray-900">Equipos Criticos (menos de 30% disponible)</h2>
            </div>
            {equiposCriticos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 font-semibold text-gray-700">Equipo</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-700">Categoria</th>
                      <th className="text-center px-6 py-3 font-semibold text-gray-700">Disponible</th>
                      <th className="text-center px-6 py-3 font-semibold text-gray-700">En Falla</th>
                      <th className="text-center px-6 py-3 font-semibold text-gray-700">Total</th>
                      <th className="text-center px-6 py-3 font-semibold text-gray-700">Disponibilidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equiposCriticos.map((equipo, idx) => (
                      <tr key={idx} className="border-b hover:bg-red-50">
                        <td className="px-6 py-3 font-medium text-gray-900">{equipo.nombre}</td>
                        <td className="px-6 py-3 text-gray-600">{equipo.categoria}</td>
                        <td className="px-6 py-3 text-center">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded font-semibold">
                            {equipo.disponible}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className="bg-red-100 text-red-800 px-3 py-1 rounded font-semibold">
                            {equipo.en_falla}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center font-medium text-gray-900">
                          {equipo.total}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className="font-bold text-red-600">{equipo.porcentaje.toFixed(1)}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-600 py-8">
                Excelente - No hay equipos criticos.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
