const mongoose = require('mongoose');
const http = require('http');

const Room = require('../model/room');
const eventbus = require('../../eventbus/eventbus-kafka');

exports.rooms_getAll = async (req, res, next) => {
    try {
        let rooms = await Room.find().exec();
        res.status(200).json({ rooms });
    } catch (err) {
        res.status(500).json({
            error: err
        });
    }
};

exports.rooms_ofUser = async (req, res, next) => {
    try {
        let rooms = await Room.find({ userIds: req.params.userId }).exec();
        let ids = '';
        rooms.forEach(room => {
            ids += room.userIds.join(',') + ',';
        });
        let users = await getUsers(next, ids);
        let response = rooms.map(room => {
            return {
                _id: room._id,
                name: room.name,
                users: room.userIds.map(u => {
                    return {
                        _id: u,
                        userName: users.find(id => id._id == u).userName
                    };
                })
            };
        });
        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({
            error: err
        });
    }
};

exports.room_create = async (req, res, next) => {
    try {
        let newRoom = new Room({
            _id: new mongoose.Types.ObjectId,
            name: req.body.name,
            userIds: req.body.userIds
        });
        await newRoom.save();
        res.status(201).json(newRoom);
    } catch (err) {
        res.status(500).json({
            error: err
        });
    }
};

exports.room_join = async (req, res, next) => {
    try {
        await Room.updateOne({ _id: req.body.roomId }, { $push: { userIds: req.body.userId } });
        res.status(204).json();
    } catch (err) {
        res.status(500).json({
            error: err
        });
    }
};

exports.room_leave = async (req, res, next) => {
    try {
        await Room.updateOne({ _id: req.body.roomId }, { $pull: { userIds: req.body.userId } });
        res.status(204).json();
    } catch (err) {
        res.status(500).json({
            error: err
        });
    }
}

getUsers = (next, ids) => {
    var url = `http://localhost:3000/users/filter?ids=${encodeURIComponent(ids)}`;
    let users = new Promise((resolve, reject) => http.get(url, res => {
        let data = '';
        // A chunk of data has been received.
        res.on('data', (chunk) => {
            data += chunk;

        });
        // The whole response has been received. Print out the result.
        res.on('end', () => {
            resolve(data);
        });
    }).on('error', next)).then(data => JSON.parse(data).users);

    return users;
};