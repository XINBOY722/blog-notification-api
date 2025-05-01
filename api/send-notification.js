const webpush = require('web-push');
const fs = require('fs');
const path = require('path');
const { getSubscriptions, redis } = require('../lib/redis');

module.exports = async (req, res) => {
    try {
        // 验证请求方法
        if (req.method !== 'POST') {
            return res.status(405).json({ error: '只允许POST请求' });
        }

        // 验证请求体
        const { title, body, tag, url } = req.body;
        if (!title || !body) {
            return res.status(400).json({ error: '标题和内容是必需的' });
        }

        // 读取VAPID密钥
        const keysPath = path.join(__dirname, '..', 'keys.json');
        const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));

        // 设置Web Push
        webpush.setVapidDetails(
            'mailto:your-email@example.com', // 替换为您的邮箱
            keys.publicKey,
            keys.privateKey
        );

        // 获取所有订阅
        const subscriptions = await getSubscriptions();
        
        if (subscriptions.length === 0) {
            return res.status(404).json({ error: '没有找到订阅' });
        }

        console.log(`准备向 ${subscriptions.length} 个订阅发送通知`);

        // 准备通知内容
        const notification = {
            title,
            body,
            tag: tag || 'default',
            data: {
                url: url || 'https://www.konoxin.top'
            }
        };

        // 发送通知并跟踪结果
        const results = [];
        const failedSubscriptions = [];

        for (const subscription of subscriptions) {
            try {
                await webpush.sendNotification(subscription, JSON.stringify(notification));
                results.push({ status: 'success', endpoint: subscription.endpoint });
            } catch (error) {
                console.error(`发送通知失败:`, error);
                
                // 如果订阅已过期或无效，记录下来以便后续移除
                if (error.statusCode === 404 || error.statusCode === 410) {
                    failedSubscriptions.push(subscription.endpoint);
                }
                
                results.push({ 
                    status: 'failed', 
                    endpoint: subscription.endpoint,
                    error: error.message
                });
            }
        }

        // 移除失效的订阅
        if (failedSubscriptions.length > 0) {
            const validSubscriptions = subscriptions.filter(
                sub => !failedSubscriptions.includes(sub.endpoint)
            );
            
            await redis.set('subscriptions', JSON.stringify(validSubscriptions));
            console.log(`已移除 ${failedSubscriptions.length} 个失效订阅`);
        }

        res.status(200).json({
            success: true,
            total: subscriptions.length,
            results
        });
    } catch (error) {
        console.error('发送通知失败:', error);
        res.status(500).json({ error: '发送通知失败: ' + error.message });
    }
};