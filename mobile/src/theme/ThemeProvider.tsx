import { createContext, ReactNode, useContext, useMemo } from "react";
import { BRAND } from "../config/brand";
import { useConfig } from "../config/ConfigProvider";

export type Theme = { primary: string; onPrimary: string; background: string };

const ThemeContext = createContext<Theme>(BRAND.colors);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { config } = useConfig();
  const theme = useMemo(() => {
    const overrides = Object.fromEntries(
      Object.entries(config.theme).filter(([, v]) => v !== undefined)
    );
    return { ...BRAND.colors, ...overrides } as Theme;
  }, [config.theme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);