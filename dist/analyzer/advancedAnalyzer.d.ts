import { CodeIssue } from './codeAnalyzer';
export declare class AdvancedAnalyzer {
    analyzeAdvanced(code: string, language: string): Promise<CodeIssue[]>;
    private checkDesignPatterns;
    private checkCodeSmells;
    private checkMaintainability;
    private checkTestability;
    private checkDocumentation;
    private extractClassContent;
}
//# sourceMappingURL=advancedAnalyzer.d.ts.map