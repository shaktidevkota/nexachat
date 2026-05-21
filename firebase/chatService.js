import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  where
} from "firebase/firestore";
import { db } from "./config";

function normalizeLookup(value = "") {
  return encodeURIComponent(value.trim().toLowerCase());
}

function getUsernameFromUser(user, displayName) {
  const baseName = displayName?.trim() || user.email?.split("@")[0] || "nexa";
  return baseName.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24) || `user${user.uid.slice(0, 6)}`;
}

export function getChatId(userA, userB) {
  return [userA, userB].sort().join("_");
}

export async function createUserProfile(user, displayName) {
  const emailLower = user.email.trim().toLowerCase();
  const username = getUsernameFromUser(user, displayName);
  const publicProfile = {
    uid: user.uid,
    email: user.email,
    emailLower,
    username,
    displayName,
    photoURL: ""
  };

  const batch = writeBatch(db);
  const userRef = doc(db, "users", user.uid);
  const publicRef = doc(db, "users", user.uid, "public", "profile");
  const privateRef = doc(db, "users", user.uid, "private", "profile");
  const emailSearchRef = doc(db, "userSearchEmails", normalizeLookup(emailLower));
  const usernameSearchRef = doc(db, "userSearchUsernames", normalizeLookup(username));

  batch.set(
    userRef,
    {
      uid: user.uid,
      createdAt: serverTimestamp()
    },
    { merge: true }
  );
  batch.set(publicRef, publicProfile, { merge: true });
  batch.set(
    privateRef,
    {
      email: user.email,
      blockedUsers: [],
      fcmToken: "",
      createdAt: serverTimestamp()
    },
    { merge: true }
  );
  batch.set(emailSearchRef, publicProfile, { merge: true });
  batch.set(usernameSearchRef, publicProfile, { merge: true });

  await batch.commit();
}

export async function ensureCurrentUserProfile(user) {
  if (!user) {
    return;
  }

  const publicRef = doc(db, "users", user.uid, "public", "profile");
  const snapshot = await getDoc(publicRef);

  if (!snapshot.exists()) {
    await createUserProfile(user, user.displayName || user.email?.split("@")[0] || "Nexa user");
  }
}

export function subscribeToContacts(currentUserId, callback, onError) {
  const contactsQuery = query(collection(db, "users", currentUserId, "contacts"), orderBy("displayName", "asc"));
  return onSnapshot(
    contactsQuery,
    (snapshot) => {
      const contacts = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));
      callback(contacts);
    },
    onError
  );
}

export async function searchUserByExactTerm(searchInput, currentUserId) {
  const term = searchInput.trim().toLowerCase();
  if (!term) {
    return null;
  }

  const searchCollections = term.includes("@")
    ? ["userSearchEmails"]
    : ["userSearchUsernames", "userSearchEmails"];

  for (const collectionName of searchCollections) {
    let snapshot;

    try {
      snapshot = await getDoc(doc(db, collectionName, normalizeLookup(term)));
    } catch (error) {
      if (error?.code === "permission-denied") {
        return null;
      }
      throw error;
    }

    if (snapshot.exists()) {
      const user = snapshot.data();
      if (user.uid === currentUserId) {
        return null;
      }

      return {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL || "",
        email: user.email,
        username: user.username
      };
    }
  }

  return null;
}

export async function addContact(currentUserId, contact) {
  await setDoc(
    doc(db, "users", currentUserId, "contacts", contact.uid),
    {
      uid: contact.uid,
      displayName: contact.displayName,
      photoURL: contact.photoURL || "",
      email: contact.email,
      username: contact.username || "",
      addedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function createOrOpenChat(currentUserId, contact) {
  const chatId = getChatId(currentUserId, contact.uid);

  await setDoc(
    doc(db, "chats", chatId),
    {
      members: [currentUserId, contact.uid],
      typing: {
        [currentUserId]: false,
        [contact.uid]: false
      },
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  await addContact(currentUserId, contact);

  return chatId;
}

export async function blockUser(currentUserId, blockedUserId) {
  await updateDoc(doc(db, "users", currentUserId, "private", "profile"), {
    blockedUsers: arrayUnion(blockedUserId)
  });
}

export async function unblockUser(currentUserId, blockedUserId) {
  await updateDoc(doc(db, "users", currentUserId, "private", "profile"), {
    blockedUsers: arrayRemove(blockedUserId)
  });
}

export function subscribeToUserChats(currentUserId, callback, onError) {
  const chatsQuery = query(
    collection(db, "chats"),
    where("members", "array-contains", currentUserId)
  );

  return onSnapshot(
    chatsQuery,
    (snapshot) => {
      const chats = snapshot.docs
        .map((item) => ({
          id: item.id,
          ...item.data()
        }))
        .sort((a, b) => {
          const first = a.updatedAt?.toMillis?.() || 0;
          const second = b.updatedAt?.toMillis?.() || 0;
          return second - first;
        });
      callback(chats);
    },
    onError
  );
}

export function subscribeToChat(chatId, callback, onError) {
  return onSnapshot(
    doc(db, "chats", chatId),
    (snapshot) => callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
    onError
  );
}

export function subscribeToPrivateProfile(userId, callback, onError) {
  return onSnapshot(
    doc(db, "users", userId, "private", "profile"),
    (snapshot) => callback(snapshot.exists() ? snapshot.data() : null),
    onError
  );
}

export function subscribeToMessages(chatId, callback, onError) {
  const messagesQuery = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));
      callback(messages);
    },
    onError
  );
}

export async function sendMessage({ senderId, receiverId, text, replyTo = null }) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return;
  }

  const chatId = getChatId(senderId, receiverId);
  const chatRef = doc(db, "chats", chatId);
  const message = {
    senderId,
    receiverId,
    text: trimmedText,
    timestamp: serverTimestamp(),
    readBy: [senderId],
    deliveredTo: [senderId],
    reactions: {},
    replyTo,
    edited: false,
    deleted: false,
    type: "text"
  };

  await setDoc(
    chatRef,
    {
      members: [senderId, receiverId],
      updatedAt: serverTimestamp(),
      lastMessage: trimmedText,
      typing: {
        [senderId]: false
      }
    },
    { merge: true }
  );

  await addDoc(collection(db, "chats", chatId, "messages"), message);
}

export async function setTypingStatus(chatId, userId, isTyping) {
  const chatSnapshot = await getDoc(doc(db, "chats", chatId));

  if (!chatSnapshot.exists()) {
    return;
  }

  await setDoc(
    doc(db, "chats", chatId),
    {
      typing: {
        [userId]: isTyping
      }
    },
    { merge: true }
  );
}

export async function markMessagesAsRead(chatId, currentUserId) {
  const messagesSnapshot = await getDocs(collection(db, "chats", chatId, "messages"));
  const batch = writeBatch(db);

  messagesSnapshot.docs.forEach((messageDoc) => {
    const message = messageDoc.data();
    const isIncoming = message.senderId !== currentUserId;
    const alreadyRead = message.readBy?.includes(currentUserId);

    if (isIncoming && !alreadyRead) {
      batch.update(messageDoc.ref, {
        readBy: arrayUnion(currentUserId),
        deliveredTo: arrayUnion(currentUserId)
      });
    }
  });

  await batch.commit();
}

export async function reactToMessage({ chatId, messageId, userId, emoji }) {
  await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
    [`reactions.${emoji}`]: arrayUnion(userId)
  });
}

export async function removeReactionFromMessage({ chatId, messageId, userId, emoji }) {
  await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
    [`reactions.${emoji}`]: arrayRemove(userId)
  });
}

export async function editMessage({ chatId, messageId, text }) {
  await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
    text: text.trim(),
    edited: true,
    updatedAt: serverTimestamp()
  });
}

export async function deleteMessage({ chatId, messageId }) {
  await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
    text: "",
    deleted: true,
    edited: false,
    updatedAt: serverTimestamp()
  });
}

export async function setUserPresence(userId, isOnline) {
  if (!userId) {
    return;
  }

  const batch = writeBatch(db);
  const presence = {
    isOnline,
    lastSeen: serverTimestamp()
  };

  batch.set(doc(db, "users", userId), presence, { merge: true });
  batch.set(doc(db, "users", userId, "public", "profile"), presence, { merge: true });

  await batch.commit();
}
