export interface AppConfig {
    port: number;
    nodeEnv: string;
    aiModel: string;
    openaiApiKey?: string;
    anthropicApiKey?: string;
    sessionSecret: string;
    jwtSecret: string;
    allowedOrigins: string[];
    logLevel: string;
    logFile: string;
    maxFileSizeMB: number;
    maxRepositoryFiles: number;
    analysisTimeoutMs: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    cacheTtlSeconds: number;
    redisUrl?: string;
}
export declare const config: AppConfig;
export default config;
//# sourceMappingURL=index.d.ts.map