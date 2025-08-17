import * as fs from 'fs-extra';
export declare class MCPTools {
    private client;
    init(): Promise<void>;
    listFiles(dirPath: string, extensions?: string[]): Promise<string[]>;
    readFile(filePath: string): Promise<string>;
    writeFile(filePath: string, content: string): Promise<void>;
    exists(filePath: string): Promise<boolean>;
    getFileStats(filePath: string): Promise<fs.Stats | null>;
    searchInFiles(dirPath: string, searchTerm: string, fileExtensions?: string[]): Promise<Array<{
        file: string;
        line: number;
        content: string;
        match: string;
    }>>;
    createBackup(filePath: string): Promise<string>;
    applyCodeFix(filePath: string, lineNumber: number, originalCode: string, fixedCode: string): Promise<void>;
    executeCommand(command: string, cwd?: string): Promise<{
        stdout: string;
        stderr: string;
        code: number;
    }>;
    installDependencies(packagePath: string): Promise<void>;
    runTests(projectPath: string): Promise<{
        success: boolean;
        output: string;
    }>;
    lintCode(projectPath: string): Promise<{
        success: boolean;
        output: string;
    }>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=tools.d.ts.map