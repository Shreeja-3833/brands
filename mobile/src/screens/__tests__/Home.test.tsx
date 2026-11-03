import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { ConfigSchema } from "../../config/schema";
import { FALLBACK_THEME, ThemeProvider } from "../../theme/ThemeProvider";
import { Home } from "../Home";

// Identity comes from the build (expo config), never from src/generated/brand.json.
jest.mock("../../config/brand", () => ({
  BRAND: { id: "a", name: "Build Name" },
  DEFAULT_CONFIG: { version: 0, home: [] },
}));
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

const mockUseConfig = jest.fn();
jest.mock("../../config/ConfigProvider", () => ({ useConfig: () => mockUseConfig() }));

const renderWith = (raw: unknown) => {
  mockUseConfig.mockReturnValue({ config: ConfigSchema.parse(raw), source: "network" });
  return render(
    <ThemeProvider>
      <Home />
    </ThemeProvider>
  );
};

// Background of the nearest ancestor that sets one, i.e. the header bar behind the title.
const headerColor = (name: string) => {
  for (let node = screen.getByText(name).parent; node; node = node.parent) {
    const bg = StyleSheet.flatten(node.props.style)?.backgroundColor;
    if (bg) return bg;
  }
};

describe("Home brand identity", () => {
  it("renders the server's name, colours and layout", async () => {
    await renderWith({
      version: 4,
      name: "Brew Rewards",
      theme: { primary: "#00AA78", onPrimary: "#FFFFFF", background: "#F4FBF8" },
      home: [{ id: "h2", type: "banner", props: { title: "Double points weekends" } }],
    });

    expect(screen.getByText("Brew Rewards")).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByText("Brew Rewards").props.style).color).toBe("#FFFFFF");
    expect(headerColor("Brew Rewards")).toBe("#00AA78");
    expect(screen.getByText("Double points weekends")).toBeTruthy();
  });

  it("falls back to the build name and neutral colours when the config has none", async () => {
    await renderWith({ version: 0 });

    expect(screen.getByText("Build Name")).toBeTruthy();
    expect(headerColor("Build Name")).toBe(FALLBACK_THEME.primary);
  });
});
