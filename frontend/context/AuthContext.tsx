import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { clearFCMToken, removeStoredFCMToken } from '../services/notificationService';
import { AuthSession } from '../types/auth';

const TOKEN_KEY = 'token';
const ROLE_KEY = 'role';
 export const USER_KEY = 'user';
const LAST_LOGIN_CREDENTIALS_KEY = 'last_login_credentials';


type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  isSigningOut: boolean;
  apiBaseUrl: string;
  signIn: (session: AuthSession) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

 // const apiBaseUrl = 'http://10.250.122.90:5000';  // Replace with your actual API base URL
 const apiBaseUrl="https://campusconnectapp-lu1d.onrender.com"
  // const apiBaseUrl = 'http://localho?st:5000';  // Replace with your actual API base URL

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
      isSigningOut,
      apiBaseUrl,
      signIn: async nextSession => {
        await Promise.all([
          AsyncStorage.setItem(TOKEN_KEY, nextSession.token),
          AsyncStorage.setItem(USER_KEY, JSON.stringify(nextSession.user)),
          AsyncStorage.setItem(ROLE_KEY, nextSession.role),
          
        ]);
        console.log(JSON.stringify(nextSession.user, null, 2));

        setSession(nextSession);
      },
      signOut: async () => {
        setIsSigningOut(true);
        const authToken = session?.token;

        try {
          if (authToken) {
            await removeStoredFCMToken(apiBaseUrl, authToken);
          }

          await clearFCMToken();
          await Promise.all([
            AsyncStorage.removeItem(TOKEN_KEY),
            AsyncStorage.removeItem(USER_KEY),
            AsyncStorage.removeItem(ROLE_KEY),
            AsyncStorage.removeItem(LAST_LOGIN_CREDENTIALS_KEY),
          ]);

          setSession(null);
        } finally {
          setIsSigningOut(false);
        }
      },
    }),
    [apiBaseUrl, isLoading, isSigningOut, session],
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

