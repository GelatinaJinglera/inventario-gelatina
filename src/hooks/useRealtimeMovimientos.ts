import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Movimiento } from '../types';

export function useRealtimeMovimientos() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovimientos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('movimientos')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setMovimientos(data || []);
      setError(null);
    } catch (err) {
      console.error('Error cargando movimientos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovimientos();

    const channel = supabase
      .channel('movimientos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'movimientos',
        },
        () => {
          fetchMovimientos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMovimientos]);

  return { movimientos, loading, error, refetch: fetchMovimientos };
}
