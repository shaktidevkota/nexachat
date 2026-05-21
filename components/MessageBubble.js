import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "../constants/theme";

function formatTime(timestamp) {
  const date = timestamp?.toDate ? timestamp.toDate() : null;
  if (!date) {
    return "Now";
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getStatusIcon(message, receiverId) {
  if (message.readBy?.includes(receiverId)) {
    return { name: "checkmark-done", color: "#8fc5ff" };
  }

  if (message.deliveredTo?.includes(receiverId)) {
    return { name: "checkmark-done", color: "#cfe0ff" };
  }

  return { name: "checkmark", color: "#cfe0ff" };
}

function getReactionSummary(reactions = {}) {
  return Object.entries(reactions)
    .filter(([, users]) => users?.length)
    .map(([emoji, users]) => `${emoji} ${users.length}`)
    .join("  ");
}

export default function MessageBubble({ message, mine, receiverId, onLongPress }) {
  const statusIcon = getStatusIcon(message, receiverId);
  const reactionSummary = getReactionSummary(message.reactions);

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      <Pressable onLongPress={() => onLongPress?.(message)} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        {message.replyTo ? (
          <View style={styles.replyBox}>
            <Text style={styles.replySender} numberOfLines={1}>{message.replyTo.senderName}</Text>
            <Text style={styles.replyText} numberOfLines={2}>{message.replyTo.text}</Text>
          </View>
        ) : null}

        <Text style={[styles.text, message.deleted && styles.deletedText]}>
          {message.deleted ? "This message was deleted" : message.text}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.time}>{formatTime(message.timestamp)}</Text>
          {message.edited && !message.deleted ? <Text style={styles.edited}>edited</Text> : null}
          {mine ? <Ionicons name={statusIcon.name} size={14} color={statusIcon.color} /> : null}
        </View>
        {reactionSummary ? <Text style={styles.reactions}>{reactionSummary}</Text> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginVertical: 4,
    flexDirection: "row"
  },
  rowMine: {
    justifyContent: "flex-end"
  },
  rowTheirs: {
    justifyContent: "flex-start"
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  mine: {
    backgroundColor: colors.bubbleMine,
    borderBottomRightRadius: 6
  },
  theirs: {
    backgroundColor: colors.bubbleTheirs,
    borderBottomLeftRadius: 6
  },
  text: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21
  },
  deletedText: {
    color: colors.muted,
    fontStyle: "italic"
  },
  replyBox: {
    borderLeftWidth: 3,
    borderLeftColor: "#cfe0ff",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs
  },
  replySender: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 12
  },
  replyText: {
    color: "#d5e2f4",
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16
  },
  meta: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4
  },
  time: {
    color: "#c7d4e8",
    fontSize: 11
  },
  edited: {
    color: "#c7d4e8",
    fontSize: 11
  },
  reactions: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    color: colors.text,
    backgroundColor: "rgba(7, 17, 31, 0.38)",
    borderRadius: radii.pill,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    fontSize: 12
  }
});
