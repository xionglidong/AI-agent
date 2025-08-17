export interface CodeIssue {
  type: 'security' | 'performance' | 'style' | 'bug' | 'suggestion';
  severity: 'low' | 'medium' | 'high' | 'critical';
  line?: number;
  message: string;
  suggestion?: string;
}

export class CodeAnalyzer {
  async analyze(code: string, language: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    // Basic syntax and style checks
    issues.push(...this.checkSyntax(code, language));
    issues.push(...this.checkNaming(code, language));
    issues.push(...this.checkComplexity(code, language));
    issues.push(...this.checkBestPractices(code, language));

    return issues;
  }

  private checkSyntax(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Check for common syntax issues
      if (language === 'javascript' || language === 'typescript') {
        // Missing semicolons
        if (trimmedLine.length > 0 && 
            !trimmedLine.endsWith(';') && 
            !trimmedLine.endsWith('{') && 
            !trimmedLine.endsWith('}') &&
            !trimmedLine.startsWith('//') &&
            !trimmedLine.startsWith('*') &&
            !trimmedLine.startsWith('/*') &&
            trimmedLine !== '') {
          issues.push({
            type: 'style',
            severity: 'low',
            line: lineNumber,
            message: 'Missing semicolon',
            suggestion: 'Add semicolon at the end of the statement',
          });
        }

        // Unused variables (simple check)
        const varMatch = trimmedLine.match(/(?:var|let|const)\\s+(\\w+)/);
        if (varMatch) {
          const varName = varMatch[1];
          const restOfCode = lines.slice(index + 1).join('\\n');
          if (!restOfCode.includes(varName)) {
            issues.push({
              type: 'style',
              severity: 'medium',
              line: lineNumber,
              message: `Potentially unused variable: ${varName}`,
              suggestion: 'Remove unused variable or use it in the code',
            });
          }
        }
      }

      // Check for long lines
      if (line.length > 100) {
        issues.push({
          type: 'style',
          severity: 'low',
          line: lineNumber,
          message: 'Line too long (over 100 characters)',
          suggestion: 'Break long lines into multiple lines for better readability',
        });
      }

      // Check for TODO/FIXME comments
      if (trimmedLine.includes('TODO') || trimmedLine.includes('FIXME')) {
        issues.push({
          type: 'suggestion',
          severity: 'low',
          line: lineNumber,
          message: 'TODO/FIXME comment found',
          suggestion: 'Address the TODO/FIXME comment',
        });
      }
    });

    return issues;
  }

  private checkNaming(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      if (language === 'javascript' || language === 'typescript') {
        // Check function naming
        const functionMatch = line.match(/function\\s+(\\w+)/);
        if (functionMatch) {
          const funcName = functionMatch[1];
          if (!/^[a-z][a-zA-Z0-9]*$/.test(funcName)) {
            issues.push({
              type: 'style',
              severity: 'medium',
              line: lineNumber,
              message: `Function name '${funcName}' should be camelCase`,
              suggestion: 'Use camelCase naming convention for functions',
            });
          }
        }

        // Check variable naming
        const varMatch = line.match(/(?:var|let|const)\\s+(\\w+)/);
        if (varMatch) {
          const varName = varMatch[1];
          if (varName.length < 3 && !['i', 'j', 'k', 'x', 'y', 'z'].includes(varName)) {
            issues.push({
              type: 'style',
              severity: 'low',
              line: lineNumber,
              message: `Variable name '${varName}' is too short`,
              suggestion: 'Use descriptive variable names',
            });
          }
        }
      }
    });

    return issues;
  }

  private checkComplexity(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\\n');

    let functionStartLine = 0;
    let braceDepth = 0;
    let functionComplexity = 1;

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Track function start
      if (trimmedLine.includes('function') || trimmedLine.includes('=>')) {
        functionStartLine = lineNumber;
        functionComplexity = 1;
        braceDepth = 0;
      }

      // Count complexity indicators
      if (trimmedLine.includes('if') || trimmedLine.includes('else if')) {
        functionComplexity++;
      }
      if (trimmedLine.includes('for') || trimmedLine.includes('while') || trimmedLine.includes('do')) {
        functionComplexity++;
      }
      if (trimmedLine.includes('switch') || trimmedLine.includes('case')) {
        functionComplexity++;
      }
      if (trimmedLine.includes('catch') || trimmedLine.includes('&&') || trimmedLine.includes('||')) {
        functionComplexity++;
      }

      // Track braces
      braceDepth += (line.match(/{/g) || []).length;
      braceDepth -= (line.match(/}/g) || []).length;

      // End of function
      if (braceDepth === 0 && functionStartLine > 0 && trimmedLine.includes('}')) {
        if (functionComplexity > 10) {
          issues.push({
            type: 'suggestion',
            severity: 'high',
            line: functionStartLine,
            message: `Function has high cyclomatic complexity (${functionComplexity})`,
            suggestion: 'Consider breaking down the function into smaller functions',
          });
        }
        functionStartLine = 0;
      }
    });

    return issues;
  }

  private checkBestPractices(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      if (language === 'javascript' || language === 'typescript') {
        // Check for console.log
        if (trimmedLine.includes('console.log')) {
          issues.push({
            type: 'suggestion',
            severity: 'low',
            line: lineNumber,
            message: 'console.log found - should be removed in production',
            suggestion: 'Use proper logging library or remove debug statements',
          });
        }

        // Check for == instead of ===
        if (trimmedLine.includes('==') && !trimmedLine.includes('===')) {
          issues.push({
            type: 'bug',
            severity: 'medium',
            line: lineNumber,
            message: 'Use strict equality (===) instead of loose equality (==)',
            suggestion: 'Replace == with === for strict comparison',
          });
        }

        // Check for var instead of let/const
        if (trimmedLine.includes('var ')) {
          issues.push({
            type: 'style',
            severity: 'medium',
            line: lineNumber,
            message: 'Use let or const instead of var',
            suggestion: 'Replace var with let (for mutable) or const (for immutable) variables',
          });
        }

        // Check for missing error handling
        if (trimmedLine.includes('JSON.parse') && !code.includes('try') && !code.includes('catch')) {
          issues.push({
            type: 'bug',
            severity: 'high',
            line: lineNumber,
            message: 'JSON.parse without error handling',
            suggestion: 'Wrap JSON.parse in try-catch block',
          });
        }
      }
    });

    return issues;
  }
}