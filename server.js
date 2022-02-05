const http = require('http');
const redis = require('redis');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const redis_adapter = require('@socket.io/redis-adapter');

const app = require('./app');
const eventbus = require('./eventbus/eventbus-kafka');
const Room = require('./api/model/room');
const { set } = require('./app');

const port = process.env.PORT || 3001;
const redis_port = process.env.REDIS_PORT || 6379;

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});
const clientRedis = redis.createClient({
    url: 'redis://redis:6379'
});
const subClientRedis = clientRedis.duplicate();
io.adapter(redis_adapter.createAdapter(clientRedis, subClientRedis));

eventbus.manageSubcribe();

const test = async () => {
    try {
        await clientRedis.connect();

        await eventbus.producer.connect();

        await eventbus.consumer.connect();
        await eventbus.consumer.subscribe({ topic: 'get-user', fromBeginning: true });
        await eventbus.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                if (eventbus.subscribeManager[topic])
                    await eventbus.subscribeManager[topic](partition, message);
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
        let data = JSON.parse(mess);

        let socketsOfId = [];
        let temp = await this.getRedis(data.id);
        if (temp != null)
            socketsOfId = temp.split(',');
        socketsOfId.push(data.socketId);
        this.setRedis(data.id, socketsOfId.toString());
        this.setRedis(data.socketId, data.id);

        if (!mongoose.Types.ObjectId.isValid(data.id))
            return;
        let rooms = await Room.find({ userIds: data.id }).exec();
        rooms.forEach(room => {
            socket.join(room.id);
        });
    });

    socket.on('disconnect', async () => {
        console.log('A client disconnected');

        let id = await this.getRedis(socket.id);
        this.delRedis(socket.id);

        let temp = await this.getRedis(id);
        if (temp == null)
            return;
        let socketsOfId = temp.split(',');
        let result = socketsOfId.filter(s => s != socket.id);
        if (result.length == 0)
            this.delRedis(id)
        else
            this.setRedis(id, result.toString());

    });
});

io.of("/").adapter.on("join-room", (room, id) => {
    console.log(`socket ${id} has joined room ${room}`);
});

exports.sendSocketRoomExceptSender = async (channel, roomId, userId, message) => {
    try {
        const clients = await io.of("/").adapter.sockets(new Set([roomId]));

        for (let socketId of clients) {
            if (socketId == userId) {
                continue;
            }
            io.to(socketId).emit(channel, message);
            console.log(channel);
            console.log(socketId);
        }
    } catch (err) {
        console.log('emit failed huhuhu');
        console.log(err);
    }

};

exports.joinSocketRoom = async (room, socketId) => {
    try {
        await io.of('/').adapter.remoteJoin(socketId, room);
    } catch (e) {
        // the socket was not found
        console.log('remote join failed');
        console.log(e);
    }
}

exports.leaveSocketRoom = async (room, socketId) => {
    try {
        await io.of('/').adapter.remoteLeave(socketId, room);
    } catch (e) {
        // the socket was not found
        console.log('remote leave failed');
        console.log(e);
    }
}

exports.getRedis = async (key) => {
    let result;
    try {
        result = await clientRedis.get(key);
    } catch (err) {
        console.log('get redis FAIL ');
        console.log(err);
        return null;
    }
    return result;
}

exports.setRedis = async (key, value) => {
    try {
        await clientRedis.set(key, value);
    } catch (err) {
        console.log('set redis failed');
        console.log(err);
    }
}

exports.delRedis = async (key) => {
    try {
        await clientRedis.del(key);
    } catch (err) {
        console.log('delete redis failed');
        console.log(err);
    }
}
