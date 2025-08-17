# 🔌 MCP (Model Context Protocol) 在本项目中的使用分析

## 🎯 什么是MCP？

**MCP (Model Context Protocol)** 是一个标准化协议，用于AI模型与外部工具和资源的交互。它提供了一种统一的方式让AI模型访问文件系统、执行命令、调用API等外部功能。

## 📦 项目中的MCP集成

### **1. MCP SDK依赖**
```json
// package.json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.3"
  }
}
```

### **2. MCP工具类实现**
位置：`src/mcp/tools.ts`

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class MCPTools {
  private client: Client | null = null;

  async init() {
    // 初始化MCP客户端
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
}
```

## 🛠️ MCP提供的具体功能

### **1. 文件系统操作**

#### **📁 文件列表功能**
```typescript
async listFiles(dirPath: string, extensions: string[] = []): Promise<string[]> {
  const patterns = extensions.length > 0 
    ? extensions.map(ext => `${dirPath}/**/*${ext}`)
    : [`${dirPath}/**/*`];
  
  let files: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, { nodir: true });
    files = files.concat(matches);
  }
  
  // 过滤掉node_modules, .git等目录
  return [...new Set(files)].filter(file => 
    !file.includes('node_modules') &&
    !file.includes('.git') &&
    !file.includes('dist') &&
    !file.includes('build')
  );
}
```

#### **📖 文件读取功能**
```typescript
async readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}
```

#### **✏️ 文件写入功能**
```typescript
async writeFile(filePath: string, content: string): Promise<void> {
  try {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
}
```

#### **🔍 文件存在检查**
```typescript
async exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
```

### **2. 代码搜索功能**

```typescript
async searchInFiles(
  dirPath: string, 
  searchTerm: string, 
  fileExtensions: string[] = []
): Promise<Array<{
  file: string;
  line: number;
  content: string;
  match: string;
}>> {
  const files = await this.listFiles(dirPath, fileExtensions);
  const results = [];

  for (const file of files) {
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

  return results;
}
```

### **3. 代码修复功能**

```typescript
async applyCodeFix(
  filePath: string, 
  lineNumber: number, 
  originalCode: string, 
  fixedCode: string
): Promise<void> {
  // 先创建备份
  await this.createBackup(filePath);
  
  const content = await this.readFile(filePath);
  const lines = content.split('\\n');
  
  // 查找并替换指定行
  if (lineNumber > 0 && lineNumber <= lines.length) {
    lines[lineNumber - 1] = lines[lineNumber - 1].replace(originalCode, fixedCode);
    await this.writeFile(filePath, lines.join('\\n'));
  }
}

async createBackup(filePath: string): Promise<string> {
  const backupPath = `${filePath}.backup.${Date.now()}`;
  await fs.copy(filePath, backupPath);
  return backupPath;
}
```

### **4. 命令执行功能**

```typescript
async executeCommand(
  command: string, 
  cwd?: string
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    const [cmd, ...args] = command.split(' ');
    
    const childProcess = spawn(cmd, args, {
      cwd: cwd || process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    childProcess.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    childProcess.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    childProcess.on('close', (code: number) => {
      resolve({ stdout, stderr, code });
    });
  });
}
```

### **5. 项目管理功能**

#### **📦 依赖安装**
```typescript
async installDependencies(packagePath: string): Promise<void> {
  const packageJsonPath = path.join(packagePath, 'package.json');
  if (await this.exists(packageJsonPath)) {
    const result = await this.executeCommand('npm install', packagePath);
    if (result.code !== 0) {
      throw new Error(`npm install failed: ${result.stderr}`);
    }
  }
}
```

#### **🧪 测试运行**
```typescript
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
```

#### **🔍 代码检查**
```typescript
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
```

## 🔗 在Agent中的实际使用

### **1. Agent中的MCP集成**
```typescript
// src/agent.ts
export class MastraCodeReviewAgent {
  private mcpTools: MCPTools;

  constructor(config: AgentConfig) {
    this.mcpTools = new MCPTools();
    // 其他初始化...
  }
}
```

### **2. 仓库审查中的应用**
```typescript
async reviewRepository(repoPath: string): Promise<{
  overallScore: number;
  fileReviews: Array<{ filePath: string; review: CodeReviewResponse }>;
  summary: string;
}> {
  // 使用MCP工具扫描仓库文件
  const files = await this.mcpTools.listFiles(repoPath, ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c']);
  
  const fileReviews: Array<{ filePath: string; review: CodeReviewResponse }> = [];

  for (const filePath of files) {
    try {
      // 使用MCP读取文件内容
      const content = await this.mcpTools.readFile(filePath);
      const language = this.detectLanguage(filePath);
      
      // 分析代码
      const review = await this.analyzeCode({
        code: content,
        language,
        filePath,
      });

      fileReviews.push({ filePath, review });
    } catch (error) {
      console.error(`Error reviewing file ${filePath}:`, error);
    }
  }

  // 计算整体评分和生成总结...
  return {
    overallScore,
    fileReviews,
    summary,
  };
}
```

## 🎯 MCP的核心作用

### **1. 标准化文件操作**
- ✅ **统一接口**：提供标准化的文件系统访问方式
- ✅ **错误处理**：统一的错误处理和日志记录
- ✅ **安全性**：受控的文件访问权限

### **2. 命令执行能力**
- 🔧 **npm命令**：安装依赖、运行测试、代码检查
- 📊 **Git操作**：虽然定义了但主要通过文件操作实现
- 🛠️ **构建工具**：支持各种构建和开发工具

### **3. 代码自动修复**
- 🔄 **备份机制**：修改前自动创建备份
- ✏️ **精确修改**：基于行号的精确代码替换
- 🛡️ **安全操作**：确保文件完整性

### **4. 项目分析支持**
- 📁 **文件遍历**：智能过滤和文件类型识别
- 🔍 **内容搜索**：跨文件的代码搜索功能
- 📊 **统计分析**：文件统计和项目结构分析

## 🚀 MCP vs 直接文件操作的优势

### **❌ 直接操作方式**：
```typescript
// 分散的文件操作，难以管理
import * as fs from 'fs';
import * as path from 'path';

// 需要手动处理错误、权限、路径等
const content = fs.readFileSync(filePath, 'utf-8');
```

### **✅ MCP标准化方式**：
```typescript
// 统一的接口，标准化的错误处理
const content = await this.mcpTools.readFile(filePath);
```

## 🎉 总结

**MCP在本项目中的核心价值**：

### **🔧 功能层面**：
- **文件系统操作**：读取、写入、列表、搜索
- **命令执行**：npm、测试、linting
- **代码修复**：自动化的代码修改和备份
- **项目管理**：依赖安装、测试运行

### **🏗️ 架构层面**：
- **标准化接口**：统一的工具访问方式
- **错误处理**：完善的异常处理机制
- **安全性**：受控的文件和命令访问
- **可扩展性**：易于添加新的工具和功能

### **🎯 实际应用**：
- **仓库分析**：扫描和分析整个代码库
- **代码审查**：自动化的代码质量检查
- **文件操作**：安全的文件读写和修改
- **项目维护**：依赖管理和测试执行

**MCP让本项目的AI Agent具备了真正的"动手能力"**，不仅能分析代码，还能实际操作文件系统、执行命令、修复代码，成为了一个完整的智能代码助手！🎯✨
