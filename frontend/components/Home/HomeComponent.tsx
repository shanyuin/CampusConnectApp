import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
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
  totalHoursLabel: string;
};

type Props = {
  user?: AuthUser;
  token: string;
  apiBaseUrl: string;
  onLogout?: () => void;
};

const formatTime = (value: string | null) => {
  if (!value) return '--';
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '--';
  const date = new Date(dateStr + 'T00:00:00');
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
};

const formatDuration = (start?: string | null, end?: string | null) => {
  if (!start || !end) return '--';

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const diffMs = endTime - startTime;

  if (diffMs <= 0) return '--';

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
};

export default function HomeComponent({
  user,
  token,
  apiBaseUrl,
  onLogout,
}: Props) {
  const [attendance, setAttendance] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasAttendanceData, setHasAttendanceData] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setLoggingOut(true);

    setTimeout(() => {
      onLogout?.();
    }, 800);
  };

  const fetchAttendance = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/attendance?refresh=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json?.error ?? 'Failed to load attendance.');
        return;
      }

      const latest = json?.attendance?.[0];

      if (!latest) {
        setAttendance(null);
        setHasAttendanceData(false);
        return;
      }

      setHasAttendanceData(true);
     // setHasAttendanceData(false);
      const loginDate = latest.login_time;
      const logoutDate =
        latest.effective_logout_time ?? latest.final_logout_time ?? latest.logout_time;

      setAttendance({
        name: user?.name ?? latest.name ?? '',
        erpId: latest.erpid ?? user?.erpId ?? '',
        loginTime: formatTime(loginDate),
        logoutTime: formatTime(logoutDate),
        date: formatDate(latest.date),
        totalHoursLabel: formatDuration(loginDate, logoutDate),
      });
    } catch {
      setErrorMessage('Cannot reach server.');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [apiBaseUrl, token, user]);

  const handleRefresh = useCallback(() => {
    fetchAttendance(true);
  }, [fetchAttendance]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // 🔥 Loading UI
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading attendance...</Text>
      </View>
    );
  }

  // 🔥 Error UI
  if (errorMessage) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{errorMessage}</Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchAttendance()}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>

        {onLogout && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loggingOut}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // 🔥 Main UI (your original design)
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.screenContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#7f1d1d']}
            tintColor="#7f1d1d"
          />
        }
      >
      <View style={styles.heroCard}>

        <Text style={styles.welcomeText}>Welcome back</Text>
        <View style={styles.user}>
        <Text style={styles.title}>{attendance?.name ?? user?.name ?? 'Faculty'}</Text>         
             
        {onLogout && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loggingOut}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}

        </View>

         <Text style={styles.subtitle}>Track your campus attendance</Text>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statLabel}>Date</Text>
            <Text style={styles.statValue}>{attendance?.date ?? '--'}</Text>
          </View>

          <View style={styles.statChip}>
            <Text style={styles.statLabel}>Hours</Text>
            <Text style={styles.statValue}>
              {hasAttendanceData ? attendance?.totalHoursLabel ?? '--' : '--'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tableWrapper}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Today's Attendance</Text>
          <View style={styles.sectionRefreshingBadge}>
          {refreshing ? (
            <>
              <ActivityIndicator size="small" color="#7f1d1d" />
              <Text style={styles.sectionRefreshingText}>Updating...</Text>
            </>
          ) : (
            <Text style={styles.slideHintText}>* Slide down to refresh</Text>
          )}
        </View>
        </View>

        {!hasAttendanceData ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No attendance data yet</Text>
            <Text style={styles.emptyStateText}>
              Pull down to refresh when your attendance is available.
            </Text>
          </View>

        ) : (
          <View style={styles.detailsTable}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>ERP ID</Text>
              <Text style={styles.detailValue}>{attendance?.erpId ?? '--'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Login</Text>
              <Text style={styles.detailValue}>{attendance?.loginTime ?? '--'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Logout</Text>
              <Text style={styles.detailValue}>{attendance?.logoutTime ?? '--'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Total Hours</Text>
              <Text style={styles.detailValue}>
                {attendance?.totalHoursLabel ?? '--'}
              </Text>
            </View>
          </View>
        )}
      

      </View>
      </ScrollView>
      {loggingOut && (
      <View style={styles.logoutOverlay}>
        <View style={styles.logoutBox}>
          <ActivityIndicator size="large" color="#7f1d1d" />
          <Text style={styles.logoutLoadingText}>Logging out...</Text>
        </View>
      </View>
    )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  screenContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  loadingText: {
    color: '#7f1d1d',
    marginTop: 10,
  },
  errorText: {
    color: '#7f1d1d',
    marginBottom: 12,
  },
  retryButton: {
    padding: 10,
    backgroundColor: '#7f1d1d',
    borderRadius: 10,
    marginBottom: 15,
    marginTop: 10,
  },
  retryText: {
    color: '#FFF8F0',
  },
  heroCard: {
    backgroundColor: '#7f1d1d',
    borderRadius: 16,
    padding: 16,
  },
  refreshingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  refreshingText: {
    color: '#FFF8F0',
    fontWeight: '600',
  },
  welcomeText: {
    color: '#F5E6D3',
  },
  title: {
    color: '#FFF8F0',
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  subtitle: {
    color: '#F5E6D3',
    marginTop:8,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#5c1212',
    
    borderRadius: 10,
    alignSelf: 'auto',
  },
  logoutText: {
    color: '#FFF8F0',
    // color:'#db0b0b',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#5c1212',
    padding: 10,
    borderRadius: 10,
  },
  statLabel: {
    color: '#F5E6D3',
  },
  statValue: {
    color: '#FFF8F0',
    fontWeight: '700',
  },
  tableWrapper: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8D5C4',
  },
  sectionTitle: {
    color: '#7f1d1d',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionRefreshingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '45%', 
  },
  sectionRefreshingText: {
    color: '#7f1d1d',
    fontWeight: '600',
  },
  detailsTable: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emptyState: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#E8D5C4',
  },
  emptyStateTitle: {
    color: '#7f1d1d',
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyStateText: {
    color: '#9e7b6e',
  },
  detailItem: {
    width: '48%',
    backgroundColor: '#FFF8F0',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8D5C4',
  },
  detailLabel: {
    color: '#9e7b6e',
  },
  detailValue: {
    color: '#7f1d1d',
    fontWeight: '700',
  },
  slideHintText: {
  color: '#9e7b6e',
  fontSize: 12,
  fontWeight: '500',
  flexShrink: 1,
  flexWrap: 'wrap',
  textAlign: 'right',
  },
  logoutOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'center',
  alignItems: 'center',
},

logoutBox: {
  backgroundColor: '#FFFFFF',
  padding: 20,
  borderRadius: 14,
  alignItems: 'center',
  gap: 10,
},

logoutLoadingText: {
  color: '#7f1d1d',
  fontWeight: '600',
},
});
