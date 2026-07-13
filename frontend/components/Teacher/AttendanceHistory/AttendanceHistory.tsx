import { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import SessionCard from './SessionCard';
import { Picker } from "@react-native-picker/picker";
import { Session } from "../../../types/session";
import { getTeacherAttendance } from "../../../services/attendanceService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { USER_KEY } from '../../../context/AuthContext';



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


const [selectedDate, setSelectedDate] = useState("All");
const [selectedSubject, setSelectedSubject] = useState("All");
const [selectedDivision, setSelectedDivision] = useState("All");
const [sessions, setSessions] = useState<Session[]>([]);

const [loading, setLoading] = useState(true);

const summary = useMemo(() => {
  const sessionsTaken = sessions.length;

  const present = sessions.reduce(
    (sum, session) => sum + (session.present_count ?? 0),
    0
  );

  const absent = sessions.reduce(
    (sum, session) => sum + (session.absent_count ?? 0),
    0
  );

  const total = present + absent;

  return {
    sessions: sessionsTaken,
    present,
    absent,
    percentage: total === 0 ? 0 : (present / total) * 100,
  };
}, [sessions]);


useEffect(() => {
  loadAttendance();
}, []);

const loadAttendance = async () => {
  try {
    const userJson = await AsyncStorage.getItem(USER_KEY);
    console.log("htis is userjson",userJson);
    const user = userJson ? JSON.parse(userJson) : null;
    const teacherId = user?.erpId;
    console.log(teacherId);

    if (!teacherId) {
      throw new Error("No logged-in teacher found. Please sign in again.");
    }

    const data = await getTeacherAttendance(teacherId);
    console.log("this is data",data);

setSessions(data);

    
  } catch (err) {
    console.log(err);
  } finally {
    setLoading(false);
  }
};

const availableDates = [
  "All",
  ...new Set(sessions.map(item => item.session_date)),
];

const availableSubjects = [
  "All",
  ...new Set(sessions.map(item => item.subject_id.toString())),
];

const availableDivisions = [
  "All",
  ...new Set(sessions.map(item => item.division_id)),
];

const filteredSessions = sessions.filter(session => {

  const dateMatch =
    selectedDate === "All" ||
    session.session_date === selectedDate;

  const subjectMatch =
    selectedSubject === "All" ||
    session.subject_id.toString() === selectedSubject;

  const divisionMatch =
    selectedDivision === "All" ||
    session.division === selectedDivision;

  return (
    dateMatch &&
    subjectMatch &&
    divisionMatch
  );
});

if (loading) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Loading...</Text>
    </View>
  );
}

  return (
    <SafeAreaView style={styles.container}>
  <ScrollView
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.scrollContent}
  >
    <Text style={styles.heading}>
      Attendance History
    </Text>

    {/* Today's Summary */}

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

    {/* Filters */}

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

    {/* Session Cards */}
   

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
      console.log(item.attendance);
      // navigation.navigate("AttendanceDetails", {
      //   attendance: item.attendance,
      // });
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

});


// import React, { useEffect, useMemo, useState, useCallback } from "react";
// import { SafeAreaView } from "react-native-safe-area-context";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   ActivityIndicator,
//   RefreshControl,
// } from "react-native";
// import SessionCard from "./SessionCard";
// import { Picker } from "@react-native-picker/picker";
// import { fetchAttendanceRecords, AttendanceRecord } from "../api/attendanceApi";

// type SessionSummary = {
//   sessionId: number;
//   sessionDate: string;
//   subject: string;
//   division: string;
//   present: number;
//   absent: number;
//   total: number;

//   startTime?: string;
//   endTime?: string;
// };

// export default function AttendanceHistory() {
//   const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const loadData = useCallback(async () => {
//     try {
//       setError(null);
//       const records = await fetchAttendanceRecords();
//       setAttendanceData(records);
//     } catch (err: any) {
//       setError(err?.message ?? "Failed to load attendance data.");
//     }
//   }, []);

//   useEffect(() => {
//     (async () => {
//       setLoading(true);
//       await loadData();
//       setLoading(false);
//     })();
//   }, [loadData]);

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     await loadData();
//     setRefreshing(false);
//   }, [loadData]);

//   const sessionSummaries = useMemo(() => {
//     const grouped = new Map<number, SessionSummary>();

//     attendanceData.forEach((record) => {
//       if (!grouped.has(record.session_id)) {
//         grouped.set(record.session_id, {
//           sessionId: record.session_id,
//           sessionDate: record.session_date,
//           subject: record.subject_name ?? `Subject ${record.subject_id}`,
//           division: record.division_id,
//           present: 0,
//           absent: 0,
//           total: 0,
//           startTime: record.start_time ?? undefined,
//           endTime: record.end_time ?? undefined,
//         });
//       }

//       const session = grouped.get(record.session_id)!;

//       session.total++;

//       if (record.status === "Present") {
//         session.present++;
//       } else {
//         session.absent++;
//       }
//     });

//     return Array.from(grouped.values()).sort(
//       (a, b) => a.sessionId - b.sessionId
//     );
//   }, [attendanceData]);

//   const summary = useMemo(() => {
//     const sessions = sessionSummaries.length;

//     const present = sessionSummaries.reduce(
//       (sum, session) => sum + session.present,
//       0
//     );

//     const absent = sessionSummaries.reduce(
//       (sum, session) => sum + session.absent,
//       0
//     );

//     const total = present + absent;

//     const percentage = total === 0 ? 0 : (present / total) * 100;

//     return {
//       sessions,
//       present,
//       absent,
//       percentage,
//     };
//   }, [sessionSummaries]);

//   const [selectedDate, setSelectedDate] = useState("All");
//   const [selectedSubject, setSelectedSubject] = useState("All");
//   const [selectedDivision, setSelectedDivision] = useState("All");

//   const availableDates = useMemo(
//     () => ["All", ...new Set(attendanceData.map((item) => item.session_date))],
//     [attendanceData]
//   );

//   const availableSubjects = useMemo(
//     () => [
//       "All",
//       ...new Set(attendanceData.map((item) => item.subject_id.toString())),
//     ],
//     [attendanceData]
//   );

//   const availableDivisions = useMemo(
//     () => ["All", ...new Set(attendanceData.map((item) => item.division_id))],
//     [attendanceData]
//   );

//   const filteredSessions = sessionSummaries.filter((session) => {
//     const dateMatch = selectedDate === "All" || session.sessionDate === selectedDate;

//     const subjectMatch =
//       selectedSubject === "All" ||
//       session.subject === `Subject ${selectedSubject}` ||
//       attendanceData.find(
//         (r) => r.session_id === session.sessionId && r.subject_id.toString() === selectedSubject
//       );

//     const divisionMatch = selectedDivision === "All" || session.division === selectedDivision;

//     return dateMatch && subjectMatch && divisionMatch;
//   });

//   if (loading) {
//     return (
//       <SafeAreaView style={[styles.container, styles.centered]}>
//         <ActivityIndicator size="large" color="#7f1d1d" />
//         <Text style={styles.loadingText}>Loading attendance...</Text>
//       </SafeAreaView>
//     );
//   }

//   if (error) {
//     return (
//       <SafeAreaView style={[styles.container, styles.centered]}>
//         <Text style={styles.errorText}>{error}</Text>
//         <Text style={styles.retryText} onPress={loadData}>
//           Tap to retry
//         </Text>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7f1d1d" />
//         }
//       >
//         <Text style={styles.heading}>Attendance History</Text>

//         {/* Today's Summary */}

//         <View style={styles.summaryCard}>
//           <Text style={styles.summaryHeading}>Today's Summary</Text>

//           <View style={styles.summaryRow}>
//             <Text style={styles.summaryLabel}>Sessions Taken</Text>
//             <Text style={styles.summaryValue}>{summary.sessions}</Text>
//           </View>

//           <View style={styles.summaryRow}>
//             <Text style={styles.summaryLabel}>Present</Text>
//             <Text style={styles.summaryValue}>{summary.present}</Text>
//           </View>

//           <View style={styles.summaryRow}>
//             <Text style={styles.summaryLabel}>Absent</Text>
//             <Text style={styles.summaryValue}>{summary.absent}</Text>
//           </View>

//           <View style={styles.summaryRow}>
//             <Text style={styles.summaryLabel}>Overall Attendance</Text>
//             <Text style={styles.summaryValue}>{summary.percentage.toFixed(1)}%</Text>
//           </View>
//         </View>

//         {/* Filters */}

//         <View style={styles.filterCard}>
//           <Text style={styles.filterTitle}>Filters</Text>

//           <Text style={styles.filterLabel}>Date</Text>

//           <Picker
//             selectedValue={selectedDate}
//             onValueChange={setSelectedDate}
//             style={styles.picker}
//             dropdownIconColor="#7f1d1d"
//             itemStyle={{ color: "#222" }}
//           >
//             {availableDates.map((date) => (
//               <Picker.Item key={date} label={date} value={date} />
//             ))}
//           </Picker>

//           <Text style={styles.filterLabel}>Subject</Text>

//           <Picker
//             selectedValue={selectedSubject}
//             onValueChange={setSelectedSubject}
//             style={styles.picker}
//             dropdownIconColor="#7f1d1d"
//             itemStyle={{ color: "#222" }}
//           >
//             {availableSubjects.map((subject) => (
//               <Picker.Item key={subject} label={subject} value={subject} />
//             ))}
//           </Picker>

//           <Text style={styles.filterLabel}>Division</Text>

//           <Picker
//             selectedValue={selectedDivision}
//             onValueChange={setSelectedDivision}
//             style={styles.picker}
//             dropdownIconColor="#7f1d1d"
//             itemStyle={{ color: "#222" }}
//           >
//             {availableDivisions.map((division) => (
//               <Picker.Item key={division} label={division} value={division} />
//             ))}
//           </Picker>
//         </View>

//         {/* Session Cards */}

//         {filteredSessions.length === 0 ? (
//           <Text style={styles.emptyText}>No sessions match these filters.</Text>
//         ) : (
//           filteredSessions.map((item) => (
//             <SessionCard
//               key={item.sessionId}
//               sessionId={item.sessionId}
//               subject={item.subject}
//               division={item.division}
//               present={item.present}
//               absent={item.absent}
//               total={item.total}
//               onPress={() => {
//                 console.log(item.sessionId);
//               }}
//             />
//           ))
//         )}
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#FFFFFF",
//     padding: 16,
//   },
//   centered: {
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   loadingText: {
//     marginTop: 12,
//     color: "#7f1d1d",
//     fontSize: 15,
//   },
//   errorText: {
//     color: "#b91c1c",
//     fontSize: 15,
//     textAlign: "center",
//     marginBottom: 10,
//   },
//   retryText: {
//     color: "#7f1d1d",
//     fontWeight: "700",
//     textDecorationLine: "underline",
//   },
//   emptyText: {
//     textAlign: "center",
//     color: "#888",
//     marginTop: 20,
//   },
//   heading: {
//     fontSize: 24,
//     fontWeight: "700",
//     color: "#7f1d1d",
//     marginBottom: 20,
//   },
//   summaryCard: {
//     backgroundColor: "#ffffff",
//     borderRadius: 18,
//     padding: 18,
//     marginBottom: 20,
//     borderWidth: 1,
//     borderColor: "#ead9c8",
//     elevation: 2,
//   },
//   summaryHeading: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#7f1d1d",
//     marginBottom: 14,
//   },
//   summaryRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 10,
//   },
//   summaryLabel: {
//     color: "#666",
//     fontSize: 15,
//   },
//   summaryValue: {
//     color: "#7f1d1d",
//     fontWeight: "700",
//     fontSize: 16,
//   },
//   filterCard: {
//     backgroundColor: "#ffffff",
//     borderRadius: 18,
//     padding: 18,
//     marginBottom: 20,
//     borderWidth: 1,
//     borderColor: "#ead9c8",
//     elevation: 2,
//   },
//   filterTitle: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#7f1d1d",
//     marginBottom: 12,
//   },
//   filterLabel: {
//     marginTop: 8,
//     marginBottom: 4,
//     color: "#555",
//     fontWeight: "600",
//   },
//   picker: {
//     color: "#222",
//     backgroundColor: "#fff",
//   },
//   scrollContent: {
//     paddingBottom: 30,
//   },
// });

// import React, { useEffect, useMemo, useState } from "react";
// import {
//   ActivityIndicator,
//   ScrollView,
//   StyleSheet,
//   Text,
//   View,
//   Alert,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import SessionCard from "./SessionCard";

// interface AttendanceRecord {
//   id: string;
//   teacher_id: string;
//   student_id: string;
//   session_id: number;
//   subject_id: number;
//   division_id: string;
//   session_date: string;
//   status: "Present" | "Absent";
// }

// interface SessionSummary {
//   sessionId: number;
//   sessionDate: string;
//   subject: string;
//   division: string;
//   present: number;
//   absent: number;
//   total: number;
// }

// const API_URL = "http://172.16.97.242:5000/api";

// export default function AttendanceHistory({ navigation }: any) {
//   const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchAttendance();
//   }, []);

//   const fetchAttendance = async () => {
//     try {
//       const teacherId = await AsyncStorage.getItem("teacherId");

//       if (!teacherId) {
//         Alert.alert("Teacher not logged in");
//         return;
//       }

//       const response = await fetch(
//         `${API_URL}/faculty/teacher/${teacherId}`
//       );

//       const result = await response.json();

//       if (result.success) {
//         setAttendanceData(result.attendance);
//       } else {
//         Alert.alert(result.message);
//       }
//     } catch (error) {
//       console.log(error);
//       Alert.alert("Unable to load attendance");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const sessionSummaries = useMemo(() => {
//     const grouped = new Map<number, SessionSummary>();

//     attendanceData.forEach((record) => {
//       if (!grouped.has(record.session_id)) {
//         grouped.set(record.session_id, {
//           sessionId: record.session_id,
//           sessionDate: record.session_date,
//           subject: `Subject ${record.subject_id}`,
//           division: record.division_id,
//           present: 0,
//           absent: 0,
//           total: 0,
//         });
//       }

//       const session = grouped.get(record.session_id)!;

//       session.total++;

//       if (record.status === "Present") {
//         session.present++;
//       } else {
//         session.absent++;
//       }
//     });

//     return Array.from(grouped.values()).sort(
//       (a, b) => b.sessionId - a.sessionId
//     );
//   }, [attendanceData]);

//   if (loading) {
//     return (
//       <View style={styles.loader}>
//         <ActivityIndicator size="large" color="#7f1d1d" />
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView>

//         <Text style={styles.heading}>
//           Attendance History
//         </Text>

//         {sessionSummaries.length === 0 ? (
//           <Text style={styles.empty}>
//             No attendance found.
//           </Text>
//         ) : (
//           sessionSummaries.map((item) => (
//             <SessionCard
//               key={item.sessionId}
//               sessionId={item.sessionId}
//               subject={item.subject}
//               division={item.division}
//               present={item.present}
//               absent={item.absent}
//               total={item.total}
//               onPress={() =>
//                 navigation.navigate(
//                   "AttendanceDetails",
//                   {
//                     sessionId: item.sessionId,
//                   }
//                 )
//               }
//             />
//           ))
//         )}

//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//     padding: 15,
//   },

//   heading: {
//     fontSize: 24,
//     fontWeight: "700",
//     color: "#7f1d1d",
//     marginBottom: 20,
//   },

//   loader: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   empty: {
//     textAlign: "center",
//     marginTop: 50,
//     color: "gray",
//     fontSize: 16,
//   },
// });
