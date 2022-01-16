const eventbus = require('./eventbus-kafka');
const Room = require('../api/model/room');

exports.GetUserHandler = async (res, message) => {
    let rooms = await Room.find({userIds: req.params.userId}).exec();
    await eventbus.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log(message.value.toString());
        }
    });
    res.status(200).json(rooms);
}