const { randomBytes, scryptSync } = require('crypto');

function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = scryptSync(password, salt, 32);
    return `${salt}:${derivedKey.toString('hex')}`;
}

module.exports = hashPassword;

