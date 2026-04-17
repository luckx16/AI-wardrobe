const router = require('express').Router();
const verifyAccessToken = require('../middleware/verifyAccessToken');
const ChatController = require('../controllers/Chat.controller');

router.use(verifyAccessToken);

router.post('/', ChatController.createChat);
router.get('/', ChatController.getChats);
router.patch('/:chatId', ChatController.updateChat);
router.delete('/:chatId', ChatController.deleteChat);
router.get('/:chatId/messages', ChatController.getChatMessages);
router.post('/:chatId/messages', ChatController.postChatMessage);

module.exports = router;
