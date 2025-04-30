const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

// 生成VAPID密钥
const vapidKeys = webpush.generateVAPIDKeys();

// 将密钥保存到文件
const keysPath = path.join(__dirname, '..', 'keys.json');
fs.writeFileSync(keysPath, JSON.stringify({
    publicKey: vapidKeys.publicKey,
    privateKey: vapidKeys.privateKey
}));

console.log('VAPID密钥已生成并保存到:', keysPath);
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);