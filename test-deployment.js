#!/usr/bin/env node

/**
 * 部署测试脚本
 * 用于验证 Cloudflare Pages 部署是否正常工作
 */

const https = require('https');
const http = require('http');

async function testEndpoint(url, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const success = res.statusCode === expectedStatus;
        resolve({
          url,
          status: res.statusCode,
          success,
          data: data.slice(0, 200) + (data.length > 200 ? '...' : '')
        });
      });
    }).on('error', reject);
  });
}

async function runTests(baseUrl) {
  console.log(`🧪 Testing deployment at: ${baseUrl}`);
  console.log('=' .repeat(50));

  const tests = [
    { path: '/', name: 'Frontend Page' },
    { path: '/api/health', name: 'Health Check' },
    { path: '/api/supported-languages', name: 'Supported Languages' },
  ];

  for (const test of tests) {
    try {
      const result = await testEndpoint(`${baseUrl}${test.path}`);
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${test.name}: ${result.status}`);
      
      if (!result.success) {
        console.log(`   Response: ${result.data}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
    }
  }

  console.log('=' .repeat(50));
  console.log('🎯 Test all API endpoints:');
  console.log('');
  
  console.log('1. 代码分析 (Code Analysis):');
  console.log(`curl -X POST ${baseUrl}/api/analyze-code \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"code":"const x = 5; console.log(x)", "language":"javascript"}'`);
  console.log('');
  
  console.log('2. 仓库审查 (Repository Review):');
  console.log(`curl -X POST ${baseUrl}/api/review-repository \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"repositoryPath":"my-project", "includeTests":true}'`);
  console.log('');
  
  console.log('3. 代码优化 (Code Optimization):');
  console.log(`curl -X POST ${baseUrl}/api/optimize-code \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"code":"var x = 5; console.log(x); if(x === true) { return x; }", "language":"javascript", "optimizationType":"performance"}'`);
  console.log('');
  
  console.log('4. 代码解释 (Code Explanation):');
  console.log(`curl -X POST ${baseUrl}/api/explain-code \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"code":"function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }", "language":"javascript", "explanationLevel":"intermediate"}'`);
}

// 获取命令行参数中的URL，默认使用本地开发服务器
const baseUrl = process.argv[2] || 'http://localhost:3000';

runTests(baseUrl).catch(console.error);
