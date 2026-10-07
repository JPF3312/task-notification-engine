const { Queue } = require('bullmq');
require('dotenv').config();

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
};

// Crear la cola de tareas pesadas
const taskQueue = new Queue('task-processing-queue', { connection });

module.exports = { taskQueue, connection };
