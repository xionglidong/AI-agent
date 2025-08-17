/**
 * Mastra Framework Integration
 *
 * This module provides integration with the Mastra framework for AI agent development.
 * It includes tools, workflows, and utilities for building intelligent code review agents.
 */
import { z } from 'zod';
export declare const MastraToolSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    parameters: z.ZodAny;
    execute: z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    execute: (...args: unknown[]) => unknown;
    parameters?: any;
}, {
    name: string;
    description: string;
    execute: (...args: unknown[]) => unknown;
    parameters?: any;
}>;
export type MastraTool = z.infer<typeof MastraToolSchema>;
export declare const MastraWorkflowSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    steps: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        tool: z.ZodString;
        parameters: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        parameters: {} & {
            [k: string]: unknown;
        };
        tool: string;
    }, {
        name: string;
        id: string;
        parameters: {} & {
            [k: string]: unknown;
        };
        tool: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    id: string;
    steps: {
        name: string;
        id: string;
        parameters: {} & {
            [k: string]: unknown;
        };
        tool: string;
    }[];
}, {
    name: string;
    description: string;
    id: string;
    steps: {
        name: string;
        id: string;
        parameters: {} & {
            [k: string]: unknown;
        };
        tool: string;
    }[];
}>;
export type MastraWorkflow = z.infer<typeof MastraWorkflowSchema>;
/**
 * Mastra Agent Integration Class
 */
export declare class MastraIntegration {
    private tools;
    private workflows;
    constructor();
    /**
     * Initialize default tools for code analysis
     */
    private initializeDefaultTools;
    /**
     * Initialize default workflows for code review
     */
    private initializeDefaultWorkflows;
    /**
     * Register a new tool
     */
    registerTool(tool: MastraTool): void;
    /**
     * Register a new workflow
     */
    registerWorkflow(workflow: MastraWorkflow): void;
    /**
     * Get a tool by name
     */
    getTool(name: string): MastraTool | undefined;
    /**
     * Get a workflow by ID
     */
    getWorkflow(id: string): MastraWorkflow | undefined;
    /**
     * List all available tools
     */
    listTools(): string[];
    /**
     * List all available workflows
     */
    listWorkflows(): string[];
    /**
     * Execute a tool with parameters
     */
    executeTool(toolName: string, parameters: any): Promise<any>;
    /**
     * Execute a workflow
     */
    executeWorkflow(workflowId: string, initialData?: any): Promise<any>;
    /**
     * Create a custom workflow
     */
    createWorkflow(workflow: MastraWorkflow): void;
    /**
     * Get workflow execution status
     */
    getWorkflowStatus(workflowId: string): any;
    /**
     * Get tool usage statistics
     */
    getToolStatistics(): any;
}
//# sourceMappingURL=integration.d.ts.map