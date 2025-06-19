import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import type { Thread } from "@convex-dev/agent";
import type { ToolSet } from "ai";
import {
  query,
  mutation,
  internalAction,
  type MutationCtx,
  type ActionCtx,
} from "./_generated/server";
import { components, internal } from "./_generated/api";
import { getUserOrThrow } from "./internal";
import {
  getModelAgent,
  vChatModels,
  type TChatModels,
} from "../src/lib/chat-models";

const NEW_THREAD_TITLE = "New Thread";

export async function getThreadId(
  ctx: MutationCtx,
  userId: string,
  model: TChatModels,
  threadId: string | null,
) {
  if (threadId) return threadId;

  const agent = getModelAgent(model);

  const thread = await agent.createThread(ctx, {
    userId,
    title: NEW_THREAD_TITLE,
  });

  return thread.threadId;
}

export async function updateThreadTitle(
  ctx: MutationCtx | ActionCtx,
  thread: Thread<ToolSet>,
  userId: string,
  model: TChatModels,
) {
  const metadata = await thread.getMetadata();
  if (metadata.title !== NEW_THREAD_TITLE) return;

  await ctx.scheduler.runAfter(0, internal.thread.generateTitle, {
    threadId: thread.threadId,
    userId,
    model,
  });
}

export const exists = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    try {
      const thread = await ctx.runQuery(components.agent.threads.getThread, {
        threadId: args.threadId,
      });
      return !!thread;
    } catch {
      return false;
    }
  },
});

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await getUserOrThrow(ctx);

    const threads = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      { userId: user.tokenIdentifier, paginationOpts: args.paginationOpts },
    );

    return threads;
  },
});

export const generateTitle = internalAction({
  args: {
    threadId: v.string(),
    userId: v.string(),
    model: vChatModels,
  },
  handler: async (ctx, args) => {
    const agent = getModelAgent(args.model);

    const { thread } = await agent.continueThread(ctx, {
      threadId: args.threadId,
      userId: args.userId,
    });

    const title = await thread.generateText(
      {
        prompt: `Generate a single title for this thread in plain text. 
          The title should be no more than 35 characters long. 
          Strip the ends of whitespace and don't include quotes`,
      },
      { storageOptions: { saveMessages: "none" } },
    );

    await thread.updateMetadata({ title: title.text });
  },
});

export const archive = mutation({
  args: {
    threadId: v.string(),
    status: v.union(v.literal("archived"), v.literal("active")),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(components.agent.threads.updateThread, {
      threadId: args.threadId,
      patch: { status: args.status },
    });
  },
});

export const deleteById = mutation({
  args: {
    threadId: v.string(),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.agent.threads.deleteAllForThreadIdAsync,
      args,
    );
  },
});
