// src/mastra/agent.ts
import { Agent } from "@mastra/core";
import { duckDuckGoTool } from "./tools/duckduckgo";
import { weatherTool } from "./tools/weather";
import { translateTool } from "./tools/translate";

export const chatAgent = new Agent({
  name: "chat-agent",
  instructions: `
    你是一个智能助手，能回答问题，查询天气，翻译文本，并在需要时使用 DuckDuckGo 获取最新信息。
  `,
  tools: {
    duckDuckGoTool,
    weatherTool,
    translateTool,
  },
});
