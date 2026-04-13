import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeComponent from '../components/Home/HomeComponent';
import LoginComponent from '../components/Logins/LoginComponent';
import { requestNotificationPermission, setupForegroundListener, setupBackgroundHandler } from '../services/notificationService';

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
          setUser(JSON.parse(savedUser));

          // 🔥 Auto redirect if already logged in
          router.replace('/(tabs)/home' as any);
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
    try {
      await AsyncStorage.setItem('token', nextToken);
      await AsyncStorage.setItem('user', JSON.stringify(nextUser));

      setToken(nextToken);
      setUser(nextUser);

      // 🔥 Navigate after login
      router.replace('/(tabs)/home' as any);
    } catch (error) {
      console.log('Login save error:', error);
    }
  };

  // 🚪 Logout handler
  const handleLogout = async () => {
    try {
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

  // ✅ If logged in → show Home
  return (
    <HomeComponent
      user={user}
      token={token}
      apiBaseUrl={apiBaseUrl}
      onLogout={handleLogout}
    />
  );
}