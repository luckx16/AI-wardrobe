const UserService = require('../services/User.service');
const formatResponse = require('../utils/formatResponse');

class UserController {
    // R
    static async getAllUsers(req, res) {
        try {
            const allUsers = await UserService.getAllUsersWithoutMetaData();
            res.json(formatResponse(200, 'All Users Without MetaData', allUsers))
        } catch (error) {
            res.json(formatResponse(500, error.message, null, error))
        }
    }

    // D
    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const { user } = res.locals;
            if (Number(id) !== Number(user.id)) {
                return res.status(403).json(formatResponse(403, 'You can only delete your own account', null));
            }
            const deletedCount = await UserService.deleteUser(id);
            if (!deletedCount) {
                return res.status(404).json(formatResponse(404, 'User not found', null));
            }
            return res
                .clearCookie('refreshToken')
                .json(formatResponse(200, 'User deleted success', deletedCount));
        } catch (error) {
            return res.status(500).json(formatResponse(500, error.message, null, error));
        }
    }
}

module.exports = UserController