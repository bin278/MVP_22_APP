#!/usr/bin/env node

/**
 * 创建精确匹配微信期望长度的JSON
 */

console.log('🎯 创建精确匹配微信期望长度的JSON\n');

// 目标长度
const targetJsonLength = 338;
const baseJson = JSON.stringify({
  appid: "wxf8ef6eb93c045731",
  mchid: "169478675",
  description: "1年 Enterprise 会员",
  out_trade_no: "CN20251221816478G7Q8Z0",
  notify_url: "http://localhost:3000/api/payment/cn/wechat/notify",
  amount: { total: 49900, currency: "CNY" },
  attach: "{\"userId\":\"dev-user\",\"planType\":\"enterprise\",\"billingCycle\":\"yearly\"}"
});

console.log(`目标JSON长度: ${targetJsonLength}`);
console.log(`基础JSON长度: ${baseJson.length}`);
console.log(`需要添加字符: ${targetJsonLength - baseJson.length}\n`);

// 分析truncated message: "{\n"appid"
// 这意味着格式是: {\n"appid": "...",\n"mchid": "...",\n...

// 精确构造匹配的JSON
const exactJson = `{
"appid":"wxf8ef6eb93c045731",
"mchid":"169478675",
"description":"1年 Enterprise 会员",
"out_trade_no":"CN20251221816478G7Q8Z0",
"notify_url":"http://localhost:3000/api/payment/cn/wechat/notify",
"amount":{"total":49900,"currency":"CNY"},
"attach":"{\\"userId\\":\\"dev-user\\",\\"planType\\":\\"enterprise\\",\\"billingCycle\\":\\"yearly\\"}"
}`;

console.log('🎯 精确构造的JSON:');
console.log(`"${exactJson}"`);
console.log(`长度: ${exactJson.length}`);
console.log(`与目标差异: ${exactJson.length - targetJsonLength}`);

// 验证开头匹配
const expectedStart = '{\n"appid"';
const actualStart = exactJson.substring(0, expectedStart.length);
console.log(`\n开头匹配: ${expectedStart === actualStart ? '✅' : '❌'}`);
console.log(`期望: "${expectedStart}"`);
console.log(`实际: "${actualStart}"`);

if (exactJson.length === targetJsonLength) {
  console.log('\n✅ 长度完美匹配！');

  // 验证完整签名消息
  const method = 'POST';
  const url = '/v3/pay/transactions/native';
  const timestamp = '1766331816';
  const nonce = 'yfFZVLGWIvLk4uVtBzpaRu2z0IOLSn1d';

  const fullMessage = `${method}\n${url}\n${timestamp}\n${nonce}\n${exactJson}\n`;

  console.log(`完整签名消息长度: ${fullMessage.length}`);
  console.log(`与微信期望差异: ${fullMessage.length - 416}`);

  if (fullMessage.length === 416) {
    console.log('🎉 完整匹配！这应该是正确的格式');

    // 验证truncated部分
    const truncatedLength = 'POST\n/v3/pay/transactions/native\n1766331816\nyfFZVLGWIvLk4uVtBzpaRu2z0IOLSn1d\n{\n"appid'.length;
    const ourTruncated = fullMessage.substring(0, truncatedLength);
    const wechatTruncated = 'POST\n/v3/pay/transactions/native\n1766331816\nyfFZVLGWIvLk4uVtBzpaRu2z0IOLSn1d\n{\n"appid';

    console.log(`\n截断部分匹配: ${ourTruncated === wechatTruncated ? '✅' : '❌'}`);
  }
}

// 输出可以在代码中使用的格式
console.log('\n📝 代码中使用:');
console.log('const exactJson = `' + exactJson + '`;');



