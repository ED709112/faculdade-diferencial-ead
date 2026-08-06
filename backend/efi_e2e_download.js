require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('./src/config/database');

const API = 'http://127.0.0.1:3001/api';
const DOWNLOAD_URL = 'https://www.africau.edu/images/default/sample.pdf';
let productId = null;
let orderId = null;

(async () => {
  try {
    // 0. JWT admin
    const [admin] = await db.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
    if (!admin[0]) throw new Error('sem admin');
    const adminToken = jwt.sign({ userId: admin[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const adminHeaders = { Authorization: 'Bearer ' + adminToken, 'Content-Type': 'application/json' };

    // 1. Criar apostila via endpoint admin (o que dava erro antes)
    const productName = 'Apostila E2E Download ' + Date.now().toString(36).toUpperCase();
    const createResp = await axios.post(API + '/products', {
      name: productName,
      description: 'Apostila de teste para validar liberacao de download apos pagamento',
      price: 29.90,
      original_price: 49.90,
      stock: 100,
      product_type: 'apostila',
      category: 'Material de Estudo',
      download_url: DOWNLOAD_URL,
      is_active: true,
    }, { headers: adminHeaders, timeout: 30000 });
    productId = createResp.data.id;
    console.log('CREATE OK id=' + productId + ' type=' + createResp.data.product_type + ' download_url=' + createResp.data.download_url);
    console.log('  category=' + createResp.data.category + ' image=' + createResp.data.image + ' sales_count=' + createResp.data.sales_count);

    // 2. Pedido público (comprador = Edson, user 4)
    const orderResp = await axios.post(API + '/products/order-public', {
      name: 'Edson Vieira Lima',
      email: 'edprogramarweb@gmail.com',
      phone: '86999999999',
      cpf: '70911274391',
      address: 'Rua Joao da Cruz Monteiro, 1728 - Cristo Rei',
      city: 'Teresina', state: 'PI', zip_code: '64014-210',
      payment_method: 'boleto',
      items: [{ product_id: productId, quantity: 1 }],
    }, { timeout: 60000 });
    orderId = orderResp.data.order_id;
    console.log('ORDER OK id=' + orderId + ' payment.type=' + orderResp.data.payment?.type);

    // 3. JWT comprador
    const buyerToken = jwt.sign({ userId: 4 }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const buyerHeaders = { Authorization: 'Bearer ' + buyerToken, 'Content-Type': 'application/json' };

    // 4. Antes do pagamento: /products/my NAO deve listar, download deve ser negado
    const myBefore = await axios.get(API + '/products/my', { headers: buyerHeaders, timeout: 30000 });
    const hasBefore = myBefore.data.data.some(p => p.id === productId);
    console.log('MY antes do pagamento: produtos=' + myBefore.data.data.length + ' temProduto=' + hasBefore);

    try {
      await axios.get(API + '/products/' + productId + '/download', { headers: buyerHeaders, timeout: 30000, maxRedirects: 0 });
      console.log('DOWNLOAD antes: PERMITIU (erro esperado negar)');
    } catch (e) {
      console.log('DOWNLOAD antes: NEGADO (' + (e.response?.status || e.message) + ')');
    }

    // 5. Pagar pedido (simula confirmacao de pagamento via webhook)
    await db.query(`UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = ?`, [orderId]);
    console.log('PEDIDO MARCADO PAGO');

    // 6. Depois do pagamento: /products/my deve listar
    const myAfter = await axios.get(API + '/products/my', { headers: buyerHeaders, timeout: 30000 });
    const found = myAfter.data.data.find(p => p.id === productId);
    console.log('MY depois do pagamento: produtos=' + myAfter.data.data.length + ' temProduto=' + !!found);
    if (found) console.log('  encontrado: ' + found.name + ' | download_url=' + found.download_url);

    // 7. Download liberado (deve redirecionar)
    try {
      const dl = await axios.get(API + '/products/' + productId + '/download', { headers: buyerHeaders, timeout: 30000, maxRedirects: 0 });
      console.log('DOWNLOAD depois: status=' + dl.status + ' location=' + (dl.headers.location || ''));
    } catch (e) {
      if (e.response?.status === 302 || e.response?.headers?.location) {
        console.log('DOWNLOAD depois: 302 -> ' + e.response.headers.location);
      } else {
        console.log('DOWNLOAD depois: status=' + (e.response?.status || e.message));
      }
    }

    // 8. Checar /products publico (getAllPublic com a apostila)
    const pub = await axios.get(API + '/products?search=' + encodeURIComponent(productName), { timeout: 30000 });
    console.log('PUBLIC search: total=' + pub.data.meta.total + ' tipo=' + pub.data.data[0]?.product_type);

    console.log('PRODUCT_ID_FINAL=' + productId);
    console.log('ORDER_ID_FINAL=' + orderId);
  } catch (e) {
    console.log('E2E FAIL: ' + JSON.stringify(e.response?.data || e.message).slice(0, 600));
  } finally {
    if (orderId) {
      await db.query('DELETE FROM payments WHERE order_id = ?', [orderId]).catch(() => {});
      await db.query('DELETE FROM order_items WHERE order_id = ?', [orderId]).catch(() => {});
      await db.query('DELETE FROM orders WHERE id = ?', [orderId]).catch(() => {});
    }
    if (productId) {
      await db.query('DELETE FROM order_items WHERE product_id = ?', [productId]).catch(() => {});
      await db.query('DELETE FROM products WHERE id = ?', [productId]).catch(() => {});
    }
    console.log('CLEANUP OK');
    process.exit(0);
  }
})();
