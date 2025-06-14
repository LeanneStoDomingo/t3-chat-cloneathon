import { v } from "convex/values";
import { components } from "../../convex/_generated/api";
import { Agent } from "@convex-dev/agent";
import { google } from "@ai-sdk/google";
import { openrouter } from "@openrouter/ai-sdk-provider";

export const vChatModels = v.union(v.literal("gemini"), v.literal("deepseek"));

export const models = {
  gemini: {
    name: "Gemini 2.0 Flash",
    value: "gemini",
    agent: new Agent(components.agent, {
      chat: google.chat("gemini-2.0-flash"),
      name: "Gemini Chat Agent",
      instructions:
        "You are an AI chat assistant bot using the `gemini-2.0-flash` model",
    }),
  },
  deepseek: {
    name: "DeepSeek V3 0324",
    value: "deepseek",
    agent: new Agent(components.agent, {
      chat: openrouter.chat("deepseek/deepseek-chat-v3-0324:free"),
      name: "DeepSeek Chat Agent",
      instructions:
        "You are an AI chat assistant bot using the `deepseek-chat-v3-0324` model",
    }),
  },
};

export const modelStrings = Object.values(models).map((m) => ({
  name: m.name,
  value: m.value,
}));

export type TChatModels = keyof typeof models;
