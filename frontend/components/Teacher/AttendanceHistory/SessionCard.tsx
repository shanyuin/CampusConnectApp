import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";

type Props = {
  sessionId: number;
  subject: string;
  division: string;
  present: number;
  absent: number;
  total: number;
  onPress: () => void;
};

export default function SessionCard({
  sessionId,
  subject,
  division,
  present,
  absent,
  total,
  onPress,
}: Props) {
  const percentage =
    total === 0 ? 0 : ((present / total) * 100).toFixed(1);

  return (
    <View style={styles.card}>
      <Text style={styles.subject}>
        {subject}
      </Text>

      <Text style={styles.session}>
        Session #{sessionId}
      </Text>

      <Text style={styles.division}>
        Division {division}
      </Text>

      <View style={styles.statsRow}>
        <View>
          <Text style={styles.label}>Present</Text>
          <Text style={styles.value}>{present}</Text>
        </View>

        <View>
          <Text style={styles.label}>Absent</Text>
          <Text style={styles.value}>{absent}</Text>
        </View>

        <View>
          <Text style={styles.label}>Attendance</Text>
          <Text style={styles.value}>
            {percentage}%
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.button}
        onPress={onPress}
      >
        <Text style={styles.buttonText}>
          View Attendance
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,

    borderWidth: 1,
    borderColor: "#ead9c8",

    elevation: 2,
  },

  subject: {
    fontSize: 18,
    fontWeight: "700",
    color: "#7f1d1d",
  },

  session: {
    marginTop: 6,
    color: "#555",
    fontWeight: "600",
  },

  division: {
    marginTop: 2,
    color: "#777",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  label: {
    color: "#666",
    fontSize: 13,
  },

  value: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "700",
    color: "#7f1d1d",
  },

  button: {
    marginTop: 20,
    backgroundColor: "#7f1d1d",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});