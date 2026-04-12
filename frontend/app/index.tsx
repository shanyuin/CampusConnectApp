import { useRouter } from 'expo-router';
import { useMemo, useEffect , useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginComponent from '../components/Logins/LoginComponent';

type AuthUser = {
  id: string;
  erpId: string;
  name: string;
  role: string | null;
};

export default function Login() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const router = useRouter();

  const apiBaseUrl = useMemo(
    () => process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:5000',
    []
  );

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = await AsyncStorage.getItem('authToken');
      if (savedToken) {
        // User is already logged in, navigate to tabs
        router.replace('/home');
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    router.replace('/home');
  };

 

  return (
  
      <LoginComponent
        apiBaseUrl={apiBaseUrl}
        onLoginSuccess={handleLoginSuccess}
      />

    
  );
}
