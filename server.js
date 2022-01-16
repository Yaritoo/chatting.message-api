const http = require('http');
const redis = require('redis');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = require('./app');
const eventbus = require('./eventbus/eventbus-kafka');
const eventHandler = require('./eventbus/event-handler');
const Room = require('./api/model/room');

const port = process.env.PORT || 3001;
const redis_port = process.env.REDIS_PORT || 2000;

const clientRedis = redis.createClient(redis_port);
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

const configSubcribeManager = () => {
    eventbus.subscribeManager['get-user'] = eventHandler.GetUserHandler;
}
configSubcribeManager();

const test = async () => {
    try {
        await eventbus.producer.connect();

        await eventbus.consumer.connect();
        await eventbus.consumer.subscribe({ topic: 'get-user', fromBeginning: true });
        await eventbus.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {

            }
        });
    } catch (err) {
        console.log(err);
    }
}
test();

server.listen(port);
io.on('connection', (socket) => {
    console.log('server connected');
    socket.on('id', async mess => {
        if (!mongoose.Types.ObjectId.isValid(mess))
            return;
        let rooms = await Room.find({ userIds: mess }).exec();
        rooms.forEach(room => {
            socket.join(room.id);
        });
    });
    socket.on('disconnect', () => {
        console.log('disconnected');
    });
});

exports.sendSocketRoom = (room, message) => {
    io.to('room').emit('message', message);
};

