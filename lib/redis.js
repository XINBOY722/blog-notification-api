const { Redis } = require('@upstash/redis');

// 创建 Redis 客户端实例
const redis = new Redis({
  url: process.env.PSTASH_REDIS_REST_KV_REST_API_URL,
  token: process.env.PSTASH_REDIS_REST_KV_REST_API_TOKEN,
});

// 安全地解析 Redis 数据
function safeParseJsonArray(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    return [];
  }
  try {
    const parsed = JSON.parse(jsonString); // 错误发生在这里
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('解析 Redis 数据失败，返回空数组:', e.message, '原始数据:', jsonString);
    return []; // 应该在这里捕获错误并返回空数组
  }
}

// 保存订阅信息
async function saveSubscription(subscription) {
  try {
    // 获取并安全地解析现有订阅列表
    const rawSubscriptions = await redis.get('subscriptions');
    const subscriptions = safeParseJsonArray(rawSubscriptions);

    // 检查是否已存在相同的订阅
    const exists = subscriptions.some(sub => sub.endpoint === subscription.endpoint);

    if (!exists) {
      // 添加新订阅
      subscriptions.push(subscription);

      // 更新 Redis
      await redis.set('subscriptions', JSON.stringify(subscriptions));
      console.log('订阅已保存，当前订阅数量:', subscriptions.length);
    }

    return { success: true };
  } catch (error) {
    console.error('保存订阅失败:', error);
    throw error; // 重新抛出错误，以便上层调用知道失败了
  }
}

// 获取所有订阅
async function getSubscriptions() {
  try {
    // 获取并安全地解析订阅列表
    const rawSubscriptions = await redis.get('subscriptions');
    return safeParseJsonArray(rawSubscriptions);
  } catch (error) {
    console.error('获取订阅失败:', error);
    return []; // 出错时返回空数组
  }
}

// 移除订阅
async function removeSubscription(endpoint) {
  try {
    // 获取并安全地解析现有订阅列表
    const rawSubscriptions = await redis.get('subscriptions');
    const subscriptions = safeParseJsonArray(rawSubscriptions); // 使用了安全解析

    // 过滤掉要移除的订阅
    const updatedSubscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);

    // 如果有订阅被移除
    if (updatedSubscriptions.length !== subscriptions.length) {
      // 更新 Redis
      await redis.set('subscriptions', JSON.stringify(updatedSubscriptions));
      console.log('订阅已移除，当前订阅数量:', updatedSubscriptions.length);
    }

    return { success: true };
  } catch (error) {
    console.error('移除订阅失败:', error); // 错误最终在这里被捕获并记录
    throw error; // 重新抛出错误
  }
}

module.exports = {
  redis,
  saveSubscription,
  getSubscriptions,
  removeSubscription
};