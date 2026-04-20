const path = require('path');
const jwt = require('jsonwebtoken');
process.loadEnvFile(path.join(__dirname, '../../.env'));

function verifyAccessToken(req, res, next) {
    try {
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader) {
            return res.status(403).send('Invalid access token');
        }

        const accessToken = authorizationHeader.split(' ')[1];
        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS);
        // Токен мог подписываться как { user: {...} } или как { id, ... }.
        const user =
            decoded && typeof decoded === 'object' && 'user' in decoded ? decoded.user : decoded;
        const idRaw =
            user && typeof user === 'object' && 'id' in user ? user.id : undefined;
        const idNum = typeof idRaw === 'number' ? idRaw : Number(idRaw);
        if (!user || typeof user !== 'object' || !Number.isFinite(idNum) || idNum <= 0) {
            return res.status(403).send('Invalid access token');
        }

        req.user = { ...user, id: idNum };
        res.locals.user = req.user;

        next();
    } catch (error) {
        console.log('Invalid access token');
        res.status(403).send('Invalid access token');
    }
}

module.exports = verifyAccessToken;
