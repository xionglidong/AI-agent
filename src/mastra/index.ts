// src/mastra/index.ts
import { Mastra } from "@mastra/core/mastra";
import assistant from "./agents/assistant";
import { CloudflareDeployer } from "@mastra/deployer-cloudflare";

export const mastra = new Mastra({
  agents: [assistant],
  deployer: new CloudflareDeployer({
    scope: process.env.CLOUDFLARE_ACCOUNT_ID!,
    projectName: "my-cf-mastra-agent",
    auth: {
      apiToken: process.env.CLOUDFLARE_API_TOKEN!,
      // apiEmail: process.env.CLOUDFLARE_API_EMAIL, // 如果你的 Token 需要
    },
  }),
});
