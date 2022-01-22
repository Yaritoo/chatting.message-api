const http = require('http');
const redis = require('redis');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = require('./app');
const eventbus = require('./eventbus/eventbus-kafka');
const eventHandler = require('./eventbus/event-handler');
const Room = require('./api/model/room');

const port = process.env.PORT || 3001;
const redis_port = process.env.REDIS_PORT || 6379;

const clientRedis = redis.createClient({
    socket: {
        host: 'redis',
        port: 6379
    }
});
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
        await clientRedis.connect();

        await eventbus.producer.connect();

        await eventbus.consumer.connect();
        await eventbus.consumer.subscribe({ topic: 'get-user', fromBeginning: true });
        await eventbus.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                let user = JSON.parse(message.value.toString());
                console.log('kafka receive: ', user);
                await clientRedis.set(user._id, message.value.toString());
            }
        });
    } catch (err) {
        console.log(err);
    }
}
test();

server.listen(port);
io.on('connection', (socket) => {
    console.log('A client is connected');
    socket.on('id', async mess => {
        if (!mongoose.Types.ObjectId.isValid(mess))
            return;
        let rooms = await Room.find({ userIds: mess }).exec();
        rooms.forEach(room => {
            socket.join(room.id);
        });
    });
    socket.on('disconnect', () => {
        console.log('A client disconnected');
    });
});

io.of("/").adapter.on("join-room", (room, id) => {
    console.log(`socket ${id} has joined room ${room}`);
});

exports.sendSocketRoomExceptSender = (room, userId, message) => {
    const clients = io.of("/").adapter.rooms.get(room);
    console.log('clients: ' + Array.from(clients));
    for (let socketId of clients) {
        if (socketId == userId) {
            continue;
        }

        io.to(socketId).emit('message', message);
    }
};

exports.getRedis = async (key) => {
    let result;
    try {
        result = await clientRedis.get(key);
    } catch (err) {
        result = null;
    }
    return result
}
