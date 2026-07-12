const db = require('../config/database');

const getAll = async (req, res) => {
  try {
    const [testimonials] = await db.query(
      `SELECT t.*, u.avatar as user_avatar, u.name as user_name
       FROM testimonials t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.is_visible = 1
       ORDER BY t.sort_order ASC`
    );

    res.json(testimonials);
  } catch (error) {
    console.error('Erro ao listar depoimentos:', error);
    res.status(500).json({ error: 'Erro ao listar depoimentos.' });
  }
};

const create = async (req, res) => {
  try {
    const { user_id, name, role, avatar, content, rating } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Conteúdo do depoimento é obrigatório.' });
    }

    const [maxOrder] = await db.query('SELECT MAX(sort_order) as max_order FROM testimonials');
    const sortOrder = (maxOrder[0].max_order || 0) + 1;

    const [result] = await db.query(
      `INSERT INTO testimonials (user_id, name, role, avatar, content, rating, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id || null, name || 'Aluno', role || null, avatar || null, content, rating || null, sortOrder]
    );

    const [testimonial] = await db.query(
      `SELECT t.*, u.avatar as user_avatar, u.name as user_name
       FROM testimonials t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.id = ?`,
      [result.insertId]
    );

    res.status(201).json(testimonial[0]);
    console.log(`Depoimento criado por: ${name}`);
  } catch (error) {
    console.error('Erro ao criar depoimento:', error);
    res.status(500).json({ error: 'Erro ao criar depoimento.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, avatar, content, rating, sort_order, is_visible } = req.body;

    const [testimonials] = await db.query('SELECT id FROM testimonials WHERE id = ?', [id]);
    if (testimonials.length === 0) {
      return res.status(404).json({ error: 'Depoimento não encontrado.' });
    }

    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (role !== undefined) { fields.push('role = ?'); values.push(role); }
    if (avatar !== undefined) { fields.push('avatar = ?'); values.push(avatar); }
    if (content !== undefined) { fields.push('content = ?'); values.push(content); }
    if (rating !== undefined) { fields.push('rating = ?'); values.push(rating); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); values.push(sort_order); }
    if (is_visible !== undefined) { fields.push('is_visible = ?'); values.push(is_visible ? 1 : 0); }

    if (fields.length > 0) {
      values.push(id);
      await db.query(`UPDATE testimonials SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    const [updated] = await db.query(
      `SELECT t.*, u.avatar as user_avatar, u.name as user_name
       FROM testimonials t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.id = ?`,
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar depoimento:', error);
    res.status(500).json({ error: 'Erro ao atualizar depoimento.' });
  }
};

const delete_testimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const [testimonials] = await db.query('SELECT id, name FROM testimonials WHERE id = ?', [id]);
    if (testimonials.length === 0) {
      return res.status(404).json({ error: 'Depoimento não encontrado.' });
    }

    await db.query('DELETE FROM testimonials WHERE id = ?', [id]);

    res.json({ message: 'Depoimento removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover depoimento:', error);
    res.status(500).json({ error: 'Erro ao remover depoimento.' });
  }
};

module.exports = {
  getAll,
  create,
  update,
  delete: delete_testimonial
};
