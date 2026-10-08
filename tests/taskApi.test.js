const request = require('supertest');
const express = require('express');

// Mock total de los módulos externos para entornos CI sin servicios levantados
jest.mock('../src/queues/taskQueue', () => ({
  taskQueue: {
    add: jest.fn().mockResolvedValue({ id: 'test-job-123' }),
  },
  connection: {},
}));

jest.mock('../src/config/db', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] }),
}));

const taskRoutes = require('../src/routes/taskRoutes');

const app = express();
app.use(express.json());
app.use('/api', taskRoutes);

describe('POST /api/tasks', () => {
  it('debe crear una nueva tarea y responder con status 202', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Tarea de prueba automatizada',
        payload: { test: true },
      });

    expect(res.statusCode).toEqual(202);
    expect(res.body).toHaveProperty('jobId', 'test-job-123');
    expect(res.body).toHaveProperty('status', 'pending');
  });

  it('debe retornar un error 400 si no se provee el título', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({});

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error');
  });
});
