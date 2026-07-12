const db = require('../config/database');

const searchCourses = async (req, res) => {
  try {
    const { q, category_id, is_free, price_min, price_max, sort } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Termo de busca é obrigatório.' });
    }

    const searchTerm = q.trim();
    const params = [];
    let where = "WHERE c.status = 'published'";
    let orderBy = 'c.rating_avg DESC, c.enrollment_count DESC';

    where += ' AND (c.title LIKE ? OR c.subtitle LIKE ? OR c.description LIKE ?)';
    const likeTerm = `%${searchTerm}%`;
    params.push(likeTerm, likeTerm, likeTerm);

    if (category_id) {
      where += ' AND c.category_id = ?';
      params.push(category_id);
    }

    if (is_free !== undefined) {
      where += ' AND c.is_free = ?';
      params.push(is_free === 'true' || is_free === '1' ? 1 : 0);
    }

    if (price_min !== undefined) {
      where += ' AND c.price >= ?';
      params.push(parseFloat(price_min));
    }

    if (price_max !== undefined) {
      where += ' AND c.price <= ?';
      params.push(parseFloat(price_max));
    }

    switch (sort) {
      case 'price_asc': orderBy = 'c.price ASC'; break;
      case 'price_desc': orderBy = 'c.price DESC'; break;
      case 'newest': orderBy = 'c.created_at DESC'; break;
      case 'rating': orderBy = 'c.rating_avg DESC'; break;
      case 'popular': orderBy = 'c.enrollment_count DESC'; break;
      default: orderBy = 'c.rating_avg DESC, c.enrollment_count DESC';
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM courses c ${where}`,
      params
    );
    const total = countResult[0].total;

    const offset = (page - 1) * limit;

    const [courses] = await db.query(
      `SELECT c.id, c.title, c.slug, c.subtitle, c.image, c.price, c.original_price,
              c.discount_price, c.is_free, c.workload, c.enrollment_count,
              c.rating_avg, c.rating_count, c.created_at,
              u.name as teacher_name, u.avatar as teacher_avatar,
              cat.name as category_name, cat.slug as category_slug
       FROM courses c
       LEFT JOIN users u ON c.teacher_id = u.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      query: searchTerm,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
      data: courses
    });
  } catch (error) {
    console.error('Erro na busca de cursos:', error);
    res.status(500).json({ error: 'Erro ao buscar cursos.' });
  }
};

const searchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const searchTerm = q.trim();
    const likeTerm = `%${searchTerm}%`;

    const [courses] = await db.query(
      `SELECT id, title, slug, image, price, is_free,
              (SELECT COUNT(*) FROM enrollments WHERE course_id = courses.id AND status = 'active') as enrollment_count
       FROM courses
       WHERE status = 'published' AND (title LIKE ? OR subtitle LIKE ?)
       ORDER BY enrollment_count DESC, rating_avg DESC
       LIMIT 8`,
      [likeTerm, likeTerm]
    );

    const [categories] = await db.query(
      `SELECT id, name, slug
       FROM categories
       WHERE is_active = 1 AND (name LIKE ? OR description LIKE ?)
       LIMIT 5`,
      [likeTerm, likeTerm]
    );

    const [tags] = await db.query(
      `SELECT DISTINCT tag
       FROM course_tags
       WHERE tag LIKE ?
       LIMIT 5`,
      [likeTerm]
    );

    res.json({
      courses,
      categories,
      tags: tags.map(t => t.tag)
    });
  } catch (error) {
    console.error('Erro nas sugestões de busca:', error);
    res.status(500).json({ error: 'Erro ao buscar sugestões.' });
  }
};

module.exports = {
  searchCourses,
  searchSuggestions
};
