import chokidar from 'chokidar';
import WebSocket from 'ws';
import path from 'path';
import fs from 'fs-extra';
import { MastraCodeReviewAgent } from '../agent';
import logger from '../utils/logger';
import { config } from '../config';

export interface RealtimeAnalysisResult {
  filePath: string;
  analysis: any;
  timestamp: number;
  changeType: 'added' | 'changed' | 'deleted';
}

export class RealtimeAnalyzer {
  private watcher: chokidar.FSWatcher | null = null;
  private wsServer: WebSocket.Server | null = null;
  private agent: MastraCodeReviewAgent;
  private watchedPaths: Set<string> = new Set();
  private analysisQueue: Map<string, NodeJS.Timeout> = new Map();

  constructor(agent: MastraCodeReviewAgent) {
    this.agent = agent;
  }

  startWebSocketServer(port: number = 8080) {
    this.wsServer = new WebSocket.Server({ port });
    
    this.wsServer.on('connection', (ws) => {
      logger.info('WebSocket client connected');
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleWebSocketMessage(ws, data);
        } catch (error) {
          logger.error('WebSocket message error:', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });
    });

    logger.info(`WebSocket server started on port ${port}`);
  }

  private async handleWebSocketMessage(ws: WebSocket, data: any) {
    switch (data.type) {
      case 'watch':
        if (data.path) {
          await this.addWatchPath(data.path);
          ws.send(JSON.stringify({ 
            type: 'watch_started', 
            path: data.path 
          }));
        }
        break;

      case 'unwatch':
        if (data.path) {
          await this.removeWatchPath(data.path);
          ws.send(JSON.stringify({ 
            type: 'watch_stopped', 
            path: data.path 
          }));
        }
        break;

      case 'analyze_file':
        if (data.filePath) {
          const result = await this.analyzeFile(data.filePath);
          ws.send(JSON.stringify({
            type: 'analysis_result',
            result
          }));
        }
        break;

      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  async addWatchPath(watchPath: string) {
    if (this.watchedPaths.has(watchPath)) {
      return;
    }

    if (!this.watcher) {
      this.initializeWatcher();
    }

    // Check if path exists
    if (!(await fs.pathExists(watchPath))) {
      throw new Error(`Path does not exist: ${watchPath}`);
    }

    this.watchedPaths.add(watchPath);
    this.watcher!.add(watchPath);
    
    logger.info(`Started watching: ${watchPath}`);
  }

  async removeWatchPath(watchPath: string) {
    if (!this.watchedPaths.has(watchPath) || !this.watcher) {
      return;
    }

    this.watchedPaths.delete(watchPath);
    this.watcher.unwatch(watchPath);
    
    logger.info(`Stopped watching: ${watchPath}`);
  }

  private initializeWatcher() {
    if (this.watcher) {
      return;
    }

    this.watcher = chokidar.watch([], {
      ignored: [
        /node_modules/,
        /\.git/,
        /dist/,
        /build/,
        /coverage/,
        /\.DS_Store/,
        /\.env/,
        /\.log$/,
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100,
      },
    });

    this.watcher
      .on('add', (filePath) => this.handleFileChange(filePath, 'added'))
      .on('change', (filePath) => this.handleFileChange(filePath, 'changed'))
      .on('unlink', (filePath) => this.handleFileChange(filePath, 'deleted'))
      .on('error', (error) => {
        logger.error('File watcher error:', error);
      });

    logger.info('File watcher initialized');
  }

  private async handleFileChange(filePath: string, changeType: 'added' | 'changed' | 'deleted') {
    // Only analyze code files
    if (!this.isCodeFile(filePath)) {
      return;
    }

    // Debounce rapid changes
    const existingTimeout = this.analysisQueue.get(filePath);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(async () => {
      try {
        logger.info(`File ${changeType}: ${filePath}`);
        
        if (changeType !== 'deleted') {
          const result = await this.analyzeFile(filePath);
          this.broadcastAnalysisResult({
            filePath,
            analysis: result,
            timestamp: Date.now(),
            changeType,
          });
        } else {
          this.broadcastAnalysisResult({
            filePath,
            analysis: null,
            timestamp: Date.now(),
            changeType,
          });
        }
      } catch (error) {
        logger.error(`Error analyzing file ${filePath}:`, error);
      } finally {
        this.analysisQueue.delete(filePath);
      }
    }, 2000); // 2 second debounce

    this.analysisQueue.set(filePath, timeout);
  }

  private isCodeFile(filePath: string): boolean {
    const codeExtensions = [
      '.js', '.jsx', '.ts', '.tsx',
      '.py', '.java', '.cpp', '.c', '.cc',
      '.go', '.rs', '.php', '.rb',
      '.swift', '.kt', '.cs', '.scala',
      '.vue', '.svelte', '.html', '.css',
      '.json', '.yaml', '.yml', '.xml',
    ];

    const ext = path.extname(filePath).toLowerCase();
    return codeExtensions.includes(ext);
  }

  private async analyzeFile(filePath: string) {
    try {
      // Check file size
      const stats = await fs.stat(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      if (fileSizeMB > config.maxFileSizeMB) {
        throw new Error(`File too large: ${fileSizeMB.toFixed(2)}MB (max: ${config.maxFileSizeMB}MB)`);
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const language = this.detectLanguage(filePath);

      const analysis = await this.agent.analyzeCode({
        code: content,
        language,
        filePath,
      });

      return analysis;
    } catch (error) {
      logger.error(`Error analyzing file ${filePath}:`, error);
      throw error;
    }
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cc': 'cpp',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.cs': 'csharp',
      '.scala': 'scala',
      '.vue': 'javascript',
      '.svelte': 'javascript',
      '.html': 'html',
      '.css': 'css',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.xml': 'xml',
    };

    return languageMap[ext] || 'text';
  }

  private broadcastAnalysisResult(result: RealtimeAnalysisResult) {
    if (!this.wsServer) {
      return;
    }

    const message = JSON.stringify({
      type: 'realtime_analysis',
      result,
    });

    this.wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    logger.info(`Broadcasted analysis result for: ${result.filePath}`);
  }

  async getWatchedPaths(): Promise<string[]> {
    return Array.from(this.watchedPaths);
  }

  async stop() {
    // Clear all pending analysis
    this.analysisQueue.forEach((timeout) => clearTimeout(timeout));
    this.analysisQueue.clear();

    // Stop file watcher
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    // Close WebSocket server
    if (this.wsServer) {
      this.wsServer.close();
      this.wsServer = null;
    }

    this.watchedPaths.clear();
    logger.info('Realtime analyzer stopped');
  }
}
