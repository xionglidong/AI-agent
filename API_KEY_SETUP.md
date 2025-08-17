# 🔑 API密钥配置说明

## 问题说明

你问的"为什么纯OpenAI聊天项目能推荐沈阳铁锅炖，但这个agent项目不行"，原因是：

### 🔴 **当前状态（无API密钥）**：
```bash
Warning: No AI API key provided. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.
```

- **纯OpenAI项目**：直接调用OpenAI API → 能推荐餐厅 ✅
- **Agent项目**：没有API密钥 → 只能返回固定回复 ❌

## 🚀 解决方案

### 方法1：使用OpenAI API

1. **获取API密钥**：
   - 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
   - 创建新的API密钥

2. **配置环境变量**：
   ```bash
   # 在项目根目录创建 .env 文件
   echo "OPENAI_API_KEY=your_actual_api_key_here" > .env
   echo "AI_MODEL=gpt-4" >> .env
   ```

3. **重启服务**：
   ```bash
   npm start
   ```

### 方法2：使用Anthropic (Claude)

```bash
# 创建 .env 文件
echo "ANTHROPIC_API_KEY=your_claude_api_key_here" > .env
echo "AI_MODEL=claude-3-sonnet" >> .env
```

## 🎯 配置后的效果对比

### ❌ **配置前（当前状态）**：
```
用户：推荐沈阳铁锅炖
AI：你好！我是你的AI编程助手。目前我在基础模式下运行...
```

### ✅ **配置后（完整AI能力）**：
```
用户：推荐沈阳铁锅炖
AI：沈阳的铁锅炖确实很有名！我来为你推荐几家口碑不错的：

🍲 **推荐餐厅**：
1. **老边饺子馆** - 传统铁锅炖鱼，汤鲜味美
2. **东北人家** - 铁锅炖大鹅，分量足味道正宗
3. **农家小院** - 铁锅炖排骨，配玉米饼特别香

🎯 **特色推荐**：
- 铁锅炖鱼：选用新鲜鲤鱼，配土豆粉条
- 铁锅炖鹅：东北特色，肉质鲜嫩
- 铁锅炖排骨：汤汁浓郁，配菜丰富

你想了解哪种铁锅炖的具体做法吗？
```

## 🔧 快速测试

配置API密钥后，可以测试：

```bash
# 测试日常对话
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "推荐沈阳铁锅炖"}'

# 测试编程问题
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "如何优化React组件性能？"}'
```

## 💡 技术原理

```typescript
// src/agent.ts 中的逻辑
async handleChat(message: string, conversationHistory: any[] = []) {
  try {
    // 如果有API密钥 → 调用真正的AI
    if (this.config.apiKey) {
      const context = this.buildChatContext(message, conversationHistory);
      return await this.generateChatResponse(context); // ✅ 智能对话
    }
  } catch (error) {
    // 如果没有API密钥 → 基础模式
    if (!this.config.apiKey) {
      return this.handleBasicChat(message); // ❌ 固定回复
    }
  }
}
```

配置API密钥后，你的Agent就能像纯OpenAI项目一样，进行真正的智能对话了！🎉
