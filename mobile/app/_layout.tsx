import { Slot, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-splash-screen';
import { useEffect } from 'react';
import { store } from '@/store';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NetworkProvider } from '@/context/NetworkContext';
import { NotificationProvider } from '@/context/NotificationContext';

// Prevent splash screen from hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <ThemeProvider>
          <AuthProvider>
            <NetworkProvider>
              <NotificationProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="auth" />
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen name="settings" />
                  <Stack.Screen name="vault" />
                  <Stack.Screen name="trading" />
                  <Stack.Screen name="portfolio" />
                </Stack>
                <StatusBar style="auto" />
              </NotificationProvider>
            </NetworkProvider>
          </AuthProvider>
        </ThemeProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
