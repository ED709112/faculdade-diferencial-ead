const mysql = require('mysql2/promise');

(async () => {
  const pool = await mysql.createPool({
    host: 'localhost', port: 3306, user: 'root',
    database: 'faculdade_diferencial_ead', charset: 'utf8mb4'
  });

  await pool.query('UPDATE users SET name = ? WHERE id = ?', ['Professor João Silva', 2]);
  console.log('Fixed user 2');

  const [users] = await pool.query('SELECT id, name FROM users');
  for (const u of users) console.log(`  User ${u.id}: ${u.name}`);

  await pool.end();
})();
