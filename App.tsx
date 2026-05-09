import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiProvider } from './src/contexts/ApiContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ApiProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ApiProvider>
    </SafeAreaProvider>
  );
}
