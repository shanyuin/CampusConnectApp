import { useMemo, useState } from 'react';
import HomeComponent from '../components/Home/HomeComponent';
import LoginComponent from '../components/Logins/LoginComponent';

type AuthUser = {
  id: string;
  erpId: string;
  name: string;
  role: string | null;
};

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const apiBaseUrl = useMemo(
    () => process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.177.250:5000',
    [],
  );

  const handleLoginSuccess = (nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
  };

  if (!token || !user) {
    return (
      <LoginComponent
        apiBaseUrl={apiBaseUrl}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <HomeComponent
      user={user}
      onLogout={() => {
        setToken(null);
        setUser(null);
      }}
    />
  );
}
