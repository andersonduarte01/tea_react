import { useState, useCallback } from 'react';
import { getFaltasHoje } from '../services/faltasService';
import { FaltaProfissional } from '../types/falta';
import { SessionExpiredError } from '../services/httpClient';

interface UseFaltasHojeResult {
  faltas: FaltaProfissional[];
  loading: boolean;
  error: string | null;
  sessionExpired: boolean;
  refresh: () => Promise<void>;
}

export function useFaltasHoje(): UseFaltasHojeResult {
  const [faltas, setFaltas] = useState<FaltaProfissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getFaltasHoje();
      setFaltas(data);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        setSessionExpired(true);
      } else {
        console.error('[useFaltasHoje] erro ao carregar faltas:', err);
        setError('Não foi possível carregar as faltas do dia.');
      }
    } finally {
      setLoading(false);
    }
  }, []);


  const refresh = useCallback(async () => {
    setLoading(true);
    await load();
  }, [load]);

  return { faltas, loading, error, sessionExpired, refresh };
}
