import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

export default function GuardHistoryScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Guard History</Text>
        <Text style={styles.subtitle}>
          This route is protected for the guard role and ready for history-specific data.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: '#475569',
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
});
