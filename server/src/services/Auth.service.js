const { User } = require('../db/models')

class AuthService {
    // C
    static async createNewUser(candidate) {
        return User.create(candidate)
            .then(user => user)
            .catch(err => console.error(err.message))
    }
}

module.exports = AuthService;