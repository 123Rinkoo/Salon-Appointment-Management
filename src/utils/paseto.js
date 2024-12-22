const { V4 } = require('paseto');
const secretKey = process.env.SECRET_KEY;

async function generateToken(payload) {
  return await V4.sign(payload, secretKey);
}

async function verifyToken(token) {
  return await V4.verify(token, secretKey);
}

module.exports = { generateToken, verifyToken };
