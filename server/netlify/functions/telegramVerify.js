// server/netlify/functions/telegramVerify.js
const crypto = require('crypto');

// Function to verify the initData
function verifyInitData(initData, botToken) {
  // Example function, actual verification logic depends on Telegram's WebApp API
  const data = JSON.parse(Buffer.from(initData, 'base64').toString('utf8'));
  const checkHash = crypto.createHmac('sha256', botToken).update(initData).digest('hex');
  if (data.hash === checkHash) {
    return { ok: true, user: data.user };
  }
  return { ok: false, error: 'Verification failed' };
}

module.exports = { verifyInitData };
