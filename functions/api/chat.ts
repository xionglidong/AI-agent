// functions/api/chat.ts
import { graphql, buildSchema } from "graphql";
import { chatAgent } from "../../src/mastra/agent";

const schema = buildSchema(`
  type Query {
    ask(query: String!): String
  }
`);

const root = {
  ask: async ({ query }: { query: string }) => {
    const res = await chatAgent.generate(query);
    return res.text;
  },
};

export const onRequestPost = async (context) => {
  const body = await context.request.json();
  const result = await graphql({ schema, source: body.query, rootValue: root });
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
};
