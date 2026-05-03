import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginComponent from '../components/Logins/LoginComponent';
import { requestNotificationPermission, setupForegroundListener , setupBackgroundHandler, clearFCMToken, removeStoredFCMToken } from '../services/notificationService';

type AuthUser = {
  id: string;
  erpId: string;
  name: string;
  role: string | null;
};


export default function Login() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const apiBaseUrl = 'https://campusconnectapp-lu1d.onrender.com';

  // 🔥 Load saved login on app start
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('token');
        const savedUser = await AsyncStorage.getItem('user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          const parsed = JSON.parse(savedUser);
          setUser(parsed);

          const isGuardRole = (r?: string | null) => typeof r === 'string' && r.toLowerCase().includes('guard');

          // Auto redirect if already logged in — send guards to guardhome
          if (isGuardRole(parsed?.role)) {
            router.replace('/guardhome');
          } else {
            router.replace('/(tabs)/home');
          }
        }
      } catch (error) {
        console.log('Error loading auth:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAuthData();
  }, []);

   // Setup notifications
  useEffect(() => {
    const setupNotifications = async () => {
      const enabled = await requestNotificationPermission();
      if (enabled) {
        setupForegroundListener();
        setupBackgroundHandler();
      }
    };

    setupNotifications();

  }, []);



  // 🔐 Login success handler
  const handleLoginSuccess = async (
    nextToken: string,
    nextUser: AuthUser
  ) => {
    console.log('🔴 handleLoginSuccess ENTERED with nextUser:', nextUser);
    try {
      // Debug: log role received after login
    //  try { console.log('handleLoginSuccess - role:', nextUser?.role); } catch (_) {}
      await AsyncStorage.setItem('token', nextToken);
      await AsyncStorage.setItem('user', JSON.stringify(nextUser));

      setToken(nextToken);
      setUser(nextUser);

      // Navigate after login — send guards to guardhome
      const isGuardRole = (r?: string | null) => typeof r === 'string' && r.toLowerCase().includes('guard');
    //  try { console.log('handleLoginSuccess - isGuardRole check:', isGuardRole(nextUser?.role)); } catch (_) {}
      
      if (isGuardRole(nextUser?.role)) {
     //   try { console.log('handleLoginSuccess - Navigating to /guardhome'); } catch (_) {}
        router.replace('/guardhome');
      } else {
      //  try { console.log('handleLoginSuccess - Navigating to /(tabs)/home'); } catch (_) {}
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.log('Login save error:', error);
    }
  };

  // 🚪 Logout handler
  const handleLogout = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('token');
      if (savedToken) {
        await removeStoredFCMToken(apiBaseUrl, savedToken);
      }

      await clearFCMToken();
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      setToken(null);
      setUser(null);

      router.replace('/');
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  // ⏳ Prevent blank screen during startup
  if (loading) {
    return null; // You can replace with Splash Screen
  }

  // 🔐 If NOT logged in → show Login
  if (!token || !user) {
    return (
      <LoginComponent
        apiBaseUrl={apiBaseUrl}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // If logged in, the app navigates into the tabs stack.
  return null;
}
