import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { BRAND, DEFAULT_CONFIG } from "./brand";
import { AppConfig, ConfigSchema, ConfigSource } from "./schema";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000");
const CACHE_KEY = `config:${BRAND.id}`;
const TIMEOUT_MS = 3000;

export type LoadedConfig = { config: AppConfig; source: ConfigSource };

async function fetchRemote(): Promise<AppConfig> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/config?brand=${BRAND.id}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ConfigSchema.parse(await res.json());
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
  try {
    const config = await fetchRemote();
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(config)).catch(() => {});
    return { config, source: "network" };
  } catch (e) {
    if (__DEV__) console.log("Config fetch failed, falling back:", String(e));
    const cached = await readCache();
    if (cached) return { config: cached, source: "cache" };
    return { config: ConfigSchema.parse(DEFAULT_CONFIG), source: "default" };
  }
}