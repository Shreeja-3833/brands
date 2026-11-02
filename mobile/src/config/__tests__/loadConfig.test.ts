import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadConfig } from "../loadConfig";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// brand.ts reads from src/generated, which only exists after `npm run brand`.
jest.mock("../brand", () => ({
  BRAND: { id: "test" },
  DEFAULT_CONFIG: { version: 0, home: [] },
}));

const remote = { version: 7, theme: {}, flags: { showRewards: true }, home: [] };
const mockFetch = jest.fn();
const ok = (body: unknown, etag: string | null = null) => ({
  ok: true,
  status: 200,
  headers: { get: (name: string) => (name === "ETag" ? etag : null) },
  json: async () => body,
});
const notModified = { ok: false, status: 304, headers: { get: () => null } };

beforeEach(async () => {
  await AsyncStorage.clear();
  mockFetch.mockReset();
  globalThis.fetch = mockFetch;
});

describe("loadConfig", () => {
  it("returns the network config and caches it", async () => {
    mockFetch.mockResolvedValue(ok(remote));

    const result = await loadConfig();

    expect(result).toEqual({ config: remote, source: "network" });
    expect(JSON.parse((await AsyncStorage.getItem("config:test"))!)).toEqual(remote);
  });

  it("falls back to the cached config when the network fails", async () => {
    await AsyncStorage.setItem("config:test", JSON.stringify(remote));
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const result = await loadConfig();

    expect(result).toEqual({ config: remote, source: "cache" });
  });

  it("falls back to the bundled default when there is no cache", async () => {
    mockFetch.mockRejectedValue(new Error("offline"));

    const result = await loadConfig();

    expect(result.source).toBe("default");
    expect(result.config.version).toBe(0);
  });

  it("stores the ETag and sends it on the next request", async () => {
    mockFetch.mockResolvedValue(ok(remote, '"abc"'));
    await loadConfig();

    await loadConfig();

    expect(mockFetch.mock.calls[1][1].headers).toEqual({ "If-None-Match": '"abc"' });
  });

  it("serves the cached config as fresh on 304 Not Modified", async () => {
    mockFetch.mockResolvedValueOnce(ok(remote, '"abc"')).mockResolvedValueOnce(notModified);
    await loadConfig();

    const result = await loadConfig();

    expect(result).toEqual({ config: remote, source: "network" });
  });

  it("does not send an ETag when there is no cached body to back it", async () => {
    await AsyncStorage.setItem("config:test:etag", '"abc"');
    mockFetch.mockResolvedValue(ok(remote));

    await loadConfig();

    expect(mockFetch.mock.calls[0][1].headers).toBeUndefined();
  });
});
