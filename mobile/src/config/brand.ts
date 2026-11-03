import Constants from "expo-constants";

// Identity no longer comes from src/generated/brand.json. app.config.ts bakes the id and this
// brand's offline default config into the build (`extra`); name and colours come from the server.
const expoConfig = Constants.expoConfig;
const brandId: string = expoConfig?.extra?.brandId ?? "default";

export const BRAND = {
  id: brandId,
  // Native app name from the build; only shown when no config supplies a name.
  name: expoConfig?.name ?? "",
};

// Last resort if the build carries no default: an empty layout with fallback name and colours.
export const DEFAULT_CONFIG: unknown = expoConfig?.extra?.defaultConfig ?? { version: 0, home: [] };
