import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import EmptyState from "../components/EmptyState";
import MessageBubble from "../components/MessageBubble";
import Avatar from "../components/Avatar";
import AppTextInput from "../components/AppTextInput";
import { auth } from "../firebase/config";
import {
  deleteMessage,
  editMessage,
  getChatId,
  markMessagesAsRead,
  reactToMessage,
  sendMessage,
  setTypingStatus,
  blockUser,
  subscribeToChat,
  subscribeToMessages,
  subscribeToPrivateProfile,
  unblockUser
} from "../firebase/chatService";
import { getFirebaseErrorMessage } from "../firebase/firebaseErrors";
import { colors, radii, spacing } from "../constants/theme";

export default function ChatScreen({ route }) {
  const { user } = route.params;
  const currentUser = auth.currentUser;
  const chatId = getChatId(currentUser.uid, user.uid);
  const listRef = useRef(null);
  const typingTimerRef = useRef(null);
  const readTimerRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [chat, setChat] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [privateProfile, setPrivateProfile] = useState(null);

  const otherUserTyping = useMemo(() => Boolean(chat?.typing?.[user.uid]), [chat?.typing, user.uid]);
  const isBlocked = privateProfile?.blockedUsers?.includes(user.uid);

  useEffect(() => {
    const unsubscribePrivateProfile = subscribeToPrivateProfile(
      currentUser.uid,
      setPrivateProfile,
      (snapshotError) => setError(getFirebaseErrorMessage(snapshotError))
    );

    const unsubscribeChat = subscribeToChat(
      chatId,
      setChat,
      (snapshotError) => setError(getFirebaseErrorMessage(snapshotError))
    );

    const unsubscribe = subscribeToMessages(
      chatId,
      (nextMessages) => {
        setMessages(nextMessages);
        setError("");
        setLoading(false);
      },
      (snapshotError) => {
        setError(getFirebaseErrorMessage(snapshotError));
        setLoading(false);
      }
    );

    return () => {
      unsubscribePrivateProfile();
      unsubscribeChat();
      unsubscribe();
      setTypingStatus(chatId, currentUser.uid, false).catch(() => {});
    };
  }, [chatId]);

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
    }

    if (readTimerRef.current) {
      clearTimeout(readTimerRef.current);
    }

    readTimerRef.current = setTimeout(() => {
      markMessagesAsRead(chatId, currentUser.uid).catch(() => {});
    }, 350);
  }, [messages.length]);

  function handleTextChange(nextText) {
    setText(nextText);

    if (!nextText.trim()) {
      setTypingStatus(chatId, currentUser.uid, false).catch(() => {});
      return;
    }

    setTypingStatus(chatId, currentUser.uid, true).catch(() => {});

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      setTypingStatus(chatId, currentUser.uid, false).catch(() => {});
    }, 1400);
  }

  async function handleSend() {
    if (!text.trim() || sending || isBlocked) {
      return;
    }

    try {
      setSending(true);
      if (editingMessage) {
        await editMessage({ chatId, messageId: editingMessage.id, text });
        setEditingMessage(null);
      } else {
        await sendMessage({
          senderId: currentUser.uid,
          receiverId: user.uid,
          text,
          replyTo
        });
        setReplyTo(null);
      }
      handleTextChange("");
      await setTypingStatus(chatId, currentUser.uid, false);
    } catch (sendError) {
      Alert.alert("Message not sent", getFirebaseErrorMessage(sendError));
    } finally {
      setSending(false);
    }
  }

  async function handleBlockToggle() {
    try {
      if (isBlocked) {
        await unblockUser(currentUser.uid, user.uid);
        return;
      }

      await blockUser(currentUser.uid, user.uid);
      await setTypingStatus(chatId, currentUser.uid, false);
    } catch (blockError) {
      Alert.alert("Privacy update failed", getFirebaseErrorMessage(blockError));
    }
  }

  function startReply(message) {
    if (message.deleted) {
      return;
    }

    setEditingMessage(null);
    setReplyTo({
      messageId: message.id,
      text: message.text,
      senderName: message.senderId === currentUser.uid ? "You" : user.displayName || user.email
    });
  }

  function startEdit(message) {
    if (!message.deleted && message.senderId === currentUser.uid) {
      setReplyTo(null);
      setEditingMessage(message);
      handleTextChange(message.text);
    }
  }

  async function addReaction(message, emoji) {
    try {
      await reactToMessage({ chatId, messageId: message.id, userId: currentUser.uid, emoji });
    } catch (reactionError) {
      Alert.alert("Reaction failed", getFirebaseErrorMessage(reactionError));
    }
  }

  function handleMessageActions(message) {
    const actions = [
      { text: "Reply", onPress: () => startReply(message) },
      { text: "React ❤️", onPress: () => addReaction(message, "❤️") },
      { text: "React 👍", onPress: () => addReaction(message, "👍") },
      { text: "React 😂", onPress: () => addReaction(message, "😂") }
    ];

    if (message.senderId === currentUser.uid && !message.deleted) {
      actions.push({ text: "Edit", onPress: () => startEdit(message) });
      actions.push({
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMessage({ chatId, messageId: message.id }).catch((deleteError) => {
          Alert.alert("Delete failed", getFirebaseErrorMessage(deleteError));
        })
      });
    }

    actions.push({ text: "Cancel", style: "cancel" });
    Alert.alert("Message options", "Choose an action for this message.", actions);
  }

  function clearComposerContext() {
    setReplyTo(null);
    setEditingMessage(null);
    handleTextChange("");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
      style={styles.container}
    >
      <View style={styles.profileStrip}>
        <Avatar name={user.displayName || user.email} uri={user.photoURL} online={user.isOnline} size={42} />
        <View style={styles.profileText}>
          <Text style={styles.name} numberOfLines={1}>{user.displayName || "Nexa user"}</Text>
          <Text style={styles.status}>{isBlocked ? "Blocked" : user.isOnline ? "Online" : "Offline"}</Text>
        </View>
        <Pressable onPress={handleBlockToggle} style={styles.blockButton}>
          <Ionicons name={isBlocked ? "lock-open-outline" : "ban-outline"} size={19} color={isBlocked ? colors.success : colors.muted} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : error ? (
        <EmptyState icon="alert-circle-outline" title="Chat unavailable" message={error} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              mine={item.senderId === currentUser.uid}
              receiverId={user.uid}
              onLongPress={handleMessageActions}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title="No messages yet"
              message="Send the first message and Firestore will keep this chat live."
            />
          }
          contentContainerStyle={messages.length ? styles.messages : styles.emptyMessages}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <View style={styles.typingHint}>
        {otherUserTyping ? <Text style={styles.typingText}>{user.displayName || "User"} is typing...</Text> : null}
      </View>

      {replyTo || editingMessage ? (
        <View style={styles.contextBar}>
          <View style={styles.contextTextWrap}>
            <Text style={styles.contextLabel}>{editingMessage ? "Editing message" : `Replying to ${replyTo.senderName}`}</Text>
            <Text style={styles.contextText} numberOfLines={1}>{editingMessage?.text || replyTo?.text}</Text>
          </View>
          <Pressable onPress={clearComposerContext} style={styles.contextClose}>
            <Ionicons name="close" size={18} color={colors.text} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.composer}>
        <AppTextInput
          icon="chatbubble-ellipses-outline"
          placeholder={editingMessage ? "Edit message" : "Message"}
          value={text}
          onChangeText={handleTextChange}
          style={styles.messageInput}
          multiline
          editable={!isBlocked}
        />
        <Pressable onPress={handleSend} disabled={sending || !text.trim() || isBlocked} style={styles.sendButton}>
          {sending ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Ionicons name="send" size={20} color={colors.text} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  profileStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  profileText: {
    flex: 1
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  status: {
    color: colors.muted,
    marginTop: 2,
    fontSize: 12
  },
  blockButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  messages: {
    padding: spacing.md,
    paddingBottom: spacing.lg
  },
  emptyMessages: {
    flexGrow: 1
  },
  typingHint: {
    minHeight: 24,
    paddingHorizontal: spacing.md
  },
  typingText: {
    color: colors.muted,
    fontSize: 12
  },
  contextBar: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm
  },
  contextTextWrap: {
    flex: 1
  },
  contextLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800"
  },
  contextText: {
    color: colors.muted,
    marginTop: 2,
    fontSize: 12
  },
  contextClose: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center"
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background
  },
  messageInput: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center"
  }
});
