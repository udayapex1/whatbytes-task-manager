import { useLayoutEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  TextInput as RNTextInput,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  Button,
  HelperText,
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/authStore";
import type { AuthStackParamList } from "../navigation/AuthStack";
import { getAuthErrorMessage } from "../../core/utils/authErrors";
import { palette, spacing } from "../../core/theme/theme";
import { appLogger } from "../../core/utils/appLogger";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// Dependency-free vertical gradient: transparent at top -> dark at bottom.
const SCRIM_BANDS = 16;
const scrimOpacity = (i: number) => Math.pow(i / (SCRIM_BANDS - 1), 1.4) * 0.88;

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const login = useAuthStore((state) => state.login);
  const passwordRef = useRef<RNTextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // No header (and no header buttons like settings) before login.
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const scrollToFocusedInput = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
  };

  const submit = async () => {
    if (isSubmitting) return;
    appLogger.action("button.login");
    const nextEmailError = isValidEmail(email)
      ? ""
      : "Enter a valid email address.";
    const nextPasswordError =
      password.length >= 6 ? "" : "Password must be at least 6 characters.";

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextEmailError || nextPasswordError) {
      appLogger.action("login.validationFailed", {
        email: Boolean(nextEmailError),
        password: Boolean(nextPasswordError),
      });
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await login(email.trim(), password);
      appLogger.success("login.submit");
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
      appLogger.failure("login.submit", authError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ImageBackground
        source={require("../../../assets/banner.jpeg")}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={insets.top}
          style={styles.flex}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.hero}>
              <View style={styles.scrim} pointerEvents="none">
                {Array.from({ length: SCRIM_BANDS }, (_, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      backgroundColor: `rgba(37,52,63,${scrimOpacity(i)})`,
                    }}
                  />
                ))}
              </View>

              <View style={styles.brandRow}>
                <View style={styles.logoChip}>
                  <Image
                    source={require("../../../assets/files/logo-light.png")}
                    style={styles.logo}
                    accessibilityLabel="TaskFlow logo"
                  />
                </View>
                <Text style={styles.brand}>TaskFlow</Text>
              </View>

              <View>
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>
                  Log in to pick up where you left off.
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.sheet,
                { paddingBottom: spacing.lg + insets.bottom },
              ]}
            >
              <TextInput
                placeholder="Email address"
                mode="outlined"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (emailError) setEmailError("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                onFocus={scrollToFocusedInput}
                blurOnSubmit={false}
                error={Boolean(emailError)}
                left={<TextInput.Icon icon="email-outline" />}
                style={styles.input}
                outlineStyle={styles.inputOutline}
                outlineColor="transparent"
                activeOutlineColor={palette.orange}
              />
              <HelperText type="error" visible={Boolean(emailError)}>
                {emailError}
              </HelperText>

              <TextInput
                ref={passwordRef}
                placeholder="Password"
                mode="outlined"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (passwordError) setPasswordError("");
                }}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={() => void submit()}
                onFocus={scrollToFocusedInput}
                error={Boolean(passwordError)}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                    accessibilityLabel={
                      isPasswordVisible ? "Hide password" : "Show password"
                    }
                    onPress={() => {
                      appLogger.action("button.toggleLoginPassword");
                      setIsPasswordVisible((visible) => !visible);
                    }}
                  />
                }
                style={styles.input}
                outlineStyle={styles.inputOutline}
                outlineColor="transparent"
                activeOutlineColor={palette.orange}
              />
              <HelperText type="error" visible={Boolean(passwordError)}>
                {passwordError}
              </HelperText>

              <Pressable
                style={styles.forgotRow}
                hitSlop={8}
                onPress={() => {
                  appLogger.action("button.openForgotPassword");
                  navigation.navigate("ForgotPassword");
                }}
              >
                <Text style={styles.forgot}>Forgot password?</Text>
              </Pressable>

              <Button
                mode="contained"
                onPress={() => void submit()}
                disabled={isSubmitting}
                contentStyle={styles.buttonContent}
                style={styles.button}
                labelStyle={styles.buttonLabel}
              >
                {isSubmitting ? 'Signing in…' : 'Log in'}
              </Button>

              <View style={styles.switchRow}>
                <Text style={styles.switchText}>New to TaskFlow? </Text>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    appLogger.action("button.openRegister");
                    navigation.navigate("Register");
                  }}
                >
                  <Text style={styles.link}>Create account</Text>
                </Pressable>
              </View>

              <Pressable
                accessibilityRole="link"
                hitSlop={8}
                style={styles.privacyRow}
                onPress={() => {
                  appLogger.action("button.openPrivacyPolicy");
                  navigation.navigate("PrivacyPolicy");
                }}
              >
                <Text style={styles.privacyLink}>Privacy Policy</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>

      <Snackbar
        visible={Boolean(error)}
        onDismiss={() => {
          appLogger.action("button.dismissLoginError");
          setError("");
        }}
        duration={4500}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
}

const FIELD_RADIUS = 14;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.ink },
  background: { flex: 1 },
  backgroundImage: { resizeMode: "cover" },
  flex: { flex: 1 },
  content: { flexGrow: 1 },

  hero: {
    flex: 1,
    minHeight: 280,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  scrim: { ...StyleSheet.absoluteFillObject },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logoChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,52,63,0.35)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
  },
  logo: { width: 28, height: 28, borderRadius: 8, overflow: "hidden" },
  brand: {
    marginLeft: 12,
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
    textShadowColor: "rgba(37,52,63,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 42,
    textShadowColor: "rgba(37,52,63,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  subtitle: {
    marginTop: spacing.xs,
    maxWidth: 300,
    color: palette.mist,
    fontSize: 15,
    lineHeight: 22,
    textShadowColor: "rgba(37,52,63,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  sheet: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: palette.white,
  },
  input: { height: 52, backgroundColor: palette.mist },
  inputOutline: { borderRadius: FIELD_RADIUS, borderWidth: 1.5 },
  forgotRow: { alignSelf: "flex-end", marginTop: -spacing.xs },
  forgot: { color: palette.orange, fontSize: 13, fontWeight: "700" },
  button: {
    marginTop: spacing.md,
    borderRadius: 16,
    backgroundColor: palette.orange,
  },
  buttonContent: { height: 54 },
  buttonLabel: { color: palette.ink, fontSize: 16, fontWeight: "800" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  switchText: { color: palette.ink, opacity: 0.7, fontSize: 13 },
  link: { color: palette.orange, fontSize: 13, fontWeight: "800" },
  privacyRow: { alignSelf: "center", marginTop: spacing.md },
  privacyLink: {
    color: palette.orange,
    fontSize: 12,
    textDecorationLine: "underline",
  },
});
