const slugify = require('slugify');
const db = require('../config/database');

const SELECT_PRODUCT = `
  SELECT p.*, c.name AS category_name,
    (SELECT COALESCE(SUM(oi.quantity), 0)
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id AND o.status = 'paid'
     WHERE oi.product_id = p.id) AS sales_count
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
`;

function shapeProduct(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    short_description: null,
    price: Number(row.price),
    original_price: row.original_price != null ? Number(row.original_price) : null,
    stock: Number(row.stock),
    image: row.image_url,
    category: row.category_name || null,
    category_id: row.category_id,
    product_type: row.type,
    download_url: row.download_url,
    weight: null,
    dimensions: null,
    sales_count: Number(row.sales_count || 0),
    is_active: row.is_active,
    is_featured: row.is_featured,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function resolveCategoryId(category) {
  if (!category) return null;
  if (/^\d+$/.test(String(category))) return parseInt(category, 10);

  const [rows] = await db.query(
    `SELECT id FROM categories WHERE LOWER(name) = LOWER(?) OR slug = ? LIMIT 1`,
    [category, category]
  );
  return rows.length > 0 ? rows[0].id : null;
}

const getAllPublic = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'p.is_active = 1';
    const params = [];

    if (category) {
      where += ' AND (c.slug = ? OR c.name = ?)';
      params.push(category, category);
    }
    if (search) {
      where += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE ${where}`,
      params
    );
    const total = countResult[0].total;

    const [products] = await db.query(
      `${SELECT_PRODUCT} WHERE ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      data: products.map(shapeProduct),
      meta: {
        current_page: parseInt(page),
        last_page: Math.ceil(total / parseInt(limit)),
        per_page: parseInt(limit),
        total,
      },
    });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao listar produtos.' });
  }
};

const getBySlug = async (req, res) => {
  try {
    const [products] = await db.query(
      `${SELECT_PRODUCT} WHERE p.slug = ? AND p.is_active = 1`,
      [req.params.slug]
    );
    if (products.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }
    res.json(shapeProduct(products[0]));
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro ao buscar produto.' });
  }
};

const getCategories = async (req, res) => {
  try {
    const [categories] = await db.query(
      `SELECT c.name AS category, COUNT(p.id) AS count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
       WHERE c.is_active = 1
       GROUP BY c.id, c.name
       HAVING COUNT(p.id) > 0
       ORDER BY c.name`
    );
    res.json(categories);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao listar categorias.' });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const [categories] = await db.query(
      `SELECT id, name AS category, slug, description, icon
       FROM categories
       WHERE is_active = 1
       ORDER BY name`
    );
    res.json(categories);
  } catch (error) {
    console.error('Erro ao listar categorias (admin):', error);
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
      where += ' AND p.is_active = ?';
      params.push(parseInt(is_active));
    }
    if (search) {
      where += ' AND (p.name LIKE ? OR c.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE ${where}`,
      params
    );
    const total = countResult[0].total;

    const [products] = await db.query(
      `${SELECT_PRODUCT} WHERE ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      data: products.map(shapeProduct),
      meta: { current_page: parseInt(page), last_page: Math.ceil(total / parseInt(limit)), per_page: parseInt(limit), total },
    });
  } catch (error) {
    console.error('Erro ao listar produtos (admin):', error);
    res.status(500).json({ error: 'Erro ao listar produtos.' });
  }
};

const create = async (req, res) => {
  try {
    const { name, description, price, original_price, stock, image, category, category_id, product_type, download_url, is_active, is_featured } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios.' });
    }

    let slug = slugify(name, { lower: true, strict: true });
    const [existing] = await db.query('SELECT id FROM products WHERE slug = ?', [slug]);
    if (existing.length > 0) {
      slug = slug + '-' + Date.now().toString(36);
    }

    const resolvedCategoryId = category_id !== undefined ? (category_id || null) : await resolveCategoryId(category);

    const [result] = await db.query(
      `INSERT INTO products (name, slug, description, price, original_price, stock, image_url, download_url, type, category_id, is_active, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug,
        description || null,
        price,
        original_price || null,
        stock || 0,
        image || null,
        download_url || null,
        product_type || 'outro',
        resolvedCategoryId,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        is_featured ? 1 : 0,
      ]
    );

    const [product] = await db.query(`${SELECT_PRODUCT} WHERE p.id = ?`, [result.insertId]);
    res.status(201).json(shapeProduct(product[0]));
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, original_price, stock, image, category, category_id, product_type, download_url, is_active, is_featured } = req.body;

    const fields = [];
    const params = [];

    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (price !== undefined) { fields.push('price = ?'); params.push(price); }
    if (original_price !== undefined) { fields.push('original_price = ?'); params.push(original_price); }
    if (stock !== undefined) { fields.push('stock = ?'); params.push(stock); }
    if (image !== undefined) { fields.push('image_url = ?'); params.push(image); }
    if (download_url !== undefined) { fields.push('download_url = ?'); params.push(download_url || null); }
    if (product_type !== undefined) { fields.push('type = ?'); params.push(product_type); }
    if (is_active !== undefined) { fields.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (is_featured !== undefined) { fields.push('is_featured = ?'); params.push(is_featured ? 1 : 0); }

    if (category_id !== undefined) {
      fields.push('category_id = ?');
      params.push(category_id || null);
    } else if (category !== undefined) {
      const resolvedCategoryId = await resolveCategoryId(category);
      fields.push('category_id = ?');
      params.push(resolvedCategoryId);
    }

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

    const [product] = await db.query(`${SELECT_PRODUCT} WHERE p.id = ?`, [id]);
    res.json(shapeProduct(product[0]));
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
    await db.query('UPDATE products SET image_url = ? WHERE id = ?', [imageUrl, req.params.id]);

    const [product] = await db.query(`${SELECT_PRODUCT} WHERE p.id = ?`, [req.params.id]);
    res.json(shapeProduct(product[0]));
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem.' });
  }
};

const uploadDownload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const downloadUrl = `/uploads/products-downloads/${req.file.filename}`;
    await db.query('UPDATE products SET download_url = ? WHERE id = ?', [downloadUrl, req.params.id]);

    const [product] = await db.query(`${SELECT_PRODUCT} WHERE p.id = ?`, [req.params.id]);
    res.json(shapeProduct(product[0]));
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do arquivo.' });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const [products] = await db.query(
      `${SELECT_PRODUCT}
       JOIN order_items oi ON oi.product_id = p.id
       JOIN orders o ON o.id = oi.order_id
       WHERE o.user_id = ? AND o.status = 'paid'
       ORDER BY p.name`,
      [req.user.id]
    );

    res.json({ data: products.map(shapeProduct) });
  } catch (error) {
    console.error('Erro ao listar produtos comprados:', error);
    res.status(500).json({ error: 'Erro ao listar produtos comprados.' });
  }
};

const getDownload = async (req, res) => {
  try {
    const [products] = await db.query(
      `SELECT p.*
       FROM products p
       JOIN order_items oi ON oi.product_id = p.id
       JOIN orders o ON o.id = oi.order_id
       WHERE p.id = ? AND o.user_id = ? AND o.status = 'paid'
       LIMIT 1`,
      [req.params.id, req.user.id]
    );

    if (products.length === 0) {
      return res.status(403).json({ error: 'Você ainda não tem acesso a este produto.' });
    }

    const product = products[0];
    if (!product.download_url) {
      return res.status(404).json({ error: 'Nenhum arquivo disponível para download.' });
    }

    res.redirect(product.download_url);
  } catch (error) {
    console.error('Erro ao liberar download:', error);
    res.status(500).json({ error: 'Erro ao liberar download.' });
  }
};

module.exports = { getAllPublic, getBySlug, getCategories, getAllCategories, getAllAdmin, create, update, remove, uploadImage, uploadDownload, getMyProducts, getDownload };
