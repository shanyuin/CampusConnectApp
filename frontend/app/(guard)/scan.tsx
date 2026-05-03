import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function GuardScanScreen() {
  const { session, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Guard Portal</Text>
        <Text style={styles.title}>Welcome, {session?.user.name ?? 'Guard'}</Text>
        <Text style={styles.subtitle}>
          This screen is ready for your guard-specific scan workflow.
        </Text>

        <View style={styles.panel}>
          <Text style={styles.panelLabel}>Signed in as</Text>
          <Text style={styles.panelValue}>{session?.user.erpId ?? '--'}</Text>
        </View>

        <Link href={'/(guard)/history' as never} asChild>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Open Guard History</Text>
          </TouchableOpacity>
        </Link>

        <TouchableOpacity style={styles.secondaryButton} onPress={signOut}>
          <Text style={styles.secondaryButtonText}>Logout</Text>
        </TouchableOpacity>
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
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 28,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  eyebrow: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
  },
  panel: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
  },
  panelLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 6,
  },
  panelValue: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
  },
});
