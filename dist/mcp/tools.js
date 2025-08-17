"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPTools = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
class MCPTools {
    constructor() {
        this.client = null;
    }
    async init() {
        // Initialize MCP client
        const transport = new stdio_js_1.StdioClientTransport({
            command: 'node',
            args: [path.join(__dirname, 'mcp-server.js')],
        });
        this.client = new index_js_1.Client({
            name: 'code-review-agent',
            version: '1.0.0',
        }, {
            capabilities: {
                resources: {},
                tools: {},
            },
        });
        await this.client.connect(transport);
    }
    async listFiles(dirPath, extensions = []) {
        try {
            const patterns = extensions.length > 0
                ? extensions.map(ext => `${dirPath}/**/*${ext}`)
                : [`${dirPath}/**/*`];
            let files = [];
            for (const pattern of patterns) {
                const matches = await (0, glob_1.glob)(pattern, { nodir: true });
                files = files.concat(matches);
            }
            // Remove duplicates and filter out node_modules, .git, etc.
            return [...new Set(files)].filter(file => !file.includes('node_modules') &&
                !file.includes('.git') &&
                !file.includes('dist') &&
                !file.includes('build'));
        }
        catch (error) {
            console.error('Error listing files:', error);
            return [];
        }
    }
    async readFile(filePath) {
        try {
            return await fs.readFile(filePath, 'utf-8');
        }
        catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            throw error;
        }
    }
    async writeFile(filePath, content) {
        try {
            await fs.ensureDir(path.dirname(filePath));
            await fs.writeFile(filePath, content, 'utf-8');
        }
        catch (error) {
            console.error(`Error writing file ${filePath}:`, error);
            throw error;
        }
    }
    async exists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async getFileStats(filePath) {
        try {
            return await fs.stat(filePath);
        }
        catch (error) {
            console.error(`Error getting stats for ${filePath}:`, error);
            return null;
        }
    }
    async searchInFiles(dirPath, searchTerm, fileExtensions = []) {
        const files = await this.listFiles(dirPath, fileExtensions);
        const results = [];
        for (const file of files) {
            try {
                const content = await this.readFile(file);
                const lines = content.split('\\n');
                lines.forEach((line, index) => {
                    if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
                        results.push({
                            file,
                            line: index + 1,
                            content: line.trim(),
                            match: searchTerm,
                        });
                    }
                });
            }
            catch (error) {
                console.error(`Error searching in file ${file}:`, error);
            }
        }
        return results;
    }
    async createBackup(filePath) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        try {
            await fs.copy(filePath, backupPath);
            return backupPath;
        }
        catch (error) {
            console.error(`Error creating backup for ${filePath}:`, error);
            throw error;
        }
    }
    async applyCodeFix(filePath, lineNumber, originalCode, fixedCode) {
        try {
            // Create backup first
            await this.createBackup(filePath);
            const content = await this.readFile(filePath);
            const lines = content.split('\\n');
            // Find and replace the line
            if (lineNumber > 0 && lineNumber <= lines.length) {
                lines[lineNumber - 1] = lines[lineNumber - 1].replace(originalCode, fixedCode);
                await this.writeFile(filePath, lines.join('\\n'));
            }
        }
        catch (error) {
            console.error(`Error applying fix to ${filePath}:`, error);
            throw error;
        }
    }
    async executeCommand(command, cwd) {
        return new Promise((resolve, reject) => {
            const { spawn } = require('child_process');
            const [cmd, ...args] = command.split(' ');
            const childProcess = spawn(cmd, args, {
                cwd: cwd || process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe'],
            });
            let stdout = '';
            let stderr = '';
            childProcess.stdout?.on('data', (data) => {
                stdout += data.toString();
            });
            childProcess.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
            childProcess.on('close', (code) => {
                resolve({ stdout, stderr, code });
            });
            childProcess.on('error', (error) => {
                reject(error);
            });
        });
    }
    async installDependencies(packagePath) {
        const packageJsonPath = path.join(packagePath, 'package.json');
        if (await this.exists(packageJsonPath)) {
            try {
                const result = await this.executeCommand('npm install', packagePath);
                if (result.code !== 0) {
                    throw new Error(`npm install failed: ${result.stderr}`);
                }
            }
            catch (error) {
                console.error('Error installing dependencies:', error);
                throw error;
            }
        }
    }
    async runTests(projectPath) {
        try {
            const result = await this.executeCommand('npm test', projectPath);
            return {
                success: result.code === 0,
                output: result.stdout + result.stderr,
            };
        }
        catch (error) {
            return {
                success: false,
                output: `Error running tests: ${error}`,
            };
        }
    }
    async lintCode(projectPath) {
        try {
            const result = await this.executeCommand('npm run lint', projectPath);
            return {
                success: result.code === 0,
                output: result.stdout + result.stderr,
            };
        }
        catch (error) {
            return {
                success: false,
                output: `Error running linter: ${error}`,
            };
        }
    }
    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.client = null;
        }
    }
}
exports.MCPTools = MCPTools;
//# sourceMappingURL=tools.js.map