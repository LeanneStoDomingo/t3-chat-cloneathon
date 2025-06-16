import { v } from "convex/values";
import { components } from "../../convex/_generated/api";
import { Agent } from "@convex-dev/agent";
import { google } from "@ai-sdk/google";
import { openrouter } from "@openrouter/ai-sdk-provider";

export const vChatModels = v.union(v.literal("gemini"), v.literal("deepseek"));

function getInstructions(model: string) {
  return `
  You are an AI chat assistant bot using the "${model}" model. 
  Format your response in markdown, but don't put the markdown in code blocks. 
  Present code in Markdown code blocks with the correct language extension indicated.
  Ensure code is properly formatted using Prettier with a print width of 80 characters.
  If using code blocks, prefer plain text over putting comments in code block unless they are inline comments.
  Always use LaTeX for mathematical expressions:
    - Inline math must be wrapped in escaped parentheses: \(content\)
    - Do not use single dollar signs for inline math
    - Display math must be wrapped in double dollar signs: $$content$$
  Do not use the backslash character to escape parenthesis. Use the actual parentheses.
  `;
}

export const models = {
  gemini: {
    name: "Gemini 2.0 Flash",
    agent: new Agent(components.agent, {
      chat: google.chat("gemini-2.0-flash"),
      name: "Gemini Chat Agent",
      instructions: getInstructions("gemini-2.0-flash"),
    }),
  },
  deepseek: {
    name: "DeepSeek v3 (0324)",
    agent: new Agent(components.agent, {
      chat: openrouter.chat("deepseek/deepseek-chat-v3-0324:free"),
      name: "DeepSeek Chat Agent",
      instructions: getInstructions("deepseek-chat-v3-0324"),
    }),
  },
};

export const modelStrings = Object.entries(models).map(([k, v]) => ({
  name: v.name,
  value: k,
}));

export type TChatModels = keyof typeof models;
