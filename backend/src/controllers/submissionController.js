const db = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

// =====================================================
// ALUNO - Enviar atividade
// =====================================================

const submitActivity = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { discipline_id, title, description } = req.body;

    if (!discipline_id || !title) {
      return res.status(400).json({ error: 'discipline_id e título são obrigatórios.' });
    }

    // Verify student is enrolled in a course linked to this discipline
    const [check] = await db.query(
      `SELECT 1 FROM course_disciplines cd
       JOIN enrollments e ON e.course_id = cd.course_id AND e.user_id = ?
       WHERE cd.discipline_id = ?`,
      [student_id, discipline_id]
    );
    if (check.length === 0) {
      return res.status(403).json({ error: 'Você não está matriculado em um curso com esta disciplina.' });
    }

    let file_url = null;
    if (req.file) {
      file_url = `/uploads/student-submissions/${req.file.filename}`;
    }

    const [result] = await db.query(
      `INSERT INTO activity_submissions (student_id, discipline_id, title, description, file_url)
       VALUES (?, ?, ?, ?, ?)`,
      [student_id, discipline_id, title, description || null, file_url]
    );

    res.status(201).json({ message: 'Atividade enviada com sucesso.', id: result.insertId });
  } catch (error) {
    console.error('Erro ao enviar atividade:', error);
    res.status(500).json({ error: 'Erro ao enviar atividade.' });
  }
};

const getMySubmissions = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { discipline_id } = req.query;

    let query = `
      SELECT asb.*, d.name as discipline_name, u.name as graded_by_name
      FROM activity_submissions asb
      JOIN disciplines d ON asb.discipline_id = d.id
      LEFT JOIN users u ON asb.graded_by = u.id
      WHERE asb.student_id = ?
    `;
    const params = [student_id];

    if (discipline_id) {
      query += ' AND asb.discipline_id = ?';
      params.push(discipline_id);
    }

    query += ' ORDER BY asb.created_at DESC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar submissões:', error);
    res.status(500).json({ error: 'Erro ao buscar submissões.' });
  }
};

const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const student_id = req.user.id;

    const [existing] = await db.query(
      'SELECT id, file_url, status FROM activity_submissions WHERE id = ? AND student_id = ?',
      [id, student_id]
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Submissão não encontrada.' });
    if (existing[0].status === 'graded') {
      return res.status(400).json({ error: 'Não é possível excluir atividade já corrigida.' });
    }

    if (existing[0].file_url && !existing[0].file_url.startsWith('http')) {
      const filePath = path.join(__dirname, '..', '..', existing[0].file_url);
      try { await fs.unlink(filePath); } catch {}
    }

    await db.query('DELETE FROM activity_submissions WHERE id = ?', [id]);
    res.json({ message: 'Submissão excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir submissão:', error);
    res.status(500).json({ error: 'Erro ao excluir submissão.' });
  }
};

// =====================================================
// PROFESSOR - Corrigir atividades
// =====================================================

const getTeacherSubmissions = async (req, res) => {
  try {
    const teacher_id = req.user.id;
    const { discipline_id, status } = req.query;

    let query = `
      SELECT asb.*, d.name as discipline_name, u.name as student_name, u.email as student_email
      FROM activity_submissions asb
      JOIN disciplines d ON asb.discipline_id = d.id
      JOIN users u ON asb.student_id = u.id
      WHERE d.teacher_id = ?
    `;
    const params = [teacher_id];

    if (discipline_id) {
      query += ' AND asb.discipline_id = ?';
      params.push(discipline_id);
    }
    if (status) {
      query += ' AND asb.status = ?';
      params.push(status);
    }

    query += ' ORDER BY asb.created_at DESC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar submissões do professor:', error);
    res.status(500).json({ error: 'Erro ao buscar submissões.' });
  }
};

const gradeSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, max_grade, feedback, status } = req.body;
    const graded_by = req.user.id;

    const [existing] = await db.query(
      `SELECT asb.id FROM activity_submissions asb
       JOIN disciplines d ON asb.discipline_id = d.id
       WHERE asb.id = ? AND d.teacher_id = ?`,
      [id, graded_by]
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Submissão não encontrada.' });

    await db.query(
      `UPDATE activity_submissions
       SET grade = ?, max_grade = ?, feedback = ?, status = ?, graded_by = ?, graded_at = NOW()
       WHERE id = ?`,
      [grade || null, max_grade || 10.00, feedback || null, status || 'graded', graded_by, id]
    );

    res.json({ message: 'Atividade corrigida com sucesso.' });
  } catch (error) {
    console.error('Erro ao corrigir atividade:', error);
    res.status(500).json({ error: 'Erro ao corrigir atividade.' });
  }
};

// =====================================================
// PROFESSOR - Diário de notas e faltas
// =====================================================

const getGradebook = async (req, res) => {
  try {
    const teacher_id = req.user.id;
    const { discipline_id, bimester } = req.query;

    if (!discipline_id) {
      return res.status(400).json({ error: 'discipline_id é obrigatório.' });
    }

    // Verify teacher owns this discipline
    const [discCheck] = await db.query(
      'SELECT id FROM disciplines WHERE id = ? AND teacher_id = ?',
      [discipline_id, teacher_id]
    );
    if (discCheck.length === 0) return res.status(403).json({ error: 'Disciplina não encontrada.' });

    // Get students enrolled in courses linked to this discipline
    const [students] = await db.query(
      `SELECT DISTINCT u.id, u.name, u.email
       FROM users u
       JOIN enrollments e ON e.user_id = u.id
       JOIN course_disciplines cd ON cd.course_id = e.course_id
       WHERE cd.discipline_id = ? AND u.role = 'student'
       ORDER BY u.name ASC`,
      [discipline_id]
    );

    // Get gradebook entries
    let gradeQuery = 'SELECT * FROM student_gradebook WHERE discipline_id = ?';
    const gradeParams = [discipline_id];
    if (bimester) {
      gradeQuery += ' AND bimester = ?';
      gradeParams.push(bimester);
    }
    const [grades] = await db.query(gradeQuery, gradeParams);

    // Get submission stats per student
    const [submissions] = await db.query(
      `SELECT student_id,
              COUNT(*) as total_submissions,
              SUM(CASE WHEN status = 'graded' THEN 1 ELSE 0 END) as graded_count,
              AVG(CASE WHEN status = 'graded' THEN grade END) as avg_grade
       FROM activity_submissions
       WHERE discipline_id = ?
       GROUP BY student_id`,
      [discipline_id]
    );

    const submissionsMap = {};
    submissions.forEach(s => { submissionsMap[s.student_id] = s; });

    const result = students.map(st => ({
      ...st,
      grades: grades.filter(g => g.student_id === st.id),
      submissions: submissionsMap[st.id] || { total_submissions: 0, graded_count: 0, avg_grade: null },
    }));

    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar diário:', error);
    res.status(500).json({ error: 'Erro ao buscar diário.' });
  }
};

const updateGradebook = async (req, res) => {
  try {
    const teacher_id = req.user.id;
    const { discipline_id, student_id, bimester, grade1, grade2, absences, observations } = req.body;

    if (!discipline_id || !student_id || !bimester) {
      return res.status(400).json({ error: 'discipline_id, student_id e bimester são obrigatórios.' });
    }

    // Verify teacher owns this discipline
    const [discCheck] = await db.query(
      'SELECT id FROM disciplines WHERE id = ? AND teacher_id = ?',
      [discipline_id, teacher_id]
    );
    if (discCheck.length === 0) return res.status(403).json({ error: 'Disciplina não encontrada.' });

    await db.query(
      `INSERT INTO student_gradebook (student_id, discipline_id, bimester, grade1, grade2, absences, observations, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         grade1 = VALUES(grade1), grade2 = VALUES(grade2),
         absences = VALUES(absences), observations = VALUES(observations),
         created_by = VALUES(created_by)`,
      [student_id, discipline_id, bimester, grade1 || null, grade2 || null, absences || 0, observations || null, teacher_id]
    );

    res.json({ message: 'Diário atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar diário:', error);
    res.status(500).json({ error: 'Erro ao atualizar diário.' });
  }
};

const updateGradebookBulk = async (req, res) => {
  try {
    const teacher_id = req.user.id;
    const { discipline_id, bimester, entries } = req.body;

    if (!discipline_id || !bimester || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'discipline_id, bimester e entries são obrigatórios.' });
    }

    const [discCheck] = await db.query(
      'SELECT id FROM disciplines WHERE id = ? AND teacher_id = ?',
      [discipline_id, teacher_id]
    );
    if (discCheck.length === 0) return res.status(403).json({ error: 'Disciplina não encontrada.' });

    for (const entry of entries) {
      if (!entry.student_id) continue;
      await db.query(
        `INSERT INTO student_gradebook (student_id, discipline_id, bimester, grade1, grade2, absences, observations, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           grade1 = VALUES(grade1), grade2 = VALUES(grade2),
           absences = VALUES(absences), observations = VALUES(observations),
           created_by = VALUES(created_by)`,
        [entry.student_id, discipline_id, bimester,
         entry.grade1 || null, entry.grade2 || null,
         entry.absences || 0, entry.observations || null, teacher_id]
      );
    }

    res.json({ message: 'Diário atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar diário em lote:', error);
    res.status(500).json({ error: 'Erro ao atualizar diário.' });
  }
};

module.exports = {
  submitActivity, getMySubmissions, deleteSubmission,
  getTeacherSubmissions, gradeSubmission,
  getGradebook, updateGradebook, updateGradebookBulk,
};
