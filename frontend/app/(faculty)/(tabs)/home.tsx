import FacultyAttendanceHome from '../../../components/Faculty/FacultyAttendanceHome';
import { useAuth } from '../../../context/AuthContext';

export default function FacultyHomeScreen() {
  const { apiBaseUrl, session } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <FacultyAttendanceHome
      user={session.user}
      token={session.token}
      apiBaseUrl={apiBaseUrl}
    />
  );
}
