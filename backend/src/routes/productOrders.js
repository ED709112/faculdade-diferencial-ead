const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

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

router.post('/order-public', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { name, email, phone, cpf, address, city, state, zip_code, payment_method, installments, items } = req.body;

    if (!name || !email || !items || items.length === 0) {
      return res.status(400).json({ error: 'Nome, e-mail e pelo menos um item são obrigatórios.' });
    }

    let userId;
    let tempPassword = null;

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
        [name, phone || null, cpf || null, address || null, city || null, state || null, zip_code || null, userId]
      );
    } else {
      tempPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const [userResult] = await conn.query(
        `INSERT INTO users (name, email, password, phone, cpf, address, city, state, zip_code, role, lgpd_consent, lgpd_consent_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'student', 1, NOW())`,
        [name, email, hashedPassword, phone || null, cpf || null, address || null, city || null, state || null, zip_code || null]
      );
      userId = userResult.insertId;
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
      await conn.query('UPDATE products SET stock = stock - ?, sales_count = sales_count + ? WHERE id = ?', [qty, qty, product.id]);
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

    res.status(201).json({
      message: 'Pedido realizado com sucesso!',
      order_number: orderNumber,
      order_id: orderResult.insertId,
      total: finalTotal,
      payment_method,
      user: {
        id: userId,
        name,
        email,
        is_new_user: tempPassword !== null,
        temp_password: tempPassword,
      },
    });

    console.log(`Pedido público: ${email} - ${orderNumber} (${items.length} itens) - R$ ${finalTotal}`);
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error('Erro no pedido público:', error);
    res.status(500).json({ error: 'Erro ao processar pedido.' });
  }
});

module.exports = router;
