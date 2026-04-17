const { User } = require('../db/models');
const AuthService = require('../services/Auth.service');
const formatResponse = require('../utils/formatResponse');
const hashPassword = require('../utils/hashPassword');
const comparePassword = require('../utils/comparePassword');
const generateJWT = require('../utils/generateJWT');
const cookieConfig = require('../config/cookieConfig');

class AuthController {
    // Метод для обновления пары токенов, когда протух access token
    static async refreshTokens(req, res) {
        try {
            const { user } = res.locals;
            const { accessToken, refreshToken } = generateJWT({ user });

            res
                .cookie('refreshToken', refreshToken, cookieConfig)
                .json(formatResponse(200, 'Update tokens success', { user, accessToken }));
        } catch (error) {
            res.json(formatResponse(500, 'Error tokens update', null, error));
        }
    }

    static async signIn(req, res) {
        try {
            const { email, password } = req.body;
            const { isValid, error } = User.validateSignInData({ email, password });

            if (!isValid) {
                return res.status(400).json(formatResponse(400, 'Validation error', null, error));
            }

            const candidate = await User.findOne({ where: { email } });

            if (!candidate) {
                return res.status(400).json(formatResponse(400, 'User not found', null, null));
            }

            if (!comparePassword(password, candidate.password)) {
                return res.status(400).json(formatResponse(400, 'Incorrect input data', null, null));
            }

            const { accessToken, refreshToken } = generateJWT({ user: candidate });

            return res
                .status(200)
                .cookie('refreshToken', refreshToken, cookieConfig)
                .json(formatResponse(200, 'Authorization success', { user: candidate, accessToken }));
        } catch (error) {
            return res.json(formatResponse(500, 'SignIn fail', null, error));
        }
    }

    static async signUp(req, res) {
        try {
            const { name, email, password } = req.body;
            const { isValid, error } = User.validateSignUpData({ name, email, password });

            if (!isValid) {
                return res.status(400).json(formatResponse(400, 'Validation error', null, error));
            }

            const candidate = await User.findOne({ where: { email } });

            if (candidate) {
                return res.status(400).json(formatResponse(400, 'User already exists', null, true));
            }

            const newUser = await AuthService.createNewUser({
                name,
                email,
                password: hashPassword(password),
            });
            const { accessToken, refreshToken } = generateJWT({ user: newUser });

            return res
                .status(201)
                .cookie('refreshToken', refreshToken, cookieConfig)
                .json(formatResponse(201, 'New user created', { user: newUser, accessToken }));
        } catch (error) {
            return res.json(formatResponse(500, 'New user fail', null, error));
        }
    }

    static async signOut(req, res) {
        try {
            res.clearCookie('refreshToken').sendStatus(200);
        } catch (error) {
            res.json(formatResponse(500, 'Sign out fail', null, error));
        }
    }
}

module.exports = AuthController;
