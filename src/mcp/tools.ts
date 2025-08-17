import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';

export class MCPTools {
  private client: Client | null = null;

  async init() {
    // Initialize MCP client
    const transport = new StdioClientTransport({
      command: 'node',
      args: [path.join(__dirname, 'mcp-server.js')],
    });

    this.client = new Client(
      {
        name: 'code-review-agent',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    await this.client.connect(transport);
  }

  async listFiles(dirPath: string, extensions: string[] = []): Promise<string[]> {
    try {
      const patterns = extensions.length > 0 
        ? extensions.map(ext => `${dirPath}/**/*${ext}`)
        : [`${dirPath}/**/*`];
      
      let files: string[] = [];
      for (const pattern of patterns) {
        const matches = await glob(pattern, { nodir: true });
        files = files.concat(matches);
      }
      
      // Remove duplicates and filter out node_modules, .git, etc.
      return [...new Set(files)].filter(file => 
        !file.includes('node_modules') &&
        !file.includes('.git') &&
        !file.includes('dist') &&
        !file.includes('build')
      );
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      throw error;
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
      throw error;
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileStats(filePath: string) {
    try {
      return await fs.stat(filePath);
    } catch (error) {
      console.error(`Error getting stats for ${filePath}:`, error);
      return null;
    }
  }

  async searchInFiles(dirPath: string, searchTerm: string, fileExtensions: string[] = []): Promise<Array<{
    file: string;
    line: number;
    content: string;
    match: string;
  }>> {
    const files = await this.listFiles(dirPath, fileExtensions);
    const results: Array<{
      file: string;
      line: number;
      content: string;
      match: string;
    }> = [];

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
      } catch (error) {
        console.error(`Error searching in file ${file}:`, error);
      }
    }

    return results;
  }

  async createBackup(filePath: string): Promise<string> {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    try {
      await fs.copy(filePath, backupPath);
      return backupPath;
    } catch (error) {
      console.error(`Error creating backup for ${filePath}:`, error);
      throw error;
    }
  }

  async applyCodeFix(filePath: string, lineNumber: number, originalCode: string, fixedCode: string): Promise<void> {
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
    } catch (error) {
      console.error(`Error applying fix to ${filePath}:`, error);
      throw error;
    }
  }

  async executeCommand(command: string, cwd?: string): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const [cmd, ...args] = command.split(' ');
      
      const process = spawn(cmd, args, {
        cwd: cwd || process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      process.on('close', (code: number) => {
        resolve({ stdout, stderr, code });
      });

      process.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  async installDependencies(packagePath: string): Promise<void> {
    const packageJsonPath = path.join(packagePath, 'package.json');
    if (await this.exists(packageJsonPath)) {
      try {
        const result = await this.executeCommand('npm install', packagePath);
        if (result.code !== 0) {
          throw new Error(`npm install failed: ${result.stderr}`);
        }
      } catch (error) {
        console.error('Error installing dependencies:', error);
        throw error;
      }
    }
  }

  async runTests(projectPath: string): Promise<{ success: boolean; output: string }> {
    try {
      const result = await this.executeCommand('npm test', projectPath);
      return {
        success: result.code === 0,
        output: result.stdout + result.stderr,
      };
    } catch (error) {
      return {
        success: false,
        output: `Error running tests: ${error}`,
      };
    }
  }

  async lintCode(projectPath: string): Promise<{ success: boolean; output: string }> {
    try {
      const result = await this.executeCommand('npm run lint', projectPath);
      return {
        success: result.code === 0,
        output: result.stdout + result.stderr,
      };
    } catch (error) {
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