import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../constants/theme";

export default function EmptyState({ icon = "chatbubbles-outline", title, message }) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={44} color={colors.accent} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl
  },
  title: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  message: {
    marginTop: spacing.xs,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 21
  }
});
