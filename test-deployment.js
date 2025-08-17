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
  console.log('🎯 Test API with code analysis:');
  console.log(`curl -X POST ${baseUrl}/api/analyze-code \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"code":"const x = 5; console.log(x)", "language":"javascript"}'`);
}

// 获取命令行参数中的URL，默认使用本地开发服务器
const baseUrl = process.argv[2] || 'http://localhost:3000';

runTests(baseUrl).catch(console.error);
