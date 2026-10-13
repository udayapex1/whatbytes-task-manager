import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// @ts-ignore Firebase's RN-specific export is available at runtime but omitted from the default typings.
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
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
// reliable in those environments.
const db = appAlreadyInitialized
  ? getFirestore(app)
  : initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });

export { auth, db };
