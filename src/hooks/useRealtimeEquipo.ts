import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Inventario } from '../types';

export function useRealtimeEquipo(equipoId?: string) {
  const [equipo, setEquipo] = useState<Inventario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipo = useCallback(async () => {
    if (!equipoId) return;

    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('inventario')
        .select('*, categorias(*)')
        .eq('id', equipoId)
        .single();

      if (err) throw err;
      setEquipo(data);
      setError(null);
    } catch (err) {
      console.error('Error cargando equipo:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [equipoId]);

  useEffect(() => {
    fetchEquipo();

    if (!equipoId) return;

    const channel = supabase
      .channel(`inventario-${equipoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventario',
          filter: `id=eq.${equipoId}`,
        },
        () => {
          fetchEquipo();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [equipoId, fetchEquipo]);

  return { equipo, loading, error, refetch: fetchEquipo };
}
