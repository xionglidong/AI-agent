# My CF Mastra Agent

一个最小可用（MVP）的 **Mastra AI Agent**，可直接部署到 **Cloudflare Workers**。

## 快速开始

```bash
npm i -g wrangler
# 可选：也可以全局安装 mastra
# npm i -g mastra

npm install
cp .env.example .env
# 编辑 .env，填入 OPENAI_API_KEY、CLOUDFLARE_ACCOUNT_ID、CLOUDFLARE_API_TOKEN
```

本地开发：

```bash
npx mastra dev
# 或者
npm run dev
```

默认本地接口：
```
POST http://localhost:4111/api/agents/assistant/generate
```

构建：

```bash
npx mastra build
# 构建产物位于 ./.mastra/output
```

部署（使用 Mastra 生成的 wrangler.json）：

```bash
npx wrangler login
npx wrangler secret put OPENAI_API_KEY --config .mastra/output/wrangler.json
npx wrangler secret put CLOUDFLARE_API_TOKEN --config .mastra/output/wrangler.json
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID --config .mastra/output/wrangler.json

npm run deploy
```

部署成功后，你会获得 `*.workers.dev` 的地址，Agent 端点类似：

```
POST https://<your-worker>.workers.dev/api/agents/assistant/generate
```

### 常见问题
- 如遇到 `No matching version found for @ai-sdk/openai`，可先删 `package-lock.json`/`pnpm-lock.yaml` 后重装；或手动将 `@ai-sdk/openai` 版本固定到你能安装的稳定版本。
- Cloudflare Workers 运行 Node 依赖时，Mastra 的 Cloudflare Deployer 会在 `.mastra/output/wrangler.json` 中启用 `nodejs_compat` 等 flags，避免 `node:net` 等错误。
