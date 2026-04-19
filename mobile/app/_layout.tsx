import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { COLORS } from '@/constants/game';

// Prevent splash screen from auto-hiding before we're ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen once layout is mounted
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor={COLORS.background} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.accent,
          headerTitleStyle: {
            fontSize: 20,
          },
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'لعبة الحزر',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="lobby/[code]"
          options={{
            title: 'الانتظار',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="game/[code]"
          options={{
            title: 'اللعبة',
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}
