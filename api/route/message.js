const express = require('express');
const router = express.Router();

const MessageController = require('../controller/message');
const checkAuth = require('../middleware/check-auth');

router.get('/room/user/:roomId/:userId', checkAuth, MessageController.messages_ofRoom);

router.post('/', checkAuth, MessageController.message_create);

router.delete('/', checkAuth, MessageController.messages_deleteAll);

module.exports = router;