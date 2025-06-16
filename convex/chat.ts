import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import type { ToolSet } from "ai";
import { vStreamArgs, type Thread } from "@convex-dev/agent";
import { components, internal } from "./_generated/api";
import {
  query,
  mutation,
  action,
  internalAction,
  type QueryCtx,
  type MutationCtx,
  type ActionCtx,
} from "./_generated/server";
import { vChatModels, models, type TChatModels } from "../src/lib/chat-models";

const NEW_THREAD_TITLE = "New Thread";

async function getUserOrThrow(ctx: QueryCtx | MutationCtx | ActionCtx) {
  const user = await ctx.auth.getUserIdentity();
  if (!user) throw new Error("Unauthenticated");
  return user;
}

export const listThreads = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await getUserOrThrow(ctx);

    const threads = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      { userId: user.tokenIdentifier, paginationOpts: args.paginationOpts }
    );

    return threads;
  },
});

export const checkIfThreadExists = query({
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

function getModelAgent(model: TChatModels) {
  return models[model].agent;
}

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    model: vChatModels,
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    // const user = await getUserOrThrow(ctx);

    // TODO: make sure user owns thread

    const agent = getModelAgent(args.model);

    const messages = await agent.listMessages(ctx, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    });

    const streams = await agent.syncStreams(ctx, {
      threadId: args.threadId,
      streamArgs: args.streamArgs,
    });

    return { ...messages, streams };
  },
});

async function getThread(
  ctx: ActionCtx,
  userId: string,
  model: TChatModels,
  threadId: string | null
) {
  const agent = getModelAgent(model);

  if (!threadId) {
    const { thread } = await agent.createThread(ctx, {
      userId,
      title: NEW_THREAD_TITLE,
    });
    return thread;
  }

  const { thread } = await agent.continueThread(ctx, {
    threadId,
    userId,
  });
  return thread;
}

export const generateThreadTitle = internalAction({
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
      { storageOptions: { saveMessages: "none" } }
    );

    await thread.updateMetadata({ title: title.text });
  },
});

async function updateThreadTitle(
  ctx: MutationCtx | ActionCtx,
  thread: Thread<ToolSet>,
  userId: string,
  model: TChatModels
) {
  const metadata = await thread.getMetadata();
  if (metadata.title !== NEW_THREAD_TITLE) return;

  await ctx.scheduler.runAfter(0, internal.chat.generateThreadTitle, {
    threadId: thread.threadId,
    userId,
    model,
  });
}

export const streamMessage = internalAction({
  args: {
    userId: v.string(),
    model: vChatModels,
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const thread = await getThread(ctx, args.userId, args.model, args.threadId);

    const result = await thread.streamText(
      { prompt: args.prompt },
      { saveStreamDeltas: true }
    );

    await result.consumeStream();
    await updateThreadTitle(ctx, thread, args.userId, args.model);
  },
});

export const sendMessage = action({
  args: {
    prompt: v.string(),
    model: vChatModels,
    threadId: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const user = await getUserOrThrow(ctx);

    const thread = await getThread(
      ctx,
      user.tokenIdentifier,
      args.model,
      args.threadId
    );

    await ctx.scheduler.runAfter(0, internal.chat.streamMessage, {
      prompt: args.prompt,
      model: args.model,
      threadId: thread.threadId,
      userId: user.tokenIdentifier,
    });

    return { threadId: thread.threadId };
  },
});

export const archiveThread = mutation({
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

export const deleteThread = mutation({
  args: {
    threadId: v.string(),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.agent.threads.deleteAllForThreadIdAsync,
      args
    );
  },
});
