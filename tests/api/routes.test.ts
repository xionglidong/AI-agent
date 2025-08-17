import request from 'supertest';
import express from 'express';
import { MastraCodeReviewAgent } from '../../src/agent';

// Mock the agent
jest.mock('../../src/agent');
const MockedAgent = MastraCodeReviewAgent as jest.MockedClass<typeof MastraCodeReviewAgent>;

// Import app after mocking
let app: express.Application;

beforeAll(async () => {
  // Mock agent methods
  const mockAnalyzeCode = jest.fn().mockResolvedValue({
    issues: [],
    score: 95,
    summary: 'Code looks good!',
  });

  const mockOptimizeCode = jest.fn().mockResolvedValue('optimized code');
  const mockExplainCode = jest.fn().mockResolvedValue('This code does...');

  MockedAgent.prototype.analyzeCode = mockAnalyzeCode;
  MockedAgent.prototype.optimizeCode = mockOptimizeCode;
  MockedAgent.prototype.explainCode = mockExplainCode;

  // Import and create app
  const { default: createApp } = await import('../../src/index');
  app = createApp;
});

describe('API Routes', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('agent');
      expect(response.body).toHaveProperty('model');
    });
  });

  describe('GET /api/supported-languages', () => {
    it('should return list of supported languages', async () => {
      const response = await request(app)
        .get('/api/supported-languages')
        .expect(200);

      expect(response.body).toHaveProperty('languages');
      expect(Array.isArray(response.body.languages)).toBe(true);
      expect(response.body.languages).toContain('javascript');
      expect(response.body.languages).toContain('typescript');
      expect(response.body.languages).toContain('python');
    });
  });

  describe('POST /api/analyze-code', () => {
    it('should analyze code successfully', async () => {
      const codeData = {
        code: 'const x = 5; console.log(x);',
        language: 'javascript',
      };

      const response = await request(app)
        .post('/api/analyze-code')
        .send(codeData)
        .expect(200);

      expect(response.body).toHaveProperty('issues');
      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('summary');
    });

    it('should return 400 if code is missing', async () => {
      const response = await request(app)
        .post('/api/analyze-code')
        .send({ language: 'javascript' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('required');
    });

    it('should return 400 if language is missing', async () => {
      const response = await request(app)
        .post('/api/analyze-code')
        .send({ code: 'const x = 5;' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('required');
    });
  });

  describe('POST /api/optimize-code', () => {
    it('should optimize code successfully', async () => {
      const codeData = {
        code: 'var x = 5; console.log(x);',
        language: 'javascript',
      };

      const response = await request(app)
        .post('/api/optimize-code')
        .send(codeData)
        .expect(200);

      expect(response.body).toHaveProperty('optimizedCode');
    });

    it('should return 400 if code is missing', async () => {
      const response = await request(app)
        .post('/api/optimize-code')
        .send({ language: 'javascript' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/explain-code', () => {
    it('should explain code successfully', async () => {
      const codeData = {
        code: 'function add(a, b) { return a + b; }',
        language: 'javascript',
      };

      const response = await request(app)
        .post('/api/explain-code')
        .send(codeData)
        .expect(200);

      expect(response.body).toHaveProperty('explanation');
    });

    it('should return 400 if code is missing', async () => {
      const response = await request(app)
        .post('/api/explain-code')
        .send({ language: 'javascript' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/realtime/watch', () => {
    it('should start watching a path', async () => {
      const watchData = {
        path: '/tmp/test',
      };

      // Mock fs.pathExists to return true
      jest.doMock('fs-extra', () => ({
        pathExists: jest.fn().mockResolvedValue(true),
      }));

      const response = await request(app)
        .post('/api/realtime/watch')
        .send(watchData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('path', watchData.path);
    });

    it('should return 400 if path is missing', async () => {
      const response = await request(app)
        .post('/api/realtime/watch')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/realtime/watched-paths', () => {
    it('should return watched paths', async () => {
      const response = await request(app)
        .get('/api/realtime/watched-paths')
        .expect(200);

      expect(response.body).toHaveProperty('paths');
      expect(Array.isArray(response.body.paths)).toBe(true);
    });
  });
});
