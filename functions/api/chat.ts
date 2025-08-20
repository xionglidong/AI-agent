<<<<<<< HEAD
export const onRequestPost: PagesFunction<{ OPENAI_API_KEY: string }> = async (context) => {
  try {
    // Expect body: { query, variables }
    const contentType = context.request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ errors: [{ message: 'Expected application/json' }] }), { status: 400 })
    }
    const body = await context.request.json()
    const variables = body.variables || {}
    const model = variables.model || 'gpt-4o-mini'
    const messages = variables.messages || [{ role: 'user', content: 'Hello' }]
    const stream = Boolean(variables.stream)

    const payload: any = { model, messages }
    if (stream) payload.stream = true
    if (variables.temperature !== undefined) payload.temperature = variables.temperature

    const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!apiRes.ok) {
      const txt = await apiRes.text()
      return new Response(txt, { status: apiRes.status, headers: { 'Content-Type': 'text/plain' } })
    }

    if (stream) {
      // stream back as text/event-stream
      const ct = apiRes.headers.get('Content-Type') || 'text/event-stream'
      return new Response(apiRes.body, { headers: { 'Content-Type': ct } })
    }

    const data = await apiRes.json()
    // Return GraphQL-like envelope
    return new Response(JSON.stringify({ data }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err: any) {
    return new Response(JSON.stringify({ errors: [{ message: err.message || String(err) }] }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
=======
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
>>>>>>> 0ac00ab78c201a6f89ac586c0ab91c4ff994bedb
}
