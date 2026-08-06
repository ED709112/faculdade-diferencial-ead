require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const FormData = require('form-data');
const db = require('./src/config/database');

const API = 'http://127.0.0.1:3001/api';
let productId = null;
let orderId = null;

(async () => {
  try {
    const [admin] = await db.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
    const adminToken = jwt.sign({ userId: admin[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const adminHeaders = { Authorization: 'Bearer ' + adminToken, 'Content-Type': 'application/json' };

    const [buyer] = await db.query(`SELECT id, name, email FROM users WHERE role = 'student' LIMIT 1`);
    console.log('BUYER:', JSON.stringify(buyer[0]));
    const buyerToken = jwt.sign({ userId: buyer[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const buyerHeaders = { Authorization: 'Bearer ' + buyerToken, 'Content-Type': 'application/json' };

    // 1. Criar produto
    const productName = 'Apostila Upload E2E ' + Date.now().toString(36).toUpperCase();
    const createResp = await axios.post(API + '/products', {
      name: productName, description: 'teste upload', price: 19.90, stock: 10,
      product_type: 'apostila', is_active: true
    }, { headers: adminHeaders });
    productId = createResp.data.id;
    console.log('CREATE OK id=' + productId + ' download_url=' + createResp.data.download_url);

    // 2. Upload do arquivo (anexar apostila)
    const fd = new FormData();
    fd.append('file', Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF'), { filename: 'apostila-teste.pdf', contentType: 'application/pdf' });
    const upResp = await axios.post(API + '/products/' + productId + '/download-file', fd, { headers: { Authorization: 'Bearer ' + adminToken, ...fd.getHeaders() } });
    console.log('UPLOAD OK download_url=' + upResp.data.download_url);
    if (!upResp.data.download_url || !upResp.data.download_url.startsWith('/uploads/products-downloads/')) {
      throw new Error('download_url invalida apos upload');
    }

    // 3. Pedido do comprador
    const orderResp = await axios.post(API + '/products/order-public', {
      name: buyer[0].name || 'Comprador E2E', email: buyer[0].email, phone: '(00) 00000-0000',
      payment_method: 'pix',
      items: [{ product_id: productId, quantity: 1 }]
    }, { headers: buyerHeaders });
    orderId = orderResp.data.order_id;
    console.log('ORDER OK id=' + orderId + ' status=' + orderResp.data.payment?.type);

    // 4. Antes do pagamento: download negado
    const before = await axios.get(API + '/products/' + productId + '/download', { headers: buyerHeaders, maxRedirects: 0, validateStatus: () => true });
    console.log('DOWNLOAD antes: status=' + before.status);

    // 5. Marcar pago e testar download
    await db.query("UPDATE orders SET status = 'paid' WHERE id = ?", [orderId]);
    const after = await axios.get(API + '/products/' + productId + '/download', { headers: buyerHeaders, maxRedirects: 0, validateStatus: () => true });
    console.log('DOWNLOAD depois: status=' + after.status + ' location=' + after.headers.location);

    // 6. Arquivo servido pelo nginx/backend
    const file = await axios.get('http://127.0.0.1:3001' + after.headers.location, { validateStatus: () => true });
    console.log('GET arquivo: status=' + file.status + ' type=' + file.headers['content-type'] + ' bytes=' + file.data.length);

    // 7. Limpeza
    await db.query('DELETE FROM payments WHERE order_id = ?', [orderId]);
    await db.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
    await db.query('DELETE FROM orders WHERE id = ?', [orderId]);
    await db.query('DELETE FROM products WHERE id = ?', [productId]);
    console.log('CLEANUP OK');
  } catch (e) {
    console.error('ERRO: ' + (e.response ? JSON.stringify(e.response.data) : e.message));
    if (productId) await db.query('DELETE FROM products WHERE id = ?', [productId]);
    if (orderId) {
      await db.query('DELETE FROM payments WHERE order_id = ?', [orderId]);
      await db.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
      await db.query('DELETE FROM orders WHERE id = ?', [orderId]);
    }
    process.exit(1);
  }
})();
