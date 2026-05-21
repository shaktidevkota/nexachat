import { ActivityIndicator, Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "../constants/theme";

export default function AppButton({ title, icon, loading, onPress, variant = "primary" }) {
  const isGhost = variant === "ghost";

  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isGhost && styles.ghost,
        pressed && styles.pressed,
        loading && styles.disabled
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={isGhost ? colors.accent : colors.text} /> : null}
          <Text style={[styles.text, isGhost && styles.ghostText]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md
  },
  ghost: {
    backgroundColor: "transparent"
  },
  pressed: {
    opacity: 0.86
  },
  disabled: {
    opacity: 0.7
  },
  text: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  ghostText: {
    color: colors.accent
  }
});
