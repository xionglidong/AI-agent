import { CodeIssue } from './codeAnalyzer';
export declare class PerformanceAnalyzer {
    analyzePerformance(code: string, language: string): Promise<CodeIssue[]>;
    private checkAlgorithmicComplexity;
    private checkMemoryUsage;
    private checkAsyncPatterns;
    private checkDOMOperations;
    private checkDatabaseQueries;
}
//# sourceMappingURL=performanceAnalyzer.d.ts.map