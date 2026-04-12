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

  const apiBaseUrl = useMemo(
    () => process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:5000',
    []
  );

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('authToken');
        const savedUser = await AsyncStorage.getItem('authUser');
        
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        } else {
          router.replace('/');
        }
      } catch (error) {
        console.error('Error loading auth:', error);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    loadAuth();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
    router.replace('/');
  };

  if (loading) {
    return null;
  }

  if (!token || !user) {
    return null;
  }

  return (
    <HomeComponent
      user={user}
      token={token}
      apiBaseUrl={apiBaseUrl}
      onLogout={handleLogout}
    />
  );
}
