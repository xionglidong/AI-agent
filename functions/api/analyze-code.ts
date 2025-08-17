// Cloudflare Workers API endpoint for code analysis
export const onRequestPost: PagesFunction<{
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
}> = async (context) => {
  try {
    const { code, language, filePath, context: codeContext } = await context.request.json();
    
    if (!code || !language) {
      return new Response(
        JSON.stringify({ error: 'Code and language are required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Simple analysis without complex dependencies
    const issues = analyzeCodeSimple(code, language);
    const score = calculateScore(issues);
    
    // For AI analysis, we would call OpenAI/Anthropic API here
    const apiKey = context.env.OPENAI_API_KEY || context.env.ANTHROPIC_API_KEY;
    let summary = 'Code analysis completed. ';
    
    if (apiKey) {
      // Call AI API for detailed analysis
      summary = await getAIAnalysis(code, language, apiKey);
    } else {
      summary += 'Set API key for AI-powered analysis.';
    }

    const result = {
      issues,
      score,
      summary,
    };

    return new Response(JSON.stringify(result), {
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

// Simplified code analysis for Cloudflare Workers
function analyzeCodeSimple(code: string, language: string) {
  const issues = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();

    // Basic checks
    if (language === 'javascript' || language === 'typescript') {
      // Missing semicolons
      if (trimmedLine.length > 0 && 
          !trimmedLine.endsWith(';') && 
          !trimmedLine.endsWith('{') && 
          !trimmedLine.endsWith('}') &&
          !trimmedLine.startsWith('//')) {
        issues.push({
          type: 'style',
          severity: 'low',
          line: lineNumber,
          message: 'Missing semicolon',
          suggestion: 'Add semicolon at the end of the statement',
        });
      }

      // Console.log usage
      if (trimmedLine.includes('console.log')) {
        issues.push({
          type: 'suggestion',
          severity: 'low',
          line: lineNumber,
          message: 'console.log found - should be removed in production',
          suggestion: 'Use proper logging library or remove debug statements',
        });
      }

      // Use of var instead of let/const
      if (trimmedLine.includes('var ')) {
        issues.push({
          type: 'style',
          severity: 'medium',
          line: lineNumber,
          message: 'Use let or const instead of var',
          suggestion: 'Replace var with let or const',
        });
      }
    }

    // Long lines
    if (line.length > 100) {
      issues.push({
        type: 'style',
        severity: 'low',
        line: lineNumber,
        message: 'Line too long (over 100 characters)',
        suggestion: 'Break long lines for better readability',
      });
    }
  });

  return issues;
}

function calculateScore(issues: any[]) {
  let score = 100;
  
  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical':
        score -= 20;
        break;
      case 'high':
        score -= 10;
        break;
      case 'medium':
        score -= 5;
        break;
      case 'low':
        score -= 2;
        break;
    }
  }

  return Math.max(0, score);
}

async function getAIAnalysis(code: string, language: string, apiKey: string): Promise<string> {
  try {
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
            content: 'You are a code review expert. Analyze the provided code and give a brief summary of its quality and suggestions for improvement.'
          },
          {
            role: 'user',
            content: `Please analyze this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``
          }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('AI API request failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'AI analysis completed.';
  } catch (error) {
    return 'Basic analysis completed. AI analysis unavailable.';
  }
}
