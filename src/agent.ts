import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
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
      return openai(this.config.model, {
        apiKey: this.config.apiKey,
      });
    } else if (this.config.model.startsWith('claude')) {
      return anthropic(this.config.model, {
        apiKey: this.config.apiKey,
      });
    }
    throw new Error(`Unsupported model: ${this.config.model}`);
  }

  async analyzeCode(request: CodeReviewRequest): Promise<CodeReviewResponse> {
    const { code, language, filePath, context } = request;

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
}