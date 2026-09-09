import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

interface Retiro {
  id: string;
  nombre: string;
  destino: string;
  fecha_devolucion?: string;
  responsable_id: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

export function useRealtimeRetiros() {
  const [retiros, setRetiros] = useState<Retiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRetiros = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('retiros')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setRetiros(data || []);
      setError(null);
    } catch (err) {
      console.error('Error cargando retiros:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRetiros();

    const channel = supabase
      .channel('retiros-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'retiros',
        },
        () => {
          fetchRetiros();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRetiros]);

  return { retiros, loading, error, refetch: fetchRetiros };
}
