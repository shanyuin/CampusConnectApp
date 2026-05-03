import { Redirect } from 'expo-router';
import LoginComponent from '../components/Logins/LoginComponent';
import { useAuth } from '../context/AuthContext';
import { AuthSession } from '../types/auth';

export default function LoginScreen() {
  const { apiBaseUrl, isLoading, session, signIn } = useAuth();

  if (isLoading) {
    return null;
  }

  if (session) {
    return session.role === 'guard' ? (
      <Redirect href={'/(guard)/scan' as never} />
    ) : (
      <Redirect href={'/(faculty)/(tabs)/home' as never} />
    );
  }

  const handleLoginSuccess = async (nextSession: AuthSession) => {
    await signIn(nextSession);
  };

  return (
    <LoginComponent
      apiBaseUrl={apiBaseUrl}
      onLoginSuccess={handleLoginSuccess}
    />
  );
}
