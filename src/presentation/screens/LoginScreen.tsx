import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Image,
  ImageBackground,
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
      <ImageBackground
        source={require('../../../assets/banner.jpeg')}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.bannerHeader}>
          <Text style={styles.bannerTitle}>Log in</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formCard}>
              <Image
                source={require('../../../assets/files/logo-light.png')}
                style={styles.logo}
                accessibilityLabel="TaskFlow logo"
              />
              <Text style={styles.brand}>TaskFlow</Text>

            <TextInput
              placeholder="Email"
              mode="flat"
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
              underlineColor="transparent"
              activeUnderlineColor="transparent"
            />
            <HelperText type="error" visible={Boolean(emailError)}>
              {emailError}
            </HelperText>

            <View>
              <TextInput
                placeholder="Password"
                mode="flat"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (passwordError) setPasswordError('');
                }}
                secureTextEntry={!isPasswordVisible}
                autoComplete="password"
                error={Boolean(passwordError)}
                style={styles.input}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
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
              <Text style={styles.passwordToggleText}>{isPasswordVisible ? '◉' : '◌'}</Text>
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
              labelStyle={styles.buttonLabel}
            >
              Log in
            </Button>
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Don't have an account? </Text>
                <Pressable
                  onPress={() => {
                    appLogger.action('button.openRegister');
                    navigation.navigate('Register');
                  }}
                >
                  <Text style={styles.link}>Sign up here</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>

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
  safeArea: { flex: 1, backgroundColor: '#050505' },
  background: { flex: 1 },
  backgroundImage: { resizeMode: 'cover' },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  bannerHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  bannerTitle: { color: '#FFFFFF', fontSize: 34, fontWeight: '800' },
  formCard: { padding: spacing.lg, borderRadius: 30, backgroundColor: '#FFFFFF' },
  logo: {
    alignSelf: 'center',
    width: 58,
    height: 58,
    marginBottom: spacing.xs,
    borderRadius: 16,
    overflow: 'hidden',
  },
  brand: { marginBottom: spacing.md, textAlign: 'center', color: '#E65062', fontSize: 20, fontWeight: '800' },
  input: { height: 48, marginTop: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 24, backgroundColor: '#F0F0F0' },
  passwordToggle: { position: 'absolute', right: 18, top: 22 },
  passwordToggleText: { color: '#686868', fontSize: 16 },
  button: { marginTop: spacing.lg, borderRadius: 24, backgroundColor: '#050505' },
  buttonContent: { height: 54 },
  buttonLabel: { color: '#FFFFFF', fontWeight: '800' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  switchText: { color: '#555555', fontSize: 12 },
  link: { color: '#111111', fontSize: 12, fontWeight: '800', textDecorationLine: 'underline' },
});
