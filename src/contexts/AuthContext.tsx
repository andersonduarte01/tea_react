import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE, api } from '../services/httpClient';
import { ClinicaVinculo, Usuario } from '../types/auth';

interface AuthContextType {
  user:                  Usuario | null;
  clinicaAtual:          ClinicaVinculo | null;
  isLoading:             boolean;
  login:                 (email: string, password: string) => Promise<void>;
  logout:                () => Promise<void>;
  selecionarClinica:     (clinica: ClinicaVinculo) => Promise<void>;
  atualizarFotoClinica:  (clinicaId: number, foto: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<Usuario | null>(null);
  const [isLoading, setLoading] = useState(true);

  const clinicaAtual: ClinicaVinculo | null =
    user && user.clinica_id != null
      ? (user.clinicas.find(c => c.id === user.clinica_id) ?? null)
      : null;

  // Restaura sessão do storage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE.USER)
      .then(stored => { if (stored) setUser(JSON.parse(stored)); })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const data = await api.post<any>('/api/v1/auth/login/', { email, password }, true);

    const clinicas: ClinicaVinculo[] = (data.clinicas ?? []).map((c: any) => ({
      id:           c.id,
      nome:         c.nome,
      tipo_usuario: c.tipo_usuario,
      tela_inicial: c.tela_inicial,
      foto:         c.foto ?? null,
    }));

    const loggedUser: Usuario = {
      id:           data.usuario?.id    ?? data.id,
      nome:         data.usuario?.nome  ?? data.nome,
      email:        data.usuario?.email ?? data.email,
      tipo_usuario: clinicas.length === 1 ? clinicas[0].tipo_usuario : null,
      clinica_id:   clinicas.length === 1 ? clinicas[0].id           : null,
      token:        data.access,
      clinicas,
    };

    await AsyncStorage.multiSet([
      [STORAGE.USER,    JSON.stringify(loggedUser)],
      [STORAGE.ACCESS,  data.access],
      [STORAGE.REFRESH, data.refresh],
      ...(loggedUser.clinica_id
        ? [[STORAGE.CLINICA, String(loggedUser.clinica_id)] as [string, string]]
        : []),
    ]);

    setUser(loggedUser);
  }

  async function selecionarClinica(clinica: ClinicaVinculo): Promise<void> {
    if (!user) return;

    const updated: Usuario = {
      ...user,
      tipo_usuario: clinica.tipo_usuario,
      clinica_id:   clinica.id,
    };

    await AsyncStorage.multiSet([
      [STORAGE.USER,    JSON.stringify(updated)],
      [STORAGE.CLINICA, String(clinica.id)],
    ]);

    setUser(updated);
  }

  async function atualizarFotoClinica(clinicaId: number, foto: string): Promise<void> {
    if (!user) return;

    const clinicasAtualizadas = user.clinicas.map(c =>
      c.id === clinicaId ? { ...c, foto } : c
    );

    const updated: Usuario = { ...user, clinicas: clinicasAtualizadas };
    await AsyncStorage.setItem(STORAGE.USER, JSON.stringify(updated));
    setUser(updated);
  }

  async function logout(): Promise<void> {
    // Tenta invalidar o refresh token no backend
    try {
      const refresh = await AsyncStorage.getItem(STORAGE.REFRESH);
      if (refresh) {
        await api.post('/api/v1/auth/logout/', { refresh });
      }
    } catch {
      // Falha no logout da API não impede o logout local
    }

    await AsyncStorage.multiRemove([
      STORAGE.USER,
      STORAGE.ACCESS,
      STORAGE.REFRESH,
      STORAGE.CLINICA,
    ]);

    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, clinicaAtual, isLoading, login, logout, selecionarClinica, atualizarFotoClinica }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return ctx;
}
