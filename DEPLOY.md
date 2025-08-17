# 部署指南

## 🚀 Cloudflare Pages 部署（推荐）

### 前置条件
- Cloudflare 账户
- GitHub 仓库
- OpenAI 或 Anthropic API 密钥

### 部署步骤

#### 1. 推送代码到 GitHub
```bash
git add .
git commit -m "Ready for Cloudflare Pages deployment"
git push origin main
```

#### 2. 在 Cloudflare Pages 中创建项目
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Pages** 页面
3. 点击 **Create a project**
4. 选择 **Connect to Git**
5. 选择你的 GitHub 仓库

#### 3. 配置构建设置
- **Framework preset**: `None`
- **Build command**: `npm run build:pages`
- **Build output directory**: `web-dist`
- **Root directory**: `/` (留空)

#### 4. 设置环境变量
在 Cloudflare Pages 项目设置中添加：
- `OPENAI_API_KEY`: 你的 OpenAI API 密钥
- `ANTHROPIC_API_KEY`: 你的 Anthropic API 密钥（可选）

#### 5. 部署
点击 **Save and Deploy**，Cloudflare 会自动构建和部署你的应用。

### 🔧 本地测试 Cloudflare Functions
```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 本地开发
wrangler pages dev web-dist --compatibility-date=2024-01-01
```

## 🐳 Docker 部署

### 构建镜像
```bash
docker build -t ai-code-review-agent .
```

### 运行容器
```bash
docker run -d \
  --name ai-agent \
  -p 3000:3000 \
  -e OPENAI_API_KEY=your_key_here \
  -e NODE_ENV=production \
  ai-code-review-agent
```

### 使用 Docker Compose
```bash
# 设置环境变量
cp config/environment.example .env
# 编辑 .env 文件添加你的 API 密钥

# 启动服务
docker-compose up -d
```

## ☁️ 其他云平台部署

### Vercel
1. 安装 Vercel CLI: `npm i -g vercel`
2. 运行: `vercel`
3. 按照提示完成部署

### Netlify
1. 构建命令: `npm run build:pages`
2. 发布目录: `web-dist`
3. 在环境变量中设置 API 密钥

### Railway
1. 连接 GitHub 仓库
2. 设置环境变量
3. 自动部署

## 🔑 环境变量说明

### 必需变量
- `OPENAI_API_KEY` 或 `ANTHROPIC_API_KEY`: AI API 密钥

### 可选变量
- `AI_MODEL`: AI 模型 (默认: gpt-4)
- `PORT`: 服务器端口 (默认: 3000)
- `NODE_ENV`: 环境 (development/production)
- `LOG_LEVEL`: 日志级别 (默认: info)

## 📋 部署检查清单

- [ ] 代码推送到 Git 仓库
- [ ] 设置了 API 密钥环境变量
- [ ] 构建命令正确配置
- [ ] 输出目录正确设置
- [ ] 测试 API 端点是否正常工作
- [ ] 检查前端是否能正常访问

## 🐛 常见问题

### Q: 部署后出现 404 错误
**A:** 检查构建输出目录是否正确设置为 `web-dist`

### Q: API 调用失败
**A:** 确认环境变量中的 API 密钥设置正确

### Q: 前端页面空白
**A:** 检查浏览器控制台错误，通常是 API 路径问题

### Q: 本地开发正常，部署后异常
**A:** 检查 Cloudflare Functions 是否正确处理 API 请求

## 📞 获取帮助

如果遇到部署问题，请检查：
1. Cloudflare Pages 构建日志
2. 浏览器开发者工具控制台
3. API 响应状态码和错误信息
