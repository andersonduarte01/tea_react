import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from './ApiContext';
import { ClinicaVinculo, Usuario } from '../types/auth';

interface AuthContextType {
  user: Usuario | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selecionarClinica: (clinica: ClinicaVinculo) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = '@tea:user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { endpoints } = useApi();
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (stored) {
          setUser(JSON.parse(stored));
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const response = await fetch(endpoints.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message =
        error.detail ||
        error.non_field_errors?.[0] ||
        error.email?.[0] ||
        'Credenciais inválidas';
      throw new Error(message);
    }

    const data = await response.json();

    const clinicas: ClinicaVinculo[] = (data.clinicas ?? []).map((c: any) => ({
      id: c.id,
      nome: c.nome,
      tipo_usuario: c.tipo_usuario,
    }));

    const loggedUser: Usuario = {
      id: data.usuario?.id ?? data.id,
      nome: data.usuario?.nome ?? data.nome,
      email: data.usuario?.email ?? data.email,
      tipo_usuario: clinicas.length === 1 ? clinicas[0].tipo_usuario : null,
      token: data.access ?? data.token ?? data.key,
      clinicas,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));
    setUser(loggedUser);
  }

  async function selecionarClinica(clinica: ClinicaVinculo): Promise<void> {
    if (!user) return;
    const updated: Usuario = { ...user, tipo_usuario: clinica.tipo_usuario };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setUser(updated);
  }

  async function logout(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, selecionarClinica }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth precisa estar dentro de AuthProvider');
  }
  return context;
}
