const mongoose = require('mongoose');

const Message = require('../model/message');
const server = require('../../server');


exports.messages_ofRoom = async (req, res, next) => {
    try {
        let messages = await Message.find({ roomId: req.params.roomId }).sort({createdTime: -1}).exec();
        let ids='';
        messages.forEach(mess => {
            ids += mess.userId + ',';
        });
        
        let users = await getUsers(next, ids);
        let response = messages.map(m => {
            let user = users.find(id=>id._id == m.userId);
            return {
                id: m.id,
                content: m.content,
                createdTime: m.createdTime,
                replyMessageId: m.replyMessageId,
                user: {
                    userName: user.userName
                },
                roomId: m.roomId
            }
        });
        res.status(200).json(response);
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
        server.sendSocketRoomExceptSender(req.body.roomId, req.body.socketId, newMessage);
        res.status(201).json(newMessage);
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
}