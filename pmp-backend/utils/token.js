const crypto = require('crypto');

const generateToken = () => {
  return crypto.randomBytes(20).toString('hex'); // 40-character token
};

module.exports = { generateToken };