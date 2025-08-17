// Code explanation endpoint for Cloudflare Workers
export const onRequestPost: PagesFunction<{
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
}> = async (context) => {
  try {
    const { code, language, explanationLevel } = await context.request.json();
    
    if (!code || !language) {
      return new Response(
        JSON.stringify({ error: 'Code and language are required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const explanationResult = await explainCode(code, language, explanationLevel || 'intermediate', context.env);

    return new Response(JSON.stringify(explanationResult), {
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

async function explainCode(code: string, language: string, explanationLevel: string, env: any) {
  const apiKey = env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY;
  
  // 基础代码分析
  const codeAnalysis = performBasicCodeAnalysis(code, language);
  
  // AI驱动的详细解释
  let aiExplanation = '';
  let detailedBreakdown: any[] = [];
  
  if (apiKey) {
    try {
      const aiResult = await getAIExplanation(code, language, explanationLevel, apiKey);
      aiExplanation = aiResult.explanation;
      detailedBreakdown = aiResult.breakdown || [];
    } catch (error) {
      console.error('AI explanation failed:', error);
      aiExplanation = '无法获取AI解释，显示基础分析结果。';
    }
  } else {
    aiExplanation = '设置API密钥以获取AI驱动的详细代码解释。';
  }

  return {
    code,
    language,
    explanation: aiExplanation || generateBasicExplanation(codeAnalysis, language),
    analysis: codeAnalysis,
    breakdown: detailedBreakdown.length > 0 ? detailedBreakdown : generateBasicBreakdown(code, language),
    concepts: identifyProgrammingConcepts(code, language),
    complexity: assessComplexity(codeAnalysis),
    learningResources: generateLearningResources(language, codeAnalysis),
    timestamp: new Date().toISOString(),
  };
}

function performBasicCodeAnalysis(code: string, language: string) {
  const lines = code.split('\n');
  const analysis = {
    totalLines: lines.length,
    codeLines: lines.filter(line => line.trim() && !line.trim().startsWith('//')).length,
    commentLines: lines.filter(line => line.trim().startsWith('//')).length,
    functions: [],
    variables: [],
    imports: [],
    classes: [],
    controlStructures: {
      loops: 0,
      conditions: 0,
      switches: 0,
    },
  };

  // 分析函数
  const functionRegex = language === 'python' 
    ? /def\s+(\w+)\s*\(/g 
    : /function\s+(\w+)\s*\(|(\w+)\s*=\s*\([^)]*\)\s*=>/g;
  
  let match;
  while ((match = functionRegex.exec(code)) !== null) {
    analysis.functions.push({
      name: match[1] || match[2],
      line: code.substring(0, match.index).split('\n').length,
    });
  }

  // 分析变量声明
  const varRegex = language === 'python' 
    ? /(\w+)\s*=/g 
    : /(?:const|let|var)\s+(\w+)/g;
  
  while ((match = varRegex.exec(code)) !== null) {
    if (!analysis.variables.some(v => v.name === match[1])) {
      analysis.variables.push({
        name: match[1],
        line: code.substring(0, match.index).split('\n').length,
      });
    }
  }

  // 分析导入语句
  const importRegex = language === 'python' 
    ? /(?:import|from)\s+(\w+)/g 
    : /import\s+.*?from\s+['"`]([^'"`]+)['"`]|import\s+['"`]([^'"`]+)['"`]/g;
  
  while ((match = importRegex.exec(code)) !== null) {
    analysis.imports.push({
      module: match[1] || match[2],
      line: code.substring(0, match.index).split('\n').length,
    });
  }

  // 分析类
  const classRegex = /class\s+(\w+)/g;
  while ((match = classRegex.exec(code)) !== null) {
    analysis.classes.push({
      name: match[1],
      line: code.substring(0, match.index).split('\n').length,
    });
  }

  // 分析控制结构
  analysis.controlStructures.loops = (code.match(/\b(for|while|do)\b/g) || []).length;
  analysis.controlStructures.conditions = (code.match(/\bif\b/g) || []).length;
  analysis.controlStructures.switches = (code.match(/\bswitch\b/g) || []).length;

  return analysis;
}

function generateBasicExplanation(analysis: any, language: string) {
  let explanation = `这是一段${language}代码，包含${analysis.totalLines}行。`;

  if (analysis.functions.length > 0) {
    explanation += `\n\n**函数定义**：代码定义了${analysis.functions.length}个函数：${analysis.functions.map((f: any) => f.name).join(', ')}。`;
  }

  if (analysis.classes.length > 0) {
    explanation += `\n\n**类定义**：代码定义了${analysis.classes.length}个类：${analysis.classes.map((c: any) => c.name).join(', ')}。`;
  }

  if (analysis.variables.length > 0) {
    explanation += `\n\n**变量**：代码使用了${analysis.variables.length}个变量。`;
  }

  if (analysis.imports.length > 0) {
    explanation += `\n\n**依赖**：代码导入了${analysis.imports.length}个模块或库。`;
  }

  const { loops, conditions } = analysis.controlStructures;
  if (loops > 0 || conditions > 0) {
    explanation += `\n\n**控制流**：代码包含${conditions}个条件判断和${loops}个循环结构。`;
  }

  return explanation;
}

function generateBasicBreakdown(code: string, language: string) {
  const lines = code.split('\n');
  const breakdown = [];

  for (let i = 0; i < Math.min(lines.length, 20); i++) { // 限制前20行
    const line = lines[i].trim();
    if (!line) continue;

    let explanation = '';
    const lineNumber = i + 1;

    // 基础的行级别解释
    if (line.startsWith('//') || line.startsWith('#')) {
      explanation = '注释：解释代码用途或提供说明';
    } else if (line.includes('import') || line.includes('from')) {
      explanation = '导入语句：引入外部模块或库';
    } else if (line.includes('function') || line.includes('def')) {
      explanation = '函数定义：创建一个可重用的代码块';
    } else if (line.includes('class')) {
      explanation = '类定义：定义一个对象模板';
    } else if (line.includes('if')) {
      explanation = '条件判断：根据条件执行不同的代码';
    } else if (line.includes('for') || line.includes('while')) {
      explanation = '循环语句：重复执行代码块';
    } else if (line.includes('return')) {
      explanation = '返回语句：从函数中返回值';
    } else if (line.includes('=') && !line.includes('==')) {
      explanation = '变量赋值：给变量分配值';
    } else {
      explanation = '代码执行：执行具体的操作或计算';
    }

    breakdown.push({
      lineNumber,
      code: line,
      explanation
    });
  }

  return breakdown;
}

function identifyProgrammingConcepts(code: string, language: string) {
  const concepts = [];

  // 基础概念识别
  if (code.includes('function') || code.includes('def')) {
    concepts.push({
      concept: '函数',
      description: '将代码组织成可重用的代码块',
      importance: 'fundamental'
    });
  }

  if (code.includes('class')) {
    concepts.push({
      concept: '面向对象编程',
      description: '使用类和对象来组织代码',
      importance: 'advanced'
    });
  }

  if (code.includes('if') || code.includes('else')) {
    concepts.push({
      concept: '条件控制',
      description: '根据条件执行不同的代码路径',
      importance: 'fundamental'
    });
  }

  if (code.includes('for') || code.includes('while')) {
    concepts.push({
      concept: '循环',
      description: '重复执行代码直到满足条件',
      importance: 'fundamental'
    });
  }

  if (code.includes('async') || code.includes('await') || code.includes('Promise')) {
    concepts.push({
      concept: '异步编程',
      description: '处理非阻塞操作和并发执行',
      importance: 'advanced'
    });
  }

  if (code.includes('try') || code.includes('catch') || code.includes('except')) {
    concepts.push({
      concept: '错误处理',
      description: '捕获和处理程序运行时的错误',
      importance: 'intermediate'
    });
  }

  return concepts;
}

function assessComplexity(analysis: any) {
  let score = 0;
  let level = 'simple';

  // 基于各种因素计算复杂度
  score += analysis.functions.length * 2;
  score += analysis.classes.length * 3;
  score += analysis.controlStructures.loops * 2;
  score += analysis.controlStructures.conditions * 1;
  score += analysis.variables.length * 0.5;

  if (score <= 5) {
    level = 'simple';
  } else if (score <= 15) {
    level = 'moderate';
  } else if (score <= 30) {
    level = 'complex';
  } else {
    level = 'very complex';
  }

  return {
    score: Math.round(score),
    level,
    factors: {
      functions: analysis.functions.length,
      classes: analysis.classes.length,
      controlFlow: analysis.controlStructures.loops + analysis.controlStructures.conditions,
      variables: analysis.variables.length,
    }
  };
}

function generateLearningResources(language: string, analysis: any) {
  const resources = [];

  // 基础资源
  resources.push({
    title: `${language}基础语法`,
    type: 'tutorial',
    description: '学习语言的基本语法和概念',
    url: `https://developer.mozilla.org/docs/${language.toLowerCase()}`
  });

  // 根据代码内容推荐资源
  if (analysis.functions.length > 0) {
    resources.push({
      title: '函数和模块化编程',
      type: 'concept',
      description: '深入理解函数定义、参数传递和作用域',
    });
  }

  if (analysis.classes.length > 0) {
    resources.push({
      title: '面向对象编程',
      type: 'advanced',
      description: '学习类、对象、继承和多态性',
    });
  }

  if (analysis.controlStructures.loops > 0) {
    resources.push({
      title: '循环和迭代',
      type: 'concept',
      description: '掌握不同类型的循环和迭代模式',
    });
  }

  return resources;
}

async function getAIExplanation(code: string, language: string, explanationLevel: string, apiKey: string) {
  try {
    const levelPrompts = {
      beginner: '用简单易懂的语言解释，适合编程初学者',
      intermediate: '提供中等深度的解释，包含一些技术细节',
      advanced: '提供深入的技术分析，包括设计模式和最佳实践',
      expert: '提供专家级别的分析，包括性能、架构和高级概念'
    };

    const prompt = `请${levelPrompts[explanationLevel as keyof typeof levelPrompts] || levelPrompts.intermediate}，详细解释以下${language}代码：

\`\`\`${language}
${code}
\`\`\`

请提供：
1. 整体功能和目的的解释
2. 逐行或逐块的详细说明
3. 使用的编程概念和技术
4. 代码的优点和可能的改进点

请使用Markdown格式，让解释清晰易读。`;

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
            content: '你是一个专业的编程导师，能够清晰地解释代码的功能、逻辑和最佳实践。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error('AI API request failed');
    }

    const data = await response.json();
    const explanation = data.choices[0]?.message?.content || '';
    
    // 尝试解析结构化的解释
    const sections = explanation.split(/\n## |\n# /);
    const breakdown = sections.slice(1).map((section, index) => ({
      section: section.split('\n')[0],
      content: section.split('\n').slice(1).join('\n').trim(),
      order: index + 1
    }));

    return {
      explanation,
      breakdown
    };
  } catch (error) {
    return {
      explanation: '',
      breakdown: []
    };
  }
}
