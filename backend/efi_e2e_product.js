require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const db = require('./src/config/database');
const s = require('./src/services/efibankService');

const API = 'http://127.0.0.1:3001/api';
const PRODUCT_NAME = 'Produto Teste E2E Efi ' + Date.now().toString(36).toUpperCase();
let productId = null;
let orderId = null;

(async () => {
  try {
    const [prodRes] = await db.query(
      `INSERT INTO products (name, description, price, stock, is_active) VALUES (?, 'Produto temporario para teste E2E do pagamento Efi', 49.90, 10, 1)`,
      [PRODUCT_NAME]
    );
    productId = prodRes.insertId;
    console.log('PRODUCT OK id=' + productId + ' name=' + PRODUCT_NAME);

    // 1. Cria pedido de produto via fluxo publico (sem course_id)
    const orderResp = await axios.post(API + '/products/order-public', {
      name: 'Edson Vieira Lima',
      email: 'edprogramarweb@gmail.com',
      phone: '86999999999',
      cpf: '70911274391',
      address: 'Rua Joao da Cruz Monteiro, 1728 - Cristo Rei',
      city: 'Teresina',
      state: 'PI',
      zip_code: '64014-210',
      payment_method: 'pix',
      items: [{ product_id: productId, quantity: 1 }],
    }, { timeout: 30000 });
    orderId = orderResp.data.order_id;
    console.log('ORDER-PUBLIC OK id=' + orderId + ' number=' + orderResp.data.order_number + ' total=' + orderResp.data.total);

    // 2. JWT direto (Edson = user 4)
    const token = jwt.sign({ userId: 4 }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const authHeaders = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };

    // 3. PIX
    let txid = null;
    try {
      const pixResp = await axios.post(API + '/payments/efibank/pix', { order_id: orderId }, { headers: authHeaders, timeout: 60000 });
      const p = pixResp.data.payment;
      txid = p.txid;
      console.log('PIX GERADO OK');
      console.log('  txid=' + p.txid);
      console.log('  copy_paste_len=' + (p.copy_paste || '').length);
      console.log('  copy_paste=' + (p.copy_paste || '').slice(0, 100));
      console.log('  amount=' + p.amount);
    } catch (e) {
      console.log('PIX FAIL: ' + JSON.stringify(e.response?.data || e.message).slice(0, 400));
    }

    // 4. Boleto (mesmo pedido de produto)
    let chargeId = null;
    try {
      const boletoResp = await axios.post(API + '/payments/efibank/boleto', { order_id: orderId }, { headers: authHeaders, timeout: 60000 });
      const b = boletoResp.data.payment;
      chargeId = b.charge_id;
      console.log('BOLETO GERADO OK');
      console.log('  charge_id=' + b.charge_id);
      console.log('  status=' + b.status);
      console.log('  boleto_url=' + b.boleto_url);
      console.log('  barcode=' + b.barcode);
      console.log('  pix_copy_paste_len=' + (b.pix_copy_paste || '').length);
    } catch (e) {
      console.log('BOLETO FAIL: ' + JSON.stringify(e.response?.data || e.message).slice(0, 400));
    }

    // 5. Status
    try {
      const statusResp = await axios.get(API + '/payments/efibank/status/' + orderId, { headers: authHeaders, timeout: 30000 });
      console.log('STATUS OK: ' + JSON.stringify(statusResp.data).slice(0, 300));
    } catch (e) {
      console.log('STATUS FAIL: ' + JSON.stringify(e.response?.data || e.message).slice(0, 200));
    }

    // 6. Cancela cobrancas de teste
    const tokenPix = await s.getPixAccessToken();
    const httpsAgent = new (require('https').Agent)({ pfx: fs.readFileSync(path.resolve(process.env.EFIBANK_CERTIFICATE_PATH)), passphrase: process.env.EFIBANK_CERTIFICATE_PASSWORD || '' });

    if (txid) {
      try {
        const { data } = await axios.patch(s.BASE_URLS.pix + '/v2/cob/' + txid, { status: 'REMOVIDA_PELO_USUARIO_RECEBEDOR' }, {
          headers: { Authorization: 'Bearer ' + tokenPix, 'Content-Type': 'application/json' },
          httpsAgent, timeout: 30000,
        });
        console.log('PIX CANCELADO ' + txid + ' -> ' + data.status);
      } catch (e) {
        console.log('PIX CANCEL FAIL: ' + JSON.stringify(e.response?.data || e.message).slice(0, 200));
      }
    }

    if (chargeId) {
      try {
        await s.cancelBoleto(chargeId);
        console.log('BOLETO CANCELADO ' + chargeId);
      } catch (e) {
        console.log('BOLETO CANCEL FAIL: ' + JSON.stringify(e.response?.data || e.message).slice(0, 200));
      }
    }

    console.log('ORDER_ID_FINAL=' + orderId);
    console.log('PRODUCT_ID_FINAL=' + productId);
  } catch (e) {
    console.log('E2E FAIL: ' + JSON.stringify(e.response?.data || e.message).slice(0, 500));
  } finally {
    // 7. Limpeza no banco
    if (orderId) {
      await db.query('DELETE FROM payments WHERE order_id = ?', [orderId]).catch(() => {});
      await db.query('DELETE FROM order_items WHERE order_id = ?', [orderId]).catch(() => {});
      await db.query('DELETE FROM orders WHERE id = ?', [orderId]).catch(() => {});
      console.log('CLEANUP order ' + orderId);
    }
    if (productId) {
      await db.query('DELETE FROM products WHERE id = ?', [productId]).catch(() => {});
      console.log('CLEANUP product ' + productId);
    }
    process.exit(0);
  }
})();
