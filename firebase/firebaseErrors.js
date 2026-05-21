export function getFirebaseErrorMessage(error) {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Email or password is incorrect.";
    case "auth/user-not-found":
      return "No account exists for this email. Create an account first.";
    case "auth/email-already-in-use":
      return "This email is already registered. Try logging in instead.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/configuration-not-found":
      return "Firebase Authentication is not fully enabled. Turn on Email/Password in Firebase Authentication.";
    case "permission-denied":
      return "Firestore permissions blocked this action. Create Firestore Database in test mode while developing.";
    case "unavailable":
      return "Firebase is temporarily unavailable. Check your internet connection and try again.";
    default:
      return error?.message || "Something went wrong. Please try again.";
  }
}
