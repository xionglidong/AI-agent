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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeAnalyzer = void 0;
const chokidar_1 = __importDefault(require("chokidar"));
const ws_1 = __importStar(require("ws"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = require("../config");
class RealtimeAnalyzer {
    constructor(agent) {
        this.watcher = null;
        this.wsServer = null;
        this.watchedPaths = new Set();
        this.analysisQueue = new Map();
        this.agent = agent;
    }
    startWebSocketServer(port = 8080) {
        this.wsServer = new ws_1.WebSocketServer({ port });
        this.wsServer.on('connection', (ws) => {
            logger_1.default.info('WebSocket client connected');
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    await this.handleWebSocketMessage(ws, data);
                }
                catch (error) {
                    logger_1.default.error('WebSocket message error:', error);
                    ws.send(JSON.stringify({ error: 'Invalid message format' }));
                }
            });
            ws.on('close', () => {
                logger_1.default.info('WebSocket client disconnected');
            });
            ws.on('error', (error) => {
                logger_1.default.error('WebSocket error:', error);
            });
        });
        logger_1.default.info(`WebSocket server started on port ${port}`);
    }
    async handleWebSocketMessage(ws, data) {
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
    async addWatchPath(watchPath) {
        if (this.watchedPaths.has(watchPath)) {
            return;
        }
        if (!this.watcher) {
            this.initializeWatcher();
        }
        // Check if path exists
        if (!(await fs_extra_1.default.pathExists(watchPath))) {
            throw new Error(`Path does not exist: ${watchPath}`);
        }
        this.watchedPaths.add(watchPath);
        this.watcher.add(watchPath);
        logger_1.default.info(`Started watching: ${watchPath}`);
    }
    async removeWatchPath(watchPath) {
        if (!this.watchedPaths.has(watchPath) || !this.watcher) {
            return;
        }
        this.watchedPaths.delete(watchPath);
        this.watcher.unwatch(watchPath);
        logger_1.default.info(`Stopped watching: ${watchPath}`);
    }
    initializeWatcher() {
        if (this.watcher) {
            return;
        }
        this.watcher = chokidar_1.default.watch([], {
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
            logger_1.default.error('File watcher error:', error);
        });
        logger_1.default.info('File watcher initialized');
    }
    async handleFileChange(filePath, changeType) {
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
                logger_1.default.info(`File ${changeType}: ${filePath}`);
                if (changeType !== 'deleted') {
                    const result = await this.analyzeFile(filePath);
                    this.broadcastAnalysisResult({
                        filePath,
                        analysis: result,
                        timestamp: Date.now(),
                        changeType,
                    });
                }
                else {
                    this.broadcastAnalysisResult({
                        filePath,
                        analysis: null,
                        timestamp: Date.now(),
                        changeType,
                    });
                }
            }
            catch (error) {
                logger_1.default.error(`Error analyzing file ${filePath}:`, error);
            }
            finally {
                this.analysisQueue.delete(filePath);
            }
        }, 2000); // 2 second debounce
        this.analysisQueue.set(filePath, timeout);
    }
    isCodeFile(filePath) {
        const codeExtensions = [
            '.js', '.jsx', '.ts', '.tsx',
            '.py', '.java', '.cpp', '.c', '.cc',
            '.go', '.rs', '.php', '.rb',
            '.swift', '.kt', '.cs', '.scala',
            '.vue', '.svelte', '.html', '.css',
            '.json', '.yaml', '.yml', '.xml',
        ];
        const ext = path_1.default.extname(filePath).toLowerCase();
        return codeExtensions.includes(ext);
    }
    async analyzeFile(filePath) {
        try {
            // Check file size
            const stats = await fs_extra_1.default.stat(filePath);
            const fileSizeMB = stats.size / (1024 * 1024);
            if (fileSizeMB > config_1.config.maxFileSizeMB) {
                throw new Error(`File too large: ${fileSizeMB.toFixed(2)}MB (max: ${config_1.config.maxFileSizeMB}MB)`);
            }
            const content = await fs_extra_1.default.readFile(filePath, 'utf-8');
            const language = this.detectLanguage(filePath);
            const analysis = await this.agent.analyzeCode({
                code: content,
                language,
                filePath,
            });
            return analysis;
        }
        catch (error) {
            logger_1.default.error(`Error analyzing file ${filePath}:`, error);
            throw error;
        }
    }
    detectLanguage(filePath) {
        const ext = path_1.default.extname(filePath).toLowerCase();
        const languageMap = {
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
    broadcastAnalysisResult(result) {
        if (!this.wsServer) {
            return;
        }
        const message = JSON.stringify({
            type: 'realtime_analysis',
            result,
        });
        this.wsServer.clients.forEach((client) => {
            if (client.readyState === ws_1.default.OPEN) {
                client.send(message);
            }
        });
        logger_1.default.info(`Broadcasted analysis result for: ${result.filePath}`);
    }
    async getWatchedPaths() {
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
        logger_1.default.info('Realtime analyzer stopped');
    }
}
exports.RealtimeAnalyzer = RealtimeAnalyzer;
//# sourceMappingURL=realtimeAnalyzer.js.map