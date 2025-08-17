import { MastraCodeReviewAgent } from '../agent';
export interface RealtimeAnalysisResult {
    filePath: string;
    analysis: any;
    timestamp: number;
    changeType: 'added' | 'changed' | 'deleted';
}
export declare class RealtimeAnalyzer {
    private watcher;
    private wsServer;
    private agent;
    private watchedPaths;
    private analysisQueue;
    constructor(agent: MastraCodeReviewAgent);
    startWebSocketServer(port?: number): void;
    private handleWebSocketMessage;
    addWatchPath(watchPath: string): Promise<void>;
    removeWatchPath(watchPath: string): Promise<void>;
    private initializeWatcher;
    private handleFileChange;
    private isCodeFile;
    private analyzeFile;
    private detectLanguage;
    private broadcastAnalysisResult;
    getWatchedPaths(): Promise<string[]>;
    stop(): Promise<void>;
}
//# sourceMappingURL=realtimeAnalyzer.d.ts.map