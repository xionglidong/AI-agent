import { CodeAnalyzer } from '../../src/analyzer/codeAnalyzer';

describe('CodeAnalyzer', () => {
  let analyzer: CodeAnalyzer;

  beforeEach(() => {
    analyzer = new CodeAnalyzer();
  });

  describe('analyze', () => {
    it('should detect missing semicolons in JavaScript', async () => {
      const code = `
const x = 5
const y = 10
console.log(x + y)
      `;

      const issues = await analyzer.analyze(code, 'javascript');
      const semicolonIssues = issues.filter(issue => 
        issue.message.includes('Missing semicolon')
      );

      expect(semicolonIssues.length).toBeGreaterThan(0);
      expect(semicolonIssues[0].type).toBe('style');
      expect(semicolonIssues[0].severity).toBe('low');
    });

    it('should detect long lines', async () => {
      const code = `
const veryLongVariableName = "This is a very long string that exceeds the maximum line length limit of 100 characters and should be flagged";
      `;

      const issues = await analyzer.analyze(code, 'javascript');
      const longLineIssues = issues.filter(issue => 
        issue.message.includes('Line too long')
      );

      expect(longLineIssues.length).toBe(1);
      expect(longLineIssues[0].type).toBe('style');
      expect(longLineIssues[0].severity).toBe('low');
    });

    it('should detect TODO comments', async () => {
      const code = `
// TODO: Implement this function
function placeholder() {
  // FIXME: This is broken
  return null;
}
      `;

      const issues = await analyzer.analyze(code, 'javascript');
      const todoIssues = issues.filter(issue => 
        issue.message.includes('TODO/FIXME')
      );

      expect(todoIssues.length).toBe(2);
      todoIssues.forEach(issue => {
        expect(issue.type).toBe('suggestion');
        expect(issue.severity).toBe('low');
      });
    });

    it('should detect camelCase violations', async () => {
      const code = `
function bad_function_name() {
  return 'test';
}

function GoodFunctionName() {
  return 'test';
}
      `;

      const issues = await analyzer.analyze(code, 'javascript');
      const namingIssues = issues.filter(issue => 
        issue.message.includes('should be camelCase')
      );

      expect(namingIssues.length).toBeGreaterThan(0);
    });

    it('should detect short variable names', async () => {
      const code = `
const a = 5;
const b = 10;
const i = 0; // This should be allowed as it's a common iterator
      `;

      const issues = await analyzer.analyze(code, 'javascript');
      const shortNameIssues = issues.filter(issue => 
        issue.message.includes('too short')
      );

      // Should detect 'a' and 'b' but not 'i'
      expect(shortNameIssues.length).toBe(2);
    });

    it('should detect high complexity functions', async () => {
      const code = `
function complexFunction() {
  if (condition1) {
    if (condition2) {
      for (let i = 0; i < 10; i++) {
        while (condition3) {
          switch (value) {
            case 1:
              if (condition4) {
                try {
                  // Complex logic
                } catch (error) {
                  // Error handling
                }
              }
              break;
            case 2:
              // More logic
              break;
          }
        }
      }
    }
  }
}
      `;

      const issues = await analyzer.analyze(code, 'javascript');
      const complexityIssues = issues.filter(issue => 
        issue.message.includes('cyclomatic complexity')
      );

      expect(complexityIssues.length).toBeGreaterThan(0);
      expect(complexityIssues[0].severity).toBe('high');
    });

    it('should detect best practice violations', async () => {
      const code = `
console.log('debug message');
var oldStyle = 'should use let or const';
if (x == y) { // should use ===
  console.log('loose equality');
}
JSON.parse(data); // without try-catch
      `;

      const issues = await analyzer.analyze(code, 'javascript');
      
      const consoleIssues = issues.filter(issue => 
        issue.message.includes('console.log')
      );
      expect(consoleIssues.length).toBeGreaterThan(0);

      const varIssues = issues.filter(issue => 
        issue.message.includes('Use let or const')
      );
      expect(varIssues.length).toBeGreaterThan(0);

      const equalityIssues = issues.filter(issue => 
        issue.message.includes('strict equality')
      );
      expect(equalityIssues.length).toBeGreaterThan(0);

      const jsonIssues = issues.filter(issue => 
        issue.message.includes('JSON.parse without error handling')
      );
      expect(jsonIssues.length).toBeGreaterThan(0);
    });
  });

  describe('different languages', () => {
    it('should handle TypeScript code', async () => {
      const code = `
interface User {
  name: string;
  age: number;
}

const user: User = {
  name: 'John',
  age: 30
}
      `;

      const issues = await analyzer.analyze(code, 'typescript');
      expect(issues).toBeInstanceOf(Array);
    });

    it('should handle Python code', async () => {
      const code = `
def hello_world():
    print("Hello, World!")
    
x = 5
y = 10
print(x + y)
      `;

      const issues = await analyzer.analyze(code, 'python');
      expect(issues).toBeInstanceOf(Array);
    });
  });
});
