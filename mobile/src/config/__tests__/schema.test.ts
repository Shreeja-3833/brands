import { ConfigSchema } from "../schema";

describe("ConfigSchema brand fields", () => {
  it("parses the brand name and background colour", () => {
    const config = ConfigSchema.parse({ version: 1, name: "Brew Rewards", theme: { background: "#F4FBF8" } });

    expect(config.name).toBe("Brew Rewards");
    expect(config.theme.background).toBe("#F4FBF8");
  });

  it("drops an invalid background and an empty name instead of failing", () => {
    const config = ConfigSchema.parse({ version: 1, name: "", theme: { background: "beige", primary: "#123456" } });

    expect(config.name).toBeUndefined();
    expect(config.theme.background).toBeUndefined();
    expect(config.theme.primary).toBe("#123456");
  });

  it("leaves name optional for older configs", () => {
    expect(ConfigSchema.parse({ version: 1 }).name).toBeUndefined();
  });
});
