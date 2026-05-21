import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import AppButton from "../components/AppButton";
import AppTextInput from "../components/AppTextInput";
import { auth, isFirebaseConfigured } from "../firebase/config";
import { getFirebaseErrorMessage } from "../firebase/firebaseErrors";
import { colors, spacing } from "../constants/theme";
import { globalStyles } from "../styles/globalStyles";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!isFirebaseConfigured) {
      Alert.alert("Add Firebase config", "Paste your Firebase web app values into firebase/config.js before logging in.");
      return;
    }

    if (!email || !password) {
      Alert.alert("Missing details", "Enter your email and password to continue.");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      Alert.alert("Login failed", getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[globalStyles.screen, styles.container]}
    >
      <View style={styles.brandMark}>
        <Text style={styles.brandLetter}>N</Text>
      </View>
      <Text style={globalStyles.title}>Welcome to NexaChat</Text>
      <Text style={[globalStyles.subtitle, styles.subtitle]}>
        Sign in to continue your conversations in a fast, focused messaging space.
      </Text>

      <View style={styles.form}>
        <AppTextInput icon="mail-outline" placeholder="Email address" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <AppTextInput icon="lock-closed-outline" placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <AppButton title="Log in" icon="log-in-outline" loading={loading} onPress={handleLogin} />
      </View>

      <AppButton title="Create an account" variant="ghost" onPress={() => navigation.navigate("Signup")} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center"
  },
  brandMark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg
  },
  brandLetter: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900"
  },
  subtitle: {
    marginTop: spacing.sm
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.xl
  }
});
