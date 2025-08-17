import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { MCPTools } from './mcp/tools';
import { CodeAnalyzer } from './analyzer/codeAnalyzer';
import { SecurityChecker } from './analyzer/securityChecker';
import { PerformanceAnalyzer } from './analyzer/performanceAnalyzer';
import { AdvancedAnalyzer } from './analyzer/advancedAnalyzer';
import { MastraIntegration } from './mastra/integration';

export interface AgentConfig {
  name: string;
  description: string;
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-sonnet' | 'claude-3-haiku';
  apiKey: string;
  tools: string[];
}

export interface CodeReviewRequest {
  code: string;
  language: string;
  filePath?: string;
  context?: string;
}

export interface CodeReviewResponse {
  issues: Array<{
    type: 'security' | 'performance' | 'style' | 'bug' | 'suggestion';
    severity: 'low' | 'medium' | 'high' | 'critical';
    line?: number;
    message: string;
    suggestion?: string;
  }>;
  score: number;
  summary: string;
  optimizedCode?: string;
}

export class MastraCodeReviewAgent {
  private config: AgentConfig;
  private mcpTools: MCPTools;
  private codeAnalyzer: CodeAnalyzer;
  private securityChecker: SecurityChecker;
  private performanceAnalyzer: PerformanceAnalyzer;
  private advancedAnalyzer: AdvancedAnalyzer;
  private mastraIntegration: MastraIntegration;

  constructor(config: AgentConfig) {
    this.config = config;
    this.mcpTools = new MCPTools();
    this.codeAnalyzer = new CodeAnalyzer();
    this.securityChecker = new SecurityChecker();
    this.performanceAnalyzer = new PerformanceAnalyzer();
    this.advancedAnalyzer = new AdvancedAnalyzer();
    this.mastraIntegration = new MastraIntegration();
  }

  private getModel() {
    if (this.config.model.startsWith('gpt')) {
      const openai = createOpenAI({
        apiKey: this.config.apiKey,
      });
      return openai(this.config.model as any);
    } else if (this.config.model.startsWith('claude')) {
      const anthropic = createAnthropic({
        apiKey: this.config.apiKey,
      });
      return anthropic(this.config.model as any);
    }
    throw new Error(`Unsupported model: ${this.config.model}`);
  }

  async analyzeCode(request: CodeReviewRequest): Promise<CodeReviewResponse> {
    const { code, language, context } = request;

    // Run multiple analyzers in parallel
    const [syntaxIssues, securityIssues, performanceIssues, advancedIssues] = await Promise.all([
      this.codeAnalyzer.analyze(code, language),
      this.securityChecker.checkSecurity(code, language),
      this.performanceAnalyzer.analyzePerformance(code, language),
      this.advancedAnalyzer.analyzeAdvanced(code, language),
    ]);

    // Combine all issues
    const allIssues = [...syntaxIssues, ...securityIssues, ...performanceIssues, ...advancedIssues];

    // Use AI to generate overall assessment
    const assessment = await this.generateAssessment(code, language, allIssues, context);

    return {
      issues: allIssues,
      score: this.calculateScore(allIssues),
      summary: assessment.summary,
      optimizedCode: assessment.optimizedCode,
    };
  }

  private async generateAssessment(
    code: string,
    language: string,
    issues: CodeReviewResponse['issues'],
    context?: string
  ) {
    const model = this.getModel();

    const prompt = `You are a senior code reviewer. Analyze this ${language} code and provide:
1. A comprehensive summary of the code quality
2. Optimized version of the code (if improvements are possible)

Code:
\`\`\`${language}
${code}
\`\`\`

Detected Issues:
${issues.map(issue => `- ${issue.type} (${issue.severity}): ${issue.message}`).join('\\n')}

${context ? `Context: ${context}` : ''}

Provide your analysis focusing on code quality, maintainability, and best practices.`;

    const result = await generateObject({
      model,
      schema: z.object({
        summary: z.string().describe('Comprehensive summary of code quality and recommendations'),
        optimizedCode: z.string().optional().describe('Improved version of the code if optimizations are possible'),
        additionalSuggestions: z.array(z.string()).describe('Additional suggestions for improvement'),
      }),
      prompt,
    });

    return result.object;
  }

  private calculateScore(issues: CodeReviewResponse['issues']): number {
    let score = 100;
    
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    }

    return Math.max(0, score);
  }

  async reviewRepository(repoPath: string): Promise<{
    summary: string;
    fileReviews: Array<{
      filePath: string;
      review: CodeReviewResponse;
    }>;
    overallScore: number;
  }> {
    // Use MCP tools to scan repository
    const files = await this.mcpTools.listFiles(repoPath, ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c']);
    
    const fileReviews: Array<{ filePath: string; review: CodeReviewResponse }> = [];
    
    for (const filePath of files) {
      try {
        const content = await this.mcpTools.readFile(filePath);
        const language = this.detectLanguage(filePath);
        
        const review = await this.analyzeCode({
          code: content,
          language,
          filePath,
        });
        
        fileReviews.push({ filePath, review });
      } catch (error) {
        console.error(`Error reviewing file ${filePath}:`, error);
      }
    }

    const overallScore = fileReviews.reduce((acc, { review }) => acc + review.score, 0) / fileReviews.length;
    
    const summary = await this.generateRepositorySummary(fileReviews);

    return {
      summary,
      fileReviews,
      overallScore,
    };
  }

  private async generateRepositorySummary(fileReviews: Array<{ filePath: string; review: CodeReviewResponse }>) {
    const model = this.getModel();

    const allIssues = fileReviews.flatMap(({ review }) => review.issues);
    const criticalIssues = allIssues.filter(issue => issue.severity === 'critical').length;
    const highIssues = allIssues.filter(issue => issue.severity === 'high').length;

    const prompt = `Generate a comprehensive repository code review summary based on the following data:

Total files reviewed: ${fileReviews.length}
Critical issues: ${criticalIssues}
High severity issues: ${highIssues}
Total issues: ${allIssues.length}

Top issues by type:
${Object.entries(
  allIssues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
).map(([type, count]) => `- ${type}: ${count}`).join('\\n')}

Provide actionable recommendations for improving the codebase.`;

    const result = await generateText({
      model,
      prompt,
    });

    return result.text;
  }

  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
    };
    
    return languageMap[ext || ''] || 'text';
  }

  async optimizeCode(code: string, language: string): Promise<string> {
    const model = this.getModel();

    const result = await generateText({
      model,
      prompt: `Optimize this ${language} code for better performance, readability, and maintainability:

\`\`\`${language}
${code}
\`\`\`

Return only the optimized code without explanations.`,
    });

    return result.text;
  }

  async explainCode(code: string, language: string): Promise<string> {
    const model = this.getModel();

    const result = await generateText({
      model,
      prompt: `Explain what this ${language} code does in a clear and concise way:

\`\`\`${language}
${code}
\`\`\`

Include:
1. Main purpose and functionality
2. Key components and their roles
3. Input/output behavior
4. Any notable patterns or techniques used`,
    });

    return result.text;
  }

  // Mastra Integration Methods

  /**
   * Execute a Mastra workflow for comprehensive code analysis
   */
  async executeWorkflow(workflowId: string, data: any): Promise<any> {
    return await this.mastraIntegration.executeWorkflow(workflowId, data);
  }

  /**
   * Get available Mastra tools
   */
  getAvailableTools(): string[] {
    return this.mastraIntegration.listTools();
  }

  /**
   * Get available Mastra workflows
   */
  getAvailableWorkflows(): string[] {
    return this.mastraIntegration.listWorkflows();
  }

  /**
   * Execute a specific Mastra tool
   */
  async executeMastraTool(toolName: string, parameters: any): Promise<any> {
    return await this.mastraIntegration.executeTool(toolName, parameters);
  }

  /**
   * Get Mastra integration statistics
   */
  getMastraStatistics(): any {
    return this.mastraIntegration.getToolStatistics();
  }

  /**
   * Create a custom workflow for specific analysis needs
   */
  createCustomWorkflow(workflow: any): void {
    this.mastraIntegration.createWorkflow(workflow);
  }

  /**
   * Comprehensive analysis using Mastra workflow
   */
  async comprehensiveAnalysis(code: string, language: string, filePath?: string): Promise<any> {
    return await this.mastraIntegration.executeWorkflow('comprehensive_review', {
      code,
      language,
      filePath,
    });
  }

  /**
   * Security-focused analysis using Mastra workflow
   */
  async securityAudit(code: string, language: string, filePath?: string): Promise<any> {
    return await this.mastraIntegration.executeWorkflow('security_audit', {
      code,
      language,
      filePath,
    });
  }

  /**
   * 智能聊天处理 - 核心对话功能
   */
  async handleChat(
    message: string, 
    conversationHistory: any[] = [], 
    attachedCode?: string, 
    fileName?: string
  ): Promise<any> {
    try {
      if (!this.config.apiKey) {
        return {
          response: `我理解你的问题："${message}"

不过目前没有配置AI API密钥，我只能提供基础的代码分析功能。要获得完整的AI对话体验，请在环境变量中设置 OPENAI_API_KEY 或 ANTHROPIC_API_KEY。

我仍然可以帮你：
- 分析代码语法和风格问题
- 检测基础的安全风险  
- 提供编程最佳实践建议

请分享你的代码，我来为你分析！`,
          needsAction: false,
          suggestedActions: ['analyze', 'explain']
        };
      }

      // 构建智能对话上下文
      const context = this.buildChatContext(message, conversationHistory, attachedCode, fileName);
      
      // 调用AI模型进行对话
      const aiResponse = await this.generateChatResponse(context);
      
      // 智能分析是否需要执行特定操作
      const analysis = this.analyzeChatIntent(message, aiResponse, attachedCode);
      
      return {
        response: aiResponse,
        needsAction: analysis.needsAction,
        suggestedActions: analysis.suggestedActions,
        detectedLanguage: analysis.detectedLanguage,
        hasCode: !!attachedCode || this.extractCodeFromMessage(message) !== null,
      };
    } catch (error) {
      console.error('Error in handleChat:', error);
      return {
        response: `抱歉，我在处理你的请求时遇到了问题。让我尝试用其他方式帮助你：

如果你有代码需要分析，请直接分享，我会检查：
- 语法和风格问题
- 潜在的性能问题
- 安全风险
- 改进建议

如果你有编程问题，我也会尽力解答！有什么具体的代码问题吗？`,
        needsAction: false,
        suggestedActions: ['analyze', 'explain'],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private buildChatContext(
    message: string, 
    history: any[], 
    attachedCode?: string, 
    fileName?: string
  ): string {
    let context = `你是一个专业且友好的AI代码助手。你的特长包括：

🔍 **代码分析**: 检测语法错误、代码风格、性能问题
🚀 **代码优化**: 提供重构建议和性能改进方案  
📚 **代码解释**: 详细解释代码逻辑和编程概念
🛡️ **安全审查**: 识别安全漏洞和风险
📁 **项目审查**: 分析项目结构和整体质量

请用友好、专业且易懂的语气回答。当用户提供代码时，主动给出具体的分析和建议。

对话历史：`;

    // 添加最近的对话历史（最多10轮）
    const recentHistory = history.slice(-20);
    for (const msg of recentHistory) {
      if (msg.type === 'user') {
        context += `\n用户: ${msg.content}`;
      } else if (msg.type === 'assistant') {
        context += `\n助手: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}`;
      }
    }

    // 添加当前消息
    context += `\n\n当前用户消息: ${message}`;

    // 添加附加的代码
    if (attachedCode) {
      context += `\n\n[用户上传了代码文件${fileName ? `: ${fileName}` : ''}]\n\`\`\`\n${attachedCode.substring(0, 1000)}${attachedCode.length > 1000 ? '\n...(代码已截断)' : ''}\n\`\`\``;
    }

    // 检测消息中的代码块
    const codeInMessage = this.extractCodeFromMessage(message);
    if (codeInMessage && !attachedCode) {
      context += `\n\n[用户在消息中包含了代码片段]`;
    }

    context += `\n\n请根据用户的问题给出有帮助、具体且实用的回答。如果涉及代码，请提供详细的分析和改进建议。保持回答简洁但全面。`;

    return context;
  }

  private async generateChatResponse(context: string): Promise<string> {
    const model = this.getModel();
    
    const result = await generateText({
      model,
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
      maxTokens: 800,
      temperature: 0.7,
    });

    return result.text || '抱歉，我现在无法处理你的请求。';
  }

  private analyzeChatIntent(message: string, aiResponse: string, attachedCode?: string): any {
    const lowerMessage = message.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();
    
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

    let detectedLanguage = 'javascript';
    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      if (pattern.test(lowerMessage) || pattern.test(lowerResponse)) {
        detectedLanguage = lang;
        break;
      }
    }

    // 分析是否需要特定操作
    const needsAction = (
      /\b(分析|检查|review|analyze|问题|bug|错误)\b/.test(lowerMessage) ||
      /\b(优化|optimize|性能|performance|改进|improve)\b/.test(lowerMessage) ||
      /\b(解释|explain|理解|understand|学习|learn)\b/.test(lowerMessage) ||
      /\b(项目|仓库|repository|repo|全面|整体)\b/.test(lowerMessage) ||
      !!attachedCode
    );

    // 建议的操作
    const suggestedActions: string[] = [];
    if (/\b(分析|检查|review|analyze)\b/.test(lowerMessage + ' ' + lowerResponse)) {
      suggestedActions.push('analyze');
    }
    if (/\b(优化|optimize|性能|performance)\b/.test(lowerMessage + ' ' + lowerResponse)) {
      suggestedActions.push('optimize');
    }
    if (/\b(解释|explain|理解|understand)\b/.test(lowerMessage + ' ' + lowerResponse)) {
      suggestedActions.push('explain');
    }
    if (/\b(项目|仓库|repository|repo)\b/.test(lowerMessage + ' ' + lowerResponse)) {
      suggestedActions.push('repository');
    }

    return {
      needsAction,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : ['analyze'],
      detectedLanguage,
    };
  }

  private extractCodeFromMessage(message: string): { code: string; language: string } | null {
    // 提取代码块
    const codeBlockMatch = message.match(/```(\w+)?\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      return {
        code: codeBlockMatch[2],
        language: codeBlockMatch[1] || 'javascript'
      };
    }

    // 提取行内代码（如果足够长）
    const inlineCodeMatch = message.match(/`([^`]+)`/);
    if (inlineCodeMatch && inlineCodeMatch[1].length > 20) {
      return {
        code: inlineCodeMatch[1],
        language: 'javascript'
      };
    }

    return null;
  }
}