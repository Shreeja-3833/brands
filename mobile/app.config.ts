import type { ConfigContext, ExpoConfig } from "expo/config";

const brandId = process.env.BRAND ?? "default";
const brand = require(`./brands/${brandId}/brand.json`);

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
  extra: { ...config.extra, brandId },
});
