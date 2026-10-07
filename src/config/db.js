const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'task_db',
  password: process.env.DB_PASSWORD || 'postgrespassword',
  port: parseInt(process.env.DB_PORT, 10) || 5433,
});

// Inicializar la tabla de tareas si no existe
const initDb = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      job_id VARCHAR(50) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      result TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(queryText);
    console.log('Tabla "tasks" verificada/creada en PostgreSQL.');
  } catch (err) {
    console.error('Error al inicializar la base de datos PostgreSQL:', err.message);
  }
};

initDb();

module.exports = {
  query: (text, params) => pool.query(text, params),
};
