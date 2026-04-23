const express = require('express');
const removeHttpHeader = require('../middleware/removeHttpHeader')
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const corsConfig = require('./corsConfig');

const serverConfig = (app) => {
    app.use(cookieParser());
    // Дефолтный лимит express.json() ≈ 100KB — недостаточно для больших payload (например, base64).
    // Поднимаем лимиты до разумного значения, соразмерного ограничению на загрузку файлов (multer: 10MB).
    app.use(express.json({ limit: '15mb' })); // Для обработки JSON-данных в теле запроса
    app.use(express.urlencoded({ extended: true, limit: '15mb' })); // Для обработки данных из форм (application/x-www-form-urlencoded)
    app.use(removeHttpHeader);
    app.use(express.static(path.join(__dirname, '../public')));
    // Раздаём загруженные файлы, чтобы URL вида /uploads/... открывались в браузере
    app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
    app.use(cors(corsConfig));
}

module.exports = serverConfig;