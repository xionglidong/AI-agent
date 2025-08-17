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
export declare class MastraCodeReviewAgent {
    private config;
    private mcpTools;
    private codeAnalyzer;
    private securityChecker;
    private performanceAnalyzer;
    private advancedAnalyzer;
    private mastraIntegration;
    constructor(config: AgentConfig);
    private getModel;
    analyzeCode(request: CodeReviewRequest): Promise<CodeReviewResponse>;
    private generateAssessment;
    private calculateScore;
    reviewRepository(repoPath: string): Promise<{
        summary: string;
        fileReviews: Array<{
            filePath: string;
            review: CodeReviewResponse;
        }>;
        overallScore: number;
    }>;
    private generateRepositorySummary;
    private detectLanguage;
    optimizeCode(code: string, language: string): Promise<string>;
    explainCode(code: string, language: string): Promise<string>;
    /**
     * Execute a Mastra workflow for comprehensive code analysis
     */
    executeWorkflow(workflowId: string, data: any): Promise<any>;
    /**
     * Get available Mastra tools
     */
    getAvailableTools(): string[];
    /**
     * Get available Mastra workflows
     */
    getAvailableWorkflows(): string[];
    /**
     * Execute a specific Mastra tool
     */
    executeMastraTool(toolName: string, parameters: any): Promise<any>;
    /**
     * Get Mastra integration statistics
     */
    getMastraStatistics(): any;
    /**
     * Create a custom workflow for specific analysis needs
     */
    createCustomWorkflow(workflow: any): void;
    /**
     * Comprehensive analysis using Mastra workflow
     */
    comprehensiveAnalysis(code: string, language: string, filePath?: string): Promise<any>;
    /**
     * Security-focused analysis using Mastra workflow
     */
    securityAudit(code: string, language: string, filePath?: string): Promise<any>;
    /**
     * 智能聊天处理 - 核心对话功能
     */
    handleChat(message: string, conversationHistory?: any[], attachedCode?: string, fileName?: string): Promise<any>;
    private buildChatContext;
    private generateChatResponse;
    private analyzeChatIntent;
    private extractCodeFromMessage;
}
//# sourceMappingURL=agent.d.ts.map