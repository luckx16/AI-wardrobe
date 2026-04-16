const router = require('express').Router();
const path = require('path');
const { User } = require('../db/models')

// Обработчик для корневого маршрута ('endpoint', 'ручка' )
router.get('/', (req, res) => {
    try {
        res.send('Hi!');
    } catch (error) {
        console.error('Ошибка при отправке ответа:', error);
        res.status(500).send('Ошибка при отправке ответа');
    }
})

// Обработчик для маршрута '/form'
router.get('/form', (req, res) => {
    try {
        // Метод send() отправляет ответ клиенту (строку) и завершает обработку запроса
        res
            .sendFile(path.join(__dirname, '../public/form.html'))
        // res.send('Тут будет форма для заполнения');
    } catch (error) {
        console.error('Ошибка при отправке файла:', error);
        res.status(500).send('Ошибка при отправке файла');
    }
})

// Обработчик для маршрута '/form-query' с методом GET
router.get('/form-query', async (req, res) => {
    try {
        const { name, email } = req.query;
        await User.create({ name, email });
        res.send('Данные формы успешно отправлены');
    } catch (error) {
        console.error('Ошибка при сохранении данных формы:', error);
        res.status(500).send('Ошибка при сохранении данных формы');
    }
});

// Обработчик для маршрута '/form' с методом POST
router.post('/form', async (req, res) => {
    try {
        const { name, email } = req.body;
        await User.create({ name, email });
        res.send('Данные формы успешно отправлены');
    } catch (error) {
        console.error('Ошибка при сохранении данных формы:', error);
        res.status(500).send('Ошибка при сохранении данных формы');
    }
})

router.put('/form', (req, res) => {
    res.send('Данные формы успешно обновлены');
})

router.delete('/form', (req, res) => {
    res.send('Данные формы успешно удалены');
})

router.post('/json', (req, res) => {
    console.log(req.body);

    res.send('OK!')
})

router.get('/getUsers', async (req, res) => {
    try {
        const allUsers = await User.findAll({ raw: true })
        res.json(allUsers)
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        res.status(500).send('Ошибка при получении данных');
    }
})

module.exports = router;