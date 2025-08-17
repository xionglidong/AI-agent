import { CodeIssue } from './codeAnalyzer';

export class SecurityChecker {
  async checkSecurity(code: string, language: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    issues.push(...this.checkInjectionVulnerabilities(code, language));
    issues.push(...this.checkCryptographicIssues(code, language));
    issues.push(...this.checkAuthenticationIssues(code, language));
    issues.push(...this.checkDataExposure(code, language));
    issues.push(...this.checkInsecureDependencies(code, language));

    return issues;
  }

  private checkInjectionVulnerabilities(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // SQL Injection
      if (trimmedLine.includes('query') || trimmedLine.includes('execute')) {
        if (trimmedLine.includes('+') && (trimmedLine.includes('SELECT') || trimmedLine.includes('INSERT') || trimmedLine.includes('UPDATE'))) {
          issues.push({
            type: 'security',
            severity: 'critical',
            line: lineNumber,
            message: 'Potential SQL injection vulnerability - string concatenation in SQL query',
            suggestion: 'Use parameterized queries or prepared statements',
          });
        }
      }

      // XSS vulnerabilities
      if (language === 'javascript' || language === 'typescript') {
        if (trimmedLine.includes('innerHTML') && trimmedLine.includes('+')) {
          issues.push({
            type: 'security',
            severity: 'high',
            line: lineNumber,
            message: 'Potential XSS vulnerability - dynamic HTML content',
            suggestion: 'Use textContent or properly sanitize HTML content',
          });
        }

        if (trimmedLine.includes('eval(')) {
          issues.push({
            type: 'security',
            severity: 'critical',
            line: lineNumber,
            message: 'Use of eval() is dangerous and can lead to code injection',
            suggestion: 'Avoid eval() and use safer alternatives like JSON.parse()',
          });
        }
      }

      // Command injection
      if (trimmedLine.includes('exec(') || trimmedLine.includes('system(') || trimmedLine.includes('shell_exec(')) {
        if (trimmedLine.includes('+') || trimmedLine.includes('${')) {
          issues.push({
            type: 'security',
            severity: 'critical',
            line: lineNumber,
            message: 'Potential command injection vulnerability',
            suggestion: 'Validate and sanitize input before executing system commands',
          });
        }
      }

      // Path traversal
      if (trimmedLine.includes('../') || trimmedLine.includes('..\\')) {
        issues.push({
          type: 'security',
          severity: 'high',
          line: lineNumber,
          message: 'Potential path traversal vulnerability',
          suggestion: 'Validate file paths and use path.resolve() to prevent directory traversal',
        });
      }
    });

    return issues;
  }

  private checkCryptographicIssues(code: string, _language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Weak hashing algorithms
      if (trimmedLine.includes('md5') || trimmedLine.includes('sha1')) {
        issues.push({
          type: 'security',
          severity: 'high',
          line: lineNumber,
          message: 'Weak hashing algorithm detected (MD5/SHA1)',
          suggestion: 'Use stronger hashing algorithms like SHA-256 or bcrypt for passwords',
        });
      }

      // Hard-coded secrets
      const secretPatterns = [
        /password\\s*[=:]\\s*['\"][^'\"]+['\"]/i,
        /api[_-]?key\\s*[=:]\\s*['\"][^'\"]+['\"]/i,
        /secret\\s*[=:]\\s*['\"][^'\"]+['\"]/i,
        /token\\s*[=:]\\s*['\"][^'\"]+['\"]/i,
      ];

      secretPatterns.forEach(pattern => {
        if (pattern.test(trimmedLine)) {
          issues.push({
            type: 'security',
            severity: 'critical',
            line: lineNumber,
            message: 'Hard-coded secret detected',
            suggestion: 'Move secrets to environment variables or secure configuration',
          });
        }
      });

      // Insecure random number generation
      if (trimmedLine.includes('Math.random()')) {
        issues.push({
          type: 'security',
          severity: 'medium',
          line: lineNumber,
          message: 'Math.random() is not cryptographically secure',
          suggestion: 'Use crypto.randomBytes() for security-sensitive random number generation',
        });
      }

      // Weak encryption
      if (trimmedLine.includes('DES') || trimmedLine.includes('3DES')) {
        issues.push({
          type: 'security',
          severity: 'high',
          line: lineNumber,
          message: 'Weak encryption algorithm detected',
          suggestion: 'Use AES encryption instead of DES/3DES',
        });
      }
    });

    return issues;
  }

  private checkAuthenticationIssues(code: string, _language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Session management issues
      if (trimmedLine.includes('session') && trimmedLine.includes('httpOnly: false')) {
        issues.push({
          type: 'security',
          severity: 'high',
          line: lineNumber,
          message: 'Session cookies should have httpOnly flag',
          suggestion: 'Set httpOnly: true for session cookies to prevent XSS access',
        });
      }

      if (trimmedLine.includes('session') && trimmedLine.includes('secure: false')) {
        issues.push({
          type: 'security',
          severity: 'high',
          line: lineNumber,
          message: 'Session cookies should have secure flag in production',
          suggestion: 'Set secure: true for session cookies in HTTPS environments',
        });
      }

      // JWT issues
      if (trimmedLine.includes('jwt.sign') && !trimmedLine.includes('expiresIn')) {
        issues.push({
          type: 'security',
          severity: 'medium',
          line: lineNumber,
          message: 'JWT token without expiration time',
          suggestion: 'Set appropriate expiration time for JWT tokens',
        });
      }

      // Missing authentication checks
      if (trimmedLine.includes('router.') && (trimmedLine.includes('delete') || trimmedLine.includes('put') || trimmedLine.includes('post'))) {
        if (!code.includes('authenticate') && !code.includes('auth') && !code.includes('verify')) {
          issues.push({
            type: 'security',
            severity: 'high',
            line: lineNumber,
            message: 'Potential missing authentication for sensitive route',
            suggestion: 'Add authentication middleware for sensitive operations',
          });
        }
      }
    });

    return issues;
  }

  private checkDataExposure(code: string, _language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Sensitive data in logs
      if (trimmedLine.includes('console.log') || trimmedLine.includes('logger')) {
        const sensitiveTerms = ['password', 'token', 'secret', 'key', 'credit', 'ssn'];
        if (sensitiveTerms.some(term => trimmedLine.toLowerCase().includes(term))) {
          issues.push({
            type: 'security',
            severity: 'high',
            line: lineNumber,
            message: 'Potential sensitive data exposure in logs',
            suggestion: 'Avoid logging sensitive information',
          });
        }
      }

      // Error messages revealing sensitive info
      if (trimmedLine.includes('throw new Error') || trimmedLine.includes('res.send')) {
        if (trimmedLine.includes('database') || trimmedLine.includes('SQL') || trimmedLine.includes('password')) {
          issues.push({
            type: 'security',
            severity: 'medium',
            line: lineNumber,
            message: 'Error message may expose sensitive information',
            suggestion: 'Use generic error messages for client responses',
          });
        }
      }

      // CORS issues
      if (trimmedLine.includes('Access-Control-Allow-Origin') && trimmedLine.includes('*')) {
        issues.push({
          type: 'security',
          severity: 'medium',
          line: lineNumber,
          message: 'Wildcard CORS policy detected',
          suggestion: 'Specify allowed origins instead of using wildcard (*)',
        });
      }
    });

    return issues;
  }

  private checkInsecureDependencies(code: string, _language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Known vulnerable patterns
      if (trimmedLine.includes('require(') || trimmedLine.includes('import')) {
        // Check for potentially dangerous modules
        const dangerousModules = ['eval', 'vm', 'child_process'];
        dangerousModules.forEach(module => {
          if (trimmedLine.includes(`'${module}'`) || trimmedLine.includes(`\"${module}\"`)) {
            issues.push({
              type: 'security',
              severity: 'high',
              line: lineNumber,
              message: `Use of potentially dangerous module: ${module}`,
              suggestion: 'Review the necessity and implement proper security measures',
            });
          }
        });

        // Check for deprecated packages
        const deprecatedPackages = ['request', 'node-uuid'];
        deprecatedPackages.forEach(pkg => {
          if (trimmedLine.includes(`'${pkg}'`) || trimmedLine.includes(`\"${pkg}\"`)) {
            issues.push({
              type: 'security',
              severity: 'medium',
              line: lineNumber,
              message: `Deprecated package detected: ${pkg}`,
              suggestion: 'Replace with actively maintained alternatives',
            });
          }
        });
      }

      // File system operations without validation
      if (trimmedLine.includes('fs.') && (trimmedLine.includes('readFile') || trimmedLine.includes('writeFile'))) {
        if (!code.includes('path.resolve') && !code.includes('path.join')) {
          issues.push({
            type: 'security',
            severity: 'medium',
            line: lineNumber,
            message: 'File system operation without path validation',
            suggestion: 'Use path.resolve() or path.join() to validate file paths',
          });
        }
      }
    });

    return issues;
  }
}