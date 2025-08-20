<<<<<<< HEAD
# AI 聊天应用

一个支持 Markdown 格式的智能聊天应用，基于 React + TypeScript + Tailwind CSS 构建。

## 功能特性

- 🤖 **AI 智能对话** - 支持与 AI 助手进行自然语言对话
- 📝 **Markdown 支持** - 完整的 Markdown 格式渲染
- 💻 **代码高亮** - 支持多种编程语言的语法高亮
- 🎨 **现代化 UI** - 美观的渐变设计和动画效果
- 📱 **响应式设计** - 适配各种屏幕尺寸
- ⚡ **实时交互** - 流畅的用户体验

## Markdown 功能

应用支持以下 Markdown 格式：

### 文本格式
- **粗体文本** - `**文本**`
- *斜体文本* - `*文本*`
- `行内代码` - `` `代码` ``

### 代码块
```javascript
function hello() {
  console.log("Hello, World!");
}
```

### 列表
- 无序列表项
- 另一个列表项

1. 有序列表项
2. 第二个列表项

### 引用
> 这是一个引用块
> 可以包含多行内容

### 链接
[访问 GitHub](https://github.com)

### 表格
| 功能 | 支持 | 说明 |
|------|------|------|
| 粗体 | ✅ | 支持 `**文本**` |
| 代码 | ✅ | 支持语法高亮 |
| 表格 | ✅ | 完整表格支持 |

### 标题
# 一级标题
## 二级标题
### 三级标题

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 构建生产版本：
```bash
npm run build
```

## 技术栈

- **前端框架**: React 18
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **Markdown**: react-markdown + remark-gfm
- **代码高亮**: rehype-highlight
- **图标**: Lucide React
- **构建工具**: Vite

## 项目结构

```
AI-Chat/
├── src/
│   ├── App.tsx          # 主应用组件
│   ├── main.tsx         # 应用入口
│   └── index.css        # 全局样式
├── functions/
│   └── api/
│       └── chat.ts      # API 路由
├── package.json
└── README.md
```

## 使用示例

在聊天中输入 Markdown 格式的内容，AI 助手会以格式化的方式回复：

**用户输入：**
```
请帮我写一个 React 组件
```

**AI 回复：**
```jsx
// 这是一个简单的 React 组件示例
function MyComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>计数器: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        点击增加
      </button>
    </div>
  );
}
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
=======
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
>>>>>>> 0ac00ab78c201a6f89ac586c0ab91c4ff994bedb
