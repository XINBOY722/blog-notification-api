const { put, list, del } = require('@vercel/blob');

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

        // 获取现有订阅列表
        let subscriptions = [];
        try {
            // 尝试获取现有的订阅文件
            const { blobs } = await list({ prefix: 'subscriptions/' });
            if (blobs.length > 0) {
                // 假设我们使用第一个找到的文件
                const response = await fetch(blobs[0].url);
                subscriptions = await response.json();
            }
        } catch (error) {
            console.error('获取订阅列表失败:', error);
            // 如果失败，使用空数组继续
        }

        // 检查是否已存在相同的订阅
        const exists = subscriptions.some(sub => sub.endpoint === subscription.endpoint);

        if (!exists) {
            // 添加新订阅
            subscriptions.push(subscription);

            // 将更新后的订阅列表保存到Blob
            const blob = await put('subscriptions/list.json', JSON.stringify(subscriptions), {
                access: 'private',
                contentType: 'application/json'
            });

            console.log('订阅列表已保存到:', blob.url);
        }

        res.status(201).json({ success: true });
    } catch (error) {
        console.error('保存订阅失败:', error);
        res.status(500).json({ error: '保存订阅失败: ' + error.message });
    }
};