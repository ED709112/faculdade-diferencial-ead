const db = require('../config/database');

const recalcCourseWorkload = async (courseId) => {
  const [result] = await db.query(
    'SELECT COALESCE(SUM(workload), 0) as total FROM modules WHERE course_id = ?',
    [courseId]
  );
  await db.query(
    'UPDATE courses SET workload = ? WHERE id = ?',
    [result[0].total, courseId]
  );
};

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
    const { course_id, title, description, period, workload, is_free } = req.body;

    const [courses] = await db.query('SELECT id, teacher_id FROM courses WHERE id = ?', [course_id]);
    if (courses.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    if (req.user.role !== 'admin' && courses[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para adicionar disciplinas neste curso.' });
    }

    const [maxOrder] = await db.query(
      'SELECT MAX(sort_order) as max_order FROM modules WHERE course_id = ?',
      [course_id]
    );
    const sortOrder = (maxOrder[0].max_order || 0) + 1;

    const [result] = await db.query(
      'INSERT INTO modules (course_id, title, description, period, workload, sort_order, is_free) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [course_id, title, description || null, period || null, parseInt(workload) || 0, sortOrder, is_free ? 1 : 0]
    );

    await recalcCourseWorkload(course_id);

    const [module] = await db.query('SELECT * FROM modules WHERE id = ?', [result.insertId]);
    const [course] = await db.query('SELECT workload FROM courses WHERE id = ?', [course_id]);

    res.status(201).json({ module: module[0], course_workload: course[0].workload });
    console.log(`Disciplina criada: "${title}" no curso ID ${course_id}`);
  } catch (error) {
    console.error('Erro ao criar disciplina:', error);
    res.status(500).json({ error: 'Erro ao criar disciplina.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, period, workload, is_free } = req.body;

    const [modules] = await db.query(
      `SELECT m.*, c.teacher_id FROM modules m JOIN courses c ON m.course_id = c.id WHERE m.id = ?`,
      [id]
    );

    if (modules.length === 0) {
      return res.status(404).json({ error: 'Disciplina não encontrada.' });
    }

    if (req.user.role !== 'admin' && modules[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar esta disciplina.' });
    }

    const fields = [];
    const values = [];

    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (period !== undefined) { fields.push('period = ?'); values.push(period || null); }
    if (workload !== undefined) { fields.push('workload = ?'); values.push(parseInt(workload) || 0); }
    if (is_free !== undefined) { fields.push('is_free = ?'); values.push(is_free ? 1 : 0); }

    if (fields.length > 0) {
      values.push(id);
      await db.query(`UPDATE modules SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    await recalcCourseWorkload(modules[0].course_id);

    const [updated] = await db.query('SELECT * FROM modules WHERE id = ?', [id]);
    const [course] = await db.query('SELECT workload FROM courses WHERE id = ?', [modules[0].course_id]);

    res.json({ module: updated[0], course_workload: course[0].workload });
  } catch (error) {
    console.error('Erro ao atualizar disciplina:', error);
    res.status(500).json({ error: 'Erro ao atualizar disciplina.' });
  }
};

const delete_module = async (req, res) => {
  try {
    const { id } = req.params;

    const [modules] = await db.query(
      `SELECT m.id, m.title, m.course_id, c.teacher_id FROM modules m JOIN courses c ON m.course_id = c.id WHERE m.id = ?`,
      [id]
    );

    if (modules.length === 0) {
      return res.status(404).json({ error: 'Disciplina não encontrada.' });
    }

    if (req.user.role !== 'admin' && modules[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para remover esta disciplina.' });
    }

    const courseId = modules[0].course_id;
    await db.query('DELETE FROM modules WHERE id = ?', [id]);

    await recalcCourseWorkload(courseId);

    const [course] = await db.query('SELECT workload FROM courses WHERE id = ?', [courseId]);

    res.json({ message: 'Disciplina removida com sucesso.', course_workload: course[0].workload });
  } catch (error) {
    console.error('Erro ao remover disciplina:', error);
    res.status(500).json({ error: 'Erro ao remover disciplina.' });
  }
};

const reorder = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { modules: orderedModules } = req.body;

    if (!Array.isArray(orderedModules)) {
      return res.status(400).json({ error: 'Lista de disciplinas inválida.' });
    }

    const [courses] = await db.query('SELECT id, teacher_id FROM courses WHERE id = ?', [courseId]);
    if (courses.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    if (req.user.role !== 'admin' && courses[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para reordenar disciplinas.' });
    }

    for (let i = 0; i < orderedModules.length; i++) {
      await db.query(
        'UPDATE modules SET sort_order = ? WHERE id = ? AND course_id = ?',
        [i + 1, orderedModules[i].id, courseId]
      );
    }

    res.json({ message: 'Disciplinas reordenadas com sucesso.' });
  } catch (error) {
    console.error('Erro ao reordenar disciplinas:', error);
    res.status(500).json({ error: 'Erro ao reordenar disciplinas.' });
  }
};

module.exports = {
  getByCourse,
  create,
  update,
  delete: delete_module,
  reorder
};
