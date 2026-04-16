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
        const { user } = jwt.verify(accessToken, process.env.JWT_ACCESS);

        res.locals.user = user;

        next();
    } catch (error) {
        console.log('Invalid access token');
        res.status(403).send('Invalid access token');
    }
}

module.exports = verifyAccessToken;
