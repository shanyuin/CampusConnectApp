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
    () => process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000',
    [],
  );

  const handleLoginSuccess = async (nextToken: string, nextUser: AuthUser) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${nextToken}` },
      });

      const payload = (await response.json()) as
        | { user: AuthUser }
        | { error?: string };

      if (!response.ok || !('user' in payload)) {
        setToken(null);
        setUser(null);
        return;
      }

      setToken(nextToken);
      setUser(payload.user ?? nextUser);
    } catch {
      setToken(null);
      setUser(null);
    }
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
