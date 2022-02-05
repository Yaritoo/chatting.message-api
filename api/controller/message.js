const mongoose = require('mongoose');
const http = require('http');

const Message = require('../model/message');
const server = require('../../server');


exports.messages_ofRoom = async (req, res, next) => {
    try {
        let messages = await Message.find({ roomId: req.params.roomId }).sort({ createdTime: -1 }).exec();
        if (messages.length == 0) {
            res.status(200).json([]);
            return;
        }
        let ids = '';
        messages.forEach(mess => {
            ids += mess.userId + ',';
        });
        let users = await getUsers(next, ids);
        let result = messages.map(m => {
            let user = users.find(u => u.id == m.userId);
            return {
                id: m.id,
                content: m.content,
                createdTime: m.createdTime,
                replyMessageId: m.replyMessageId,
                user: {
                    id: user.id,
                    userName: user.userName
                },
                roomId: m.roomId
            }
        });
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({
            error: err
        });
    }
}

exports.message_create = async (req, res, next) => {
    try {
        let newMessage = new Message({
            _id: new mongoose.Types.ObjectId,
            content: req.body.content,
            createdTime: Date.now(),
            replyMessageId: req.body.replyMessageId,
            userId: req.body.userId,
            roomId: req.body.roomId
        });
        //await newMessage.save();
        let user = await getUser(next, newMessage.userId);
        let result = {
            id: newMessage.id,
            content: newMessage.content,
            createdTime: newMessage.createdTime,
            replyMessageId: newMessage.replyMessageId,
            user: user,
            roomId: newMessage.roomId
        }
        await server.sendSocketRoomExceptSender('message', req.body.roomId, req.body.socketId, result);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({
            error: err
        });
    }
}

getUsers = (next, ids) => {
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
        });

    return users;
}

getUser = (next, id) => {
    var url = `http://user_api:3000/user/${id}`;
    let user = new Promise((resolve, reject) => http.get(url, res => {
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

    return user;
}