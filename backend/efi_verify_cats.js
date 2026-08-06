require('dotenv').config();
const jwt = require('jsonwebtoken');
const { default: axios } = require('axios');
const mysql = require('mysql2/promise');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3001';
const JWT_SECRET = process.env.JWT_SECRET;
const token = jwt.sign({ userId: 4, role: 'admin' }, JWT_SECRET);

(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', user: 'faculdade_user', password: 'F@c3d@2026!', database: 'faculdade_diferencial_ead'
  });
  const [rows] = await conn.query('SELECT id, name, slug, is_active FROM categories');
  const [admins] = await conn.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  await conn.end();

  console.log('CATEGORIAS NO DB:');
  for (const r of rows) console.log('  id=' + r.id + ' name=' + r.name + ' slug=' + r.slug + ' active=' + r.is_active);

  const token = jwt.sign({ userId: admins[0].id }, JWT_SECRET, { expiresIn: '1h' });

  const all = await axios.get(BASE + '/api/products/categories/all', { headers: { Authorization: 'Bearer ' + token } });
  console.log('GET /categories/all (admin): ' + JSON.stringify(all.data));

  const store = await axios.get(BASE + '/api/products/categories');
  console.log('GET /categories (loja): ' + JSON.stringify(store.data));
})().catch(e => { console.error('ERRO: ' + (e.response ? JSON.stringify(e.response.data) : e.message)); process.exit(1); });
