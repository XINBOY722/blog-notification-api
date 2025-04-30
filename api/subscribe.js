// api/subscribe.js
const { createClient } = require('@vercel/edge-config');

module.exports = async (req, res) => {
    try {
        // 设置CORS头
        res.setHeader('Access-Control-Allow-Origin', 'https://www.konoxin.top');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // 处理预检请求
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        if (req.method !== 'POST') {
            return res.status(405).json({ error: '只允许POST请求' });
        }

        const subscription = req.body;

        // 验证订阅对象
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: '无效的订阅对象' });
        }

        // 创建 Edge Config 客户端
        const edgeConfig = createClient(process.env.EDGE_CONFIG);

        // 获取现有订阅列表
        let subscriptions = await edgeConfig.get('subscriptions') || [];

        // 检查是否已存在相同的订阅
        const exists = subscriptions.some(sub => sub.endpoint === subscription.endpoint);

        if (!exists) {
            // 添加新订阅
            subscriptions.push(subscription);

            // 更新 Edge Config
            await edgeConfig.set('subscriptions', subscriptions);
            console.log('订阅已保存，当前订阅数量:', subscriptions.length);
        }

        res.status(201).json({ success: true });
    } catch (error) {
        console.error('保存订阅失败:', error);
        res.status(500).json({ error: '保存订阅失败: ' + error.message });
    }
};