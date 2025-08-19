// src/mastra/agent.ts
import { Agent } from "@mastra/core/agent";
import { duckDuckGoTool } from "./tools/duckduckgo";
import { weatherTool } from "./tools/weather";
import { translateTool } from "./tools/translate";
import { openai } from "@ai-sdk/openai";

export const chatAgent = new Agent({
  name: "chat-agent",
  instructions: `
    你是一个智能助手，能回答问题，查询天气，翻译文本，并在需要时使用 DuckDuckGo 获取最新信息。
  `,
  model: openai("gpt-4o-mini"),
  tools: {
    duckDuckGoTool,
    weatherTool,
    translateTool,
  },
});
