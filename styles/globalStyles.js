import { StyleSheet } from "react-native";
import { colors, spacing } from "../constants/theme";

export const globalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md
  },
  center: {
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19
  }
});
