import './src/core/firebase/firebaseConfig';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FirebaseAuthRepository } from './src/data/repositories/FirebaseAuthRepository';
import { FirestoreTaskRepository } from './src/data/repositories/FirestoreTaskRepository';
import RootNavigator from './src/presentation/navigation/RootNavigator';
import { configureAuthStore } from './src/presentation/store/authStore';
import { configureTaskStore } from './src/presentation/store/taskStore';
import { theme } from './src/core/theme/theme';

configureAuthStore(new FirebaseAuthRepository());
configureTaskStore(new FirestoreTaskRepository());

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="dark" />
        <RootNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
