const db = require('../config/database');
const { paginate, paginateResult } = require('../utils/pagination');

const validate = async (req, res) => {
  try {
    const { code, course_id, amount } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Código do cupom é obrigatório.' });
    }

    const [coupons] = await db.query(
      `SELECT * FROM coupons
       WHERE code = ? AND is_active = 1
         AND (start_date IS NULL OR start_date <= NOW())
         AND (end_date IS NULL OR end_date >= NOW())
         AND (max_uses IS NULL OR used_count < max_uses)`,
      [code]
    );

    if (coupons.length === 0) {
      return res.status(404).json({ valid: false, error: 'Cupom inválido ou expirado.' });
    }

    const coupon = coupons[0];

    if (coupon.course_id && parseInt(course_id) !== coupon.course_id) {
      return res.status(400).json({ valid: false, error: 'Cupom não é válido para este curso.' });
    }

    if (coupon.min_purchase && parseFloat(amount) < parseFloat(coupon.min_purchase)) {
      return res.status(400).json({
        valid: false,
        error: `Valor mínimo de compra: R$ ${parseFloat(coupon.min_purchase).toFixed(2)}`
      });
    }

    let discountValue;
    let discountType;

    if (coupon.discount_type === 'percentage') {
      discountValue = parseFloat(coupon.discount_value);
      discountType = 'percentage';
    } else {
      discountValue = parseFloat(coupon.discount_value);
      discountType = 'fixed';
    }

    let discountAmount;
    if (discountType === 'percentage') {
      discountAmount = (parseFloat(amount) * discountValue) / 100;
    } else {
      discountAmount = Math.min(discountValue, parseFloat(amount));
    }

    res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: discountType,
        discount_value: discountValue,
        discount_amount: discountAmount,
        final_amount: Math.max(0, parseFloat(amount) - discountAmount)
      }
    });
  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    res.status(500).json({ error: 'Erro ao validar cupom.' });
  }
};

const create = async (req, res) => {
  try {
    const { code, description, discount_type, discount_value, min_purchase, max_uses, course_id, start_date, end_date } = req.body;

    if (!code || !discount_value) {
      return res.status(400).json({ error: 'Código e valor do desconto são obrigatórios.' });
    }

    const [existing] = await db.query('SELECT id FROM coupons WHERE code = ?', [code]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Código de cupom já existe.' });
    }

    const [result] = await db.query(
      `INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase, max_uses, course_id, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code.toUpperCase(), description || null, discount_type || 'percentage', discount_value,
        min_purchase || null, max_uses || null, course_id || null, start_date || null, end_date || null]
    );

    const [coupon] = await db.query('SELECT * FROM coupons WHERE id = ?', [result.insertId]);

    res.status(201).json(coupon[0]);
    console.log(`Cupom criado: ${code}`);
  } catch (error) {
    console.error('Erro ao criar cupom:', error);
    res.status(500).json({ error: 'Erro ao criar cupom.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, discount_type, discount_value, min_purchase, max_uses, course_id, start_date, end_date, is_active } = req.body;

    const [coupons] = await db.query('SELECT id FROM coupons WHERE id = ?', [id]);
    if (coupons.length === 0) {
      return res.status(404).json({ error: 'Cupom não encontrado.' });
    }

    const fields = [];
    const values = [];

    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (discount_type !== undefined) { fields.push('discount_type = ?'); values.push(discount_type); }
    if (discount_value !== undefined) { fields.push('discount_value = ?'); values.push(discount_value); }
    if (min_purchase !== undefined) { fields.push('min_purchase = ?'); values.push(min_purchase); }
    if (max_uses !== undefined) { fields.push('max_uses = ?'); values.push(max_uses); }
    if (course_id !== undefined) { fields.push('course_id = ?'); values.push(course_id); }
    if (start_date !== undefined) { fields.push('start_date = ?'); values.push(start_date); }
    if (end_date !== undefined) { fields.push('end_date = ?'); values.push(end_date); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }

    if (fields.length > 0) {
      values.push(id);
      await db.query(`UPDATE coupons SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    const [updated] = await db.query('SELECT * FROM coupons WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar cupom:', error);
    res.status(500).json({ error: 'Erro ao atualizar cupom.' });
  }
};

const delete_coupon = async (req, res) => {
  try {
    const { id } = req.params;

    const [coupons] = await db.query('SELECT id, code FROM coupons WHERE id = ?', [id]);
    if (coupons.length === 0) {
      return res.status(404).json({ error: 'Cupom não encontrado.' });
    }

    await db.query('DELETE FROM coupons WHERE id = ?', [id]);

    res.json({ message: `Cupom ${coupons[0].code} removido com sucesso.` });
  } catch (error) {
    console.error('Erro ao remover cupom:', error);
    res.status(500).json({ error: 'Erro ao remover cupom.' });
  }
};

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { search, is_active } = req.query;

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND code LIKE ?';
      params.push(`%${search}%`);
    }

    if (is_active !== undefined) {
      where += ' AND is_active = ?';
      params.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM coupons ${where}`,
      params
    );
    const total = countResult[0].total;

    const { query, offset } = paginate(
      `SELECT c.*,
              co.title as course_title,
              CASE WHEN c.end_date IS NOT NULL AND c.end_date < NOW() THEN 0 ELSE 1 END as is_valid
       FROM coupons c
       LEFT JOIN courses co ON c.course_id = co.id
       ${where}
       ORDER BY c.created_at DESC`,
      page, limit
    );

    const [coupons] = await db.query(query, [...params, limit, offset]);

    res.json({
      data: coupons,
      pagination: paginateResult(total, page, limit)
    });
  } catch (error) {
    console.error('Erro ao listar cupons:', error);
    res.status(500).json({ error: 'Erro ao listar cupons.' });
  }
};

module.exports = {
  validate,
  create,
  update,
  delete: delete_coupon,
  getAll
};
