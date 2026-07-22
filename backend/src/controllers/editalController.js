const db = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

exports.list = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM editais_portarias ORDER BY published_at DESC, created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar editais:', error);
    res.status(500).json({ error: 'Erro ao listar editais e portarias.' });
  }
};

exports.listPublic = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, title, description, type, file_url, file_name, published_at FROM editais_portarias WHERE is_active = 1 ORDER BY published_at DESC, created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar editais públicos:', error);
    res.status(500).json({ error: 'Erro ao listar editais e portarias.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM editais_portarias WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Edital não encontrado.' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar edital:', error);
    res.status(500).json({ error: 'Erro ao buscar edital.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, type, is_active, published_at } = req.body;
    const file_url = req.file ? `/uploads/editais/${req.file.filename}` : null;
    const file_name = req.file ? req.file.originalname : null;

    if (!file_url) {
      return res.status(400).json({ error: 'É obrigatório anexar um arquivo.' });
    }

    const [result] = await db.query(
      'INSERT INTO editais_portarias (title, description, type, file_url, file_name, is_active, published_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description || null, type || 'edital', file_url, file_name, is_active !== undefined ? is_active : 1, published_at || null]
    );

    const [rows] = await db.query('SELECT * FROM editais_portarias WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar edital:', error);
    res.status(500).json({ error: 'Erro ao criar edital.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { title, description, type, is_active, published_at } = req.body;
    const [existing] = await db.query('SELECT * FROM editais_portarias WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Edital não encontrado.' });

    let file_url = existing[0].file_url;
    let file_name = existing[0].file_name;

    if (req.file) {
      if (existing[0].file_url) {
        const oldPath = path.join(__dirname, '..', '..', existing[0].file_url);
        await fs.unlink(oldPath).catch(() => {});
      }
      file_url = `/uploads/editais/${req.file.filename}`;
      file_name = req.file.originalname;
    }

    await db.query(
      'UPDATE editais_portarias SET title = ?, description = ?, type = ?, file_url = ?, file_name = ?, is_active = ?, published_at = ? WHERE id = ?',
      [title, description || null, type || 'edital', file_url, file_name, is_active !== undefined ? is_active : 1, published_at || null, req.params.id]
    );

    const [rows] = await db.query('SELECT * FROM editais_portarias WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar edital:', error);
    res.status(500).json({ error: 'Erro ao atualizar edital.' });
  }
};

exports.remove = async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM editais_portarias WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Edital não encontrado.' });

    if (existing[0].file_url) {
      const filePath = path.join(__dirname, '..', '..', existing[0].file_url);
      await fs.unlink(filePath).catch(() => {});
    }

    await db.query('DELETE FROM editais_portarias WHERE id = ?', [req.params.id]);
    res.json({ message: 'Edital removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover edital:', error);
    res.status(500).json({ error: 'Erro ao remover edital.' });
  }
};
