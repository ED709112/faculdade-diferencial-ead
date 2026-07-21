const slugify = require('slugify');
const db = require('../config/database');

const getAllPublic = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'is_active = 1';
    const params = [];

    if (category) {
      where += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      where += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM products WHERE ${where}`, params);
    const total = countResult[0].total;

    const [products] = await db.query(
      `SELECT * FROM products WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      data: products,
      meta: {
        current_page: parseInt(page),
        last_page: Math.ceil(total / parseInt(limit)),
        per_page: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao listar produtos.' });
  }
};

const getBySlug = async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products WHERE slug = ? AND is_active = 1', [req.params.slug]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }
    res.json(products[0]);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro ao buscar produto.' });
  }
};

const getCategories = async (req, res) => {
  try {
    const [categories] = await db.query(
      `SELECT category, COUNT(*) as count FROM products WHERE is_active = 1 AND category IS NOT NULL GROUP BY category ORDER BY category`
    );
    res.json(categories);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao listar categorias.' });
  }
};

const getAllAdmin = async (req, res) => {
  try {
    const { search, is_active, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = '1=1';
    const params = [];

    if (is_active !== undefined && is_active !== '') {
      where += ' AND is_active = ?';
      params.push(parseInt(is_active));
    }
    if (search) {
      where += ' AND (name LIKE ? OR category LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM products WHERE ${where}`, params);
    const total = countResult[0].total;

    const [products] = await db.query(
      `SELECT * FROM products WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      data: products,
      meta: { current_page: parseInt(page), last_page: Math.ceil(total / parseInt(limit)), per_page: parseInt(limit), total }
    });
  } catch (error) {
    console.error('Erro ao listar produtos (admin):', error);
    res.status(500).json({ error: 'Erro ao listar produtos.' });
  }
};

const create = async (req, res) => {
  try {
    const { name, description, short_description, price, original_price, stock, image, category, product_type, weight, dimensions, is_active } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios.' });
    }

    let slug = slugify(name, { lower: true, strict: true });
    const [existing] = await db.query('SELECT id FROM products WHERE slug = ?', [slug]);
    if (existing.length > 0) {
      slug = slug + '-' + Date.now().toString(36);
    }

    const [result] = await db.query(
      `INSERT INTO products (name, slug, description, short_description, price, original_price, stock, image, category, product_type, weight, dimensions, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description || null, short_description || null, price, original_price || null, stock || 0, image || null, category || null, product_type || 'outro', weight || null, dimensions || null, is_active !== undefined ? is_active : 1]
    );

    const [product] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(product[0]);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, short_description, price, original_price, stock, image, category, product_type, weight, dimensions, is_active } = req.body;

    const fields = [];
    const params = [];

    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (short_description !== undefined) { fields.push('short_description = ?'); params.push(short_description); }
    if (price !== undefined) { fields.push('price = ?'); params.push(price); }
    if (original_price !== undefined) { fields.push('original_price = ?'); params.push(original_price); }
    if (stock !== undefined) { fields.push('stock = ?'); params.push(stock); }
    if (image !== undefined) { fields.push('image = ?'); params.push(image); }
    if (category !== undefined) { fields.push('category = ?'); params.push(category); }
    if (product_type !== undefined) { fields.push('product_type = ?'); params.push(product_type); }
    if (weight !== undefined) { fields.push('weight = ?'); params.push(weight); }
    if (dimensions !== undefined) { fields.push('dimensions = ?'); params.push(dimensions); }
    if (is_active !== undefined) { fields.push('is_active = ?'); params.push(is_active); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    if (name !== undefined) {
      let slug = slugify(name, { lower: true, strict: true });
      const [existing] = await db.query('SELECT id FROM products WHERE slug = ? AND id != ?', [slug, id]);
      if (existing.length > 0) slug = slug + '-' + Date.now().toString(36);
      fields.push('slug = ?');
      params.push(slug);
    }

    params.push(id);
    await db.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params);

    const [product] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json(product[0]);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto.' });
  }
};

const remove = async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Produto excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ error: 'Erro ao excluir produto.' });
  }
};

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;
    await db.query('UPDATE products SET image = ? WHERE id = ?', [imageUrl, req.params.id]);

    const [product] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(product[0]);
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem.' });
  }
};

module.exports = { getAllPublic, getBySlug, getCategories, getAllAdmin, create, update, remove, uploadImage };
