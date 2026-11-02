import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { loadConfig, LoadedConfig } from "./loadConfig";

SplashScreen.preventAutoHideAsync().catch(() => {});

export const POLL_MS = 5_000;

const ConfigContext = createContext<LoadedConfig | null>(null);

const isSame = (a: LoadedConfig, b: LoadedConfig) =>
  a.source === b.source && JSON.stringify(a.config) === JSON.stringify(b.config);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState<LoadedConfig | null>(null);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    const refresh = () =>
      loadConfig().then((result) => {
        // Keep the previous object when nothing changed so polling doesn't re-render the tree.
        if (mounted) setLoaded((prev) => (prev && isSame(prev, result) ? prev : result));
      });
    const stopPolling = () => clearInterval(timer);
    const startPolling = () => {
      stopPolling();
      timer = setInterval(refresh, POLL_MS);
    };

    refresh().finally(() => SplashScreen.hideAsync().catch(() => {}));
    startPolling();

    // Poll only while foregrounded; refresh immediately on return.
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refresh();
        startPolling();
      } else {
        stopPolling();
      }
    });
    return () => {
      mounted = false;
      stopPolling();
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