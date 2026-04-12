import { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

type Row = {
   
    erpId: string;
    Shift: string;
  LoginTime: number;
    LogoutTime: number;
    Day: string;
    Date: string;
  TotalHours: number;
};

const rows: Row[] = [
    {  erpId: 'ERP001', Shift: "9:00 AM to 6:00 PM", LoginTime: 10.00, LogoutTime: 18.00, Day: 'Monday', Date: '2023-10-01', TotalHours: 8 },
    {  erpId: 'ERP001', Shift: "2:00 PM to 10:00 PM", LoginTime: 14.00, LogoutTime: 22.00, Day: 'Tuesday', Date: '2023-10-02', TotalHours: 8 },
    {  erpId: 'ERP001', Shift: "9:00 AM to 6:00 PM", LoginTime: 10.00, LogoutTime: 18.00, Day: 'Wednesday', Date: '2023-10-03', TotalHours: 8 },

    

];

const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

export default function PreviousAttendance() {
    const [filterMode, setFilterMode] = useState<'day' | 'date'>('day');
    const [selectedDay, setSelectedDay] = useState('All');
    const [selectedDate, setSelectedDate] = useState('All');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerValue, setDatePickerValue] = useState(new Date(`${rows[0].Date}T00:00:00`));
    const tableRef = useRef<ScrollView>(null);
    const filterRef = useRef<ScrollView>(null);
    const dayOptions = useMemo(() => ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], []);

    const filteredRows = useMemo(
        () =>
            rows.filter((row) =>
                filterMode === 'day'
                    ? selectedDay === 'All' || row.Day === selectedDay
                    : selectedDate === 'All' || row.Date === selectedDate,
            ),
        [filterMode, selectedDate, selectedDay],
    );

    const onDateChange = (_event: unknown, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (!date) {
            return;
        }

        setDatePickerValue(date);
        setSelectedDate(formatDate(date));
    };

    const scrollFilterStart = () => filterRef.current?.scrollTo({ x: 0, animated: true });
    const scrollFilterEnd = () => filterRef.current?.scrollTo({ x: 10000, animated: true });
    const scrollTableStart = () => tableRef.current?.scrollTo({ x: 0, animated: true });
    const scrollTableEnd = () => tableRef.current?.scrollTo({ x: 10000, animated: true });

    return (
        <View style={styles.screen}>
            {/* <View style={styles.heroCard}>
                <Text style={styles.title}>Profile Attendance</Text>
                <Text style={styles.subtitle}>Filter and review your activity by day or date.</Text>
            </View> */}

            <View style={styles.tableWrapper}>
                <View style={styles.filterModeRow}>
                    <TouchableOpacity
                        style={[styles.modeBtn, filterMode === 'day' && styles.modeBtnActive]}
                        onPress={() => setFilterMode('day')}
                    >
                        <Text style={[styles.modeBtnText, filterMode === 'day' && styles.modeBtnTextActive]}>Day</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeBtn, filterMode === 'date' && styles.modeBtnActive]}
                        onPress={() => setFilterMode('date')}
                    >
                        <Text style={[styles.modeBtnText, filterMode === 'date' && styles.modeBtnTextActive]}>Date</Text>
                    </TouchableOpacity>
                </View>

                {filterMode === 'day' ? (
                    <>
                        <View style={styles.filterControlsRow}>
                            <TouchableOpacity style={styles.filterControlBtn} onPress={scrollFilterStart}>
                                <Text style={styles.filterControlBtnText}>◀</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.filterControlBtn} onPress={scrollFilterEnd}>
                                <Text style={styles.filterControlBtnText}>▶</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            ref={filterRef}
                            horizontal
                            nestedScrollEnabled
                            showsHorizontalScrollIndicator
                            style={styles.filterList}
                            contentContainerStyle={styles.filterListContent}
                        >
                            {dayOptions.map((option) => {
                                const isActive = option === selectedDay;

                                return (
                                    <TouchableOpacity
                                        key={option}
                                        style={[styles.filterChip, isActive && styles.filterChipActive]}
                                        onPress={() => setSelectedDay(option)}
                                    >
                                        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{option}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </>
                ) : (
                    <View style={styles.dateFilterRow}>
                        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
                            <Text style={styles.datePickerBtnText}>{selectedDate === 'All' ? 'Select Date 📅' : selectedDate}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.filterChip, selectedDate === 'All' && styles.filterChipActive]}
                            onPress={() => setSelectedDate('All')}
                        >
                            <Text style={[styles.filterChipText, selectedDate === 'All' && styles.filterChipTextActive]}>All</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {showDatePicker && (
                    <DateTimePicker
                        value={datePickerValue}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange}
                    />
                )}

                <Text style={styles.scrollHint}>Swipe left/right to view all columns</Text>

                <View style={styles.controlsRow}>
                    <TouchableOpacity style={styles.controlBtn} onPress={scrollTableStart}>
                        <Text style={styles.controlBtnText}>◀ Left</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlBtn} onPress={scrollTableEnd}>
                        <Text style={styles.controlBtnText}>Right ▶</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView ref={tableRef} horizontal bounces={false} showsHorizontalScrollIndicator style={styles.tableScroll}>
                    <View style={styles.tableContent}>
                        <View style={[styles.row, styles.headerRow]}>
                            <Text style={[styles.cell, styles.headerCell]}>ERP ID</Text>
                            <Text style={[styles.cell, styles.headerCell]}>Shift</Text>
                            <Text style={[styles.cell, styles.headerCell]}>Day</Text>
                            <Text style={[styles.cell, styles.headerCell]}>Date</Text>
                            <Text style={[styles.cell, styles.headerCell]}>Login</Text>
                            <Text style={[styles.cell, styles.headerCell]}>Logout</Text>
                            <Text style={[styles.cell, styles.headerCell]}>Hours</Text>
                        </View>

                        {filteredRows.length > 0 ? (
                            filteredRows.map((row) => (
                                <View key={`${row.erpId}-${row.Date}`} style={styles.row}>
                                    <Text style={styles.cell}>{row.erpId}</Text>
                                    <Text style={styles.cell}>{row.Shift}</Text>
                                    <Text style={styles.cell}>{row.Day}</Text>
                                    <Text style={styles.cell}>{row.Date}</Text>
                                    <Text style={styles.cell}>{row.LoginTime.toFixed(2)} AM</Text>
                                    <Text style={styles.cell}>{row.LogoutTime.toFixed(2)} PM</Text>
                                    <Text style={styles.cell}>{row.TotalHours.toFixed(2)}</Text>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyStateRow}>
                                <Text style={styles.emptyStateText}>No records found.</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        paddingHorizontal: 16,
        alignItems: 'center',
        paddingBottom: 16,
        gap: 12,
    },
    heroCard: {
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
        backgroundColor: '#1d4ed8',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#60a5fa',
    },
    tableWrapper: {
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#334155',
    },
    title: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '800',
    },
    subtitle: {
        color: '#dbeafe',
        marginTop: 4,
        fontSize: 13,
    },
    filterModeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },
    modeBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#475569',
        backgroundColor: '#0f172a',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    modeBtnActive: {
        backgroundColor: '#2563eb',
        borderColor: '#60a5fa',
    },
    modeBtnText: {
        color: '#94a3b8',
        fontWeight: '700',
    },
    modeBtnTextActive: {
        color: '#ffffff',
    },
    filterList: {
        width: '100%',
        marginBottom: 8,
    },
    filterListContent: {
        minWidth: 560,
        paddingRight: 12,
    },
    filterControlsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginBottom: 6,
    },
    filterControlBtn: {
        width: 30,
        height: 26,
        borderRadius: 6,
        backgroundColor: '#334155',
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterControlBtnText: {
        color: '#e2e8f0',
        fontWeight: '700',
    },
    filterChip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 999,
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#1d4ed8',
        borderColor: '#60a5fa',
    },
    filterChipText: {
        color: '#bfdbfe',
        fontSize: 12,
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#ffffff',
    },
    dateFilterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    datePickerBtn: {
        flex: 1,
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 8,
        paddingVertical: 9,
        paddingHorizontal: 12,
    },
    datePickerBtnText: {
        color: '#e2e8f0',
        fontSize: 12,
        fontWeight: '600',
    },
    scrollHint: {
        color: '#94a3b8',
        fontSize: 12,
        marginBottom: 8,
    },
    controlsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },
    controlBtn: {
        flex: 1,
        backgroundColor: '#334155',
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: 'center',
    },
    controlBtnText: {
        color: '#e2e8f0',
        fontSize: 12,
        fontWeight: '700',
    },
    tableScroll: {
        width: '100%',
    },
    tableContent: {
        width: 805,
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
        paddingVertical: 9,
    },
    headerRow: {
        borderBottomColor: '#475569',
        backgroundColor: '#0f172a',
        borderRadius: 8,
        paddingHorizontal: 2,
    },
    cell: {
        width: 115,
        color: '#e2e8f0',
        textAlign: 'center',
        fontSize: 12,
    },
    headerCell: {
        color: '#bfdbfe',
        fontWeight: '700',
    },
    emptyStateRow: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    emptyStateText: {
        color: '#94a3b8',
        fontSize: 13,
    },
});
