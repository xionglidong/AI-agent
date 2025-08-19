import { Agent } from "@mastra/core";
import { OpenAI } from "@mastra/openai";

export const onRequest = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "Hello!";

  const llm = new OpenAI({
    apiKey: env.OPENAI_API_KEY, // 从 Cloudflare Pages 环境变量注入
    model: "gpt-4o-mini"
  });

  const agent = new Agent({
    name: "cloudflare-agent",
    description: "Mastra Agent running on Cloudflare Pages",
    llm
  });

  const result = await agent.run(query);

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
};
