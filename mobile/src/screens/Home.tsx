import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BRAND } from "../config/brand";
import { useConfig } from "../config/ConfigProvider";
import { useTheme } from "../theme/ThemeProvider";
import { BlockRenderer } from "../sdui/BlockRenderer";

export function Home() {
  const { config, source } = useConfig();
  const theme = useTheme();

  return (
    <ScrollView style={{ backgroundColor: theme.background }}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={[styles.title, { color: theme.onPrimary }]}>
          {BRAND.name}
        </Text>
      </View>
      {__DEV__ && (
        <Text style={styles.debug}>
          config v{config.version} · {source}
        </Text>
      )}
      <BlockRenderer
        key={config.version}
        blocks={config.home}
        flags={config.flags}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 64, paddingBottom: 20, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: "700" },
  debug: { fontSize: 12, opacity: 0.6, padding: 12, textAlign: "center" },
  raw: { fontFamily: "Courier", fontSize: 11, padding: 16 },
});
