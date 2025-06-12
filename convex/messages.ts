import { query } from "./_generated/server";

export const getForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const { email } = identity;

    if (!email) return [];

    return await ctx.db
      .query("messages")
      .withIndex("by_author", (q) => q.eq("author", email))
      .collect();
  },
});
