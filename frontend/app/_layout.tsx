import { Stack } from 'expo-router';
import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { requestNotificationPermission, getFCMToken, setupForegroundListener } from '../services/notificationService';

// Register background handler defensively so app won't crash when Firebase
// is not configured in a build variant.
try {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background Message:', remoteMessage);
  });
} catch (error) {
  console.warn('Background handler not registered:', error);
}

export default function RootLayout() {

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initNotifications() {
      console.log("App started");

      const granted = await requestNotificationPermission();

      if (granted) {
        const token = await getFCMToken();
        console.log("Device Token:", token);
      }

      unsubscribe = setupForegroundListener();
    }

    initNotifications();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="guardhome" />
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
