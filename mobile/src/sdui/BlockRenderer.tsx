import { ComponentType, useMemo } from "react";
import { z } from "zod";
import { BlockBoundary } from "./BlockBoundary";
import { registry as defaultRegistry, Registry } from "./registry";

const BlockShape = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  props: z.record(z.string(), z.unknown()).default({}),
});

export type ResolvedBlock = { id: string; type: string; Component: ComponentType<any>; props: unknown };

const warn = (...args: unknown[]) => {
  if (__DEV__) console.log("[sdui]", ...args);
};

export function resolveBlocks(
  blocks: unknown[],
  flags: Record<string, boolean>,
  registry: Registry = defaultRegistry
): ResolvedBlock[] {
  const resolved: ResolvedBlock[] = [];

  for (const raw of blocks) {
    const shape = BlockShape.safeParse(raw);
    if (!shape.success) {
      warn("dropped malformed block", JSON.stringify(raw));
      continue;
    }
    const { id, type, props } = shape.data;

    const def = registry[type];
    if (!def) {
      warn(`skipped unknown type "${type}" (${id})`);
      continue;
    }

    if (def.requiresFlag && flags[def.requiresFlag] !== true) continue;

    const parsed = def.schema.safeParse(props);
    if (!parsed.success) {
      warn(`dropped "${id}", invalid props:`, parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
      continue;
    }

    resolved.push({ id, type, Component: def.component, props: parsed.data });
  }

  return resolved;
}

type Props = { blocks: unknown[]; flags: Record<string, boolean>; registry?: Registry };

export function BlockRenderer({ blocks, flags, registry }: Props) {
  const resolved = useMemo(() => resolveBlocks(blocks, flags, registry), [blocks, flags, registry]);
  return (
    <>
      {resolved.map(({ id, type, Component, props }) => (
        <BlockBoundary key={id} blockId={id} type={type}>
          <Component {...(props as object)} />
        </BlockBoundary>
      ))}
    </>
  );
}