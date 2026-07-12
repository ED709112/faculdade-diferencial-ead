const db = require('../config/database');
const { paginate, paginateResult } = require('../utils/pagination');
const { generateUniqueSlug } = require('../utils/slug');

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { search, category_id, teacher_id, status, is_free, featured } = req.query;

    let where = 'WHERE c.status = \'published\'';
    const params = [];

    if (search) {
      where += ' AND (c.title LIKE ? OR c.subtitle LIKE ? OR c.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category_id) {
      where += ' AND c.category_id = ?';
      params.push(category_id);
    }

    if (teacher_id) {
      where += ' AND c.teacher_id = ?';
      params.push(teacher_id);
    }

    if (status && req.user && (req.user.role === 'admin' || req.user.role === 'teacher')) {
      where = where.replace("c.status = 'published'", '1=1');
      where += ' AND c.status = ?';
      params.push(status);
    }

    if (is_free !== undefined) {
      where += ' AND c.is_free = ?';
      params.push(is_free === 'true' || is_free === '1' ? 1 : 0);
    }

    if (featured !== undefined && (!req.user || req.user.role === 'student')) {
      where += ' AND c.featured = ?';
      params.push(featured === 'true' || featured === '1' ? 1 : 0);
    }

    const countParams = [...params];
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM courses c ${where}`,
      countParams
    );
    const total = countResult[0].total;

    const { query, offset } = paginate(
      `SELECT c.id, c.title, c.slug, c.subtitle, c.image, c.price, c.original_price,
              c.discount_price, c.is_free, c.workload, c.enrollment_count,
              c.rating_avg, c.rating_count, c.featured, c.status,
              u.name as teacher_name, u.avatar as teacher_avatar,
              cat.name as category_name, cat.slug as category_slug,
              (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as modules_count,
              (SELECT COUNT(*) FROM lessons l
               JOIN modules m ON l.module_id = m.id
               WHERE m.course_id = c.id) as lessons_count
       FROM courses c
       LEFT JOIN users u ON c.teacher_id = u.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       ${where}
       ORDER BY c.featured DESC, c.created_at DESC`,
      page, limit
    );

    const [courses] = await db.query(query, [...params, limit, offset]);

    res.json({
      data: courses,
      pagination: paginateResult(total, page, limit)
    });
  } catch (error) {
    console.error('Erro ao listar cursos:', error);
    res.status(500).json({ error: 'Erro ao listar cursos.' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [courses] = await db.query(
      `SELECT c.*, u.name as teacher_name, u.avatar as teacher_avatar, u.bio as teacher_bio,
              cat.name as category_name, cat.slug as category_slug,
              (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as modules_count,
              (SELECT COUNT(*) FROM lessons l
               JOIN modules m ON l.module_id = m.id
               WHERE m.course_id = c.id) as lessons_count
       FROM courses c
       LEFT JOIN users u ON c.teacher_id = u.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.id = ?`,
      [id]
    );

    if (courses.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    if (courses[0].status !== 'published' && (!req.user || (req.user.role !== 'admin' && req.user.id !== courses[0].teacher_id))) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    const [tags] = await db.query('SELECT tag FROM course_tags WHERE course_id = ?', [id]);
    courses[0].tags = tags.map(t => t.tag);

    res.json(courses[0]);
  } catch (error) {
    console.error('Erro ao buscar curso:', error);
    res.status(500).json({ error: 'Erro ao buscar curso.' });
  }
};

const getBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const [courses] = await db.query(
      `SELECT c.*, u.name as teacher_name, u.avatar as teacher_avatar, u.bio as teacher_bio,
              cat.name as category_name, cat.slug as category_slug,
              (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as modules_count,
              (SELECT COUNT(*) FROM lessons l
               JOIN modules m ON l.module_id = m.id
               WHERE m.course_id = c.id) as lessons_count,
              (SELECT COUNT(*) FROM course_reviews WHERE course_id = c.id AND is_visible = 1) as review_count
       FROM courses c
       LEFT JOIN users u ON c.teacher_id = u.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.slug = ?`,
      [slug]
    );

    if (courses.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    const course = courses[0];

    if (course.status !== 'published' && (!req.user || (req.user.role !== 'admin' && req.user.id !== course.teacher_id))) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    const [tags] = await db.query('SELECT tag FROM course_tags WHERE course_id = ?', [course.id]);
    course.tags = tags.map(t => t.tag);

    const [modules] = await db.query(
      `SELECT m.id, m.title, m.description, m.sort_order, m.is_free,
              (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as lessons_count
       FROM modules m
       WHERE m.course_id = ?
       ORDER BY m.sort_order ASC`,
      [course.id]
    );

    for (const mod of modules) {
      const [lessons] = await db.query(
        `SELECT id, title, content_type, video_duration, is_free, is_preview, sort_order
         FROM lessons WHERE module_id = ? ORDER BY sort_order ASC`,
        [mod.id]
      );
      mod.lessons = lessons;
    }

    course.modules = modules;

    const [reviews] = await db.query(
      `SELECT r.rating, r.review, r.created_at,
              u.name as user_name, u.avatar as user_avatar
       FROM course_reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.course_id = ? AND r.is_visible = 1
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [course.id]
    );
    course.recent_reviews = reviews;

    res.json(course);
  } catch (error) {
    console.error('Erro ao buscar curso por slug:', error);
    res.status(500).json({ error: 'Erro ao buscar curso.' });
  }
};

const getFeatured = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const [courses] = await db.query(
      `SELECT c.id, c.title, c.slug, c.subtitle, c.image, c.price, c.original_price,
              c.discount_price, c.is_free, c.workload, c.enrollment_count,
              c.rating_avg, c.rating_count, c.featured,
              u.name as teacher_name, u.avatar as teacher_avatar,
              cat.name as category_name, cat.slug as category_slug
       FROM courses c
       LEFT JOIN users u ON c.teacher_id = u.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.status = 'published' AND c.featured = 1
       ORDER BY c.sort_order ASC, c.created_at DESC
       LIMIT ?`,
      [limit]
    );

    res.json(courses);
  } catch (error) {
    console.error('Erro ao buscar cursos em destaque:', error);
    res.status(500).json({ error: 'Erro ao buscar cursos em destaque.' });
  }
};

const getByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [categories] = await db.query('SELECT id, name FROM categories WHERE slug = ?', [slug]);
    if (categories.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM courses WHERE category_id = ? AND status = 'published'`,
      [categories[0].id]
    );
    const total = countResult[0].total;

    const { query, offset } = paginate(
      `SELECT c.id, c.title, c.slug, c.subtitle, c.image, c.price, c.original_price,
              c.discount_price, c.is_free, c.workload, c.enrollment_count,
              c.rating_avg, c.rating_count,
              u.name as teacher_name, u.avatar as teacher_avatar
       FROM courses c
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE c.category_id = ? AND c.status = 'published'
       ORDER BY c.created_at DESC`,
      page, limit
    );

    const [courses] = await db.query(query, [categories[0].id, limit, offset]);

    res.json({
      category: categories[0],
      data: courses,
      pagination: paginateResult(total, page, limit)
    });
  } catch (error) {
    console.error('Erro ao buscar cursos por categoria:', error);
    res.status(500).json({ error: 'Erro ao buscar cursos por categoria.' });
  }
};

const create = async (req, res) => {
  try {
    const {
      title, subtitle, description, content_program, price, original_price,
      discount_price, workload, workload_certificate, category_id, is_free,
      has_certificate, status, requirements, target_audience, what_you_learn,
      meta_title, meta_description, max_students, start_date, end_date, max_installments, tags
    } = req.body;

    const teacherId = req.user.role === 'admin' ? (req.body.teacher_id || req.user.id) : req.user.id;

    const slug = await generateUniqueSlug(title, async (s, excludeId) => {
      const [existing] = await db.query('SELECT id FROM courses WHERE slug = ? AND id != ?', [s, excludeId || 0]);
      return existing.length > 0;
    });

    const [result] = await db.query(
      `INSERT INTO courses (teacher_id, category_id, title, slug, subtitle, description,
        content_program, price, original_price, discount_price, workload,
        workload_certificate, is_free, has_certificate, status, requirements,
        target_audience, what_you_learn, meta_title, meta_description,
        max_students, start_date, end_date, max_installments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [teacherId, category_id || null, title, slug, subtitle || null, description || null,
        content_program || null, price || 0, original_price || null, discount_price || null,
        workload, workload_certificate || workload, is_free ? 1 : 0, has_certificate !== false ? 1 : 0,
        status || 'draft', requirements || null, target_audience || null, what_you_learn || null,
        meta_title || null, meta_description || null, max_students || null, start_date || null, end_date || null,
        max_installments || 1]
    );

    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        await db.query('INSERT INTO course_tags (course_id, tag) VALUES (?, ?)', [result.insertId, tag]);
      }
    }

    const [course] = await db.query('SELECT * FROM courses WHERE id = ?', [result.insertId]);

    res.status(201).json(course[0]);
    console.log(`Curso criado: "${title}" (ID: ${result.insertId}) por usuário ID ${req.user.id}`);
  } catch (error) {
    console.error('Erro ao criar curso:', error);
    res.status(500).json({ error: 'Erro ao criar curso.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;

    const [courses] = await db.query('SELECT * FROM courses WHERE id = ?', [id]);
    if (courses.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    const course = courses[0];

    if (req.user.role !== 'admin' && course.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar este curso.' });
    }

    const {
      title, subtitle, description, content_program, price, original_price,
      discount_price, workload, workload_certificate, category_id, is_free,
      has_certificate, status, image, video_presentation, requirements,
      target_audience, what_you_learn, meta_title, meta_description,
      max_students, start_date, end_date, max_installments, tags
    } = req.body;

    const fields = [];
    const values = [];

    if (title !== undefined) {
      fields.push('title = ?'); values.push(title);
      const newSlug = await generateUniqueSlug(title, async (s, excludeId) => {
        const [existing] = await db.query('SELECT id FROM courses WHERE slug = ? AND id != ?', [s, id]);
        return existing.length > 0;
      });
      fields.push('slug = ?'); values.push(newSlug);
    }
    if (subtitle !== undefined) { fields.push('subtitle = ?'); values.push(subtitle); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (content_program !== undefined) { fields.push('content_program = ?'); values.push(content_program); }
    if (price !== undefined) { fields.push('price = ?'); values.push(price); }
    if (original_price !== undefined) { fields.push('original_price = ?'); values.push(original_price); }
    if (discount_price !== undefined) { fields.push('discount_price = ?'); values.push(discount_price); }
    if (workload !== undefined) { fields.push('workload = ?'); values.push(workload); }
    if (workload_certificate !== undefined) { fields.push('workload_certificate = ?'); values.push(workload_certificate); }
    if (category_id !== undefined) { fields.push('category_id = ?'); values.push(category_id || null); }
    if (is_free !== undefined) { fields.push('is_free = ?'); values.push(is_free ? 1 : 0); }
    if (has_certificate !== undefined) { fields.push('has_certificate = ?'); values.push(has_certificate ? 1 : 0); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    if (image !== undefined) { fields.push('image = ?'); values.push(image); }
    if (video_presentation !== undefined) { fields.push('video_presentation = ?'); values.push(video_presentation); }
    if (requirements !== undefined) { fields.push('requirements = ?'); values.push(requirements); }
    if (target_audience !== undefined) { fields.push('target_audience = ?'); values.push(target_audience); }
    if (what_you_learn !== undefined) { fields.push('what_you_learn = ?'); values.push(what_you_learn); }
    if (meta_title !== undefined) { fields.push('meta_title = ?'); values.push(meta_title); }
    if (meta_description !== undefined) { fields.push('meta_description = ?'); values.push(meta_description); }
    if (max_students !== undefined) { fields.push('max_students = ?'); values.push(max_students); }
    if (start_date !== undefined) { fields.push('start_date = ?'); values.push(start_date); }
    if (end_date !== undefined) { fields.push('end_date = ?'); values.push(end_date); }
    if (max_installments !== undefined) { fields.push('max_installments = ?'); values.push(max_installments); }

    if (fields.length > 0) {
      values.push(id);
      await db.query(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    if (tags !== undefined && Array.isArray(tags)) {
      await db.query('DELETE FROM course_tags WHERE course_id = ?', [id]);
      for (const tag of tags) {
        await db.query('INSERT INTO course_tags (course_id, tag) VALUES (?, ?)', [id, tag]);
      }
    }

    const [updated] = await db.query('SELECT * FROM courses WHERE id = ?', [id]);

    res.json(updated[0]);
    console.log(`Curso atualizado: ID ${id} por usuário ID ${req.user.id}`);
  } catch (error) {
    console.error('Erro ao atualizar curso:', error);
    res.status(500).json({ error: 'Erro ao atualizar curso.' });
  }
};

const delete_course = async (req, res) => {
  try {
    const { id } = req.params;

    const [courses] = await db.query('SELECT id, title FROM courses WHERE id = ?', [id]);
    if (courses.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    await db.query('DELETE FROM courses WHERE id = ?', [id]);

    res.json({ message: `Curso "${courses[0].title}" removido com sucesso.` });
    console.log(`Curso removido: ID ${id} ("${courses[0].title}") por admin ID ${req.user.id}`);
  } catch (error) {
    console.error('Erro ao remover curso:', error);
    res.status(500).json({ error: 'Erro ao remover curso.' });
  }
};

const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const [courses] = await db.query('SELECT id, featured FROM courses WHERE id = ?', [id]);
    if (courses.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    const newFeatured = courses[0].featured ? 0 : 1;

    await db.query('UPDATE courses SET featured = ? WHERE id = ?', [newFeatured, id]);

    res.json({
      message: newFeatured ? 'Curso destacado com sucesso.' : 'Destaque removido.',
      featured: !!newFeatured
    });

    console.log(`Curso ${id} featured ${newFeatured ? 'ativado' : 'desativado'}`);
  } catch (error) {
    console.error('Erro ao alternar destaque do curso:', error);
    res.status(500).json({ error: 'Erro ao alterar destaque do curso.' });
  }
};

const getEnrolledStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [courses] = await db.query('SELECT id, teacher_id FROM courses WHERE id = ?', [id]);
    if (courses.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    if (req.user.role !== 'admin' && courses[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para ver alunos deste curso.' });
    }

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM enrollments WHERE course_id = ?',
      [id]
    );
    const total = countResult[0].total;

    const { query, offset } = paginate(
      `SELECT e.id, e.status, e.progress_percentage, e.started_at, e.completed_at,
              e.last_accessed_at, e.certificate_issued, e.final_grade,
              u.id as user_id, u.name as user_name, u.email as user_email, u.avatar as user_avatar
       FROM enrollments e
       JOIN users u ON e.user_id = u.id
       WHERE e.course_id = ?
       ORDER BY e.started_at DESC`,
      page, limit
    );

    const [students] = await db.query(query, [id, limit, offset]);

    res.json({
      data: students,
      pagination: paginateResult(total, page, limit)
    });
  } catch (error) {
    console.error('Erro ao listar alunos matriculados:', error);
    res.status(500).json({ error: 'Erro ao listar alunos matriculados.' });
  }
};

module.exports = {
  getAll,
  getById,
  getBySlug,
  getFeatured,
  getByCategory,
  create,
  update,
  delete: delete_course,
  toggleFeatured,
  getEnrolledStudents
};
