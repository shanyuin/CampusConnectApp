import { Stack } from 'expo-router';
import { useEffect } from 'react';

import {
  requestNotificationPermission,
  getFCMToken,
  setupForegroundListener
} from '../services/notificationService';

export default function RootLayout() {

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initNotifications() {
      console.log("App started");

      const granted = await requestNotificationPermission();

      if (granted) {
        const token = await getFCMToken();
        console.log("Device Token:", token);

        // 🔥 TODO: send this token to backend (VERY IMPORTANT)
      }

      // 🔥 Setup foreground listener AFTER permission
      unsubscribe = setupForegroundListener();
    }

    initNotifications();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 🔥 Main app navigation */}
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
    </Stack>
  );
}