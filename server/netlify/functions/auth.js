// auth.js
const jwt = require('jsonwebtoken');

function signUserJwt(payload, secret) {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

module.exports = { signUserJwt };
