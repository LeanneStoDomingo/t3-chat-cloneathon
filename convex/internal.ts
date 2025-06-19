import type { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";

export async function getUserOrThrow(ctx: QueryCtx | MutationCtx | ActionCtx) {
  const user = await ctx.auth.getUserIdentity();
  if (!user) throw new Error("Unauthenticated");
  return user;
}
