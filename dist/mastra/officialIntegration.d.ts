/**
 * Official Mastra Framework Integration
 *
 * This module integrates with the official @mastra/core package to provide
 * AI agent capabilities for code review and analysis.
 */
import { Mastra, Agent, Tool, Workflow } from '@mastra/core';
export declare class OfficialMastraIntegration {
    private mastra;
    private agent;
    private tools;
    private workflows;
    constructor();
    private initializeMastra;
    private initializeAgent;
    private registerTools;
    private registerWorkflows;
    executeTool(toolName: string, parameters: any): Promise<any>;
    executeWorkflow(workflowName: string, triggerData: any): Promise<any>;
    listTools(): string[];
    listWorkflows(): string[];
    getTool(name: string): Tool | undefined;
    getWorkflow(name: string): Workflow | undefined;
    getAgent(): Agent;
    getMastra(): Mastra;
    getToolStatistics(): any;
    createCustomWorkflow(workflowConfig: any): void;
}
//# sourceMappingURL=officialIntegration.d.ts.map