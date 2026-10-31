import { ComponentType } from "react";
import { z } from "zod";
import { BalanceCard, balanceCardSchema } from "../blocks/BalanceCard";
import { Banner, bannerSchema } from "../blocks/Banner";
import { RewardList, rewardListSchema } from "../blocks/RewardList";

export type BlockDefinition<P = any> = {
  schema: z.ZodType<P>;
  component: ComponentType<P>;
  requiresFlag?: string;
};

export type Registry = Record<string, BlockDefinition>;

// Checks at compile time that the schema's output matches the component's props.
function defineBlock<P>(def: BlockDefinition<P>): BlockDefinition {
  return def;
}

export const registry: Registry = {
  balance_card: defineBlock({ schema: balanceCardSchema, component: BalanceCard, requiresFlag: "showRewards" }),
  banner: defineBlock({ schema: bannerSchema, component: Banner }),
  reward_list: defineBlock({ schema: rewardListSchema, component: RewardList, requiresFlag: "showRewards" }),
};