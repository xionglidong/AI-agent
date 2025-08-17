export interface CodeIssue {
    type: 'security' | 'performance' | 'style' | 'bug' | 'suggestion';
    severity: 'low' | 'medium' | 'high' | 'critical';
    line?: number;
    message: string;
    suggestion?: string;
}
export declare class CodeAnalyzer {
    analyze(code: string, language: string): Promise<CodeIssue[]>;
    private checkSyntax;
    private checkNaming;
    private checkComplexity;
    private checkBestPractices;
}
//# sourceMappingURL=codeAnalyzer.d.ts.map