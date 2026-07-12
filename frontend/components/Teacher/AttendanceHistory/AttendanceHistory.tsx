import React, { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from "react-native";
import SessionCard from './SessionCard';
import { attendanceData } from './dummyAttendance';
import { Picker } from "@react-native-picker/picker";

type SessionSummary = {
  sessionId: number;
  sessionDate: string;
  subject: string;
  division: string;
  present: number;
  absent: number;
  total: number;

  // For future backend
  startTime?: string;
  endTime?: string;
};

export default function AttendanceHistory() {

const sessionSummaries = useMemo(() => {
  const grouped = new Map<number, SessionSummary>();

  attendanceData.forEach((record) => {
    if (!grouped.has(record.session_id)) {
      grouped.set(record.session_id, {
        sessionId: record.session_id,
        sessionDate: record.session_date,

        subject: `Subject ${record.subject_id}`,
        division: record.division_id,

        present: 0,
        absent: 0,
        total: 0,
      });
    }

    const session = grouped.get(record.session_id)!;

    session.total++;

    if (record.status === "Present") {
      session.present++;
    } else {
      session.absent++;
    }
  });

  return Array.from(grouped.values()).sort(
    (a, b) => a.sessionId - b.sessionId
  );
}, []);

const summary = useMemo(() => {
  const sessions = sessionSummaries.length;

  const present = sessionSummaries.reduce(
    (sum, session) => sum + session.present,
    0
  );

  const absent = sessionSummaries.reduce(
    (sum, session) => sum + session.absent,
    0
  );

  const total = present + absent;

  const percentage =
    total === 0 ? 0 : ((present / total) * 100);

  return {
    sessions,
    present,
    absent,
    percentage,
  };
}, [sessionSummaries]);

const [selectedDate, setSelectedDate] = useState("All");
const [selectedSubject, setSelectedSubject] = useState("All");
const [selectedDivision, setSelectedDivision] = useState("All");

const availableDates = [
  "All",
  ...new Set(attendanceData.map(item => item.session_date)),
];

const availableSubjects = [
  "All",
  ...new Set(attendanceData.map(item => item.subject_id.toString())),
];

const availableDivisions = [
  "All",
  ...new Set(attendanceData.map(item => item.division_id)),
];

const filteredSessions = sessionSummaries.filter(session => {

  const dateMatch =
    selectedDate === "All" ||
    session.sessionDate === selectedDate;

  const subjectMatch =
    selectedSubject === "All" ||
    session.subject === `Subject ${selectedSubject}`;

  const divisionMatch =
    selectedDivision === "All" ||
    session.division === selectedDivision;

  return (
    dateMatch &&
    subjectMatch &&
    divisionMatch
  );
});

  return (
    <SafeAreaView style={styles.container}>
    <Text style={styles.heading}>
      Attendance History
    </Text>

    <View style={styles.summaryCard}>
  <Text style={styles.summaryHeading}>
    Today's Summary
  </Text>

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
  >
    {availableDates.map(date => (
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
  >
    {availableSubjects.map(subject => (
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
  >
    {availableDivisions.map(division => (
      <Picker.Item
        key={division}
        label={division}
        value={division}
      />
    ))}
  </Picker>

</View>

    <FlatList
      data={filteredSessions}
      keyExtractor={(item) => item.sessionId.toString()}
      renderItem={({ item }) => (
        <SessionCard
          sessionId={item.sessionId}
          subject={item.subject}
          division={item.division}
          present={item.present}
          absent={item.absent}
          total={item.total}
          onPress={() => {
            console.log(item.sessionId);
          }}
        />
      )}
    />
  </SafeAreaView>
  );
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

});