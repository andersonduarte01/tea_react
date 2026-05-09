import React, { createContext, useContext } from 'react';

const BASE_URL = 'http://192.168.0.16:8000';

interface ApiContextType {
  baseUrl: string;
  endpoints: {
    login: string;
  };
}

const ApiContext = createContext<ApiContextType>({
  baseUrl: BASE_URL,
  endpoints: { login: `${BASE_URL}/api/auth/login/` },
});

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const value: ApiContextType = {
    baseUrl: BASE_URL,
    endpoints: {
      login: `${BASE_URL}/api/auth/login/`,
    },
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApi() {
  return useContext(ApiContext);
}
