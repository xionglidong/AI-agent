"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MastraCodeReviewAgent = void 0;
const openai_1 = require("@ai-sdk/openai");
const anthropic_1 = require("@ai-sdk/anthropic");
const ai_1 = require("ai");
const zod_1 = require("zod");
const tools_1 = require("./mcp/tools");
const codeAnalyzer_1 = require("./analyzer/codeAnalyzer");
const securityChecker_1 = require("./analyzer/securityChecker");
const performanceAnalyzer_1 = require("./analyzer/performanceAnalyzer");
const advancedAnalyzer_1 = require("./analyzer/advancedAnalyzer");
const simplifiedIntegration_1 = require("./mastra/simplifiedIntegration");
class MastraCodeReviewAgent {
    constructor(config) {
        this.config = config;
        this.mcpTools = new tools_1.MCPTools();
        this.codeAnalyzer = new codeAnalyzer_1.CodeAnalyzer();
        this.securityChecker = new securityChecker_1.SecurityChecker();
        this.performanceAnalyzer = new performanceAnalyzer_1.PerformanceAnalyzer();
        this.advancedAnalyzer = new advancedAnalyzer_1.AdvancedAnalyzer();
        this.mastraIntegration = new simplifiedIntegration_1.SimplifiedMastraIntegration();
    }
    getModel() {
        if (this.config.model.startsWith('gpt')) {
            const openai = (0, openai_1.createOpenAI)({
                apiKey: this.config.apiKey,
            });
            return openai(this.config.model);
        }
        else if (this.config.model.startsWith('claude')) {
            const anthropic = (0, anthropic_1.createAnthropic)({
                apiKey: this.config.apiKey,
            });
            return anthropic(this.config.model);
        }
        throw new Error(`Unsupported model: ${this.config.model}`);
    }
    async analyzeCode(request) {
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
    async generateAssessment(code, language, issues, context) {
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
        const result = await (0, ai_1.generateObject)({
            model,
            schema: zod_1.z.object({
                summary: zod_1.z.string().describe('Comprehensive summary of code quality and recommendations'),
                optimizedCode: zod_1.z.string().optional().describe('Improved version of the code if optimizations are possible'),
                additionalSuggestions: zod_1.z.array(zod_1.z.string()).describe('Additional suggestions for improvement'),
            }),
            prompt,
        });
        return result.object;
    }
    calculateScore(issues) {
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
    async reviewRepository(repoPath) {
        // Use MCP tools to scan repository
        const files = await this.mcpTools.listFiles(repoPath, ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c']);
        const fileReviews = [];
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
            }
            catch (error) {
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
    async generateRepositorySummary(fileReviews) {
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
${Object.entries(allIssues.reduce((acc, issue) => {
            acc[issue.type] = (acc[issue.type] || 0) + 1;
            return acc;
        }, {})).map(([type, count]) => `- ${type}: ${count}`).join('\\n')}

Provide actionable recommendations for improving the codebase.`;
        const result = await (0, ai_1.generateText)({
            model,
            prompt,
        });
        return result.text;
    }
    detectLanguage(filePath) {
        const ext = filePath.split('.').pop()?.toLowerCase();
        const languageMap = {
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
    async optimizeCode(code, language) {
        const model = this.getModel();
        const result = await (0, ai_1.generateText)({
            model,
            prompt: `Optimize this ${language} code for better performance, readability, and maintainability:

\`\`\`${language}
${code}
\`\`\`

Return only the optimized code without explanations.`,
        });
        return result.text;
    }
    async explainCode(code, language) {
        const model = this.getModel();
        const result = await (0, ai_1.generateText)({
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
    async executeWorkflow(workflowId, data) {
        return await this.mastraIntegration.executeWorkflow(workflowId, data);
    }
    /**
     * Get available Mastra tools
     */
    getAvailableTools() {
        return this.mastraIntegration.listTools();
    }
    /**
     * Get available Mastra workflows
     */
    getAvailableWorkflows() {
        return this.mastraIntegration.listWorkflows();
    }
    /**
     * Execute a specific Mastra tool
     */
    async executeMastraTool(toolName, parameters) {
        return await this.mastraIntegration.executeTool(toolName, parameters);
    }
    /**
     * Get Mastra integration statistics
     */
    getMastraStatistics() {
        return this.mastraIntegration.getToolStatistics();
    }
    /**
     * Create a custom workflow for specific analysis needs
     */
    createCustomWorkflow(workflow) {
        this.mastraIntegration.createCustomWorkflow(workflow);
    }
    /**
     * Comprehensive analysis using Mastra workflow
     */
    async comprehensiveAnalysis(code, language, filePath) {
        return await this.mastraIntegration.executeWorkflow('comprehensive_review', {
            code,
            language,
            filePath,
        });
    }
    /**
     * Security-focused analysis using Mastra workflow
     */
    async securityAudit(code, language, filePath) {
        return await this.mastraIntegration.executeWorkflow('security_audit', {
            code,
            language,
            filePath,
        });
    }
    /**
     * 智能聊天处理 - 核心对话功能
     */
    async handleChat(message, conversationHistory = [], attachedCode, fileName) {
        try {
            if (!this.config.apiKey) {
                // 即使没有API密钥，也尝试提供基本的回复
                return this.handleBasicChat(message, attachedCode);
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
        }
        catch (error) {
            console.error('Error in handleChat:', error);
            // 如果没有API密钥，尝试基础聊天
            if (!this.config.apiKey) {
                return this.handleBasicChat(message, attachedCode);
            }
            // 如果有API密钥但出现错误，则抛出异常让上层处理
            throw error;
        }
    }
    buildChatContext(message, history, attachedCode, fileName) {
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

对话历史：`;
        // 添加最近的对话历史（最多10轮）
        const recentHistory = history.slice(-20);
        for (const msg of recentHistory) {
            if (msg.type === 'user') {
                context += `\n用户: ${msg.content}`;
            }
            else if (msg.type === 'assistant') {
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
    async generateChatResponse(context) {
        const model = this.getModel();
        const result = await (0, ai_1.generateText)({
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
    analyzeChatIntent(message, aiResponse, attachedCode) {
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
        const needsAction = (/\b(分析|检查|review|analyze|问题|bug|错误)\b/.test(lowerMessage) ||
            /\b(优化|optimize|性能|performance|改进|improve)\b/.test(lowerMessage) ||
            /\b(解释|explain|理解|understand|学习|learn)\b/.test(lowerMessage) ||
            /\b(项目|仓库|repository|repo|全面|整体)\b/.test(lowerMessage) ||
            !!attachedCode);
        // 建议的操作
        const suggestedActions = [];
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
    extractCodeFromMessage(message) {
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
    /**
     * 基础聊天处理 - 无需API密钥的简单对话
     */
    handleBasicChat(message, attachedCode) {
        return {
            response: `你好！我是你的AI编程助手。

目前我在**基础模式**下运行（未配置AI API密钥），但仍然可以帮你：

🔍 **代码分析**：检查语法、风格、基础安全问题
📚 **编程指导**：提供学习建议和最佳实践
💡 **问题解答**：回答编程相关的基础问题

要获得**完整的智能对话体验**（包括自然对话、深度代码分析等），请设置 \`OPENAI_API_KEY\` 或 \`ANTHROPIC_API_KEY\` 环境变量。

${attachedCode ? '我看到你上传了代码，' : ''}有什么我可以帮你的吗？可以：
- 分享代码让我分析
- 询问编程问题
- 寻求学习建议

让我们开始吧！😊`,
            needsAction: attachedCode ? true : false,
            suggestedActions: attachedCode ? ['analyze', 'optimize'] : ['analyze', 'explain']
        };
    }
}
exports.MastraCodeReviewAgent = MastraCodeReviewAgent;
//# sourceMappingURL=agent.js.map