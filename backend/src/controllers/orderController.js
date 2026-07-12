const db = require('../config/database');
const { paginate, paginateResult } = require('../utils/pagination');

const create = async (req, res) => {
  try {
    const { course_id, payment_method, coupon_code } = req.body;

    const [courses] = await db.query(
      'SELECT id, title, price, is_free, status FROM courses WHERE id = ?',
      [course_id]
    );

    if (courses.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    const course = courses[0];

    if (course.status !== 'published') {
      return res.status(400).json({ error: 'Curso não disponível.' });
    }

    if (course.is_free || course.price === 0) {
      return res.status(400).json({ error: 'Curso gratuito. Use a matrícula direta.' });
    }

    const [existing] = await db.query(
      `SELECT o.id FROM orders o
       WHERE o.user_id = ? AND o.course_id = ? AND o.status IN ('pending', 'processing')`,
      [req.user.id, course_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Você já possui um pedido pendente para este curso.',
        order_id: existing[0].id
      });
    }

    let discountAmount = 0;
    let couponId = null;

    if (coupon_code) {
      const [coupons] = await db.query(
        `SELECT id, discount_type, discount_value, min_purchase, max_uses, used_count, course_id
         FROM coupons
         WHERE code = ? AND is_active = 1
           AND (start_date IS NULL OR start_date <= NOW())
           AND (end_date IS NULL OR end_date >= NOW())
           AND (max_uses IS NULL OR used_count < max_uses)`,
        [coupon_code]
      );

      if (coupons.length > 0) {
        const coupon = coupons[0];
        if (!coupon.course_id || coupon.course_id === parseInt(course_id)) {
          if (!coupon.min_purchase || course.price >= coupon.min_purchase) {
            if (coupon.discount_type === 'percentage') {
              discountAmount = (course.price * coupon.discount_value) / 100;
            } else {
              discountAmount = Math.min(coupon.discount_value, course.price);
            }
            couponId = coupon.id;
          }
        }
      }
    }

    const totalAmount = Math.max(0, course.price - discountAmount);
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const [result] = await db.query(
      `INSERT INTO orders (user_id, course_id, order_number, subtotal, discount_amount, total_amount, coupon_id, status, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [req.user.id, course_id, orderNumber, course.price, discountAmount, totalAmount, couponId, payment_method || 'pix']
    );

    if (couponId) {
      await db.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [couponId]);
    }

    const [order] = await db.query(
      `SELECT o.*, c.title as course_title, c.image as course_image
       FROM orders o
       JOIN courses c ON o.course_id = c.id
       WHERE o.id = ?`,
      [result.insertId]
    );

    res.status(201).json(order[0]);
    console.log(`Pedido criado: ${orderNumber} - ${course.title} por usuário ID ${req.user.id}`);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro ao criar pedido.' });
  }
};

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { search, status, payment_method, start_date, end_date } = req.query;

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (o.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      where += ' AND o.status = ?';
      params.push(status);
    }

    if (payment_method) {
      where += ' AND o.payment_method = ?';
      params.push(payment_method);
    }

    if (start_date) {
      where += ' AND o.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      where += ' AND o.created_at <= ?';
      params.push(end_date);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM orders o JOIN users u ON o.user_id = u.id ${where}`,
      params
    );
    const total = countResult[0].total;

    const { query, offset } = paginate(
      `SELECT o.*, u.name as user_name, u.email as user_email, c.title as course_title
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN courses c ON o.course_id = c.id
       ${where}
       ORDER BY o.created_at DESC`,
      page, limit
    );

    const [orders] = await db.query(query, [...params, limit, offset]);

    res.json({
      data: orders,
      pagination: paginateResult(total, page, limit)
    });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro ao listar pedidos.' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone,
              u.cpf as user_cpf, c.title as course_title, c.slug as course_slug,
              c.image as course_image
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN courses c ON o.course_id = c.id
       WHERE o.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const [payments] = await db.query(
      'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC',
      [id]
    );
    orders[0].payments = payments;

    res.json(orders[0]);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro ao buscar pedido.' });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, c.title as course_title, c.slug as course_slug, c.image as course_image
       FROM orders o
       JOIN courses c ON o.course_id = c.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.json(orders);
  } catch (error) {
    console.error('Erro ao listar meus pedidos:', error);
    res.status(500).json({ error: 'Erro ao listar pedidos.' });
  }
};

const getByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const [user] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const [orders] = await db.query(
      `SELECT o.*, c.title as course_title, c.slug as course_slug
       FROM orders o
       JOIN courses c ON o.course_id = c.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json(orders);
  } catch (error) {
    console.error('Erro ao listar pedidos do usuário:', error);
    res.status(500).json({ error: 'Erro ao listar pedidos.' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded', 'partial_refund'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    const [orders] = await db.query('SELECT id, status, course_id, user_id FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const oldStatus = orders[0].status;

    await db.query(
      `UPDATE orders SET status = ?, paid_at = CASE WHEN ? = 'paid' THEN NOW() ELSE paid_at END WHERE id = ?`,
      [status, status, id]
    );

    if (status === 'paid' && oldStatus !== 'paid') {
      const [existing] = await db.query(
        'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
        [orders[0].user_id, orders[0].course_id]
      );

      if (existing.length === 0) {
        await db.query(
          `INSERT INTO enrollments (user_id, course_id, order_id, status, started_at)
           VALUES (?, ?, ?, 'active', NOW())`,
          [orders[0].user_id, orders[0].course_id, id]
        );

        await db.query(
          'UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = ?',
          [orders[0].course_id]
        );
      }
    }

    res.json({ message: 'Status do pedido atualizado com sucesso.' });
    console.log(`Pedido ${id} atualizado: ${oldStatus} -> ${status} por admin ID ${req.user.id}`);
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(500).json({ error: 'Erro ao atualizar status do pedido.' });
  }
};

module.exports = {
  create,
  getAll,
  getById,
  getMyOrders,
  getByUser,
  updateStatus
};
