# NexaChat

NexaChat is a modern real-time mobile chat app built with React Native, Expo, Firebase Authentication, Firestore, React Navigation, and Expo Vector Icons.

## Features

- Email/password signup and login
- Logout and online/offline presence updates
- Registered user directory
- User search
- Recent chat sorting with last-message previews
- Profile avatar placeholders
- Real-time one-to-one messaging with Firestore
- Sender and receiver chat bubbles
- Message timestamps and sent indicators
- Friendly Firebase/Auth error messages
- Typing indicator using the chat document `typing` map
- Read receipts with sent, delivered, and read tick states
- Message reactions
- Reply/quote messages
- Edit and delete sent messages
- Empty states, loading states, and keyboard-aware chat composer
- Dark, polished mobile UI suitable for a portfolio project

## Project Structure

```text
NexaChat/
  assets/
  components/
  constants/
  firebase/
  navigation/
  screens/
  styles/
```

## Firebase Collections

```text
users/{userId}
  uid
  createdAt

users/{userId}/public/profile
  uid
  email
  emailLower
  username
  displayName
  photoURL
  isOnline
  lastSeen

users/{userId}/private/profile
  email
  fcmToken
  blockedUsers

users/{userId}/contacts/{contactUid}
  uid
  email
  username
  displayName
  photoURL
  addedAt

userSearchEmails/{normalizedEmail}
  uid
  email
  username
  displayName
  photoURL

userSearchUsernames/{normalizedUsername}
  uid
  email
  username
  displayName
  photoURL

chats/{chatId}
  members
  updatedAt
  lastMessage
  typing

chats/{chatId}/messages/{messageId}
  senderId
  receiverId
  text
  timestamp
  status
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Firebase project at <https://console.firebase.google.com>.

3. Enable Authentication:

   - Go to Authentication > Sign-in method
   - Enable Email/Password

4. Create a Firestore database:

   - Go to Firestore Database
   - Create database
   - Start in test mode while developing

5. Copy your Firebase web app config into `firebase/config.js`.

   `firebase/config.example.js` shows the expected shape:

   ```js
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

6. Start the app:

   ```bash
   npm start
   ```

7. Open it with Expo Go on your phone, or run it on an emulator:

   ```bash
   npm run android
   npm run ios
   ```

## Firestore Rules for Development

Use permissive rules only while developing:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Before publishing, tighten the rules so users can only edit their own profile and messages they participate in.

Starter production-minded rules are included in `firestore.rules` and `storage.rules`.

## Current Sprint Features

- Long press a message to reply, react, edit, or delete.
- Sender messages show one tick for sent, two ticks for delivered, and blue two ticks when read.
- Opening a chat marks incoming messages as read.
- Typing status is stored on the chat document and auto-clears after a short pause.

## Planned Next Modules

- Image and file sharing with Firebase Storage
- Push notifications with Firebase Cloud Messaging and Cloud Functions
- Group chats
- Profile editing with avatar upload
- Block and unblock users

## Privacy Model

- The app does not browse the full `users` collection.
- Contacts are private under `users/{uid}/contacts`.
- User lookup is exact-match only through deterministic lookup documents.
- Chat documents use deterministic IDs and a `members` array.
- Firestore rules deny full user listing and deny chat/message access unless the requester is a member.
- Blocked users are filtered from exact search by rules and cannot access chats/messages with the blocker.
- Existing test users should log in once after this update so their public/private profile and exact-search documents are created.
- Deploy `firestore.rules` and `storage.rules` from the Firebase console or CLI after testing them in the Firebase Rules Playground.

## Notes

- The typing indicator is local to the input state. For production, store typing state in Firestore per chat.
- Image sharing, push notifications, AI chatbot support, groups, and voice messages are natural next modules after the one-to-one chat foundation is running.
