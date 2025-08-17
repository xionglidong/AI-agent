// Intelligent chat endpoint for Cloudflare Workers
export const onRequestPost: PagesFunction<{
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
}> = async (context) => {
  try {
    const { message, conversationHistory, attachedCode, fileName } = await context.request.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const chatResponse = await handleIntelligentChat(
      message, 
      conversationHistory || [], 
      attachedCode, 
      fileName, 
      context.env
    );

    return new Response(JSON.stringify(chatResponse), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};

async function handleIntelligentChat(
  message: string, 
  conversationHistory: any[], 
  attachedCode?: string, 
  fileName?: string, 
  env?: any
) {
  const apiKey = env?.OPENAI_API_KEY || env?.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return {
      response: `我理解你的问题："${message}"

不过目前没有配置AI API密钥，我只能提供基础的代码分析功能。要获得完整的AI对话体验，请设置 OPENAI_API_KEY 或 ANTHROPIC_API_KEY 环境变量。

我仍然可以帮你：
- 分析代码语法和风格问题
- 检测基础的安全风险
- 提供编程最佳实践建议

请分享你的代码，我来为你分析！`,
      needsAction: false,
      suggestedActions: ['analyze', 'explain']
    };
  }

  // 构建对话上下文
  const conversationContext = buildConversationContext(message, conversationHistory, attachedCode, fileName);
  
  // 调用AI进行智能对话
  const aiResponse = await callAIForChat(conversationContext, apiKey);
  
  return aiResponse;
}

function buildConversationContext(
  currentMessage: string, 
  history: any[], 
  attachedCode?: string, 
  fileName?: string
) {
  let context = `你是一个智能、友好的AI助手，既能进行自然对话，也具备专业的编程指导能力。

**对话原则**：
- 自然、友好、有帮助的交流风格
- 对任何话题都能给出有价值的回答
- 如果涉及编程，提供专业的技术建议
- 保持积极正面，富有同理心

**你的能力**：
- 日常对话：生活建议、知识问答、情感支持
- 编程专长：代码分析、架构设计、问题解决
- 学习指导：概念解释、最佳实践、技能提升

请根据用户的具体问题，给出最合适的回答。`;

  // 添加历史对话（最近8轮）
  const recentHistory = history.slice(-16);
  if (recentHistory.length > 0) {
    context += `\n\n**对话历史**：`;
    for (const msg of recentHistory) {
      if (msg.type === 'user') {
        context += `\n用户: ${msg.content}`;
      } else if (msg.type === 'assistant') {
        const shortContent = msg.content.length > 150 
          ? msg.content.substring(0, 150) + '...' 
          : msg.content;
        context += `\n助手: ${shortContent}`;
      }
    }
  }

  // 添加当前消息
  context += `\n\n**当前问题**：${currentMessage}`;

  // 添加附加的代码
  if (attachedCode) {
    context += `\n\n**用户上传的代码**${fileName ? ` (${fileName})` : ''}：\n\`\`\`\n${attachedCode.substring(0, 2000)}${attachedCode.length > 2000 ? '\n...(代码已截断)' : ''}\n\`\`\``;
  }

  // 检测代码块
  const codeBlockMatch = currentMessage.match(/```[\w]*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    context += `\n\n**注意**：用户在消息中包含了代码片段，请重点关注代码相关的问题。`;
  }

  return context;
}

async function callAIForChat(context: string, apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: context
          }
        ],
        max_tokens: 1500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error('AI API request failed');
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || '抱歉，我现在无法处理你的请求。';

    // 分析是否需要特定操作
    const needsAction = analyzeIfNeedsSpecificAction(aiMessage);
    const suggestedActions = suggestActions(aiMessage);

    return {
      response: aiMessage,
      needsAction,
      suggestedActions,
      conversationId: generateConversationId(),
    };

  } catch (error) {
    return {
      response: `抱歉，我在处理你的请求时遇到了问题。让我尝试用其他方式帮助你：

如果你有代码需要分析，请直接分享，我会检查：
- 语法和风格问题
- 潜在的性能问题  
- 安全风险
- 改进建议

如果你有编程问题，我也会尽力解答！`,
      needsAction: false,
      suggestedActions: ['analyze', 'explain'],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function analyzeIfNeedsSpecificAction(aiResponse: string): boolean {
  const actionKeywords = [
    '分析', '检查', '优化', '重构', '解释', '审查',
    'analyze', 'check', 'optimize', 'refactor', 'explain', 'review'
  ];
  
  return actionKeywords.some(keyword => 
    aiResponse.toLowerCase().includes(keyword.toLowerCase())
  );
}

function suggestActions(aiResponse: string): string[] {
  const suggestions = [];
  
  if (aiResponse.includes('分析') || aiResponse.includes('检查')) {
    suggestions.push('analyze');
  }
  if (aiResponse.includes('优化') || aiResponse.includes('性能')) {
    suggestions.push('optimize');
  }
  if (aiResponse.includes('解释') || aiResponse.includes('理解')) {
    suggestions.push('explain');
  }
  if (aiResponse.includes('项目') || aiResponse.includes('整体')) {
    suggestions.push('repository');
  }
  
  return suggestions.length > 0 ? suggestions : ['analyze'];
}

function generateConversationId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 智能代码提取
function extractCodeFromMessage(message: string): { code: string; language: string } | null {
  // 提取代码块
  const codeBlockMatch = message.match(/```(\w+)?\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    return {
      code: codeBlockMatch[2],
      language: codeBlockMatch[1] || 'javascript'
    };
  }

  // 提取行内代码
  const inlineCodeMatch = message.match(/`([^`]+)`/);
  if (inlineCodeMatch && inlineCodeMatch[1].length > 20) {
    return {
      code: inlineCodeMatch[1],
      language: 'javascript'
    };
  }

  return null;
}
