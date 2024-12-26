const { V4 } = require('paseto');
const { createPrivateKey, createPublicKey } = require('crypto');
const secretKey = createPrivateKey({
    key: process.env.PRIVATE_KEY,
    format: 'pem',
})

async function generateToken(payload) {
    try {
        return await V4.sign(payload, secretKey);
    } catch (error) {
        console.error('Error generating token:', error);
        throw error;
    }
}

async function verifyToken(token) {
    try {
        return await V4.verify(token, secretKey);
    } catch (error) {
        console.error('Error verifying token:', error);
        throw error;
    }
}


module.exports = { generateToken, verifyToken };
