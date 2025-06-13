import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { Agent } from "@convex-dev/agent";
import { components } from "./_generated/api";
import { action, query } from "./_generated/server";
import { google } from "@ai-sdk/google";
import { openrouter } from "@openrouter/ai-sdk-provider";

const geminiChatAgent = new Agent(components.agent, {
  chat: google.chat("gemini-2.0-flash"),
  name: "Gemini Chat Agent",
  instructions:
    "You are an AI chat assistant bot using the `gemini-2.0-flash` model",
});

const openRouterChatAgent = new Agent(components.agent, {
  chat: openrouter.chat("deepseek/deepseek-chat-v3-0324:free"),
  name: "OpenRouter Chat Agent",
  instructions:
    "You are an AI chat assistant bot using the `deepseek/deepseek-chat-v3-0324:free` model",
});

export const listThreads = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthenticated");

    const threads = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      { userId: user.tokenIdentifier, paginationOpts: args.paginationOpts }
    );

    return threads;
  },
});

export const createThread = action({
  args: {
    prompt: v.string(),
    model: v.union(v.literal("gemini"), v.literal("deepseek")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthenticated");

    const chatAgent =
      args.model === "gemini" ? geminiChatAgent : openRouterChatAgent;

    const { threadId, thread } = await chatAgent.createThread(ctx, {
      userId: user.tokenIdentifier,
    });
    const result = await thread.generateText({ prompt: args.prompt });

    const title = await thread.generateText(
      { prompt: "Generate a single title for this thread in plain text" },
      { storageOptions: { saveMessages: "none" } }
    );
    await thread.updateMetadata({ title: title.text });

    return { threadId, text: result.text };
  },
});

export const continueThread = action({
  args: {
    prompt: v.string(),
    threadId: v.string(),
    model: v.union(v.literal("gemini"), v.literal("deepseek")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthenticated");

    const chatAgent =
      args.model === "gemini" ? geminiChatAgent : openRouterChatAgent;

    const { thread } = await chatAgent.continueThread(ctx, {
      threadId: args.threadId,
      userId: user.tokenIdentifier,
    });
    const result = await thread.generateText({ prompt: args.prompt });

    return result.text;
  },
});
