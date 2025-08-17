// Code optimization endpoint for Cloudflare Workers
export const onRequestPost: PagesFunction<{
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
}> = async (context) => {
  try {
    const { code, language, optimizationType } = await context.request.json();
    
    if (!code || !language) {
      return new Response(
        JSON.stringify({ error: 'Code and language are required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const optimizationResult = await optimizeCode(code, language, optimizationType, context.env);

    return new Response(JSON.stringify(optimizationResult), {
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

async function optimizeCode(code: string, language: string, optimizationType: string = 'general', env: any) {
  const apiKey = env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY;
  
  // 基础优化（不依赖AI）
  const basicOptimizations = performBasicOptimizations(code, language);
  
  // AI驱动的优化
  let aiOptimizedCode = basicOptimizations.optimizedCode;
  let aiSuggestions: string[] = [];
  
  if (apiKey) {
    try {
      const aiResult = await getAIOptimization(code, language, optimizationType, apiKey);
      aiOptimizedCode = aiResult.optimizedCode || aiOptimizedCode;
      aiSuggestions = aiResult.suggestions || [];
    } catch (error) {
      console.error('AI optimization failed:', error);
    }
  }

  // 性能指标分析
  const performanceMetrics = analyzePerformanceMetrics(code, aiOptimizedCode, language);

  return {
    originalCode: code,
    optimizedCode: aiOptimizedCode,
    optimizations: [
      ...basicOptimizations.optimizations,
      ...aiSuggestions.map(s => ({ type: 'ai-suggestion', description: s }))
    ],
    performanceMetrics,
    improvements: generateImprovementSummary(basicOptimizations, performanceMetrics),
    timestamp: new Date().toISOString(),
  };
}

function performBasicOptimizations(code: string, language: string) {
  let optimizedCode = code;
  const optimizations = [];

  if (language === 'javascript' || language === 'typescript') {
    // 移除console.log
    const consoleLogRegex = /console\.log\([^)]*\);?\n?/g;
    if (consoleLogRegex.test(optimizedCode)) {
      optimizedCode = optimizedCode.replace(consoleLogRegex, '');
      optimizations.push({
        type: 'cleanup',
        description: '移除了调试用的console.log语句'
      });
    }

    // 优化变量声明
    const varRegex = /\bvar\s+/g;
    if (varRegex.test(optimizedCode)) {
      optimizedCode = optimizedCode.replace(varRegex, 'const ');
      optimizations.push({
        type: 'modernization',
        description: '将var声明改为const/let以提高性能和避免作用域问题'
      });
    }

    // 简化条件语句
    const simplifyConditions = /if\s*\(\s*(.+?)\s*===?\s*true\s*\)/g;
    if (simplifyConditions.test(optimizedCode)) {
      optimizedCode = optimizedCode.replace(simplifyConditions, 'if ($1)');
      optimizations.push({
        type: 'simplification',
        description: '简化了布尔条件判断'
      });
    }

    // 优化字符串连接
    const stringConcatRegex = /(\w+)\s*\+=\s*['"`]([^'"`]+)['"`]/g;
    const matches = optimizedCode.match(stringConcatRegex);
    if (matches && matches.length > 2) {
      optimizations.push({
        type: 'performance',
        description: '建议使用模板字符串或数组join()来优化多次字符串连接'
      });
    }
  }

  if (language === 'python') {
    // Python优化
    const listComprehensionRegex = /for\s+\w+\s+in\s+.+:\s*\n\s*.*\.append\(/;
    if (listComprehensionRegex.test(optimizedCode)) {
      optimizations.push({
        type: 'pythonic',
        description: '可以使用列表推导式来简化循环和append操作'
      });
    }

    // 移除不必要的lambda
    const unnecessaryLambda = /lambda\s+x:\s*x\./g;
    if (unnecessaryLambda.test(optimizedCode)) {
      optimizations.push({
        type: 'simplification',
        description: '可以使用operator模块或直接方法调用替换简单的lambda函数'
      });
    }
  }

  return {
    optimizedCode,
    optimizations
  };
}

function analyzePerformanceMetrics(originalCode: string, optimizedCode: string, language: string) {
  const original = {
    lines: originalCode.split('\n').length,
    characters: originalCode.length,
    complexity: estimateComplexity(originalCode, language),
  };

  const optimized = {
    lines: optimizedCode.split('\n').length,
    characters: optimizedCode.length,
    complexity: estimateComplexity(optimizedCode, language),
  };

  return {
    original,
    optimized,
    improvements: {
      linesReduced: original.lines - optimized.lines,
      charactersReduced: original.characters - optimized.characters,
      complexityReduced: original.complexity - optimized.complexity,
      estimatedPerformanceGain: calculatePerformanceGain(original, optimized),
    }
  };
}

function estimateComplexity(code: string, language: string): number {
  let complexity = 1; // 基础复杂度

  // 循环语句增加复杂度
  const loops = (code.match(/\b(for|while|do)\b/g) || []).length;
  complexity += loops * 2;

  // 条件语句增加复杂度
  const conditions = (code.match(/\b(if|else if|switch|case)\b/g) || []).length;
  complexity += conditions;

  // 函数调用增加复杂度
  const functionCalls = (code.match(/\w+\s*\(/g) || []).length;
  complexity += functionCalls * 0.5;

  // 嵌套层级
  const braces = (code.match(/\{/g) || []).length;
  complexity += braces * 0.3;

  return Math.round(complexity);
}

function calculatePerformanceGain(original: any, optimized: any): number {
  const complexityImprovement = (original.complexity - optimized.complexity) / original.complexity;
  const sizeImprovement = (original.characters - optimized.characters) / original.characters;
  
  return Math.max(0, Math.round((complexityImprovement * 0.7 + sizeImprovement * 0.3) * 100));
}

function generateImprovementSummary(basicOptimizations: any, performanceMetrics: any) {
  const improvements = [];

  if (performanceMetrics.improvements.linesReduced > 0) {
    improvements.push(`减少了 ${performanceMetrics.improvements.linesReduced} 行代码`);
  }

  if (performanceMetrics.improvements.complexityReduced > 0) {
    improvements.push(`降低了 ${performanceMetrics.improvements.complexityReduced} 点复杂度`);
  }

  if (performanceMetrics.improvements.estimatedPerformanceGain > 0) {
    improvements.push(`预计性能提升 ${performanceMetrics.improvements.estimatedPerformanceGain}%`);
  }

  if (basicOptimizations.optimizations.length > 0) {
    improvements.push(`应用了 ${basicOptimizations.optimizations.length} 项基础优化`);
  }

  return improvements.length > 0 ? improvements : ['代码已经相当优化，只有少量改进空间'];
}

async function getAIOptimization(code: string, language: string, optimizationType: string, apiKey: string) {
  try {
    const optimizationPrompts = {
      performance: '专注于性能优化，包括算法复杂度、内存使用和执行效率',
      readability: '专注于代码可读性，包括命名、结构和注释',
      security: '专注于安全性，包括输入验证、权限检查和漏洞修复',
      general: '进行全面的代码优化，平衡性能、可读性和可维护性'
    };

    const prompt = `请优化以下${language}代码，${optimizationPrompts[optimizationType as keyof typeof optimizationPrompts] || optimizationPrompts.general}：

\`\`\`${language}
${code}
\`\`\`

请提供：
1. 优化后的代码
2. 具体的优化说明（每项不超过50字）

请确保优化后的代码功能完全一致，只改进实现方式。`;

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
            content: '你是一个专业的代码优化专家，能够改进代码性能、可读性和安全性。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error('AI API request failed');
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '';
    
    // 解析AI响应，提取优化后的代码和建议
    const codeMatch = aiResponse.match(/```[\w]*\n([\s\S]*?)\n```/);
    const optimizedCode = codeMatch ? codeMatch[1] : code;
    
    // 提取优化建议
    const suggestions = aiResponse
      .split('\n')
      .filter(line => line.match(/^\d+\.|^-|^•/))
      .map(line => line.replace(/^\d+\.\s*|^-\s*|^•\s*/, ''))
      .filter(suggestion => suggestion.length > 10);

    return {
      optimizedCode,
      suggestions
    };
  } catch (error) {
    return {
      optimizedCode: code,
      suggestions: []
    };
  }
}
