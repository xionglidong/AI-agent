import { CodeIssue } from './codeAnalyzer';

export class PerformanceAnalyzer {
  async analyzePerformance(code: string, language: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    issues.push(...this.checkAlgorithmicComplexity(code, language));
    issues.push(...this.checkMemoryUsage(code, language));
    issues.push(...this.checkAsyncPatterns(code, language));
    issues.push(...this.checkDOMOperations(code, language));
    issues.push(...this.checkDatabaseQueries(code, language));

    return issues;
  }

  private checkAlgorithmicComplexity(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\\n');

    let nestedLoopDepth = 0;
    const loopStack: number[] = [];

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Detect nested loops
      if (trimmedLine.includes('for') || trimmedLine.includes('while') || trimmedLine.includes('forEach')) {
        nestedLoopDepth++;
        loopStack.push(lineNumber);

        if (nestedLoopDepth > 2) {
          issues.push({
            type: 'performance',
            severity: 'high',
            line: lineNumber,
            message: `Deep nested loops detected (depth: ${nestedLoopDepth})`,
            suggestion: 'Consider optimizing algorithm complexity or using more efficient data structures',
          });
        }
      }

      // Check for end of loops (simplified detection)
      if (trimmedLine === '}' && loopStack.length > 0) {
        nestedLoopDepth = Math.max(0, nestedLoopDepth - 1);
        if (nestedLoopDepth === 0) {
          loopStack.length = 0;
        }
      }

      // O(n²) array operations
      if (trimmedLine.includes('.indexOf(') || trimmedLine.includes('.includes(')) {
        if (nestedLoopDepth > 0) {
          issues.push({
            type: 'performance',
            severity: 'medium',
            line: lineNumber,
            message: 'Array.indexOf() or includes() inside loop can be O(n²)',
            suggestion: 'Consider using Set or Map for O(1) lookups',
          });
        }
      }

      // Inefficient array operations
      if (trimmedLine.includes('.splice(0') || trimmedLine.includes('.shift()')) {
        if (nestedLoopDepth > 0 || lines.some(l => l.includes('for') || l.includes('while'))) {
          issues.push({
            type: 'performance',
            severity: 'medium',
            line: lineNumber,
            message: 'Array.splice(0) or shift() in loop is inefficient',
            suggestion: 'Consider using a queue data structure or reversing iteration',
          });
        }
      }

      // Sorting in loops
      if (trimmedLine.includes('.sort(') && nestedLoopDepth > 0) {
        issues.push({
          type: 'performance',
          severity: 'high',
          line: lineNumber,
          message: 'Sorting inside loop is inefficient',
          suggestion: 'Move sorting outside of loop or use more efficient algorithms',
        });
      }
    });

    return issues;
  }

  private checkMemoryUsage(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Large array operations
      if (trimmedLine.includes('new Array(') && /\\d{4,}/.test(trimmedLine)) {
        issues.push({
          type: 'performance',
          severity: 'medium',
          line: lineNumber,
          message: 'Creating large array may cause memory issues',
          suggestion: 'Consider using streams or processing data in chunks',
        });
      }

      // Memory leaks - event listeners
      if (trimmedLine.includes('addEventListener') && !code.includes('removeEventListener')) {
        issues.push({
          type: 'performance',
          severity: 'medium',
          line: lineNumber,
          message: 'Potential memory leak - event listener without removal',
          suggestion: 'Add corresponding removeEventListener() call',
        });
      }

      // Memory leaks - timers
      if (trimmedLine.includes('setInterval') && !code.includes('clearInterval')) {
        issues.push({
          type: 'performance',
          severity: 'high',
          line: lineNumber,
          message: 'Potential memory leak - setInterval without clearInterval',
          suggestion: 'Add clearInterval() call to clean up timer',
        });
      }

      // String concatenation in loops
      if (trimmedLine.includes('+=') && trimmedLine.includes('\"')) {
        const beforeLines = lines.slice(Math.max(0, index - 10), index);
        const hasLoop = beforeLines.some(l => l.includes('for') || l.includes('while') || l.includes('forEach'));
        
        if (hasLoop) {
          issues.push({
            type: 'performance',
            severity: 'medium',
            line: lineNumber,
            message: 'String concatenation in loop is inefficient',
            suggestion: 'Use array.join() or template literals for better performance',
          });
        }
      }

      // Closures in loops
      if (trimmedLine.includes('function(') || trimmedLine.includes('=>')) {
        const beforeLines = lines.slice(Math.max(0, index - 5), index);
        const hasLoop = beforeLines.some(l => l.includes('for') || l.includes('while'));
        
        if (hasLoop) {
          issues.push({
            type: 'performance',
            severity: 'low',
            line: lineNumber,
            message: 'Creating functions inside loops can impact performance',
            suggestion: 'Define functions outside of loops when possible',
          });
        }
      }
    });

    return issues;
  }

  private checkAsyncPatterns(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Missing await
      if (trimmedLine.includes('async function') || trimmedLine.includes('async ')) {
        const functionLines = lines.slice(index, index + 20);
        const hasPromises = functionLines.some(l => 
          l.includes('.then(') || 
          l.includes('Promise.') || 
          l.includes('fetch(') ||
          l.includes('setTimeout(')
        );
        const hasAwait = functionLines.some(l => l.includes('await'));
        
        if (hasPromises && !hasAwait) {
          issues.push({
            type: 'performance',
            severity: 'medium',
            line: lineNumber,
            message: 'Async function with Promises but no await - potential missed optimization',
            suggestion: 'Use await for better error handling and readability',
          });
        }
      }

      // Sequential async operations
      if (trimmedLine.includes('await') && !trimmedLine.includes('Promise.all')) {
        const nextLine = lines[index + 1];
        if (nextLine && nextLine.trim().includes('await')) {
          const nextNextLine = lines[index + 2];
          if (nextNextLine && nextNextLine.trim().includes('await')) {
            issues.push({
              type: 'performance',
              severity: 'medium',
              line: lineNumber,
              message: 'Sequential await operations - consider parallel execution',
              suggestion: 'Use Promise.all() for independent async operations',
            });
          }
        }
      }

      // Blocking operations in async functions
      if (trimmedLine.includes('readFileSync') || trimmedLine.includes('execSync')) {
        const beforeLines = lines.slice(Math.max(0, index - 10), index);
        const inAsyncFunction = beforeLines.some(l => l.includes('async'));
        
        if (inAsyncFunction) {
          issues.push({
            type: 'performance',
            severity: 'high',
            line: lineNumber,
            message: 'Synchronous operation in async function blocks event loop',
            suggestion: 'Use async versions (readFile, exec) with await',
          });
        }
      }

      // Callback hell
      const callbackDepth = (trimmedLine.match(/function\\s*\\(/g) || []).length;
      if (callbackDepth > 2) {
        issues.push({
          type: 'performance',
          severity: 'medium',
          line: lineNumber,
          message: 'Deep callback nesting detected',
          suggestion: 'Consider using Promises or async/await for better readability',
        });
      }
    });

    return issues;
  }

  private checkDOMOperations(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    if (language !== 'javascript' && language !== 'typescript') {
      return issues;
    }

    const lines = code.split('\\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // DOM queries in loops
      if (trimmedLine.includes('document.querySelector') || trimmedLine.includes('getElementById')) {
        const beforeLines = lines.slice(Math.max(0, index - 5), index);
        const hasLoop = beforeLines.some(l => l.includes('for') || l.includes('while') || l.includes('forEach'));
        
        if (hasLoop) {
          issues.push({
            type: 'performance',
            severity: 'medium',
            line: lineNumber,
            message: 'DOM query inside loop is expensive',
            suggestion: 'Cache DOM elements outside of loops',
          });
        }
      }

      // Forced reflow
      if (trimmedLine.includes('offsetHeight') || 
          trimmedLine.includes('offsetWidth') || 
          trimmedLine.includes('scrollTop') ||
          trimmedLine.includes('getComputedStyle')) {
        issues.push({
          type: 'performance',
          severity: 'low',
          line: lineNumber,
          message: 'Property access that triggers layout recalculation',
          suggestion: 'Batch DOM reads and writes to minimize reflows',
        });
      }

      // Style manipulation in loops
      if (trimmedLine.includes('.style.') || trimmedLine.includes('.classList.')) {
        const beforeLines = lines.slice(Math.max(0, index - 5), index);
        const hasLoop = beforeLines.some(l => l.includes('for') || l.includes('while') || l.includes('forEach'));
        
        if (hasLoop) {
          issues.push({
            type: 'performance',
            severity: 'medium',
            line: lineNumber,
            message: 'DOM style manipulation inside loop causes multiple repaints',
            suggestion: 'Use CSS classes or batch style changes',
          });
        }
      }

      // innerHTML in loops
      if (trimmedLine.includes('innerHTML') && trimmedLine.includes('+=')) {
        issues.push({
          type: 'performance',
          severity: 'high',
          line: lineNumber,
          message: 'innerHTML concatenation is inefficient',
          suggestion: 'Use DocumentFragment or build string first, then set innerHTML once',
        });
      }
    });

    return issues;
  }

  private checkDatabaseQueries(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // N+1 query problem
      if (trimmedLine.includes('SELECT') || trimmedLine.includes('find')) {
        const beforeLines = lines.slice(Math.max(0, index - 5), index);
        const hasLoop = beforeLines.some(l => l.includes('for') || l.includes('while') || l.includes('forEach'));
        
        if (hasLoop) {
          issues.push({
            type: 'performance',
            severity: 'high',
            line: lineNumber,
            message: 'Potential N+1 query problem - database query inside loop',
            suggestion: 'Use joins, includes, or bulk operations to reduce database calls',
          });
        }
      }

      // Missing indexes
      if (trimmedLine.includes('WHERE') && !trimmedLine.includes('INDEX')) {
        const whereMatch = trimmedLine.match(/WHERE\\s+(\\w+)\\s*=/);
        if (whereMatch) {
          issues.push({
            type: 'performance',
            severity: 'medium',
            line: lineNumber,
            message: 'Query without explicit index usage',
            suggestion: 'Ensure proper database indexes exist for query performance',
          });
        }
      }

      // SELECT * queries
      if (trimmedLine.includes('SELECT *')) {
        issues.push({
          type: 'performance',
          severity: 'low',
          line: lineNumber,
          message: 'SELECT * queries fetch unnecessary data',
          suggestion: 'Specify only required columns in SELECT statement',
        });
      }

      // Missing LIMIT
      if (trimmedLine.includes('SELECT') && !trimmedLine.includes('LIMIT') && !trimmedLine.includes('TOP')) {
        issues.push({
          type: 'performance',
          severity: 'medium',
          line: lineNumber,
          message: 'Query without LIMIT may return excessive data',
          suggestion: 'Add LIMIT clause to prevent large result sets',
        });
      }
    });

    return issues;
  }
}