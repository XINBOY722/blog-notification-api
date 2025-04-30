const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    try {
        // 设置CORS头
        res.setHeader('Access-Control-Allow-Origin', 'https://www.konoxin.top');
        res.setHeader('Access-Control-Allow-Methods', 'GET');

        // 读取密钥文件
        const keysPath = path.join(__dirname, '..', 'keys.json');
        const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));

        // 返回公钥
        res.status(200).json({ publicKey: keys.publicKey });
    } catch (error) {
        console.error('获取公钥失败:', error);
        res.status(500).json({ error: '获取公钥失败' });
    }
};