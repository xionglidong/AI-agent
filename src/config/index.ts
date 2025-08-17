import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export interface AppConfig {
  // Server
  port: number;
  nodeEnv: string;
  
  // AI Configuration
  aiModel: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  
  // Security
  sessionSecret: string;
  jwtSecret: string;
  
  // CORS
  allowedOrigins: string[];
  
  // Logging
  logLevel: string;
  logFile: string;
  
  // Code Analysis
  maxFileSizeMB: number;
  maxRepositoryFiles: number;
  analysisTimeoutMs: number;
  
  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  
  // Cache
  cacheTtlSeconds: number;
  redisUrl?: string;
}

function validateConfig(): AppConfig {
  const config: AppConfig = {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    
    aiModel: process.env.AI_MODEL || 'gpt-4',
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    
    sessionSecret: process.env.SESSION_SECRET || 'default-session-secret',
    jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret',
    
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(','),
    
    logLevel: process.env.LOG_LEVEL || 'info',
    logFile: process.env.LOG_FILE || 'logs/app.log',
    
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '10'),
    maxRepositoryFiles: parseInt(process.env.MAX_REPOSITORY_FILES || '1000'),
    analysisTimeoutMs: parseInt(process.env.ANALYSIS_TIMEOUT_MS || '30000'),
    
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    
    cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '3600'),
    redisUrl: process.env.REDIS_URL,
  };

  // Validate required fields
  if (!config.openaiApiKey && !config.anthropicApiKey) {
    console.warn('Warning: No AI API key provided. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.');
  }

  if (config.nodeEnv === 'production') {
    if (config.sessionSecret === 'default-session-secret') {
      throw new Error('SESSION_SECRET must be set in production');
    }
    if (config.jwtSecret === 'default-jwt-secret') {
      throw new Error('JWT_SECRET must be set in production');
    }
  }

  return config;
}

export const config = validateConfig();

export default config;
