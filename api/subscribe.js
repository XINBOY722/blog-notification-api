const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
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

        // 读取现有订阅
        const subscriptionsPath = path.join(__dirname, '..', 'subscriptions.json');
        let subscriptions = [];

        if (fs.existsSync(subscriptionsPath)) {
            subscriptions = JSON.parse(fs.readFileSync(subscriptionsPath, 'utf8'));
        }

        // 检查是否已存在相同的订阅
        const exists = subscriptions.some(sub => sub.endpoint === subscription.endpoint);

        if (!exists) {
            // 添加新订阅
            subscriptions.push(subscription);
            fs.writeFileSync(subscriptionsPath, JSON.stringify(subscriptions));
        }

        res.status(201).json({ success: true });
    } catch (error) {
        console.error('保存订阅失败:', error);
        res.status(500).json({ error: '保存订阅失败' });
    }
};