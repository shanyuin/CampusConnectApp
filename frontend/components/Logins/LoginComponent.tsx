import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import logo from '../../assets/images/logo1.png';
import { getFCMToken, setupTokenRefresh } from '../../services/notificationService';
import { AuthSession, LoginResponse, UserRole } from '../../types/auth';

type LoginComponentProps = {
  apiBaseUrl: string;
  onLoginSuccess: (session: AuthSession) => Promise<void> | void;
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
  const [role, setRole] = useState<UserRole>('faculty');
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
            role?: UserRole;
          };

          setErpId(parsedCredentials.erpId ?? '');
          setPassword(parsedCredentials.password ?? '');
          setRole(parsedCredentials.role ?? 'faculty');
          return;
        }

        const savedUser = await AsyncStorage.getItem('user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser) as Partial<AuthSession['user']>;
          if (parsedUser.erpId) {
            setErpId(parsedUser.erpId);
          }
          if (parsedUser.role === 'faculty' || parsedUser.role === 'guard') {
            setRole(parsedUser.role);
          }
        }
      } catch (error) {
        console.warn('Failed to load saved credentials:', error);
      }
    };

    loadSavedCredentials();
  }, []);

  useEffect(() => {
    const unsubscribe = setupTokenRefresh(async newToken => {
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');

      if (token && user) {
        try {
          await fetch(`${apiBaseUrl}/api/auth/store-fcm-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
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

      const payload = (await response.json()) as LoginResponse | { error?: string };

      if (
        !response.ok ||
        !('token' in payload) ||
        !('user' in payload) ||
        !('role' in payload)
      ) {
        const loginError = 'error' in payload ? payload.error : undefined;
        setErrorMessage(loginError ?? 'Login failed. Please check your credentials.');
        console.log("cannot login ");
        return;
      }

      await AsyncStorage.setItem(
        LAST_LOGIN_CREDENTIALS_KEY,
        JSON.stringify({
          erpId: trimmedErpId,
          password,
          role,
        }),
      );

      const session: AuthSession = {
        token: payload.token,
        role: payload.role,
        user: payload.user,
      };

      await onLoginSuccess(session);

      try {
        const fcmToken = await getFCMToken();
        if (fcmToken) {
          await fetch(`${apiBaseUrl}/api/auth/store-fcm-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${payload.token}`,
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
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Campus Connect</Text>
        <Text style={styles.subtitle}>
          Sign in to check attendance, review your records, and keep notifications in sync.
        </Text>

        <View style={styles.roleSelector}>
          {(['faculty', 'guard'] as const).map(option => {
            const isActive = role === option;

            return (
              <TouchableOpacity
                key={option}
                style={[styles.roleChip, isActive && styles.roleChipActive]}
                onPress={() => setRole(option)}
              >
                <Text style={[styles.roleChipText, isActive && styles.roleChipTextActive]}>
                  {option === 'faculty' ? 'Faculty' : 'Guard'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

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
          placeholder={role === 'guard' ? 'Guard ID' : 'ERP ID'}
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
            onPress={() => setShowPassword(current => !current)}
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
          <Text style={styles.buttonText}>
            {isLoading ? 'Signing in...' : `Login as ${role === 'faculty' ? 'Faculty' : 'Guard'}`}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Credentials are validated against the selected role. Notifications will be registered
          after sign-in.
        </Text>
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
    paddingTop: 67,
    backgroundColor: '#FFFFFF',
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
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#7f1d1d',
    padding: 20,
    marginTop: 120,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e09c15',
  },
  title: {
    fontSize: 30,
    color: '#f8fafc',
    fontWeight: '800',
    lineHeight: 36,
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 18,
    color: '#f8fafc',
    fontSize: 14,
    lineHeight: 20,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  roleChip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f3d08a',
    backgroundColor: '#5c1212',
    paddingVertical: 12,
    alignItems: 'center',
  },
  roleChipActive: {
    backgroundColor: '#d1a550',
    borderColor: '#d1a550',
  },
  roleChipText: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 14,
  },
  roleChipTextActive: {
    color: '#3b1f05',
  },
  input: {
    width: '100%',
    backgroundColor: '#e1d2d2',
    marginBottom: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    fontSize: 15,
  },
  button: {
    width: '100%',
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
  },
  errorText: {
    width: '100%',
    color: '#fca5a5',
    marginBottom: 12,
    marginTop: 12,
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
    transform: [{ translateY: -18 }],
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#7f1d1d',
  },
  footerText: {
    marginTop: 14,
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
  },
});
