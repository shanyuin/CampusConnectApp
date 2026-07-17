import FacultySessionForm from '@/components/Faculty/FacultySessionForm';
import { useAuth } from '../../../context/AuthContext';

export default function StudentAttendance() {
  const { session } = useAuth();

  if (!session) {
    return null;
  }

  return <FacultySessionForm token={session.token} />;
}


