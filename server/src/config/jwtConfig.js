const jwtConfig = {
    access: {
        expiresIn: 60 * 5, // 5 минуты
        // expiresIn: 5, // 5 секунд
    },
    refresh: {
        expiresIn: 60 * 60 * 12, // 12 часов
    },
}

module.exports = jwtConfig;