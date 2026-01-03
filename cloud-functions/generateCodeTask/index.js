const cloudbase = require('@cloudbase/node-sdk');
const OpenAI = require('openai');

exports.main = async (event, context) => {
  console.log('🔥 云函数启动，接收到事件:', JSON.stringify(event, null, 2));

  try {
    const { taskId, prompt, openid } = event;

    if (!taskId || !prompt || !openid) {
      throw new Error('缺少必需参数: taskId, prompt, openid');
    }

    // 初始化CloudBase
    const app = cloudbase.init({
      env: process.env.ENV_ID || 'cloud1-3gn61ziydcfe6a57',
      secretId: process.env.TENCENT_CLOUD_SECRET_ID,
      secretKey: process.env.TENCENT_CLOUD_SECRET_KEY,
    });

    const db = app.database();
    const tasksCollection = db.collection('ai_code_tasks');

    console.log('📋 更新任务状态为processing...');
    await tasksCollection.doc(taskId).update({
      status: 'processing'
    });

    // AI生成代码逻辑
    console.log('🤖 开始AI代码生成...');
    const generatedCode = await generateCodeWithAI(prompt);

    console.log('✂️ 分割代码成片段...');
    const codeFragments = splitCodeIntoFragments(generatedCode);

    console.log(`📦 共${codeFragments.length}个片段，开始增量存储...`);
    let fullCode = '';

    for (let i = 0; i < codeFragments.length; i++) {
      const fragment = codeFragments[i];
      fullCode += fragment;

      console.log(`💾 存储片段 ${i + 1}/${codeFragments.length} (${fragment.length}字符)`);
      await tasksCollection.doc(taskId).update({
        code: fullCode
      });

      // 模拟AI生成速度
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log('✅ 代码生成完成，更新任务状态...');
    await tasksCollection.doc(taskId).update({
      status: 'success',
      finishTime: new Date()
    });

    console.log('🎉 云函数执行成功！');
    return {
      code: 0,
      msg: '代码生成成功',
      data: { taskId, codeLength: fullCode.length }
    };

  } catch (error) {
    console.error('❌ 云函数执行失败:', error);

    try {
      // 尝试更新任务状态为失败
      if (event.taskId) {
        const app = cloudbase.init({
          env: process.env.ENV_ID || 'cloud1-3gn61ziydcfe6a57',
          secretId: process.env.TENCENT_CLOUD_SECRET_ID,
          secretKey: process.env.TENCENT_CLOUD_SECRET_KEY,
        });
        const db = app.database();
        const tasksCollection = db.collection('ai_code_tasks');

        await tasksCollection.doc(event.taskId).update({
          status: 'failed',
          code: '',
          finishTime: new Date(),
          errorMsg: error.message
        });
      }
    } catch (dbError) {
      console.error('❌ 更新失败状态也失败:', dbError);
    }

    return {
      code: -1,
      msg: '代码生成失败',
      error: error.message
    };
  }
};

// AI生成代码函数
async function generateCodeWithAI(prompt) {
  console.log('🚀 初始化AI客户端...');

  // 优先使用DeepSeek
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY环境变量未设置');
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseUrl,
  });

  console.log('📡 发送AI请求...');
  const completion = await client.chat.completions.create({
    model: model,
    messages: [
      {
        role: 'system',
        content: `Generate a complete React component. Return ONLY the React component code, no explanations, no markdown, no JSON structure.
        // Requirements:
        // 1. Create a modern, responsive React component
        // 2. Use Tailwind CSS classes for styling
        // 3. Include proper TypeScript types if needed
        // 4. Make it production-ready
        // 5. Return only the code, no additional text`
      },
      {
        role: 'user',
        content: prompt.trim()
      }
    ],
    max_tokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '4000'),
    temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
  });

  const generatedCode = completion.choices[0]?.message?.content || '';
  console.log('📝 AI生成完成，代码长度:', generatedCode.length);

  if (!generatedCode) {
    throw new Error('AI返回空代码');
  }

  return generatedCode;
}

// 分割代码成片段
function splitCodeIntoFragments(code) {
  // 简化的分割策略：按字符数分割，每片段大约200-300字符
  const fragments = [];
  const chunkSize = 250; // 每个片段约250字符

  let currentPos = 0;

  while (currentPos < code.length) {
    let endPos = Math.min(currentPos + chunkSize, code.length);

    // 尝试在合理的断点处分割
    if (endPos < code.length) {
      // 寻找最近的行尾，避免在单词中间分割
      const searchStart = Math.max(currentPos, endPos - 50);
      const nextNewline = code.indexOf('\n', searchStart);

      if (nextNewline !== -1 && nextNewline < endPos + 100) {
        endPos = nextNewline + 1; // 包含换行符
      }
    }

    const fragment = code.slice(currentPos, endPos);
    if (fragment.trim()) {
      fragments.push(fragment);
    }

    currentPos = endPos;
  }

  // 如果只有一个片段，把它分成两半，让用户能看到渐进效果
  if (fragments.length === 1 && fragments[0].length > 100) {
    const midPoint = Math.floor(fragments[0].length / 2);
    const firstHalf = fragments[0].slice(0, midPoint);
    const secondHalf = fragments[0].slice(midPoint);

    fragments.length = 0; // 清空数组
    fragments.push(firstHalf, secondHalf);
  }

  console.log(`📦 简化为${fragments.length}个片段，每片段约${Math.round(code.length / fragments.length)}字符`);
  return fragments;
}



