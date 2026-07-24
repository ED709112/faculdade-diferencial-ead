const db = require('../config/database');

const getByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const [course] = await db.query('SELECT id, teacher_id FROM courses WHERE id = ?', [courseId]);
    if (course.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    const [modules] = await db.query(
      `SELECT m.*,
              (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as lessons_count,
              (SELECT SUM(video_duration) FROM lessons WHERE module_id = m.id) as total_video_duration
       FROM modules m
       WHERE m.course_id = ?
       ORDER BY m.sort_order ASC`,
      [courseId]
    );

    for (const mod of modules) {
      const [lessons] = await db.query(
        `SELECT id, title, content_type, video_url, video_duration, sort_order, is_free, is_preview
         FROM lessons WHERE module_id = ? ORDER BY sort_order ASC`,
        [mod.id]
      );
      mod.lessons = lessons;
    }

    res.json(modules);
  } catch (error) {
    console.error('Erro ao listar módulos:', error);
    res.status(500).json({ error: 'Erro ao listar módulos.' });
  }
};

const create = async (req, res) => {
  try {
    const { course_id, title, description, period, is_free } = req.body;

    const [courses] = await db.query('SELECT id, teacher_id FROM courses WHERE id = ?', [course_id]);
    if (courses.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    if (req.user.role !== 'admin' && courses[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para adicionar módulos neste curso.' });
    }

    const [maxOrder] = await db.query(
      'SELECT MAX(sort_order) as max_order FROM modules WHERE course_id = ?',
      [course_id]
    );
    const sortOrder = (maxOrder[0].max_order || 0) + 1;

    const [result] = await db.query(
      'INSERT INTO modules (course_id, title, description, period, sort_order, is_free) VALUES (?, ?, ?, ?, ?, ?)',
      [course_id, title, description || null, period || null, sortOrder, is_free ? 1 : 0]
    );

    const [module] = await db.query('SELECT * FROM modules WHERE id = ?', [result.insertId]);

    res.status(201).json(module[0]);
    console.log(`Módulo criado: "${title}" no curso ID ${course_id}`);
  } catch (error) {
    console.error('Erro ao criar módulo:', error);
    res.status(500).json({ error: 'Erro ao criar módulo.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, period, is_free } = req.body;

    const [modules] = await db.query(
      `SELECT m.*, c.teacher_id FROM modules m JOIN courses c ON m.course_id = c.id WHERE m.id = ?`,
      [id]
    );

    if (modules.length === 0) {
      return res.status(404).json({ error: 'Módulo não encontrado.' });
    }

    if (req.user.role !== 'admin' && modules[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar este módulo.' });
    }

    const fields = [];
    const values = [];

    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (period !== undefined) { fields.push('period = ?'); values.push(period || null); }
    if (is_free !== undefined) { fields.push('is_free = ?'); values.push(is_free ? 1 : 0); }

    if (fields.length > 0) {
      values.push(id);
      await db.query(`UPDATE modules SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    const [updated] = await db.query('SELECT * FROM modules WHERE id = ?', [id]);

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar módulo:', error);
    res.status(500).json({ error: 'Erro ao atualizar módulo.' });
  }
};

const delete_module = async (req, res) => {
  try {
    const { id } = req.params;

    const [modules] = await db.query(
      `SELECT m.id, m.title, c.teacher_id FROM modules m JOIN courses c ON m.course_id = c.id WHERE m.id = ?`,
      [id]
    );

    if (modules.length === 0) {
      return res.status(404).json({ error: 'Módulo não encontrado.' });
    }

    if (req.user.role !== 'admin' && modules[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para remover este módulo.' });
    }

    await db.query('DELETE FROM modules WHERE id = ?', [id]);

    res.json({ message: 'Módulo removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover módulo:', error);
    res.status(500).json({ error: 'Erro ao remover módulo.' });
  }
};

const reorder = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { modules: orderedModules } = req.body;

    if (!Array.isArray(orderedModules)) {
      return res.status(400).json({ error: 'Lista de módulos inválida.' });
    }

    const [courses] = await db.query('SELECT id, teacher_id FROM courses WHERE id = ?', [courseId]);
    if (courses.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    if (req.user.role !== 'admin' && courses[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para reordenar módulos.' });
    }

    for (let i = 0; i < orderedModules.length; i++) {
      await db.query(
        'UPDATE modules SET sort_order = ? WHERE id = ? AND course_id = ?',
        [i + 1, orderedModules[i].id, courseId]
      );
    }

    res.json({ message: 'Módulos reordenados com sucesso.' });
  } catch (error) {
    console.error('Erro ao reordenar módulos:', error);
    res.status(500).json({ error: 'Erro ao reordenar módulos.' });
  }
};

module.exports = {
  getByCourse,
  create,
  update,
  delete: delete_module,
  reorder
};
