const eventbus = require('./eventbus-kafka');
const Room = require('../api/model/room');
const server = require('../server');

exports.GetUserHandler = async (partition, message) => {
    let user = JSON.parse(message.value.toString());
    let result = {
        id: user.id,
        userName: user.userName
    };
    console.log('kafka receive: ', result);
}