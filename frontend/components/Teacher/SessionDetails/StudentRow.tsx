import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";

import { AttendanceStudent } from "../../../types/attendance";

type Props = {
  student: AttendanceStudent;
  onToggle: (id: number) => void;
};

export default function StudentRow({
  student,
  onToggle,
}: Props) {
  return (
    <View style={styles.card}>

      <View>
        <Text style={styles.name}>
               {student.students.name}
        </Text>

        <Text style={styles.erp}>
             ERP : {student.student_erpid}
        </Text>
      </View>

      <Pressable
        onPress={() => onToggle(student.id)}
        style={[
          styles.button,
          student.status === "Present"
            ? styles.present
            : styles.absent,
        ]}
      >
        <Text style={styles.buttonText}>
          {student.status}
        </Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({

  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    backgroundColor: "#fff",

    padding: 16,

    marginBottom: 12,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: "#ead9c8",
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  erp: {
    marginTop: 4,
    color: "#777",
  },

  button: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 90,
    alignItems: "center",
  },

  present: {
    backgroundColor: "#16a34a",
  },

  absent: {
    backgroundColor: "#dc2626",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});