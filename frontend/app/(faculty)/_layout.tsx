import { Redirect, Slot } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function FacultyLayout() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (session.role !== 'faculty') {
    return <Redirect href={'/(guard)/scan' as never} />;
  }

  return <Slot />;
}
