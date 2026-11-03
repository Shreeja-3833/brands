// Proves identity no longer depends on src/generated/brand.json: it is `{}` here.
jest.mock("../../generated/brand.json", () => ({}), { virtual: true });

const loadBrand = (expoConfig: unknown) => {
  jest.resetModules();
  jest.doMock("expo-constants", () => ({ __esModule: true, default: { expoConfig } }));
  return require("../brand") as typeof import("../brand");
};

const bloomDefault = require("../../../brands/b/default-config.json");

describe("brand identity", () => {
  it("takes the id, name and default config from the build's expo config", () => {
    const { BRAND, DEFAULT_CONFIG } = loadBrand({
      name: "Bloom Club",
      extra: { brandId: "b", defaultConfig: bloomDefault },
    });

    expect(BRAND).toEqual({ id: "b", name: "Bloom Club" });
    expect(DEFAULT_CONFIG).toEqual(bloomDefault);
  });

  it("uses the default brand and an empty layout when the build sets nothing", () => {
    const { BRAND, DEFAULT_CONFIG } = loadBrand({ name: "mobile" });

    expect(BRAND.id).toBe("default");
    expect(DEFAULT_CONFIG).toEqual({ version: 0, home: [] });
  });

  it("copes with no expo config at all", () => {
    const { BRAND, DEFAULT_CONFIG } = loadBrand(undefined);

    expect(BRAND).toEqual({ id: "default", name: "" });
    expect(DEFAULT_CONFIG).toEqual({ version: 0, home: [] });
  });
});
