// 测试webhook订阅升级
const http = require('http');

function makePostRequest(path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Alipay SDK',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testWebhook() {
  console.log('🎯 测试订阅升级webhook...\n');

  try {
    // 首先检查是否有支付记录
    const dbCheck = await makePostRequest('/api/test-db', {});
    if (dbCheck.status !== 200) {
      console.log('❌ 无法检查数据库');
      return;
    }

    const recordCount = JSON.parse(dbCheck.data).paymentsQuery?.recordCount || 0;
    console.log(`📊 当前支付记录数: ${recordCount}`);

    if (recordCount === 0) {
      console.log('❌ 没有支付记录，无法测试webhook');
      return;
    }

    // 使用固定的测试订单号
    const testOrderId = 'ALIPAY1766215622767B992E';

    const webhookData = {
      out_trade_no: testOrderId,
      trade_status: 'TRADE_SUCCESS',
      total_amount: '79.00',
      trade_no: 'TEST' + Date.now(),
      buyer_id: 'test-user',
      gmt_payment: new Date().toISOString(),
      fund_bill_list: '[{"amount":"79.00","fundChannel":"ALIPAYACCOUNT"}]'
    };

    console.log('🔄 发送webhook数据...');
    console.log(`订单号: ${webhookData.out_trade_no}`);
    console.log(`状态: ${webhookData.trade_status}`);
    console.log(`金额: ${webhookData.total_amount}`);

    const webhookResponse = await makePostRequest('/api/payment/webhook', webhookData);

    console.log(`\n🎯 Webhook响应状态: ${webhookResponse.status}`);
    console.log(`响应内容: ${webhookResponse.data}`);

    if (webhookResponse.data === 'success') {
      console.log('✅ Webhook处理成功！');
      console.log('🎉 用户订阅应该已升级为Pro等级');

      console.log('\n📋 验证步骤:');
      console.log('1. 刷新前端页面');
      console.log('2. 检查用户是否显示为Pro订阅');
      console.log('3. 查看用户权限是否已升级');

    } else {
      console.log('❌ Webhook处理失败');
      console.log('请检查服务器日志以获取详细错误信息');
    }

  } catch (error) {
    console.log('❌ 测试失败:', error.message);
  }
}

testWebhook();


