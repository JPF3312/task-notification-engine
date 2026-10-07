const { Worker } = require('bullmq');
const { connection } = require('../queues/taskQueue');
const db = require('../config/db');
const Redis = require('ioredis');

const pub = new Redis(connection);

console.log('Worker de procesamiento de tareas iniciado...');

const worker = new Worker(
  'task-processing-queue',
  async (job) => {
    console.log(`[JOB ${job.id}] Procesando: "${job.data.title}"`);

    // Estado 'processing'
    await db.query('UPDATE tasks SET status = $1, updated_at = NOW() WHERE job_id = $2', ['processing', job.id]);

    for (let progress = 25; progress <= 100; progress += 25) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await job.updateProgress(progress);

      // Publicar progreso a Redis para que socket.io lo retransmita
      pub.publish('job_updates', JSON.stringify({
        jobId: job.id,
        progress,
        status: progress === 100 ? 'completed' : 'processing',
      }));
    }

    const resultMessage = `Tarea "${job.data.title}" procesada exitosamente.`;

    // Estado 'completed'
    await db.query(
      'UPDATE tasks SET status = $1, result = $2, updated_at = NOW() WHERE job_id = $3',
      ['completed', resultMessage, job.id]
    );

    return { status: 'completed', result: resultMessage };
  },
  { connection }
);

worker.on('failed', async (job, err) => {
  console.error(`[JOB ${job?.id}] Falló con error: ${err.message}`);
  if (job) {
    await db.query('UPDATE tasks SET status = $1, result = $2, updated_at = NOW() WHERE job_id = $3', ['failed', err.message, job.id]);
  }
});
