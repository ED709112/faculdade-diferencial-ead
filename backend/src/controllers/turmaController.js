const db = require('../config/database');

const list = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*,
              c.title AS course_title,
              c.slug AS course_slug,
              p.name AS polo_name,
              p.city AS polo_city,
              u.name AS teacher_name,
              (SELECT COUNT(*) FROM enrollments e WHERE e.turma_id = t.id) AS students_count
       FROM turmas t
       JOIN courses c ON c.id = t.course_id
       LEFT JOIN polos p ON p.id = t.polo_id
       LEFT JOIN users u ON u.id = t.teacher_id
       ORDER BY t.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar turmas:', error);
    res.status(500).json({ error: 'Erro ao listar turmas.' });
  }
};

const listMine = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*,
              c.title AS course_title,
              c.slug AS course_slug,
              p.name AS polo_name,
              p.city AS polo_city,
              (SELECT COUNT(*) FROM enrollments e WHERE e.turma_id = t.id) AS students_count
       FROM turmas t
       JOIN courses c ON c.id = t.course_id
       LEFT JOIN polos p ON p.id = t.polo_id
       WHERE t.teacher_id = ?
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar turmas:', error);
    res.status(500).json({ error: 'Erro ao listar turmas.' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [turmas] = await db.query(
      `SELECT t.*,
              c.title AS course_title,
              c.slug AS course_slug,
              p.name AS polo_name,
              p.city AS polo_city,
              p.state AS polo_state,
              u.name AS teacher_name
       FROM turmas t
       JOIN courses c ON c.id = t.course_id
       LEFT JOIN polos p ON p.id = t.polo_id
       LEFT JOIN users u ON u.id = t.teacher_id
       WHERE t.id = ?`,
      [id]
    );
    if (turmas.length === 0) return res.status(404).json({ error: 'Turma não encontrada.' });
    res.json(turmas[0]);
  } catch (error) {
    console.error('Erro ao buscar turma:', error);
    res.status(500).json({ error: 'Erro ao buscar turma.' });
  }
};

const create = async (req, res) => {
  try {
    const {
      name, course_id, polo_id, teacher_id, period, shift,
      start_date, end_date, max_students, status
    } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: 'Nome da turma é obrigatório.' });
    if (!course_id) return res.status(400).json({ error: 'Curso é obrigatório.' });

    const [result] = await db.query(
      `INSERT INTO turmas (name, course_id, polo_id, teacher_id, period, shift, start_date, end_date, max_students, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), course_id, polo_id || null, teacher_id || null, period || null, shift || 'ead',
       start_date || null, end_date || null, max_students || null, status || 'active']
    );

    res.status(201).json({ message: 'Turma criada com sucesso.', id: result.insertId });
  } catch (error) {
    console.error('Erro ao criar turma:', error);
    res.status(500).json({ error: 'Erro ao criar turma.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, course_id, polo_id, teacher_id, period, shift,
      start_date, end_date, max_students, status
    } = req.body;

    const [existing] = await db.query('SELECT id FROM turmas WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Turma não encontrada.' });

    if (name !== undefined && !name.trim()) return res.status(400).json({ error: 'Nome da turma é obrigatório.' });

    await db.query(
      `UPDATE turmas SET name=?, course_id=?, polo_id=?, teacher_id=?, period=?, shift=?,
         start_date=?, end_date=?, max_students=?, status=?
       WHERE id = ?`,
      [name !== undefined ? name.trim() : existing[0].name, course_id, polo_id || null, teacher_id || null,
       period || null, shift || 'ead', start_date || null, end_date || null, max_students || null,
       status || 'active', id]
    );

    res.json({ message: 'Turma atualizada com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar turma:', error);
    res.status(500).json({ error: 'Erro ao atualizar turma.' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT id FROM turmas WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Turma não encontrada.' });

    await db.query('DELETE FROM turmas WHERE id = ?', [id]);
    res.json({ message: 'Turma excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir turma:', error);
    res.status(500).json({ error: 'Erro ao excluir turma.' });
  }
};

const getStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const [turma] = await db.query('SELECT id, max_students FROM turmas WHERE id = ?', [id]);
    if (turma.length === 0) return res.status(404).json({ error: 'Turma não encontrada.' });

    const [students] = await db.query(
      `SELECT u.id, u.name, u.email, u.avatar, u.is_active,
              e.id AS enrollment_id, e.status AS enrollment_status,
              e.progress_percentage, e.completed_at
       FROM enrollments e
       JOIN users u ON u.id = e.user_id
       WHERE e.turma_id = ?
       ORDER BY u.name ASC`,
      [id]
    );

    res.json({ turma: turma[0], students });
  } catch (error) {
    console.error('Erro ao listar alunos da turma:', error);
    res.status(500).json({ error: 'Erro ao listar alunos da turma.' });
  }
};

const getAvailableStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const [turmas] = await db.query('SELECT id, course_id, max_students FROM turmas WHERE id = ?', [id]);
    if (turmas.length === 0) return res.status(404).json({ error: 'Turma não encontrada.' });

    const courseId = turmas[0].course_id;

    const [students] = await db.query(
      `SELECT u.id, u.name, u.email, u.avatar,
              e.id AS enrollment_id, e.status AS enrollment_status
       FROM users u
       LEFT JOIN enrollments e ON e.user_id = u.id AND e.course_id = ?
       WHERE u.role = 'student'
         AND u.is_active = 1
         AND (e.id IS NULL OR e.turma_id IS NULL OR e.turma_id != ?)
       ORDER BY u.name ASC`,
      [courseId, id]
    );

    res.json(students);
  } catch (error) {
    console.error('Erro ao listar alunos disponíveis:', error);
    res.status(500).json({ error: 'Erro ao listar alunos disponíveis.' });
  }
};

const addStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) return res.status(400).json({ error: 'Aluno é obrigatório.' });

    const [turmas] = await db.query('SELECT id, course_id, max_students FROM turmas WHERE id = ?', [id]);
    if (turmas.length === 0) return res.status(404).json({ error: 'Turma não encontrada.' });
    const turma = turmas[0];

    const [students] = await db.query(
      `SELECT id, name FROM users WHERE id = ? AND role = 'student' AND is_active = 1`,
      [user_id]
    );
    if (students.length === 0) return res.status(400).json({ error: 'Aluno não encontrado.' });

    if (turma.max_students) {
      const [countRows] = await db.query('SELECT COUNT(*) AS cnt FROM enrollments WHERE turma_id = ?', [id]);
      if (countRows[0].cnt >= turma.max_students) {
        return res.status(400).json({ error: 'Turma atingiu o limite de vagas.' });
      }
    }

    const [enrollments] = await db.query(
      'SELECT id, status FROM enrollments WHERE user_id = ? AND course_id = ?',
      [user_id, turma.course_id]
    );

    if (enrollments.length > 0) {
      await db.query('UPDATE enrollments SET turma_id = ? WHERE id = ?', [id, enrollments[0].id]);
    } else {
      await db.query(
        'INSERT INTO enrollments (user_id, course_id, turma_id, status) VALUES (?, ?, ?, ?)',
        [user_id, turma.course_id, id, 'active']
      );
    }

    res.json({ message: 'Aluno adicionado à turma com sucesso.' });
  } catch (error) {
    console.error('Erro ao adicionar aluno à turma:', error);
    res.status(500).json({ error: 'Erro ao adicionar aluno à turma.' });
  }
};

const removeStudent = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const [turma] = await db.query('SELECT id FROM turmas WHERE id = ?', [id]);
    if (turma.length === 0) return res.status(404).json({ error: 'Turma não encontrada.' });

    const [enrollments] = await db.query(
      'SELECT id FROM enrollments WHERE turma_id = ? AND user_id = ?',
      [id, userId]
    );
    if (enrollments.length === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado nesta turma.' });
    }

    await db.query('UPDATE enrollments SET turma_id = NULL WHERE id = ?', [enrollments[0].id]);
    res.json({ message: 'Aluno removido da turma.' });
  } catch (error) {
    console.error('Erro ao remover aluno da turma:', error);
    res.status(500).json({ error: 'Erro ao remover aluno da turma.' });
  }
};

const getMineStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const [turmas] = await db.query('SELECT id, teacher_id, max_students FROM turmas WHERE id = ?', [id]);
    if (turmas.length === 0) return res.status(404).json({ error: 'Turma não encontrada.' });
    if (turmas[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão nesta turma.' });
    }

    const [students] = await db.query(
      `SELECT u.id, u.name, u.email, u.avatar, u.is_active,
              e.id AS enrollment_id, e.status AS enrollment_status,
              e.progress_percentage
       FROM enrollments e
       JOIN users u ON u.id = e.user_id
       WHERE e.turma_id = ?
       ORDER BY u.name ASC`,
      [id]
    );

    res.json({ turma: { id: turmas[0].id, max_students: turmas[0].max_students }, students });
  } catch (error) {
    console.error('Erro ao listar alunos da turma:', error);
    res.status(500).json({ error: 'Erro ao listar alunos da turma.' });
  }
};

module.exports = {
  list, listMine, getById, create, update, remove,
  getStudents, getAvailableStudents, addStudent, removeStudent, getMineStudents,
};
