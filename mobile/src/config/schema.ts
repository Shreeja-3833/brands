
import { z } from "zod";

const Hex = z
  .string()
  .regex(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i)
  .optional()
  .catch(undefined);

export const ConfigSchema = z.object({
  version: z.number(),
  theme: z.object({ primary: Hex, onPrimary: Hex }).default({}),
  flags: z.record(z.string(), z.boolean()).default({}),
  home: z.array(z.unknown()).default([]),
});

export type AppConfig = z.infer<typeof ConfigSchema>;
export type ConfigSource = "network" | "cache" | "default";