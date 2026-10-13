import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import {
  Avatar,
  Button,
  HelperText,
  Text,
  TextInput,
} from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/authStore";
import type { AuthStackParamList } from "../navigation/AuthStack";
import { getAuthErrorMessage } from "../../core/utils/authErrors";
import { palette, spacing } from "../../core/theme/theme";
import { appLogger } from "../../core/utils/appLogger";
import TaskFlowAlert from "../components/TaskFlowAlert";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;
type Field = "email" | "password";

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

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
  const [alertMessage, setAlertMessage] = useState("");
  const [focused, setFocused] = useState<Field | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // One orchestrated moment: the sheet rises into place on mount.
  const sheetY = useRef(new Animated.Value(48)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  // No header (and no header buttons like settings) before login.
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
    if (field !== "email") {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
    }
  };

  const fieldStyle = (field: Field) => [
    styles.input,
    focused === field && styles.inputFocused,
  ];

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
    setAlertMessage("");

    try {
      await login(email.trim(), password);
      appLogger.success("login.submit");
    } catch (authError) {
      const message = getAuthErrorMessage(authError);
      setError(message);
      setAlertMessage(message);
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
                <Text accessibilityRole="header" style={styles.title}>
                  Welcome back
                </Text>
                <Text style={styles.subtitle}>
                  Log in to pick up where you left off.
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
                  icon="login-variant"
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
                  if (alertMessage) setAlertMessage("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
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
                placeholder="Enter your password"
                accessibilityLabel="Password"
                mode="outlined"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (passwordError) setPasswordError("");
                  if (alertMessage) setAlertMessage("");
                }}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={() => void submit()}
                onFocus={() => handleFocus("password")}
                onBlur={() => setFocused(null)}
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
                style={fieldStyle("password")}
                outlineStyle={styles.inputOutline}
                outlineColor="transparent"
                activeOutlineColor={palette.orange}
              />
              <HelperText type="error" visible={Boolean(passwordError)}>
                {passwordError}
              </HelperText>

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
                {isSubmitting ? "Signing in…" : "Log in"}
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
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>

      <TaskFlowAlert
        visible={Boolean(alertMessage)}
        title="Unable to log in"
        message={alertMessage || error}
        onDismiss={() => {
          appLogger.action("button.dismissLoginAlert");
          setError("");
          setAlertMessage("");
        }}
        actions={[
          {
            label: "Close",
            onPress: () => {
              setError("");
              setAlertMessage("");
            },
            variant: "primary",
          },
        ]}
      />
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
  input: { height: 52, backgroundColor: palette.mist },
  inputFocused: { backgroundColor: palette.white },
  inputOutline: { borderRadius: FIELD_RADIUS, borderWidth: 1.5 },

  button: {
    marginTop: spacing.md,
    borderRadius: 18,
    backgroundColor: palette.ink,
  },
  buttonContent: { height: 58, flexDirection: "row-reverse" },
  buttonLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
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
