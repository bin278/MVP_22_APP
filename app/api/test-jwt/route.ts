import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[Test JWT] 开始JWT测试...');

    // 检查环境变量
    const jwtSecret = process.env.JWT_SECRET;
    const nodeEnv = process.env.NODE_ENV;
    const authProvider = process.env.AUTH_PROVIDER;

    console.log('[Test JWT] 环境变量状态:', {
      hasJwtSecret: !!jwtSecret,
      jwtSecretLength: jwtSecret?.length || 0,
      jwtSecretPrefix: jwtSecret?.substring(0, 10) + '...',
      nodeEnv,
      authProvider
    });

    // 测试JWT生成
    const testPayload = {
      userId: 'test-user-123',
      email: 'test@example.com',
      type: 'access'
    };

    let token;
    let signatureTest;
    try {
      token = jwt.sign(testPayload, jwtSecret, { expiresIn: '1h' });
      console.log('[Test JWT] JWT生成成功');

      // 验证刚生成的token
      const decoded = jwt.verify(token, jwtSecret);
      signatureTest = {
        success: true,
        decoded: {
          userId: decoded.userId,
          email: decoded.email,
          type: decoded.type,
          iat: decoded.iat,
          exp: decoded.exp
        }
      };
      console.log('[Test JWT] JWT验证成功');
    } catch (error) {
      console.error('[Test JWT] JWT操作失败:', error.message);
      signatureTest = {
        success: false,
        error: error.message
      };
    }

    // 测试不同的JWT密钥格式
    const testResults = [];

    // 测试各种可能的问题
    const commonIssues = [
      { name: '空字符串', value: '' },
      { name: '默认fallback', value: 'fallback-secret-key' },
      { name: '短密钥', value: 'short' },
      { name: '包含特殊字符', value: jwtSecret + '!' },
      { name: 'URL编码', value: encodeURIComponent(jwtSecret) },
      { name: '双重编码', value: encodeURIComponent(encodeURIComponent(jwtSecret)) }
    ];

    for (const issue of commonIssues) {
      try {
        const testToken = jwt.sign(testPayload, issue.value, { expiresIn: '1h' });
        const testDecoded = jwt.verify(testToken, issue.value);
        testResults.push({
          issue: issue.name,
          valid: true,
          tokenLength: testToken.length
        });
      } catch (error) {
        testResults.push({
          issue: issue.name,
          valid: false,
          error: error.message
        });
      }
    }

    // 返回测试结果
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv,
        authProvider,
        hasJwtSecret: !!jwtSecret,
        jwtSecretLength: jwtSecret?.length || 0
      },
      jwtTest: {
        canGenerate: !!token,
        canVerify: signatureTest.success,
        tokenLength: token?.length || 0,
        decoded: signatureTest.decoded || null
      },
      commonIssues: testResults,
      recommendations: [
        '检查CloudBase控制台的JWT_SECRET是否正确设置',
        '确认JWT_SECRET值不包含多余的空格或换行符',
        '尝试重新部署应用以确保环境变量生效',
        '检查JWT_SECRET是否被其他环境变量覆盖',
        '验证JWT_SECRET长度是否足够（推荐32字符以上）'
      ]
    });

  } catch (error) {
    console.error('[Test JWT] 测试异常:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'JWT测试失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
