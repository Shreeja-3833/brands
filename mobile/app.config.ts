import type { ConfigContext, ExpoConfig } from "expo/config";

const brandId = process.env.BRAND ?? "default";
const brand = require(`./brands/${brandId}/brand.json`);
// Only this brand's offline fallback is built into the app, via `extra.defaultConfig`.
const defaultConfig = require(`./brands/${brandId}/default-config.json`);
if (typeof defaultConfig?.version !== "number" || !Array.isArray(defaultConfig.home)) {
  throw new Error(`brands/${brandId}/default-config.json needs a numeric "version" and a "home" array`);
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: brand.name,
  slug: brand.slug,
  scheme: brand.slug,
  icon: brand.icon,
  ios: { ...config.ios, bundleIdentifier: brand.bundleId },
  android: {
    ...config.android,
    package: brand.bundleId,
    adaptiveIcon: {
      foregroundImage: brand.icon,
      backgroundColor: brand.colors.primary,
    },
  },
  extra: { ...config.extra, brandId, defaultConfig },
});
