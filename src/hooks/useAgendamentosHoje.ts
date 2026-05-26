import { useState, useEffect, useCallback, useRef } from 'react';
import { Agendamento } from '../types/agendamento';
import { getAgendamentosHoje } from '../services/agendamentosService';
import { SessionExpiredError } from '../services/httpClient';

interface State {
  items:          Agendamento[];
  total:          number;
  loading:        boolean;
  loadingMore:    boolean;
  error:          string | null;
  sessionExpired: boolean;
  hasMore:        boolean;
}

export interface UseAgendamentosReturn extends State {
  refresh:  () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useAgendamentosHoje(): UseAgendamentosReturn {
  const pageRef = useRef(1);

  const [state, setState] = useState<State>({
    items: [], total: 0, loading: true, loadingMore: false,
    error: null, sessionExpired: false, hasMore: false,
  });

  const load = useCallback(async (pageNum: number, reset: boolean) => {
    setState(prev => ({
      ...prev,
      loading:        reset,
      loadingMore:    !reset,
      error:          null,
      sessionExpired: false,
    }));

    try {
      const data = await getAgendamentosHoje(pageNum);
      setState(prev => ({
        items:          reset ? data.results : [...prev.items, ...data.results],
        total:          data.count,
        loading:        false,
        loadingMore:    false,
        error:          null,
        sessionExpired: false,
        hasMore:        data.next !== null,
      }));
    } catch (err: unknown) {
      if (err instanceof SessionExpiredError) {
        setState(prev => ({ ...prev, loading: false, loadingMore: false, sessionExpired: true }));
        return;
      }
      const message = (err as any)?.message ?? 'Erro ao carregar agendamentos.';
      setState(prev => ({ ...prev, loading: false, loadingMore: false, error: message }));
    }
  }, []);

  useEffect(() => { load(1, true); }, [load]);

  const refresh = useCallback(async () => {
    pageRef.current = 1;
    await load(1, true);
  }, [load]);

  const loadMore = useCallback(async () => {
    if (state.loadingMore || !state.hasMore) return;
    const next = pageRef.current + 1;
    pageRef.current = next;
    await load(next, false);
  }, [state.loadingMore, state.hasMore, load]);

  return { ...state, refresh, loadMore };
}
