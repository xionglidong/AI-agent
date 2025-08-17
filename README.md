# AI 代码审查助手

一个基于 Mastra 框架的智能代码审查与优化助手，提供全面的代码质量分析、安全检查和性能优化建议。

## 🚀 功能特性

- 🤖 **智能代码分析** - 基于 AI 的深度代码审查
- 🔒 **安全漏洞检测** - 识别常见的安全风险和漏洞
- ⚡ **性能优化建议** - 检测性能瓶颈并提供优化方案
- 📊 **代码质量评分** - 综合评估代码质量并给出分数
- 🔧 **代码自动优化** - AI 驱动的代码重构和优化
- 📝 **详细解释说明** - 深入解析代码逻辑和最佳实践
- 📁 **仓库批量审查** - 支持整个代码仓库的批量分析
- 🔄 **实时文件监控** - 实时监控文件变化并自动分析
- 🌐 **现代化 Web 界面** - 直观的用户界面和实时反馈
- 🔌 **WebSocket 支持** - 实时通信和状态更新

## 🎯 支持的编程语言

- JavaScript / TypeScript
- Python
- Java
- C / C++
- Go
- Rust
- PHP
- Ruby
- Swift
- Kotlin

## 🛠️ 快速开始

### 环境要求

- Node.js 18+ 
- npm 或 yarn
- OpenAI API Key 或 Anthropic API Key

### 安装和配置

1. **克隆项目**
```bash
git clone https://github.com/your-username/AI-agent.git
cd AI-agent
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
```bash
# 复制环境配置模板
cp config/environment.example .env

# 编辑环境变量
# 设置 API 密钥和其他配置
```

4. **启动开发服务器**
```bash
# 启动后端服务
npm run dev

# 启动前端界面（新终端）
npm run web
```

5. **访问应用**
- Web 界面: http://localhost:5173
- API 服务: http://localhost:3000
- WebSocket: ws://localhost:3001

### Docker 部署

```bash
# 使用 Docker Compose 快速部署
docker-compose up -d

# 或者构建自定义镜像
docker build -t ai-code-review-agent .
docker run -p 3000:3000 -p 3001:3001 ai-code-review-agent
```

## 📖 使用指南

### 代码分析

1. **单文件分析**
   - 在 Web 界面中粘贴代码
   - 选择编程语言
   - 点击"分析代码"查看详细报告

2. **仓库批量分析**
   - 输入本地仓库路径
   - 点击"审查仓库"
   - 查看所有文件的分析结果

3. **实时监控**
   - 启用文件监控功能
   - 代码文件变化时自动触发分析
   - 通过 WebSocket 接收实时反馈

### API 使用

```bash
# 分析代码
curl -X POST http://localhost:3000/api/analyze-code \
  -H "Content-Type: application/json" \
  -d '{"code": "console.log(\"Hello World\")", "language": "javascript"}'

# 优化代码
curl -X POST http://localhost:3000/api/optimize-code \
  -H "Content-Type: application/json" \
  -d '{"code": "var x = 5; console.log(x);", "language": "javascript"}'

# 解释代码
curl -X POST http://localhost:3000/api/explain-code \
  -H "Content-Type: application/json" \
  -d '{"code": "function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }", "language": "javascript"}'
```

## 🏗️ 技术架构

### 后端技术栈
- **框架**: Express.js + TypeScript
- **AI 集成**: OpenAI GPT-4 / Anthropic Claude
- **实时通信**: WebSocket
- **文件监控**: Chokidar
- **安全**: Helmet + CORS
- **日志**: Winston
- **测试**: Jest

### 前端技术栈
- **框架**: React 18 + TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **Markdown**: react-markdown + remark-gfm
- **代码高亮**: rehype-highlight
- **构建工具**: Vite

### 项目结构

```
AI-agent/
├── src/
│   ├── agent.ts              # 主 AI Agent 类
│   ├── config/               # 配置管理
│   ├── services/             # 业务服务
│   │   └── realtimeAnalyzer.ts
│   ├── analyzer/             # 代码分析器
│   │   ├── codeAnalyzer.ts
│   │   ├── securityChecker.ts
│   │   ├── performanceAnalyzer.ts
│   │   └── advancedAnalyzer.ts
│   ├── mcp/                  # MCP 工具集成
│   │   └── tools.ts
│   ├── utils/                # 工具函数
│   │   └── logger.ts
│   ├── App.tsx               # React 主组件
│   └── index.ts              # 服务器入口
├── tests/                    # 测试文件
├── config/                   # 配置文件
├── .github/workflows/        # CI/CD 配置
├── docker-compose.yml        # Docker 配置
└── Dockerfile
```

## 🔧 开发指南

### 运行测试

```bash
# 运行所有测试
npm test

# 监视模式运行测试
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 代码检查

```bash
# 运行 ESLint
npm run lint

# 自动修复代码风格问题
npm run lint:fix
```

### 构建项目

```bash
# 构建后端
npm run build

# 构建前端
npm run web:build
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Mastra Framework](https://mastra.ai) - AI Agent 开发框架
- [OpenAI](https://openai.com) - GPT 模型支持
- [Anthropic](https://anthropic.com) - Claude 模型支持
