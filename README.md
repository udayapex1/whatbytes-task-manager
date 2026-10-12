# WhatBytes Task Manager

A polished Expo Go task-management app for gig workers, built for the WhatBytes React Native Developer Intern assignment.

## Overview

Task Manager supports email/password authentication and per-user task management backed by Firebase Authentication and Cloud Firestore. Tasks can be created, edited, deleted, completed, filtered, and sorted by due date.

## Features

- Firebase email/password registration and login
- Persistent authentication between launches with AsyncStorage
- Create, edit, delete, and complete tasks
- Title, description, due date, and low/medium/high priority
- Combined priority and completion-status filters
- Client-side due-date sorting to avoid Firestore composite indexes
- Loading, pull-to-refresh, validation, error, empty, and offline states
- Responsive Material Design UI for iOS and Android

## Tech stack

- Expo + TypeScript: Expo Go compatibility and type safety
- React Navigation native-stack: separate authentication and app flows
- Firebase JS SDK: Authentication and Firestore without native Firebase modules
- React Native Paper: Material Design components and theming
- Zustand: lightweight state management used instead of bloc/riverpod, which are Flutter ecosystem tools
- AsyncStorage: Firebase Auth persistence
- `@react-native-community/datetimepicker`: native due-date selection

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

## Folder structure

```text
src/
├── core/          Firebase config, theme, date/auth utilities, priorities
├── domain/        Entities, repository contracts, use cases
├── data/          Firebase repositories and Firestore mappers
└── presentation/  Navigation, Zustand stores, screens, components
```

## Firestore data model

Each signed-in user owns a private task collection:

```text
users/{uid}/tasks/{taskId}
```

Each task contains:

```text
{
  id: string,
  title: string,
  description: string,
  dueDate: Timestamp,
  priority: "low" | "medium" | "high",
  isCompleted: boolean,
  createdAt: Timestamp
}
```

Filtering and sorting happen in the Zustand task store on the client. This avoids requiring composite Firestore indexes for the combined filters.

### Firestore security rules

The deployable rules are in [`firestore.rules`](./firestore.rules):

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Setup for Expo Go

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Create the environment file:

   ```bash
   cp .env.example .env
   ```

   Fill the six `EXPO_PUBLIC_FIREBASE_*` values from the Firebase Web app configuration. Never commit `.env`.

3. In Firebase Console:

   - Create or select a Firebase project.
   - Register a Web app and copy its configuration values.
   - Enable Authentication → Sign-in method → Email/Password.
   - Create a Cloud Firestore database.
   - Deploy `firestore.rules` or copy its rules into the Firestore Rules tab.

4. Start Expo with a clean cache:

   ```bash
   npx expo start --clear
   ```

5. Scan the QR code with Expo Go on a device on the same network, or press `a`/`i` for an available emulator/simulator.

## Known limitations

- Tasks are loaded and filtered on the client, which is appropriate for the assignment but not ideal for very large task collections.
- Firebase configuration is supplied through Expo public environment variables because the Firebase Web SDK runs in the client; Firestore security rules protect user data.
- No social login or push notifications are included because they are outside the assignment scope.

## Screenshots

Add final Expo Go screenshots here before submission:

```text
![Login screen](screenshots/login.png)
![Task list](screenshots/task-list.png)
![Task form](screenshots/task-form.png)
```

## Submission notes

See [`SUBMISSION_EMAIL.md`](./SUBMISSION_EMAIL.md) for a short Reply-All draft.
