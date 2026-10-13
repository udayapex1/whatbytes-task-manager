import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
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
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getAuthErrorMessage } from "../../core/utils/authErrors";
import { palette, spacing } from "../../core/theme/theme";
import { appLogger } from "../../core/utils/appLogger";
import type { AuthStackParamList } from "../navigation/AuthStack";
import { useAuthStore } from "../store/authStore";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// 0-4 score; guidance only, does not affect validation.
const getPasswordStrength = (value: string): number => {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.max(1, score);
};

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = [
  palette.slate,
  palette.orange,
  palette.orange,
  palette.ink,
  palette.ink,
];

// Dependency-free vertical gradient: transparent at top -> dark at bottom.
const SCRIM_BANDS = 16;
const scrimOpacity = (i: number) => Math.pow(i / (SCRIM_BANDS - 1), 1.4) * 0.88;

const DUPLICATE_EMAIL_MESSAGE =
  "This email is already in use. Try logging in instead, or use a different email address.";

const getAuthErrorCode = (error: unknown): string | undefined => {
  if (typeof error === "object" && error !== null && "code" in error) {
    return typeof error.code === "string" ? error.code : undefined;
  }

  return undefined;
};

const isDuplicateEmailError = (error: unknown): boolean => {
  const code = getAuthErrorCode(error)?.toLowerCase() ?? "";
  if (
    [
      "auth/email-already-in-use",
      "email-already-in-use",
      "auth/user-already-exists",
      "user-already-exists",
    ].includes(code)
  ) {
    return true;
  }

  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("already in use") || message.includes("already exists");
};

export default function RegisterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const register = useAuthStore((state) => state.register);
  const passwordRef = useRef<RNTextInput>(null);
  const confirmRef = useRef<RNTextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [error, setError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const scrollToFocusedInput = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
  };

  const submit = async () => {
    if (isSubmitting) return;
    appLogger.action("button.register");
    const nextEmailError = isValidEmail(email)
      ? ""
      : "Enter a valid email address.";
    const nextPasswordError =
      password.length >= 6 ? "" : "Password must be at least 6 characters.";
    const nextConfirmError =
      password === confirmPassword ? "" : "Passwords do not match.";

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);

    if (nextEmailError || nextPasswordError || nextConfirmError) {
      appLogger.action("register.validationFailed", {
        email: Boolean(nextEmailError),
        password: Boolean(nextPasswordError),
        confirmPassword: Boolean(nextConfirmError),
      });
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await register(email.trim(), password);
      appLogger.success("register.submit");
    } catch (authError) {
      if (isDuplicateEmailError(authError)) {
        setError(DUPLICATE_EMAIL_MESSAGE);
        Alert.alert(
          "Email already in use",
          DUPLICATE_EMAIL_MESSAGE,
          [
            { text: "Use different email", style: "cancel" },
            {
              text: "Log in",
              onPress: () => {
                appLogger.action("button.openLoginFromDuplicateEmail");
                navigation.navigate("Login");
              },
            },
          ],
        );
      } else {
        setError(getAuthErrorMessage(authError));
      }
      appLogger.failure("register.submit", authError);
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
                <Text style={styles.title}>Create an account</Text>
                <Text style={styles.subtitle}>
                  Sign up to start organizing your tasks in minutes.
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
                  if (error) setError("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
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
                  if (error) setError("");
                }}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                onFocus={scrollToFocusedInput}
                blurOnSubmit={false}
                error={Boolean(passwordError)}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                    accessibilityLabel={
                      isPasswordVisible ? "Hide password" : "Show password"
                    }
                    onPress={() => {
                      appLogger.action("button.toggleRegisterPassword");
                      setIsPasswordVisible((visible) => !visible);
                    }}
                  />
                }
                style={styles.input}
                outlineStyle={styles.inputOutline}
                outlineColor="transparent"
                activeOutlineColor={palette.orange}
              />

              {password.length > 0 && !passwordError ? (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthSegment,
                          {
                            backgroundColor:
                              level <= strength
                                ? STRENGTH_COLORS[strength]
                                : palette.slate,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text
                    style={[
                      styles.strengthLabel,
                      { color: STRENGTH_COLORS[strength] },
                    ]}
                  >
                    {STRENGTH_LABELS[strength]}
                  </Text>
                </View>
              ) : (
                <HelperText type="error" visible={Boolean(passwordError)}>
                  {passwordError}
                </HelperText>
              )}

              <TextInput
                ref={confirmRef}
                placeholder="Confirm password"
                mode="outlined"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  if (confirmError) setConfirmError("");
                  if (error) setError("");
                }}
                secureTextEntry={!isConfirmVisible}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={() => void submit()}
                onFocus={scrollToFocusedInput}
                error={Boolean(confirmError)}
                left={<TextInput.Icon icon="lock-check-outline" />}
                right={
                  <TextInput.Icon
                    icon={isConfirmVisible ? "eye-off-outline" : "eye-outline"}
                    accessibilityLabel={
                      isConfirmVisible ? "Hide password" : "Show password"
                    }
                    onPress={() => {
                      appLogger.action("button.toggleConfirmPassword");
                      setIsConfirmVisible((visible) => !visible);
                    }}
                  />
                }
                style={styles.input}
                outlineStyle={styles.inputOutline}
                outlineColor="transparent"
                activeOutlineColor={palette.orange}
              />
              <HelperText type="error" visible={Boolean(confirmError)}>
                {confirmError}
              </HelperText>

              {error ? (
                <View style={styles.errorBox} accessibilityRole="alert">
                  <Text style={styles.errorTitle}>
                    Unable to create account
                  </Text>
                  <Text style={styles.errorMessage}>{error}</Text>
                </View>
              ) : null}

              <Button
                mode="contained"
                onPress={() => void submit()}
                disabled={isSubmitting}
                contentStyle={styles.buttonContent}
                style={styles.button}
                labelStyle={styles.buttonLabel}
              >
                {isSubmitting ? "Creating account…" : "Create account"}
              </Button>

              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Already have an account? </Text>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    appLogger.action("button.openLogin");
                    navigation.navigate("Login");
                  }}
                >
                  <Text style={styles.link}>Log in</Text>
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
    minHeight: 220,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  scrim: { ...StyleSheet.absoluteFill },
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
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
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
  errorBox: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.orange,
    backgroundColor: "rgba(255, 155, 81, 0.12)",
  },
  errorTitle: { color: palette.ink, fontSize: 13, fontWeight: "800" },
  errorMessage: {
    marginTop: 2,
    color: palette.ink,
    fontSize: 13,
    lineHeight: 19,
  },

  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 32,
    paddingHorizontal: 4,
  },
  strengthBars: { flex: 1, flexDirection: "row", gap: 6 },
  strengthSegment: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: {
    marginLeft: 12,
    minWidth: 48,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },

  button: {
    marginTop: spacing.sm,
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
