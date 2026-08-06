const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: '127.0.0.1', user: 'faculdade_user', password: 'F@c3d@2026!', database: 'faculdade_diferencial_ead' });
  const [p] = await c.query("SELECT COUNT(*) n FROM products WHERE name LIKE 'Apostila E2E%' OR name LIKE 'Teste%'");
  const [o] = await c.query("SELECT COUNT(*) n FROM orders WHERE order_number LIKE 'PED-TESTE%' OR order_number LIKE 'PED-MSG%' OR order_number LIKE 'PED-FAD%'");
  const [pay] = await c.query("SELECT COUNT(*) n FROM payments WHERE gateway_payment_id LIKE 'FAD%'");
  const [pl] = await c.query("SELECT COUNT(*) n FROM products");
  console.log('sobras de teste em products:', p[0].n, '| total products:', pl[0].n);
  console.log('sobras de teste em orders:', o[0].n);
  console.log('sobras de teste em payments:', pay[0].n);
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1) });
