const { Queue } = require('bullmq');
const redisBullMQConnection = require('../config/redisBullMQ');

const cartQueue = new Queue('cartQueue', { connection: redisBullMQConnection });

module.exports = cartQueue;