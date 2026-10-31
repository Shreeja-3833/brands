import { StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { BRAND } from "../config/brand";
import { useTheme } from "../theme/ThemeProvider";

export const rewardListSchema = z.object({
  limit: z.number().int().min(1).max(20),
});

// Fixture data: the brief only defines `limit`, so rewards are local rather than another endpoint.
const REWARDS: Record<string, { id: string; name: string; cost: number }[]> = {
  a: [
    { id: "r1", name: "Free espresso", cost: 150 },
    { id: "r2", name: "Any pastry", cost: 250 },
    { id: "r3", name: "Any large drink", cost: 300 },
    { id: "r4", name: "Bag of beans", cost: 100 },
  ],
  b: [
    { id: "r1", name: "Single stem", cost: 100 },
    { id: "r2", name: "Mini bouquet", cost: 300 },
    { id: "r3", name: "Free delivery", cost: 500 },
    { id: "r4", name: "Seasonal bouquet", cost: 600 },
  ],
};

export function RewardList({ limit }: z.infer<typeof rewardListSchema>) {
  const theme = useTheme();
  const rewards = (REWARDS[BRAND.id] ?? []).slice(0, limit);
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Rewards</Text>
      {rewards.map((r) => (
        <View key={r.id} style={styles.row}>
          <Text style={styles.name}>{r.name}</Text>
          <Text style={[styles.cost, { color: theme.primary }]}>{r.cost} pts</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { margin: 16, marginBottom: 0, padding: 16, borderRadius: 16, backgroundColor: "#FFFFFF" },
  heading: { fontSize: 18, fontWeight: "700", marginBottom: 8, color: "#111111" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  name: { fontSize: 16, color: "#111111" },
  cost: { fontSize: 16, fontWeight: "600" },
});