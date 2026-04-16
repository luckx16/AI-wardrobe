const { User, Post, sequelize } = require('../db/models')

class UserService {
    // R
    static getAllUsersWithoutMetaData() {
        return User.findAll()
            .then(arrWithMetaData => arrWithMetaData.map(user => user.get()))
            .catch(err => console.error(err.message))
    }

    // D
    static deleteUser(id) {
        return User.destroy({
            where: { id }
        })
            .then(statusDeletedUser => statusDeletedUser)
            .catch(err => console.error(err.message))
    }
}

module.exports = UserService;