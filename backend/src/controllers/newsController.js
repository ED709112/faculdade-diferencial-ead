const db = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

const slugify = (text) => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

exports.list = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM news ORDER BY published_at DESC, created_at DESC'
    );
    res.json(rows.map((r) => ({
      ...r,
      summary: r.excerpt,
      image_url: r.image,
      is_active: r.status === 'published'
    })));
  } catch (error) {
    console.error('Erro ao listar notícias:', error);
    res.status(500).json({ error: 'Erro ao listar notícias.' });
  }
};

exports.listPublic = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const [rows] = await db.query(
      "SELECT id, title, slug, excerpt AS summary, image AS image_url, published_at FROM news WHERE status = 'published' ORDER BY published_at DESC LIMIT ?",
      [limit]
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar notícias públicas:', error);
    res.status(500).json({ error: 'Erro ao listar notícias.' });
  }
};

exports.getBySlug = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, title, slug, excerpt AS summary, content, image AS image_url, published_at FROM news WHERE slug = ? AND status = 'published'",
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Notícia não encontrada.' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar notícia:', error);
    res.status(500).json({ error: 'Erro ao buscar notícia.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM news WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Notícia não encontrada.' });
    const r = rows[0];
    res.json({ ...r, summary: r.excerpt, image_url: r.image, is_active: r.status === 'published' });
  } catch (error) {
    console.error('Erro ao buscar notícia:', error);
    res.status(500).json({ error: 'Erro ao buscar notícia.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, summary, content, is_active, published_at } = req.body;
    const image = req.file ? `/uploads/news/${req.file.filename}` : null;
    const isActive = is_active === true || is_active === 1 || is_active === '1';
    let slug = slugify(title);

    const [existing] = await db.query('SELECT id FROM news WHERE slug = ?', [slug]);
    if (existing.length) {
      slug = `${slug}-${Date.now()}`;
    }

    const [result] = await db.query(
      "INSERT INTO news (title, slug, excerpt, content, image, status, published_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [title, slug, summary || null, content || null, image, isActive ? 'published' : 'draft', published_at || null]
    );

    const [rows] = await db.query('SELECT * FROM news WHERE id = ?', [result.insertId]);
    const r = rows[0];
    res.status(201).json({ ...r, summary: r.excerpt, image_url: r.image, is_active: r.status === 'published' });
  } catch (error) {
    console.error('Erro ao criar notícia:', error);
    res.status(500).json({ error: 'Erro ao criar notícia.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { title, summary, content, is_active, published_at } = req.body;
    const [existing] = await db.query('SELECT * FROM news WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Notícia não encontrada.' });
    const isActive = is_active === true || is_active === 1 || is_active === '1';

    let image = existing[0].image;
    if (req.file) {
      if (existing[0].image) {
        const oldPath = path.join(__dirname, '..', '..', existing[0].image);
        await fs.unlink(oldPath).catch(() => {});
      }
      image = `/uploads/news/${req.file.filename}`;
    }

    let slug = existing[0].slug;
    if (title && title !== existing[0].title) {
      slug = slugify(title);
      const [slugExists] = await db.query('SELECT id FROM news WHERE slug = ? AND id != ?', [slug, req.params.id]);
      if (slugExists.length) slug = `${slug}-${Date.now()}`;
    }

    await db.query(
      "UPDATE news SET title = ?, slug = ?, excerpt = ?, content = ?, image = ?, status = ?, published_at = ? WHERE id = ?",
      [title, slug, summary || null, content || null, image, isActive ? 'published' : 'draft', published_at || null, req.params.id]
    );

    const [rows] = await db.query('SELECT * FROM news WHERE id = ?', [req.params.id]);
    const r = rows[0];
    res.json({ ...r, summary: r.excerpt, image_url: r.image, is_active: r.status === 'published' });
  } catch (error) {
    console.error('Erro ao atualizar notícia:', error);
    res.status(500).json({ error: 'Erro ao atualizar notícia.' });
  }
};

exports.remove = async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM news WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Notícia não encontrada.' });

    if (existing[0].image) {
      const filePath = path.join(__dirname, '..', '..', existing[0].image);
      await fs.unlink(filePath).catch(() => {});
    }

    await db.query('DELETE FROM news WHERE id = ?', [req.params.id]);
    res.json({ message: 'Notícia removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover notícia:', error);
    res.status(500).json({ error: 'Erro ao remover notícia.' });
  }
};
