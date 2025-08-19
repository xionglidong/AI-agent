import { Agent } from "@mastra/core"

export const agent = new Agent({
  name: "chat-agent",
  model: "gpt-4o-mini", // 走 OpenAI API
  tools: [],
})
