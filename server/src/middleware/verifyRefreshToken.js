const path = require('path')
const jwt = require('jsonwebtoken');
process.loadEnvFile(path.join(__dirname, '../../.env'))

function verifyRefreshToken(req, res, next) {
    try {
        const { refreshToken } = req.cookies;
        const { user } = jwt.verify(refreshToken, process.env.JWT_REFRESH);

        // вкладываем в наш будущий ответ (хранилище) нашего пользователя из токена
        res.locals.user = user;

        // передаём управление контроллеру
        next();
    } catch (error) {
        console.log('Invalid refresh token');
        res.clearCookie('refreshToken').sendStatus(401);
    }
}

module.exports = verifyRefreshToken;
