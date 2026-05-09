import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export function FuncionarioDashboard() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.role}>Funcionário</Text>
        <Text style={styles.name}>Olá, {user?.nome}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholder}>Painel do Funcionário</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed' },
  header: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  role: { fontSize: 13, color: '#fed7aa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  name: { fontSize: 22, color: '#fff', fontWeight: 'bold', marginTop: 4 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholder: { fontSize: 18, color: '#fdba74' },
  logoutButton: {
    margin: 24,
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
