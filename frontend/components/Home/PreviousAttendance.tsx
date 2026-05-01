import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Animated } from 'react-native';

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
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchHistory = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`https://campusconnectapp-lu1d.onrender.com/api/attendance/history`, {
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
  }, []);

  useEffect(() => {
    if (showMonthPicker) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [showMonthPicker]);

  const filteredRows = useMemo(() => {
  if (filterMode === 'date') {
    const baseDate =
      selectedDate === 'All'
        ? new Date()
        : new Date(selectedDate.split('-').reverse().join('-') + 'T00:00:00');

    const dayIndex = baseDate.getDay(); // 0 = Sunday
    const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;

    const weekStart = new Date(baseDate);
    weekStart.setDate(baseDate.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    // ✅ generate 7 days (Mon → Sun)
    const weekDates: string[] = [];

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);

      if (d > today) break;

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');

      weekDates.push(`${yyyy}-${mm}-${dd}`);
    }

    // ✅ map existing rows
    const rowMap = new Map(rows.map((r) => [r.Date, r]));

    // ✅ build final 7 rows
    return weekDates.map((dateStr) => {
      if (rowMap.has(dateStr)) {
        return rowMap.get(dateStr)!;
      }

      return {
        Date: dateStr,
        Day: toDayName(dateStr),
        LoginTime: '--',
        LogoutTime: '--',
        TotalHoursLabel: '--',
      };
    });
  }

  if (filterMode === 'month') {
    // ✅ DEFAULT MONTH VIEW (no from/to)
    if (!fromDate || !toDate) {
      if (selectedMonth === 'All') {
        const today = new Date();

        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        start.setHours(0, 0, 0, 0);

        const end = new Date(today);
        end.setHours(23, 59, 59, 999);

        const allDates: string[] = [];
        const current = new Date(start);

        while (current <= end) {
          const yyyy = current.getFullYear();
          const mm = String(current.getMonth() + 1).padStart(2, '0');
          const dd = String(current.getDate()).padStart(2, '0');

          allDates.push(`${yyyy}-${mm}-${dd}`);
          current.setDate(current.getDate() + 1);
        }

        const rowMap = new Map(rows.map((r) => [r.Date, r]));

        return allDates.map((dateStr) => {
          if (rowMap.has(dateStr)) return rowMap.get(dateStr)!;

          return {
            Date: dateStr,
            Day: toDayName(dateStr),
            LoginTime: '--',
            LogoutTime: '--',
            TotalHoursLabel: '--',
          };
        });
      }

      const [year, month] = selectedMonth.split('-').map(Number);

      const start = new Date(year, month - 1, 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(year, month, 0); // last day of month
      end.setHours(23, 59, 59, 999);

      const today = new Date();
      const finalEnd = end > today ? today : end;

      const allDates: string[] = [];
      const current = new Date(start);

      while (current <= finalEnd) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');

        allDates.push(`${yyyy}-${mm}-${dd}`);
        current.setDate(current.getDate() + 1);
      }

      const rowMap = new Map(rows.map((r) => [r.Date, r]));

      return allDates.map((dateStr) => {
        if (rowMap.has(dateStr)) return rowMap.get(dateStr)!;

        return {
          Date: dateStr,
          Day: toDayName(dateStr),
          LoginTime: '--',
          LogoutTime: '--',
          TotalHoursLabel: '--',
        };
      });
    }

    // ✅ RANGE FILTER (your existing logic stays same)
    if (!fromDate || !toDate) {
      return rows; // do nothing until both selected
    }

    const start = fromDate < toDate ? fromDate : toDate;
    const end = fromDate < toDate ? toDate : fromDate;

    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);

    const allDates: string[] = [];
    const current = new Date(start);

    while (current <= endOfDay) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');

      allDates.push(`${yyyy}-${mm}-${dd}`);
      current.setDate(current.getDate() + 1);
    }

    const rowMap = new Map(rows.map((r) => [r.Date, r]));

    return allDates.map((dateStr) => {
      if (rowMap.has(dateStr)) return rowMap.get(dateStr)!;

      return {
        Date: dateStr,
        Day: toDayName(dateStr),
        LoginTime: '--',
        LogoutTime: '--',
        TotalHoursLabel: '--',
      };
    });
  }

  return rows;
}, [rows, filterMode, selectedDate, selectedMonth, fromDate, toDate]);

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
          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => {
              if (filterMode === 'date') {
                setShowDatePicker(true);
              } else {
                setShowMonthPicker(true);
              }
            }}
          >
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
              setSelectedMonth('All'); // 🔥 clear month
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
              setSelectedMonth('All'); // 🔥 clear month
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
          <DateTimePicker
            value={
              pickerMode === 'from'
                ? fromDate || new Date()
                : pickerMode === 'to'
                ? toDate || new Date()
                : datePickerValue
            }
            mode="date"
            onChange={onDateChange}
          />
        )}
        {showMonthPicker && (
          <View style={styles.overlay}>

  {/* background click catcher */}
  <TouchableOpacity
    style={StyleSheet.absoluteFillObject}
    activeOpacity={1}
    onPress={() => setShowMonthPicker(false)}
  />

  {/* foreground (DO NOT use Touchable here) */}
  <Animated.View
    style={{
      opacity: fadeAnim,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    }}
    pointerEvents="box-none"   // 🔥 IMPORTANT
  >
    <View style={styles.monthBox}>
      <ScrollView
        showsVerticalScrollIndicator={true}
        indicatorStyle="black" // iOS
      >
                    
                    {[
                      'January','February','March','April','May','June',
                      'July','August','September','October','November','December'
                    ].map((month, index) => {
                      const value = `${new Date().getFullYear()}-${String(index + 1).padStart(2, '0')}`;

                      return (
                        <TouchableOpacity
                          key={month}
                          style={[
                            styles.monthItem,
                            selectedMonth === value && styles.monthItemActive
                          ]}
                          onPress={() => {
                            setSelectedMonth(value);

                            // 🔥 IMPORTANT: clear range
                            setFromDate(null);
                            setToDate(null);

                            setShowMonthPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.monthText,
                              selectedMonth === value && styles.monthTextActive
                            ]}
                          >
                            {month}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                  </ScrollView>
                </View>

            </Animated.View>
          </View>
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
              {(() => {
                const isFutureMonth =
                  filterMode === 'month' &&
                  selectedMonth !== 'All' &&
                  new Date(selectedMonth + '-01') > new Date();

                if (isFutureMonth) {
                  return (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateTitle}>No attendance data yet</Text>
                      <Text style={styles.emptyStateText}>
                        Pull down to refresh when your attendance is available.
                      </Text>
                    </View>
                  );
                }

                if (filteredRows.length === 0) {
                  return (
                    <View style={styles.emptyRow}>
                      <Text style={styles.emptyText}>No records found</Text>
                    </View>
                  );
                }

                return filteredRows.map((row, i) => (
                  <View
                    key={i}
                    style={[styles.row, i % 2 === 0 ? styles.rowEven : styles.rowOdd]}
                  >
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
                ));
              })()}

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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 10,
  },

  monthBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 10,
    width: 240,
    maxHeight: '75%', 
  },

  monthItem: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: '#eee',
  },

  monthText: {
    fontSize: 15,
    color: '#7f1d1d',
    textAlign: 'center',
    fontWeight: '500',
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
  monthTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  monthItemActive: {
    backgroundColor: '#7f1d1d',
    marginHorizontal: 12,   // 🔥 THIS creates side spacing
    borderRadius: 10,
  },
});
