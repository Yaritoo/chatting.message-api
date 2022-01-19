const {Kafka} = require('kafkajs');

const kafka = new Kafka({
    clientId: 'message-app',
    brokers: ['kafka1:9092', 'kafka1:9092', 'kafka1:9092']
});

const producer = kafka.producer();

const consumer = kafka.consumer({groupId: 'group2'});

const subscribeManager = {};

module.exports = {producer, consumer, subscribeManager};