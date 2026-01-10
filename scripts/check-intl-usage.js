/**
 * 国际版使用情况诊断脚本
 * 用于检查用户的生成次数是否正确记录和扣除
 *
 * 使用方法：
 * 1. 确保 .env.local 文件中有正确的 Supabase 配置
 * 2. 运行: node scripts/check-intl-usage.js <user_id>
 *
 * 示例: node scripts/check-intl-usage.js xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ 缺少 Supabase 配置");
  console.error("请确保 .env.local 文件中包含:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url");
  console.error("  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkUserUsage(userId) {
  console.log("\n" + "=".repeat(80));
  console.log(`📊 检查用户使用情况: ${userId}`);
  console.log("=".repeat(80) + "\n");

  // 1. 检查用户订阅状态
  console.log("1️⃣ 检查用户订阅状态");
  console.log("-".repeat(80));

  const { data: subscriptions, error: subError } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (subError) {
    console.error("❌ 查询订阅失败:", subError);
  } else {
    if (subscriptions && subscriptions.length > 0) {
      console.log(`✅ 找到 ${subscriptions.length} 条订阅记录:`);
      subscriptions.forEach((sub, index) => {
        console.log(`   ${index + 1}. 计划: ${sub.plan_type}, 状态: ${sub.status}`);
        console.log(`      订阅开始: ${sub.subscription_start}`);
        console.log(`      订阅结束: ${sub.subscription_end}`);
        console.log(`      创建时间: ${sub.created_at}`);
      });
    } else {
      console.log("ℹ️  未找到订阅记录，用户为 FREE 计划");
    }
  }

  // 2. 检查加油包
  console.log("\n2️⃣ 检查加油包");
  console.log("-".repeat(80));

  const { data: creditPackages, error: creditError } = await supabase
    .from("user_credit_packages")
    .select("*")
    .eq("user_id", userId)
    .order("purchase_date", { ascending: false });

  if (creditError) {
    console.error("❌ 查询加油包失败:", creditError);
  } else {
    if (creditPackages && creditPackages.length > 0) {
      console.log(`✅ 找到 ${creditPackages.length} 个加油包:`);
      creditPackages.forEach((pkg, index) => {
        const remaining = pkg.credits_remaining || 0;
        console.log(`   ${index + 1}. ${pkg.package_type}:`);
        console.log(`      总次数: ${pkg.credits_total}, 剩余: ${remaining}`);
        console.log(`      状态: ${pkg.status}, 过期时间: ${pkg.expiry_date}`);
        console.log(`      购买时间: ${pkg.purchase_date}`);
      });
    } else {
      console.log("ℹ️  未找到加油包");
    }
  }

  // 3. 计算当前周期（月度）
  console.log("\n3️⃣ 计算当前周期");
  console.log("-".repeat(80));

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  console.log(`当前时间: ${now.toISOString()}`);
  console.log(`月度周期开始: ${monthStart.toISOString()}`);
  console.log(`月度周期结束: ${monthEnd.toISOString()}`);

  // 4. 检查本月的推荐使用记录
  console.log("\n4️⃣ 检查本月推荐使用记录");
  console.log("-".repeat(80));

  const { count, error: countError } = await supabase
    .from("recommendation_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", monthStart.toISOString())
    .lte("created_at", monthEnd.toISOString());

  if (countError) {
    console.error("❌ 查询使用记录失败:", countError);
  } else {
    console.log(`✅ 本月已使用次数: ${count || 0}`);
  }

  // 5. 获取最近的使用记录
  console.log("\n5️⃣ 最近的10条使用记录");
  console.log("-".repeat(80));

  const { data: recentUsage, error: recentError } = await supabase
    .from("recommendation_usage")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (recentError) {
    console.error("❌ 查询最近记录失败:", recentError);
  } else {
    if (recentUsage && recentUsage.length > 0) {
      console.log(`✅ 找到 ${recentUsage.length} 条最近记录:`);
      recentUsage.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.created_at}`);
        console.log(`      元数据: ${JSON.stringify(record.metadata || {})}`);
      });
    } else {
      console.log("ℹ️  未找到使用记录");
    }
  }

  // 6. 计算总结
  console.log("\n6️⃣ 总结");
  console.log("-".repeat(80));

  const planType = subscriptions && subscriptions.length > 0
    ? subscriptions[0].plan_type
    : "free";

  // 获取限额配置
  const limits = {
    free: 30,
    pro: 500,
    enterprise: -1
  };

  const limit = limits[planType] || 30;
  const used = count || 0;
  const remaining = limit === -1 ? "无限" : Math.max(0, limit - used);

  console.log(`当前计划: ${planType.toUpperCase()}`);
  console.log(`本月限额: ${limit === -1 ? "无限" : limit}`);
  console.log(`已使用: ${used}`);
  console.log(`剩余次数: ${remaining}`);

  // 计算加油包额外次数
  if (creditPackages && creditPackages.length > 0) {
    const totalCreditRemaining = creditPackages
      .filter(pkg => pkg.status === "active" && new Date(pkg.expiry_date) > now)
      .reduce((sum, pkg) => sum + (pkg.credits_remaining || 0), 0);

    if (totalCreditRemaining > 0) {
      console.log(`\n加油包额外次数: ${totalCreditRemaining}`);
      console.log(`总可用次数: ${limit === -1 ? "无限" : limit + totalCreditRemaining}`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ 检查完成");
  console.log("=".repeat(80) + "\n");
}

// 主函数
async function main() {
  const userId = process.argv[2];

  if (!userId) {
    console.error("❌ 请提供用户 ID");
    console.error("\n使用方法:");
    console.error("  node scripts/check-intl-usage.js <user_id>");
    console.error("\n示例:");
    console.error("  node scripts/check-intl-usage.js xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx");
    process.exit(1);
  }

  try {
    await checkUserUsage(userId);
  } catch (error) {
    console.error("❌ 执行失败:", error);
    process.exit(1);
  }
}

main();
