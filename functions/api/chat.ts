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
  let context = `你是一个智能、友好的AI助手，具有强大的代码分析和编程指导能力。

**你的特点**：
- 能够进行自然、流畅的日常对话
- 在编程和技术领域有专业的知识和经验
- 对代码质量、性能优化、安全性有深度理解
- 善于教学，能用简单易懂的方式解释复杂概念

**对话风格**：
- 自然、友好、有帮助
- 根据用户的问题给出针对性的回答
- 如果涉及代码，主动提供专业的分析和建议
- 保持积极正面的态度

当前对话：`;

  // 添加历史对话（最近5轮）
  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    if (msg.type === 'user') {
      context += `\n用户: ${msg.content}`;
    } else if (msg.type === 'assistant') {
      context += `\n助手: ${msg.content}`;
    }
  }

  // 添加当前消息
  context += `\n用户: ${currentMessage}`;

  // 添加附加的代码
  if (attachedCode) {
    context += `\n\n[用户上传了代码文件${fileName ? `: ${fileName}` : ''}]\n\`\`\`\n${attachedCode}\n\`\`\``;
  }

  // 检测代码块
  const codeBlockMatch = currentMessage.match(/```[\w]*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    context += `\n\n[用户在消息中包含了代码]`;
  }

  context += `\n\n请根据用户的问题给出有帮助的回答。如果涉及代码，请提供具体的分析和建议。`;

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
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: context
          },
          {
            role: 'user',
            content: '请回答用户的问题，提供有价值的编程建议。'
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
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
