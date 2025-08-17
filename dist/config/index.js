"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
function validateConfig() {
    const config = {
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
exports.config = validateConfig();
exports.default = exports.config;
//# sourceMappingURL=index.js.map