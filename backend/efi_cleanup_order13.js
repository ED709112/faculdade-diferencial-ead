require('dotenv').config();
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const https = require('https');
const mysql = require('mysql2/promise');
const efibank = require('./src/services/efibankService');

(async () => {
  const c = await mysql.createConnection({ host: '127.0.0.1', user: 'faculdade_user', password: 'F@c3d@2026!', database: 'faculdade_diferencial_ead' });
  const [pays] = await c.query("SELECT id, order_id, gateway_payment_id FROM payments WHERE status='pending' AND order_id = 13");
  if (pays.length > 0) {
    const tokenPix = await efibank.getPixAccessToken();
    const httpsAgent = new https.Agent({ pfx: fs.readFileSync(path.resolve(process.env.EFIBANK_CERTIFICATE_PATH)), passphrase: process.env.EFIBANK_CERTIFICATE_PASSWORD || '' });
    for (const p of pays) {
      try {
        const { data } = await axios.patch(efibank.BASE_URLS.pix + '/v2/cob/' + p.gateway_payment_id, { status: 'REMOVIDA_PELO_USUARIO_RECEBEDOR' }, {
          headers: { Authorization: 'Bearer ' + tokenPix, 'Content-Type': 'application/json' }, httpsAgent, timeout: 30000,
        });
        console.log('PIX CANCELADO ' + p.gateway_payment_id + ' -> ' + data.status);
      } catch (e) {
        console.log('PIX CANCEL FAIL: ' + JSON.stringify(e.response?.data || e.message).slice(0, 200));
      }
    }
  }
  const delPay = await c.query('DELETE FROM payments WHERE order_id = 13');
  const delItems = await c.query('DELETE FROM order_items WHERE order_id = 13');
  const delOrders = await c.query('DELETE FROM orders WHERE id = 13');
  console.log('deleted payments=' + delPay[0].affectedRows + ' items=' + delItems[0].affectedRows + ' orders=' + delOrders[0].affectedRows);
  const [rem] = await c.query("SELECT COUNT(*) n FROM orders WHERE order_number LIKE 'PED-%' AND total_amount < 100");
  console.log('pedidos de teste restantes:', rem[0].n);
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1) });
