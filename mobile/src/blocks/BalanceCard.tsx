import { StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { useTheme } from "../theme/ThemeProvider";

export const balanceCardSchema = z.object({
  points: z
    .union([z.string().regex(/^\d+$/), z.number().int().nonnegative()])
    .transform(Number),
});

export function BalanceCard({ points }: z.infer<typeof balanceCardSchema>) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.primary }]}>
      <Text style={[styles.label, { color: theme.onPrimary }]}>Your points</Text>
      <Text style={[styles.points, { color: theme.onPrimary }]}>{points.toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { margin: 16, marginBottom: 0, padding: 20, borderRadius: 16 },
  label: { fontSize: 14, opacity: 0.85 },
  points: { fontSize: 40, fontWeight: "800", marginTop: 4 },
});