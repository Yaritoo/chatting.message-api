const express = require('express');
const router = express.Router();

const MessageController = require('../controller/message');
const checkAuth = require('../middleware/check-auth');

router.get('/room/:roomId', checkAuth,  MessageController.messages_ofRoom);

router.post('/', checkAuth, MessageController.message_create);

module.exports = router;