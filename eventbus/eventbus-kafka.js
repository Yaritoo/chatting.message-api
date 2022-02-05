const { Kafka } = require('kafkajs');
const eventHandler = require('./event-handler');

const kafka = new Kafka({
    clientId: 'message-app',
    brokers: ['kafka1:9092', 'kafka1:9092', 'kafka1:9092']
});

const producer = kafka.producer();

const consumer = kafka.consumer({ groupId: 'group2' });

const subscribeManager = {};

const manageSubcribe = () => {
    console.log('event bus');
    subscribeManager['get-user'] = eventHandler.GetUserHandler;
};

module.exports = { producer, consumer, subscribeManager, manageSubcribe };