import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Avatar from "./Avatar";
import { colors, radii, spacing } from "../constants/theme";

function formatPreviewTime(timestamp) {
  const date = timestamp?.toDate?.();
  if (!date) {
    return "";
  }

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function UserListItem({ user, onPress }) {
  const preview = user.lastMessage || (user.isOnline ? "Online now" : "Tap to start a conversation");
  const previewTime = formatPreviewTime(user.lastMessageAt);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Avatar name={user.displayName || user.email} uri={user.photoURL} online={user.isOnline} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{user.displayName || "Nexa user"}</Text>
          {previewTime ? <Text style={styles.time}>{previewTime}</Text> : null}
        </View>
        <Text style={[styles.caption, user.lastMessage && styles.messagePreview]} numberOfLines={1}>{preview}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 72,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  pressed: {
    opacity: 0.82
  },
  content: {
    flex: 1
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  time: {
    color: colors.muted,
    fontSize: 11
  },
  caption: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 13
  },
  messagePreview: {
    color: "#c6d5ec"
  }
});
