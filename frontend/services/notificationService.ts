import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


const NOTIFICATION_PERMISSION_ASKED_KEY = 'notification_permission_asked';

async function isAndroidNotificationPermissionGranted() {
  if (Platform.OS !== 'android') return false;
  if (Platform.Version < 33) return true;
  return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
}

export async function requestNotificationPermission() {
  try {
    if (Platform.OS === 'android') {
      const alreadyGranted = await isAndroidNotificationPermissionGranted();
      if (alreadyGranted) {
        return true;
      }

      const alreadyAsked = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_ASKED_KEY);
      if (alreadyAsked) {
        return false;
      }

      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_ASKED_KEY, 'true');
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }

      return true;
    }

    const authStatus = await messaging().requestPermission();
    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_ASKED_KEY, 'true');

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
      // Intentionally do not show in-app alerts.
      // We only want OS/system notifications when app is in background/closed.
      console.log('Foreground message received (no in-app popup):', remoteMessage?.messageId);
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
