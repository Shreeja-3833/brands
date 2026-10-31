import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

export const bannerSchema = z.object({
  title: z.string().min(1),
  imageUrl: z.string().url().optional(),
});

export function Banner({ title, imageUrl }: z.infer<typeof bannerSchema>) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <View style={styles.card}>
      {imageUrl && !imageFailed && (
        <Image source={{ uri: imageUrl }} style={styles.image} onError={() => setImageFailed(true)} />
      )}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { margin: 16, marginBottom: 0, borderRadius: 16, backgroundColor: "#FFFFFF", overflow: "hidden" },
  image: { width: "100%", height: 140 },
  title: { fontSize: 18, fontWeight: "700", padding: 16, color: "#111111" },
});