import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from "../context/AuthContext";
import "../global.css";
import "../shim";

function RootLayoutNav() {
  const { user, isLoading, connectedDevice } = useAuth(); 
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inConnectScreen = segments[0] === 'connect-device';

    if (!user && !inAuthGroup) {
      // 1. Non loggato -> Login
      router.replace('/(auth)/login');
    } else if (user) {
      // Utente Loggato
      if (!connectedDevice) {
          // 2. Loggato ma Non Connesso -> Connect Device
         if (!inConnectScreen) {
           router.replace('/connect-device');
         }
      } else if (connectedDevice) {
         // 3. Loggato e Connesso -> Dashboard
         
         if (inAuthGroup || inConnectScreen) {
           router.replace('/(tabs)');
         }
      }
    }
  }, [user, isLoading, connectedDevice, segments]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="connect-device" options={{ title: 'Connessione Box' }} />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}