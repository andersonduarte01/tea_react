import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage keys ──────────────────────────────────────────────────────────────
export const STORAGE = {
  USER:      '@tea:user',
  ACCESS:    '@tea:access',
  REFRESH:   '@tea:refresh',
  CLINICA:   '@tea:clinica_id',
} as const;

// ─── Runtime config ────────────────────────────────────────────────────────────
let _baseUrl = 'http://192.168.0.16:8000';

export function configureHttpClient(baseUrl: string) {
  _baseUrl = baseUrl;
}

export function getBaseUrl() {
  return _baseUrl;
}

// ─── API Error ─────────────────────────────────────────────────────────────────
export class ApiError extends Error {
  status: number;
  code:   string;
  errors?: Record<string, string[]>;

  constructor(status: number, body: any) {
    super(body?.detail ?? body?.message ?? `HTTP ${status}`);
    this.status = status;
    this.code   = body?.code ?? 'unknown_error';
    this.errors = body?.errors;
  }
}

export class SessionExpiredError extends Error {
  constructor() {
    super('SESSION_EXPIRED');
    this.name = 'SessionExpiredError';
  }
}

// ─── Token refresh ─────────────────────────────────────────────────────────────
let _refreshing = false;
let _refreshQueue: Array<(ok: boolean) => void> = [];

async function doRefresh(): Promise<void> {
  const refresh = await AsyncStorage.getItem(STORAGE.REFRESH);
  if (!refresh) throw new SessionExpiredError();

  const res = await fetch(`${_baseUrl}/api/v1/auth/refresh/`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    await AsyncStorage.multiRemove([STORAGE.ACCESS, STORAGE.REFRESH]);
    throw new SessionExpiredError();
  }

  const data = await res.json();
  await Promise.all([
    AsyncStorage.setItem(STORAGE.ACCESS,  data.access),
    AsyncStorage.setItem(STORAGE.REFRESH, data.refresh),
  ]);
}

async function refreshOnce(): Promise<void> {
  if (_refreshing) {
    return new Promise<void>((resolve, reject) => {
      _refreshQueue.push((ok) => (ok ? resolve() : reject(new SessionExpiredError())));
    });
  }

  _refreshing = true;
  try {
    await doRefresh();
    _refreshQueue.forEach(cb => cb(true));
  } catch (err) {
    _refreshQueue.forEach(cb => cb(false));
    throw err;
  } finally {
    _refreshQueue = [];
    _refreshing   = false;
  }
}

// ─── Headers builder ───────────────────────────────────────────────────────────
async function buildHeaders(skipClinica = false): Promise<Record<string, string>> {
  const [access, clinicaId] = await Promise.all([
    AsyncStorage.getItem(STORAGE.ACCESS),
    AsyncStorage.getItem(STORAGE.CLINICA),
  ]);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  };

  if (access)               headers['Authorization'] = `Bearer ${access}`;
  if (!skipClinica && clinicaId) headers['X-Clinica-ID']  = clinicaId;

  return headers;
}

// ─── Core request ──────────────────────────────────────────────────────────────
export async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
  skipClinica = false,
): Promise<T> {
  const url = `${_baseUrl}${path}`;

  const execute = async (): Promise<Response> => {
    const headers = await buildHeaders(skipClinica);
    return fetch(url, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string> ?? {}) },
    });
  };

  let res = await execute();

  // Token expirado — tenta refresh uma vez
  if (res.status === 401 && !path.includes('auth/refresh') && !path.includes('auth/login')) {
    try {
      await refreshOnce();
      res = await execute();
    } catch {
      throw new SessionExpiredError();
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string, skipClinica = false) =>
    request<T>(path, { method: 'GET' }, skipClinica),

  post: <T>(path: string, body: unknown, skipClinica = false) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, skipClinica),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  patchMultipart: async <T>(path: string, formData: FormData): Promise<T> => {
    const url = `${_baseUrl}${path}`;
    const getHeaders = async (): Promise<Record<string, string>> => {
      const [access, clinicaId] = await Promise.all([
        AsyncStorage.getItem(STORAGE.ACCESS),
        AsyncStorage.getItem(STORAGE.CLINICA),
      ]);
      const h: Record<string, string> = {};
      if (access)    h['Authorization'] = `Bearer ${access}`;
      if (clinicaId) h['X-Clinica-ID']  = clinicaId;
      return h;
    };
    const execute = async () =>
      fetch(url, { method: 'PATCH', headers: await getHeaders(), body: formData });
    let res = await execute();
    if (res.status === 401 && !path.includes('auth/')) {
      try { await refreshOnce(); res = await execute(); }
      catch { throw new SessionExpiredError(); }
    }
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new ApiError(res.status, errBody);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  },

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};
