import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';



export default function GuardHome() {

  type guardUser = {
  id: string;
  erpId: string;
  name: string;
  role: string | null;
};

  const [user, setUser] = React.useState<guardUser | null>(null);
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.log('Error loading user data:', error);
      }
    };
    loadUser();
  }, []);

  const router = useRouter();
  const [loggingOut, setLoggingOut] = React.useState(false);



  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      router.replace('/login');
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Guard Home' }} />
      <Text style={styles.title}>Welcome, {user ? user.name : 'Guest'}</Text>
     
      <Text style={styles.subtitle}>Use this portal to record and review entries.</Text>

          

      <TouchableOpacity
        onPress={handleLogout}
        style={{
          marginTop: 30,
          paddingVertical: 12,
          paddingHorizontal: 24,
          backgroundColor: loggingOut ? '#ccc' : '#007AFF',
          borderRadius: 8,
        }}        disabled={loggingOut}
      >
        <Text style={{ color: '#fff', fontSize: 16 }}>{loggingOut ? 'Logging Out...' : 'Logout'}</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#444',
  },
});
