const {Kafka} = require('kafkajs');

const kafka = new Kafka({
    clientId: 'message-app',
    brokers: ['localhost:9093', 'localhost:9094', 'localhost:9095']
});

const producer = kafka.producer();

const consumer = kafka.consumer({groupId: 'group2'});

const subscribeManager = {};

module.exports = {producer, consumer, subscribeManager};