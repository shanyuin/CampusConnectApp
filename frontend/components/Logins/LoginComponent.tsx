import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import HomeComponent from '../Home/HomeComponent';

export default function LoginComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Campus Connect</Text>

      <TextInput
        placeholder="Enter ERP ID"
        style={styles.input}
      />

      <TextInput
        placeholder="Enter Password"
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',   // vertical center
    alignItems: 'center',       // horizontal center
    padding: 20,
    backgroundColor: '#0f172a', // dark modern bg
  },
  title: {
    fontSize: 28,
    color: '#fff',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    backgroundColor: '#1e293b',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    color: '#fff',
  },
  button: {
    width: '100%',
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});