import { NextRequest } from "next/server";
import { createMastra } from "@mastra/core";
import { OpenAI } from "@mastra/openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const mastra = createMastra({
  llms: { openai },
});

export async function onRequestPost(context: { request: Request }) {
  const req = context.request;
  const { messages } = await req.json();

  const response = await mastra.llms.openai.chat({
    model: "gpt-4o-mini",
    messages,
  });

  return new Response(JSON.stringify({ reply: response.output }), {
    headers: { "Content-Type": "application/json" },
  });
}
