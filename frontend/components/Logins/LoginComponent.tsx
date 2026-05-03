import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFCMToken, setupTokenRefresh } from '../../services/notificationService';
import { Image } from 'react-native';
import logo from '../../assets/images/logo1.png';
import { Ionicons } from '@expo/vector-icons';
import DropDownPicker from "react-native-dropdown-picker";

type AuthUser = {
  id: string;
  erpId: string;
  name: string;
  role: string | null;
};

type LoginComponentProps = {
  apiBaseUrl: string;
  onLoginSuccess: (token: string, user: AuthUser) => void;
};

type RoleValue = 'faculty' | 'security_guard';

type RoleOption = {
  label: string;
  value: RoleValue;
};

const LAST_LOGIN_CREDENTIALS_KEY = 'last_login_credentials';



export default function LoginComponent({ apiBaseUrl, onLoginSuccess }: LoginComponentProps) {
  const [erpId, setErpId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<RoleValue | null>(null);
  const [items, setItems] = useState<RoleOption[]>([
    { label: "Faculty", value: "faculty" },
    { label: "Security Guard", value: "security_guard" },
  ]);

  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedCredentials = await AsyncStorage.getItem(LAST_LOGIN_CREDENTIALS_KEY);

        if (savedCredentials) {
          const parsedCredentials = JSON.parse(savedCredentials) as {
            erpId?: string;
            password?: string;
          };

          setErpId(parsedCredentials.erpId ?? '');
          setPassword(parsedCredentials.password ?? '');
          return;
        }

     
      

        const savedUser = await AsyncStorage.getItem('user');
        if  (savedUser) {
          const parsedUser = JSON.parse(savedUser) as Partial<AuthUser>;
          if (parsedUser.erpId) {
            setErpId(parsedUser.erpId);
          }
        }
      } catch (error) {
        console.warn('Failed to load saved credentials:', error);
      }
    };

    loadSavedCredentials();
  }, []);

  useEffect(() => {
    const unsubscribe = setupTokenRefresh(async (newToken) => {
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');
      if (token && user) {
        try {
          await fetch(`${apiBaseUrl}/api/auth/store-fcm-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ fcmToken: newToken }),
          });
        } catch (error) {
          console.error('Failed to update FCM token:', error);
        }
      }
    });

    return unsubscribe;
  }, [apiBaseUrl]);

  
  const handleLogin = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const trimmedErpId = erpId.trim();

      if (!trimmedErpId || !password.trim()) {
        setErrorMessage('Enter your ERP ID and password to continue.');
        return;
      }

      if (!role) {
        setErrorMessage('Please select your role before logging in.');
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          erpId: trimmedErpId,
          password,
          role,
        }),
      });

      // Debug: log outgoing login payload
       try {
         console.log('Login request sent', { erpId: trimmedErpId, role });
       } catch (_) {}

      const payload = (await response.json()) as
        | { token: string; user: AuthUser }
        | { error?: string };

      // Debug: log server response
       try {
         console.log('Login response', { ok: response.ok, body: payload });
       } catch (_) {}

      if (!response.ok || !('token' in payload) || !('user' in payload)) {
        const loginError = 'error' in payload ? payload.error : undefined;
        setErrorMessage(loginError ?? 'Login failed. Please check your ERP ID and password.');
        return;
      }

      await AsyncStorage.setItem(
        LAST_LOGIN_CREDENTIALS_KEY,
        JSON.stringify({
          erpId: trimmedErpId,
          password,
        })
      );

      // If server returned a role, ensure it matches the selected role.
      const serverRole = payload.user.role;
      if (serverRole) {
        const serverIsGuard = typeof serverRole === 'string' && serverRole.toLowerCase().includes('guard');
        const selectedIsGuard = role === 'security_guard';
        if (serverIsGuard !== selectedIsGuard) {
          try { console.warn('LoginComponent - role mismatch: serverRole=', serverRole, 'selected=', role); } catch (_) {}
          setErrorMessage('Selected role does not match this ERP ID.');
          return;
        }
      }

      const userWithRole: AuthUser = {
        ...payload.user,
        role: payload.user.role ?? (role === 'security_guard' ? 'Security Guard' : 'Faculty'),
      };

      // Debug: log the finalized role after fallback
      try { console.log('LoginComponent - Final user role:', userWithRole.role, '| Selected role was:', role); } catch (_) {}

      await AsyncStorage.setItem('token', payload.token);
      await AsyncStorage.setItem('user', JSON.stringify(userWithRole));
      
      try { console.log('LoginComponent - About to call onLoginSuccess with role:', userWithRole.role); } catch (_) {}
      try {
        await onLoginSuccess(payload.token, userWithRole);
        try { console.log('LoginComponent - onLoginSuccess called successfully'); } catch (_) {}
      } catch (callbackError) {
        try { console.error('LoginComponent - ERROR in onLoginSuccess callback:', callbackError); } catch (_) {}
      }

      try {
        const fcmToken = await getFCMToken();
        if (fcmToken) {
          await fetch(`${apiBaseUrl}/api/auth/store-fcm-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${payload.token}`
            },
            body: JSON.stringify({ fcmToken }),
          });
        }
      } catch (error) {
        console.error('Failed to store FCM token:', error);
      }

    } catch {
      setErrorMessage('Cannot reach server. Make sure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>

        <View style={styles.imageContainer}>
      <Image
        source={logo}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
      {/* <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} /> */}

      <View style={styles.formContainer}>
        {/* <View style={styles.badge}>
          <Text style={styles.badgeText}>Attendance Portal</Text>
        </View> */}

      
          <Text style={styles.title}>Campus Connect</Text>
          

        <Text style={styles.subtitle}>Sign in to check attendance, review your records, and keep notifications in sync.</Text>

        {/* <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Daily access</Text>
          <Text style={styles.infoValue}>Secure ERP login for attendance tracking</Text>
        </View> */}

        <Text style={styles.roleLabel}>Select Role</Text>


        <View style={styles.dropdownWrapper}>
          <DropDownPicker
            open={open}
            value={role}
            items={items}
            setOpen={setOpen}
            setValue={setRole}
            setItems={setItems}
            placeholder="Choose your role"
            listMode="SCROLLVIEW"
            maxHeight={180}
            dropDownDirection="BOTTOM"
            closeAfterSelecting
            closeOnBackPressed
            zIndex={3000}
            zIndexInverse={1000}
            style={styles.dropdown}
            textStyle={styles.dropdownText}
            placeholderStyle={styles.dropdownPlaceholder}
            dropDownContainerStyle={styles.dropdownContainer}
            listItemLabelStyle={styles.dropdownItemLabel}
            selectedItemContainerStyle={styles.dropdownSelectedItemContainer}
            selectedItemLabelStyle={styles.dropdownSelectedItemLabel}
            ArrowDownIconComponent={() => (
              <Ionicons name="chevron-down" size={18} color="#7f1d1d" />
            )}
            ArrowUpIconComponent={() => (
              <Ionicons name="chevron-up" size={18} color="#7f1d1d" />
            )}
            TickIconComponent={() => (
              <Ionicons name="checkmark" size={16} color="#7f1d1d" />
            )}
          />
        </View>

        <TextInput
          placeholder="ERP ID"
          placeholderTextColor="#94a3b8"
          value={erpId}
          onChangeText={setErpId}
          autoCapitalize="characters"
          autoCorrect={false}
          textContentType="username"
          style={styles.input}
        />

        <View style={styles.passwordRow}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            style={[styles.input, styles.passwordInput]}
          />

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowPassword((current) => !current)}
          >
            <Ionicons
              name={showPassword ? 'eye' : 'eye-off'}
              size={18}
              color="#cbd5e1"
            />
        </TouchableOpacity>
        </View>

          <View style={styles.errorContainer}>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? 'Signing in...' : 'Login'}</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>Use your ERP credentials. Notifications will be registered after a successful sign-in.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
   // marginTop: -40,
    paddingTop: 67,
   // backgroundColor: '#0f172a',
    // backgroundColor:'#7f1d1d',
    backgroundColor : '#FFFFFF',
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'absolute',
    top: '7%',
    width: '100%',
    alignItems: 'center',
  },
   logo: {
    width: 250,
    height: 250,
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 220,
  //  backgroundColor: 'rgba(59, 130, 246, 0.18)',
  backgroundColor: '#f0ebeb'
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 260,
   // backgroundColor: 'rgba(248, 113, 113, 0.14)',
   backgroundColor: '#f0ebeb',
  // backgroundColor:'#f0eaea'
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
 // backgroundColor: 'rgba(15, 23, 42, 0.92)',
    backgroundColor: '#7f1d1d',
    padding: 20,
    marginTop: 120,
    borderRadius: 24,
    borderWidth: 1,
   // borderColor: 'rgba(148, 163, 184, 0.18)',
    borderColor: '#e09c15',
    //  shadowColor: '#000',
   //  shadowOffset: { width: 0, height: 10 },
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  badgeText: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 30,
    color: '#f8fafc',
 // color:'#982a33',
    fontWeight: '800',
  
    lineHeight: 36,
  },
  titleBanner: {
    backgroundColor: '#7f1d1d',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  titleUnderline: {
    marginTop: 10,
    width: 84,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#f97316',
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 18,
   // color: '#cbd5e1',
    color: '#f8fafc',
    fontSize: 14,
    lineHeight: 20,
  },
  roleLabel: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  roleHint: {
    color: '#e5e7eb',
    fontSize: 12,
    marginBottom: 10,
  },
  dropdownWrapper: {
    width: '100%',
    marginBottom: 12,
    zIndex: 3000,
  },
  dropdown: {
    borderRadius: 14,
    borderColor: '#e09c15',
    backgroundColor: '#f3e7e7',
    minHeight: 52,
    paddingHorizontal: 12,
  },
  dropdownText: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownPlaceholder: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownContainer: {
    borderColor: '#e09c15',
    borderRadius: 14,
    backgroundColor: '#fff5f5',
  },
  dropdownItemLabel: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownSelectedItemContainer: {
    backgroundColor: '#fde8e8',
  },
  dropdownSelectedItemLabel: {
    color: '#7f1d1d',
    fontWeight: '700',
  },
  infoCard: {
  //  backgroundColor: 'rgba(30, 41, 59, 0.9)',
  backgroundColor: '#7f1d1d',
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
   // borderColor: 'rgba(51, 65, 85, 0.9)',
    borderColor: '#e6dbdb',
  },
  infoLabel: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  infoValue: {
   // color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  input: {
    width: '100%',
   // backgroundColor: '#111827',
    backgroundColor: '#e1d2d2',
    marginBottom:6,
    paddingHorizontal: 16,
    
  //  paddingVertical: 14,
    borderRadius: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    fontSize: 15,
  },
  usedIdContainer: {
    width: '100%',
    marginBottom: 10,
  },
  usedIdLabel: {
    color: '#f8fafc',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  usedIdList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  usedIdChip: {
    backgroundColor: '#e1d2d2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  usedIdText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    width: '100%',
   // backgroundColor: '#2563eb',
   
    backgroundColor: '#d1a550',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
 //   marginTop: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  errorContainer: {
    minHeight: 45,
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderRadius: 14,
    // paddingLeft: 5,
  },
  errorText: {
    width: '100%',
    color: '#fca5a5',
    marginBottom: 12,
    marginTop: 12,
    // marginLeft: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  passwordRow: {
    width: '100%',
    position: 'relative',
    marginBottom: 14,
  },
  passwordInput: {
    paddingRight: 84,
    marginBottom: 0,
  },
  toggleButton: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -18 }], // half of height
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#7f1d1d',
  },
  toggleButtonText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  footerText: {
    marginTop: 14,
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
  },
});
