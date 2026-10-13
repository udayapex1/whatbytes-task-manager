import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Appbar, Text } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import { appLogger } from '../../core/utils/appLogger';

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
        <Appbar.Content title="TaskFlow" titleStyle={styles.loadingTitle} />
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading your workspace…</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#F6F7FB',
  },
  loadingTitle: { color: '#2D3250', fontWeight: '800' },
  loadingText: { color: '#73788D' },
});
