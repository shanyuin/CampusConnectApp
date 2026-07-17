import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import StudentRow from "./StudentRow";
import { useLocalSearchParams } from "expo-router";
import { getSessionAttendance } from "../../../services/attendanceService";
import { updateAttendance } from "../../../services/attendanceService";
import { AttendanceStudent } from "@/types/attendance";
import { ActivityIndicator } from "react-native";

export default function SessionDetails() {

const [students, setStudents] = useState<AttendanceStudent[]>([]);
const [loading, setLoading] = useState(true);
const { sessionId } = useLocalSearchParams();

const loadAttendance = async () => {
  try {
    setLoading(true);
    const data = await getSessionAttendance(sessionId as string);
    setStudents(data);
  } catch (error) {
    console.log(error);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  void loadAttendance();
}, [sessionId]);

const presentCount = students.filter(
  student => student.status === "Present"
).length;

const absentCount = students.filter(
  student => student.status === "Absent"
).length;

const attendancePercentage =
  students.length === 0
    ? 0
    : ((presentCount / students.length) * 100).toFixed(1);

  const toggleAttendance = async (attendanceId: number) => {
  const student = students.find(s => s.id === attendanceId);

  if (!student) return;

  const newStatus =
    student.status === "Present"
      ? "Absent"
      : "Present";

  try {
    await updateAttendance(attendanceId, newStatus);

    setStudents(prev =>
      prev.map(s =>
        s.id === attendanceId
          ? {
              ...s,
              status: newStatus,
            }
          : s
      )
    );
  } catch (error) {
    console.log(error);
  }
};

if (loading) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" />
      <Text>Loading students...</Text>
    </View>
  );
}

  return (
    <View style={styles.container}>
    <Text style={styles.heading}>
        Student Attendance
    </Text>
    <View style={styles.summaryContainer}>
    <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>
            Present
        </Text>

        <Text style={styles.summaryValue}>
            {presentCount}
        </Text>
    </View>

    <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>
            Absent
        </Text>

        <Text style={styles.summaryValue}>
            {absentCount}
        </Text>
    </View>

    <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>
            Attendance
        </Text>

        <Text style={styles.summaryValue}>
            {attendancePercentage}%
        </Text>
    </View>

    </View>



      <FlatList
        data={students}
        keyExtractor={(item) =>
          item.id.toString()
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <StudentRow student={item} onToggle={toggleAttendance} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 16,
  },

  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#7f1d1d",
    marginBottom: 20,
  },
  summaryContainer: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 20,
},

summaryCard: {
  flex: 1,

  backgroundColor: "#ffffff",

  borderRadius: 16,

  paddingVertical: 16,

  marginHorizontal: 4,

  alignItems: "center",

  borderWidth: 1,

  borderColor: "#ead9c8",

  elevation: 2,
},

summaryTitle: {
  color: "#666",
  fontSize: 14,
  fontWeight: "600",
},

summaryValue: {
  marginTop: 8,
  color: "#7f1d1d",
  fontWeight: "700",
  fontSize: 22,
},
});
