import { createContext, ReactNode, useContext, useMemo } from "react";
import { useConfig } from "../config/ConfigProvider";

export type Theme = { primary: string; onPrimary: string; background: string };

// Neutral base for any colour the config (server → cache → bundled default) doesn't set.
export const FALLBACK_THEME: Theme = { primary: "#333333", onPrimary: "#FFFFFF", background: "#F5F5F5" };

const ThemeContext = createContext<Theme>(FALLBACK_THEME);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { config } = useConfig();
  const theme = useMemo(() => {
    const overrides = Object.fromEntries(
      Object.entries(config.theme).filter(([, v]) => v !== undefined)
    );
    return { ...FALLBACK_THEME, ...overrides } as Theme;
  }, [config.theme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);