import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Layers, AlertCircle, Package, TrendingUp } from 'lucide-react';

interface KPI {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        // Total equipos (sumando stock + contando individuales)
        const { data: allEquipos, error: allError } = await supabase
          .from('inventario')
          .select('id, tipo_control, cantidad_total');

        if (allError) throw allError;

        const totalEquipos = (allEquipos || []).reduce((sum, equipo) => {
          return sum + (equipo.tipo_control === 'Stock' ? equipo.cantidad_total : 1);
        }, 0);

        // Equipos en falla (desde MANTENIMIENTO, sumando cantidad_en_falla)
        const { data: enlFalla, error: fallaError } = await supabase
          .from('mantenimiento')
          .select('cantidad_en_falla')
          .in('estado', ['Reportado', 'En reparación']);

        if (fallaError) throw fallaError;

        // Sumar cantidad_en_falla
        const fallasCount = (enlFalla || []).reduce((sum, m) => sum + (m.cantidad_en_falla || 1), 0);

        // Retiros activos (contar retiros, no equipos)
        const { data: retiros, error: retError } = await supabase
          .from('retiros')
          .select('id')
          .in('estado', ['Preparado', 'Retirado']);

        if (retError) throw retError;

        // Cantidad total de unidades en retiros activos
        const { data: itemsEnRetiro, error: itemsError } = await supabase
          .from('retiro_items')
          .select('cantidad_solicitada')
          .in('retiro_id', retiros?.map((r) => r.id) || []);

        if (itemsError) throw itemsError;

        const cantidadEnRetiro = (itemsEnRetiro || []).reduce((sum, item) => sum + item.cantidad_solicitada, 0);
        const disponibles = totalEquipos - fallasCount - cantidadEnRetiro;
        const retirosCount = retiros?.length || 0;

        const newKpis: KPI[] = [
          {
            label: 'Total Equipos',
            value: totalEquipos,
            icon: <Layers className="w-8 h-8" />,
            color: 'bg-blue-50 border-blue-200',
          },
          {
            label: 'Equipos en Falla',
            value: fallasCount,
            icon: <AlertCircle className="w-8 h-8" />,
            color: 'bg-red-50 border-red-200',
          },
          {
            label: 'Retiros Activos',
            value: retirosCount,
            icon: <Package className="w-8 h-8" />,
            color: 'bg-yellow-50 border-yellow-200',
          },
          {
            label: 'Disponibles',
            value: disponibles,
            icon: <TrendingUp className="w-8 h-8" />,
            color: 'bg-green-50 border-green-200',
          },
        ];

        setKpis(newKpis);
      } catch (err) {
        console.error('Error fetching KPIs:', err);
        setError('No se pudieron cargar los KPIs');
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido al sistema de inventario de Gelatina</p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className={`${kpi.color} border-2 rounded-lg p-6 transition hover:shadow-lg`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{kpi.label}</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{kpi.value}</p>
              </div>
              <div className="text-gray-400">{kpi.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/inventario"
            className="block p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition text-center"
          >
            <p className="font-semibold text-blue-600">Buscar equipos</p>
            <p className="text-sm text-gray-600 mt-1">Consulta el inventario completo</p>
          </a>
          <a
            href="/movimientos"
            className="block p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition text-center"
          >
            <p className="font-semibold text-green-600">Ver movimientos</p>
            <p className="text-sm text-gray-600 mt-1">Historial de retiros y devoluciones</p>
          </a>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Tip</h3>
        <p className="text-blue-800 text-sm">
          Usa el menú de la izquierda para navegar entre Inventario, Movimientos y más.
        </p>
      </div>
    </div>
  );
}
