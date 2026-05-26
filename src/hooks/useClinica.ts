import { useState, useEffect, useCallback } from 'react';
import { ClinicaDetalhe }      from '../types/clinica';
import { getClinica }          from '../services/dashboardService';

interface UseClinicaReturn {
  clinica:  ClinicaDetalhe | null;
  loading:  boolean;
  error:    string | null;
  refresh:  () => Promise<void>;
}

export function useClinica(): UseClinicaReturn {
  const [clinica, setClinica] = useState<ClinicaDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getClinica();
      setClinica(data);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { clinica, loading, error, refresh: load };
}
