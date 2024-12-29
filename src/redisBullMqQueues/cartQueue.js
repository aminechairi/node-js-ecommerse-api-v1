const { Queue } = require('bullmq');
const redisBullMQConnection = require('../config/redisBullMq');

const cartQueue = new Queue('cartQueue', { connection: redisBullMQConnection });

module.exports = cartQueue;