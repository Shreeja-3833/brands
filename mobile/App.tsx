import { StatusBar } from "expo-status-bar";
import { ConfigProvider } from "./src/config/ConfigProvider";
import { ThemeProvider } from "./src/theme/ThemeProvider";
import { Home } from "./src/screens/Home";

export default function App() {
  return (
    <ConfigProvider>
      <ThemeProvider>
        <StatusBar style="light" />
        <Home />
      </ThemeProvider>
    </ConfigProvider>
  );
}