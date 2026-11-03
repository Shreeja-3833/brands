import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "./api";
import { BRAND, DEFAULT_CONFIG } from "./brand";
import { AppConfig, ConfigSchema, ConfigSource } from "./schema";

const CACHE_KEY = `config:${BRAND.id}`;
const ETAG_KEY = `${CACHE_KEY}:etag`;
const TIMEOUT_MS = 3000;

export type LoadedConfig = { config: AppConfig; source: ConfigSource };

// null means 304: the copy we already have is still current.
async function fetchRemote(etag: string | null): Promise<{ config: AppConfig; etag: string | null } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/config?brand=${BRAND.id}`, {
      signal: controller.signal,
      headers: etag ? { "If-None-Match": etag } : undefined,
    });
    if (res.status === 304) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { config: ConfigSchema.parse(await res.json()), etag: res.headers.get("ETag") };
  } finally {
    clearTimeout(timer);
  }
}

async function readCache(): Promise<AppConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? ConfigSchema.parse(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export async function loadConfig(): Promise<LoadedConfig> {
  const cached = await readCache();
  try {
    // Only send the ETag when we hold the matching body, so a 304 is always servable.
    const etag = cached ? await AsyncStorage.getItem(ETAG_KEY).catch(() => null) : null;
    const remote = await fetchRemote(etag);
    if (!remote) return { config: cached!, source: "network" };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(remote.config)).catch(() => {});
    if (remote.etag) await AsyncStorage.setItem(ETAG_KEY, remote.etag).catch(() => {});
    else await AsyncStorage.removeItem(ETAG_KEY).catch(() => {});
    return { config: remote.config, source: "network" };
  } catch (e) {
    if (__DEV__) console.log("Config fetch failed, falling back:", String(e));
    if (cached) return { config: cached, source: "cache" };
    return { config: ConfigSchema.parse(DEFAULT_CONFIG), source: "default" };
  }
}