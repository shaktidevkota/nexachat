import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import AppButton from "../components/AppButton";
import AppTextInput from "../components/AppTextInput";
import { auth, isFirebaseConfigured } from "../firebase/config";
import { createUserProfile } from "../firebase/chatService";
import { getFirebaseErrorMessage } from "../firebase/firebaseErrors";
import { spacing } from "../constants/theme";
import { globalStyles } from "../styles/globalStyles";

export default function SignupScreen({ navigation }) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!isFirebaseConfigured) {
      Alert.alert("Add Firebase config", "Paste your Firebase web app values into firebase/config.js before creating an account.");
      return;
    }

    if (!displayName || !email || password.length < 6) {
      Alert.alert("Check your details", "Add a name, email, and password with at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: displayName.trim() });
      await createUserProfile(credential.user, displayName.trim());
    } catch (error) {
      Alert.alert("Signup failed", getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[globalStyles.screen, styles.container]}
    >
      <Text style={globalStyles.title}>Create your profile</Text>
      <Text style={[globalStyles.subtitle, styles.subtitle]}>
        NexaChat keeps your setup simple: email auth, a profile name, and real-time messaging.
      </Text>

      <View style={styles.form}>
        <AppTextInput icon="person-outline" placeholder="Display name" value={displayName} onChangeText={setDisplayName} />
        <AppTextInput icon="mail-outline" placeholder="Email address" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <AppTextInput icon="lock-closed-outline" placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <AppButton title="Sign up" icon="person-add-outline" loading={loading} onPress={handleSignup} />
      </View>

      <AppButton title="Already have an account?" variant="ghost" onPress={() => navigation.goBack()} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center"
  },
  subtitle: {
    marginTop: spacing.sm
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.xl
  }
});
