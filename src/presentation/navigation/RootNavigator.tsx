import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import { appLogger } from '../../core/utils/appLogger';
import { palette } from '../../core/theme/theme';
import Skeleton from '../components/Skeleton';

export default function RootNavigator() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    appLogger.action('navigation.initializeAuth');
    return initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <View style={styles.brandRow}>
          <Skeleton width={50} height={50} radius={16} />
          <Skeleton width={110} height={18} radius={9} />
        </View>
        <View style={styles.heroSkeleton}>
          <Skeleton width="72%" height={30} radius={15} />
          <Skeleton width="88%" height={14} radius={7} style={styles.subtitleSkeleton} />
        </View>
        <View style={styles.sheetSkeleton}>
          <Skeleton height={54} radius={14} />
          <Skeleton height={54} radius={14} />
          <Skeleton width="100%" height={54} radius={16} style={styles.buttonSkeleton} />
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    backgroundColor: palette.mist,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroSkeleton: { marginTop: 64, gap: 12 },
  subtitleSkeleton: { marginTop: 2 },
  sheetSkeleton: { gap: 14, marginTop: 44, padding: 20, borderRadius: 28, backgroundColor: palette.white },
  buttonSkeleton: { marginTop: 10, backgroundColor: palette.orange },
});
