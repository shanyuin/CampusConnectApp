import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

type Row = {
  Date: string;
  Day: string;
  LoginTime: string;
  LogoutTime: string;
  TotalHoursLabel: string;
};

type AttendanceApiRow = {
  login_time?: string | null;
  logout_time?: string | null;
  final_logout_time?: string | null;
  effective_logout_time?: string | null;
  date?: string | null;
};



const formatDate = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;

const formatMonth = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const formatTime = (value?: string | null) => {
  if (!value) return '--';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

const toDayName = (dateStr?: string | null) => {
  if (!dateStr) return '--';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
};



export default function PreviousAttendance() {
  const { apiBaseUrl } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterMode, setFilterMode] = useState<'date' | 'month'>('date');
  const [selectedDate, setSelectedDate] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(new Date());
  const tableRef = useRef<ScrollView>(null);

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [pickerMode, setPickerMode] = useState<'from' | 'to' | null>(null);

  const fetchHistory = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${apiBaseUrl}/api/attendance/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        const mapped = data.attendance.map((item: AttendanceApiRow) => {
          const effectiveLogoutTime =
            item.effective_logout_time ?? item.final_logout_time ?? item.logout_time;

          return {
            Date: item.date ?? '--',
            Day: toDayName(item.date),
            LoginTime: formatTime(item.login_time),
            LogoutTime: formatTime(effectiveLogoutTime),
            TotalHoursLabel: formatDuration(item.login_time, effectiveLogoutTime),
          };
        });

        setRows(mapped);

        if (mapped.length > 0) {
          setDatePickerValue(new Date(`${mapped[0].Date}T00:00:00`));
        }
      } catch {
        setRows([]);
      }
    };

    const handleRefresh = async () => {
      setRefreshing(true);
      await fetchHistory();
      setRefreshing(false);
    };

  useEffect(() => {
    fetchHistory();
  }, [apiBaseUrl]);

  const filteredRows = useMemo(() => {
  if (filterMode === 'date') {
    if (selectedDate === 'All') return rows;

    const [day, month, year] = selectedDate.split('-');
    const selected = new Date(`${year}-${month}-${day}T00:00:00`);
    const weekStart = new Date(selected);
    weekStart.setDate(selected.getDate() - selected.getDay());

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return rows.filter((r) => {
      const d = new Date(r.Date + 'T00:00:00');
      return d >= weekStart && d <= weekEnd;
    });
  }

  if (filterMode === 'month') {
    if (!fromDate || !toDate) return rows;

    const start = fromDate < toDate ? fromDate : toDate;
    const end = fromDate < toDate ? toDate : fromDate;

    // 🔥 make "to" inclusive (end of day)
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);

    return rows.filter((r) => {
      const d = new Date(r.Date + 'T00:00:00');
      return d >= start && d <= endOfDay;
    });
  }

  return rows;
}, [rows, filterMode, selectedDate, fromDate, toDate]);

  const onDateChange = (_: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (!date) return;
    if (filterMode === 'month' && pickerMode) {
    if (pickerMode === 'from') setFromDate(date);
      else setToDate(date);
      return;
    }
    setDatePickerValue(date);
    filterMode === 'date'
      ? setSelectedDate(formatDate(date))
      : setSelectedMonth(formatMonth(date));
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.tableWrapper}>

        {/* FILTER MODE BUTTONS */}
        <View style={styles.filterModeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, filterMode === 'date' && styles.modeBtnActive]}
            onPress={() => setFilterMode('date')}
          >
            <Text style={filterMode === 'date' ? styles.modeBtnTextActive : styles.modeBtnText}>
              Date
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, filterMode === 'month' && styles.modeBtnActive]}
            onPress={() => setFilterMode('month')}
          >
            <Text style={filterMode === 'month' ? styles.modeBtnTextActive : styles.modeBtnText}>
              Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* DATE PICKER BUTTON */}
        <View style={styles.dateFilterRow}>
          <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.datePickerBtnText}>
              {filterMode === 'date'
                ? selectedDate === 'All' ? 'Select Date' : selectedDate
                : selectedMonth === 'All' ? 'Select Month' : selectedMonth}
            </Text>
          </TouchableOpacity>
        </View>

        {filterMode === 'date' && (
          <View style={styles.refreshHintWrapper}>
            {refreshing ? (
              <View style={styles.refreshRow}>
                <ActivityIndicator size="small" color="#7f1d1d" />
                <Text style={styles.refreshHintText}>Updating...</Text>
              </View>
            ) : (
              <Text style={styles.refreshHintText}>* Slide down to refresh</Text>
            )}
          </View>
        )}

        <View style={styles.dateFilterRow}></View>
        {filterMode === 'month' && (<>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          
          <TouchableOpacity
            style={[styles.datePickerBtn, { flex: 1 }]}
            onPress={() => {
              setPickerMode('from');
              setShowDatePicker(true);
            }}
          >
            <Text style={styles.datePickerBtnText}>
              {fromDate ? formatDate(fromDate) : 'From'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.datePickerBtn, { flex: 1 }]}
            onPress={() => {
              setPickerMode('to');
              setShowDatePicker(true);
            }}
          >
            <Text style={styles.datePickerBtnText}>
              {toDate ? formatDate(toDate) : 'To'}
            </Text>
          </TouchableOpacity>

          </View>
          <View style={styles.refreshHintWrapper}>
            {refreshing ? (
              <View style={styles.refreshRow}>
                <ActivityIndicator size="small" color="#7f1d1d" />
                <Text style={styles.refreshHintText}>Updating...</Text>
              </View>
            ) : (
              <Text style={styles.refreshHintText}>* Slide down to refresh</Text>
            )}
          </View>
        </>
      )}
          

        {showDatePicker && (
          <DateTimePicker value={datePickerValue} mode="date" onChange={onDateChange} />
        )}

        {/* TABLE */}
        <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#7f1d1d']}
                tintColor="#7f1d1d"
              />
            }
          >
          <ScrollView horizontal ref={tableRef}>
            <View style={styles.tableContent}>

              {/* HEADER */}
              <View style={styles.headerRow}>
                <Text style={styles.headerCell}>Date</Text>
                <Text style={styles.headerCell}>Day</Text>
                <Text style={styles.headerCell}>Login</Text>
                <Text style={styles.headerCell}>Logout</Text>
                <Text style={styles.headerCell}>Hours</Text>
              </View>

              {/* DATA ROWS */}
              {filteredRows.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>No records found</Text>
                </View>
              ) : (
                filteredRows.map((row, i) => (
                  <View key={i} style={[styles.row, i % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
                    <Text style={styles.cell}>
                      {row.Date !== '--'
                        ? formatDate(new Date(row.Date + 'T00:00:00'))
                        : '--'}
                    </Text>
                    <Text style={styles.cell}>{row.Day}</Text>
                    <Text style={styles.cell}>{row.LoginTime}</Text>
                    <Text style={styles.cell}>{row.LogoutTime}</Text>
                    <Text style={styles.cell}>{row.TotalHoursLabel}</Text>
                  </View>
                ))
              )}

            </View>
          </ScrollView>
        </ScrollView>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  tableWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8D5C4',
    padding: 10,
  },
  filterModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  modeBtn: {
    flex: 1,
    borderColor: '#7f1d1d',
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
  },
  modeBtnActive: {
    backgroundColor: '#7f1d1d',
  },
  modeBtnText: {
    color: '#7f1d1d',
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateFilterRow: {
    marginBottom: 10,
  },
  datePickerBtn: {
    borderWidth: 1,
    borderColor: '#7f1d1d',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFF8F0',
  },
  datePickerBtnText: {
    color: '#7f1d1d',
    fontWeight: '600',
  },
  tableContent: {
    width: 575,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#7f1d1d',
    padding: 10,
    borderRadius: 6,
    marginBottom: 2,
  },
  headerCell: {
    width: 115,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#E8D5C4',
  },
  rowEven: {
    backgroundColor: '#FFFFFF',
  },
  rowOdd: {
    backgroundColor: '#FFF8F0',
  },
  cell: {
    width: 115,
    color: '#1a1a1a',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 13,
  },
  emptyRow: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#7f1d1d',
    fontWeight: '600',
    fontSize: 14,
  },
  refreshHintWrapper: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },

  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  refreshHintText: {
    fontSize: 11,
    color: '#9e7b6e',
    fontWeight: '500',
  },
});
