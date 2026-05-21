import { Image, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../constants/theme";

export default function Avatar({ name = "Nexa", uri, online = false, size = 48 }) {
  const initial = name?.trim()?.[0]?.toUpperCase() || "N";

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? <Image source={{ uri }} style={[styles.image, { borderRadius: size / 2 }]} /> : <Text style={styles.initial}>{initial}</Text>}
      <View style={[styles.status, online ? styles.online : styles.offline]} />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  initial: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 18
  },
  status: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: 13,
    height: 13,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.background
  },
  online: {
    backgroundColor: colors.success
  },
  offline: {
    backgroundColor: colors.muted
  }
});
