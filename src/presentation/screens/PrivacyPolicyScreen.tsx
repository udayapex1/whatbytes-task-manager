import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AuthStack';
import { palette, spacing } from '../../core/theme/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'PrivacyPolicy'>;

export default function PrivacyPolicyScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Appbar.Header style={styles.header} elevated>
        <Appbar.BackAction
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content title="Privacy Policy" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="headlineSmall" style={styles.title}>
          TaskFlow Privacy Policy
        </Text>
        <Text style={styles.updated}>Last updated: October 13, 2026</Text>

        <Text style={styles.intro}>
          TaskFlow is a personal task manager. This policy explains what information the app
          uses to provide account access, save your tasks, and keep your workspace available
          across sessions.
        </Text>

        <PolicySection title="Information we use">
          <Text style={styles.body}>
            When you create an account, TaskFlow uses your email address and password through
            Firebase Authentication. The app also stores the task information you choose to
            add, including titles, descriptions, due dates, priorities, and completion status.
          </Text>
        </PolicySection>

        <PolicySection title="How we use your information">
          <Text style={styles.body}>
            Your information is used to sign you in, keep your account secure, sync your tasks,
            save your preferences and session locally, and provide the core TaskFlow features.
            Task data is associated with your account so other users cannot access it through the
            app.
          </Text>
        </PolicySection>

        <PolicySection title="Storage and service providers">
          <Text style={styles.body}>
            TaskFlow uses Firebase Authentication for account access and Cloud Firestore for
            task storage. The app uses device storage to keep authentication state between
            launches. These services process information as needed to provide the app’s
            functionality and have their own privacy and security practices.
          </Text>
        </PolicySection>

        <PolicySection title="Passwords and security">
          <Text style={styles.body}>
            Password authentication is handled by Firebase. TaskFlow does not display or store
            your password in the app’s task data. We use account-based access controls and
            Firestore security rules to protect each user’s workspace.
          </Text>
        </PolicySection>

        <PolicySection title="Your choices">
          <Text style={styles.body}>
            You can review, edit, complete, or delete your tasks from within TaskFlow, and you
            can sign out at any time. For questions about your account or a request to remove
            account information, contact the person or organization that provided this app.
          </Text>
        </PolicySection>

        <PolicySection title="Policy updates">
          <Text style={styles.body}>
            This policy may be updated when TaskFlow’s features or data practices change. The
            latest version will always be available from the Privacy Policy link on the sign-in
            and registration screens.
          </Text>
        </PolicySection>
      </ScrollView>
    </SafeAreaView>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.mist },
  header: { backgroundColor: palette.white },
  headerTitle: { color: palette.ink, fontWeight: '800' },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  title: { color: palette.ink, fontWeight: '800' },
  updated: { marginTop: spacing.xs, color: palette.ink, opacity: 0.68, fontSize: 12 },
  intro: { marginTop: spacing.lg, color: palette.ink, fontSize: 15, lineHeight: 23 },
  section: { marginTop: spacing.lg },
  sectionTitle: { color: palette.ink, fontWeight: '800' },
  body: { marginTop: spacing.sm, color: palette.ink, opacity: 0.78, fontSize: 14, lineHeight: 22 },
});
