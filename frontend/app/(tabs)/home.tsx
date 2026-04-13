import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeComponent from '../../components/Home/HomeComponent';

type AuthUser = {
  id: string;
  erpId: string;
  name: string;
  role: string | null;
};

export default function HomeTab() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false); // ✅ NEW

  const apiBaseUrl = useMemo(
    () => process.env.EXPO_PUBLIC_API_URL ?? 'https://campusconnectapp-lu1d.onrender.com',
    []
  );

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('token');
        const savedUser = await AsyncStorage.getItem('user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.log('Error loading auth:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAuth();
  }, []);

  // ✅ SAFE redirect (only once)
  useEffect(() => {
    if (!loading && (!token || !user) && !hasRedirected) {
      setHasRedirected(true);
      router.replace('/');
    }
  }, [token, user, loading, hasRedirected]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      setToken(null);
      setUser(null);
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  if (loading) return null;
  if (!token || !user) return null;

  return (
    <HomeComponent
      user={user}
      token={token}
      apiBaseUrl={apiBaseUrl}
      onLogout={handleLogout}
    />
  );
}