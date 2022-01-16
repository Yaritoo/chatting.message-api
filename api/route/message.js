const express = require('express');
const router = express.Router();

const MessageController = require('../controller/message');
const checkAuth = require('../middleware/check-auth');

router.get('/room/:roomId', MessageController.messages_ofRoom);

router.post('/', MessageController.message_create);

module.exports = router;