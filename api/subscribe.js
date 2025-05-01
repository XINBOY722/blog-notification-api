const { saveSubscription } = require('../lib/redis');

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

        // 保存订阅
        await saveSubscription(subscription);
        
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('保存订阅失败:', error);
        res.status(500).json({ error: '保存订阅失败: ' + error.message });
    }
};