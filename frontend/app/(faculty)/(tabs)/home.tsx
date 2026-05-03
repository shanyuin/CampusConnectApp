import HomeComponent from '../../../components/Home/HomeComponent';
import { useAuth } from '../../../context/AuthContext';

export default function FacultyHomeScreen() {
  const { apiBaseUrl, session, signOut } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <HomeComponent
      user={session.user}
      token={session.token}
      apiBaseUrl={apiBaseUrl}
      onLogout={signOut}
    />
  );
}
