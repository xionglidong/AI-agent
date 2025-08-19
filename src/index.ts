import { Agent, Tool } from "mastra";
import OpenAI from "openai";
import {
  graphql,
  buildSchema
} from "graphql";

// 定义 GraphQL Schema
const schema = buildSchema(`
  type Query {
    ask(question: String!): String
  }
`);

// 初始化 OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 定义一个工具（DuckDuckGo 示例）
const duckTool = new Tool({
  name: "duckduckgoSearch",
  description: "DuckDuckGo 搜索",
  func: async (query: string) => {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`;
    const res = await fetch(url);
    const data = await res.json();
    return data.AbstractText || "没有找到相关结果";
  },
});

// 定义 Agent
const agent = new Agent({
  name: "cloudflare-agent",
  instructions: "你是一个 AI 助手，可以回答问题并在需要时调用工具。",
  tools: [duckTool],
  llm: async (prompt: string) => {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    return res.choices[0].message?.content || "无结果";
  },
});

// GraphQL Resolver
const root = {
  ask: async ({ question }: { question: string }) => {
    return await agent.run(question);
  }
};

// Cloudflare Worker Handler
export default {
  async fetch(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url);

    if (request.method === "POST") {
      const body = await request.json();
      const response = await graphql({
        schema,
        source: body.query,
        rootValue: root,
      });
      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // GraphQL Playground-like GET query
    if (searchParams.has("query")) {
      const response = await graphql({
        schema,
        source: searchParams.get("query")!,
        rootValue: root,
      });
      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("GraphQL endpoint ready", { status: 200 });
  },
};
