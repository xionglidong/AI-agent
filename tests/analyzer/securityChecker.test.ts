import { SecurityChecker } from '../../src/analyzer/securityChecker';

describe('SecurityChecker', () => {
  let checker: SecurityChecker;

  beforeEach(() => {
    checker = new SecurityChecker();
  });

  describe('checkSecurity', () => {
    it('should detect SQL injection vulnerabilities', async () => {
      const code = `
const query = "SELECT * FROM users WHERE id = " + userId;
db.execute(query);
      `;

      const issues = await checker.checkSecurity(code, 'javascript');
      const sqlIssues = issues.filter(issue => 
        issue.message.includes('SQL injection')
      );

      expect(sqlIssues.length).toBeGreaterThan(0);
      expect(sqlIssues[0].type).toBe('security');
      expect(sqlIssues[0].severity).toBe('critical');
    });

    it('should detect XSS vulnerabilities', async () => {
      const code = `
element.innerHTML = "<div>" + userInput + "</div>";
      `;

      const issues = await checker.checkSecurity(code, 'javascript');
      const xssIssues = issues.filter(issue => 
        issue.message.includes('XSS vulnerability')
      );

      expect(xssIssues.length).toBeGreaterThan(0);
      expect(xssIssues[0].type).toBe('security');
      expect(xssIssues[0].severity).toBe('high');
    });

    it('should detect eval usage', async () => {
      const code = `
const result = eval(userCode);
      `;

      const issues = await checker.checkSecurity(code, 'javascript');
      const evalIssues = issues.filter(issue => 
        issue.message.includes('eval()')
      );

      expect(evalIssues.length).toBeGreaterThan(0);
      expect(evalIssues[0].type).toBe('security');
      expect(evalIssues[0].severity).toBe('critical');
    });

    it('should detect command injection', async () => {
      const code = `
exec("rm -rf " + userPath);
      `;

      const issues = await checker.checkSecurity(code, 'javascript');
      const cmdIssues = issues.filter(issue => 
        issue.message.includes('command injection')
      );

      expect(cmdIssues.length).toBeGreaterThan(0);
      expect(cmdIssues[0].type).toBe('security');
      expect(cmdIssues[0].severity).toBe('critical');
    });

    it('should detect path traversal vulnerabilities', async () => {
      const code = `
const filePath = "./uploads/../../../etc/passwd";
      `;

      const issues = await checker.checkSecurity(code, 'javascript');
      const pathIssues = issues.filter(issue => 
        issue.message.includes('path traversal')
      );

      expect(pathIssues.length).toBeGreaterThan(0);
      expect(pathIssues[0].type).toBe('security');
      expect(pathIssues[0].severity).toBe('high');
    });

    it('should detect weak hashing algorithms', async () => {
      const code = `
const hash = crypto.createHash('md5').update(password).digest('hex');
const sha1Hash = crypto.createHash('sha1').update(data).digest('hex');
      `;

      const issues = await checker.checkSecurity(code, 'javascript');
      const hashIssues = issues.filter(issue => 
        issue.message.includes('Weak hashing algorithm')
      );

      expect(hashIssues.length).toBe(2);
      hashIssues.forEach(issue => {
        expect(issue.type).toBe('security');
        expect(issue.severity).toBe('high');
      });
    });

    it('should detect hard-coded secrets', async () => {
      const code = `
const apiKey = "sk-1234567890abcdef";
const password = "mySecretPassword123";
const secret = "super-secret-key";
const token = "bearer-token-12345";
      `;

      const issues = await checker.checkSecurity(code, 'javascript');
      const secretIssues = issues.filter(issue => 
        issue.message.includes('Hard-coded secret')
      );

      expect(secretIssues.length).toBeGreaterThan(0);
      secretIssues.forEach(issue => {
        expect(issue.type).toBe('security');
        expect(issue.severity).toBe('critical');
      });
    });

    it('should detect insecure random number generation', async () => {
      const code = `
const randomValue = Math.random();
      `;

      const issues = await checker.checkSecurity(code, 'javascript');
      const randomIssues = issues.filter(issue => 
        issue.message.includes('Math.random()')
      );

      expect(randomIssues.length).toBeGreaterThan(0);
      expect(randomIssues[0].type).toBe('security');
      expect(randomIssues[0].severity).toBe('medium');
    });

    it('should detect session security issues', async () => {
      const code = `
app.use(session({
  httpOnly: false,
  secure: false
}));
      `;

      const issues = await checker.checkSecurity(code, 'javascript');
      const sessionIssues = issues.filter(issue => 
        issue.message.includes('httpOnly') || issue.message.includes('secure')
      );

      expect(sessionIssues.length).toBeGreaterThan(0);
      sessionIssues.forEach(issue => {
        expect(issue.type).toBe('security');
        expect(issue.severity).toBe('high');
      });
    });

    it('should detect JWT issues', async () => {
      const code = `
const token = jwt.sign({ userId: 123 }, secret);
      `;

      const issues = await checker.checkSecurity(code, 'javascript');
      const jwtIssues = issues.filter(issue => 
        issue.message.includes('JWT token without expiration')
      );

      expect(jwtIssues.length).toBeGreaterThan(0);
      expect(jwtIssues[0].type).toBe('security');
      expect(jwtIssues[0].severity).toBe('medium');
    });

    it('should detect CORS wildcard usage', async () => {
      const code = `
res.header('Access-Control-Allow-Origin', '*');
      `;

      const issues = await checker.checkSecurity(code, 'javascript');
      const corsIssues = issues.filter(issue => 
        issue.message.includes('Wildcard CORS')
      );

      expect(corsIssues.length).toBeGreaterThan(0);
      expect(corsIssues[0].type).toBe('security');
      expect(corsIssues[0].severity).toBe('medium');
    });

    it('should detect dangerous module usage', async () => {
      const code = `
const vm = require('vm');
const childProcess = require('child_process');
      `;

      const issues = await checker.checkSecurity(code, 'javascript');
      const moduleIssues = issues.filter(issue => 
        issue.message.includes('potentially dangerous module')
      );

      expect(moduleIssues.length).toBeGreaterThan(0);
      moduleIssues.forEach(issue => {
        expect(issue.type).toBe('security');
        expect(issue.severity).toBe('high');
      });
    });
  });
});
