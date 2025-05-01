const { removeSubscription } = require('../lib/redis');

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

        const { endpoint } = req.body;

        // 验证端点
        if (!endpoint) {
            return res.status(400).json({ error: '无效的端点' });
        }

        // 移除订阅
        await removeSubscription(endpoint);
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('移除订阅失败:', error);
        res.status(500).json({ error: '移除订阅失败: ' + error.message });
    }
};