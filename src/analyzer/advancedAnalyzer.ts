import { CodeIssue } from './codeAnalyzer';

export class AdvancedAnalyzer {
  async analyzeAdvanced(code: string, language: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    issues.push(...this.checkDesignPatterns(code, language));
    issues.push(...this.checkCodeSmells(code, language));
    issues.push(...this.checkMaintainability(code, language));
    issues.push(...this.checkTestability(code, language));
    issues.push(...this.checkDocumentation(code, language));

    return issues;
  }

  private checkDesignPatterns(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // God class detection (too many methods/properties)
      if (trimmedLine.includes('class ')) {
        const classContent = this.extractClassContent(lines, index);
        const methodCount = (classContent.match(/function\\s+\\w+|\\w+\\s*\\(/g) || []).length;
        const propertyCount = (classContent.match(/this\\.\\w+\\s*=/g) || []).length;
        
        if (methodCount > 15 || propertyCount > 20) {
          issues.push({
            type: 'suggestion',
            severity: 'high',
            line: lineNumber,
            message: 'God class detected - class has too many responsibilities',
            suggestion: 'Consider splitting this class into smaller, more focused classes',
          });
        }
      }

      // Singleton pattern misuse
      if (trimmedLine.includes('new ') && trimmedLine.includes('Singleton')) {
        issues.push({
          type: 'bug',
          severity: 'medium',
          line: lineNumber,
          message: 'Potential singleton pattern misuse',
          suggestion: 'Ensure singleton pattern is implemented correctly or consider dependency injection',
        });
      }

      // Factory pattern opportunity
      if (trimmedLine.includes('switch') || trimmedLine.includes('if')) {
        const nextLines = lines.slice(index, index + 10).join('\\n');
        if (nextLines.includes('new ') && (nextLines.match(/new\\s+\\w+/g) || []).length > 3) {
          issues.push({
            type: 'suggestion',
            severity: 'medium',
            line: lineNumber,
            message: 'Consider using Factory pattern for object creation',
            suggestion: 'Multiple object instantiations could benefit from a factory pattern',
          });
        }
      }
    });

    return issues;
  }

  private checkCodeSmells(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Long parameter list
      const paramMatch = trimmedLine.match(/function\\s+\\w+\\s*\\(([^)]+)\\)/);
      if (paramMatch) {
        const params = paramMatch[1].split(',').filter(p => p.trim());
        if (params.length > 5) {
          issues.push({
            type: 'style',
            severity: 'medium',
            line: lineNumber,
            message: `Function has too many parameters (${params.length})`,
            suggestion: 'Consider using an options object or splitting the function',
          });
        }
      }

      // Duplicate code detection (simple)
      if (trimmedLine.length > 20) {
        const duplicates = lines.filter((l, i) => 
          i !== index && l.trim() === trimmedLine && l.trim().length > 20
        );
        if (duplicates.length > 0) {
          issues.push({
            type: 'suggestion',
            severity: 'low',
            line: lineNumber,
            message: 'Duplicate code detected',
            suggestion: 'Consider extracting common code into a function or constant',
          });
        }
      }

      // Magic numbers
      const numberMatch = trimmedLine.match(/\\b(\\d{2,})\\b/);
      if (numberMatch && !trimmedLine.includes('//')) {
        const number = parseInt(numberMatch[1]);
        if (number > 10 && number !== 100 && number !== 1000) {
          issues.push({
            type: 'style',
            severity: 'low',
            line: lineNumber,
            message: `Magic number detected: ${number}`,
            suggestion: 'Consider using a named constant for better readability',
          });
        }
      }

      // Feature envy (excessive method calls on other objects)
      const methodCalls = (trimmedLine.match(/\\w+\\.\\w+\\(/g) || []).length;
      if (methodCalls > 3) {
        issues.push({
          type: 'suggestion',
          severity: 'low',
          line: lineNumber,
          message: 'Possible feature envy - too many calls to other objects',
          suggestion: 'Consider moving this logic closer to the data it operates on',
        });
      }

      // Data clumps (multiple parameters that appear together)
      if (language === 'javascript' || language === 'typescript') {
        if (trimmedLine.includes('x,') && trimmedLine.includes('y,') && trimmedLine.includes('z')) {
          issues.push({
            type: 'suggestion',
            severity: 'low',
            line: lineNumber,
            message: 'Data clump detected (x, y, z parameters)',
            suggestion: 'Consider creating a Point or Vector class',
          });
        }
      }
    });

    return issues;
  }

  private checkMaintainability(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\\n');

    // Calculate cyclomatic complexity more accurately
    let complexity = 1;
    let functionStart = -1;

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Track function boundaries
      if (trimmedLine.includes('function') || trimmedLine.includes('=>')) {
        if (functionStart !== -1 && complexity > 15) {
          issues.push({
            type: 'suggestion',
            severity: 'high',
            line: functionStart + 1,
            message: `Very high cyclomatic complexity (${complexity})`,
            suggestion: 'This function is very complex and hard to maintain. Consider refactoring.',
          });
        }
        functionStart = index;
        complexity = 1;
      }

      // Count complexity contributors
      const complexityKeywords = ['if', 'else if', 'for', 'while', 'switch', 'case', 'catch', '&&', '||', '?'];
      complexityKeywords.forEach(keyword => {
        if (trimmedLine.includes(keyword)) {
          complexity++;
        }
      });

      // Deep nesting detection
      const indentLevel = line.length - line.trimStart().length;
      if (indentLevel > 16) { // More than 4 levels of nesting (assuming 4-space indent)
        issues.push({
          type: 'style',
          severity: 'medium',
          line: lineNumber,
          message: 'Deep nesting detected',
          suggestion: 'Consider extracting nested logic into separate functions',
        });
      }

      // Long method detection
      if (trimmedLine === '}' && functionStart !== -1) {
        const methodLength = index - functionStart;
        if (methodLength > 50) {
          issues.push({
            type: 'suggestion',
            severity: 'medium',
            line: functionStart + 1,
            message: `Long method detected (${methodLength} lines)`,
            suggestion: 'Consider breaking this method into smaller, more focused methods',
          });
        }
        functionStart = -1;
      }
    });

    return issues;
  }

  private checkTestability(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Static method calls (hard to mock)
      if (trimmedLine.includes('.') && trimmedLine.includes('(')) {
        const staticCallPattern = /\\b[A-Z]\\w*\\.\\w+\\(/;
        if (staticCallPattern.test(trimmedLine)) {
          issues.push({
            type: 'suggestion',
            severity: 'low',
            line: lineNumber,
            message: 'Static method call detected - may be hard to test',
            suggestion: 'Consider dependency injection for better testability',
          });
        }
      }

      // Global state access
      if (trimmedLine.includes('window.') || trimmedLine.includes('global.') || trimmedLine.includes('process.env')) {
        issues.push({
          type: 'suggestion',
          severity: 'medium',
          line: lineNumber,
          message: 'Global state access detected',
          suggestion: 'Consider passing dependencies as parameters for better testability',
        });
      }

      // Date/time dependencies
      if (trimmedLine.includes('new Date()') || trimmedLine.includes('Date.now()')) {
        issues.push({
          type: 'suggestion',
          severity: 'low',
          line: lineNumber,
          message: 'Direct date/time dependency',
          suggestion: 'Consider injecting a time provider for better testability',
        });
      }

      // Random number generation
      if (trimmedLine.includes('Math.random()')) {
        issues.push({
          type: 'suggestion',
          severity: 'low',
          line: lineNumber,
          message: 'Random number generation affects testability',
          suggestion: 'Consider injecting a random number generator for deterministic tests',
        });
      }

      // File system operations
      if (trimmedLine.includes('fs.') || trimmedLine.includes('require(') || trimmedLine.includes('import(')) {
        if (!code.includes('mock') && !code.includes('test')) {
          issues.push({
            type: 'suggestion',
            severity: 'low',
            line: lineNumber,
            message: 'File system or module dependency',
            suggestion: 'Consider using dependency injection for better testability',
          });
        }
      }
    });

    return issues;
  }

  private checkDocumentation(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Public methods without documentation
      if (trimmedLine.includes('function ') || trimmedLine.includes('class ')) {
        const prevLine = index > 0 ? lines[index - 1].trim() : '';
        const hasJSDoc = prevLine.includes('/**') || prevLine.includes('*');
        const hasComment = prevLine.includes('//');
        
        if (!hasJSDoc && !hasComment) {
          issues.push({
            type: 'suggestion',
            severity: 'low',
            line: lineNumber,
            message: 'Public function/class without documentation',
            suggestion: 'Consider adding JSDoc comments to improve code documentation',
          });
        }
      }

      // Complex regular expressions without explanation
      if (trimmedLine.includes('/') && trimmedLine.includes('\\')) {
        const regexMatch = trimmedLine.match(/\\/[^/]+\\/[gimuy]*/);
        if (regexMatch && regexMatch[0].length > 20) {
          const prevLine = index > 0 ? lines[index - 1].trim() : '';
          if (!prevLine.includes('//')) {
            issues.push({
              type: 'suggestion',
              severity: 'low',
              line: lineNumber,
              message: 'Complex regular expression without explanation',
              suggestion: 'Add a comment explaining what this regex does',
            });
          }
        }
      }

      // TODO/FIXME without context
      if (trimmedLine.includes('TODO') || trimmedLine.includes('FIXME')) {
        if (trimmedLine.length < 20) {
          issues.push({
            type: 'suggestion',
            severity: 'low',
            line: lineNumber,
            message: 'TODO/FIXME without sufficient context',
            suggestion: 'Provide more details about what needs to be done',
          });
        }
      }
    });

    return issues;
  }

  private extractClassContent(lines: string[], startIndex: number): string {
    let braceCount = 0;
    let endIndex = startIndex;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
      
      if (braceCount === 0 && i > startIndex) {
        endIndex = i;
        break;
      }
    }
    
    return lines.slice(startIndex, endIndex + 1).join('\\n');
  }
}
