const { Redis } = require('@upstash/redis');

// 创建 Redis 客户端实例
const redis = new Redis({
  url: process.env.PSTASH_REDIS_REST_REDIS_URL,
  token: process.env.PSTASH_REDIS_REST_KV_REST_API_TOKEN, // 修改为正确的环境变量
});

// 保存订阅信息
async function saveSubscription(subscription) {
  try {
    // 获取现有订阅列表
    const subscriptions = JSON.parse(await redis.get('subscriptions') || '[]');
    
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
    throw error;
  }
}

// 获取所有订阅
async function getSubscriptions() {
  try {
    return JSON.parse(await redis.get('subscriptions') || '[]');
  } catch (error) {
    console.error('获取订阅失败:', error);
    return [];
  }
}

// 移除订阅
async function removeSubscription(endpoint) {
  try {
    // 获取现有订阅列表
    const subscriptions = JSON.parse(await redis.get('subscriptions') || '[]');
    
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
    console.error('移除订阅失败:', error);
    throw error;
  }
}

module.exports = {
  redis,
  saveSubscription,
  getSubscriptions,
  removeSubscription
};