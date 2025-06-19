import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { vStreamArgs } from "@convex-dev/agent";
import { internalAction, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getUserOrThrow } from "./internal";
import { getThread, getThreadId, updateThreadTitle } from "./thread";
import { getModelAgent, vChatModels } from "../src/lib/chat-models";

export const list = query({
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

export const stream = internalAction({
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
      { saveStreamDeltas: true },
    );

    await result.consumeStream();
    await updateThreadTitle(ctx, thread, args.userId, args.model);
  },
});

export const send = mutation({
  args: {
    prompt: v.string(),
    model: vChatModels,
    threadId: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const user = await getUserOrThrow(ctx);

    const threadId = await getThreadId(
      ctx,
      user.tokenIdentifier,
      args.model,
      args.threadId,
    );

    await ctx.scheduler.runAfter(0, internal.message.stream, {
      prompt: args.prompt,
      model: args.model,
      threadId,
      userId: user.tokenIdentifier,
    });

    return { threadId };
  },
});
