import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Inventario } from '../types';

export function useRealtimeInventario() {
  const [equipos, setEquipos] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('inventario')
        .select('*')
        .order('nombre');

      if (err) throw err;
      setEquipos(data || []);
      setError(null);
    } catch (err) {
      console.error('Error cargando inventario:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEquipos();

    const channel = supabase
      .channel('inventario-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventario',
        },
        () => {
          // Cuando hay un cambio, recargamos los datos
          fetchEquipos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEquipos]);

  return { equipos, loading, error, refetch: fetchEquipos };
}
