import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  AccessibilityInfo,
  Easing,
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
import { Avatar, Button, HelperText, Text, TextInput } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getAuthErrorMessage } from "../../core/utils/authErrors";
import { palette, spacing } from "../../core/theme/theme";
import { appLogger } from "../../core/utils/appLogger";
import type { AuthStackParamList } from "../navigation/AuthStack";
import { useAuthStore } from "../store/authStore";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;
type Field = "email" | "password" | "confirm";

const MIN_PASSWORD_LENGTH = 8;
const SUCCESS = "#2E9E6B";

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
  SUCCESS,
  SUCCESS,
];

const getRequirements = (value: string) => [
  { key: "len", label: "8+ characters", ok: value.length >= MIN_PASSWORD_LENGTH },
  { key: "case", label: "Aa upper & lower", ok: /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { key: "sym", label: "1 number & symbol", ok: /\d/.test(value) && /[^A-Za-z0-9]/.test(value) },
];

// Dependency-free vertical gradient. Many thin bands keep the steps invisible
// (16 bands showed as stripes). Darkens the top (logo contrast) and the bottom
// (headline contrast); the middle stays clear so the artwork shows.
const SCRIM_BANDS = 80;
const scrimOpacity = (i: number) => {
  const t = i / (SCRIM_BANDS - 1);
  const bottom = Math.pow(t, 1.4) * 0.88;
  const top = Math.max(0, 1 - t / 0.3) * 0.5;
  return 1 - (1 - bottom) * (1 - top);
};

const DUPLICATE_EMAIL_MESSAGE =
  "This email already has an account. Log in, or use a different email.";

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
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [focused, setFocused] = useState<Field | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const requirements = useMemo(() => getRequirements(password), [password]);
  const passwordsMatch =
    confirmPassword.length > 0 && confirmPassword === password;

  // One orchestrated moment: the sheet rises into place on mount.
  const sheetY = useRef(new Animated.Value(48)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        sheetY.setValue(0);
        sheetOpacity.setValue(1);
        return;
      }
      Animated.parallel([
        Animated.timing(sheetY, {
          toValue: 0,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheetOpacity, {
          toValue: 1,
          duration: 360,
          useNativeDriver: true,
        }),
      ]).start();
    });
    return () => {
      cancelled = true;
    };
  }, [sheetY, sheetOpacity]);

  const handleFocus = (field: Field) => {
    setFocused(field);
    // Email sits near the top and needs no scrolling.
    if (field !== "email") {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
    }
  };

  const clearErrors = () => {
    if (error) setError("");
    if (isDuplicate) setIsDuplicate(false);
  };

  const fieldStyle = (field: Field) => [
    styles.input,
    focused === field && styles.inputFocused,
  ];

  const submit = async () => {
    if (isSubmitting) return;
    appLogger.action("button.register");
    const nextEmailError = isValidEmail(email)
      ? ""
      : "Enter a valid email address.";
    const nextPasswordError =
      password.length >= MIN_PASSWORD_LENGTH
        ? ""
        : `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
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
    setIsDuplicate(false);

    try {
      await register(email.trim(), password);
      appLogger.success("register.submit");
    } catch (authError) {
      if (isDuplicateEmailError(authError)) {
        setError(DUPLICATE_EMAIL_MESSAGE);
        setIsDuplicate(true);
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
                <Text accessibilityRole="header" style={styles.title}>
                  Create your account
                </Text>
                <Text style={styles.subtitle}>
                  Plan your day, track what matters, and finish more.
                </Text>
              </View>
            </View>

            <Animated.View
              style={[
                styles.sheet,
                { paddingBottom: spacing.lg + insets.bottom },
                { opacity: sheetOpacity, transform: [{ translateY: sheetY }] },
              ]}
            >
              <View style={styles.badgeRing} pointerEvents="none">
                <Avatar.Icon
                  size={56}
                  icon="account-plus-outline"
                  color={palette.ink}
                  style={styles.badge}
                />
              </View>

              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="you@example.com"
                accessibilityLabel="Email address"
                mode="outlined"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (emailError) setEmailError("");
                  clearErrors();
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                onFocus={() => handleFocus("email")}
                onBlur={() => setFocused(null)}
                blurOnSubmit={false}
                error={Boolean(emailError)}
                left={<TextInput.Icon icon="email-outline" />}
                style={fieldStyle("email")}
                outlineStyle={styles.inputOutline}
                outlineColor="transparent"
                activeOutlineColor={palette.orange}
              />
              <HelperText type="error" visible={Boolean(emailError)}>
                {emailError}
              </HelperText>

              <Text style={styles.label}>Password</Text>
              <TextInput
                ref={passwordRef}
                placeholder="Create a password"
                accessibilityLabel="Password"
                mode="outlined"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (passwordError) setPasswordError("");
                  clearErrors();
                }}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                onFocus={() => handleFocus("password")}
                onBlur={() => setFocused(null)}
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
                style={fieldStyle("password")}
                outlineStyle={styles.inputOutline}
                outlineColor="transparent"
                activeOutlineColor={palette.orange}
              />

              {password.length > 0 && !passwordError ? (
                <View style={styles.strengthBlock}>
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
                                  : palette.mist,
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
                  <View style={styles.reqRow}>
                    {requirements.map((r) => (
                      <View
                        key={r.key}
                        style={[styles.reqChip, r.ok && styles.reqChipOk]}
                      >
                        <Text style={[styles.reqText, r.ok && styles.reqTextOk]}>
                          {r.ok ? "✓ " : ""}
                          {r.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <HelperText type="error" visible={Boolean(passwordError)}>
                  {passwordError}
                </HelperText>
              )}

              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                ref={confirmRef}
                placeholder="Re-enter your password"
                accessibilityLabel="Confirm password"
                mode="outlined"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  if (confirmError) setConfirmError("");
                  clearErrors();
                }}
                secureTextEntry={!isConfirmVisible}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={() => void submit()}
                onFocus={() => handleFocus("confirm")}
                onBlur={() => setFocused(null)}
                error={Boolean(confirmError)}
                left={
                  <TextInput.Icon
                    icon={passwordsMatch ? "check-circle" : "lock-check-outline"}
                    color={passwordsMatch ? SUCCESS : undefined}
                  />
                }
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
                style={fieldStyle("confirm")}
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
                    {isDuplicate
                      ? "Email already in use"
                      : "Unable to create account"}
                  </Text>
                  <Text style={styles.errorMessage}>{error}</Text>
                  {isDuplicate ? (
                    <Pressable
                      hitSlop={8}
                      style={styles.errorAction}
                      onPress={() => {
                        appLogger.action("button.openLoginFromDuplicateEmail");
                        navigation.navigate("Login");
                      }}
                    >
                      <Text style={styles.link}>Log in instead</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              <Button
                mode="contained"
                onPress={() => void submit()}
                icon={isSubmitting ? undefined : "arrow-right"}
                loading={isSubmitting}
                disabled={isSubmitting}
                contentStyle={styles.buttonContent}
                style={styles.button}
                labelStyle={styles.buttonLabel}
              >
                {isSubmitting ? "Creating account…" : "Create account"}
              </Button>

              <Text style={styles.terms}>
                By creating an account you agree to our{" "}
                <Text
                  accessibilityRole="link"
                  style={styles.termsLink}
                  onPress={() => {
                    appLogger.action("button.openPrivacyPolicy");
                    navigation.navigate("PrivacyPolicy");
                  }}
                >
                  Privacy Policy
                </Text>
                .
              </Text>

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
            </Animated.View>
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
    minHeight: 300,
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
  // The one bold moment: a large, tight headline.
  title: {
    color: "#FFFFFF",
    fontSize: 46,
    fontWeight: "800",
    lineHeight: 48,
    letterSpacing: -0.8,
    textShadowColor: "rgba(37,52,63,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  subtitle: {
    marginTop: spacing.sm,
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
    paddingTop: spacing.xl + 20,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: palette.white,
  },
  input: { height: 52, backgroundColor: palette.mist },
  badgeRing: {
    position: "absolute",
    top: -32,
    left: spacing.lg,
    padding: 5,
    borderRadius: 40,
    backgroundColor: palette.white,
  },
  badge: { backgroundColor: palette.orange },
  label: {
    marginBottom: 6,
    color: palette.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  reqRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  reqChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: palette.mist,
  },
  reqChipOk: { backgroundColor: "rgba(46,158,107,0.14)" },
  reqText: { color: palette.ink, opacity: 0.55, fontSize: 11, fontWeight: "600" },
  reqTextOk: { color: SUCCESS, opacity: 1 },
  inputFocused: { backgroundColor: palette.white },
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
  errorAction: { alignSelf: "flex-start", marginTop: spacing.xs },

  strengthBlock: { paddingHorizontal: 4, paddingVertical: 6 },
  strengthRow: { flexDirection: "row", alignItems: "center" },
  strengthBars: { flex: 1, flexDirection: "row", gap: 6 },
  strengthSegment: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: {
    marginLeft: 12,
    minWidth: 48,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },
  strengthHint: {
    marginTop: 6,
    color: palette.ink,
    opacity: 0.6,
    fontSize: 12,
  },

  button: {
    marginTop: spacing.sm,
    borderRadius: 18,
    backgroundColor: palette.ink,
  },
  buttonContent: { height: 58, flexDirection: "row-reverse" },
  buttonLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },

  terms: {
    marginTop: spacing.md,
    color: palette.ink,
    opacity: 0.6,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  termsLink: {
    color: palette.ink,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  switchText: { color: palette.ink, opacity: 0.7, fontSize: 13 },
  link: { color: palette.orange, fontSize: 13, fontWeight: "800" },
});