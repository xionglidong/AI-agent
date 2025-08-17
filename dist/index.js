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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const agent_1 = require("./agent");
// import { MCPTools } from './mcp/tools';
const realtimeAnalyzer_1 = require("./services/realtimeAnalyzer");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const config_1 = require("./config");
const logger_1 = __importStar(require("./utils/logger"));
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: config_1.config.allowedOrigins,
    credentials: true,
}));
// Request logging
app.use(logger_1.requestLogger);
// Body parsing
app.use(express_1.default.json({ limit: `${config_1.config.maxFileSizeMB}mb` }));
app.use(express_1.default.urlencoded({ extended: true, limit: `${config_1.config.maxFileSizeMB}mb` }));
// Static files
app.use(express_1.default.static(path.join(__dirname, '../web-dist')));
// Initialize agent
const agentConfig = {
    name: 'CodeReviewAgent',
    description: '智能代码审查与优化助手',
    model: config_1.config.aiModel,
    apiKey: config_1.config.openaiApiKey || config_1.config.anthropicApiKey || '',
    tools: ['filesystem', 'codeAnalyzer', 'securityChecker', 'performanceAnalyzer'],
};
const agent = new agent_1.MastraCodeReviewAgent(agentConfig);
const realtimeAnalyzer = new realtimeAnalyzer_1.RealtimeAnalyzer(agent);
// API Routes
app.post('/api/analyze-code', async (req, res) => {
    try {
        const { code, language, filePath, context } = req.body;
        if (!code || !language) {
            logger_1.default.warn('Code analysis request missing required fields', {
                hasCode: !!code,
                hasLanguage: !!language
            });
            return res.status(400).json({ error: 'Code and language are required' });
        }
        logger_1.default.info('Starting code analysis', {
            language,
            filePath,
            codeLength: code.length
        });
        const result = await agent.analyzeCode({
            code,
            language,
            filePath,
            context,
        });
        logger_1.default.info('Code analysis completed', {
            score: result.score,
            issuesFound: result.issues.length
        });
        res.json(result);
    }
    catch (error) {
        logger_1.default.error('Error analyzing code:', error);
        res.status(500).json({ error: 'Failed to analyze code' });
    }
});
app.post('/api/review-repository', async (req, res) => {
    try {
        const { repoPath } = req.body;
        if (!repoPath) {
            return res.status(400).json({ error: 'Repository path is required' });
        }
        // Check if path exists
        if (!(await fs.pathExists(repoPath))) {
            return res.status(400).json({ error: 'Repository path does not exist' });
        }
        const result = await agent.reviewRepository(repoPath);
        res.json(result);
    }
    catch (error) {
        console.error('Error reviewing repository:', error);
        res.status(500).json({ error: 'Failed to review repository' });
    }
});
app.post('/api/optimize-code', async (req, res) => {
    try {
        const { code, language } = req.body;
        if (!code || !language) {
            return res.status(400).json({ error: 'Code and language are required' });
        }
        const optimizedCode = await agent.optimizeCode(code, language);
        res.json({ optimizedCode });
    }
    catch (error) {
        console.error('Error optimizing code:', error);
        res.status(500).json({ error: 'Failed to optimize code' });
    }
});
app.post('/api/explain-code', async (req, res) => {
    try {
        const { code, language } = req.body;
        if (!code || !language) {
            return res.status(400).json({ error: 'Code and language are required' });
        }
        const explanation = await agent.explainCode(code, language);
        res.json({ explanation });
    }
    catch (error) {
        console.error('Error explaining code:', error);
        res.status(500).json({ error: 'Failed to explain code' });
    }
});
app.get('/api/supported-languages', (_req, res) => {
    res.json({
        languages: [
            'javascript',
            'typescript',
            'python',
            'java',
            'cpp',
            'c',
            'go',
            'rust',
            'php',
            'ruby',
            'swift',
            'kotlin',
        ],
    });
});
// Realtime analysis endpoints
app.post('/api/realtime/watch', async (req, res) => {
    try {
        const { path: watchPath } = req.body;
        if (!watchPath) {
            return res.status(400).json({ error: 'Path is required' });
        }
        await realtimeAnalyzer.addWatchPath(watchPath);
        logger_1.default.info('Started watching path', { path: watchPath });
        res.json({ message: 'Watch started', path: watchPath });
    }
    catch (error) {
        logger_1.default.error('Error starting watch:', error);
        res.status(500).json({ error: 'Failed to start watching path' });
    }
});
app.delete('/api/realtime/watch', async (req, res) => {
    try {
        const { path: watchPath } = req.body;
        if (!watchPath) {
            return res.status(400).json({ error: 'Path is required' });
        }
        await realtimeAnalyzer.removeWatchPath(watchPath);
        logger_1.default.info('Stopped watching path', { path: watchPath });
        res.json({ message: 'Watch stopped', path: watchPath });
    }
    catch (error) {
        logger_1.default.error('Error stopping watch:', error);
        res.status(500).json({ error: 'Failed to stop watching path' });
    }
});
app.get('/api/realtime/watched-paths', async (_req, res) => {
    try {
        const paths = await realtimeAnalyzer.getWatchedPaths();
        res.json({ paths });
    }
    catch (error) {
        logger_1.default.error('Error getting watched paths:', error);
        res.status(500).json({ error: 'Failed to get watched paths' });
    }
});
// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        agent: agentConfig.name,
        model: agentConfig.model,
    });
});
// Serve React app for all non-API routes
app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../web-dist/index.html'));
});
// Error handling middleware
app.use((error, _req, res, _next) => {
    logger_1.default.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});
async function startServer() {
    try {
        // Check for required environment variables
        if (!agentConfig.apiKey) {
            logger_1.default.warn('No API key found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.');
        }
        // Start WebSocket server for realtime analysis
        realtimeAnalyzer.startWebSocketServer(config_1.config.port + 1);
        app.listen(config_1.config.port, () => {
            logger_1.default.info('🚀 Code Review AI Agent server started', {
                port: config_1.config.port,
                wsPort: config_1.config.port + 1,
                agent: agentConfig.name,
                model: agentConfig.model,
                environment: config_1.config.nodeEnv,
                dashboard: `http://localhost:${config_1.config.port}`,
                websocket: `ws://localhost:${config_1.config.port + 1}`,
            });
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Handle graceful shutdown
process.on('SIGINT', async () => {
    logger_1.default.info('🛑 Shutting down gracefully...');
    await realtimeAnalyzer.stop();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    logger_1.default.info('🛑 Shutting down gracefully...');
    await realtimeAnalyzer.stop();
    process.exit(0);
});
if (require.main === module) {
    startServer();
}
exports.default = app;
//# sourceMappingURL=index.js.map