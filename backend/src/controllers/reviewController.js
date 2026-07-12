const db = require('../config/database');
const { paginate, paginateResult } = require('../utils/pagination');

const getByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM course_reviews WHERE course_id = ? AND is_visible = 1',
      [courseId]
    );
    const total = countResult[0].total;

    const { query, offset } = paginate(
      `SELECT r.id, r.rating, r.review, r.created_at, r.admin_response, r.admin_responded_at,
              u.id as user_id, u.name as user_name, u.avatar as user_avatar
       FROM course_reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.course_id = ? AND r.is_visible = 1
       ORDER BY r.created_at DESC`,
      page, limit
    );

    const [reviews] = await db.query(query, [courseId, limit, offset]);

    const [stats] = await db.query(
      `SELECT COUNT(*) as total_reviews,
              AVG(rating) as avg_rating,
              SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
              SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
              SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
              SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
              SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
       FROM course_reviews WHERE course_id = ? AND is_visible = 1`,
      [courseId]
    );

    res.json({
      stats: stats[0],
      data: reviews,
      pagination: paginateResult(total, page, limit)
    });
  } catch (error) {
    console.error('Erro ao listar avaliações:', error);
    res.status(500).json({ error: 'Erro ao listar avaliações.' });
  }
};

const create = async (req, res) => {
  try {
    const { course_id, rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Avaliação deve ser entre 1 e 5.' });
    }

    const [enrolled] = await db.query(
      'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND status IN (\'active\', \'completed\')',
      [req.user.id, course_id]
    );

    if (enrolled.length === 0) {
      return res.status(403).json({ error: 'Você precisa estar matriculado para avaliar este curso.' });
    }

    const [existing] = await db.query(
      'SELECT id FROM course_reviews WHERE user_id = ? AND course_id = ?',
      [req.user.id, course_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Você já avaliou este curso.' });
    }

    const [result] = await db.query(
      'INSERT INTO course_reviews (user_id, course_id, rating, review) VALUES (?, ?, ?, ?)',
      [req.user.id, course_id, rating, review || null]
    );

    await updateCourseRating(course_id);

    const [newReview] = await db.query(
      `SELECT r.*, u.name as user_name, u.avatar as user_avatar
       FROM course_reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newReview[0]);
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    res.status(500).json({ error: 'Erro ao criar avaliação.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;

    const [reviews] = await db.query(
      'SELECT id, user_id, course_id FROM course_reviews WHERE id = ?',
      [id]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada.' });
    }

    if (reviews[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar esta avaliação.' });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Avaliação deve ser entre 1 e 5.' });
    }

    const fields = [];
    const values = [];

    if (rating !== undefined) { fields.push('rating = ?'); values.push(rating); }
    if (review !== undefined) { fields.push('review = ?'); values.push(review); }

    if (fields.length > 0) {
      values.push(id);
      await db.query(`UPDATE course_reviews SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    if (rating !== undefined) {
      await updateCourseRating(reviews[0].course_id);
    }

    const [updated] = await db.query(
      `SELECT r.*, u.name as user_name, u.avatar as user_avatar
       FROM course_reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    res.status(500).json({ error: 'Erro ao atualizar avaliação.' });
  }
};

const delete_review = async (req, res) => {
  try {
    const { id } = req.params;

    const [reviews] = await db.query(
      'SELECT id, user_id, course_id FROM course_reviews WHERE id = ?',
      [id]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada.' });
    }

    if (reviews[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para remover esta avaliação.' });
    }

    await db.query('DELETE FROM course_reviews WHERE id = ?', [id]);

    await updateCourseRating(reviews[0].course_id);

    res.json({ message: 'Avaliação removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover avaliação:', error);
    res.status(500).json({ error: 'Erro ao remover avaliação.' });
  }
};

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { search, rating, course_id } = req.query;

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (r.review LIKE ? OR u.name LIKE ? OR c.title LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (rating) {
      where += ' AND r.rating = ?';
      params.push(rating);
    }

    if (course_id) {
      where += ' AND r.course_id = ?';
      params.push(course_id);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM course_reviews r
       JOIN users u ON r.user_id = u.id
       JOIN courses c ON r.course_id = c.id ${where}`,
      params
    );
    const total = countResult[0].total;

    const { query, offset } = paginate(
      `SELECT r.*, u.name as user_name, u.email as user_email, c.title as course_title
       FROM course_reviews r
       JOIN users u ON r.user_id = u.id
       JOIN courses c ON r.course_id = c.id
       ${where}
       ORDER BY r.created_at DESC`,
      page, limit
    );

    const [reviews] = await db.query(query, [...params, limit, offset]);

    res.json({
      data: reviews,
      pagination: paginateResult(total, page, limit)
    });
  } catch (error) {
    console.error('Erro ao listar avaliações:', error);
    res.status(500).json({ error: 'Erro ao listar avaliações.' });
  }
};

const respond = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response || response.trim().length === 0) {
      return res.status(400).json({ error: 'Resposta é obrigatória.' });
    }

    const [reviews] = await db.query(
      'SELECT id, course_id FROM course_reviews WHERE id = ?',
      [id]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada.' });
    }

    await db.query(
      'UPDATE course_reviews SET admin_response = ?, admin_responded_at = NOW() WHERE id = ?',
      [response, id]
    );

    const [updated] = await db.query(
      `SELECT r.*, u.name as user_name, u.avatar as user_avatar
       FROM course_reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao responder avaliação:', error);
    res.status(500).json({ error: 'Erro ao responder avaliação.' });
  }
};

async function updateCourseRating(courseId) {
  const [stats] = await db.query(
    `SELECT COUNT(*) as count, COALESCE(AVG(rating), 0) as avg
     FROM course_reviews WHERE course_id = ? AND is_visible = 1`,
    [courseId]
  );

  await db.query(
    'UPDATE courses SET rating_count = ?, rating_avg = ? WHERE id = ?',
    [stats[0].count, parseFloat(stats[0].avg).toFixed(2), courseId]
  );
}

module.exports = {
  getByCourse,
  create,
  update,
  delete: delete_review,
  getAll,
  respond
};
