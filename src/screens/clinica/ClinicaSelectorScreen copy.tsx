import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { ClinicaVinculo, TipoUsuario } from '../../types/auth';
import { AppStackParams } from '../../navigation/AppNavigator';

const TIPO_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  PROF:  'Profissional',
  FUNC:  'Funcionário',
  RESP:  'Responsável',
  PAC:   'Paciente',
};

const DASHBOARD_BY_TYPE: Record<TipoUsuario, keyof AppStackParams> = {
  ADMIN: 'AdminDashboard',
  PROF:  'ProfissionalDashboard',
  FUNC:  'FuncionarioDashboard',
  RESP:  'ResponsavelDashboard',
  PAC:   'PacienteDashboard',
};

type Nav = NativeStackNavigationProp<AppStackParams>;

export function ClinicaSelectorScreen() {
  const { user, selecionarClinica } = useAuth();
  const navigation = useNavigation<Nav>();

  async function handleSelect(clinica: ClinicaVinculo) {
    await selecionarClinica(clinica);
    navigation.replace(DASHBOARD_BY_TYPE[clinica.tipo_usuario]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Selecione a Clínica</Text>
        <Text style={styles.subtitle}>
          Olá, {user?.nome}. Você possui acesso a mais de uma clínica.
        </Text>
      </View>

      <FlatList
        data={user?.clinicas ?? []}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleSelect(item)}
            activeOpacity={0.75}
          >
            <Text style={styles.clinicaNome}>{item.nome}</Text>
            <Text style={styles.clinicaTipo}>
              {TIPO_LABEL[item.tipo_usuario] ?? item.tipo_usuario}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
  },
  list: {
    paddingHorizontal: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  clinicaNome: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  clinicaTipo: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '500',
  },
});
