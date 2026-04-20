import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

type Row = {
  Date: string;
  Day: string;
  LoginTime: string;
  LogoutTime: string;
  TotalHours: number;
};

type AttendanceApiRow = {
  login_time?: string | null;
  logout_time?: string | null;
  date?: string | null;
};

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const formatMonth = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const formatTime = (value?: string | null) => {
  if (!value) return '--';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const toDayName = (dateStr?: string | null) => {
  if (!dateStr) return '--';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
};

export default function PreviousAttendance() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filterMode, setFilterMode] = useState<'date' | 'month'>('date');
  const [selectedDate, setSelectedDate] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(new Date());
  const tableRef = useRef<ScrollView>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`https://campusconnectapp-lu1d.onrender.com/api/attendance/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        const mapped = data.attendance.map((item: AttendanceApiRow) => {
          const login = item.login_time ? new Date(item.login_time) : null;
          const logout = item.logout_time ? new Date(item.logout_time) : null;

          const totalHours =
            login && logout && logout > login
              ? (logout.getTime() - login.getTime()) / (1000 * 60 * 60)
              : 0;

          return {
            Date: item.date ?? '--',
            Day: toDayName(item.date),
            LoginTime: formatTime(item.login_time),
            LogoutTime: formatTime(item.logout_time),
            TotalHours: totalHours,
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

    fetchHistory();
  }, []);

  const filteredRows = useMemo(() => {
    if (filterMode === 'date') {
      return rows.filter((r) => selectedDate === 'All' || r.Date === selectedDate);
    }
    return rows.filter((r) => selectedMonth === 'All' || r.Date.slice(0, 7) === selectedMonth);
  }, [rows, filterMode, selectedDate, selectedMonth]);

  const onDateChange = (_: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (!date) return;
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

        {showDatePicker && (
          <DateTimePicker value={datePickerValue} mode="date" onChange={onDateChange} />
        )}

        {/* TABLE */}
        <ScrollView>
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
                    <Text style={styles.cell}>{row.Date}</Text>
                    <Text style={styles.cell}>{row.Day}</Text>
                    <Text style={styles.cell}>{row.LoginTime}</Text>
                    <Text style={styles.cell}>{row.LogoutTime}</Text>
                    <Text style={styles.cell}>{row.TotalHours.toFixed(2)}</Text>
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
});