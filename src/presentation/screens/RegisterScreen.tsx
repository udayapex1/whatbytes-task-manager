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
import { getAuthErrorMessage } from '../../core/utils/authErrors';
import { spacing } from '../../core/theme/theme';
import type { AuthStackParamList } from '../navigation/AuthStack';
import { useAuthStore } from '../store/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export default function RegisterScreen({ navigation }: Props) {
  const register = useAuthStore((state) => state.register);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [error, setError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const nextEmailError = isValidEmail(email) ? '' : 'Enter a valid email address.';
    const nextPasswordError = password.length >= 6 ? '' : 'Password must be at least 6 characters.';
    const nextConfirmError = password === confirmPassword ? '' : 'Passwords do not match.';

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);

    if (nextEmailError || nextPasswordError || nextConfirmError) return;

    setIsSubmitting(true);
    setError('');

    try {
      await register(email.trim(), password);
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
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
          <Text variant="headlineMedium" style={styles.title}>Let's get started!</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Create your workspace and make every day count.
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
            <HelperText type="error" visible={Boolean(emailError)}>{emailError}</HelperText>

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
                autoComplete="new-password"
                error={Boolean(passwordError)}
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
              <Pressable onPress={() => setIsPasswordVisible((visible) => !visible)} style={styles.passwordToggle}>
                <Text style={styles.passwordToggleText}>{isPasswordVisible ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            <HelperText type="error" visible={Boolean(passwordError)}>{passwordError}</HelperText>

            <View>
              <TextInput
                label="Confirm password"
                mode="outlined"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  if (confirmError) setConfirmError('');
                }}
                secureTextEntry={!isConfirmVisible}
                autoComplete="new-password"
                error={Boolean(confirmError)}
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
              <Pressable onPress={() => setIsConfirmVisible((visible) => !visible)} style={styles.passwordToggle}>
                <Text style={styles.passwordToggleText}>{isConfirmVisible ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            <HelperText type="error" visible={Boolean(confirmError)}>{confirmError}</HelperText>

            <Button
              mode="contained"
              onPress={() => void submit()}
              loading={isSubmitting}
              disabled={isSubmitting}
              contentStyle={styles.buttonContent}
              style={styles.button}
            >
              Sign up
            </Button>
          </View>

          <View style={styles.switchRow}>
            <Text>Already have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Log in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar visible={Boolean(error)} onDismiss={() => setError('')} duration={4500}>
        {error}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  logo: {
    alignSelf: 'center', alignItems: 'center', justifyContent: 'center', width: 92, height: 92,
    marginBottom: spacing.lg, borderRadius: 24, backgroundColor: '#6C63FF', shadowColor: '#6C63FF',
    shadowOpacity: 0.24, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8,
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
