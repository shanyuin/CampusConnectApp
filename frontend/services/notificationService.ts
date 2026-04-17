import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

export async function requestNotificationPermission() {
  try {
    const authStatus = await messaging().requestPermission();

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }

    return enabled;
  } catch (error) {
    console.warn('Notification permission unavailable:', error);
    return false;
  }
}

export async function getFCMToken() {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.warn('FCM token unavailable:', error);
    return null;
  }
}

export function setupForegroundListener() {
  try {
    return messaging().onMessage(async remoteMessage => {
      console.log('Foreground Message:', remoteMessage);

      Alert.alert(
        remoteMessage.notification?.title || 'Notification',
        remoteMessage.notification?.body || ''
      );
    });
  } catch (error) {
    console.warn('Foreground listener unavailable:', error);
    return () => {};
  }
}

export function setupBackgroundHandler() {
  try {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background Message:', remoteMessage);
    });
  } catch (error) {
    console.warn('Background handler unavailable:', error);
  }
}

export function setupTokenRefresh(onTokenRefresh: (token: string) => void) {
  try {
    return messaging().onTokenRefresh(token => {
      console.log('Token refreshed:', token);
      onTokenRefresh(token);
    });
  } catch (error) {
    console.warn('Token refresh listener unavailable:', error);
    return () => {};
  }
}
