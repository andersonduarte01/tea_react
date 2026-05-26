import { useState, useEffect, useCallback } from 'react';
import { DashboardAdminData } from '../types/dashboard';
import { getDashboard } from '../services/dashboardService';
import { SessionExpiredError } from '../services/httpClient';

interface DashboardState {
  data:           DashboardAdminData | null;
  loading:        boolean;
  error:          string | null;
  sessionExpired: boolean;
}

interface UseDashboardReturn extends DashboardState {
  refresh: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const [state, setState] = useState<DashboardState>({
    data:           null,
    loading:        true,
    error:          null,
    sessionExpired: false,
  });

  const fetch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null, sessionExpired: false }));

    try {
      const data = await getDashboard();
      setState({ data, loading: false, error: null, sessionExpired: false });
    } catch (err: unknown) {
      if (err instanceof SessionExpiredError) {
        setState({ data: null, loading: false, error: null, sessionExpired: true });
        return;
      }

      const message =
        (err as any)?.detail ??
        (err as any)?.message ??
        'Erro ao carregar o painel. Tente novamente.';

      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { ...state, refresh: fetch };
}
