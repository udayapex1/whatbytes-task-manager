import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// @ts-ignore Firebase's RN-specific export is available at runtime but omitted from the default typings.
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseEnvironment = {
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missingFirebaseVariables = Object.entries(firebaseEnvironment)
  .filter(([, value]) => typeof value !== 'string' || value.trim().length === 0)
  .map(([name]) => name);

if (missingFirebaseVariables.length > 0) {
  throw new Error(
    `Firebase configuration is incomplete. Missing: ${missingFirebaseVariables.join(', ')}. ` +
      'Add these values to the EAS environment selected by this build profile, then rebuild.',
  );
}

const firebaseConfig = {
  apiKey: firebaseEnvironment.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: firebaseEnvironment.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseEnvironment.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: firebaseEnvironment.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseEnvironment.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseEnvironment.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const appAlreadyInitialized = getApps().length > 0;
const app = appAlreadyInitialized ? getApp() : initializeApp(firebaseConfig);

const auth = appAlreadyInitialized
  ? getAuth(app)
  : initializeAuth(app, {
      // @ts-ignore Firebase's React Native persistence type may be unavailable in some SDK versions.
      persistence: getReactNativePersistence(AsyncStorage),
    });

// React Native/Expo networks and some proxies can buffer Firestore WebChannel
// traffic indefinitely. Long polling makes the request/response transport
// reliable in those environments. During Fast Refresh, reuse the existing
// Firestore instance instead of initializing it a second time.
const db = appAlreadyInitialized
  ? getFirestore(app)
  : initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });

export { auth, db };
