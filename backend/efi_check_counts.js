const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: '127.0.0.1', user: 'faculdade_user', password: 'F@c3d@2026!', database: 'faculdade_diferencial_ead' });
  const [users] = await c.query(
    `SELECT u.id, u.name, u.email,
            (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id AND e.status IN ('active','pending','completed')) AS enrollments_count
     FROM users u WHERE u.role = 'student' ORDER BY u.id`
  );
  for (const u of users) console.log('id=' + u.id + ' nome=' + u.name + ' | matrículas=' + u.enrollments_count);
  const [enr] = await c.query('SELECT user_id, COUNT(*) n FROM enrollments GROUP BY user_id ORDER BY user_id');
  console.log('\nDireto da tabela enrollments:');
  for (const e of enr) console.log('  user_id=' + e.user_id + ' n=' + e.n);
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1) });
