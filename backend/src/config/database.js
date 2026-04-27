const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'seekops',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function testConexion() {
  try {
    const client = await pool.connect();
    console.log('Conexión a PostgreSQL establecida');
    client.release();
  } catch (err) {
    console.error('Error al conectar a PostgreSQL:', err.message);
    throw err;
  }
}

async function consultar(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function consultarUno(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows[0] || null;
}

module.exports = { pool, testConexion, consultar, consultarUno };
