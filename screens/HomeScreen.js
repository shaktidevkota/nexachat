import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { signOut } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import AppTextInput from "../components/AppTextInput";
import EmptyState from "../components/EmptyState";
import UserListItem from "../components/UserListItem";
import Avatar from "../components/Avatar";
import { auth } from "../firebase/config";
import {
  createOrOpenChat,
  searchUserByExactTerm,
  setUserPresence,
  subscribeToContacts,
  subscribeToUserChats
} from "../firebase/chatService";
import { getFirebaseErrorMessage } from "../firebase/firebaseErrors";
import { colors, spacing } from "../constants/theme";
import { globalStyles } from "../styles/globalStyles";

export default function HomeScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState("");
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser?.uid) {
      return undefined;
    }

    const unsubscribe = subscribeToContacts(
      currentUser.uid,
      (nextContacts) => {
        setUsers(nextContacts);
        setError("");
        setLoading(false);
      },
      (snapshotError) => {
        setError(getFirebaseErrorMessage(snapshotError));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid) {
      return undefined;
    }

    return subscribeToUserChats(
      currentUser.uid,
      setChats,
      (snapshotError) => setError(getFirebaseErrorMessage(snapshotError))
    );
  }, [currentUser?.uid]);

  const visibleUsers = useMemo(() => {
    const chatByUserId = chats.reduce((nextChats, chat) => {
      const otherUserId = chat.members?.find((participant) => participant !== currentUser?.uid);
      if (otherUserId) {
        nextChats[otherUserId] = chat;
      }
      return nextChats;
    }, {});

    const usersWithChats = users.map((user) => {
      const chat = chatByUserId[user.uid];
      return {
        ...user,
        lastMessage: chat?.lastMessage || "",
        lastMessageAt: chat?.updatedAt || null,
        hasChat: Boolean(chat)
      };
    });

    const sortedUsers = usersWithChats.sort((a, b) => {
      const first = a.lastMessageAt?.toMillis?.() || 0;
      const second = b.lastMessageAt?.toMillis?.() || 0;
      if (first !== second) {
        return second - first;
      }
      return (a.displayName || a.email || "").localeCompare(b.displayName || b.email || "");
    });

    if (search.trim()) {
      if (!searchResult) {
        return [];
      }

      const existingContact = sortedUsers.find((user) => user.uid === searchResult.uid);
      const resultUser = existingContact || searchResult;
      const chat = chatByUserId[resultUser.uid];
      return [
        {
          ...resultUser,
          lastMessage: chat?.lastMessage || "",
          lastMessageAt: chat?.updatedAt || null,
          hasChat: Boolean(chat)
        }
      ];
    }

    return sortedUsers;
  }, [chats, currentUser?.uid, search, searchResult, users]);

  async function handleSearch() {
    const term = search.trim();

    setSearchResult(null);
    setSearchMessage("");

    if (!term) {
      return;
    }

    try {
      setSearching(true);
      const result = await searchUserByExactTerm(term, currentUser.uid);

      if (!result) {
        setSearchMessage("No user found. Enter the exact email or username.");
        return;
      }

      setSearchResult(result);
    } catch (searchError) {
      setSearchMessage(getFirebaseErrorMessage(searchError));
    } finally {
      setSearching(false);
    }
  }

  function handleSearchChange(nextSearch) {
    setSearch(nextSearch);
    setSearchResult(null);
    setSearchMessage("");
  }

  async function handleOpenChat(user) {
    try {
      await createOrOpenChat(currentUser.uid, user);
      navigation.navigate("Chat", { user });
    } catch (contactError) {
      setError(getFirebaseErrorMessage(contactError));
    }
  }

  async function handleLogout() {
    await setUserPresence(currentUser?.uid, false);
    await signOut(auth);
  }

  return (
    <View style={[globalStyles.screen, styles.container]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>NexaChat</Text>
          <Text style={styles.heading}>Messages</Text>
        </View>
        <Avatar name={currentUser?.displayName || currentUser?.email} online />
      </View>

      <View style={styles.searchRow}>
        <AppTextInput
          icon="search-outline"
          placeholder="Exact email or username"
          value={search}
          onChangeText={handleSearchChange}
          onSubmitEditing={handleSearch}
          style={styles.searchInput}
        />
        <Pressable onPress={handleSearch} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          {searching ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Ionicons name="search" size={21} color={colors.text} />
          )}
        </Pressable>
        <Pressable onPress={handleLogout} style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}>
          <Ionicons name="log-out-outline" size={21} color={colors.text} />
        </Pressable>
      </View>

      {loading ? (
        <View style={globalStyles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : error ? (
        <EmptyState icon="alert-circle-outline" title="Firebase needs one more step" message={error} />
      ) : (
        <FlatList
          data={visibleUsers}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <UserListItem user={item} onPress={() => handleOpenChat(item)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title={search ? "Search only" : "No contacts yet"}
              message={search ? searchMessage || "Enter an exact email or username, then tap search." : "Search for someone by exact email or username to add a private contact."}
            />
          }
          contentContainerStyle={visibleUsers.length ? styles.list : styles.emptyList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footerNote}>
        <Ionicons name="radio-outline" size={16} color={colors.success} />
        <Text style={styles.footerText}>Private contacts only. Search requires an exact match.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 58
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  heading: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "900"
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  searchInput: {
    flex: 1
  },
  logoutButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center"
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border
  },
  pressed: {
    opacity: 0.82
  },
  list: {
    paddingBottom: 86
  },
  emptyList: {
    flexGrow: 1
  },
  footerNote: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.sm
  },
  footerText: {
    color: colors.muted,
    fontSize: 12
  }
});
