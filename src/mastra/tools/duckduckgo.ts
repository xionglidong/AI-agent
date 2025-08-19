// src/mastra/tools/duckduckgo.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const duckDuckGoTool = createTool({
  id: "duckduckgo_search",
  description: "使用 DuckDuckGo 搜索并返回简要信息",
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ context }) => {
    const { query } = context;
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`
    );
    const data = await res.json();
    return { result: data.AbstractText || "未找到结果" };
  },
});
