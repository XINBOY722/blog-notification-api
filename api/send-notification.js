// api/send-notification.js
const webpush = require('web-push');
const { createClient } = require('@vercel/edge-config');
const fs = require('fs');
const path = require('path');

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

        // 验证请求
        const { title, body, url, secret } = req.body;

        if (!title || !body || !url) {
            return res.status(400).json({ error: '缺少必要参数' });
        }

        // 验证密钥（简单的安全措施）
        const expectedSecret = process.env.NOTIFICATION_SECRET;
        if (!secret || secret !== expectedSecret) {
            return res.status(401).json({ error: '未授权' });
        }

        // 读取VAPID密钥
        const keysPath = path.join(__dirname, '..', 'keys.json');
        const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));

        // 设置VAPID详细信息
        webpush.setVapidDetails(
            'mailto:' + process.env.CONTACT_EMAIL, // 使用环境变量
            keys.publicKey,
            keys.privateKey
        );

        // 创建 Edge Config 客户端
        const edgeConfig = createClient(process.env.EDGE_CONFIG);

        // 获取订阅列表
        const subscriptions = await edgeConfig.get('subscriptions') || [];

        if (subscriptions.length === 0) {
            return res.status(200).json({ success: true, message: '没有订阅者' });
        }

        // 准备通知内容
        const payload = JSON.stringify({
            title,
            body,
            url
        });

        // 发送通知
        const results = [];
        const failedSubscriptions = [];

        for (const subscription of subscriptions) {
            try {
                await webpush.sendNotification(subscription, payload);
                results.push({ success: true, endpoint: subscription.endpoint });
            } catch (error) {
                console.error('发送通知失败:', error);
                results.push({ success: false, endpoint: subscription.endpoint, error: error.message });

                // 如果订阅已过期，则移除
                if (error.statusCode === 410) {
                    failedSubscriptions.push(subscription);
                }
            }
        }

        // 移除失效的订阅
        if (failedSubscriptions.length > 0) {
            const updatedSubscriptions = subscriptions.filter(sub =>
                !failedSubscriptions.some(failedSub => failedSub.endpoint === sub.endpoint)
            );
            await edgeConfig.set('subscriptions', updatedSubscriptions);
            console.log('已移除失效订阅，当前订阅数量:', updatedSubscriptions.length);
        }

        res.status(200).json({
            success: true,
            total: subscriptions.length,
            sent: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        });
    } catch (error) {
        console.error('发送通知失败:', error);
        res.status(500).json({ error: '发送通知失败: ' + error.message });
    }
};