# WhatBytes Task Manager

A polished Expo Go task-management app for gig workers, built for the WhatBytes React Native Developer Intern assignment.

**📱 [Download the Android APK](https://drive.google.com/file/d/1yrJDujTacpoPiOt8d9PyWHNAJ38Yt0si/view?usp=drivesdk)**

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Firestore Data Model](#firestore-data-model)
- [Setup for Expo Go](#setup-for-expo-go)
- [Known Limitations](#known-limitations)
- [Screenshots](#screenshots)

## Overview

Task Manager supports email/password authentication and per-user task management backed by Firebase Authentication and Cloud Firestore. Tasks can be created, edited, deleted, completed, filtered, and sorted by due date.

## Features

- Firebase email/password registration and login
- Persistent authentication between launches with AsyncStorage
- Session restore uses a hydrating splash; login and register stay on their screens until auth succeeds
- Create, edit, delete, and complete tasks
- Home list updates immediately from the Zustand store; pull-to-refresh syncs from Firestore
- Tasks are scoped per signed-in user and cleared on logout or account switch
- Title, description, due date, and low/medium/high priority
- Combined priority and completion-status filters
- Client-side due-date sorting to avoid Firestore composite indexes
- Loading, pull-to-refresh, validation, error, empty, and offline states
- Responsive Material Design UI for iOS and Android

## Tech Stack

| Technology | Purpose |
| --- | --- |
| Expo + TypeScript | Expo Go compatibility and type safety |
| React Navigation (native-stack) | Separate authentication and app flows |
| Firebase JS SDK | Authentication and Firestore without native Firebase modules |
| React Native Paper | Material Design components and theming |
| Zustand | Lightweight state management, used instead of bloc/riverpod (which are Flutter ecosystem tools) |
| AsyncStorage | Firebase Auth persistence |
| `@react-native-community/datetimepicker` | Native due-date selection |

## Architecture

The project follows clean architecture:

```text
Presentation (screens, components, navigation, Zustand stores)
        │ calls
        ▼
Domain (entities, repository interfaces, use cases)
        ▲ implemented by
        │
Data (Firebase repositories, Firestore mappers)
```

The domain layer contains no React or Firebase imports. Screens communicate with Zustand stores, stores call domain use cases, use cases depend on repository interfaces, and Firebase implementations live in the data layer.

The task store is the live source for the home UI, so in-flight Firestore reads cannot overwrite a create, edit, toggle, or delete.

## Folder Structure

```text
src/
├── core/          Firebase config, theme, date/auth utilities, priorities
├── domain/        Entities, repository contracts, use cases
├── data/          Firebase repositories and Firestore mappers
└── presentation/  Navigation, Zustand stores, screens, components
```

## Firestore Data Model

Each signed-in user owns task documents in the top-level `tasks` collection. The explicit `userId` field makes ownership visible to queries, migrations, and future reporting tools:

```text
tasks/{taskId}
```

Each task contains:

```text
{
  userId: string,
  title: string,
  description: string,
  dueDate: Timestamp,
  priority: "low" | "medium" | "high",
  isCompleted: boolean,
  createdAt: Timestamp
}
```

Filtering and sorting happen in the Zustand task store on the client. This avoids requiring composite Firestore indexes for the combined filters.

### Firestore Security Rules

The deployable rules are in [`firestore.rules`](./firestore.rules):

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /tasks/{taskId} {
      allow read: if request.auth != null
        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null
        && resource.data.userId == request.auth.uid
        && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null
        && resource.data.userId == request.auth.uid;
    }
  }
}
```

> **Note:** The legacy nested path remains temporarily readable and writable so the app can copy existing tasks into the new collection on the user's next fetch. After all existing users have opened the updated app and migration is verified, the legacy rule and migration code can be removed.

## Setup for Expo Go

1. **Clone the repository and install dependencies:**

   ```bash
   npm install
   ```

2. **Create the environment file:**

   ```bash
   cp .env.example .env
   ```

   Fill the six `EXPO_PUBLIC_FIREBASE_*` values from the Firebase Web app configuration. Never commit `.env`.

3. **Configure Firebase Console:**

   - Create or select a Firebase project.
   - Register a Web app and copy its configuration values.
   - Enable Authentication → Sign-in method → Email/Password.
   - Create a Cloud Firestore database.
   - Deploy `firestore.rules` or copy its rules into the Firestore Rules tab.

4. **Build the internal Android APK (optional):**

   Add all six `EXPO_PUBLIC_FIREBASE_*` values to the EAS `preview` environment. The local `.env` file is not automatically available to a cloud EAS build. Use the Firebase Web app configuration from Firebase Console → Project settings → General; these client config values are embedded in the app bundle.

   ```bash
   eas env:set --environment preview --name EXPO_PUBLIC_FIREBASE_API_KEY --value "PASTE_FIREBASE_VALUE" --visibility plaintext
   eas env:set --environment preview --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "PASTE_FIREBASE_VALUE" --visibility plaintext
   eas env:set --environment preview --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "PASTE_FIREBASE_VALUE" --visibility plaintext
   eas env:set --environment preview --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "PASTE_FIREBASE_VALUE" --visibility plaintext
   eas env:set --environment preview --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "PASTE_FIREBASE_VALUE" --visibility plaintext
   eas env:set --environment preview --name EXPO_PUBLIC_FIREBASE_APP_ID --value "PASTE_FIREBASE_VALUE" --visibility plaintext
   ```

   Verify the remote environment without displaying values:

   ```bash
   eas env:exec preview 'node scripts/validateFirebaseEnv.js --compare-local'
   ```

   The command should report that all six variables are present and match the local `.env`, without printing values. The build also runs the presence check before installing dependencies and fails with missing variable names if configuration is incomplete.

   Build the standalone Android APK:

   ```bash
   eas build --platform android --profile preview
   ```

5. **Start Expo with a clean cache:**

   ```bash
   npx expo start --clear
   ```

6. **Run the app:** Scan the QR code with Expo Go on a device on the same network, or press `a` / `i` for an available emulator/simulator.

## Known Limitations

- Tasks are loaded and filtered on the client, which is appropriate for the assignment but not ideal for very large task collections.
- Firebase configuration is supplied through Expo public environment variables because the Firebase Web SDK runs in the client; Firestore security rules protect user data.
- No social login or push notifications are included because they are outside the assignment scope.

## Screenshots

![App screenshot 1](<assets/app _screenshots/ss1.jpeg>)

![App screenshot 2](<assets/app _screenshots/ss2.jpeg>)

![App screenshot 3](<assets/app _screenshots/ss3.jpeg>)

![App screenshot 4](<assets/app _screenshots/ss4.jpeg>)

![App screenshot 5](<assets/app _screenshots/ss5.jpeg>)

![App screenshot 6](<assets/app _screenshots/ss6.jpeg>)
