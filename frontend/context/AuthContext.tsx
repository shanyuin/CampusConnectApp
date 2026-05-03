import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { clearFCMToken, removeStoredFCMToken } from '../services/notificationService';
import { AuthSession } from '../types/auth';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const ROLE_KEY = 'role';

type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  apiBaseUrl: string;
  signIn: (session: AuthSession) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [token, userJson, role] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(ROLE_KEY),
        ]);

        if (!token || !userJson || !role) {
          setSession(null);
          return;
        }

        const user = JSON.parse(userJson) as AuthSession['user'];
        setSession({
          token,
          role: role as AuthSession['role'],
          user,
        });
      } catch (error) {
        console.warn('Failed to restore auth session:', error);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      apiBaseUrl,
      signIn: async nextSession => {
        await Promise.all([
          AsyncStorage.setItem(TOKEN_KEY, nextSession.token),
          AsyncStorage.setItem(USER_KEY, JSON.stringify(nextSession.user)),
          AsyncStorage.setItem(ROLE_KEY, nextSession.role),
        ]);

        setSession(nextSession);
      },
      signOut: async () => {
        const authToken = session?.token;

        if (authToken) {
          await removeStoredFCMToken(apiBaseUrl, authToken);
        }

        await clearFCMToken();
        await Promise.all([
          AsyncStorage.removeItem(TOKEN_KEY),
          AsyncStorage.removeItem(USER_KEY),
          AsyncStorage.removeItem(ROLE_KEY),
        ]);

        setSession(null);
      },
    }),
    [apiBaseUrl, isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
