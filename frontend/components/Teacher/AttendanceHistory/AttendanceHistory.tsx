import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { useAuth } from "../../../context/AuthContext";
import { getTeacherAttendance } from "../../../services/attendanceService";
import { Session } from "../../../types/session";
import SessionCard from "./SessionCard";


export default function AttendanceHistory() {
  const { session } = useAuth();
  const isFocused = useIsFocused();
  const [selectedDate, setSelectedDate] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedDivision, setSelectedDivision] = useState("All");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAttendance = useCallback(async () => {
    if (!session?.user.erpId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getTeacherAttendance(session.user.erpId);
      setSessions(data);
    } finally {
      setLoading(false);
    }
  }, [session?.user.erpId]);

  useEffect(() => {
    if (isFocused) {
      void loadAttendance();
    }
  }, [isFocused, loadAttendance]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAttendance();
    } finally {
      setRefreshing(false);
    }
  }, [loadAttendance]);

  const summary = useMemo(() => {
    const present = sessions.reduce((sum, current) => sum + (current.present_count ?? 0), 0);
    const absent = sessions.reduce((sum, current) => sum + (current.absent_count ?? 0), 0);
    const total = present + absent;

    return {
      sessions: sessions.length,
      present,
      absent,
      percentage: total === 0 ? 0 : (present / total) * 100,
    };
  }, [sessions]);

  const availableDates = ["All", ...new Set(sessions.map(item => item.session_date))];
  const availableSubjects = ["All", ...new Set(sessions.map(item => item.subject_id.toString()))];
  const availableDivisions = ["All", ...new Set(sessions.map(item => item.division_id))];

  const filteredSessions = sessions.filter(item => {
    const dateMatch = selectedDate === "All" || item.session_date === selectedDate;
    const subjectMatch = selectedSubject === "All" || item.subject_id.toString() === selectedSubject;
    const divisionMatch = selectedDivision === "All" || item.division === selectedDivision;
    return dateMatch && subjectMatch && divisionMatch;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading attendance...</Text>
      </View>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
  <ScrollView
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.scrollContent}
    refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  }

  >
    <Text style={styles.heading}>
      Attendance History
    </Text>

    <View style={styles.summaryCard}>
  <Text style={styles.summaryHeading}>
    Today's Summary
  </Text>

  {refreshing && (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color="#7f1d1d" />
      <Text style={styles.loadingText}>Refreshing...</Text>
    </View>
  )}

  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>
      Sessions Taken
    </Text>

    <Text style={styles.summaryValue}>
      {summary.sessions}
    </Text>
  </View>

  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>
      Present
    </Text>

    <Text style={styles.summaryValue}>
      {summary.present}
    </Text>
  </View>

  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>
      Absent
    </Text>

    <Text style={styles.summaryValue}>
      {summary.absent}
    </Text>
  </View>

  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>
      Overall Attendance
    </Text>

    <Text style={styles.summaryValue}>
      {summary.percentage.toFixed(1)}%
    </Text>
  </View>
</View>

    <View style={styles.filterCard}>
      <Text style={styles.filterTitle}>
        Filters
      </Text>

      <Text style={styles.filterLabel}>
        Date
      </Text>

      <Picker
        selectedValue={selectedDate}
        onValueChange={setSelectedDate}
        style={styles.picker}
        dropdownIconColor="#7f1d1d"
        itemStyle={{ color: "#222" }}
      >
        {availableDates.map((date) => (
          <Picker.Item
            key={date}
            label={date}
            value={date}
          />
        ))}
      </Picker>

      <Text style={styles.filterLabel}>
        Subject
      </Text>

      <Picker
        selectedValue={selectedSubject}
        onValueChange={setSelectedSubject}
        style={styles.picker}
        dropdownIconColor="#7f1d1d"
        itemStyle={{ color: "#222" }}
      >
        {availableSubjects.map((subject) => (
          <Picker.Item
            key={subject}
            label={subject}
            value={subject}
          />
        ))}
      </Picker>

      <Text style={styles.filterLabel}>
        Division
      </Text>

      <Picker
        selectedValue={selectedDivision}
        onValueChange={setSelectedDivision}
        style={styles.picker}
        dropdownIconColor="#7f1d1d"
        itemStyle={{ color: "#222" }}
      >
        {availableDivisions.map((division) => (
          <Picker.Item
            key={division}
            label={division}
            value={division}
          />
        ))}
      </Picker>
    </View>

    {filteredSessions.map((item) => (
  <SessionCard
    key={item.id}
    sessionId={item.id}
    subject={`Subject ${item.subject_id}`}
    division={item.division}
    present={item.present_count ?? 0}
    absent={item.absent_count ?? 0}
    total={
      (item.present_count ?? 0) +
      (item.absent_count ?? 0)
    }
    onPress={() => {
      router.navigate({
        pathname : "../session-details",
      // pathname: "/faculty/session-details",
        params: {
          sessionId: item.id.toString(),
        },
      });
    }}

   
  />
))} 
  </ScrollView>
</SafeAreaView>  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
  },

  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#7f1d1d",
    marginBottom: 20,
  },
  summaryCard: {
  backgroundColor: "#ffffff",
  borderRadius: 18,
  padding: 18,
  marginBottom: 20,

  borderWidth: 1,
  borderColor: "#ead9c8",

  elevation: 2,
},

summaryHeading: {
  fontSize: 18,
  fontWeight: "700",
  color: "#7f1d1d",
  marginBottom: 14,
},

summaryRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 10,
},

loadingContainer: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  marginVertical: 10,
},

loadingText: {
  marginLeft: 8,
  color: "#666",
  fontSize: 14,
},

summaryLabel: {
  color: "#666",
  fontSize: 15,
},

summaryValue: {
  color: "#7f1d1d",
  fontWeight: "700",
  fontSize: 16,
},

filterCard: {
  backgroundColor: "#ffffff",
  borderRadius: 18,
  padding: 18,
  marginBottom: 20,

  borderWidth: 1,
  borderColor: "#ead9c8",

  elevation: 2,
},

filterTitle: {
  fontSize: 18,
  fontWeight: "700",
  color: "#7f1d1d",
  marginBottom: 12,
},

filterLabel: {
  marginTop: 8,
  marginBottom: 4,
  color: "#555",
  fontWeight: "600",
},
picker: {
    color: "#222",          // Selected text color
    backgroundColor: "#fff",
},
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
