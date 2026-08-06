require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const db = require('./src/config/database');
const s = require('./src/services/efibankService');

const API = 'http://127.0.0.1:3001/api';
let productId = null;
let orderId = null;
let boletoOrderId = null;

(async () => {
  try {
    const [prodRes] = await db.query(
      `INSERT INTO products (name, description, price, stock, is_active) VALUES (?, 'Produto temporario para testar order-public com pagamento', 89.90, 10, 1)`,
      ['Produto OrderPublic Pagamento ' + Date.now().toString(36).toUpperCase()]
    );
    productId = prodRes.insertId;
    console.log('PRODUCT OK id=' + productId);

    // PIX via order-public
    const pixResp = await axios.post(API + '/products/order-public', {
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
    orderId = pixResp.data.order_id;
    console.log('ORDER PIX OK id=' + orderId + ' number=' + pixResp.data.order_number + ' total=' + pixResp.data.total);
    console.log('  payment.type=' + pixResp.data.payment?.type);
    console.log('  payment.txid=' + pixResp.data.payment?.txid);
    console.log('  payment.copy_paste_len=' + (pixResp.data.payment?.copy_paste || '').length);
    console.log('  payment.qr_base64_len=' + (pixResp.data.payment?.qr_code || '').length);
    console.log('  payment.amount=' + pixResp.data.payment?.amount);

    const [pixPayment] = await db.query('SELECT id, gateway_payment_id FROM payments WHERE order_id = ?', [orderId]);
    console.log('  PAYMENTS row=' + JSON.stringify(pixPayment));

    // Boleto via order-public (novo pedido)
    const boletoResp = await axios.post(API + '/products/order-public', {
      name: 'Edson Vieira Lima',
      email: 'edprogramarweb@gmail.com',
      phone: '86999999999',
      cpf: '70911274391',
      address: 'Rua Joao da Cruz Monteiro, 1728 - Cristo Rei',
      city: 'Teresina',
      state: 'PI',
      zip_code: '64014-210',
      payment_method: 'boleto',
      items: [{ product_id: productId, quantity: 1 }],
    }, { timeout: 60000 });
    boletoOrderId = boletoResp.data.order_id;    console.log('ORDER BOLETO OK id=' + boletoOrderId + ' number=' + boletoResp.data.order_number);
    console.log('  payment.type=' + boletoResp.data.payment?.type);
    console.log('  payment.charge_id=' + boletoResp.data.payment?.charge_id);
    console.log('  payment.status=' + boletoResp.data.payment?.status);
    console.log('  payment.boleto_url=' + boletoResp.data.payment?.boleto_url);
    console.log('  payment.barcode=' + boletoResp.data.payment?.barcode);
    console.log('  payment.pix_copy_paste_len=' + (boletoResp.data.payment?.pix_copy_paste || '').length);

    // Cancela cobranças
    const tokenPix = await s.getPixAccessToken();
    const httpsAgent = new (require('https').Agent)({ pfx: fs.readFileSync(path.resolve(process.env.EFIBANK_CERTIFICATE_PATH)), passphrase: process.env.EFIBANK_CERTIFICATE_PASSWORD || '' });
    const txid = pixResp.data.payment?.txid;
    if (txid) {
      try {
        const { data } = await axios.patch(s.BASE_URLS.pix + '/v2/cob/' + txid, { status: 'REMOVIDA_PELO_USUARIO_RECEBEDOR' }, {
          headers: { Authorization: 'Bearer ' + tokenPix, 'Content-Type': 'application/json' }, httpsAgent, timeout: 30000,
        });
        console.log('PIX CANCELADO ' + txid + ' -> ' + data.status);
      } catch (e) {
        console.log('PIX CANCEL FAIL: ' + JSON.stringify(e.response?.data || e.message).slice(0, 200));
      }
    }
    const chargeId = boletoResp.data.payment?.charge_id;
    if (chargeId) {
      try {
        await s.cancelBoleto(chargeId);
        console.log('BOLETO CANCELADO ' + chargeId);
      } catch (e) {
        console.log('BOLETO CANCEL FAIL: ' + JSON.stringify(e.response?.data || e.message).slice(0, 200));
      }
    }

    console.log('ORDER_PIX_FINAL=' + orderId);
    console.log('ORDER_BOLETO_FINAL=' + boletoOrderId);
  } catch (e) {
    console.log('E2E FAIL: ' + JSON.stringify(e.response?.data || e.message).slice(0, 500));
  } finally {
    for (const oid of [orderId, boletoOrderId]) {
      if (oid) {
        await db.query('DELETE FROM payments WHERE order_id = ?', [oid]).catch(() => {});
        await db.query('DELETE FROM order_items WHERE order_id = ?', [oid]).catch(() => {});
        await db.query('DELETE FROM orders WHERE id = ?', [oid]).catch(() => {});
      }
    }
    if (productId) {
      await db.query('DELETE FROM products WHERE id = ?', [productId]).catch(() => {});
    }
    process.exit(0);
  }
})();
