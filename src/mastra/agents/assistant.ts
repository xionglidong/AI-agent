// src/mastra/agents/assistant.ts
import { Agent } from "@mastra/core/agent";
import { createOpenAI } from "@ai-sdk/openai";

// 显式使用环境变量中的 OPENAI_API_KEY
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const assistant = new Agent({
  name: "assistant",
  instructions: "You are a helpful AI assistant.",
  // 可替换模型为任意受支持的 OpenAI/兼容模型
  model: openai(process.env.MODEL_NAME || "gpt-4o-mini"),
});

export default assistant;
