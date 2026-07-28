const db = require('../config/database');

exports.list = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM polos ORDER BY city ASC, name ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar polos:', error);
    res.status(500).json({ error: 'Erro ao listar polos.' });
  }
};

exports.listPublic = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, city, state FROM polos WHERE is_active = 1 ORDER BY city ASC, name ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar polos publicos:', error);
    res.status(500).json({ error: 'Erro ao listar polos.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM polos WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Polo nao encontrado.' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar polo:', error);
    res.status(500).json({ error: 'Erro ao buscar polo.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, city, state, coordinator_name, coordinator_phone, coordinator_email, coordinator_pix, coordinator_bank_info, is_active } = req.body;

    if (!name || !city || !state || !coordinator_name) {
      return res.status(400).json({ error: 'Nome, cidade, UF e nome do coordenador sao obrigatorios.' });
    }

    const [result] = await db.query(
      `INSERT INTO polos (name, city, state, coordinator_name, coordinator_phone, coordinator_email, coordinator_pix, coordinator_bank_info, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, city, state, coordinator_name, coordinator_phone || null, coordinator_email || null, coordinator_pix || null, coordinator_bank_info || null, is_active !== undefined ? is_active : 1]
    );

    const [polo] = await db.query('SELECT * FROM polos WHERE id = ?', [result.insertId]);
    res.status(201).json(polo[0]);
  } catch (error) {
    console.error('Erro ao criar polo:', error);
    res.status(500).json({ error: 'Erro ao criar polo.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, city, state, coordinator_name, coordinator_phone, coordinator_email, coordinator_pix, coordinator_bank_info, is_active } = req.body;

    const [existing] = await db.query('SELECT * FROM polos WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Polo nao encontrado.' });

    await db.query(
      `UPDATE polos SET name = ?, city = ?, state = ?, coordinator_name = ?, coordinator_phone = ?, coordinator_email = ?, coordinator_pix = ?, coordinator_bank_info = ?, is_active = ? WHERE id = ?`,
      [
        name || existing[0].name,
        city || existing[0].city,
        state || existing[0].state,
        coordinator_name || existing[0].coordinator_name,
        coordinator_phone !== undefined ? coordinator_phone : existing[0].coordinator_phone,
        coordinator_email !== undefined ? coordinator_email : existing[0].coordinator_email,
        coordinator_pix !== undefined ? coordinator_pix : existing[0].coordinator_pix,
        coordinator_bank_info !== undefined ? coordinator_bank_info : existing[0].coordinator_bank_info,
        is_active !== undefined ? is_active : existing[0].is_active,
        req.params.id
      ]
    );

    const [polo] = await db.query('SELECT * FROM polos WHERE id = ?', [req.params.id]);
    res.json(polo[0]);
  } catch (error) {
    console.error('Erro ao atualizar polo:', error);
    res.status(500).json({ error: 'Erro ao atualizar polo.' });
  }
};

exports.remove = async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM polos WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Polo nao encontrado.' });

    const [courses] = await db.query('SELECT COUNT(*) as total FROM courses WHERE polo_id = ?', [req.params.id]);
    if (courses[0].total > 0) {
      return res.status(400).json({ error: `Nao e possivel excluir. Este polo esta vinculado a ${courses[0].total} curso(s).` });
    }

    await db.query('DELETE FROM polos WHERE id = ?', [req.params.id]);
    res.json({ message: 'Polo excluido com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir polo:', error);
    res.status(500).json({ error: 'Erro ao excluir polo.' });
  }
};
