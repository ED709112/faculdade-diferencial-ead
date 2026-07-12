const db = require('../config/database');
const { generateUniqueSlug } = require('../utils/slug');

const getAll = async (req, res) => {
  try {
    const [categories] = await db.query(
      `SELECT cat.*,
              (SELECT COUNT(*) FROM courses WHERE category_id = cat.id AND status = 'published') as course_count
       FROM categories cat
       WHERE cat.is_active = 1
       ORDER BY cat.sort_order ASC, cat.name ASC`
    );

    for (const category of categories) {
      if (category.parent_id) {
        const parent = categories.find(c => c.id === category.parent_id);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(category);
        }
      }
    }

    const rootCategories = categories.filter(c => !c.parent_id);

    res.json(rootCategories);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao listar categorias.' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [categories] = await db.query(
      `SELECT cat.*,
              (SELECT COUNT(*) FROM courses WHERE category_id = cat.id AND status = 'published') as course_count
       FROM categories cat WHERE cat.id = ?`,
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    const [children] = await db.query(
      `SELECT id, name, slug, description, icon, image, sort_order, is_active,
              (SELECT COUNT(*) FROM courses WHERE category_id = c.id AND status = 'published') as course_count
       FROM categories c WHERE parent_id = ? ORDER BY sort_order ASC`,
      [id]
    );
    categories[0].children = children;

    res.json(categories[0]);
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    res.status(500).json({ error: 'Erro ao buscar categoria.' });
  }
};

const create = async (req, res) => {
  try {
    const { name, description, icon, image, parent_id } = req.body;

    const slug = await generateUniqueSlug(name, async (s) => {
      const [existing] = await db.query('SELECT id FROM categories WHERE slug = ?', [s]);
      return existing.length > 0;
    });

    const [maxOrder] = await db.query('SELECT MAX(sort_order) as max_order FROM categories');
    const sortOrder = (maxOrder[0].max_order || 0) + 1;

    const [result] = await db.query(
      'INSERT INTO categories (name, slug, description, icon, image, parent_id, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, slug, description || null, icon || null, image || null, parent_id || null, sortOrder]
    );

    const [category] = await db.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);

    res.status(201).json(category[0]);
    console.log(`Categoria criada: "${name}"`);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro ao criar categoria.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, image, parent_id, is_active } = req.body;

    const [categories] = await db.query('SELECT id FROM categories WHERE id = ?', [id]);
    if (categories.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push('name = ?'); values.push(name);
      const slug = await generateUniqueSlug(name, async (s, excludeId) => {
        const [existing] = await db.query('SELECT id FROM categories WHERE slug = ? AND id != ?', [s, id]);
        return existing.length > 0;
      });
      fields.push('slug = ?'); values.push(slug);
    }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (icon !== undefined) { fields.push('icon = ?'); values.push(icon); }
    if (image !== undefined) { fields.push('image = ?'); values.push(image); }
    if (parent_id !== undefined) { fields.push('parent_id = ?'); values.push(parent_id || null); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }

    if (fields.length > 0) {
      values.push(id);
      await db.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    const [updated] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro ao atualizar categoria.' });
  }
};

const delete_category = async (req, res) => {
  try {
    const { id } = req.params;

    const [categories] = await db.query('SELECT id, name FROM categories WHERE id = ?', [id]);
    if (categories.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    await db.query('UPDATE courses SET category_id = NULL WHERE category_id = ?', [id]);
    await db.query('UPDATE categories SET parent_id = NULL WHERE parent_id = ?', [id]);
    await db.query('DELETE FROM categories WHERE id = ?', [id]);

    res.json({ message: `Categoria "${categories[0].name}" removida com sucesso.` });
  } catch (error) {
    console.error('Erro ao remover categoria:', error);
    res.status(500).json({ error: 'Erro ao remover categoria.' });
  }
};

const reorder = async (req, res) => {
  try {
    const { categories: orderedCategories } = req.body;

    if (!Array.isArray(orderedCategories)) {
      return res.status(400).json({ error: 'Lista de categorias inválida.' });
    }

    for (let i = 0; i < orderedCategories.length; i++) {
      await db.query(
        'UPDATE categories SET sort_order = ? WHERE id = ?',
        [i + 1, orderedCategories[i].id]
      );
    }

    res.json({ message: 'Categorias reordenadas com sucesso.' });
  } catch (error) {
    console.error('Erro ao reordenar categorias:', error);
    res.status(500).json({ error: 'Erro ao reordenar categorias.' });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: delete_category,
  reorder
};
