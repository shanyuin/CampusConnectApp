import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function IndexScreen() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return session.role === 'guard' ? (
    <Redirect href={'/(guard)/scan' as never} />
  ) : (
    <Redirect href={'/(faculty)/(tabs)/home' as never} />
  );
}
