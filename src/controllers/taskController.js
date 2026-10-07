const { taskQueue } = require('../queues/taskQueue');
const db = require('../config/db');

const createTask = async (req, res) => {
  try {
    const { title, payload } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'El título de la tarea es obligatorio.' });
    }

    const job = await taskQueue.add('process-task', {
      title,
      payload: payload || {},
    }, {
      attempts: 3,
      backoff: 5000,
    });

    // Registrar tarea en Postgres
    await db.query(
      'INSERT INTO tasks (job_id, title, status) VALUES ($1, $2, $3)',
      [job.id, title, 'pending']
    );

    return res.status(202).json({
      message: 'Tarea agregada a la cola exitosamente.',
      jobId: job.id,
      status: 'pending',
    });
  } catch (error) {
    console.error('Error al agregar la tarea:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = { createTask };
