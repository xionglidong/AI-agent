import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Code, Shield, Zap, FileText,
  XCircle, Lightbulb,
  Upload, Search, GitBranch
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface CodeReviewIssue {
  type: 'security' | 'performance' | 'style' | 'bug' | 'suggestion';
  severity: 'low' | 'medium' | 'high' | 'critical';
  line?: number;
  message: string;
  suggestion?: string;
}

// interface CodeReviewResponse {
//   issues: CodeReviewIssue[];
//   score: number;
//   summary: string;
//   optimizedCode?: string;
// }

interface AnalysisResult {
  type: 'code-review' | 'repository-review' | 'code-optimization' | 'code-explanation';
  data: any;
  timestamp: number;
}

const SEVERITY_COLORS = {
  critical: 'text-red-600 bg-red-100',
  high: 'text-orange-600 bg-orange-100',
  medium: 'text-yellow-600 bg-yellow-100',
  low: 'text-blue-600 bg-blue-100',
};

const TYPE_ICONS = {
  security: <Shield className="w-4 h-4" />,
  performance: <Zap className="w-4 h-4" />,
  style: <Code className="w-4 h-4" />,
  bug: <XCircle className="w-4 h-4" />,
  suggestion: <Lightbulb className="w-4 h-4" />,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'analyze' | 'repository' | 'optimize' | 'explain'>('analyze');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [repoPath, setRepoPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch supported languages
    fetch('/api/supported-languages')
      .then(res => res.json())
      .then(data => setSupportedLanguages(data.languages))
      .catch(console.error);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCode(e.target?.result as string);
        // Detect language from file extension
        const ext = file.name.split('.').pop()?.toLowerCase();
        const languageMap: Record<string, string> = {
          'js': 'javascript',
          'jsx': 'javascript',
          'ts': 'typescript',
          'tsx': 'typescript',
          'py': 'python',
          'java': 'java',
          'cpp': 'cpp',
          'c': 'c',
          'go': 'go',
          'rs': 'rust',
          'php': 'php',
          'rb': 'ruby',
          'swift': 'swift',
          'kt': 'kotlin',
        };
        if (ext && languageMap[ext]) {
          setLanguage(languageMap[ext]);
        }
      };
      reader.readAsText(file);
    }
  };

  const analyzeCode = async () => {
    if (!code.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/analyze-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze code');
      }
      
      const result = await response.json();
      setResults(prev => [{
        type: 'code-review',
        data: result,
        timestamp: Date.now(),
      }, ...prev]);
    } catch (error) {
      console.error('Error analyzing code:', error);
      alert('Failed to analyze code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reviewRepository = async () => {
    if (!repoPath.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/review-repository', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to review repository');
      }
      
      const result = await response.json();
      setResults(prev => [{
        type: 'repository-review',
        data: result,
        timestamp: Date.now(),
      }, ...prev]);
    } catch (error) {
      console.error('Error reviewing repository:', error);
      alert('Failed to review repository. Please check the path and try again.');
    } finally {
      setLoading(false);
    }
  };

  const optimizeCode = async () => {
    if (!code.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/optimize-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to optimize code');
      }
      
      const result = await response.json();
      setResults(prev => [{
        type: 'code-optimization',
        data: result,
        timestamp: Date.now(),
      }, ...prev]);
    } catch (error) {
      console.error('Error optimizing code:', error);
      alert('Failed to optimize code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const explainCode = async () => {
    if (!code.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/explain-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to explain code');
      }
      
      const result = await response.json();
      setResults(prev => [{
        type: 'code-explanation',
        data: result,
        timestamp: Date.now(),
      }, ...prev]);
    } catch (error) {
      console.error('Error explaining code:', error);
      alert('Failed to explain code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderIssues = (issues: CodeReviewIssue[]) => {
    return (
      <div className="space-y-2">
        {issues.map((issue, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${SEVERITY_COLORS[issue.severity]}`}
          >
            <div className="flex items-start gap-2">
              {TYPE_ICONS[issue.type]}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{issue.type}</span>
                  <span className="text-xs px-2 py-1 rounded bg-white/50">
                    {issue.severity}
                  </span>
                  {issue.line && (
                    <span className="text-xs px-2 py-1 rounded bg-white/50">
                      Line {issue.line}
                    </span>
                  )}
                </div>
                <p className="text-sm mb-1">{issue.message}</p>
                {issue.suggestion && (
                  <p className="text-xs italic opacity-80">{issue.suggestion}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderResults = () => {
    return results.map((result, index) => (
      <div key={index} className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">
            {new Date(result.timestamp).toLocaleString()}
          </span>
          <span className="text-sm font-medium text-gray-800">
            {result.type.replace('-', ' ').toUpperCase()}
          </span>
        </div>

        {result.type === 'code-review' && (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {result.data.score}
                </span>
                <span className="text-sm text-gray-600">/ 100</span>
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${result.data.score}%` }}
                ></div>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Summary</h3>
              <div className="text-sm text-gray-700">
                <ReactMarkdown>
                  {result.data.summary}
                </ReactMarkdown>
              </div>
            </div>

            {result.data.issues.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Issues Found ({result.data.issues.length})</h3>
                {renderIssues(result.data.issues)}
              </div>
            )}

            {result.data.optimizedCode && (
              <div>
                <h3 className="text-lg font-medium mb-2">Optimized Code</h3>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{result.data.optimizedCode}</code>
                </pre>
              </div>
            )}
          </div>
        )}

        {result.type === 'repository-review' && (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">
                  {Math.round(result.data.overallScore)}
                </span>
                <span className="text-sm text-gray-600">/ 100</span>
              </div>
              <div className="text-sm text-gray-600">
                {result.data.fileReviews.length} files reviewed
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Repository Summary</h3>
              <div className="text-sm text-gray-700">
                <ReactMarkdown>
                  {result.data.summary}
                </ReactMarkdown>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">File Reviews</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {result.data.fileReviews.map((fileReview: any, idx: number) => (
                  <div key={idx} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{fileReview.filePath}</span>
                      <span className="text-sm text-gray-600">Score: {fileReview.review.score}</span>
                    </div>
                    {fileReview.review.issues.length > 0 && (
                      <div className="text-xs text-gray-600">
                        {fileReview.review.issues.length} issues found
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {result.type === 'code-optimization' && (
          <div>
            <h3 className="text-lg font-medium mb-2">Optimized Code</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{result.data.optimizedCode}</code>
            </pre>
          </div>
        )}

        {result.type === 'code-explanation' && (
          <div>
            <h3 className="text-lg font-medium mb-2">Code Explanation</h3>
            <div className="prose max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {result.data.explanation}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-t-4 border-gradient-to-r from-blue-500 to-purple-600">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">AI Code Review Agent</h1>
                <p className="text-gray-600">智能代码审查与优化助手 - 基于Mastra框架</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>在线</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'analyze', label: '代码分析', icon: <Search className="w-4 h-4" /> },
              { id: 'repository', label: '仓库审查', icon: <GitBranch className="w-4 h-4" /> },
              { id: 'optimize', label: '代码优化', icon: <Zap className="w-4 h-4" /> },
              { id: 'explain', label: '代码解释', icon: <FileText className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">输入</h2>

            {(activeTab === 'analyze' || activeTab === 'optimize' || activeTab === 'explain') && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {supportedLanguages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    <Upload className="w-4 h-4" />
                    上传文件
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.go,.rs,.php,.rb,.swift,.kt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="在此输入或粘贴代码..."
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex gap-2 mt-4">
                  {activeTab === 'analyze' && (
                    <button
                      onClick={analyzeCode}
                      disabled={loading || !code.trim()}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      分析代码
                    </button>
                  )}

                  {activeTab === 'optimize' && (
                    <button
                      onClick={optimizeCode}
                      disabled={loading || !code.trim()}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      优化代码
                    </button>
                  )}

                  {activeTab === 'explain' && (
                    <button
                      onClick={explainCode}
                      disabled={loading || !code.trim()}
                      className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      解释代码
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'repository' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  仓库路径
                </label>
                <input
                  type="text"
                  value={repoPath}
                  onChange={(e) => setRepoPath(e.target.value)}
                  placeholder="/path/to/your/repository"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <button
                  onClick={reviewRepository}
                  disabled={loading || !repoPath.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium mt-4"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <GitBranch className="w-4 h-4" />
                  )}
                  审查仓库
                </button>
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">结果</h2>
              {results.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    共 {results.length} 项分析结果
                  </span>
                  <button
                    onClick={() => setResults([])}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    清空
                  </button>
                </div>
              )}
            </div>
            
            {results.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>还没有分析结果</p>
                <p className="text-sm">选择一个功能开始使用</p>
                <div className="mt-6 grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Search className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-600">代码分析</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Zap className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-600">代码优化</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-4">
                {renderResults()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}