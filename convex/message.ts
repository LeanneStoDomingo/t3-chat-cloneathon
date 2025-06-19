import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { vStreamArgs } from "@convex-dev/agent";
import {
  internalAction,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getUserOrThrow } from "./internal";
import { getThreadId, updateThreadTitle } from "./thread";
import { getModelAgent, models, vChatModels } from "../src/lib/chat-models";

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

export const send = mutation({
  args: {
    prompt: v.string(),
    model: vChatModels,
    threadId: v.union(v.string(), v.null()),
    insideMatrix: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getUserOrThrow(ctx);

    const threadId = await getThreadId(
      ctx,
      user.tokenIdentifier,
      args.model,
      args.threadId,
    );

    await ctx.scheduler.runAfter(0, internal.message.saveAndStream, {
      model: args.model,
      prompt: args.prompt,
      threadId,
      userId: user.tokenIdentifier,
      insideMatrix: args.insideMatrix,
    });

    return { threadId };
  },
});

export const saveAndStream = internalMutation({
  args: {
    model: vChatModels,
    threadId: v.string(),
    prompt: v.string(),
    userId: v.string(),
    insideMatrix: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const agent = getModelAgent(args.model);

    const { messageId } = await agent.saveMessage(ctx, {
      threadId: args.threadId,
      prompt: args.prompt,
      userId: args.userId,
      skipEmbeddings: true,
    });

    await ctx.scheduler.runAfter(0, internal.message.stream, {
      messageId,
      model: args.model,
      threadId: args.threadId,
      userId: args.userId,
      insideMatrix: args.insideMatrix,
    });
  },
});

export const stream = internalAction({
  args: {
    userId: v.string(),
    model: vChatModels,
    threadId: v.string(),
    messageId: v.string(),
    insideMatrix: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const agent = getModelAgent(args.model);

    const { thread } = await agent.continueThread(ctx, {
      threadId: args.threadId,
      userId: args.userId,
    });

    const result = await thread.streamText(
      {
        promptMessageId: args.messageId,
        system: models[args.model].instructions(!!args.insideMatrix),
      },
      { saveStreamDeltas: true },
    );

    await result.consumeStream();
    await updateThreadTitle(ctx, thread, args.userId, args.model);
  },
});
