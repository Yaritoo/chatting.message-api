const mongoose = require('mongoose');
const http = require('http');

const Room = require('../model/room');
const eventbus = require('../../eventbus/eventbus-kafka');
const server = require('../../server');

exports.rooms_getAll = async (req, res, next) => {
    try {
        let rooms = await Room.find().exec();
        let result = rooms.map(r => {
            return {
                id: r.id,
                name: r.name,
                category: r.category,
                users: r.users
            }
        })
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({
            error: err
        });
    }
};

exports.rooms_ofUser = async (req, res, next) => {
    try {
        let rooms = await Room.find({ "users._id": req.params.userId }).exec();
        if (rooms.length == 0) {
            res.status(200).json([]);
            return;
        }
        let ids = generateIds(rooms);
        let users = await getUsersFromApi(next, ids.join());
        let result = getResult(rooms, users);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({
            error: err
        });
    }
};

exports.room_inboxOfUser = async (req, res, next) => {
    try {
        let ids = req.query.ids;
        if (ids)
            ids = ids.split(',')
        let rooms = await Room.find({ category: 1, users: { $size: 2 }, 'users._id': { $all: ids } }).exec();
        if (rooms.length == 0) {
            res.status(200).json({});
            return;
        }
        let result = {
            id: rooms[0].id,
            name: rooms[0].name,
            category: rooms[0].category
        };
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({
            error: err
        });
    }
}

exports.room_create = async (req, res, next) => {
    try {
        let newRoom = new Room({
            _id: new mongoose.Types.ObjectId,
            name: req.body.name,
            category: req.body.category,
            users: req.body.users.map(user => {
                return {
                    _id: user.id,
                    status: user.status,
                    recentTime: Date.now()
                }
            })
        });
        //await newRoom.save();

        let result = {
            id: newRoom.id,
            name: newRoom.name,
            category: newRoom.category,
            users: newRoom.users.map(user => {
                return {
                    id: user.id,
                    status: user.status,
                    //recentTime: Date.now()
                }
            })
        };
        await handleSocketAfterCreateRoom(result);
        await server.sendSocketRoomExceptSender('room', result.id, req.body.socketId, result);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({
            error: err
        });
    }
};

exports.room_join = async (req, res, next) => {
    try {
        await Room.updateOne({ _id: req.body.roomId }, { $push: { users: req.body.user } });
        res.status(204).json();
    } catch (err) {
        res.status(500).json({
            error: err
        });
    }
};

exports.room_leave = async (req, res, next) => {
    try {
        await Room.updateOne({ _id: req.body.roomId }, { $pull: { users: req.body.user } });
        res.status(204).json();
    } catch (err) {
        res.status(500).json({
            error: err
        });
    }
}

exports.rooms_deleteAll = async (req, res, next) => {
    try {
        await Room.remove({}).exec()
        res.status(204).json();
    } catch (err) {
        res.status(500).json({
            errror: err
        })
    }
}

getUsersFromApi = (next, ids) => {
    var url = `http://user_api:3000/user/users/filter?ids=${encodeURIComponent(ids)}`;
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
    }).on('error', next))
        .then(data => JSON.parse(data))
        .catch(error => {
            console.log(error);
        });;

    return users;
};

getResult = (rooms, users) => {
    if (rooms.length == 0)
        return {};
    return rooms.map(room => {
        let result = room.users.map(user => {
            let foundUser = users.find(u => u.id == user.id);
            return {
                id: user.id,
                userName: foundUser.userName,
                status: user.status,
                recentTime: user.recentTime
            };
        });
        return {
            id: room.id,
            name: room.name,
            category: room.category,
            users: result
        };
    });
};

generateIds = (rooms) => {
    let ids = [];
    rooms.forEach(room => {
        for (us of room.users) {
            ids.push(us.id);
        }
    });
    return ids;
};

handleSocketAfterCreateRoom = async (room) => {
    try {
        await Promise.all(room.users.map(async user => {
            let sockets = await server.getRedis(user.id);
            if (sockets == null)
                return;
            let listSocket = sockets.split(',');
            await Promise.all(listSocket.map(async s => {
                console.log(s);
                await server.joinSocketRoom(room.id, s);
            }));
        }));
    } catch (err) {
        console.log('wtfff');
        console.log(err);
    }

}