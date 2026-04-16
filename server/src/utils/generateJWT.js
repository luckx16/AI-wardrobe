const path = require('path');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwtConfig');
process.loadEnvFile(path.join(__dirname, '../../.env'));

// Генерирует токены для пользователя
function generateJWT(payload) {
    return {
        accessToken: jwt.sign(payload, process.env.JWT_ACCESS, jwtConfig.access),
        refreshToken: jwt.sign(payload, process.env.JWT_REFRESH, jwtConfig.refresh),
    };
}

module.exports = generateJWT;
