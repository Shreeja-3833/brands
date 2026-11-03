import { Platform } from "react-native";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000");

// Set in mobile/.env.local (gitignored). EXPO_PUBLIC_ values are inlined into the bundle,
// so this gates the mock server only; it is not a real secret on a shipped app.
export const IMAGE_KEY = process.env.EXPO_PUBLIC_IMAGE_KEY;
