const db = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

const getMyDisciplines = async (req, res) => {
  try {
    const [disciplines] = await db.query(
      `SELECT d.*, 
              (SELECT COUNT(*) FROM discipline_materials dm WHERE dm.discipline_id = d.id) as materials_count
       FROM disciplines d
       WHERE d.teacher_id = ?
       ORDER BY d.created_at DESC`,
      [req.user.id]
    );
    res.json(disciplines);
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error);
    res.status(500).json({ error: 'Erro ao buscar disciplinas.' });
  }
};

const getDisciplineById = async (req, res) => {
  try {
    const { id } = req.params;
    const [disciplines] = await db.query(
      'SELECT * FROM disciplines WHERE id = ? AND teacher_id = ?',
      [id, req.user.id]
    );
    if (disciplines.length === 0) {
      return res.status(404).json({ error: 'Disciplina não encontrada.' });
    }
    res.json(disciplines[0]);
  } catch (error) {
    console.error('Erro ao buscar disciplina:', error);
    res.status(500).json({ error: 'Erro ao buscar disciplina.' });
  }
};

const createDiscipline = async (req, res) => {
  try {
    const {
      name, workload, titulacao, ementa, objetivo, conteudo_programatico,
      metodologia, metodologia_ensino, avaliacao, recursos_didaticos, referencias
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Nome da disciplina é obrigatório.' });

    const [result] = await db.query(
      `INSERT INTO disciplines (teacher_id, name, workload, titulacao, ementa, objetivo,
        conteudo_programatico, metodologia, metodologia_ensino, avaliacao, recursos_didaticos, referencias)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, workload || 0, titulacao, ementa, objetivo,
       conteudo_programatico, metodologia, metodologia_ensino, avaliacao, recursos_didaticos, referencias]
    );

    res.status(201).json({ message: 'Disciplina criada com sucesso.', id: result.insertId });
  } catch (error) {
    console.error('Erro ao criar disciplina:', error);
    res.status(500).json({ error: 'Erro ao criar disciplina.' });
  }
};

const updateDiscipline = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, workload, titulacao, ementa, objetivo, conteudo_programatico,
      metodologia, metodologia_ensino, avaliacao, recursos_didaticos, referencias, status
    } = req.body;

    const [existing] = await db.query('SELECT id FROM disciplines WHERE id = ? AND teacher_id = ?', [id, req.user.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Disciplina não encontrada.' });

    await db.query(
      `UPDATE disciplines SET name=?, workload=?, titulacao=?, ementa=?, objetivo=?,
        conteudo_programatico=?, metodologia=?, metodologia_ensino=?, avaliacao=?,
        recursos_didaticos=?, referencias=?, status=?
       WHERE id = ?`,
      [name, workload, titulacao, ementa, objetivo, conteudo_programatico,
       metodologia, metodologia_ensino, avaliacao, recursos_didaticos, referencias, status || 'active', id]
    );

    res.json({ message: 'Disciplina atualizada com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar disciplina:', error);
    res.status(500).json({ error: 'Erro ao atualizar disciplina.' });
  }
};

const deleteDiscipline = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT id FROM disciplines WHERE id = ? AND teacher_id = ?', [id, req.user.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Disciplina não encontrada.' });

    const [materials] = await db.query('SELECT file_url FROM discipline_materials WHERE discipline_id = ?', [id]);
    for (const mat of materials) {
      if (mat.file_url) {
        const filePath = path.join(__dirname, '..', '..', mat.file_url);
        try { await fs.unlink(filePath); } catch {}
      }
    }

    await db.query('DELETE FROM discipline_materials WHERE discipline_id = ?', [id]);
    await db.query('DELETE FROM disciplines WHERE id = ?', [id]);
    res.json({ message: 'Disciplina excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir disciplina:', error);
    res.status(500).json({ error: 'Erro ao excluir disciplina.' });
  }
};

const getMaterials = async (req, res) => {
  try {
    const { disciplineId } = req.params;
    const [discipline] = await db.query('SELECT id FROM disciplines WHERE id = ? AND teacher_id = ?', [disciplineId, req.user.id]);
    if (discipline.length === 0) return res.status(404).json({ error: 'Disciplina não encontrada.' });

    const [materials] = await db.query(
      'SELECT * FROM discipline_materials WHERE discipline_id = ? ORDER BY sort_order ASC, created_at DESC',
      [disciplineId]
    );
    res.json(materials);
  } catch (error) {
    console.error('Erro ao buscar materiais:', error);
    res.status(500).json({ error: 'Erro ao buscar materiais.' });
  }
};

const uploadMaterial = async (req, res) => {
  try {
    const { disciplineId } = req.params;
    const { title, description, material_type, external_url } = req.body;

    const [discipline] = await db.query('SELECT id FROM disciplines WHERE id = ? AND teacher_id = ?', [disciplineId, req.user.id]);
    if (discipline.length === 0) return res.status(404).json({ error: 'Disciplina não encontrada.' });

    if (!title) return res.status(400).json({ error: 'Título é obrigatório.' });

    let fileUrl = null;
    if (req.file) {
      fileUrl = `/uploads/discipline-materials/${req.file.filename}`;
    } else if (external_url) {
      fileUrl = external_url;
    } else if (material_type !== 'link') {
      return res.status(400).json({ error: 'Arquivo ou link é obrigatório.' });
    }

    const [result] = await db.query(
      'INSERT INTO discipline_materials (discipline_id, title, description, material_type, file_url, external_url) VALUES (?, ?, ?, ?, ?, ?)',
      [disciplineId, title, description, material_type || 'documento', fileUrl, material_type === 'link' ? external_url : null]
    );

    res.status(201).json({ message: 'Material adicionado com sucesso.', id: result.insertId });
  } catch (error) {
    console.error('Erro ao adicionar material:', error);
    res.status(500).json({ error: 'Erro ao adicionar material.' });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const { id, disciplineId } = req.params;
    const [discipline] = await db.query('SELECT id FROM disciplines WHERE id = ? AND teacher_id = ?', [disciplineId, req.user.id]);
    if (discipline.length === 0) return res.status(404).json({ error: 'Disciplina não encontrada.' });

    const [material] = await db.query(
      'SELECT * FROM discipline_materials WHERE id = ? AND discipline_id = ?',
      [id, disciplineId]
    );
    if (material.length === 0) return res.status(404).json({ error: 'Material não encontrado.' });

    if (material[0].file_url && !material[0].file_url.startsWith('http')) {
      const filePath = path.join(__dirname, '..', '..', material[0].file_url);
      try { await fs.unlink(filePath); } catch {}
    }

    await db.query('DELETE FROM discipline_materials WHERE id = ?', [id]);
    res.json({ message: 'Material excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir material:', error);
    res.status(500).json({ error: 'Erro ao excluir material.' });
  }
};

const studentGetDisciplines = async (req, res) => {
  try {
    const [disciplines] = await db.query(
      `SELECT d.id, d.name, d.workload, d.titulacao, d.status,
              u.name as teacher_name,
              (SELECT COUNT(*) FROM discipline_materials dm WHERE dm.discipline_id = d.id) as materials_count
       FROM disciplines d
       JOIN users u ON d.teacher_id = u.id
       JOIN course_disciplines cd ON cd.discipline_id = d.id
       JOIN enrollments e ON e.course_id = cd.course_id AND e.user_id = ?
       WHERE d.status = 'active'
       GROUP BY d.id
       ORDER BY d.name ASC`,
      [req.user.id]
    );
    res.json(disciplines);
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error);
    res.status(500).json({ error: 'Erro ao buscar disciplinas.' });
  }
};

const studentGetDisciplineById = async (req, res) => {
  try {
    const { id } = req.params;
    const [disciplines] = await db.query(
      `SELECT d.*, u.name as teacher_name
       FROM disciplines d
       JOIN users u ON d.teacher_id = u.id
       JOIN course_disciplines cd ON cd.discipline_id = d.id
       JOIN enrollments e ON e.course_id = cd.course_id AND e.user_id = ?
       WHERE d.id = ? AND d.status = 'active'`,
      [req.user.id, id]
    );
    if (disciplines.length === 0) {
      return res.status(404).json({ error: 'Disciplina não encontrada.' });
    }
    res.json(disciplines[0]);
  } catch (error) {
    console.error('Erro ao buscar disciplina:', error);
    res.status(500).json({ error: 'Erro ao buscar disciplina.' });
  }
};

const studentGetMaterials = async (req, res) => {
  try {
    const { disciplineId } = req.params;
    const [materials] = await db.query(
      `SELECT dm.id, dm.title, dm.description, dm.material_type, dm.file_url, dm.external_url, dm.created_at
       FROM discipline_materials dm
       JOIN disciplines d ON dm.discipline_id = d.id
       JOIN course_disciplines cd ON cd.discipline_id = d.id
       JOIN enrollments e ON e.course_id = cd.course_id AND e.user_id = ?
       WHERE dm.discipline_id = ? AND d.status = 'active'
       ORDER BY dm.sort_order ASC, dm.created_at DESC`,
      [req.user.id, disciplineId]
    );
    res.json(materials);
  } catch (error) {
    console.error('Erro ao buscar materiais:', error);
    res.status(500).json({ error: 'Erro ao buscar materiais.' });
  }
};

const studentGetCourseDisciplines = async (req, res) => {
  try {
    const { courseId } = req.params;
    const [disciplines] = await db.query(
      `SELECT d.id, d.name, d.workload, d.titulacao, d.ementa, d.objetivo,
              d.conteudo_programatico, d.metodologia, d.metodologia_ensino,
              d.avaliacao, d.recursos_didaticos, d.referencias,
              u.name as teacher_name,
              cd.module_id,
              m.title as module_name,
              (SELECT COUNT(*) FROM discipline_materials dm WHERE dm.discipline_id = d.id) as materials_count
       FROM disciplines d
       JOIN users u ON d.teacher_id = u.id
       JOIN course_disciplines cd ON cd.discipline_id = d.id
       LEFT JOIN modules m ON cd.module_id = m.id
       JOIN enrollments e ON e.course_id = cd.course_id AND e.user_id = ?
       WHERE cd.course_id = ? AND d.status = 'active'
       ORDER BY cd.sort_order ASC, d.name ASC`,
      [req.user.id, courseId]
    );

    for (const disc of disciplines) {
      const [materials] = await db.query(
        `SELECT dm.id, dm.title, dm.description, dm.material_type, dm.file_url, dm.external_url, dm.created_at
         FROM discipline_materials dm
         WHERE dm.discipline_id = ?
         ORDER BY dm.sort_order ASC, dm.created_at DESC`,
        [disc.id]
      );
      disc.materials = materials;
    }

    res.json(disciplines);
  } catch (error) {
    console.error('Erro ao buscar disciplinas do curso:', error);
    res.status(500).json({ error: 'Erro ao buscar disciplinas do curso.' });
  }
};

const studentGetModuleDiscipline = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const [disciplines] = await db.query(
      `SELECT d.id, d.name, d.workload, d.titulacao, d.ementa, d.objetivo,
              d.conteudo_programatico, d.metodologia, d.metodologia_ensino,
              d.avaliacao, d.recursos_didaticos, d.referencias,
              u.name as teacher_name,
              cd.module_id,
              m.title as module_name
       FROM disciplines d
       JOIN users u ON d.teacher_id = u.id
       JOIN course_disciplines cd ON cd.discipline_id = d.id
       LEFT JOIN modules m ON cd.module_id = m.id
       JOIN enrollments e ON e.course_id = cd.course_id AND e.user_id = ?
       WHERE cd.course_id = ? AND cd.module_id = ? AND d.status = 'active'
       ORDER BY cd.sort_order ASC, d.name ASC`,
      [req.user.id, courseId, moduleId]
    );

    for (const disc of disciplines) {
      const [materials] = await db.query(
        `SELECT dm.id, dm.title, dm.description, dm.material_type, dm.file_url, dm.external_url, dm.created_at
         FROM discipline_materials dm
         WHERE dm.discipline_id = ?
         ORDER BY dm.sort_order ASC, dm.created_at DESC`,
        [disc.id]
      );
      disc.materials = materials;
    }

    res.json(disciplines);
  } catch (error) {
    console.error('Erro ao buscar disciplina do módulo:', error);
    res.status(500).json({ error: 'Erro ao buscar disciplina do módulo.' });
  }
};

module.exports = {
  getMyDisciplines, getDisciplineById, createDiscipline, updateDiscipline,
  deleteDiscipline, getMaterials, uploadMaterial, deleteMaterial,
  studentGetDisciplines, studentGetDisciplineById, studentGetMaterials,
  studentGetCourseDisciplines, studentGetModuleDiscipline,
};
