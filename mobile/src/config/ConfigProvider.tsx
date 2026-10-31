import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { loadConfig, LoadedConfig } from "./loadConfig";

SplashScreen.preventAutoHideAsync().catch(() => {});

const ConfigContext = createContext<LoadedConfig | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState<LoadedConfig | null>(null);

  useEffect(() => {
    let mounted = true;
    const refresh = () =>
      loadConfig().then((result) => {
        if (mounted) setLoaded(result);
      });

    refresh().finally(() => SplashScreen.hideAsync().catch(() => {}));

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  if (!loaded) return null;
  return <ConfigContext.Provider value={loaded}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used inside ConfigProvider");
  return ctx;
}