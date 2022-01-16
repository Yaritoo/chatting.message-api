const express = require('express');
const router = express.Router();

const RoomController = require('../controller/room');

router.get('/', RoomController.rooms_getAll);

router.get('/user/:userId', RoomController.rooms_ofUser);

router.post('/', RoomController.room_create);

router.put('/join', RoomController.room_join);

router.put('/leave', RoomController.room_leave);

module.exports = router;