const db = require('../config/database');

const getAll = async (req, res) => {
  try {
    const [faqs] = await db.query(
      `SELECT id, question, answer, category, sort_order
       FROM faqs
       WHERE is_active = 1
       ORDER BY sort_order ASC, category ASC`
    );

    res.json(faqs);
  } catch (error) {
    console.error('Erro ao listar FAQs:', error);
    res.status(500).json({ error: 'Erro ao listar FAQs.' });
  }
};

const create = async (req, res) => {
  try {
    const { question, answer, category } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Pergunta e resposta são obrigatórias.' });
    }

    const [maxOrder] = await db.query('SELECT MAX(sort_order) as max_order FROM faqs');
    const sortOrder = (maxOrder[0].max_order || 0) + 1;

    const [result] = await db.query(
      'INSERT INTO faqs (question, answer, category, sort_order) VALUES (?, ?, ?, ?)',
      [question, answer, category || null, sortOrder]
    );

    const [faq] = await db.query('SELECT * FROM faqs WHERE id = ?', [result.insertId]);

    res.status(201).json(faq[0]);
    console.log(`FAQ criada: "${question.substring(0, 50)}..."`);
  } catch (error) {
    console.error('Erro ao criar FAQ:', error);
    res.status(500).json({ error: 'Erro ao criar FAQ.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, sort_order, is_active } = req.body;

    const [faqs] = await db.query('SELECT id FROM faqs WHERE id = ?', [id]);
    if (faqs.length === 0) {
      return res.status(404).json({ error: 'FAQ não encontrada.' });
    }

    const fields = [];
    const values = [];

    if (question !== undefined) { fields.push('question = ?'); values.push(question); }
    if (answer !== undefined) { fields.push('answer = ?'); values.push(answer); }
    if (category !== undefined) { fields.push('category = ?'); values.push(category); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); values.push(sort_order); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }

    if (fields.length > 0) {
      values.push(id);
      await db.query(`UPDATE faqs SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    const [updated] = await db.query('SELECT * FROM faqs WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar FAQ:', error);
    res.status(500).json({ error: 'Erro ao atualizar FAQ.' });
  }
};

const delete_faq = async (req, res) => {
  try {
    const { id } = req.params;

    const [faqs] = await db.query('SELECT id, question FROM faqs WHERE id = ?', [id]);
    if (faqs.length === 0) {
      return res.status(404).json({ error: 'FAQ não encontrada.' });
    }

    await db.query('DELETE FROM faqs WHERE id = ?', [id]);

    res.json({ message: 'FAQ removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover FAQ:', error);
    res.status(500).json({ error: 'Erro ao remover FAQ.' });
  }
};

module.exports = {
  getAll,
  create,
  update,
  delete: delete_faq
};
