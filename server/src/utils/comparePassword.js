const { timingSafeEqual, scryptSync } = require('crypto');

function comparePassword(password, hashedPassword) {
    const [salt, key] = hashedPassword.split(':');
    const keyBuffer = scryptSync(password, salt, 32);
    const storedKeyBuffer = Buffer.from(key, 'hex');

    if (keyBuffer.length !== storedKeyBuffer.length) {
        return false;
    }
    return timingSafeEqual(keyBuffer, storedKeyBuffer);
}

module.exports = comparePassword;

