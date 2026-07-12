const db = require('../config/database');

const getAll = async (req, res) => {
  try {
    const [banners] = await db.query(
      `SELECT id, title, subtitle, image, link, button_text, position, sort_order, is_active
       FROM banners
       WHERE is_active = 1
         AND (start_date IS NULL OR start_date <= NOW())
         AND (end_date IS NULL OR end_date >= NOW())
       ORDER BY sort_order ASC`
    );

    res.json(banners);
  } catch (error) {
    console.error('Erro ao listar banners:', error);
    res.status(500).json({ error: 'Erro ao listar banners.' });
  }
};

const create = async (req, res) => {
  try {
    const { title, subtitle, image, link, button_text, position, start_date, end_date } = req.body;

    if (!title || !image) {
      return res.status(400).json({ error: 'Título e imagem são obrigatórios.' });
    }

    const [maxOrder] = await db.query('SELECT MAX(sort_order) as max_order FROM banners');
    const sortOrder = (maxOrder[0].max_order || 0) + 1;

    const [result] = await db.query(
      `INSERT INTO banners (title, subtitle, image, link, button_text, position, sort_order, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, subtitle || null, image, link || null, button_text || null, position || 'hero', sortOrder, start_date || null, end_date || null]
    );

    const [banner] = await db.query('SELECT * FROM banners WHERE id = ?', [result.insertId]);

    res.status(201).json(banner[0]);
    console.log(`Banner criado: "${title}"`);
  } catch (error) {
    console.error('Erro ao criar banner:', error);
    res.status(500).json({ error: 'Erro ao criar banner.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, image, link, button_text, position, sort_order, is_active, start_date, end_date } = req.body;

    const [banners] = await db.query('SELECT id FROM banners WHERE id = ?', [id]);
    if (banners.length === 0) {
      return res.status(404).json({ error: 'Banner não encontrado.' });
    }

    const fields = [];
    const values = [];

    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (subtitle !== undefined) { fields.push('subtitle = ?'); values.push(subtitle); }
    if (image !== undefined) { fields.push('image = ?'); values.push(image); }
    if (link !== undefined) { fields.push('link = ?'); values.push(link); }
    if (button_text !== undefined) { fields.push('button_text = ?'); values.push(button_text); }
    if (position !== undefined) { fields.push('position = ?'); values.push(position); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); values.push(sort_order); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (start_date !== undefined) { fields.push('start_date = ?'); values.push(start_date); }
    if (end_date !== undefined) { fields.push('end_date = ?'); values.push(end_date); }

    if (fields.length > 0) {
      values.push(id);
      await db.query(`UPDATE banners SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    const [updated] = await db.query('SELECT * FROM banners WHERE id = ?', [id]);

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar banner:', error);
    res.status(500).json({ error: 'Erro ao atualizar banner.' });
  }
};

const delete_banner = async (req, res) => {
  try {
    const { id } = req.params;

    const [banners] = await db.query('SELECT id, title FROM banners WHERE id = ?', [id]);
    if (banners.length === 0) {
      return res.status(404).json({ error: 'Banner não encontrado.' });
    }

    await db.query('DELETE FROM banners WHERE id = ?', [id]);

    res.json({ message: 'Banner removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover banner:', error);
    res.status(500).json({ error: 'Erro ao remover banner.' });
  }
};

const reorder = async (req, res) => {
  try {
    const { banners: orderedBanners } = req.body;

    if (!Array.isArray(orderedBanners)) {
      return res.status(400).json({ error: 'Lista de banners inválida.' });
    }

    for (let i = 0; i < orderedBanners.length; i++) {
      await db.query(
        'UPDATE banners SET sort_order = ? WHERE id = ?',
        [i + 1, orderedBanners[i].id]
      );
    }

    res.json({ message: 'Banners reordenados com sucesso.' });
  } catch (error) {
    console.error('Erro ao reordenar banners:', error);
    res.status(500).json({ error: 'Erro ao reordenar banners.' });
  }
};

module.exports = {
  getAll,
  create,
  update,
  delete: delete_banner,
  reorder
};
