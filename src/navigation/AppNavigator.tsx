import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { TipoUsuario } from '../types/auth';
import { AdminDashboard } from '../screens/dashboards/AdminDashboard';
import { ProfissionalDashboard } from '../screens/dashboards/ProfissionalDashboard';
import { FuncionarioDashboard } from '../screens/dashboards/FuncionarioDashboard';
import { ResponsavelDashboard } from '../screens/dashboards/ResponsavelDashboard';
import { PacienteDashboard } from '../screens/dashboards/PacienteDashboard';
import { ClinicaSelectorScreen } from '../screens/clinica/ClinicaSelectorScreen';
import { AgendamentosHojeScreen } from '../admin/AgendamentosHojeScreen';
import { AgendamentosCompletosScreen } from '../admin/AgendamentosCompletosScreen';
import { ClinicaPerfilScreen }   from '../screens/clinica/ClinicaPerfilScreen';
import { ClinicaEditarScreen }   from '../screens/clinica/ClinicaEditarScreen';

export type AppStackParams = {
  ClinicaSelector: undefined;
  AdminDashboard: undefined;
  ProfissionalDashboard: undefined;
  FuncionarioDashboard: undefined;
  ResponsavelDashboard: undefined;
  PacienteDashboard: undefined;
  AgendamentosHoje: undefined;
  AgendamentosCompletos: undefined;
  ClinicaPerfil: undefined;
  ClinicaEditar: undefined;
};

const DASHBOARD_BY_TYPE: Record<TipoUsuario, keyof AppStackParams> = {
  ADMIN: 'AdminDashboard',
  PROF:  'ProfissionalDashboard',
  FUNC:  'FuncionarioDashboard',
  RESP:  'ResponsavelDashboard',
  PAC:   'PacienteDashboard',
};

const Stack = createNativeStackNavigator<AppStackParams>();

export function AppNavigator() {
  const { user } = useAuth();

  const initialRoute: keyof AppStackParams = user?.tipo_usuario
    ? DASHBOARD_BY_TYPE[user.tipo_usuario]
    : 'ClinicaSelector';

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="ClinicaSelector"       component={ClinicaSelectorScreen} />
      <Stack.Screen name="AdminDashboard"        component={AdminDashboard} />
      <Stack.Screen name="ProfissionalDashboard" component={ProfissionalDashboard} />
      <Stack.Screen name="FuncionarioDashboard"  component={FuncionarioDashboard} />
      <Stack.Screen name="ResponsavelDashboard"  component={ResponsavelDashboard} />
      <Stack.Screen name="PacienteDashboard"     component={PacienteDashboard} />
      <Stack.Screen name="AgendamentosHoje"      component={AgendamentosHojeScreen} />
      <Stack.Screen name="AgendamentosCompletos" component={AgendamentosCompletosScreen} />
      <Stack.Screen name="ClinicaPerfil"         component={ClinicaPerfilScreen} />
      <Stack.Screen name="ClinicaEditar"         component={ClinicaEditarScreen} />
    </Stack.Navigator>
  );
}
