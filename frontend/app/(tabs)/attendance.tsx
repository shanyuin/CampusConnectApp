import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import PreviousAttendance from '../../components/Home/PreviousAttendance';

export default function AttendanceTab() {
  return (
    <View style={styles.container}>
      <PreviousAttendance />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
