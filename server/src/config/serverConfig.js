const express = require('express');
const removeHttpHeader = require('../middleware/removeHttpHeader')
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const corsConfig = require('./corsConfig');

const serverConfig = (app) => {
    app.use(cookieParser());
    app.use(express.json()); // Для обработки JSON-данных в теле запроса
    app.use(express.urlencoded({ extended: true })); // Для обработки данных из форм (application/x-www-form-urlencoded)
    app.use(removeHttpHeader);
    app.use(express.static(path.join(__dirname, '../public')));
    app.use(cors(corsConfig));
}

module.exports = serverConfig;