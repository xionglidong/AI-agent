import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { MastraCodeReviewAgent, AgentConfig } from './agent';
// import { MCPTools } from './mcp/tools';
import { RealtimeAnalyzer } from './services/realtimeAnalyzer';
import * as path from 'path';
import * as fs from 'fs-extra';
import { config } from './config';
import logger, { requestLogger } from './utils/logger';

const app = express();

// Security middleware
app.use(helmet({
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
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
}));

// Request logging
app.use(requestLogger);

// Body parsing
app.use(express.json({ limit: `${config.maxFileSizeMB}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${config.maxFileSizeMB}mb` }));

// Static files
app.use(express.static(path.join(__dirname, '../web-dist')));

// Initialize agent
const agentConfig: AgentConfig = {
  name: 'CodeReviewAgent',
  description: '智能代码审查与优化助手',
  model: config.aiModel as any,
  apiKey: config.openaiApiKey || config.anthropicApiKey || '',
  tools: ['filesystem', 'codeAnalyzer', 'securityChecker', 'performanceAnalyzer'],
};

const agent = new MastraCodeReviewAgent(agentConfig);
const realtimeAnalyzer = new RealtimeAnalyzer(agent);

// API Routes
app.post('/api/analyze-code', async (req, res) => {
  try {
    const { code, language, filePath, context } = req.body;
    
    if (!code || !language) {
      logger.warn('Code analysis request missing required fields', { 
        hasCode: !!code, 
        hasLanguage: !!language 
      });
      return res.status(400).json({ error: 'Code and language are required' });
    }

    logger.info('Starting code analysis', { 
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

    logger.info('Code analysis completed', { 
      score: result.score, 
      issuesFound: result.issues.length 
    });

    res.json(result);
  } catch (error) {
    logger.error('Error analyzing code:', error);
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    console.error('Error explaining code:', error);
    res.status(500).json({ error: 'Failed to explain code' });
  }
});

// 智能聊天端点
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory, attachedCode, fileName } = req.body;
    
    if (!message) {
      logger.warn('Chat request missing message');
      return res.status(400).json({ error: 'Message is required' });
    }

    logger.info('Processing chat message', { 
      messageLength: message.length,
      hasAttachedCode: !!attachedCode,
      fileName,
      historyLength: conversationHistory?.length || 0
    });

    // 调用Agent的智能聊天方法
    const chatResponse = await agent.handleChat(message, conversationHistory, attachedCode, fileName);
    
    logger.info('Chat response generated', { 
      responseLength: chatResponse.response?.length || 0,
      needsAction: chatResponse.needsAction
    });

    res.json(chatResponse);
  } catch (error) {
    logger.error('Error in chat:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      response: '抱歉，我现在无法处理你的消息。请稍后再试，或者直接分享代码让我分析。'
    });
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
    logger.info('Started watching path', { path: watchPath });
    
    res.json({ message: 'Watch started', path: watchPath });
  } catch (error) {
    logger.error('Error starting watch:', error);
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
    logger.info('Stopped watching path', { path: watchPath });
    
    res.json({ message: 'Watch stopped', path: watchPath });
  } catch (error) {
    logger.error('Error stopping watch:', error);
    res.status(500).json({ error: 'Failed to stop watching path' });
  }
});

app.get('/api/realtime/watched-paths', async (_req, res) => {
  try {
    const paths = await realtimeAnalyzer.getWatchedPaths();
    res.json({ paths });
  } catch (error) {
    logger.error('Error getting watched paths:', error);
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
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  try {
    // Check for required environment variables
    if (!agentConfig.apiKey) {
      logger.warn('No API key found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.');
    }

    // Start WebSocket server for realtime analysis
    realtimeAnalyzer.startWebSocketServer(config.port + 1);

    app.listen(config.port, () => {
      logger.info('🚀 Code Review AI Agent server started', {
        port: config.port,
        wsPort: config.port + 1,
        agent: agentConfig.name,
        model: agentConfig.model,
        environment: config.nodeEnv,
        dashboard: `http://localhost:${config.port}`,
        websocket: `ws://localhost:${config.port + 1}`,
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('🛑 Shutting down gracefully...');
  await realtimeAnalyzer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🛑 Shutting down gracefully...');
  await realtimeAnalyzer.stop();
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

export default app;