import React from 'react';
import { config } from './config';
import { View, ViewProps, useColorScheme as useRNColorScheme } from 'react-native';

export type ModeType = 'light' | 'dark' | 'system';

export function GluestackUIProvider({
  mode = 'light',
  ...props
}: {
  mode?: ModeType;
  children?: React.ReactNode;
  style?: ViewProps['style'];
}) {
  const systemScheme = useRNColorScheme();
  const resolvedMode = mode === 'system' ? (systemScheme ?? 'light') : mode;

  return (
    <View
      style={[
        config[resolvedMode],
        { flex: 1, height: '100%', width: '100%' },
        props.style,
      ]}
    >
      {props.children}
    </View>
  );
}
