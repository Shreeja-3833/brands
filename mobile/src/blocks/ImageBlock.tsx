import { useState } from "react";
import { ActivityIndicator, Image, ImageURISource, StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { API_URL, IMAGE_KEY } from "../config/api";

export const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string().default(""),
  aspectRatio: z.number().positive().max(10).default(16 / 9),
});

const originOf = (url: string) => url.match(/^https?:\/\/[^/?#]+/i)?.[0].toLowerCase();

// Only our own server gets the key, so a config pointing at a third-party host can't harvest it.
export function imageSource(url: string, apiUrl = API_URL, key = IMAGE_KEY): ImageURISource {
  const ownServer = key && originOf(url) !== undefined && originOf(url) === originOf(apiUrl);
  return ownServer ? { uri: url, headers: { "X-Image-Key": key } } : { uri: url };
}

type Status = "loading" | "loaded" | "failed";

export function ImageBlock({ url, alt, aspectRatio }: z.infer<typeof imageSchema>) {
  const [status, setStatus] = useState<Status>("loading");
  return (
    <View style={[styles.card, { aspectRatio }]} accessible accessibilityRole="image" accessibilityLabel={alt}>
      {status !== "failed" && (
        <Image
          testID="image-content"
          source={imageSource(url)}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("failed")}
        />
      )}
      {status === "loading" && (
        <View testID="image-placeholder" style={[StyleSheet.absoluteFill, styles.center]}>
          <ActivityIndicator color="#888888" />
        </View>
      )}
      {status === "failed" && (
        <View testID="image-fallback" style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={styles.fallbackText} numberOfLines={3}>
            {alt || "Image unavailable"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { margin: 16, marginBottom: 0, borderRadius: 16, backgroundColor: "#E9E9EC", overflow: "hidden" },
  center: { alignItems: "center", justifyContent: "center", padding: 16 },
  fallbackText: { fontSize: 14, color: "#555555", textAlign: "center" },
});
