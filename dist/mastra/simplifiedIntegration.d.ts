/**
 * Simplified Official Mastra Framework Integration
 *
 * This module provides a simplified integration with @mastra/core,
 * focusing on the working APIs and core functionality.
 */
import { Mastra } from '@mastra/core';
export declare class SimplifiedMastraIntegration {
    private mastra;
    private tools;
    private toolDefinitions;
    constructor();
    private initializeMastra;
    private createTools;
    executeTool(toolName: string, parameters: any): Promise<any>;
    executeWorkflow(workflowName: string, triggerData: any): Promise<any>;
    private executeComprehensiveReview;
    private executeSecurityAudit;
    private executeRepositoryAnalysis;
    listTools(): string[];
    listWorkflows(): string[];
    getTool(name: string): any;
    getWorkflow(name: string): any;
    getMastra(): Mastra;
    getToolStatistics(): any;
    createCustomWorkflow(workflowConfig: any): void;
}
//# sourceMappingURL=simplifiedIntegration.d.ts.map