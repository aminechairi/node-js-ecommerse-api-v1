const ioredis = require("ioredis");

const resiaBullMqHost = process.env.REDIS_BULLMQ_HOST;
const resiaBullMqPort = process.env.REDIS_BULLMQ_PORT;
const resiaBullMqPassword = process.env.REDIS_BULLMQ_PASSWORD;

// Define the ioredis connection options
const redisBullMQConnection = new ioredis({
  host: resiaBullMqHost,
  port: resiaBullMqPort,
  password: resiaBullMqPassword,
  maxRetriesPerRequest: null,
});

module.exports = redisBullMQConnection;
