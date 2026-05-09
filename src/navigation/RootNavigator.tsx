import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { OnboardingScreen, ONBOARDING_KEY } from '../screens/onboarding/OnboardingScreen';

export function RootNavigator() {
  const { user, isLoading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(value => {
      setOnboardingDone(value === 'true');
    });
  }, []);

  if (isLoading || onboardingDone === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!user && !onboardingDone) {
    return (
      <OnboardingScreen
        onFinish={async () => {
          await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
          setOnboardingDone(true);
        }}
      />
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
