import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

interface Mantenimiento {
  id: string;
  inventario_id: string;
  estado: string;
  problema: string;
  cantidad_en_falla: number;
  foto_drive_id?: string;
  responsable_tecnico_id?: string;
  costo?: number;
  fecha_resolucion?: string;
  solucion_notas?: string;
  created_at: string;
  updated_at: string;
}

export function useRealtimeMantenimiento() {
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMantenimiento = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('mantenimiento')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setMantenimientos(data || []);
      setError(null);
    } catch (err) {
      console.error('Error cargando mantenimiento:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMantenimiento();

    const channel = supabase
      .channel('mantenimiento-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mantenimiento',
        },
        () => {
          fetchMantenimiento();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMantenimiento]);

  return { mantenimientos, loading, error, refetch: fetchMantenimiento };
}
