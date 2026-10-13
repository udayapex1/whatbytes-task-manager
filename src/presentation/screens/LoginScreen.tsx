import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, HelperText, Snackbar, Text, TextInput } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import type { AuthStackParamList } from '../navigation/AuthStack';
import { getAuthErrorMessage } from '../../core/utils/authErrors';
import { spacing } from '../../core/theme/theme';
import { appLogger } from '../../core/utils/appLogger';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export default function LoginScreen({ navigation }: Props) {
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    appLogger.action('button.login');
    const nextEmailError = isValidEmail(email) ? '' : 'Enter a valid email address.';
    const nextPasswordError = password.length >= 6 ? '' : 'Password must be at least 6 characters.';

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextEmailError || nextPasswordError) {
      appLogger.action('login.validationFailed', {
        email: Boolean(nextEmailError),
        password: Boolean(nextPasswordError),
      });
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await login(email.trim(), password);
      appLogger.success('login.submit');
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
      appLogger.failure('login.submit', authError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logo}>
            <Text style={styles.logoCheck}>✓</Text>
          </View>
          <Text variant="headlineMedium" style={styles.title}>Welcome back!</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Stay on top of your work, one task at a time.
          </Text>

          <View style={styles.form}>
            <TextInput
              label="Email address"
              mode="outlined"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (emailError) setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={Boolean(emailError)}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />
            <HelperText type="error" visible={Boolean(emailError)}>
              {emailError}
            </HelperText>

            <View>
              <TextInput
                label="Password"
                mode="outlined"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (passwordError) setPasswordError('');
                }}
                secureTextEntry={!isPasswordVisible}
                autoComplete="password"
                error={Boolean(passwordError)}
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
                onPress={() => {
                  appLogger.action('button.toggleLoginPassword');
                  setIsPasswordVisible((visible) => !visible);
                }}
                style={styles.passwordToggle}
              >
                <Text style={styles.passwordToggleText}>{isPasswordVisible ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            <HelperText type="error" visible={Boolean(passwordError)}>
              {passwordError}
            </HelperText>

            <Button
              mode="contained"
              onPress={() => void submit()}
              loading={isSubmitting}
              disabled={isSubmitting}
              contentStyle={styles.buttonContent}
              style={styles.button}
            >
              Log in
            </Button>
          </View>

          <View style={styles.switchRow}>
            <Text>Don't have an account? </Text>
            <Pressable
              onPress={() => {
                appLogger.action('button.openRegister');
                navigation.navigate('Register');
              }}
            >
              <Text style={styles.link}>Get started</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={Boolean(error)}
        onDismiss={() => {
          appLogger.action('button.dismissLoginError');
          setError('');
        }}
        duration={4500}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logo: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 92,
    height: 92,
    marginBottom: spacing.lg,
    borderRadius: 24,
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  logoCheck: { color: '#FFFFFF', fontSize: 58, fontWeight: '800', lineHeight: 68 },
  title: { textAlign: 'center', color: '#2D3250', fontWeight: '800' },
  subtitle: { marginTop: spacing.sm, textAlign: 'center', color: '#73788D' },
  form: { marginTop: spacing.xl },
  input: { backgroundColor: '#F6F7FB' },
  inputOutline: { borderRadius: 14, borderColor: '#E4E6EF' },
  passwordToggle: { position: 'absolute', right: 14, top: 17 },
  passwordToggleText: { color: '#6C63FF', fontWeight: '700' },
  button: { marginTop: spacing.md, borderRadius: 14 },
  buttonContent: { height: 54 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  link: { color: '#6C63FF', fontWeight: '700' },
});
