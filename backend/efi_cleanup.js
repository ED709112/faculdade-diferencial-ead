const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: '127.0.0.1', user: 'faculdade_user', password: 'F@c3d@2026!', database: 'faculdade_diferencial_ead' });
  const [p] = await c.query('SELECT id, name, is_active FROM products');
  console.log(p);
  const del = await c.query("DELETE FROM products WHERE name LIKE 'Apostila E2E%' OR name LIKE 'Teste%'");
  console.log('deleted:', del[0].affectedRows);
  const [p2] = await c.query('SELECT COUNT(*) n FROM products');
  console.log('total products agora:', p2[0].n);
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1) });
