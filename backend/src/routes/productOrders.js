const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const efibank = require('../services/efibankService');
const { optionalAuth } = require('../middleware/auth');

async function getPaymentGateway() {
  const [rows] = await db.query(
    `SELECT setting_value FROM settings WHERE setting_key = 'payment_gateway' LIMIT 1`
  );
  return rows.length > 0 ? rows[0].setting_value : 'efibank';
}

function buildProductSummary(orderItems) {
  return orderItems.map(i => `${i.name} (${i.quantity}x)`).join(' + ');
}

async function generatePaymentForOrder({ orderId, orderNumber, amount, paymentMethod, customer, orderItems }) {
  if (paymentMethod === 'pix') {
    const rawTxid = `FAD${orderId}${Date.now().toString(36)}`;
    const txid = rawTxid.slice(0, 35).padEnd(26, 'X');

    const pixResult = await efibank.generatePixQrCode({
      amount,
      description: `Pedido ${orderNumber} - ${buildProductSummary(orderItems)}`,
      txid,
    });

    await db.query(
      `INSERT INTO payments (order_id, payment_method, amount, status, gateway, gateway_payment_id, gateway_status, pix_qr_code, pix_copy_paste, pix_expires_at)
       VALUES (?, 'pix', ?, 'pending', 'efibank', ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
      [orderId, amount, pixResult.txid, pixResult.status, pixResult.pix_qr_code_base64, pixResult.pix_copia_cola]
    );
    await db.query(
      `UPDATE orders SET payment_gateway = 'efibank', gateway_payment_id = ? WHERE id = ?`,
      [pixResult.txid, orderId]
    );

    return {
      type: 'pix',
      txid: pixResult.txid,
      qr_code: pixResult.pix_qr_code_base64,
      copy_paste: pixResult.pix_copia_cola,
      amount,
      expires_in: 3600,
    };
  }

  if (paymentMethod === 'boleto') {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const charge = await efibank.createBoleto({
      amount,
      description: `Pedido ${orderNumber} - ${buildProductSummary(orderItems)}`,
      customerName: customer.name,
      customerCpf: customer.cpf,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      address: {
        street: customer.address || customer.city || 'Sem endereco',
        number: 'S/N',
        neighborhood: customer.city || 'Nao informado',
        zipcode: customer.zip_code,
        city: customer.city || 'Nao informado',
        state: customer.state || 'XX',
        complement: '',
      },
      dueDate: dueDateStr,
      customId: `pedido-${orderNumber}`,
    });

    const boletoUrl = charge.pdf?.charge || charge.billet_link || charge.link || null;

    await db.query(
      `INSERT INTO payments (order_id, payment_method, amount, status, gateway, gateway_payment_id, gateway_status,
        boleto_url, boleto_barcode, pix_copy_paste, pix_qr_code_base64, gateway_response)
       VALUES (?, 'boleto', ?, 'pending', 'efibank', ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, amount, charge.charge_id, charge.status,
       boletoUrl, charge.barcode || '', charge.pix?.qrcode || null, charge.pix?.qrcode_image || null, JSON.stringify(charge)]
    );
    await db.query(
      `UPDATE orders SET payment_gateway = 'efibank', gateway_payment_id = ? WHERE id = ?`,
      [charge.charge_id, orderId]
    );

    return {
      type: 'boleto',
      charge_id: charge.charge_id,
      status: charge.status,
      due_date: dueDateStr,
      amount,
      boleto_url: boletoUrl,
      barcode: charge.barcode || '',
      pix_copy_paste: charge.pix?.qrcode || null,
      pix_qr_code_base64: charge.pix?.qrcode_image || null,
    };
  }

  return null;
}

router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-mail é obrigatório.' });

    const [users] = await db.query('SELECT id, name FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      return res.json({ exists: true, name: users[0].name });
    }
    res.json({ exists: false });
  } catch (error) {
    console.error('Erro ao verificar e-mail:', error);
    res.status(500).json({ error: 'Erro ao verificar e-mail.' });
  }
});

router.post('/order-public', optionalAuth, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { name, email, phone, cpf, address, city, state, zip_code, payment_method, installments, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Pelo menos um item é obrigatório.' });
    }

    let userId;
    let tempPassword = null;
    let finalName = name;
    let finalEmail = email;
    let finalPhone = phone || null;
    let finalCpf = cpf || null;
    let finalAddress = address || null;
    let finalCity = city || null;
    let finalState = state || null;
    let finalZip = zip_code || null;

    if (req.user) {
      // Usuário já logado: usa a conta autenticada, sem pedir e-mail/login novamente
      const [userRows] = await conn.query(
        'SELECT id, name, email, phone, cpf, address, city, state, zip_code FROM users WHERE id = ?',
        [req.user.id]
      );
      const profile = userRows[0] || {};
      userId = req.user.id;
      finalEmail = profile.email || req.user.email;
      finalName = name || profile.name || req.user.name;
      finalPhone = phone || profile.phone || null;
      finalCpf = cpf || profile.cpf || null;
      finalAddress = address || profile.address || null;
      finalCity = city || profile.city || null;
      finalState = state || profile.state || null;
      finalZip = zip_code || profile.zip_code || null;

      if (!finalName) {
        return res.status(400).json({ error: 'Nome é obrigatório.' });
      }

      await conn.query(
        `UPDATE users SET
          name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          cpf = COALESCE(?, cpf),
          address = COALESCE(?, address),
          city = COALESCE(?, city),
          state = COALESCE(?, state),
          zip_code = COALESCE(?, zip_code)
         WHERE id = ?`,
        [finalName, finalPhone, finalCpf, finalAddress, finalCity, finalState, finalZip, userId]
      );
    } else {
      if (!name || !email) {
        return res.status(400).json({ error: 'Nome, e-mail e pelo menos um item são obrigatórios.' });
      }

      const [existingUser] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);

      if (existingUser.length > 0) {
        userId = existingUser[0].id;
        await conn.query(
          `UPDATE users SET
            name = COALESCE(?, name),
            phone = COALESCE(?, phone),
            cpf = COALESCE(?, cpf),
            address = COALESCE(?, address),
            city = COALESCE(?, city),
            state = COALESCE(?, state),
            zip_code = COALESCE(?, zip_code)
           WHERE id = ?`,
          [name, finalPhone, finalCpf, finalAddress, finalCity, finalState, finalZip, userId]
        );
      } else {
        tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const [userResult] = await conn.query(
          `INSERT INTO users (name, email, password, phone, cpf, address, city, state, zip_code, role, lgpd_consent, lgpd_consent_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'student', 1, NOW())`,
          [name, email, hashedPassword, finalPhone, finalCpf, finalAddress, finalCity, finalState, finalZip]
        );
        userId = userResult.insertId;
      }
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const [products] = await conn.query(
        'SELECT id, name, price, stock FROM products WHERE id = ? AND is_active = 1',
        [item.product_id]
      );

      if (products.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(404).json({ error: `Produto ID ${item.product_id} não encontrado.` });
      }

      const product = products[0];
      const qty = item.quantity || 1;

      if (product.stock < qty) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ error: `Estoque insuficiente para "${product.name}".` });
      }

      totalAmount += product.price * qty;
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [qty, product.id]);
      orderItems.push({ product_id: product.id, name: product.name, price: product.price, quantity: qty });
    }

    const pixDiscount = payment_method === 'pix' ? totalAmount * 0.05 : 0;
    const finalTotal = totalAmount - pixDiscount;
    const orderNumber = 'PED-' + Date.now().toString(36).toUpperCase();

    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, order_number, subtotal, discount_amount, total_amount, status, payment_method)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [userId, orderNumber, totalAmount, pixDiscount, finalTotal, payment_method || 'pix']
    );

    for (const oi of orderItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?)`,
        [orderResult.insertId, oi.product_id, oi.quantity, oi.price, oi.price * oi.quantity]
      );
    }

    await conn.commit();
    conn.release();

    let payment = null;
    try {
      const gateway = await getPaymentGateway();
      if (gateway === 'efibank' && (payment_method === 'pix' || payment_method === 'boleto')) {
        payment = await generatePaymentForOrder({
          orderId: orderResult.insertId,
          orderNumber,
          amount: finalTotal,
          paymentMethod: payment_method,
          customer: { name: finalName, email: finalEmail, cpf: finalCpf, phone: finalPhone, address: finalAddress, city: finalCity, state: finalState, zip_code: finalZip },
          orderItems,
        });
      }
    } catch (error) {
      console.error('Erro ao gerar pagamento Efí no pedido público:', error.message);
    }

    res.status(201).json({
      message: 'Pedido realizado com sucesso!',
      order_number: orderNumber,
      order_id: orderResult.insertId,
      total: finalTotal,
      payment_method,
      payment,
      user: {
        id: userId,
        name: finalName,
        email: finalEmail,
        is_new_user: tempPassword !== null,
        temp_password: tempPassword,
      },
    });

    console.log(`Pedido público: ${finalEmail} - ${orderNumber} (${items.length} itens) - R$ ${finalTotal}`);
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error('Erro no pedido público:', error);
    res.status(500).json({ error: 'Erro ao processar pedido.' });
  }
});

module.exports = router;
