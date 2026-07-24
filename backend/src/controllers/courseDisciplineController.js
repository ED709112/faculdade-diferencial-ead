const db = require('../config/database');

const getModulesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const [rows] = await db.query(
      `SELECT m.id, m.title, m.sort_order, m.description, m.period, m.workload, m.teacher_id,
              u.name as teacher_name
       FROM modules m
       LEFT JOIN users u ON m.teacher_id = u.id
       WHERE m.course_id = ?
       ORDER BY m.sort_order ASC`,
      [courseId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar módulos:', error);
    res.status(500).json({ error: 'Erro ao buscar módulos.' });
  }
};

const getCourseDisciplines = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { module_id } = req.query;
    let where = 'cd.course_id = ?';
    const params = [courseId];
    if (module_id) {
      where += ' AND cd.module_id = ?';
      params.push(module_id);
    }
    const [rows] = await db.query(
      `SELECT cd.id, cd.sort_order, cd.course_id, cd.discipline_id, cd.module_id,
              d.name as discipline_name, d.workload, d.titulacao, d.status as discipline_status,
              u.name as teacher_name, u.id as teacher_id,
              m.title as module_name,
              (SELECT COUNT(*) FROM discipline_materials dm WHERE dm.discipline_id = d.id) as materials_count
       FROM course_disciplines cd
       JOIN disciplines d ON cd.discipline_id = d.id
       JOIN users u ON d.teacher_id = u.id
       LEFT JOIN modules m ON cd.module_id = m.id
       WHERE ${where}
       ORDER BY cd.sort_order ASC, d.name ASC`,
      params
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar disciplinas do curso:', error);
    res.status(500).json({ error: 'Erro ao buscar disciplinas do curso.' });
  }
};

const getAllDisciplinesForAdmin = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.id, d.name, d.workload, d.titulacao, d.status,
              (SELECT COUNT(*) FROM discipline_materials dm WHERE dm.discipline_id = d.id) as materials_count
       FROM disciplines d
       ORDER BY d.name ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error);
    res.status(500).json({ error: 'Erro ao buscar disciplinas.' });
  }
};

const getUnlinkedDisciplines = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { module_id } = req.query;
    let excludeCondition = `cd.course_id = ?`;
    const params = [courseId];
    if (module_id) {
      excludeCondition += ' AND cd.module_id = ?';
      params.push(module_id);
    }
    const [rows] = await db.query(
      `SELECT d.id, d.name, d.workload, d.titulacao, d.status,
              u.name as teacher_name, u.id as teacher_id
       FROM disciplines d
       LEFT JOIN users u ON d.teacher_id = u.id
       WHERE d.id NOT IN (
         SELECT cd.discipline_id FROM course_disciplines cd WHERE ${excludeCondition}
       )
       AND d.status = 'active'
       ORDER BY d.name ASC`,
      params
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar disciplinas não vinculadas:', error);
    res.status(500).json({ error: 'Erro ao buscar disciplinas não vinculadas.' });
  }
};

const linkDiscipline = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { discipline_id, module_id, sort_order } = req.body;

    if (!discipline_id) return res.status(400).json({ error: 'discipline_id é obrigatório.' });
    if (!module_id) return res.status(400).json({ error: 'module_id é obrigatório. Selecione um módulo.' });

    const [existing] = await db.query(
      'SELECT id FROM course_disciplines WHERE course_id = ? AND discipline_id = ? AND module_id = ?',
      [courseId, discipline_id, module_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Esta disciplina já está vinculada a este módulo.' });
    }

    await db.query(
      'INSERT INTO course_disciplines (course_id, discipline_id, module_id, sort_order) VALUES (?, ?, ?, ?)',
      [courseId, discipline_id, module_id, sort_order || 0]
    );

    res.status(201).json({ message: 'Disciplina vinculada ao módulo com sucesso.' });
  } catch (error) {
    console.error('Erro ao vincular disciplina:', error);
    res.status(500).json({ error: 'Erro ao vincular disciplina.' });
  }
};

const unlinkDiscipline = async (req, res) => {
  try {
    const { courseId, disciplineId } = req.params;
    const { module_id } = req.query;
    let where = 'course_id = ? AND discipline_id = ?';
    const params = [courseId, disciplineId];
    if (module_id) {
      where += ' AND module_id = ?';
      params.push(module_id);
    }
    await db.query(`DELETE FROM course_disciplines WHERE ${where}`, params);
    res.json({ message: 'Disciplina desvinculada do módulo com sucesso.' });
  } catch (error) {
    console.error('Erro ao desvincular disciplina:', error);
    res.status(500).json({ error: 'Erro ao desvincular disciplina.' });
  }
};

const updateSortOrder = async (req, res) => {
  try {
    const { courseId, disciplineId } = req.params;
    const { sort_order } = req.body;
    await db.query(
      'UPDATE course_disciplines SET sort_order = ? WHERE course_id = ? AND discipline_id = ?',
      [sort_order || 0, courseId, disciplineId]
    );
    res.json({ message: 'Ordem atualizada com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar ordem:', error);
    res.status(500).json({ error: 'Erro ao atualizar ordem.' });
  }
};

const createDisciplineAdmin = async (req, res) => {
  try {
    const { name, workload } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome da disciplina é obrigatório.' });

    const [existing] = await db.query('SELECT id FROM disciplines WHERE name = ?', [name]);
    if (existing.length > 0) return res.status(400).json({ error: 'Já existe uma disciplina com este nome.' });

    const [result] = await db.query(
      'INSERT INTO disciplines (name, workload, status) VALUES (?, ?, ?)',
      [name, parseInt(workload) || 0, 'active']
    );

    const [discipline] = await db.query('SELECT * FROM disciplines WHERE id = ?', [result.insertId]);
    res.status(201).json(discipline[0]);
  } catch (error) {
    console.error('Erro ao criar disciplina:', error);
    res.status(500).json({ error: 'Erro ao criar disciplina.' });
  }
};

const updateDisciplineAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, workload, status } = req.body;

    const [existing] = await db.query('SELECT id FROM disciplines WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Disciplina não encontrada.' });

    const [duplicate] = await db.query('SELECT id FROM disciplines WHERE name = ? AND id != ?', [name, id]);
    if (duplicate.length > 0) return res.status(400).json({ error: 'Já existe outra disciplina com este nome.' });

    await db.query(
      'UPDATE disciplines SET name = ?, workload = ?, status = ? WHERE id = ?',
      [name, parseInt(workload) || 0, status || 'active', id]
    );

    const [discipline] = await db.query(
      `SELECT d.*, u.name as teacher_name FROM disciplines d LEFT JOIN users u ON d.teacher_id = u.id WHERE d.id = ?`,
      [id]
    );
    res.json(discipline[0]);
  } catch (error) {
    console.error('Erro ao atualizar disciplina:', error);
    res.status(500).json({ error: 'Erro ao atualizar disciplina.' });
  }
};

const deleteDisciplineAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT id, name FROM disciplines WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Disciplina não encontrada.' });

    const [linked] = await db.query(
      'SELECT COUNT(*) as count FROM course_disciplines WHERE discipline_id = ?', [id]
    );
    if (linked[0].count > 0) {
      return res.status(400).json({ error: 'Esta disciplina está vinculada a curso(s). Desvincule antes de excluir.' });
    }

    await db.query('DELETE FROM disciplines WHERE id = ?', [id]);
    res.json({ message: 'Disciplina removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover disciplina:', error);
    res.status(500).json({ error: 'Erro ao remover disciplina.' });
  }
};

module.exports = {
  getModulesByCourse,
  getCourseDisciplines,
  getAllDisciplinesForAdmin,
  getUnlinkedDisciplines,
  linkDiscipline,
  unlinkDiscipline,
  updateSortOrder,
  createDisciplineAdmin,
  updateDisciplineAdmin,
  deleteDisciplineAdmin,
};
