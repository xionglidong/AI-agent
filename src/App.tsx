import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, User, Send, Paperclip, Code, Shield, Zap, 
  FileText, Upload, Trash2, Copy, Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    analysisType?: string;
    language?: string;
    fileName?: string;
    codeSnippet?: string;
  };
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentInput: string;
}

const EXAMPLE_PROMPTS = [
  "我的代码运行很慢，能帮我优化一下吗？",
  "今天天气怎么样？有什么好的学习计划吗？",
  "帮我检查一下代码有没有安全问题",
  "我想学习React Hooks，能给我一些例子吗？",
  "最近工作压力很大，有什么放松的建议吗？",
  "如何重构这个函数让它更清晰？",
  "推荐几本好的编程书籍",
  "你好！今天过得怎么样？"
];

export default function App() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [
      {
        id: '1',
        type: 'assistant',
        content: `👋 你好！我是你的智能AI助手，既能帮你解决编程问题，也能进行日常对话！

🎯 **编程方面我可以帮你**：
🔍 **代码分析** - 检查代码质量、发现潜在问题
🚀 **代码优化** - 提升性能、简化逻辑  
📚 **代码解释** - 详细解释代码功能和原理
🛡️ **安全审查** - 识别安全漏洞和风险
📁 **项目审查** - 全面分析项目结构和质量

💬 **日常对话我也很擅长**：
- 回答各种知识性问题
- 提供学习和工作建议
- 轻松愉快的闲聊
- 生活、学习、技术等各方面的咨询

你可以：
- 直接粘贴代码让我分析
- 上传代码文件进行检查
- 询问编程概念和最佳实践
- 或者就是简单地聊聊天！

现在就开始吧！有什么我可以帮你的吗？ 😊`,
        timestamp: Date.now(),
      }
    ],
    isLoading: false,
    currentInput: '',
  });

  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages]);

  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 限制文件大小为1MB
      if (file.size > 1024 * 1024) {
        alert('文件大小不能超过1MB');
        return;
      }
      setAttachedFile(file);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const detectIntent = (message: string, fileName?: string): { type: string, language?: string } => {
    const lowerMessage = message.toLowerCase();
    
    // 检测编程语言
    const languagePatterns = {
      javascript: /\b(javascript|js|jsx|react|node|npm)\b/,
      typescript: /\b(typescript|ts|tsx)\b/,
      python: /\b(python|py|django|flask|pandas)\b/,
      java: /\b(java|spring|maven|gradle)\b/,
      cpp: /\b(c\+\+|cpp|cmake)\b/,
      go: /\b(golang|go)\b/,
      rust: /\b(rust|cargo)\b/,
      php: /\b(php|laravel|composer)\b/,
    };

    let detectedLanguage = 'javascript'; // 默认语言
    
    // 从文件扩展名检测语言
    if (fileName) {
      const ext = fileName.split('.').pop()?.toLowerCase();
      const extMap: Record<string, string> = {
        'js': 'javascript', 'jsx': 'javascript',
        'ts': 'typescript', 'tsx': 'typescript',
        'py': 'python', 'java': 'java',
        'cpp': 'cpp', 'c': 'c',
        'go': 'go', 'rs': 'rust',
        'php': 'php', 'rb': 'ruby',
      };
      if (ext && extMap[ext]) {
        detectedLanguage = extMap[ext];
      }
    }

    // 从消息内容检测语言
    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      if (pattern.test(lowerMessage)) {
        detectedLanguage = lang;
        break;
      }
    }

    // 检测意图
    if (/\b(分析|检查|review|analyze|问题|bug|错误)\b/.test(lowerMessage)) {
      return { type: 'analyze', language: detectedLanguage };
    }
    if (/\b(优化|optimize|性能|performance|改进|improve)\b/.test(lowerMessage)) {
      return { type: 'optimize', language: detectedLanguage };
    }
    if (/\b(解释|explain|理解|understand|学习|learn)\b/.test(lowerMessage)) {
      return { type: 'explain', language: detectedLanguage };
    }
    if (/\b(项目|仓库|repository|repo|全面|整体)\b/.test(lowerMessage)) {
      return { type: 'repository', language: detectedLanguage };
    }

    // 默认为分析
    return { type: 'analyze', language: detectedLanguage };
  };

  const extractCodeFromMessage = (message: string): string | null => {
    // 提取代码块
    const codeBlockMatch = message.match(/```[\w]*\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1];
    }

    // 提取行内代码
    const inlineCodeMatch = message.match(/`([^`]+)`/);
    if (inlineCodeMatch) {
      return inlineCodeMatch[1];
    }

    return null;
  };

  const callAPI = async (type: string, payload: any) => {
    const endpoints = {
      analyze: '/api/analyze-code',
      optimize: '/api/optimize-code',
      explain: '/api/explain-code',
      repository: '/api/review-repository',
    };

    const endpoint = endpoints[type as keyof typeof endpoints];
    if (!endpoint) {
      throw new Error(`Unknown analysis type: ${type}`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return await response.json();
  };

  const formatResponse = (type: string, data: any): string => {
    switch (type) {
      case 'analyze':
        return formatAnalysisResponse(data);
      case 'optimize':
        return formatOptimizationResponse(data);
      case 'explain':
        return formatExplanationResponse(data);
      case 'repository':
        return formatRepositoryResponse(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  };

  const formatAnalysisResponse = (data: any): string => {
    if (data.error) return `❌ 分析失败：${data.error}`;
    
    let response = `## 📊 代码分析结果\n\n`;
    
    if (data.score !== undefined) {
      const scoreEmoji = data.score >= 80 ? '🟢' : data.score >= 60 ? '🟡' : '🔴';
      response += `**质量评分：** ${scoreEmoji} ${data.score}/100\n\n`;
    }

    if (data.summary) {
      response += `**总结：** ${data.summary}\n\n`;
    }

    if (data.issues && data.issues.length > 0) {
      response += `### 🔍 发现的问题\n\n`;
      data.issues.forEach((issue: any, index: number) => {
        const severityEmoji = {
          critical: '🔴',
          high: '🟠', 
          medium: '🟡',
          low: '🔵'
        }[issue.severity] || '⚪';
        
        response += `${index + 1}. ${severityEmoji} **${issue.message}**`;
        if (issue.line) response += ` (第${issue.line}行)`;
        response += `\n`;
        if (issue.suggestion) {
          response += `   💡 ${issue.suggestion}\n`;
        }
        response += `\n`;
      });
    }

    return response;
  };

  const formatOptimizationResponse = (data: any): string => {
    if (data.error) return `❌ 优化失败：${data.error}`;
    
    let response = `## 🚀 代码优化结果\n\n`;

    if (data.improvements && data.improvements.length > 0) {
      response += `**改进概述：** ${data.improvements.join(', ')}\n\n`;
    }

    if (data.optimizedCode && data.optimizedCode !== data.originalCode) {
      response += `### ✨ 优化后的代码\n\n\`\`\`${data.language || 'javascript'}\n${data.optimizedCode}\n\`\`\`\n\n`;
    }

    if (data.optimizations && data.optimizations.length > 0) {
      response += `### 🔧 应用的优化\n\n`;
      data.optimizations.forEach((opt: any, index: number) => {
        response += `${index + 1}. **${opt.type}**: ${opt.description}\n`;
      });
      response += `\n`;
    }

    if (data.performanceMetrics) {
      const metrics = data.performanceMetrics.improvements;
      if (metrics.estimatedPerformanceGain > 0) {
        response += `### 📈 性能提升\n\n`;
        response += `- 预计性能提升：${metrics.estimatedPerformanceGain}%\n`;
        if (metrics.linesReduced > 0) {
          response += `- 减少代码行数：${metrics.linesReduced}行\n`;
        }
        if (metrics.complexityReduced > 0) {
          response += `- 降低复杂度：${metrics.complexityReduced}点\n`;
        }
      }
    }

    return response;
  };

  const formatExplanationResponse = (data: any): string => {
    if (data.error) return `❌ 解释失败：${data.error}`;
    
    let response = `## 📚 代码解释\n\n`;

    if (data.explanation) {
      response += `${data.explanation}\n\n`;
    }

    if (data.complexity) {
      const levelEmoji = {
        simple: '🟢',
        moderate: '🟡', 
        complex: '🟠',
        'very complex': '🔴'
      }[data.complexity.level] || '⚪';
      
      response += `### 🎯 复杂度分析\n\n`;
      response += `**复杂度等级：** ${levelEmoji} ${data.complexity.level}\n`;
      response += `**复杂度评分：** ${data.complexity.score}\n\n`;
    }

    if (data.concepts && data.concepts.length > 0) {
      response += `### 💡 涉及的编程概念\n\n`;
      data.concepts.forEach((concept: any) => {
        const importanceEmoji = {
          fundamental: '🌟',
          intermediate: '⭐',
          advanced: '🔥'
        }[concept.importance] || '📌';
        
        response += `${importanceEmoji} **${concept.concept}**: ${concept.description}\n`;
      });
      response += `\n`;
    }

    return response;
  };

  const formatRepositoryResponse = (data: any): string => {
    if (data.error) return `❌ 仓库分析失败：${data.error}`;
    
    let response = `## 📁 仓库分析报告\n\n`;

    if (data.statistics) {
      const stats = data.statistics;
      response += `### 📊 项目统计\n\n`;
      response += `- 文件总数：${stats.totalFiles}\n`;
      response += `- 代码行数：${stats.linesOfCode}\n`;
      response += `- 质量评分：${stats.score}/100\n\n`;

      response += `### 🔍 问题统计\n\n`;
      response += `- 🔴 关键问题：${stats.issues.critical}\n`;
      response += `- 🟠 高级问题：${stats.issues.high}\n`;
      response += `- 🟡 中级问题：${stats.issues.medium}\n`;
      response += `- 🔵 低级问题：${stats.issues.low}\n\n`;
    }

    if (data.summary) {
      response += `### 📝 分析总结\n\n${data.summary}\n\n`;
    }

    if (data.recommendations && data.recommendations.length > 0) {
      response += `### 💡 改进建议\n\n`;
      data.recommendations.forEach((rec: any, index: number) => {
        const priorityEmoji = {
          high: '🔴',
          medium: '🟡',
          low: '🔵'
        }[rec.priority] || '📌';
        
        response += `${index + 1}. ${priorityEmoji} **${rec.title}**\n`;
        response += `   ${rec.description}\n\n`;
      });
    }

    return response;
  };

  const handleSendMessage = async () => {
    const message = chatState.currentInput.trim();
    if (!message && !attachedFile) return;

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: Date.now(),
      metadata: attachedFile ? {
        fileName: attachedFile.name,
      } : undefined,
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      currentInput: '',
      isLoading: true,
    }));

    try {
      let attachedCode = '';
      let fileName = '';

      // 处理附件
      if (attachedFile) {
        fileName = attachedFile.name;
        attachedCode = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(attachedFile);
        });
      }

      // 调用智能聊天API
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: chatState.messages.slice(-10), // 发送最近10条消息作为上下文
          attachedCode: attachedCode || undefined,
          fileName: fileName || undefined,
        }),
      });

      if (!chatResponse.ok) {
        throw new Error(`Chat API failed: ${chatResponse.statusText}`);
      }

      const chatResult = await chatResponse.json();

      // 添加AI助手回复
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: chatResult.response || '抱歉，我现在无法回答你的问题。',
        timestamp: Date.now(),
        metadata: {
          needsAction: chatResult.needsAction,
          suggestedActions: chatResult.suggestedActions,
          detectedLanguage: chatResult.detectedLanguage,
          hasCode: chatResult.hasCode,
          fileName: fileName,
        },
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }));

      // 发送消息后重新聚焦输入框
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `❌ 抱歉，我在处理你的消息时遇到了问题：${error instanceof Error ? error.message : '未知错误'}

让我尝试用其他方式帮助你：

🔍 如果你有代码需要分析，请：
- 直接粘贴代码片段
- 使用 \`\`\`语言\n代码\n\`\`\` 格式
- 或上传代码文件

💬 如果你有编程问题，请：
- 详细描述遇到的问题
- 说明你想实现什么功能
- 提供相关的错误信息

我会尽力帮助你解决问题！`,
        timestamp: Date.now(),
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isLoading: false,
      }));

      // 错误情况下也重新聚焦输入框
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }

    // 清理附件
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const clearChat = () => {
    setChatState(prev => ({
      ...prev,
      messages: prev.messages.slice(0, 1), // 保留第一条欢迎消息
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI代码助手</h1>
            <p className="text-sm text-gray-500">智能代码分析、优化和解释</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center space-x-2 px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm">清空对话</span>
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {chatState.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} space-x-3`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-blue-500' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex-1 ${message.type === 'user' ? 'mr-3' : 'ml-3'}`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                    {message.type === 'user' ? (
                      <div>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.metadata?.fileName && (
                          <div className="mt-2 flex items-center space-x-2 text-blue-100">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">{message.metadata.fileName}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Message Actions */}
                  {message.type === 'assistant' && (
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 rounded"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedMessageId === message.id ? '已复制' : '复制'}</span>
                      </button>
                      <span className="text-xs text-gray-400">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {chatState.isLoading && (
            <div className="flex justify-start">
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Example Prompts */}
      {chatState.messages.length === 1 && (
        <div className="px-4 pb-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-gray-600 mb-3">💡 试试这些示例：</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setChatState(prev => ({ ...prev, currentInput: prompt }))}
                  className="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* File Attachment */}
          {attachedFile && (
            <div className="mb-3 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2 text-blue-700">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">{attachedFile.name}</span>
                <span className="text-xs text-blue-500">({(attachedFile.size / 1024).toFixed(1)}KB)</span>
              </div>
              <button
                onClick={removeAttachedFile}
                className="text-blue-500 hover:text-blue-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input */}
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={chatState.currentInput}
                onChange={(e) => setChatState(prev => ({ ...prev, currentInput: e.target.value }))}
                onKeyPress={handleKeyPress}
                placeholder="输入消息... (支持代码块，Shift+Enter换行)"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
                disabled={chatState.isLoading}
              />
              
              {/* File Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-12 bottom-2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={chatState.isLoading}
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileAttach}
                accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.go,.rs,.php,.rb,.swift,.kt,.txt"
                className="hidden"
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={chatState.isLoading || (!chatState.currentInput.trim() && !attachedFile)}
              className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}