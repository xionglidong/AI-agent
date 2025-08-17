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
const integration_1 = require("./mastra/integration");
class MastraCodeReviewAgent {
    constructor(config) {
        this.config = config;
        this.mcpTools = new tools_1.MCPTools();
        this.codeAnalyzer = new codeAnalyzer_1.CodeAnalyzer();
        this.securityChecker = new securityChecker_1.SecurityChecker();
        this.performanceAnalyzer = new performanceAnalyzer_1.PerformanceAnalyzer();
        this.advancedAnalyzer = new advancedAnalyzer_1.AdvancedAnalyzer();
        this.mastraIntegration = new integration_1.MastraIntegration();
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
        this.mastraIntegration.createWorkflow(workflow);
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
}
exports.MastraCodeReviewAgent = MastraCodeReviewAgent;
//# sourceMappingURL=agent.js.map