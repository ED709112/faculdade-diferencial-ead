const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: '127.0.0.1', user: 'faculdade_user', password: 'F@c3d@2026!', database: 'faculdade_diferencial_ead' });
  const [o] = await c.query("SELECT id, order_number, status, total_amount, created_at FROM orders WHERE order_number LIKE 'PED-%' ORDER BY id DESC LIMIT 5");
  console.log('ORDERS:', JSON.stringify(o, null, 1));
  const [pay] = await c.query("SELECT id, order_id, payment_method, status, gateway_payment_id FROM payments ORDER BY id DESC LIMIT 5");
  console.log('PAYMENTS:', JSON.stringify(pay, null, 1));
  const [oi] = await c.query('SELECT id, order_id, product_id FROM order_items ORDER BY id DESC LIMIT 5');
  console.log('ORDER_ITEMS:', JSON.stringify(oi));
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1) });
