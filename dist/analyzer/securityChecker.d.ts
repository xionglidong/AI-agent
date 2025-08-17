import { CodeIssue } from './codeAnalyzer';
export declare class SecurityChecker {
    checkSecurity(code: string, language: string): Promise<CodeIssue[]>;
    private checkInjectionVulnerabilities;
    private checkCryptographicIssues;
    private checkAuthenticationIssues;
    private checkDataExposure;
    private checkInsecureDependencies;
}
//# sourceMappingURL=securityChecker.d.ts.map