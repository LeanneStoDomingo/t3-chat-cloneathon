import { v } from "convex/values";
import { paginationOptsValidator, type UserIdentity } from "convex/server";
import type { ToolSet } from "ai";
import type { Thread } from "@convex-dev/agent";
import { components, internal } from "./_generated/api";
import {
  query,
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

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    model: vChatModels,
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // const user = await getUserOrThrow(ctx);

    // TODO: make sure user owns thread

    return await models[args.model].agent.listMessages(ctx, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    });
  },
});

async function getThread(
  ctx: ActionCtx,
  user: UserIdentity,
  model: TChatModels,
  threadId: string | null
) {
  if (!threadId) {
    const { thread } = await models[model].agent.createThread(ctx, {
      userId: user.tokenIdentifier,
      title: NEW_THREAD_TITLE,
    });
    return thread;
  }

  const { thread } = await models[model].agent.continueThread(ctx, {
    threadId,
    userId: user.tokenIdentifier,
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
    const { thread } = await models[args.model].agent.continueThread(ctx, {
      threadId: args.threadId,
      userId: args.userId,
    });

    const title = await thread.generateText(
      {
        prompt:
          "Generate a single title for this thread in plain text. The title should be no more than 35 characters long. Strip the ends of whitespace and don't include quotes",
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

export const sendMessage = action({
  args: {
    prompt: v.string(),
    model: vChatModels,
    threadId: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const user = await getUserOrThrow(ctx);

    const thread = await getThread(ctx, user, args.model, args.threadId);

    const result = await thread.generateText({ prompt: args.prompt });

    await updateThreadTitle(ctx, thread, user.tokenIdentifier, args.model);

    return { threadId: thread.threadId, text: result.text };
  },
});
