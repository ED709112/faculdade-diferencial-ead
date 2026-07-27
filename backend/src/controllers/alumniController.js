const db = require('../config/database');

// ==================== PÚBLICO ====================

exports.listPublic = async (req, res) => {
  try {
    const { course, year } = req.query;
    let sql = `SELECT id, full_name, course, completion_year, company_name, job_title, city, state, photo_url, bio, linkedin_url, is_featured
               FROM alumni WHERE status = 'active'`;
    const params = [];
    if (course) { sql += ' AND course = ?'; params.push(course); }
    if (year) { sql += ' AND completion_year = ?'; params.push(parseInt(year)); }
    sql += ' ORDER BY is_featured DESC, full_name ASC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar egressos:', error);
    res.status(500).json({ error: 'Erro ao listar egressos.' });
  }
};

exports.getPublicById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, course, completion_year, company_name, job_title, city, state, photo_url, bio, linkedin_url
       FROM alumni WHERE id = ? AND status = 'active'`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Egresso não encontrado.' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar egresso:', error);
    res.status(500).json({ error: 'Erro ao buscar egresso.' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [total] = await db.query('SELECT COUNT(*) as total FROM alumni WHERE status = ?', ['active']);
    const [courses] = await db.query('SELECT course, COUNT(*) as count FROM alumni WHERE status = ? GROUP BY course ORDER BY count DESC', ['active']);
    const [years] = await db.query('SELECT completion_year, COUNT(*) as count FROM alumni WHERE status = ? AND completion_year IS NOT NULL GROUP BY completion_year ORDER BY completion_year DESC LIMIT 10', ['active']);
    const [cities] = await db.query('SELECT city, COUNT(*) as count FROM alumni WHERE status = ? AND city IS NOT NULL GROUP BY city ORDER BY count DESC LIMIT 10', ['active']);
    res.json({
      total: total[0].total,
      by_course: courses,
      by_year: years,
      by_city: cities,
    });
  } catch (error) {
    console.error('Erro ao buscar stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT course FROM alumni WHERE status = ? AND course IS NOT NULL ORDER BY course', ['active']);
    res.json(rows.map(r => r.course));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cursos.' });
  }
};

// ==================== DEPOIMENTOS PÚBLICOS ====================

exports.listTestimonialsPublic = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.id, t.title, t.content, t.rating, t.photo_url, t.video_url, t.created_at,
              a.full_name, a.course, a.completion_year, a.photo_url as alumni_photo
       FROM alumni_testimonials t
       JOIN alumni a ON t.alumni_id = a.id
       WHERE t.is_active = 1 AND a.status = 'active'
       ORDER BY t.sort_order ASC, t.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar depoimentos:', error);
    res.status(500).json({ error: 'Erro ao listar depoimentos.' });
  }
};

// ==================== EVENTOS PÚBLICOS ====================

exports.listEventsPublic = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, title, description, event_date, location, image_url, max_participants
       FROM alumni_events WHERE is_active = 1 AND event_date >= NOW()
       ORDER BY event_date ASC LIMIT 5`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar eventos.' });
  }
};

// ==================== ADMIN CRUD ====================

exports.adminList = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, (SELECT COUNT(*) FROM alumni_testimonials t WHERE t.alumni_id = a.id) as testimonials_count
       FROM alumni a ORDER BY a.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar egressos.' });
  }
};

exports.adminGet = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM alumni WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Egresso não encontrado.' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar egresso.' });
  }
};

exports.adminCreate = async (req, res) => {
  try {
    const { full_name, email, phone, cpf, course, completion_year, registration_number, company_name, job_title, city, state, bio, linkedin_url, is_featured, status } = req.body;
    if (!full_name || !email) return res.status(400).json({ error: 'Nome e email são obrigatórios.' });

    const photo_url = req.file ? `/uploads/alumni/${req.file.filename}` : null;

    const [result] = await db.query(
      `INSERT INTO alumni (full_name, email, phone, cpf, course, completion_year, registration_number, company_name, job_title, city, state, photo_url, bio, linkedin_url, is_featured, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, email, phone || null, cpf || null, course || null, completion_year || null, registration_number || null, company_name || null, job_title || null, city || null, state || null, photo_url, bio || null, linkedin_url || null, is_featured ? 1 : 0, status || 'active']
    );

    const [rows] = await db.query('SELECT * FROM alumni WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar egresso:', error);
    res.status(500).json({ error: 'Erro ao criar egresso.' });
  }
};

exports.adminUpdate = async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM alumni WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Egresso não encontrado.' });

    const { full_name, email, phone, cpf, course, completion_year, registration_number, company_name, job_title, city, state, bio, linkedin_url, is_featured, status } = req.body;

    let photo_url = existing[0].photo_url;
    if (req.file) {
      photo_url = `/uploads/alumni/${req.file.filename}`;
    }

    await db.query(
      `UPDATE alumni SET full_name=?, email=?, phone=?, cpf=?, course=?, completion_year=?, registration_number=?, company_name=?, job_title=?, city=?, state=?, photo_url=?, bio=?, linkedin_url=?, is_featured=?, status=? WHERE id=?`,
      [full_name, email, phone || null, cpf || null, course || null, completion_year || null, registration_number || null, company_name || null, job_title || null, city || null, state || null, photo_url, bio || null, linkedin_url || null, is_featured ? 1 : 0, status || 'active', req.params.id]
    );

    const [rows] = await db.query('SELECT * FROM alumni WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar egresso:', error);
    res.status(500).json({ error: 'Erro ao atualizar egresso.' });
  }
};

exports.adminDelete = async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM alumni WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Egresso não encontrado.' });
    await db.query('DELETE FROM alumni WHERE id = ?', [req.params.id]);
    res.json({ message: 'Egresso removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover egresso.' });
  }
};

// ==================== ADMIN DEPOIMENTOS ====================

exports.adminListTestimonials = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, a.full_name as alumni_name, a.course as alumni_course
       FROM alumni_testimonials t LEFT JOIN alumni a ON t.alumni_id = a.id
       ORDER BY t.sort_order ASC, t.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar depoimentos.' });
  }
};

exports.adminCreateTestimonial = async (req, res) => {
  try {
    const { alumni_id, title, content, rating, video_url, sort_order } = req.body;
    if (!alumni_id || !content) return res.status(400).json({ error: 'Egresso e conteúdo são obrigatórios.' });

    const photo_url = req.file ? `/uploads/alumni/${req.file.filename}` : null;

    const [result] = await db.query(
      'INSERT INTO alumni_testimonials (alumni_id, title, content, rating, photo_url, video_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [alumni_id, title || null, content, rating || 5, photo_url, video_url || null, sort_order || 0]
    );
    const [rows] = await db.query('SELECT * FROM alumni_testimonials WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar depoimento:', error);
    res.status(500).json({ error: 'Erro ao criar depoimento.' });
  }
};

exports.adminUpdateTestimonial = async (req, res) => {
  try {
    const { title, content, rating, video_url, is_active, sort_order } = req.body;
    let photo_url;
    if (req.file) {
      photo_url = `/uploads/alumni/${req.file.filename}`;
    }
    const fields = [];
    const values = [];
    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (content !== undefined) { fields.push('content = ?'); values.push(content); }
    if (rating !== undefined) { fields.push('rating = ?'); values.push(rating); }
    if (video_url !== undefined) { fields.push('video_url = ?'); values.push(video_url); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); values.push(sort_order); }
    if (photo_url) { fields.push('photo_url = ?'); values.push(photo_url); }
    if (!fields.length) return res.status(400).json({ error: 'Nenhum dado para atualizar.' });
    values.push(req.params.id);
    await db.query(`UPDATE alumni_testimonials SET ${fields.join(', ')} WHERE id = ?`, values);
    const [rows] = await db.query('SELECT * FROM alumni_testimonials WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar depoimento.' });
  }
};

exports.adminDeleteTestimonial = async (req, res) => {
  try {
    await db.query('DELETE FROM alumni_testimonials WHERE id = ?', [req.params.id]);
    res.json({ message: 'Depoimento removido.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover depoimento.' });
  }
};

// ==================== ADMIN EVENTOS ====================

exports.adminListEvents = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM alumni_events ORDER BY event_date DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar eventos.' });
  }
};

exports.adminCreateEvent = async (req, res) => {
  try {
    const { title, description, event_date, location, max_participants } = req.body;
    if (!title || !event_date) return res.status(400).json({ error: 'Título e data são obrigatórios.' });
    const image_url = req.file ? `/uploads/alumni/${req.file.filename}` : null;
    const [result] = await db.query(
      'INSERT INTO alumni_events (title, description, event_date, location, image_url, max_participants) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description || null, event_date, location || null, image_url, max_participants || null]
    );
    const [rows] = await db.query('SELECT * FROM alumni_events WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar evento.' });
  }
};

exports.adminUpdateEvent = async (req, res) => {
  try {
    const { title, description, event_date, location, max_participants, is_active } = req.body;
    const fields = [];
    const values = [];
    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (event_date !== undefined) { fields.push('event_date = ?'); values.push(event_date); }
    if (location !== undefined) { fields.push('location = ?'); values.push(location); }
    if (max_participants !== undefined) { fields.push('max_participants = ?'); values.push(max_participants); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (req.file) { fields.push('image_url = ?'); values.push(`/uploads/alumni/${req.file.filename}`); }
    if (!fields.length) return res.status(400).json({ error: 'Nenhum dado para atualizar.' });
    values.push(req.params.id);
    await db.query(`UPDATE alumni_events SET ${fields.join(', ')} WHERE id = ?`, values);
    const [rows] = await db.query('SELECT * FROM alumni_events WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar evento.' });
  }
};

exports.adminDeleteEvent = async (req, res) => {
  try {
    await db.query('DELETE FROM alumni_events WHERE id = ?', [req.params.id]);
    res.json({ message: 'Evento removido.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover evento.' });
  }
};
