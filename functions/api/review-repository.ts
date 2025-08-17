// Repository review endpoint for Cloudflare Workers
export const onRequestPost: PagesFunction<{
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
}> = async (context) => {
  try {
    const { repositoryPath, includeTests } = await context.request.json();
    
    if (!repositoryPath) {
      return new Response(
        JSON.stringify({ error: 'Repository path is required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 模拟仓库分析结果（在实际环境中，这里会分析仓库文件）
    const analysisResult = await analyzeRepository(repositoryPath, includeTests, context.env);

    return new Response(JSON.stringify(analysisResult), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};

async function analyzeRepository(repositoryPath: string, includeTests: boolean, env: any) {
  const apiKey = env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY;
  
  // 模拟仓库结构分析
  const mockFiles = [
    'src/index.js',
    'src/components/App.jsx',
    'src/utils/helpers.js',
    'package.json',
    'README.md'
  ];

  if (includeTests) {
    mockFiles.push('tests/app.test.js', 'tests/helpers.test.js');
  }

  const issues = [];
  let totalScore = 100;

  // 模拟文件分析
  for (const file of mockFiles) {
    const fileIssues = analyzeFile(file);
    issues.push(...fileIssues);
    
    // 根据问题严重程度扣分
    for (const issue of fileIssues) {
      switch (issue.severity) {
        case 'critical': totalScore -= 15; break;
        case 'high': totalScore -= 10; break;
        case 'medium': totalScore -= 5; break;
        case 'low': totalScore -= 2; break;
      }
    }
  }

  totalScore = Math.max(0, totalScore);

  // 生成统计信息
  const statistics = {
    totalFiles: mockFiles.length,
    linesOfCode: mockFiles.length * 150, // 模拟代码行数
    issues: {
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
    },
    score: totalScore,
  };

  // AI分析总结
  let summary = `仓库 "${repositoryPath}" 分析完成。`;
  if (apiKey) {
    try {
      summary = await getAIRepositorySummary(repositoryPath, statistics, issues, apiKey);
    } catch (error) {
      summary += ' AI分析暂时不可用，显示基础分析结果。';
    }
  } else {
    summary += ' 设置API密钥以获取AI驱动的深度分析。';
  }

  return {
    repositoryPath,
    issues,
    statistics,
    summary,
    recommendations: generateRecommendations(statistics, issues),
    timestamp: new Date().toISOString(),
  };
}

function analyzeFile(filePath: string) {
  const issues = [];
  const fileName = filePath.split('/').pop() || '';

  // 根据文件类型生成不同的问题
  if (fileName.endsWith('.js') || fileName.endsWith('.jsx') || fileName.endsWith('.ts') || fileName.endsWith('.tsx')) {
    // JavaScript/TypeScript 文件分析
    if (Math.random() > 0.7) {
      issues.push({
        type: 'style',
        severity: 'low',
        file: filePath,
        line: Math.floor(Math.random() * 50) + 1,
        message: '缺少类型注释',
        suggestion: '添加TypeScript类型注释以提高代码可维护性',
      });
    }

    if (Math.random() > 0.8) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        file: filePath,
        line: Math.floor(Math.random() * 50) + 1,
        message: '可能存在性能瓶颈',
        suggestion: '考虑使用React.memo或useMemo优化渲染性能',
      });
    }

    if (Math.random() > 0.9) {
      issues.push({
        type: 'security',
        severity: 'high',
        file: filePath,
        line: Math.floor(Math.random() * 50) + 1,
        message: '潜在的XSS漏洞',
        suggestion: '对用户输入进行适当的转义和验证',
      });
    }
  }

  if (fileName === 'package.json') {
    if (Math.random() > 0.6) {
      issues.push({
        type: 'security',
        severity: 'medium',
        file: filePath,
        message: '发现过时的依赖包',
        suggestion: '更新依赖包到最新版本以修复已知安全漏洞',
      });
    }
  }

  if (fileName === 'README.md') {
    if (Math.random() > 0.5) {
      issues.push({
        type: 'suggestion',
        severity: 'low',
        file: filePath,
        message: '文档可以更详细',
        suggestion: '添加安装说明、使用示例和API文档',
      });
    }
  }

  return issues;
}

function generateRecommendations(statistics: any, issues: any[]) {
  const recommendations = [];

  if (statistics.issues.critical > 0) {
    recommendations.push({
      priority: 'high',
      title: '立即修复关键问题',
      description: `发现 ${statistics.issues.critical} 个关键问题，建议立即处理以避免安全风险。`,
    });
  }

  if (statistics.issues.security > 0) {
    recommendations.push({
      priority: 'high',
      title: '安全审查',
      description: '建议进行全面的安全审查，特别关注用户输入验证和权限控制。',
    });
  }

  if (statistics.score < 70) {
    recommendations.push({
      priority: 'medium',
      title: '代码质量提升',
      description: '当前代码质量分数较低，建议重构关键模块并增加单元测试。',
    });
  }

  if (!issues.some(i => i.file?.includes('test'))) {
    recommendations.push({
      priority: 'medium',
      title: '增加测试覆盖率',
      description: '建议添加单元测试和集成测试以提高代码可靠性。',
    });
  }

  recommendations.push({
    priority: 'low',
    title: '持续集成',
    description: '建议配置CI/CD流水线，自动化代码检查和部署流程。',
  });

  return recommendations;
}

async function getAIRepositorySummary(repositoryPath: string, statistics: any, issues: any[], apiKey: string): Promise<string> {
  try {
    const prompt = `请分析以下仓库的代码质量报告：

仓库路径: ${repositoryPath}
文件总数: ${statistics.totalFiles}
代码行数: ${statistics.linesOfCode}
质量分数: ${statistics.score}/100

问题统计:
- 关键问题: ${statistics.issues.critical}
- 高级问题: ${statistics.issues.high}  
- 中级问题: ${statistics.issues.medium}
- 低级问题: ${statistics.issues.low}

主要问题类型: ${issues.slice(0, 3).map(i => i.message).join(', ')}

请提供一个简洁的分析总结和改进建议（200字以内）。`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的代码审查专家，能够分析代码质量并提供改进建议。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error('AI API request failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '仓库分析完成，请查看详细报告。';
  } catch (error) {
    return '仓库分析完成，AI分析暂时不可用。';
  }
}
