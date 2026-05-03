import { Redirect, Slot } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function GuardLayout() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (session.role !== 'guard') {
    return <Redirect href={'/(faculty)/(tabs)/home' as never} />;
  }

  return <Slot />;
}
