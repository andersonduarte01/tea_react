import './global.css';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiProvider } from './src/contexts/ApiContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';

export default function App() {
  return (
    
    <GluestackUIProvider mode="dark">
      <SafeAreaProvider>
      <ApiProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ApiProvider>
    </SafeAreaProvider>
    </GluestackUIProvider>
  
  );
}
