import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

type AuthUser = {
  id: string;
  erpId: string;
  name: string;
  role: string | null;
};

type Row = {
  name: string;
  erpId: string;
  loginTime: string;
  logoutTime: string;
  date: string;
  totalHours: number;
};

type HomeComponentProps = {
  user?: AuthUser;
  token: string;
  apiBaseUrl: string;
  onLogout?: () => void;
};

const isValidDate = (value: Date | null): value is Date =>
  value !== null && !Number.isNaN(value.getTime());

const formatTime = (value: Date | null): string => {
  if (!isValidDate(value)) {
    return '--';
  }

  return value.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function HomeComponent({
  user,
  token,
  apiBaseUrl,
  onLogout,
}: HomeComponentProps) {
  const [attendance, setAttendance] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/attendance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        setAttendance(null);
        setErrorMessage(json?.error ?? 'Failed to load attendance.');
        return;
      }

      const latest = json?.attendance?.[0];

      if (!latest) {
        setAttendance(null);
        setErrorMessage('No attendance data found yet.');
        return;
      }

      const loginDate = latest.login_time ? new Date(latest.login_time) : null;
      const logoutDate = latest.logout_time ? new Date(latest.logout_time) : null;

      let totalHours = 0;
      if (isValidDate(loginDate) && isValidDate(logoutDate)) {
        const diff = logoutDate.getTime() - loginDate.getTime();
        totalHours = diff > 0 ? diff / (1000 * 60 * 60) : 0;
      }

      setAttendance({
        name: user?.name ?? latest.name ?? '',
        erpId: latest.erpid ?? user?.erpId ?? '',
        loginTime: formatTime(loginDate),
        logoutTime: formatTime(logoutDate),
        date: latest.date ?? '--',
        totalHours,
      });
    } catch {
      setAttendance(null);
      setErrorMessage('Cannot reach server. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, token, user?.erpId, user?.name]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading attendance...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAttendance}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
        {onLogout ? (
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  if (!attendance) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No attendance to show.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAttendance}>
          <Text style={styles.retryText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.heroCard}>
        <Text style={styles.welcomeText}>Welcome back</Text>
        <Text style={styles.title}>{attendance.name}</Text>
        <Text style={styles.subtitle}>Track your campus attendance</Text>

        {onLogout ? (
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statLabel}>Date</Text>
            <Text style={styles.statValue}>{attendance.date}</Text>
          </View>

          <View style={styles.statChip}>
            <Text style={styles.statLabel}>Hours</Text>
            <Text style={styles.statValue}>{attendance.totalHours.toFixed(2)}h</Text>
          </View>
        </View>
      </View>

      <View style={styles.tableWrapper}>
        <Text style={styles.sectionTitle}>Today&apos;s Attendance</Text>

        <View style={styles.detailsTable}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>ERP ID</Text>
            <Text style={styles.detailValue}>{attendance.erpId}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Login</Text>
            <Text style={styles.detailValue}>{attendance.loginTime}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Logout</Text>
            <Text style={styles.detailValue}>{attendance.logoutTime}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Total Hours</Text>
            <Text style={styles.detailValue}>{attendance.totalHours.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#fca5a5',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#1d4ed8',
    borderRadius: 16,
    padding: 16,
  },
  welcomeText: {
    color: '#dbeafe',
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#e0ecff',
    marginTop: 6,
  },
  logoutButton: {
    marginTop: 12,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignSelf: 'flex-start',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#1e40af',
    padding: 10,
    borderRadius: 10,
  },
  statLabel: {
    color: '#bfdbfe',
  },
  statValue: {
    color: '#fff',
    fontWeight: '700',
  },
  tableWrapper: {
    marginTop: 20,
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 14,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  detailsTable: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailItem: {
    width: '48%',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 10,
  },
  detailLabel: {
    color: '#94a3b8',
  },
  detailValue: {
    color: '#fff',
    fontWeight: '700',
  },
});
