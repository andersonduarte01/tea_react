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
import { NovoProfissionalScreen } from '../admin/NovoProfissionalScreen';
import { NovoFuncionarioScreen }  from '../admin/NovoFuncionarioScreen';
import { ClinicaPerfilScreen }   from '../screens/clinica/ClinicaPerfilScreen';
import { ClinicaEditarScreen }   from '../screens/clinica/ClinicaEditarScreen';
import { AdminPerfilScreen }     from '../screens/admin/AdminPerfilScreen';
import { AdminEditarScreen }    from '../screens/admin/AdminEditarScreen';
import { AlterarSenhaScreen }        from '../screens/admin/AlterarSenhaScreen';
import { ProfissionalPerfilScreen }  from '../screens/profissional/ProfissionalPerfilScreen';
import { ProfissionalEditarScreen }  from '../screens/profissional/ProfissionalEditarScreen';
import { ProfissionalNovaSenhaScreen }    from '../screens/profissional/ProfissionalNovaSenhaScreen';
import { MeuPerfilProfissionalScreen }   from '../screens/profissional/MeuPerfilProfissionalScreen';
import { MeuPerfilEditarScreen }         from '../screens/profissional/MeuPerfilEditarScreen';
import { FaltasHojeScreen }      from '../admin/FaltasHojeScreen';
import { NovoFeriadoScreen }     from '../admin/NovoFeriadoScreen';
import { FeriadosScreen }           from '../admin/FeriadosScreen';
import { FuncionarioPerfilScreen }  from '../screens/funcionario/FuncionarioPerfilScreen';
import { FuncionarioEditarScreen }  from '../screens/funcionario/FuncionarioEditarScreen';
import { FuncionarioNovaSenhaScreen } from '../screens/funcionario/FuncionarioNovaSenhaScreen';
import { NovaAgendaScreen }   from '../screens/agenda/NovaAgendaScreen';
import { EditarAgendaScreen } from '../screens/agenda/EditarAgendaScreen';

export type AppStackParams = {
  ClinicaSelector: undefined;
  AdminDashboard: undefined;
  ProfissionalDashboard: undefined;
  FuncionarioDashboard: undefined;
  ResponsavelDashboard: undefined;
  PacienteDashboard: undefined;
  AgendamentosHoje: undefined;
  AgendamentosCompletos: { initialFilter?: 'todos' | 'aguardando' | 'realizado' | 'cancelado' | 'nao_compareceu' } | undefined;
  NovoProfissional: undefined;
  NovoFuncionario: undefined;
  ClinicaPerfil: undefined;
  ClinicaEditar: undefined;
  AdminPerfil:   undefined;
  AdminEditar:   undefined;
  AlterarSenha:      undefined;
  MeuPerfilProfissional: undefined;
  MeuPerfilEditar:       undefined;
  ProfissionalPerfil:    { id: number };
  ProfissionalEditar:    { id: number };
  ProfissionalNovaSenha: { id: number };
  FaltasHoje: undefined;
  NovoFeriado: undefined;
  Feriados: undefined;
  FuncionarioPerfil:    { id: number };
  FuncionarioEditar:    { id: number };
  FuncionarioNovaSenha: { id: number };
  NovaAgenda:    { profissionalId: number; nome: string };
  EditarAgenda:  { profissionalId: number; agendaId: number; nome: string };
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
      <Stack.Screen name="NovoProfissional"      component={NovoProfissionalScreen} />
      <Stack.Screen name="NovoFuncionario"       component={NovoFuncionarioScreen} />
      <Stack.Screen name="ClinicaPerfil"         component={ClinicaPerfilScreen} />
      <Stack.Screen name="ClinicaEditar"         component={ClinicaEditarScreen} />
      <Stack.Screen name="AdminPerfil"           component={AdminPerfilScreen} />
      <Stack.Screen name="AdminEditar"           component={AdminEditarScreen} />
      <Stack.Screen name="AlterarSenha"         component={AlterarSenhaScreen} />
      <Stack.Screen name="MeuPerfilProfissional" component={MeuPerfilProfissionalScreen} />
      <Stack.Screen name="MeuPerfilEditar"       component={MeuPerfilEditarScreen} />
      <Stack.Screen name="ProfissionalPerfil"   component={ProfissionalPerfilScreen} />
      <Stack.Screen name="ProfissionalEditar"    component={ProfissionalEditarScreen} />
      <Stack.Screen name="ProfissionalNovaSenha" component={ProfissionalNovaSenhaScreen} />
      <Stack.Screen name="FaltasHoje"            component={FaltasHojeScreen} />
      <Stack.Screen name="NovoFeriado"           component={NovoFeriadoScreen} />
      <Stack.Screen name="Feriados"              component={FeriadosScreen} />
      <Stack.Screen name="FuncionarioPerfil"    component={FuncionarioPerfilScreen} />
      <Stack.Screen name="FuncionarioEditar"    component={FuncionarioEditarScreen} />
      <Stack.Screen name="FuncionarioNovaSenha" component={FuncionarioNovaSenhaScreen} />
      <Stack.Screen name="NovaAgenda"          component={NovaAgendaScreen} />
      <Stack.Screen name="EditarAgenda"        component={EditarAgendaScreen} />
    </Stack.Navigator>
  );
}
