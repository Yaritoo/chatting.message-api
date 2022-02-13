const express = require('express');
const router = express.Router();

const RoomController = require('../controller/room');
const checkAuth = require('../middleware/check-auth');

router.get('/', checkAuth, RoomController.rooms_getAll);

router.get('/user/:userId', checkAuth, RoomController.rooms_ofUser);

router.get('/user/category/:category', checkAuth, RoomController.room_inboxOfUser);

router.post('/', checkAuth, RoomController.room_create);

router.put('/join', checkAuth, RoomController.room_join);

router.put('/leave', checkAuth, RoomController.room_leave);

router.put('/user-status', checkAuth, RoomController.room_updateUser);

router.delete('/', checkAuth, RoomController.rooms_deleteAll);

module.exports = router;