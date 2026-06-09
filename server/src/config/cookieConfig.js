const cookieConfig = {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 12,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
};

module.exports = cookieConfig;