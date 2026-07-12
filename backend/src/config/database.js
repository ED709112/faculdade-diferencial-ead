const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'faculdade_diferencial_ead',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
  dateStrings: true
});

// Testar conexão
pool.getConnection()
  .then(conn => {
    console.log('Conectado ao MySQL com sucesso!');
    conn.release();
  })
  .catch(err => {
    console.error('Erro ao conectar ao MySQL:', err.message);
  });

module.exports = pool;
